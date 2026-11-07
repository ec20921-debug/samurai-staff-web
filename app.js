// =============================================================
// SAMURAI MOTORS スタッフ名鑑（試作版）
// - 画面: ホーム / スタッフ一覧 / 個人カルテ / 編集 / 誕生日カレンダー / データと設定
// - 保存先: store.js が切り替える（本番=Supabase＋ログイン＋RLS／デモ=このブラウザの localStorage）
// - 現場スタッフの画面（休暇申請）は staff.js
// =============================================================
(function () {
  'use strict';

  const STORE_KEY = 'smStaff.v1';
  const AUTH_KEY = 'smStaff.auth';

  // 選択肢（増やすときはここに足す）
  const ROLES = ['リーダー', 'スタッフ', '事務・受付', 'マネージャー'];
  const EMPLOYMENTS = ['正社員', '試用期間', 'パート', '業務委託'];
  const STATUSES = ['在籍', '休職', '退職'];
  const GENDERS = ['男性', '女性', 'その他'];
  const SKILLS = ['WASH', 'GLASS', 'HEADLIGHT', 'POLISH', 'DEEP POLISH', 'バイク運転', '英語で接客', '予約受付', '写真・動画撮影'];
  const PROVINCES = ['Phnom Penh', 'Kandal', 'Kampong Cham', 'Tbong Khmum', 'Takeo', 'Prey Veng', 'Svay Rieng', 'Kampong Speu',
    'Kampong Chhnang', 'Kampong Thom', 'Kampot', 'Kep', 'Sihanoukville', 'Koh Kong', 'Siem Reap', 'Battambang', 'Banteay Meanchey',
    'Pursat', 'Pailin', 'Oddar Meanchey', 'Preah Vihear', 'Stung Treng', 'Kratie', 'Mondulkiri', 'Ratanakiri', '国外', 'その他'];
  const LANGS = [['km', 'クメール語'], ['en', '英語'], ['ja', '日本語']];
  const LANG_LV = ['—', 'あいさつ程度', '日常会話', 'ネイティブ・仕事で使える'];

  // ---------- 小道具 ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const todayYMD = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };

  function parseYMD(s) {
    if (!s) return null;
    const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(s);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : 1);
  }
  function fmtDate(s) {
    const d = parseYMD(s);
    if (!d) return s ? esc(s) : '—'; // 読み込んだデータの不正な値もそのまま HTML に入れない
    return s.length <= 7 ? `${d.getFullYear()}年${d.getMonth() + 1}月` : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }
  function age(birthday) {
    const b = parseYMD(birthday); if (!b) return null;
    const t = todayYMD();
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  }
  // 次の誕生日までの日数（今日なら 0）
  function daysToBirthday(birthday) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday || '')) return null; // 年月日がそろっているときだけ
    const b = parseYMD(birthday); if (!b) return null;
    const t = todayYMD();
    let next = new Date(t.getFullYear(), b.getMonth(), b.getDate());
    if (next < t) next = new Date(t.getFullYear() + 1, b.getMonth(), b.getDate());
    return Math.round((next - t) / 86400000);
  }
  // 年齢の表示（年だけ分かっているときは「約」をつける）
  function ageText(bd) {
    if (/^\d{4}$/.test(bd || '')) return `約${todayYMD().getFullYear() - +bd}歳`;
    const a = age(bd); return a == null ? '年齢未確認' : `${a}歳`;
  }
  function bdText(bd) {
    if (/^\d{4}$/.test(bd || '')) return `${bd}年生まれ`;
    if (/^\d{4}-\d{2}$/.test(bd || '')) return `${bd.slice(0, 4)}年${+bd.slice(5)}月生まれ`;
    return bd ? fmtDate(bd) : '誕生日未確認';
  }
  // スタッフ本人と家族の誕生日を1つの一覧にする（年月日がそろっている人だけ）
  function birthdayEvents(people) {
    const ev = [];
    people.forEach((p) => {
      if (daysToBirthday(p.birthday) != null) ev.push({ p, who: '', bd: p.birthday, likes: p.likes });
      (p.familyMembers || []).forEach((f) => {
        if (daysToBirthday(f.birthday) != null) ev.push({ p, who: `の${f.relation || '家族'}${f.name ? `（${f.name}）` : ''}`, bd: f.birthday, likes: f.note });
      });
    });
    return ev;
  }
  // 勤続（◯年◯か月）
  function tenure(joinDate) {
    const j = parseYMD(joinDate); if (!j) return '—';
    const t = todayYMD();
    let months = (t.getFullYear() - j.getFullYear()) * 12 + (t.getMonth() - j.getMonth());
    if (t.getDate() < j.getDate()) months--;
    if (months < 0) return '入社前';
    if (months === 0) { const d = Math.round((t - j) / 86400000); return `${d + 1}日目`; }
    const y = Math.floor(months / 12), m = months % 12;
    return (y ? `${y}年` : '') + (m ? `${m}か月` : (y ? '' : '0か月'));
  }
  function tenureMonths(joinDate) {
    const j = parseYMD(joinDate); if (!j) return 0;
    const t = todayYMD();
    return Math.max(0, (t.getFullYear() - j.getFullYear()) * 12 + (t.getMonth() - j.getMonth()));
  }
  function initials(p) {
    const n = (p.nameEn || p.nickname || '?').trim().split(/\s+/);
    return ((n[0] || '')[0] || '?').toUpperCase() + ((n[1] || '')[0] || '').toUpperCase();
  }
  function avatar(p, cls) {
    return `<span class="avatar ${cls}">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(initials(p))}</span>`;
  }
  function statusBadge(s) {
    if (s === '在籍') return '<span class="badge badge-ok">在籍</span>';
    if (s === '休職') return '<span class="badge badge-warn">休職</span>';
    return `<span class="badge badge-mute">${esc(s || '—')}</span>`;
  }
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 2200);
  }

  // ---------- 保存 ----------
  // データの出し入れは store.js（本番=Supabase／デモ=このブラウザ）に任せる
  let staff = [];
  let leaves = []; // 休暇申請（管理者は全員分）
  const isValidPerson = (p) => p && typeof p === 'object' && typeof p.id === 'string' && typeof p.nameEn === 'string';
  const CLOUD = window.Store.mode === 'cloud';
  // AI は人が増えてから入れる（2026-11-07 Daisuke）。本番では config.js の aiEnabled: true で出す。デモでは見た目を確かめられるよう出す
  const AI_ON = !CLOUD || !!(window.STAFF_APP_CONFIG || {}).aiEnabled;
  async function load() {
    staff = await Store.loadStaff();
    try { leaves = await Store.listLeave(); } catch (e) { leaves = []; }
  }
  // 1人分を保存（本番は1行 upsert、デモは全員分を localStorage へ）
  // 保存に成功してから画面のデータを入れ替える（失敗したら何も変えない）
  async function persist(p, isNew) {
    const next = staff.some((x) => x.id === p.id) ? staff.map((x) => (x.id === p.id ? p : x)) : [...staff, p];
    try { await Store.saveStaff(p, next, isNew); staff = next; return true; } catch (e) { alert('保存できませんでした: ' + e.message); return false; }
  }
  function saveAllDemo() { if (!Store.saveAllDemo(staff)) { alert('保存できませんでした。'); return false; } return true; }
  const byId = (id) => staff.find((p) => p.id === id);
  const active = () => staff.filter((p) => p.status !== '退職');

  // ---------- 画面: ホーム ----------
  function viewHome() {
    const act = active();
    const t = todayYMD();
    // 本人と家族の誕生日をまとめて並べる
    const events = birthdayEvents(act).map((e) => ({ ...e, d: daysToBirthday(e.bd) }));
    const evName = (e) => esc(e.p.nickname || e.p.nameEn) + esc(e.who);
    const thisMonth = events.filter((e) => parseYMD(e.bd).getMonth() === t.getMonth());
    const upcoming = [...events].sort((a, b) => a.d - b.d).slice(0, 6);
    const todays = upcoming.filter((x) => x.d === 0);
    const avgM = act.length ? Math.round(act.reduce((s, p) => s + tenureMonths(p.joinDate), 0) / act.length) : 0;
    const qualCount = act.reduce((s, p) => s + (p.qualifications || []).length, 0);
    const trainings = staff.flatMap((p) => (p.trainings || []).map((tr) => ({ p, tr })))
      .sort((a, b) => (b.tr.date || '').localeCompare(a.tr.date || '')).slice(0, 5);
    const newcomers = act.filter((p) => tenureMonths(p.joinDate) < 3)
      .sort((a, b) => (b.joinDate || '').localeCompare(a.joinDate || ''));
    // 入社記念日（次の60日以内）
    const anniv = act.filter((p) => p.joinDate && tenureMonths(p.joinDate) >= 11).map((p) => ({ p, d: daysToBirthday(p.joinDate) }))
      .filter((x) => x.d <= 60).sort((a, b) => a.d - b.d);

    return `
      <div class="page-head">
        <div>
          <h1 class="page-title">ホーム</h1>
          <p class="page-sub">${t.getFullYear()}年${t.getMonth() + 1}月${t.getDate()}日 時点 ・ Samurai Motors</p>
        </div>
        <a class="btn btn-gold" href="#/edit/new">＋ スタッフを登録</a>
      </div>

      ${todays.map((e) => { const p = e.p; return `
        <a class="today-bd" href="#/staff/${esc(p.id)}" style="text-decoration:none">
          ${avatar(p, 'av-40')}
          <div><b>🎂 今日は ${evName(e)} の誕生日です（${age(e.bd)}歳）</b>
          <div class="lr-sub">${e.who ? 'メモ' : '好きなもの'}: ${esc(e.likes || '未登録')}</div></div>
        </a>`; }).join('')}

      <div class="stats">
        <div class="card stat"><div class="stat-label">在籍スタッフ</div><div class="stat-value">${act.length}<small>人</small></div><div class="stat-note">目標: 1年後に10人</div></div>
        <div class="card stat"><div class="stat-label">今月の誕生日</div><div class="stat-value">${thisMonth.length}<small>人</small></div><div class="stat-note">${thisMonth.map(evName).join('・') || 'なし'}（家族も含む）</div></div>
        <div class="card stat"><div class="stat-label">平均勤続</div><div class="stat-value">${Math.floor(avgM / 12) ? Math.floor(avgM / 12) + '<small>年</small>' : ''}${avgM % 12}<small>か月</small></div><div class="stat-note">在籍者の平均</div></div>
        <div class="card stat"><div class="stat-label">資格・修了証</div><div class="stat-value">${qualCount}<small>件</small></div><div class="stat-note">在籍者の合計</div></div>
      </div>

      <div class="home-grid">
        <div class="stack">
          <section class="card card-pad">
            <h2 class="card-title"><span class="mark"></span>次の誕生日</h2>
            ${upcoming.length ? upcoming.map((e) => { const p = e.p, d = e.d; return `
              <a class="list-row" href="#/staff/${esc(p.id)}">
                ${avatar(p, 'av-40')}
                <div class="lr-body"><div class="lr-name">${evName(e)}</div>
                <div class="lr-sub">🎁 ${e.who ? 'メモ' : '好きなもの'}: ${esc(e.likes || '未登録')}</div></div>
                <div class="lr-right"><div class="countdown">${d === 0 ? '今日' : 'あと' + d + '日'}</div>${fmtDate(e.bd).replace(/^\d+年/, '')}・${age(e.bd) + (d === 0 ? 0 : 1)}歳に</div>
              </a>`; }).join('') : '<p class="empty">誕生日が登録されたスタッフがいません。</p>'}
          </section>
          <section class="card card-pad">
            <h2 class="card-title"><span class="mark"></span>最近の研修・教育</h2>
            ${trainings.length ? trainings.map(({ p, tr }) => `
              <a class="list-row" href="#/staff/${esc(p.id)}">
                ${avatar(p, 'av-40')}
                <div class="lr-body"><div class="lr-name">${esc(tr.title)}</div><div class="lr-sub">${esc(p.nickname || p.nameEn)} ・ 担当: ${esc(tr.by || '—')}</div></div>
                <div class="lr-right">${fmtDate(tr.date)}<br>${tr.result ? `<span class="chip chip-gold">${esc(tr.result)}</span>` : ''}</div>
              </a>`).join('') : '<p class="empty">研修の記録はまだありません。</p>'}
          </section>
        </div>
        <div class="stack">
          <section class="card card-pad">
            <h2 class="card-title"><span class="mark"></span>新しく入った人（3か月以内）</h2>
            ${newcomers.length ? newcomers.map((p) => `
              <a class="list-row" href="#/staff/${esc(p.id)}">
                ${avatar(p, 'av-40')}
                <div class="lr-body"><div class="lr-name">${esc(p.nickname || p.nameEn)}</div><div class="lr-sub">${esc(p.role)} ・ ${esc(p.employment)}</div></div>
                <div class="lr-right">${fmtDate(p.joinDate)}入社<br>${tenure(p.joinDate)}</div>
              </a>`).join('') : '<p class="empty">該当なし</p>'}
          </section>
          <section class="card card-pad">
            <h2 class="card-title"><span class="mark"></span>入社記念日（60日以内）</h2>
            ${anniv.length ? anniv.map(({ p, d }) => `
              <a class="list-row" href="#/staff/${esc(p.id)}">
                ${avatar(p, 'av-40')}
                <div class="lr-body"><div class="lr-name">${esc(p.nickname || p.nameEn)}</div><div class="lr-sub">${fmtDate(p.joinDate)}入社</div></div>
                <div class="lr-right">${d === 0 ? '今日' : 'あと' + d + '日'}</div>
              </a>`).join('') : '<p class="empty">該当なし</p>'}
          </section>
          <section class="card card-pad">
            <h2 class="card-title"><span class="mark"></span>できる作業の人数</h2>
            ${SKILLS.map((s) => { const n = act.filter((p) => (p.skills || []).includes(s)).length; return `
              <div class="lang-bar"><span class="ln" style="width:110px">${esc(s)}</span>
              <div class="dots">${Array.from({ length: Math.max(act.length, 1) }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>
              <span class="lv">${n}人</span></div>`; }).join('')}
          </section>
        </div>
      </div>`;
  }

  // ---------- 画面: スタッフ一覧 ----------
  const listState = { q: '', role: '', skill: '', status: '在籍・休職', mode: 'card' };
  try { const m = localStorage.getItem('smStaff.listMode'); if (m) listState.mode = m; } catch (e) { /* 無視 */ }

  function filtered() {
    const q = listState.q.trim().toLowerCase();
    return staff.filter((p) => {
      if (listState.status === '在籍・休職' && p.status === '退職') return false;
      if (listState.status === '退職' && p.status !== '退職') return false;
      if (listState.role && p.role !== listState.role) return false;
      if (listState.skill && !(p.skills || []).includes(listState.skill)) return false;
      if (q) {
        const hay = [p.nameEn, p.nickname, p.nameKm, p.birthplace, p.hometown, p.role, (p.skills || []).join(' '),
          (p.qualifications || []).map((x) => x.name).join(' ')].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (a.joinDate || '').localeCompare(b.joinDate || ''));
  }

  function viewStaff() {
    return `
      <div class="page-head">
        <div><h1 class="page-title">スタッフ一覧</h1><p class="page-sub">顔写真をクリックすると個人カルテが開きます</p></div>
        <a class="btn btn-gold" href="#/edit/new">＋ スタッフを登録</a>
      </div>
      <div class="toolbar">
        <input class="search" id="fQ" type="search" placeholder="名前・呼び名・出身地・資格で検索" value="${esc(listState.q)}">
        <select id="fRole"><option value="">役職: すべて</option>${ROLES.map((r) => `<option ${listState.role === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
        <select id="fSkill"><option value="">できる作業: すべて</option>${SKILLS.map((r) => `<option ${listState.skill === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
        <select id="fStatus">${['在籍・休職', '退職', 'すべて'].map((r) => `<option ${listState.status === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
        <div class="seg"><button data-mode="card" class="${listState.mode === 'card' ? 'on' : ''}">顔写真</button><button data-mode="table" class="${listState.mode === 'table' ? 'on' : ''}">一覧表</button></div>
      </div>
      ${AI_ON ? `<section class="card card-pad ai-card" style="margin-bottom:16px">
        <div class="ai-ask"><span class="ai-mark">✦</span>
          <input id="aiQ" placeholder="AI に聞く（例: POLISH ができて英語で接客できる人は？ ／ 来月誕生日の人は？）" maxlength="300">
          <button class="btn btn-sm btn-dark" id="aiQBtn">聞く</button></div>
        <div id="aiQOut" class="ai-out" hidden></div>
      </section>` : ''}
      <div id="listBody"></div>`;
  }
  function renderList() {
    const rows = filtered();
    const body = $('#listBody'); if (!body) return;
    const note = `<p class="count-note">${rows.length}人を表示中</p>`;
    if (!rows.length) { body.innerHTML = note + '<div class="card card-pad empty">条件に合うスタッフがいません。</div>'; return; }
    if (listState.mode === 'table') {
      body.innerHTML = note + `<div class="card table-wrap"><table class="tbl">
        <thead><tr><th>名前</th><th>役職</th><th>雇用</th><th>年齢</th><th>誕生日</th><th>出身地</th><th>入社日（勤続）</th><th>できる作業</th><th>状態</th></tr></thead>
        <tbody>${rows.map((p) => `<tr>
          <td><a class="who" href="#/staff/${esc(p.id)}">${avatar(p, 'av-40')}<span>${esc(p.nameEn)}<br><span style="font-weight:400;font-size:12px;color:var(--ink-3)">${esc(p.nickname)}</span></span></a></td>
          <td>${esc(p.role)}</td><td>${esc(p.employment)}</td><td>${age(p.birthday) ?? '—'}歳</td>
          <td>${fmtDate(p.birthday).replace(/^\d+年/, '')}</td><td>${esc(p.birthplace || '—')}</td>
          <td>${fmtDate(p.joinDate)}<br><span style="font-size:12px;color:var(--ink-3)">${tenure(p.joinDate)}</span></td>
          <td>${(p.skills || []).map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</td>
          <td>${statusBadge(p.status)}${p.sample ? ' <span class="badge badge-sample">サンプル</span>' : ''}</td></tr>`).join('')}</tbody></table></div>`;
      return;
    }
    body.innerHTML = note + `<div class="grid">${rows.map((p) => `
      <a class="card pcard ${p.status === '退職' ? 'retired' : ''}" href="#/staff/${esc(p.id)}">
        <div class="pcard-photo">
          ${p.photo ? `<img src="${esc(p.photo)}" alt="">` : `<span class="initials">${esc(initials(p))}</span>`}
          ${p.sample ? '<span class="tag-tl badge badge-sample">サンプル</span>' : ''}
          ${p.status !== '在籍' ? `<span class="tag-tr">${statusBadge(p.status)}</span>` : ''}
        </div>
        <div class="pcard-body">
          <div class="pcard-name">${esc(p.nameEn)}</div>
          <div class="pcard-nick">${esc(p.nickname || '')}${p.nameKm ? ` ・ <span class="km">${esc(p.nameKm)}</span>` : ''}</div>
          <div class="pcard-meta">${esc(p.role)} ・ ${age(p.birthday) ?? '—'}歳 ・ ${esc(p.birthplace || '—')}<br>勤続 ${tenure(p.joinDate)}</div>
          <div>${(p.skills || []).slice(0, 4).map((s) => `<span class="chip">${esc(s)}</span>`).join('')}${(p.skills || []).length > 4 ? `<span class="chip">+${p.skills.length - 4}</span>` : ''}</div>
        </div>
      </a>`).join('')}</div>`;
  }
  function bindStaff() {
    renderList();
    const qb = $('#aiQBtn'); const qi = $('#aiQ');
    if (qb && qi) {
    const ask = () => {
      const q = qi.value.trim(); if (!q) return;
      const out = $('#aiQOut'); out.hidden = false;
      runAI(qb, out, 'search', { question: q }, (r) => `
        <p class="ai-profile">${esc(r.answer || '')}</p>
        ${(r.matches || []).map((m) => { const p = byId(m.id); return `<a class="list-row" href="#/staff/${esc(m.id)}">${p ? avatar(p, 'av-40') : ''}<div class="lr-body"><div class="lr-name">${esc(m.name || (p && p.nameEn) || m.id)}</div><div class="lr-sub">${esc(m.why || '')}</div></div></a>`; }).join('')}`);
    };
    qb.addEventListener('click', ask);
    qi.addEventListener('keydown', (e) => { if (e.key === 'Enter') ask(); });
    }
    $('#fQ').addEventListener('input', (e) => { listState.q = e.target.value; renderList(); });
    $('#fRole').addEventListener('change', (e) => { listState.role = e.target.value; renderList(); });
    $('#fSkill').addEventListener('change', (e) => { listState.skill = e.target.value; renderList(); });
    $('#fStatus').addEventListener('change', (e) => { listState.status = e.target.value; renderList(); });
    document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
      listState.mode = b.dataset.mode;
      try { localStorage.setItem('smStaff.listMode', listState.mode); } catch (e) { /* 無視 */ }
      document.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('on', x === b));
      renderList();
    }));
  }

  // サンプルの人だけに出す仮の勤務データ（入社月以降の最大6か月。id から毎回同じ数字を作る）
  function sampleWork(p) {
    if (!p.sample || p.status === '退職') return null;
    let seed = [...p.id].reduce((s, c) => s + c.charCodeAt(0), 0);
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const t = todayYMD(); const j = parseYMD(p.joinDate);
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(t.getFullYear(), t.getMonth() - i, 1);
      if (j && d < new Date(j.getFullYear(), j.getMonth(), 1)) continue;
      const cur = i === 0;
      // 今月は「1日（または入社日）〜今日」のうち1日だけ休んだ想定
      const start = j && j.getFullYear() === d.getFullYear() && j.getMonth() === d.getMonth() ? j.getDate() : 1;
      const span = t.getDate() - start + 1;
      const workDays = cur ? Math.max(span - (span > 3 ? 1 : 0), 0) : 22 + Math.floor(rnd() * 4);
      months.push({ label: `${d.getMonth() + 1}月`, hours: Math.round(workDays * (7.5 + rnd() * 1.5)), off: cur ? span - workDays : 4 + Math.floor(rnd() * 3), days: workDays });
    }
    const now = months[months.length - 1] || { hours: 0, off: 0, days: 0 };
    return { months, hours: now.hours, off: now.off, days: now.days };
  }

  // ---------- 休暇・勤怠・AI の小道具 ----------
  let ME = null; // ログイン中の人 { role, displayName, staffId, loginId }
  const ymdStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const LEAVE_KIND = { dayoff: '休み', sick: '病気', family: '家族の用事', other: 'その他' };
  const LEAVE_ST = { pending: ['承認待ち', 'badge-warn'], approved: ['承認', 'badge-ok'], rejected: ['却下', 'badge-mute'], cancelled: ['取り消し', 'badge-mute'] };
  const leaveBadge = (s) => `<span class="badge ${(LEAVE_ST[s] || ['', 'badge-mute'])[1]}">${esc((LEAVE_ST[s] || [s])[0])}</span>`;
  const leaveDays = (r) => Math.round((parseYMD(r.end_date) - parseYMD(r.start_date)) / 86400000) + 1;
  const pendingCount = () => leaves.filter((r) => r.status === 'pending').length;

  // 勤務・休みタブの中身（月ごと）
  async function loadWork(id) {
    const box = $('#workBox'); if (!box) return;
    const p = byId(id); if (!p) return;
    const t = todayYMD();
    let months = null; let note = '';
    if (!CLOUD) {
      const w = sampleWork(p);
      note = '本体のスプレッドシートとはまだつないでいません（デモ）。' + (w ? '下の数字は見た目を確かめるための仮の数字です。' : '');
      months = w ? w.months.map((m) => ({ ...m, missing: 0, leave: 0 })) : null;
    } else {
      try {
        const from = new Date(t.getFullYear(), t.getMonth() - 5, 1);
        const rows = await Store.attendance(id, ymdStr(from));
        note = '本体シート「勤怠記録」の写しから集計しています（毎日自動で更新）。休みは「出勤の記録がない日」です。';
        months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(t.getFullYear(), t.getMonth() - i, 1);
          const key = ymdStr(d).slice(0, 7);
          const inM = rows.filter((r) => String(r.work_date).slice(0, 7) === key);
          const lastDay = i === 0 ? t.getDate() : new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
          const leaveN = leaves.filter((r) => r.staff_id === id && r.status === 'approved').reduce((s, r) => {
            let n = 0; for (let x = parseYMD(r.start_date); x <= parseYMD(r.end_date); x = new Date(x.getFullYear(), x.getMonth(), x.getDate() + 1)) {
              if (ymdStr(x).slice(0, 7) === key && x.getDate() <= lastDay) n++; }
            return s + n; }, 0);
          months.push({ label: `${d.getMonth() + 1}月`, days: inM.length, hours: Math.round(inM.reduce((s, r) => s + (r.work_minutes || 0), 0) / 60),
            missing: inM.filter((r) => r.clock_in && !r.clock_out).length, off: Math.max(lastDay - inM.length, 0), leave: leaveN });
        }
        if (!rows.length) months = null;
      } catch (e) { box.innerHTML = `<div class="note-box">勤怠を読めませんでした: ${esc(e.message)}</div>`; return; }
    }
    if (!months || !months.length) { box.innerHTML = `<div class="note-box">${esc(note)}<br>この人の勤怠の記録はまだありません。</div>`; return; }
    const now = months[months.length - 1]; const maxH = Math.max(...months.map((m) => m.hours), 1);
    box.innerHTML = `
      <div class="note-box" style="margin-bottom:16px">${esc(note)}</div>
      <div class="stats">
        <div class="card stat"><div class="stat-label">今月の勤務日数</div><div class="stat-value">${now.days}<small>日</small></div><div class="stat-note">${t.getMonth() + 1}月1日〜今日</div></div>
        <div class="card stat"><div class="stat-label">今月の勤務時間</div><div class="stat-value">${now.hours}<small>時間</small></div><div class="stat-note">${now.missing ? `退勤の押し忘れ ${now.missing}日（時間に入っていません）` : '1日平均 ' + (now.hours / Math.max(now.days, 1)).toFixed(1) + ' 時間'}</div></div>
        <div class="card stat"><div class="stat-label">今月の休み</div><div class="stat-value">${now.off}<small>日</small></div><div class="stat-note">うち承認済みの休暇 ${now.leave}日</div></div>
        <div class="card stat"><div class="stat-label">有給の残り</div><div class="stat-value" style="font-size:18px;color:var(--ink-3)">未設定</div><div class="stat-note">ルールを決めたら表示</div></div>
      </div>
      <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>月ごとの勤務時間と休み</h2>
        <div class="bars">${months.map((m) => `
          <div class="bar-col"><div class="bar-val">${m.hours}h</div><div class="bar" style="height:${Math.round(m.hours / maxH * 120)}px"></div>
          <div class="bar-m">${m.label}</div><div class="bar-off">出勤 ${m.days}日・休み ${m.off}日</div>${m.missing ? `<div class="bar-off" style="color:var(--warn)">押し忘れ ${m.missing}</div>` : ''}</div>`).join('')}</div>
      </section>`;
  }

  // AI の結果を表示する
  const aiDemo = '<p class="note-box">デモ表示です。Supabase につなぐと、ここに AI の答えが出ます。</p>';
  const aiList = (arr) => (arr && arr.length ? `<ul class="ai-list">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="empty">—</p>');
  async function runAI(btn, out, action, payload, renderFn) {
    btn.disabled = true; const old = btn.textContent; btn.textContent = '考え中…';
    out.innerHTML = '<p class="empty">AI が読んでいます（10〜20秒ほど）…</p>';
    try {
      const r = await Store.ai(action, payload);
      out.innerHTML = r && r.demo ? aiDemo : r && r.raw ? `<p>${esc(r.raw)}</p>` : renderFn(r);
    } catch (e) { out.innerHTML = `<p class="note-box">AI を使えませんでした: ${esc(e.message)}</p>`; }
    btn.disabled = false; btn.textContent = old;
  }
  function bindAI(id) {
    const sb = $('#aiSumBtn');
    if (sb) sb.addEventListener('click', () => runAI(sb, $('#aiSumOut'), 'summary', { staffId: id }, (r) => `
      <p class="ai-profile">${esc(r.profile || '')}</p>
      <div class="ai-cols"><div><b>強み</b>${aiList(r.strengths)}</div><div><b>次の面談で聞くとよいこと</b>${aiList(r.ask_next)}</div><div><b>まだ埋まっていない項目</b>${aiList(r.missing)}</div></div>
      <p class="ai-foot">AI のまとめです。判断は日本メンバーが行ってください。</p>`));
    const gb = $('#aiGiftBtn');
    if (gb) gb.addEventListener('click', () => runAI(gb, $('#aiGiftOut'), 'gift', { staffId: id }, (r) => `
      ${(r.ideas || []).map((g) => `<div class="ai-gift"><b>${esc(g.item)}</b> <span class="chip chip-gold">${esc(g.budget || '')}</span><div class="lr-sub">${esc(g.why || '')}</div></div>`).join('')}
      ${r.ask ? `<p class="ai-foot">本人に聞くとよいこと: ${esc(r.ask)}</p>` : ''}`));
  }

  // ---------- 画面: 休暇申請（管理者） ----------
  let leaveFilter = 'pending';
  function viewLeaves() {
    const rows = leaves.filter((r) => leaveFilter === 'all' || r.status === leaveFilter);
    const who = (sid) => byId(sid);
    return `
      <div class="page-head"><div><h1 class="page-title">休暇申請</h1><p class="page-sub">現場スタッフが自分の画面から出した申請です。承認・却下すると、本人の画面に結果が出ます。</p></div></div>
      <div class="toolbar"><div class="seg">${[['pending', `承認待ち（${pendingCount()}）`], ['approved', '承認'], ['rejected', '却下'], ['all', 'すべて']].map(([k, l]) => `<button data-lf="${k}" class="${leaveFilter === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      ${rows.length ? `<div class="stack">${rows.map((r) => { const p = who(r.staff_id); return `
        <section class="card card-pad leave-row">
          <div class="leave-who">${p ? avatar(p, 'av-40') : ''}<div><b>${esc(p ? (p.nickname || p.nameEn) : r.staff_id)}</b><div class="lr-sub">${fmtDate(r.created_at ? r.created_at.slice(0, 10) : '')} に申請</div></div></div>
          <div class="leave-body">
            <div><b>${fmtDate(r.start_date)}${r.end_date !== r.start_date ? ' 〜 ' + fmtDate(r.end_date) : ''}</b>（${leaveDays(r)}日） ・ ${esc(LEAVE_KIND[r.kind] || r.kind)} ${leaveBadge(r.status)}</div>
            ${r.reason ? `<div class="lr-sub">理由: ${esc(r.reason)}</div>` : ''}
            ${r.admin_note ? `<div class="lr-sub">メモ: ${esc(r.admin_note)}</div>` : ''}
          </div>
          ${r.status === 'pending' ? `<div class="leave-act">
            <input data-note="${esc(r.id)}" placeholder="本人へのメモ（任意・英語かやさしい日本語で）">
            <button class="btn btn-gold btn-sm" data-dec="approved" data-id="${esc(r.id)}">承認</button>
            <button class="btn btn-sm" data-dec="rejected" data-id="${esc(r.id)}">却下</button></div>` : ''}
        </section>`; }).join('')}</div>` : '<div class="card card-pad empty">該当する申請はありません。</div>'}`;
  }
  function bindLeaves() {
    document.querySelectorAll('[data-lf]').forEach((b) => b.addEventListener('click', () => { leaveFilter = b.dataset.lf; route(); }));
    document.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', async () => {
      const raw = b.dataset.id; const id = isNaN(+raw) ? raw : +raw;
      const noteEl = document.querySelector(`[data-note="${CSS.escape(raw)}"]`);
      try {
        await Store.updateLeave(id, { status: b.dataset.dec, admin_note: noteEl ? noteEl.value.trim() : '' });
        leaves = await Store.listLeave(); toast(b.dataset.dec === 'approved' ? '承認しました' : '却下しました'); updateBadge(); route();
      } catch (e) { alert('更新できませんでした: ' + e.message); }
    }));
  }
  function updateBadge() { const el = $('#leaveBadge'); if (el) { const n = pendingCount(); el.textContent = n; el.hidden = !n; } }

  // ---------- 画面: 個人カルテ ----------
  let profileTab = 'basic';
  function viewProfile(id) {
    const p = byId(id);
    if (!p) return `<div class="card card-pad">スタッフが見つかりません。<a href="#/staff">一覧へ戻る</a></div>`;
    const d = daysToBirthday(p.birthday);
    const langs = p.languages || {};
    const tabBtn = (k, label) => `<button data-tab="${k}" class="${profileTab === k ? 'on' : ''}">${label}</button>`;
    const panel = (k, html) => `<div class="tab-panel" data-panel="${k}" ${profileTab === k ? '' : 'hidden'}>${html}</div>`;

    const dreamsSorted = [...(p.dreams || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const latestDream = dreamsSorted[0];
    const basic = `
      ${latestDream ? `<div class="dream-hero"><div class="dream-label">今後の夢・これからどうしたいか<span>${fmtDate(latestDream.date)} に聞いた</span></div><div class="dream-text">「${esc(latestDream.text)}」</div></div>` : ''}
      <div class="two-col">
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>本人のこと</h2>
          <dl class="kv">
            <dt>クメール語表記</dt><dd class="km">${esc(p.nameKm || '—')}</dd>
            <dt>日本語の呼び名</dt><dd>${esc(p.nickname || '—')}</dd>
            <dt>英語表記</dt><dd>${esc(p.nameEn)}</dd>
            <dt>生年月日</dt><dd>${fmtDate(p.birthday)}（${age(p.birthday) ?? '—'}歳）</dd>
            <dt>出身地</dt><dd><b>${esc(p.birthplace || '—')}</b>${p.hometown ? ` ・ ${esc(p.hometown)}` : ''}</dd>
            <dt>家族のメモ</dt><dd>${esc(p.family || '—')}</dd>
            <dt>性別</dt><dd>${esc(p.gender || '—')}</dd>
          </dl></section>
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>仕事のこと</h2>
          <dl class="kv">
            <dt>役職</dt><dd>${esc(p.role || '—')}</dd>
            <dt>雇用形態</dt><dd>${esc(p.employment || '—')}</dd>
            <dt>状態</dt><dd>${statusBadge(p.status)}</dd>
            <dt>入社日</dt><dd>${fmtDate(p.joinDate)}（勤続 ${tenure(p.joinDate)}）</dd>
            <dt>できる作業</dt><dd>${(p.skills || []).map((s) => `<span class="chip chip-gold">${esc(s)}</span>`).join('') || '—'}</dd>
          </dl></section>
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>連絡先</h2>
          <dl class="kv">
            <dt>電話</dt><dd>${esc(p.phone || '—')}</dd>
            <dt>Telegram</dt><dd>${esc(p.telegram || '—')}</dd>
            <dt>住まい</dt><dd>${esc(p.address || '—')}</dd>
            <dt>緊急連絡先</dt><dd>${p.emergency && p.emergency.name ? `${esc(p.emergency.name)}（${esc(p.emergency.relation || '—')}）<br>${esc(p.emergency.phone || '')}` : '—'}</dd>
          </dl></section>
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>ことば</h2>
          ${LANGS.map(([k, label]) => { const lv = +(langs[k] || 0); return `
            <div class="lang-bar"><span class="ln">${label}</span>
            <div class="dots">${[1, 2, 3].map((i) => `<i class="${i <= lv ? 'on' : ''}"></i>`).join('')}</div>
            <span class="lv">${LANG_LV[lv]}</span></div>`; }).join('')}
        </section>
      </div>
      <section class="card card-pad" style="margin-top:16px"><h2 class="card-title"><span class="mark"></span>家族</h2>
        ${(p.familyMembers || []).length ? `<div class="fam-list">${p.familyMembers.map((f) => { const fd = daysToBirthday(f.birthday); return `
          <div class="fam-item">
            <span class="chip chip-gold">${esc(f.relation || '家族')}</span>
            <div class="fam-body"><b>${esc(f.name || '名前未確認')}</b> ・ ${esc(ageText(f.birthday))}
              <div class="lr-sub">${esc(bdText(f.birthday))}${fd != null && fd <= 60 ? ` ・ 誕生日まであと${fd}日` : ''}${f.note ? ` ・ ${esc(f.note)}` : ''}</div></div>
          </div>`; }).join('')}</div>` : '<p class="empty">まだ登録がありません。「編集」から、奥さん・子ども・両親などを1人ずつ足せます。</p>'}
      </section>`;

    const learn = `
      <div class="two-col">
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>資格・免許・修了証</h2>
          ${(p.qualifications || []).length ? `<ul class="timeline">${p.qualifications.map((q) => `
            <li><div class="tl-date">${fmtDate(q.date)}</div><div class="tl-title">${esc(q.name)}</div>${q.note ? `<div class="tl-sub">${esc(q.note)}</div>` : ''}</li>`).join('')}</ul>`
            : '<p class="empty">登録なし</p>'}
        </section>
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>学歴</h2>
          ${(p.education || []).length ? `<ul class="timeline">${p.education.map((e) => `
            <li><div class="tl-date">${esc(e.period || '—')}</div><div class="tl-title">${esc(e.school)}</div>${e.note ? `<div class="tl-sub">${esc(e.note)}</div>` : ''}</li>`).join('')}</ul>`
            : '<p class="empty">登録なし</p>'}
        </section>
      </div>
      <section class="card card-pad" style="margin-top:16px"><h2 class="card-title"><span class="mark"></span>社内の研修・教育の記録</h2>
        ${(p.trainings || []).length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>日付</th><th>内容</th><th>教えた人</th><th>結果</th></tr></thead><tbody>
          ${[...p.trainings].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((t) => `<tr><td>${fmtDate(t.date)}</td><td>${esc(t.title)}</td><td>${esc(t.by || '—')}</td><td>${t.result ? `<span class="chip chip-gold">${esc(t.result)}</span>` : '—'}</td></tr>`).join('')}
          </tbody></table></div>` : '<p class="empty">記録なし</p>'}
      </section>`;

    const career = `
      <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>今後の夢・これからどうしていきたいか</h2>
        ${dreamsSorted.length ? dreamsSorted.map((d) => `<div class="memo"><div class="memo-meta">${fmtDate(d.date)} に聞いた</div>${esc(d.text)}</div>`).join('')
          : '<p class="empty">まだ聞けていません。面談のときに聞いて「編集」から書き足してください。</p>'}
      </section>
      <div class="two-col" style="margin-top:16px">
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>入社してからの職務</h2>
          ${(p.careerAfter || []).length ? `<ul class="timeline">${[...p.careerAfter].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((c) => `
            <li><div class="tl-date">${fmtDate(c.date)}〜</div><div class="tl-title">${esc(c.role)}</div>${c.duty ? `<div class="tl-sub">${esc(c.duty)}</div>` : ''}</li>`).join('')}</ul>`
            : '<p class="empty">登録なし</p>'}
        </section>
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>入社前の経歴</h2>
          ${(p.careerBefore || []).length ? `<ul class="timeline">${p.careerBefore.map((c) => `
            <li><div class="tl-date">${esc(c.period || '—')}</div><div class="tl-title">${esc(c.company)}</div>${c.duty ? `<div class="tl-sub">${esc(c.duty)}</div>` : ''}</li>`).join('')}</ul>`
            : '<p class="empty">登録なし</p>'}
        </section>
      </div>`;

    // 勤務・休み（中身は loadWork が後から入れる。本番=勤怠の写し、デモ=仮の数字）
    const myLeaves = leaves.filter((r) => r.staff_id === p.id && r.status !== 'cancelled');
    const workTab = `<div id="workBox"><p class="empty">読み込み中…</p></div>
      <section class="card card-pad" style="margin-top:16px"><h2 class="card-title"><span class="mark"></span>休暇申請の記録</h2>
        ${myLeaves.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>期間</th><th>種類</th><th>理由</th><th>結果</th></tr></thead><tbody>
          ${myLeaves.map((r) => `<tr><td>${fmtDate(r.start_date)}${r.end_date !== r.start_date ? '〜' + fmtDate(r.end_date) : ''}（${leaveDays(r)}日）</td><td>${esc(LEAVE_KIND[r.kind] || r.kind)}</td><td>${esc(r.reason || '—')}</td><td>${leaveBadge(r.status)}</td></tr>`).join('')}
          </tbody></table></div>` : '<p class="empty">申請はまだありません。</p>'}
      </section>`;

    // AI 要約（基本情報タブの上）
    const aiBox = `<section class="card card-pad ai-card" id="aiSummary">
        <div class="ai-head"><h2 class="card-title" style="margin:0"><span class="ai-mark">✦</span>AI のまとめ</h2>
        <button class="btn btn-sm btn-dark" id="aiSumBtn">カルテを要約する</button></div>
        <div id="aiSumOut" class="ai-out"><p class="empty">押すと、経歴・面談メモ・夢から人物像と「次の面談で聞くとよいこと」を出します。</p></div>
      </section>`;

    const bday = `
      <div class="two-col">
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>次の誕生日</h2>
          ${p.birthday ? `<div class="bd-hero"><div class="bd-num">${d === 0 ? '今日！' : 'あと' + d + '日'}</div>
            <div>${fmtDate(p.birthday).replace(/^\d+年/, '')}<br><span style="color:var(--ink-3)">${age(p.birthday) + (d === 0 ? 0 : 1)}歳になります</span></div></div>` : '<p class="empty">誕生日が未登録です</p>'}
          <dl class="kv" style="margin-top:14px"><dt>好きなもの</dt><dd>${esc(p.likes || '未登録（会話で聞いておくとプレゼント選びに役立ちます）')}</dd></dl>
        </section>
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>これまでのプレゼント</h2>
          ${(p.gifts || []).length ? `<ul class="timeline">${[...p.gifts].sort((a, b) => String(b.year).localeCompare(String(a.year))).map((g) => `<li><div class="tl-date">${esc(g.year)}年</div><div class="tl-title">${esc(g.item)}</div></li>`).join('')}</ul>` : '<p class="empty">まだありません。贈ったら「編集」から記録してください（同じ物を2回贈らないため）。</p>'}
        </section>
      </div>
      ${AI_ON ? `<section class="card card-pad ai-card" style="margin-top:16px">
        <div class="ai-head"><h2 class="card-title" style="margin:0"><span class="ai-mark">✦</span>AI のプレゼント案</h2>
        <button class="btn btn-sm btn-dark" id="aiGiftBtn">案を出す</button></div>
        <div id="aiGiftOut" class="ai-out"><p class="empty">好きなものと過去のプレゼントから、プノンペンで買える候補を出します。</p></div>
      </section>` : ''}`;

    const notes = `
      <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>面談・気づきのメモ</h2>
        <p class="page-sub" style="margin:-6px 0 12px">日本メンバーだけが見るメモです。</p>
        ${(p.notes || []).length ? [...p.notes].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((n) => `
          <div class="memo"><div class="memo-meta">${fmtDate(n.date)} ・ ${esc(n.by || '—')}</div>${esc(n.text)}</div>`).join('') : '<p class="empty">メモはまだありません。</p>'}
        <div style="display:flex;gap:8px;margin-top:10px">
          <input id="quickNote" placeholder="メモを書き足す（例: 遅刻が続いたので声をかけた）" style="flex:1;border:1px solid var(--line-2);border-radius:8px;padding:8px 10px">
          <button class="btn btn-dark" id="quickNoteBtn">追加</button>
        </div>
      </section>`;

    return `
      <div class="crumb"><a href="#/staff">スタッフ一覧</a> ／ ${esc(p.nameEn)}</div>
      <div class="profile-head">
        ${avatar(p, 'av-big')}
        <div class="ph-main">
          <h1 class="ph-name">${esc(p.nameEn)}<span class="ph-nick">${esc(p.nickname || '')}</span></h1>
          ${p.nameKm ? `<div class="ph-km km">${esc(p.nameKm)}</div>` : ''}
          <div style="margin-top:8px">${statusBadge(p.status)} <span class="chip chip-gold">${esc(p.role)}</span><span class="chip">${esc(p.employment)}</span>${p.sample ? '<span class="badge badge-sample">サンプル</span>' : ''}</div>
          <div class="ph-facts">
            <span><b>年齢</b>${age(p.birthday) ?? '—'}歳</span>
            <span><b>誕生日</b>${fmtDate(p.birthday).replace(/^\d+年/, '')}${d != null && d <= 30 ? `（あと${d}日）` : ''}</span>
            <span><b>出身</b>${esc(p.birthplace || '—')}${p.hometown ? '・' + esc(p.hometown) : ''}</span>
            <span><b>入社</b>${fmtDate(p.joinDate)}</span>
            <span><b>勤続</b>${tenure(p.joinDate)}</span>
          </div>
        </div>
        <div class="ph-actions">
          <a class="btn btn-gold" href="#/edit/${esc(p.id)}">✎ 編集</a>
          <button class="btn" id="printBtn">印刷</button>
        </div>
      </div>
      <div class="tabs">${tabBtn('basic', '基本情報')}${tabBtn('career', '職務経歴・夢')}${tabBtn('learn', '資格・学び')}${tabBtn('work', '勤務・休み')}${tabBtn('bday', '誕生日・好きなもの')}${tabBtn('notes', '面談メモ')}</div>
      ${panel('basic', (AI_ON ? aiBox : '') + basic)}${panel('career', career)}${panel('learn', learn)}${panel('work', workTab)}${panel('bday', bday)}${panel('notes', notes)}`;
  }
  function bindProfile(id) {
    document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
      profileTab = b.dataset.tab;
      document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
      document.querySelectorAll('.tab-panel').forEach((pnl) => { pnl.hidden = pnl.dataset.panel !== profileTab; });
    }));
    const pb = $('#printBtn'); if (pb) pb.addEventListener('click', () => window.print());
    const qb = $('#quickNoteBtn');
    if (qb) qb.addEventListener('click', async () => {
      const inp = $('#quickNote'); const text = inp.value.trim(); if (!text) return;
      const p = JSON.parse(JSON.stringify(byId(id))); p.notes = p.notes || [];
      p.notes.push({ date: ymdStr(todayYMD()), by: ME ? ME.displayName : '日本メンバー', text });
      if (await persist(p)) { toast('メモを追加しました'); route(); }
    });
    bindAI(id);
    loadWork(id);
  }

  // ---------- 画面: 編集 ----------
  let draft = null;
  // 新しい人の ID は本体シートと同じ「STAFF-00N」形式で、空いている次の番号にする
  const nextStaffId = () => {
    const nums = staff.map((p) => (/^STAFF-(\d+)$/.exec(p.id) || [])[1]).filter(Boolean).map(Number);
    return 'STAFF-' + String(Math.max(5, ...nums) + 1).padStart(3, '0');
  };
  const blankStaff = () => ({
    id: CLOUD ? nextStaffId() : uid(), sample: false, nameEn: '', nickname: '', nameKm: '', photo: null, gender: '', birthday: '', birthplace: '', hometown: '',
    careerBefore: [], careerAfter: [], dreams: [],
    address: '', phone: '', telegram: '', joinDate: '', role: 'スタッフ', employment: '試用期間', status: '在籍',
    skills: [], languages: { km: 3, en: 0, ja: 0 }, education: [], qualifications: [], trainings: [],
    family: '', emergency: { name: '', relation: '', phone: '' }, likes: '', gifts: [], notes: []
  });

  const opts = (list, val, empty) => (empty ? `<option value="">${empty}</option>` : '') + list.map((o) => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('');
  const inp = (key, label, val, type = 'text', extra = '') => `<label class="field ${extra}"><span>${label}</span><input data-k="${key}" type="${type}" value="${esc(val || '')}"></label>`;

  // 生年月日を「年・月・日」の3つの選択肢で選ぶ（カレンダーを何十年も戻らなくていいように）
  // 年だけ・年月だけでも保存できる（家族の年齢だけ分かっている場合など）。誕生日の通知は年月日がそろったときだけ
  const pad2 = (n) => String(n).padStart(2, '0');
  function bdPick(attrs, val, minYear) {
    const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(val || '');
    const y = m ? +m[1] : '', mo = m && m[2] ? +m[2] : '', d = m && m[3] ? +m[3] : '';
    const now = new Date().getFullYear(); const years = []; for (let i = now; i >= minYear; i--) years.push(i);
    const sel = (part, list, cur, label, unit) => `<select ${attrs} data-part="${part}" aria-label="${label}"><option value="">${label}</option>${list.map((v) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${v}${unit}</option>`).join('')}</select>`;
    return `<span class="bd-pick">${sel('y', years, y, '年', '年')}${sel('m', Array.from({ length: 12 }, (_, i) => i + 1), mo, '月', '月')}${sel('d', Array.from({ length: 31 }, (_, i) => i + 1), d, '日', '日')}</span>`;
  }
  function bdValue(box) {
    const [y, m, d] = ['y', 'm', 'd'].map((p) => box.querySelector(`[data-part="${p}"]`).value);
    if (!y) return '';
    if (!m) return y;
    return d ? `${y}-${pad2(m)}-${pad2(d)}` : `${y}-${pad2(m)}`;
  }
  const RELATIONS = ['妻', '夫', '息子', '娘', '父', '母', '兄弟姉妹', '祖父母', 'その他'];

  // 繰り返し行（学歴・資格・研修・プレゼント・メモ）の定義
  const REPEATS = {
    familyMembers: { cls: 're-family', head: ['続柄', '名前', '生年月日（年だけでも可）', 'メモ（学校・仕事・好きなもの）'], cols: [['relation', 'select', ['', ...RELATIONS]], ['name', 'text', '名前'], ['birthday', 'bd', ''], ['note', 'text', '例: 小学2年・サッカーが好き']], blank: { relation: '', name: '', birthday: '', note: '' } },
    education: { cls: 're-edu', head: ['期間', '学校名', '備考'], cols: [['period', 'text', '2016–2019'], ['school', 'text', '学校名'], ['note', 'text', '卒業・中退など']], blank: { period: '', school: '', note: '' } },
    qualifications: { cls: 're-qual', head: ['資格・免許・修了証', '取得年月', '備考'], cols: [['name', 'text', '例: 運転免許'], ['date', 'month', ''], ['note', 'text', '']], blank: { name: '', date: '', note: '' } },
    trainings: { cls: 're-train', head: ['日付', '内容', '教えた人', '結果'], cols: [['date', 'date', ''], ['title', 'text', '例: GLASS 施工'], ['by', 'text', ''], ['result', 'select', ['', '受講', '合格', '要再研修']]], blank: { date: '', title: '', by: '', result: '受講' } },
    careerBefore: { cls: 're-career', head: ['期間', '勤め先・仕事', 'していたこと'], cols: [['period', 'text', '2020–2024'], ['company', 'text', '例: ガソリンスタンド'], ['duty', 'text', '例: 給油・洗車']], blank: { period: '', company: '', duty: '' } },
    careerAfter: { cls: 're-career', head: ['いつから', '役割・担当', 'したこと・成果'], cols: [['date', 'month', ''], ['role', 'text', '例: WASH 担当'], ['duty', 'text', '例: 月80台を担当']], blank: { date: '', role: '', duty: '' } },
    dreams: { cls: 're-dream', head: ['聞いた日', '夢・これからどうしたいか'], cols: [['date', 'date', ''], ['text', 'text', '例: 3年後に班長になって家族に家を建てたい']], blank: { date: '', text: '' } },
    gifts: { cls: 're-gift', head: ['年', '贈ったもの'], cols: [['year', 'text', '2026'], ['item', 'text', '']], blank: { year: String(new Date().getFullYear()), item: '' } },
    notes: { cls: 're-note', head: ['日付', '書いた人', 'メモ'], cols: [['date', 'date', ''], ['by', 'text', ''], ['text', 'text', '']], blank: { date: '', by: '', text: '' } }
  };
  function repeatBlock(key) {
    const def = REPEATS[key]; const rows = draft[key] || [];
    return `<div class="row-head ${def.cls}">${def.head.map((h) => `<span>${h}</span>`).join('')}<span></span></div>
      ${rows.map((r, i) => `<div class="row-edit ${def.cls}">
        ${def.cols.map(([c, type, ph]) => type === 'select'
          ? `<select data-r="${key}" data-i="${i}" data-c="${c}">${ph.map((o) => `<option value="${esc(o)}" ${r[c] === o ? 'selected' : ''}>${esc(o || '—')}</option>`).join('')}</select>`
          : type === 'bd' ? bdPick(`data-r="${key}" data-i="${i}" data-c="${c}"`, r[c], 1930)
          : `<input data-r="${key}" data-i="${i}" data-c="${c}" type="${type}" placeholder="${esc(ph)}" value="${esc(r[c] || '')}">`).join('')}
        <button type="button" class="x" data-del="${key}" data-i="${i}" title="この行を消す">×</button></div>`).join('')}
      <button type="button" class="btn btn-sm" data-add="${key}">＋ 行を追加</button>`;
  }

  function viewEdit(id) {
    const isNew = id === 'new';
    if (!draft || draft._for !== id) {
      const src = isNew ? blankStaff() : byId(id);
      if (!src) return `<div class="card card-pad">スタッフが見つかりません。</div>`;
      draft = JSON.parse(JSON.stringify(src)); draft._for = id;
    }
    const p = draft;
    return `
      <div class="crumb"><a href="#/staff">スタッフ一覧</a> ／ ${isNew ? '新規登録' : esc(p.nameEn) + ' の編集'}</div>
      <div class="page-head"><h1 class="page-title">${isNew ? 'スタッフを登録' : '情報を編集'}</h1></div>
      <form id="editForm" autocomplete="off">
        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>顔写真と名前</h2>
          <div class="photo-edit">
            <span id="photoPrev">${avatar(p, 'av-big')}</span>
            <div>
              <label class="btn"><input type="file" id="photoIn" accept="image/*" hidden>写真を選ぶ</label>
              ${p.photo ? '<button type="button" class="btn btn-sm" id="photoDel" style="margin-left:6px">写真を外す</button>' : ''}
              <p class="page-sub">正方形に近い、顔がはっきり写った写真がおすすめです（自動で小さくして保存します）。</p>
            </div>
          </div>
          ${isNew && CLOUD ? `<div class="form-grid">${inp('id', 'スタッフID（本体シート「スタッフマスター」と同じ番号）', p.id)}</div>` : ''}
          <div class="form-grid">
            <label class="field"><span>クメール語での表記（本人に書いてもらう）</span><input data-k="nameKm" class="km" value="${esc(p.nameKm || '')}"></label>
            ${inp('nickname', '日本語での呼び名', p.nickname)}
            ${inp('nameEn', '英語での表記（パスポートどおり）＊', p.nameEn)}
          </div>
        </section>

        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>本人のこと</h2>
          <div class="form-grid">
            <div class="field"><span>生年月日</span>${bdPick('data-k="birthday"', p.birthday, 1950)}</div>
            <label class="field"><span>出身地（州）</span><select data-k="birthplace">${opts(PROVINCES, p.birthplace, '—')}</select></label>
            ${inp('hometown', '出身の町・村', p.hometown)}
            <label class="field"><span>性別</span><select data-k="gender">${opts(GENDERS, p.gender, '—')}</select></label>
            ${inp('family', '家族のメモ（例: 両親は村で農業・妹2人）', p.family, 'text', 'span2')}
            ${inp('likes', '好きなもの・趣味（誕生日プレゼントの参考）', p.likes, 'text', 'span3')}
          </div>
        </section>

        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>家族（奥さん・子ども・両親など）</h2>
          <p class="page-sub" style="margin:-6px 0 10px">誕生日が分かれば、ホームと誕生日カレンダーに出ます。年齢だけ分かるときは「年」だけ選んでください。</p>
          ${repeatBlock('familyMembers')}
        </section>

        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>仕事のこと</h2>
          <div class="form-grid">
            <label class="field"><span>役職</span><select data-k="role">${opts(ROLES, p.role)}</select></label>
            <label class="field"><span>雇用形態</span><select data-k="employment">${opts(EMPLOYMENTS, p.employment)}</select></label>
            <label class="field"><span>状態</span><select data-k="status">${opts(STATUSES, p.status)}</select></label>
            ${inp('joinDate', '入社日', p.joinDate, 'date')}
          </div>
          <div class="field"><span>できる作業</span><div class="checks">
            ${SKILLS.map((s) => `<label><input type="checkbox" data-skill="${esc(s)}" ${(p.skills || []).includes(s) ? 'checked' : ''}>${esc(s)}</label>`).join('')}
          </div></div>
          <div class="form-grid">
            ${LANGS.map(([k, label]) => `<label class="field"><span>${label}</span><select data-lang="${k}">${LANG_LV.map((l, i) => `<option value="${i}" ${+((p.languages || {})[k] || 0) === i ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`).join('')}
          </div>
        </section>

        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>連絡先</h2>
          <div class="form-grid">
            ${inp('phone', '電話', p.phone, 'tel')}
            ${inp('telegram', 'Telegram', p.telegram)}
            ${inp('address', '住まい（地区まで）', p.address)}
            ${inp('em.name', '緊急連絡先の名前', p.emergency && p.emergency.name)}
            ${inp('em.relation', '続柄', p.emergency && p.emergency.relation)}
            ${inp('em.phone', '緊急連絡先の電話', p.emergency && p.emergency.phone, 'tel')}
          </div>
        </section>

        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>今後の夢・これからどうしていきたいか</h2>
          <p class="page-sub" style="margin:-6px 0 10px">面談のたびに聞いた日を添えて書き足すと、気持ちの移り変わりが残ります。</p>${repeatBlock('dreams')}</section>
        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>職務経歴：入社前</h2>${repeatBlock('careerBefore')}</section>
        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>職務経歴：入社してから</h2>${repeatBlock('careerAfter')}</section>
        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>学歴</h2>${repeatBlock('education')}</section>
        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>資格・免許・修了証</h2>${repeatBlock('qualifications')}</section>
        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>研修・教育の記録</h2>${repeatBlock('trainings')}</section>
        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>誕生日プレゼントの記録</h2>${repeatBlock('gifts')}</section>
        <section class="card card-pad form-sec"><h2 class="card-title"><span class="mark"></span>面談・気づきのメモ</h2>${repeatBlock('notes')}</section>

        <div class="form-foot">
          ${isNew ? '' : '<button type="button" class="btn btn-danger" id="delBtn" style="margin-right:auto">このスタッフを削除</button>'}
          <a class="btn" href="${isNew ? '#/staff' : '#/staff/' + esc(p.id)}" id="cancelBtn">やめる</a>
          <button type="submit" class="btn btn-gold">保存する</button>
        </div>
      </form>`;
  }

  // 画像を縮小して dataURL にする（localStorage の容量対策）
  function shrinkImage(file, max = 480) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(img.width, img.height);
          const sx = (img.width - s) / 2, sy = (img.height - s) / 2; // 中央で正方形に切る
          const size = Math.min(max, s);
          const c = document.createElement('canvas'); c.width = size; c.height = size;
          c.getContext('2d').drawImage(img, sx, sy, s, s, 0, 0, size, size);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject; img.src = fr.result;
      };
      fr.onerror = reject; fr.readAsDataURL(file);
    });
  }

  function bindEdit(id) {
    const form = $('#editForm'); if (!form) return;
    const rerender = () => { const y = window.scrollY; $('#view').innerHTML = viewEdit(id); bindEdit(id); window.scrollTo(0, y); };

    form.addEventListener('input', (e) => {
      const el = e.target;
      if (el.dataset.k) {
        const k = el.dataset.k;
        if (el.dataset.part) { draft[k] = bdValue(el.closest('.bd-pick')); return; }
        if (k.startsWith('em.')) { draft.emergency = draft.emergency || {}; draft.emergency[k.slice(3)] = el.value; }
        else draft[k] = el.value;
      } else if (el.dataset.r) {
        draft[el.dataset.r][+el.dataset.i][el.dataset.c] = el.dataset.part ? bdValue(el.closest('.bd-pick')) : el.value;
      } else if (el.dataset.lang) {
        draft.languages = draft.languages || {}; draft.languages[el.dataset.lang] = +el.value;
      } else if (el.dataset.skill) {
        const s = el.dataset.skill; draft.skills = draft.skills || [];
        draft.skills = el.checked ? [...new Set([...draft.skills, s])] : draft.skills.filter((x) => x !== s);
      }
    });
    form.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]'); const del = e.target.closest('[data-del]');
      if (add) { const k = add.dataset.add; draft[k] = draft[k] || []; draft[k].push({ ...REPEATS[k].blank }); rerender(); }
      if (del) { draft[del.dataset.del].splice(+del.dataset.i, 1); rerender(); }
    });
    $('#photoIn').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { draft.photo = await shrinkImage(f); rerender(); } catch (err) { alert('写真を読み込めませんでした。'); }
    });
    const pd = $('#photoDel'); if (pd) pd.addEventListener('click', () => { draft.photo = null; rerender(); });
    const cb = $('#cancelBtn'); if (cb) cb.addEventListener('click', () => { draft = null; });
    const db = $('#delBtn');
    if (db) db.addEventListener('click', async () => {
      if (!confirm(`${draft.nameEn} さんのデータを削除します。休暇申請と勤怠の記録も一緒に消え、元に戻せません。よろしいですか？\n（辞めた人は「状態: 退職」にすると記録が残ります）`)) return;
      const delId = draft.id; const next = staff.filter((x) => x.id !== delId);
      try { await Store.deleteStaff(delId, next); staff = next; draft = null; toast('削除しました'); location.hash = '#/staff'; }
      catch (err) { alert('削除できませんでした: ' + err.message); }
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!String(draft.nameEn || '').trim()) { alert('名前（英字）を入れてください。'); return; }
      const clean = JSON.parse(JSON.stringify(draft)); delete clean._for;
      // 空の行は保存しない
      clean.education = (clean.education || []).filter((r) => r.school || r.period);
      clean.qualifications = (clean.qualifications || []).filter((r) => r.name);
      clean.trainings = (clean.trainings || []).filter((r) => r.title);
      clean.gifts = (clean.gifts || []).filter((r) => r.item);
      clean.careerBefore = (clean.careerBefore || []).filter((r) => r.company || r.duty);
      clean.careerAfter = (clean.careerAfter || []).filter((r) => r.role || r.duty);
      clean.dreams = (clean.dreams || []).filter((r) => r.text);
      clean.familyMembers = (clean.familyMembers || []).filter((r) => r.relation || r.name || r.birthday || r.note);
      // 2月30日のような、ない日付は止める
      const badDate = [clean.birthday, ...clean.familyMembers.map((r) => r.birthday)].find((s) => {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return false;
        const d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getMonth() !== +m[2] - 1;
      });
      if (badDate) { alert(`${badDate} という日付はありません。日を選び直してください。`); return; }
      clean.notes = (clean.notes || []).filter((r) => r.text);
      const isNew = id === 'new';
      if (isNew && CLOUD) {
        clean.id = String(clean.id || '').trim().toUpperCase();
        if (!/^STAFF-\d{3,}$/.test(clean.id)) { alert('スタッフIDは「STAFF-006」のような形で入れてください。'); return; }
        if (byId(clean.id)) { alert(`${clean.id} はすでに使われています。別の番号にしてください。`); return; }
      }
      if (await persist(clean, isNew)) { draft = null; toast('保存しました'); location.hash = '#/staff/' + clean.id; }
    });
  }

  // ---------- 画面: 誕生日カレンダー ----------
  function viewBirthdays() {
    const act = active(); const nowM = todayYMD().getMonth();
    return `
      <div class="page-head"><div><h1 class="page-title">誕生日カレンダー</h1><p class="page-sub">在籍・休職中のスタッフと、その家族（奥さん・子どもなど）。プレゼントの準備に使ってください。</p></div></div>
      <div class="months">${Array.from({ length: 12 }, (_, m) => {
        const list = birthdayEvents(act).filter((e) => parseYMD(e.bd).getMonth() === m)
          .sort((a, b) => parseYMD(a.bd).getDate() - parseYMD(b.bd).getDate());
        return `<section class="card month ${m === nowM ? 'now' : ''}"><h3>${m + 1}月<span>${list.length ? list.length + '人' : ''}</span></h3>
          ${list.map((e) => `<a class="bd-item ${e.who ? 'is-family' : ''}" href="#/staff/${esc(e.p.id)}"><span class="d">${parseYMD(e.bd).getDate()}日</span>${avatar(e.p, 'av-40')}<span>${esc(e.p.nickname || e.p.nameEn)}${e.who ? `<span class="fam-tag">${esc(e.who)}</span>` : ''}<br><span style="font-size:11.5px;color:var(--ink-3)">${age(e.bd) + (daysToBirthday(e.bd) === 0 ? 0 : 1)}歳に</span></span></a>`).join('') || '<p class="empty">—</p>'}
        </section>`; }).join('')}</div>`;
  }

  // ---------- 画面: データと設定 ----------
  function viewSettings() {
    const nSample = staff.filter((p) => p.sample).length;
    if (CLOUD) return `
      <div class="page-head"><div><h1 class="page-title">データと設定</h1></div></div>
      <div class="note-box" style="margin-bottom:16px"><b>本番につながっています</b>
        <ul><li>データは Supabase に保存され、日本メンバーのログインでだけ見られます。</li>
        <li>自動バックアップがないため、週に1回「書き出す」で Google ドライブへ保管してください。</li></ul></div>
      <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>バックアップ</h2>
        <p class="page-sub">個人情報を含みます。共有リンクの付いたフォルダには置かないでください。</p>
        <button class="btn btn-dark" id="exportBtn">書き出す（JSON）</button>
      </section>`;
    return `
      <div class="page-head"><div><h1 class="page-title">データと設定</h1></div></div>
      <div class="note-box" style="margin-bottom:16px"><b>試作版について</b>
        <ul>
          <li>いま入っている人物はすべて<b>架空のサンプル</b>です（${nSample}人）。</li>
          <li>入力したデータは<b>このパソコンのこのブラウザの中だけ</b>に保存されます。ほかの人やほかのパソコンからは見えません。</li>
          <li>本番では、日本メンバーごとのログインと閲覧権限を付け、データは暗号化されたクラウドの台帳に置きます。</li>
        </ul></div>
      <div class="settings-grid">
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>サンプルを消す</h2>
          <p class="page-sub">本物のスタッフを入れる前に、架空のサンプルを消せます。</p>
          <button class="btn btn-danger" id="clearSample" ${nSample ? '' : 'disabled'}>サンプル ${nSample}人を消す</button>
          <button class="btn" id="restoreSample" style="margin-left:6px">サンプルを入れ直す</button>
        </section>
        <section class="card card-pad"><h2 class="card-title"><span class="mark"></span>バックアップ</h2>
          <p class="page-sub">ファイルに書き出して保管・別のパソコンへ移せます（個人情報を含むので扱いに注意）。</p>
          <button class="btn btn-dark" id="exportBtn">書き出す（JSON）</button>
          <label class="btn" style="margin-left:6px"><input type="file" id="importIn" accept="application/json,.json" hidden>読み込む</label>
        </section>
      </div>`;
  }
  function bindSettings() {
    const cs = $('#clearSample');
    if (cs) cs.addEventListener('click', () => {
      if (!confirm('サンプルの人物をすべて消します。よろしいですか？')) return;
      staff = staff.filter((p) => !p.sample); if (saveAllDemo()) { toast('サンプルを消しました'); route(); }
    });
    const rs = $('#restoreSample');
    if (rs) rs.addEventListener('click', () => {
      const ids = new Set(staff.map((p) => p.id));
      (window.SAMPLE_STAFF || []).forEach((s) => { if (!ids.has(s.id)) staff.push(JSON.parse(JSON.stringify(s))); });
      if (saveAllDemo()) { toast('サンプルを入れ直しました'); route(); }
    });
    $('#exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ app: 'samurai-staff', version: 1, exportedAt: new Date().toISOString(), staff, leaves }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      const t = todayYMD(); a.download = `staff_${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}.json`;
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    const imp = $('#importIn');
    if (imp) imp.addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const data = JSON.parse(fr.result); const list = Array.isArray(data) ? data : data.staff;
          if (!Array.isArray(list) || !list.every(isValidPerson)) throw new Error('形式');
          if (!confirm(`${list.length}人分のデータで置き換えます。いまのデータは消えます。よろしいですか？`)) return;
          staff = list; if (saveAllDemo()) { toast('読み込みました'); route(); }
        } catch (err) { alert('このファイルは読み込めません。'); }
      };
      fr.readAsText(f);
    });
  }

  // ---------- ルーター ----------
  function route() {
    const h = location.hash.replace(/^#\/?/, '') || 'home';
    const [page, id] = h.split('/');
    if (page !== 'edit') draft = null;
    const view = $('#view');
    document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === (page === 'edit' ? 'staff' : page)));
    if (page === 'staff' && id) { view.innerHTML = viewProfile(id); bindProfile(id); }
    else if (page === 'staff') { view.innerHTML = viewStaff(); bindStaff(); }
    else if (page === 'edit') { view.innerHTML = viewEdit(id || 'new'); bindEdit(id || 'new'); }
    else if (page === 'birthdays') { view.innerHTML = viewBirthdays(); }
    else if (page === 'leaves') { view.innerHTML = viewLeaves(); bindLeaves(); }
    else if (page === 'settings') { view.innerHTML = viewSettings(); bindSettings(); }
    else { view.innerHTML = viewHome(); }
    if (route._last !== h) { window.scrollTo(0, 0); route._last = h; }
  }
  let lastProfile = null;
  window.addEventListener('hashchange', () => {
    const m = /^#\/staff\/(.+)$/.exec(location.hash);
    if (m && m[1] !== lastProfile) { profileTab = 'basic'; lastProfile = m[1]; }
    route();
  });

  // ---------- ログインと画面の振り分け ----------
  // 管理者（日本メンバー）→ 名鑑の画面／現場スタッフ → 休暇申請だけの画面
  async function enter(me) {
    ME = me;
    $('#login').hidden = true;
    if (me.role === 'staff') {
      $('#app').hidden = true; $('#staffApp').hidden = false;
      await StaffScreen.render(me, $('#staffApp'), signOut);
      return;
    }
    $('#staffApp').hidden = true;
    try { await load(); } catch (e) { alert('データを読めませんでした: ' + e.message); }
    $('#whoami').textContent = me.displayName;
    $('#app').hidden = false; updateBadge(); route();
  }
  async function signOut() {
    await Store.signOut(); ME = null; staff = []; leaves = []; draft = null;
    // 共用のパソコンで他人のデータが画面の裏に残らないよう、描いたものを消す
    $('#view').innerHTML = ''; $('#staffApp').innerHTML = ''; $('#loginPw').value = '';
    $('#app').hidden = true; $('#staffApp').hidden = true; showLogin();
  }
  function showLogin() {
    $('#login').hidden = false;
    StaffScreen.renderLogin($('#login'));
    $('#loginDemo').hidden = CLOUD; // デモのときだけ「試しに入る」ボタンを出す
    $('#loginNote').textContent = CLOUD ? '日本メンバーと現場スタッフで、入ったあとの画面が分かれます。' : 'いまはデモです（データはこのブラウザだけ・人物は架空）。下のボタンで画面を試せます。';
  }
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#loginErr'); err.hidden = true;
    try { await enter(await Store.signIn($('#loginId').value, $('#loginPw').value)); }
    catch (x) { err.textContent = x.code === 'BAD_LOGIN' ? StaffScreen.loginFailedText() : (x.message || StaffScreen.loginFailedText()); err.hidden = false; }
  });
  document.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', async () => enter(await Store.demoSignIn(b.dataset.demo))));
  $('#logoutBtn').addEventListener('click', signOut);

  (async () => {
    let me = null;
    try { me = await Store.currentUser(); } catch (e) { me = null; }
    if (Store.configError) { document.body.innerHTML = `<div class="login"><div class="login-card"><p class="login-err">${esc(Store.configError)}</p></div></div>`; return; }
    if (me) { try { await enter(me); } catch (e) { showLogin(); } } else showLogin();
  })();
})();

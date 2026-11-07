// =============================================================
// 現場スタッフ用の画面（タブ2つ）
//   ① 休みの申請 … 自分の申請と結果だけ見られる
//   ② 自分のこと … 時間のあるときに、名前・誕生日・出身・家族などを入れて送る（自己申告）
//      送った内容は「確認待ち」で保存され、日本メンバーが確認して名鑑に反映する
// - 名鑑（ほかの人のカルテ）は見られない
// - 文言は クメール語／英語／日本語。クメール語は Panha 校閲済み（i18n/km.json・km_me.json と各 review.md）
// =============================================================
(function () {
  'use strict';
  const EN = {
    hello: 'Hello, {name}', request_title: 'Request a day off', from: 'From', to: 'To', type: 'Type',
    type_dayoff: 'Day off', type_sick: 'Sick', type_family: 'Family matter', type_other: 'Other',
    reason: 'Reason (optional)', send: 'Send request', sent_ok: 'Request sent. Please wait for approval.',
    need_dates: 'Please choose the dates.', bad_range: 'The end date is before the start date.',
    my_requests: 'Your requests', none_yet: 'No requests yet.', st_pending: 'Waiting', st_approved: 'Approved',
    st_rejected: 'Not approved', st_cancelled: 'Cancelled', cancel_req: 'Cancel this request', days: '{n} days',
    admin_note: 'Note from the Japan team', urgent_tip: 'If it is urgent, please also tell your leader on Telegram.',
    signout: 'Sign out', signin: 'Sign in', login_id: 'Login ID', password: 'Password', login_failed: 'Login failed. Check your ID and password.',
    // 自分のこと
    tab_leave: 'Day off', tab_me: 'About me', me_title: 'Tell us about yourself',
    me_lead: 'Fill in what you can, when you have time. You can send it again later.',
    f_name_km: 'Your name in Khmer', f_name_en: 'Your name in English (as on your ID card)', f_birthday: 'Date of birth',
    f_year: 'Year', f_month: 'Month', f_day: 'Day', f_province: 'Province you were born in', f_hometown: 'Village, commune, district',
    f_phone: 'Phone number', f_family: 'Your family', f_family_tip: 'Add your wife or husband, children and parents. Birthday is optional.',
    f_relation: 'Relationship', rel_wife: 'Wife', rel_husband: 'Husband', rel_son: 'Son', rel_daughter: 'Daughter', rel_father: 'Father',
    rel_mother: 'Mother', rel_sibling: 'Brother or sister', rel_grand: 'Grandparent', rel_other: 'Other', f_fname: 'Name',
    f_add_family: '+ Add a family member', f_remove: 'Remove', f_likes: 'What do you like? (hobbies, food, sports)',
    f_dream: 'Your dream, or what you want to do in the future', f_school: 'Schools you went to', f_jobs: 'Jobs before Samurai Motors',
    f_emergency: 'Emergency contact', f_em_name: 'Name', f_em_rel: 'Relationship', f_em_phone: 'Phone', optional: '(optional)',
    send_me: 'Send', me_sent: 'Thank you! The Japan team will check it.', me_last: 'Last sent: {date}',
    me_st_pending: 'Waiting for check', me_st_applied: 'Added to your profile', me_st_dismissed: 'Checked',
    me_empty: 'Please fill in at least one item.',
    rel_brother_older: 'Older brother', rel_sister_older: 'Older sister', rel_brother_younger: 'Younger brother', rel_sister_younger: 'Younger sister',
    f_fnote: 'What they do (job or school)', f_home_loc: 'Where you live now', f_village_loc: "Your family's home (village)",
    btn_here: 'Use my location now', btn_here_tip: 'Press this when you are at that place.', f_maplink: 'Or paste a Google Maps link',
    loc_saved: 'Location saved', loc_denied: 'Could not get your location. Please allow location, or paste a link.', loc_open: 'Open the map', loc_clear: 'Clear'
  };
  // 日本語（ロン君など日本語が分かるスタッフ向け・やさしい言い方）
  const JA = {
    signin: 'ログイン', login_id: 'ログインID', password: 'パスワード', login_failed: 'ログインできません。IDとパスワードを確かめてください。',
    hello: 'こんにちは、{name}さん', request_title: '休みを申請する', from: '開始日', to: '終了日', type: '種類',
    type_dayoff: '休み', type_sick: '病気', type_family: '家族の用事', type_other: 'その他',
    reason: '理由（書かなくてもOK）', send: '申請を送る', sent_ok: '送りました。承認を待ってください。',
    need_dates: '日付を選んでください。', bad_range: '終了日が開始日より前になっています。',
    my_requests: 'あなたの申請', none_yet: 'まだ申請はありません。', st_pending: '承認待ち', st_approved: '承認されました',
    st_rejected: '承認されませんでした', st_cancelled: '取り消し', cancel_req: 'この申請を取り消す', days: '{n}日',
    admin_note: '日本チームからのメモ', urgent_tip: '急ぐときは、Telegram でリーダーにも伝えてください。',
    signout: 'ログアウト',
    tab_leave: '休みの申請', tab_me: '自分のこと', me_title: 'あなたのことを教えてください',
    me_lead: '時間のあるときに、分かるところだけ入れてください。あとでまた送れます。',
    f_name_km: 'クメール語での名前', f_name_en: '英語での名前（IDカードと同じ）', f_birthday: '生年月日',
    f_year: '年', f_month: '月', f_day: '日', f_province: '生まれた州', f_hometown: '村・区・郡',
    f_phone: '電話番号', f_family: '家族', f_family_tip: '妻・夫、子ども、両親を足してください。誕生日はなくても大丈夫です。',
    f_relation: '続柄', rel_wife: '妻', rel_husband: '夫', rel_son: '息子', rel_daughter: '娘', rel_father: '父',
    rel_mother: '母', rel_sibling: '兄弟姉妹', rel_grand: '祖父母', rel_other: 'その他', f_fname: '名前',
    f_add_family: '＋ 家族を足す', f_remove: '消す', f_likes: '好きなもの（趣味・食べ物・スポーツ）',
    f_dream: '夢・これからしたいこと', f_school: '通った学校', f_jobs: 'サムライモーターズの前の仕事',
    f_emergency: '緊急連絡先', f_em_name: '名前', f_em_rel: '続柄', f_em_phone: '電話', optional: '（任意）',
    send_me: '送る', me_sent: 'ありがとうございます。日本チームが確認します。', me_last: '前回送った日: {date}',
    me_st_pending: '確認待ち', me_st_applied: '登録されました', me_st_dismissed: '確認済み',
    me_empty: '1つ以上入れてください。',
    rel_brother_older: '兄', rel_sister_older: '姉', rel_brother_younger: '弟', rel_sister_younger: '妹',
    f_fnote: '何をしているか（仕事・学校）', f_home_loc: '今住んでいるところ', f_village_loc: '実家（村）',
    btn_here: '今いる場所を使う', btn_here_tip: 'その場所にいるときに押してください。', f_maplink: 'または Google マップのリンクを貼る',
    loc_saved: '場所を入れました', loc_denied: '場所を取れませんでした。位置情報を許可するか、リンクを貼ってください。', loc_open: '地図を開く', loc_clear: '消す'
  };
  let KM = {};
  const LANGS = [['km', 'ខ្មែរ'], ['en', 'English'], ['ja', '日本語']];
  const LANG_KEY = 'smStaff.lang';
  let LANG = (() => { try { return localStorage.getItem(LANG_KEY) || 'km'; } catch (e) { return 'km'; } })();
  let TAB = 'leave';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (vars && k in vars ? vars[k] : `{${k}}`));
  // 選んだ言語で1つだけ出す（クメール語が無いキーは英語で出す）
  const word = (key) => (LANG === 'km' ? KM[key] : LANG === 'ja' ? JA[key] : EN[key]) || EN[key] || key;
  const Tplain = (key, vars) => fill(word(key), vars);
  const T = (key, vars) => `<span class="${LANG === 'km' ? 'km' : ''}">${esc(Tplain(key, vars))}</span>`;
  function setLang(l) { LANG = l; try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* 無視 */ } document.documentElement.lang = l; }
  const langSwitch = () => `<div class="lang-switch" role="group" aria-label="Language">${LANGS.map(([k, l]) => `<button type="button" data-lang-set="${k}" class="${LANG === k ? 'on' : ''} ${k === 'km' ? 'km' : ''}">${l}</button>`).join('')}</div>`;
  function bindLangSwitch(root, rerender) {
    root.querySelectorAll('[data-lang-set]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.langSet); rerender(); }));
  }
  const KINDS = ['dayoff', 'sick', 'family', 'other'];
  const RELS = ['wife', 'husband', 'son', 'daughter', 'father', 'mother', 'brother_older', 'sister_older', 'brother_younger', 'sister_younger', 'grand', 'other'];
  // 場所（今の住まい・実家）。座標があれば Google マップで開ける
  const mapUrl = (loc) => loc && loc.lat != null ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}` : (loc && loc.url) || '';
  function locBlock(key, titleKey, loc) {
    const u = mapUrl(loc);
    return `<div class="s-loc"><span class="s-loc-t">${T(titleKey)} ${T('optional')}</span>
      ${u ? `<p class="s-loc-ok">✓ ${T('loc_saved')} ・ <a href="${esc(u)}" target="_blank" rel="noopener">${T('loc_open')}</a> ・ <button type="button" class="link-btn" data-locclear="${key}">${T('loc_clear')}</button></p>` : ''}
      <button type="button" class="btn btn-block" data-here="${key}">📍 ${T('btn_here')}</button>
      <p class="s-tip" style="margin:4px 0 8px">${T('btn_here_tip')}</p>
      <label class="field"><span>${T('f_maplink')}</span><input data-loclink="${key}" value="${esc(loc && loc.url && loc.lat == null ? loc.url : '')}" placeholder="https://maps.app.goo.gl/..." inputmode="url"></label></div>`;
  }
  const PROVINCES = ['Phnom Penh', 'Kandal', 'Kampong Cham', 'Tbong Khmum', 'Takeo', 'Prey Veng', 'Svay Rieng', 'Kampong Speu',
    'Kampong Chhnang', 'Kampong Thom', 'Kampot', 'Kep', 'Sihanoukville', 'Koh Kong', 'Siem Reap', 'Battambang', 'Banteay Meanchey',
    'Pursat', 'Pailin', 'Oddar Meanchey', 'Preah Vihear', 'Stung Treng', 'Kratie', 'Mondulkiri', 'Ratanakiri'];
  const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

  async function loadKm() {
    const get = async (f) => { try { const r = await fetch(f, { cache: 'no-cache' }); return r.ok ? await r.json() : {}; } catch (e) { return {}; } };
    KM = Object.assign({}, await get('i18n/km.json'), await get('i18n/km_me.json'));
  }

  // 生年月日の「年・月・日」（年だけでもよい）
  function bdPick(name, val, minYear) {
    const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(val || '');
    const y = m ? +m[1] : '', mo = m && m[2] ? +m[2] : '', d = m && m[3] ? +m[3] : '';
    const now = new Date().getFullYear(); const ys = []; for (let i = now; i >= minYear; i--) ys.push(i);
    const sel = (part, list, cur, key) => `<select data-bd="${name}" data-part="${part}" aria-label="${esc(Tplain(key))}"><option value="">${esc(Tplain(key))}</option>${list.map((v) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
    return `<span class="bd-pick">${sel('y', ys, y, 'f_year')}${sel('m', Array.from({ length: 12 }, (_, i) => i + 1), mo, 'f_month')}${sel('d', Array.from({ length: 31 }, (_, i) => i + 1), d, 'f_day')}</span>`;
  }
  function bdRead(root, name) {
    const v = (p) => (root.querySelector(`[data-bd="${name}"][data-part="${p}"]`) || {}).value || '';
    const y = v('y'), m = v('m'), d = v('d'); const p2 = (n) => String(n).padStart(2, '0');
    if (!y) return ''; if (!m) return y; return d ? `${y}-${p2(m)}-${p2(d)}` : `${y}-${p2(m)}`;
  }

  // ---------- 画面 ----------
  async function render(me, root, onSignOut) {
    if (!Object.keys(KM).length) await loadKm();
    root.innerHTML = `
      <div class="staff-wrap">
        <header class="staff-head">
          <img src="assets/logo-mark.jpg" alt="" class="brand-mark">
          <div class="staff-hello">${T('hello', { name: me.displayName })}</div>
          <button class="link-btn" id="sOut">${T('signout')}</button>
        </header>
        ${langSwitch()}
        <div class="s-tabs">
          <button type="button" data-stab="leave" class="${TAB === 'leave' ? 'on' : ''}">${T('tab_leave')}</button>
          <button type="button" data-stab="me" class="${TAB === 'me' ? 'on' : ''}">${T('tab_me')}</button>
        </div>
        <div id="sBody"></div>
      </div>`;
    root.querySelector('#sOut').addEventListener('click', onSignOut);
    bindLangSwitch(root, () => render(me, root, onSignOut));
    root.querySelectorAll('[data-stab]').forEach((b) => b.addEventListener('click', () => { TAB = b.dataset.stab; render(me, root, onSignOut); }));
    const body = root.querySelector('#sBody');
    if (TAB === 'me') await renderMe(me, body); else await renderLeave(me, body);
  }

  // ① 休みの申請
  async function renderLeave(me, root) {
    let list = [];
    try { list = await Store.listLeave(me.staffId); } catch (e) { list = []; }
    const today = new Date(); const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    root.innerHTML = `
        <section class="card card-pad">
          <h2 class="card-title"><span class="mark"></span><span class="t-stack">${T('request_title')}</span></h2>
          <form id="leaveForm" autocomplete="off">
            <div class="s-row">
              <label class="field"><span class="t-stack">${T('from')}</span><input type="date" id="lFrom" min="${ymd(today)}"></label>
              <label class="field"><span class="t-stack">${T('to')}</span><input type="date" id="lTo" min="${ymd(today)}"></label>
            </div>
            <div class="field"><span class="t-stack">${T('type')}</span>
              <div class="kind-btns">${KINDS.map((k, i) => `<label class="kind"><input type="radio" name="lKind" value="${k}" ${i === 0 ? 'checked' : ''}><span class="t-stack">${T('type_' + k)}</span></label>`).join('')}</div>
            </div>
            <label class="field"><span class="t-stack">${T('reason')}</span><textarea id="lReason" maxlength="300"></textarea></label>
            <p class="s-msg" id="lMsg" hidden></p>
            <button class="btn btn-gold btn-block" type="submit"><span class="t-stack">${T('send')}</span></button>
            <p class="s-tip t-stack">${T('urgent_tip')}</p>
          </form>
        </section>
        <section class="card card-pad" style="margin-top:14px">
          <h2 class="card-title"><span class="mark"></span><span class="t-stack">${T('my_requests')}</span></h2>
          ${list.length ? list.map((r) => `
            <div class="s-req st-${esc(r.status)}">
              <div class="s-req-top">
                <b>${esc(r.start_date)}${r.end_date !== r.start_date ? ' – ' + esc(r.end_date) : ''}</b>
                <span class="s-badge t-stack">${T('st_' + r.status)}</span>
              </div>
              <div class="s-req-sub">${T('type_' + r.kind)} ・ ${T('days', { n: days(r.start_date, r.end_date) })}</div>
              ${r.reason ? `<div class="s-req-sub">${esc(r.reason)}</div>` : ''}
              ${r.admin_note ? `<div class="s-note"><span class="t-stack">${T('admin_note')}</span>${esc(r.admin_note)}</div>` : ''}
              ${r.status === 'pending' ? `<button class="btn btn-sm" data-cancel="${esc(r.id)}">${T('cancel_req')}</button>` : ''}
            </div>`).join('') : `<p class="empty t-stack">${T('none_yet')}</p>`}
        </section>`;
    root.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm(Tplain('cancel_req') + '?')) return;
      const id = isNaN(+b.dataset.cancel) ? b.dataset.cancel : +b.dataset.cancel;
      try { await Store.updateLeave(id, { status: 'cancelled' }); } catch (e) { alert(e.message); }
      renderLeave(me, root);
    }));
    root.querySelector('#leaveForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = root.querySelector('#lMsg');
      const from = root.querySelector('#lFrom').value; const to = root.querySelector('#lTo').value || from;
      const show = (key) => { msg.innerHTML = T(key); msg.hidden = false; };
      if (!from) return show('need_dates');
      if (to < from) return show('bad_range');
      const kind = (root.querySelector('input[name=lKind]:checked') || {}).value || 'dayoff';
      const btn = root.querySelector('#leaveForm button[type=submit]');
      if (btn.disabled) return; btn.disabled = true; // 二重送信を防ぐ
      try {
        await Store.createLeave({ staff_id: me.staffId, start_date: from, end_date: to, kind, reason: root.querySelector('#lReason').value.trim() });
        await renderLeave(me, root);
        const m2 = root.querySelector('#lMsg'); m2.innerHTML = T('sent_ok'); m2.hidden = false; m2.classList.add('ok');
      } catch (err) { msg.textContent = err.message; msg.hidden = false; btn.disabled = false; }
    });
  }

  // ② 自分のこと（前回送った内容があれば、それを入れた状態で開く）
  let meDraft = null;
  async function renderMe(me, root) {
    let reports = [];
    try { reports = await Store.listSelfReports(me.staffId); } catch (e) { reports = []; }
    const last = reports[0];
    if (!meDraft) meDraft = JSON.parse(JSON.stringify((last && last.data) || {}));
    const d = meDraft; d.family = d.family || []; d.emergency = d.emergency || {};
    const txt = (key, field, extra = '') => `<label class="field"><span>${T(key)} ${extra}</span><input data-f="${field}" value="${esc(d[field] || '')}" maxlength="200"></label>`;
    const area = (key, field) => `<label class="field"><span>${T(key)} ${T('optional')}</span><textarea data-f="${field}" maxlength="500">${esc(d[field] || '')}</textarea></label>`;
    root.innerHTML = `
      <section class="card card-pad">
        <h2 class="card-title"><span class="mark"></span>${T('me_title')}</h2>
        <p class="s-tip" style="margin:-4px 0 12px">${T('me_lead')}</p>
        ${last ? `<p class="s-last">${T('me_last', { date: esc(String(last.created_at).slice(0, 10)) })} ・ <b>${T('me_st_' + last.status)}</b></p>` : ''}
        <form id="meForm" autocomplete="off">
          ${txt('f_name_km', 'nameKm')}
          ${txt('f_name_en', 'nameEn')}
          <div class="field"><span>${T('f_birthday')}</span>${bdPick('me', d.birthday, 1950)}</div>
          <label class="field"><span>${T('f_province')}</span><select data-f="birthplace"><option value="">—</option>${PROVINCES.map((p) => `<option ${d.birthplace === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
          ${txt('f_hometown', 'hometown')}
          ${txt('f_phone', 'phone', T('optional'))}
          ${locBlock('homeLoc', 'f_home_loc', d.homeLoc)}
          ${locBlock('villageLoc', 'f_village_loc', d.villageLoc)}

          <h3 class="s-h3">${T('f_family')}</h3>
          <p class="s-tip" style="margin:-4px 0 8px">${T('f_family_tip')}</p>
          <div id="famRows">${d.family.map((f, i) => `
            <div class="s-fam">
              <label class="field"><span>${T('f_relation')}</span><select data-fam="${i}" data-c="relation"><option value="">—</option>${RELS.map((r) => `<option value="${r}" ${f.relation === r ? 'selected' : ''}>${esc(Tplain('rel_' + r))}</option>`).join('')}</select></label>
              <label class="field"><span>${T('f_fname')}</span><input data-fam="${i}" data-c="name" value="${esc(f.name || '')}" maxlength="100"></label>
              <div class="field"><span>${T('f_birthday')} ${T('optional')}</span>${bdPick('fam' + i, f.birthday, 1930)}</div>
              <label class="field"><span>${T('f_fnote')} ${T('optional')}</span><input data-fam="${i}" data-c="note" value="${esc(f.note || '')}" maxlength="100"></label>
              <button type="button" class="btn btn-sm" data-famdel="${i}">${T('f_remove')}</button>
            </div>`).join('')}</div>
          <button type="button" class="btn btn-sm" id="famAdd">${T('f_add_family')}</button>

          <h3 class="s-h3">${T('f_emergency')} ${T('optional')}</h3>
          <div class="s-row">
            <label class="field"><span>${T('f_em_name')}</span><input data-em="name" value="${esc(d.emergency.name || '')}" maxlength="100"></label>
            <label class="field"><span>${T('f_em_rel')}</span><input data-em="relation" value="${esc(d.emergency.relation || '')}" maxlength="50"></label>
          </div>
          <label class="field"><span>${T('f_em_phone')}</span><input data-em="phone" value="${esc(d.emergency.phone || '')}" maxlength="50"></label>

          ${area('f_likes', 'likes')}
          ${area('f_dream', 'dream')}
          ${area('f_school', 'school')}
          ${area('f_jobs', 'jobs')}
          <p class="s-msg" id="meMsg" hidden></p>
          <button class="btn btn-gold btn-block" type="submit">${T('send_me')}</button>
        </form>
      </section>`;

    const form = root.querySelector('#meForm');
    // 入力をそのつど下書きに入れる（家族の行を足しても消えないように）
    const sync = () => {
      form.querySelectorAll('[data-f]').forEach((el) => { d[el.dataset.f] = el.value.trim(); });
      form.querySelectorAll('[data-em]').forEach((el) => { d.emergency[el.dataset.em] = el.value.trim(); });
      form.querySelectorAll('[data-fam]').forEach((el) => { d.family[+el.dataset.fam][el.dataset.c] = el.value.trim(); });
      d.birthday = bdRead(form, 'me');
      d.family.forEach((f, i) => { f.birthday = bdRead(form, 'fam' + i); });
      form.querySelectorAll('[data-loclink]').forEach((el) => { const v = el.value.trim(); if (v) d[el.dataset.loclink] = { url: v }; });
    };
    form.addEventListener('input', sync);
    form.addEventListener('change', sync);
    root.querySelectorAll('[data-here]').forEach((b) => b.addEventListener('click', () => {
      sync(); const key = b.dataset.here; const msg = root.querySelector('#meMsg');
      if (!navigator.geolocation) { msg.innerHTML = T('loc_denied'); msg.hidden = false; return; }
      b.disabled = true;
      navigator.geolocation.getCurrentPosition((pos) => {
        d[key] = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6), acc: Math.round(pos.coords.accuracy) };
        renderMe(me, root);
      }, () => { b.disabled = false; msg.innerHTML = T('loc_denied'); msg.hidden = false; }, { enableHighAccuracy: true, timeout: 15000 });
    }));
    root.querySelectorAll('[data-locclear]').forEach((b) => b.addEventListener('click', () => { sync(); delete d[b.dataset.locclear]; renderMe(me, root); }));
    root.querySelector('#famAdd').addEventListener('click', () => { sync(); d.family.push({ relation: '', name: '', birthday: '', note: '' }); renderMe(me, root); });
    root.querySelectorAll('[data-famdel]').forEach((b) => b.addEventListener('click', () => { sync(); d.family.splice(+b.dataset.famdel, 1); renderMe(me, root); }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); sync();
      const msg = root.querySelector('#meMsg');
      const clean = JSON.parse(JSON.stringify(d));
      clean.family = clean.family.filter((f) => f.relation || f.name || f.birthday);
      const filled = Object.entries(clean).some(([k, v]) => k === 'family' ? v.length : k === 'emergency' ? Object.values(v).some(Boolean) : !!v);
      if (!filled) { msg.innerHTML = T('me_empty'); msg.hidden = false; return; }
      const btn = form.querySelector('button[type=submit]'); if (btn.disabled) return; btn.disabled = true;
      try {
        await Store.createSelfReport(me.staffId, clean);
        meDraft = null; await renderMe(me, root);
        const m2 = root.querySelector('#meMsg'); m2.innerHTML = T('me_sent'); m2.hidden = false; m2.classList.add('ok');
      } catch (err) { msg.textContent = err.message; msg.hidden = false; btn.disabled = false; }
    });
  }

  // ログイン画面の文言も選んだ言語にする
  async function renderLogin(root) {
    if (!Object.keys(KM).length) await loadKm();
    const slot = root.querySelector('#loginLang');
    slot.innerHTML = langSwitch();
    const set = (sel, key) => { const el = root.querySelector(sel); if (el) { el.textContent = Tplain(key); el.classList.toggle('km', LANG === 'km'); } };
    set('#lblId', 'login_id'); set('#lblPw', 'password'); set('#loginSubmit', 'signin');
    bindLangSwitch(slot, () => renderLogin(root));
  }
  const loginFailedText = () => Tplain('login_failed');
  const reset = () => { meDraft = null; TAB = 'leave'; };

  window.StaffScreen = { render, renderLogin, loginFailedText, loadKm, reset, T, Tplain };
})();

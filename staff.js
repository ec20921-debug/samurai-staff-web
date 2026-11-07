// =============================================================
// 現場スタッフ用の画面（休暇申請だけ）
// - 見られるのは「自分の申請と結果」だけ。名鑑（ほかの人のカルテ）は見られない
// - 文言は英語＋クメール語。クメール語は Panha 校閲済み（i18n/km.json・km_review.md）
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
    signout: 'Sign out'
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
    signout: 'ログアウト'
  };
  Object.assign(EN, { signin: 'Sign in', login_id: 'Login ID', password: 'Password', login_failed: 'Login failed. Check your ID and password.' });
  let KM = {};
  const LANGS = [['km', 'ខ្មែរ'], ['en', 'English'], ['ja', '日本語']];
  const LANG_KEY = 'smStaff.lang';
  let LANG = (() => { try { return localStorage.getItem(LANG_KEY) || 'km'; } catch (e) { return 'km'; } })();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (vars && k in vars ? vars[k] : `{${k}}`));
  // 選んだ言語で1つだけ出す（クメール語が無いキーは英語で出す）
  const word = (key) => (LANG === 'km' ? KM[key] : LANG === 'ja' ? JA[key] : EN[key]) || EN[key] || key;
  const Tplain = (key, vars) => fill(word(key), vars);
  const T = (key, vars) => `<span class="${LANG === 'km' ? 'km' : ''}">${esc(Tplain(key, vars))}</span>`;
  function setLang(l) { LANG = l; try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* 無視 */ } document.documentElement.lang = l; }
  // 言語の切り替えボタン
  const langSwitch = () => `<div class="lang-switch" role="group" aria-label="Language">${LANGS.map(([k, l]) => `<button type="button" data-lang-set="${k}" class="${LANG === k ? 'on' : ''} ${k === 'km' ? 'km' : ''}">${l}</button>`).join('')}</div>`;
  function bindLangSwitch(root, rerender) {
    root.querySelectorAll('[data-lang-set]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.langSet); rerender(); }));
  }
  const KINDS = ['dayoff', 'sick', 'family', 'other'];
  const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

  async function loadKm() {
    try { const r = await fetch('i18n/km.json', { cache: 'no-cache' }); if (r.ok) KM = await r.json(); } catch (e) { KM = {}; }
  }

  async function render(me, root, onSignOut) {
    if (!Object.keys(KM).length) await loadKm();
    let list = [];
    try { list = await Store.listLeave(me.staffId); } catch (e) { list = []; }
    const today = new Date(); const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    root.innerHTML = `
      <div class="staff-wrap">
        <header class="staff-head">
          <img src="assets/logo-mark.jpg" alt="" class="brand-mark">
          <div class="staff-hello">${T('hello', { name: me.displayName })}</div>
          <button class="link-btn" id="sOut">${T('signout')}</button>
        </header>
        ${langSwitch()}
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
        </section>
      </div>`;

    root.querySelector('#sOut').addEventListener('click', onSignOut);
    bindLangSwitch(root, () => render(me, root, onSignOut));
    root.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm(Tplain('cancel_req') + '?')) return;
      const id = isNaN(+b.dataset.cancel) ? b.dataset.cancel : +b.dataset.cancel;
      try { await Store.updateLeave(id, { status: 'cancelled' }); } catch (e) { alert(e.message); }
      render(me, root, onSignOut);
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
        await render(me, root, onSignOut);
        const m2 = root.querySelector('#lMsg'); m2.innerHTML = T('sent_ok'); m2.hidden = false; m2.classList.add('ok');
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

  window.StaffScreen = { render, renderLogin, loginFailedText, loadKm, T, Tplain };
})();

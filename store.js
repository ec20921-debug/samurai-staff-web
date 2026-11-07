// =============================================================
// データの出し入れ（Supabase につながっていれば本番、なければ試作のデモ）
//   本番: config.js に Supabase の URL と anon key が入っているとき
//   デモ: それ以外。データはこのブラウザの localStorage だけ（架空のサンプル）
// =============================================================
(function () {
  'use strict';
  const cfg = window.STAFF_APP_CONFIG || {};
  const configured = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  // 設定があるのに部品が読めないときは、黙ってデモにせず止める（本番のつもりで手元に保存してしまうのを防ぐ）
  const configError = configured && !window.supabase ? '本番への接続部品を読み込めませんでした。通信を確かめて、ページを読み込み直してください。' : '';
  const cloud = configured && !!window.supabase;
  const sb = cloud ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  const EMAIL_DOMAIN = cfg.emailDomain || 'staff.samurai-motors.invalid';

  const LS = { staff: 'smStaff.v1', leave: 'smStaff.leave.v1', me: 'smStaff.demoMe' };
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const ssGet = (k) => { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const ssSet = (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 無視 */ } };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const fail = (e) => { throw new Error((e && e.message) || String(e)); };

  // 1人分として使える形か
  const isValidPerson = (p) => p && typeof p === 'object' && typeof p.id === 'string' && typeof p.nameEn === 'string';

  // デモ用: 現場スタッフとして入ったときの「自分」
  const DEMO_STAFF_ME = { role: 'staff', displayName: 'Vanna（デモ）', staffId: 's2', loginId: 'demo-staff' };
  const DEMO_ADMIN_ME = { role: 'admin', displayName: '日本メンバー（デモ）', staffId: null, loginId: 'demo-admin' };

  const Store = {
    mode: cloud ? 'cloud' : 'demo',
    configError,

    // ---------- ログイン ----------
    async currentUser() {
      if (!cloud) return ssGet(LS.me);
      const { data } = await sb.auth.getSession();
      if (!data.session) return null;
      return Store._loadMe();
    },
    async _loadMe() {
      // 管理者は全員分の行が読めるので、必ず自分の user_id で絞る
      const { data: u } = await sb.auth.getUser();
      if (!u || !u.user) fail('ログインが切れました');
      const { data, error } = await sb.from('app_users').select('login_id, display_name, role, staff_id').eq('user_id', u.user.id).maybeSingle();
      if (error || !data) { await sb.auth.signOut(); fail(error || 'このIDは名鑑に登録されていません'); }
      return { role: data.role, displayName: data.display_name, staffId: data.staff_id, loginId: data.login_id };
    },
    async signIn(loginId, password) {
      const id = String(loginId || '').trim().toLowerCase();
      if (!cloud) { // デモ: ID が staff ならスタッフ画面、それ以外は管理者画面
        const me = id === 'staff' ? DEMO_STAFF_ME : DEMO_ADMIN_ME;
        ssSet(LS.me, me); return me;
      }
      // 「suzuki」のような ID でも、メールアドレスそのものでも入れる
      const email = id.includes('@') ? id : `${id}@${EMAIL_DOMAIN}`;
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { const e = new Error('IDかパスワードが違います'); e.code = 'BAD_LOGIN'; throw e; }
      return Store._loadMe();
    },
    async demoSignIn(role) { if (cloud) fail('本番ではデモで入れません'); const me = role === 'staff' ? DEMO_STAFF_ME : DEMO_ADMIN_ME; ssSet(LS.me, me); return me; },
    async signOut() { if (cloud) await sb.auth.signOut(); ssSet(LS.me, null); },

    // ---------- スタッフ（名鑑）: 管理者だけ ----------
    async loadStaff() {
      if (!cloud) {
        const data = lsGet(LS.staff, null);
        return Array.isArray(data) ? data.filter(isValidPerson) : clone(window.SAMPLE_STAFF || []);
      }
      const { data, error } = await sb.from('staff').select('id, profile').order('id');
      if (error) fail(error);
      return (data || []).map((r) => ({ ...r.profile, id: r.id })).filter(isValidPerson);
    },
    // isNew=true のときは新規だけ（同じ ID がすでにあれば失敗させ、上書きしない）
    async saveStaff(person, all, isNew) {
      if (!cloud) { if (!lsSet(LS.staff, all)) fail('保存できませんでした（写真が大きすぎる可能性があります）'); return; }
      const profile = clone(person);
      if (isNew) {
        const { error } = await sb.from('staff').insert({ id: person.id, business: 'motors', profile });
        if (error) fail(error.code === '23505' ? `${person.id} はすでに使われています。別の番号にしてください` : error);
        return;
      }
      const { data, error } = await sb.from('staff').update({ profile }).eq('id', person.id).select('id');
      if (error) fail(error);
      if (!data || !data.length) fail('保存できませんでした（このスタッフが見つかりません）');
    },
    async deleteStaff(id, all) {
      if (!cloud) { lsSet(LS.staff, all); return; }
      const { error } = await sb.from('staff').delete().eq('id', id);
      if (error) fail(error);
    },
    saveAllDemo(all) { if (!cloud) return lsSet(LS.staff, all); return false; },

    // ---------- 休暇申請 ----------
    async listLeave(staffId) {
      if (!cloud) {
        const all = lsGet(LS.leave, window.SAMPLE_LEAVE ? clone(window.SAMPLE_LEAVE) : []);
        return (staffId ? all.filter((r) => r.staff_id === staffId) : all).sort((a, b) => b.created_at.localeCompare(a.created_at));
      }
      let q = sb.from('leave_requests').select('*').order('created_at', { ascending: false });
      if (staffId) q = q.eq('staff_id', staffId);
      const { data, error } = await q;
      if (error) fail(error);
      return data || [];
    },
    async createLeave(req) {
      if (!cloud) {
        const all = lsGet(LS.leave, window.SAMPLE_LEAVE ? clone(window.SAMPLE_LEAVE) : []);
        all.push({ ...req, id: Date.now(), status: 'pending', admin_note: '', created_at: new Date().toISOString() });
        lsSet(LS.leave, all); return;
      }
      const { error } = await sb.from('leave_requests').insert(req);
      if (error) fail(error);
    },
    async updateLeave(id, patch) {
      if (!cloud) {
        const all = lsGet(LS.leave, window.SAMPLE_LEAVE ? clone(window.SAMPLE_LEAVE) : []);
        const r = all.find((x) => x.id === id); if (r) Object.assign(r, patch, patch.status && patch.status !== 'cancelled' ? { decided_at: new Date().toISOString() } : {});
        lsSet(LS.leave, all); return;
      }
      const { data, error } = await sb.from('leave_requests').update(patch).eq('id', id).select('id');
      if (error) fail(error);
      if (!data || !data.length) fail('更新できませんでした（状態が変わっている可能性があります。画面を読み込み直してください）');
    },

    // ---------- 自己申告（本人が「自分のこと」を送る → 日本メンバーが確認して名鑑へ反映） ----------
    async listSelfReports(staffId) {
      if (!cloud) {
        const all = lsGet('smStaff.self.v1', []);
        return (staffId ? all.filter((r) => r.staff_id === staffId) : all).sort((a, b) => b.created_at.localeCompare(a.created_at));
      }
      let q = sb.from('self_reports').select('*').order('created_at', { ascending: false });
      if (staffId) q = q.eq('staff_id', staffId);
      const { data, error } = await q;
      if (error) fail(error);
      return data || [];
    },
    async createSelfReport(staffId, data) {
      if (!cloud) {
        const all = lsGet('smStaff.self.v1', []);
        all.push({ id: Date.now(), staff_id: staffId, data, status: 'pending', created_at: new Date().toISOString() });
        lsSet('smStaff.self.v1', all); return;
      }
      const { error } = await sb.from('self_reports').insert({ staff_id: staffId, data });
      if (error) fail(error);
    },
    async setSelfReportStatus(id, status) {
      if (!cloud) {
        const all = lsGet('smStaff.self.v1', []); const r = all.find((x) => x.id === id);
        if (r) { r.status = status; r.reviewed_at = new Date().toISOString(); }
        lsSet('smStaff.self.v1', all); return;
      }
      const { data, error } = await sb.from('self_reports').update({ status }).eq('id', id).select('id');
      if (error) fail(error);
      if (!data || !data.length) fail('更新できませんでした');
    },

    // ---------- 勤怠（本体シートの写し） ----------
    async attendance(staffId, fromYMD) {
      if (!cloud) return null; // デモは画面側で仮の数字を作る
      const { data, error } = await sb.from('attendance_daily').select('work_date, clock_in, clock_out, work_minutes')
        .eq('staff_id', staffId).gte('work_date', fromYMD).order('work_date');
      if (error) fail(error);
      return data || [];
    },

    // ---------- AI ----------
    async ai(action, payload) {
      if (!cloud) return { demo: true };
      const { data, error } = await sb.functions.invoke('ai', { body: { action, ...payload } });
      if (error) {
        let msg = error.message;
        try { const b = await error.context.json(); if (b && b.error) msg = b.error; } catch (e) { /* 無視 */ }
        fail(msg);
      }
      if (data && data.error) fail(data.error);
      return data.result;
    }
  };
  window.Store = Store;
})();

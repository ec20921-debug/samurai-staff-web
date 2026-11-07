// 試作用のサンプルデータ（すべて架空の人物。実在のスタッフ情報ではない）
// 本番では使わない。「データと設定」画面からまとめて消せる。
window.SAMPLE_STAFF = [
  {
    id: 's1', sample: true,
    nameEn: 'Sokha Chan', nickname: 'ソカ', nameKm: '',
    photo: null, gender: '男性', birthday: '1998-11-21', birthplace: 'Kampong Cham', hometown: 'Cheung Prey 郡の村',
    careerBefore: [{ period: '2016–2019', company: 'バイク修理店（地元）', duty: 'バイクの修理・洗車' }, { period: '2019–2025', company: 'プノンペンの洗車場', duty: '洗車・接客' }],
    careerAfter: [{ date: '2025-06', role: 'WASH 担当', duty: '基本の洗車を担当' }, { date: '2026-02', role: 'GLASS も担当', duty: 'SOFT99 の社内認定に合格' }, { date: '2026-09', role: 'リーダー', duty: '新人の教育と1日の段取り' }],
    dreams: [{ date: '2026-10-01', text: '3年後には自分の班を持ちたい。いつか地元に家を建てて両親を呼びたい。' }],
    address: 'Toul Kork, Phnom Penh', phone: '+855 12 000 001', telegram: '@sample_sokha',
    joinDate: '2025-06-01', role: 'リーダー', employment: '正社員', status: '在籍',
    skills: ['WASH', 'GLASS', 'HEADLIGHT', 'POLISH', 'バイク運転', '英語で接客'],
    languages: { km: 3, en: 2, ja: 1 },
    education: [{ period: '2013–2016', school: 'Kampong Cham High School', note: '卒業' }],
    qualifications: [
      { name: '普通自動二輪の運転免許（カンボジア）', date: '2019-03', note: '' },
      { name: 'SOFT99 ガラスコーティング社内認定', date: '2026-02', note: '社内' }
    ],
    trainings: [
      { date: '2026-02-10', title: 'ガラスコーティング施工', by: '日本側', result: '合格' },
      { date: '2026-09-15', title: 'HEADLIGHT 2択メニューの説明', by: 'リーダー', result: '受講' }
    ],
    family: '両親と妹（地元）', emergency: { name: 'Chan Dara', relation: '父', phone: '+855 12 000 101' },
    likes: 'サッカー観戦（チェルシー）・アイスコーヒー', gifts: [{ year: '2025', item: 'サッカーのユニフォーム' }],
    notes: [{ date: '2026-10-01', by: 'Daisuke', text: '新人の教え方が丁寧。来年は班長を任せたい。' }]
  },
  {
    id: 's2', sample: true,
    nameEn: 'Vanna Sok', nickname: 'ワナ', nameKm: '',
    photo: null, gender: '男性', birthday: '2003-12-05', birthplace: 'Takeo', hometown: 'Bati 郡',
    careerBefore: [{ period: '2021–2026', company: '家の農業の手伝い', duty: '田んぼ・運搬' }],
    careerAfter: [{ date: '2026-11', role: 'WASH 見習い', duty: '試用期間中' }],
    dreams: [{ date: '2026-11-06', text: '日本の仕事のやり方を覚えて、技術で稼げる人になりたい。' }],
    address: 'Sen Sok, Phnom Penh', phone: '+855 12 000 002', telegram: '@sample_vanna',
    joinDate: '2026-11-06', role: 'スタッフ', employment: '試用期間', status: '在籍',
    skills: ['WASH', 'バイク運転'],
    languages: { km: 3, en: 1, ja: 0 },
    education: [{ period: '2018–2021', school: 'Takeo High School', note: '卒業' }],
    qualifications: [{ name: '普通自動二輪の運転免許（カンボジア）', date: '2022-01', note: '' }],
    trainings: [{ date: '2026-11-06', title: '初日オリエンテーション・WASH 基本', by: 'リーダー', result: '受講' }],
    family: '', emergency: { name: '', relation: '', phone: '' },
    likes: '（まだ聞けていない）', gifts: [],
    notes: [{ date: '2026-11-06', by: 'Daisuke', text: '入社初日。まじめで覚えが早い。' }]
  },
  {
    id: 's3', sample: true,
    nameEn: 'Sreymom Heng', nickname: 'モム', nameKm: '',
    photo: null, gender: '女性', birthday: '2000-04-14', birthplace: 'Siem Reap', hometown: 'Siem Reap 市内',
    careerBefore: [{ period: '2022–2025', company: 'ホテルのフロント', duty: '英語での受付・予約' }],
    careerAfter: [{ date: '2026-01', role: '事務・受付', duty: '予約受付と Telegram 対応' }],
    dreams: [{ date: '2026-06-01', text: '日本語を勉強して、日本とカンボジアをつなぐ仕事がしたい。' }],
    address: 'Chamkar Mon, Phnom Penh', phone: '+855 12 000 003', telegram: '@sample_mom',
    joinDate: '2026-01-15', role: '事務・受付', employment: '正社員', status: '在籍',
    skills: ['予約受付', '英語で接客', '写真・動画撮影'],
    languages: { km: 3, en: 3, ja: 1 },
    education: [{ period: '2018–2022', school: 'Royal University of Phnom Penh', note: '英語学科' }],
    qualifications: [{ name: 'IELTS 6.0', date: '2022-08', note: '' }],
    trainings: [{ date: '2026-03-01', title: '予約Botの使い方', by: '日本側', result: '受講' }],
    family: '両親（シェムリアップ）', emergency: { name: 'Heng Srey', relation: '母', phone: '+855 12 000 103' },
    likes: 'お花・タピオカ', gifts: [],
    notes: []
  },
  {
    id: 's4', sample: true,
    nameEn: 'Piseth Meas', nickname: 'ピセット', nameKm: '',
    photo: null, gender: '男性', birthday: '1995-07-30', birthplace: 'Battambang', hometown: 'Sangkae 郡',
    careerBefore: [{ period: '2013–2026', company: '自動車整備工場', duty: '整備・板金の補助' }],
    careerAfter: [{ date: '2026-05', role: 'スタッフ', duty: 'POLISH・DEEP POLISH 担当' }],
    dreams: [],
    address: 'Russey Keo, Phnom Penh', phone: '+855 12 000 004', telegram: '@sample_piseth',
    joinDate: '2026-05-20', role: 'スタッフ', employment: '正社員', status: '在籍',
    skills: ['WASH', 'GLASS', 'POLISH', 'DEEP POLISH', 'バイク運転'],
    languages: { km: 3, en: 1, ja: 0 },
    education: [{ period: '2011–2013', school: 'Battambang Technical School', note: '自動車整備' }],
    qualifications: [{ name: '自動車整備の修了証', date: '2013-09', note: '' }],
    trainings: [{ date: '2026-06-01', title: 'POLISH 施工', by: '日本側', result: '合格' }],
    family: '妻・子1人', emergency: { name: 'Meas Lina', relation: '妻', phone: '+855 12 000 104' },
    likes: '釣り', gifts: [],
    notes: []
  },
  {
    id: 's5', sample: true,
    nameEn: 'Dara Phan', nickname: 'ダラ', nameKm: '',
    photo: null, gender: '男性', birthday: '2001-11-29', birthplace: 'Prey Veng', hometown: '',
    careerBefore: [],
    careerAfter: [{ date: '2026-08', role: 'スタッフ（パート）', duty: 'WASH・HEADLIGHT' }],
    dreams: [],
    address: 'Meanchey, Phnom Penh', phone: '+855 12 000 005', telegram: '@sample_dara',
    joinDate: '2026-08-01', role: 'スタッフ', employment: 'パート', status: '在籍',
    skills: ['WASH', 'HEADLIGHT', 'バイク運転'],
    languages: { km: 3, en: 1, ja: 1 },
    education: [{ period: '2016–2019', school: 'Prey Veng High School', note: '卒業' }],
    qualifications: [],
    trainings: [{ date: '2026-08-01', title: 'WASH 基本', by: 'リーダー', result: '受講' }],
    family: '', emergency: { name: '', relation: '', phone: '' },
    likes: '日本のアニメ', gifts: [],
    notes: []
  },
  {
    id: 's6', sample: true,
    nameEn: 'Kosal Ly', nickname: 'コサル', nameKm: '',
    photo: null, gender: '男性', birthday: '1997-02-03', birthplace: 'Kandal', hometown: '', careerBefore: [], careerAfter: [], dreams: [],
    address: 'Toul Kork, Phnom Penh', phone: '+855 12 000 006', telegram: '@sample_kosal',
    joinDate: '2025-10-01', role: 'スタッフ', employment: '正社員', status: '退職',
    skills: ['WASH', 'GLASS'],
    languages: { km: 3, en: 1, ja: 0 },
    education: [], qualifications: [], trainings: [],
    family: '', emergency: { name: '', relation: '', phone: '' },
    likes: '', gifts: [],
    notes: [{ date: '2026-07-31', by: 'Daisuke', text: '家業を手伝うため退職。円満。' }]
  }
];

// 試作用の休暇申請（架空）
window.SAMPLE_LEAVE = [
  { id: 9001, staff_id: 's5', start_date: '2026-11-14', end_date: '2026-11-15', kind: 'family', reason: '兄の結婚式（地元）', status: 'pending', admin_note: '', created_at: '2026-11-06T09:10:00Z' },
  { id: 9002, staff_id: 's1', start_date: '2026-10-28', end_date: '2026-10-28', kind: 'sick', reason: '熱', status: 'approved', admin_note: 'Take care!', created_at: '2026-10-28T01:00:00Z' },
  { id: 9003, staff_id: 's2', start_date: '2026-11-20', end_date: '2026-11-20', kind: 'dayoff', reason: '', status: 'pending', admin_note: '', created_at: '2026-11-07T02:00:00Z' }
];

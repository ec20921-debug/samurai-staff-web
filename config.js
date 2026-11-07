// =============================================================
// Supabase への接続設定
// - 2つとも空なら「デモ」（このブラウザだけ・架空のサンプル）で動く
// - Supabase の「Project Settings → API」にある Project URL と anon public key を入れると本番になる
//   （anon key は公開してよい鍵。データは RLS で守る。service_role の鍵は絶対にここへ入れない）
// =============================================================
window.STAFF_APP_CONFIG = {
  supabaseUrl: 'https://vavtrzewmldmpwmtogef.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdnRyemV3bWxkbXB3bXRvZ2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5OTQzNDIsImV4cCI6MjEwOTU3MDM0Mn0.POmvZh5wF39IXwXlWo2earco88UsZ0kbBKg00IuerWg',
  aiEnabled: false, // AI（要約・言葉で探す・プレゼント案）。人が増えて AI の鍵を入れたら true にする
  emailDomain: 'staff.samurai-motors.invalid' // ログインIDの裏で使うだけのメール形式（実在しない宛先）
};

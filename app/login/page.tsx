"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserClient } from "@/lib/supabase-browser";
import { useT } from "@/lib/i18n";
import { LangSwitch } from "@/components/shell";

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await browserClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setErr(t("メールアドレスまたはパスワードが正しくありません。", "Email hoặc mật khẩu không đúng."));
      setBusy(false);
      return;
    }
    const next = sp.get("next");
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }

  return (
    <form className="login-card" onSubmit={submit}>
      <div className="login-top">
        <div className="brand-mark">桜</div>
        <LangSwitch />
      </div>
      <h1>{t("桜水産市場 業務支援システム", "Hệ thống hỗ trợ nghiệp vụ Chợ thủy sản Sakura")}</h1>
      <p className="muted small">{t("プロトタイプ（LAB-2）・データはすべて架空です", "Prototype (LAB-2) · toàn bộ dữ liệu là hư cấu")}</p>
      <label className="field">
        <span className="field-label">{t("メールアドレス", "Email")}</span>
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="field">
        <span className="field-label">{t("パスワード", "Mật khẩu")}</span>
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {err && <div className="alert alert-error">{err}</div>}
      <button className="btn btn-primary btn-block" disabled={busy}>
        {busy ? t("ログイン中…", "Đang đăng nhập…") : t("ログイン", "Đăng nhập")}
      </button>
      <p className="muted small">{t("デモアカウントは README.md を参照してください。", "Tài khoản demo: xem README.md.")}</p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="login-page">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}

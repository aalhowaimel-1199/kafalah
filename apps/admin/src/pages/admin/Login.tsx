import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { signIn, useSession } from "../../lib/auth";
import { Logo } from "../../components/Logo";

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) navigate("/", { replace: true });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn.email({ email, password });
    setLoading(false);
    if (res.error) setError(t("auth.invalid"));
    else navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[var(--bg)] px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo className="h-14" />
          <span className="text-lg font-extrabold text-navy">{t("common.appName")}</span>
        </div>
        <div className="card p-8">
          <h1 className="mb-6 text-center text-2xl font-extrabold text-navy">{t("auth.title")}</h1>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">{t("auth.email")}</label>
              <input type="email" dir="ltr" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">{t("auth.password")}</label>
              <input type="password" dir="ltr" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="field-error">{error}</p>}
            <button disabled={loading} className="btn-primary w-full">{loading ? t("common.loading") : t("auth.signIn")}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

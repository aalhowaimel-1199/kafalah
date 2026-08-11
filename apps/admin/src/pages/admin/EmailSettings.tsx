import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHead, Toggle } from "../../components/ui";
import { api } from "../../lib/api";

type Smtp = { host: string; port: number; secure: boolean; user: string; pass: string; from: string };
type Tpl = { subjectAr: string; bodyAr: string };
type Templates = Record<string, Tpl>;

const TYPES = ["REQUEST_RECEIVED", "APPROVED", "INVITATION"] as const;

export function EmailSettings() {
  const { t } = useTranslation();
  const [smtp, setSmtp] = useState<Smtp>({ host: "", port: 587, secure: true, user: "", pass: "", from: "" });
  const [templates, setTemplates] = useState<Templates>({});
  const [tab, setTab] = useState<(typeof TYPES)[number]>("REQUEST_RECEIVED");
  const [testTo, setTestTo] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get<Smtp>("/api/admin/settings/smtp").then(setSmtp);
    api.get<Templates>("/api/admin/settings/templates").then(setTemplates);
  }, []);

  const labels: Record<string, string> = { REQUEST_RECEIVED: t("admin.tplRequest"), APPROVED: t("admin.tplApproved"), INVITATION: t("admin.tplInvite") };
  const tpl = templates[tab] ?? { subjectAr: "", bodyAr: "" };
  const setTpl = (patch: Partial<Tpl>) => setTemplates({ ...templates, [tab]: { ...tpl, ...patch } });

  async function saveSmtp() { await api.put("/api/admin/settings/smtp", smtp); setMsg("تم حفظ إعدادات البريد."); }
  async function saveTpl() { await api.put("/api/admin/settings/templates", templates); setMsg("تم حفظ القالب."); }
  async function test() { const r = await api.post<{ ok: boolean; message: string }>("/api/admin/settings/smtp/test", { to: testTo }); setMsg(r.ok ? "تم إرسال رسالة الاختبار." : `فشل: ${r.message}`); }

  return (
    <div>
      <PageHead title={t("admin.email")} />
      {msg && <p className="mb-4 rounded-[10px] border border-[#d3e9ea] bg-soft p-2.5 text-[13px] font-bold text-cyan-600">{msg}</p>}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card grid gap-3 p-6">
          <h3 className="text-[16px] font-extrabold text-navy">{t("admin.smtpTitle")}</h3>
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <div><label className="label">{t("admin.smtpHost")}</label><input className="input" dir="ltr" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} /></div>
            <div><label className="label">{t("admin.port")}</label><input className="input" dir="ltr" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) || 0 })} /></div>
          </div>
          <div><label className="label">{t("admin.username")}</label><input className="input" dir="ltr" value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} /></div>
          <div><label className="label">{t("admin.password")}</label><input type="password" className="input" dir="ltr" value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} /></div>
          <div><label className="label">{t("admin.from")}</label><input className="input" dir="ltr" value={smtp.from} onChange={(e) => setSmtp({ ...smtp, from: e.target.value })} /></div>
          <div className="flex items-center justify-between"><span className="text-sm font-bold">{t("admin.tls")}</span><Toggle on={smtp.secure} onChange={(v) => setSmtp({ ...smtp, secure: v })} /></div>
          <div className="flex gap-2"><input className="input" dir="ltr" placeholder="test@email.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} /><button onClick={test} className="btn-ghost whitespace-nowrap">{t("admin.testEmail")}</button></div>
          <button onClick={saveSmtp} className="btn-primary">{t("common.save")}</button>
        </div>

        <div className="card p-6">
          <h3 className="mb-3 text-[16px] font-extrabold text-navy">{t("admin.templates")}</h3>
          <div className="mb-3 flex gap-1 border-b border-line">
            {TYPES.map((ty) => (
              <button key={ty} onClick={() => setTab(ty)} className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-extrabold ${tab === ty ? "border-cyan text-navy" : "border-transparent text-slate"}`}>{labels[ty]}</button>
            ))}
          </div>
          <label className="label">{t("admin.subject")}</label>
          <input className="input" value={tpl.subjectAr} onChange={(e) => setTpl({ subjectAr: e.target.value })} />
          <label className="label mt-3">{t("admin.body")}</label>
          <textarea className="input" rows={8} value={tpl.bodyAr} onChange={(e) => setTpl({ bodyAr: e.target.value })} />
          <p className="mt-1 text-xs text-slate">{t("admin.variables")}: {"{visitorName} {requestNo} {trackUrl} {barcode} {floors} {entryWindow}"}</p>
          <button onClick={saveTpl} className="btn-primary mt-3">{t("admin.saveTemplate")}</button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { inviteVisitSchema } from "@ramh/shared";
import { PageHead, Empty } from "../../components/ui";
import { StatusBadge } from "../../components/StatusBadge";
import { api, type ApiError } from "../../lib/api";

type Floor = { key: string; nameAr: string; nameEn: string };
type Visit = { id: string; visitorName: string; status: string; source: string };

function localNow() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
function plus(base: string, h: number) { const d = new Date(base); d.setHours(d.getHours() + h); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }

export function Invitations() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [floors, setFloors] = useState<Floor[]>([]);
  const [sent, setSent] = useState<Visit[]>([]);
  const [form, setForm] = useState({ visitorName: "", email: "", phone: "", company: "", hostName: "", reasonText: "" });
  const [floorKeys, setFloorKeys] = useState<string[]>([]);
  const start = localNow();
  const [entryFrom, setEntryFrom] = useState(start);
  const [entryTo, setEntryTo] = useState(plus(start, 4));
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get<Floor[]>("/api/admin/floors").then(setFloors);
    api.get<Visit[]>("/api/admin/visits").then((v) => setSent(v.filter((x) => x.source === "INVITATION")));
  };
  useEffect(load, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (v: string) => setFloorKeys((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]));

  async function submit() {
    setError(""); setMsg("");
    const parsed = inviteVisitSchema.safeParse({ ...form, floorKeys, entryFrom: new Date(entryFrom).toISOString(), entryTo: new Date(entryTo).toISOString() });
    if (!parsed.success) { setError(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "تحقق من البيانات"); return; }
    setLoading(true);
    try {
      await api.post("/api/admin/invitations", parsed.data);
      setMsg("تم إرسال الدعوة.");
      setForm({ visitorName: "", email: "", phone: "", company: "", hostName: "", reasonText: "" });
      setFloorKeys([]);
      load();
    } catch (e) {
      setError((e as { data?: ApiError }).data?.error ?? "تعذّر الإرسال");
    } finally { setLoading(false); }
  }

  return (
    <div>
      <PageHead title={t("admin.invite")} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card grid gap-3 p-6">
          <div><label className="label">{t("admin.inviteName")}</label><input className="input" value={form.visitorName} onChange={set("visitorName")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t("visitForm.email")}</label><input className="input" dir="ltr" value={form.email} onChange={set("email")} /></div>
            <div><label className="label">{t("visitForm.phone")}</label><input className="input" dir="ltr" value={form.phone} onChange={set("phone")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t("visitForm.company")}</label><input className="input" value={form.company} onChange={set("company")} /></div>
            <div><label className="label">{t("visitForm.hostName")}</label><input className="input" value={form.hostName} onChange={set("hostName")} /></div>
          </div>
          <div><label className="label">{t("admin.chooseFloor")}</label>
            <div className="grid grid-cols-3 gap-2">
              {floors.map((f) => (
                <button key={f.key} type="button" onClick={() => toggle(f.key)}
                  className={`rounded-[9px] border px-3 py-2 text-[13px] font-bold ${floorKeys.includes(f.key) ? "border-cyan bg-soft text-navy" : "border-line text-slate"}`}>
                  {isAr ? f.nameAr : f.nameEn}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t("admin.entryFrom")}</label><input type="datetime-local" className="input" value={entryFrom} onChange={(e) => setEntryFrom(e.target.value)} /></div>
            <div><label className="label">{t("admin.entryTo")}</label><input type="datetime-local" className="input" value={entryTo} onChange={(e) => setEntryTo(e.target.value)} /></div>
          </div>
          {error && <p className="field-error">{error}</p>}
          {msg && <p className="rounded-[10px] border border-[#d3e9ea] bg-soft p-2.5 text-[13px] font-bold text-cyan-600">{msg}</p>}
          <button onClick={submit} disabled={loading} className="btn-primary w-full">{loading ? t("common.loading") : t("admin.sendInvite")}</button>
        </div>

        <div className="card p-6">
          <h3 className="mb-3 text-[16px] font-extrabold text-navy">{t("admin.sentInvites")}</h3>
          {sent.length === 0 ? <Empty>{t("admin.empty")}</Empty> : (
            <div className="divide-y divide-line">
              {sent.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2.5 text-sm"><span>{v.visitorName}</span><StatusBadge status={v.status} /></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

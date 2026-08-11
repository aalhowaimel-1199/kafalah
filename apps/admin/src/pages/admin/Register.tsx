import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { staffVisitSchema } from "@ramh/shared";
import { PageHead, Toggle } from "../../components/ui";
import { api, type ApiError } from "../../lib/api";
import { digitsOnly } from "../../lib/digits";

type Named = { id: string; nameAr: string; nameEn: string };
type Floor = { key: string; nameAr: string; nameEn: string };
type Me = { canApprove: boolean };
type Result = { requestNo: string; barcode: string | null; autoApproved: boolean; visitorName: string };

const empty = {
  visitorName: "", phone: "", email: "", nationalId: "",
  departmentId: "", reasonId: "", approvalNo: "", hostName: "", note: "",
};

function localNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
function plus(base: string, h: number) {
  const d = new Date(base);
  d.setHours(d.getHours() + h);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function Register() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [form, setForm] = useState({ ...empty });
  const [departments, setDepartments] = useState<Named[]>([]);
  const [reasons, setReasons] = useState<Named[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [canApprove, setCanApprove] = useState(false);
  const [approveNow, setApproveNow] = useState(false);
  const [floorKeys, setFloorKeys] = useState<string[]>([]);
  const start = localNow();
  const [entryFrom, setEntryFrom] = useState(start);
  const [entryTo, setEntryTo] = useState(plus(start, 4));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    api.get<Named[]>("/api/admin/departments").then((d) => setDepartments(d.filter((x) => (x as Named & { active?: boolean }).active !== false)));
    api.get<Named[]>("/api/admin/reasons").then(setReasons).catch(() => setReasons([]));
    api.get<Floor[]>("/api/admin/floors").then(setFloors).catch(() => setFloors([]));
    api.get<Me>("/api/admin/me").then((m) => setCanApprove(m.canApprove)).catch(() => {});
  }, []);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNum = (k: "phone" | "nationalId") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: digitsOnly(e.target.value) }));
  const toggleFloor = (key: string) => setFloorKeys((a) => (a.includes(key) ? a.filter((x) => x !== key) : [...a, key]));

  function reset() {
    setForm({ ...empty });
    setApproveNow(false);
    setFloorKeys([]);
    setResult(null);
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      approveNow: approveNow && canApprove,
      floorKeys: approveNow ? floorKeys : undefined,
      entryFrom: approveNow ? new Date(entryFrom).toISOString() : "",
      entryTo: approveNow ? new Date(entryTo).toISOString() : "",
    };
    const parsed = staffVisitSchema.safeParse(payload);
    if (!parsed.success) {
      setError(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? t("visitForm.checkData"));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<Result>("/api/admin/visits/staff", parsed.data);
      setResult(res);
    } catch (e2) {
      if ((e2 as { status?: number }).status === 403) setError(t("visitForm.blocked"));
      else setError((e2 as { data?: ApiError }).data?.error ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHead title={t("admin.register")} />
        <div className="card p-8 text-center">
          <h3 className="text-[20px] font-extrabold text-navy">{t("visitForm.successTitle")}</h3>
          <p className="mt-1 text-slate">{result.visitorName}</p>
          <div className="my-3 select-all rounded-[10px] bg-soft px-4 py-3 text-2xl font-extrabold tracking-widest text-navy">{result.requestNo}</div>
          {result.autoApproved && result.barcode ? (
            <div className="rounded-xl2 border border-line p-5">
              <div className="mb-2 font-extrabold text-navy">{t("track.barcodeTitle")}</div>
              <div className="flex justify-center bg-white p-3"><QRCode value={result.barcode} size={180} /></div>
            </div>
          ) : (
            <p className="rounded-[10px] border border-[#f0dcae] bg-[#fbf0d9] p-3 text-[13.5px] font-bold text-[#9a6212]">{t("admin.pendingApprovalMsg")}</p>
          )}
          <button onClick={reset} className="btn-primary mt-5 w-full">{t("admin.newRegistration")}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHead title={t("admin.register")} />
      <form onSubmit={submit} className="card-accent grid gap-4 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label">{t("visitForm.visitorName")} *</label>
          <input className="input" value={form.visitorName} onChange={set("visitorName")} />
        </div>
        <div>
          <label className="label">{t("visitForm.phone")} *</label>
          <input className="input" dir="ltr" inputMode="numeric" placeholder="05XXXXXXXX" value={form.phone} onChange={setNum("phone")} />
        </div>
        <div>
          <label className="label">{t("visitForm.nationalId")}</label>
          <input className="input" dir="ltr" inputMode="numeric" value={form.nationalId} onChange={setNum("nationalId")} />
        </div>
        <div>
          <label className="label">{t("admin.department")} *</label>
          <select className="input" value={form.departmentId} onChange={set("departmentId")}>
            <option value="">—</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{isAr ? d.nameAr : d.nameEn}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("visitForm.reason")}</label>
          <select className="input" value={form.reasonId} onChange={set("reasonId")}>
            <option value="">—</option>
            {reasons.map((r) => <option key={r.id} value={r.id}>{isAr ? r.nameAr : r.nameEn}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t("admin.approvalNo")}</label>
          <input className="input" dir="ltr" value={form.approvalNo} onChange={set("approvalNo")} />
        </div>
        <div>
          <label className="label">{t("visitForm.hostName")}</label>
          <input className="input" value={form.hostName} onChange={set("hostName")} />
        </div>
        <div>
          <label className="label">{t("visitForm.email")}</label>
          <input className="input" dir="ltr" placeholder="name@email.com" value={form.email} onChange={set("email")} />
        </div>
        <div className="md:col-span-2">
          <label className="label">{t("visitForm.note")}</label>
          <textarea className="input" rows={2} value={form.note} onChange={set("note")} />
        </div>

        {canApprove && (
          <div className="md:col-span-2">
            <div className="flex items-center justify-between rounded-[10px] border border-line bg-soft p-3">
              <span className="text-sm font-bold text-navy">{t("admin.approveNow")}</span>
              <Toggle on={approveNow} onChange={setApproveNow} />
            </div>
            {approveNow && (
              <div className="mt-3 space-y-3 rounded-[10px] border border-line p-4">
                <div className="grid grid-cols-3 gap-2">
                  {floors.map((f) => {
                    const on = floorKeys.includes(f.key);
                    return (
                      <button type="button" key={f.key} onClick={() => toggleFloor(f.key)}
                        className={`rounded-[9px] border px-3 py-2.5 text-[13.5px] font-bold ${on ? "border-cyan bg-soft text-navy" : "border-line text-slate"}`}>
                        {isAr ? f.nameAr : f.nameEn}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">{t("admin.entryFrom")}</label><input type="datetime-local" className="input" value={entryFrom} onChange={(e) => setEntryFrom(e.target.value)} /></div>
                  <div><label className="label">{t("admin.entryTo")}</label><input type="datetime-local" className="input" value={entryTo} onChange={(e) => setEntryTo(e.target.value)} /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[2, 4, 8, 24].map((h) => (
                    <button type="button" key={h} onClick={() => setEntryTo(plus(entryFrom, h))} className="rounded-md border border-line px-3 py-1 text-xs font-extrabold text-navy hover:bg-soft">+{h}h</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p className="field-error md:col-span-2">{error}</p>}
        <div className="md:col-span-2">
          <button disabled={loading} className="btn-primary w-full">{loading ? t("common.loading") : t("admin.submitRegistration")}</button>
        </div>
      </form>
    </div>
  );
}

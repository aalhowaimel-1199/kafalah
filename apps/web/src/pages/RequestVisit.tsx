import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createVisitSchema } from "@ramh/shared";
import { api, type ApiError } from "../lib/api";
import { Icon } from "../components/Icon";
import { digitsOnly } from "../lib/digits";

type Reason = { id: string; nameAr: string; nameEn: string };
const initial = { visitorName: "", phone: "", email: "", nationalId: "", company: "", hostName: "", hostDept: "", reasonId: "", note: "", visitDate: "" };

export function RequestVisit() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [form, setForm] = useState({ ...initial });
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    api.get<Reason[]>("/api/visits/reasons").then(setReasons).catch(() => setReasons([]));
  }, []);

  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k: string) => errors[k]?.[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const payload = { ...form, visitDate: form.visitDate ? new Date(form.visitDate).toISOString() : "" };
    const parsed = createVisitSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ requestNo: string }>("/api/visits", parsed.data);
      setDone(res.requestNo);
    } catch (e2) {
      const status = (e2 as { status?: number }).status;
      if (status === 403) setErrors({ _: [t("visitForm.blocked")] });
      else setErrors((e2 as { data?: ApiError }).data?.issues ?? { _: [(e2 as Error).message] });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-5 py-12">
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Icon name="check" className="h-8 w-8" />
          </div>
          <h3 className="mb-1.5 mt-4 text-[21px] font-extrabold text-navy">{t("visitForm.successTitle")}</h3>
          <p className="text-slate">{t("visitForm.successMsg")}</p>
          <div className="my-3 select-all rounded-[10px] bg-soft px-4 py-3 text-2xl font-extrabold tracking-widest text-navy">{done}</div>
          <p className="rounded-[10px] border border-[#d3e9ea] bg-soft p-3 text-[13.5px] font-bold text-cyan-600">{t("visitForm.successHint")}</p>
          <Link to="/track" className="btn-ghost mt-5">{t("nav.track")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="mb-6">
        <h2 className="text-[26px] font-extrabold text-navy">{t("visitForm.title")}</h2>
        <p className="mt-1 text-slate">{t("visitForm.sub")}</p>
      </div>
      <form onSubmit={submit} className="card-accent grid gap-4 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label">{t("visitForm.visitorName")} *</label>
          <input className="input" value={form.visitorName} onChange={set("visitorName")} />
          {err("visitorName") && <p className="field-error">{err("visitorName")}</p>}
        </div>
        <div>
          <label className="label">{t("visitForm.phone")} *</label>
          <input className="input" dir="ltr" inputMode="numeric" placeholder="05XXXXXXXX" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: digitsOnly(e.target.value) }))} />
          {err("phone") && <p className="field-error">{err("phone")}</p>}
        </div>
        <div>
          <label className="label">{t("visitForm.email")} *</label>
          <input className="input" dir="ltr" placeholder="name@email.com" value={form.email} onChange={set("email")} />
          {err("email") && <p className="field-error">{err("email")}</p>}
        </div>
        <div>
          <label className="label">{t("visitForm.nationalId")}</label>
          <input className="input" dir="ltr" inputMode="numeric" value={form.nationalId} onChange={(e) => setForm((f) => ({ ...f, nationalId: digitsOnly(e.target.value) }))} />
          {err("nationalId") && <p className="field-error">{err("nationalId")}</p>}
        </div>
        <div>
          <label className="label">{t("visitForm.company")}</label>
          <input className="input" value={form.company} onChange={set("company")} />
        </div>
        <div>
          <label className="label">{t("visitForm.hostName")}</label>
          <input className="input" value={form.hostName} onChange={set("hostName")} />
        </div>
        <div>
          <label className="label">{t("visitForm.hostDept")}</label>
          <input className="input" value={form.hostDept} onChange={set("hostDept")} />
        </div>
        <div>
          <label className="label">{t("visitForm.reason")}</label>
          <select className="input" value={form.reasonId} onChange={set("reasonId")}>
            <option value="">—</option>
            {reasons.map((r) => (
              <option key={r.id} value={r.id}>{isAr ? r.nameAr : r.nameEn}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t("visitForm.visitDate")}</label>
          <input type="datetime-local" className="input" value={form.visitDate} onChange={set("visitDate")} />
        </div>
        <div className="md:col-span-2">
          <label className="label">{t("visitForm.note")}</label>
          <textarea className="input" rows={2} value={form.note} onChange={set("note")} />
        </div>
        {errors._ && <p className="field-error md:col-span-2">{errors._[0]}</p>}
        <div className="md:col-span-2">
          <button disabled={loading} className="btn-primary w-full">{loading ? t("common.loading") : t("visitForm.submit")}</button>
        </div>
      </form>
    </div>
  );
}

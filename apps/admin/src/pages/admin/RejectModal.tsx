import { useState } from "react";
import { useTranslation } from "react-i18next";
import { rejectVisitSchema } from "@ramh/shared";
import { api, type ApiError } from "../../lib/api";

type Props = { visit: { id: string; requestNo: string; visitorName: string }; onClose: () => void; onDone: () => void };

export function RejectModal({ visit, onClose, onDone }: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    const parsed = rejectVisitSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.reason?.[0] ?? "أدخل سبباً");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/admin/visits/${visit.id}/reject`, parsed.data);
      onDone();
    } catch (e) {
      setError((e as { data?: ApiError }).data?.error ?? "تعذّر الرفض");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,14,30,0.6)] p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[19px] font-extrabold text-navy">{t("admin.rejectTitle")}</h3>
        <p className="mb-4 text-sm text-slate">{visit.requestNo} · {visit.visitorName}</p>
        <label className="label">{t("admin.rejectReason")}</label>
        <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        {error && <p className="field-error">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">{t("common.cancel")}</button>
          <button onClick={submit} disabled={loading} className="btn-bad flex-1">{loading ? t("common.loading") : t("admin.confirmReject")}</button>
        </div>
      </div>
    </div>
  );
}

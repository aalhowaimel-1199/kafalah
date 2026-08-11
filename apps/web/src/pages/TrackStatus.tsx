import { useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../lib/api";
import { digitsOnly } from "../lib/digits";

type Result = {
  requestNo: string;
  visitorName: string;
  status: string;
  rejectReason: string | null;
  entryFrom: string | null;
  entryTo: string | null;
  barcode: string | null;
  floors: { key: string; nameAr: string; nameEn: string }[];
};

export function TrackStatus() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [requestNo, setRequestNo] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setResult(null);
    try {
      setResult(await api.post<Result>("/api/visits/track", { requestNo: requestNo.trim(), phone: phone.trim() }));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString(isAr ? "ar-SA" : "en-GB", { dateStyle: "short", timeStyle: "short" }) : "—");

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h2 className="mb-6 text-[26px] font-extrabold text-navy">{t("track.title")}</h2>
      <form onSubmit={check} className="card grid gap-4 p-6">
        <div>
          <label className="label">{t("track.requestNo")}</label>
          <input className="input" dir="ltr" placeholder="RV-..." value={requestNo} onChange={(e) => setRequestNo(e.target.value)} />
        </div>
        <div>
          <label className="label">{t("track.phone")}</label>
          <input className="input" dir="ltr" inputMode="numeric" placeholder="05XXXXXXXX" value={phone} onChange={(e) => setPhone(digitsOnly(e.target.value))} />
        </div>
        <button disabled={loading} className="btn-primary">{loading ? t("common.loading") : t("track.check")}</button>
      </form>

      {notFound && <p className="mt-5 rounded-[10px] bg-red-50 p-4 text-center font-bold text-red-600">{t("track.notFound")}</p>}

      {result && (
        <div className="card-accent mt-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-slate">{result.visitorName}</div>
              <div className="text-lg font-extrabold text-navy">{result.requestNo}</div>
            </div>
            <StatusBadge status={result.status} />
          </div>

          {result.status === "REJECTED" && result.rejectReason && (
            <p className="mt-4 rounded-[10px] bg-red-50 p-3 text-sm text-red-700">{result.rejectReason}</p>
          )}

          {result.status === "APPROVED" && (
            <>
              <div className="my-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[10px] bg-soft p-3">
                  <div className="text-xs font-extrabold text-slate">{t("track.entryWindow")}</div>
                  <div className="text-[13.5px] font-extrabold text-navy">{fmt(result.entryFrom)} — {fmt(result.entryTo)}</div>
                </div>
                <div className="rounded-[10px] bg-soft p-3">
                  <div className="text-xs font-extrabold text-slate">{t("track.floors")}</div>
                  <div className="text-[13.5px] font-extrabold text-navy">{result.floors.map((f) => (isAr ? f.nameAr : f.nameEn)).join("، ") || "—"}</div>
                </div>
              </div>
              {result.barcode && (
                <div className="rounded-xl2 border border-line p-6 text-center">
                  <div className="mb-3 font-extrabold text-navy">{t("track.barcodeTitle")}</div>
                  <div className="flex justify-center bg-white p-3"><QRCode value={result.barcode} size={180} /></div>
                  <p className="mt-2 text-xs text-slate">{t("track.barcodeHint")}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { approveVisitSchema } from "@ramh/shared";
import { api, type ApiError } from "../../lib/api";

type Floor = { key: string; nameAr: string; nameEn: string };
type Gate = { id: string; code: string; nameAr: string; nameEn: string; floorKey: string; isExit: boolean };
type DeviceResult = { target: string; ok: boolean; message: string };
type Props = { visit: { id: string; requestNo: string; visitorName: string }; onClose: () => void; onDone: () => void };

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

export function ApproveModal({ visit, onClose, onDone }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [floors, setFloors] = useState<Floor[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [mode, setMode] = useState<"floors" | "gates">("floors");
  const [floorKeys, setFloorKeys] = useState<string[]>([]);
  const [gateCodes, setGateCodes] = useState<string[]>([]);
  const start = localNow();
  const [entryFrom, setEntryFrom] = useState(start);
  const [entryTo, setEntryTo] = useState(plus(start, 4));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DeviceResult[] | null>(null);

  useEffect(() => {
    Promise.all([api.get<Floor[]>("/api/admin/floors"), api.get<Gate[]>("/api/admin/gates")]).then(([f, g]) => {
      setFloors(f); setGates(g);
    });
  }, []);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function submit() {
    setError("");
    const payload = {
      floorKeys: mode === "floors" ? floorKeys : undefined,
      gateCodes: mode === "gates" ? gateCodes : undefined,
      entryFrom: new Date(entryFrom).toISOString(),
      entryTo: new Date(entryTo).toISOString(),
    };
    const parsed = approveVisitSchema.safeParse(payload);
    if (!parsed.success) {
      setError(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "تحقق من البيانات");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ deviceResults: DeviceResult[] }>(`/api/admin/visits/${visit.id}/approve`, parsed.data);
      setResults(res.deviceResults);
    } catch (e) {
      setError((e as { data?: ApiError }).data?.error ?? "تعذّر الاعتماد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,14,30,0.6)] p-4" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-xl overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[19px] font-extrabold text-navy">{t("admin.approveTitle")}</h3>
        <p className="mb-4 text-sm text-slate">{visit.requestNo} · {visit.visitorName}</p>

        {results ? (
          <div className="space-y-3">
            <p className="font-extrabold text-emerald-700">{t("admin.syncResult")}</p>
            <ul className="space-y-2">
              {results.map((r, i) => (
                <li key={i} className={`rounded-lg p-3 text-sm ${r.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                  <b>{r.target}</b> · {r.message}
                </li>
              ))}
            </ul>
            <button onClick={onDone} className="btn-primary w-full">{t("common.save")}</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex overflow-hidden rounded-[9px] border border-line">
              <button onClick={() => setMode("floors")} className={`flex-1 py-2.5 text-[13.5px] font-extrabold ${mode === "floors" ? "bg-navy text-white" : "bg-white text-slate"}`}>{t("admin.chooseFloor")}</button>
              <button onClick={() => setMode("gates")} className={`flex-1 py-2.5 text-[13.5px] font-extrabold ${mode === "gates" ? "bg-navy text-white" : "bg-white text-slate"}`}>{t("admin.orChooseGates")}</button>
            </div>

            {mode === "floors" ? (
              <div className="grid grid-cols-3 gap-2">
                {floors.map((f) => {
                  const on = floorKeys.includes(f.key);
                  return (
                    <button key={f.key} onClick={() => toggle(floorKeys, f.key, setFloorKeys)}
                      className={`rounded-[9px] border px-3 py-2.5 text-[13.5px] font-bold ${on ? "border-cyan bg-soft text-navy" : "border-line text-slate"}`}>
                      {isAr ? f.nameAr : f.nameEn}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {gates.length === 0 && <p className="col-span-2 text-sm text-slate">{t("admin.empty")}</p>}
                {gates.map((g) => {
                  const on = gateCodes.includes(g.code);
                  return (
                    <label key={g.id} className={`flex cursor-pointer items-center gap-2 rounded-[9px] border p-2.5 text-[13.5px] ${on ? "border-cyan bg-soft" : "border-line"}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(gateCodes, g.code, setGateCodes)} />
                      <span>{isAr ? g.nameAr : g.nameEn} · {g.isExit ? t("admin.gateExit") : t("admin.gateEntry")}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t("admin.entryFrom")}</label>
                <input type="datetime-local" className="input" value={entryFrom} onChange={(e) => setEntryFrom(e.target.value)} />
              </div>
              <div>
                <label className="label">{t("admin.entryTo")}</label>
                <input type="datetime-local" className="input" value={entryTo} onChange={(e) => setEntryTo(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[2, 4, 8, 24].map((h) => (
                <button key={h} onClick={() => setEntryTo(plus(entryFrom, h))} className="rounded-md border border-line px-3 py-1 text-xs font-extrabold text-navy hover:bg-soft">+{h}h</button>
              ))}
            </div>

            {error && <p className="field-error">{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost flex-1">{t("common.cancel")}</button>
              <button onClick={submit} disabled={loading} className="btn-primary flex-1">{loading ? t("common.loading") : t("admin.confirmApprove")}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHead, Empty } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { api } from "../../lib/api";

type Movement = { id: string; direction: "IN" | "OUT"; at: string; visit: { visitorName: string } | null; gate: { nameAr: string; nameEn: string; floorKey: string } | null; floorKey: string | null };
type Inside = { id: string; visitorName: string; since: string };
type Overstay = { id: string; visitorName: string; entryTo: string | null; phone: string };

export function Monitoring() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [movements, setMovements] = useState<Movement[]>([]);
  const [inside, setInside] = useState<Inside[]>([]);
  const [overstay, setOverstay] = useState<Overstay[]>([]);

  useEffect(() => {
    const load = () => {
      api.get<Movement[]>("/api/admin/monitor/movements").then(setMovements);
      api.get<Inside[]>("/api/admin/monitor/inside").then(setInside);
      api.get<Overstay[]>("/api/admin/monitor/overstay").then(setOverstay);
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const time = (d: string) => new Date(d).toLocaleTimeString(isAr ? "ar-SA" : "en-GB");

  return (
    <div>
      <PageHead title={t("admin.monitor")} />
      <div className={`mb-4 flex items-center gap-2 rounded-[10px] border p-3 text-[13.5px] font-bold ${overstay.length ? "border-[#f0dcae] bg-[#fbf0d9] text-[#9a6212]" : "border-[#d3e9ea] bg-soft text-cyan-600"}`}>
        <Icon name="bell" className="h-5 w-5" />
        {overstay.length ? `${t("admin.overstayAlert")}: ${overstay.length}` : t("admin.noOverstay")}
      </div>

      <div className="grid gap-5 md:grid-cols-[1.5fr_1fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-line p-3.5 font-extrabold text-navy">{t("admin.movementsLog")}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-[#fafbfd] text-navy">
                <th className="p-3 text-start font-extrabold">{t("admin.time")}</th>
                <th className="p-3 text-start font-extrabold">{t("admin.visitor")}</th>
                <th className="p-3 text-start font-extrabold">{t("admin.gateFloor")}</th>
                <th className="p-3 text-start font-extrabold">{t("admin.movement")}</th>
              </tr></thead>
              <tbody>
                {movements.length === 0 ? <tr><td colSpan={4}><Empty>{t("admin.empty")}</Empty></td></tr> :
                  movements.map((m) => (
                    <tr key={m.id} className="border-t border-line">
                      <td className="p-3" dir="ltr">{time(m.at)}</td>
                      <td className="p-3">{m.visit?.visitorName ?? "—"}</td>
                      <td className="p-3">{m.gate ? (isAr ? m.gate.nameAr : m.gate.nameEn) : m.floorKey ?? "—"}</td>
                      <td className="p-3"><span className={`badge ${m.direction === "IN" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{m.direction === "IN" ? t("admin.in") : t("admin.out")}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-[16px] font-extrabold text-navy">{t("admin.insideNow")} ({inside.length})</h3>
          {inside.length === 0 ? <Empty>{t("admin.empty")}</Empty> : (
            <div className="divide-y divide-line">
              {inside.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2.5 text-sm"><span>{v.visitorName}</span><span className="badge bg-soft text-cyan-600" dir="ltr">{time(v.since)}</span></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

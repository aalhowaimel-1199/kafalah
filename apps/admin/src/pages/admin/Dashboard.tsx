import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHead, Empty, Stat } from "../../components/ui";
import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { ApproveModal } from "./ApproveModal";
import { RejectModal } from "./RejectModal";

type Visit = {
  id: string; requestNo: string; visitorName: string; phone: string;
  hostName: string | null; status: string;
  reason: { nameAr: string } | null; reasonText: string | null;
  floors: { nameAr: string; nameEn: string }[];
};
type Counts = { PENDING: number; APPROVED: number; REJECTED: number; TODAY: number };
type Me = { canApprove: boolean };

const TABS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [tab, setTab] = useState<(typeof TABS)[number]>("PENDING");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [inside, setInside] = useState(0);
  const [overstay, setOverstay] = useState(0);
  const [canApprove, setCanApprove] = useState(false);
  const [approveT, setApproveT] = useState<Visit | null>(null);
  const [rejectT, setRejectT] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Me>("/api/admin/me").then((m) => setCanApprove(m.canApprove)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const q = tab === "ALL" ? "" : `?status=${tab}`;
    const [v, c, ins, ovr] = await Promise.all([
      api.get<Visit[]>(`/api/admin/visits${q}`),
      api.get<Counts>("/api/admin/visits/counts"),
      api.get<unknown[]>("/api/admin/monitor/inside"),
      api.get<unknown[]>("/api/admin/monitor/overstay"),
    ]);
    setVisits(v); setCounts(c); setInside(ins.length); setOverstay(ovr.length);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHead title={t("admin.dashboard")} />
      <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-5">
        <Stat value={counts?.PENDING ?? 0} label={t("admin.pending")} color="#9a6212" />
        <Stat value={counts?.APPROVED ?? 0} label={t("admin.approved")} color="#137a44" />
        <Stat value={counts?.TODAY ?? 0} label={t("admin.today")} color="var(--navy)" />
        <Stat value={inside} label={t("admin.insideNow")} color="var(--cyan-600)" />
        <Stat value={overstay} label={t("admin.overstayed")} color="#b42424" />
      </div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[13.5px] font-extrabold ${tab === tb ? "border-cyan text-navy" : "border-transparent text-slate"}`}>
            {tb === "ALL" ? t("admin.total") : t(`status.${tb}`)}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#fafbfd] text-navy">
              <th className="p-3.5 text-start font-extrabold">{t("admin.requestNo")}</th>
              <th className="p-3.5 text-start font-extrabold">{t("admin.visitor")}</th>
              <th className="p-3.5 text-start font-extrabold">{t("admin.phone")}</th>
              <th className="p-3.5 text-start font-extrabold">{t("admin.host")}</th>
              <th className="p-3.5 text-start font-extrabold">{t("track.status")}</th>
              <th className="p-3.5 text-start font-extrabold">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><Empty>{t("common.loading")}</Empty></td></tr>
            ) : visits.length === 0 ? (
              <tr><td colSpan={6}><Empty>{t("admin.empty")}</Empty></td></tr>
            ) : (
              visits.map((v) => (
                <tr key={v.id} className="border-t border-line">
                  <td className="p-3.5 font-extrabold text-navy">{v.requestNo}</td>
                  <td className="p-3.5">{v.visitorName}</td>
                  <td className="p-3.5" dir="ltr">{v.phone}</td>
                  <td className="p-3.5">{v.hostName ?? "—"}</td>
                  <td className="p-3.5"><StatusBadge status={v.status} /></td>
                  <td className="p-3.5">
                    {v.status === "PENDING" && canApprove ? (
                      <div className="flex gap-2">
                        <button onClick={() => setApproveT(v)} className="btn-ok btn-sm">{t("admin.approve")}</button>
                        <button onClick={() => setRejectT(v)} className="btn-bad btn-sm">{t("admin.reject")}</button>
                      </div>
                    ) : v.floors.length ? (
                      <span className="text-xs text-slate">{v.floors.map((f) => (isAr ? f.nameAr : f.nameEn)).join("، ")}</span>
                    ) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {approveT && <ApproveModal visit={approveT} onClose={() => setApproveT(null)} onDone={() => { setApproveT(null); load(); }} />}
      {rejectT && <RejectModal visit={rejectT} onClose={() => setRejectT(null)} onDone={() => { setRejectT(null); load(); }} />}
    </div>
  );
}

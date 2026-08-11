import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHead, Toggle } from "../../components/ui";
import { api } from "../../lib/api";

type Reason = { id: string; nameAr: string; nameEn: string; active: boolean };

export function Reasons() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [list, setList] = useState<Reason[]>([]);
  const [nameAr, setNameAr] = useState("");

  const load = () => api.get<Reason[]>("/api/admin/reasons").then(setList);
  useEffect(() => { load(); }, []);

  async function add() {
    if (nameAr.trim().length < 2) return;
    await api.post("/api/admin/reasons", { nameAr, nameEn: nameAr });
    setNameAr("");
    load();
  }
  async function toggle(r: Reason) { await api.patch(`/api/admin/reasons/${r.id}`, { active: !r.active }); load(); }

  return (
    <div>
      <PageHead title={t("admin.reasons")} />
      <div className="card max-w-xl p-6">
        <div className="divide-y divide-line">
          {list.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2.5">
              <span className={r.active ? "" : "text-slate line-through"}>{isAr ? r.nameAr : r.nameEn}</span>
              <Toggle on={r.active} onChange={() => toggle(r)} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input className="input" placeholder={t("admin.newReason")} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          <button onClick={add} className="btn-primary btn-sm">{t("common.add")}</button>
        </div>
      </div>
    </div>
  );
}

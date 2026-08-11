import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHead, Toggle } from "../../components/ui";
import { api } from "../../lib/api";

type Dept = { id: string; nameAr: string; nameEn: string; active: boolean };

export function Departments() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [list, setList] = useState<Dept[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");

  const load = () => api.get<Dept[]>("/api/admin/departments").then(setList);
  useEffect(() => { load(); }, []);

  async function add() {
    if (nameAr.trim().length < 2) return;
    await api.post("/api/admin/departments", { nameAr, nameEn: nameEn || nameAr });
    setNameAr("");
    setNameEn("");
    load();
  }
  async function toggle(d: Dept) { await api.patch(`/api/admin/departments/${d.id}`, { active: !d.active }); load(); }
  async function remove(id: string) { await api.del(`/api/admin/departments/${id}`); load(); }

  return (
    <div>
      <PageHead title={t("admin.departments")} />
      <div className="card mb-4 grid items-end gap-3 p-5 md:grid-cols-[2fr_2fr_auto]">
        <div><label className="label">{t("admin.deptNameAr")}</label><input className="input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} /></div>
        <div><label className="label">{t("admin.deptNameEn")}</label><input className="input" dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
        <button onClick={add} className="btn-primary">{t("common.add")}</button>
      </div>
      <div className="card max-w-2xl divide-y divide-line p-2">
        {list.length === 0 && <p className="p-4 text-sm text-slate">{t("admin.empty")}</p>}
        {list.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-3">
            <span className={d.active ? "" : "text-slate line-through"}>
              {isAr ? d.nameAr : d.nameEn} <span className="text-xs text-slate" dir="ltr">· {d.nameEn}</span>
            </span>
            <div className="flex items-center gap-3">
              <Toggle on={d.active} onChange={() => toggle(d)} />
              <button onClick={() => remove(d.id)} className="text-xs font-bold text-red-600">{t("common.delete")}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

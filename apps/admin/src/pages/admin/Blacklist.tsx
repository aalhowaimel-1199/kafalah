import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { blacklistSchema } from "@ramh/shared";
import { PageHead, Empty } from "../../components/ui";
import { api } from "../../lib/api";

type Entry = { id: string; name: string; identifier: string; reason: string | null; createdAt: string; createdBy: { name: string } | null };

export function Blacklist() {
  const { t } = useTranslation();
  const [list, setList] = useState<Entry[]>([]);
  const [form, setForm] = useState({ name: "", identifier: "", reason: "" });
  const [error, setError] = useState("");

  const load = () => api.get<Entry[]>("/api/admin/blacklist").then(setList);
  useEffect(() => { load(); }, []);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function add() {
    setError("");
    const parsed = blacklistSchema.safeParse(form);
    if (!parsed.success) { setError(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "تحقق"); return; }
    await api.post("/api/admin/blacklist", parsed.data);
    setForm({ name: "", identifier: "", reason: "" });
    load();
  }
  async function remove(id: string) { await api.del(`/api/admin/blacklist/${id}`); load(); }

  return (
    <div>
      <PageHead title={t("admin.blacklist")} />
      <div className="card mb-4 grid items-end gap-3 p-5 md:grid-cols-[2fr_2fr_3fr_auto]">
        <div><label className="label">{t("admin.blockName")}</label><input className="input" value={form.name} onChange={set("name")} /></div>
        <div><label className="label">{t("admin.blockId")}</label><input className="input" dir="ltr" value={form.identifier} onChange={set("identifier")} /></div>
        <div><label className="label">{t("admin.blockReason")}</label><input className="input" value={form.reason} onChange={set("reason")} /></div>
        <button onClick={add} className="btn-bad">{t("admin.addBlock")}</button>
      </div>
      {error && <p className="field-error mb-3">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#fafbfd] text-navy">
            <th className="p-3 text-start font-extrabold">{t("admin.blockName")}</th>
            <th className="p-3 text-start font-extrabold">{t("admin.blockId")}</th>
            <th className="p-3 text-start font-extrabold">{t("admin.blockReason")}</th>
            <th className="p-3 text-start font-extrabold">{t("admin.by")}</th>
            <th className="p-3"></th>
          </tr></thead>
          <tbody>
            {list.length === 0 ? <tr><td colSpan={5}><Empty>{t("admin.empty")}</Empty></td></tr> :
              list.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="p-3">{e.name}</td>
                  <td className="p-3" dir="ltr">{e.identifier}</td>
                  <td className="p-3">{e.reason ?? "—"}</td>
                  <td className="p-3">{e.createdBy?.name ?? "—"}</td>
                  <td className="p-3"><button onClick={() => remove(e.id)} className="btn-ghost btn-sm">{t("admin.removeBlock")}</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

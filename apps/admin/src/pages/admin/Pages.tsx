import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { pageSchema } from "@ramh/shared";
import { PageHead, Empty, Toggle } from "../../components/ui";
import { api, type ApiError } from "../../lib/api";

type Page = { id: string; titleAr: string; titleEn: string; contentAr: string; contentEn: string; published: boolean; sortOrder: number };
type Form = { titleAr: string; titleEn: string; contentAr: string; contentEn: string; published: boolean };
const empty: Form = { titleAr: "", titleEn: "", contentAr: "", contentEn: "", published: true };

export function Pages() {
  const { t } = useTranslation();
  const [pages, setPages] = useState<Page[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState("");

  const load = () => api.get<Page[]>("/api/admin/pages").then(setPages);
  useEffect(() => { load(); }, []);

  function startAdd() { setEditId(null); setForm(empty); setError(""); setOpen(true); }
  function startEdit(p: Page) {
    setEditId(p.id);
    setForm({ titleAr: p.titleAr, titleEn: p.titleEn, contentAr: p.contentAr, contentEn: p.contentEn, published: p.published });
    setError("");
    setOpen(true);
  }

  async function save() {
    setError("");
    const parsed = pageSchema.safeParse(form);
    if (!parsed.success) { setError(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "تحقق"); return; }
    try {
      if (editId) await api.patch(`/api/admin/pages/${editId}`, parsed.data);
      else await api.post("/api/admin/pages", parsed.data);
      setOpen(false);
      load();
    } catch (e) { setError((e as { data?: ApiError }).data?.error ?? "تعذّر الحفظ"); }
  }

  async function togglePub(p: Page) {
    await api.patch(`/api/admin/pages/${p.id}`, { titleAr: p.titleAr, titleEn: p.titleEn, contentAr: p.contentAr, contentEn: p.contentEn, published: !p.published, sortOrder: p.sortOrder });
    load();
  }
  async function remove(id: string) { await api.del(`/api/admin/pages/${id}`); load(); }

  return (
    <div>
      <PageHead title={t("admin.pages")} />
      <button onClick={startAdd} className="btn-primary mb-4">+ {t("admin.addPage")}</button>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#fafbfd] text-navy">
            <th className="p-3 text-start font-extrabold">{t("admin.pageTitle")}</th>
            <th className="p-3 text-start font-extrabold">{t("admin.published")}</th>
            <th className="p-3"></th>
          </tr></thead>
          <tbody>
            {pages.length === 0 ? <tr><td colSpan={3}><Empty>{t("admin.empty")}</Empty></td></tr> :
              pages.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-3"><div className="font-bold">{p.titleAr}</div><div className="text-xs text-slate" dir="ltr">{p.titleEn}</div></td>
                  <td className="p-3"><Toggle on={p.published} onChange={() => togglePub(p)} /></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(p)} className="btn-ghost btn-sm">{t("common.edit")}</button>
                      <button onClick={() => remove(p.id)} className="text-xs font-bold text-red-600">{t("common.delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,14,30,0.6)] p-4" onClick={() => setOpen(false)}>
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-[19px] font-extrabold text-navy">{editId ? t("common.edit") : t("admin.addPage")}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">{t("admin.pageTitleAr")}</label><input className="input" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} /></div>
              <div><label className="label">{t("admin.pageTitleEn")}</label><input className="input" dir="ltr" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} /></div>
              <div className="md:col-span-2"><label className="label">{t("admin.pageContentAr")}</label><textarea className="input" rows={6} value={form.contentAr} onChange={(e) => setForm({ ...form, contentAr: e.target.value })} /></div>
              <div className="md:col-span-2"><label className="label">{t("admin.pageContentEn")}</label><textarea className="input" dir="ltr" rows={6} value={form.contentEn} onChange={(e) => setForm({ ...form, contentEn: e.target.value })} /></div>
              <div className="flex items-center justify-between md:col-span-2"><span className="text-sm font-bold">{t("admin.published")}</span><Toggle on={form.published} onChange={(v) => setForm({ ...form, published: v })} /></div>
              {error && <p className="field-error md:col-span-2">{error}</p>}
              <div className="flex gap-2 md:col-span-2">
                <button onClick={() => setOpen(false)} className="btn-ghost flex-1">{t("common.cancel")}</button>
                <button onClick={save} className="btn-primary flex-1">{t("common.save")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

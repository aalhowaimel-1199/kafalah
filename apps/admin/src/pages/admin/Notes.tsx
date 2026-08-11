import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { noteSchema } from "@ramh/shared";
import { PageHead, Empty } from "../../components/ui";
import { api } from "../../lib/api";

type Note = { id: string; visitorKey: string; body: string; createdAt: string; author: { name: string } | null };

export function Notes() {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [form, setForm] = useState({ visitorKey: "", body: "" });
  const [error, setError] = useState("");

  const load = () => api.get<Note[]>("/api/admin/notes").then(setNotes);
  useEffect(() => { load(); }, []);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function add() {
    setError("");
    const parsed = noteSchema.safeParse(form);
    if (!parsed.success) { setError(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "تحقق"); return; }
    await api.post("/api/admin/notes", parsed.data);
    setForm({ visitorKey: "", body: "" });
    load();
  }

  return (
    <div>
      <PageHead title={t("admin.notes")} sub={t("visitForm.phone") + " / " + t("visitForm.nationalId")} />
      <div className="card mb-4 grid items-end gap-3 p-5 md:grid-cols-[1fr_2fr_auto]">
        <div><label className="label">{t("admin.blockId")}</label><input className="input" dir="ltr" value={form.visitorKey} onChange={set("visitorKey")} /></div>
        <div><label className="label">{t("admin.addNote")}</label><input className="input" value={form.body} onChange={set("body")} /></div>
        <button onClick={add} className="btn-primary">{t("common.add")}</button>
      </div>
      {error && <p className="field-error mb-3">{error}</p>}
      <div className="card">
        {notes.length === 0 ? <Empty>{t("admin.empty")}</Empty> : (
          <div className="divide-y divide-line">
            {notes.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <div className="text-[13px] font-extrabold text-navy" dir="ltr">{n.visitorKey}</div>
                  <div className="text-sm text-ink">{n.body}</div>
                </div>
                <div className="whitespace-nowrap text-xs text-slate">{n.author?.name ?? ""} · {new Date(n.createdAt).toLocaleDateString("ar-SA")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

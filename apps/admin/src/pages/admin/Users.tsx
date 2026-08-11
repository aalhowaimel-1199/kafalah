import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { userSchema } from "@ramh/shared";
import { PageHead, Toggle, Empty } from "../../components/ui";
import { api, type ApiError } from "../../lib/api";

type User = {
  id: string; name: string; email: string; role: string; active: boolean;
  canApprove: boolean; canInvite: boolean; inviteAutoApprove: boolean; canManageSettings: boolean;
};
type Cap = "canApprove" | "canInvite" | "inviteAutoApprove" | "canManageSettings";

export function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "RECEPTION" as "ADMIN" | "APPROVER" | "RECEPTION", canApprove: false, canInvite: false, inviteAutoApprove: false, canManageSettings: false });
  const [error, setError] = useState("");

  const load = () => api.get<User[]>("/api/admin/users").then(setUsers);
  useEffect(() => { load(); }, []);

  async function patch(u: User, cap: Cap) { await api.patch(`/api/admin/users/${u.id}`, { [cap]: !u[cap] }); load(); }

  async function create() {
    setError("");
    const parsed = userSchema.safeParse(form);
    if (!parsed.success) { setError(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "تحقق"); return; }
    try {
      await api.post("/api/admin/users", parsed.data);
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "RECEPTION", canApprove: false, canInvite: false, inviteAutoApprove: false, canManageSettings: false });
      load();
    } catch (e) { setError((e as { data?: ApiError }).data?.error ?? "تعذّر الإنشاء"); }
  }

  const caps: { key: Cap; label: string }[] = [
    { key: "canApprove", label: t("admin.canApprove") },
    { key: "canInvite", label: t("admin.canInvite") },
    { key: "inviteAutoApprove", label: t("admin.autoApprove") },
    { key: "canManageSettings", label: t("admin.manageSettings") },
  ];

  return (
    <div>
      <PageHead title={t("admin.users")} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#fafbfd] text-navy">
            <th className="p-3 text-start font-extrabold">{t("admin.account")}</th>
            <th className="p-3 text-start font-extrabold">{t("admin.role")}</th>
            {caps.map((c) => <th key={c.key} className="p-3 text-start font-extrabold">{c.label}</th>)}
          </tr></thead>
          <tbody>
            {users.length === 0 ? <tr><td colSpan={6}><Empty>{t("admin.empty")}</Empty></td></tr> :
              users.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="p-3"><div className="font-bold">{u.name}</div><div className="text-xs text-slate" dir="ltr">{u.email}</div></td>
                  <td className="p-3"><span className="badge bg-[#eef1f5] text-[#475569]">{u.role}</span></td>
                  {caps.map((c) => <td key={c.key} className="p-3">{u.role === "ADMIN" ? <Toggle on /> : <Toggle on={u[c.key]} onChange={() => patch(u, c.key)} />}</td>)}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <button onClick={() => setOpen(true)} className="btn-primary mt-3">+ {t("admin.addUser")}</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,14,30,0.6)] p-4" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-[19px] font-extrabold text-navy">{t("admin.addUser")}</h3>
            <div className="grid gap-3">
              <div><label className="label">{t("admin.account")}</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">{t("auth.email")}</label><input className="input" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="label">{t("auth.password")}</label><input type="password" className="input" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div><label className="label">{t("admin.role")}</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}>
                  <option value="RECEPTION">RECEPTION</option><option value="APPROVER">APPROVER</option><option value="ADMIN">ADMIN</option>
                </select>
              </div>
              {caps.map((c) => (
                <div key={c.key} className="flex items-center justify-between"><span className="text-sm font-bold">{c.label}</span>
                  <Toggle on={form[c.key]} onChange={(v) => setForm({ ...form, [c.key]: v })} /></div>
              ))}
              {error && <p className="field-error">{error}</p>}
              <div className="flex gap-2"><button onClick={() => setOpen(false)} className="btn-ghost flex-1">{t("common.cancel")}</button><button onClick={create} className="btn-primary flex-1">{t("common.save")}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

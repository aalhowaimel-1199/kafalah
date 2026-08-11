import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";
import { LangSwitch } from "./LangSwitch";
import { signOut } from "../lib/auth";
import { api } from "../lib/api";

type Me = { name: string; role: string; canInvite: boolean; canManageSettings: boolean };

export function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    api.get<Me>("/api/admin/me").then(setMe).catch(() => setMe(null));
  }, []);

  const items: Array<{ to: string; icon: Parameters<typeof Icon>[0]["name"]; label: string; show: boolean; end?: boolean }> = [
    { to: "/", icon: "dash", label: t("admin.dashboard"), show: true, end: true },
    { to: "/register", icon: "doc", label: t("admin.register"), show: true },
    { to: "/invitations", icon: "send", label: t("admin.invite"), show: me?.canInvite ?? false },
    { to: "/monitoring", icon: "pulse", label: t("admin.monitor"), show: true },
    { to: "/blacklist", icon: "ban", label: t("admin.blacklist"), show: true },
    { to: "/notes", icon: "note", label: t("admin.notes"), show: true },
    { to: "/reasons", icon: "tag", label: t("admin.reasons"), show: me?.canManageSettings ?? false },
    { to: "/departments", icon: "users", label: t("admin.departments"), show: me?.canManageSettings ?? false },
    { to: "/users", icon: "users", label: t("admin.users"), show: me?.role === "ADMIN" },
    { to: "/email", icon: "cog", label: t("admin.email"), show: me?.canManageSettings ?? false },
    { to: "/biotime", icon: "plug", label: t("admin.device"), show: me?.canManageSettings ?? false },
    { to: "/pages", icon: "doc", label: t("admin.pages"), show: me?.canManageSettings ?? false },
  ];

  const cls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-[9px] px-3.5 py-2.5 text-[14px] font-bold ${isActive ? "bg-soft text-navy [&_svg]:text-cyan-600" : "text-slate hover:bg-soft hover:text-navy"}`;

  async function logout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-full bg-[var(--bg)]">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="كفالة" className="h-10" />
            <span className="text-lg font-extrabold text-navy">{t("common.appName")}</span>
          </div>
          <div className="flex items-center gap-2">
            <LangSwitch />
            <button onClick={logout} className="btn-ghost btn-sm">{t("common.logout")}</button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-5 py-6 md:grid-cols-[248px_1fr]">
        <aside className="card h-fit overflow-hidden md:sticky md:top-6">
          <div className="flex items-center gap-3 bg-navy p-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/15">
              <Icon name="users" className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[14px] font-extrabold">{me?.name ?? t("admin.account")}</div>
              <div className="text-xs text-[#9fb4ce]">{me?.role ?? ""}</div>
            </div>
          </div>
          <nav className="flex flex-col p-2">
            {items.filter((i) => i.show).map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} className={cls}>
                <Icon name={i.icon} className="h-[18px] w-[18px]" />
                {i.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

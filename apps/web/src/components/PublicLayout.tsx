import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "./Logo";
import { LangSwitch } from "./LangSwitch";
import { Icon } from "./Icon";
import { api } from "../lib/api";

type FooterPage = { id: string; titleAr: string; titleEn: string };

export function PublicLayout() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [pages, setPages] = useState<FooterPage[]>([]);

  useEffect(() => {
    api.get<FooterPage[]>("/api/pages").then(setPages).catch(() => setPages([]));
  }, []);

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-4 py-2 text-[14.5px] font-bold ${isActive ? "bg-soft text-navy" : "text-slate hover:text-navy"}`;

  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-navy-900 text-[12.5px] text-[#aebfd2]">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-center px-5">{t("common.program")}</div>
      </div>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[78px] max-w-6xl items-center justify-between gap-4 px-5">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="h-12" />
            <span className="h-9 w-px bg-line" />
            <span>
              <span className="block text-lg font-extrabold leading-tight text-navy">{t("common.appName")}</span>
              <span className="block text-[11.5px] font-bold text-slate">{t("nav.portal")}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={link}><Icon name="home" className="h-5 w-5" />{t("nav.home")}</NavLink>
            <NavLink to="/request" className={link}><Icon name="doc" className="h-5 w-5" />{t("nav.request")}</NavLink>
            <NavLink to="/track" className={link}><Icon name="search" className="h-5 w-5" />{t("nav.track")}</NavLink>
          </nav>
          <LangSwitch />
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-navy-900 py-8 text-[#9fb2c8]">
        <div className="mx-auto max-w-6xl px-5">
          {pages.length > 0 && (
            <nav className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13.5px]">
              {pages.map((p) => (
                <Link key={p.id} to={`/page/${p.id}`} className="font-bold text-[#c5d3e4] hover:text-white">
                  {isAr ? p.titleAr : p.titleEn}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 text-[13.5px]">
            <Logo white className="h-8" />
            <span className="text-center">{t("common.appName")} — {t("common.program")}</span>
            <span className="opacity-80">{t("common.developer")} · ramh.sa</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

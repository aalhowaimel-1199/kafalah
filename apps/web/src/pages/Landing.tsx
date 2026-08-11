import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../components/Icon";

export function Landing() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-gradient-to-bl from-navy-900 via-navy to-navy-700">
      <div className="pointer-events-none absolute -left-20 -top-28 h-[420px] w-[420px] rounded-full bg-cyan/25 blur-3xl" />
      <div className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-5 py-24 text-center">
        <span className="eyebrow justify-center text-[#69d6dc]"><Icon name="shield" className="h-4 w-4" />{t("landing.eyebrow")}</span>
        <h1 className="my-4 text-[40px] font-extrabold leading-tight text-white">{t("landing.title")}</h1>
        <p className="mx-auto mb-7 max-w-2xl text-[17px] leading-8 text-[#c5d3e4]">{t("landing.lead")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/request" className="btn bg-white text-navy hover:bg-[#eef2f7]">{t("landing.ctaRequest")}</Link>
          <Link to="/track" className="btn border border-white/50 bg-transparent text-white hover:bg-white/10">{t("landing.ctaTrack")}</Link>
        </div>
      </div>
    </section>
  );
}

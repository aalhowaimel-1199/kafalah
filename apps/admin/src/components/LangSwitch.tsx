import { useTranslation } from "react-i18next";

export function LangSwitch() {
  const { i18n, t } = useTranslation();
  const toggle = () => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
  return (
    <button onClick={toggle} className="rounded-lg border border-line bg-white px-3 py-2 text-[12.5px] font-extrabold text-navy hover:bg-soft">
      {t("common.language")}
    </button>
  );
}

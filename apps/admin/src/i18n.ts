import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources, supportedLngs, rtlLangs, type Lang } from "@ramh/shared/i18n";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: [...supportedLngs],
    fallbackLng: "ar",
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });

export function applyDir(lng: string) {
  const isRtl = rtlLangs.includes(lng as Lang);
  document.documentElement.lang = lng;
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
}

applyDir(i18n.language || "ar");
i18n.on("languageChanged", applyDir);

export default i18n;

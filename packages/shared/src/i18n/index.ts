import { ar } from "./ar";
import { en } from "./en";

export const resources = {
  ar: { translation: ar },
  en: { translation: en },
} as const;

export const supportedLngs = ["ar", "en"] as const;
export type Lang = (typeof supportedLngs)[number];
export const rtlLangs: Lang[] = ["ar"];

export { ar, en };

import i18next, { type Resource } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

export type { Resource };

export const supportedLanguages = ["en", "id"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage = "en" satisfies SupportedLanguage;

export const languageLabels = {
  en: "English",
  id: "Bahasa Indonesia",
} satisfies Record<SupportedLanguage, string>;

export type FrontendI18nOptions = {
  appName: string;
  defaultNamespace: string;
  resources: Resource;
  fallbackLanguage?: SupportedLanguage;
  storageKey?: string;
};

export function createFrontendI18n({
  appName,
  defaultNamespace,
  resources,
  fallbackLanguage = defaultLanguage,
  storageKey = `${appName}:language`,
}: FrontendI18nOptions) {
  const instance = i18next.createInstance();

  void instance
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      defaultNS: defaultNamespace,
      fallbackLng: fallbackLanguage,
      supportedLngs: [...supportedLanguages],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        caches: ["localStorage"],
        lookupLocalStorage: storageKey,
      },
      react: {
        useSuspense: false,
      },
    });

  return instance;
}

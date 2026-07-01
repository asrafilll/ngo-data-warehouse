import type { i18n } from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import {
  defaultLanguage,
  languageLabels,
  supportedLanguages,
  type SupportedLanguage,
} from "./frontend";

export { useTranslation };
export {
  createFrontendI18n,
  defaultLanguage,
  languageLabels,
  supportedLanguages,
} from "./frontend";
export type { FrontendI18nOptions, Resource, SupportedLanguage } from "./frontend";

export function AppI18nProvider({ children, i18n }: { children: ReactNode; i18n: i18n }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language);

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{t("language.label")}</span>
      <select
        aria-label={t("language.label")}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        value={activeLanguage}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value);
        }}
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language}>
            {t(`language.options.${language}`, languageLabels[language])}
          </option>
        ))}
      </select>
    </label>
  );
}

function getSupportedLanguage(language: string | undefined): SupportedLanguage {
  const normalizedLanguage = language?.split("-")[0];

  return (
    supportedLanguages.find((supportedLanguage) => supportedLanguage === normalizedLanguage) ??
    defaultLanguage
  );
}

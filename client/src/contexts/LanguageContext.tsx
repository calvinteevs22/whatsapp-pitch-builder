import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  translations,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/lib/translations";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  languageLabel: string;
  nativeLabel: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem("wa-thread-builder-lang");
      if (stored && translations[stored as SupportedLanguage]) {
        return stored as SupportedLanguage;
      }
    } catch {}
    return "en";
  });

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("wa-thread-builder-lang", lang);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string): string => {
      const langTranslations = translations[language];
      return (langTranslations as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key;
    },
    [language]
  );

  const langOption = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  const languageLabel = langOption?.label || "English";
  const nativeLabel = langOption?.nativeLabel || "English";

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, languageLabel, nativeLabel }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

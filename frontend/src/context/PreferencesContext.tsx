/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * CONTEXT: PreferencesContext (Theme, Accessibility Resizer & Language Provider)
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { TRANSLATIONS, TranslationDict } from "../data/translations";

export type ThemeMode = "light" | "dark";
export type FontScale = "sm" | "base" | "lg";
export type Language = "en" | "hi";

interface PreferencesContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: TranslationDict;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mplads_theme");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "light";
  });

  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mplads_font_scale");
      if (saved === "sm" || saved === "base" || saved === "lg") return saved;
    }
    return "base";
  });

  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mplads_lang");
      if (saved === "en" || saved === "hi") return saved;
    }
    return "en";
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("mplads_theme", newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const setFontScale = (newScale: FontScale) => {
    setFontScaleState(newScale);
    try {
      localStorage.setItem("mplads_font_scale", newScale);
    } catch {}
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("mplads_lang", newLang);
    } catch {}
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "hi" : "en");
  };

  // Synchronize DOM attributes with active preferences
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-font-scale", fontScale);
    document.body.setAttribute("data-font-scale", fontScale);
    document.documentElement.setAttribute("lang", lang);
  }, [theme, fontScale, lang]);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        fontScale,
        setFontScale,
        lang,
        setLang,
        toggleLang,
        t
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    return {
      theme: "light" as ThemeMode,
      setTheme: () => {},
      toggleTheme: () => {},
      fontScale: "base" as FontScale,
      setFontScale: () => {},
      lang: "en" as Language,
      setLang: () => {},
      toggleLang: () => {},
      t: TRANSLATIONS.en
    };
  }
  return context;
};

export default usePreferences;

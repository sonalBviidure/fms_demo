import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';

// ──────────────────────────────────────────────────────────────────────────────
//  Language Context — FMS Centralized i18n Support (English / Marathi)
// ──────────────────────────────────────────────────────────────────────────────

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { t: i18nTranslate } = useTranslation();
  const [language, setLanguage] = useState(() => i18n.language || localStorage.getItem('fms_lang') || 'en');

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguage(lng);
      localStorage.setItem('fms_lang', lng);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lng;
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [language]);

  const setLang = useCallback((lang) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    localStorage.setItem('fms_lang', lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    const next = language === 'en' ? 'mr' : 'en';
    setLang(next);
  }, [language, setLang]);

  const t = useCallback((key, options = {}) => {
    return i18nTranslate(key, { defaultValue: key, ...options });
  }, [i18nTranslate]);

  const value = {
    language,
    toggleLanguage,
    setLang,
    changeLanguage: setLang,
    t,
    i18n,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if accessed outside provider
    return {
      language: i18n.language || 'en',
      toggleLanguage: () => {
        const next = i18n.language === 'en' ? 'mr' : 'en';
        i18n.changeLanguage(next);
      },
      setLang: (lng) => i18n.changeLanguage(lng),
      changeLanguage: (lng) => i18n.changeLanguage(lng),
      t: (key, opts) => i18n.t(key, opts),
      i18n,
    };
  }
  return context;
}

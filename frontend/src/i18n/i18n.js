import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import mrTranslation from './locales/mr/translation.json';

const savedLanguage = typeof window !== 'undefined' ? (localStorage.getItem('fms_lang') || 'en') : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      mr: {
        translation: mrTranslation,
      },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    returnNull: false,
    returnEmptyString: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
    parseMissingKeyHandler: (key) => key,
  });

export default i18n;

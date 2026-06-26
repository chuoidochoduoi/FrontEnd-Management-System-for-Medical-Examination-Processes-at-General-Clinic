import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import viCommon from './locales/vi/common.json';
import viAuth   from './locales/vi/auth.json';
import enCommon from './locales/en/common.json';
import enAuth   from './locales/en/auth.json';

// Thêm page mới thì import thêm ở đây, ví dụ:
// import viPatient from '../locales/vi/patient.json';
// import enPatient from '../locales/en/patient.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'vi',
        debug: false,
        resources: {
            vi: {
                common: viCommon,
                auth:   viAuth,
                // patient: viPatient,
            },
            en: {
                common: enCommon,
                auth:   enAuth,
                // patient: enPatient,
            },
        },
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
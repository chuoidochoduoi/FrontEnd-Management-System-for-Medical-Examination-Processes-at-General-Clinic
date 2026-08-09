import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@/constants/languages';

export function useLanguage() {
    const { i18n } = useTranslation();

    const currentLanguage = i18n.language;

    const changeLanguage = (code) => {
        localStorage.setItem('app_lang', code);
        document.documentElement.lang = code;
        i18n.changeLanguage(code);
    };

    return { currentLanguage, changeLanguage, languages: LANGUAGES };
}

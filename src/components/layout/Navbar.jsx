// src/components/layout/Navbar.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { ROUTES } from '@/constants/routes';

export default function Navbar() {
    const { t } = useTranslation('common');
    const { currentLanguage, changeLanguage, languages } = useLanguage();

    return (
        <nav className="flex items-center justify-between px-10 h-14 border-b border-gray-200 bg-white sticky top-0 z-50 font-jakarta">

            <Link to={ROUTES.HOME} className="text-sm font-semibold text-gray-900">
                LOGO
            </Link>

            <div className="flex gap-7">
                <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">{t('nav.appointment')}</Link>
                <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">{t('nav.doctors')}</Link>
                <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">{t('nav.pricing')}</Link>
                <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">{t('nav.guide')}</Link>
                <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">{t('nav.contact')}</Link>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex gap-1 mr-2">
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`text-lg px-1 rounded transition-opacity ${currentLanguage === lang.code ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                        >
                            {lang.flag}
                        </button>
                    ))}
                </div>

                <Link to={ROUTES.LOGIN}>
                    <button className="px-4 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:border-primary-500 hover:text-primary-500 transition-colors">
                        {t('nav.login')}
                    </button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                    <button className="px-4 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors">
                        {t('nav.register')}
                    </button>
                </Link>
            </div>

        </nav>
    );
}
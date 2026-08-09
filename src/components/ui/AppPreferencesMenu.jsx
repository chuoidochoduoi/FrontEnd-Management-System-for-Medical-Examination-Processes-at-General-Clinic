import { Languages, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { persistPreferences, readPreferences } from '@/utils/appPreferences';

export default function AppPreferencesMenu() {
    const { i18n } = useTranslation();
    const [preferences, setPreferences] = useState(readPreferences);

    useEffect(() => {
        const sync = event => setPreferences(event.detail || readPreferences());
        window.addEventListener('app-preferences-changed', sync);
        return () => window.removeEventListener('app-preferences-changed', sync);
    }, []);

    const change = next => {
        const updated = { ...preferences, ...next };
        setPreferences(updated);
        persistPreferences(updated);
        if (next.language) i18n.changeLanguage(next.language);
    };

    return <div className="flex items-center gap-1 border-r border-gray-200 pr-1">
        <button type="button" onClick={() => change({ theme: preferences.theme === 'dark' ? 'light' : 'dark' })}
            title={preferences.theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            {preferences.theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
        </button>
        <button type="button" onClick={() => change({ language: preferences.language === 'vi' ? 'en' : 'vi' })}
            title="Switch language" className="flex h-8 items-center gap-1 rounded-full px-2 text-xs font-bold text-gray-600 hover:bg-gray-100">
            <Languages size={15}/>{preferences.language.toUpperCase()}
        </button>
    </div>;
}

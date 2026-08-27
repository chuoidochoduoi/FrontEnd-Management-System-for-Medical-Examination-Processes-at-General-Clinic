import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { persistPreferences, readPreferences } from '@/utils/appPreferences';

export default function AppPreferencesMenu() {
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
    };

    return <div className="flex items-center gap-1 border-r border-gray-200 pr-1">
        <button type="button" onClick={() => change({ theme: preferences.theme === 'dark' ? 'light' : 'dark' })}
            title={preferences.theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
            {preferences.theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
        </button>
    </div>;
}

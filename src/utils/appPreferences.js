export const PREFERENCE_KEYS = {
    theme: 'app_theme',
    language: 'app_lang',
    compact: 'app_compact',
};

export const readPreferences = () => ({
    theme: localStorage.getItem(PREFERENCE_KEYS.theme) === 'dark' ? 'dark' : 'light',
    language: localStorage.getItem(PREFERENCE_KEYS.language) === 'en' ? 'en' : 'vi',
    compact: localStorage.getItem(PREFERENCE_KEYS.compact) === 'true',
});

export const applyPreferences = (preferences) => {
    const root = document.documentElement;
    root.classList.toggle('dark', preferences.theme === 'dark');
    root.dataset.theme = preferences.theme;
    root.dataset.density = preferences.compact ? 'compact' : 'comfortable';
    root.lang = preferences.language;
    root.style.colorScheme = preferences.theme;
};

export const initializePreferences = () => {
    const preferences = readPreferences();
    applyPreferences(preferences);
    return preferences;
};

export const persistPreferences = (preferences) => {
    localStorage.setItem(PREFERENCE_KEYS.theme, preferences.theme);
    localStorage.setItem(PREFERENCE_KEYS.language, preferences.language);
    localStorage.setItem(PREFERENCE_KEYS.compact, String(preferences.compact));
    applyPreferences(preferences);
    window.dispatchEvent(new CustomEvent('app-preferences-changed', { detail: preferences }));
};

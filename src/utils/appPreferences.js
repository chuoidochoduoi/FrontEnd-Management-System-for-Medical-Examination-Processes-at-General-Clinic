export const PREFERENCE_KEYS = {
    theme: 'app_theme',
    language: 'app_lang',
    compact: 'app_compact',
};

export const readPreferences = () => ({
    theme: localStorage.getItem(PREFERENCE_KEYS.theme) === 'dark' ? 'dark' : 'light',
    language: 'vi',
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
    const normalizedPreferences = { ...preferences, language: 'vi' };
    localStorage.setItem(PREFERENCE_KEYS.theme, normalizedPreferences.theme);
    localStorage.setItem(PREFERENCE_KEYS.language, 'vi');
    localStorage.setItem(PREFERENCE_KEYS.compact, String(normalizedPreferences.compact));
    applyPreferences(normalizedPreferences);
    window.dispatchEvent(new CustomEvent('app-preferences-changed', { detail: normalizedPreferences }));
};

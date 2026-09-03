const SESSION_AUTH_KEYS = [
    'token',
    'refreshToken',
    'role',
    'username',
    'accountId',
    'systemRole',
    'staffId',
];

export function openAuthenticatedTab(path) {
    const nextTab = window.open('about:blank', '_blank');
    if (!nextTab) {
        window.location.assign(path);
        return;
    }

    SESSION_AUTH_KEYS.forEach((key) => {
        const value = sessionStorage.getItem(key);
        if (value != null) nextTab.sessionStorage.setItem(key, value);
    });

    nextTab.opener = null;
    nextTab.location.replace(new URL(path, window.location.origin).href);
}

import { useCallback, useEffect, useState } from 'react';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);

export function useCapabilities() {
    const [capabilities, setCapabilities] = useState([]);
    const loadCapabilities = useCallback(async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/service-capabilities`, {
            headers: { Authorization: `Bearer ${get('token')}` },
        });
        if (response.ok) setCapabilities((await response.json()).filter(item => item.active !== false));
    }, []);
    useEffect(() => { loadCapabilities(); }, [loadCapabilities]);
    return { capabilities, loadCapabilities };
}

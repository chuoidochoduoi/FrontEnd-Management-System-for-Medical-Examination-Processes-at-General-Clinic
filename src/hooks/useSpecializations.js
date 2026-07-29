// src/hooks/useSpecializations.js
import { useState, useCallback, useEffect } from 'react';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = () => ({ Authorization: `Bearer ${get('token')}` });

export function useSpecializations() {
    const [specializations, setSpecializations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchSpecializations = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/specializations`, { headers: bearer() });
            if (!res.ok) throw new Error('Cannot load specializations');
            const data = await res.json();
            setSpecializations(Array.isArray(data.content) ? data.content : []);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchSpecializations(); }, [fetchSpecializations]);

    return { specializations, loading, error, fetchSpecializations };
}
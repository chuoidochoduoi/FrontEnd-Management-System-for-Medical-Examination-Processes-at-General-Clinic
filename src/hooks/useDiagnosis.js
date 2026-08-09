// src/hooks/useDiagnosis.js
import { useState, useCallback } from 'react';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

export function useDiagnosis(initial = []) {
    const [selected, setSelected] = useState(initial);
    const [results,  setResults]  = useState([]);
    const [query,    setQuery]    = useState('');
    const [loading,  setLoading]  = useState(false);

    const search = useCallback(async (q) => {
        setQuery(q);
        if (!q.trim()) { setResults([]); return; }
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/icd10-codes?q=${encodeURIComponent(q)}`,
                { headers: bearer() }
            );
            if (res.ok) {
                const data = await res.json();
                // Handle paginated response with 'content' array
                const items = data?.content ?? data ?? [];
                setResults(items);
            }
        } finally { setLoading(false); }
    }, []);

    const add = (item) => {
        if (!selected.find(s => s.code === item.code)) {
            // Normalize ICD-10 item - backend may return codeName instead of name/label
            const normalized = {
                code: item.code,
                label: item.name ?? item.label ?? item.codeName ?? item.title ?? ''
            };
            setSelected(prev => [...prev, normalized]);
        }
        setQuery(''); setResults([]);
    };

    const remove = (code) =>
        setSelected(prev => prev.filter(s => s.code !== code));

    return { selected, results, query, loading, search, add, remove, setSelected };
}

// Generic hook for referrals and lab orders (same pattern)
export function useTagSearch(initial = [], endpoint) {
    const [selected, setSelected] = useState(initial);
    const [results,  setResults]  = useState([]);
    const [query,    setQuery]    = useState('');
    const [loading,  setLoading]  = useState(false);

    const search = useCallback(async (q) => {
        setQuery(q);
        if (!q.trim()) { setResults([]); return; }
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}${endpoint}?q=${encodeURIComponent(q)}`,
                { headers: bearer() }
            );
            if (res.ok) {
                const data = await res.json();
                // Handle paginated response with 'content' array
                setResults(data?.content ?? data ?? []);
            }
        } finally { setLoading(false); }
    }, [endpoint]);

    const add = (item) => {
        if (!selected.find(s => s.id === item.id)) {
            setSelected(prev => [...prev, item]);
        }
        setQuery(''); setResults([]);
    };

    const remove = (id) =>
        setSelected(prev => prev.filter(s => s.id !== id));

    const clear = () => setSelected([]);

    return { selected, results, query, loading, search, add, remove, setSelected, clear };
}

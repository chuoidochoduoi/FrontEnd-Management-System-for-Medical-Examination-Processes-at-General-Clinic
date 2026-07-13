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
                `${import.meta.env.VITE_API_URL}/api/doctor/icd10?q=${encodeURIComponent(q)}`,
                { headers: bearer() }
            );
            if (res.ok) setResults(await res.json());
        } finally { setLoading(false); }
    }, []);

    const add = (item) => {
        if (!selected.find(s => s.code === item.code)) {
            setSelected(prev => [...prev, item]);
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
            if (res.ok) setResults(await res.json());
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

    return { selected, results, query, loading, search, add, remove, setSelected };
}
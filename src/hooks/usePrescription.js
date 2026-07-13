// src/hooks/usePrescription.js
import { useState, useCallback } from 'react';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

export function usePrescription(initial = []) {
    const [items,   setItems]   = useState(initial);
    const [results, setResults] = useState([]);
    const [query,   setQuery]   = useState('');
    const [loading, setLoading] = useState(false);

    const search = useCallback(async (q) => {
        setQuery(q);
        if (!q.trim()) { setResults([]); return; }
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/doctor/medicines?q=${encodeURIComponent(q)}`,
                { headers: bearer() }
            );
            if (res.ok) setResults(await res.json());
        } finally { setLoading(false); }
    }, []);

    const add = (medicine) => {
        setItems(prev => [...prev, {
            id:          medicine.id,
            name:        medicine.name,
            dosage:      medicine.defaultDosage ?? '',
            frequency:   medicine.defaultFrequency ?? '',
            duration:    medicine.defaultDuration ?? 7,
            quantity:    medicine.defaultQuantity ?? 14,
            unit:        medicine.unit ?? 'viên',
            instruction: '',
        }]);
        setQuery(''); setResults([]);
    };

    const update = (id, field, value) =>
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));

    const remove = (id) =>
        setItems(prev => prev.filter(item => item.id !== id));

    return { items, results, query, loading, search, add, update, remove, setItems };
}
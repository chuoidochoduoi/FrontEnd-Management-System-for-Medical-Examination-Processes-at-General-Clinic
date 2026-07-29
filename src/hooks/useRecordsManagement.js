// src/hooks/useRecordsManagement.js
import { useState, useCallback } from 'react';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const PAGE_SIZE = 10;

export function useRecordsManagement() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [total,   setTotal]   = useState(0);
    const [page,    setPage]    = useState(1);

    const fetchRecords = useCallback(async ({ search = '', gender = '', age = '', bloodType = '', page = 1 } = {}) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (gender && gender !== 'All') params.append('gender', gender);
            if (age && age !== 'All') params.append('age', age);
            if (bloodType && bloodType !== 'All') params.append('bloodType', bloodType);
            params.append('page', page - 1);
            params.append('size', PAGE_SIZE);

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/receptionist/records?${params}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error('Không thể tải danh sách hồ sơ.');
            const data = await res.json();
            console.log('Records API response:', data);
            const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
            setRecords(items);
            setTotal(data.total ?? items.length);
            setPage(page);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    return { records, loading, error, total, page, PAGE_SIZE, fetchRecords };
}
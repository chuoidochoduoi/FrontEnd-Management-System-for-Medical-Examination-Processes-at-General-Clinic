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

    const fetchRecords = useCallback(async ({ search = '', gender = '', age = '', bloodType = '', page = 0 } = {}) => {
        setLoading(true); setError('');
        try {
            // API search-by-phone chỉ nhận 'phone', dùng search field
            const params = new URLSearchParams({ phone: search });
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/receptionist/records/search-by-phone?${params}`,
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
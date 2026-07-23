// src/hooks/useLabQueue.js
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

const PAGE_SIZE = 8;

export function useLabQueue(departmentId = null) {
    const { t } = useTranslation('lab');

    const [orders,  setOrders]  = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [total,   setTotal]   = useState(0);
    const [page,    setPage]    = useState(1);

    const fetchOrders = useCallback(async ({ search = '', status = '', sort = 'newest', page = 0, departmentId: deptId } = {}) => {
        setLoading(true); setError('');
        // Debug: log token existence
        const token = get('token');
        console.log('[useLabQueue] Token exists:', !!token, 'length:', token?.length);
        console.log('[useLabQueue] Params:', { search, status, sort, page: page, departmentId: deptId });
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (status) params.set('status', status);
            if (deptId) params.set('departmentId', deptId);
            params.set('page', page);
            params.set('size', PAGE_SIZE);
            params.set('sort', 'createdAt,desc');

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/test-requests?${params}`,
                { headers: { Authorization: `Bearer ${get('token')}` } }
            );
            if (!res.ok) throw new Error(t('labQueue.errors.loadFailed'));
            const data = await res.json();

            // Extract orders from response
            const rawOrders = data.content ?? data.items ?? data;

            // Map orders: extract status string from enum object if needed
            const mappedOrders = rawOrders.map(order => ({
                ...order,
                // Backend trả về TestRequestStatus enum (có thể là object hoặc string)
                // Chỉ lấy name nếu là object, hoặc dùng trực tiếp nếu là string
                status: typeof order.status === 'object' && order.status?.name
                    ? order.status.name
                    : (typeof order.status === 'string' ? order.status : String(order.status || 'PENDING')),
            }));

            setOrders(mappedOrders);
            setTotal(data.totalElements ?? data.total ?? data.length);
            setPage(page + 1);
        } catch (err) {
            setError(err.message || t('labQueue.errors.unknown'));
        } finally { setLoading(false); }
    }, []);

    // Fetch on mount or departmentId change
    useEffect(() => {
        fetchOrders({ departmentId });
    }, [departmentId, fetchOrders]);

    return { orders, loading, error, total, page, PAGE_SIZE, fetchOrders };
}
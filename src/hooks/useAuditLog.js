import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useAuditLog() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const PAGE_SIZE = 10;

    const fetchLogs = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const searchParams = new URLSearchParams();
            
            if (params.page !== undefined) searchParams.append('page', params.page);
            searchParams.append('size', PAGE_SIZE);
            searchParams.append('sort', 'createdAt,desc');
            
            if (params.actorId) searchParams.append('actorId', params.actorId);
            if (params.action) searchParams.append('action', params.action);
            if (params.entityName) searchParams.append('entityName', params.entityName);
            if (params.from) searchParams.append('from', params.from);
            if (params.to) searchParams.append('to', params.to);

            const res = await fetch(`${API_URL}/api/v1/audit-logs?${searchParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Lỗi khi tải nhật ký hệ thống');
            }

            if (data.data && data.data.content) {
                setLogs(data.data.content);
                setTotal(data.data.totalElements);
                setPage(data.data.page);
            } else {
                // Fallback structure
                setLogs(data.content || []);
                setTotal(data.totalElements || 0);
                setPage(data.page || 0);
            }
        } catch (err) {
            setError(err.message);
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        logs,
        total,
        page,
        loading,
        error,
        fetchLogs,
        PAGE_SIZE
    };
}

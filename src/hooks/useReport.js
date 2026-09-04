import { useCallback, useEffect, useRef, useState } from 'react';

export function useReport(fromDate, toDate) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    const sequence = useRef(0);
    const refresh = useCallback(() => setReload(value => value + 1), []);
    useEffect(() => {
        const controller = new AbortController();
        const current = ++sequence.current;
        async function load() {
            setLoading(true);
            setError('');
            setData(null);
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const params = new URLSearchParams({ fromDate, toDate });
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/reports/overview?${params}`, {
                    headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
                });
                if (!response.ok) throw new Error(response.status === 403
                    ? 'Bạn không có quyền xem báo cáo này.' : 'Không tải được báo cáo. Vui lòng thử lại.');
                const payload = await response.json();
                if (sequence.current === current) setData(payload.data ?? payload);
            } catch (err) {
                if (err.name !== 'AbortError' && sequence.current === current) setError(err.message);
            } finally {
                if (sequence.current === current && !controller.signal.aborted) setLoading(false);
            }
        }
        load();
        return () => controller.abort();
    }, [fromDate, toDate, reload]);
    return { data, loading, error, refresh };
}

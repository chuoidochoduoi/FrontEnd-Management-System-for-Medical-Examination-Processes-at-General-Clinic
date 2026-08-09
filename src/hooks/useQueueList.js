import { useState, useEffect, useCallback, useRef } from 'react';

const PAGE_SIZE = 10;

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

/**
 * Fetches the patient queue for the waiting room screen (shared by doctors & nurses).
 *
 * GET /api/queue?status=&search=&sort=&page=&pageSize=
 *
 * @param {{ status?: string, search?: string, sort?: string, page?: number }} params
 * @returns {{
 *   items: object[],
 *   total: number,
 *   page: number,
 *   pageSize: number,
 *   loading: boolean,
 *   error: Error|null,
 *   reload: () => void,
 * }}
 */
export function useQueueList({ status = 'all', search = '', sort = 'newest', page = 1, departmentId } = {}) {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const requestId = useRef(0);

    const fetchQueue = useCallback(async () => {
        const currentRequest = ++requestId.current;
        setLoading(true);
        setError(null);

        try {
            // Frontend is 1-based, backend is 0-based
            const backendPage = Math.max(0, page - 1);
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';

            // When departmentId provided, use /waiting/{departmentId} endpoint
            let url;
            if (departmentId) {
                // GET /api/v1/queue-tickets/waiting/{departmentId}
                url = `${apiBase}/api/v1/queue-tickets/waiting/${departmentId}?status=${status}&search=${encodeURIComponent(search)}&sort=queueNumber&page=${backendPage}&pageSize=${PAGE_SIZE}`;
            } else {
                // Fallback to general queue endpoint
                const qs = new URLSearchParams({
                    status,
                    search,
                    sort: 'queueNumber',
                    page: String(backendPage),
                    pageSize: String(PAGE_SIZE),
                });
                url = `${apiBase}/api/queue?${qs.toString()}`;
            }
            const token = get('token');
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const responseText = await res.clone().text();
            const data = await res.json();

            // Ignore stale responses from superseded requests
            if (currentRequest !== requestId.current) return;

            // Handle both Spring Boot Page format (content/totalElements) and custom format (items/total)
            const responseItems = data.items ?? data.content ?? [];
            const responseTotal = data.total ?? data.totalElements ?? 0;

            setItems(responseItems);
            setTotal(responseTotal);
        } catch (err) {
            if (currentRequest !== requestId.current) return;
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            if (currentRequest === requestId.current) setLoading(false);
        }
    }, [status, search, sort, page, departmentId]);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    return { items, total, page, pageSize: PAGE_SIZE, loading, error, reload: fetchQueue };
}

export default useQueueList;

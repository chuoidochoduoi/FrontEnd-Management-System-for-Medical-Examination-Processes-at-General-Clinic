// src/hooks/useQueueWaiting.js
import { useState, useEffect, useCallback, useRef } from 'react';

const PAGE_SIZE = 200;

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

/**
 * Fetches waiting queue for a department (WAITING + CALLED statuses).
 * GET /api/v1/queue-tickets/waiting/{departmentId}
 */
export function useQueueWaiting(departmentId, filters = {}) {
    const [tickets, setTickets] = useState([]);
    const [waitingCount, setWaitingCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const requestId = useRef(0);

    const fetchWaiting = useCallback(async () => {
        if (!departmentId) {
            setTickets([]);
            setWaitingCount(0);
            return;
        }

        const currentRequest = ++requestId.current;
        setLoading(true);
        setError(null);

        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const token = get('token');
            const params = new URLSearchParams({ page: '0', size: String(PAGE_SIZE) });
            if (filters.workDate) params.set('workDate', filters.workDate);
            if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
            const requiresFullQueue = filters.showAll || ['IN_PROGRESS', 'DONE', 'SKIPPED'].includes(filters.status);
            const url = requiresFullQueue
                ? `${apiBase}/api/v1/queue-tickets?departmentId=${departmentId}&${params}`
                : `${apiBase}/api/v1/queue-tickets/waiting/${departmentId}?${params}`;
            console.log('[useQueueWaiting] URL:', url);

            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            console.log('[useQueueWaiting] Response status:', res.status, res.ok);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const responseText = await res.clone().text();
            console.log('[useQueueWaiting] Response text length:', responseText.length);

            // Handle empty response
            if (!responseText || responseText.trim() === '') {
                console.log('[useQueueWaiting] Empty response');
                setTickets([]);
                setWaitingCount(0);
                return;
            }

            const rawData = JSON.parse(responseText);
            // Handle Spring Boot RestResponses wrapper
            const data = rawData.data ?? rawData.result ?? rawData;
            const items = data.items ?? data.content ?? [];

            console.log('[useQueueWaiting] Tickets:', items.length);

            if (currentRequest !== requestId.current) return;
            const keyword = filters.search?.trim().toLocaleLowerCase('vi') ?? '';
            let visibleItems = keyword ? items.filter(ticket =>
                [ticket.patientName, ticket.patientCode, ticket.patientPhone, ticket.serviceName, ticket.queueNumber]
                    .some(value => String(value ?? '').toLocaleLowerCase('vi').includes(keyword))
            ) : items;
            if (filters.sort === 'QUEUE_DESC') visibleItems = [...visibleItems].sort((a, b) => (b.queueNumber ?? 0) - (a.queueNumber ?? 0));
            else if (filters.sort === 'NAME_ASC') visibleItems = [...visibleItems].sort((a, b) => (a.patientName ?? '').localeCompare(b.patientName ?? '', 'vi'));
            else visibleItems = [...visibleItems].sort((a, b) => (a.queueNumber ?? 0) - (b.queueNumber ?? 0));
            setTickets(visibleItems);
            // Total count from PageResponse
            setWaitingCount(visibleItems.length);
        } catch (err) {
            if (currentRequest !== requestId.current) return;
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            if (currentRequest === requestId.current) setLoading(false);
        }
    }, [departmentId, filters.workDate, filters.status, filters.search, filters.sort, filters.showAll]);

    useEffect(() => {
        fetchWaiting();
    }, [fetchWaiting]);

    return { tickets, waitingCount, loading, error, reload: fetchWaiting };
}

export default useQueueWaiting;

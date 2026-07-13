// src/hooks/useInProgressPatient.js
import { useState, useEffect, useCallback } from 'react';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

/**
 * Fetches in-progress patient for a department.
 * GET /api/queue/in-progress/{departmentId}
 */
export function useInProgressPatient(departmentId) {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchInProgress = useCallback(async () => {
        if (!departmentId) return;

        setLoading(true);
        setError(null);
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const token = get('token');
            const url = `${apiBase}/api/v1/queue-tickets/in-progress/${departmentId}`;
            console.log('[useInProgressPatient] URL:', url);
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            console.log('[useInProgressPatient] Response status:', res.status, res.ok);
            console.log('[useInProgressPatient] Response headers:', [...res.headers.entries()]);

            if (res.status === 404) {
                // No in-progress patient
                console.log('[useInProgressPatient] No in-progress patient found');
                setTicket(null);
                return;
            }

            if (!res.ok) {
                const errText = await res.text();
                console.error('[useInProgressPatient] HTTP Error:', res.status, errText);
                throw new Error(`HTTP ${res.status}: ${errText}`);
            }

            const responseText = await res.clone().text();
            console.log('[useInProgressPatient] Response text length:', responseText.length);
            console.log('[useInProgressPatient] Response text:', responseText);

            // Handle empty response (no in-progress patient)
            if (!responseText || responseText.trim() === '') {
                console.log('[useInProgressPatient] Empty response - no in-progress patient');
                setTicket(null);
                return;
            }

            const rawData = JSON.parse(responseText);
            // Handle Spring Boot RestResponses wrapper (data.data or data.result)
            const data = rawData.data ?? rawData.result ?? rawData;
            console.log('[useInProgressPatient] Response data:', data);
            setTicket(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, [departmentId]);

    useEffect(() => {
        fetchInProgress();
    }, [fetchInProgress]);

    return { ticket, loading, error, reload: fetchInProgress };
}

export default useInProgressPatient;
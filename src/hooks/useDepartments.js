// src/hooks/useDepartments.js
import { useState, useEffect, useCallback } from 'react';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

/**
 * Fetches examination departments for doctors to select from.
 * GET /api/v1/departments?departmentType=EXAMINATION
 */
export function useDepartments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDepartments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const token = get('token');
            const res = await fetch(`${apiBase}/api/v1/departments?departmentType=EXAMINATION`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            // Handle Spring Boot Page format
            const items = data.items ?? data.content ?? [];
            setDepartments(items);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    return { departments, loading, error, reload: fetchDepartments };
}

export default useDepartments;
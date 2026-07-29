// src/hooks/useMyDepartment.js
import { useState, useEffect } from 'react';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export function useMyDepartment() {
    const [myDepartment, setMyDepartment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMyDepartment = async () => {
            const systemRole = get('systemRole');
            if (systemRole !== 'DOCTOR' && systemRole !== 'ROLE_DOCTOR') {
                setLoading(false);
                return;
            }

            try {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                const token = get('token');

                const res = await fetch(`${apiBase}/api/v1/departments/my-department`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });

                if (!res.ok) {
                    if (res.status === 404) {
                        setMyDepartment(null);
                        setError(new Error('not_assigned'));
                    } else {
                        throw new Error(`HTTP error ${res.status}`);
                    }
                } else {
                    const data = await res.json();
                    setMyDepartment(data);
                }
            } catch (err) {
                if (err.message !== 'not_assigned') {
                    setError(err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMyDepartment();
    }, []);

    return { myDepartment, loading, error };
}

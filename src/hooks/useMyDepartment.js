import { useState, useEffect } from 'react';
import { decodeToken } from '@/utils/jwtUtils';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export function useMyDepartment() {
    const [myDepartment, setMyDepartment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMyDepartment = async () => {
            const systemRole = get('systemRole')?.toUpperCase() || '';
            const role = get('role')?.toUpperCase() || '';
            const token = get('token');
            const decoded = decodeToken(token);
            const authorities = decoded?.authorities || [];
            const isDoctor = authorities.includes('ROLE_DOCTOR') || authorities.includes('ROLE_GENERAL_DOCTOR') || authorities.includes('ROLE_SPECIALIST_DOCTOR') || role.includes('DOCTOR') || systemRole.includes('DOCTOR');
            const isNurse = authorities.includes('ROLE_NURSE') || role.includes('NURSE') || systemRole.includes('NURSE');
            if (!isDoctor && !isNurse) {
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
                    const json = await res.json();
                    // Backend có thể bọc trong { data: ... } hoặc trả thẳng object
                    const data = json?.data ?? json;
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

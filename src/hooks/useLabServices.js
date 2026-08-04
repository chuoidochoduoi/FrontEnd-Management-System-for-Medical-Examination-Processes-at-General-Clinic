// src/hooks/useLabServices.js
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const authHeader = () => ({ Authorization: `Bearer ${get('token')}` });

export function useLabServices() {
    const { t } = useTranslation('doctor');
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLabServices = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/medical-services/available?departmentType=PARACLINICAL&size=1000`,
                    { headers: authHeader() }
                );
                if (!res.ok) throw new Error(t('examination.errors.loadFailed'));
                const data = await res.json();
                const payload = data.data ?? data.result ?? data;
                const items = payload.items ?? payload.content ?? [];
                setServices(items.filter(service => ['PARACLINICAL', 'LABORATORY', 'IMAGING'].includes(service.departmentType)));
            } catch (err) {
                setError(err.message || t('examination.errors.unknown'));
            } finally {
                setLoading(false);
            }
        };
        fetchLabServices();
    }, []);

    return { services, loading, error };
}

// src/hooks/useServiceManagement.js
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const PAGE_SIZE = 100; // Get all services

export function useServiceManagement() {
    const { t } = useTranslation('services');
    const [services, setServices] = useState([]);
    const [stats,    setStats]    = useState({ total: 0, active: 0, suspended: 0, draft: 0 });
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');

    const fetchServices = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services`, { headers: bearer() });
            if (!res.ok) throw new Error(t('serviceManagement.errors.loadFailed'));
            const data = await res.json();
            console.log('[fetchServices] Response:', data);

            // API returns array directly (not paged) or wrapped in content
            const rawList = Array.isArray(data) ? data : (data.content ?? []);

            // Map API response to UI format
            const mapped = rawList.map(s => ({
                id: s.serviceId,
                code: s.serviceCode,
                name: s.name,
                type: s.serviceType,
                specialty: s.requiredSpecializationName || '',
                price: s.price,
                status: s.isActive ? 'active' : 'draft', // Map isActive to status
            }));

            setServices(mapped);
            setStats({
                total: mapped.length,
                active: mapped.filter(s => s.status === 'active').length,
                suspended: 0,
                draft: mapped.filter(s => s.status === 'draft').length,
            });
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [t]);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    const suspendService = async (id) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services/${id}/deactivate`, {
            method: 'PATCH', headers: bearer(),
        });
        if (!res.ok) throw new Error(t('serviceManagement.errors.suspendFailed'));
        fetchServices();
    };

    const deleteService = async (id) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services/${id}`, {
            method: 'DELETE', headers: bearer(),
        });
        if (!res.ok) throw new Error(t('serviceManagement.errors.deleteFailed'));
        fetchServices();
    };

    const publishService = async (id) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services/${id}/publish`, {
            method: 'PATCH', headers: bearer(),
        });
        if (!res.ok) throw new Error(t('serviceManagement.errors.publishFailed'));
        fetchServices();
    };

    return { services, stats, loading, error, fetchServices, suspendService, deleteService };
}
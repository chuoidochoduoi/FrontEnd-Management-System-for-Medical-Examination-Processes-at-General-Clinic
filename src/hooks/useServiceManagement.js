// src/hooks/useServiceManagement.js
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const PAGE_SIZE = 10;



export function useServiceManagement() {
    const { t } = useTranslation('services');
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats,    setStats]    = useState({ total: 0, active: 0, suspended: 0, draft: 0 });
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [page,     setPage]     = useState(1);
    const [total,    setTotal]     = useState(0);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services/stats`, { headers: bearer() });
            if (res.ok) {
                const data = await res.json();
                setStats({
                    total: data.total || 0,
                    active: data.active || 0,
                    suspended: data.suspended || 0,
                    draft: data.draft || 0,
                });
            }
        } catch (err) { console.error('Failed to load stats:', err); }
    }, []);

    const fetchServices = useCallback(async (params = {}) => {
        setLoading(true); setError('');
        try {
            const { search, type, specialty, status, page } = params;
            const query = new URLSearchParams();
            if (search) query.append('search', search);
            if (type) query.append('departmentType', type);
            if (status) {
                const STATUS_MAP = { active: 'ACTIVE', suspended: 'INACTIVE', draft: 'DRAFT' };
                query.append('status', STATUS_MAP[status] || status);
            }
            if (page) query.append('page', page - 1);
            query.append('size', PAGE_SIZE);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services?${query.toString()}`, { headers: bearer() });
            if (!res.ok) throw new Error('Failed to load services');
            const data = await res.json();
            console.log('[fetchServices] Response:', data);

            // API returns array directly (not paged) or wrapped in content
            const rawList = Array.isArray(data) ? data : (data.content ?? []);
            const totalItems = Array.isArray(data) ? data.length : (data.totalElements ?? rawList.length);

            // Map API response to UI format
            const mapped = rawList.map(s => ({
                id: s.serviceId,
                code: s.serviceCode,
                name: s.name,
                type: s.departmentType,
                specialtyId: s.requiredSpecializationId || '',
                specialty: s.requiredSpecializationName || '',
                price: s.price,
                status: s.status === 'ACTIVE' ? 'active' : s.status === 'INACTIVE' ? 'suspended' : 'draft',
            }));

            setServices(mapped);
            setTotal(totalItems);
            setPage(page || 1);
            fetchStats();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [fetchStats]);

    useEffect(() => {
        fetchServices();
        fetchStats();
    }, [fetchServices, fetchStats]);

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

    const createService = async (payload) => {
        const apiType = payload.type;
        const body = {
            serviceCode: payload.code,
            name: payload.name,
            departmentType: apiType,
            price: payload.price,
        };
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services`, {
            method: 'POST',
            headers: { ...bearer(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(t('serviceManagement.errors.createFailed'));
        fetchServices();
    };

    const updateService = async (id, payload) => {
        const STATUS_MAP = {
            active: 'ACTIVE',
            suspended: 'INACTIVE',
            draft: 'DRAFT',
        };

        const apiType = payload.type;

        const body = {};

        // Include fields if provided (for EditModal)
        if (payload.name) body.name = payload.name;
        if (apiType) body.departmentType = apiType;
        if (payload.price) body.price = payload.price;

        // Include status in body if provided
        if (payload.status) {
            body.status = STATUS_MAP[payload.status] || payload.status;
        }

        if (apiType === 'LAB_TEST' && payload.specialty) {
            body.requiredSpecializationName = payload.specialty;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services/${id}`, {
            method: 'PUT',
            headers: { ...bearer(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to update service');
        fetchServices();
    };

    return { services, categories, stats, loading, error, fetchServices, fetchStats, suspendService, deleteService, createService, updateService, page, total, PAGE_SIZE };
}
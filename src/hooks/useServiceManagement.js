// src/hooks/useServiceManagement.js
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const PAGE_SIZE = 10;

// Service type mapping: frontend label -> API enum value
const SERVICE_TYPE_MAP = {
    'Khám bệnh': 'CLINICAL_EXAM',
    'Xét Nghiệm': 'LAB_TEST',
    'Chẩn đoán Hình Ảnh': 'IMAGING',
    'Thủ thuật': 'PROCEDURE',
};

export function useServiceManagement() {
    const { t } = useTranslation('services');
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats,    setStats]    = useState({ total: 0, active: 0, suspended: 0, draft: 0 });
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [page,     setPage]     = useState(1);
    const [total,    setTotal]     = useState(0);

    const fetchServices = useCallback(async (params = {}) => {
        setLoading(true); setError('');
        try {
            const { search, type, specialty, status, page } = params;
            const query = new URLSearchParams();
            if (search) query.append('search', search);
            if (type) query.append('serviceType', type);
            if (specialty) query.append('specialization', specialty);
            if (status) query.append('status', status);
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
                type: s.serviceType,
                specialtyId: s.requiredSpecializationId || '',
                specialty: s.requiredSpecializationName || '',
                price: s.price,
                status: s.status === 'ACTIVE' ? 'active' : s.status === 'INACTIVE' ? 'suspended' : 'draft',
                duration: s.durationMinutes || '',
                categoryId: s.categoryId || '',
                categoryName: s.categoryName || '',
            }));

            setServices(mapped);
            setTotal(totalItems);
            setStats({
                total: totalItems,
                active: mapped.filter(s => s.status === 'active').length,
                suspended: mapped.filter(s => s.status === 'suspended').length,
                draft: mapped.filter(s => s.status === 'draft').length,
            });
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/service-categories`, { headers: bearer() });
            if (res.ok) {
                const data = await res.json();
                setCategories(Array.isArray(data) ? data : (data.content ?? []));
            }
        } catch (err) { console.error('Failed to fetch categories:', err); }
    }, []);

    useEffect(() => {
        fetchServices();
        fetchCategories();
    }, [fetchServices, fetchCategories]);

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
        const apiType = SERVICE_TYPE_MAP[payload.type] || payload.type;
        const body = {
            serviceCode: payload.code,
            name: payload.name,
            serviceType: apiType,
            price: payload.price,
            durationMinutes: parseInt(payload.duration) || null,
            categoryId: payload.categoryId || null,
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

        const apiType = payload.type ? (SERVICE_TYPE_MAP[payload.type] || payload.type) : null;

        const body = {};

        // Include fields if provided (for EditModal)
        if (payload.name) body.name = payload.name;
        if (apiType) body.serviceType = apiType;
        if (payload.price) body.price = payload.price;
        if (payload.duration) body.durationMinutes = parseInt(payload.duration) || null;
        if (payload.categoryId) body.categoryId = payload.categoryId;

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

    return { services, categories, stats, loading, error, fetchServices, fetchCategories, suspendService, deleteService, createService, updateService, page, total, PAGE_SIZE };
}
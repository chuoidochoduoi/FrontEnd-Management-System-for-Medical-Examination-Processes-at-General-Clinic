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
    const [departments, setDepartments] = useState([]);
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
            const { search, type, specialty, status, sort, page } = params;
            const query = new URLSearchParams();
            if (search) query.append('search', search);
            if (type) query.append('departmentType', type);
            if (specialty) query.append('specializationId', specialty);
            if (sort) query.append('sort', sort);
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
                departmentId: s.departmentId || '',
                departmentName: s.departmentName || '',
                durationMinutes: s.durationMinutes ?? 15,
                workflowPriority: s.workflowPriority ?? 1,
                requiresDoctorOrder: s.requiresDoctorOrder === true,
                requiresReturnToDoctor: s.requiresReturnToDoctor === true,
                resultWaitMinutes: s.resultWaitMinutes ?? 0,
                allowCustomerBooking: s.allowCustomerBooking !== false,
                minimumAge: s.minimumAge ?? 0,
                maximumAge: s.maximumAge ?? 120,
                allowedGender: s.allowedGender || '',
                capabilityId: s.requiredCapabilityId || '',
                capabilityName: s.requiredCapabilityName || '',
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
            requiredSpecializationId: apiType === 'EXAMINATION' ? payload.specialtyId : null,
            // Thời lượng không còn do admin nhập khi tạo; dùng mặc định kỹ thuật.
            durationMinutes: 15,
            workflowPriority: Number(payload.workflowPriority ?? 1),
            requiresDoctorOrder: payload.requiresDoctorOrder === true,
            requiresReturnToDoctor: payload.requiresReturnToDoctor === true,
            resultWaitMinutes: Number(payload.resultWaitMinutes ?? 0),
            allowCustomerBooking: payload.allowCustomerBooking !== false,
            minimumAge: Number(payload.minimumAge),
            maximumAge: Number(payload.maximumAge),
            allowedGender: payload.allowedGender || null,
            requiredCapabilityId: payload.type === 'EXAMINATION' ? null : (payload.capabilityId || null),
        };
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services`, {
            method: 'POST',
            headers: { ...bearer(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || t('serviceManagement.errors.createFailed'));
        }
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
        if (payload.specialtyId !== undefined) body.requiredSpecializationId = apiType === 'EXAMINATION' ? payload.specialtyId : null;
        if (payload.durationMinutes !== undefined) body.durationMinutes = Number(payload.durationMinutes);
        if (payload.workflowPriority !== undefined) body.workflowPriority = Number(payload.workflowPriority);
        if (payload.requiresDoctorOrder !== undefined) body.requiresDoctorOrder = payload.requiresDoctorOrder;
        if (payload.requiresReturnToDoctor !== undefined) body.requiresReturnToDoctor = payload.requiresReturnToDoctor;
        if (payload.resultWaitMinutes !== undefined) body.resultWaitMinutes = Number(payload.resultWaitMinutes);
        if (payload.allowCustomerBooking !== undefined) body.allowCustomerBooking = payload.allowCustomerBooking;
        if (payload.minimumAge !== undefined) body.minimumAge = Number(payload.minimumAge);
        if (payload.maximumAge !== undefined) body.maximumAge = Number(payload.maximumAge);
        if (payload.allowedGender !== undefined) body.allowedGender = payload.allowedGender || null;
        if (payload.capabilityId !== undefined) body.requiredCapabilityId = apiType === 'EXAMINATION' ? null : (payload.capabilityId || null);

        // Include status in body if provided
        if (payload.status) {
            body.status = STATUS_MAP[payload.status] || payload.status;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services/${id}`, {
            method: 'PUT',
            headers: { ...bearer(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || 'Cập nhật dịch vụ thất bại');
        }
        fetchServices();
    };

    return { services, categories, departments, stats, loading, error, fetchServices, fetchStats, suspendService, deleteService, createService, updateService, page, total, PAGE_SIZE };
}

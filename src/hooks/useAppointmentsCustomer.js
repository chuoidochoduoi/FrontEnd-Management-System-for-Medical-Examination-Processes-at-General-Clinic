// src/hooks/useAppointments.js
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const PAGE_SIZE = 6;

export function useAppointments() {
    const { t } = useTranslation('appointments');
    const [appointments, setAppointments] = useState([]);
    const [loading,      setLoading]      = useState(false);
    const [error,        setError]        = useState('');
    const [total,        setTotal]        = useState(0);
    const [page,         setPage]         = useState(1);

    const fetchAppointments = useCallback(async ({ code = '', specialty = '', status = '', page = 0 } = {}) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ code, specialty, status, page: String(page), size: String(PAGE_SIZE) });
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/appointments/my?${params}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('myAppointments.errors.loadFailed'));
            const data = await res.json();
            setAppointments(data.content ?? data.items ?? data);
            setTotal(data.totalElements ?? data.total ?? data.length);
            setPage(page + 1); // Backend 0-based, frontend 1-based
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    const cancelAppointment = async (id) => {
        const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/v1/appointments/my/${id}/cancel`,
            { method: 'POST', headers: bearer() }
        );
        if (!res.ok) throw new Error(t('myAppointments.errors.cancelFailed'));
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    };

    return { appointments, loading, error, total, page, PAGE_SIZE, fetchAppointments, cancelAppointment };
}

export function useAppointmentDetail(appointmentId) {
    const { t } = useTranslation('appointments');
    const [detail,     setDetail]     = useState(null);
    const [loading,    setLoading]    = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [error,      setError]      = useState('');

    const fetchDetail = useCallback(async () => {
        if (!appointmentId) return;
        setLoading(true); setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/appointments/my/${appointmentId}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('appointmentDetail.errors.loadFailed'));
            setDetail(await res.json());
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [appointmentId]);

    const cancel = async () => {
        setCancelling(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/appointments/my/${appointmentId}/cancel`,
                { method: 'POST', headers: bearer() }
            );
            if (!res.ok) throw new Error(t('appointmentDetail.errors.cancelFailed'));
            setDetail(prev => ({ ...prev, status: 'cancelled' }));
        } catch (err) { setError(err.message); }
        finally { setCancelling(false); }
    };

    return { detail, loading, cancelling, error, fetchDetail, cancel };
}
// src/hooks/useAppointmentDetail.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const authHeader = () => ({ Authorization: `Bearer ${get('token')}` });

export function useAppointmentDetail(appointmentId) {
    const { t } = useTranslation('receptionist');
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading]         = useState(false);
    const [saving, setSaving]           = useState(false);
    const [checkingIn, setCheckingIn]   = useState(false);
    const [error, setError]             = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!appointmentId) return;
        const fetchDetail = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/receptionist/appointments/${appointmentId}`,
                    { headers: authHeader() }
                );
                if (!res.ok) throw new Error(t('appointmentDetail.errors.loadFailed'));
                const data = await res.json();
                setAppointment(data);
            } catch (err) {
                setError(err.message || t('appointmentDetail.errors.unknown'));
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [appointmentId]);

    const save = async (formData) => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/receptionist/appointments/${appointmentId}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify(formData),
                }
            );
            if (!res.ok) throw new Error(t('appointmentDetail.errors.saveFailed'));
            const data = await res.json();
            setAppointment(data);
        } catch (err) {
            setError(err.message || t('appointmentDetail.errors.unknown'));
        } finally {
            setSaving(false);
        }
    };

    const checkIn = async (formData) => {
        setCheckingIn(true);
        setError('');
        try {
            const saveRes = await fetch(
                `${import.meta.env.VITE_API_URL}/api/receptionist/appointments/${appointmentId}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify(formData),
                }
            );
            if (!saveRes.ok) throw new Error(t('appointmentDetail.errors.saveFailed'));

            const checkInRes = await fetch(
                `${import.meta.env.VITE_API_URL}/api/receptionist/appointments/${appointmentId}/check-in`,
                { method: 'POST', headers: authHeader() }
            );
            if (!checkInRes.ok) throw new Error(t('appointmentDetail.errors.checkInFailed'));

            navigate(ROUTES.RECEPTIONIST_CHECKIN);
        } catch (err) {
            setError(err.message || t('appointmentDetail.errors.unknown'));
        } finally {
            setCheckingIn(false);
        }
    };

    return { appointment, loading, saving, checkingIn, error, save, checkIn };
}
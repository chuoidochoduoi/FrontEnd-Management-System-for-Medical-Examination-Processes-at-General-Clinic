// src/hooks/useExamination.js
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

export function useExamination(id) {
    const { t } = useTranslation('doctor');
    const navigate = useNavigate();

    const [examination, setExamination] = useState(null);
    const [loading,     setLoading]     = useState(false);
    const [saving,      setSaving]      = useState(false);
    const [completing,  setCompleting]  = useState(false);
    const [error,       setError]       = useState('');

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true); setError('');
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/doctor/examinations/${id}`,
                    { headers: bearer() }
                );
                if (!res.ok) throw new Error(t('examination.errors.loadFailed'));
                setExamination(await res.json());
            } catch (err) {
                setError(err.message || t('examination.errors.unknown'));
            } finally { setLoading(false); }
        };
        load();
    }, [id]);

    // Lưu nháp
    const saveDraft = async (payload) => {
        setSaving(true); setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/doctor/examinations/${id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...bearer() },
                    body: JSON.stringify({ ...payload, status: 'draft' }),
                }
            );
            if (!res.ok) throw new Error(t('examination.errors.saveFailed'));
            setExamination(await res.json());
        } catch (err) {
            setError(err.message || t('examination.errors.unknown'));
        } finally { setSaving(false); }
    };

    // Hoàn thành khám — gộp tạo yêu cầu xét nghiệm (testRequests) vào payload
    const complete = async (payload) => {
        setCompleting(true); setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/queue-tickets/${id}/complete`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...bearer() },
                    body: JSON.stringify(payload),
                }
            );
            if (!res.ok) throw new Error(t('examination.errors.completeFailed'));
            navigate(ROUTES.DOCTOR_DEPARTMENTS);
        } catch (err) {
            setError(err.message || t('examination.errors.unknown'));
        } finally { setCompleting(false); }
    };

    return { examination, loading, saving, completing, error, saveDraft, complete };
}
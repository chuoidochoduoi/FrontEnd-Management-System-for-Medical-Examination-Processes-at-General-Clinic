// src/hooks/useLabDetail.js
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ROUTES } from '@/constants/routes';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

export function useLabDetail(orderId, departmentId = null) {
    const { t } = useTranslation('lab');
    const navigate = useNavigate();

    const [order,    setOrder]    = useState(null);
    const [loading,  setLoading]  = useState(false);
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState('');

    useEffect(() => {
        if (!orderId) return;
        const load = async () => {
            setLoading(true); setError('');
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}`,
                    { headers: bearer() }
                );
                if (!res.ok) throw new Error(t('labDetail.errors.loadFailed'));
                const rawData = await res.json();
                // Map status từ enum object sang string nếu cần
                const data = {
                    ...rawData,
                    status: typeof rawData.status === 'object' && rawData.status?.name
                        ? rawData.status.name
                        : (typeof rawData.status === 'string' ? rawData.status : String(rawData.status || 'PENDING')),
                };
                if (rawData.testResultId) {
                    const resultRes = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/result`,
                        { headers: bearer() }
                    );
                    if (resultRes.ok) {
                        const result = await resultRes.json();
                        data.notes = result.conclusion || '';
                        data.specimenId = result.sampleId || '';
                        data.resultFileUrl = result.imageUrl || '';
                    }
                }
                setOrder(data);
            } catch (err) {
                setError(err.message || t('labDetail.errors.unknown'));
            } finally { setLoading(false); }
        };
        load();
    }, [orderId]);

    // Upload file kết quả
    const uploadFile = async (file) => {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/upload`,
            { method: 'POST', headers: bearer(), body: form }
        );
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || t('labDetail.errors.saveFailed'));
        }
        const uploaded = await res.json();
        toast.success('Tải tệp kết quả thành công!');
        return uploaded;
    };

    const performedById = get('staffId');

    // Lưu nháp (mặc định)
    const saveDraft = async (payload) => {
        setSaving(true); setError('');
        try {
            const hasDraft = Boolean(order?.testResultId);
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/result`,
                {
                    method: hasDraft ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json', ...bearer() },
                    body: JSON.stringify({
                        testRequestId: orderId,
                        imageUrl: payload.resultFileUrl || null,
                        conclusion: payload.notes || '',
                        sampleId: payload.specimenId || '',
                        performedById,
                        complete: false,
                    }),
                }
            );
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || t('labDetail.errors.saveFailed'));
            }
            const saved = await res.json();
            setOrder(previous => ({
                ...previous,
                testResultId: saved.resultId,
                notes: saved.conclusion || '',
                specimenId: saved.sampleId || '',
                resultFileUrl: saved.imageUrl || '',
                status: previous?.status === 'PENDING' ? 'IN_PROGRESS' : previous?.status,
            }));
            toast.success('Lưu nháp kết quả thành công!');
        } catch (err) {
            setError(err.message || t('labDetail.errors.unknown'));
            toast.error(err.message || t('labDetail.errors.saveFailed'));
        } finally { setSaving(false); }
    };

    // Lưu hoàn thành
    const save = async (payload) => {
        setSaving(true); setError('');
        try {
            let res;
            const body = {
                testRequestId: orderId,
                imageUrl: payload.resultFileUrl || null,
                conclusion: payload.notes || '',
                sampleId: payload.specimenId || '',
                performedById,
            };

            if (payload.status === 'CANCELLED') {
                // Hủy yêu cầu
                res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/cancel`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...bearer() },
                        body: JSON.stringify({ cancelReason: payload.cancelReason || '' }),
                    }
                );
            } else {
                // Hoàn thiện kết quả (COMPLETED)
                res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/result/complete`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...bearer() },
                        body: JSON.stringify(body),
                    }
                );
            }

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || t('labDetail.errors.saveFailed'));
            }
            const saved = await res.json();
            setOrder(previous => ({ ...previous, ...saved, status: payload.status }));
            toast.success(payload.status === 'CANCELLED' ? 'Đã hủy yêu cầu xét nghiệm!' : 'Hoàn thành kết quả xét nghiệm!');

            // Navigate back to queue page
            if (payload.status === 'CANCELLED') {
                navigate(ROUTES.DOCTOR_LAB.replace(':departmentId', order?.departmentId || ''));
            }
            return saved;
        } catch (err) {
            setError(err.message || t('labDetail.errors.unknown'));
            toast.error(err.message || t('labDetail.errors.saveFailed'));
        } finally { setSaving(false); }
    };

    return { order, loading, saving, error, saveDraft, save, uploadFile };
}

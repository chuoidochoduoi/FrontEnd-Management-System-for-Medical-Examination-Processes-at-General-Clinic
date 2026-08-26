// src/hooks/useLabDetail.js
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const VIEW_ONLY_PERMISSIONS = Object.freeze({
    canView: true,
    canEditResult: false,
    canUpload: false,
    canSign: false,
    canCancel: false,
});

export function useLabDetail(orderId, departmentId = null) {
    const { t } = useTranslation('lab');
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
                    permissions: VIEW_ONLY_PERMISSIONS,
                    // TestRequestResponse dùng performingDepartmentId, còn màn chi tiết
                    // dùng departmentId để quay lại đúng danh sách phòng cận lâm sàng.
                    departmentId: rawData.performingDepartmentId ?? rawData.departmentId ?? null,
                    status: typeof rawData.status === 'object' && rawData.status?.name
                        ? rawData.status.name
                        : (typeof rawData.status === 'string' ? rawData.status : String(rawData.status || 'PENDING')),
                };
                const permissionRes = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/action-permissions`,
                    { headers: bearer() }
                );
                if (permissionRes.ok) {
                    data.permissions = await permissionRes.json();
                }
                if (rawData.testResultId) {
                    const resultRes = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/result`,
                        { headers: bearer() }
                    );
                    if (resultRes.ok) {
                        const result = await resultRes.json();
                        data.notes = result.conclusion || '';
                        data.specimenId = result.sampleId || '';
                        data.sampleType = result.sampleType || '';
                        data.sampleStatus = result.sampleStatus || '';
                        data.collectedAt = result.collectedAt || null;
                        data.collectedByName = result.collectedByName || '';
                        data.resultFileUrl = result.imageUrl || '';
                        data.resultFileName = result.fileName || '';
                        data.resultData = result.resultData || {};
                        data.formTemplateVersionId = result.formTemplateVersionId || null;
                    }
                    const historyRes = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/result/history`,
                        { headers: bearer() }
                    );
                    if (historyRes.ok) {
                        const history = await historyRes.json();
                        const latest = history[0];
                        if (latest) {
                            const attachmentRes = await fetch(
                                `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/result/revisions/${latest.revisionId}/attachments`,
                                { headers: bearer() }
                            );
                            if (attachmentRes.ok) data.attachments = await attachmentRes.json();
                        }
                    }
                }
                const formRes = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/clinical-form`,
                    { headers: bearer() }
                );
                if (formRes.ok) {
                    const clinicalForm = await formRes.json();
                    data.clinicalForm = clinicalForm;
                    data.resultData = data.resultData || clinicalForm.values || {};
                    data.formTemplateVersionId = data.formTemplateVersionId || clinicalForm.templateVersionId;
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
                        sampleId: payload.specimenId || null,
                        sampleType: payload.sampleType || null,
                        sampleStatus: payload.sampleStatus || null,
                        formTemplateVersionId: payload.formTemplateVersionId || null,
                        resultData: payload.resultData || null,
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
                sampleType: saved.sampleType || '',
                sampleStatus: saved.sampleStatus || '',
                collectedAt: saved.collectedAt || previous?.collectedAt || null,
                collectedByName: saved.collectedByName || previous?.collectedByName || '',
                resultFileUrl: saved.imageUrl || '',
                resultFileName: saved.fileName || previous?.resultFileName || '',
                status: previous?.status === 'PENDING' ? 'IN_PROGRESS' : previous?.status,
            }));
            toast.success('Lưu nháp kết quả thành công!');
            return saved;
        } catch (err) {
            setError(err.message || t('labDetail.errors.unknown'));
            toast.error(err.message || t('labDetail.errors.saveFailed'));
        } finally { setSaving(false); }
    };

    const uploadAttachments = async (files) => {
        const historyRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/result/history`,
            { headers: bearer() }
        );
        if (!historyRes.ok) throw new Error('Không tìm thấy bản nháp để đính kèm tệp');
        const history = await historyRes.json();
        const draft = history.find((revision) => revision.status === 'DRAFT');
        if (!draft) throw new Error('Kết quả đã ký không thể thêm tệp trực tiếp');
        const form = new FormData();
        files.forEach((file) => form.append('files', file));
        const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/result/revisions/${draft.revisionId}/attachments`,
            { method: 'POST', headers: bearer(), body: form }
        );
        const body = await response.json().catch(() => []);
        if (!response.ok) throw new Error(body?.message || 'Không thể tải tệp đính kèm');
        return body;
    };

    // Lưu hoàn thành
    const save = async (payload) => {
        setSaving(true); setError('');
        try {
            const body = {
                testRequestId: orderId,
                imageUrl: payload.resultFileUrl || null,
                conclusion: payload.notes || '',
                sampleId: payload.specimenId || null,
                sampleType: payload.sampleType || null,
                sampleStatus: payload.sampleStatus || null,
                formTemplateVersionId: payload.formTemplateVersionId || null,
                resultData: payload.resultData || null,
                performedById,
            };

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/result/complete`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...bearer() },
                    body: JSON.stringify(body),
                }
            );

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || t('labDetail.errors.saveFailed'));
            }
            const saved = await res.json();
            setOrder(previous => ({ ...previous, ...saved, status: payload.status }));
            toast.success('Hoàn thành kết quả xét nghiệm!');
            return saved;
        } catch (err) {
            setError(err.message || t('labDetail.errors.unknown'));
            toast.error(err.message || t('labDetail.errors.saveFailed'));
        } finally { setSaving(false); }
    };

    const cancelRequest = async (reason) => {
        setSaving(true); setError('');
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/test-requests/${orderId}/cancel`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...bearer() },
                    body: JSON.stringify({ reason: reason.trim() }),
                }
            );
            const body = await response.json().catch(() => null);
            if (!response.ok) throw new Error(body?.message || 'Không thể hủy yêu cầu cận lâm sàng');
            setOrder(previous => ({ ...previous, ...body, status: 'CANCELLED' }));
            toast.success('Đã hủy yêu cầu cận lâm sàng');
            return body;
        } catch (err) {
            setError(err.message || 'Không thể hủy yêu cầu cận lâm sàng');
            toast.error(err.message || 'Không thể hủy yêu cầu cận lâm sàng');
            return null;
        } finally {
            setSaving(false);
        }
    };

    return { order, loading, saving, error, saveDraft, save, uploadFile, uploadAttachments, cancelRequest };
}

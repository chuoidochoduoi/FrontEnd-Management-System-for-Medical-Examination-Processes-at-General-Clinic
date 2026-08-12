// src/hooks/useMedicalHistory.js
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const PAGE_SIZE = 7;

export function useMedicalHistory() {
    const { t } = useTranslation('medicalHistory');
    const [visits,  setVisits]  = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [total,   setTotal]   = useState(0);
    const [page,    setPage]    = useState(1);

    const fetchHistory = useCallback(async ({ search = '', page = 0 } = {}) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ search, page: String(page), size: String(PAGE_SIZE) });
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patient/medical-history?${params}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('medicalHistory.errors.loadFailed'));
            const data = await res.json();
            const rawItems = data.items ?? data;
            const uniqueVisits = Array.from(new Map(rawItems.map(item => [item.visitId || item.id, item])).values());
            setVisits(uniqueVisits);
            setTotal(data.total ?? data.length);
            setPage(page + 1); // Backend 0-based, frontend 1-based
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    return { visits, loading, error, total, page, PAGE_SIZE, fetchHistory };
}

export function useVisitDetail(visitId) {
    const { t } = useTranslation('medicalHistory');
    const [visit,   setVisit]   = useState(null);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const fetchVisit = useCallback(async () => {
        if (!visitId) return;
        setLoading(true); setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patient/medical-history/${visitId}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('visitDetail.errors.loadFailed'));
            const data = await res.json();
            // API trả về dữ liệu của cả CustomerVisit. Không ép COMPLETED ở client,
            // tránh hiển thị nút đánh giá khi lượt khám chưa thực sự kết thúc.
            setVisit({
                ...data,
                examinations: Array.isArray(data.examinations) ? data.examinations : [],
                tests: Array.isArray(data.tests) ? data.tests : [],
            });
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [visitId]);

    const rateVisit = async (feedback) => {
        if (!visitId) return false;
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patient/medical-history/${visitId}/feedback`,
                { method: 'POST', headers: { ...bearer(), 'Content-Type': 'application/json' }, body: JSON.stringify(feedback) }
            );
            if (!res.ok) throw new Error(t('visitDetail.errors.rateFailed', 'Đánh giá thất bại'));
            await fetchVisit(); // refresh data
            toast.success('Gửi đánh giá thành công!');
            return true;
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
            return false;
        }
    };

    return { visit, loading, error, fetchVisit, rateVisit };
}

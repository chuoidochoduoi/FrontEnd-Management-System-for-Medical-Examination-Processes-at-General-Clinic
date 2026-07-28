// src/hooks/useMedicalHistory.js
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const PAGE_SIZE = 10;

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
            setVisits(data.items ?? data);
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
            console.log('VisitDetail API response:', data);
            setVisit(data);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [visitId]);

    return { visit, loading, error, fetchVisit };
}
// src/hooks/useReport.js
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

export function useReport() {
    const { t } = useTranslation('report');
    const [tab1Data, setTab1Data] = useState(null);
    const [tab2Data, setTab2Data] = useState(null);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');

    const fetchTab1 = useCallback(async (period = 'day') => {
        setLoading(true); setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/reports/dashboard?period=${period}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('report.errors.loadFailed'));
            const json = await res.json();
            setTab1Data(json.data || json);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    const fetchTab2 = useCallback(async (period = 'day') => {
        setLoading(true); setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/reports/services?period=${period}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('report.errors.loadFailed'));
            const json = await res.json();
            setTab2Data(json.data || json);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    const exportCSV = async (period) => {
        const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/v1/reports/export?period=${period}`,
            { headers: bearer() }
        );
        if (!res.ok) return;
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `report_${period}_${Date.now()}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    return { tab1Data, tab2Data, loading, error, fetchTab1, fetchTab2, exportCSV };
}
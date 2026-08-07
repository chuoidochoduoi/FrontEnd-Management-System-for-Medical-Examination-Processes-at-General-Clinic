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

    const exportCSV = (activeTab, period) => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        let filename = `report_${activeTab}_${period}_${Date.now()}.csv`;

        if (activeTab === 'tab1' && tab1Data?.table) {
            csvContent += "Ma phong,Ten phong,Doanh thu,So ca,Cong suat,CSAT\n";
            tab1Data.table.forEach(row => {
                csvContent += `"${row.code}","${row.dept}",${row.revenue},${row.sessions},"${row.occupancy}%","${row.csat}%"\n`;
            });
        } else if (activeTab === 'tab2' && tab2Data?.table) {
            csvContent += "STT,Ten dich vu,Tong so ca,Don gia,Tong doanh thu,So luong BHYT,Quy BHYT tra\n";
            tab2Data.table.forEach((row, i) => {
                csvContent += `${i + 1},"${row.name}",${row.totalOrders},${row.unitPrice},${row.totalRevenue},${row.bhytQty},${row.bhytFund}\n`;
            });
        } else {
            return;
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return { tab1Data, tab2Data, loading, error, fetchTab1, fetchTab2, exportCSV };
}
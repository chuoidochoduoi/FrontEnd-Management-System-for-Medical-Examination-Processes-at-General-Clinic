// src/hooks/usePaymentHistory.js
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const PAGE_SIZE = 10;

export function usePaymentHistory() {
    const { t } = useTranslation('payment');
    const [invoices, setInvoices] = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [total,    setTotal]    = useState(0);
    const [page,     setPage]     = useState(1);

    const fetchInvoices = useCallback(async ({ fromDate = '', toDate = '', method = '', page = 0 } = {}) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ fromDate, toDate, method, page: String(page), size: String(PAGE_SIZE) });
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patient/payments?${params}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('paymentHistory.errors.loadFailed'));
            const data = await res.json();
            setInvoices(data.items ?? data);
            setTotal(data.total ?? data.length);
            setPage(page + 1); // Backend 0-based, frontend 1-based
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    return { invoices, loading, error, total, page, PAGE_SIZE, fetchInvoices };
}

export function useReceiptDetail(invoiceId) {
    const { t } = useTranslation('payment');
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const fetchReceipt = useCallback(async () => {
        if (!invoiceId) return;
        setLoading(true); setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/patient/payments/${invoiceId}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('receiptDetail.errors.loadFailed', 'Không thể tải phiếu thu.'));
            setReceipt(await res.json());
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [invoiceId]);

    return { receipt, loading, error, fetchReceipt };
}

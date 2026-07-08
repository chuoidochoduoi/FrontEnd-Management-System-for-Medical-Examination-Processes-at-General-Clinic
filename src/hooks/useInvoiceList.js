// src/hooks/useInvoiceList.js
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

export function useInvoiceList() {
    const { t } = useTranslation('cashier');

    const [invoices, setInvoices] = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [page,     setPage]     = useState(1);
    const [total,    setTotal]    = useState(0);

    const fetchInvoices = useCallback(async ({ search = '', status = '', category = '', page = 1 } = {}) => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (search)   params.set('search',   search);
            if (status)   params.set('status',   status);
            if (category) params.set('category', category);
            params.set('page', page);

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/invoices?${params}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('invoiceList.errors.loadFailed'));
            const data = await res.json();
            // Expect: PageResponse with { content: [], totalElements: number }
            // Map backend InvoiceResponse to frontend format
            const mapped = (data.content ?? []).map(inv => ({
                id: inv.invoiceId,
                code: inv.invoiceCode,
                patientName: inv.customerName,
                patientCode: inv.customerId,
                services: inv.items?.map(it => ({
                    name: it.itemName,
                    description: it.description,
                    price: it.price,
                })) ?? [],
                total: inv.totalAmount,
                status: inv.status?.toLowerCase() ?? 'pending',
            }));
            setInvoices(mapped);
            setTotal(data.totalElements ?? 0);
            setPage(page);
        } catch (err) {
            setError(err.message || t('invoiceList.errors.unknown'));
        } finally {
            setLoading(false);
        }
    }, []);

    const pay = async (invoiceId) => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/pay`,
                { method: 'POST', headers: bearer() }
            );
            if (!res.ok) throw new Error('Thanh toán thất bại.');
            // Refresh list
            await fetchInvoices({ page });
        } catch (err) {
            setError(err.message);
        }
    };

    const printInvoice = (invoiceId) => {
        window.open(
            `${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/print`,
            '_blank'
        );
    };

    return { invoices, loading, error, page, total, fetchInvoices, pay, printInvoice };
}
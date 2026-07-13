// src/hooks/useInvoiceDetail.js
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

export function useInvoiceDetail(invoiceId) {
    const { t } = useTranslation('cashier');
    const navigate = useNavigate();

    const [invoice,    setInvoice]    = useState(null);
    const [loading,    setLoading]    = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error,      setError]      = useState('');

    useEffect(() => {
        if (!invoiceId) return;
        const fetchInvoice = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}`,
                    { headers: bearer() }
                );
                if (!res.ok) throw new Error(t('invoiceDetail.errors.loadFailed'));
                const data = await res.json();
                // Map API response to page format
                setInvoice({
                    id: data.invoiceId,
                    code: data.invoiceCode,
                    patientName: data.customerName,
                    patientCode: data.customerId?.toString().slice(0, 8) || '—',
                    visitDate: data.issueDate,
                    status: data.status?.toLowerCase() || 'pending',
                    totalServices: data.subtotal,
                    bhytDeduct: data.discount,
                    vat: data.tax,
                    grandTotal: data.totalAmount,
                    inWords: data.note || '',
                    items: (data.items || []).map(item => ({
                        id: item.itemId,
                        name: item.serviceName || item.itemName || 'Dịch vụ',
                        description: item.serviceSnapshot || item.description || '',
                        category: item.category || '',
                        qty: item.quantity,
                        basePrice: item.unitPrice,
                        bhytRate: item.bhytRate
                    }))
                });
            } catch (err) {
                setError(err.message || t('invoiceDetail.errors.unknown'));
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [invoiceId]);

    const confirmPayment = async () => {
        setConfirming(true);
        setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/pay`,
                { method: 'POST', headers: bearer() }
            );
            if (!res.ok) throw new Error(t('invoiceDetail.errors.payFailed'));
            setInvoice(prev => prev ? { ...prev, status: 'paid' } : null);
            setTimeout(() => navigate(ROUTES.CASHIER_INVOICES), 1000);
        } catch (err) {
            setError(err.message || t('invoiceDetail.errors.unknown'));
        } finally {
            setConfirming(false);
        }
    };

    const printReceipt = () => {
        window.open(
            `${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/print`,
            '_blank'
        );
    };

    const checkQRPayment = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}`,
                { headers: bearer() }
            );
            if (res.ok) {
                const data = await res.json();
                if (data.status?.toLowerCase() === 'paid') {
                    setInvoice(prev => prev ? { ...prev, status: 'paid' } : null);
                }
            }
        } catch (err) {
            console.error('QR payment check failed:', err);
        }
    };

    return { invoice, loading, confirming, error, confirmPayment, printReceipt, checkQRPayment };
}
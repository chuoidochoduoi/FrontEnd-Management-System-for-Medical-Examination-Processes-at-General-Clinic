// src/hooks/useInvoiceList.js
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import createLogger from '@/utils/logger';

const logger = createLogger('useInvoiceList');
const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

export function useInvoiceList() {
    const { t } = useTranslation('cashier');

    const [invoices, setInvoices] = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [page,     setPage]     = useState(1);
    const [total,    setTotal]    = useState(0);

    const fetchInvoices = useCallback(async ({ search = '', status = '', category = '', fromDate = '', toDate = '', page = 0, size = 100 } = {}) => {
        setLoading(true);
        setError('');
        logger.info('Fetching invoices with params:', { search, status, category, fromDate, toDate, page, size });

        try {
            const params = new URLSearchParams();
            if (search)   params.set('search',   search);
            if (status)   params.set('status',   status.toUpperCase());
            if (category) params.set('category', category);
            if (fromDate) params.set('from',     fromDate);
            if (toDate)   params.set('to',       toDate);
            // Backend thường dùng 0-indexed (Spring Data), frontend dùng 1-indexed
            params.set('page', page);  // Giữ 0-indexed để tương thích backend
            params.set('size', size);

            const url = `${import.meta.env.VITE_API_URL}/api/v1/invoices?${params}`;
            logger.debug('Request URL:', url);

            const res = await fetch(url, { headers: bearer() });
            logger.debug('Response status:', res.status, res.statusText);

            if (!res.ok) {
                const errorText = await res.text();
                logger.error('API error response:', errorText);
                throw new Error(t('invoiceList.errors.loadFailed'));
            }

            const data = await res.json();
            logger.debug('Raw API response:', data);

            // Expect: PageResponse with { content: [], totalElements: number }
            // Map backend InvoiceResponse to frontend format
            const mapped = (data.content ?? []).map(inv => {
                // Xử lý status - backend trả về enum string (PENDING/PAID/CANCELLED) hoặc object
                let statusValue = 'pending';
                if (inv.status) {
                    if (typeof inv.status === 'string') {
                        statusValue = inv.status.toLowerCase();
                    } else if (typeof inv.status === 'object') {
                        statusValue = inv.status.name?.toLowerCase() || inv.status.toString?.() || 'pending';
                    }
                }

                return {
                    id: inv.invoiceId,
                    code: inv.invoiceCode,
                    patientName: inv.customerName,
                    patientCode: inv.customerId,
                    services: inv.items?.map(it => ({
                        name: it.serviceName || it.itemName || 'Dịch vụ',
                        description: it.serviceSnapshot || it.description || '',
                        price: it.unitPrice || it.price || 0,
                        quantity: it.quantity,
                        lineTotal: it.lineTotal,
                    })) ?? [],
                    total: inv.totalAmount,
                    subtotal: inv.subtotal,
                    discount: inv.discount,
                    tax: inv.tax,
                    paidAmount: inv.paidAmount,
                    balance: inv.balance,
                    status: statusValue,
                    issueDate: inv.issueDate,
                    createdAt: inv.createdAt,
                    checkInTime: inv.checkInTime,
                    dueDate: inv.dueDate,
                };
            });

            logger.info(`Mapped ${mapped.length} invoices from ${data.content?.length || 0} items, totalElements: ${data.totalElements}`);
            setInvoices(mapped);
            setTotal(data.totalElements ?? 0);
            setPage(page + 1);
        } catch (err) {
            logger.error('Fetch invoices failed:', err);
            setError(err.message || t('invoiceList.errors.unknown'));
        } finally {
            setLoading(false);
        }
    }, []);

    const pay = async (invoiceId) => {
        logger.info('Processing payment for invoice:', invoiceId);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/pay`,
                { method: 'POST', headers: bearer() }
            );
            logger.debug('Payment response status:', res.status);

            if (!res.ok) {
                const errorText = await res.text();
                logger.error('Payment failed:', errorText);
                throw new Error('Thanh toán thất bại.');
            }

            // Refresh list
            logger.info('Payment successful, refreshing list');
            await fetchInvoices({ page });
        } catch (err) {
            logger.error('Payment error:', err);
            setError(err.message);
        }
    };

    const printInvoice = (invoiceId) => {
        logger.info('Printing invoice:', invoiceId);
        window.open(
            `${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/print`,
            '_blank'
        );
    };

    return { invoices, loading, error, page, total, fetchInvoices, pay, printInvoice };
}

import { useState, useEffect, useCallback } from 'react';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = () => ({ Authorization: `Bearer ${get('token')}` });

/**
 * Fetches a single invoice's detail for the cashier module.
 *
 * GET /api/cashier/invoices/:id
 *
 * @param {string|number} id - invoice id (from route param)
 * @returns {{
 *   invoice: object|null,
 *   loading: boolean,
 *   error: Error|null,
 *   reload: () => void,
 * }}
 */
export function useInvoicePrint(id) {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInvoice = useCallback(async () => {
        if (!id) {
            setInvoice(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/invoices/${id}`, {
                headers: bearer()
            });

            if (res.status === 404) {
                setInvoice(null);
                setError(null);
                return;
            }

            if (!res.ok) {
                throw new Error(`Không thể tải hoá đơn (HTTP ${res.status})`);
            }

            const data = await res.json();
            // Map API response to print format
            setInvoice({
                id: data.invoiceId,
                code: data.invoiceCode,
                patientName: data.customerName,
                patientCode: data.customerCode || '—',
                address: data.address || '',
                dob: data.dob || '',
                bhytCode: data.bhytCode || '',
                status: data.status?.toLowerCase() || 'pending',
                paymentMethod: data.paymentMethod || 'Tiền mặt',
                clinicName: data.clinicName || 'Phòng khám đa khoa',
                taxCode: data.taxCode || '',
                hotline: data.hotline || '',
                clinicAddress: data.clinicAddress || '',
                symbol: data.symbol || '01/VP-DK',
                issuedAt: data.issueDate,
                totalServices: data.subtotal,
                bhytDeduct: data.discount,
                vat: data.tax,
                grandTotal: data.totalAmount,
                inWords: data.note || '',
                items: (data.items || []).map(item => ({
                    id: item.itemId,
                    name: item.serviceName || item.itemName || 'Dịch vụ',
                    category: item.category || '',
                    qty: item.quantity,
                    basePrice: item.unitPrice,
                    bhytRate: item.bhytRate
                }))
            });
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchInvoice();
    }, [fetchInvoice]);

    return { invoice, loading, error, reload: fetchInvoice };
}

export default useInvoicePrint;

import { useState, useEffect, useCallback } from 'react';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = () => ({ Authorization: `Bearer ${get('token')}` });

/** Loads the complete cashier receipt prepared by the backend. */
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
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/invoices/${id}/print`, {
                headers: bearer()
            });
            if (res.status === 404) {
                setInvoice(null);
                return;
            }
            if (!res.ok) {
                throw new Error(`Không thể tải phiếu thu (HTTP ${res.status})`);
            }

            const data = await res.json();
            setInvoice({
                printData: data,
                id: data.invoiceId,
                code: data.invoiceCode,
                receiptNumber: data.receiptNumber || data.invoiceCode,
                patientName: data.patientName || '—',
                patientCode: data.patientCode || '—',
                phone: data.patientPhone || '—',
                address: data.patientAddress || '—',
                dob: data.dateOfBirth || '—',
                gender: data.gender || '—',
                bhytCode: data.bhytCode || '—',
                status: 'paid',
                paymentMethod: data.paymentMethod || 'Tiền mặt',
                cashierName: data.cashierName || '—',
                issuedAt: data.issuedAt,
                paidAt: data.paidAt,
                totalServices: data.subtotal || 0,
                bhytDeduct: data.bhytAmount || 0,
                vat: data.tax || 0,
                grandTotal: data.totalAmount || 0,
                paidAmount: data.paidAmount || 0,
                balance: data.balance || 0,
                note: data.note || '',
                items: (data.items || []).map((item) => ({
                    id: item.itemId,
                    name: item.serviceName || item.serviceSnapshot || 'Dịch vụ',
                    code: item.serviceCodeSnapshot || '—',
                    qty: item.quantity || 1,
                    basePrice: item.unitPrice || 0,
                    lineTotal: item.lineTotal || 0,
                    bhytRate: item.bhytRate || 0,
                    bhytDeductAmount: item.bhytAmount || 0,
                    patientPay: item.patientAmount || 0
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

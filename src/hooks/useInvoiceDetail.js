import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { toast } from 'react-toastify';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = () => ({ Authorization: `Bearer ${get('token')}` });

const mapInvoiceData = (data, printData = null) => {
    const bhytAmount = (data.items || []).reduce((sum, item) => sum + Number(item.bhytAmount || 0), 0);
    return ({
    id: data.invoiceId,
    code: data.invoiceCode,
    patientName: data.customerName,
    patientCode: data.customerCode || '—',
    bhytCode: data.bhytCode || '',
    visitDate: data.issueDate,
    status: data.status?.toLowerCase() || 'pending',
    totalServices: data.subtotal,
    bhytDeduct: bhytAmount,
    otherDiscount: Math.max(0, Number(data.discount || 0) - bhytAmount),
    paymentMethod: printData?.paymentMethod || null,
    paymentTransactionCode: printData?.paymentTransactionCode || null,
    membershipCardCodeMasked: printData?.membershipCardCodeMasked || null,
    membershipBenefitPercent: printData?.membershipBenefitPercent ?? null,
    membershipBenefitAmount: printData?.membershipBenefitAmount || 0,
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
        bhytRate: item.bhytRate,
        bhytAmount: item.bhytAmount,
        patientAmount: item.patientAmount
    }))
});
};

export function useInvoiceDetail(invoiceId) {
    const { t } = useTranslation('cashier');
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [insurances, setInsurances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [payingByMembership, setPayingByMembership] = useState(false);
    const [applyingInsurance, setApplyingInsurance] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!invoiceId) return;
        const fetchInvoice = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}`, {
                    headers: bearer()
                });
                if (!res.ok) throw new Error(t('invoiceDetail.errors.loadFailed'));
                const data = await res.json();
                let printData = null;
                if (data.status === 'PAID') {
                    const printResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/print`, { headers: bearer() });
                    if (printResponse.ok) printData = await printResponse.json();
                }
                setInvoice(mapInvoiceData(data, printData));
            } catch (err) {
                setError(err.message || t('invoiceDetail.errors.unknown'));
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [invoiceId, t]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/insurances`, { headers: bearer() })
            .then(res => res.ok ? res.json() : [])
            .then(data => setInsurances(Array.isArray(data) ? data : []))
            .catch(() => setInsurances([]));
    }, []);

    const applyInsurance = async (insuranceId, bhytCode) => {
        setApplyingInsurance(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/insurance`, {
                method: 'POST',
                headers: { ...bearer(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ insuranceId, bhytCode: bhytCode.trim() })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Không thể áp dụng BHYT.');
            setInvoice(mapInvoiceData(data));
            toast.success('Đã xác minh và áp dụng BHYT cho hóa đơn.');
            return true;
        } catch (err) {
            setError(err.message || 'Không thể áp dụng BHYT.');
            toast.error(err.message || 'Không thể áp dụng BHYT.');
            return false;
        } finally {
            setApplyingInsurance(false);
        }
    };

    const confirmPayment = async () => {
        setConfirming(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/pay`, {
                method: 'POST', headers: bearer()
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                if (res.status === 409) setInvoice(prev => prev ? { ...prev, status: 'paid' } : null);
                throw new Error(body.message || t('invoiceDetail.errors.payFailed'));
            }
            setInvoice(prev => prev ? { ...prev, status: 'paid' } : null);
            toast.success('Thanh toán hóa đơn thành công!');
            navigate(ROUTES.CASHIER_INVOICE_PRINT.replace(':id', invoiceId));
        } catch (err) {
            setError(err.message || t('invoiceDetail.errors.unknown'));
            toast.error(err.message || t('invoiceDetail.errors.payFailed'));
        } finally {
            setConfirming(false);
        }
    };

    const cancelInvoice = async () => {
        setCancelling(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/cancel`, {
                method: 'POST', headers: bearer()
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Không thể hủy hóa đơn.');
            setInvoice(mapInvoiceData(data));
            toast.success('Đã hủy hóa đơn.');
            return true;
        } catch (err) {
            setError(err.message || 'Không thể hủy hóa đơn.');
            toast.error(err.message || 'Không thể hủy hóa đơn.');
            return false;
        } finally {
            setCancelling(false);
        }
    };

    const payByMembershipCard = async ({ cardCode, pin, useBenefit }) => {
        setPayingByMembership(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/membership-cards/pay-at-counter`, {
                method: 'POST', headers: { ...bearer(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardCode, pin, useBenefit, invoiceId,
                    idempotencyKey: crypto.randomUUID() })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Không thể thanh toán bằng thẻ CareS.');
            setInvoice(mapInvoiceData(data));
            toast.success('Thanh toán bằng thẻ CareS thành công.');
            return true;
        } catch (err) {
            setError(err.message || 'Không thể thanh toán bằng thẻ CareS.');
            toast.error(err.message || 'Không thể thanh toán bằng thẻ CareS.');
            return false;
        } finally { setPayingByMembership(false); }
    };

    const printReceipt = () => window.open(
        `${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/print`, '_blank'
    );

    const [generatingQR, setGeneratingQR] = useState(false);

    const checkQRPayment = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}`, {
                headers: bearer()
            });
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

    const generateQRPayment = async () => {
        const paymentWindow = window.open('about:blank', '_blank');
        
        setGeneratingQR(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoiceId}/payos`, {
                method: 'POST',
                headers: bearer()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Không thể tạo link thanh toán.');
            
            toast.success('Đã tạo link thanh toán QR');
            
            if (data.paymentLink && paymentWindow) {
                paymentWindow.location.href = data.paymentLink;
            } else if (paymentWindow) {
                paymentWindow.close();
            }
        } catch (err) {
            if (paymentWindow) paymentWindow.close();
            setError(err.message || 'Không thể tạo link thanh toán.');
            toast.error(err.message || 'Không thể tạo link thanh toán.');
        } finally {
            setGeneratingQR(false);
        }
    };

    return {
        invoice, insurances, loading, confirming, cancelling, payingByMembership, applyingInsurance, generatingQR, error,
        confirmPayment, cancelInvoice, payByMembershipCard, applyInsurance, printReceipt, checkQRPayment, generateQRPayment
    };
}

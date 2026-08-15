import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { toast } from 'react-toastify';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = () => ({ Authorization: `Bearer ${get('token')}` });

const mapInvoiceData = data => ({
    id: data.invoiceId,
    code: data.invoiceCode,
    patientName: data.customerName,
    patientCode: data.customerCode || '—',
    bhytCode: data.bhytCode || '',
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
        bhytRate: item.bhytRate,
        bhytAmount: item.bhytAmount,
        patientAmount: item.patientAmount
    }))
});

export function useInvoiceDetail(invoiceId) {
    const { t } = useTranslation('cashier');
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [insurances, setInsurances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
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
                setInvoice(mapInvoiceData(await res.json()));
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
        invoice, insurances, loading, confirming, applyingInsurance, generatingQR, error,
        confirmPayment, applyInsurance, printReceipt, checkQRPayment, generateQRPayment
    };
}

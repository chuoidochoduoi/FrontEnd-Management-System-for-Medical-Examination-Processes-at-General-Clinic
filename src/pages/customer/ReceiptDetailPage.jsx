import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, RotateCcw } from 'lucide-react';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { useReceiptDetail } from '@/hooks/usePaymentHistory';
import useClinicInformation from '@/hooks/useClinicInformation';
import ReceiptPreview from '@/components/receipts/ReceiptPreview';
import { serviceReceipt } from '@/components/receipts/receiptModel';
import { ROUTES } from '@/constants/routes';

export default function ReceiptDetailPage() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const patientProfileId = params.get('patientProfileId') || '';
    const navigate = useNavigate();
    const { receipt, loading, error, fetchReceipt } = useReceiptDetail(id, patientProfileId);
    const { clinicInformation, loading: clinicLoading } = useClinicInformation();

    useEffect(() => { fetchReceipt(); }, [fetchReceipt]);

    return <CustomerLayout><div className="w-full min-w-0 space-y-5">
        <header className="print:hidden">
            <button type="button" onClick={() => navigate(ROUTES.CUSTOMER_PAYMENT + (patientProfileId ? '?patientProfileId=' + encodeURIComponent(patientProfileId) : ''))} className="inline-flex items-center gap-2"><ArrowLeft size={18}/>Quay lại lịch sử thanh toán</button>
            <div className="cares-customer-page-heading mt-5"><div><span className="cares-customer-eyebrow"><CreditCard size={18}/>Phiếu thu điện tử</span><h1>Chi tiết phiếu thu</h1><p>Thông tin giao dịch và số tiền BHYT thực tế của từng dịch vụ.</p></div></div>
        </header>
        {loading || clinicLoading || (!receipt && !error) ? <p role="status" className="py-16 text-center">Đang tải phiếu thu...</p>
            : error ? <div role="alert" className="space-y-3"><p className="text-red-600">{error}</p><button type="button" onClick={fetchReceipt} className="cares-customer-primary-button"><RotateCcw size={18}/>Tải lại</button></div>
                : receipt?.printData ? <ReceiptPreview receipt={serviceReceipt(receipt.printData)} clinic={clinicInformation}/>
                    : <div role="alert" className="rounded-xl border p-5"><p>Máy chủ chưa trả đủ dữ liệu phiếu thu mới. Vui lòng cập nhật/khởi động lại backend rồi tải lại; không in số BHYT ước tính từ tỷ lệ phần trăm.</p><button type="button" onClick={fetchReceipt} className="cares-customer-primary-button mt-3">Tải lại phiếu thu</button></div>}
    </div></CustomerLayout>;
}

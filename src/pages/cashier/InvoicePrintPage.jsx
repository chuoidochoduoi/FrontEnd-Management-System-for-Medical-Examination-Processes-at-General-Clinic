import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import CashierLayout from '@/components/layout/CashierLayout';
import { useInvoicePrint } from '@/hooks/useInvoicePrint';
import useClinicInformation from '@/hooks/useClinicInformation';
import ReceiptPreview from '@/components/receipts/ReceiptPreview';
import { serviceReceipt } from '@/components/receipts/receiptModel';

export default function InvoicePrintPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { invoice, loading, error, reload } = useInvoicePrint(id);
    const { clinicInformation, loading: clinicLoading } = useClinicInformation();

    return <CashierLayout><div className="w-full min-w-0">
        <header className="cares-ops-header print:hidden"><div><h1>Phiếu thu dịch vụ y tế</h1><p>Kiểm tra thông tin và số tiền trước khi in.</p></div>
            <button type="button" onClick={() => navigate(-1)} className="cares-ops-secondary"><ChevronLeft size={18}/>Quay lại</button></header>
        {loading || clinicLoading ? <p role="status" className="py-16 text-center">Đang tải phiếu thu...</p>
            : error || !invoice ? <div role="alert" className="flex flex-col items-center gap-3 py-16"><p>{error?.message || 'Không tìm thấy phiếu thu.'}</p><button type="button" onClick={reload} className="cares-ops-secondary"><RotateCcw size={18}/>Tải lại</button></div>
                : <ReceiptPreview receipt={serviceReceipt(invoice.printData)} clinic={clinicInformation}/>}
    </div></CashierLayout>;
}

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Printer, RotateCcw } from 'lucide-react';
import CashierLayout from '@/components/layout/CashierLayout';
import { useInvoicePrint } from '@/hooks/useInvoicePrint';

const fmtNum = (n) =>
    n != null ? new Intl.NumberFormat('vi-VN').format(n) : '—';

const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN');
    } catch {
        return dateStr;
    }
};

const STATUS_STYLE = {
    pending:   'bg-orange-50 text-orange-600 border border-orange-200',
    paid:      'bg-green-50 text-green-700 border border-green-200',
    cancelled: 'bg-gray-100 text-gray-500 border border-gray-200',
    draft:     'bg-blue-50 text-blue-600 border border-blue-200',
    issued:    'bg-indigo-50 text-indigo-600 border border-indigo-200',
};

export default function InvoicePrintPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation('cashier');
    const { invoice, loading, error, reload } = useInvoicePrint(id);

    useEffect(() => {
        const shortcut = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
                event.preventDefault();
                window.print();
            }
        };
        window.addEventListener('keydown', shortcut);
        return () => window.removeEventListener('keydown', shortcut);
    }, []);

    if (loading) return <CashierLayout><p className="py-20 text-center text-sm text-slate-500">Đang tải phiếu thu...</p></CashierLayout>;
    if (error || !invoice) {
        return <CashierLayout><div className="flex min-h-72 flex-col items-center justify-center gap-3"><p className="text-sm text-slate-600">{error?.message || 'Không tìm thấy phiếu thu.'}</p><button onClick={reload} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm"><RotateCcw className="h-4 w-4" />Tải lại</button></div></CashierLayout>;
    }

    const items        = invoice?.items        ?? [];
    const totalSvc     = Number(invoice?.totalServices) || 0;
    const bhytDeduct   = Number(invoice?.bhytDeduct)    || 0;
    const vat          = Number(invoice?.vat)           || 0;
    const grandTotal   = Number(invoice?.grandTotal)    || 0;

    return (
        <CashierLayout>
            <div className="receipt-screen mx-auto max-w-4xl px-4 py-6">
                <div className="receipt-actions mb-5 flex items-center justify-between print:hidden">
                    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" />Quay lại</button>
                    <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"><Printer className="h-4 w-4" />In phiếu thu</button>
                </div>

                <div id="receipt-print-area" className="mx-auto space-y-0">
                    <div className="bg-white border border-gray-200 rounded-t-2xl px-8 py-5 flex items-start justify-between border-b-0">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                {t('invoiceDetail.dept')}
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {t('invoiceDetail.deptSubtitle')}
                            </p>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 tracking-widest mt-1">
                            {t('invoiceDetail.queue')}
                        </span>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-b-2xl px-8 py-6 space-y-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-xs font-medium bg-gray-900 text-white px-2.5 py-1 rounded-full">
                                      Mã: {invoice?.code}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{invoice?.patientName || '—'}</h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    Mã BN: {invoice?.patientCode}
                                    {invoice?.visitDate && (
                                        <> • Ngày: {fmtDate(invoice.visitDate)}</>
                                    )}
                                </p>
                            </div>
                            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${STATUS_STYLE[invoice?.status] ?? STATUS_STYLE.pending}`}>
                                {invoice?.status === 'paid' ? 'Đã thanh toán' : invoice?.status}
                            </span>
                        </div>

                        {invoice.bhytCode && (
                            <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 space-y-2">
                                <p className="text-xs font-medium text-green-700">
                                    Đã áp dụng BHYT: {invoice.bhytCode}
                                </p>
                            </section>
                        )}

                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">
                                Chi tiết dịch vụ
                            </h3>

                            <div className="grid grid-cols-[40px_1fr_48px_100px_100px_80px_90px_100px] gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-400 font-medium">
                                <span>STT</span>
                                <span>Tên dịch vụ</span>
                                <span className="text-center">SL</span>
                                <span className="text-right">Đơn giá</span>
                                <span className="text-right">T.tạm</span>
                                <span className="text-center">BHYT %</span>
                                <span className="text-right">BHYT trả</span>
                                <span className="text-right">Bệnh nhân</span>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {items.length > 0 ? items.map((item, idx) => {
                                    const subtotal   = (item.qty ?? 1) * (item.basePrice ?? 0);
                                    const bhytAmount = Math.round(subtotal * ((item.bhytRate ?? 0) / 100));
                                    const patientAmt = subtotal - bhytAmount;

                                    return (
                                        <div
                                            key={item.id ?? idx}
                                            className="grid grid-cols-[40px_1fr_48px_100px_100px_80px_90px_100px] gap-2 px-3 py-3.5 items-start"
                                        >
                                          <span className="text-xs text-gray-400 pt-0.5">
                                            {String(idx + 1).padStart(2, '0')}
                                          </span>

                                            <div>
                                                <p className="text-sm font-medium text-gray-900 leading-snug">
                                                    {item.name}
                                                </p>
                                            </div>

                                            <span className="text-sm text-gray-600 text-center">{item.qty ?? 1}</span>
                                            <span className="text-sm text-gray-400 text-right tabular-nums">{fmtNum(item.basePrice)}</span>
                                            <span className="text-sm font-medium text-gray-900 text-right tabular-nums">{fmtNum(subtotal)}</span>
                                            <span className="text-sm text-gray-600 text-center">{item.bhytRate ?? 0}%</span>
                                            <span className="text-sm text-gray-600 text-right tabular-nums">{fmtNum(bhytAmount)}</span>
                                            <span className="text-sm font-semibold text-gray-900 text-right tabular-nums">{fmtNum(patientAmt)}</span>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-sm text-gray-400 text-center py-8">—</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <div className="w-72 space-y-2.5">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tổng dịch vụ</span>
                                    <span className="font-medium tabular-nums">{fmtNum(totalSvc)} VND</span>
                                </div>
                                {bhytDeduct > 0 && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Giảm BHYT</span>
                                        <span className="font-medium tabular-nums text-red-500">- {fmtNum(bhytDeduct)} VND</span>
                                    </div>
                                )}
                                {vat > 0 && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Thuế VAT</span>
                                        <span className="font-medium tabular-nums">{fmtNum(vat)} VND</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between items-start">
                                      <span className="text-sm font-semibold text-gray-800">
                                        Tổng cộng
                                      </span>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900 tabular-nums">
                                                {fmtNum(grandTotal)}
                                            </p>
                                            <p className="text-sm font-semibold text-gray-500">VND</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @media print { 
                    @page { size:A4 portrait; margin:0; } 
                    body * { visibility:hidden !important; } 
                    #receipt-print-area, #receipt-print-area * { visibility:visible !important; } 
                    #receipt-print-area { position:absolute; left:0; top:0; width:210mm; margin:0; padding:16mm 15mm; box-shadow:none; border:none; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </CashierLayout>
    );
}

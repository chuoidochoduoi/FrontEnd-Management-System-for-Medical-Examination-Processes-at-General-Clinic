// src/pages/cashier/InvoiceDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CashierLayout from '@/components/layout/CashierLayout';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useInvoiceDetail } from '@/hooks/useInvoiceDetail';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ROUTES } from '@/constants/routes';

/* ── helpers ── */
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

export default function InvoiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t }  = useTranslation('cashier');
    const {
        invoice, insurances, loading, confirming, cancelling, payingByMembership, applyingInsurance, generatingQR, error,
        confirmPayment, cancelInvoice, payByMembershipCard, applyInsurance, checkQRPayment, generateQRPayment
    } =
        useInvoiceDetail(id);
    const [selectedInsuranceId, setSelectedInsuranceId] = useState('');
    const [bhytCode, setBhytCode] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [membershipOpen, setMembershipOpen] = useState(false);
    const [membershipForm, setMembershipForm] = useState({ cardCode: '', pin: '', useBenefit: true });

    useEffect(() => {
        if (invoice?.bhytCode) setBhytCode(invoice.bhytCode);
    }, [invoice?.bhytCode]);

    // Lắng nghe sự kiện thanh toán thành công qua Webhook
    useWebSocket('/topic/cashier-invoices', null, (message) => {
        if (message === 'INVOICE_UPDATED') {
            checkQRPayment(); // Tự động load lại nếu có thay đổi
        }
    });

    const handleApplyInsurance = () => {
        if (!selectedInsuranceId || !bhytCode.trim()) return;
        applyInsurance(selectedInsuranceId, bhytCode);
    };

    if (loading) {
        return (
            <CashierLayout>
                <p className="text-sm text-gray-400 text-center py-20">
                    {t('invoiceDetail.loading')}
                </p>
            </CashierLayout>
        );
    }

    if (!invoice && !loading) {
        return (
            <CashierLayout>
                <p className="text-sm text-red-500 text-center py-20">{error}</p>
            </CashierLayout>
        );
    }

    const items        = invoice?.items        ?? [];
    const totalSvc     = Number(invoice?.totalServices) || 0;
    const bhytDeduct   = Number(invoice?.bhytDeduct)    || 0;
    const otherDiscount = Number(invoice?.otherDiscount) || 0;
    const membershipBenefit = Number(invoice?.membershipBenefitAmount) || 0;
    const vat          = Number(invoice?.vat)           || 0;
    const grandTotal   = Number(invoice?.grandTotal)    || 0;

    return (
        <CashierLayout>
            <div className="cares-invoice-detail-screen">

                {/* ── Page header ── */}
                <div className="cares-invoice-heading bg-white border border-gray-200 rounded-t-2xl px-8 py-5 flex items-start justify-between border-b-0">
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

                {/* ── Invoice card ── */}
                <div className="cares-invoice-body bg-white border border-gray-200 rounded-b-2xl px-8 py-6 space-y-6">

                    {/* Patient identity */}
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
              {t(`invoiceDetail.status.${invoice?.status}`) || invoice?.status}
            </span>
                    </div>

                    {invoice?.status === 'pending' && (
                        <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Bảo hiểm y tế</h3>
                                <p className="mt-1 text-xs text-gray-500">
                                    Thu ngân kiểm tra thẻ và áp dụng mức BHYT trước khi xác nhận thanh toán.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto] gap-3 items-end">
                                <label className="text-xs font-medium text-gray-600">
                                    Loại bảo hiểm
                                    <select
                                        value={selectedInsuranceId}
                                        onChange={event => setSelectedInsuranceId(event.target.value)}
                                        className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                    >
                                        <option value="">Chọn loại bảo hiểm</option>
                                        {insurances.map(insurance => (
                                            <option key={insurance.insuranceId} value={insurance.insuranceId}>
                                                {insurance.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs font-medium text-gray-600">
                                    Mã thẻ BHYT
                                    <input
                                        value={bhytCode}
                                        onChange={event => setBhytCode(event.target.value.toUpperCase())}
                                        placeholder="Nhập mã thẻ BHYT"
                                        className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={handleApplyInsurance}
                                    disabled={!selectedInsuranceId || !bhytCode.trim() || applyingInsurance}
                                    className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {applyingInsurance ? 'Đang kiểm tra...' : 'Kiểm tra và áp dụng'}
                                </button>
                            </div>
                            {invoice.bhytCode && (
                                <p className="text-xs font-medium text-green-700">
                                    Đã áp dụng BHYT: {invoice.bhytCode}
                                </p>
                            )}
                        </section>
                    )}

                    {/* ── Service table ── */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">
                            Chi tiết dịch vụ
                        </h3>

                        {/* Table header */}
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

                        {/* Table rows */}
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

                    {/* ── Summary ── */}
                    <div className="cares-invoice-totals flex justify-end">
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
                            {otherDiscount > 0 && (
                                <div className="flex justify-between gap-4 text-sm text-gray-600">
                                    <span>{membershipBenefit > 0 ? `Ưu đãi thẻ CareS (${fmtNum(invoice.membershipBenefitPercent)}%)` : 'Ưu đãi / giảm khác'}</span>
                                    <span className="font-medium tabular-nums text-teal-700">- {fmtNum(otherDiscount)} VND</span>
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
                            {invoice.membershipCardCodeMasked && <div className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm text-teal-900">
                                <p className="font-bold">Thanh toán bằng thẻ CareS</p>
                                <p className="mt-1">{invoice.membershipCardCodeMasked}</p>
                                <p className="mt-1">Ưu đãi: {membershipBenefit > 0 ? `${fmtNum(invoice.membershipBenefitPercent)}% · ${fmtNum(membershipBenefit)} VND` : 'Không áp dụng'}</p>
                                {invoice.paymentTransactionCode && <p className="mt-1">Mã giao dịch: {invoice.paymentTransactionCode}</p>}
                            </div>}
                        </div>
                    </div>

                    {/* ── Error ── */}
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    {/* ── Actions ── */}
                    <div className="cares-invoice-actions flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                        {invoice?.status === 'paid' && (
                            <button
                                onClick={() => navigate(ROUTES.CASHIER_INVOICE_PRINT.replace(':id', id))}
                                className="px-6 h-10 border border-gray-300 hover:border-gray-500 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                            >
                                Xem và in phiếu thu
                            </button>
                        )}
                        {invoice?.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => setIsCancelModalOpen(true)}
                                    disabled={cancelling || confirming || generatingQR}
                                    className="px-6 h-10 border border-red-300 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed text-red-600 text-sm font-medium rounded-xl transition-colors"
                                >
                                    {cancelling ? 'Đang hủy...' : 'Hủy hóa đơn'}
                                </button>
                                <button
                                    onClick={() => setIsConfirmModalOpen(true)}
                                    disabled={confirming}
                                    className="px-6 h-10 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    {confirming ? t('invoiceDetail.actions.confirming') : t('invoiceDetail.actions.confirm')}
                                </button>
                                <button
                                    onClick={generateQRPayment}
                                    disabled={generatingQR}
                                    className="px-6 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    {generatingQR ? 'Đang tạo QR...' : 'Thanh toán QR'}
                                </button>
                                <button
                                    onClick={() => setMembershipOpen(true)}
                                    disabled={payingByMembership}
                                    className="px-6 h-10 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
                                >Thẻ CareS</button>
                            </>
                        )}
                        {invoice?.status === 'paid' && (
                            <button
                                className="px-6 h-10 bg-green-600 text-white text-sm font-medium rounded-xl cursor-not-allowed"
                                disabled
                            >
                                Đã thanh toán
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={() => {
                    setIsConfirmModalOpen(false);
                    confirmPayment();
                }}
                title="Xác nhận thanh toán tiền mặt"
                message="Bạn có chắc chắn đã nhận đủ tiền mặt từ bệnh nhân và muốn hoàn tất thanh toán cho hóa đơn này?"
                confirmText="Xác nhận đã thu tiền"
                isDanger={false}
            />
            <ConfirmModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={async () => {
                    const cancelled = await cancelInvoice();
                    if (cancelled) setIsCancelModalOpen(false);
                }}
                title="Hủy hóa đơn"
                message="Bạn có chắc chắn muốn hủy hóa đơn đang chờ thanh toán này? Hóa đơn đã thanh toán sẽ không thể hủy tại đây."
                confirmText="Xác nhận hủy"
                isDanger
            />
            {membershipOpen && <div className="cares-ops-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="cares-ops-modal w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                    <h2 className="text-xl font-bold">Thanh toán bằng thẻ CareS</h2>
                    <p className="mt-1 text-sm text-gray-500">Quét/nhập mã thẻ và yêu cầu chủ thẻ nhập PIN.</p>
                    <label className="mt-5 block text-sm font-medium">Mã thẻ<input value={membershipForm.cardCode} onChange={e=>setMembershipForm({...membershipForm,cardCode:e.target.value.toUpperCase()})} className="mt-2 h-11 w-full rounded-xl border px-3" placeholder="CS-..."/></label>
                    <label className="mt-4 block text-sm font-medium">PIN 6 số<input value={membershipForm.pin} onChange={e=>setMembershipForm({...membershipForm,pin:e.target.value.replace(/\D/g,'').slice(0,6)})} type="password" inputMode="numeric" className="mt-2 h-11 w-full rounded-xl border px-3"/></label>
                    <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" checked={membershipForm.useBenefit} onChange={e=>setMembershipForm({...membershipForm,useBenefit:e.target.checked})}/><span>Áp dụng ưu đãi và thanh toán toàn bộ hóa đơn</span></label>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setMembershipOpen(false)}
                            className="rounded-xl border px-5 py-2.5"
                        >
                            Đóng
                        </button>
                        <button
                            type="button"
                            disabled={payingByMembership || !membershipForm.cardCode || membershipForm.pin.length !== 6}
                            onClick={async () => {
                                const paid = await payByMembershipCard(membershipForm);
                                if (paid) {
                                    setMembershipOpen(false);
                                    navigate(ROUTES.CASHIER_INVOICE_PRINT.replace(':id', id));
                                }
                            }}
                            className="rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
                        >
                            {payingByMembership ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                        </button>
                    </div>
                </div>
            </div>}
        </CashierLayout>
    );
}

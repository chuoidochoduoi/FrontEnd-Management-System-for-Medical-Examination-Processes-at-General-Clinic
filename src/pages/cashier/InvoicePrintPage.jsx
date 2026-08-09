// src/pages/cashier/InvoicePrintPage.jsx
import { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Printer, ChevronLeft, RotateCcw } from 'lucide-react';
import CashierLayout from '@/components/layout/CashierLayout';
import { useInvoicePrint } from '@/hooks/useInvoicePrint';

const formatVND = (n) =>
    `${new Intl.NumberFormat('vi-VN').format(Math.round(n || 0))} VND`;

const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));

function StatusBadge({ status, t }) {
    const isPaid = status === 'paid' || status === 'completed';
    return (
        <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                isPaid
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
        >
      {isPaid ? t('detail.statusPaid') : t('detail.statusPending')}
    </span>
    );
}

function InfoRow({ label, value, alignRight }) {
    return (
        <div className={alignRight ? 'text-right' : ''}>
            <span className="text-sm text-gray-500">{label}: </span>
            <span className="text-sm font-semibold text-gray-800">{value}</span>
        </div>
    );
}

export default function InvoicePrintPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation('cashier');
    const { invoice, loading, error, reload } = useInvoicePrint(id);
    const isPaid = invoice?.status === 'paid' || invoice?.status === 'completed';

    // Let Ctrl+P trigger the same in-app print handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                if (isPaid) window.print();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPaid]);

    const rows = useMemo(() => {
        if (!invoice?.items) return [];
        return invoice.items.map((item) => {
            const lineTotal = (item.qty ?? 1) * (item.basePrice ?? 0);
            const bhytAmount =
                item.bhytDeductAmount ?? Math.round((lineTotal * (item.bhytRate ?? 0)) / 100);
            const patientPay = item.patientPay ?? lineTotal - bhytAmount;
            const bhytPercent = item.bhytDeductPercent ?? item.bhytRate ?? 0;
            return { ...item, lineTotal, bhytAmount, patientPay, bhytPercent };
        });
    }, [invoice]);

    if (loading) {
        return (
            <CashierLayout>
                <p className="text-sm text-gray-400 text-center py-20">{t('detail.loading')}</p>
            </CashierLayout>
        );
    }

    if (error) {
        return (
            <CashierLayout>
                <div className="flex flex-col items-center justify-center gap-3 text-gray-600 py-20">
                    <p>{t('detail.error')}</p>
                    <button
                        onClick={reload}
                        className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <RotateCcw className="h-4 w-4" />
                        {t('detail.retry')}
                    </button>
                </div>
            </CashierLayout>
        );
    }

    if (!invoice) {
        return (
            <CashierLayout>
                <div className="flex flex-col items-center justify-center gap-3 text-gray-500 py-20">
                    <p>{t('detail.notFound')}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        {t('detail.backToList')}
                    </button>
                </div>
            </CashierLayout>
        );
    }

    return (
        <CashierLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Top bar with back button */}
                <div className="flex items-center justify-between print:hidden">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Quay lại
                    </button>
                    <button
                        onClick={() => window.print()}
                        disabled={!isPaid}
                        className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Printer className="h-4 w-4" />
                        In phiếu thu
                    </button>
                </div>

                {!isPaid && (
                    <div className="print:hidden rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        Hóa đơn chưa được thanh toán nên chưa thể in phiếu thu.
                    </div>
                )}

                {/* Receipt card */}
                <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm print:border-0 print:shadow-none">
                    {/* Clinic / receipt meta header */}
                    <div className="flex flex-col justify-between gap-4 border-b border-dashed border-gray-200 pb-5 sm:flex-row">
                        <div>
                            <p className="text-base font-bold uppercase text-gray-900">
                                {invoice.clinicName ?? t('detail.clinicName')}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('detail.taxCode')}: {invoice.taxCode ?? '—'}
                                {invoice.hotline ? ` — ${t('detail.hotline')}: ${invoice.hotline}` : ''}
                            </p>
                            <p className="text-sm text-gray-500">
                                {t('detail.address')}: {invoice.clinicAddress ?? '—'}
                            </p>
                        </div>
                        <div className="sm:text-right">
                            <p className="text-base font-bold uppercase tracking-wide text-gray-900">
                                {t('detail.receiptTitle')}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('detail.symbol')}: {invoice.symbol ?? '—'}
                            </p>
                            <p className="text-sm text-gray-500">
                                {t('detail.docNumber')}: {invoice.code}
                            </p>
                            <p className="text-sm text-gray-500">
                                {t('detail.issueDate')}: {invoice.issuedAt ?? invoice.visitDate}
                            </p>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="py-6 text-center">
                        <h1 className="text-xl font-bold uppercase tracking-wide text-gray-900">
                            {t('detail.mainTitle')}
                        </h1>
                        <p className="mt-1 text-sm italic text-gray-400">{t('detail.subTitle')}</p>
                    </div>

                    {/* Patient info */}
                    <div className="grid grid-cols-1 gap-x-8 gap-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-5 sm:grid-cols-2">
                        <InfoRow label={t('detail.patientName')} value={invoice.patientName} />
                        <InfoRow label={t('detail.patientCode')} value={invoice.patientCode} alignRight />
                        <InfoRow label={t('detail.patientAddress')} value={invoice.address} />
                        <InfoRow label={t('detail.dob')} value={invoice.dob} alignRight />
                        <InfoRow label={t('detail.bhytCode')} value={invoice.bhytCode} alignRight />
                    </div>

                    {/* Payment method / status */}
                    <div className="mt-4 flex flex-col gap-3 border-b border-dashed border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                        <InfoRow label={t('detail.paymentMethod')} value={invoice.paymentMethod} />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{t('detail.paymentStatus')}:</span>
                            <StatusBadge status={invoice.status} t={t} />
                        </div>
                    </div>

                    {/* Services table */}
                    <h2 className="mt-6 mb-3 text-sm font-bold text-gray-900">{t('detail.sectionTitle')}</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                                <th className="w-12 py-2 text-center font-medium">{t('detail.col.stt')}</th>
                                <th className="py-2 text-left font-medium">{t('detail.col.service')}</th>
                                <th className="w-14 py-2 text-center font-medium">{t('detail.col.qty')}</th>
                                <th className="py-2 text-right font-medium">{t('detail.col.price')}</th>
                                <th className="py-2 text-right font-medium">{t('detail.col.bhyt')}</th>
                                <th className="py-2 text-right font-medium">{t('detail.col.patientPay')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((item, idx) => (
                                <tr key={item.id ?? idx} className="border-b border-gray-100 align-top">
                                    <td className="py-3 text-center text-gray-400">
                                        {String(idx + 1).padStart(2, '0')}
                                    </td>
                                    <td className="py-3 pr-4">
                                        <p className="font-semibold text-gray-900">{item.name}</p>
                                        {item.category && (
                                            <p className="mt-0.5 text-xs text-gray-400">{item.category}</p>
                                        )}
                                    </td>
                                    <td className="py-3 text-center text-gray-700">{item.qty ?? 1}</td>
                                    <td className="py-3 text-right text-gray-700">
                                        {formatMoney(item.lineTotal)}
                                    </td>
                                    <td className="py-3 text-right text-gray-700">
                                        {item.bhytAmount > 0
                                            ? `- ${formatMoney(item.bhytAmount)} (${item.bhytPercent}%)`
                                            : '—'}
                                    </td>
                                    <td className="py-3 text-right font-semibold text-gray-900">
                                        {formatMoney(item.patientPay)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer: note + totals */}
                    <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:justify-between">
                        <p className="max-w-xs text-xs text-gray-400 sm:max-w-sm">{t('detail.note')}</p>

                        <div className="w-full max-w-sm rounded-lg border border-gray-200 p-4 sm:w-96">
                            <div className="flex items-center justify-between py-1 text-sm">
                                <span className="text-gray-500">{t('detail.totalGross')}:</span>
                                <span className="font-medium text-gray-900">
                {formatVND(invoice.totalServices)}
              </span>
                            </div>
                            <div className="flex items-center justify-between py-1 text-sm">
                                <span className="text-gray-500">{t('detail.bhytDeduct')}:</span>
                                <span className="font-medium text-gray-900">
                - {formatVND(invoice.bhytDeduct)}
              </span>
                            </div>
                            <div className="flex items-center justify-between py-1 text-sm">
                                <span className="text-gray-500">{t('detail.vat')}:</span>
                                <span className="font-medium text-gray-900">{formatVND(invoice.vat)}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
              <span className="text-sm font-semibold text-gray-700">
                {t('detail.grandTotalLabel')}:
              </span>
                                <span className="text-lg font-bold text-gray-900">
                {formatVND(invoice.grandTotal)}
              </span>
                            </div>
                            {invoice.inWords && (
                                <p className="mt-1 text-right text-xs italic text-gray-400">
                                    {t('detail.grandTotalWordsWrap', { words: invoice.inWords })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CashierLayout>
    );
}

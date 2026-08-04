// src/pages/patient/ReceiptDetailPage.jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PatientLayout from '@/components/layout/CustomerLayout';
import { useReceiptDetail } from '@/hooks/usePaymentHistory';
import { ROUTES } from '@/constants/routes';

const fmt    = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) : '—';
const fmtVND = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' đ' : '—';

export default function ReceiptDetailPage() {
    const { id }   = useParams();
    const navigate = useNavigate();
    const { t }    = useTranslation('payment');
    const { receipt, loading, error, fetchReceipt } = useReceiptDetail(id);

    useEffect(() => { fetchReceipt(); }, [id]);

    const handlePrint = () => window.print();

    if (loading) return (
        <PatientLayout>
            <p className="text-sm text-gray-400 text-center py-20">{t('paymentHistory.loading')}</p>
        </PatientLayout>
    );

    const items       = receipt?.items        ?? [];
    const totalSvc    = receipt?.totalService  ?? 0;
    const bhytCover   = receipt?.bhytCoverage  ?? 0;
    const patientPay  = receipt?.patientPayment ?? (totalSvc - bhytCover);

    return (
        <PatientLayout>
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-sm font-bold text-gray-900 tracking-widest">{t('receiptDetail.pageTitle')}</h1>
                <button onClick={handlePrint}
                        className="px-5 h-9 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors">
                    {t('receiptDetail.savePDF')}
                </button>
            </div>

            <button onClick={() => navigate(ROUTES.CUSTOMER_PAYMENT)}
                    className="text-xs text-gray-400 hover:text-primary-500 transition-colors mb-5 block">
                {t('receiptDetail.backBtn')}
            </button>

            {/* Receipt paper */}
            <div id="receipt-paper" className="bg-white border border-gray-200 rounded-2xl px-8 py-8 max-w-2xl print:shadow-none print:rounded-none print:border-0">

                {/* Clinic header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-sm font-bold text-gray-900">{t('receiptDetail.clinicName')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{t('receiptDetail.clinicAddress')}</p>
                        <p className="text-xs text-gray-400">{t('receiptDetail.clinicHotline')}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-900 tracking-wide">{t('receiptDetail.receiptTitle')}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('receiptDetail.issuedLabel')} <span className="font-medium">{receipt?.issuedDate}</span>
                        </p>
                    </div>
                </div>

                <hr className="border-gray-100 mb-5" />

                {/* Patient + Status */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">{t('receiptDetail.patientLabel')}</p>
                        <p className="text-base font-bold text-gray-900">{receipt?.patientName}</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {t('receiptDetail.patientIdLabel')}: <span className="font-medium text-gray-700">#{receipt?.patientId}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {receipt?.dob} • {receipt?.gender}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 mb-0.5">{t('receiptDetail.examinationType')}</p>
                        <p className="text-xs text-gray-600">{t('receiptDetail.doctorLabel')} {receipt?.doctor}</p>
                        <div className="mt-2">
              <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                {t('receiptDetail.statusPaid')}
              </span>
                        </div>
                    </div>
                </div>

                {/* Payment Details */}
                <p className="text-xs font-bold text-gray-500 tracking-widest mb-3">{t('receiptDetail.paymentDetails')}</p>

                <table className="w-full mb-5">
                    <thead className="border-b border-gray-200">
                    <tr>
                        {[
                            t('receiptDetail.table.no'),
                            t('receiptDetail.table.service'),
                            t('receiptDetail.table.qty'),
                            t('receiptDetail.table.unitPrice'),
                            t('receiptDetail.table.total'),
                            t('receiptDetail.table.bhytRate'),
                            t('receiptDetail.table.bhytAmt'),
                        ].map(col => (
                            <th key={col} className="text-xs text-gray-400 font-medium text-left py-2 pr-3 last:text-right">{col}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {items.map((item, i) => {
                        const subtotal   = (item.qty ?? 1) * (item.unitPrice ?? 0);
                        const bhytAmount = Math.round(subtotal * ((item.bhytRate ?? 0) / 100));
                        return (
                            <tr key={i}>
                                <td className="text-xs text-gray-400 py-3 pr-3">
                                    {String(i + 1).padStart(2, '0')}
                                </td>
                                <td className="py-3 pr-3">
                                    <p className="text-sm font-medium text-gray-900 leading-snug">{item.name}</p>
                                    {item.category && (
                                        <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                                    )}
                                </td>
                                <td className="text-sm text-gray-600 py-3 pr-3">{item.qty ?? 1}</td>
                                <td className="text-sm text-gray-600 py-3 pr-3 tabular-nums">{fmt(item.unitPrice)}</td>
                                <td className="text-sm font-semibold text-gray-900 py-3 pr-3 tabular-nums">{fmt(subtotal)}</td>
                                <td className="text-sm text-gray-500 py-3 pr-3">{item.bhytRate ?? 0}%</td>
                                <td className="text-sm text-gray-500 py-3 text-right tabular-nums">{fmt(bhytAmount)}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>

                {/* Summary */}
                <div className="flex justify-end">
                    <div className="w-56 space-y-1.5">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{t('receiptDetail.totalService')}</span>
                            <span className="font-medium tabular-nums">{fmt(totalSvc)} đ</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{t('receiptDetail.bhytCover')}</span>
                            <span className="font-medium tabular-nums text-green-600">- {fmt(bhytCover)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between">
                            <span className="text-sm font-bold text-gray-800">{t('receiptDetail.patientPayment')}</span>
                            <span className="text-base font-bold text-gray-900 tabular-nums">{fmt(patientPay)} đ</span>
                        </div>
                        {receipt?.inWords && (
                            <p className="text-xs text-gray-400 text-right leading-snug">
                                ({t('receiptDetail.inWords')} {receipt.inWords})
                            </p>
                        )}
                    </div>
                </div>

                <hr className="border-gray-100 my-5" />

                {/* Thank you */}
                <p className="text-xs text-gray-400 text-center leading-relaxed italic">
                    {t('receiptDetail.thankYou')}
                </p>
            </div>

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

            <style>{`@media print { #receipt-paper { padding: 24px; } }`}</style>
        </PatientLayout>
    );
}

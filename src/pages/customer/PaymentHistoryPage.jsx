// src/pages/patient/PaymentHistoryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Receipt, CreditCard, Banknote, Landmark, ArrowRight } from 'lucide-react';
import PatientLayout from '@/components/layout/CustomerLayout';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useProfile } from '@/hooks/useProfile';
import { ROUTES } from '@/constants/routes';
import { toast } from 'react-toastify';

const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' đ' : '—';

const METHODS = ['', 'bank_transfer', 'cash', 'card'];
const METHOD_LABELS = {
    'bank_transfer': 'Chuyển khoản',
    'cash': 'Tiền mặt',
    'card': 'Thẻ'
};

const inputCls  = 'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 bg-white';

function Pagination({ page, total, pageSize, onChange }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-end gap-1 mt-4">
            <button onClick={() => onChange(page - 1)} disabled={page === 1}
                    className="w-8 h-8 text-sm flex items-center justify-center border border-gray-200 rounded text-gray-400 disabled:opacity-30 hover:border-gray-400 transition-colors">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => onChange(p)}
                        className={`w-8 h-8 text-sm rounded border transition-colors ${
                            p === page ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}>{p}</button>
            ))}
            <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
                    className="w-8 h-8 text-sm flex items-center justify-center border border-gray-200 rounded text-gray-400 disabled:opacity-30 hover:border-gray-400 transition-colors">›</button>
        </div>
    );
}

export default function PaymentHistoryPage() {
    const { t }    = useTranslation('payment');
    const navigate = useNavigate();
    const { invoices, loading, error, total, page, PAGE_SIZE, fetchInvoices } = usePaymentHistory();
    const { profile } = useProfile();
    const { members: familyMembers } = useFamilyMembers(true);

    const [fromDate, setFromDate] = useState('');
    const [toDate,   setToDate]   = useState('');
    const [method,   setMethod]   = useState('');
    const [patientProfileId, setPatientProfileId] = useState('self');

    useEffect(() => {
        fetchInvoices({ patientProfileId: patientProfileId === 'self' ? '' : patientProfileId });
    }, [patientProfileId]);

    const handleSearch = () => {
        if (fromDate && toDate && fromDate > toDate) {
            toast.error('Ngày bắt đầu không được sau ngày kết thúc');
            return;
        }
        fetchInvoices({ fromDate, toDate, method, patientProfileId: patientProfileId === 'self' ? '' : patientProfileId, page: 0 });
    };
    const handlePage   = (p) => fetchInvoices({ fromDate, toDate, method, patientProfileId: patientProfileId === 'self' ? '' : patientProfileId, page: p - 1 }); // Frontend 1-based → backend 0-based

    const thCls = 'text-xs font-medium text-gray-400 text-left px-4 py-3';
    const tdCls = 'px-4 py-4 text-sm align-middle';

    return (
        <PatientLayout>
            <div className="cares-payments-page space-y-5">
                <header className="cares-customer-page-heading">
                    <div>
                        <span className="cares-customer-eyebrow"><Receipt size={15} /> Giao dịch của bạn</span>
                        <h1>{t('paymentHistory.pageTitle')}</h1>
                        <p>Tra cứu các khoản đã thanh toán và mở phiếu thu điện tử.</p>
                    </div>
                </header>

                {/* Filter */}
                <div className="cares-customer-filter-card bg-white border border-gray-200 rounded-xl px-5 py-4 grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-3 items-end">
                    <div>
                        <p className="text-xs text-gray-400 mb-1.5">Người được khám</p>
                        <select value={patientProfileId} onChange={e => setPatientProfileId(e.target.value)} className={inputCls}>
                            <option value="self">Tôi · {profile?.fullName || 'Chính chủ'}</option>
                            {familyMembers.map(member => <option key={member.patientProfileId} value={member.patientProfileId}>{member.fullName} · {member.relationshipName}{member.active ? '' : ' · Đã lưu trữ'}</option>)}
                        </select>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1.5">{t('paymentHistory.filter.fromDate')}</p>
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                               placeholder="dd/mm/yyyy" className={inputCls} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1.5">{t('paymentHistory.filter.toDate')}</p>
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                               placeholder="dd/mm/yyyy" className={inputCls} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1.5">{t('paymentHistory.filter.paymentMethod')}</p>
                        <select value={method} onChange={e => setMethod(e.target.value)} className={inputCls}>
                            {METHODS.map(m => <option key={m} value={m}>{m ? METHOD_LABELS[m] : t('paymentHistory.filter.paymentMethod')}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSearch}
                            className="cares-customer-filter-button h-10 px-5 whitespace-nowrap">
                        {t('paymentHistory.filter.searchBtn')}
                    </button>
                </div>

                {/* List View */}
                <div className="space-y-4">
                    <div className="px-1">
                        <p className="text-sm font-semibold text-gray-600">{t('paymentHistory.listTitle')}</p>
                    </div>

                    {loading && (
                        <div className="text-center py-12 text-sm text-gray-400 bg-white rounded-xl border border-gray-200">
                            {t('paymentHistory.loading')}
                        </div>
                    )}
                    {!loading && error && (
                        <div className="text-center py-12 text-sm text-red-500 bg-white rounded-xl border border-gray-200">
                            {error}
                        </div>
                    )}
                    {!loading && !error && invoices.length === 0 && (
                        <div className="text-center py-12 text-sm text-gray-400 bg-white rounded-xl border border-gray-200">
                            {t('paymentHistory.noData')}
                        </div>
                    )}
                    
                    <div className="space-y-3">
                        {!loading && invoices.map((inv) => {
                            const PaymentIcon = inv.paymentMethod?.toLowerCase().includes('card') 
                                ? CreditCard 
                                : inv.paymentMethod?.toLowerCase().includes('transfer') 
                                    ? Landmark 
                                    : Banknote;

                            return (
                                <div 
                                    key={inv.id}
                                    className="cares-payment-row group border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all bg-white border-gray-100"
                                >
                                    {/* Left: Icon & Main Info */}
                                    <div className="flex items-center gap-4">
                                        <div className="cares-payment-icon w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                                            <Receipt className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg leading-tight text-gray-900">
                                                {inv.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                                    #{inv.invoiceId}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    • {inv.settlementDate} {inv.settlementTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Amount & Status */}
                                    <div className="flex items-center justify-between md:justify-end gap-6 md:min-w-[300px]">
                                        <div className="text-right">
                                            <p className="text-xl font-bold font-mono tracking-tight text-gray-900">
                                                {fmt(inv.amount)}
                                            </p>
                                            <div className="flex items-center justify-end gap-1.5 mt-1">
                                                <PaymentIcon className="w-3.5 h-3.5 text-gray-400" />
                                                <p className="text-xs text-gray-500">
                                                    {METHOD_LABELS[String(inv.paymentMethod || '').toLowerCase()] || inv.paymentMethod || 'Chưa cập nhật'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <div className="w-[1px] h-10 bg-gray-200 hidden md:block opacity-50"></div>
                                            <button
                                                onClick={() => navigate(`${ROUTES.CUSTOMER_PAYMENT}/${inv.id}${patientProfileId === 'self' ? '' : `?patientProfileId=${encodeURIComponent(patientProfileId)}`}`)}
                                                className="cares-payment-view-button"
                                                title="Xem phiếu thu"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={handlePage} />
                </div>
            </div>
        </PatientLayout>
    );
}

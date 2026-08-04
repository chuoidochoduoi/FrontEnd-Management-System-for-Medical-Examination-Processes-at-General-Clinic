// src/pages/patient/PaymentHistoryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Receipt, CreditCard, Banknote, Landmark, Download } from 'lucide-react';
import PatientLayout from '@/components/layout/CustomerLayout';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
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

    const [fromDate, setFromDate] = useState('');
    const [toDate,   setToDate]   = useState('');
    const [method,   setMethod]   = useState('');

    useEffect(() => { fetchInvoices(); }, []);

    const handleSearch = () => {
        if (fromDate && toDate && fromDate > toDate) {
            toast.error('Ngày bắt đầu không được sau ngày kết thúc');
            return;
        }
        fetchInvoices({ fromDate, toDate, method, page: 0 });
    };
    const handlePage   = (p) => fetchInvoices({ fromDate, toDate, method, page: p - 1 }); // Frontend 1-based → backend 0-based

    const thCls = 'text-xs font-medium text-gray-400 text-left px-4 py-3';
    const tdCls = 'px-4 py-4 text-sm align-middle';

    return (
        <PatientLayout>
            <div className="space-y-5">
                <h1 className="text-sm font-bold text-gray-900 tracking-widest">{t('paymentHistory.pageTitle')}</h1>

                {/* Filter */}
                <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
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
                            className="h-10 px-5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
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
                        {!loading && invoices.map((inv, i) => {
                            const isLast = i === invoices.length - 1;
                            
                            const PaymentIcon = inv.paymentMethod?.toLowerCase().includes('card') 
                                ? CreditCard 
                                : inv.paymentMethod?.toLowerCase().includes('transfer') 
                                    ? Landmark 
                                    : Banknote;

                            return (
                                <div 
                                    key={inv.id}
                                    className={`group border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-sm hover:shadow-md ${
                                        isLast 
                                            ? 'bg-slate-900 border-slate-800' 
                                            : 'bg-white border-gray-100 hover:border-gray-200'
                                    }`}
                                >
                                    {/* Left: Icon & Main Info */}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                            isLast ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500'
                                        } transition-colors`}>
                                            <Receipt className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className={`font-bold text-lg leading-tight ${isLast ? 'text-white' : 'text-gray-900'}`}>
                                                {inv.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isLast ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                                                    #{inv.invoiceId}
                                                </span>
                                                <span className={`text-sm ${isLast ? 'text-slate-400' : 'text-gray-500'}`}>
                                                    • {inv.settlementDate} {inv.settlementTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Amount & Status */}
                                    <div className="flex items-center justify-between md:justify-end gap-6 md:min-w-[300px]">
                                        <div className="text-right">
                                            <p className={`text-xl font-bold font-mono tracking-tight ${isLast ? 'text-white' : 'text-gray-900'}`}>
                                                {fmt(inv.amount)}
                                            </p>
                                            <div className="flex items-center justify-end gap-1.5 mt-1">
                                                <PaymentIcon className={`w-3.5 h-3.5 ${isLast ? 'text-slate-400' : 'text-gray-400'}`} />
                                                <p className={`text-xs ${isLast ? 'text-slate-400' : 'text-gray-500'}`}>
                                                    {inv.paymentMethod}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <div className="w-[1px] h-10 bg-gray-200 hidden md:block opacity-50"></div>
                                            <button
                                                onClick={() => navigate(`${ROUTES.CUSTOMER_PAYMENT}/${inv.id}`)}
                                                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                                                    isLast 
                                                        ? 'bg-slate-800 text-white hover:bg-primary-600' 
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-gray-100'
                                                }`}
                                                title={t('paymentHistory.downloadBtn')}
                                            >
                                                <Download className="w-4 h-4" />
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

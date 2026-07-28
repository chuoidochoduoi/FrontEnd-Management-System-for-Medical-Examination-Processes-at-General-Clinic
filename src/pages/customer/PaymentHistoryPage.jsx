// src/pages/patient/PaymentHistoryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PatientLayout from '@/components/layout/CustomerLayout';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
import { ROUTES } from '@/constants/routes';

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

    const handleSearch = () => fetchInvoices({ fromDate, toDate, method, page: 0 });
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

                {/* List */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-600">{t('paymentHistory.listTitle')}</p>
                    </div>

                    <table className="w-full">
                        <thead className="border-b border-gray-100">
                        <tr>
                            <th className={thCls}>{t('paymentHistory.table.invoiceId')}</th>
                            <th className={thCls}>{t('paymentHistory.table.description')}</th>
                            <th className={thCls}>{t('paymentHistory.table.settlementDate')}</th>
                            <th className={thCls}>{t('paymentHistory.table.amount')}</th>
                            <th className={thCls}>{t('paymentHistory.table.paymentMethod')}</th>
                            <th className={thCls}>{t('paymentHistory.table.status')}</th>
                            <th className={thCls}>{t('paymentHistory.table.actions')}</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {loading && (
                            <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400">{t('paymentHistory.loading')}</td></tr>
                        )}
                        {!loading && error && (
                            <tr><td colSpan={7} className="text-center py-12 text-sm text-red-500">{error}</td></tr>
                        )}
                        {!loading && !error && invoices.length === 0 && (
                            <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400">{t('paymentHistory.noData')}</td></tr>
                        )}
                        {!loading && invoices.map((inv, i) => {
                            const isLast = i === invoices.length - 1;
                            return (
                                <tr key={inv.id}
                                    className={`hover:bg-gray-50 transition-colors ${isLast ? 'bg-gray-800 hover:bg-gray-700' : ''}`}>
                                    <td className={tdCls + (isLast ? ' text-gray-300 font-mono text-xs' : ' text-gray-500 font-mono text-xs')}>{inv.invoiceId}</td>
                                    <td className={tdCls + (isLast ? ' text-gray-100 font-medium' : ' text-gray-800 font-medium')}>{inv.description}</td>
                                    <td className={tdCls + (isLast ? ' text-gray-400' : ' text-gray-500')}>
                                        <p>{inv.settlementDate}</p>
                                        <p className="text-xs text-gray-400">{inv.settlementTime}</p>
                                    </td>
                                    <td className={tdCls + ' font-bold tabular-nums' + (isLast ? ' text-white' : ' text-gray-900')}>{fmt(inv.amount)}</td>
                                    <td className={tdCls + (isLast ? ' text-gray-300' : ' text-gray-600')}>{inv.paymentMethod}</td>
                                    <td className={tdCls}>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                          isLast
                              ? 'border-gray-600 text-gray-400 bg-gray-700'
                              : 'border-gray-200 text-gray-600 bg-gray-50'
                      }`}>
                        {t(`paymentHistory.status.${inv.status}`) || inv.status}
                      </span>
                                    </td>
                                    <td className={tdCls}>
                                        <button
                                            onClick={() => navigate(`${ROUTES.CUSTOMER_PAYMENT}/${inv.id}`)}
                                            className={`text-sm font-semibold transition-colors ${
                                                isLast ? 'text-gray-300 hover:text-white' : 'text-gray-800 hover:text-primary-500'
                                            }`}
                                        >
                                            {t('paymentHistory.downloadBtn')}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>

                    <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={handlePage} />
                </div>
            </div>
        </PatientLayout>
    );
}

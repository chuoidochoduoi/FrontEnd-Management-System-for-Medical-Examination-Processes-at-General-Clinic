// src/pages/cashier/InvoiceListPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import CashierLayout from '@/components/layout/CashierLayout';
import { useInvoiceList } from '@/hooks/useInvoiceList';

/* ── helpers ── */
const fmt = (n) =>
    n != null ? new Intl.NumberFormat('vi-VN').format(n) : '—';

const STATUS_STYLE = {
    pending:   'bg-orange-50 text-orange-600 border border-orange-200',
    paid:      'bg-green-50  text-green-700  border border-green-200',
    cancelled: 'bg-gray-100  text-gray-500   border border-gray-200',
};

/* ── Service detail modal ── */
function ServiceModal({ services, invoiceCode, onClose, t }) {
    const overlayRef = useRef(null);

    // Close on overlay click
    const handleOverlay = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    // Close on Escape
    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, []);

    const subtotal = services.reduce((s, svc) => s + (svc.price ?? 0), 0);

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlay}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">
                            {t('invoiceList.services.modalTitle')}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{invoiceCode}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Service rows */}
                <div className="px-6 py-2 divide-y divide-gray-50">
                    {services.map((svc, i) => (
                        <div key={i} className="flex items-center justify-between py-3">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className="text-sm text-gray-800 leading-snug">{svc.name}</p>
                                {svc.description && (
                                    <p className="text-xs text-gray-400 mt-0.5">{svc.description}</p>
                                )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 shrink-0">
                {fmt(svc.price)}đ
              </span>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-700">
                        {t('invoiceList.services.total')}
                    </p>
                    <p className="text-base font-bold text-gray-900">{fmt(subtotal)}đ</p>
                </div>

                <div className="px-6 pb-5">
                    <button
                        onClick={onClose}
                        className="w-full h-10 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors mt-3"
                    >
                        {t('invoiceList.services.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Services cell: first service + badge ── */
function ServicesCell({ services, invoiceCode, t }) {
    const [open, setOpen] = useState(false);
    if (!services?.length) return <span className="text-gray-400 text-xs">—</span>;

    const first = services[0];
    const rest  = services.length - 1;

    return (
        <>
            <div>
                <p className="text-sm text-gray-800 leading-snug">{first.name}</p>
                {first.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{first.description}</p>
                )}
                {rest > 0 && (
                    <button
                        onClick={() => setOpen(true)}
                        className="mt-1.5 text-xs text-primary-500 hover:text-primary-600 hover:underline transition-colors"
                    >
                        {t('invoiceList.services.andMore', { count: rest })}
                    </button>
                )}
            </div>

            {open && (
                <ServiceModal
                    services={services}
                    invoiceCode={invoiceCode}
                    onClose={() => setOpen(false)}
                    t={t}
                />
            )}
        </>
    );
}

/* ── Main page ── */
export default function InvoiceListPage() {
    const { t } = useTranslation('cashier');
    const { invoices, loading, error, page, total, fetchInvoices, pay, printInvoice } = useInvoiceList();

    const [search,   setSearch]   = useState('');
    const [status,   setStatus]   = useState('');
    const [category, setCategory] = useState('');

    const PAGE_SIZE = 10;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => { fetchInvoices(); }, []);

    const handleSearch = () => fetchInvoices({ search, status, category, page: 1 });
    const handlePage   = (p) => fetchInvoices({ search, status, category, page: p });

    return (
        <CashierLayout>
            <div className="space-y-5">
                <h1 className="text-lg font-semibold text-gray-900">
                    {t('invoiceList.pageTitle')}
                </h1>

                {/* ── Filter bar ── */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-[1fr_180px_180px_auto] gap-3 items-end">
                    {/* Search */}
                    <div>
                        <p className="text-xs text-gray-400 mb-1.5">{t('invoiceList.filter.search')}</p>
                        <div className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder={t('invoiceList.filter.searchPlaceholder')}
                                className="w-full h-10 pl-3 pr-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <p className="text-xs text-gray-400 mb-1.5">{t('invoiceList.filter.status')}</p>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 bg-white"
                        >
                            <option value="">— Tất cả —</option>
                            <option value="pending">{t('invoiceList.status.pending')}</option>
                            <option value="paid">{t('invoiceList.status.paid')}</option>
                            <option value="cancelled">{t('invoiceList.status.cancelled')}</option>
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <p className="text-xs text-gray-400 mb-1.5">{t('invoiceList.filter.category')}</p>
                        <input
                            type="text"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 placeholder:text-gray-300"
                            placeholder="Phí khám chuyên khoa"
                        />
                    </div>

                    {/* Button */}
                    <button
                        onClick={handleSearch}
                        className="h-10 px-5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                        <Search size={14} />
                        {t('invoiceList.filter.submit')}
                    </button>
                </div>

                {/* ── Table ── */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[140px_180px_1fr_140px_140px_160px] px-6 py-3 border-b border-gray-100 bg-gray-50">
                        {[
                            t('invoiceList.table.invoiceCode'),
                            t('invoiceList.table.patient'),
                            t('invoiceList.table.services'),
                            t('invoiceList.table.total'),
                            t('invoiceList.table.status'),
                            t('invoiceList.table.actions'),
                        ].map(col => (
                            <span key={col} className="text-xs font-medium text-gray-400">{col}</span>
                        ))}
                    </div>

                    {/* States */}
                    {loading && (
                        <p className="text-sm text-gray-400 text-center py-12">{t('invoiceList.loading')}</p>
                    )}
                    {error && (
                        <p className="text-sm text-red-500 text-center py-12">{error}</p>
                    )}
                    {!loading && !error && invoices.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-12">{t('invoiceList.noData')}</p>
                    )}

                    {/* Rows */}
                    {!loading && invoices.map((inv) => (
                        <div
                            key={inv.id}
                            className="grid grid-cols-[140px_180px_1fr_140px_140px_160px] px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors items-start"
                        >
                            {/* Mã hóa đơn */}
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{inv.code}</p>
                            </div>

                            {/* Bệnh nhân */}
                            <div>
                                <p className="text-sm font-medium text-gray-900">{inv.patientName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{inv.patientCode}</p>
                            </div>

                            {/* Dịch vụ — first + badge */}
                            <ServicesCell
                                services={inv.services}
                                invoiceCode={inv.code}
                                t={t}
                            />

                            {/* Tổng tiền */}
                            <p className="text-sm font-semibold text-gray-900 tabular-nums">
                                {fmt(inv.total)}
                            </p>

                            {/* Trạng thái */}
                            <div>
                <span className={`inline-block text-xs px-2.5 py-1 rounded-full ${STATUS_STYLE[inv.status] ?? STATUS_STYLE.pending}`}>
                  {t(`invoiceList.status.${inv.status}`) || inv.status}
                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-1.5 items-start">
                                {inv.status === 'pending' && (
                                    <button
                                        onClick={() => pay(inv.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                        💳 {t('invoiceList.actions.pay')}
                                    </button>
                                )}
                                {inv.status === 'paid' && (
                                    <button
                                        onClick={() => printInvoice(inv.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:border-gray-500 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                                    >
                                        🖨️ {t('invoiceList.actions.print')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="flex justify-end gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => handlePage(p)}
                                className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                                    p === page
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </CashierLayout>
    );
}

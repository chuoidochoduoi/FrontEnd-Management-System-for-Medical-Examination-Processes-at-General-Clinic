// src/pages/cashier/InvoiceListPage.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import CashierLayout from '@/components/layout/CashierLayout';
import { useInvoiceList } from '@/hooks/useInvoiceList';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ROUTES } from '@/constants/routes';

/* ── helpers ── */
const fmt = (n) =>
    n != null ? new Intl.NumberFormat('vi-VN').format(n) : '—';

const STATUS_STYLE = {
    pending:   'bg-orange-50 text-orange-600 border border-orange-200',
    paid:      'bg-green-50  text-green-700  border border-green-200',
    cancelled: 'bg-gray-100  text-gray-500   border border-gray-200',
};

/* ── Services cell: first service + badge ── */
function ServicesCell({ services }) {
    if (!services?.length) return <span className="text-gray-400 text-xs">—</span>;

    const first = services[0];
    const rest  = services.length - 1;

    return (
        <div>
            <p className="text-sm text-gray-800 leading-snug">{first.name}</p>
            {first.description && (
                <p className="text-xs text-gray-400 mt-0.5">{first.description}</p>
            )}
            {rest > 0 && (
                <span className="mt-1.5 inline-block text-xs text-primary-500">
                    +{rest} dịch vụ khác
                </span>
            )}
        </div>
    );
}

/* ── Debug log panel ── */
function DebugLog({ invoices, loading, error, total }) {
    const [showLog, setShowLog] = useState(false);

    // Chỉ hiện trong development hoặc khi có ?debug=true
    const isDebug = import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === 'true';
    if (!isDebug) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={() => setShowLog(v => !v)}
                className="px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg shadow-lg"
            >
                {showLog ? 'Ẩn log' : 'Hiện log'}
            </button>
            {showLog && (
                <div className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs max-w-md max-h-80 overflow-y-auto">
                    <p><strong>Trạng thái:</strong> {loading ? 'Đang tải...' : 'Sẵn sàng'}</p>
                    <p><strong>Tổng số (API trả về):</strong> {total}</p>
                    <p><strong>Số lượng invoices hiển thị:</strong> {invoices.length}</p>
                    {error && <p className="text-red-400"><strong>Lỗi:</strong> {error}</p>}

                    <div className="mt-2 border-t border-gray-700 pt-2">
                        <p className="text-yellow-400 font-semibold">Debug Info:</p>
                        <p className="text-gray-500">Kiểm tra Console (F12) để xem log chi tiết</p>
                        <p className="text-gray-500">API URL: {import.meta.env.VITE_API_URL}/api/v1/invoices</p>

                        {invoices.length > 0 && (
                            <details className="mt-2">
                                <summary className="cursor-pointer text-yellow-300">Dữ liệu invoices (click để xem)</summary>
                                <pre className="mt-1 text-xs overflow-x-auto max-h-40">
                                    {JSON.stringify(invoices.slice(0, 3), null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Main page ── */
export default function InvoiceListPage() {
    const { t } = useTranslation('cashier');
    const { invoices, loading, error, page, total, fetchInvoices } = useInvoiceList();

    const [search,   setSearch]   = useState('');
    const [status,   setStatus]   = useState('');
    const [category, setCategory] = useState('');

    const PAGE_SIZE = 100; // Tăng để lấy đủ dữ liệu, hoặc để backend trả về > 10
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        // Gọi với page=0 (Spring Data 0-indexed)
        fetchInvoices({ page: 0, size: PAGE_SIZE });
    }, []);

    const handleSearch = () => fetchInvoices({ search, status, category, page: 0, size: PAGE_SIZE });
    const handlePage   = (p) => fetchInvoices({ search, status, category, page: p - 1, size: PAGE_SIZE });

    // Lắng nghe sự kiện qua WebSocket
    useWebSocket('/topic/cashier-invoices', null, (message) => {
        if (message === 'INVOICE_UPDATED') {
            // Re-fetch the current page when an invoice is created/updated
            fetchInvoices({ search, status, category, page: page - 1 < 0 ? 0 : page - 1, size: PAGE_SIZE });
        }
    });

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
                    <div className="grid grid-cols-[130px_150px_170px_1fr_120px_120px_130px] px-6 py-3 border-b border-gray-100 bg-gray-50">
                        {[
                            t('invoiceList.table.invoiceCode'),
                            'Thời gian khám/check-in',
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

                    {/* Debug Log Panel - luôn hiện trong môi trường dev */}
                    <DebugLog invoices={invoices} loading={loading} error={error} total={total} />

                    {/* Rows */}
                    {!loading && invoices.map((inv) => (
                        <div
                            key={inv.id}
                            className="grid grid-cols-[130px_150px_170px_1fr_120px_120px_130px] px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors items-start"
                        >
                            {/* Mã hóa đơn */}
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{inv.code}</p>
                            </div>

                            <div className="text-xs text-gray-600 tabular-nums">
                                {inv.checkInTime || inv.createdAt ? new Intl.DateTimeFormat('vi-VN', {
                                    dateStyle: 'short', timeStyle: 'short'
                                }).format(new Date(inv.checkInTime || inv.createdAt)) : inv.issueDate || '—'}
                            </div>

                            {/* Bệnh nhân */}
                            <div>
                                <p className="text-sm font-medium text-gray-900">{inv.patientName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{inv.patientCode}</p>
                            </div>

                            {/* Dịch vụ — first + badge */}
                            <ServicesCell services={inv.services} />

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
                                {/* Nút xem chi tiết - luôn hiện cho mọi trạng thái */}
                                <Link
                                    to={`${ROUTES.CASHIER_INVOICE_DETAIL.replace(':id', inv.id)}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:border-gray-500 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                                >
                                    👁️ Xem chi tiết
                                </Link>

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

                {/* Debug Log Panel */}
                <DebugLog invoices={invoices} loading={loading} error={error} total={total} />
            </div>
        </CashierLayout>
    );
}

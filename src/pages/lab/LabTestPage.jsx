// src/pages/lab/LabTestPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, RotateCcw, ArrowUpDown } from 'lucide-react';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import { useLabQueue } from '@/hooks/useLabQueue.js';
import { useWebSocket } from '@/hooks/useWebSocket.js';
import { ROUTES } from '@/constants/routes.js';
import { toast } from 'react-toastify';

const todayLocalIso = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
};

/* ── Status config ── */
const STATUS = {
    // Backend TestRequestStatus enum values
    PENDING:           { label: 'Chờ xử lý',   cls: 'bg-amber-50 text-amber-600', labelKey: 'pending' },
    IN_PROGRESS:       { label: 'Đang xử lý',  cls: 'bg-blue-50 text-blue-500', labelKey: 'inProgress' },
    COMPLETED:         { label: 'Hoàn thành', cls: 'bg-green-50 text-green-600', labelKey: 'completed' },
    CANCELLED:         { label: 'Đã hủy',     cls: 'bg-red-50 text-red-500', labelKey: 'cancelled' },
};
const DEFAULT_STATUS = { label: 'Chờ xử lý', cls: 'bg-amber-50 text-amber-600', labelKey: 'pending' };

function Avatar({ name }) {
    const initials = name
        ? name.trim().split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
        : '?';
    const colors = ['bg-blue-200', 'bg-green-200', 'bg-purple-200', 'bg-orange-200', 'bg-pink-200'];
    const color  = colors[initials.charCodeAt(0) % colors.length];
    return (
        <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-xs font-semibold text-gray-700 shrink-0`}>
            {initials}
        </div>
    );
}

const TABS = [
    { key: '',                 label: 'Tất cả' },
    { key: 'PENDING',          label: 'Chờ xử lý' },
    { key: 'IN_PROGRESS',      label: 'Đang xử lý' },
    { key: 'COMPLETED',        label: 'Hoàn thành' },
    { key: 'CANCELLED',        label: 'Đã hủy' },
];

export default function LabTestPage() {
    const { departmentId } = useParams(); // departmentId từ URL (/doctor/lab/:departmentId)
    const navigate = useNavigate();
    const { t } = useTranslation('lab');
    const { orders, loading, error, total, page, PAGE_SIZE, fetchOrders } = useLabQueue(departmentId);

    // Listen to real-time lab queue updates
    useWebSocket(departmentId ? `/topic/department-${departmentId}-lab-queue` : null, ['labOrders']);

    const [search,     setSearch]     = useState('');
    const [activeTab,  setActiveTab]  = useState('');
    const [workDate,   setWorkDate]   = useState(todayLocalIso);
    const [sort,       setSort]       = useState('newest');

    const handleTab = (key) => {
        setActiveTab(key);
        fetchOrders({ search, status: key, workDate, sort, page: 1, departmentId });
    };

    const handleSearch = (val) => {
        setSearch(val);
        fetchOrders({ search: val, status: activeTab, workDate, sort, page: 1, departmentId });
    };

    const handleDate = (val) => {
        setWorkDate(val);
        fetchOrders({ search, status: activeTab, workDate: val, sort, page: 1, departmentId });
    };

    const handleRefresh = () => fetchOrders({ search, status: activeTab, workDate, sort, page, departmentId });

    const handleSort = () => {
        const nextSort = sort === 'newest' ? 'oldest' : 'newest';
        setSort(nextSort);
        fetchOrders({ search, status: activeTab, workDate, sort: nextSort, page: 1, departmentId });
    };

    const handlePage = (p) => fetchOrders({ search, status: activeTab, workDate, sort, page: p, departmentId });

    const handleQueueAction = async (ticketId, action) => {
        if (!ticketId) return;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiBase}/api/v1/queue-tickets/${ticketId}/${action}`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            toast.success(action === 'call' ? 'Đã gọi số bệnh nhân' : action === 'start-exam' ? 'Đã bắt đầu thực hiện' : 'Đã đánh dấu vắng');
            handleRefresh();
        } else {
            const body = await res.json().catch(() => ({}));
            toast.error(body.message || 'Không thể cập nhật hàng chờ');
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const from = (page - 1) * PAGE_SIZE + 1;
    const to   = Math.min(page * PAGE_SIZE, total);

    return (
        <MedicalStaffLayout>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto bg-white px-8 py-6">

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div><h1 className="text-xl font-bold text-gray-900">Danh sách yêu cầu xét nghiệm</h1><p className="text-sm text-gray-500">Tiếp nhận, nhập và trả kết quả theo từng yêu cầu</p></div>
                    <button onClick={() => navigate(ROUTES.DOCTOR_LAB_CALL.replace(':departmentId', departmentId))} className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white">Mở màn gọi số</button>
                </div>

                {/* Search, Tabs + sort */}
                <div className="flex flex-col gap-4 mb-5">
                    {/* Search row */}
                    <div className="flex flex-wrap items-center gap-3 max-w-2xl">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder={t('labQueue.searchPlaceholder')}
                                className="w-full h-10 pl-9 pr-4 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100 bg-white"
                            />
                        </div>
                        <input
                            type="date"
                            value={workDate}
                            onChange={(e) => handleDate(e.target.value)}
                            className="h-10 px-4 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100 bg-white"
                        />
                    </div>
                    
                    {/* Tabs row */}
                    <div className="flex items-center justify-between">
                    {/* Tabs */}
                    <div className="flex gap-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => handleTab(tab.key)}
                                className={`px-4 h-9 text-sm rounded-lg font-medium transition-colors ${
                                    activeTab === tab.key
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort + Refresh */}
                    <div className="flex items-center gap-2">
                        <button onClick={handleSort} className="flex items-center gap-2 h-9 px-3 text-sm border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400 transition-colors">
                            <ArrowUpDown size={13} />
                            {sort === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>
                </div>

                {/* Table */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[140px_140px_1fr_160px_140px_120px_120px] px-5 py-3 border-b border-gray-100 bg-gray-50">
                        {[
                            t('labQueue.table.requestCode'),
                            t('labQueue.table.patientCode'),
                            t('labQueue.table.fullName'),
                            t('labQueue.table.requestTime'),
                            t('labQueue.table.labType'),
                            t('labQueue.table.status'),
                            t('labQueue.table.actions'),
                        ].map(col => (
                            <span key={col} className="text-xs font-medium text-gray-400">{col}</span>
                        ))}
                    </div>

                    {/* States */}
                    {loading && (
                        <p className="text-sm text-gray-400 text-center py-14">{t('labQueue.loading')}</p>
                    )}
                    {error && (
                        <p className="text-sm text-red-500 text-center py-14">{error}</p>
                    )}
                    {!loading && !error && orders.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-14">{t('labQueue.noData')}</p>
                    )}

                    {/* Rows */}
                    {!loading && orders.map((order, idx) => {
                        const statusCfg = STATUS[order.status] ?? DEFAULT_STATUS;
                        const isEven    = idx % 2 === 0;

                        return (
                            <div
                                key={order.testRequestId ?? idx}
                                className={`grid grid-cols-[140px_140px_1fr_160px_140px_120px_120px] px-5 py-4 border-b border-gray-50 last:border-0 items-center transition-colors hover:bg-gray-50 ${isEven ? 'bg-white' : 'bg-white'}`}
                            >
                                {/* Mã yêu cầu */}
                                <span className="text-sm font-bold text-primary-600">{order.queueNumber ? `Số ${order.queueNumber}` : '-'}</span>

                                {/* Mã BN */}
                                <span className="text-sm text-gray-600">{order.patientCode}</span>

                                {/* Họ tên + avatar */}
                                <div className="flex items-center gap-2.5">
                                    <Avatar name={order.patientName} />
                                    <span className="text-sm font-medium text-gray-900">{order.patientName}</span>
                                </div>

                                {/* Thời gian */}
                                <span className="text-sm text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleString() : order.requestTime}</span>

                                {/* Loại xét nghiệm */}
                                <span className="text-sm text-gray-600">{order.serviceName ?? order.labType}</span>

                                {/* Trạng thái */}
                                <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${statusCfg.cls}`}>
                                    {statusCfg.label}
                                </span>

                                {/* Hành động */}
                                <div className="flex items-center gap-3">
                                    {order.queueStatus === 'WAITING' && <button onClick={() => handleQueueAction(order.queueTicketId, 'call')} className="text-sm font-semibold text-primary-600 hover:underline">Gọi số</button>}
                                    {order.queueStatus === 'CALLED' && <button onClick={() => handleQueueAction(order.queueTicketId, 'start-exam')} className="text-sm font-semibold text-primary-600 hover:underline">Bắt đầu</button>}
                                    <button
                                        onClick={() => navigate(`${ROUTES.DOCTOR_LAB_DETAIL.replace(':id', order.testRequestId ?? order.id)}`)}
                                        disabled={order.queueStatus && order.queueStatus !== 'IN_PROGRESS' && order.queueStatus !== 'DONE'}
                                        className="text-sm font-semibold text-gray-800 hover:text-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        {t('labQueue.actions.view')}
                                    </button>
                                    {order.status === 'IN_PROGRESS' && (
                                        <button className="text-sm font-semibold text-gray-800 hover:text-primary-500 transition-colors">
                                            {t('labQueue.actions.execute')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {total > 0 && (
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-gray-400">
                            {t('labQueue.pagination', { from, to, total })}
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePage(page - 1)}
                                disabled={page === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                ‹
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => handlePage(p)}
                                    className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                                        p === page
                                            ? 'bg-gray-900 text-white'
                                            : 'border border-gray-200 text-gray-600 hover:border-gray-400'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePage(page + 1)}
                                disabled={page === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </MedicalStaffLayout>
    );
}

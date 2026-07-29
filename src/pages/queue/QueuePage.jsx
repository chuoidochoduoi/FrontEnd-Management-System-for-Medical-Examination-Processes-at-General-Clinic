import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LayoutGrid,
    Users,
    ClipboardList,
    FileText,
    Settings,
    LogOut,
    Bell,
    UserCircle,
    Search,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useQueueList } from '@/hooks/useQueueList';
import { useQueueActions } from '@/hooks/useQueueActions';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';

// Map status from API (uppercase) to lowercase for translation lookup
const STATUS_MAP = {
    WAITING: 'waiting',
    CALLED: 'called',
    IN_PROGRESS: 'inProgress',
    DONE: 'done',
    SKIPPED: 'skipped',
    WAITING_FOR_TEST: 'waitingForTest',
};

const STATUS_STYLES = {
    waiting: 'bg-amber-50 text-amber-700',
    called: 'bg-emerald-50 text-emerald-700',
    inProgress: 'bg-blue-50 text-blue-700',
    done: 'bg-gray-100 text-gray-600',
    skipped: 'bg-red-50 text-red-700',
    waitingForTest: 'bg-purple-50 text-purple-700',
};

function initialsColor(seed = '') {
    const palette = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];
    const idx = seed.charCodeAt(0) % palette.length || 0;
    return palette[idx];
}

export default function QueuePage() {
    const { t } = useTranslation('queue');
    const { t: tDoctor } = useTranslation('doctor');
    const { callPatient, startExam, completeExam, markAbsent, skipPatient, returnToQueue } = useQueueActions();

    const [activeTab, setActiveTab] = useState('all');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('queueNumber');
    const [page, setPage] = useState(1);

    // Debounce the search box before it hits the API
    useEffect(() => {
        const id = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(id);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    const { items, total, pageSize, loading, error, reload } = useQueueList({
        status: activeTab,
        search,
        sort,
        page,
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const fromCount = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const toCount = Math.min(page * pageSize, total);

    // Check if any patient is in progress
    const hasInProgress = items.some(t => t.status === 'IN_PROGRESS');

    const handleAction = async (actionFn, patientId) => {
        const result = await actionFn(patientId);
        if (result.success) {
            reload();
        }
    };

    return (
        <MedicalStaffLayout>
            <main className="flex-1 overflow-y-auto">
                {/* Top bar */}
                <div className="flex items-center justify-end gap-4 border-b border-gray-200 bg-white px-6 py-3">
                    <button className="text-gray-400 hover:text-gray-600">
                        <Bell className="h-5 w-5" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                        <UserCircle className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <h1 className="text-xl font-semibold text-gray-900 mb-4">{tDoctor('sidebar.waitingRoom')}</h1>

                    {/* Tabs + sort */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
                            {['all', 'waiting', 'called', 'inProgress', 'done', 'skipped', 'waitingForTest', 'absent'].map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                                        activeTab === key
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {t(`tabs.${key}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder={t('search.placeholder')}
                            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        />
                    </div>

                    {/* Table card */}
                    <div className="rounded-lg bg-white shadow-sm">
                        {error ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
                                <p className="text-sm">{t('error')}</p>
                                <button
                                    onClick={reload}
                                    className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    {t('retry')}
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-400">
                                        <th className="px-5 py-3 text-left font-medium">{t('table.patientCode')}</th>
                                        <th className="px-5 py-3 text-left font-medium">{t('table.fullName')}</th>
                                        <th className="px-5 py-3 text-left font-medium">{t('table.lastVisit')}</th>
                                        <th className="px-5 py-3 text-left font-medium">{t('table.history')}</th>
                                        <th className="px-5 py-3 text-left font-medium">{t('table.status')}</th>
                                        <th className="px-5 py-3 text-left font-medium">{t('table.actions')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                                                {t('loading')}
                                            </td>
                                        </tr>
                                    ) : items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                                                {t('empty')}
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((ticket) => {
                                            const statusKey = STATUS_MAP[ticket.status] ?? ticket.status;
                                            const patientCode = ticket.patientCode ?? '—';
                                            const name = ticket.patientName ?? ticket.serviceName ?? '—';
                                            const initials = name.charAt(0) ?? '?';
                                            const lastVisit = ticket.lastVisit ?? (ticket.workDate ? String(ticket.workDate) : '—');
                                            const history = ticket.history ? [String(ticket.history)] : [];

                                            return (
                                            <tr key={ticket.ticketId} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                <td className="px-5 py-3.5 font-medium text-gray-800">
                                                    {patientCode}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                                            style={{ backgroundColor: initialsColor(name) }}
                                                        >
                                                            {initials}
                                                        </div>
                                                        <span className="text-gray-800">{name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-500">{lastVisit}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex flex-wrap gap-1">
                                                        {history.map((code) => (
                                                            <span
                                                                key={code}
                                                                className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600"
                                                            >
                                                                {code}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`rounded px-2 py-1 text-xs font-semibold ${
                                                            STATUS_STYLES[statusKey] ?? 'bg-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        {t(`status.${statusKey}`)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3 text-sm font-medium">
                                                        <button className="text-gray-700 hover:underline">{t('actions.view')}</button>
                                                        {statusKey === 'waiting' && (
                                                            <>
                                                                <button
                                                                    className="text-gray-700 hover:underline"
                                                                    onClick={() => handleAction(callPatient, ticket.ticketId)}
                                                                    disabled={hasInProgress}
                                                                    title={hasInProgress ? 'Đã có bệnh nhân đang khám' : ''}
                                                                >
                                                                    {t('actions.callIn')}
                                                                </button>
                                                                <button
                                                                    className="text-gray-700 hover:underline"
                                                                    onClick={() => handleAction(markAbsent, ticket.ticketId)}
                                                                    disabled={hasInProgress}
                                                                    title={hasInProgress ? 'Đã có bệnh nhân đang khám' : ''}
                                                                >
                                                                    {t('actions.markAbsent')}
                                                                </button>
                                                            </>
                                                        )}
                                                        {statusKey === 'called' && (
                                                            <button
                                                                className="text-gray-700 hover:underline"
                                                                onClick={() => handleAction(startExam, ticket.ticketId)}
                                                                disabled={hasInProgress}
                                                                title={hasInProgress ? 'Đã có bệnh nhân đang khám' : ''}
                                                            >
                                                                {t('actions.startExam')}
                                                            </button>
                                                        )}
                                                        {statusKey === 'inProgress' && (
                                                            <button
                                                                className="text-gray-700 hover:underline"
                                                                onClick={() => handleAction(completeExam, ticket.ticketId)}
                                                            >
                                                                {t('actions.finish')}
                                                            </button>
                                                        )}
                                                        {statusKey === 'absent' && (
                                                            <button
                                                                className="text-gray-700 hover:underline"
                                                                onClick={() => handleAction(returnToQueue, ticket.ticketId)}
                                                                disabled={hasInProgress}
                                                                title={hasInProgress ? 'Đã có bệnh nhân đang khám' : ''}
                                                            >
                                                                {t('actions.returnToQueue')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {!error && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
                                <p className="text-xs text-gray-400">
                                    {t('pagination.showing', { from: fromCount, to: toCount, total })}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 disabled:opacity-30"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium ${
                                                p === page ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 disabled:opacity-30"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </MedicalStaffLayout>
    );
}
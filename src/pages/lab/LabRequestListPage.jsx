// src/pages/lab/LabRequestListPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Search,
    RotateCcw,
    ArrowUpDown,
    FlaskConical,
    UserCircle,
} from 'lucide-react';

import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import { useLabQueue } from '@/hooks/useLabQueue';
import { ROUTES } from '@/constants/routes';

/* =========================================================
   STATUS
========================================================= */

const STATUS = {
    PENDING: {
        label: 'Chờ xử lý',
        cls: 'bg-amber-50 text-amber-700',
        labelKey: 'pending',
    },

    IN_PROGRESS: {
        label: 'Đang xử lý',
        cls: 'bg-blue-50 text-blue-700',
        labelKey: 'inProgress',
    },

    COMPLETED: {
        label: 'Hoàn thành',
        cls: 'bg-emerald-50 text-emerald-700',
        labelKey: 'completed',
    },

    CANCELLED: {
        label: 'Đã hủy',
        cls: 'bg-red-50 text-red-600',
        labelKey: 'cancelled',
    },
};

const DEFAULT_STATUS = {
    label: 'Chờ xử lý',
    cls: 'bg-amber-50 text-amber-700',
    labelKey: 'pending',
};

/* =========================================================
   AVATAR
========================================================= */

function Avatar({ name }) {
    const initials = name
        ? name
            .trim()
            .split(' ')
            .slice(-2)
            .map((word) => word[0])
            .join('')
            .toUpperCase()
        : '?';

    const colors = [
        'bg-blue-100 text-blue-700',
        'bg-green-100 text-green-700',
        'bg-purple-100 text-purple-700',
        'bg-orange-100 text-orange-700',
        'bg-pink-100 text-pink-700',
    ];

    const charCode = initials.charCodeAt(0);

    const color =
        colors[
            Number.isNaN(charCode)
                ? 0
                : charCode % colors.length
            ];

    return (
        <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}
        >
            {initials}
        </div>
    );
}

/* =========================================================
   TABS
========================================================= */

const TABS = [
    {
        key: '',
        label: 'Tất cả',
    },
    {
        key: 'PENDING',
        label: 'Chờ xử lý',
    },
    {
        key: 'IN_PROGRESS',
        label: 'Đang xử lý',
    },
    {
        key: 'COMPLETED',
        label: 'Hoàn thành',
    },
    {
        key: 'CANCELLED',
        label: 'Đã hủy',
    },
];

export default function LabRequestListPage() {
    const { departmentId } = useParams();

    const navigate = useNavigate();

    const { t } = useTranslation('lab');

    const {
        orders,
        loading,
        error,
        total,
        page,
        PAGE_SIZE,
        fetchOrders,
    } = useLabQueue(departmentId);

    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('');
    const [sort, setSort] = useState('newest');

    /* =========================================================
       HANDLERS
    ========================================================= */

    const handleTab = (key) => {
        setActiveTab(key);

        fetchOrders({
            search,
            status: key,
            sort,
            page: 1,
            departmentId,
        });
    };

    const handleSearch = (value) => {
        setSearch(value);

        fetchOrders({
            search: value,
            status: activeTab,
            sort,
            page: 1,
            departmentId,
        });
    };

    const handleRefresh = () =>
        fetchOrders({
            search,
            status: activeTab,
            sort,
            page,
            departmentId,
        });

    const handlePage = (targetPage) =>
        fetchOrders({
            search,
            status: activeTab,
            sort,
            page: targetPage,
            departmentId,
        });

    const totalPages = Math.max(
        1,
        Math.ceil(total / PAGE_SIZE)
    );

    const from =
        total === 0
            ? 0
            : (page - 1) * PAGE_SIZE + 1;

    const to = Math.min(
        page * PAGE_SIZE,
        total
    );

    return (
        <MedicalStaffLayout>
            <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-5">

                {/* Full width */}
                <div className="w-full">

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <header className="mb-4 flex flex-wrap items-start justify-between gap-4">

                        <div>
                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                                    <FlaskConical size={20} />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        Danh sách yêu cầu cận lâm sàng
                                    </h1>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Theo dõi và xử lý các yêu cầu tại phòng
                                    </p>
                                </div>

                            </div>
                        </div>

                        <button
                            onClick={() =>
                                navigate(
                                    ROUTES.DOCTOR_LAB_CALL.replace(
                                        ':departmentId',
                                        departmentId
                                    )
                                )
                            }
                            className="h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
                        >
                            Mở hàng chờ
                        </button>

                    </header>

                    {/* =================================================
                        FILTER CARD
                    ================================================= */}

                    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                        {/* Search + actions */}

                        <div className="flex flex-wrap items-center justify-between gap-3">

                            <div className="relative min-w-[300px] max-w-2xl flex-1">

                                <Search
                                    size={15}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        handleSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Tìm theo tên bệnh nhân, mã bệnh nhân, dịch vụ..."
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                />

                            </div>

                            <div className="flex items-center gap-2">

                                <button
                                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    <ArrowUpDown size={14} />

                                    Sắp xếp
                                </button>

                                <button
                                    onClick={
                                        handleRefresh
                                    }
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                                    title="Làm mới"
                                >
                                    <RotateCcw size={15} />
                                </button>

                            </div>

                        </div>

                        {/* Tabs */}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

                            <div className="flex flex-wrap gap-2">

                                {TABS.map((tab) => (

                                    <button
                                        key={tab.key}
                                        onClick={() =>
                                            handleTab(
                                                tab.key
                                            )
                                        }
                                        className={`h-9 rounded-lg px-4 text-sm font-medium transition ${
                                            activeTab ===
                                            tab.key
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>

                                ))}

                            </div>

                            <span className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
                                {total} yêu cầu
                            </span>

                        </div>

                    </section>

                    {/* =================================================
                        TABLE
                    ================================================= */}

                    <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        {/* Table title */}

                        <div className="border-b border-slate-100 px-5 py-3">

                            <h2 className="text-base font-semibold text-slate-900">
                                Yêu cầu cận lâm sàng
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-400">
                                Danh sách các yêu cầu được gửi đến phòng hiện tại
                            </p>

                        </div>

                        {/* STATES */}

                        {loading && (
                            <div className="px-5 py-12 text-center text-sm text-slate-400">
                                {t(
                                    'labQueue.loading'
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="px-5 py-12 text-center text-sm text-red-500">
                                {error}
                            </div>
                        )}

                        {!loading &&
                            !error &&
                            orders.length === 0 && (

                                <div className="px-5 py-12 text-center">

                                    <UserCircle className="mx-auto mb-2 h-9 w-9 text-slate-300" />

                                    <p className="text-sm font-medium text-slate-500">
                                        Không có yêu cầu cận lâm sàng
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Các yêu cầu mới sẽ xuất hiện tại đây
                                    </p>

                                </div>

                            )}

                        {/* TABLE */}

                        {!loading &&
                            !error &&
                            orders.length > 0 && (

                                <div className="w-full overflow-x-auto">

                                    <table className="w-full text-sm">

                                        <thead>

                                        <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">

                                            <th className="w-[13%] px-5 py-3 text-left font-medium">
                                                Mã yêu cầu
                                            </th>

                                            <th className="w-[12%] px-5 py-3 text-left font-medium">
                                                Mã BN
                                            </th>

                                            <th className="w-[20%] px-5 py-3 text-left font-medium">
                                                Bệnh nhân
                                            </th>

                                            <th className="w-[17%] px-5 py-3 text-left font-medium">
                                                Thời gian yêu cầu
                                            </th>

                                            <th className="w-[20%] px-5 py-3 text-left font-medium">
                                                Dịch vụ
                                            </th>

                                            <th className="w-[10%] px-5 py-3 text-left font-medium">
                                                Trạng thái
                                            </th>

                                            <th className="w-[8%] px-5 py-3 text-right font-medium">
                                                Thao tác
                                            </th>

                                        </tr>

                                        </thead>

                                        <tbody className="divide-y divide-slate-100">

                                        {orders.map(
                                            (
                                                order,
                                                idx
                                            ) => {

                                                const statusCfg =
                                                    STATUS[
                                                        order
                                                            .status
                                                        ] ??
                                                    DEFAULT_STATUS;

                                                return (

                                                    <tr
                                                        key={
                                                            order.testRequestId ??
                                                            idx
                                                        }
                                                        className="transition hover:bg-slate-50/70"
                                                    >

                                                        {/* REQUEST ID */}

                                                        <td className="px-5 py-3.5">

                                                            <p
                                                                className="max-w-[150px] truncate font-medium text-slate-700"
                                                                title={
                                                                    order.testRequestId ??
                                                                    order.id
                                                                }
                                                            >
                                                                {order.testRequestId ??
                                                                    order.id ??
                                                                    '—'}
                                                            </p>

                                                        </td>

                                                        {/* PATIENT CODE */}

                                                        <td className="px-5 py-3.5 text-slate-500">
                                                            {order.patientCode ||
                                                                '—'}
                                                        </td>

                                                        {/* PATIENT */}

                                                        <td className="px-5 py-3.5">

                                                            <div className="flex items-center gap-3">

                                                                <Avatar
                                                                    name={
                                                                        order.patientName
                                                                    }
                                                                />

                                                                <div className="min-w-0">

                                                                    <p className="truncate font-semibold text-slate-900">
                                                                        {order.patientName ||
                                                                            '—'}
                                                                    </p>

                                                                </div>

                                                            </div>

                                                        </td>

                                                        {/* CREATED AT */}

                                                        <td className="px-5 py-3.5 text-slate-500">

                                                            {order.createdAt
                                                                ? new Date(
                                                                    order.createdAt
                                                                ).toLocaleString()
                                                                : order.requestTime ||
                                                                '—'}

                                                        </td>

                                                        {/* SERVICE */}

                                                        <td className="px-5 py-3.5">

                                                            <p className="font-medium text-slate-700">
                                                                {order.serviceName ??
                                                                    order.labType ??
                                                                    '—'}
                                                            </p>

                                                        </td>

                                                        {/* STATUS */}

                                                        <td className="px-5 py-3.5">

                                                                <span
                                                                    className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold ${statusCfg.cls}`}
                                                                >
                                                                    {
                                                                        statusCfg.label
                                                                    }
                                                                </span>

                                                        </td>

                                                        {/* ACTION */}

                                                        <td className="px-5 py-3.5">

                                                            <div className="flex justify-end gap-2">

                                                                <button
                                                                    onClick={() =>
                                                                        navigate(
                                                                            ROUTES.DOCTOR_LAB_DETAIL.replace(
                                                                                ':id',
                                                                                order.testRequestId ??
                                                                                order.id
                                                                            )
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                                                >
                                                                    Xem
                                                                </button>

                                                                {order.status ===
                                                                    'IN_PROGRESS' && (

                                                                        <button
                                                                            onClick={() =>
                                                                                navigate(
                                                                                    ROUTES.DOCTOR_LAB_DETAIL.replace(
                                                                                        ':id',
                                                                                        order.testRequestId ??
                                                                                        order.id
                                                                                    )
                                                                                )
                                                                            }
                                                                            className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-600"
                                                                        >
                                                                            Thực hiện
                                                                        </button>

                                                                    )}

                                                            </div>

                                                        </td>

                                                    </tr>

                                                );

                                            }
                                        )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                    </section>

                    {/* =================================================
                        PAGINATION
                    ================================================= */}

                    {total > 0 && (

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

                            <p className="text-xs text-slate-400">
                                Hiển thị {from}–{to} trong tổng số {total} yêu cầu
                            </p>

                            <div className="flex items-center gap-1">

                                <button
                                    onClick={() =>
                                        handlePage(
                                            page - 1
                                        )
                                    }
                                    disabled={
                                        page === 1
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    ‹
                                </button>

                                {Array.from(
                                    {
                                        length: totalPages,
                                    },
                                    (_, index) =>
                                        index + 1
                                ).map(
                                    (targetPage) => (

                                        <button
                                            key={
                                                targetPage
                                            }
                                            onClick={() =>
                                                handlePage(
                                                    targetPage
                                                )
                                            }
                                            className={`h-8 min-w-8 rounded-lg px-2 text-sm transition ${
                                                targetPage ===
                                                page
                                                    ? 'bg-slate-900 text-white'
                                                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {
                                                targetPage
                                            }
                                        </button>

                                    )
                                )}

                                <button
                                    onClick={() =>
                                        handlePage(
                                            page + 1
                                        )
                                    }
                                    disabled={
                                        page ===
                                        totalPages
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    ›
                                </button>

                            </div>

                        </div>

                    )}

                </div>

            </div>
        </MedicalStaffLayout>
    );
}
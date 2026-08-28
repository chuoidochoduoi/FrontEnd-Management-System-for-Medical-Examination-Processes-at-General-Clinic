// src/pages/patient/MedicalHistoryPage.jsx

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Filter,
    RotateCcw,
    Search,
    Stethoscope,
} from 'lucide-react';

import PatientLayout from '@/components/layout/CustomerLayout';
import { useMedicalHistory } from '@/hooks/useMedicalHistory';
import { ROUTES } from '@/constants/routes';

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_PAGE_SIZE = 7;

const STATUSES = [
    { value: '', label: 'Tất cả' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý' },
    { value: 'CANCELLED', label: 'Đã hủy' },
];

const SORT_OPTIONS = [
    { value: 'DESC', label: 'Mới nhất' },
    { value: 'ASC', label: 'Cũ nhất' },
];

const inputCls =
    'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-200';

const labelCls =
    'mb-1.5 block text-xs font-medium text-gray-500';

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value) =>
    String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const recordStatusLabel = (value) => {
    switch (String(value || '').toUpperCase()) {
        case 'COMPLETED':
            return 'Hoàn thành';

        case 'IN_PROGRESS':
            return 'Đang xử lý';

        case 'DRAFT':
            return 'Bản nháp';

        case 'CANCELLED':
            return 'Đã hủy';

        default:
            return value || 'Hoàn thành';
    }
};

const statusClass = (value) => {
    switch (String(value || '').toUpperCase()) {
        case 'CANCELLED':
            return 'border-red-200 bg-white text-red-500';

        case 'IN_PROGRESS':
            return 'border-gray-300 bg-gray-50 text-gray-700';

        case 'DRAFT':
            return 'border-amber-200 bg-amber-50 text-amber-700';

        case 'COMPLETED':
        default:
            return 'border-gray-200 bg-gray-50 text-gray-600';
    }
};

const parseVisitDate = (value) => {
    if (!value) {
        return null;
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(`${value}T00:00:00`);

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/');

        const date = new Date(
            `${year}-${month}-${day}T00:00:00`
        );

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
};

const toDateInputValue = (date) => {
    if (!date) {
        return '';
    }

    const parsed = parseVisitDate(date);

    if (!parsed) {
        return '';
    }

    return [
        parsed.getFullYear(),
        String(parsed.getMonth() + 1).padStart(2, '0'),
        String(parsed.getDate()).padStart(2, '0'),
    ].join('-');
};

/* =========================================================
   PAGINATION
========================================================= */

function Pagination({
                        page,
                        total,
                        pageSize,
                        onChange,
                    }) {
    const totalPages = Math.max(
        1,
        Math.ceil(total / pageSize)
    );

    if (totalPages <= 1) {
        return null;
    }

    const visiblePages = [];

    for (
        let pageNumber = 1;
        pageNumber <= totalPages;
        pageNumber++
    ) {
        if (
            totalPages <= 7 ||
            pageNumber === 1 ||
            pageNumber === totalPages ||
            Math.abs(pageNumber - page) <= 1
        ) {
            visiblePages.push(pageNumber);
        }
    }

    return (
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                disabled={page === 1}
                onClick={() =>
                    onChange(
                        Math.max(1, page - 1)
                    )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
                <ChevronLeft size={16} />
            </button>

            {visiblePages.map(
                (
                    pageNumber,
                    index
                ) => {
                    const previous =
                        visiblePages[
                        index - 1
                            ];

                    return (
                        <div
                            key={pageNumber}
                            className="flex items-center gap-1.5"
                        >
                            {previous &&
                                pageNumber -
                                previous >
                                1 && (
                                    <span className="px-1 text-sm text-gray-400">
                                        ...
                                    </span>
                                )}

                            <button
                                type="button"
                                onClick={() =>
                                    onChange(
                                        pageNumber
                                    )
                                }
                                className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                                    page ===
                                    pageNumber
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                                }`}
                            >
                                {pageNumber}
                            </button>
                        </div>
                    );
                }
            )}

            <button
                type="button"
                disabled={
                    page === totalPages
                }
                onClick={() =>
                    onChange(
                        Math.min(
                            totalPages,
                            page + 1
                        )
                    )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

/* =========================================================
   MAIN
========================================================= */

export default function MedicalHistoryPage() {
    const navigate = useNavigate();

    const {
        visits = [],
        loading,
        error,
        total = 0,
        page = 1,
        PAGE_SIZE: hookPageSize,
        fetchHistory,
    } = useMedicalHistory();

    const pageSize =
        hookPageSize ||
        DEFAULT_PAGE_SIZE;

    /* =====================================================
       FILTER STATE
    ===================================================== */

    const [
        search,
        setSearch,
    ] = useState('');

    const [
        fromDate,
        setFromDate,
    ] = useState('');

    const [
        toDate,
        setToDate,
    ] = useState('');

    const [
        status,
        setStatus,
    ] = useState('');

    const [
        sort,
        setSort,
    ] = useState('DESC');

    /*
     * appliedFilter giúp phân trang tiếp tục sử dụng
     * đúng filter sau khi người dùng bấm "Lọc".
     */
    const [
        appliedFilter,
        setAppliedFilter,
    ] = useState({
        search: '',
        fromDate: '',
        toDate: '',
        status: '',
        sort: 'DESC',
    });

    /* =====================================================
       LOAD
    ===================================================== */

    useEffect(() => {
        fetchHistory({
            page: 0,
            size: pageSize,
            sort: 'DESC',
        });
    }, []);

    /* =====================================================
       FILTER
    ===================================================== */

    const handleFilter = () => {
        if (
            fromDate &&
            toDate &&
            fromDate > toDate
        ) {
            return;
        }

        const filters = {
            search:
                search.trim(),

            fromDate:
                fromDate || undefined,

            toDate:
                toDate || undefined,

            status:
                status || undefined,

            sort,

            page: 0,

            size: pageSize,
        };

        setAppliedFilter({
            search:
                search.trim(),
            fromDate,
            toDate,
            status,
            sort,
        });

        fetchHistory(filters);
    };

    /* =====================================================
       RESET
    ===================================================== */

    const handleReset = () => {
        setSearch('');
        setFromDate('');
        setToDate('');
        setStatus('');
        setSort('DESC');

        setAppliedFilter({
            search: '',
            fromDate: '',
            toDate: '',
            status: '',
            sort: 'DESC',
        });

        fetchHistory({
            page: 0,
            size: pageSize,
            sort: 'DESC',
        });
    };

    /* =====================================================
       PAGE
    ===================================================== */

    const handlePage = (
        nextPage
    ) => {
        fetchHistory({
            ...appliedFilter,

            fromDate:
                appliedFilter.fromDate ||
                undefined,

            toDate:
                appliedFilter.toDate ||
                undefined,

            status:
                appliedFilter.status ||
                undefined,

            page:
                nextPage - 1,

            size:
            pageSize,
        });
    };

    /* =====================================================
       LOCAL DISPLAY FILTER FALLBACK
    ===================================================== */

    /*
     * Nếu backend/hook đã hỗ trợ các filter mới,
     * phần này vẫn không gây ảnh hưởng.
     *
     * Nó giúp status/sort hoạt động ở dữ liệu
     * hiện tại trong lúc backend chưa map đầy đủ.
     */
    const displayVisits =
        useMemo(() => {
            let result = [
                ...visits,
            ];

            const keyword =
                normalize(
                    appliedFilter.search
                );

            if (keyword) {
                result =
                    result.filter(
                        (visit) => {
                            const text =
                                normalize(
                                    [
                                        visit.recordCode,
                                        visit.visitCode,
                                        visit.doctor,
                                        visit.diagnosis,
                                        visit.specialty,
                                        visit.serviceName,
                                        ...(visit.serviceNames || []),
                                        ...(visit.doctorNames || []),
                                    ].join(
                                        ' '
                                    )
                                );

                            return text.includes(
                                keyword
                            );
                        }
                    );
            }

            if (
                appliedFilter.status
            ) {
                result =
                    result.filter(
                        (visit) =>
                            String(
                                visit.status ||
                                'COMPLETED'
                            ).toUpperCase() ===
                            appliedFilter.status
                    );
            }

            if (
                appliedFilter.fromDate
            ) {
                result =
                    result.filter(
                        (visit) => {
                            const value =
                                toDateInputValue(
                                    visit.date
                                );

                            return (
                                !value ||
                                value >=
                                appliedFilter.fromDate
                            );
                        }
                    );
            }

            if (
                appliedFilter.toDate
            ) {
                result =
                    result.filter(
                        (visit) => {
                            const value =
                                toDateInputValue(
                                    visit.date
                                );

                            return (
                                !value ||
                                value <=
                                appliedFilter.toDate
                            );
                        }
                    );
            }

            result.sort(
                (a, b) => {
                    const dateA =
                        parseVisitDate(
                            a.date
                        );

                    const dateB =
                        parseVisitDate(
                            b.date
                        );

                    const valueA =
                        dateA?.getTime() ||
                        0;

                    const valueB =
                        dateB?.getTime() ||
                        0;

                    return appliedFilter.sort ===
                    'ASC'
                        ? valueA -
                        valueB
                        : valueB -
                        valueA;
                }
            );

            return result;
        }, [
            visits,
            appliedFilter,
        ]);

    /* =====================================================
       PAGINATION RANGE
    ===================================================== */

    const from =
        total === 0
            ? 0
            : (page - 1) *
            pageSize +
            1;

    const to = Math.min(
        page * pageSize,
        total
    );

    /* =====================================================
       UI
    ===================================================== */

    return (
        <PatientLayout>
            <div className="w-full space-y-5">

                {/* =================================================
                    TITLE
                ================================================= */}

                <div>
                    <h1 className="text-xl font-bold text-gray-900">
                        Lịch sử khám bệnh
                    </h1>
                </div>

                {/* =================================================
                    FILTER CARD
                ================================================= */}

                <div className="rounded-2xl border border-gray-200 bg-white p-5">

                    {/* ROW 1 */}

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.8fr_0.95fr_0.95fr]">

                        {/* SEARCH */}

                        <div>
                            <label className={labelCls}>
                                Tìm kiếm
                            </label>

                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    value={
                                        search
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearch(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    onKeyDown={(
                                        event
                                    ) => {
                                        if (
                                            event.key ===
                                            'Enter'
                                        ) {
                                            handleFilter();
                                        }
                                    }}
                                    placeholder="Tìm theo mã hồ sơ, bác sĩ, chẩn đoán..."
                                    className={`${inputCls} pl-9`}
                                />
                            </div>
                        </div>

                        {/* FROM DATE */}

                        <div>
                            <label className={labelCls}>
                                Từ ngày
                            </label>

                            <input
                                type="date"
                                value={
                                    fromDate
                                }
                                max={
                                    toDate ||
                                    undefined
                                }
                                onChange={(
                                    event
                                ) =>
                                    setFromDate(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className={
                                    inputCls
                                }
                            />
                        </div>

                        {/* TO DATE */}

                        <div>
                            <label className={labelCls}>
                                Đến ngày
                            </label>

                            <input
                                type="date"
                                value={
                                    toDate
                                }
                                min={
                                    fromDate ||
                                    undefined
                                }
                                onChange={(
                                    event
                                ) =>
                                    setToDate(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className={
                                    inputCls
                                }
                            />
                        </div>

                    </div>

                    {/* ROW 2 */}

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[260px_260px_140px_140px]">

                        {/* STATUS */}

                        <div>
                            <label className={labelCls}>
                                Trạng thái
                            </label>

                            <select
                                value={
                                    status
                                }
                                onChange={(
                                    event
                                ) =>
                                    setStatus(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className={
                                    inputCls
                                }
                            >
                                {STATUSES.map(
                                    (
                                        item
                                    ) => (
                                        <option
                                            key={
                                                item.value
                                            }
                                            value={
                                                item.value
                                            }
                                        >
                                            {
                                                item.label
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {/* SORT */}

                        <div>
                            <label className={labelCls}>
                                Sắp xếp
                            </label>

                            <select
                                value={
                                    sort
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSort(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className={
                                    inputCls
                                }
                            >
                                {SORT_OPTIONS.map(
                                    (
                                        item
                                    ) => (
                                        <option
                                            key={
                                                item.value
                                            }
                                            value={
                                                item.value
                                            }
                                        >
                                            {
                                                item.label
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {/* FILTER */}

                        <div className="flex items-end">

                            <button
                                type="button"
                                onClick={
                                    handleFilter
                                }
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-700"
                            >
                                <Filter
                                    size={
                                        15
                                    }
                                />

                                Lọc
                            </button>
                        </div>

                        {/* RESET */}

                        <div className="flex items-end">

                            <button
                                type="button"
                                onClick={
                                    handleReset
                                }
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-50"
                            >
                                <RotateCcw
                                    size={
                                        15
                                    }
                                />

                                Đặt lại
                            </button>
                        </div>
                    </div>

                    {fromDate &&
                        toDate &&
                        fromDate >
                        toDate && (
                            <p className="mt-3 text-xs text-red-500">
                                Từ ngày không được lớn hơn đến ngày.
                            </p>
                        )}
                </div>

                {/* =================================================
                    RESULT COUNT
                ================================================= */}

                {!loading &&
                    !error &&
                    total > 0 && (
                        <p className="px-1 text-xs text-gray-400">
                            Hiển thị{' '}
                            {from}–
                            {to} trong tổng số{' '}
                            {total} hồ sơ
                        </p>
                    )}

                {/* =================================================
                    HISTORY LIST
                ================================================= */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">

                    {/* HEADER */}

                    <div className="hidden grid-cols-[180px_240px_270px_minmax(250px,1fr)_130px_100px] border-b border-gray-100 px-5 py-3 text-xs font-medium text-gray-400 lg:grid">

                        <div>
                            Ngày giờ
                        </div>

                        <div>
                            Dịch vụ khám
                        </div>

                        <div>
                            Bác sĩ / Mã hồ sơ
                        </div>

                        <div>
                            Chẩn đoán
                        </div>

                        <div>
                            Trạng thái
                        </div>

                        <div />
                    </div>

                    {/* LOADING */}

                    {loading && (
                        <div className="py-16 text-center text-sm text-gray-400">
                            Đang tải lịch sử khám bệnh...
                        </div>
                    )}

                    {/* ERROR */}

                    {!loading &&
                        error && (
                            <div className="py-16 text-center text-sm text-red-500">
                                {error}
                            </div>
                        )}

                    {/* EMPTY */}

                    {!loading &&
                        !error &&
                        displayVisits.length ===
                        0 && (
                            <div className="py-16 text-center">

                                <CalendarDays
                                    size={30}
                                    className="mx-auto mb-3 text-gray-200"
                                />

                                <p className="text-sm text-gray-400">
                                    Không có lịch sử khám bệnh phù hợp.
                                </p>
                            </div>
                        )}

                    {/* =================================================
                        ROWS
                    ================================================= */}

                    {!loading &&
                        !error &&
                        displayVisits.map(
                            (visit) => {
                                const visitStatus =
                                    visit.status ||
                                    'COMPLETED';

                                return (
                                    <button
                                        key={
                                            visit.id
                                        }
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `${ROUTES.CUSTOMER_VISIT_HISTORY}/${visit.id}`
                                            )
                                        }
                                        className="group grid w-full grid-cols-1 gap-4 border-b border-gray-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-gray-50 lg:grid-cols-[180px_240px_270px_minmax(250px,1fr)_130px_100px] lg:items-center"
                                    >

                                        {/* DATE */}

                                        <div className="flex items-start gap-3">

                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">

                                                <CalendarDays
                                                    size={
                                                        17
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {visit.date ||
                                                        '-'}
                                                </p>

                                                <p className="mt-0.5 text-xs text-gray-400">
                                                    {visit.time ||
                                                        '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* TYPE */}

                                        <div>
                                            <p className="mb-1 text-[10px] text-gray-400 lg:hidden">
                                                Dịch vụ khám
                                            </p>

                                            <div className="flex items-start gap-2">
                                                <Stethoscope size={16} className="mt-0.5 shrink-0 text-gray-500" />
                                                <div className="min-w-0">
                                                    <p className="line-clamp-2 text-sm font-semibold text-gray-800">
                                                        {visit.serviceName || visit.specialty || 'Khám bệnh'}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        Lượt khám: {visit.visitCode || '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* DOCTOR / RECORD */}

                                        <div>
                                            <p className="mb-1 text-[10px] text-gray-400 lg:hidden">
                                                Bác sĩ / Mã hồ sơ
                                            </p>

                                            <p className="truncate text-sm text-gray-700">
                                                {visit.doctor ||
                                                    '-'}
                                            </p>

                                            {visit.recordCode && (
                                                <p className="mt-0.5 truncate text-xs text-gray-400">
                                                    {visit.recordCode}
                                                </p>
                                            )}
                                        </div>

                                        {/* DIAGNOSIS */}

                                        <div>
                                            <p className="mb-1 text-[10px] text-gray-400 lg:hidden">
                                                Chẩn đoán
                                            </p>

                                            <p className="line-clamp-2 text-sm font-medium leading-5 text-gray-900">
                                                {visit.diagnosis ||
                                                    '-'}
                                            </p>
                                        </div>

                                        {/* STATUS */}

                                        <div>
                                            <span
                                                className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-medium ${statusClass(
                                                    visitStatus
                                                )}`}
                                            >
                                                {recordStatusLabel(
                                                    visitStatus
                                                )}
                                            </span>
                                        </div>

                                        {/* ACTION */}

                                        <div className="flex items-center justify-end gap-2 text-sm text-gray-500">

                                            <span className="hidden group-hover:text-gray-900 lg:inline">
                                                Xem chi tiết
                                            </span>

                                            <ChevronRight
                                                size={
                                                    17
                                                }
                                                className="text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-700"
                                            />
                                        </div>
                                    </button>
                                );
                            }
                        )}
                </div>

                {/* =================================================
                    PAGINATION
                ================================================= */}

                {!loading &&
                    !error &&
                    total > 0 && (
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">

                            <Pagination
                                page={
                                    page
                                }
                                total={
                                    total
                                }
                                pageSize={
                                    pageSize
                                }
                                onChange={
                                    handlePage
                                }
                            />

                            <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-600">
                                {pageSize} / trang
                            </div>
                        </div>
                    )}
            </div>
        </PatientLayout>
    );
}

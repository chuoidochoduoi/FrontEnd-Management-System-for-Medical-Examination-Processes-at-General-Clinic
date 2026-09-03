import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Filter,
    MessageSquare,
    RefreshCw,
    Search,
    Star,
    UserRound,
} from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import OwnerLayout from '@/components/layout/OwnerLayout';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 7;

const stored = (key) =>
    localStorage.getItem(key) ||
    sessionStorage.getItem(key);

const apiUrl =
    import.meta.env.VITE_API_URL;

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value) =>
    String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const formatDateTime = (
    value,
    locale = 'vi-VN'
) => {
    if (!value) return '-';

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleString(
        locale,
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }
    );
};

const getVisitCode = (item) =>
    item.visitCode ||
    item.recordCode ||
    item.visitId ||
    item.recordId ||
    '-';

const hasResponse = (item) =>
    Boolean(
        item.managerResponse?.trim() ||
        item.receptionistResponse?.trim()
    );

const getResponse = (item) =>
    item.receptionistResponse ||
    item.managerResponse ||
    '';

const getResponseName = (item) =>
    item.receptionistName ||
    item.respondedByName ||
    'Lễ tân';

const getRespondedAt = (item) =>
    item.receptionistRespondedAt ||
    item.respondedAt ||
    null;

/* =========================================================
   STAR VIEW
========================================================= */

function StarRating({
                        value = 0,
                    }) {
    const rating =
        Number(value) || 0;

    return (
        <div className="flex items-center gap-1">
            {[
                1,
                2,
                3,
                4,
                5,
            ].map((star) => (
                <Star
                    key={star}
                    size={20}
                    strokeWidth={1.8}
                    className={
                        star <= rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                    }
                    fill={
                        star <= rating
                            ? 'currentColor'
                            : 'none'
                    }
                />
            ))}
        </div>
    );
}

/* =========================================================
   FEEDBACK PAGE
========================================================= */

export default function FeedbackPage() {
    const {
        t,
        i18n,
    } = useTranslation(
        'operations'
    );

    const systemRole =
        stored('systemRole');

    /* Chỉ Lễ tân và Clinic Manager được quản lý phản hồi. */
    const isReceptionist =
        systemRole ===
        'RECEPTIONIST';

    const isManager =
        systemRole ===
        'CLINIC_MANAGER';

    const canManageFeedback =
        isReceptionist ||
        isManager;

    const Layout = isManager
        ? OwnerLayout
        : ReceptionistLayout;

    /* =====================================================
       DATA
    ===================================================== */

    const [
        items,
        setItems,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        savingId,
        setSavingId,
    ] = useState(null);

    const [
        drafts,
        setDrafts,
    ] = useState({});

    /* =====================================================
       FILTER
    ===================================================== */

    const [
        tab,
        setTab,
    ] = useState('ALL');

    const [
        searchTerm,
        setSearchTerm,
    ] = useState('');

    const [
        selectedDate,
        setSelectedDate,
    ] = useState('');

    const [
        page,
        setPage,
    ] = useState(1);

    const locale =
        i18n.language === 'en'
            ? 'en-US'
            : 'vi-VN';

    /* =====================================================
       REQUEST
    ===================================================== */

    const request =
        useCallback(
            async (
                url,
                options = {}
            ) => {
                const response =
                    await fetch(
                        `${apiUrl}${url}`,
                        {
                            ...options,

                            headers: {
                                Authorization: `Bearer ${stored(
                                    'token'
                                )}`,

                                'Content-Type':
                                    'application/json',

                                ...options.headers,
                            },
                        }
                    );

                const body =
                    await response
                        .json()
                        .catch(
                            () => ({})
                        );

                if (!response.ok) {
                    throw new Error(
                        body.message ||
                        t(
                            'feedback.requestFailed'
                        ) ||
                        'Không thể thực hiện yêu cầu.'
                    );
                }

                return (
                    body.data ??
                    body
                );
            },
            [t]
        );

    /* =====================================================
       LOAD
    ===================================================== */

    const load =
        useCallback(
            async () => {
                setLoading(true);

                try {
                    /*
                     * Tạm load nhiều để filter/search phía FE.
                     * UI vẫn phân trang 7 bản ghi.
                     *
                     * Nếu API sau này hỗ trợ filter server-side
                     * thì có thể chuyển sang Pageable trực tiếp.
                     */
                    const data =
                        await request(
                            '/api/v1/feedbacks?page=0&size=1000&sort=ratedAt,desc'
                        );

                    const content =
                        Array.isArray(
                            data
                        )
                            ? data
                            : data.content ||
                            [];

                    setItems(
                        content
                    );
                } catch (error) {
                    toast.error(
                        error.message
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [request]
        );

    useEffect(() => {
        load();
    }, [load]);

    /* =====================================================
       DRAFT
    ===================================================== */

    const change = (
        id,
        value
    ) => {
        setDrafts(
            (previous) => ({
                ...previous,

                [id]: value.slice(
                    0,
                    500
                ),
            })
        );
    };

    /* =====================================================
       SAVE RESPONSE
    ===================================================== */

    const save = async (
        item
    ) => {
        if (!canManageFeedback) {
            return;
        }

        if (
            hasResponse(item)
        ) {
            return;
        }

        const id =
            item.recordId;

        const response =
            (
                drafts[id] ??
                ''
            ).trim();

        if (!response) {
            toast.error(
                'Vui lòng nhập nội dung phản hồi.'
            );

            return;
        }

        setSavingId(id);

        try {
            await request(
                `/api/v1/feedbacks/${id}/respond`,
                {
                    method: 'PUT',

                    body:
                        JSON.stringify(
                            {
                                response,
                            }
                        ),
                }
            );

            toast.success(
                t(
                    'feedback.updated'
                ) ||
                'Đã gửi phản hồi.'
            );

            setDrafts(
                (previous) => {
                    const next = {
                        ...previous,
                    };

                    delete next[id];

                    return next;
                }
            );

            await load();
            window.dispatchEvent(
                new Event('feedback-count-changed')
            );
        } catch (error) {
            toast.error(
                error.message
            );
        } finally {
            setSavingId(null);
        }
    };

    /* =====================================================
       FILTERED DATA
    ===================================================== */

    const unansweredCount =
        useMemo(
            () =>
                items.filter(
                    (item) =>
                        !hasResponse(
                            item
                        )
                ).length,
            [items]
        );

    const filteredItems =
        useMemo(() => {
            const keyword =
                normalize(
                    searchTerm
                );

            return items.filter(
                (item) => {
                    /* TAB */

                    if (
                        tab ===
                        'UNANSWERED' &&
                        hasResponse(
                            item
                        )
                    ) {
                        return false;
                    }

                    if (
                        tab ===
                        'ANSWERED' &&
                        !hasResponse(
                            item
                        )
                    ) {
                        return false;
                    }

                    /* SEARCH */

                    if (keyword) {
                        const haystack =
                            normalize(
                                [
                                    item.patientName,
                                    item.serviceName,
                                    item.visitCode,
                                    item.recordCode,
                                    item.visitId,
                                    item.recordId,
                                ].join(
                                    ' '
                                )
                            );

                        if (
                            !haystack.includes(
                                keyword
                            )
                        ) {
                            return false;
                        }
                    }

                    /* DATE */

                    if (
                        selectedDate
                    ) {
                        if (
                            !item.ratedAt
                        ) {
                            return false;
                        }

                        const ratedDate =
                            new Date(
                                item.ratedAt
                            )
                                .toLocaleDateString(
                                    'en-CA'
                                );

                        if (
                            ratedDate !==
                            selectedDate
                        ) {
                            return false;
                        }
                    }

                    return true;
                }
            );
        }, [
            items,
            tab,
            searchTerm,
            selectedDate,
        ]);

    /* =====================================================
       PAGINATION
    ===================================================== */

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredItems.length /
                PAGE_SIZE
            )
        );

    useEffect(() => {
        setPage(1);
    }, [
        tab,
        searchTerm,
        selectedDate,
    ]);

    useEffect(() => {
        if (
            page >
            totalPages
        ) {
            setPage(
                totalPages
            );
        }
    }, [
        page,
        totalPages,
    ]);

    const pageItems =
        useMemo(() => {
            const start =
                (page - 1) *
                PAGE_SIZE;

            return filteredItems.slice(
                start,
                start +
                PAGE_SIZE
            );
        }, [
            filteredItems,
            page,
        ]);

    const pageStart =
        filteredItems.length ===
        0
            ? 0
            : (page - 1) *
            PAGE_SIZE +
            1;

    const pageEnd =
        Math.min(
            page * PAGE_SIZE,
            filteredItems.length
        );

    /* =====================================================
       RESET FILTER
    ===================================================== */

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedDate('');
        setTab('ALL');
        setPage(1);
    };

    /* =====================================================
       UI
    ===================================================== */

    return (
        <Layout>
            <div className="w-full space-y-5 p-6 lg:p-8">

                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="flex flex-wrap items-start justify-between gap-4">

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Đánh giá của khách hàng
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Theo dõi và trả lời phản hồi của khách hàng trong hệ thống.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={load}
                        disabled={
                            loading
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                loading
                                    ? 'animate-spin'
                                    : ''
                            }
                        />

                        Làm mới
                    </button>
                </header>

                {/* =================================================
                    FILTER BAR
                ================================================= */}

                <div className="rounded-2xl border border-gray-200 bg-white">

                    <div className="flex flex-col justify-between gap-4 px-5 py-4 xl:flex-row xl:items-center">

                        {/* TABS */}

                        <div className="flex items-center gap-1">

                            <button
                                type="button"
                                onClick={() =>
                                    setTab(
                                        'ALL'
                                    )
                                }
                                className={`relative h-10 px-4 text-sm font-medium transition ${
                                    tab ===
                                    'ALL'
                                        ? 'text-teal-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Tất cả

                                {tab ===
                                    'ALL' && (
                                        <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-teal-500" />
                                    )}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setTab(
                                        'UNANSWERED'
                                    )
                                }
                                className={`relative flex h-10 items-center gap-2 px-4 text-sm font-medium transition ${
                                    tab ===
                                    'UNANSWERED'
                                        ? 'text-teal-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Chưa phản hồi

                                {unansweredCount >
                                    0 && (
                                        <span className="flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                        {
                                            unansweredCount
                                        }
                                    </span>
                                    )}

                                {tab ===
                                    'UNANSWERED' && (
                                        <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-teal-500" />
                                    )}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setTab(
                                        'ANSWERED'
                                    )
                                }
                                className={`relative h-10 px-4 text-sm font-medium transition ${
                                    tab ===
                                    'ANSWERED'
                                        ? 'text-teal-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Đã phản hồi

                                {tab ===
                                    'ANSWERED' && (
                                        <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-teal-500" />
                                    )}
                            </button>
                        </div>

                        {/* SEARCH / DATE */}

                        <div className="flex flex-col gap-2 sm:flex-row">

                            <div className="relative sm:w-[340px]">

                                <Search
                                    size={
                                        16
                                    }
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    value={
                                        searchTerm
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearchTerm(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Tìm theo tên bệnh nhân, mã lượt khám..."
                                    className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-teal-400"
                                />
                            </div>

                            <div className="relative">
                                <CalendarDays
                                    size={
                                        16
                                    }
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="date"
                                    value={
                                        selectedDate
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSelectedDate(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className="h-10 rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-600 outline-none focus:border-teal-400"
                                />
                            </div>

                            {(searchTerm ||
                                selectedDate ||
                                tab !==
                                'ALL') && (
                                <button
                                    type="button"
                                    onClick={
                                        resetFilters
                                    }
                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    <Filter
                                        size={
                                            15
                                        }
                                    />
                                    Bỏ lọc
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* =================================================
                    LOADING
                ================================================= */}

                {loading && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">

                        <RefreshCw
                            size={22}
                            className="mx-auto mb-3 animate-spin text-gray-300"
                        />

                        <p className="text-sm text-gray-400">
                            Đang tải đánh giá...
                        </p>
                    </div>
                )}

                {/* =================================================
                    EMPTY
                ================================================= */}

                {!loading &&
                    pageItems.length ===
                    0 && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">

                            <MessageSquare
                                size={
                                    34
                                }
                                className="mx-auto mb-3 text-gray-200"
                            />

                            <p className="text-sm font-medium text-gray-600">
                                Không có đánh giá phù hợp
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                            </p>
                        </div>
                    )}

                {/* =================================================
                    FEEDBACK LIST
                ================================================= */}

                {!loading && (
                    <div className="space-y-4">

                        {pageItems.map(
                            (item) => {
                                const responded =
                                    hasResponse(
                                        item
                                    );

                                const response =
                                    getResponse(
                                        item
                                    );

                                const respondedAt =
                                    getRespondedAt(
                                        item
                                    );

                                const responderName =
                                    getResponseName(
                                        item
                                    );

                                const draft =
                                    drafts[
                                        item
                                            .recordId
                                        ] ??
                                    '';

                                return (
                                    <article
                                        key={
                                            item.recordId
                                        }
                                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                                    >

                                        {/* =========================================
                                            CARD HEADER
                                        ========================================= */}

                                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">

                                            <div className="min-w-0">

                                                <h2 className="truncate text-base font-bold text-gray-900">
                                                    {item.patientName ||
                                                        '-'}{' '}
                                                    -{' '}
                                                    {item.serviceName ||
                                                        '-'}
                                                </h2>

                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">

                                                    <span>
                                                        Mã lượt khám:{' '}
                                                        <strong className="font-medium text-gray-500">
                                                            {getVisitCode(
                                                                item
                                                            )}
                                                        </strong>
                                                    </span>

                                                    {item.ratedAt && (
                                                        <>
                                                            <span>
                                                                •
                                                            </span>

                                                            <span>
                                                                {formatDateTime(
                                                                    item.ratedAt,
                                                                    locale
                                                                )}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">

                                                <span
                                                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                                                        responded
                                                            ? 'bg-green-50 text-green-600'
                                                            : 'bg-orange-50 text-orange-600'
                                                    }`}
                                                >
                                                    {responded
                                                        ? 'Đã phản hồi'
                                                        : 'Chưa phản hồi'}
                                                </span>

                                                <div className="flex items-center gap-1 font-semibold text-yellow-500">

                                                    <Star
                                                        size={
                                                            18
                                                        }
                                                        fill="currentColor"
                                                    />

                                                    <span className="text-sm">
                                                        {item.overallRating ||
                                                            0}
                                                        /5
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* =========================================
                                            BODY - TWO COLUMNS
                                        ========================================= */}

                                        <div className="grid grid-cols-1 lg:grid-cols-2">

                                            {/* =====================================
                                                CUSTOMER
                                            ===================================== */}

                                            <div className="border-b border-gray-100 p-5 lg:border-b-0 lg:border-r">

                                                <p className="mb-4 text-sm font-semibold text-gray-900">
                                                    Đánh giá của khách hàng
                                                </p>

                                                <StarRating
                                                    value={
                                                        item.overallRating
                                                    }
                                                />

                                                <div className="mt-4 min-h-[74px] rounded-xl bg-gray-50 px-4 py-3">

                                                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                                        {item.comment?.trim()
                                                            ? item.comment
                                                            : 'Không có nhận xét.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* =====================================
                                                OFFICIAL RESPONSE
                                            ===================================== */}

                                            <div className="p-5">

                                                <p className="mb-4 text-sm font-semibold text-gray-900">
                                                    Phản hồi chính thức
                                                    <span className="ml-1 font-normal text-gray-400">
                                                        (khách hàng sẽ nhìn thấy)
                                                    </span>
                                                </p>

                                                {responded ? (
                                                    <>
                                                        {/* READ-ONLY RESPONSE */}

                                                        <div className="min-h-[92px] rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">

                                                            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                                                {
                                                                    response
                                                                }
                                                            </p>
                                                        </div>

                                                        <div className="mt-4 flex items-center gap-3">

                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">

                                                                <UserRound
                                                                    size={
                                                                        18
                                                                    }
                                                                />
                                                            </div>

                                                            <div>
                                                                <div className="flex items-center gap-2">

                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        {
                                                                            responderName
                                                                        }
                                                                    </p>

                                                                    <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-600">
                                                                        Lễ tân
                                                                    </span>
                                                                </div>

                                                                {respondedAt && (
                                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                                        Phản hồi lúc:{' '}
                                                                        {formatDateTime(
                                                                            respondedAt,
                                                                            locale
                                                                        )}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : canManageFeedback ? (
                                                    <>
                                                        {/* NEW RESPONSE */}

                                                        <div className="relative">

                                                            <textarea
                                                                rows={
                                                                    4
                                                                }
                                                                maxLength={
                                                                    500
                                                                }
                                                                value={
                                                                    draft
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    change(
                                                                        item.recordId,
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Nhập phản hồi của bạn..."
                                                                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 pb-8 text-sm outline-none transition placeholder:text-gray-400 focus:border-teal-400"
                                                            />

                                                            <span className="absolute bottom-3 right-4 text-xs text-gray-400">
                                                                {
                                                                    draft.length
                                                                }
                                                                /500
                                                            </span>
                                                        </div>

                                                        <div className="mt-3 flex justify-end">

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    savingId ===
                                                                    item.recordId ||
                                                                    !draft.trim()
                                                                }
                                                                onClick={() =>
                                                                    save(
                                                                        item
                                                                    )
                                                                }
                                                                className="h-10 min-w-[140px] rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {savingId ===
                                                                item.recordId
                                                                    ? 'Đang lưu...'
                                                                    : 'Lưu xử lý'}
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex min-h-[92px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">

                                                        <p className="text-sm text-gray-400">
                                                            Chưa có phản hồi.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            }
                        )}
                    </div>
                )}

                {/* =================================================
                    PAGINATION
                ================================================= */}

                {!loading &&
                    filteredItems.length >
                    0 && (
                        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 sm:flex-row">

                            <p className="text-sm text-gray-500">
                                Hiển thị{' '}
                                <strong className="font-medium text-gray-700">
                                    {pageStart}
                                    {' - '}
                                    {pageEnd}
                                </strong>{' '}
                                trong{' '}
                                <strong className="font-medium text-gray-700">
                                    {
                                        filteredItems.length
                                    }
                                </strong>{' '}
                                đánh giá
                            </p>

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    disabled={
                                        page ===
                                        1
                                    }
                                    onClick={() =>
                                        setPage(
                                            (
                                                current
                                            ) =>
                                                Math.max(
                                                    1,
                                                    current -
                                                    1
                                                )
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft
                                        size={
                                            16
                                        }
                                    />
                                </button>

                                {Array.from(
                                    {
                                        length:
                                        totalPages,
                                    },
                                    (
                                        _,
                                        index
                                    ) =>
                                        index +
                                        1
                                )
                                    .filter(
                                        (
                                            pageNumber
                                        ) =>
                                            totalPages <=
                                            7 ||
                                            pageNumber ===
                                            1 ||
                                            pageNumber ===
                                            totalPages ||
                                            Math.abs(
                                                pageNumber -
                                                page
                                            ) <=
                                            1
                                    )
                                    .map(
                                        (
                                            pageNumber,
                                            index,
                                            array
                                        ) => {
                                            const previous =
                                                array[
                                                index -
                                                1
                                                    ];

                                            return (
                                                <div
                                                    key={
                                                        pageNumber
                                                    }
                                                    className="flex items-center gap-2"
                                                >
                                                    {previous &&
                                                        pageNumber -
                                                        previous >
                                                        1 && (
                                                            <span className="px-1 text-gray-400">
                                                                …
                                                            </span>
                                                        )}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPage(
                                                                pageNumber
                                                            )
                                                        }
                                                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                                                            page ===
                                                            pageNumber
                                                                ? 'border-teal-500 bg-teal-50 text-teal-700'
                                                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {
                                                            pageNumber
                                                        }
                                                    </button>
                                                </div>
                                            );
                                        }
                                    )}

                                <button
                                    type="button"
                                    disabled={
                                        page ===
                                        totalPages
                                    }
                                    onClick={() =>
                                        setPage(
                                            (
                                                current
                                            ) =>
                                                Math.min(
                                                    totalPages,
                                                    current +
                                                    1
                                                )
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronRight
                                        size={
                                            16
                                        }
                                    />
                                </button>
                            </div>

                            <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-500">
                                7 / trang
                            </div>
                        </div>
                    )}
            </div>
        </Layout>
    );
}

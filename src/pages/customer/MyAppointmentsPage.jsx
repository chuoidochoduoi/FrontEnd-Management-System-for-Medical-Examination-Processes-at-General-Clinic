// src/pages/patient/MyAppointmentsPage.jsx

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Filter,
    Clock3,
    Plus,
} from 'lucide-react';

import PatientLayout from '@/components/layout/CustomerLayout';
import CancelConfirmModal from '@/components/ui/CancelConfirmModal';
import { useAppointments } from '@/hooks/useAppointmentsCustomer';
import { ROUTES } from '@/constants/routes';
import { toast } from 'react-toastify';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useProfile } from '@/hooks/useProfile';

/* =========================================================
   HELPERS
========================================================= */

const normalizeStatus = (status) =>
    (status || '')
        .toString()
        .toLowerCase()
        .trim();

const STATUSES = [
    '',
    'upcoming',
    'checked_in',
    'completed',
    'cancelled',
];

const inputCls =
    'w-full h-11 px-4 text-sm border border-gray-200 rounded-lg outline-none bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition';

const labelCls =
    'block text-xs font-semibold text-gray-500 mb-2';

const STATUS_CLS = {
    upcoming:
        'inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700',

    checked_in:
        'inline-flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700',

    completed:
        'inline-flex items-center rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500',

    cancelled:
        'inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500',
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

    const pages = [];

    for (
        let current = 1;
        current <= totalPages;
        current++
    ) {
        if (
            totalPages <= 7 ||
            current === 1 ||
            current === totalPages ||
            Math.abs(current - page) <= 1
        ) {
            pages.push(current);
        }
    }

    return (
        <div className="flex items-center gap-2">

            <button
                type="button"
                disabled={page === 1}
                onClick={() => onChange(1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
                <ChevronsLeft size={16} />
            </button>

            <button
                type="button"
                disabled={page === 1}
                onClick={() =>
                    onChange(
                        Math.max(1, page - 1)
                    )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
                <ChevronLeft size={16} />
            </button>

            {pages.map(
                (
                    pageNumber,
                    index
                ) => {
                    const previous =
                        pages[index - 1];

                    return (
                        <div
                            key={pageNumber}
                            className="flex items-center gap-2"
                        >
                            {previous &&
                                pageNumber -
                                previous >
                                1 && (
                                    <span className="px-1 text-gray-400">
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
                                        ? 'border-gray-900 bg-white text-gray-900'
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
                <ChevronRight size={16} />
            </button>

            <button
                type="button"
                disabled={
                    page === totalPages
                }
                onClick={() =>
                    onChange(totalPages)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
                <ChevronsRight size={16} />
            </button>
        </div>
    );
}

/* =========================================================
   MAIN
========================================================= */

export default function MyAppointmentsPage() {
    const { t } =
        useTranslation(
            'appointments'
        );

    const navigate =
        useNavigate();
    const { profile } = useProfile();
    const { members: familyMembers } = useFamilyMembers(true);

    const {
        appointments,
        loading,
        error,
        total,
        page,
        PAGE_SIZE,
        fetchAppointments,
        cancelAppointment,
    } = useAppointments();

    const [
        cancelApptId,
        setCancelApptId,
    ] = useState(null);

    const [
        isCancelling,
        setIsCancelling,
    ] = useState(false);

    const [
        status,
        setStatus,
    ] = useState('');

    const [
        date,
        setDate,
    ] = useState('');
    const [patientProfileId, setPatientProfileId] = useState('all');

    /* =====================================================
       STATUS CONFIG
    ===================================================== */

    const STATUS_CFG = {
        upcoming: {
            label: t(
                'myAppointments.status.upcoming'
            ),
            cls: STATUS_CLS.upcoming,
        },

        completed: {
            label: t(
                'myAppointments.status.completed'
            ),
            cls: STATUS_CLS.completed,
        },

        cancelled: {
            label: t(
                'myAppointments.status.cancelled'
            ),
            cls: STATUS_CLS.cancelled,
        },

        checked_in: {
            label: t(
                'myAppointments.status.checked_in'
            ),
            cls: STATUS_CLS.checked_in,
        },
    };

    /* =====================================================
       LOAD
    ===================================================== */

    useEffect(() => {
        fetchAppointments();
    }, []);

    /* =====================================================
       FILTER
    ===================================================== */

    const handleFilter = () => {
        fetchAppointments({
            status,
            date,
            patientProfileId: patientProfileId === 'all' ? '' : patientProfileId,
            includeFamily: patientProfileId === 'all',
            page: 0,
        });
    };

    /* =====================================================
       PAGE
    ===================================================== */

    const handlePage = (nextPage) => {
        fetchAppointments({
            status,
            page:
                nextPage - 1,
        });
    };

    /* =====================================================
       RESULT RANGE
    ===================================================== */

    const resultStart =
        total === 0
            ? 0
            : (page - 1) *
            PAGE_SIZE +
            1;

    const resultEnd =
        Math.min(
            page * PAGE_SIZE,
            total
        );

    const nextAppointment = useMemo(() => appointments.find((appointment) => {
        const normalized = normalizeStatus(appointment.status);
        if (!['scheduled', 'pending', 'rescheduled', 'upcoming'].includes(normalized)) return false;
        if (!appointment.date) return true;
        const [day, month, year] = appointment.date.split('/');
        const appointmentDate = new Date(`${year}-${month}-${day}T23:59:59`);
        return !Number.isNaN(appointmentDate.getTime()) && appointmentDate >= new Date();
    }), [appointments]);

    /* =====================================================
       UI
    ===================================================== */

    return (
        <PatientLayout>
            <div className="cares-appointments-page w-full space-y-5">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="cares-customer-page-heading">

                    <div>
                        <span className="cares-customer-eyebrow"><CalendarDays size={15} /> Trung tâm lịch hẹn</span>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {t(
                                'myAppointments.pageTitle'
                            )}
                        </h1>

                        <p className="text-sm leading-6 text-gray-400">
                            {t(
                                'myAppointments.notice'
                            )}

                            <br />

                            {t(
                                'myAppointments.noticeQueue'
                            )}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                ROUTES.CUSTOMER_APPOINTMENT
                            )
                        }
                        className="cares-customer-primary-button"
                    >
                        <Plus size={17} />

                        {t(
                            'myAppointments.newBtn'
                        )}
                    </button>
                </div>

                {nextAppointment && (
                    <section className="cares-next-appointment">
                        <div className="cares-next-appointment-date">
                            <CalendarDays size={22} />
                            <span><small>Lịch gần nhất</small><strong>{nextAppointment.date || 'Đang cập nhật'}</strong></span>
                        </div>
                        <div>
                            <small>Dịch vụ</small>
                            <strong>{nextAppointment.serviceSummary || nextAppointment.serviceName || 'Chưa cập nhật dịch vụ'}</strong>
                        </div>
                        <div>
                            <small>Thời gian</small>
                            <strong><Clock3 size={16} />{nextAppointment.timeWindow || nextAppointment.shift || 'Đang cập nhật'}</strong>
                        </div>
                        <button type="button" onClick={() => navigate(`/my-appointments/${nextAppointment.id}`)}>
                            Xem chi tiết <ChevronRight size={17} />
                        </button>
                    </section>
                )}

                {/* =================================================
                    FILTER
                ================================================= */}

                <div className="cares-customer-filter-card rounded-2xl border border-gray-200 bg-white p-5">

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_220px]">

                        <div>
                            <label className={labelCls}>Người được khám</label>
                            <select value={patientProfileId} onChange={event => setPatientProfileId(event.target.value)} className={inputCls}>
                                <option value="all">Tất cả thành viên</option>
                                {profile?.profileId && <option value={profile.profileId}>Tôi · {profile.fullName}</option>}
                                {familyMembers.map(member => <option key={member.patientProfileId} value={member.patientProfileId}>{member.fullName} · {member.relationshipName}{member.active ? '' : ' · Đã lưu trữ'}</option>)}
                            </select>
                        </div>

                        {/* DATE FILTER */}
                        <div>
                            <label className={labelCls}>
                                {t('myAppointments.filter.date', 'Ngày hẹn')}
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={inputCls}
                            />
                        </div>

                        {/* STATUS */}

                        <div>
                            <label className={labelCls}>
                                {t(
                                    'myAppointments.filter.status'
                                )}
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
                                <option value="">
                                    {t(
                                        'myAppointments.filter.statusAll'
                                    )}
                                </option>

                                {STATUSES.filter(
                                    Boolean
                                ).map(
                                    (
                                        item
                                    ) => (
                                        <option
                                            key={
                                                item
                                            }
                                            value={
                                                item
                                            }
                                        >
                                            {t(
                                                `myAppointments.status.${item}`
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {/* FILTER BUTTON */}

                        <div className="flex items-end">

                            <button
                                type="button"
                                onClick={
                                    handleFilter
                                }
                                className="cares-customer-filter-button"
                            >
                                <Filter
                                    size={
                                        16
                                    }
                                />

                                {t(
                                    'myAppointments.filter.filterBtn'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* =================================================
                    APPOINTMENT TABLE
                ================================================= */}

                <div className="cares-customer-list-card overflow-hidden rounded-2xl border border-gray-200 bg-white">

                    {/* TABLE HEADER */}

                    <div className="hidden grid-cols-[1fr_1fr_1.4fr_1fr_220px] border-b border-gray-100 px-5 py-4 text-xs font-semibold text-gray-500 md:grid">

                        <div>Người được khám</div>

                        <div>
                            {t(
                                'myAppointments.table.dateTime'
                            )}
                        </div>

                        <div>
                            Dịch vụ đã đặt
                        </div>

                        <div>
                            {t(
                                'myAppointments.table.status'
                            )}
                        </div>

                        <div>
                            {t(
                                'myAppointments.table.actions'
                            )}
                        </div>
                    </div>

                    {/* LOADING */}

                    {loading && (
                        <div className="py-16 text-center">

                            <p className="text-sm text-gray-400">
                                {t(
                                    'myAppointments.loading'
                                )}
                            </p>
                        </div>
                    )}

                    {/* ERROR */}

                    {!loading &&
                        error && (
                            <div className="py-16 text-center">

                                <p className="text-sm text-red-500">
                                    {error}
                                </p>
                            </div>
                        )}

                    {/* EMPTY */}

                    {!loading &&
                        !error &&
                        appointments.length ===
                        0 && (
                            <div className="py-16 text-center">

                                <CalendarDays
                                    size={
                                        30
                                    }
                                    className="mx-auto mb-3 text-gray-200"
                                />

                                <p className="text-sm text-gray-400">
                                    {t(
                                        'myAppointments.noData'
                                    )}
                                </p>
                            </div>
                        )}

                    {/* =================================================
                        ROWS
                    ================================================= */}

                    {!loading &&
                        !error &&
                        appointments.map(
                            (
                                appointment
                            ) => {
                                const normalizedStatus =
                                    normalizeStatus(
                                        appointment.status
                                    );

                                const statusConfig =
                                    STATUS_CFG[
                                        normalizedStatus
                                        ] ||
                                    STATUS_CFG.upcoming;

                                let isPast =
                                    false;

                                if (
                                    appointment.date
                                ) {
                                    const [
                                        day,
                                        month,
                                        year,
                                    ] =
                                        appointment.date.split(
                                            '/'
                                        );

                                    const appointmentDate =
                                        new Date(
                                            `${year}-${month}-${day}T00:00:00`
                                        );

                                    const today =
                                        new Date();

                                    today.setHours(
                                        0,
                                        0,
                                        0,
                                        0
                                    );

                                    isPast =
                                        appointmentDate <
                                        today;
                                }

                                const isActive =
                                    (normalizedStatus === 'scheduled' || normalizedStatus === 'pending' || normalizedStatus === 'rescheduled') &&
                                    !isPast;

                                const isDone =
                                    normalizedStatus ===
                                    'completed';

                                return (
                                    <div
                                        key={
                                            appointment.id
                                        }
                                        className={`cares-appointment-row grid grid-cols-1 gap-4 border-b border-gray-100 px-5 py-5 transition hover:bg-gray-50 md:grid-cols-[1fr_1fr_1.4fr_1fr_220px] md:items-center ${
                                            isDone
                                                ? 'text-gray-400'
                                                : ''
                                        }`}
                                    >

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-gray-900">{appointment.patientName || 'Bệnh nhân'}</p>
                                            <p className="mt-1 text-xs text-gray-400">{appointment.isSelf ? 'Tôi' : appointment.relationship || appointment.patientCode || 'Thành viên'}</p>
                                        </div>

                                        {/* DATE */}

                                        <div className="flex gap-3">

                                            <CalendarDays
                                                size={
                                                    19
                                                }
                                                className={`mt-0.5 shrink-0 ${
                                                    isDone
                                                        ? 'text-gray-300'
                                                        : 'text-gray-600'
                                                }`}
                                            />

                                            <div>
                                                <p
                                                    className={`text-sm font-semibold ${
                                                        isDone
                                                            ? 'text-gray-400'
                                                            : 'text-gray-900'
                                                    }`}
                                                >
                                                    {
                                                        appointment.date
                                                    }
                                                </p>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    {
                                                        appointment.timeWindow
                                                    }
                                                </p>

                                                <p className="mt-0.5 text-xs text-gray-400">
                                                    (
                                                    {
                                                        appointment.shift
                                                    }
                                                    )
                                                </p>
                                            </div>
                                        </div>

                                        {/* SERVICES */}

                                        <div>
                                            <p
                                                className={`text-sm font-medium ${
                                                    isDone
                                                        ? 'text-gray-400'
                                                        : 'text-gray-800'
                                                }`}
                                            >
                                                {appointment.serviceSummary || appointment.serviceName || 'Chưa chọn dịch vụ'}
                                            </p>
                                        </div>

                                        {/* STATUS */}

                                        <div>
                                            <span
                                                className={
                                                    statusConfig.cls
                                                }
                                            >
                                                {
                                                    statusConfig.label
                                                }
                                            </span>
                                        </div>

                                        {/* ACTION */}

                                        <div className="flex flex-col items-start gap-2">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/my-appointments/${appointment.id}`
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-black"
                                            >
                                                {t(
                                                    'myAppointments.viewBtn'
                                                )}

                                                <ChevronRight
                                                    size={
                                                        15
                                                    }
                                                />
                                            </button>

                                            {isActive && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCancelApptId(
                                                            appointment.id
                                                        )
                                                    }
                                                    className="text-sm font-medium text-red-500 transition hover:text-red-700"
                                                >
                                                    {t(
                                                        'myAppointments.cancelBtn'
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        )}

                    {/* =================================================
                        FOOTER / PAGINATION
                    ================================================= */}

                    {!loading &&
                        !error &&
                        total > 0 && (
                            <div className="flex flex-col items-center justify-between gap-4 px-5 py-4 sm:flex-row">

                                <p className="text-sm text-gray-500">
                                    Hiển thị{' '}
                                    <strong className="font-medium text-gray-700">
                                        {resultStart}
                                        {' - '}
                                        {resultEnd}
                                    </strong>{' '}
                                    của{' '}
                                    <strong className="font-medium text-gray-700">
                                        {total}
                                    </strong>{' '}
                                    lịch hẹn
                                </p>

                                <div className="flex items-center gap-5">

                                    <Pagination
                                        page={
                                            page
                                        }
                                        total={
                                            total
                                        }
                                        pageSize={
                                            PAGE_SIZE
                                        }
                                        onChange={
                                            handlePage
                                        }
                                    />

                                    <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-600">
                                        {PAGE_SIZE} / trang
                                    </div>
                                </div>
                            </div>
                        )}
                </div>
            </div>

            {/* =================================================
                CANCEL MODAL
            ================================================= */}

            <CancelConfirmModal
                isOpen={
                    !!cancelApptId
                }
                isLoading={
                    isCancelling
                }
                onClose={() =>
                    setCancelApptId(
                        null
                    )
                }
                onConfirm={async () => {
                    setIsCancelling(
                        true
                    );

                    try {
                        await cancelAppointment(
                            cancelApptId
                        );

                        setCancelApptId(
                            null
                        );
                    } catch (error) {
                        toast.error(
                            error.message
                        );
                    } finally {
                        setIsCancelling(
                            false
                        );
                    }
                }}
            />
        </PatientLayout>
    );
}

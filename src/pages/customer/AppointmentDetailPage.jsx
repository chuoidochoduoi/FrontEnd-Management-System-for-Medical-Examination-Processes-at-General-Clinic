// src/pages/patient/AppointmentDetailPage.jsx

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    FileText,
    Info,
    Printer,
    UserRound,
} from 'lucide-react';

import PatientLayout from '@/components/layout/CustomerLayout';
import { useAppointmentDetail } from '@/hooks/useAppointmentsCustomer';
import { ROUTES } from '@/constants/routes';
import CancelConfirmModal from '@/components/ui/CancelConfirmModal';

/* =========================================================
   HELPERS
========================================================= */

const fmtVND = (value) =>
    value != null
        ? `${new Intl.NumberFormat('vi-VN').format(
            Number(value)
        )} đ`
        : '—';

const normalizeStatus = (status) =>
    String(status || '')
        .toLowerCase()
        .trim();

const getWeekday = (dateString) => {
    if (!dateString) {
        return '';
    }

    const parts =
        dateString.split('/');

    if (parts.length !== 3) {
        return '';
    }

    const [day, month, year] =
        parts;

    const date = new Date(
        `${year}-${month}-${day}T00:00:00`
    );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '';
    }

    return date.toLocaleDateString(
        'vi-VN',
        {
            weekday: 'long',
        }
    );
};

const statusClass = (status) => {
    switch (normalizeStatus(status)) {
        case 'scheduled':
        case 'pending':
        case 'rescheduled':
            return 'border-gray-300 bg-gray-50 text-gray-700';

        case 'completed':
            return 'border-gray-200 bg-gray-100 text-gray-600';

        case 'cancelled':
            return 'border-red-200 bg-white text-red-500';

        case 'checked_in':
            return 'border-gray-300 bg-gray-50 text-gray-700';

        default:
            return 'border-gray-200 bg-gray-50 text-gray-600';
    }
};

/* =========================================================
   MAIN
========================================================= */

export default function AppointmentDetailPage() {
    const { id } =
        useParams();

    const navigate =
        useNavigate();

    const { t } =
        useTranslation(
            'appointments'
        );

    const {
        detail,
        loading,
        cancelling,
        error,
        fetchDetail,
        cancel,
    } = useAppointmentDetail(
        id
    );

    const [
        showCancelModal,
        setShowCancelModal,
    ] = useState(false);

    /* =====================================================
       LOAD
    ===================================================== */

    useEffect(() => {
        fetchDetail();
    }, [id]);

    /* =====================================================
       DATA
    ===================================================== */

    const services =
        detail?.services ?? [];

    const total =
        useMemo(
            () =>
                services.reduce(
                    (
                        sum,
                        service
                    ) =>
                        sum +
                        Number(
                            service.cost ||
                            0
                        ),
                    0
                ),
            [services]
        );

    const normStatus =
        normalizeStatus(
            detail?.status
        );

    let isPast = false;

    if (detail?.date) {
        const [
            day,
            month,
            year,
        ] =
            detail.date.split(
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

        if (appointmentDate < today) {
            isPast = true;
        }
    }

    const isActive =
        (normStatus === 'scheduled' || normStatus === 'pending' || normStatus === 'rescheduled') &&
        !isPast;

    const weekday =
        getWeekday(
            detail?.date
        );

    /* =====================================================
       RESCHEDULE
    ===================================================== */

    const handleReschedule =
        () => {
            const parsedDate =
                detail?.date
                    ? detail.date
                        .split('/')
                        .reverse()
                        .join('-')
                    : '';

            const parsedTimeSlot =
                detail?.timeSlot?.includes(
                    'Sáng'
                )
                    ? 'morning'
                    : 'afternoon';

            navigate(
                ROUTES.CUSTOMER_APPOINTMENT,
                {
                    state: {
                        rescheduleApptId:
                        detail?.id,

                        initialServices:
                            services.map(
                                (
                                    service
                                ) => ({
                                    id:
                                    service.id,
                                    name:
                                    service.name,
                                    price:
                                    service.cost,
                                })
                            ),

                        initialDate:
                        parsedDate,

                        initialTimeSlot:
                        parsedTimeSlot,
                    },
                }
            );
        };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <PatientLayout>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <p className="text-sm text-gray-400">
                        {t(
                            'myAppointments.loading'
                        )}
                    </p>
                </div>
            </PatientLayout>
        );
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <PatientLayout>
            <div className="cares-appointment-detail-page w-full space-y-5">

                {/* =================================================
                    BREADCRUMB
                ================================================= */}

                <div className="flex flex-wrap items-center justify-between gap-4">

                    <div className="flex items-center gap-2 text-sm">

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    ROUTES.MY_APPOINTMENTS
                                )
                            }
                            className="font-medium text-gray-500 transition hover:text-gray-900"
                        >
                            {t(
                                'appointmentDetail.breadcrumb'
                            )}
                        </button>

                        <span className="text-gray-300">
                            /
                        </span>

                        <span className="font-semibold text-gray-900">
                            {t(
                                'appointmentDetail.pageTitle'
                            )}
                        </span>
                    </div>
                </div>

                {/* =================================================
                    BACK + ACTIONS
                ================================================= */}

                <div className="flex flex-wrap items-center justify-between gap-4">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                ROUTES.MY_APPOINTMENTS
                            )
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-gray-900"
                    >
                        <ArrowLeft
                            size={14}
                        />

                        Quay lại
                    </button>

                    {isActive && (
                        <div className="flex items-center gap-2">

                            <button
                                type="button"
                                disabled={
                                    cancelling
                                }
                                onClick={() =>
                                    setShowCancelModal(
                                        true
                                    )
                                }
                                className="h-10 rounded-xl border border-red-400 bg-white px-5 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {t(
                                    'appointmentDetail.cancelBtn'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleReschedule
                                }
                                className="cares-customer-primary-button"
                            >
                                {t(
                                    'appointmentDetail.rescheduleBtn'
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* =================================================
                    MAIN CARD
                ================================================= */}

                <div id="appointment-print-area" className="cares-appointment-detail-card overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="hidden border-b-2 border-gray-900 px-6 py-5 text-center print:block">
                        <p className="text-lg font-bold uppercase">CareS - Phòng khám đa khoa</p>
                        <h1 className="mt-2 text-2xl font-bold uppercase">Phiếu hẹn khám</h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr]">

                        {/* =================================================
                            COLUMN 1 - APPOINTMENT INFO
                        ================================================= */}

                        <section className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r">

                            <div className="mb-5 flex items-center gap-2">

                                <CalendarDays
                                    size={18}
                                    className="text-gray-500"
                                />

                                <h2 className="text-sm font-semibold text-gray-900">
                                    Thông tin lịch hẹn
                                </h2>
                            </div>

                            <div className="space-y-4">

                                <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-5">
                                    <div className="flex items-start gap-3">
                                        <UserRound size={18} className="mt-0.5 shrink-0 text-primary-600" />
                                        <div>
                                            <p className="text-xs text-slate-500">Người được khám</p>
                                            <p className="mt-1 text-base font-bold text-slate-900">{detail?.patientName || 'Chính chủ'}</p>
                                            {detail?.relationship && <p className="mt-1 text-xs text-slate-500">{detail.relationship}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* DATE */}

                                <div className="rounded-xl border border-gray-200 bg-white p-5">

                                    <div className="flex items-start gap-3">

                                        <CalendarDays
                                            size={18}
                                            className="mt-0.5 shrink-0 text-gray-400"
                                        />

                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Ngày khám
                                            </p>

                                            <p className="mt-1 text-lg font-bold text-gray-900">
                                                {detail?.date ||
                                                    '—'}
                                            </p>

                                            {weekday && (
                                                <p className="mt-1 text-sm capitalize text-gray-500">
                                                    {weekday}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* TIME */}

                                <div className="rounded-xl border border-gray-200 bg-white p-5">

                                    <div className="flex items-start gap-3">

                                        <Clock3
                                            size={18}
                                            className="mt-0.5 shrink-0 text-gray-400"
                                        />

                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Khung giờ
                                            </p>

                                            <p className="mt-2 text-sm font-semibold text-gray-900">
                                                {detail?.timeSlot ||
                                                    '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* STATUS */}

                                <div className="rounded-xl border border-gray-200 bg-white p-5">

                                    <p className="text-xs text-gray-400">
                                        Trạng thái
                                    </p>

                                    <div className="mt-2">

                                        <span
                                            className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium ${statusClass(
                                                detail?.status
                                            )}`}
                                        >
                                            {normStatus
                                                ? t(
                                                    `myAppointments.status.${normStatus}`,
                                                    {
                                                        defaultValue:
                                                        detail?.status,
                                                    }
                                                )
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* =================================================
                            COLUMN 2 - SERVICES
                        ================================================= */}

                        <section className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r">

                            <div className="mb-5 flex items-center justify-between gap-4">

                                <div className="flex items-center gap-2">

                                    <FileText
                                        size={18}
                                        className="text-gray-500"
                                    />

                                    <h2 className="text-sm font-semibold text-gray-900">
                                        Dịch vụ đã đặt
                                    </h2>
                                </div>

                                <span className="text-xs text-gray-400">
                                    {services.length}{' '}
                                    dịch vụ
                                </span>
                            </div>

                            {services.length >
                            0 ? (
                                <div className="overflow-hidden rounded-xl border border-gray-200">

                                    {/* HEADER */}

                                    <div className="grid grid-cols-[minmax(0,1fr)_130px] border-b border-gray-100 bg-gray-50 px-4 py-3">

                                        <span className="text-xs font-medium text-gray-400">
                                            Dịch vụ
                                        </span>

                                        <span className="text-right text-xs font-medium text-gray-400">
                                            Chi phí
                                        </span>
                                    </div>

                                    {/* SERVICES */}

                                    <div
                                        className="max-h-[408px] divide-y divide-gray-100 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
                                        tabIndex={services.length > 6 ? 0 : undefined}
                                        aria-label="Danh sách dịch vụ đã đặt"
                                    >

                                        {services.map(
                                            (
                                                service,
                                                index
                                            ) => (
                                                <div
                                                    key={
                                                        service.id ||
                                                        index
                                                    }
                                                    className="grid grid-cols-[minmax(0,1fr)_130px] items-center px-4 py-4"
                                                >

                                                    <p className="truncate pr-4 text-sm font-semibold text-gray-900">
                                                        {service.name ||
                                                            '—'}
                                                    </p>

                                                    <p className="text-right text-sm text-gray-700 tabular-nums">
                                                        {fmtVND(
                                                            service.cost
                                                        )}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* TOTAL */}

                                    <div className="grid grid-cols-[minmax(0,1fr)_130px] border-t border-gray-100 bg-gray-50 px-4 py-4">

                                        <p className="text-sm font-semibold text-gray-600">
                                            Tổng
                                        </p>

                                        <p className="text-right text-sm font-bold text-gray-900 tabular-nums">
                                            {fmtVND(
                                                total
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">

                                    <p className="text-sm text-gray-400">
                                        Không có dịch vụ.
                                    </p>
                                </div>
                            )}
                        </section>

                        {detail?.status === 'cancelled' && detail?.reason?.trim() && (
                            <section className="border-t border-gray-100 p-6 lg:col-span-2">
                                <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-800/70 dark:bg-red-950/30">
                                    <div className="flex items-start gap-3">
                                        <Info
                                            size={20}
                                            className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                                        />
                                        <div>
                                            <h2 className="font-semibold text-red-900 dark:text-red-200">
                                                Lý do hủy lịch
                                            </h2>
                                            <p className="mt-2 whitespace-pre-wrap text-red-700 dark:text-red-300">
                                                {detail.reason}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* =================================================
                        FOOTER
                    ================================================= */}

                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 px-6 py-4">

                        <p className="text-xs text-gray-400">
                            {t(
                                'appointmentDetail.footer'
                            )}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                window.print()
                            }
                            className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 transition hover:text-gray-900"
                        >
                            {t(
                                'appointmentDetail.printBtn'
                            )}

                            <Printer
                                size={15}
                            />
                        </button>
                    </div>
                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                        <p className="text-sm text-red-500">
                            {error}
                        </p>
                    </div>
                )}
            </div>

            {/* =================================================
                CANCEL MODAL
            ================================================= */}

            <CancelConfirmModal
                isOpen={
                    showCancelModal
                }
                isLoading={
                    cancelling
                }
                onClose={() =>
                    setShowCancelModal(
                        false
                    )
                }
                onConfirm={async () => {
                    await cancel();

                    setShowCancelModal(
                        false
                    );
                }}
            />
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 12mm; }
                    body * { visibility: hidden !important; }
                    #appointment-print-area, #appointment-print-area * { visibility: visible !important; }
                    #appointment-print-area { position: absolute; inset: 0; width: 100%; margin: 0; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
                    #appointment-print-area button { display: none !important; }
                }
            `}</style>
        </PatientLayout>
    );
}

// src/pages/doctor/DoctorDepartmentPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, MonitorUp, UserCircle } from 'lucide-react';

import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';

import { useInProgressPatient } from '@/hooks/useInProgressPatient';
import { useQueueWaiting } from '@/hooks/useQueueWaiting';
import { useQueueActions } from '@/hooks/useQueueActions';
import { useAllDepartments } from '@/hooks/useAllDepartments';
import { useWebSocket } from '@/hooks/useWebSocket';

import { ROUTES } from '@/constants/routes';
import { openAuthenticatedTab } from '@/utils/openAuthenticatedTab';

const STATUS_MAP = {
    WAITING: 'waiting',
    CALLED: 'called',
    IN_PROGRESS: 'inProgress',
    DONE: 'done',
    SKIPPED: 'skipped',
    WAITING_FOR_TEST: 'waitingForTest',
    TEST_DONE: 'testDone',
};

const STATUS_STYLES = {
    waiting: 'bg-amber-50 text-amber-700',
    called: 'bg-blue-50 text-blue-700',
    inProgress: 'bg-emerald-50 text-emerald-700',
    done: 'bg-gray-100 text-gray-600',
    skipped: 'bg-red-50 text-red-600',
    waitingForTest: 'bg-purple-50 text-purple-700',
    testDone: 'bg-green-50 text-green-700',
};

const PRIORITY_STYLES = {
    RETURNING_FROM_TEST: 'border-violet-200 bg-violet-50 text-violet-700',
    RETURNED_AFTER_ABSENCE: 'border-orange-300 bg-orange-50 text-orange-800',
    APPOINTMENT_ON_TIME: 'border-teal-200 bg-teal-50 text-teal-700',
    APPOINTMENT_LATE: 'border-orange-200 bg-orange-50 text-orange-700',
    REGULAR: 'border-slate-200 bg-slate-50 text-slate-600',
};

const get = (key) =>
    localStorage.getItem(key) ||
    sessionStorage.getItem(key);

export default function DoctorDepartmentPage() {
    const { departmentId } = useParams();

    const { t } = useTranslation(['doctor', 'queue']);

    const navigate = useNavigate();

    const [queueFilters, setQueueFilters] = useState({
        search: '',
        status: 'ALL',
        sort: 'PRIORITY',
        showAll: false,
        workDate: new Date().toISOString().slice(0, 10),
    });

    const username = get('username') || 'Bác sĩ';

    /* =========================================================
       DEPARTMENT
    ========================================================= */

    const { examinationRooms } = useAllDepartments();

    const selectedDept = examinationRooms.find(
        (d) => d.departmentId === departmentId
    );

    /* =========================================================
       CURRENT PATIENT
    ========================================================= */

    const {
        ticket: inProgressTicket,
        loading: ticketLoading,
        error: ticketError,
        reload: reloadInProgress,
    } = useInProgressPatient(departmentId);
    const [sameRoomChain, setSameRoomChain] = useState(null);

    useEffect(() => {
        if (!inProgressTicket?.ticketId) {
            setSameRoomChain(null);
            return undefined;
        }
        const controller = new AbortController();
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        fetch(`${apiBase}/api/v1/queue-tickets/${inProgressTicket.ticketId}/same-room-chain`, {
            headers: { Authorization: `Bearer ${get('token')}` },
            signal: controller.signal,
        })
            .then(async response => {
                if (!response.ok) throw new Error('Không thể tải chuỗi dịch vụ');
                return response.json();
            })
            .then(body => setSameRoomChain(body?.data ?? body?.result ?? body ?? null))
            .catch(fetchError => {
                if (fetchError.name !== 'AbortError') setSameRoomChain(null);
            });
        return () => controller.abort();
    }, [inProgressTicket?.ticketId]);

    /* =========================================================
       WAITING QUEUE
    ========================================================= */

    const {
        tickets: waitingTickets,
        waitingCount,
        loading: waitingLoading,
        error: waitingError,
        reload: reloadWaiting,
    } = useQueueWaiting(
        departmentId,
        queueFilters
    );

    useWebSocket(
        departmentId ? `/topic/department-${departmentId}-queue` : null,
        null,
        () => {
            reloadInProgress();
            reloadWaiting();
        }
    );

    /* =========================================================
       QUEUE ACTIONS
    ========================================================= */

    const {
        completeExam,
        callPatient,
        recallPatient,
        startExam,
        markAbsent,
        returnToQueue,
    } = useQueueActions();

    /* =========================================================
       HANDLERS
    ========================================================= */

    const handleStartExamination = () => {
        if (departmentId) {
            navigate(
                ROUTES.DOCTOR_EXAMINATION.replace(
                    ':departmentId',
                    departmentId
                )
            );
        }
    };

    const handleCompleteExam = async () => {
        if (inProgressTicket?.ticketId) {
            const result = await completeExam(
                inProgressTicket.ticketId
            );

            if (result.success) {
                reloadInProgress();
                reloadWaiting();
            }
        }
    };

    const handleQueueAction = async (
        actionFn,
        patientId
    ) => {
        const result = await actionFn(patientId);

        if (result && result.success) {
            reloadInProgress();
            reloadWaiting();
        }

        return result;
    };

    const handleViewSummary = async (ticket) => {
        if (!ticket.recordId) return;

        const apiBase =
            import.meta.env.VITE_API_URL ||
            'http://localhost:8080';

        const res = await fetch(
            `${apiBase}/api/v1/medical-records/${ticket.recordId}`,
            {
                headers: {
                    Authorization: `Bearer ${get(
                        'token'
                    )}`,
                },
            }
        );

        if (!res.ok) return;

        const body = await res.json();

        const record =
            body.data ??
            body.result ??
            body;

        const completionData = {
            record,

            patient: {
                fullName: ticket.patientName,
                phone: ticket.patientPhone,
                dateOfBirth: ticket.patientDob,
                gender: ticket.patientGender,
                address:
                    ticket.patientAddress || '',
            },

            serviceName:
            ticket.serviceName,

            departmentName:
            ticket.departmentName,

            completedAt:
                record.completedAt ??
                ticket.completedAt,

            waitingForTests: false,
        };

        sessionStorage.setItem(
            `exam-completion:${ticket.recordId}`,
            JSON.stringify(completionData)
        );

        sessionStorage.setItem(
            `prescription-preview:${ticket.recordId}`,
            JSON.stringify(completionData)
        );

        navigate(
            ROUTES.DOCTOR_EXAM_COMPLETED.replace(
                ':recordId',
                ticket.recordId
            ),
            {
                state: completionData,
            }
        );
    };

    const isDamaged = false;

    /* =========================================================
       UI
    ========================================================= */

    return (
        <MedicalStaffLayout>

            {/* =====================================================
                MAIN CONTENT
            ===================================================== */}

            <div className="cares-doctor-queue flex-1 bg-slate-50">

                {/* QUAN TRỌNG:
                    Không max-width.
                    Không mx-auto.
                    Không margin-left.
                    Nội dung chiếm full width còn lại sau sidebar.
                */}
                <div className="w-full">

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="cares-ops-header mb-4">

                        <div>

                        <span className="cares-ops-eyebrow">Phòng khám đang phụ trách</span>

                        <h1 className="text-2xl font-bold text-slate-900">
                            Hàng chờ khám bệnh
                        </h1>

                        <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">

                            <span className="font-semibold text-primary-600">
                                {selectedDept?.roomCode ||
                                    '—'}
                            </span>

                            <span>·</span>

                            <span>
                                {selectedDept?.name ||
                                    'Không xác định'}
                            </span>

                        </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => openAuthenticatedTab(ROUTES.ROOM_QUEUE_DISPLAY.replace(':departmentId', departmentId))} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700">
                                <MonitorUp size={18}/> Mở màn hình phòng
                            </button>
                            <span className="cares-ops-badge is-active">{waitingCount} bệnh nhân đang chờ</span>
                        </div>

                    </div>

                    {/* =================================================
                        CURRENT PATIENT
                    ================================================= */}

                    <section className="cares-doctor-current mb-4 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        {/* TITLE */}

                        <div className="border-b border-slate-100 px-5 py-3">

                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-600">
                                Bệnh nhân hiện tại
                            </h2>

                        </div>

                        {/* LOADING */}

                        {ticketLoading ? (

                            <div className="flex min-h-[72px] items-center justify-center px-5 py-4">

                                <p className="text-sm text-slate-400">
                                    Đang tải thông tin bệnh nhân...
                                </p>

                            </div>

                        ) : ticketError ? (

                            /* ERROR */

                            <div className="flex min-h-[72px] items-center justify-center px-5 py-4">

                                <p className="text-sm text-red-500">
                                    Lỗi tải thông tin bệnh nhân
                                </p>

                            </div>

                        ) : inProgressTicket ? (

                            /* CURRENT PATIENT */

                            <div className="flex items-center gap-5 px-5 py-4">

                                {/* QUEUE NUMBER */}

                                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50">

                                    <UserCircle className="h-7 w-7 text-primary-600" />

                                    <span className="mt-1 text-xl font-bold text-primary-700">
                                        {String(
                                            sameRoomChain?.displayQueueNumber ?? inProgressTicket.queueNumber ??
                                            '—'
                                        ).padStart(
                                            3,
                                            '0'
                                        )}
                                    </span>

                                </div>

                                {/* PATIENT INFO */}

                                <div className="min-w-0 flex-1">

                                    <h3 className="truncate text-xl font-bold text-slate-900">
                                        {inProgressTicket.patientName ??
                                            '—'}
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {inProgressTicket.serviceName ??
                                            '—'}
                                    </p>

                                    {sameRoomChain?.totalServices > 1 && (
                                        <p className="mt-1 text-sm font-semibold text-teal-700">
                                            Dịch vụ {sameRoomChain.currentPosition}/{sameRoomChain.totalServices} tại phòng này
                                        </p>
                                    )}

                                    <div className="mt-2 flex flex-wrap items-center gap-2">

                                        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                            Đang khám
                                        </span>

                                        {inProgressTicket.patientCode && (

                                            <span className="text-xs text-slate-400">
                                                Mã BN:{' '}
                                                {
                                                    inProgressTicket.patientCode
                                                }
                                            </span>

                                        )}

                                    </div>

                                </div>

                                {/* ACTION */}

                                <div className="flex shrink-0 flex-col items-end gap-1.5">

                                    <button
                                        onClick={
                                            handleStartExamination
                                        }
                                        className="h-10 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white transition hover:bg-primary-600"
                                    >
                                        Tiếp tục khám
                                    </button>

                                    {inProgressTicket.recordId ==
                                        null && (

                                            <span className="text-xs text-orange-600">
                                            Chưa có bệnh án
                                        </span>

                                        )}

                                </div>

                            </div>

                        ) : (

                            /* EMPTY CURRENT PATIENT */

                            <div className="flex min-h-[72px] items-center justify-center px-5 py-4">

                                <p className="text-sm text-slate-400">
                                    Chưa có bệnh nhân đang được phục vụ
                                </p>

                            </div>

                        )}

                    </section>

                    {/* =================================================
                        FILTER
                    ================================================= */}

                    <section className="cares-doctor-filter mb-4 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">

                            {/* SEARCH */}

                            <div>

                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Tìm bệnh nhân
                                </label>

                                <input
                                    value={
                                        queueFilters.search
                                    }
                                    onChange={(e) =>
                                        setQueueFilters(
                                            (v) => ({
                                                ...v,
                                                search:
                                                e
                                                    .target
                                                    .value,
                                            })
                                        )
                                    }
                                    placeholder="Tên, mã, SĐT, dịch vụ..."
                                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                />

                            </div>

                            {/* DATE */}

                            <div>

                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Ngày
                                </label>

                                <input
                                    type="date"
                                    value={
                                        queueFilters.workDate
                                    }
                                    onChange={(e) =>
                                        setQueueFilters(
                                            (v) => ({
                                                ...v,
                                                workDate:
                                                e
                                                    .target
                                                    .value,
                                            })
                                        )
                                    }
                                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none"
                                />

                            </div>

                            {/* STATUS */}

                            <div>

                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Trạng thái
                                </label>

                                <select
                                    value={
                                        queueFilters.status
                                    }
                                    onChange={(e) =>
                                        setQueueFilters(
                                            (v) => ({
                                                ...v,
                                                status:
                                                e
                                                    .target
                                                    .value,
                                            })
                                        )
                                    }
                                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none"
                                >

                                    <option value="ALL">
                                        Tất cả trạng thái
                                    </option>

                                    <option value="WAITING">
                                        Chờ gọi
                                    </option>

                                    <option value="CALLED">
                                        Đã gọi
                                    </option>

                                    <option value="IN_PROGRESS">
                                        Đang khám
                                    </option>

                                    <option value="WAITING_FOR_TEST">
                                        Chờ kết quả
                                    </option>

                                    <option value="TEST_DONE">
                                        Đã có kết quả
                                    </option>

                                    <option value="DONE">
                                        Hoàn thành
                                    </option>

                                    <option value="SKIPPED">
                                        Vắng
                                    </option>

                                </select>

                            </div>

                            {/* SORT */}

                            <div>

                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Sắp xếp
                                </label>

                                <select
                                    value={
                                        queueFilters.sort
                                    }
                                    onChange={(e) =>
                                        setQueueFilters(
                                            (v) => ({
                                                ...v,
                                                sort:
                                                e
                                                    .target
                                                    .value,
                                            })
                                        )
                                    }
                                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none"
                                >

                                    <option value="PRIORITY">
                                        Ưu tiên phục vụ
                                    </option>

                                    <option value="QUEUE_ASC">
                                        Theo số thứ tự
                                    </option>

                                    <option value="QUEUE_DESC">
                                        STT giảm
                                    </option>

                                    <option value="NAME_ASC">
                                        Tên A-Z
                                    </option>

                                </select>

                            </div>

                            {/* SCOPE */}

                            <div className="xl:min-w-[168px]">

                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Phạm vi
                                </label>

                                <select
                                    value={queueFilters.showAll ? 'ALL' : 'ACTIVE'}
                                    onChange={(event) =>
                                        setQueueFilters((value) => ({
                                            ...value,
                                            showAll: event.target.value === 'ALL',
                                        }))
                                    }
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                >
                                    <option value="ACTIVE">Đang hoạt động</option>
                                    <option value="ALL">Tất cả trong ngày</option>
                                </select>

                            </div>

                        </div>

                        {/* FILTER BOTTOM */}

                        <div className="mt-3 flex items-center justify-end">

                            <span className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">

                                {waitingCount}{' '}
                                bệnh nhân

                            </span>

                        </div>

                    </section>

                    {/* =================================================
                        WAITING QUEUE
                    ================================================= */}

                    <section className="cares-doctor-queue-card w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        {/* TABLE TITLE */}

                        <div className="border-b border-slate-100 px-5 py-3">

                            <h2 className="text-base font-semibold text-slate-900">
                                Danh sách chờ
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-400">
                                Bệnh nhân đang chờ được gọi vào phòng khám
                            </p>

                        </div>

                        {/* LOADING */}

                        {waitingLoading ? (

                            <div className="px-5 py-8 text-center text-sm text-slate-400">
                                Đang tải danh sách...
                            </div>

                        ) : waitingError ? (

                            /* ERROR */

                            <div className="px-5 py-8 text-center text-sm text-red-500">
                                Lỗi tải danh sách
                            </div>

                        ) : waitingTickets.length ===
                        0 ? (

                            /* EMPTY */

                            <div className="px-5 py-8 text-center">

                                <UserCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />

                                <p className="text-sm font-medium text-slate-500">
                                    Không có bệnh nhân chờ
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Danh sách sẽ cập nhật khi có bệnh nhân mới
                                </p>

                            </div>

                        ) : (

                            /* TABLE */

                            <div className="w-full overflow-x-auto">

                                <table className="w-full text-sm">

                                    <thead>

                                    <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">

                                        <th className="w-[8%] px-5 py-3 text-left font-medium">
                                            STT
                                        </th>

                                        <th className="w-[25%] px-5 py-3 text-left font-medium">
                                            Bệnh nhân
                                        </th>

                                        <th className="w-[22%] px-5 py-3 text-left font-medium">
                                            Dịch vụ
                                        </th>

                                        <th className="w-[18%] px-5 py-3 text-left font-medium">
                                            Trạng thái
                                        </th>

                                        <th className="w-[27%] px-5 py-3 text-right font-medium">
                                            Thao tác
                                        </th>

                                    </tr>

                                    </thead>

                                    <tbody className="divide-y divide-slate-100">

                                    {waitingTickets.map(
                                        (ticket) => {

                                            const statusKey =
                                                STATUS_MAP[
                                                    ticket
                                                        .status
                                                    ] ??
                                                'called';

                                            return (

                                                <tr
                                                    key={
                                                        ticket.ticketId
                                                    }
                                                    className="transition hover:bg-slate-50/70"
                                                >

                                                    {/* STT */}

                                                    <td className="px-5 py-3.5">

                                                            <span className="text-base font-bold text-slate-800">
                                                                {String(
                                                                    ticket.queueNumber ??
                                                                    '—'
                                                                ).padStart(
                                                                    3,
                                                                    '0'
                                                                )}
                                                            </span>
                                                            {ticket.waitingPosition != null && <p className="mt-1 text-xs font-semibold text-primary-600">
                                                                Vị trí {ticket.waitingPosition}
                                                            </p>}

                                                    </td>

                                                    {/* PATIENT */}

                                                    <td className="px-5 py-3.5">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50">

                                                                <UserCircle className="h-5 w-5 text-primary-500" />

                                                            </div>

                                                            <div className="min-w-0">

                                                                <p className="truncate font-semibold text-slate-800">
                                                                    {ticket.patientName ??
                                                                        '—'}
                                                                </p>

                                                                <p className="mt-0.5 truncate text-xs text-slate-400">
                                                                    {ticket.patientCode ??
                                                                        'Không có mã bệnh nhân'}
                                                                </p>

                                                                {ticket.patientBusy && (
                                                                    <p className="mt-1 text-xs font-semibold text-amber-700">
                                                                        Đang được phục vụ tại {ticket.busyDepartmentName || 'phòng khác'}
                                                                    </p>
                                                                )}

                                                                {ticket.priorityLabel && <span className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[ticket.priorityCategory] || PRIORITY_STYLES.REGULAR}`}>
                                                                    {ticket.priorityLabel}
                                                                </span>}

                                                            </div>

                                                        </div>

                                                    </td>

                                                    {/* SERVICE */}

                                                    <td className="px-5 py-3.5 text-slate-600">

                                                        {ticket.serviceName ??
                                                            '—'}

                                                    </td>

                                                    {/* STATUS */}

                                                    <td className="px-5 py-3.5">

                                                            <span
                                                                className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                                                    STATUS_STYLES[
                                                                        statusKey
                                                                        ]
                                                                }`}
                                                            >

                                                                {t(
                                                                    `queue:status.${statusKey}`
                                                                )}

                                                            </span>

                                                    </td>

                                                    {/* ACTIONS */}

                                                    <td className="px-5 py-3.5">

                                                        <div className="flex flex-wrap justify-end gap-2">

                                                            {/* WAITING / TEST DONE */}

                                                            {(ticket.status ===
                                                                'WAITING' ||
                                                                ticket.status ===
                                                                'TEST_DONE') && (
                                                                <>

                                                                    <button
                                                                        onClick={() =>
                                                                            handleQueueAction(
                                                                                callPatient,
                                                                                ticket.ticketId
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !!inProgressTicket || ticket.canCall === false
                                                                        }
                                                                        className="rounded-lg border border-primary-500 px-3 py-1.5 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        {ticket.patientBusy ? 'Tạm thời chưa thể gọi' : 'Gọi bệnh nhân'}
                                                                    </button>

                                                                    <button
                                                                        onClick={() =>
                                                                            handleQueueAction(
                                                                                markAbsent,
                                                                                ticket.ticketId
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !!inProgressTicket
                                                                        }
                                                                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        Đánh vắng
                                                                    </button>

                                                                </>
                                                            )}

                                                            {/* CALLED */}

                                                            {ticket.status ===
                                                                'CALLED' && (
                                                                    <>

                                                                        <button
                                                                            onClick={() =>
                                                                                handleQueueAction(
                                                                                    recallPatient,
                                                                                    ticket.ticketId
                                                                                )
                                                                            }
                                                                            className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-600 transition hover:bg-primary-50"
                                                                        >
                                                                            Gọi lại
                                                                        </button>

                                                                        <button
                                                                            onClick={() =>
                                                                                handleQueueAction(
                                                                                    markAbsent,
                                                                                    ticket.ticketId
                                                                                )
                                                                            }
                                                                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                                                        >
                                                                            Đánh vắng
                                                                        </button>

                                                                        <button
                                                                            onClick={() =>
                                                                                handleQueueAction(
                                                                                    startExam,
                                                                                    ticket.ticketId
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                !!inProgressTicket || ticket.patientBusy
                                                                            }
                                                                            className="rounded-lg bg-primary-500 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                                        >
                                                                            Bắt đầu khám
                                                                        </button>

                                                                    </>
                                                                )}

                                                            {/* SKIPPED */}

                                                            {ticket.status ===
                                                                'SKIPPED' &&
                                                                ticket.workDate ===
                                                                new Date().toLocaleDateString(
                                                                    'en-CA'
                                                                ) && (

                                                                    <button
                                                                        onClick={() =>
                                                                            handleQueueAction(
                                                                                returnToQueue,
                                                                                ticket.ticketId
                                                                            )
                                                                        }
                                                                        className="rounded-lg border border-primary-300 px-3 py-1.5 text-xs font-semibold text-primary-600 transition hover:bg-primary-50"
                                                                    >
                                                                        Đưa lại hàng chờ
                                                                    </button>

                                                                )}

                                                            {/* DONE */}

                                                            {ticket.status ===
                                                                'DONE' &&
                                                                ticket.recordId && (

                                                                    <button
                                                                        onClick={() =>
                                                                            handleViewSummary(
                                                                                ticket
                                                                            )
                                                                        }
                                                                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                                                    >
                                                                        Xem tổng kết
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

                </div>

            </div>

        </MedicalStaffLayout>
    );
}

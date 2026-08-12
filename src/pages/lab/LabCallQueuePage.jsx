import { useMemo, useState } from 'react';
import {
    ArrowLeft,
    RotateCcw,
    Search,
    UserCircle,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import { useLabQueue } from '@/hooks/useLabQueue';
import { ROUTES } from '@/constants/routes';

const label = {
    WAITING: 'Chờ gọi',
    CALLED: 'Đã gọi',
    IN_PROGRESS: 'Đang thực hiện',
    BLOCKED: 'Chưa đến lượt',
    DONE: 'Đã hoàn thành',
    SKIPPED: 'Vắng mặt',
};

const badge = {
    WAITING: 'bg-amber-50 text-amber-700',
    CALLED: 'bg-blue-50 text-blue-700',
    IN_PROGRESS: 'bg-emerald-50 text-emerald-700',
    BLOCKED: 'bg-slate-100 text-slate-500',
    DONE: 'bg-emerald-50 text-emerald-700',
    SKIPPED: 'bg-red-50 text-red-700',
};

const displayNumber = (number) =>
    String(number ?? 0).padStart(3, '0');

export default function LabCallQueuePage() {
    const { departmentId } = useParams();
    const navigate = useNavigate();

    const {
        orders,
        loading,
        refetch,
    } = useLabQueue(departmentId);

    const [search, setSearch] = useState('');

    /* =========================================================
       GROUP TEST REQUESTS BY QUEUE TICKET
       Giữ nguyên logic:
       nhiều TestRequest cùng QueueTicket -> hiển thị thành 1 bệnh nhân
    ========================================================= */

    const groups = useMemo(() => {
        return Object.values(
            orders.reduce((all, request) => {
                if (!request.queueTicketId) {
                    return all;
                }

                const id = request.queueTicketId;

                if (!all[id]) {
                    all[id] = {
                        ticketId: id,
                        number: request.queueNumber,
                        status: request.queueStatus,
                        patientName: request.patientName,
                        patientCode: request.patientCode,
                        requests: [],
                    };
                }

                all[id].requests.push(request);

                return all;
            }, {})
        )
            .filter((group) =>
                [
                    'WAITING',
                    'CALLED',
                    'IN_PROGRESS',
                    'BLOCKED',
                    'SKIPPED',
                ].includes(group.status)
            )
            .filter((group) =>
                `${group.patientName || ''} ${
                    group.patientCode || ''
                }`
                    .toLowerCase()
                    .includes(
                        search.trim().toLowerCase()
                    )
            );
    }, [orders, search]);

    /* =========================================================
       CURRENT PATIENT
       Chỉ lấy 1 bệnh nhân đang thực hiện trong phòng
    ========================================================= */

    const currentPatient = useMemo(
        () =>
            groups.find(
                (group) =>
                    group.status === 'IN_PROGRESS'
            ) || null,
        [groups]
    );

    /* =========================================================
       WAITING LIST
       Không hiển thị IN_PROGRESS lần nữa trong danh sách dưới
    ========================================================= */

    const waitingGroups = useMemo(
        () =>
            groups.filter(
                (group) =>
                    group.status !== 'IN_PROGRESS'
            ),
        [groups]
    );

    const waitingCount = waitingGroups.filter(
        (group) =>
            group.status === 'WAITING' ||
            group.status === 'CALLED'
    ).length;

    /* =========================================================
       ACTION
       Giữ nguyên API hiện tại
    ========================================================= */

    const action = async (
        ticketId,
        endpoint,
        success
    ) => {
        const token =
            localStorage.getItem('token') ||
            sessionStorage.getItem('token');

        const response = await fetch(
            `${
                import.meta.env.VITE_API_URL
            }/api/v1/queue-tickets/${ticketId}/${endpoint}`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const body = await response
                .json()
                .catch(() => ({}));

            toast.error(
                body.message ||
                'Không thể cập nhật hàng chờ.'
            );

            return;
        }

        toast.success(success);

        refetch();
    };

    return (
        <MedicalStaffLayout>
            <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-5">

                {/* Full width giống màn hàng chờ khám bệnh */}
                <div className="w-full">

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <header className="mb-4 flex flex-wrap items-center justify-between gap-4">

                        <div className="flex items-center gap-3">

                            <button
                                onClick={() =>
                                    navigate(
                                        ROUTES.DOCTOR_LAB.replace(
                                            ':departmentId',
                                            departmentId
                                        )
                                    )
                                }
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                            >
                                <ArrowLeft size={17} />
                            </button>

                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">
                                    Hàng chờ cận lâm sàng
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Gọi bệnh nhân và xác nhận bệnh nhân đã vào phòng
                                </p>
                            </div>

                        </div>

                        {/* Search / Refresh */}

                        <div className="flex items-center gap-2">

                            <div className="relative">

                                <Search
                                    size={15}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Tìm bệnh nhân..."
                                    className="h-10 w-72 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                />

                            </div>

                            <button
                                onClick={refetch}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                                title="Làm mới"
                            >
                                <RotateCcw size={16} />
                            </button>

                        </div>

                    </header>

                    {/* =================================================
                        CURRENT PATIENT
                    ================================================= */}

                    <section className="mb-4 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <div className="border-b border-slate-100 px-5 py-3">

                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-600">
                                Bệnh nhân hiện tại
                            </h2>

                        </div>

                        {loading ? (

                            <div className="flex min-h-[80px] items-center justify-center px-5 py-4">
                                <p className="text-sm text-slate-400">
                                    Đang tải thông tin bệnh nhân...
                                </p>
                            </div>

                        ) : currentPatient ? (

                            <div className="flex items-center gap-5 px-5 py-4">

                                {/* Queue Number */}

                                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50">

                                    <UserCircle className="h-7 w-7 text-primary-600" />

                                    <span className="mt-1 text-xl font-bold text-primary-700">
                                        {displayNumber(
                                            currentPatient.number
                                        )}
                                    </span>

                                </div>

                                {/* Patient */}

                                <div className="min-w-0 flex-1">

                                    <h3 className="truncate text-xl font-bold text-slate-900">
                                        {currentPatient.patientName ||
                                            '—'}
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {currentPatient.requests
                                            .map(
                                                (request) =>
                                                    request.serviceName
                                            )
                                            .filter(Boolean)
                                            .join(', ') || '—'}
                                    </p>

                                    <div className="mt-2 flex flex-wrap items-center gap-2">

                                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                            Đang thực hiện
                                        </span>

                                        {currentPatient.patientCode && (
                                            <span className="text-xs text-slate-400">
                                                Mã BN:{' '}
                                                {
                                                    currentPatient.patientCode
                                                }
                                            </span>
                                        )}

                                    </div>

                                </div>

                                {/* Current action */}

                                <div className="shrink-0">

                                    <button
                                        onClick={() =>
                                            action(
                                                currentPatient.ticketId,
                                                'finish-service',
                                                'Đã hoàn thành thao tác tại phòng.'
                                            )
                                        }
                                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                    >
                                        Hoàn thành tại phòng
                                    </button>

                                </div>

                            </div>

                        ) : (

                            <div className="flex min-h-[80px] items-center justify-center px-5 py-4">

                                <p className="text-sm text-slate-400">
                                    Chưa có bệnh nhân đang được thực hiện
                                </p>

                            </div>

                        )}

                    </section>

                    {/* =================================================
                        QUEUE FILTER / SUMMARY
                    ================================================= */}

                    <section className="mb-4 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                        <div className="flex flex-wrap items-end justify-between gap-4">

                            <div className="min-w-[280px] max-w-xl flex-1">

                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                    Tìm bệnh nhân
                                </label>

                                <div className="relative">

                                    <Search
                                        size={15}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Tên, mã bệnh nhân..."
                                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary-400"
                                    />

                                </div>

                            </div>

                            <div className="flex items-center gap-3">

                                <span className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
                                    {waitingCount} bệnh nhân đang chờ
                                </span>

                                <button
                                    onClick={refetch}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                                >
                                    <RotateCcw size={15} />
                                </button>

                            </div>

                        </div>

                    </section>

                    {/* =================================================
                        WAITING LIST
                    ================================================= */}

                    <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        {/* Title */}

                        <div className="border-b border-slate-100 px-5 py-3">

                            <h2 className="text-base font-semibold text-slate-900">
                                Danh sách chờ
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-400">
                                Bệnh nhân đang chờ được gọi vào phòng cận lâm sàng
                            </p>

                        </div>

                        {loading ? (

                            <div className="px-5 py-10 text-center text-sm text-slate-400">
                                Đang tải...
                            </div>

                        ) : waitingGroups.length === 0 ? (

                            <div className="px-5 py-10 text-center">

                                <UserCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />

                                <p className="text-sm font-medium text-slate-500">
                                    Không có bệnh nhân trong hàng chờ
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Danh sách sẽ cập nhật khi có bệnh nhân mới
                                </p>

                            </div>

                        ) : (

                            <div className="w-full overflow-x-auto">

                                <table className="w-full text-sm">

                                    <thead>

                                    <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">

                                        <th className="w-[8%] px-5 py-3 text-left font-medium">
                                            STT
                                        </th>

                                        <th className="w-[22%] px-5 py-3 text-left font-medium">
                                            Bệnh nhân
                                        </th>

                                        <th className="w-[30%] px-5 py-3 text-left font-medium">
                                            Yêu cầu cận lâm sàng
                                        </th>

                                        <th className="w-[15%] px-5 py-3 text-left font-medium">
                                            Trạng thái
                                        </th>

                                        <th className="w-[25%] px-5 py-3 text-right font-medium">
                                            Thao tác
                                        </th>

                                    </tr>

                                    </thead>

                                    <tbody className="divide-y divide-slate-100">

                                    {waitingGroups.map(
                                        (group) => (

                                            <tr
                                                key={
                                                    group.ticketId
                                                }
                                                className="transition hover:bg-slate-50/70"
                                            >

                                                {/* STT */}

                                                <td className="px-5 py-3.5">

                                                        <span className="text-base font-bold text-slate-800">
                                                            {displayNumber(
                                                                group.number
                                                            )}
                                                        </span>

                                                </td>

                                                {/* Patient */}

                                                <td className="px-5 py-3.5">

                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50">

                                                            <UserCircle className="h-5 w-5 text-primary-500" />

                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="truncate font-semibold text-slate-900">
                                                                {group.patientName ||
                                                                    '—'}
                                                            </p>

                                                            <p className="mt-0.5 truncate text-xs text-slate-400">
                                                                {group.patientCode ||
                                                                    '—'}
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* Services */}

                                                <td className="px-5 py-3.5 text-slate-600">

                                                    {group.requests
                                                            .map(
                                                                (
                                                                    request
                                                                ) =>
                                                                    request.serviceName
                                                            )
                                                            .filter(
                                                                Boolean
                                                            )
                                                            .join(
                                                                ', '
                                                            ) ||
                                                        '—'}

                                                </td>

                                                {/* Status */}

                                                <td className="px-5 py-3.5">

                                                        <span
                                                            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                                                badge[
                                                                    group
                                                                        .status
                                                                    ] ||
                                                                'bg-slate-100 text-slate-500'
                                                            }`}
                                                        >
                                                            {label[
                                                                    group
                                                                        .status
                                                                    ] ||
                                                                group.status}
                                                        </span>

                                                </td>

                                                {/* Actions */}

                                                <td className="px-5 py-3.5">

                                                    <div className="flex flex-wrap justify-end gap-2">

                                                        {/* WAITING */}

                                                        {group.status ===
                                                            'WAITING' && (
                                                                <>

                                                                    <button
                                                                        onClick={() =>
                                                                            action(
                                                                                group.ticketId,
                                                                                'call',
                                                                                'Đã gọi bệnh nhân.'
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !!currentPatient
                                                                        }
                                                                        className="rounded-lg border border-primary-500 px-3 py-1.5 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        Gọi bệnh nhân
                                                                    </button>

                                                                    <button
                                                                        onClick={() =>
                                                                            action(
                                                                                group.ticketId,
                                                                                'skip',
                                                                                'Đã đánh dấu vắng.'
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !!currentPatient
                                                                        }
                                                                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        Đánh vắng
                                                                    </button>

                                                                </>
                                                            )}

                                                        {/* CALLED */}

                                                        {group.status ===
                                                            'CALLED' && (
                                                                <>

                                                                    <button
                                                                        onClick={() =>
                                                                            action(
                                                                                group.ticketId,
                                                                                'call',
                                                                                'Đã gọi lại bệnh nhân.'
                                                                            )
                                                                        }
                                                                        className="rounded-lg border border-primary-300 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-50"
                                                                    >
                                                                        Gọi lại
                                                                    </button>

                                                                    <button
                                                                        onClick={() =>
                                                                            action(
                                                                                group.ticketId,
                                                                                'start-exam',
                                                                                'Đã bắt đầu thực hiện cận lâm sàng.'
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !!currentPatient
                                                                        }
                                                                        className="rounded-lg bg-primary-500 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        Bắt đầu
                                                                    </button>

                                                                    <button
                                                                        onClick={() =>
                                                                            action(
                                                                                group.ticketId,
                                                                                'skip',
                                                                                'Đã đánh dấu vắng.'
                                                                            )
                                                                        }
                                                                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                                    >
                                                                        Đánh vắng
                                                                    </button>

                                                                </>
                                                            )}

                                                        {/* SKIPPED */}

                                                        {group.status ===
                                                            'SKIPPED' && (

                                                                <button
                                                                    onClick={() =>
                                                                        action(
                                                                            group.ticketId,
                                                                            'return',
                                                                            'Đã đưa lại hàng chờ.'
                                                                        )
                                                                    }
                                                                    className="rounded-lg border border-primary-300 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-50"
                                                                >
                                                                    Quay lại hàng chờ
                                                                </button>

                                                            )}

                                                        {/* BLOCKED */}

                                                        {group.status ===
                                                            'BLOCKED' && (

                                                                <span className="text-xs text-slate-400">
                                                                    Chờ hoàn thành bước trước
                                                                </span>

                                                            )}

                                                    </div>

                                                </td>

                                            </tr>

                                        )
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
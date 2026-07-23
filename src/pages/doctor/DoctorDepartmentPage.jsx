// src/pages/doctor/DoctorDepartmentPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, UserCircle } from 'lucide-react';
import DoctorLayout from '@/components/layout/DoctorLayout';
import { useInProgressPatient } from '@/hooks/useInProgressPatient';
import { useQueueWaiting } from '@/hooks/useQueueWaiting';
import { useQueueActions } from '@/hooks/useQueueActions';
import { ROUTES } from '@/constants/routes';
import { useAllDepartments } from '@/hooks/useAllDepartments';

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
    called: 'bg-emerald-50 text-emerald-700',
    inProgress: 'bg-blue-50 text-blue-700',
    done: 'bg-gray-100 text-gray-600',
    skipped: 'bg-red-50 text-red-600',
    waitingForTest: 'bg-purple-50 text-purple-700',
    testDone: 'bg-green-50 text-green-700',
};

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function DoctorDepartmentPage() {
    const { departmentId } = useParams(); // Get from URL
    const { t } = useTranslation(['doctor', 'queue']);
    const navigate = useNavigate();
    const username = get('username') || 'Bác sĩ';

    // Get department info from the departments list
    const { examinationRooms } = useAllDepartments();
    const selectedDept = examinationRooms.find(d => d.departmentId === departmentId);

    // Fetch in-progress patient for selected department
    const { ticket: inProgressTicket, loading: ticketLoading, error: ticketError, reload: reloadInProgress } = useInProgressPatient(departmentId);

    // Fetch waiting queue for selected department
    const { tickets: waitingTickets, waitingCount, loading: waitingLoading, error: waitingError, reload: reloadWaiting } = useQueueWaiting(departmentId);

    // Queue actions
    const { completeExam, callPatient, startExam, markAbsent } = useQueueActions();

    // Handle start examination - navigate to examination page with departmentId
    const handleStartExamination = () => {
        if (departmentId) {
            navigate(`${ROUTES.DOCTOR_EXAMINATION.replace(':departmentId', departmentId)}`);
        }
    };

    // Handle complete exam
    const handleCompleteExam = async () => {
        if (inProgressTicket?.ticketId) {
            const result = await completeExam(inProgressTicket.ticketId);
            if (result.success) {
                reloadInProgress();
                reloadWaiting();
            }
        }
    };

    // Handle queue actions with reload
    const handleQueueAction = async (actionFn, patientId) => {
        const result = await actionFn(patientId);
        if (result && result.success) {
            reloadInProgress();
            reloadWaiting();
        }
        return result;
    };

    const isDamaged = false;

    return (
        <DoctorLayout>
            {/* Top bar */}
            <div className="h-13 bg-white border-b border-gray-100 px-6 flex items-center gap-3 shrink-0">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Tìm bệnh nhân..."
                        className="w-full h-9 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500"
                    />
                </div>
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                    <Bell size={16} />
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                    <UserCircle size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white px-8 py-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-xl font-semibold text-gray-900 mb-4">{t('doctor:sidebar.waitingRoom')}</h1>

                    {/* Department Title */}
                    <div className="flex items-center gap-2 mb-4">
                        <p className="text-sm text-gray-500">
                            Phòng khám: <span className="font-medium text-gray-700">{selectedDept?.name || 'Không xác định'}</span>
                        </p>
                    </div>

                    {/* In-progress Patient Card */}
                    {ticketLoading ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                            <p className="text-sm text-gray-400">Đang tải thông tin bệnh nhân...</p>
                        </div>
                    ) : ticketError ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                            <p className="text-sm text-red-500">Lỗi tải thông tin bệnh nhân</p>
                        </div>
                    ) : inProgressTicket ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                            <div className="flex gap-4">
                                {/* Avatar */}
                                <div className="w-20 h-20 rounded-xl bg-red-100 shrink-0 overflow-hidden">
                                    <div className="w-full h-full bg-red-300" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-bold text-gray-900">{inProgressTicket.patientName ?? '—'}</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {inProgressTicket.patientCode && `Mã BN: ${inProgressTicket.patientCode}`}<br/>
                                        Dịch vụ: {inProgressTicket.serviceName ?? '—'}<br/>
                                        Số phiếu: {inProgressTicket.queueNumber ?? '—'}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleStartExamination}
                                        className="px-4 h-9 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors"
                                    >
                                        Vào khám
                                    </button>
                                    {inProgressTicket.recordId == null && (
                                        <span className="text-xs text-orange-600">Chưa có bệnh án</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                            <p className="text-sm text-gray-400">Không có bệnh nhân đang khám</p>
                        </div>
                    )}

                    {/* Waiting Queue Table */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <h2 className="text-sm font-semibold text-gray-500 mb-3">Danh sách chờ</h2>
                        {waitingLoading ? (
                            <p className="text-sm text-gray-400">Đang tải danh sách...</p>
                        ) : waitingError ? (
                            <p className="text-sm text-red-500">Lỗi tải danh sách</p>
                        ) : waitingTickets.length === 0 ? (
                            <p className="text-sm text-gray-400">Không có bệnh nhân chờ</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-400">
                                        <th className="px-5 py-3 text-left font-medium">Mã BN</th>
                                        <th className="px-5 py-3 text-left font-medium">Họ tên</th>
                                        <th className="px-5 py-3 text-left font-medium">Trạng thái</th>
                                        <th className="px-5 py-3 text-left font-medium">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {waitingTickets.map((ticket) => (
                                        <tr key={ticket.ticketId} className="border-b border-gray-50">
                                            <td className="px-5 py-3 font-medium text-gray-800">{ticket.patientCode ?? '—'}</td>
                                            <td className="px-5 py-3">{ticket.patientName ?? ticket.serviceName ?? '—'}</td>
                                            <td className="px-5 py-3">
                                                <span className={`rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLES[STATUS_MAP[ticket.status] ?? 'called']}`}>
                                                    {t(`queue:status.${STATUS_MAP[ticket.status] ?? 'called'}`)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {ticket.status === 'WAITING' && (
                                                    <>
                                                        <button
                                                            className="text-xs text-gray-700 hover:underline mr-2"
                                                            onClick={() => handleQueueAction(callPatient, ticket.ticketId)}
                                                            disabled={!!inProgressTicket}
                                                        >
                                                            Gọi vào
                                                        </button>
                                                        <button
                                                            className="text-xs text-gray-700 hover:underline"
                                                            onClick={() => handleQueueAction(markAbsent, ticket.ticketId)}
                                                            disabled={!!inProgressTicket}
                                                        >
                                                            Vắng
                                                        </button>
                                                    </>
                                                )}
                                                {ticket.status === 'TEST_DONE' && (
                                                    <>
                                                        <button
                                                            className="text-xs text-gray-700 hover:underline mr-2"
                                                            onClick={() => handleQueueAction(callPatient, ticket.ticketId)}
                                                            disabled={!!inProgressTicket}
                                                        >
                                                            Gọi vào
                                                        </button>
                                                        <button
                                                            className="text-xs text-gray-700 hover:underline"
                                                            onClick={() => handleQueueAction(markAbsent, ticket.ticketId)}
                                                            disabled={!!inProgressTicket}
                                                        >
                                                            Vắng
                                                        </button>
                                                    </>
                                                )}
                                                {ticket.status === 'CALLED' && (
                                                    <button
                                                        className="text-xs text-gray-700 hover:underline"
                                                        onClick={() => handleQueueAction(startExam, ticket.ticketId)}
                                                        disabled={!!inProgressTicket}
                                                    >
                                                        Bắt đầu khám
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </DoctorLayout>
    );
}
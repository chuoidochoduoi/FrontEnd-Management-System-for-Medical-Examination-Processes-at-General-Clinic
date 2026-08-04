// src/pages/doctor/DoctorDepartmentPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, UserCircle } from 'lucide-react';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
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
    const [queueFilters, setQueueFilters] = useState({
        search: '', status: 'ALL', sort: 'QUEUE_ASC', showAll: false,
        workDate: new Date().toISOString().slice(0, 10),
    });
    const username = get('username') || 'Bác sĩ';

    // Get department info from the departments list
    const { examinationRooms } = useAllDepartments();
    const selectedDept = examinationRooms.find(d => d.departmentId === departmentId);

    // Fetch in-progress patient for selected department
    const { ticket: inProgressTicket, loading: ticketLoading, error: ticketError, reload: reloadInProgress } = useInProgressPatient(departmentId);

    // Fetch waiting queue for selected department
    const { tickets: waitingTickets, waitingCount, loading: waitingLoading, error: waitingError, reload: reloadWaiting } = useQueueWaiting(departmentId, queueFilters);

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

    const handleViewSummary = async (ticket) => {
        if (!ticket.recordId) return;
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiBase}/api/v1/medical-records/${ticket.recordId}`, {
            headers: { Authorization: `Bearer ${get('token')}` },
        });
        if (!res.ok) return;
        const body = await res.json();
        const record = body.data ?? body.result ?? body;
        const completionData = {
            record,
            patient: {
                fullName: ticket.patientName,
                phone: ticket.patientPhone,
                dateOfBirth: ticket.patientDob,
                gender: ticket.patientGender,
                address: ticket.patientAddress || '',
            },
            serviceName: ticket.serviceName,
            departmentName: ticket.departmentName,
            completedAt: record.completedAt ?? ticket.completedAt,
            waitingForTests: false,
        };
        sessionStorage.setItem(`exam-completion:${ticket.recordId}`, JSON.stringify(completionData));
        sessionStorage.setItem(`prescription-preview:${ticket.recordId}`, JSON.stringify(completionData));
        navigate(ROUTES.DOCTOR_EXAM_COMPLETED.replace(':recordId', ticket.recordId), { state: completionData });
    };

    const isDamaged = false;

    return (
        <MedicalStaffLayout>

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
                                        {inProgressTicket.patientCode && `Mã BN: ${inProgressTicket.patientCode}`}<br />
                                        Dịch vụ: {inProgressTicket.serviceName ?? '—'}<br />
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
                        <div className="mb-4 flex flex-wrap items-end gap-3">
                            <div className="min-w-56 flex-1"><label className="mb-1 block text-xs text-gray-500">Tìm bệnh nhân</label><input value={queueFilters.search} onChange={e => setQueueFilters(v => ({...v, search: e.target.value}))} placeholder="Tên, mã, SĐT, dịch vụ..." className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm" /></div>
                            <div><label className="mb-1 block text-xs text-gray-500">Ngày</label><input type="date" value={queueFilters.workDate} onChange={e => setQueueFilters(v => ({...v, workDate: e.target.value}))} className="h-9 rounded-lg border border-gray-200 px-3 text-sm" /></div>
                            <div><label className="mb-1 block text-xs text-gray-500">Trạng thái</label><select value={queueFilters.status} onChange={e => setQueueFilters(v => ({...v, status: e.target.value}))} className="h-9 rounded-lg border border-gray-200 px-3 text-sm"><option value="ALL">Tất cả</option><option value="WAITING">Đang chờ</option><option value="CALLED">Đã gọi</option><option value="IN_PROGRESS">Đang khám</option><option value="WAITING_FOR_TEST">Chờ xét nghiệm</option><option value="TEST_DONE">Đã có kết quả</option><option value="DONE">Hoàn thành</option><option value="SKIPPED">Vắng</option></select></div>
                            <div><label className="mb-1 block text-xs text-gray-500">Sắp xếp</label><select value={queueFilters.sort} onChange={e => setQueueFilters(v => ({...v, sort: e.target.value}))} className="h-9 rounded-lg border border-gray-200 px-3 text-sm"><option value="QUEUE_ASC">STT tăng</option><option value="QUEUE_DESC">STT giảm</option><option value="NAME_ASC">Tên A-Z</option></select></div>
                            <label className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm"><input type="checkbox" checked={queueFilters.showAll} onChange={e => setQueueFilters(v => ({...v, showAll: e.target.checked}))} /> Xem toàn bộ</label>
                        </div>
                        <p className="mb-3 text-xs text-gray-400">Hiển thị {waitingCount} phiếu</p>
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
                                                {ticket.status === 'DONE' && ticket.recordId && (
                                                    <button className="text-xs font-medium text-primary-600 hover:underline" onClick={() => handleViewSummary(ticket)}>
                                                        Xem tổng kết
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
        </MedicalStaffLayout>
    );
}

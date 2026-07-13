// src/pages/doctor/DoctorDepartmentPage.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Bell,
    UserCircle,
    RefreshCcw,
    LogOut,
    LayoutDashboard,
    Users,
    FolderOpen,
    Settings
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useDepartments } from '@/hooks/useDepartments';
import { useInProgressPatient } from '@/hooks/useInProgressPatient';
import { useQueueWaiting } from '@/hooks/useQueueWaiting';
import { useQueueActions } from '@/hooks/useQueueActions';

const STATUS_STYLES = {
    waiting: 'bg-amber-50 text-amber-700',
    called: 'bg-emerald-50 text-emerald-700',
    inProgress: 'bg-blue-50 text-blue-700',
    done: 'bg-gray-100 text-gray-600',
    skipped: 'bg-red-50 text-red-600',
};

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function DoctorDepartmentPage() {
    const { t } = useTranslation(['doctor', 'queue']);
    const navigate = useNavigate();
    const username = get('username') || 'Bác sĩ';

    // Department handling
    const { departments, loading: deptLoading, error: deptError } = useDepartments();
    const [selectedDept, setSelectedDept] = useState(null);

    // Fetch in-progress patient for selected department
    const { ticket: inProgressTicket, loading: ticketLoading, error: ticketError, reload: reloadInProgress } = useInProgressPatient(selectedDept?.departmentId);

    // Fetch waiting queue for selected department
    const { tickets: waitingTickets, waitingCount, loading: waitingLoading, error: waitingError, reload: reloadWaiting } = useQueueWaiting(selectedDept?.departmentId);

    // Queue actions
    const { completeExam, callPatient, startExam, markAbsent } = useQueueActions();

    // Auto-select first department on load
    useEffect(() => {
        if (!deptLoading && departments.length > 0 && !selectedDept) {
            setSelectedDept(departments[0]);
        }
    }, [departments, deptLoading, selectedDept]);

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId'].forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        navigate(ROUTES.LOGIN);
    };

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`;

    const mainNav = [
        { to: ROUTES.DOCTOR_DEPARTMENTS, icon: LayoutDashboard, label: t('doctor:sidebar.departments') },
        { to: ROUTES.DOCTOR_PATIENTS, icon: Users, label: t('doctor:sidebar.patients') },
        { to: ROUTES.DOCTOR_RECORDS, icon: FolderOpen, label: t('doctor:sidebar.records') },
    ];

    // Handle start examination - navigate to examination page with departmentId
    const handleStartExamination = () => {
        if (selectedDept?.departmentId) {
            navigate(`${ROUTES.DOCTOR_EXAMINATION.replace(':departmentId', selectedDept.departmentId)}`);
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

    return (
        <div className="flex h-screen bg-gray-50 font-jakarta overflow-hidden">
            {/* Sidebar */}
            <aside className="w-44 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="px-4 py-5 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">{t('doctor:sidebar.logo')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t('doctor:sidebar.subtitle')}</p>
                </div>

                {/* Avatar + Department Selector */}
                <div className="px-4 py-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-red-400 mb-2" />
                    <p className="text-xs font-semibold text-gray-800">{username}</p>
                    <p className="text-xs text-gray-400 mb-2">Bác sĩ đa khoa</p>

                    {/* Department Selector */}
                    <select
                        value={selectedDept?.departmentId || ''}
                        onChange={e => {
                            const dept = departments.find(d => d.departmentId === e.target.value);
                            setSelectedDept(dept);
                        }}
                        disabled={deptLoading}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-primary-500"
                    >
                        {deptLoading ? (
                            <option value="">Dang tai...</option>
                        ) : (
                            departments.map(dept => (
                                <option key={dept.departmentId} value={dept.departmentId}>
                                    {dept.name}
                                </option>
                            ))
                        )}
                    </select>
                    {deptError && <p className="text-xs text-red-500 mt-1">Loi tai phong</p>}
                </div>

                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                    {mainNav.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <Icon size={15} className="shrink-0" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
                    <NavLink to={ROUTES.SETTINGS} className={linkClass}>
                        <Settings size={15} className="shrink-0" />
                        {t('doctor:sidebar.settings')}
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={15} className="shrink-0" />
                        {t('doctor:sidebar.logout')}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-end gap-4 border-b border-gray-200 bg-white px-6 py-3">
                    <button className="text-gray-400 hover:text-gray-600">
                        <Bell className="h-5 w-5" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                        <UserCircle className="h-5 w-5" />
                    </button>
                </div>

                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <h1 className="text-xl font-semibold text-gray-900 mb-4">{t('doctor:sidebar.waitingRoom')}</h1>

                        {/* Department Title + Waiting Count */}
                        {selectedDept && (
                            <div className="flex items-center gap-2 mb-4">
                                <p className="text-sm text-gray-500">
                                    Phong kham: <span className="font-medium text-gray-700">{selectedDept.name}</span>
                                </p>
                                {inProgressTicket?.waitingCount != null && (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                        {inProgressTicket.waitingCount} cho kham
                                    </span>
                                )}
                            </div>
                        )}

                        {/* In-progress Patient Card */}
                        {ticketLoading ? (
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                                <p className="text-sm text-gray-400">Dang tai thong tin benh nhan...</p>
                            </div>
                        ) : ticketError ? (
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                                <p className="text-sm text-red-500">Loi tai thong tin benh nhan</p>
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
                                            {inProgressTicket.patientCode && `Ma BN: ${inProgressTicket.patientCode}`}<br/>
                                            Dich vu: {inProgressTicket.serviceName ?? '—'}<br/>
                                            So phieu: {inProgressTicket.queueNumber ?? '—'}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleStartExamination}
                                            className="px-4 h-9 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors"
                                        >
                                            Vao kham
                                        </button>
                                        {inProgressTicket.recordId == null && (
                                            <span className="text-xs text-orange-600">Chua co benh an</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                                <p className="text-sm text-gray-400">Khong co benh nhan nao dang kham</p>
                            </div>
                        )}

                        {/* Waiting Queue Table */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-5">
                            <h2 className="text-sm font-semibold text-gray-500 mb-3">Danh sach cho</h2>
                            {waitingLoading ? (
                                <p className="text-sm text-gray-400">Dang tai danh sach...</p>
                            ) : waitingError ? (
                                <p className="text-sm text-red-500">Loi tai danh sach</p>
                            ) : waitingTickets.length === 0 ? (
                                <p className="text-sm text-gray-400">Khong co benh nhan cho</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-400">
                                            <th className="px-5 py-3 text-left font-medium">Ma BN</th>
                                            <th className="px-5 py-3 text-left font-medium">Ho ten</th>
                                            <th className="px-5 py-3 text-left font-medium">Trang thai</th>
                                            <th className="px-5 py-3 text-left font-medium">Hanh dong</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {waitingTickets.map((ticket) => (
                                            <tr key={ticket.ticketId} className="border-b border-gray-50">
                                                <td className="px-5 py-3 font-medium text-gray-800">{ticket.patientCode ?? '—'}</td>
                                                <td className="px-5 py-3">{ticket.patientName ?? ticket.serviceName ?? '—'}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`rounded px-2 py-1 text-xs font-semibold ${STATUS_STYLES[ticket.status === 'WAITING' ? 'waiting' : 'called']}`}>
                                                        {ticket.status === 'WAITING' ? 'Cho kham' : 'Da goi'}
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
                                                                Goi vao
                                                            </button>
                                                            <button
                                                                className="text-xs text-gray-700 hover:underline"
                                                                onClick={() => handleQueueAction(markAbsent, ticket.ticketId)}
                                                                disabled={!!inProgressTicket}
                                                            >
                                                                Vang
                                                            </button>
                                                        </>
                                                    )}
                                                    {ticket.status === 'CALLED' && (
                                                        <button
                                                            className="text-xs text-gray-700 hover:underline"
                                                            onClick={() => handleQueueAction(startExam, ticket.ticketId)}
                                                            disabled={!!inProgressTicket}
                                                        >
                                                            Bat dau kham
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
                </main>
            </div>
        </div>
    );
}
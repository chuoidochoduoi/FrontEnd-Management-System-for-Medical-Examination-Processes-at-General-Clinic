// src/components/layout/ReceptionistLayout.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ClipboardList,
    FilePlus,
    FolderOpen,
    Settings,
    LifeBuoy,
    LogOut,
    Users,
    CalendarClock,
    CalendarDays, Clock3, MapPinned,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import NotificationBell from '@/components/ui/NotificationBell';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'react-toastify';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function ReceptionistLayout({ children }) {
    const { t } = useTranslation('receptionist');
    const navigate = useNavigate();
    const location = useLocation();
    const username = get('username') || 'Lễ tân';
    const staffId = get('staffId');
    const systemRole = get('systemRole') || '';
    
    const [staffInfo, setStaffInfo] = useState(null);
    const [hasNewChat, setHasNewChat] = useState(false);

    useWebSocket('/topic/receptionist-chat', null, (msg) => {
        if (msg === 'NEW_CHAT_REQUEST' || msg === 'NEW_MESSAGE') {
            if (location.pathname !== ROUTES.RECEPTIONIST_SUPPORT) {
                setHasNewChat(true);
                if (msg === 'NEW_CHAT_REQUEST') {
                    toast.info('Có yêu cầu hỗ trợ mới từ khách hàng!', { position: 'top-right', autoClose: 4000 });
                }
            }
        }
    });

    useEffect(() => {
        if (location.pathname === ROUTES.RECEPTIONIST_SUPPORT) {
            setHasNewChat(false);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (staffId) {
            fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${staffId}`, {
                headers: { Authorization: `Bearer ${get('token')}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setStaffInfo(data.data);
                } else {
                    setStaffInfo(data);
                }
            })
            .catch(err => console.error("Error fetching staff info:", err));
        }
    }, [staffId]);

    const getRoleName = () => {
        if (staffInfo && staffInfo.specialization) return staffInfo.specialization.name;
        if (systemRole === 'NURSE') return 'Y tá';
        if (systemRole === 'RECEPTIONIST') return 'Lễ tân';
        if (['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR'].includes(systemRole)) return 'Bác sĩ';
        return 'Lễ tân';
    };

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach(k => {
            localStorage.removeItem(k); sessionStorage.removeItem(k);
        });
        navigate(ROUTES.LOGIN);
    };

    const mainNav = [
        { to: ROUTES.RECEPTIONIST_CHECKIN,       icon: ClipboardList, label: t('sidebar.checkIn') },
        { to: ROUTES.RECEPTIONIST_CREATE_TICKET, icon: FilePlus,      label: t('sidebar.createTicket') },
        { to: ROUTES.RECEPTIONIST_RECORDS,       icon: FolderOpen,    label: t('sidebar.manageRecords') },
        { to: ROUTES.PATIENT_JOURNEYS, icon: MapPinned, label: 'Điều phối bệnh nhân' },
        { to: ROUTES.RECEPTIONIST_SUPPORT,       icon: LifeBuoy,      label: 'Hỗ trợ trực tuyến' },
        { to: ROUTES.STAFF_SCHEDULE,             icon: CalendarDays, label: 'Lịch trực của tôi' },
//        { to: ROUTES.STAFF_ATTENDANCE,           icon: Clock3, label: 'Điểm danh' },
        { to: ROUTES.STAFF_PROFILE, icon: Users, label: 'Hồ sơ cá nhân' },
    ];

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`;

    return (
        <div className="flex h-screen bg-gray-50 font-jakarta overflow-hidden">
            {/* Sidebar */}
            <aside className="w-44 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="px-4 py-5 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">{t('sidebar.logo')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t('sidebar.subtitle')}</p>
                </div>

                {/* Avatar */}
                <div className="px-4 py-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                        <Users className="text-blue-500 w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 break-words">
                        {staffInfo?.profile?.fullName || username}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{getRoleName()}</p>
                </div>

                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                    {mainNav.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <div className="relative">
                                <Icon size={15} className="shrink-0" />
                                {to === ROUTES.RECEPTIONIST_SUPPORT && hasNewChat && (
                                    <>
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    </>
                                )}
                            </div>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
                    
                    <NavLink to={ROUTES.SETTINGS} className={linkClass}>
                        <Settings size={15} className="shrink-0" />
                        Cài đặt
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={15} className="shrink-0" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <header className="absolute top-4 right-8 z-10 bg-white shadow-sm rounded-full px-2 py-1 flex items-center border border-gray-100">
                    <NotificationBell />
                </header>
                <main className="flex-1 overflow-y-auto p-8 pt-16">
                    {children}
                </main>
            </div>
        </div>
    );
}


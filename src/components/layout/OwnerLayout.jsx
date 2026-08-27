// src/components/layout/OwnerLayout.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Activity, BarChart2, Building2, CalendarDays, ClipboardList, FilePlus,
    FileText, FolderOpen, Inbox, LifeBuoy, LogOut, MapPinned, MessageSquare, Settings,
    Tag, UserRound, Users, Wrench, Clock, BellRing, ListChecks, MapPin
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import NotificationBell from '@/components/ui/NotificationBell';
import SidebarBrand from './SidebarBrand';
import AppPreferencesMenu from '@/components/ui/AppPreferencesMenu';
import useContactRequestCount from '@/hooks/useContactRequestCount';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function OwnerLayout({ children }) {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const username = get('username') || 'Chủ phòng khám';
    const staffId = get('staffId');
    const systemRole = get('systemRole') || '';
    
    const [staffInfo, setStaffInfo] = useState(null);
    const contactRequestCount = useContactRequestCount(systemRole === 'CLINIC_MANAGER');

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
        if (systemRole === 'NURSE') return t('roles.nurse');
        if (systemRole === 'RECEPTIONIST') return t('roles.receptionist');
        if (['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR'].includes(systemRole)) return t('roles.doctor');
        if (systemRole === 'ADMIN') return t('roles.admin');
        if (systemRole === 'CASHIER') return t('roles.cashier');
        return t('roles.manager');
    };

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach(k => {
            localStorage.removeItem(k); sessionStorage.removeItem(k);
        });
        navigate(ROUTES.LOGIN);
    };

    const mainNav = [
        { to: ROUTES.OWNER_REPORT,   icon: BarChart2,    label: t('sidebar.statistics') },
        { to: ROUTES.OWNER_SCHEDULE, icon: CalendarDays, label: t('sidebar.schedule') },
        { to: ROUTES.ADMIN_ROOMS, icon: Building2, label: 'Quản lý phòng' },
        { to: ROUTES.ADMIN_SERVICES, icon: Tag, label: 'Quản lý dịch vụ' },
        { to: ROUTES.ADMIN_CAPABILITIES, icon: Wrench, label: 'Danh mục kỹ thuật' },
        { to: ROUTES.ADMIN_ACCOUNTS, icon: Users, label: 'Quản lý tài khoản' },
        { to: ROUTES.ADMIN_SHIFTS, icon: Clock, label: 'Cấu hình ca' },
        { to: ROUTES.ADMIN_CLINIC_INFORMATION, icon: MapPin, label: 'Thông tin phòng khám' },
        { to: ROUTES.ADMIN_AUDIT_LOGS, icon: Activity, label: 'Nhật ký hệ thống' },
        { to: ROUTES.ADMIN_PUBLIC_ANNOUNCEMENTS, icon: BellRing, label: 'Thông báo công khai' },
        { to: ROUTES.CLINICAL_FORM_TEMPLATES, icon: ListChecks, label: 'Biểu mẫu chuyên môn' },
        { to: ROUTES.MANAGER_STAFF, icon: Users, label: t('sidebar.staff') },
        { to: ROUTES.MANAGER_PATIENTS, icon: UserRound, label: t('sidebar.patients') },
        { to: ROUTES.RECEPTIONIST_CHECKIN, icon: ClipboardList, label: 'Tiếp đón & Check-in' },
        { to: ROUTES.RECEPTIONIST_CREATE_TICKET, icon: FilePlus, label: 'Tạo phiếu khám' },
        { to: ROUTES.RECEPTIONIST_VISITS, icon: ClipboardList, label: 'Quản lý phiếu khám' },
        { to: ROUTES.RECEPTIONIST_RECORDS, icon: FolderOpen, label: 'Quản lý bệnh nhân' },
        { to: ROUTES.RECEPTIONIST_FOLLOW_UPS, icon: CalendarDays, label: 'Quản lý tái khám' },
        { to: ROUTES.PATIENT_JOURNEYS, icon: MapPinned, label: 'Điều phối bệnh nhân' },
        { to: ROUTES.RECEPTIONIST_FEEDBACKS, icon: MessageSquare, label: 'Đánh giá liên quan' },
        { to: ROUTES.RECEPTIONIST_CONTACT_REQUESTS, icon: Inbox, label: 'Yêu cầu liên hệ', badge: contactRequestCount },
        { to: ROUTES.RECEPTIONIST_SUPPORT, icon: LifeBuoy, label: 'Hỗ trợ trực tuyến' },
        { to: ROUTES.CASHIER_INVOICES, icon: FileText, label: 'Hóa đơn & thanh toán' },
    ];

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`;

    return (
        <div className="flex h-screen bg-gray-50 font-jakarta overflow-hidden">
            {/* Sidebar */}
            <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 print:hidden">
                <SidebarBrand />

                {/* User info */}
                <div className="px-4 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-800 break-words">
                        {staffInfo?.profile?.fullName || username}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{getRoleName()}</p>
                </div>

                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                    {mainNav.map(({ to, icon: Icon, label, badge }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <Icon size={15} className="shrink-0" />
                            <span className="min-w-0 flex-1">{label}</span>
                            {badge > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge > 99 ? '99+' : badge}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
                    <NavLink to={ROUTES.SETTINGS} className={linkClass}>
                        <Settings size={15} className="shrink-0" />
                        {t('sidebar.settings')}
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={15} className="shrink-0" />
                        {t('sidebar.logout')}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <header className="absolute top-4 right-8 z-10 bg-white shadow-sm rounded-full px-2 py-1 flex items-center border border-gray-100 print:hidden">
                    <AppPreferencesMenu />
                    <NotificationBell />
                </header>
                <main className="flex-1 overflow-y-auto p-8 pt-16 print:p-0 print:overflow-visible">
                    {children}
                </main>
            </div>
        </div>
    );
}


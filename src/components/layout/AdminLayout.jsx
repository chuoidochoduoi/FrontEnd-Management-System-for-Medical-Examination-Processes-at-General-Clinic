// src/components/layout/AdminLayout.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Tag, Users, LogOut, Settings, LayoutDashboard, Activity, Stethoscope, Wrench, Clock } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import NotificationBell from '@/components/ui/NotificationBell';
import SidebarBrand from './SidebarBrand';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function AdminLayout({ children }) {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const username = get('username') || 'Admin';
    const staffId = get('staffId');
    const systemRole = get('systemRole') || '';
    
    const [staffInfo, setStaffInfo] = useState(null);

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
        if (systemRole === 'ADMIN') return 'Quản trị viên';
        return 'Quản trị viên';
    };

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach(k => {
            localStorage.removeItem(k); sessionStorage.removeItem(k);
        });
        navigate(ROUTES.LOGIN);
    };

    const mainNav = [
        { to: ROUTES.ADMIN_ROOMS,    icon: Building2, label: t('sidebar.rooms') },
        { to: ROUTES.ADMIN_SERVICES, icon: Tag,       label: t('sidebar.services') },
        { to: ROUTES.ADMIN_SPECIALIZATIONS, icon: Stethoscope, label: 'Chuyên khoa' },
        { to: ROUTES.ADMIN_CAPABILITIES, icon: Wrench, label: 'Danh mục kỹ thuật' },
        { to: ROUTES.ADMIN_ACCOUNTS, icon: Users,     label: t('sidebar.accounts') },
        { to: ROUTES.ADMIN_AUDIT_LOGS, icon: Activity, label: 'Nhật ký hệ thống' },
    ];

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`;

    return (
        <div className="flex h-screen bg-gray-50 font-jakarta overflow-hidden">
            {/* Sidebar */}
            <aside className="w-44 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <SidebarBrand />

                {/* User info */}
                <div className="px-4 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-800 break-words">
                        {staffInfo?.profile?.fullName || username}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{getRoleName()}</p>
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


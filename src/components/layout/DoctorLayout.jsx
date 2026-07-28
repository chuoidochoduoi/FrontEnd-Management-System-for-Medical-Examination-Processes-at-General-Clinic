// src/components/layout/DoctorLayout.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, FolderOpen, Settings, LogOut, FlaskConical } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function DoctorLayout({ children }) {
    const { t } = useTranslation('doctor');
    const navigate = useNavigate();
    const username = get('username') || 'Bác sĩ';

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach(k => {
            localStorage.removeItem(k); sessionStorage.removeItem(k);
        });
        navigate(ROUTES.LOGIN);
    };

    const mainNav = [
        { to: ROUTES.DOCTOR_ROOMS, icon: LayoutDashboard, label: t('sidebar.departments') },
        { to: ROUTES.STAFF_SCHEDULE, icon: () => <span className="text-gray-500">📅</span>, label: 'Lịch trực của tôi' },
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
                    <div className="w-10 h-10 rounded-lg bg-red-400 mb-2" />
                    <p className="text-xs font-semibold text-gray-800">{username}</p>
                    <p className="text-xs text-gray-400">Bác sĩ đa khoa</p>
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

            <div className="flex-1 flex flex-col overflow-hidden">
                {children}
            </div>
        </div>
    );
}

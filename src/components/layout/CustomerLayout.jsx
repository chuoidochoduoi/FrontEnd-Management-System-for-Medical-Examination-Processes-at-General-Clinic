// src/components/layout/CustomerLayout.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Home,
    CalendarPlus,
    ClipboardList,
    FlaskConical,
    CreditCard,
    UserCircle,
    Settings,
    LogOut,
    Circle,
    ChevronDown,
    User,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function CustomerLayout({ children }) {
    const { t } = useTranslation('customer');
    const navigate = useNavigate();

    const username  = get('username')  || 'Khách hàng';
    const accountId = get('accountId') || '—';
    const initials = username.slice(0, 2).toUpperCase();

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        navigate(ROUTES.LOGIN);
    };

    const mainNav = [
        { to: ROUTES.CUSTOMER_HOME,           icon: Home,          label: t('sidebar.home') },
        { to: ROUTES.CUSTOMER_APPOINTMENT,   icon: CalendarPlus,  label: t('sidebar.appointment') },
        { to: ROUTES.CUSTOMER_VISIT_HISTORY,  icon: ClipboardList, label: t('sidebar.visitHistory') },
        { to: ROUTES.CUSTOMER_PAYMENT,        icon: CreditCard,    label: t('sidebar.paymentHistory') },
        { to: ROUTES.PROFILE,                icon: UserCircle,    label: t('sidebar.profile') },
    ];

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
            isActive
                ? 'bg-primary-50 text-primary-600 font-medium'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`;

    return (
        <div className="flex h-screen bg-gray-50 font-jakarta overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-gray-100">
                    <p className="text-primary-500 text-base font-bold">{t('sidebar.logo')}</p>
                    <p className="text-primary-400 text-xs mt-0.5">{t('sidebar.subtitle')}</p>
                </div>

                {/* Avatar */}
                <div className="px-5 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-700 shrink-0">
                            {initials}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">{username}</p>
                            <p className="text-xs text-gray-400 truncate">{t('header.id')}: {accountId}</p>
                        </div>
                    </div>
                </div>

                {/* Main nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {mainNav.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <Icon size={16} className="shrink-0" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="px-3 py-4 border-t border-gray-100 space-y-1">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={16} className="shrink-0" />
                        {t('sidebar.logout')}
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
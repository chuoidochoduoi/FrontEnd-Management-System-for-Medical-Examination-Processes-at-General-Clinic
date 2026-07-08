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
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function CustomerLayout({ children }) {
    const { t } = useTranslation('customer');
    const navigate = useNavigate();

    const username  = get('username')  || 'Khách hàng';
    const accountId = get('accountId') || 'ID: —';

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId'].forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        navigate(ROUTES.LOGIN);
    };

    const mainNav = [
        { to: ROUTES.CUSTOMER_HOME,           icon: Home,          label: t('sidebar.home') },
        { to: ROUTES.APPOINTMENT,            icon: CalendarPlus,  label: t('sidebar.appointment') },
        { to: ROUTES.CUSTOMER_VISIT_HISTORY,  icon: ClipboardList, label: t('sidebar.visitHistory') },
        { to: ROUTES.CUSTOMER_TEST_RESULTS,   icon: FlaskConical,  label: t('sidebar.testResults') },
        { to: ROUTES.CUSTOMER_PAYMENT,        icon: CreditCard,    label: t('sidebar.paymentHistory') },
        { to: ROUTES.PROFILE,                icon: UserCircle,    label: t('sidebar.profile') },
    ];

    const bottomNav = [
        { to: ROUTES.SETTINGS, icon: Settings, label: t('sidebar.settings') },
    ];

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
            isActive
                ? 'bg-primary-50 text-primary-600 font-medium'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`;

    return (
        <div className="flex h-screen bg-gray-100 font-jakarta overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className="w-52 bg-white border-r border-gray-200 flex flex-col shrink-0">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-gray-100">
                    <p className="text-primary-500 text-base font-bold">{t('sidebar.logo')}</p>
                    <p className="text-primary-400 text-xs mt-0.5">{t('sidebar.subtitle')}</p>
                </div>

                {/* Main nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {mainNav.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <Icon size={15} className="shrink-0" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom nav */}
                <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
                    {bottomNav.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <Icon size={15} className="shrink-0" />
                            {label}
                        </NavLink>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={15} className="shrink-0" />
                        {t('sidebar.logout')}
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="h-14 bg-white border-b border-gray-200 px-8 flex items-center justify-end gap-3 shrink-0">
                    <Circle size={10} className="fill-green-400 text-green-400" />
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{username}</p>
                        <p className="text-xs text-gray-400">{t('header.id')}: {accountId}</p>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>

            </div>
        </div>
    );
}
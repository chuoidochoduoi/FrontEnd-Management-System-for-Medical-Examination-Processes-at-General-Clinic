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
    CalendarCheck,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useProfile } from '@/hooks/useProfile';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function CustomerLayout({ children }) {
    const { t } = useTranslation('customer');
    const navigate = useNavigate();
    const { profile } = useProfile();

    const displayName = profile?.fullName || get('username') || 'Khách hàng';
    const initials = displayName.slice(0, 2).toUpperCase();

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        navigate(ROUTES.LOGIN);
    };

    const mainNav = [
        { to: ROUTES.MY_APPOINTMENTS, icon: CalendarCheck, label: 'Lịch hẹn của tôi' },
        { to: ROUTES.CUSTOMER_VISIT_HISTORY, icon: ClipboardList, label: t('sidebar.visitHistory') },
        { to: ROUTES.CUSTOMER_PAYMENT, icon: CreditCard, label: t('sidebar.paymentHistory') },
        { to: ROUTES.PROFILE, icon: UserCircle, label: t('sidebar.profile') },
    ];

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${isActive
            ? 'bg-black shadow-md text-white'
            : 'text-gray-500 hover:text-black hover:bg-gray-100/80 border border-transparent'
        }`;

    return (
        <div className="flex h-screen bg-[#F5F5F7] font-jakarta overflow-hidden relative z-0 selection:bg-black selection:text-white">

            {/* Minimalist Background Element (Optional, keeping it clean) */}
            <div className="absolute top-0 right-0 w-[50vw] h-full bg-white/40 -z-10"></div>

            {/* ── Sidebar ── */}
            <aside className="w-64 bg-white/80 backdrop-blur-2xl border-r border-gray-200/60 flex flex-col shrink-0 relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                {/* Logo */}
                <div className="px-6 py-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-black flex items-center justify-center shrink-0">
                            <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-black tracking-widest uppercase leading-none">Kinh Bắc</span>
                            <span className="text-[10px] text-gray-500 tracking-[0.3em] uppercase mt-1">Medical</span>
                        </div>
                    </div>
                </div>

                {/* Avatar */}
                <div className="px-6 py-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-bold text-black shrink-0">
                            {initials}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[15px] font-bold text-black truncate">{displayName}</p>
                        </div>
                    </div>
                </div>

                {/* Main nav */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {mainNav.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <Icon size={18} className="shrink-0" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="px-4 py-6 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold tracking-wide text-gray-500 hover:bg-black hover:text-white transition-all duration-300"
                    >
                        <LogOut size={16} className="shrink-0" />
                        {t('sidebar.logout')}
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-8 lg:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
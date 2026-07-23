// src/components/layout/CashierLayout.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, BarChart2, Printer, HelpCircle, ChevronDown, LogOut, User } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function CashierLayout({ children }) {
    const { t } = useTranslation('cashier');
    const navigate = useNavigate();

    const username  = get('username')  || 'Cashier';
    const initials  = username.slice(0, 2).toUpperCase();

    const [profileOpen, setProfileOpen] = useState(false);

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        navigate(ROUTES.LOGIN);
    };

    const mainNav = [
        { to: ROUTES.CASHIER_INVOICES, icon: FileText,  label: t('sidebar.invoiceList') },
        { to: ROUTES.CASHIER_REPORT,   icon: BarChart2, label: t('sidebar.revenueReport') },
    ];

    const bottomNav = [
        { to: ROUTES.CASHIER_PRINTER, icon: Printer,    label: t('sidebar.printerConfig') },
        { to: ROUTES.CASHIER_HELP,    icon: HelpCircle, label: t('sidebar.quickHelp') },
    ];

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
            isActive
                ? 'bg-gray-900 text-white font-medium'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`;

    return (
        <div className="flex h-screen bg-gray-50 font-jakarta overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className="w-52 bg-gray-950 flex flex-col shrink-0 print:hidden">
                <div className="px-5 py-5 border-b border-gray-800">
                    <p className="text-white text-sm font-semibold">{t('sidebar.logo')}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{t('sidebar.subtitle')}</p>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {mainNav.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <Icon size={15} className="shrink-0" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-3 py-4 border-t border-gray-800 space-y-1">
                    {bottomNav.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <Icon size={15} className="shrink-0" />
                            {label}
                        </NavLink>
                    ))}
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="h-14 bg-white border-b border-gray-200 px-8 flex items-center justify-end shrink-0 print:hidden">
                    <div className="relative">
                        <button
                            onClick={() => setProfileOpen(v => !v)}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">{username}</p>
                                <p className="text-xs text-gray-400">{t('header.queuSummary')}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                                {initials}
                            </div>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>

                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                                <button
                                    onClick={() => { setProfileOpen(false); navigate(ROUTES.PROFILE); }}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    <User size={14} /> Trang cá nhân
                                </button>
                                <div className="border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                                    >
                                        <LogOut size={14} /> Đăng xuất
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-gray-50 print:bg-white print:p-0">
                    {children}
                </main>
            </div>
        </div>
    );
}

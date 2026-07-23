// src/components/layout/AdminLayout.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Tag, Users, LogOut } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function AdminLayout({ children }) {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const username = get('username') || 'Admin';

    const handleLogout = () => {
        ['token','refreshToken','role','username','accountId'].forEach(k => {
            localStorage.removeItem(k); sessionStorage.removeItem(k);
        });
        navigate(ROUTES.LOGIN);
    };

    const nav = [
        { to: ROUTES.ADMIN_ROOMS,    icon: Building2, label: t('sidebar.rooms') },
        { to: ROUTES.ADMIN_SERVICES, icon: Tag,       label: t('sidebar.services') },
        { to: ROUTES.ADMIN_ACCOUNTS, icon: Users,     label: t('sidebar.accounts') },
    ];

    const linkClass = ({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive ? 'text-yellow-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
        }`;

    return (
        <div className="flex h-screen bg-white font-jakarta overflow-hidden">
            {/* Sidebar */}
            <aside className="w-52 border-r border-gray-100 flex flex-col shrink-0">
                <div className="px-5 py-5 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">{t('sidebar.logo')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t('sidebar.subtitle')}</p>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {nav.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <span>🏷️</span>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-4 py-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">{t('sidebar.admin')}: {username}</p>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 mt-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={14} />
                        {t('sidebar.logout')}
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-gray-50">
                {children}
            </main>
        </div>
    );
}

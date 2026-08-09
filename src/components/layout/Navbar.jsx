// src/components/layout/Navbar.jsx
import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Calendar, FileText, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { ROUTES } from '@/constants/routes';
import NotificationBell from '@/components/ui/NotificationBell';
import AppPreferencesMenu from '@/components/ui/AppPreferencesMenu';

function useAuth() {
    const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

    const [token, setToken] = useState(() => get('token'));

    // Sync khi storage thay đổi (login/logout từ tab khác)
    useEffect(() => {
        const handler = () => setToken(get('token'));
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    const logout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole'].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        setToken(null);
    };

    // Helper để lấy tên role hiển thị
    const getDisplayRole = () => {
        const role = get('role')?.toUpperCase();
        const systemRole = get('systemRole')?.toUpperCase();

        if (role === 'CUSTOMER') return 'Bệnh nhân';
        if (role === 'STAFF' && systemRole) {
            const roleLabels = {
                DOCTOR: 'Bác sĩ',
                GENERAL_DOCTOR: 'Bác sĩ',
                SPECIALIST_DOCTOR: 'Bác sĩ',
                NURSE: 'Y tá',
                RECEPTIONIST: 'Lễ tân',
                CASHIER: 'Thu ngân',
                CLINIC_MANAGER: 'Quản lý phòng khám',
            };
            return roleLabels[systemRole] || systemRole;
        }
        return role || '';
    };

    return {
        isLoggedIn: !!token,
        role:       get('role'),
        systemRole: get('systemRole'),
        username:   get('username'),
        displayRole: getDisplayRole(),
        logout,
    };
}

export default function Navbar() {
    const { t } = useTranslation('common');
    const { currentLanguage, changeLanguage, languages } = useLanguage();
    const { isLoggedIn, role, systemRole, username, displayRole, logout } = useAuth();
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        setOpen(false);
        logout();
        navigate(ROUTES.LOGIN);
    };

    const menuItems = [
        { icon: User,      label: t('nav.profile'),     to: ROUTES.PROFILE },
        { icon: Calendar,  label: t('nav.myAppointments'), to: ROUTES.MY_APPOINTMENTS },
        { icon: FileText,  label: t('nav.medicalRecord'),  to: ROUTES.MEDICAL_RECORD },
        { icon: Settings,  label: t('nav.settings'),    to: ROUTES.SETTINGS },
    ];

    return (
        <nav className="flex items-center justify-between px-10 h-14 border-b border-gray-200 bg-white sticky top-0 z-50 font-jakarta">

            <Link to={ROUTES.HOME} className="text-sm font-semibold text-gray-900">
                LOGO
            </Link>

            <div className="flex gap-7">
                <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">{t('nav.appointment')}</Link>
                <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">{t('nav.doctors')}</Link>
                <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">{t('nav.pricing')}</Link>
                <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">{t('nav.guide')}</Link>
                <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">{t('nav.contact')}</Link>
            </div>

            <div className="flex items-center gap-2">
                <AppPreferencesMenu />
                {/* Chọn ngôn ngữ */}
                <div className="hidden">
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`text-lg px-1 rounded transition-opacity ${currentLanguage === lang.code ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                        >
                            {lang.flag}
                        </button>
                    ))}
                </div>

                {isLoggedIn ? (
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        
                        {/* ── Avatar + Dropdown ── */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setOpen(v => !v)}
                                className="w-9 h-9 rounded-full bg-primary-500 hover:bg-primary-600 transition-colors flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-primary-300"
                            >
                                <User size={18} />
                            </button>

                            {open && (
                                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">

                                    {/* Role badge */}
                                    {role && (
                                        <div className="px-4 py-2.5 border-b border-gray-100">
                                            <p className="text-xs text-gray-400">{t('nav.loggedInAs')}</p>
                                            <p className="text-sm font-medium text-gray-700">{username}</p>
                                            <p className="text-xs text-gray-400">{displayRole}</p>
                                        </div>
                                    )}

                                    {menuItems.map(({ icon: Icon, label, to }) => (
                                        <Link
                                            key={to}
                                            to={to}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary-500 transition-colors"
                                        >
                                            <Icon size={15} className="shrink-0" />
                                            {label}
                                        </Link>
                                    ))}

                                    <div className="border-t border-gray-100 mt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut size={15} className="shrink-0" />
                                            {t('nav.logout')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ── Login / Register ── */
                    <>
                        <Link to={ROUTES.LOGIN}>
                            <button className="px-4 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:border-primary-500 hover:text-primary-500 transition-colors">
                                {t('nav.login')}
                            </button>
                        </Link>
                        <Link to={ROUTES.REGISTER}>
                            <button className="px-4 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors">
                                {t('nav.register')}
                            </button>
                        </Link>
                    </>
                )}
            </div>

        </nav>
    );
}

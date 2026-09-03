import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CalendarCheck,
    CalendarPlus,
    ClipboardList,
    CreditCard,
    LogOut,
    MapPinned,
    Menu,
    ShieldCheck,
    UserCircle,
    UsersRound,
    WalletCards,
    X,
} from 'lucide-react';

import { ROUTES } from '@/constants/routes';
import { useProfile } from '@/hooks/useProfile';
import ChatWidget from '@/components/ui/ChatWidget';
import NotificationBell from '@/components/ui/NotificationBell';
import AppPreferencesMenu from '@/components/ui/AppPreferencesMenu';
import logoUrl from '@/assets/logo.jpg';

const stored = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

const navigationItems = [
    { to: ROUTES.MY_APPOINTMENTS, icon: CalendarCheck, label: 'Lịch hẹn của tôi' },
    { to: ROUTES.CUSTOMER_FAMILY_MEMBERS, icon: UsersRound, label: 'Thành viên gia đình' },
    { to: ROUTES.CUSTOMER_MEMBERSHIP_CARD, icon: WalletCards, label: 'Thẻ trả trước CareS' },
    { to: ROUTES.WAITING_ROOM, icon: MapPinned, label: 'Hành trình của tôi' },
    { to: ROUTES.CUSTOMER_VISIT_HISTORY, icon: ClipboardList, label: 'Lịch sử khám bệnh' },
    { to: ROUTES.CUSTOMER_PAYMENT, icon: CreditCard, label: 'Lịch sử thanh toán' },
    { to: ROUTES.PROFILE, icon: UserCircle, label: 'Hồ sơ cá nhân' },
];

export default function CustomerLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useProfile();
    const [mobileOpen, setMobileOpen] = useState(false);

    const displayName = profile?.fullName || stored('username') || 'Khách hàng';
    const patientCode = profile?.customerCode || profile?.patientCode || '';
    const initials = displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();

    useEffect(() => setMobileOpen(false), [location.pathname]);

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        navigate(ROUTES.LOGIN);
    };

    const navLinkClass = ({ isActive }) => [
        'cares-customer-nav-link',
        isActive ? 'is-active' : '',
    ].filter(Boolean).join(' ');

    const sidebar = (
        <>
            <button type="button" className="cares-customer-brand" onClick={() => navigate('/')}>
                <img src={logoUrl} alt="CareS" />
                <span>
                    <strong>CareS</strong>
                    <small>Phòng khám đa khoa</small>
                </span>
            </button>

            <div className="cares-customer-identity">
                <span className="cares-customer-avatar">{initials || 'KH'}</span>
                <span className="min-w-0">
                    <strong title={displayName}>{displayName}</strong>
                    <small>{patientCode || 'Khách hàng CareS'}</small>
                </span>
            </div>

            <button
                type="button"
                className="cares-customer-book-button"
                onClick={() => navigate(ROUTES.CUSTOMER_APPOINTMENT)}
            >
                <CalendarPlus size={18} />
                Đặt lịch khám
            </button>

            <nav className="cares-customer-navigation" aria-label="Điều hướng khách hàng">
                {navigationItems.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} className={navLinkClass}>
                        <Icon size={19} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="cares-customer-sidebar-footer">
                <div className="cares-customer-security">
                    <ShieldCheck size={18} />
                    <span>Dữ liệu y tế được bảo vệ</span>
                </div>
                <button type="button" className="cares-customer-logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    Đăng xuất
                </button>
            </div>
        </>
    );

    return (
        <div className="cares-customer-shell print:block print:min-h-0 print:bg-white">
            <aside className="cares-customer-sidebar print:hidden">{sidebar}</aside>

            <header className="cares-customer-mobile-header print:hidden">
                <button type="button" className="cares-customer-mobile-brand" onClick={() => navigate('/')}>
                    <img src={logoUrl} alt="CareS" />
                    <strong>CareS</strong>
                </button>
                <div className="cares-customer-header-actions">
                    <AppPreferencesMenu />
                    <NotificationBell />
                    <button type="button" className="cares-customer-menu-button" onClick={() => setMobileOpen(true)} aria-label="Mở menu">
                        <Menu size={22} />
                    </button>
                </div>
            </header>

            {mobileOpen && (
                <div className="cares-customer-drawer-layer print:hidden" role="dialog" aria-modal="true">
                    <button type="button" className="cares-customer-drawer-backdrop" onClick={() => setMobileOpen(false)} aria-label="Đóng menu" />
                    <aside className="cares-customer-drawer">
                        <button type="button" className="cares-customer-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Đóng menu">
                            <X size={21} />
                        </button>
                        {sidebar}
                    </aside>
                </div>
            )}

            <section className="cares-customer-main">
                <header className="cares-customer-desktop-toolbar print:hidden">
                    <div>
                        <span>Xin chào,</span>
                        <strong>{displayName}</strong>
                    </div>
                    <div className="cares-customer-header-actions">
                        <AppPreferencesMenu />
                        <NotificationBell />
                    </div>
                </header>

                <main className="cares-customer-content print:block print:p-0">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="cares-customer-page"
                    >
                        {children}
                    </motion.div>
                </main>
            </section>

            <div className="print:hidden"><ChatWidget /></div>
        </div>
    );
}

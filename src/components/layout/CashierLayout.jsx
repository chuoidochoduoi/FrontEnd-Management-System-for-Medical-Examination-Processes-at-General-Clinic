import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, FileText, LogOut, Menu, Settings, ShieldCheck, UserRound, Users, WalletCards, X } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import NotificationBell from '@/components/ui/NotificationBell';
import SidebarBrand from './SidebarBrand';
import AppPreferencesMenu from '@/components/ui/AppPreferencesMenu';
import OwnerLayout from './OwnerLayout';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function CashierLayout({ children }) {
    const { t } = useTranslation('cashier');
    const { t: tCommon } = useTranslation('common');
    const navigate = useNavigate();
    const location = useLocation();
    const username = get('username') || 'Thu ngân';
    const staffId = get('staffId');
    const systemRole = get('systemRole') || '';
    const [staffInfo, setStaffInfo] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => setMobileOpen(false), [location.pathname]);
    useEffect(() => {
        if (!staffId) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${staffId}`, { headers: { Authorization: `Bearer ${get('token')}` } })
            .then((res) => res.json()).then((data) => setStaffInfo(data.data || data))
            .catch((error) => console.error('Error fetching staff info:', error));
    }, [staffId]);

    if (systemRole === 'CLINIC_MANAGER') return <OwnerLayout>{children}</OwnerLayout>;

    const displayName = staffInfo?.profile?.fullName || username;
    const roleName = staffInfo?.specialization?.name || tCommon('roles.cashier');
    const initials = displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
    const groups = [
        { label: 'Thanh toán', items: [
            { to: ROUTES.CASHIER_INVOICES, icon: FileText, label: t('sidebar.invoiceList') },
            { to: ROUTES.CASHIER_MEMBERSHIP_TOPUP, icon: WalletCards, label: 'Nạp tiền thẻ CareS' },
        ] },
        { label: 'Cá nhân', items: [
            { to: ROUTES.STAFF_SCHEDULE, icon: CalendarDays, label: tCommon('sidebar.mySchedule') },
            { to: ROUTES.STAFF_PROFILE, icon: Users, label: tCommon('sidebar.profile') },
            { to: ROUTES.SETTINGS, icon: Settings, label: tCommon('sidebar.settings') },
        ] },
    ];

    const logout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach((key) => { localStorage.removeItem(key); sessionStorage.removeItem(key); });
        navigate(ROUTES.LOGIN);
    };
    const linkClass = ({ isActive }) => `cares-workspace-nav-link${isActive ? ' is-active' : ''}`;
    const sidebar = <>
        <button type="button" className="cares-workspace-brand" onClick={() => navigate(ROUTES.CASHIER_INVOICES)}><SidebarBrand /></button>
        <div className="cares-workspace-identity"><span className="cares-workspace-avatar">{initials || 'TN'}</span><span><strong>{displayName}</strong><small>{roleName}</small></span></div>
        <nav className="cares-workspace-navigation" aria-label="Điều hướng thu ngân">{groups.map((group) => <section key={group.label}><p>{group.label}</p>{group.items.map(({ to, icon: Icon, label }) => <NavLink key={to} to={to} className={linkClass}><Icon size={20}/><span>{label}</span></NavLink>)}</section>)}</nav>
        <div className="cares-workspace-sidebar-footer"><div><ShieldCheck size={18}/><span>Giao dịch được bảo vệ</span></div><button type="button" onClick={logout}><LogOut size={19}/>Đăng xuất</button></div>
    </>;

    return <div className="cares-workspace-shell print:block print:min-h-0 print:bg-white">
        <aside className="cares-workspace-sidebar print:hidden">{sidebar}</aside>
        <header className="cares-workspace-mobile-header print:hidden"><button type="button" onClick={() => navigate(ROUTES.CASHIER_INVOICES)}><span><WalletCards size={21}/></span><strong>CareS</strong></button><div><AppPreferencesMenu/><NotificationBell/><button type="button" onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Menu size={23}/></button></div></header>
        {mobileOpen && <div className="cares-workspace-drawer-layer print:hidden" role="dialog" aria-modal="true"><button type="button" className="cares-workspace-drawer-backdrop" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"/><aside className="cares-workspace-drawer"><button type="button" className="cares-workspace-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X size={22}/></button>{sidebar}</aside></div>}
        <section className="cares-workspace-main"><header className="cares-workspace-toolbar print:hidden"><div><span>Không gian làm việc thu ngân</span><strong>Xin chào, {displayName}</strong></div><div><AppPreferencesMenu/><NotificationBell/><button type="button" className="cares-workspace-profile" onClick={() => navigate(ROUTES.STAFF_PROFILE)} aria-label="Mở hồ sơ"><UserRound size={20}/></button></div></header><main className="cares-workspace-content print:block print:p-0"><div className="cares-workspace-page cares-cashier-page">{children}</div></main></section>
    </div>;
}

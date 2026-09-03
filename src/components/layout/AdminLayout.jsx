import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, BellRing, Building2, CalendarDays, Clock, LogOut, MapPin, Menu, Settings, ShieldCheck, Tag, UserRound, Users, WalletCards, Wrench, X } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import NotificationBell from '@/components/ui/NotificationBell';
import SidebarBrand from './SidebarBrand';
import AppPreferencesMenu from '@/components/ui/AppPreferencesMenu';
import OwnerLayout from './OwnerLayout';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function AdminLayout({ children }) {
    const { t } = useTranslation('admin');
    const { t: tCommon } = useTranslation('common');
    const navigate = useNavigate();
    const location = useLocation();
    const username = get('username') || 'Quản trị viên';
    const staffId = get('staffId');
    const systemRole = get('systemRole') || '';
    const [staffInfo, setStaffInfo] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => setMobileOpen(false), [location.pathname]);
    useEffect(() => {
        if (!staffId) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${staffId}`, { headers: { Authorization: `Bearer ${get('token')}` } })
            .then((response) => response.json()).then((data) => setStaffInfo(data.data || data))
            .catch((error) => console.error('Error fetching staff info:', error));
    }, [staffId]);

    if (systemRole === 'CLINIC_MANAGER') return <OwnerLayout>{children}</OwnerLayout>;

    const displayName = staffInfo?.profile?.fullName || username;
    const roleName = tCommon('roles.admin');
    const initials = displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
    const groups = [
        { label: 'Cấu hình cơ sở', items: [
            { to: ROUTES.ADMIN_ROOMS, icon: Building2, label: t('sidebar.rooms') },
            { to: ROUTES.ADMIN_SERVICES, icon: Tag, label: t('sidebar.services') },
            { to: ROUTES.ADMIN_CAPABILITIES, icon: Wrench, label: tCommon('sidebar.capabilities') },
            { to: ROUTES.ADMIN_SHIFTS, icon: Clock, label: tCommon('sidebar.shiftConfig') },
            { to: ROUTES.ADMIN_SCHEDULE, icon: CalendarDays, label: 'Phân công lịch trực' },
        ] },
        { label: 'Hệ thống', items: [
            { to: ROUTES.ADMIN_ACCOUNTS, icon: Users, label: t('sidebar.accounts') },
            { to: ROUTES.ADMIN_CLINIC_INFORMATION, icon: MapPin, label: 'Thông tin phòng khám' },
            { to: ROUTES.ADMIN_MEMBERSHIP_POLICY, icon: WalletCards, label: 'Chính sách thẻ CareS' },
            { to: ROUTES.ADMIN_PUBLIC_ANNOUNCEMENTS, icon: BellRing, label: 'Thông báo công khai' },
            { to: ROUTES.ADMIN_AUDIT_LOGS, icon: Activity, label: tCommon('sidebar.auditLogs') },
        ] },
        { label: 'Cá nhân', items: [
            { to: ROUTES.STAFF_PROFILE, icon: UserRound, label: tCommon('sidebar.profile') || 'Hồ sơ cá nhân' },
            { to: ROUTES.SETTINGS, icon: Settings, label: tCommon('sidebar.settings') },
        ] },
    ];
    const logout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach((key) => { localStorage.removeItem(key); sessionStorage.removeItem(key); });
        navigate(ROUTES.LOGIN);
    };
    const linkClass = ({ isActive }) => `cares-workspace-nav-link${isActive ? ' is-active' : ''}`;
    const sidebar = <>
        <button type="button" className="cares-workspace-brand" onClick={() => navigate(ROUTES.ADMIN_ROOMS)}><SidebarBrand/></button>
        <div className="cares-workspace-identity"><span className="cares-workspace-avatar">{initials || 'AD'}</span><span><strong>{displayName}</strong><small>{roleName}</small></span></div>
        <nav className="cares-workspace-navigation" aria-label="Điều hướng quản trị hệ thống">{groups.map((group) => <section key={group.label}><p>{group.label}</p>{group.items.map(({ to, icon: Icon, label }) => <NavLink key={to} to={to} className={linkClass}><Icon size={20}/><span>{label}</span></NavLink>)}</section>)}</nav>
        <div className="cares-workspace-sidebar-footer"><div><ShieldCheck size={18}/><span>Khu vực quản trị bảo mật</span></div><button type="button" onClick={logout}><LogOut size={19}/>Đăng xuất</button></div>
    </>;

    return <div className="cares-workspace-shell">
        <aside className="cares-workspace-sidebar">{sidebar}</aside>
        <header className="cares-workspace-mobile-header"><button type="button" onClick={() => navigate(ROUTES.ADMIN_ROOMS)}><span><Settings size={21}/></span><strong>CareS Admin</strong></button><div><AppPreferencesMenu/><NotificationBell/><button type="button" onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Menu size={23}/></button></div></header>
        {mobileOpen && <div className="cares-workspace-drawer-layer" role="dialog" aria-modal="true"><button type="button" className="cares-workspace-drawer-backdrop" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"/><aside className="cares-workspace-drawer"><button type="button" className="cares-workspace-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X size={22}/></button>{sidebar}</aside></div>}
        <section className="cares-workspace-main"><header className="cares-workspace-toolbar"><div><span>Quản trị hệ thống CareS</span><strong>Xin chào, {displayName}</strong></div><div><AppPreferencesMenu/><NotificationBell/><button type="button" className="cares-workspace-profile" onClick={() => navigate(ROUTES.STAFF_PROFILE)} aria-label="Mở hồ sơ"><UserRound size={20}/></button></div></header><main className="cares-workspace-content"><div className="cares-workspace-page cares-admin-page">{children}</div></main></section>
    </div>;
}

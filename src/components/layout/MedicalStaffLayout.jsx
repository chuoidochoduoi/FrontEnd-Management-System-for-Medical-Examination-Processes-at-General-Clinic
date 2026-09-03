import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Stethoscope, UserRound, Users, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import NotificationBell from '@/components/ui/NotificationBell';
import { useMyDepartment } from '@/hooks/useMyDepartment';
import SidebarBrand from './SidebarBrand';
import AppPreferencesMenu from '@/components/ui/AppPreferencesMenu';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function MedicalStaffLayout({ children }) {
    const { t } = useTranslation('doctor');
    const { t: tCommon } = useTranslation('common');
    const navigate = useNavigate();
    const location = useLocation();
    const reduceMotion = useReducedMotion();
    const username = get('username') || 'Nhân viên y tế';
    const staffId = get('staffId');
    const systemRole = get('systemRole') || '';
    const [staffInfo, setStaffInfo] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { myDepartment } = useMyDepartment();

    useEffect(() => setMobileOpen(false), [location.pathname]);
    useEffect(() => {
        if (!staffId) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${staffId}`, { headers: { Authorization: `Bearer ${get('token')}` } })
            .then((res) => res.json()).then((data) => setStaffInfo(data.data || data))
            .catch((error) => console.error('Error fetching staff info:', error));
    }, [staffId]);

    const isDoctor = ['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR'].includes(systemRole);
    const displayName = staffInfo?.profile?.fullName || username;
    const roleName = staffInfo?.specialization?.name || (systemRole === 'NURSE' ? tCommon('roles.nurse') : isDoctor ? tCommon('roles.doctor') : tCommon('roles.medicalStaff'));
    const initials = displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
    const groups = [
        { label: 'Khám bệnh', items: [{ to: ROUTES.DOCTOR_ROOMS, icon: LayoutDashboard, label: t('sidebar.departments') }] },
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
        <button type="button" className="cares-workspace-brand" onClick={() => navigate(ROUTES.DOCTOR_ROOMS)}><SidebarBrand/></button>
        <div className="cares-workspace-identity"><span className="cares-workspace-avatar">{initials || (isDoctor ? 'BS' : 'YT')}</span><span><strong>{displayName}</strong><small>{roleName}</small>{myDepartment && <em>{myDepartment.roomCode || '—'} · {myDepartment.name}</em>}</span></div>
        <nav className="cares-workspace-navigation" aria-label="Điều hướng nhân viên y tế">{groups.map((group) => <section key={group.label}><p>{group.label}</p>{group.items.map(({ to, icon: Icon, label }) => <NavLink key={to} to={to} className={linkClass}><Icon size={20}/><span>{label}</span></NavLink>)}</section>)}</nav>
        <div className="cares-workspace-sidebar-footer"><div><ShieldCheck size={18}/><span>Dữ liệu y tế được bảo vệ</span></div><button type="button" onClick={logout}><LogOut size={19}/>Đăng xuất</button></div>
    </>;

    return <div className="cares-workspace-shell">
        <aside className="cares-workspace-sidebar">{sidebar}</aside>
        <header className="cares-workspace-mobile-header"><button type="button" onClick={() => navigate(ROUTES.DOCTOR_ROOMS)}><span><Stethoscope size={21}/></span><strong>CareS</strong></button><div><AppPreferencesMenu/><NotificationBell/><button type="button" onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Menu size={23}/></button></div></header>
        {mobileOpen && <div className="cares-workspace-drawer-layer" role="dialog" aria-modal="true"><button type="button" className="cares-workspace-drawer-backdrop" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"/><aside className="cares-workspace-drawer"><button type="button" className="cares-workspace-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X size={22}/></button>{sidebar}</aside></div>}
        <section className="cares-workspace-main"><header className="cares-workspace-toolbar"><div><span>{isDoctor ? 'Không gian khám bệnh' : 'Không gian hỗ trợ chuyên môn'}</span><strong>Xin chào, {displayName}</strong></div><div><AppPreferencesMenu/><NotificationBell/><button type="button" className="cares-workspace-profile" onClick={() => navigate(ROUTES.STAFF_PROFILE)} aria-label="Mở hồ sơ"><UserRound size={20}/></button></div></header><motion.main key={location.pathname} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }} className="cares-workspace-content"><div className="cares-workspace-page cares-medical-page">{children}</div></motion.main></section>
    </div>;
}

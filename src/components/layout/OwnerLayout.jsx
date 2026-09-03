import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, BarChart2, BellRing, Building2, CalendarDays, ClipboardList, Clock, FilePlus, FileText, FolderOpen, LifeBuoy, ListChecks, LogOut, MapPin, MapPinned, Menu, MessageSquare, MonitorUp, Settings, ShieldCheck, Tag, UserRound, Users, WalletCards, Wrench, X } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import NotificationBell from '@/components/ui/NotificationBell';
import SidebarBrand from './SidebarBrand';
import AppPreferencesMenu from '@/components/ui/AppPreferencesMenu';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function OwnerLayout({ children }) {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const location = useLocation();
    const username = get('username') || 'Quản lý phòng khám';
    const staffId = get('staffId');
    const [staffInfo, setStaffInfo] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => setMobileOpen(false), [location.pathname]);
    useEffect(() => {
        if (!staffId) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${staffId}`, { headers: { Authorization: `Bearer ${get('token')}` } })
            .then((response) => response.json()).then((data) => setStaffInfo(data.data || data))
            .catch((error) => console.error('Error fetching staff info:', error));
    }, [staffId]);

    const displayName = staffInfo?.profile?.fullName || username;
    const roleName = staffInfo?.specialization?.name || t('roles.manager');
    const initials = displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
    const groups = [
        { label: 'Tổng quan', items: [
            { to: ROUTES.OWNER_REPORT, icon: BarChart2, label: t('sidebar.statistics') },
            { to: ROUTES.OWNER_SCHEDULE, icon: CalendarDays, label: 'Phân công lịch trực' },
        ] },
        { label: 'Cấu hình phòng khám', items: [
            { to: ROUTES.ADMIN_ROOMS, icon: Building2, label: 'Quản lý phòng' },
            { to: ROUTES.ADMIN_SERVICES, icon: Tag, label: 'Quản lý dịch vụ' },
            { to: ROUTES.ADMIN_CAPABILITIES, icon: Wrench, label: 'Danh mục kỹ thuật' },
            { to: ROUTES.ADMIN_SHIFTS, icon: Clock, label: 'Cấu hình ca' },
            { to: ROUTES.CLINICAL_FORM_TEMPLATES, icon: ListChecks, label: 'Biểu mẫu kết quả CLS' },
            { to: ROUTES.ADMIN_CLINIC_INFORMATION, icon: MapPin, label: 'Thông tin phòng khám' },
        ] },
        { label: 'Nhân sự và hệ thống', items: [
            { to: ROUTES.MANAGER_STAFF, icon: Users, label: t('sidebar.staff') },
            { to: ROUTES.ADMIN_ACCOUNTS, icon: UserRound, label: 'Quản lý tài khoản' },
            { to: ROUTES.ADMIN_MEMBERSHIP_POLICY, icon: WalletCards, label: 'Chính sách thẻ CareS' },
            { to: ROUTES.ADMIN_PUBLIC_ANNOUNCEMENTS, icon: BellRing, label: 'Thông báo công khai' },
            { to: ROUTES.ADMIN_AUDIT_LOGS, icon: Activity, label: 'Nhật ký hệ thống' },
        ] },
        { label: 'Vận hành', items: [
            { to: ROUTES.RECEPTIONIST_CHECKIN, icon: ClipboardList, label: 'Tiếp đón & Check-in' },
            { to: ROUTES.RECEPTIONIST_CREATE_TICKET, icon: FilePlus, label: 'Tạo phiếu khám' },
            { to: ROUTES.RECEPTIONIST_VISITS, icon: ClipboardList, label: 'Quản lý phiếu khám' },
            { to: ROUTES.MANAGER_PATIENTS, icon: UserRound, label: t('sidebar.patients') },
            { to: ROUTES.RECEPTIONIST_RECORDS, icon: FolderOpen, label: 'Quản lý bệnh nhân' },
            { to: ROUTES.RECEPTIONIST_FOLLOW_UPS, icon: CalendarDays, label: 'Quản lý tái khám' },
            { to: ROUTES.PATIENT_JOURNEYS, icon: MapPinned, label: 'Điều phối bệnh nhân' },
            { to: ROUTES.QUEUE_DISPLAY_LAUNCHER, icon: MonitorUp, label: 'Màn hình gọi tên' },
            { to: ROUTES.CASHIER_INVOICES, icon: FileText, label: 'Hóa đơn & thanh toán' },
            { to: ROUTES.CASHIER_MEMBERSHIP_TOPUP, icon: WalletCards, label: 'Nạp tiền thẻ CareS' },
        ] },
        { label: 'Chăm sóc khách hàng', items: [
            { to: ROUTES.RECEPTIONIST_FEEDBACKS, icon: MessageSquare, label: 'Đánh giá liên quan' },
            { to: ROUTES.RECEPTIONIST_SUPPORT, icon: LifeBuoy, label: 'Hỗ trợ trực tuyến' },
        ] },
        { label: 'Cá nhân', items: [
            { to: ROUTES.STAFF_PROFILE, icon: UserRound, label: t('sidebar.profile') || 'Hồ sơ cá nhân' },
            { to: ROUTES.SETTINGS, icon: Settings, label: t('sidebar.settings') },
        ] },
    ];
    const logout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach((key) => { localStorage.removeItem(key); sessionStorage.removeItem(key); });
        navigate(ROUTES.LOGIN);
    };
    const linkClass = ({ isActive }) => `cares-workspace-nav-link${isActive ? ' is-active' : ''}`;
    const sidebar = <>
        <button type="button" className="cares-workspace-brand" onClick={() => navigate(ROUTES.OWNER_REPORT)}><SidebarBrand/></button>
        <div className="cares-workspace-identity"><span className="cares-workspace-avatar">{initials || 'QL'}</span><span><strong>{displayName}</strong><small>{roleName}</small></span></div>
        <nav className="cares-workspace-navigation" aria-label="Điều hướng quản lý phòng khám">{groups.map((group) => <section key={group.label}><p>{group.label}</p>{group.items.map(({ to, icon: Icon, label }) => <NavLink key={to} to={to} className={linkClass}><Icon size={20}/><span>{label}</span></NavLink>)}</section>)}</nav>
        <div className="cares-workspace-sidebar-footer"><div><ShieldCheck size={18}/><span>Vận hành phòng khám an toàn</span></div><button type="button" onClick={logout}><LogOut size={19}/>Đăng xuất</button></div>
    </>;

    return <div className="cares-workspace-shell print:block print:min-h-0 print:bg-white">
        <aside className="cares-workspace-sidebar print:hidden">{sidebar}</aside>
        <header className="cares-workspace-mobile-header print:hidden"><button type="button" onClick={() => navigate(ROUTES.OWNER_REPORT)}><span><Building2 size={21}/></span><strong>CareS Manager</strong></button><div><AppPreferencesMenu/><NotificationBell/><button type="button" onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Menu size={23}/></button></div></header>
        {mobileOpen && <div className="cares-workspace-drawer-layer print:hidden" role="dialog" aria-modal="true"><button type="button" className="cares-workspace-drawer-backdrop" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"/><aside className="cares-workspace-drawer"><button type="button" className="cares-workspace-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X size={22}/></button>{sidebar}</aside></div>}
        <section className="cares-workspace-main"><header className="cares-workspace-toolbar print:hidden"><div><span>Điều hành phòng khám CareS</span><strong>Xin chào, {displayName}</strong></div><div><AppPreferencesMenu/><NotificationBell/><button type="button" className="cares-workspace-profile" onClick={() => navigate(ROUTES.STAFF_PROFILE)} aria-label="Mở hồ sơ"><UserRound size={20}/></button></div></header><main className="cares-workspace-content print:block print:p-0"><div className="cares-workspace-page cares-owner-page">{children}</div></main></section>
    </div>;
}

import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ClipboardCheck, ClipboardList, FilePlus, FolderOpen, LifeBuoy, LogOut, MapPinned, Menu, MessageSquare, MonitorUp, Settings, ShieldCheck, UserRound, Users, X } from 'lucide-react';
import { toast } from 'react-toastify';

import { ROUTES } from '@/constants/routes';
import NotificationBell from '@/components/ui/NotificationBell';
import AppPreferencesMenu from '@/components/ui/AppPreferencesMenu';
import { useWebSocket } from '@/hooks/useWebSocket';
import useFeedbackCount from '@/hooks/useFeedbackCount';
import SidebarBrand from './SidebarBrand';
import OwnerLayout from './OwnerLayout';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function ReceptionistLayout({ children }) {
    const { t } = useTranslation('receptionist');
    const { t: tCommon } = useTranslation('common');
    const navigate = useNavigate();
    const location = useLocation();
    const username = get('username') || 'Lễ tân';
    const accountId = get('accountId');
    const systemRole = get('systemRole') || '';
    const [staffInfo, setStaffInfo] = useState(null);
    const [hasNewChat, setHasNewChat] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const feedbackCount = useFeedbackCount(systemRole === 'RECEPTIONIST');

    useWebSocket('/topic/receptionist-chat', null, (msg) => {
        if (msg === 'NEW_CHAT_REQUEST' || msg === 'NEW_MESSAGE') {
            if (location.pathname !== ROUTES.RECEPTIONIST_SUPPORT) {
                setHasNewChat(true);
                if (msg === 'NEW_CHAT_REQUEST') {
                    toast.info(t('notifications.newSupport', { defaultValue: 'Có yêu cầu hỗ trợ mới!' }), { position: 'top-right', autoClose: 4000 });
                }
            }
        }
    });

    useEffect(() => {
        setMobileOpen(false);
        if (location.pathname === ROUTES.RECEPTIONIST_SUPPORT) setHasNewChat(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!accountId) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/account/${accountId}`, {
            headers: { Authorization: `Bearer ${get('token')}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Không thể tải hồ sơ lễ tân');
                return res.json();
            })
            .then((data) => setStaffInfo(data.data || data))
            .catch((error) => console.error('Error fetching staff info:', error));
    }, [accountId]);

    const displayName = staffInfo?.profile?.fullName || username;
    const roleName = staffInfo?.specialization?.name || tCommon('roles.receptionist');
    const initials = displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
    const navigationGroups = [
        { label: 'Tiếp đón', items: [
            { to: ROUTES.RECEPTIONIST_CHECKIN, icon: ClipboardCheck, label: 'Tiếp đón & Check-in' },
            { to: ROUTES.RECEPTIONIST_CREATE_TICKET, icon: FilePlus, label: t('sidebar.createTicket') },
            { to: ROUTES.RECEPTIONIST_VISITS, icon: ClipboardList, label: 'Quản lý phiếu khám' },
        ] },
        { label: 'Bệnh nhân', items: [
            { to: ROUTES.RECEPTIONIST_RECORDS, icon: FolderOpen, label: t('sidebar.manageRecords') },
            { to: ROUTES.PATIENT_JOURNEYS, icon: MapPinned, label: tCommon('sidebar.patientFlow') },
        ] },
        { label: 'Vận hành', items: [
            { to: ROUTES.QUEUE_DISPLAY_LAUNCHER, icon: MonitorUp, label: 'Màn hình gọi tên' },
        ] },
        { label: 'Sau khám', items: [
            { to: ROUTES.RECEPTIONIST_FOLLOW_UPS, icon: CalendarDays, label: 'Quản lý tái khám' },
            { to: ROUTES.RECEPTIONIST_FEEDBACKS, icon: MessageSquare, label: 'Đánh giá liên quan', badge: feedbackCount },
            { to: ROUTES.RECEPTIONIST_SUPPORT, icon: LifeBuoy, label: 'Hỗ trợ trực tuyến', badge: hasNewChat ? '•' : null },
        ] },
        { label: 'Cá nhân', items: [
            { to: ROUTES.STAFF_SCHEDULE, icon: CalendarDays, label: tCommon('sidebar.mySchedule') },
            { to: ROUTES.STAFF_PROFILE, icon: Users, label: tCommon('sidebar.profile') },
            { to: ROUTES.SETTINGS, icon: Settings, label: tCommon('sidebar.settings') },
        ] },
    ];

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        navigate(ROUTES.LOGIN);
    };

    const navLinkClass = ({ isActive }) => `cares-reception-nav-link${isActive ? ' is-active' : ''}`;
    const sidebarContent = <>
        <button type="button" className="cares-reception-brand" onClick={() => navigate(ROUTES.RECEPTIONIST_CHECKIN)}><SidebarBrand /></button>
        <div className="cares-reception-identity">
            <span className="cares-reception-avatar">{initials || 'LT'}</span>
            <span className="min-w-0"><strong title={displayName}>{displayName}</strong><small>{roleName}</small></span>
        </div>
        <nav className="cares-reception-navigation" aria-label="Điều hướng lễ tân">
            {navigationGroups.map((group) => <section key={group.label}>
                <p>{group.label}</p>
                {group.items.map(({ to, icon: Icon, label, badge }) => <NavLink key={to} to={to} className={navLinkClass}>
                    <Icon size={20} /><span>{label}</span>
                    {badge && <b className={badge === '•' ? 'is-dot' : ''}>{badge === '•' ? '' : badge > 99 ? '99+' : badge}</b>}
                </NavLink>)}
            </section>)}
        </nav>
        <div className="cares-reception-sidebar-footer">
            <div><ShieldCheck size={18} /><span>Dữ liệu y tế được bảo vệ</span></div>
            <button type="button" onClick={handleLogout}><LogOut size={19} />Đăng xuất</button>
        </div>
    </>;

    if (systemRole === 'CLINIC_MANAGER') return <OwnerLayout>{children}</OwnerLayout>;

    return <div className="cares-reception-shell print:block print:min-h-0 print:bg-white">
        <aside className="cares-reception-sidebar print:hidden">{sidebarContent}</aside>
        <header className="cares-reception-mobile-header print:hidden">
            <button type="button" onClick={() => navigate(ROUTES.RECEPTIONIST_CHECKIN)}><span className="cares-reception-mobile-mark"><ClipboardCheck size={21} /></span><strong>CareS</strong></button>
            <div><AppPreferencesMenu /><NotificationBell /><button type="button" onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Menu size={23} /></button></div>
        </header>
        {mobileOpen && <div className="cares-reception-drawer-layer print:hidden" role="dialog" aria-modal="true">
            <button type="button" className="cares-reception-drawer-backdrop" onClick={() => setMobileOpen(false)} aria-label="Đóng menu" />
            <aside className="cares-reception-drawer"><button type="button" className="cares-reception-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X size={22} /></button>{sidebarContent}</aside>
        </div>}
        <section className="cares-reception-main">
            <header className="cares-reception-toolbar print:hidden">
                <div><span>Không gian làm việc lễ tân</span><strong>Xin chào, {displayName}</strong></div>
                <div><AppPreferencesMenu /><NotificationBell /><button type="button" className="cares-reception-profile-shortcut" onClick={() => navigate(ROUTES.STAFF_PROFILE)} aria-label="Mở hồ sơ"><UserRound size={20} /></button></div>
            </header>
            <main className="cares-reception-content print:block print:p-0"><div className="cares-reception-page">{children}</div></main>
        </section>
    </div>;
}

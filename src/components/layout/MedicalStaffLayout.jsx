// src/components/layout/MedicalStaffLayout.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, FolderOpen, Settings, LogOut, FlaskConical } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function MedicalStaffLayout({ children }) {
    const { t } = useTranslation('doctor');
    const navigate = useNavigate();
    const username = get('username') || 'BĂ¡c sÄ©';
    const staffId = get('staffId');
    const systemRole = get('systemRole') || '';
    
    const [staffInfo, setStaffInfo] = useState(null);

    useEffect(() => {
        if (staffId) {
            fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${staffId}`, {
                headers: { Authorization: `Bearer ${get('token')}` }
            })
            .then(res => res.json())
            .then(data => {
                // TĂ¹y theo cáº¥u trĂºc RestResponses cá»§a backend (thÆ°á»ng lĂ  data.data)
                if (data.data) {
                    setStaffInfo(data.data);
                } else {
                    setStaffInfo(data);
                }
            })
            .catch(err => console.error("Error fetching staff info:", err));
        }
    }, [staffId]);

    // Format specialization / role
    const getRoleName = () => {
        if (staffInfo) {
            if (staffInfo.specialization) return staffInfo.specialization.name;
            if (systemRole === 'NURSE') return 'Y tĂ¡';
            if (systemRole === 'RECEPTIONIST') return 'Lá»… tĂ¢n';
            if (systemRole === 'GENERAL_DOCTOR') return 'BĂ¡c sÄ© Ä‘a khoa';
            if (systemRole === 'SPECIALIST_DOCTOR') return 'BĂ¡c sÄ© chuyĂªn khoa';
        }
        return 'NhĂ¢n viĂªn y táº¿';
    };

    const handleLogout = () => {
        ['token', 'refreshToken', 'role', 'username', 'accountId', 'systemRole', 'staffId'].forEach(k => {
            localStorage.removeItem(k); sessionStorage.removeItem(k);
        });
        navigate(ROUTES.LOGIN);
    };

    const mainNav = [
        { to: ROUTES.DOCTOR_ROOMS, icon: LayoutDashboard, label: t('sidebar.departments') },
        { to: ROUTES.STAFF_SCHEDULE, icon: () => <span className="text-gray-500">đŸ“…</span>, label: 'Lá»‹ch trá»±c cá»§a tĂ´i' },
        { to: ROUTES.STAFF_PROFILE, icon: Users, label: 'Há»“ sÆ¡ cĂ¡ nhĂ¢n' },
    ];

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`;

    return (
        <div className="flex h-screen bg-gray-50 font-jakarta overflow-hidden">
            {/* Sidebar */}
            <aside className="w-44 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="px-4 py-5 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">{t('sidebar.logo')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t('sidebar.subtitle')}</p>
                </div>

                {/* Avatar */}
                <div className="px-4 py-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                        <Users className="text-blue-500 w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 break-words">
                        {staffInfo?.profile?.fullName || username}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{getRoleName()}</p>
                </div>

                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                    {mainNav.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <Icon size={15} className="shrink-0" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
                    <NavLink to={ROUTES.SETTINGS} className={linkClass}>
                        <Settings size={15} className="shrink-0" />
                        Cài đặt
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={15} className="shrink-0" />
                        {t('sidebar.logout')}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                {children}
            </div>
        </div>
    );
}



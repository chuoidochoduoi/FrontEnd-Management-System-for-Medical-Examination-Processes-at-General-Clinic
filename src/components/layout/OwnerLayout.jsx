// src/components/layout/OwnerLayout.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const OwnerLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { path: ROUTES.OWNER_REPORT, label: 'Thống kê', icon: '📊' },
        { path: ROUTES.OWNER_SCHEDULE, label: 'Lịch trình', icon: '📅' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('systemRole');
        navigate(ROUTES.LOGIN);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-lg font-semibold text-gray-900">MediFlow</h1>
                    <p className="text-xs text-gray-500 mt-1">Clinic Owner</p>
                </div>
                <nav className="flex-1 p-4">
                    {menuItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                                location.pathname === item.path
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 w-full"
                    >
                        <span>🚪</span>
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
};

export default OwnerLayout;
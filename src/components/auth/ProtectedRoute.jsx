// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

// Mapping role + systemRole sang route mặc định
const roleToRoute = {
    // ADMIN role
    ADMIN: ROUTES.ADMIN_ROOMS,
    // CUSTOMER role - patient pages, defaults to profile
    CUSTOMER: ROUTES.PROFILE,
};

const systemRoleToRoute = {
    RECEPTIONIST: ROUTES.RECEPTIONIST_CHECKIN,
    GENERAL_DOCTOR: ROUTES.DOCTOR_DEPARTMENTS,
    SPECIALIST_DOCTOR: ROUTES.DOCTOR_DEPARTMENTS,
    NURSE: ROUTES.DOCTOR_DEPARTMENTS,
    CASHIER: ROUTES.CASHIER_INVOICES,
    CLINIC_MANAGER: ROUTES.OWNER_REPORT,
};

const adminRoleToRoute = {
    ADMIN: ROUTES.ADMIN_ROOMS,
};

// Helper để lấy systemRole hiện tại
const getSystemRole = () => get('systemRole')?.toUpperCase() || null;

// Helper để kiểm tra role có hợp lệ cho allowedRoles không
const isRoleAllowed = (allowedRoles) => {
    const role = get('role')?.toUpperCase();
    const systemRole = getSystemRole();

    if (!allowedRoles || allowedRoles.length === 0) return true;

    // Kiểm tra ADMIN role
    if (allowedRoles.includes('ADMIN') && role === 'ADMIN') {
        return true;
    }

    // Kiểm tra CUSTOMER role
    if (allowedRoles.includes('CUSTOMER') && role === 'CUSTOMER') {
        return true;
    }

    // Kiểm tra CLINIC_MANAGER role (staff với systemRole CLINIC_MANAGER hoặc role trực tiếp)
    if (role === 'CLINIC_MANAGER' || systemRole === 'CLINIC_MANAGER') {
        return allowedRoles.includes('CLINIC_MANAGER');
    }

    // Kiểm tra STAFF role với systemRoles khác
    if (role === 'STAFF' && systemRole && !['CLINIC_MANAGER'].includes(systemRole)) {
        return allowedRoles.some(allowed => {
            // Cho phép role cũ (backward compatibility) hoặc systemRole mới
            const roleMapping = {
                'DOCTOR': ['GENERAL_DOCTOR', 'SPECIALIST_DOCTOR'],
                'NURSE': ['NURSE'],
                'RECEPTIONIST': ['RECEPTIONIST'],
                'CASHIER': ['CASHIER'],
            };

            // Nếu allowed role là role cũ (DOCTOR, NURSE, v.v.), map sang systemRole
            if (roleMapping[allowed] && roleMapping[allowed].includes(systemRole)) {
                return true;
            }

            // Nếu allowed role là systemRole mới
            if (allowed === systemRole) {
                return true;
            }

            return false;
        });
    }

    return allowedRoles.includes(role);
};

// Helper để lấy route mặc định dựa trên role hiện tại
const getDefaultRoute = () => {
    const role = get('role')?.toUpperCase();
    const systemRole = getSystemRole();

    // ADMIN role
    if (role === 'ADMIN') {
        return adminRoleToRoute[role] || ROUTES.ADMIN_ROOMS;
    }

    // CUSTOMER role - mặc định vào trang hồ sơ
    if (role === 'CUSTOMER') {
        return roleToRoute.CUSTOMER || ROUTES.PROFILE;
    }

    // CLINIC_MANAGER role
    if (role === 'CLINIC_MANAGER' || systemRole === 'CLINIC_MANAGER') {
        return systemRoleToRoute.CLINIC_MANAGER || ROUTES.OWNER_REPORT;
    }

    // STAFF role với systemRoles
    if (role === 'STAFF' && systemRole) {
        return systemRoleToRoute[systemRole] || ROUTES.LOGIN;
    }

    return ROUTES.LOGIN;
};

export default function ProtectedRoute({ allowedRoles, children }) {
    const location = useLocation();
    const role = get('role')?.toUpperCase();

    // Chưa đăng nhập
    if (!role && !get('token')) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Kiểm tra quyền truy cập
    if (allowedRoles && !isRoleAllowed(allowedRoles)) {
        const redirectRoute = getDefaultRoute();
        return <Navigate to={redirectRoute} replace />;
    }

    return children;
}
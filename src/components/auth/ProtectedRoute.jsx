// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

// Mapping role sang route mặc định
const roleToRoute = {
    PATIENT: ROUTES.PROFILE,
    RECEPTIONIST: ROUTES.RECEPTION,
    NURSE: ROUTES.QUEUE,
    DOCTOR: ROUTES.QUEUE,
    CASHIER: ROUTES.CASHIER_INVOICES,
    ADMIN: ROUTES.QUEUE,
};

export default function ProtectedRoute({ allowedRoles, children }) {
    const location = useLocation();
    const role = get('role')?.toUpperCase();

    if (!role) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Nếu allowedRoles là mảng và role hiện tại không có trong mảng
    if (allowedRoles && !allowedRoles.includes(role)) {
        // Chuyển về trang phù hợp với role
        const redirectRoute = roleToRoute[role] || ROUTES.LOGIN;
        return <Navigate to={redirectRoute} replace />;
    }

    return children;
}
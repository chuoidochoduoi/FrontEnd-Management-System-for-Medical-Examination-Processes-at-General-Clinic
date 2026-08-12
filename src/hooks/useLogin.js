// src/hooks/useLogin.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { decodeToken } from '@/utils/jwtUtils';

export function useLogin() {
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const navigate              = useNavigate();

    const login = async (identifier, password, remember) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: identifier.trim(), password }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Sai tài khoản hoặc mật khẩu');
            }

            const data = await res.json();
            // data = { accessToken, refreshToken, tokenType, expiresIn, account: { accountId, username, role, systemRole } }

            const storage = remember ? localStorage : sessionStorage;
            storage.setItem('token',          data.accessToken);
            storage.setItem('refreshToken',   data.refreshToken);
            storage.setItem('role',           data.account.role);           // CUSTOMER | STAFF
            storage.setItem('username',       data.account.username);
            storage.setItem('accountId',      data.account.accountId);
            storage.setItem('systemRole',     data.account.systemRole || ''); // DOCTOR | NURSE | RECEPTIONIST | CASHIER | CLINIC_MANAGER | ADMIN | null

            // Decode JWT to extract staffId (sid claim) for staff users
            const decoded = decodeToken(data.accessToken);
            if (decoded?.sid) {
                storage.setItem('staffId', decoded.sid);
            } else {
            }

            // Redirect based on role + systemRole
            const role = data.account.role?.toUpperCase();
            const systemRole = data.account.systemRole?.toUpperCase();

            if (role === 'ADMIN') {
                navigate(ROUTES.ADMIN_ROOMS);
            } else if (role === 'CUSTOMER') {
                navigate(ROUTES.MY_APPOINTMENTS);
            } else if (role === 'STAFF') {
                // Redirect based on systemRole
                if (systemRole === 'RECEPTIONIST') {
                    navigate(ROUTES.RECEPTIONIST_CHECKIN);
                } else if (systemRole === 'NURSE' || ['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR'].includes(systemRole)) {
                    navigate(ROUTES.DOCTOR_ROOMS);
                } else if (systemRole === 'CASHIER') {
                    navigate(ROUTES.CASHIER_INVOICES);
                } else if (systemRole === 'CLINIC_MANAGER' || systemRole === 'ADMIN') {
                    navigate(ROUTES.ADMIN_ROOMS);
                } else {
                    navigate(ROUTES.PROFILE);
                }
            } else {
                navigate(ROUTES.PROFILE);
            }
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return { login, loading, error };
}

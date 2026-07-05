// src/hooks/useLogin.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

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
                body: JSON.stringify({ username: identifier, password }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Sai tài khoản hoặc mật khẩu');
            }

            const data = await res.json();
            // data = { accessToken, refreshToken, tokenType, expiresIn, account: { accountId, username, role } }

            const storage = remember ? localStorage : sessionStorage;
            storage.setItem('token',     data.accessToken);
            storage.setItem('refreshToken', data.refreshToken);
            storage.setItem('role',      data.account.role);
            storage.setItem('username',  data.account.username);
            storage.setItem('accountId', data.account.accountId);

            navigate(ROUTES.PROFILE);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return { login, loading, error };
}
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
                body: JSON.stringify({ identifier, password }),
            });

            if (!res.ok) throw new Error('Sai tài khoản hoặc mật khẩu');

            const data = await res.json();

            const storage = remember ? localStorage : sessionStorage;
            storage.setItem('token', data.token);
            storage.setItem('role', data.role);

            navigate(ROUTES.HOME);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return { login, loading, error };
}
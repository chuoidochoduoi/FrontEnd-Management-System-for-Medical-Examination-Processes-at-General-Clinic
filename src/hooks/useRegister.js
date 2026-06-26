// src/hooks/useRegister.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { validateRegister } from '@/validators/RegisterValidator.js';

export function useRegister() {
    const [loadingSendOtp, setLoadingSendOtp] = useState(false);
    const [loadingRegister, setLoadingRegister] = useState(false);
    const [error, setError]   = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const navigate = useNavigate();

    const sendOtp = async (phone) => {
        setError('');
        setLoadingSendOtp(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });

            if (!res.ok) throw new Error('Không thể gửi mã OTP. Vui lòng thử lại.');

            setOtpSent(true);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoadingSendOtp(false);
        }
    };

    const register = async (phone, otp, password, confirmPassword) => {
        setError('');

        // Validate phía client
        const validationError = validateRegister({ phone, otp, password, confirmPassword });
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoadingRegister(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp, password }),
            });

            if (!res.ok) throw new Error('Đăng ký thất bại. Mã OTP không hợp lệ hoặc đã hết hạn.');

            navigate(ROUTES.LOGIN);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoadingRegister(false);
        }
    };

    return { sendOtp, register, otpSent, loadingSendOtp, loadingRegister, error };
}
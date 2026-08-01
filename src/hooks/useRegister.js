// src/hooks/useRegister.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
            }

            setOtpSent(true);
            toast.success('Đã gửi mã OTP đến số điện thoại của bạn!');
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra');
            toast.error(err.message || 'Lỗi gửi OTP');
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
                body: JSON.stringify({ phone: phone.trim(), otp, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Đăng ký thất bại. Mã OTP không hợp lệ hoặc đã hết hạn.');
            }

            toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
            navigate(ROUTES.LOGIN);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra');
            toast.error(err.message || 'Đăng ký thất bại');
        } finally {
            setLoadingRegister(false);
        }
    };

    return { sendOtp, register, otpSent, loadingSendOtp, loadingRegister, error };
}
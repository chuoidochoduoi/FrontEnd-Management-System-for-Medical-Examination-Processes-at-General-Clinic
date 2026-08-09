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

    const sendOtp = async (identifier) => {
        setError('');
        setLoadingSendOtp(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');

            setOtpSent(true);
            const mockOtp = data.mockOtp ?? data.data?.mockOtp;
            if (mockOtp) toast.success(`Đã gửi mã OTP thành công. Mã OTP giả lập của bạn là: ${mockOtp}`, { autoClose: 15000 });
            else toast.success('Đã gửi mã OTP đến email/số điện thoại của bạn!');
            return { ...data, mockOtp };
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra');
            toast.error(err.message || 'Lỗi gửi OTP');
        } finally {
            setLoadingSendOtp(false);
        }
    };

    const register = async (identifier, otp, password, confirmPassword) => {
        setError('');

        // Validate phía client
        const validationError = validateRegister({ identifier, otp, password, confirmPassword });
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoadingRegister(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: identifier.trim(), otp, password }),
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

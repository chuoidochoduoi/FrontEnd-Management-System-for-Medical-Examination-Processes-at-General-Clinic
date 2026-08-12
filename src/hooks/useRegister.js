// src/hooks/useRegister.js

import { useState } from 'react';
import { toast } from 'react-toastify';

export function useRegister() {
    const [loadingSendOtp, setLoadingSendOtp] = useState(false);
    const [loadingVerifyOtp, setLoadingVerifyOtp] = useState(false);
    const [loadingRegister, setLoadingRegister] = useState(false);

    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const getApiMessage = (data, fallback) => {
        return data?.message || data?.error || fallback;
    };

    // =========================================================
    // 1. GỬI OTP
    // identifier = SĐT hoặc Email
    // =========================================================
    const sendOtp = async (identifier) => {
        setError('');

        if (!identifier || !identifier.trim()) {
            const message = 'Vui lòng nhập số điện thoại hoặc email.';
            setError(message);
            toast.error(message);
            return false;
        }

        setLoadingSendOtp(true);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/send-otp`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        identifier: identifier.trim()
                    })
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    getApiMessage(
                        data,
                        'Không thể gửi mã OTP. Vui lòng thử lại.'
                    )
                );
            }

            setOtpSent(true);

            const mockOtp =
                data?.mockOtp ??
                data?.data?.mockOtp;

            if (mockOtp) {
                toast.success(
                    `Đã gửi OTP. Mã OTP giả lập: ${mockOtp}`,
                    {
                        autoClose: 15000
                    }
                );
            } else {
                toast.success('Đã gửi mã OTP thành công!');
            }

            return true;

        } catch (err) {
            const message =
                err?.message ||
                'Có lỗi xảy ra khi gửi OTP.';

            setError(message);
            toast.error(message);

            return false;

        } finally {
            setLoadingSendOtp(false);
        }
    };

    // =========================================================
    // 2. XÁC THỰC OTP
    // =========================================================
    const verifyOtp = async (identifier, otp) => {
        setError('');

        if (!identifier || !identifier.trim()) {
            const message =
                'Không xác định được số điện thoại hoặc email.';

            setError(message);
            toast.error(message);

            return false;
        }

        if (!otp || !otp.trim()) {
            const message = 'Vui lòng nhập mã OTP.';

            setError(message);
            toast.error(message);

            return false;
        }

        setLoadingVerifyOtp(true);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/verify-register-otp`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        identifier: identifier.trim(),
                        otp: otp.trim()
                    })
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    getApiMessage(
                        data,
                        'Mã OTP không hợp lệ hoặc đã hết hạn.'
                    )
                );
            }

            return true;

        } catch (err) {
            const message =
                err?.message ||
                'Có lỗi xảy ra khi xác thực OTP.';

            setError(message);
            toast.error(message);

            return false;

        } finally {
            setLoadingVerifyOtp(false);
        }
    };

    // =========================================================
    // VALIDATE DỮ LIỆU ĐĂNG KÝ
    //
    // Chỉ cần:
    // - identifier
    // - password
    // - fullName
    //
    // phone hoặc email có thể rỗng tùy phương thức đăng ký
    // =========================================================
    const validateRegisterData = profileData => {
        const {
            identifier,
            password,
            fullName,
            phone,
            email
        } = profileData;

        if (!identifier || !identifier.trim()) {
            return 'Thiếu thông tin xác thực.';
        }

        if (!fullName || !fullName.trim()) {
            return 'Vui lòng nhập họ và tên.';
        }

        if (!password) {
            return 'Vui lòng nhập mật khẩu.';
        }

        if (password.length < 8) {
            return 'Mật khẩu phải có ít nhất 8 ký tự.';
        }

        if (password.length > 64) {
            return 'Mật khẩu không được vượt quá 64 ký tự.';
        }

        // Nếu có phone thì validate phone
        if (phone && phone.trim()) {
            if (!/^(\+84|0)\d{9,10}$/.test(phone.trim())) {
                return 'Số điện thoại không hợp lệ.';
            }
        }

        // Nếu có email thì validate email
        if (email && email.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                return 'Email không hợp lệ.';
            }
        }

        // Phải có ít nhất một trong hai
        if (
            (!phone || !phone.trim()) &&
            (!email || !email.trim())
        ) {
            return 'Phải có số điện thoại hoặc email.';
        }

        return null;
    };

    // =========================================================
    // 3. ĐĂNG KÝ
    // =========================================================
    const register = async profileData => {
        setError('');

        const validationError =
            validateRegisterData(profileData);

        if (validationError) {
            setError(validationError);
            toast.error(validationError);

            return false;
        }

        setLoadingRegister(true);

        try {
            const payload = {
                identifier:
                    profileData.identifier.trim(),

                password:
                profileData.password,

                fullName:
                    profileData.fullName.trim(),

                dob:
                    profileData.dob || null,

                gender:
                    profileData.gender || null,

                phone:
                    profileData.phone?.trim() || '',

                email:
                    profileData.email?.trim().toLowerCase() || '',

                address:
                    profileData.address?.trim() || null
            };

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/register`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    getApiMessage(
                        data,
                        'Đăng ký tài khoản thất bại.'
                    )
                );
            }

            toast.success('Đăng ký tài khoản thành công!');

            return data?.data ?? data;

        } catch (err) {
            const message =
                err?.message ||
                'Có lỗi xảy ra khi đăng ký tài khoản.';

            setError(message);
            toast.error(message);

            return false;

        } finally {
            setLoadingRegister(false);
        }
    };

    return {
        sendOtp,
        verifyOtp,
        register,

        otpSent,

        loadingSendOtp,
        loadingVerifyOtp,
        loadingRegister,

        error
    };
}
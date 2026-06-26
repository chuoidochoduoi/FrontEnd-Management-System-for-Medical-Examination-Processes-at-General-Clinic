// src/pages/auth/RegisterPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useRegister } from '@/hooks/useRegister';
import { ROUTES } from '@/constants/routes';

export default function RegisterPage() {
    const { t } = useTranslation('auth');
    const { t: tCommon } = useTranslation('common');

    const [phone, setPhone]             = useState('');
    const [otp, setOtp]                 = useState('');
    const [password, setPassword]       = useState('');
    const [confirm, setConfirm]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [countdown, setCountdown]     = useState(0);

    const intervalRef = useRef(null);

    const {
        sendOtp,
        register,
        otpSent,
        loadingSendOtp,
        loadingRegister,
        error,
    } = useRegister();

    // Đếm ngược "Gửi lại mã"
    useEffect(() => {
        if (otpSent && countdown === 0) {
            setCountdown(60);
        }
    }, [otpSent]);

    useEffect(() => {
        if (countdown <= 0) {
            clearInterval(intervalRef.current);
            return;
        }
        intervalRef.current = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [countdown]);

    const handleSendOtp = () => {
        sendOtp(phone);
    };

    const handleResendOtp = () => {
        if (countdown > 0) return;
        sendOtp(phone);
        setCountdown(60);
    };

    const handleRegister = () => {
        register(phone, otp, password, confirm);
    };

    return (
        <>
            <Navbar />

            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-jakarta">
                <div className="bg-white border border-gray-200 rounded-xl p-10 w-full max-w-sm">

                    {/* Tiêu đề */}
                    <h2 className="text-xl font-semibold text-center text-gray-900 mb-1">
                        {t('register.title')}
                    </h2>
                    <p className="text-sm text-center text-gray-400 mb-7">
                        {t('register.subtitle')}
                    </p>

                    {/* Số điện thoại */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                            {t('register.phone')}
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="0987654321"
                            className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
                        />
                    </div>

                    {/* Nút gửi OTP */}
                    <button
                        onClick={handleSendOtp}
                        disabled={loadingSendOtp || !phone}
                        className="w-full h-10 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors mb-4"
                    >
                        {loadingSendOtp ? tCommon('loading') : t('register.sendOtp')}
                    </button>

                    {/* Mã OTP */}
                    <div className="mb-4">
                        <label className="flex justify-between items-center text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                            {t('register.otp')}
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={countdown > 0}
                                className="text-primary-500 text-xs normal-case tracking-normal font-normal hover:text-primary-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                {countdown > 0
                                    ? t('register.resendCountdown', { s: countdown })
                                    : t('register.resend')}
                            </button>
                        </label>
                        <input
                            type="text"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            maxLength={6}
                            className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
                        />
                    </div>

                    {/* Mật khẩu */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                            {t('register.password')}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full h-10 px-3 pr-10 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Xác nhận mật khẩu */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                            {t('register.confirmPassword')}
                        </label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
                        />
                    </div>

                    {/* Lỗi */}
                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                    {/* Nút đăng ký */}
                    <button
                        onClick={handleRegister}
                        disabled={loadingRegister}
                        className="w-full h-10 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors mb-4"
                    >
                        {loadingRegister ? tCommon('loading') : t('register.submit')}
                    </button>

                    {/* Quay lại đăng nhập */}
                    <p className="text-center text-sm text-gray-500">
                        <Link to={ROUTES.LOGIN} className="text-primary-500 hover:text-primary-600">
                            {t('register.backToLogin')}
                        </Link>
                    </p>

                </div>
            </div>
        </>
    );
}

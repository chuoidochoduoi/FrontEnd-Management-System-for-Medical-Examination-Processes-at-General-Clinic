// src/pages/auth/RegisterPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ArrowRight, ShieldCheck, HeartPulse, Phone, Mail, Lock, Hash } from 'lucide-react';
import { useRegister } from '@/hooks/useRegister';
import { ROUTES } from '@/constants/routes';
import logoUrl from '@/assets/logo.jpg';

export default function RegisterPage() {
    const { t } = useTranslation('auth');
    const { t: tCommon } = useTranslation('common');

    const [identifier, setIdentifier]   = useState('');
    const [otp, setOtp]                 = useState('');
    const [password, setPassword]       = useState('');
    const [confirm, setConfirm]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [countdown, setCountdown]     = useState(0);
    const [registerMethod, setRegisterMethod] = useState('phone');

    const intervalRef = useRef(null);

    const {
        sendOtp,
        register,
        otpSent,
        loadingSendOtp,
        loadingRegister,
        error,
    } = useRegister();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
        sendOtp(identifier);
    };

    const handleResendOtp = () => {
        if (countdown > 0) return;
        sendOtp(identifier);
        setCountdown(60);
    };

    const handleRegister = () => {
        register(identifier, otp, password, confirm);
    };

    return (
        <div className="font-jakarta selection:bg-primary-900 selection:text-white relative">
            <div className="min-h-screen flex bg-white relative">
                
                {/* Back to Home Button */}
                <Link to="/" className="absolute top-8 left-8 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all duration-300 lg:flex hidden border border-white/20 group">
                    <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <Link to="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest lg:hidden hover:text-slate-900 transition-colors">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Trang chủ
                </Link>

                {/* Left Side - Image & Branding */}
                <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
                    <img 
                        src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1600&auto=format&fit=crop" 
                        alt="Medical Research" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/30"></div>
                    
                    <div className="relative z-10 p-16 flex flex-col justify-end h-full w-full animate-fade-in-smooth" style={{ animationDelay: '400ms' }}>
                        <img src={logoUrl} alt="CareS" className="w-16 h-16 rounded-xl object-contain mb-8 shadow-lg shadow-black/20" />
                        <h1 className="text-4xl md:text-5xl font-light text-white leading-tight mb-6">
                            Khởi đầu hành trình <br />
                            <span className="font-bold">Chăm sóc sức khỏe</span>
                        </h1>
                        <p className="text-slate-300 font-light text-lg max-w-md leading-relaxed mb-12">
                            Tạo tài khoản để dễ dàng đặt lịch hẹn, lưu trữ bệnh án điện tử và trải nghiệm dịch vụ y tế đẳng cấp tại CareS.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-8 border-t border-slate-700/50 pt-8 max-w-lg">
                            <div className="flex items-center gap-4">
                                <HeartPulse className="w-8 h-8 text-primary-400" strokeWidth={1} />
                                <div>
                                    <p className="text-white font-bold text-sm">Chăm sóc tận tâm</p>
                                    <p className="text-slate-400 text-xs mt-1">Đội ngũ chuyên gia</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <ShieldCheck className="w-8 h-8 text-primary-400" strokeWidth={1} />
                                <div>
                                    <p className="text-white font-bold text-sm">Bảo mật tuyệt đối</p>
                                    <p className="text-slate-400 text-xs mt-1">Dữ liệu cá nhân</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Register Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-50/50 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>

                    <div className="w-full max-w-[420px] animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
                        <div className="mb-10">
                            <h2 className="text-3xl font-light text-slate-900 mb-3">
                                Đăng Ký
                            </h2>
                            <p className="text-slate-500 font-light text-sm">
                                Tạo tài khoản mới bằng Email hoặc số điện thoại của bạn.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {/* Method Switcher */}
                            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                                <button
                                    type="button"
                                    onClick={() => { setRegisterMethod('phone'); setIdentifier(''); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${registerMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Phone className="w-4 h-4" />
                                    Số điện thoại
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setRegisterMethod('email'); setIdentifier(''); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${registerMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Mail className="w-4 h-4" />
                                    Email
                                </button>
                            </div>

                            {/* Identifier Input */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    {registerMethod === 'phone' ? 'Số điện thoại' : 'Email'}
                                </label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        {registerMethod === 'email' ? (
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        ) : (
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        )}
                                        <input
                                            type={registerMethod === 'email' ? "email" : "text"}
                                            value={identifier}
                                            onChange={e => setIdentifier(e.target.value)}
                                            placeholder={registerMethod === 'phone' ? "Nhập số điện thoại..." : "Nhập email..."}
                                            className="w-full h-14 pl-11 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-slate-900"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSendOtp}
                                        disabled={loadingSendOtp || !identifier || otpSent}
                                        className={`h-14 px-6 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${otpSent ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400'}`}
                                    >
                                        {loadingSendOtp ? 'Đang gửi...' : (otpSent ? 'Đã gửi' : 'Gửi mã')}
                                    </button>
                                </div>
                            </div>

                            {/* OTP Input */}
                            {otpSent && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                            {t('register.otp')}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={countdown > 0}
                                            className="text-[11px] font-bold text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors disabled:text-slate-400"
                                        >
                                            {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={e => setOtp(e.target.value)}
                                            maxLength={6}
                                            placeholder="Nhập 6 số OTP..."
                                            className="w-full h-14 pl-11 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-slate-900 font-bold tracking-widest"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Password */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    {t('register.password')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-14 pl-11 pr-12 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-slate-900"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    {t('register.confirmPassword')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-14 pl-11 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-slate-900"
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                                    <p className="text-red-600 text-sm font-medium">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleRegister}
                                disabled={loadingRegister || !otpSent}
                                className="group relative w-full h-14 mt-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl overflow-hidden transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.3)] disabled:shadow-none"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3 text-sm font-bold tracking-[0.1em] uppercase">
                                    {loadingRegister ? tCommon('loading') : t('register.submit')}
                                    {!loadingRegister && otpSent && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                </span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-500">
                                Đã có tài khoản?{' '}
                                <Link to={ROUTES.LOGIN} className="font-bold text-slate-900 hover:text-primary-600 transition-colors">
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

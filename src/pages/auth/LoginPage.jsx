// src/pages/auth/LoginPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useLogin } from '@/hooks/useLogin';
import { ROUTES } from '@/constants/routes';
import { ArrowRight, ShieldCheck, Phone, Lock, Eye, EyeOff, Activity } from 'lucide-react';
import logoUrl from '@/assets/logo.jpg';

export default function LoginPage() {
	const { t } = useTranslation('auth');
	const { t: tCommon } = useTranslation('common');

	const [identifier, setIdentifier] = useState('');
	const [password, setPassword]     = useState('');
	const [remember, setRemember]     = useState(false);
	const [showForgot, setShowForgot] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

	const { login, loading, error } = useLogin();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

	// ── Forgot Password Modal ──
	const ForgotPasswordModal = () => {
		const [step, setStep] = useState(1);
		const [identifier, setIdentifier] = useState('');
		const [otp, setOtp] = useState('');
		const [newPass, setNewPass] = useState('');
		const [isSubmitting, setIsSubmitting] = useState(false);

		const handleSendOtp = async () => {
			if (!identifier) return toast.error('Vui lòng nhập Email hoặc số điện thoại');
			setIsSubmitting(true);
			try {
				const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ identifier })
				});
				if (!res.ok) throw new Error('Không thể gửi mã OTP');
				toast.success('Mã OTP đã được gửi (Check email hoặc console/log backend)');
				setStep(2);
			} catch (err) {
				toast.error(err.message);
			} finally {
				setIsSubmitting(false);
			}
		};

		const handleReset = async () => {
			if (!otp || !newPass) return toast.error('Vui lòng điền đủ thông tin');
			setIsSubmitting(true);
			try {
				const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ identifier, otp, newPassword: newPass })
				});
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(data.message || 'OTP sai hoặc đã hết hạn');
				}
				toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
				setShowForgot(false);
			} catch (err) {
				toast.error(err.message);
			} finally {
				setIsSubmitting(false);
			}
		};

		return (
			<div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
				<div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
					<div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                            <ShieldCheck strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Khôi phục mật khẩu</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {step === 1 ? 'Xác thực qua Email hoặc số điện thoại.' : 'Tạo mật khẩu mới của bạn.'}
                            </p>
                        </div>
                    </div>

					{step === 1 ? (
						<div className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email / Số điện thoại</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" placeholder="Nhập email hoặc số điện thoại..." value={identifier} onChange={e => setIdentifier(e.target.value)}
                                        className="w-full h-12 pl-11 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all" />
                                </div>
                            </div>
							<div className="flex gap-4 pt-2">
								<button onClick={() => setShowForgot(false)} className="flex-1 h-12 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">Hủy bỏ</button>
								<button onClick={handleSendOtp} disabled={isSubmitting} className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold disabled:opacity-60 transition-colors">
									{isSubmitting ? 'Đang gửi...' : 'Gửi mã OTP'}
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mã OTP</label>
                                <input type="text" placeholder="Nhập mã OTP..." value={otp} onChange={e => setOtp(e.target.value)}
                                        className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-center tracking-widest font-bold" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mật khẩu mới</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="password" placeholder="Nhập mật khẩu mới..." value={newPass} onChange={e => setNewPass(e.target.value)}
                                        className="w-full h-12 pl-11 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all" />
                                </div>
                            </div>
							
							<div className="flex gap-4 pt-2">
								<button onClick={() => setStep(1)} className="flex-1 h-12 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">Quay lại</button>
								<button onClick={handleReset} disabled={isSubmitting} className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold disabled:opacity-60 transition-colors">
									{isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="font-jakarta selection:bg-primary-900 selection:text-white">
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
                        src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1600&auto=format&fit=crop" 
                        alt="Medical Facility" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 animate-slow-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/30"></div>
                    
                    <div className="relative z-10 p-16 flex flex-col justify-end h-full w-full animate-fade-in-smooth" style={{ animationDelay: '400ms' }}>
                        <img src={logoUrl} alt="CareS" className="w-16 h-16 rounded-xl object-contain mb-8 shadow-lg shadow-black/20" />
                        <h1 className="text-4xl md:text-5xl font-light text-white leading-tight mb-6">
                            Chào mừng trở lại <br />
                            <span className="font-bold">CareS Medical</span>
                        </h1>
                        <p className="text-slate-300 font-light text-lg max-w-md leading-relaxed mb-12">
                            Hệ thống quản lý y tế toàn diện, bảo mật tối đa. Đăng nhập để truy cập hồ sơ bệnh án và quản lý lịch hẹn của bạn.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-8 border-t border-slate-700/50 pt-8 max-w-lg">
                            <div className="flex items-center gap-4">
                                <ShieldCheck className="w-8 h-8 text-primary-400" strokeWidth={1} />
                                <div>
                                    <p className="text-white font-bold text-sm">Bảo mật chuẩn y tế</p>
                                    <p className="text-slate-400 text-xs mt-1">Mã hóa đầu cuối</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Activity className="w-8 h-8 text-primary-400" strokeWidth={1} />
                                <div>
                                    <p className="text-white font-bold text-sm">Quản lý đồng bộ</p>
                                    <p className="text-slate-400 text-xs mt-1">Cập nhật realtime</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
                    {/* Subtle decorative background element */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-50/50 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>

                    <div className="w-full max-w-[420px] animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
                        <div className="mb-12">
                            <h2 className="text-3xl font-light text-slate-900 mb-3">
                                Đăng Nhập
                            </h2>
                            <p className="text-slate-500 font-light text-sm">
                                Vui lòng nhập số điện thoại hoặc email để tiếp tục.
                            </p>
                        </div>

                        <form className="space-y-6" onSubmit={(e) => {
                            e.preventDefault();
                            login(identifier, password, remember);
                        }}>
                            {/* Identifier Input */}
                            <div>
                                <label htmlFor="username" className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    {t('login.identifier')}
                                </label>
                                <div className="relative group">
                                    <input
                                        id="username"
                                        name="username"
                                        autoComplete="username"
                                        type="text"
                                        value={identifier}
                                        onChange={e => setIdentifier(e.target.value)}
                                        placeholder="VD: 0987654321"
                                        className="w-full h-14 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-slate-900"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label htmlFor="password" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                        {t('login.password')}
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowForgot(true)} 
                                        className="text-[11px] font-bold text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors"
                                    >
                                        Quên mật khẩu?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        autoComplete="current-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-14 pl-4 pr-12 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-slate-900"
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

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                                    <p className="text-red-600 text-sm font-medium">{error}</p>
                                </div>
                            )}

                            {/* Remember Me */}
                            <label className="flex items-center gap-3 cursor-pointer group w-max">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${remember ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                                    {remember && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                                </div>
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={remember}
                                    onChange={e => setRemember(e.target.checked)}
                                    className="hidden"
                                />
                                <span className="text-sm text-slate-600 font-medium select-none group-hover:text-slate-900 transition-colors">
                                    {t('login.remember')}
                                </span>
                            </label>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full h-14 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl overflow-hidden transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.4)] disabled:shadow-none"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3 text-sm font-bold tracking-[0.1em] uppercase">
                                    {loading ? tCommon('loading') : t('login.submit')}
                                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                </span>
                                {!loading && <div className="absolute inset-0 bg-primary-600 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out z-0"></div>}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-500">
                                {t('login.noAccount')}{' '}
                                <Link to={ROUTES.REGISTER} className="font-bold text-slate-900 hover:text-primary-600 transition-colors">
                                    {t('login.registerNow')}
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
			</div>

			{showForgot && <ForgotPasswordModal />}
		</div>
	);
}
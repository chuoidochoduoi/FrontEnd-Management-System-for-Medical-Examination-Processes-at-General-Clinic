// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Navbar from '@/components/layout/Navbar';
import { useLogin } from '@/hooks/useLogin';
import { ROUTES } from '@/constants/routes';

export default function LoginPage() {
	const { t } = useTranslation('auth');
	const { t: tCommon } = useTranslation('common');

	const [identifier, setIdentifier] = useState('');
	const [password, setPassword]     = useState('');
	const [remember, setRemember]     = useState(false);
	const [showForgot, setShowForgot] = useState(false);

	const { login, loading, error } = useLogin();

	// ── Forgot Password Modal ──
	const ForgotPasswordModal = () => {
		const [step, setStep] = useState(1);
		const [phone, setPhone] = useState('');
		const [otp, setOtp] = useState('');
		const [newPass, setNewPass] = useState('');
		const [isSubmitting, setIsSubmitting] = useState(false);

		const handleSendOtp = async () => {
			if (!phone) return toast.error('Vui lòng nhập số điện thoại');
			setIsSubmitting(true);
			try {
				const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ phone })
				});
				if (!res.ok) throw new Error('Không thể gửi mã OTP');
				toast.success('Mã OTP đã được gửi (Check console/log backend)');
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
					body: JSON.stringify({ phone, otp, newPassword: newPass })
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
			<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
					<h3 className="text-lg font-bold text-gray-900 mb-2">Khôi phục mật khẩu</h3>
					<p className="text-sm text-gray-500 mb-5">
						{step === 1 ? 'Nhập số điện thoại đăng ký của bạn để nhận mã xác thực.' : 'Nhập mã OTP và mật khẩu mới.'}
					</p>

					{step === 1 ? (
						<div className="space-y-4">
							<input type="text" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)}
								   className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500" />
							<div className="flex gap-3">
								<button onClick={() => setShowForgot(false)} className="flex-1 h-10 border text-gray-600 rounded-md text-sm font-medium">Hủy</button>
								<button onClick={handleSendOtp} disabled={isSubmitting} className="flex-1 h-10 bg-primary-500 text-white rounded-md text-sm font-medium disabled:opacity-60">
									{isSubmitting ? 'Đang gửi...' : 'Gửi mã OTP'}
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<input type="text" placeholder="Mã OTP" value={otp} onChange={e => setOtp(e.target.value)}
								   className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500" />
							<input type="password" placeholder="Mật khẩu mới" value={newPass} onChange={e => setNewPass(e.target.value)}
								   className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500" />
							<div className="flex gap-3">
								<button onClick={() => setStep(1)} className="flex-1 h-10 border text-gray-600 rounded-md text-sm font-medium">Quay lại</button>
								<button onClick={handleReset} disabled={isSubmitting} className="flex-1 h-10 bg-primary-500 text-white rounded-md text-sm font-medium disabled:opacity-60">
									{isSubmitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	};

	return (
		<>
			<Navbar />

			<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-jakarta">
				<div className="bg-white border border-gray-200 rounded-xl p-10 w-full max-w-sm">

					<h2 className="text-xl font-medium text-center text-gray-900 mb-7">
						{t('login.title')}
					</h2>

					<div className="mb-4">
						<label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
							{t('login.identifier')}
						</label>
						<input
							type="text"
							value={identifier}
							onChange={e => setIdentifier(e.target.value)}
							className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
						/>
					</div>

					<div className="mb-4">
						<label className="flex justify-between items-center text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
							{t('login.password')}
							<button type="button" onClick={() => setShowForgot(true)} className="text-primary-500 text-xs normal-case tracking-normal font-normal hover:text-primary-600">
								{t('login.forgot')}
							</button>
						</label>
						<input
							type="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
						/>
					</div>

					{error && <p className="text-red-500 text-sm mb-3">{error}</p>}

					<label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer mb-5">
						<input
							type="checkbox"
							checked={remember}
							onChange={e => setRemember(e.target.checked)}
							className="w-4 h-4 accent-primary-500"
						/>
						{t('login.remember')}
					</label>

					<button
						onClick={() => login(identifier, password, remember)}
						disabled={loading}
						className="w-full h-10 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
					>
						{loading ? tCommon('loading') : t('login.submit')}
					</button>

					<p className="text-center text-sm text-gray-500 mt-5">
						{t('login.noAccount')}{' '}
						<Link to={ROUTES.REGISTER} className="text-primary-500 hover:text-primary-600">
							{t('login.registerNow')}
						</Link>
					</p>

				</div>
			</div>

			{showForgot && <ForgotPasswordModal />}
		</>
	);
}
// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/layout/Navbar';
import { useLogin } from '@/hooks/useLogin';
import { ROUTES } from '@/constants/routes';

export default function LoginPage() {
	const { t } = useTranslation('auth');
	const { t: tCommon } = useTranslation('common');

	const [identifier, setIdentifier] = useState('');
	const [password, setPassword]     = useState('');
	const [remember, setRemember]     = useState(false);

	const { login, loading, error } = useLogin();

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
							<Link to="/forgot-password" className="text-primary-500 text-xs normal-case tracking-normal font-normal hover:text-primary-600">
								{t('login.forgot')}
							</Link>
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
		</>
	);
}
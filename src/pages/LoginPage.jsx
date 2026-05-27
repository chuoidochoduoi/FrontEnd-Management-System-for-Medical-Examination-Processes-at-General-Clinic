
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { LOGIN_PAGE } from '../constants/authConfig';

const LoginPage = () => {
	return (
		<div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] relative">
			<div className="absolute top-6 left-6 z-50">
				<Button variant="ghost">
					<Link to="/"><ArrowLeft size={20} /></Link>
				</Button>
			</div>
			<div className="max-w-6xl mx-auto p-6 md:p-0">
				<div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[640px]">
					<div className="md:w-1/2 relative bg-[#1ab2a6] hidden md:block">
						<img
							src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop"
							alt="doctor"
							className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
						/>
						<div className="relative z-10 p-12 h-full flex flex-col justify-between text-white">
							<div>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
										<span className="text-[#1ab2a6] font-bold">H</span>
									</div>
									<span className="text-3xl font-extrabold tracking-tight">Hospl</span>
								</div>
								<h2 className="text-4xl font-bold mt-8">{LOGIN_PAGE.title}</h2>
								<p className="mt-4 text-teal-50 max-w-md leading-relaxed opacity-90">{LOGIN_PAGE.subtitle}</p>
							</div>
							<div className="flex items-center gap-6 text-sm text-teal-100/80">
								<span className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 bg-teal-300 rounded-full" /> Systems are stable
								</span>
								<span className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 bg-teal-300 rounded-full" /> 24/7 Technical Support
								</span>
							</div>
						</div>
					</div>

					<div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
						<div className="max-w-md mx-auto w-full">
							<div className="mb-8">
								<h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">{LOGIN_PAGE.title}</h1>
							</div>

							<div className="grid grid-cols-2 gap-4 mb-6">
								{LOGIN_PAGE.social.map(s => (
									<button key={s.id} className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-700">
										{s.iconUrl ? (<img src={s.iconUrl} className="w-5 h-5" alt={s.label} />) : s.icon ? (<s.icon size={20} />) : null}
										{s.label}
									</button>
								))}
							</div>

							<div className="relative mb-8">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-slate-100" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-white px-4 text-slate-400 font-medium tracking-widest">Or use Email</span>
								</div>
							</div>

							<LoginForm />

							<div className="mt-8 text-center text-slate-600 font-medium">
								You don't have an account? <a href="#" className="text-[#1ab2a6] font-bold hover:underline">Sign up now</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
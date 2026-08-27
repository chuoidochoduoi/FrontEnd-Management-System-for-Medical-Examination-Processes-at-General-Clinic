import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PhoneCall, ShieldCheck, FileText, UserCircle, ArrowLeft } from 'lucide-react';
import logoUrl from '@/assets/logo.jpg';

const InfoLayout = ({ children }) => {
  const navigate = useNavigate();

  const links = [
    { path: '/contact', label: 'Liên hệ', icon: PhoneCall },
    { path: '/about', label: 'Về chúng tôi', icon: UserCircle },
    { path: '/terms', label: 'Điều khoản dịch vụ', icon: FileText },
    { path: '/privacy', label: 'Chính sách bảo mật', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-jakarta text-slate-800">
      {/* Simple Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 lg:px-12 sticky top-0 z-50">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logoUrl} alt="CareS" className="w-10 h-10 rounded-md object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 tracking-widest uppercase leading-none">CareS</span>
              <span className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1">Phòng khám đa khoa</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </button>
        </div>
      </header>

      <div className="w-full px-6 lg:px-12 xl:px-16 py-12 flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-white border border-slate-100 rounded-2xl shadow-sm p-4 sticky top-28">
          <nav className="flex flex-col gap-2">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <link.icon className="w-5 h-5 shrink-0" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full bg-white border border-slate-100 rounded-2xl shadow-sm p-8 lg:p-12">
          {children}
        </main>
      </div>
    </div>
  );
};

export default InfoLayout;

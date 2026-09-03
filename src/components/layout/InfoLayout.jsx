import React from 'react';
import { NavLink } from 'react-router-dom';
import { PhoneCall, ShieldCheck, FileText, UserCircle } from 'lucide-react';
import PublicSiteShell from '@/components/public/PublicSiteShell';

const InfoLayout = ({ children }) => {
  const links = [
    { path: '/contact', label: 'Liên hệ', icon: PhoneCall },
    { path: '/about', label: 'Về chúng tôi', icon: UserCircle },
    { path: '/terms', label: 'Điều khoản dịch vụ', icon: FileText },
    { path: '/privacy', label: 'Chính sách bảo mật', icon: ShieldCheck },
  ];

  return (
    <PublicSiteShell>
      <div className="cares-public-container pt-32 pb-20 flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
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
    </PublicSiteShell>
  );
};

export default InfoLayout;

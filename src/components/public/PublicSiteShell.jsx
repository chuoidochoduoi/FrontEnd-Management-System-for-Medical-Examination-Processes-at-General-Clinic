import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, Globe2, LogIn, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import logoUrl from '@/assets/logo.jpg';
import useClinicInformation from '@/hooks/useClinicInformation';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);

const navItems = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/about', label: 'Giới thiệu' },
  { to: '/services', label: 'Dịch vụ' },
  { to: '/schedule', label: 'Lịch khám' },
  { to: '/doctors', label: 'Bác sĩ' },
  { to: '/guest/journey', label: 'Tra cứu lượt khám' },
  { to: '/contact', label: 'Liên hệ' },
];

function PublicNavItem({ item, onClick }) {
  if (item.to.includes('#')) {
    return <Link to={item.to} onClick={onClick} className="cares-public-nav-link">{item.label}</Link>;
  }
  return (
    <NavLink to={item.to} end={item.end} onClick={onClick} className={({ isActive }) => `cares-public-nav-link ${isActive ? 'is-active' : ''}`}>
      {item.label}
    </NavLink>
  );
}

export default function PublicSiteShell({ children, pageClassName = '' }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { clinicInformation } = useClinicInformation();
  const clinic = clinicInformation || {};

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={`cares-public-site ${pageClassName}`.trim()}>
      <header className={`cares-public-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="cares-public-container cares-public-header-inner">
          <Link to="/" className="cares-public-brand" aria-label="Về trang chủ CareS">
            <img src={logoUrl} alt="" />
            <div><strong>CareS</strong></div>
          </Link>

          <nav className="cares-public-desktop-nav" aria-label="Điều hướng chính">
            {navItems.map(item => <PublicNavItem key={item.to} item={item} />)}
          </nav>

          <div className="cares-public-header-actions">
            <button type="button" className="cares-public-login" onClick={() => navigate(get('token') ? '/customer/profile' : '/login')}>
              <LogIn size={17} /> {get('token') ? 'Tài khoản' : 'Đăng nhập'}
            </button>
            <button type="button" className="cares-public-primary" onClick={() => navigate('/appointment')}>
              <CalendarDays size={18} /> Đặt lịch khám
            </button>
            <button type="button" className="cares-public-menu-button" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-label="Mở menu">
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        <div className={`cares-public-mobile-nav ${menuOpen ? 'is-open' : ''}`}>
          <div className="cares-public-container">
            {navItems.map(item => <PublicNavItem key={item.to} item={item} onClick={() => setMenuOpen(false)} />)}
            <button type="button" className="cares-public-primary" onClick={() => navigate('/appointment')}><CalendarDays size={18} /> Đặt lịch khám</button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="cares-public-footer">
        <div className="cares-public-container cares-public-footer-grid">
          <div>
            <div className="cares-public-brand cares-public-footer-brand"><img src={logoUrl} alt="" /><div><strong>{clinic.clinicName || 'CareS'}</strong><span>Chăm sóc rõ ràng, tận tâm</span></div></div>
            <p>{clinic.shortDescription || 'Phòng khám đa khoa đồng hành cùng bạn trong từng bước chăm sóc sức khỏe.'}</p>
          </div>
          <div><h3>Liên hệ</h3><p><Phone size={16} /> {clinic.phone || '1900 1234'}</p><p><Mail size={16} /> {clinic.supportEmail || 'lienhe@caresclinic.vn'}</p><p><MapPin size={16} /> {clinic.address || 'Khu Công nghệ cao Hòa Lạc, Hà Nội'}</p></div>
          <div><h3>Truy cập nhanh</h3><Link to="/services">Danh mục dịch vụ</Link><Link to="/doctors">Đội ngũ bác sĩ</Link><Link to="/schedule">Lịch khám theo khoa</Link><Link to="/appointment">Đặt lịch khám không cần tài khoản</Link><Link to="/guest/journey">Tra cứu lượt khám (không cần đăng nhập)</Link><Link to="/contact">Gửi thông tin liên hệ</Link></div>
          <div><h3>Kết nối</h3>{clinic.facebookUrl ? <a href={clinic.facebookUrl} target="_blank" rel="noreferrer"><Globe2 size={17} /> Facebook</a> : <span><Globe2 size={17} /> CareS Clinic</span>}</div>
        </div>
        <div className="cares-public-container cares-public-copyright">© {new Date().getFullYear()} {clinic.clinicName || 'CareS'}. Thông tin lịch khám có thể được điều chỉnh theo hoạt động thực tế.</div>
      </footer>
    </div>
  );
}

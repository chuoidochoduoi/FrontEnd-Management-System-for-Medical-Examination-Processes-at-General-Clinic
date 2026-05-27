import React from 'react';
import { Link } from 'react-router-dom';
import { NAVIGATION_LINKS } from '../../constants/content';
import Button from '../ui/Button';

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex justify-between items-center">
        <Logo />

        <div className="hidden md:flex items-center gap-8">
          {NAVIGATION_LINKS.map(link => (
            <a key={link.label} href={link.href} className="text-slate-600 hover:text-[#1ab2a6] font-medium transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden lg:flex">Sign up</Button>
          <Link to="/login">
            <Button>
              Log in
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 bg-[#1ab2a6] rounded flex items-center justify-center">
      <span className="text-white font-bold text-lg">H</span>
    </div>
    <span className="text-2xl font-bold text-[#1ab2a6]">Hospl</span>
  </div>
);

export default Navbar;

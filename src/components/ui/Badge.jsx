import React from 'react';

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-300',
    success: 'bg-blue-100 text-blue-700 border border-blue-300',
    warning: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    primary: 'bg-[#e8f7f6] text-[#1ab2a6] border border-[#1ab2a6]/20'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};

export default Badge;

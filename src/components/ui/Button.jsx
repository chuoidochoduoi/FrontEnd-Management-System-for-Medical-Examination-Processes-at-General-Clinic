import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "px-6 py-2.5 rounded-lg font-semibold transition-all active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[#1ab2a6] text-white hover:bg-[#169d92] shadow-md shadow-[#1ab2a6]/20",
    secondary: "bg-white border-2 border-slate-200 text-slate-800 hover:border-[#1ab2a6] hover:text-[#1ab2a6]",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-700 hover:text-[#1ab2a6]"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;

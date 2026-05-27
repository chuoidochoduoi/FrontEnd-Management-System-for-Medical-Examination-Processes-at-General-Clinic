import React from 'react';

const baseInput = 'w-full pl-11 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#1ab2a6] focus:bg-white outline-none transition-all text-slate-900 font-medium';

const TextField = ({ label, name, type = 'text', placeholder, value = '', onChange, error, Icon }) => {
  return (
    <div>
      {label && <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>}
      <div className="relative">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
            <Icon />
          </span>
        )}
        <input
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange && onChange(name, e.target.value)}
          placeholder={placeholder}
          className={baseInput}
        />
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default TextField;

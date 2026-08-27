import React from 'react';

const base = 'w-4 h-4 text-[#1ab2a6] border-slate-300 rounded focus:ring-[#1ab2a6]';

const Checkbox = ({ id, checked = false, onChange, label }) => (
  <div className="flex items-center">
    <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange && onChange(e.target.checked)} className={base} />
    {label && <label htmlFor={id} className="ml-2 text-sm font-medium text-slate-600">{label}</label>}
  </div>
);

export default Checkbox;

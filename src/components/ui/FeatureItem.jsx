  import React from 'react';

const FeatureItem = ({ title, icon }) => (
  <div className="bg-white/70 backdrop-blur-sm border border-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">

    <div className="flex items-center gap-4">
      
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>

      <h3 className="font-semibold text-lg text-slate-900 leading-snug">
        {title}
      </h3>

    </div>
  </div>
);

export default FeatureItem;

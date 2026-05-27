import React from 'react';
import Button from '../ui/Button';

const Hero = () => {
  return (
    <section className="pt-32 pb-12 px-6 text-center">
      <br />
      {/* <Badge text="AI-powered clinic management software" /> */}
      <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
        Medical Examination<br />
        Management System<br />
        <span className="text-[#1ab2a6]">for General Clinics</span>
      </h1>
      <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
        The system supports patient registration, appointment scheduling, medical examination, laboratory requests, prescription management, pharmacy operations and billing in general clinics.
      </p>
    </section>
  );
};

const Badge = ({ text }) => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#e8f7f6] rounded-full text-[#1ab2a6] text-sm font-semibold mb-8">
    <span className="w-2 h-2 bg-[#1ab2a6] rounded-full"></span>
    {text}
  </div>
);

export default Hero;

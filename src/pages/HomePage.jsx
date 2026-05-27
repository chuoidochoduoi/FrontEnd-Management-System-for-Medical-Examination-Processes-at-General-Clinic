import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import CTA from '../components/landing/CTA';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Navbar />
      <main className="max-w-7xl mx-auto">
        <Hero />
        <Features />
        <CTA />
        <ProductPreview />
      </main>
      <Footer />
    </div>
  );
};

const ProductPreview = () => (
  <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-8 border-white/50 bg-[#eff4ff] mb-20">
    <img 
      src="https://images.unsplash.com/photo-1551288049-bbda4833effb?q=80&w=2070&auto=format&fit=crop" 
      alt="Dashboard Preview" 
      className="w-full h-auto object-cover opacity-90"
    />
  </div>
);

export default HomePage;

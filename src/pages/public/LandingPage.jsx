import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointment } from '@/hooks/useAppointment';
import logoUrl from '@/assets/logo.jpg';
import { 
  ArrowRight,
  Stethoscope,
  Microscope,
  Activity,
  Pill,
  Clock,
  ShieldCheck,
  Award,
  ChevronRight,
  Menu,
  X,
  PhoneCall,
  MapPin,
  UserCircle
} from 'lucide-react';
import ChatWidget from '@/components/ui/ChatWidget';
import { useTranslation } from 'react-i18next';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('landing');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { services: apiServices, loadingServices } = useAppointment();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [Stethoscope, Microscope, Activity, Pill].map((icon, index) => ({
    icon, title: t(`services.items.${index}.title`), desc: t(`services.items.${index}.desc`),
  }));

  const features = [Clock, ShieldCheck, Award].map((icon, index) => ({
    icon, title: t(`about.features.${index}.title`), desc: t(`about.features.${index}.desc`),
  }));

  const featuredDoctors = [
    {
      name: "TS.BS. Nguyễn Trí Dũng",
      specialty: t('doctors.profiles.0.specialty'), desc: t('doctors.profiles.0.desc'),
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=800&auto=format&fit=crop"
    },
    {
      name: "ThS.BS. Trần Thu Hà",
      specialty: t('doctors.profiles.1.specialty'), desc: t('doctors.profiles.1.desc'),
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop"
    },
    {
      name: "BS.CKI. Phạm Văn Minh",
      specialty: t('doctors.profiles.2.specialty'), desc: t('doctors.profiles.2.desc'),
      image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=800&auto=format&fit=crop"
    },
    {
      name: "BS. Lê Hoàng Yến",
      specialty: t('doctors.profiles.3.specialty'), desc: t('doctors.profiles.3.desc'),
      image: "https://images.unsplash.com/photo-1594824432258-0050b1a0d314?q=80&w=800&auto=format&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-jakarta text-slate-800 selection:bg-slate-900 selection:text-white">
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/50 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="w-full px-8 lg:px-16 xl:px-20">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <img src={logoUrl} alt="CareS" className="w-10 h-10 rounded-md object-contain" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-900 tracking-widest uppercase leading-none">CareS</span>
                <span className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1">{t('brandSubtitle')}</span>
              </div>
            </div>

            {/* Desktop Nav Links - Centered */}
            <div className="hidden md:flex items-center gap-6 xl:gap-8">
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.home')}</button>
              <a href="#about" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.about')}</a>
              <button onClick={() => navigate('/appointment')} className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.appointment')}</button>
              <a href="#process" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.process')}</a>
              <a href="#doctors" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.doctors')}</a>
              <a href="#pricing" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.pricing')}</a>
              <a href="#contact" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.contact')}</a>
            </div>

            {/* Desktop Action Buttons - Right */}
            <div className="hidden md:flex items-center gap-6">
              {get('token') ? (
                <button 
                  onClick={() => navigate('/customer/profile')}
                  className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] uppercase text-slate-900 hover:text-primary-600 transition-colors"
                >
                  <UserCircle className="w-5 h-5" />
                  {get('username') || t('nav.profile')}
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-900 hover:text-primary-600 transition-colors"
                >
                  {t('nav.login')}
                </button>
              )}
              <button 
                onClick={() => navigate('/appointment')}
                className="bg-slate-900 text-white text-xs font-semibold tracking-[0.1em] uppercase px-7 py-3.5 hover:bg-slate-800 transition-all duration-300"
              >
                {t('nav.bookNow')}
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-2 md:hidden"><button className="p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6 text-slate-900" />}</button></div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <div className={`fixed inset-0 z-40 bg-white transition-transform duration-500 ease-in-out transform ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'} flex flex-col items-center justify-center gap-6 md:hidden`}>
        <button onClick={() => { setMobileMenuOpen(false); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">{t('nav.home')}</button>
        <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">{t('nav.about')}</a>
        <button onClick={() => { setMobileMenuOpen(false); navigate('/appointment'); }} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">{t('nav.appointment')}</button>
        <a href="#process" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">{t('nav.process')}</a>
        <a href="#doctors" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">{t('nav.doctors')}</a>
        <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">{t('nav.pricing')}</a>
        <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">{t('nav.contact')}</a>
        {get('token') ? (
          <button onClick={() => navigate('/customer/profile')} className="flex items-center gap-2 text-lg font-semibold tracking-[0.1em] uppercase text-slate-900 mt-4">
            <UserCircle className="w-6 h-6" />
            {get('username') || t('nav.profile')}
          </button>
        ) : (
          <button onClick={() => navigate('/login')} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-500 mt-4">{t('nav.login')}</button>
        )}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-white">
        {/* Subtle abstract background element */}
        <div className="absolute top-0 right-0 w-[50vw] h-full bg-slate-50 -z-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-50/30 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl relative z-10 pt-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-[1px] bg-primary-600"></div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary-600">{t('hero.eyebrow')}</span>
              </div>
              <h1 className="text-5xl lg:text-[4rem] font-light text-slate-900 leading-[1.1] mb-8">
                {t('hero.line1')} <br />
                <span className="font-bold">{t('hero.bold')}</span> <br />
                {t('hero.line3')}
              </h1>
              <p className="text-lg text-slate-500 font-light leading-relaxed mb-12 max-w-lg">
                {t('hero.description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <button 
                  onClick={() => navigate('/appointment')}
                  className="group relative overflow-hidden bg-slate-900 dark:bg-primary-600 text-white px-10 py-5 text-sm font-semibold tracking-[0.1em] uppercase transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {t('hero.register')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-primary-600 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out z-0"></div>
                </button>
                <button 
                  onClick={() => document.getElementById('process').scrollIntoView({ behavior: 'smooth' })}
                  className="group flex items-center justify-center gap-3 px-10 py-5 text-sm font-semibold tracking-[0.1em] uppercase text-slate-900 border border-slate-200 hover:border-slate-900 transition-all duration-300"
                >
                  {t('hero.explore')}
                </button>
              </div>
            </div>

            <div className="relative lg:h-[80vh] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 transform -skew-x-6 z-0"></div>
              <div className="relative z-10 w-full h-[600px] overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?q=80&w=1200&auto=format&fit=crop" 
                  alt={t('hero.imageAlt')}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  style={{ filter: 'contrast(1.05) brightness(1.05)' }}
                />
                {/* Elegant overlay card */}
                <div className="absolute bottom-10 -left-10 md:left-10 bg-white/95 backdrop-blur-md p-8 shadow-2xl border-l-4 border-primary-600 max-w-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-out">
                  <p className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-400 mb-2">{t('hero.privilege')}</p>
                  <p className="text-lg font-bold text-slate-900 leading-snug">{t('hero.privilegeText')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-900 text-white relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 divide-x divide-slate-800/50 text-center">
            <div>
              <p className="text-5xl font-light text-primary-400 mb-4">15<span className="text-3xl">+</span></p>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-400">{t('stats.experience')}</p>
            </div>
            <div>
              <p className="text-5xl font-light text-primary-400 mb-4">50<span className="text-3xl">+</span></p>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-400">{t('stats.experts')}</p>
            </div>
            <div>
              <p className="text-5xl font-light text-primary-400 mb-4">98<span className="text-3xl">%</span></p>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-400">{t('stats.satisfaction')}</p>
            </div>
            <div>
              <p className="text-5xl font-light text-primary-400 mb-4">4.0</p>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-400">{t('stats.technology')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-[1px] bg-slate-900"></div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">{t('services.eyebrow')}</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-slate-900 leading-tight">
                {t('services.title')} <br /> <span className="font-bold">{t('services.titleBold')}</span>
              </h2>
            </div>
            <p className="text-slate-500 font-light max-w-md">
              {t('services.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
            {services.map((service, index) => (
              <div key={index} className="group relative">
                <div className="flex gap-8 items-start">
                  <div className="w-16 h-16 shrink-0 border border-slate-200 flex items-center justify-center bg-white group-hover:bg-slate-900 group-hover:border-slate-900 transition-colors duration-500">
                    <service.icon className="w-6 h-6 text-slate-900 group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-primary-600 transition-colors duration-500">{service.title}</h3>
                    <p className="text-slate-500 font-light leading-relaxed mb-6">{service.desc}</p>
                    <div className="w-12 h-[1px] bg-slate-300 group-hover:w-full group-hover:bg-primary-600 transition-all duration-700 ease-out"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About & Tech Section */}
      <section id="about" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="aspect-[4/5] bg-slate-100 overflow-hidden relative group">
                 <img 
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000&auto=format&fit=crop" 
                  alt={t('about.imageAlt')}
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" 
                 />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-slate-900 text-white p-12 max-w-xs shadow-2xl z-10 hidden md:block">
                <h4 className="text-3xl font-light mb-4 text-primary-400">{t('about.pioneer')}</h4>
                <p className="text-sm font-light leading-relaxed text-slate-300 text-justify">
                  {t('about.pioneerText')}
                </p>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-[1px] bg-slate-900"></div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">{t('about.eyebrow')}</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-slate-900 leading-tight mb-10">
                {t('about.title')} <br /> <span className="font-bold">{t('about.titleBold')}</span>
              </h2>
              <p className="text-slate-500 font-light text-lg mb-12 leading-relaxed">
                {t('about.description')}
              </p>

              <div className="space-y-10">
                {features.map((item, index) => (
                  <div key={index} className="flex gap-6 items-start group cursor-default">
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-primary-600 transition-colors duration-500"></div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                      <p className="text-slate-500 font-light leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section - Elegant Steps */}
      <section id="process" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-8 h-[1px] bg-slate-900"></div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">{t('process.eyebrow')}</span>
            <div className="w-8 h-[1px] bg-slate-900"></div>
          </div>
          <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-20">
            {t('process.title')} <span className="font-bold">{t('process.titleBold')}</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[1px] bg-slate-200"></div>
            
            {[
              { num: "01", title: t('process.steps.0.title'), desc: t('process.steps.0.desc') },
              { num: "02", title: t('process.steps.1.title'), desc: t('process.steps.1.desc') },
              { num: "03", title: t('process.steps.2.title'), desc: t('process.steps.2.desc') },
              { num: "04", title: t('process.steps.3.title'), desc: t('process.steps.3.desc') },
            ].map((item, index) => (
              <div key={index} className="relative text-center group cursor-default">
                <div className="w-24 h-24 mx-auto bg-white rounded-none border border-slate-200 flex items-center justify-center mb-8 relative z-10 group-hover:border-slate-900 group-hover:bg-slate-900 transition-colors duration-500">
                  <span className="text-2xl font-light text-slate-400 group-hover:text-white transition-colors duration-500">{item.num}</span>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
                <p className="text-slate-500 font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="w-8 h-[1px] bg-slate-900"></div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">{t('doctors.eyebrow')}</span>
              <div className="w-8 h-[1px] bg-slate-900"></div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-6">{t('doctors.title')} <span className="font-bold">{t('doctors.titleBold')}</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t('doctors.description')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredDoctors.map((doc, idx) => (
              <div key={idx} className="group relative bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500">
                <div className="aspect-[3/4] overflow-hidden relative bg-slate-50">
                  <img 
                    src={doc.image} 
                    alt={doc.name} 
                    className="w-full h-full object-cover object-top filter grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100 text-white">
                    <p className="text-sm font-light leading-relaxed line-clamp-3">{doc.desc}</p>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">{doc.name}</h3>
                  <p className="text-xs font-semibold tracking-widest uppercase text-primary-500">{doc.specialty}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
             <button className="text-sm font-bold tracking-widest uppercase text-slate-600 hover:text-primary-600 transition-colors border-b-2 border-transparent hover:border-primary-600 pb-1">
               {t('doctors.viewAll')}
             </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="w-8 h-[1px] bg-slate-900"></div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">{t('pricing.eyebrow')}</span>
              <div className="w-8 h-[1px] bg-slate-900"></div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-6">{t('pricing.title')} <span className="font-bold">{t('pricing.titleBold')}</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t('pricing.description')}</p>
          </div>

          {loadingServices ? (
            <div className="flex justify-center py-12">
               <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : apiServices.length === 0 ? (
            <p className="text-slate-500 text-center italic">{t('services.empty')}</p>
          ) : (
            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-8 lg:p-12 grid md:grid-cols-2 gap-x-16 gap-y-12">
                {Object.entries(
                    apiServices.reduce((acc, service) => {
                        const dept = service.department || t('services.other');
                        if (!acc[dept]) acc[dept] = [];
                        acc[dept].push(service);
                        return acc;
                    }, {})
                ).map(([department, deptServices]) => (
                  <div key={department}>
                    <h3 className="text-sm font-bold tracking-widest uppercase text-primary-600 mb-6 border-b border-slate-100 pb-3">
                      {department}
                    </h3>
                    <div className="space-y-4">
                      {deptServices.map(service => (
                        <div key={service.id} className="flex justify-between items-center group">
                          <span className="text-sm font-medium text-slate-700 group-hover:text-primary-700 transition-colors truncate pr-4" title={service.name}>{service.name}</span>
                          <div className="flex-1 border-b border-dashed border-slate-200 opacity-50 group-hover:border-primary-300 transition-colors"></div>
                          <span className="text-sm font-bold text-slate-900 pl-4 whitespace-nowrap">{new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'vi-VN').format(service.price)} VND</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Elegant CTA */}
      <section className="py-32 bg-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-8" strokeWidth={1} />
          <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-8 leading-tight">
            {t('cta.title')} <br /> {t('cta.title2')} <span className="font-bold">{t('cta.titleBold')}</span>
          </h2>
          <p className="text-slate-500 font-light text-lg mb-12">
            {t('cta.description')}
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="group relative inline-flex items-center justify-center overflow-hidden bg-slate-900 text-white px-12 py-5 text-sm font-semibold tracking-[0.1em] uppercase transition-all duration-300 hover:shadow-2xl"
          >
            <span className="relative z-10">{t('cta.button')}</span>
            <div className="absolute inset-0 bg-primary-700 transform scale-x-0 origin-right group-hover:scale-x-100 transition-transform duration-500 ease-out z-0"></div>
          </button>
        </div>
      </section>

      {/* Footer Minimalist */}
      <footer id="contact" className="bg-slate-50 pt-24 pb-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-8">
                <img src={logoUrl} alt="CareS" className="w-8 h-8 rounded-md object-contain" />
                <span className="text-lg font-bold text-slate-900 tracking-widest uppercase">CareS</span>
              </div>
              <p className="text-slate-500 font-light leading-relaxed max-w-sm mb-10">
                {t('footer.description')}
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 border border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-colors">
                  <span className="text-sm font-bold">F</span>
                </a>
                <a href="#" className="w-10 h-10 border border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-colors">
                  <span className="text-sm font-bold">In</span>
                </a>
              </div>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900 mb-8">{t('footer.contact')}</h4>
              <ul className="space-y-6 text-slate-500 font-light">
                <li className="flex gap-4">
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.5} />
                  <span>{t('footer.address')}</span>
                </li>
                <li className="flex gap-4 items-center">
                  <PhoneCall className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.5} />
                  <span>1900 1234</span>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900 mb-8">{t('footer.hours')}</h4>
              <ul className="space-y-4 text-slate-500 font-light">
                <li className="flex justify-between border-b border-slate-200 pb-4">
                  <span>{t('footer.weekdays')}</span>
                  <span className="text-slate-900">07:00 - 20:00</span>
                </li>
                <li className="flex justify-between border-b border-slate-200 pb-4">
                  <span>{t('footer.saturday')}</span>
                  <span className="text-slate-900">07:30 - 17:00</span>
                </li>
                <li className="flex justify-between pt-2">
                  <span>{t('footer.holiday')}</span>
                  <span className="text-primary-600 font-medium">{t('footer.priority')}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200 text-xs text-slate-400 tracking-wider">
            <p>&copy; {new Date().getFullYear()} CareS - {t('footer.copyright')}</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-slate-900 transition-colors">{t('footer.terms')}</a>
              <a href="#" className="hover:text-slate-900 transition-colors">{t('footer.privacy')}</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Guest Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default LandingPage;

import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Activity, ArrowLeft, ArrowRight, Baby, CalendarDays, CheckCircle2,
  ClipboardCheck, Clock3, HeartHandshake, HeartPulse, Mail, MapPin, Menu,
  MessageCircle, Microscope, Phone, Search, ShieldCheck, Sparkles, Star,
  Stethoscope, UserRound, X
} from 'lucide-react';
import logoUrl from '@/assets/logo.jpg';
import {
  previewDoctors, previewJourneySteps, previewServiceGroups,
  previewTestimonials, previewWorkingHours
} from './previewData';
import './preview.css';

const previewNav = [
  ['/preview', 'Trang chủ'],
  ['/preview/services', 'Dịch vụ'],
  ['/preview/doctors', 'Bác sĩ'],
  ['/preview/booking', 'Đặt lịch'],
  ['/preview/journey', 'Hành trình'],
  ['/preview/contact', 'Liên hệ'],
];

const sectionMotion = {
  hidden: { opacity: 0, y: 54, scale: .975, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: .82, ease: [0.22, 1, 0.36, 1] } },
};

const heroSequence = {
  hidden: {},
  visible: { transition: { delayChildren: .15, staggerChildren: .14 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: .75, ease: [0.22, 1, 0.36, 1] } },
};

function Reveal({ children, className = '', delay = 0 }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={sectionMotion}
      initial={reduceMotion ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: .16 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function PreviewHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 28);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-all duration-500 ${scrolled ? 'border-[#102A43]/[.12] bg-white/[.92] shadow-[0_14px_45px_rgba(16,42,67,0.13)]' : 'border-[#102A43]/[.08] bg-white/75 shadow-[0_8px_30px_rgba(16,42,67,0.06)]'}`}>
      <div className={`preview-container flex items-center justify-between gap-5 transition-all duration-500 ${scrolled ? 'h-[66px]' : 'h-[76px]'}`}>
        <Link to="/preview" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src={logoUrl} alt="CareS" className="h-10 w-10 rounded-xl object-cover" />
          <div><p className="font-bold tracking-[.16em] text-[#102A43]">CARES</p><p className="text-[9px] uppercase tracking-[.2em] text-[#2F6FED]">Không gian chăm sóc mới</p></div>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {previewNav.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/preview'} className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-[#102A43] text-white' : 'text-slate-600 hover:bg-[#DDEBFA]/60 hover:text-[#2F6FED]'}`}>{label}</NavLink>
          ))}
        </nav>
        <Link to="/preview/booking" className="hidden rounded-full bg-[#2F6FED] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:-translate-y-0.5 hover:bg-[#245DCE] sm:inline-flex">Đặt lịch thử nghiệm</Link>
        <button type="button" onClick={() => setOpen(!open)} className="rounded-xl p-2 text-[#102A43] lg:hidden" aria-label="Mở menu">{open ? <X /> : <Menu />}</button>
      </div>
      <AnimatePresence>{open && (
        <motion.nav initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .28 }} className="absolute inset-x-0 top-full border-b border-[#102A43]/10 bg-white/95 shadow-xl backdrop-blur-xl lg:hidden">
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .06 } } }} className="preview-container py-3">{previewNav.map(([to, label]) => <motion.div key={to} variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } }}><NavLink to={to} end={to === '/preview'} onClick={() => setOpen(false)} className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm font-medium ${isActive ? 'bg-[#102A43] text-white' : 'text-slate-700 hover:bg-[#DDEBFA]/50'}`}>{label}</NavLink></motion.div>)}</motion.div>
        </motion.nav>
      )}</AnimatePresence>
    </header>
  );
}

function PreviewFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#102A43] pb-8 pt-16 text-white">
      <div className="absolute inset-0 preview-grid-pattern opacity-20" />
      <div className="preview-container relative grid gap-10 md:grid-cols-[1.25fr_.8fr_.8fr]">
        <div><div className="mb-5 flex items-center gap-3"><img src={logoUrl} className="h-12 w-12 rounded-xl" alt="CareS" /><div><p className="text-xl font-bold tracking-[.2em]">CARES</p><p className="text-xs text-[#C8DAF3]">Phòng khám đa khoa thử nghiệm</p></div></div><p className="max-w-md text-sm leading-7 text-[#C8DAF3]/75">Một trải nghiệm y tế rõ ràng, gần gũi và được thiết kế quanh hành trình của người bệnh.</p></div>
        <div><p className="mb-4 font-semibold">Khám phá</p><div className="space-y-3 text-sm text-[#C8DAF3]/75">{previewNav.slice(1).map(([to, label]) => <Link className="block hover:text-white" key={to} to={to}>{label}</Link>)}</div></div>
        <div><p className="mb-4 font-semibold">Thông tin mẫu</p><div className="space-y-3 text-sm text-[#C8DAF3]/75"><p>Khu Công nghệ cao Hòa Lạc, Hà Nội</p><p>1900 1234</p><p>lienhe@cares-preview.vn</p></div></div>
      </div>
      <div className="preview-container relative mt-12 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[#C8DAF3]/50"><p>© 2026 CareS Preview</p><p>Dữ liệu và chức năng trên trang chỉ dùng để thử nghiệm giao diện.</p></div>
    </footer>
  );
}

function PreviewShell({ children }) {
  return <div className="preview-site font-jakarta"><PreviewHeader />{children}<PreviewFooter /></div>;
}

function OrganicScene({ pointer }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div animate={reduceMotion ? {} : { x: pointer.x * 7, y: pointer.y * 5 }} transition={{ type: 'spring', stiffness: 42, damping: 20 }} className="absolute inset-0">
      <svg viewBox="0 0 900 700" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="hill" x1="0" x2="1"><stop stopColor="#BFD5F4"/><stop offset="1" stopColor="#5E91EB"/></linearGradient>
          <linearGradient id="river" x1="0" x2="1"><stop stopColor="#FDE4DE"/><stop offset="1" stopColor="#FF9A86"/></linearGradient>
          <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
        </defs>
        <motion.circle cx="680" cy="170" r="145" fill="#FFDCD4" opacity=".7" animate={reduceMotion ? {} : { cy: [170, 154, 170], scale: [1, 1.05, 1] }} style={{ transformOrigin: '680px 170px' }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}/>
        <circle cx="680" cy="170" r="105" fill="#fff" opacity=".5" filter="url(#blur)"/>
        <motion.path d="M0 470 Q170 360 330 465 T650 445 T900 410 V700 H0Z" fill="url(#hill)" opacity=".82" animate={reduceMotion ? {} : { y: [0, -18, 0], x: [0, 10, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}/>
        <motion.path d="M0 560 Q190 470 350 575 T700 545 T900 530 V700 H0Z" fill="#102A43" opacity=".42" animate={reduceMotion ? {} : { y: [0, 14, 0], x: [0, -12, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}/>
        <motion.path d="M0 570 Q180 515 330 590 T690 578 T900 560" fill="none" stroke="url(#river)" strokeWidth="48" opacity=".9" animate={reduceMotion ? {} : { x: [-12, 14, -12], y: [0, -8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}/>
        <motion.circle cx="670" cy="250" r="132" fill="none" stroke="#2F6FED" strokeWidth="3" strokeDasharray="12 18" opacity=".45" animate={reduceMotion ? {} : { rotate: 360 }} style={{ transformOrigin: '670px 250px' }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}/>
        <motion.circle cx="670" cy="250" r="92" fill="#FFFFFF" opacity=".64" animate={reduceMotion ? {} : { r: [88, 96, 88] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}/>
        <motion.circle cx="548" cy="185" r="18" fill="#FF826C" opacity=".9" animate={reduceMotion ? {} : { cy: [185, 155, 185] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}/><motion.circle cx="790" cy="332" r="13" fill="#2F6FED" opacity=".8" animate={reduceMotion ? {} : { cx: [790, 815, 790], cy: [332, 310, 332] }} transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}/><motion.circle cx="555" cy="350" r="9" fill="#FFB4A6" animate={reduceMotion ? {} : { cy: [350, 375, 350] }} transition={{ duration: 4.5, repeat: Infinity }}/>
        <g transform="translate(670 250)"><path d="M-30 0H30M0-30V30" stroke="#2F6FED" strokeWidth="18" strokeLinecap="round"/></g>
        <motion.path d="M145 255 H205 L230 218 L265 292 L298 244 H365" fill="none" stroke="#FF826C" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" animate={reduceMotion ? {} : { pathLength: [0, 1, 1], opacity: [.2, 1, .2] }} transition={{ duration: 3.2, times: [0, .65, 1], repeat: Infinity, repeatDelay: .6 }}/>
      </svg>
    </motion.div>
  );
}

function Hero() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();
  const updatePointer = event => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({ x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5 });
  };
  return (
    <section onMouseMove={updatePointer} className="relative min-h-[780px] overflow-hidden pb-20 pt-32 lg:min-h-[860px] lg:pt-[110px]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF7F2] via-[#F4F7FC] to-[#DDEBFA]" />
      <div className="preview-aurora absolute -left-40 top-10 h-[440px] w-[440px] bg-[#2F6FED]/25"/>
      <div className="preview-aurora preview-aurora-reverse absolute -right-32 top-24 h-[420px] w-[420px] bg-[#FF826C]/20"/>
      <div className="preview-light-sweep absolute inset-0"/>
      <div className="preview-particles absolute inset-0" aria-hidden="true">{Array.from({length: 14}).map((_, index) => <i key={index} style={{ left: `${4 + index * 6.7}%`, top: `${10 + ((index * 17) % 70)}%`, width: `${3 + (index % 4) * 2}px`, height: `${3 + (index % 4) * 2}px`, animationDuration: `${5.5 + (index % 5) * 1.1}s`, animationDelay: `${index * -.55}s` }} />)}</div>
      <div className="preview-leaf left-[8%] top-[20%]"/><div className="preview-leaf right-[12%] top-[24%] [animation-delay:-3s]"/><div className="preview-leaf bottom-[18%] left-[42%] [animation-delay:-6s]"/>
      <div className="preview-container relative grid items-center gap-8 lg:min-h-[720px] lg:grid-cols-[minmax(0,1.08fr)_minmax(500px,.92fr)] lg:gap-12">
        <motion.div variants={heroSequence} initial="hidden" animate="visible" className="max-w-[720px]">
          <motion.div variants={heroItem} className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#2F6FED]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[.18em] text-[#2F6FED] backdrop-blur"><Sparkles className="preview-icon-pulse h-4 w-4"/> Chăm sóc bắt đầu từ sự thấu hiểu</motion.div>
          <motion.h1 variants={heroItem} className="text-5xl font-semibold leading-[1.04] tracking-[-.055em] text-[#102A43] sm:text-6xl lg:text-[72px]">Kết nối bạn với một hành trình <span className="font-serif italic text-[#FF826C]">khỏe mạnh</span> hơn.</motion.h1>
          <motion.p variants={heroItem} className="mt-7 max-w-[620px] text-base leading-8 text-[#66788A] sm:text-lg">Từ đặt lịch, thăm khám đến nhận kết quả — CareS giúp mỗi bước trở nên rõ ràng, nhẹ nhàng và gần gũi.</motion.p>
          <motion.div variants={heroItem} className="mt-9 flex flex-wrap gap-3"><Link to="/preview/booking" className="preview-shine-button group inline-flex items-center gap-3 overflow-hidden rounded-full bg-[#102A43] px-7 py-4 font-semibold text-white shadow-xl shadow-blue-950/15 transition hover:-translate-y-1">Bắt đầu đặt lịch <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1"/></Link><Link to="/preview/services" className="group inline-flex items-center gap-3 rounded-full border border-[#102A43]/10 bg-white/75 px-7 py-4 font-semibold text-[#2F6FED] backdrop-blur transition hover:-translate-y-1 hover:bg-white"><Search className="h-5 w-5 transition group-hover:scale-110"/> Tìm dịch vụ</Link></motion.div>
          <motion.div variants={heroItem} className="mt-12 grid max-w-xl grid-cols-3 gap-5 border-t border-[#102A43]/10 pt-6"><div><b className="text-2xl">20+</b><p className="mt-1 text-xs text-slate-500">Dịch vụ mẫu</p></div><div><b className="text-2xl">06</b><p className="mt-1 text-xs text-slate-500">Chuyên khoa</p></div><div><b className="text-2xl">24/7</b><p className="mt-1 text-xs text-slate-500">Theo dõi hành trình</p></div></motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: .9, x: 45 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 1.05, delay: .35, ease: [0.22, 1, 0.36, 1] }} className="relative min-h-[420px] lg:min-h-[620px]"><OrganicScene pointer={pointer}/><div className="preview-floating-card left-[3%] top-[15%]"><CalendarDays/><span><b>Đặt lịch nhanh</b><small>Chọn thời gian phù hợp</small></span></div><div className="preview-floating-card preview-float-card-delay right-[1%] top-[48%]"><Activity/><span><b>Theo dõi hành trình</b><small>Cập nhật theo thời gian thực</small></span></div><div className="preview-floating-card preview-float-card-reverse bottom-[10%] left-[18%]"><ShieldCheck/><span><b>An toàn dữ liệu</b><small>Bảo vệ thông tin sức khỏe</small></span></div></motion.div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FAF7F2] to-transparent"/>
    </section>
  );
}

const quickActions = [
  [CalendarDays, 'Đặt lịch nhanh', 'Chọn dịch vụ và thời gian phù hợp.', '/preview/booking'],
  [Search, 'Tìm dịch vụ', 'Khám phá theo nhu cầu sức khỏe.', '/preview/services'],
  [Activity, 'Theo dõi lượt khám', 'Biết mình đang ở bước nào.', '/preview/journey'],
  [MessageCircle, 'Yêu cầu liên hệ', 'Để CareS chủ động gọi lại cho bạn.', '/preview/contact'],
];

export function PreviewHomePage() {
  return (
    <PreviewShell>
      <Hero />
      <main>
        <section className="preview-container relative z-10 -mt-8"><Reveal className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{quickActions.map(([Icon,title,desc,to]) => <Link key={title} to={to} className="preview-glass preview-cinematic-card group rounded-3xl p-5 transition"><div className="mb-5 flex items-center justify-between"><span className="preview-card-icon grid h-11 w-11 place-items-center rounded-2xl bg-[#DDEBFA] text-[#2F6FED]"><Icon className="h-5 w-5"/></span><ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#FF826C]"/></div><h3 className="font-semibold text-[#102A43]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#66788A]">{desc}</p></Link>)}</Reveal></section>
        <section className="preview-container py-24"><Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6"><div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#2F6FED]">Dịch vụ nổi bật</p><h2 className="max-w-2xl text-4xl font-semibold tracking-[-.04em] text-[#102A43] sm:text-5xl">Chăm sóc toàn diện trong một hệ sinh thái.</h2></div><Link to="/preview/services" className="inline-flex items-center gap-2 font-semibold text-[#2F6FED]">Xem tất cả <ArrowRight className="h-4 w-4"/></Link></Reveal><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{previewServiceGroups.slice(0, 3).map((group, index) => <Reveal key={group.id} delay={index * .08}><ServiceCard group={group}/></Reveal>)}</div></section>
        <section className="preview-dark-section bg-[#102A43] py-24 text-white"><div className="preview-container grid gap-14 lg:grid-cols-[.8fr_1.2fr]"><Reveal><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#FF9D8C]">Một hành trình rõ ràng</p><h2 className="text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Bạn luôn biết bước tiếp theo là gì.</h2><p className="mt-6 max-w-lg leading-8 text-[#DDEBFA]/70">CareS kết nối tiếp nhận, thanh toán, phòng khám và cận lâm sàng trong một hành trình thống nhất.</p><Link to="/preview/journey" className="preview-shine-button mt-8 inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3 font-semibold text-[#102A43]">Xem hành trình mẫu <ArrowRight className="h-4 w-4"/></Link></Reveal><Reveal className="preview-step-grid grid gap-4 sm:grid-cols-2">{previewJourneySteps.slice(0,4).map((step,index) => <div key={step.title} className="preview-cinematic-card rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"><div className="mb-4 flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#FF826C] font-bold text-white">{index+1}</span><CheckCircle2 className="h-5 w-5 text-[#FF9D8C]"/></div><h3 className="font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-[#DDEBFA]/65">{step.description}</p></div>)}</Reveal></div></section>
        <section className="preview-container py-24"><Reveal className="text-center"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#2F6FED]">Đội ngũ chuyên môn</p><h2 className="text-4xl font-semibold tracking-[-.04em] text-[#102A43] sm:text-5xl">Những người đồng hành đáng tin cậy.</h2></Reveal><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{previewDoctors.map((doctor,index) => <Reveal key={doctor.id} delay={index*.06}><DoctorCard doctor={doctor}/></Reveal>)}</div></section>
        <section className="preview-container pb-24"><div className="preview-testimonial-stage rounded-[42px] bg-gradient-to-br from-[#DDEBFA] via-[#EEF4FB] to-[#FFE5DF] p-7 sm:p-12"><Reveal className="grid gap-5 md:grid-cols-3">{previewTestimonials.map(item => <div key={item.name} className="preview-cinematic-card rounded-3xl bg-white/75 p-6"><div className="mb-5 flex gap-1 text-[#FF826C]">{Array.from({length:5}).map((_,i)=><Star key={i} className="preview-star h-4 w-4 fill-current" style={{ animationDelay: `${i * .1}s` }}/>)}</div><p className="leading-7 text-[#40566C]">“{item.content}”</p><div className="mt-6"><p className="font-semibold text-[#102A43]">{item.name}</p><p className="text-xs text-[#66788A]">{item.role}</p></div></div>)}</Reveal></div></section>
      </main>
    </PreviewShell>
  );
}

function ServiceCard({ group }) {
  const icons = { internal: HeartPulse, surgery: ShieldCheck, pediatrics: Baby, obstetrics: HeartHandshake, dermatology: Sparkles, clinical: Microscope };
  const Icon = icons[group.id] || Stethoscope;
  return <article className={`preview-organic-card preview-cinematic-card h-full rounded-[32px] bg-gradient-to-br ${group.accent} p-7 text-[#102A43] transition duration-500`}><div className="mb-8 flex items-center justify-between"><span className="preview-card-icon grid h-14 w-14 place-items-center rounded-2xl bg-white/80 text-[#2F6FED]"><Icon/></span><span className="text-xs font-semibold uppercase tracking-[.16em] text-[#2F6FED]/70">{group.eyebrow}</span></div><h3 className="text-2xl font-semibold">{group.name}</h3><p className="mt-3 min-h-[52px] text-sm leading-6 text-[#66788A]">{group.description}</p><div className="mt-6 space-y-2">{group.services.slice(0,3).map(service => <p key={service} className="flex items-center gap-2 text-sm text-[#40566C]"><span className="h-1.5 w-1.5 rounded-full bg-[#FF826C]"/>{service}</p>)}</div></article>;
}

function DoctorCard({ doctor }) {
  return <article className="preview-cinematic-card group overflow-hidden rounded-[30px] border border-[#102A43]/5 bg-white shadow-sm transition duration-500"><div className={`relative grid h-64 place-items-center bg-gradient-to-br ${doctor.tone}`}><div className="absolute h-36 w-36 rounded-full border border-white/60 bg-white/35 backdrop-blur preview-float-slow"/><div className="preview-doctor-avatar relative grid h-24 w-24 place-items-center rounded-full bg-[#102A43] text-2xl font-bold text-white shadow-xl">{doctor.initials}</div><div className="absolute bottom-4 right-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#2F6FED] backdrop-blur">{doctor.specialty}</div></div><div className="p-5"><h3 className="font-semibold text-[#102A43]">{doctor.name}</h3><p className="mt-1 text-xs text-[#2F6FED]">{doctor.experience}</p><p className="mt-4 text-sm leading-6 text-[#66788A]">“{doctor.quote}”</p></div></article>;
}

function SubpageHero({ eyebrow, title, description, icon: Icon }) {
  return <section className="relative overflow-hidden pb-16 pt-36"><div className="absolute inset-0 bg-gradient-to-br from-[#FAF7F2] via-[#F4F7FC] to-[#DDEBFA]"/><div className="preview-aurora absolute -right-20 top-10 h-72 w-72 bg-[#FF826C]/[.18]"/><div className="preview-light-sweep absolute inset-0"/><div className="absolute right-[8%] top-24 h-56 w-56 rounded-full border-[34px] border-white/45 preview-pulse-soft"/><div className="preview-container relative"><Link to="/preview" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-[#2F6FED]"><ArrowLeft className="h-4 w-4"/> Về trang preview</Link><motion.div variants={heroSequence} initial="hidden" animate="visible" className="max-w-3xl"><motion.div variants={heroItem} className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-[#2F6FED]">{Icon && <Icon className="preview-icon-pulse h-4 w-4"/>}{eyebrow}</motion.div><motion.h1 variants={heroItem} className="text-5xl font-semibold tracking-[-.05em] text-[#102A43] sm:text-6xl">{title}</motion.h1><motion.p variants={heroItem} className="mt-6 max-w-2xl text-lg leading-8 text-[#66788A]">{description}</motion.p></motion.div></div></section>;
}

export function PreviewServicesPage() {
  const [active, setActive] = useState('all');
  const groups = active === 'all' ? previewServiceGroups : previewServiceGroups.filter(group => group.id === active);
  return <PreviewShell><SubpageHero eyebrow="Danh mục chăm sóc" title="Dịch vụ phù hợp cho từng nhu cầu." description="Khám phá các nhóm dịch vụ minh họa trong hệ sinh thái CareS." icon={Stethoscope}/><main className="preview-container py-20"><div className="mb-10 flex flex-wrap gap-2"><FilterPill active={active==='all'} onClick={()=>setActive('all')} layoutId="service-filter">Tất cả</FilterPill>{previewServiceGroups.map(group=><FilterPill key={group.id} active={active===group.id} onClick={()=>setActive(group.id)} layoutId="service-filter">{group.name}</FilterPill>)}</div><motion.div layout className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{groups.map(group=><motion.div layout initial={{opacity:0,scale:.92,y:22}} animate={{opacity:1,scale:1,y:0}} transition={{duration:.45}} key={group.id}><ServiceCard group={group}/><div className="mt-3 rounded-3xl border border-[#102A43]/5 bg-white p-5">{group.services.map((service,index)=><div key={service} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"><span className="text-sm font-medium text-[#102A43]">{service}</span><span className="text-xs text-[#66788A]">DV-{group.id.slice(0,2).toUpperCase()}0{index+1}</span></div>)}</div></motion.div>)}</motion.div></main></PreviewShell>;
}

function FilterPill({ active, onClick, children, layoutId }) {
  return <button type="button" onClick={onClick} className={`relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold transition ${active ? 'text-white' : 'bg-white text-[#66788A] hover:text-[#2F6FED]'}`}>{active && <motion.span layoutId={layoutId} className="absolute inset-0 bg-[#102A43]" transition={{type:'spring',stiffness:420,damping:34}}/>}<span className="relative z-10">{children}</span></button>;
}

export function PreviewDoctorsPage() {
  const specialties = ['Tất cả', ...new Set(previewDoctors.map(item=>item.specialty))];
  const [active, setActive] = useState('Tất cả');
  const doctors = active === 'Tất cả' ? previewDoctors : previewDoctors.filter(item=>item.specialty===active);
  return <PreviewShell><SubpageHero eyebrow="Đội ngũ CareS" title="Chuyên môn vững vàng, kết nối chân thành." description="Hồ sơ bác sĩ dưới đây là dữ liệu minh họa cho giao diện thử nghiệm." icon={UserRound}/><main className="preview-container py-20"><div className="mb-10 flex flex-wrap gap-2">{specialties.map(item=><FilterPill key={item} active={active===item} onClick={()=>setActive(item)} layoutId="doctor-filter">{item}</FilterPill>)}</div><motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{doctors.map(doctor=><motion.div layout initial={{opacity:0,y:24,scale:.94}} animate={{opacity:1,y:0,scale:1}} key={doctor.id}><DoctorCard doctor={doctor}/></motion.div>)}</motion.div><div className="preview-dark-section mt-16 grid gap-5 rounded-[36px] bg-[#102A43] p-8 text-white md:grid-cols-3">{[['Tận tâm','Lắng nghe và giải thích rõ ràng.'],['Phối hợp','Kết nối nhiều chuyên khoa khi cần.'],['Theo dõi','Đồng hành sau khi kết thúc lượt khám.']].map(([title,desc])=><div key={title} className="preview-cinematic-card rounded-3xl bg-white/5 p-6"><CheckCircle2 className="mb-4 text-[#FF826C]"/><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-[#DDEBFA]/65">{desc}</p></div>)}</div></main></PreviewShell>;
}

const bookingSteps = ['Dịch vụ', 'Thời gian', 'Thông tin', 'Xác nhận'];
export function PreviewBookingPage() {
  const [step, setStep] = useState(0);
  return <PreviewShell><SubpageHero eyebrow="Đặt lịch trực tuyến" title="Chọn lịch khám theo cách của bạn." description="Quy trình minh họa gồm bốn bước, hiện chưa gửi dữ liệu vào hệ thống." icon={CalendarDays}/><main className="preview-container py-20"><div className="mx-auto max-w-6xl"><div className="mb-8 grid grid-cols-4 gap-2">{bookingSteps.map((item,index)=><button type="button" onClick={()=>setStep(index)} key={item} className="text-left"><span className="mb-2 block h-1.5 overflow-hidden rounded-full bg-[#102A43]/10"><motion.span className="block h-full origin-left rounded-full bg-gradient-to-r from-[#2F6FED] to-[#FF826C]" animate={{scaleX:index<=step?1:0}} transition={{duration:.45,ease:[.22,1,.36,1]}}/></span><span className={`text-xs font-semibold transition-colors ${index===step?'text-[#2F6FED]':'text-slate-400'}`}>{index+1}. {item}</span></button>)}</div><div className="preview-glass grid min-h-[520px] overflow-hidden rounded-[38px] lg:grid-cols-[1.15fr_.85fr]"><div className="overflow-hidden p-7 sm:p-10"><AnimatePresence mode="wait"><motion.div key={step} initial={{opacity:0,x:45,filter:'blur(8px)'}} animate={{opacity:1,x:0,filter:'blur(0px)'}} exit={{opacity:0,x:-35,filter:'blur(6px)'}} transition={{duration:.38,ease:[.22,1,.36,1]}}><BookingStep step={step}/></motion.div></AnimatePresence><div className="mt-10 flex justify-between"><button type="button" disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))} className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold transition hover:-translate-x-1 disabled:opacity-30">Quay lại</button>{step<3?<button type="button" onClick={()=>setStep(step+1)} className="preview-shine-button overflow-hidden rounded-full bg-[#102A43] px-7 py-3 text-sm font-semibold text-white">Tiếp tục</button>:<button type="button" className="cursor-default rounded-full bg-[#2F6FED] px-7 py-3 text-sm font-semibold text-white">Bản thử nghiệm – chưa gửi dữ liệu</button>}</div></div><aside className="preview-booking-aside bg-[#102A43] p-8 text-white sm:p-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#FF9D8C]">Lịch hẹn của bạn</p><div className="mt-8 space-y-5">{[['Dịch vụ','Khám Nội tổng quát'],['Thời gian','08:30 · Thứ Hai, 31/08'],['Bác sĩ','Hệ thống gợi ý'],['Chi phí dự kiến','200.000 đ']].map(([label,value],index)=><motion.div initial={{opacity:0,x:22}} whileInView={{opacity:1,x:0}} transition={{delay:index*.08}} key={label} className="border-b border-white/10 pb-4"><p className="text-xs text-[#DDEBFA]/55">{label}</p><p className="mt-1 font-semibold">{value}</p></motion.div>)}</div><div className="mt-8 rounded-3xl bg-white/5 p-5 text-sm leading-6 text-[#DDEBFA]/70">Thông tin chỉ dùng để minh họa bố cục. Không có lịch hẹn nào được tạo.</div></aside></div></div></main></PreviewShell>;
}

function BookingStep({ step }) {
  if(step===0) return <div><h2 className="text-2xl font-semibold text-[#102A43]">Bạn cần chăm sóc điều gì?</h2><p className="mt-2 text-sm text-[#66788A]">Chọn một nhóm dịch vụ mẫu.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{previewServiceGroups.slice(0,4).map((group,index)=><label key={group.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4"><input type="radio" name="demo-service" defaultChecked={index===0} className="accent-[#2F6FED]"/><span><b className="block text-sm text-[#102A43]">{group.name}</b><small className="text-slate-400">{group.services[0]}</small></span></label>)}</div></div>;
  if(step===1) return <div><h2 className="text-2xl font-semibold text-[#102A43]">Chọn thời gian thuận tiện</h2><div className="mt-7 grid grid-cols-3 gap-3">{['29/08','30/08','31/08'].map((date,index)=><button type="button" key={date} className={`rounded-2xl border p-4 text-sm ${index===2?'border-[#2F6FED] bg-[#DDEBFA] text-[#102A43]':'border-slate-200 bg-white'}`}><b className="block">{date}</b><span className="text-xs text-slate-400">2026</span></button>)}</div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{['08:00','08:30','09:00','14:00','15:30','18:00'].map((time,index)=><button type="button" key={time} className={`rounded-xl px-4 py-3 text-sm font-semibold ${index===1?'bg-[#102A43] text-white':'bg-white text-slate-600'}`}>{time}</button>)}</div></div>;
  if(step===2) return <div><h2 className="text-2xl font-semibold">Thông tin người khám</h2><div className="mt-7 grid gap-4 sm:grid-cols-2"><DemoInput label="Họ và tên" placeholder="Nguyễn Văn An"/><DemoInput label="Số điện thoại" placeholder="09xx xxx xxx"/><DemoInput label="Ngày sinh" type="date"/><DemoInput label="Email" placeholder="email@example.com"/><label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-slate-500">Ghi chú</span><textarea rows="4" className="w-full rounded-2xl border border-slate-200 bg-white/75 p-4 outline-none" placeholder="Nhu cầu cần hỗ trợ..."/></label></div></div>;
  return <div><div className="grid h-16 w-16 place-items-center rounded-full bg-[#DDEBFA] text-[#2F6FED]"><ClipboardCheck/></div><h2 className="mt-6 text-3xl font-semibold text-[#102A43]">Kiểm tra thông tin trước khi xác nhận.</h2><p className="mt-4 max-w-lg leading-7 text-[#66788A]">Trong phiên bản thật, hệ thống sẽ xác thực dữ liệu, kiểm tra lịch trống và gửi thông báo xác nhận.</p><div className="mt-7 rounded-2xl border border-[#FF826C]/30 bg-[#FFF0EC] p-4 text-sm text-[#A63E2D]">Đây là giao diện thử nghiệm. Nút xác nhận không gọi API.</div></div>;
}

function DemoInput({label,type='text',placeholder=''}) { return <label><span className="mb-2 block text-xs font-semibold text-[#66788A]">{label}</span><input type={type} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-slate-200 bg-white/75 px-4 outline-none focus:border-[#2F6FED]"/></label>; }

export function PreviewJourneyPage() {
  return <PreviewShell><SubpageHero eyebrow="Theo dõi trực tiếp" title="Biết mình đang ở đâu trong hành trình khám." description="Nhập mã lượt khám để theo dõi; trang này đang hiển thị một hành trình giả lập." icon={Activity}/><main className="preview-container py-20"><div className="mx-auto max-w-6xl"><div className="preview-glass rounded-[36px] p-6 sm:p-9"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input className="h-14 w-full rounded-2xl border border-slate-200 bg-white/75 pl-12 pr-4 outline-none focus:border-[#2F6FED]" placeholder="Nhập mã lượt khám, ví dụ VIS-DEMO01"/></div><button type="button" className="preview-shine-button overflow-hidden rounded-2xl bg-[#102A43] px-7 font-semibold text-white">Xem hành trình mẫu</button></div><p className="mt-3 text-xs text-slate-400">Bản thử nghiệm – không tra cứu dữ liệu thật.</p></div><div className="mt-8 grid gap-6 lg:grid-cols-[.7fr_1.3fr]"><aside className="preview-dark-section rounded-[34px] bg-[#102A43] p-7 text-white"><span className="preview-current-status rounded-full bg-[#FF826C] px-3 py-1 text-xs font-bold text-white">ĐANG CHỜ</span><h2 className="mt-6 text-3xl font-semibold">Phòng Nội 02</h2><p className="mt-2 text-[#DDEBFA]/65">Khám Nội tổng quát</p><div className="my-8 h-px bg-white/10"/><div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-[#DDEBFA]/55">Số thứ tự</p><b className="mt-1 block text-4xl">008</b></div><div><p className="text-xs text-[#DDEBFA]/55">Phía trước</p><b className="mt-1 block text-4xl">02</b></div></div></aside><section className="rounded-[34px] border border-[#102A43]/5 bg-white p-7"><h2 className="text-xl font-semibold text-[#102A43]">Các bước trong lượt khám</h2><div className="mt-8 space-y-0">{previewJourneySteps.map((item,index)=><motion.div initial={{opacity:0,x:25}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:index*.1}} key={item.title} className="relative flex gap-5 pb-8 last:pb-0"><div className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ${item.status==='Hoàn thành'?'bg-[#2F6FED] text-white':item.status==='Đang chờ'?'preview-current-status bg-[#FFF0EC] text-[#C34F3A]':'bg-slate-100 text-slate-400'}`}>{index+1}</div>{index<previewJourneySteps.length-1&&<motion.div initial={{scaleY:0}} whileInView={{scaleY:1}} viewport={{once:true}} transition={{duration:.65,delay:index*.1}} className="absolute bottom-0 left-5 top-10 w-px origin-top bg-gradient-to-b from-[#2F6FED] to-slate-200"/>}<div className="pt-1"><div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold text-[#102A43]">{item.title}</h3><span className="text-xs text-slate-400">{item.status}</span></div><p className="mt-1 text-sm text-[#66788A]">{item.description}</p></div></motion.div>)}</div></section></div></div></main></PreviewShell>;
}

export function PreviewContactPage() {
  return <PreviewShell><SubpageHero eyebrow="Kết nối với CareS" title="Chúng tôi sẵn sàng lắng nghe." description="Gửi nhu cầu tư vấn hoặc xem thông tin liên hệ và giờ hoạt động mẫu." icon={MessageCircle}/><main className="preview-container py-20"><div className="grid gap-6 lg:grid-cols-[.82fr_1.18fr]"><section className="space-y-5"><div className="preview-dark-section rounded-[32px] bg-[#102A43] p-7 text-white"><h2 className="text-2xl font-semibold">Thông tin liên hệ</h2><div className="mt-7 space-y-5">{[[Phone,'1900 1234'],[Mail,'lienhe@cares-preview.vn'],[MapPin,'Khu Công nghệ cao Hòa Lạc, Hà Nội']].map(([Icon,text],index)=><motion.div initial={{opacity:0,x:-22}} whileInView={{opacity:1,x:0}} transition={{delay:index*.1}} className="flex gap-4" key={text}><span className="preview-card-icon grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#FF9D8C]"><Icon className="h-5 w-5"/></span><p className="pt-2 text-sm text-[#DDEBFA]/80">{text}</p></motion.div>)}</div></div><div className="preview-cinematic-card rounded-[32px] border border-[#102A43]/5 bg-white p-7"><div className="mb-5 flex items-center gap-3"><Clock3 className="preview-icon-pulse text-[#2F6FED]"/><h2 className="text-xl font-semibold text-[#102A43]">Giờ hoạt động mẫu</h2></div>{previewWorkingHours.map(([label,time])=><div key={label} className="flex justify-between border-b border-slate-100 py-3 text-sm last:border-0"><span className="text-[#66788A]">{label}</span><b className="text-[#102A43]">{time}</b></div>)}</div></section><section className="preview-glass rounded-[36px] p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#2F6FED]">Yêu cầu liên hệ</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] text-[#102A43]">CareS có thể giúp gì cho bạn?</h2><div className="mt-8 grid gap-4 sm:grid-cols-2"><DemoInput label="Họ và tên" placeholder="Nguyễn Văn An"/><DemoInput label="Số điện thoại" placeholder="09xx xxx xxx"/><DemoInput label="Email" placeholder="email@example.com"/><DemoInput label="Chủ đề" placeholder="Tư vấn dịch vụ"/><label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-[#66788A]">Nội dung cần hỗ trợ</span><textarea rows="6" className="w-full rounded-2xl border border-slate-200 bg-white/75 p-4 outline-none transition focus:border-[#2F6FED] focus:shadow-[0_0_0_4px_rgba(47,111,237,.1)]" placeholder="Nhập nội dung..."/></label></div><button type="button" className="preview-shine-button mt-6 w-full overflow-hidden rounded-2xl bg-[#102A43] px-7 py-4 font-semibold text-white">Bản thử nghiệm – chưa gửi dữ liệu</button></section></div><div className="preview-map-stage preview-grid-pattern mt-7 grid min-h-[300px] place-items-center overflow-hidden rounded-[36px] bg-[#DDEBFA]"><div className="preview-map-radar"><span/><span/><span/></div><div className="preview-glass relative z-10 rounded-3xl p-6 text-center"><span className="preview-map-pin relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-white"><MapPin className="h-9 w-9 text-[#FF826C]"/></span><p className="mt-3 font-semibold text-[#102A43]">Bản đồ vị trí phòng khám</p><p className="mt-1 text-xs text-[#66788A]">Khu vực bản đồ minh họa</p></div></div></main></PreviewShell>;
}

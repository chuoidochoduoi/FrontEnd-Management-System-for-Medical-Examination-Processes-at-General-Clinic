import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowRight, CalendarDays, CheckCircle2, Clock3, HeartPulse, Microscope, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicSiteShell from '@/components/public/PublicSiteShell';
import PublicScheduleTeaser from '@/components/public/PublicScheduleTeaser';
import { CaresButton } from '@/components/ui/CaresUI';
import { useAppointment } from '@/hooks/useAppointment';
import useClinicInformation from '@/hooks/useClinicInformation';
import { getVisibleAnnouncements } from '@/services/publicAnnouncementService';
import { announcementSignature, DISMISSED_ANNOUNCEMENTS_KEY, persistAnnouncementDismissal, readDismissedAnnouncements } from '@/utils/announcementDismissals';

const reveal = { hidden: { opacity: 0, y: 34 }, visible: { opacity: 1, y: 0, transition: { duration: .68, ease: [.22, 1, .36, 1] } } };
const formatMoney = value => new Intl.NumberFormat('vi-VN').format(Number(value || 0));
const initialsOf = name => (name || 'BS').trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();

function HomeAnnouncement({ announcements, dismiss }) {
  if (!announcements.length) return null;
  return <div className="cares-home-announcements" aria-live="polite">{announcements.slice(0, 3).map(item => <motion.article layout initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} key={item.announcementId}><Clock3 size={19} /><div><strong>{item.title}</strong><p>{item.content}</p></div><button type="button" onClick={() => dismiss(item)} aria-label={`Đóng ${item.title}`}>×</button></motion.article>)}</div>;
}

function HomeMedicalScene({ pointer }) {
  const reduced = useReducedMotion();
  return (
    <div className="cares-home-scene" aria-hidden="true">
      <motion.div
        className="cares-home-scene-layer"
        animate={reduced ? {} : { x: pointer.x * 7, y: pointer.y * 5 }}
        transition={{ type: 'spring', stiffness: 42, damping: 20 }}
      >
        <svg viewBox="0 0 900 700">
          <defs>
            <linearGradient id="cares-home-hill" x1="0" x2="1"><stop stopColor="#CDEFE8" /><stop offset="1" stopColor="#53BCAF" /></linearGradient>
            <linearGradient id="cares-home-river" x1="0" x2="1"><stop stopColor="#E5F7F3" /><stop offset="1" stopColor="#67CABD" /></linearGradient>
            <filter id="cares-home-blur"><feGaussianBlur stdDeviation="18" /></filter>
          </defs>
          <motion.circle cx="680" cy="170" r="145" fill="#E3F7F3" opacity=".8" animate={reduced ? {} : { cy: [170, 154, 170], scale: [1, 1.05, 1] }} style={{ transformOrigin: '680px 170px' }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="680" cy="170" r="105" fill="#fff" opacity=".5" filter="url(#cares-home-blur)" />
          <motion.path d="M0 470 Q170 360 330 465 T650 445 T900 410 V700 H0Z" fill="url(#cares-home-hill)" opacity=".82" animate={reduced ? {} : { y: [0, -18, 0], x: [0, 10, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M0 560 Q190 470 350 575 T700 545 T900 530 V700 H0Z" fill="#123C3A" opacity=".42" animate={reduced ? {} : { y: [0, 14, 0], x: [0, -12, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M0 570 Q180 515 330 590 T690 578 T900 560" fill="none" stroke="url(#cares-home-river)" strokeWidth="48" opacity=".9" animate={reduced ? {} : { x: [-12, 14, -12], y: [0, -8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="670" cy="250" r="132" fill="none" stroke="#18A89B" strokeWidth="3" strokeDasharray="12 18" opacity=".48" animate={reduced ? {} : { rotate: 360 }} style={{ transformOrigin: '670px 250px' }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }} />
          <motion.circle cx="670" cy="250" r="92" fill="#FFFFFF" opacity=".64" animate={reduced ? {} : { r: [88, 96, 88] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="548" cy="185" r="18" fill="#57C6B5" opacity=".9" animate={reduced ? {} : { cy: [185, 155, 185] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="790" cy="332" r="13" fill="#18A89B" opacity=".8" animate={reduced ? {} : { cx: [790, 815, 790], cy: [332, 310, 332] }} transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="555" cy="350" r="9" fill="#B3ECE3" animate={reduced ? {} : { cy: [350, 375, 350] }} transition={{ duration: 4.5, repeat: Infinity }} />
          <g transform="translate(670 250)"><path d="M-30 0H30M0-30V30" stroke="#18A89B" strokeWidth="18" strokeLinecap="round" /></g>
          <motion.path d="M145 255 H205 L230 218 L265 292 L298 244 H365" fill="none" stroke="#57C6B5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" animate={reduced ? {} : { pathLength: [0, 1, 1], opacity: [.2, 1, .2] }} transition={{ duration: 3.2, times: [0, .65, 1], repeat: Infinity, repeatDelay: .6 }} />
        </svg>
      </motion.div>
      <span className="cares-home-float-card first"><CalendarDays size={19} /><span><b>Đặt lịch nhanh</b><small>Chọn thời gian phù hợp</small></span></span>
      <span className="cares-home-float-card middle"><Activity size={19} /><span><b>Theo dõi hành trình</b><small>Cập nhật theo thời gian thực</small></span></span>
      <span className="cares-home-float-card second"><ShieldCheck size={19} /><span><b>An toàn dữ liệu</b><small>Bảo vệ thông tin sức khỏe</small></span></span>
    </div>
  );
}

export default function PublicHomePage() {
  const navigate = useNavigate();
  const { services, loadingServices } = useAppointment();
  const { clinicInformation } = useClinicInformation();
  const [doctors, setDoctors] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(readDismissedAnnouncements);
  const unsavedDismissals = useRef({});
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const syncDismissals = event => {
      if (event && event.key !== null && event.key !== DISMISSED_ANNOUNCEMENTS_KEY) return;
      if (event) {
        try {
          if (event.storageArea !== window.localStorage) return;
        } catch { return; }
      }
      setDismissed({ ...readDismissedAnnouncements(), ...unsavedDismissals.current });
    };
    window.addEventListener('storage', syncDismissals);
    // Catch changes between the initial render and listener registration.
    syncDismissals();
    return () => window.removeEventListener('storage', syncDismissals);
  }, []);

  const dismissAnnouncement = item => {
    const signature = announcementSignature(item);
    const result = persistAnnouncementDismissal(item);
    if (!result.saved) unsavedDismissals.current[item.announcementId] = signature;
    else delete unsavedDismissals.current[item.announcementId];
    setDismissed(current => ({ ...current, ...result.dismissed, ...unsavedDismissals.current }));
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBase}/api/v1/staff/public/doctors`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : [])
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => setDoctors([]));
    getVisibleAnnouncements().then(data => setAnnouncements(Array.isArray(data) ? data : [])).catch(() => setAnnouncements([]));
    return () => controller.abort();
  }, [apiBase]);

  const highlightedServices = useMemo(() => services.slice(0, 6), [services]);
  const visibleAnnouncements = announcements.filter(item => dismissed[item.announcementId] !== announcementSignature(item));

  return (
    <PublicSiteShell pageClassName="cares-public-home">
      <HomeAnnouncement announcements={visibleAnnouncements} dismiss={dismissAnnouncement} />
      <section className="cares-home-v2-hero" onMouseMove={event => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({ x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5 });
      }} onMouseLeave={() => setPointer({ x: 0, y: 0 })}>
        <div className="cares-home-v2-particles" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--x': `${7 + index * 8}%`, '--y': `${12 + (index * 17) % 72}%`, '--delay': `${index * -.45}s` }} />)}</div>
        <div className="cares-public-container cares-home-v2-grid">
          <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: .12 }}>
            <motion.span variants={reveal} className="cares-eyebrow"><Sparkles size={16} /> Chăm sóc bắt đầu từ sự thấu hiểu</motion.span>
            <motion.h1 variants={reveal}>Mỗi bước chăm sóc đều <em>rõ ràng</em> <span className="cares-home-hero-closing">và gần gũi.</span></motion.h1>
            <motion.p variants={reveal}>{clinicInformation.shortDescription || 'CareS kết nối đặt lịch, tiếp nhận, thăm khám và nhận kết quả trong một hành trình thống nhất.'}</motion.p>
            <motion.div variants={reveal} className="cares-home-v2-actions"><CaresButton size="lg" icon={CalendarDays} onClick={() => navigate('/appointment')}>Bắt đầu đặt lịch</CaresButton><CaresButton size="lg" variant="secondary" icon={Stethoscope} onClick={() => navigate('/services')}>Tìm dịch vụ</CaresButton></motion.div>
            <motion.div variants={reveal} className="cares-home-v2-metrics"><div><strong>{services.length || '20'}+</strong><span>Dịch vụ đang áp dụng</span></div><div><strong>{doctors.length || '—'}</strong><span>Bác sĩ công khai</span></div><div><strong>03</strong><span>Ca hoạt động mỗi ngày</span></div></motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: .92, x: 35 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: .9, delay: .22, ease: [.22, 1, .36, 1] }}><HomeMedicalScene pointer={pointer} /></motion.div>
        </div>
      </section>

      <section className="cares-public-container cares-home-v2-quick">
        {[ [CalendarDays, 'Đặt lịch trực tuyến', 'Chọn dịch vụ và ca khám phù hợp.', '/appointment'], [Stethoscope, 'Khám phá dịch vụ', 'Xem mô tả và giá đang áp dụng.', '/services'], [Activity, 'Tra cứu lượt khám', 'Dùng mã VIS và số điện thoại, không cần đăng nhập.', '/guest/journey'], [Clock3, 'Lịch khám theo khoa', 'Tra cứu khả năng phục vụ trong tuần.', '/schedule'] ].map(([Icon, title, description, to], index) => <motion.button initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .07 }} type="button" onClick={() => navigate(to)} key={title}><span><Icon size={20} /></span><strong>{title}</strong><p>{description}</p><ArrowRight size={17} /></motion.button>)}
      </section>

      <section className="cares-public-container cares-home-v2-section" id="services">
        <motion.header variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }}><div><span className="cares-eyebrow"><HeartPulse size={16} /> Dịch vụ nổi bật</span><h2>Chăm sóc toàn diện trong một hệ sinh thái</h2></div><button type="button" onClick={() => navigate('/services')}>Xem tất cả <ArrowRight size={17} /></button></motion.header>
        {loadingServices ? <div className="cares-home-service-loading" /> : <div className="cares-home-v2-services">{highlightedServices.map((service, index) => { const Icon = service.departmentType === 'PARACLINICAL' ? Microscope : index % 2 ? Activity : Stethoscope; return <motion.article initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .05 }} key={service.id}><div><span><Icon size={22} /></span><small>{service.specializationName || service.capabilityName || 'CareS'}</small></div><h3>{service.name}</h3><p>{service.description || 'Thực hiện theo quy trình chuyên môn của phòng khám.'}</p><strong>{formatMoney(service.price)} đ</strong></motion.article>; })}</div>}
      </section>

      <section className="cares-home-v2-journey"><div className="cares-public-container"><motion.div variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }}><span className="cares-eyebrow"><Activity size={16} /> Một hành trình thống nhất</span><h2>Bạn luôn biết bước tiếp theo là gì</h2><p>CareS kết nối lễ tân, thu ngân, phòng khám và cận lâm sàng nhưng vẫn giữ rõ trách nhiệm của từng bộ phận.</p></motion.div><div>{['Đặt lịch hoặc tạo phiếu', 'Check-in và thanh toán', 'Khám theo hàng chờ', 'Nhận kết quả và bệnh án'].map((step, index) => <motion.article initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * .1 }} key={step}><span>{index + 1}</span><strong>{step}</strong><CheckCircle2 size={18} /></motion.article>)}</div></div></section>

      <PublicScheduleTeaser />

      {doctors.length > 0 && <section className="cares-public-container cares-home-v2-section" id="doctors"><header><div><span className="cares-eyebrow"><Stethoscope size={16} /> Đội ngũ chuyên môn</span><h2>Những người đồng hành đáng tin cậy</h2></div><button type="button" onClick={() => navigate('/doctors')}>Xem đội ngũ <ArrowRight size={17} /></button></header><div className="cares-home-v2-doctors">{doctors.slice(0, 4).map((doctor, index) => <motion.article initial={{ opacity: 0, scale: .96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * .07 }} key={doctor.staffId}><div>{doctor.avatarUrl ? <img src={doctor.avatarUrl} alt={doctor.fullName} loading="lazy" /> : <span>{initialsOf(doctor.fullName)}</span>}</div><h3>{doctor.fullName || 'Bác sĩ CareS'}</h3><p>{doctor.specializationName || 'Khám tổng quát'}</p></motion.article>)}</div></section>}

      <section className="cares-public-container cares-home-v2-final"><div><span className="cares-eyebrow">CareS luôn sẵn sàng hỗ trợ</span><h2>Chủ động chăm sóc sức khỏe từ hôm nay</h2><p>Tra cứu dịch vụ, lịch khoa hoặc gửi thông tin để CareS chủ động liên hệ lại.</p></div><div><CaresButton variant="secondary" size="lg" onClick={() => navigate('/contact')}>Gửi thông tin liên hệ</CaresButton><CaresButton size="lg" icon={CalendarDays} onClick={() => navigate('/appointment')}>Đặt lịch ngay</CaresButton></div></section>
    </PublicSiteShell>
  );
}

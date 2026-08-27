import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';
import { useAppointment } from '@/hooks/useAppointment';
import { useSpecializations } from '@/hooks/useSpecializations';
import logoUrl from '@/assets/logo.jpg';
import {
  ArrowRight,
  Stethoscope,
  Microscope,
  Activity,
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
import { getVisibleAnnouncements } from '@/services/publicAnnouncementService';
import { usePublicWorkingShifts } from '@/hooks/usePublicWorkingShifts';
import useClinicInformation from '@/hooks/useClinicInformation';

const get = (key) => {
  try {
    const val = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!val || val === 'undefined' || val === 'null') return null;
    return val;
  } catch {
    return null;
  }
};

// Hàm hỗ trợ tính toán ngày trong tuần và định dạng hiển thị
const getDayNameAndDate = (baseDate, offsetDays) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);

  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const dayName = dayNames[offsetDays];

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dateStr = `${dd}/${mm}`;

  return { day: dayName, date: dateStr, fullDate: d };
};

// Hàm lấy ngày Thứ 2 đầu tiên của tuần tính từ một ngày bất kỳ
const getMondayOfCurrentWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

// Hàm lấy số tuần trong năm để làm cơ sở thay đổi ca làm việc khác nhau theo từng tuần
const getWeekNumber = (d) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('landing');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([]);
  const [closingAnnouncements, setClosingAnnouncements] = useState([]);
  const { services: apiServices, loadingServices } = useAppointment();

  const workingShifts = usePublicWorkingShifts();
  const { clinicInformation } = useClinicInformation();
  const { specializations } = useSpecializations();

  // State quản lý Tuần hiển thị động (Mặc định bắt đầu từ Thứ 2 của tuần hiện tại)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMondayOfCurrentWeek(new Date()));

  // Tính toán mảng 7 ngày trong tuần dựa vào currentWeekStart (Thứ 2 đến Chủ nhật)
  const SCHEDULE_DAYS = Array.from({ length: 7 }, (_, index) => getDayNameAndDate(currentWeekStart, index));

  // Chuỗi hiển thị khoảng thời gian tuần
  const mondayDate = SCHEDULE_DAYS[0].fullDate;
  const sundayDate = SCHEDULE_DAYS[6].fullDate;
  const weekRange = `${String(mondayDate.getDate()).padStart(2, '0')}/${String(mondayDate.getMonth() + 1).padStart(2, '0')}/${mondayDate.getFullYear()} - ${String(sundayDate.getDate()).padStart(2, '0')}/${String(sundayDate.getMonth() + 1).padStart(2, '0')}/${sundayDate.getFullYear()}`;

  // Hàm chuyển tuần (trừ/cộng 7 ngày)
  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  // State danh sách bác sĩ lấy từ Backend
  const [doctorsList, setDoctorsList] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Khởi tạo cấu trúc ca làm việc dựa trên dữ liệu thật của workingShifts
  const morningShiftTime = workingShifts.find(s => s.key === 'MORNING' || s.label?.toLowerCase().includes('sáng'))?.time || '07:30 - 11:30';
  const afternoonShiftTime = workingShifts.find(s => s.key === 'AFTERNOON' || s.label?.toLowerCase().includes('chiều'))?.time || '13:30 - 17:00';
  const eveningShiftTime = workingShifts.find(s => s.key === 'EVENING' || s.label?.toLowerCase().includes('tối'))?.time || '17:00 - 20:00';

  const weekSeed = getWeekNumber(currentWeekStart);

  const getShiftDaysPattern = (deptIndex, shiftIndex) => {
    const basePatterns = [
      [false, true, false, true, true, true, false],
      [true, false, false, false, true, true, false],
      [false, false, true, true, true, false, false],
      [true, true, false, false, true, false, false],
      [true, true, false, true, false, false, false],
      [false, false, false, false, false, true, false]
    ];
    const patternIndex = (deptIndex * 3 + shiftIndex + weekSeed) % basePatterns.length;
    let pattern = [...basePatterns[patternIndex]];
    if (weekSeed % 2 === 0) {
      pattern = pattern.reverse();
    }
    return pattern;
  };

  // Ánh xạ chuyên khoa từ hook dự án để hiển thị đúng toàn bộ các chuyên khoa đang có
  const activeSpecialties = specializations && specializations.length > 0
      ? specializations
      : [
        { specializationId: '1', name: 'Khám tổng quát' },
        { specializationId: '2', name: 'Nội khoa' },
        { specializationId: '3', name: 'Ngoại khoa' },
        { specializationId: '4', name: 'Sản phụ khoa' },
        { specializationId: '5', name: 'Nhi khoa' }
      ];

  const SCHEDULE_DATA = activeSpecialties.map((spec, deptIdx) => ({
    name: spec.name,
    shifts: [
      { name: 'Ca sáng', time: morningShiftTime, days: getShiftDaysPattern(deptIdx, 0) },
      { name: 'Ca chiều', time: afternoonShiftTime, days: getShiftDaysPattern(deptIdx, 1) },
      { name: 'Ca tối', time: eveningShiftTime, days: getShiftDaysPattern(deptIdx, 2) }
    ]
  }));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    getVisibleAnnouncements()
        .then(data => setAnnouncements(Array.isArray(data) ? data : []))
        .catch(() => setAnnouncements([]));
  }, []);

  // Lấy dữ liệu bác sĩ đại diện chuyên khoa từ Database
  useEffect(() => {
    axios.get(`/api/v1/staff/public/doctors?_t=${Date.now()}`)
        .then(res => {
          const rawData = res.data?.data || res.data || [];
          if (Array.isArray(rawData) && rawData.length > 0) {
            const sortedList = [...rawData].sort((a, b) => {
              const idA = String(a.staffId || a.id || '');
              const idB = String(b.staffId || b.id || '');
              return idA.localeCompare(idB);
            });

            const specialtyDoctorMap = new Map();
            sortedList.forEach(doc => {
              const specName = doc.specializationName?.trim();
              if (specName) {
                const specKey = specName.toLowerCase();
                if (!specialtyDoctorMap.has(specKey)) {
                  specialtyDoctorMap.set(specKey, doc);
                }
              }
            });

            setDoctorsList(Array.from(specialtyDoctorMap.values()).slice(0, 5));
          } else {
            setDoctorsList([]);
          }
        })
        .catch(() => {
          setDoctorsList([]);
        })
        .finally(() => setLoadingDoctors(false));
  }, []);

  const visibleAnnouncements = announcements.filter(
      item => !dismissedAnnouncements.includes(item.announcementId)
  );

  const dismissAnnouncement = (announcementId) => {
    if (closingAnnouncements.includes(announcementId)) return;

    setClosingAnnouncements(current => [...current, announcementId]);
    window.setTimeout(() => {
      setDismissedAnnouncements(current => [...current, announcementId]);
      setClosingAnnouncements(current => current.filter(id => id !== announcementId));
    }, 250);
  };

  const services = [Stethoscope, Microscope, Activity].map((icon, index) => ({
    icon, title: t(`services.items.${index}.title`), desc: t(`services.items.${index}.desc`),
  }));

  const features = [Clock, ShieldCheck, Award].map((icon, index) => ({
    icon, title: t(`about.features.${index}.title`), desc: t(`about.features.${index}.desc`),
  }));

  const staticServices = {
    "Nội khoa": [
      { id: 1, name: "Khám nội khoa tổng quát", price: 150000 },
      { id: 2, name: "Khám tim mạch", price: 200000 },
      { id: 3, name: "Khám tiêu hóa", price: 180000 }
    ],
    "Ngoại khoa": [
      { id: 4, name: "Khám ngoại khoa cơ bản", price: 150000 },
      { id: 5, name: "Sơ cứu, băng bó vết thương", price: 100000 }
    ],
    "Xét nghiệm": [
      { id: 6, name: "Xét nghiệm máu cơ bản", price: 120000 },
      { id: 7, name: "Xét nghiệm sinh hóa máu", price: 250000 },
      { id: 8, name: "Xét nghiệm nước tiểu", price: 80000 }
    ],
    "Chẩn đoán hình ảnh": [
      { id: 9, name: "Chụp X-Quang ngực thẳng", price: 150000 },
      { id: 10, name: "Siêu âm ổ bụng", price: 200000 },
      { id: 11, name: "Siêu âm tuyến giáp", price: 200000 }
    ]
  };

  return (
      <div className="min-h-screen bg-[#FAFAFA] font-jakarta text-slate-800 selection:bg-slate-900 selection:text-white">

        {/* Navigation */}
        <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/50 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
          <div className="w-full px-8 lg:px-16 xl:px-20">
            <div className="flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                <img src={logoUrl} alt={clinicInformation.clinicName} className="w-10 h-10 rounded-md object-contain" />
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-slate-900 tracking-widest uppercase leading-none">{clinicInformation.clinicName}</span>
                  <span className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1">{t('brandSubtitle')}</span>
                </div>
              </div>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-6 xl:gap-8">
                <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.home')}</button>
                <a href="#about" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.about')}</a>
                <a href="#process" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.process')}</a>
                <a href="#schedule" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">LỊCH LÀM VIỆC</a>
                <a href="#doctors" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.doctors')}</a>
                <a href="#pricing" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.pricing')}</a>
                <a href="#contact" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">{t('nav.contact')}</a>
              </div>

              {/* Desktop Action Buttons */}
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
          <a href="#process" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">{t('nav.process')}</a>
          <a href="#schedule" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">LỊCH LÀM VIỆC</a>
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

        {/* Public announcements */}
        {visibleAnnouncements.length > 0 && (
            <div
                className="pointer-events-none fixed inset-x-0 top-[88px] z-30 px-4 sm:top-[96px] sm:px-6 lg:px-12"
                aria-live="polite"
            >
              <div className="pointer-events-auto mx-auto max-h-[calc(100vh-112px)] max-w-7xl space-y-3 overflow-y-auto overscroll-contain rounded-xl">
                {visibleAnnouncements.map(item => (
                    <div
                        key={item.announcementId}
                        className={`animate-fadeIn flex items-start justify-between gap-4 rounded-xl border border-primary-200 bg-primary-50/95 px-4 py-3 text-primary-800 shadow-lg shadow-slate-900/10 backdrop-blur-md transition-all duration-300 sm:items-center sm:px-6 sm:py-4 ${closingAnnouncements.includes(item.announcementId) ? '-translate-y-2 scale-[0.98] opacity-0' : 'translate-y-0 scale-100 opacity-100'}`}
                    >
                      <div className="flex min-w-0 items-start gap-4 sm:items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <Clock className="h-5 w-5 text-primary-600" />
                  </span>
                        <div className="min-w-0">
                          <p className="font-semibold">{item.title}</p>
                          <p className="mt-1 whitespace-pre-line text-sm font-light leading-relaxed text-primary-700">{item.content}</p>
                        </div>
                      </div>
                      <button
                          type="button"
                          aria-label={`Đóng thông báo ${item.title}`}
                          onClick={() => dismissAnnouncement(item.announcementId)}
                          className="shrink-0 p-2 text-primary-600 transition-colors hover:text-primary-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-white">
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
                  <div className="absolute bottom-10 -left-10 md:left-10 bg-white/95 backdrop-blur-md p-8 shadow-2xl border-l-4 border-primary-600 max-w-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-out">
                    <p className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-400 mb-2">{t('hero.privilege')}</p>
                    <p className="text-lg font-bold text-slate-900 leading-snug">{t('hero.privilegeText')}</p>
                  </div>
                </div>
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

            <div className="grid md:grid-cols-3 gap-x-8 gap-y-16">
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

        {/* ── BẢNG LỊCH LÀM VIỆC THEO TUẦN (HIỂN THỊ ĐỦ CÁC CHUYÊN KHOA DỰ ÁN) ── */}
        <section id="schedule" className="py-20 bg-white border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">

            {/* Header tiêu mục */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-4 mb-4">
                <div className="w-8 h-[1px] bg-slate-900"></div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">LỊCH LÀM VIỆC</span>
                <div className="w-8 h-[1px] bg-slate-900"></div>
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-4">
                Lịch Khám <span className="font-bold">Chuyên Khoa</span>
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
                Tra cứu lịch làm việc của các chuyên khoa theo từng ca để chủ động sắp xếp thời gian khám bệnh thuận tiện nhất.
              </p>
            </div>

            {/* Wrapper chứa thanh điều khiển và bảng */}
            <div className="space-y-3 font-sans">
              <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                      onClick={handlePrevWeek}
                      className="px-3.5 py-1.5 text-xs font-bold tracking-wider text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-95 transition cursor-pointer"
                  >
                    &lt; TUẦN TRƯỚC
                  </button>
                  <button
                      onClick={handleNextWeek}
                      className="px-3.5 py-1.5 text-xs font-bold tracking-wider text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-95 transition cursor-pointer"
                  >
                    TUẦN SAU &gt;
                  </button>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 pr-2">
                  <span className="text-slate-500">Tuần: </span>
                  <strong className="font-bold text-slate-900">{weekRange}</strong>
                </div>
              </div>

              {/* Bảng ma trận lịch làm việc */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse min-w-[950px]">
                    <thead>
                    <tr className="bg-[#0B132B] text-white">
                      <th className="p-3.5 text-xs font-bold text-left tracking-wider uppercase w-40 pl-6">
                        CHUYÊN KHOA
                      </th>
                      <th className="p-3.5 text-xs font-bold text-left tracking-wider uppercase w-32 border-l border-slate-800">
                        CA LÀM VIỆC
                      </th>
                      {SCHEDULE_DAYS.map((d, index) => (
                          <th key={index} className="p-3 text-xs font-semibold border-l border-slate-800">
                            <div>{d.day}</div>
                            <div className="text-[11px] font-normal text-slate-300 mt-0.5">{d.date}</div>
                          </th>
                      ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                    {SCHEDULE_DATA.map((dept, deptIdx) => (
                        <React.Fragment key={deptIdx}>
                          {dept.shifts.map((shift, shiftIdx) => (
                              <tr key={`${deptIdx}-${shiftIdx}`} className="hover:bg-slate-50/60 transition-colors">
                                {shiftIdx === 0 && (
                                    <td
                                        rowSpan={3}
                                        className="p-4 font-bold text-slate-900 text-left pl-6 border-r border-slate-200 bg-white align-middle text-sm"
                                    >
                                      {dept.name}
                                    </td>
                                )}

                                <td className="p-2.5 text-left border-r border-slate-100 bg-slate-50/40">
                                  <div className="font-semibold text-slate-800">{shift.name}</div>
                                  <div className="text-[10px] text-slate-400 font-normal">{shift.time}</div>
                                </td>

                                {shift.days.map((isActive, dayIdx) => (
                                    <td key={dayIdx} className="p-2.5 border-l border-slate-100 align-middle">
                                      {isActive ? (
                                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs font-bold text-xs">
                                    ✓
                                  </span>
                                      ) : (
                                          <span className="text-slate-300 font-light">-</span>
                                      )}
                                    </td>
                                ))}
                              </tr>
                          ))}
                        </React.Fragment>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── DOCTORS SECTION ── */}
        <section id="doctors" className="py-24 bg-slate-50 border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="w-8 h-[1px] bg-slate-900"></div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">DANH SÁCH BÁC SĨ</span>
                <div className="w-8 h-[1px] bg-slate-900"></div>
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-6">
                Đội ngũ chuyên gia <span className="font-bold">Hàng đầu</span>
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Quy tụ đội ngũ y bác sĩ tận tâm, giàu chuyên môn và luôn đặt sức khỏe người bệnh lên hàng đầu.
              </p>
            </div>

            {loadingDoctors ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                </div>
            ) : doctorsList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Đang cập nhật danh sách bác sĩ...
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {doctorsList.map((doc) => {
                    const doctorName = doc.fullName || "Bác sĩ";
                    const specialtyName = doc.specializationName || "Khám bệnh Đa khoa";

                    const hasValidAvatar = doc.avatarUrl && doc.avatarUrl.trim() !== '' && (doc.avatarUrl.startsWith('http') || doc.avatarUrl.startsWith('data:image'));

                    return (
                        <div
                            key={doc.staffId || doc.id}
                            className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
                        >
                          <div className="aspect-[3/4] w-full bg-slate-100 relative overflow-hidden flex items-center justify-center shrink-0">
                            {hasValidAvatar ? (
                                <img
                                    src={doc.avatarUrl.trim()}
                                    alt={doctorName}
                                    onError={(event) => {
                                      event.currentTarget.style.display = 'none';
                                    }}
                                    className="absolute inset-0 w-full h-full object-cover object-top filter grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                                />
                            ) : null}

                            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center ${hasValidAvatar ? 'hidden' : 'flex'}`}>
                              <span className="text-xs font-medium tracking-wide">Chưa cập nhật ảnh</span>
                            </div>
                          </div>

                          <div className="p-4 text-center flex-1 flex flex-col justify-center">
                            <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors truncate" title={doctorName}>
                              {doctorName}
                            </h3>
                            <p className="text-[11px] font-semibold tracking-wider uppercase text-primary-600 truncate" title={specialtyName}>
                              {specialtyName}
                            </p>
                          </div>
                        </div>
                    );
                  })}
                </div>
            )}

          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-white">
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

            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-8 lg:p-12 grid md:grid-cols-2 gap-x-16 gap-y-12">
                {Object.entries(staticServices).map(([department, deptServices]) => (
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
          </div>
        </section>

        {/* CTA */}
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

        {/* Footer */}
        <footer id="contact" className="bg-slate-900 text-slate-300 pt-24 pb-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
              <div className="md:col-span-5">
                <div className="flex items-center gap-3 mb-8">
                  <img src={logoUrl} alt={clinicInformation.clinicName} className="w-12 h-12 rounded-md object-contain bg-white p-1" />
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white tracking-widest uppercase leading-none">{clinicInformation.clinicName}</span>
                    <span className="text-xs text-slate-400 tracking-[0.12em] uppercase mt-1">{clinicInformation.legalName}</span>
                  </div>
                </div>
                <p className="text-slate-400 font-light leading-relaxed max-w-sm mb-10">
                  {clinicInformation.shortDescription}
                </p>
                <div className="mb-8 space-y-1 text-xs text-slate-500">
                  <p>{clinicInformation.legalName}</p>
                  <p>Mã số thuế: {clinicInformation.taxCode}</p>
                  {clinicInformation.operatingLicense && <p>Giấy phép hoạt động: {clinicInformation.operatingLicense}</p>}
                </div>
                <div className="flex gap-4">
                  {clinicInformation.facebookUrl && <a href={clinicInformation.facebookUrl} target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-colors">
                    <span className="text-sm font-bold">f</span>
                  </a>}
                  {clinicInformation.youtubeUrl && <a href={clinicInformation.youtubeUrl} target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>}
                  {clinicInformation.zaloUrl && <a href={clinicInformation.zaloUrl} target="_blank" rel="noreferrer" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-colors">
                    <span className="text-sm font-bold">Zalo</span>
                  </a>}
                </div>
              </div>

              <div className="md:col-span-3">
                <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-white mb-8">CÔNG TY</h4>
                <ul className="space-y-4 font-light text-slate-400">
                  <li><a href="/about" className="hover:text-white transition-colors">Về chúng tôi</a></li>
                  <li><a href="/contact" className="hover:text-white transition-colors">Liên hệ</a></li>
                  <li><a href="/terms" className="hover:text-white transition-colors">Điều khoản dịch vụ</a></li>
                  <li><a href="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
                </ul>
              </div>

              <div className="md:col-span-4">
                <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-white mb-8">KẾT NỐI</h4>
                <ul className="space-y-4 text-slate-400 font-light mb-8">
                  <li className="flex gap-4">
                    <PhoneCall className="w-5 h-5 text-slate-500 shrink-0" strokeWidth={1.5} />
                    <span>Hotline/Zalo: {clinicInformation.phone}</span>
                  </li>
                  <li className="flex gap-4">
                  <span className="w-5 h-5 text-slate-500 shrink-0 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </span>
                    <span>Email: {clinicInformation.supportEmail}</span>
                  </li>
                  <li className="flex gap-4"><MapPin className="w-5 h-5 text-slate-500 shrink-0" strokeWidth={1.5}/><span>{clinicInformation.address}</span></li>
                </ul>

                <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-white mb-6">GIỜ HOẠT ĐỘNG</h4>
                <ul className="space-y-2 text-sm text-slate-400 font-light">
                  {workingShifts.map((shift, index) => (
                      <li key={shift.label} className={`flex justify-between ${index < workingShifts.length - 1 ? 'border-b border-slate-800 pb-2' : ''} ${index > 0 ? 'pt-2' : ''}`}>
                        <span>{shift.label}:</span><span className="text-white">{shift.time}</span>
                      </li>
                  ))}
                  <li className="text-xs text-primary-400 mt-2">* {clinicInformation.workingDays}; {clinicInformation.closedDays}</li>
                </ul>
              </div>

            </div>
            <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200 text-xs text-slate-400 tracking-wider">
              <p>&copy; {new Date().getFullYear()} {clinicInformation.clinicName} - {t('footer.copyright')}</p>
            </div>
          </div>
        </footer>

        {/* Guest Chat Widget */}
        <ChatWidget />
      </div>
  );
};

export default LandingPage;
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppointment } from '@/hooks/useAppointment';
import { useProfile } from '@/hooks/useProfile';
import AppointmentConfirmModal from '@/components/ui/AppointmentConfirmModal';
import { groupServicesBySpecialty } from '@/components/appointment/ServiceSelectionCard';
import { Check, ChevronDown, ChevronLeft, Clock, Info, Search, Stethoscope, User } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import logoUrl from '@/assets/logo.jpg';

const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const toLocalDateInputValue = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getMinimumAppointmentDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 1);
    return toLocalDateInputValue(today);
};

const getMaximumAppointmentDate = () => {
    const maximum = new Date();
    maximum.setHours(0, 0, 0, 0);
    maximum.setFullYear(maximum.getFullYear() + 1);
    return toLocalDateInputValue(maximum);
};

const splitAppointmentDate = value => {
    const [year = '', month = '', day = ''] = (value || '').split('-');
    return { day, month, year };
};

const appointmentDaysInMonth = (year, month) => {
    if (!year || !month) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
};

export default function AppointmentPage() {
    const { t } = useTranslation('appointment');
    const { t: tCommon } = useTranslation('common');
    const navigate = useNavigate();

    const { services, loadingServices, book, loading: booking, error, shifts, shiftLoading, fetchShifts } = useAppointment();
    const { profile } = useProfile();

    // Step 1 — Thông tin khách hàng (chỉ dùng khi chưa đăng nhập)
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');

    // Step 2 — Dịch vụ
    const [selectedServices, setSelectedServices] = useState([]);
    const [activeServiceTab, setActiveServiceTab] = useState('EXAMINATION');
    const [serviceSearch, setServiceSearch] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({
        EXAMINATION: null,
        PARACLINICAL: null,
    });

    // Step 3 — Thời gian
    const [date, setDate] = useState('');
    const [dateParts, setDateParts] = useState(splitAppointmentDate(''));
    const [timeSlot, setTimeSlot] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const selectedServiceKey = selectedServices.map(service => service.id).sort().join(',');
    useEffect(() => {
        setTimeSlot('');
        fetchShifts(date, selectedServiceKey ? selectedServiceKey.split(',') : []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, selectedServiceKey]);

    // Quản lý Step hiển thị
    const [currentStep, setCurrentStep] = useState(1);
    const [step1Errors, setStep1Errors] = useState({});

    const minimumDate = getMinimumAppointmentDate();
    const maximumDate = getMaximumAppointmentDate();
    const bookingYears = Array.from(
        { length: Number(maximumDate.slice(0, 4)) - Number(minimumDate.slice(0, 4)) + 1 },
        (_, index) => String(Number(minimumDate.slice(0, 4)) + index)
    );

    const updateAppointmentDate = (part, value) => {
        setDateParts(previous => {
            const next = { ...previous, [part]: value };
            const maximumDay = appointmentDaysInMonth(next.year, next.month);
            if (next.day && Number(next.day) > maximumDay) next.day = '';
            if (!next.year || !next.month || !next.day) {
                setDate('');
                return next;
            }
            const candidate = `${next.year}-${String(next.month).padStart(2, '0')}-${String(next.day).padStart(2, '0')}`;
            setDate(candidate >= minimumDate && candidate <= maximumDate ? candidate : '');
            setTimeSlot('');
            return next;
        });
    };

    // Tự động chuyển sang bước 2 nếu đã đăng nhập (làm tiện hơn)
    useEffect(() => {
        if (profile && currentStep === 1) {
            setCurrentStep(2);
        }
    }, [profile, currentStep]);

    const handleNext = () => {
        if (currentStep === 1 && !profile) {
            const errors = {};
            if (!fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên';
            if (!phone.trim()) {
                errors.phone = 'Vui lòng nhập số điện thoại';
            } else if (!/^[0-9]{10,11}$/.test(phone.trim())) {
                errors.phone = 'Số điện thoại không hợp lệ';
            }
            if (!age || age < 1 || age > 120) errors.age = 'Vui lòng nhập tuổi hợp lệ';
            if (!gender) errors.gender = 'Vui lòng chọn giới tính';
            
            if (Object.keys(errors).length > 0) {
                setStep1Errors(errors);
                return;
            }
            setStep1Errors({});
        }
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, profile ? 2 : 1));

    const toggleService = (service) => {
        setSelectedServices(prev => {
            if (prev.find(s => s.id === service.id)) {
                return prev.filter(s => s.id !== service.id);
            }
            return [...prev, service];
        });
    };

    const totalCost = selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0);
    const examinationCount = selectedServices.filter(
        service => service.departmentType === 'EXAMINATION'
    ).length;
    const paraclinicalCount = selectedServices.length - examinationCount;

    const visibleServiceGroups = useMemo(() => {
        const keyword = serviceSearch.trim().toLocaleLowerCase('vi');
        const filtered = services.filter(service => {
            const correctType = activeServiceTab === 'EXAMINATION'
                ? service.departmentType === 'EXAMINATION'
                : service.departmentType !== 'EXAMINATION';
            if (!correctType) return false;
            if (!keyword) return true;
            return [service.name, service.description, service.specializationName,
                service.department, service.capabilityName]
                .filter(Boolean).join(' ').toLocaleLowerCase('vi').includes(keyword);
        });
        return groupServicesBySpecialty(filtered);
    }, [activeServiceTab, serviceSearch, services]);

    useEffect(() => {
        if (visibleServiceGroups.length === 0 || serviceSearch.trim()) return;
        setExpandedGroups(previous => previous[activeServiceTab]
            ? previous
            : { ...previous, [activeServiceTab]: visibleServiceGroups[0][0] });
    }, [activeServiceTab, serviceSearch, visibleServiceGroups]);

    const handleSubmit = () => {
        if (!date || date < getMinimumAppointmentDate()) {
            toast.warning('Lịch hẹn phải được đặt từ ngày mai trở đi.');
            return;
        }
        // Hiện modal xác nhận thay vì gửi ngay
        setShowConfirmModal(true);
    };

    const handleConfirm = () => {
        const computedAge = profile
            ? (profile.age ?? (profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : age))
            : age;
        const patientInfo = profile
            ? {
                customerId: profile.id,
                fullName: profile.fullName,
                phone: profile.phone,
                age: Number(computedAge),
                gender: profile.gender === 'Nam' ? 'male' : profile.gender === 'Nữ' ? 'female' : profile.gender === 'Khác' ? 'other' : profile.gender,
                address: profile.address
            }
            : { fullName, phone, age, gender, address };
        book({ ...patientInfo, selectedServices, date, shiftId: timeSlot });
        setShowConfirmModal(false);
    };

    return (
        <div className="min-h-screen font-jakarta text-slate-800 selection:bg-slate-900 selection:text-white relative bg-[#FAFAFA]">
            {/* Background Image with Overlay */}
            <div className="fixed inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2000&auto=format&fit=crop" 
                    alt="Premium Clinic" 
                    className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md"></div>
            </div>

            {/* Custom Header for Booking Page */}
            <header className="relative z-10 w-full border-b border-white/10 py-6">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <img src={logoUrl} alt="CareS" className="w-10 h-10 rounded-md object-contain" />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-white tracking-widest uppercase leading-none">CareS</span>
                            <span className="text-[10px] text-slate-400 tracking-[0.3em] uppercase mt-1">Phòng khám đa khoa</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate(profile ? ROUTES.MY_APPOINTMENTS : '/')}
                        className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] uppercase text-white hover:text-primary-400 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {profile ? 'Lịch hẹn của tôi' : 'Trang chủ'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 py-12 px-6 lg:px-12">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-start">
                    
                    {/* Left Info Column */}
                    <div className="w-full lg:w-1/3 text-white lg:sticky lg:top-32">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-[1px] bg-primary-500"></div>
                            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary-400">Welcome Guest</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-light leading-tight mb-6">
                            Đặt Lịch <br /> <span className="font-bold">Đặc Quyền</span>
                        </h1>
                        <p className="text-slate-400 font-light text-sm leading-relaxed mb-12 max-w-sm">
                            Trải nghiệm dịch vụ y tế thượng lưu. Điền thông tin vào biểu mẫu bên cạnh để chúng tôi chuẩn bị đón tiếp bạn một cách chu đáo nhất.
                        </p>
                        
                        <div className="space-y-8 hidden md:block relative">
                            {/* Đường kẻ nối các step dọc */}
                            <div className="absolute left-6 top-6 bottom-6 w-[1px] bg-white/10 z-0 hidden md:block"></div>
                            
                            <div className={`relative z-10 flex items-center gap-5 transition-all duration-300 ${currentStep >= 1 ? 'opacity-100' : 'opacity-40'} ${currentStep === 1 ? 'translate-x-2' : ''}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${currentStep >= 1 ? 'bg-primary-500 border-primary-400' : 'bg-white/5 border-white/10'}`}>
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-white uppercase tracking-wider text-xs mb-1">01. Thông tin</p>
                                    <p className="text-slate-400 font-light text-sm">Chi tiết khách hàng</p>
                                </div>
                            </div>
                            <div className={`relative z-10 flex items-center gap-5 transition-all duration-300 ${currentStep >= 2 ? 'opacity-100' : 'opacity-40'} ${currentStep === 2 ? 'translate-x-2' : ''}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${currentStep >= 2 ? 'bg-primary-500 border-primary-400' : 'bg-white/5 border-white/10'}`}>
                                    <Stethoscope className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-white uppercase tracking-wider text-xs mb-1">02. Dịch vụ</p>
                                    <p className="text-slate-400 font-light text-sm">Lựa chọn chuyên khoa</p>
                                </div>
                            </div>
                            <div className={`relative z-10 flex items-center gap-5 transition-all duration-300 ${currentStep >= 3 ? 'opacity-100' : 'opacity-40'} ${currentStep === 3 ? 'translate-x-2' : ''}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${currentStep >= 3 ? 'bg-primary-500 border-primary-400' : 'bg-white/5 border-white/10'}`}>
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-white uppercase tracking-wider text-xs mb-1">03. Thời gian</p>
                                    <p className="text-slate-400 font-light text-sm">Khung giờ mong muốn</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Form Column */}
                    <div className="w-full lg:w-2/3 bg-white p-8 lg:p-12 shadow-2xl relative">
                        {/* Decorative accent */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>

                        <div className="relative min-h-[500px]">
                            {/* ── Step 1: Thông tin khách hàng ── */}
                            {currentStep === 1 && (
                            <section className="animate-in fade-in duration-500">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-light text-slate-900 mb-2">
                                        <span className="font-bold">01.</span> {t('step1.heading')}
                                    </h2>
                                    <p className="text-sm font-light text-slate-500">Vui lòng cung cấp chính xác thông tin cá nhân của bạn.</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Họ và tên */}
                                    <div>
                                        <label className="block text-xs font-semibold tracking-[0.1em] uppercase text-slate-900 mb-2">
                                            {t('step1.fullName')}
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={50}
                                            value={profile ? profile.fullName : fullName}
                                            onChange={e => {
                                                setFullName(e.target.value);
                                                if (step1Errors.fullName) setStep1Errors({ ...step1Errors, fullName: '' });
                                            }}
                                            disabled={!!profile}
                                            className={`w-full h-10 px-3 text-sm border ${step1Errors.fullName ? 'border-red-500 focus:ring-red-50' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-50'} rounded-md outline-none focus:ring-2 ${profile ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            placeholder="Nhập họ và tên..."
                                        />
                                        {step1Errors.fullName && <p className="text-red-500 text-xs mt-1.5 font-medium">{step1Errors.fullName}</p>}
                                    </div>

                                    {/* SDT + Tuổi + Giới tính */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold tracking-[0.1em] uppercase text-slate-900 mb-2">
                                                {t('step1.phone')}
                                            </label>
                                            <input
                                                type="tel"
                                                maxLength={20}
                                                value={profile ? profile.phone : phone}
                                                onChange={e => {
                                                    setPhone(e.target.value);
                                                    if (step1Errors.phone) setStep1Errors({ ...step1Errors, phone: '' });
                                                }}
                                                disabled={!!profile}
                                                className={`w-full h-10 px-3 text-sm border ${step1Errors.phone ? 'border-red-500 focus:ring-red-50' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-50'} rounded-md outline-none focus:ring-2 ${profile ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                placeholder="Số điện thoại..."
                                            />
                                            {step1Errors.phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{step1Errors.phone}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold tracking-[0.1em] uppercase text-slate-900 mb-2">
                                                {t('step1.age')}
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={120}
                                                value={profile ? (profile.age ?? (profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : '')) : age}
                                                onChange={e => {
                                                    setAge(e.target.value);
                                                    if (step1Errors.age) setStep1Errors({ ...step1Errors, age: '' });
                                                }}
                                                disabled={!!profile}
                                                className={`w-full h-10 px-3 text-sm border ${step1Errors.age ? 'border-red-500 focus:ring-red-50' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-50'} rounded-md outline-none focus:ring-2 ${profile ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                placeholder="Tuổi..."
                                            />
                                            {step1Errors.age && <p className="text-red-500 text-xs mt-1.5 font-medium">{step1Errors.age}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold tracking-[0.1em] uppercase text-slate-900 mb-2">
                                                {t('step1.gender')}
                                            </label>
                                            <select
                                                value={profile ? (profile.gender === 'MALE' ? 'male' : profile.gender === 'FEMALE' ? 'female' : profile.gender === 'OTHER' ? 'other' : profile.gender) : gender}
                                                onChange={e => {
                                                    setGender(e.target.value);
                                                    if (step1Errors.gender) setStep1Errors({ ...step1Errors, gender: '' });
                                                }}
                                                disabled={!!profile}
                                                className={`w-full h-10 px-3 text-sm border ${step1Errors.gender ? 'border-red-500 focus:ring-red-50' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-50'} rounded-md outline-none focus:ring-2 bg-white ${profile ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="" disabled>Chọn giới tính</option>
                                                <option value="male">{t('step1.genderOptions.male')}</option>
                                                <option value="female">{t('step1.genderOptions.female')}</option>
                                            </select>
                                            {step1Errors.gender && <p className="text-red-500 text-xs mt-1.5 font-medium">{step1Errors.gender}</p>}
                                        </div>
                                    </div>

                                    {/* Địa chỉ */}
                                    <div>
                                        <label className="block text-xs font-semibold tracking-[0.1em] uppercase text-slate-900 mb-2">
                                            {t('step1.address')}
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={255}
                                            value={profile ? profile.address : address}
                                            onChange={e => {
                                                setAddress(e.target.value);
                                                if (step1Errors.address) setStep1Errors({ ...step1Errors, address: '' });
                                            }}
                                            disabled={!!profile}
                                            className={`w-full h-10 px-3 text-sm border ${step1Errors.address ? 'border-red-500 focus:ring-red-50' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-50'} rounded-md outline-none focus:ring-2 ${profile ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            placeholder="Địa chỉ liên hệ..."
                                        />
                                        {step1Errors.address && <p className="text-red-500 text-xs mt-1.5 font-medium">{step1Errors.address}</p>}
                                    </div>
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                    <button 
                                        onClick={handleNext}
                                        className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
                                    >
                                        Tiếp tục
                                    </button>
                                </div>
                            </section>
                            )}

                            {/* ── Step 2: Chọn dịch vụ ── */}
                            {currentStep === 2 && (
                            <section className="animate-in fade-in duration-500">
                                <div className="flex items-end justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-light text-slate-900 mb-2">
                                            <span className="font-bold">02.</span> {t('step2.heading')}
                                        </h2>
                                        <p className="text-sm font-light text-slate-500">{t('step2.selectMultiple')}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input type="search" value={serviceSearch}
                                            onChange={event => setServiceSearch(event.target.value)}
                                            placeholder="Tìm tên dịch vụ, chuyên khoa hoặc kỹ thuật..."
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-50" />
                                    </div>
                                    <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                                        {[
                                            ['EXAMINATION', 'Khám bệnh'],
                                            ['PARACLINICAL', 'Cận lâm sàng'],
                                        ].map(([type, label]) => {
                                            const selectedCount = type === 'EXAMINATION'
                                                ? examinationCount : paraclinicalCount;
                                            return <button key={type} type="button"
                                                onClick={() => { setActiveServiceTab(type); setServiceSearch(''); }}
                                                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${activeServiceTab === type
                                                    ? 'bg-white text-slate-950 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-800'}`}>
                                                {label}{selectedCount > 0 ? ` (${selectedCount})` : ''}
                                            </button>;
                                        })}
                                    </div>
                                    <div className={`flex gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5 ${activeServiceTab === 'EXAMINATION'
                                        ? 'border-blue-200 bg-blue-50 text-blue-800'
                                        : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                                        <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                        {activeServiceTab === 'EXAMINATION'
                                            ? <span>Bạn có thể đặt nhiều dịch vụ khám trong một lịch hẹn. Khi check-in, các dịch vụ được thực hiện lần lượt và mỗi dịch vụ có một bệnh án riêng.</span>
                                            : <span>Dịch vụ cận lâm sàng đặt sẵn là bước độc lập; chỉ quay lại bác sĩ khi dịch vụ đó được bác sĩ chỉ định trong lúc khám.</span>}
                                    </div>
                                </div>

                                {loadingServices ? (
                                    <p className="py-8 text-center text-sm text-slate-400">{t('step2.loading')}</p>
                                ) : (
                                    <div className="custom-scrollbar mt-4 max-h-[390px] space-y-2 overflow-y-auto pr-1">
                                        {visibleServiceGroups.length === 0 && (
                                            <p className="py-8 text-center text-sm text-slate-400">Không tìm thấy dịch vụ phù hợp.</p>
                                        )}
                                        {visibleServiceGroups.map(([groupName, groupServices]) => {
                                            const searching = serviceSearch.trim().length > 0;
                                            const open = searching || expandedGroups[activeServiceTab] === groupName;
                                            return <div key={groupName} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                <button type="button"
                                                    onClick={() => setExpandedGroups(previous => ({
                                                        ...previous,
                                                        [activeServiceTab]: open ? null : groupName,
                                                    }))}
                                                    className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left">
                                                    <span className="text-sm font-bold text-slate-900">{groupName}</span>
                                                    <span className="flex items-center gap-2 text-xs text-slate-500">
                                                        {groupServices.length} dịch vụ
                                                        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                                                    </span>
                                                </button>
                                                {open && <div className="divide-y divide-slate-100">
                                                    {groupServices.map(service => {
                                                        const checked = selectedServices.some(item => item.id === service.id);
                                                        return <button key={service.id} type="button" onClick={() => toggleService(service)}
                                                            className={`grid w-full grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition ${checked
                                                                ? 'bg-primary-50' : 'hover:bg-slate-50'}`}>
                                                            <span className={`flex h-5 w-5 items-center justify-center rounded border ${checked
                                                                ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                                                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="block truncate text-sm font-semibold text-slate-900">{service.name}</span>
                                                                {service.description && <span className="mt-0.5 block line-clamp-1 text-xs text-slate-500">{service.description}</span>}
                                                            </span>
                                                            <span className="whitespace-nowrap text-sm font-bold text-primary-700">{formatVND(service.price)}</span>
                                                        </button>;
                                                    })}
                                                </div>}
                                            </div>;
                                        })}
                                    </div>
                                )}

                                {/* Tổng tiền */}
                                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                                    <div>
                                        <p className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-500 mb-1">{t('step2.total')}</p>
                                        <p className="text-xs text-slate-400 font-light">{selectedServices.length === 0 ? t('step2.noService') : `${selectedServices.length} dịch vụ đã chọn · Khám bệnh: ${examinationCount} · Cận lâm sàng: ${paraclinicalCount}`}</p>
                                    </div>
                                    <span className="text-2xl font-bold text-slate-900">
                                        {formatVND(totalCost)}
                                    </span>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
                                    <button 
                                        onClick={handleBack}
                                        className="h-12 px-6 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
                                    >
                                        Quay lại
                                    </button>
                                    <button 
                                        onClick={handleNext}
                                        disabled={selectedServices.length === 0}
                                        className="h-12 px-8 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                                    >
                                        Tiếp tục
                                    </button>
                                </div>
                            </section>
                            )}

                            {/* ── Step 3: Thời gian khám ── */}
                            {currentStep === 3 && (
                            <section className="animate-in fade-in duration-500">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-light text-slate-900 mb-2">
                                        <span className="font-bold">03.</span> {t('step3.heading')}
                                    </h2>
                                    <p className="text-sm font-light text-slate-500">Lựa chọn thời gian phù hợp với lịch trình của bạn.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold tracking-[0.1em] uppercase text-slate-900 mb-2">
                                            {t('step3.chooseDate')}
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <select aria-label="Ngày khám" value={dateParts.day}
                                                onChange={event => updateAppointmentDate('day', event.target.value)}
                                                className="h-10 rounded-md border border-gray-300 bg-white px-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50">
                                                <option value="">Ngày</option>
                                                {Array.from({ length: appointmentDaysInMonth(dateParts.year, dateParts.month) }, (_, index) => String(index + 1).padStart(2, '0'))
                                                    .map(day => <option key={day} value={day}>{day}</option>)}
                                            </select>
                                            <select aria-label="Tháng khám" value={dateParts.month}
                                                onChange={event => updateAppointmentDate('month', event.target.value)}
                                                className="h-10 rounded-md border border-gray-300 bg-white px-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50">
                                                <option value="">Tháng</option>
                                                {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
                                                    .map(month => <option key={month} value={month}>{month}</option>)}
                                            </select>
                                            <select aria-label="Năm khám" value={dateParts.year}
                                                onChange={event => updateAppointmentDate('year', event.target.value)}
                                                className="h-10 rounded-md border border-gray-300 bg-white px-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50">
                                                <option value="">Năm</option>
                                                {bookingYears.map(year => <option key={year} value={year}>{year}</option>)}
                                            </select>
                                        </div>
                                        {dateParts.day && dateParts.month && dateParts.year && !date && (
                                            <p className="mt-2 text-xs font-medium text-red-600">
                                                Ngày khám phải từ ngày mai đến tối đa 12 tháng tiếp theo.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold tracking-[0.1em] uppercase text-slate-900 mb-2">
                                            {t('step3.timeSlot')}
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {shiftLoading ? (
                                                <p className="text-sm text-gray-500 col-span-full">Đang tải ca khám...</p>
                                            ) : shifts?.length > 0 ? (
                                                shifts.map(shift => (
                                                    <button
                                                        key={shift.id}
                                                        type="button"
                                                        disabled={!shift.available}
                                                        onClick={() => shift.available && setTimeSlot(shift.id)}
                                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                                                            timeSlot === shift.id
                                                                ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/20'
                                                                : !shift.available
                                                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                                : 'bg-white border-gray-200 text-gray-700 hover:border-slate-400 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <span className="font-semibold text-sm mb-0.5">{shift.name}</span>
                                                        <span className="text-xs opacity-80">
                                                            {shift.startTime} – {shift.endTime}
                                                        </span>
                                                        {!shift.available && <span className="text-[10px] text-amber-700 mt-1">Ca chưa có đủ nhân sự</span>}
                                                        {shift.timeSource === 'SPECIAL' && <span className="text-[10px] text-blue-600 mt-1">Giờ làm việc ngoại lệ</span>}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 col-span-full">Chưa có cấu hình ca khám.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Lỗi */}
                                {error && (
                                    <div className="mt-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
                                    <button 
                                        onClick={handleBack}
                                        className="h-12 px-6 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
                                    >
                                        Quay lại
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={booking || !date || !timeSlot}
                                        className="h-12 px-8 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center min-w-[160px]"
                                    >
                                        {booking ? tCommon('loading') : t('submit')}
                                    </button>
                                </div>
                            </section>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal xác nhận */}
            {showConfirmModal && (
                <AppointmentConfirmModal
                    namespace="appointment"
                    data={{
                        fullName: profile ? profile.fullName : fullName,
                        phone: profile ? profile.phone : phone,
                        ageGender: profile
                            ? `${profile.age ?? calculateAge(profile.dateOfBirth) ?? ''} / ${profile.gender === 'Nam' ? t('step1.genderOptions.male') : profile.gender === 'Nữ' ? t('step1.genderOptions.female') : profile.gender === 'Khác' ? t('step1.genderOptions.other') : profile.gender}`
                            : `${age} / ${gender === 'male' ? t('step1.genderOptions.male') : gender === 'female' ? t('step1.genderOptions.female') : t('step1.genderOptions.other')}`,
                        email: profile?.email,
                        address: profile ? profile.address : address,
                        date,
                        timeSlot: shifts?.find(s => s.id === timeSlot)?.name || '',
                        method: 'Khám trực tiếp tại phòng khám',
                        total: formatVND(totalCost),
                        services: selectedServices,
                        reason: '',
                    }}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={handleConfirm}
                />
            )}
        </div>
    );
}

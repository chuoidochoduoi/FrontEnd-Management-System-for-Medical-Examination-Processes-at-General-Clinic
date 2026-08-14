import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppointment } from '@/hooks/useAppointment';
import { useProfile } from '@/hooks/useProfile';
import AppointmentConfirmModal from '@/components/ui/AppointmentConfirmModal';
import { ChevronLeft, User, Stethoscope, Clock } from 'lucide-react';
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

const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toLocalDateInputValue(tomorrow);
};

export default function AppointmentPage() {
    const { t } = useTranslation('appointment');
    const { t: tCommon } = useTranslation('common');
    const navigate = useNavigate();

    const { services, loadingServices, book, loading: booking, error, shifts, shiftLoading } = useAppointment();
    const { profile } = useProfile();

    // Step 1 — Thông tin khách hàng (chỉ dùng khi chưa đăng nhập)
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');

    // Step 2 — Dịch vụ
    const [selectedServices, setSelectedServices] = useState([]);

    // Step 3 — Thời gian
    const [date, setDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Quản lý Step hiển thị
    const [currentStep, setCurrentStep] = useState(1);
    const [step1Errors, setStep1Errors] = useState({});

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
            if (service.departmentType === 'EXAMINATION') {
                if (prev.some(item => item.departmentType === 'EXAMINATION')) {
                    toast.info(t('workflow.singleExaminationReplaced'));
                }
                return [
                    ...prev.filter(item => item.departmentType !== 'EXAMINATION'),
                    service
                ];
            }
            return [...prev, service];
        });
    };

    const totalCost = selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0);

    const handleSubmit = () => {
        if (!date || date < getTomorrowDate()) {
            toast.warning('Lịch hẹn chỉ được đặt sớm nhất từ ngày mai.');
            return;
        }
        if (selectedServices.filter(service => service.departmentType === 'EXAMINATION').length > 1) {
            toast.error(t('workflow.singleExaminationOnly'));
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

                                {loadingServices ? (
                                    <p className="text-sm text-slate-400 text-center py-8">{t('step2.loading')}</p>
                                ) : (
                                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                                        {Object.entries(
                                            services.reduce((acc, service) => {
                                                const dept = service.department || 'Dịch vụ khác';
                                                if (!acc[dept]) acc[dept] = [];
                                                acc[dept].push(service);
                                                return acc;
                                            }, {})
                                        ).map(([department, deptServices]) => (
                                            <div key={department} className="space-y-3">
                                                <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500 sticky top-0 bg-white py-2 z-10">
                                                    {department}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {deptServices.map(service => {
                                                        const checked = !!selectedServices.find(s => s.id === service.id);
                                                        return (
                                                            <label
                                                                key={service.id}
                                                                className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all duration-200 ${checked ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => toggleService(service)}
                                                                        className="w-4 h-4 accent-primary-600 mt-0.5 rounded flex-shrink-0"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium text-slate-900 leading-tight mb-1">
                                                                            {service.name}
                                                                        </p>
                                                                        {service.code && (
                                                                            <p className="text-[11px] text-slate-500 font-light mb-2">
                                                                                Mã: {service.code}
                                                                            </p>
                                                                        )}
                                                                        <span className="text-sm font-bold text-primary-700">
                                                                            {formatVND(service.price)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Tổng tiền */}
                                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                                    <div>
                                        <p className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-500 mb-1">{t('step2.total')}</p>
                                        <p className="text-xs text-slate-400 font-light">{selectedServices.length === 0 ? t('step2.noService') : `${selectedServices.length} dịch vụ đã chọn`}</p>
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
                                        <input
                                            type="date"
                                            value={date}
                                            min={getTomorrowDate()}
                                            onChange={e => {
                                                setDate(e.target.value);
                                                setTimeSlot('');
                                            }}
                                            className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
                                        />
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
                                                        onClick={() => setTimeSlot(shift.id)}
                                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                                                            timeSlot === shift.id
                                                                ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/20'
                                                                : 'bg-white border-gray-200 text-gray-700 hover:border-slate-400 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <span className="font-semibold text-sm mb-0.5">{shift.name}</span>
                                                        <span className="text-xs opacity-80">
                                                            {shift.startTime} – {shift.endTime}
                                                        </span>
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

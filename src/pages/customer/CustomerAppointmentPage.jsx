// src/pages/appointment/AppointmentPage.jsx
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { useAppointment } from '@/hooks/useAppointment';
import { useProfile } from '@/hooks/useProfile';
import AppointmentConfirmModal from '@/components/ui/AppointmentConfirmModal';

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

export default function CustomerAppointmentPage() {
    const { t } = useTranslation('appointment');
    const { t: tCommon } = useTranslation('common');

    const { services, loadingServices, book, loading: booking, error } = useAppointment();
    const { profile } = useProfile();
    const location = useLocation();
    
    // Nếu có state truyền sang từ trang Chi tiết lịch hẹn (Đổi lịch)
    const initialState = location.state || {};
    const isReschedule = !!initialState.rescheduleApptId;

    // Step 1 â€” ThĂ´ng tin khĂ¡ch hĂ ng (chá»‰ dĂ¹ng khi chÆ°a Ä‘Äƒng nháº­p)
    const [fullName, setFullName] = useState('');
    const [phone, setPhone]       = useState('');
    const [age, setAge]           = useState('');
    const [gender, setGender]     = useState('');
    const [address, setAddress]   = useState('');

    // Step 2 â€” Dá»‹ch vá»¥
    const [selectedServices, setSelectedServices] = useState(initialState.initialServices || []);

    // Step 3 â€” Thá» i gian
    const [date, setDate]         = useState(initialState.initialDate || '');
    const [timeSlot, setTimeSlot] = useState(initialState.initialTimeSlot || '');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const toggleService = (service) => {
        setSelectedServices(prev =>
            prev.find(s => s.id === service.id)
                ? prev.filter(s => s.id !== service.id)
                : [...prev, service]
        );
    };

    const totalCost = selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0);

    const handleSubmit = () => {
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
        // Hiện modal xác nhận thay vì gửi ngay
        setShowConfirmModal(true);
    };

    const handleConfirm = async () => {
        const patientInfo = profile
            ? {
                  customerId: profile.id,
                  fullName: profile.fullName,
                  phone: profile.phone,
                  age: Number(profile.age ?? (profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : 0)),
                  gender: profile.gender === 'Nam' ? 'male' : profile.gender === 'Nữ' ? 'female' : profile.gender === 'Khác' ? 'other' : profile.gender,
                  address: profile.address
              }
            : null;
            
        const success = await book({ ...patientInfo, selectedServices, date, timeSlot, rescheduleApptId: initialState.rescheduleApptId });
        if (success) {
            setShowConfirmModal(false);
            // Có thể reset form ở đây nếu cần, nhưng toast đã hiện thành công
            setSelectedServices([]);
            setDate('');
            setTimeSlot('');
        }
    };

    return (
        <CustomerLayout>
            <div className="max-w-6xl mx-auto space-y-8 pb-12">
                
                {/* Header Section */}
                <div className="border-b border-gray-200 pb-6">
                    <h1 className="text-2xl font-bold text-black tracking-wide uppercase mb-1">
                        {isReschedule ? 'Đổi Lịch Hẹn' : 'Đặt Lịch Dịch Vụ'}
                    </h1>
                    {profile && (
                        <p className="text-sm font-medium text-gray-500">
                            Khách hàng: <span className="text-black font-bold">{profile.fullName}</span> 
                            <span className="mx-2 text-gray-300">|</span> 
                            SĐT: <span className="text-black">{profile.phone}</span>
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* ── Left Column: Select Services ── */}
                    <section className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-bold text-black uppercase tracking-widest">
                                01. Chọn Dịch vụ
                            </h2>
                            <span className="text-xs font-semibold text-gray-400">{t('step2.selectMultiple')}</span>
                        </div>

                        {loadingServices ? (
                            <p className="text-sm text-slate-400 text-center py-8">{t('step2.loading')}</p>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                                {Object.entries(
                                    services.reduce((acc, service) => {
                                        const dept = service.department || 'Dịch vụ khác';
                                        if (!acc[dept]) acc[dept] = [];
                                        acc[dept].push(service);
                                        return acc;
                                    }, {})
                                ).sort(([deptA], [deptB]) => {
                                    const lowerA = deptA.toLowerCase();
                                    const lowerB = deptB.toLowerCase();
                                    if (lowerA.includes('khám')) return -1;
                                    if (lowerB.includes('khám')) return 1;
                                    if (lowerA.includes('xét nghiệm')) return -1;
                                    if (lowerB.includes('xét nghiệm')) return 1;
                                    return lowerA.localeCompare(lowerB);
                                }).map(([department, deptServices]) => (
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
                    </section>

                    {/* ── Right Column: Time & Submit ── */}
                    <div className="lg:col-span-5 space-y-6">
                        <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-sm font-bold text-black uppercase tracking-widest">
                                    02. Thời Gian
                                </h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                                        {t('step3.chooseDate')}
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full h-12 px-4 text-sm font-bold text-black border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                                        {t('step3.timeSlot')}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['morning', 'afternoon'].map(slot => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => setTimeSlot(slot)}
                                                className={`h-12 text-sm font-bold rounded-xl border transition-all ${
                                                    timeSlot === slot
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                                }`}
                                            >
                                                {t(`step3.${slot}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-black text-white border border-black rounded-2xl p-8 shadow-xl">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">{t('step2.total')}</p>
                                    <p className="text-xs text-gray-500">{selectedServices.length === 0 ? t('step2.noService') : `${selectedServices.length} dịch vụ`}</p>
                                </div>
                                <span className="text-3xl font-bold tracking-tight">
                                    {formatVND(totalCost)}
                                </span>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={booking || selectedServices.length === 0 || !date || !timeSlot}
                                className="w-full h-14 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-bold uppercase tracking-widest rounded-xl transition-colors"
                            >
                                {booking ? tCommon('loading') : (isReschedule ? 'Xác nhận Đổi Lịch' : 'Xác nhận Đặt Lịch')}
                            </button>
                        </section>
                    </div>

                    {/* Modal xác nhận */}
                    {showConfirmModal && (
                        <AppointmentConfirmModal
                            namespace="appointment"
                            data={{
                                fullName: profile?.fullName || '',
                                phone: profile?.phone || '',
                                ageGender: profile
                                    ? `${profile.age ?? calculateAge(profile.dateOfBirth) ?? ''} / ${profile.gender === 'Nam' ? t('step1.genderOptions.male') : profile.gender === 'Nữ' ? t('step1.genderOptions.female') : profile.gender === 'Khác' ? t('step1.genderOptions.other') : profile.gender}`
                                    : '',
                                email: profile?.email,
                                address: profile?.address || '',
                                date,
                                timeSlot: timeSlot === 'morning' ? t('step3.morning') : t('step3.afternoon'),
                                method: t('step3.morning'),
                                total: formatVND(totalCost),
                                services: selectedServices,
                                reason: '',
                            }}
                            isLoading={booking}
                            onClose={() => setShowConfirmModal(false)}
                            onConfirm={handleConfirm}
                        />
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}

// src/pages/customer/CustomerAppointmentPage.jsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { useAppointment } from '@/hooks/useAppointment';
import { useProfile } from '@/hooks/useProfile';
import AppointmentConfirmModal from '@/components/ui/AppointmentConfirmModal';
import { ROUTES } from '@/constants/routes';

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
    const navigate = useNavigate();

    const { services, loadingServices, book, loading: booking, error, shifts, shiftLoading } = useAppointment();
    const { profile } = useProfile();
    const location = useLocation();
    
    // Nếu có state truyền sang từ trang Chi tiết lịch hẹn (Đổi lịch)
    const initialState = location.state || {};
    const isReschedule = !!initialState.rescheduleApptId;

    // Bước 1 — Thông tin khách hàng (chỉ dùng khi chưa đăng nhập)
    const [fullName, setFullName] = useState('');
    const [phone, setPhone]       = useState('');
    const [age, setAge]           = useState('');
    const [gender, setGender]     = useState('');
    const [address, setAddress]   = useState('');

    // Bước 2 — Dịch vụ
    const [selectedServices, setSelectedServices] = useState(initialState.initialServices || []);

    // Bước 3 — Thời gian
    const [date, setDate]         = useState(initialState.initialDate || '');
    const [shiftId, setShiftId] = useState(initialState.initialShiftId || '');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const toggleService = (service) => {
        setSelectedServices(prev =>
            prev.find(s => s.id === service.id)
                ? prev.filter(s => s.id !== service.id)
                : [...prev, service]
        );
    };

    const getServiceEligibility = (service) => {
        const patientAge = profile ? (profile.age ?? (profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null)) : (age === '' ? null : Number(age));
        const rawGender = profile?.gender || gender;
        const patientGender = rawGender ? ({ Nam: 'MALE', Nữ: 'FEMALE', Khác: 'OTHER', male: 'MALE', female: 'FEMALE', other: 'OTHER' }[rawGender] || rawGender.toUpperCase()) : '';
        if (patientAge == null) return { eligible: false, reason: 'Cập nhật ngày sinh để kiểm tra dịch vụ' };
        if (patientAge < service.minimumAge || patientAge > service.maximumAge) return { eligible: false, reason: `Chỉ áp dụng từ ${service.minimumAge}–${service.maximumAge} tuổi` };
        if (service.allowedGender && !patientGender) return { eligible: false, reason: 'Cập nhật giới tính để kiểm tra dịch vụ' };
        if (service.allowedGender && service.allowedGender !== patientGender) return { eligible: false, reason: 'Không phù hợp với giới tính trong hồ sơ' };
        return { eligible: true, reason: '' };
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
            
        const success = await book({ ...patientInfo, selectedServices, date, shiftId, rescheduleApptId: initialState.rescheduleApptId });
        if (success) {
            setShowConfirmModal(false);
            // Có thể reset form ở đây nếu cần, nhưng toast đã hiện thành công
            setSelectedServices([]);
            setDate('');
            setShiftId('');
            
            // Chuyển hướng về trang Lịch hẹn của tôi
            navigate(ROUTES.MY_APPOINTMENTS);
        }
    };

    return (
        <CustomerLayout>
            <div className="max-w-6xl mx-auto space-y-8 pb-12">
                
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(ROUTES.MY_APPOINTMENTS)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 transition-colors shrink-0"
                    >
                        ← Quay lại
                    </button>
                    <div className="border-b border-gray-200 pb-6 flex-1">
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
                                        const dept = service.departmentType === 'EXAMINATION' ? 'EXAMINATION' : 'PARACLINICAL';
                                        if (!acc[dept]) acc[dept] = [];
                                        acc[dept].push(service);
                                        return acc;
                                    }, {})
                                ).sort(([deptA], [deptB]) => {
                                    if (deptA === 'EXAMINATION') return -1;
                                    if (deptB === 'EXAMINATION') return 1;
                                    return 0;
                                }).map(([department, deptServices]) => (
                                    <div key={department} className="space-y-3">
                                        <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500 sticky top-0 bg-white py-2 z-10">
                                            {department === 'EXAMINATION' ? 'Khám bệnh' : 'Cận lâm sàng'}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {deptServices.map(service => {
                                                const checked = !!selectedServices.find(s => s.id === service.id);
                                                const eligibility = getServiceEligibility(service);
                                                return (
                                                    <label
                                                        key={service.id}
                                                        className={`flex flex-col p-3 border rounded-xl transition-all duration-200 ${!eligibility.eligible ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' : checked ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 cursor-pointer' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'}`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => eligibility.eligible && toggleService(service)}
                                                                disabled={!eligibility.eligible}
                                                                className="w-4 h-4 accent-primary-600 mt-0.5 rounded flex-shrink-0"
                                                            />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-slate-900 leading-tight mb-1">
                                                                    {service.name}
                                                                </p>
                                                                {department === 'PARACLINICAL' && service.capabilityName && <p className="text-[11px] text-slate-500 mb-1">{service.capabilityName}</p>}
                                                                {service.code && (
                                                                    <p className="text-[11px] text-slate-500 font-light mb-2">
                                                                        Mã: {service.code}
                                                                    </p>
                                                                )}
                                                                <span className="text-sm font-bold text-primary-700">
                                                                    {formatVND(service.price)}
                                                                </span>
                                                                {!eligibility.eligible && <p className="text-[11px] text-red-500 mt-1">{eligibility.reason}</p>}
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
                                    {shiftLoading ? (
                                        <p className="text-sm text-gray-500">Đang tải...</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {shifts.map(shift => (
                                                <button
                                                    key={shift.id}
                                                    type="button"
                                                    onClick={() => setShiftId(shift.id)}
                                                    className={`h-14 text-sm font-bold rounded-xl border transition-all ${
                                                        shiftId === shift.id
                                                            ? 'bg-black text-white border-black'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                                    }`}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <span>{shift.name}</span>
                                                        <span className="text-xs font-normal opacity-80 mt-0.5">
                                                            {shift.startTime} – {shift.endTime}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
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
                                disabled={booking || selectedServices.length === 0 || !date || !shiftId}
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
                                timeSlot: shifts.find(s => s.id === shiftId)?.name || '',
                                method: 'Khám trực tiếp tại phòng khám',
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

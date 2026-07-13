// src/pages/appointment/AppointmentPage.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/layout/Navbar';
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

export default function AppointmentPage() {
    const { t } = useTranslation('appointment');
    const { t: tCommon } = useTranslation('common');

    const { services, loadingServices, book, loading: booking, error } = useAppointment();
    const { profile } = useProfile();

    // Step 1 — Thông tin khách hàng (chỉ dùng khi chưa đăng nhập)
    const [fullName, setFullName] = useState('');
    const [phone, setPhone]       = useState('');
    const [age, setAge]           = useState('');
    const [gender, setGender]     = useState('');
    const [address, setAddress]   = useState('');

    // Step 2 — Dịch vụ
    const [selectedServices, setSelectedServices] = useState([]);

    // Step 3 — Thời gian
    const [date, setDate]         = useState('');
    const [timeSlot, setTimeSlot] = useState('');
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

    const handleConfirm = () => {
        const computedAge = profile
            ? (profile.age?? (profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : age))
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
        book({ ...patientInfo, selectedServices, date, timeSlot });
        setShowConfirmModal(false);
    };

    return (
        <>
            <Navbar />

            <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-jakarta">
                <div className="w-full max-w-xl space-y-4">

                    {/* ── Step 1: Thông tin khách hàng ── */}
                    <section className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-gray-400">1</span>
                                <h2 className="text-sm font-semibold text-gray-900">
                                    {t('step1.heading')}
                                </h2>
                            </div>
                            <span className="text-xs font-semibold text-primary-500 uppercase tracking-wide">
                                {t('title')}
                            </span>
                        </div>

                        {/* Họ và tên */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                {t('step1.fullName')}
                            </label>
                            <input
                                type="text"
                                value={profile ? profile.fullName : fullName}
                                onChange={e => setFullName(e.target.value)}
                                disabled={!!profile}
                                className={`w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 ${
                                    profile ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>

                        {/* SDT + Tuổi + Giới tính */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    {t('step1.phone')}
                                </label>
                                <input
                                    type="tel"
                                    value={profile ? profile.phone : phone}
                                    onChange={e => setPhone(e.target.value)}
                                    disabled={!!profile}
                                    className={`w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 ${
                                        profile ? 'bg-gray-100 cursor-not-allowed' : ''
                                    }`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    {t('step1.age')}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={120}
                                    value={profile ? (profile.age ?? (profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : '')) : age}
                                    onChange={e => setAge(e.target.value)}
                                    disabled={!!profile}
                                    className={`w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 ${
                                        profile ? 'bg-gray-100 cursor-not-allowed' : ''
                                    }`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    {t('step1.gender')}
                                </label>
                                <select

                                    value={profile ? (profile.gender === 'MALE' ? 'male' : profile.gender === 'FEMALE' ? 'female' : profile.gender === 'OTHER' ? 'other' : profile.gender) : gender}
                                    onChange={e => setGender(e.target.value)}
                                    disabled={!!profile}
                                    className={`w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 bg-white ${
                                        profile
                                            ? "!bg-gray-100 cursor-not-allowed"
                                            : "bg-white text-black"
                                    } `}
                                >
                                    <option value="" />
                                    <option value="male">{t('step1.genderOptions.male')}</option>
                                    <option value="female">{t('step1.genderOptions.female')}</option>
                                    <option value="other">{t('step1.genderOptions.other')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Địa chỉ */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                {t('step1.address')}
                            </label>
                            <input
                                type="text"
                                value={profile ? profile.address : address}
                                onChange={e => setAddress(e.target.value)}
                                disabled={!!profile}
                                className={`w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 ${
                                    profile ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                            />
                        </div>
                    </section>

                    {/* ── Step 2: Chọn dịch vụ ── */}
                    <section className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-gray-400">2</span>
                                <h2 className="text-sm font-semibold text-gray-900">
                                    {t('step2.heading')}
                                </h2>
                            </div>
                            <span className="text-xs text-gray-400">{t('step2.selectMultiple')}</span>
                        </div>

                        {loadingServices ? (
                            <p className="text-sm text-gray-400 text-center py-4">{t('step2.loading')}</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {services.map(service => {
                                    const checked = !!selectedServices.find(s => s.id === service.id);
                                    return (
                                        <label
                                            key={service.id}
                                            className="flex items-start gap-3 py-3.5 cursor-pointer group"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleService(service)}
                                                className="mt-0.5 w-4 h-4 accent-primary-500 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 leading-snug">
                                                    {service.name}
                                                </p>
                                                {service.code && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Mã: {service.code}
                                                        {service.department && ` • ${service.department}`}
                                                    </p>
                                                )}
                                                {service.tag && (
                                                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {service.tag}
                          </span>
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900 shrink-0">
                        {formatVND(service.price)}
                      </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tổng tiền */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-400">{t('step2.total')}</p>
                                <p className="text-xs text-gray-400">{t('step2.noService')}</p>
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                {formatVND(totalCost)}
              </span>
                        </div>
                    </section>

                    {/* ── Step 3: Thời gian khám ── */}
                    <section className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="text-xs font-semibold text-gray-400">3</span>
                            <h2 className="text-sm font-semibold text-gray-900">
                                {t('step3.heading')}
                            </h2>
                        </div>

                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    {t('step3.chooseDate')}
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
                                />
                            </div>

                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    {t('step3.timeSlot')}
                                </label>
                                <div className="flex gap-2">
                                    {['morning', 'afternoon'].map(slot => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setTimeSlot(slot)}
                                            className={`flex-1 h-10 text-sm rounded-md border transition-colors ${
                                                timeSlot === slot
                                                    ? 'bg-primary-500 text-white border-primary-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                                            }`}
                                        >
                                            {t(`step3.${slot}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Lỗi */}
                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    {/* Nút submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={booking}
                        className="w-full h-12 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        {booking ? tCommon('loading') : t('submit')}
                    </button>

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
                                timeSlot: timeSlot === 'morning' ? t('step3.morning') : t('step3.afternoon'),
                                method: t('step3.morning'),
                                total: formatVND(totalCost),
                                services: selectedServices,
                                reason: '',
                            }}
                            onClose={() => setShowConfirmModal(false)}
                            onConfirm={handleConfirm}
                        />
                    )}

                </div>
            </div>
        </>
    );
}

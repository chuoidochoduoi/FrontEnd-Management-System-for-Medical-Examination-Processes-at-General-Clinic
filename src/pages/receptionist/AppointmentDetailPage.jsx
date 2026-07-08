// src/pages/receptionist/AppointmentDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { ROUTES } from '@/constants/routes';
import AppointmentConfirmModal from '@/components/ui/AppointmentConfirmModal';

const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

const GENDER_LABELS = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };
const GENDER_VALUES = { male: 'MALE', female: 'FEMALE', other: 'OTHER' };

export default function AppointmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation('receptionist');

    const [appointment, setAppointment] = useState(null);
    const [allServices, setAllServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingServices, setLoadingServices] = useState(false);
    const [saving, setSaving] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [error, setError] = useState('');

    // Form states
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [date, setDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('morning');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'save' | 'checkin'

    // Check if editing patient info allowed (no customerId = guest)
    const isPatientEditable = !appointment?.customerId;

    // Fetch appointment detail
    useEffect(() => {
        if (!id) return;
        const fetchDetail = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/appointments/${id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) throw new Error('Không thể tải thông tin lịch hẹn.');
                const data = await res.json();
                setAppointment(data);

                // Set selected service IDs from appointment
                const serviceIds = (data.services || []).map(s => s.id || s.serviceId);
                setSelectedServiceIds(serviceIds);

                // Populate other form states
                setFullName(data.guestFullName || data.fullName || '');
                setPhone(data.guestPhone || data.phone || '');
                setAge(data.guestAge || data.age || '');
                const genderMap = { MALE: 'male', FEMALE: 'female', OTHER: 'other' };
                setGender(genderMap[data.guestGender] || '');
                setAddress(data.guestAddress || data.address || '');

                // Format date for input
                if (data.scheduledAt) {
                    const d = new Date(data.scheduledAt);
                    setDate(d.toISOString().split('T')[0]);
                }
                setTimeSlot(data.timeSlot?.toLowerCase() || 'morning');
            } catch (err) {
                setError(err.message || 'Có lỗi xảy ra.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    // Fetch all available services
    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services/available`);
                if (!res.ok) throw new Error('Không thể tải dịch vụ.');
                const data = await res.json();
                const mappedServices = (data.content || []).map(s => ({
                    id: s.serviceId,
                    name: s.name,
                    price: s.price,
                    description: s.description,
                }));
                setAllServices(mappedServices);
            } catch (err) {
                // Silent fail - services will show from appointment
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, []);

    // Toggle service selection - always allowed
    const toggleService = (serviceId) => {
        setSelectedServiceIds(prev =>
            prev.includes(serviceId)
                ? prev.filter(sid => sid !== serviceId)
                : [...prev, serviceId]
        );
    };

    // Save changes
    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            // Only send patient info if guest, otherwise just services and time
            const body = isPatientEditable
                ? {
                    guestFullName: fullName,
                    guestPhone: phone,
                    guestAddress: address,
                    guestAge: Number(age),
                    guestGender: GENDER_VALUES[gender],
                    scheduledAt: date ? `${date}T09:00:00` : null,
                    timeSlot: timeSlot?.toUpperCase(),
                    serviceIds: selectedServiceIds,
                }
                : {
                    scheduledAt: date ? `${date}T09:00:00` : null,
                    timeSlot: timeSlot?.toUpperCase(),
                    serviceIds: selectedServiceIds,
                };

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/receptionist/appointments/${id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(body),
                }
            );
            if (!res.ok) throw new Error('Lưu thất bại. Vui lòng thử lại.');
            const data = await res.json();
            setAppointment(data);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra.');
        } finally {
            setSaving(false);
            setShowConfirmModal(false);
        }
    };

    // Check-in
    const handleCheckIn = async () => {
        if (!appointment) return;
        const status = appointment.status?.toString().toUpperCase() || '';
        if (status !== 'PENDING') return;
        setCheckingIn(true);
        setError('');
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const body = {
                appointmentId: id,
                serviceIds: selectedServiceIds,
            };
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/appointments/${id}/check-in`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(body),
                }
            );
            if (!res.ok) throw new Error('Check-in thất bại. Vui lòng thử lại.');
            navigate(ROUTES.RECEPTIONIST_CHECKIN);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra.');
        } finally {
            setCheckingIn(false);
            setShowConfirmModal(false);
        }
    };

    // Show confirmation modal
    const handleSaveClick = () => {
        // Validation check
        if (isPatientEditable) {
            if (!fullName.trim()) {
                setError('Vui lòng nhập họ và tên bệnh nhân.');
                setShowConfirmModal(false);
                return;
            }
            if (!phone.trim()) {
                setError('Vui lòng nhập số điện thoại.');
                setShowConfirmModal(false);
                return;
            }
        }
        if (selectedServiceIds.length === 0) {
            setError('Vui lòng chọn ít nhất một dịch vụ.');
            setShowConfirmModal(false);
            return;
        }
        if (!date) {
            setError('Vui lòng chọn ngày khám.');
            setShowConfirmModal(false);
            return;
        }

        setConfirmAction('save');
        setShowConfirmModal(true);
    };

    const handleCheckInClick = () => {
        // Validation check - chỉ cần chọn dịch vụ
        if (selectedServiceIds.length === 0) {
            setError('Vui lòng chọn ít nhất một dịch vụ để check-in.');
            setShowConfirmModal(false);
            return;
        }

        setConfirmAction('checkin');
        setShowConfirmModal(true);
    };

    // Handle confirm from modal
    const handleConfirm = () => {
        if (confirmAction === 'save') {
            handleSave();
        } else if (confirmAction === 'checkin') {
            handleCheckIn();
        }
    };

    const timeSlots = [
        { key: 'morning', label: t('appointmentDetail.step3.morning'), subLabel: t('appointmentDetail.step3.morningTime') },
        { key: 'afternoon', label: t('appointmentDetail.step3.afternoon'), subLabel: t('appointmentDetail.step3.afternoonTime') },
    ];

    const inputCls = 'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 bg-white';
    const disabledInputCls = 'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500';
    const labelCls = 'block text-xs text-gray-400 mb-1.5';
    const serviceCheckboxCls = 'mt-0.5 w-4 h-4 accent-primary-500 shrink-0';

    if (loading) {
        return (
            <ReceptionistLayout>
                <p className="text-sm text-gray-400 text-center py-20">
                    {t('appointmentDetail.loading')}
                </p>
            </ReceptionistLayout>
        );
    }

    // Use all fetched services, fallback to appointment services
    const servicesToShow = allServices.length > 0 ? allServices : (appointment?.services || []);
    const totalCost = servicesToShow
        .filter(s => selectedServiceIds.includes(s.id))
        .reduce((sum, s) => sum + (s.price || 0), 0);

    return (
        <ReceptionistLayout>
            <div className="max-w-2xl mx-auto space-y-5">

                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">
                            {t('appointmentDetail.title')}
                        </h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {t('appointmentDetail.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(ROUTES.RECEPTIONIST_CHECKIN)}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-500 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        {t('appointmentDetail.backToList')}
                    </button>
                </div>

                {/* Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 space-y-8">

                    {/* ── Step 1: Thông tin bệnh nhân ── */}
                    <section>
                        <div className="flex items-center gap-2.5 mb-5">
                            <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">
                                1
                            </span>
                            <h2 className="text-sm font-semibold text-gray-900">
                                {t('appointmentDetail.step1.heading')}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>{t('appointmentDetail.step1.fullName')}</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    disabled={!isPatientEditable}
                                    className={isPatientEditable ? inputCls : disabledInputCls}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>{t('appointmentDetail.step1.phone')}</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        disabled={!isPatientEditable}
                                        className={isPatientEditable ? inputCls : disabledInputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>{t('appointmentDetail.step1.age')}</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={120}
                                        value={age}
                                        onChange={e => setAge(e.target.value)}
                                        disabled={!isPatientEditable}
                                        className={isPatientEditable ? inputCls : disabledInputCls}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>{t('appointmentDetail.step1.gender')}</label>
                                    <select
                                        value={gender}
                                        onChange={e => setGender(e.target.value)}
                                        disabled={!isPatientEditable}
                                        className={isPatientEditable ? inputCls : disabledInputCls}
                                    >
                                        <option value="" />
                                        <option value="male">{t('appointmentDetail.step1.genderOptions.male')}</option>
                                        <option value="female">{t('appointmentDetail.step1.genderOptions.female')}</option>
                                        <option value="other">{t('appointmentDetail.step1.genderOptions.other')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>{t('appointmentDetail.step1.email')}</label>
                                    <input
                                        type="email"
                                        placeholder={t('appointmentDetail.step1.emailPlaceholder')}
                                        disabled
                                        className={disabledInputCls}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>{t('appointmentDetail.step1.insurance')}</label>
                                <input type="text" disabled className={disabledInputCls} />
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* ── Step 2: Dịch vụ y tế ── */}
                    <section>
                        <div className="flex items-center gap-2.5 mb-5">
                            <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">
                                2
                            </span>
                            <h2 className="text-sm font-semibold text-gray-900">
                                {t('appointmentDetail.step2.heading')}
                            </h2>
                        </div>

                        {loadingServices ? (
                            <p className="text-sm text-gray-400 text-center py-4">{t('step2.loading', { ns: 'receptionist' })}</p>
                        ) : servicesToShow.length > 0 ? (
                            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                {servicesToShow.map(service => {
                                    const checked = selectedServiceIds.includes(service.id);
                                    return (
                                        <label
                                            key={service.id}
                                            className="flex items-start gap-3 py-3.5 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleService(service.id)}
                                                className="mt-0.5 w-4 h-4 accent-primary-500 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {service.name}
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900 shrink-0">
                                                {formatVND(service.price)}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 py-4">Chưa có dịch vụ nào được chọn</p>
                        )}

                        {/* Tổng tiền */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <p className="text-xs text-gray-400">
                                {t('appointmentDetail.step2.total')} ({selectedServiceIds.length} dịch vụ)
                            </p>
                            <span className="text-lg font-bold text-gray-900">
                                {formatVND(totalCost)}
                            </span>
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* ── Step 3: Thời gian khám ── */}
                    <section>
                        <div className="flex items-center gap-2.5 mb-5">
                            <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">
                                3
                            </span>
                            <h2 className="text-sm font-semibold text-gray-900">
                                {t('appointmentDetail.step3.heading')}
                            </h2>
                        </div>

                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className={labelCls}>{t('appointmentDetail.step3.chooseDate')}</label>
                                <input
                                    type="date"
                                    value={date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setDate(e.target.value)}
                                    className={inputCls}
                                />
                            </div>

                            <div className="flex-1">
                                <label className={labelCls}>{t('appointmentDetail.step3.timeSlot')}</label>
                                <div className="flex gap-2">
                                    {timeSlots.map(slot => (
                                        <button
                                            key={slot.key}
                                            type="button"
                                            onClick={() => setTimeSlot(slot.key)}
                                            className={`flex-1 py-2.5 px-3 rounded-lg border text-sm transition-colors text-left ${
                                                timeSlot === slot.key
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            <p className="font-medium">{slot.label}</p>
                                            <p className="text-xs mt-0.5 text-gray-400">{slot.subLabel}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Error */}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                {/* Actions */}
                <div className="flex justify-center gap-3 pb-8">
                    <button
                        onClick={handleSaveClick}
                        disabled={saving || checkingIn}
                        className="px-8 h-11 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        {saving ? t('appointmentDetail.actions.saving') : t('appointmentDetail.actions.save')}
                    </button>

                    {appointment && (appointment.status?.toString().toUpperCase() === 'PENDING') && (
                        <button
                            onClick={handleCheckInClick}
                            disabled={checkingIn || saving}
                            className="px-8 h-11 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            {checkingIn ? t('appointmentDetail.actions.checkingIn') : t('appointmentDetail.actions.checkIn')}
                        </button>
                    )}
                </div>

                {/* Modal xác nhận */}
                {showConfirmModal && (
                    <AppointmentConfirmModal
                        data={{
                            fullName: isPatientEditable ? fullName : (appointment?.guestFullName || appointment?.fullName || ''),
                            phone: isPatientEditable ? phone : (appointment?.guestPhone || appointment?.phone || ''),
                            ageGender: `${isPatientEditable ? age : (appointment?.guestAge || appointment?.age || '')} / ${isPatientEditable ? (gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác') : (GENDER_LABELS[appointment?.guestGender] || GENDER_LABELS[appointment?.gender] || '')}`,
                            email: appointment?.email || '',
                            address: isPatientEditable ? address : (appointment?.guestAddress || appointment?.address || ''),
                            date: date ? new Date(date).toLocaleDateString('vi-VN') : '',
                            timeSlot: timeSlot === 'morning' ? t('appointmentDetail.step3.morning') : t('appointmentDetail.step3.afternoon'),
                            method: t('appointmentDetail.step3.morning'),
                            total: formatVND(servicesToShow
                                .filter(s => selectedServiceIds.includes(s.id))
                                .reduce((sum, s) => sum + (s.price || 0), 0)),
                            services: servicesToShow.filter(s => selectedServiceIds.includes(s.id)),
                            reason: appointment?.reason || '',
                        }}
                        onClose={() => setShowConfirmModal(false)}
                        onConfirm={handleConfirm}
                    />
                )}

            </div>
        </ReceptionistLayout>
    );
}
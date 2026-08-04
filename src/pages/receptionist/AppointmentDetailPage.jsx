// src/pages/receptionist/AppointmentDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { ROUTES } from '@/constants/routes';
import AppointmentConfirmModal from '@/components/ui/AppointmentConfirmModal';

const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

const GENDER_LABELS = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };
const GENDER_VALUES = { male: 'MALE', female: 'FEMALE', other: 'OTHER' };
const DEPARTMENT_TYPE_LABELS = {
    'EXAMINATION': 'Khám bệnh',
    'PARACLINICAL': 'Cận lâm sàng',
    'OTHER': 'Dịch vụ khác'
};

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
    const [searchTerm, setSearchTerm] = useState('');

    // Insurance & BHYT states
    const [insurances, setInsurances] = useState([]);
    const [insuranceId, setInsuranceId] = useState('');
    const [bhytCode, setBhytCode] = useState('');

    // Fetch insurances
    useEffect(() => {
        const fetchInsurances = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/insurances`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setInsurances(data || []);
                }
            } catch (err) {
                console.error('Failed to fetch insurances', err);
            }
        };
        fetchInsurances();
    }, []);

    // Check BHYT function
    const checkBhyt = async () => {
        if (!bhytCode || bhytCode.length < 5) {
            toast.error('Vui lòng nhập mã thẻ bảo hiểm hợp lệ');
            return;
        }
        if (!insuranceId) {
            toast.error('Vui lòng chọn Loại bảo hiểm trước khi kiểm tra');
            return;
        }
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bhyt/check?cardNumber=${bhytCode}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            
            if (result.isValid) {
                if (result.insuranceId !== insuranceId) {
                    toast.error(`Mã thẻ này là của ${result.insuranceName}, không thuộc hãng bảo hiểm bạn đang chọn!`);
                    return;
                }
                toast.success(`Thẻ bảo hiểm hợp lệ: ${result.fullName}`);
                if (!fullName) setFullName(result.fullName);
            } else {
                toast.error(result.message || 'Mã thẻ không hợp lệ!');
            }
        } catch (err) {
            toast.error('Lỗi kết nối khi tra cứu thẻ bảo hiểm');
        }
    };

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
                const normalized = {
                    ...data,
                    services: (data.services || []).map(service => ({
                        ...service,
                        id: service.id || service.serviceId,
                    })),
                };
                setAppointment(normalized);

                // Set selected service IDs from appointment
                const serviceIds = normalized.services.map(s => s.id).filter(Boolean);
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
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services/available?size=1000`);
                if (!res.ok) throw new Error('Không thể tải dịch vụ.');
                const data = await res.json();
                const mappedServices = (data.content || []).map(s => ({
                    id: s.serviceId,
                    name: s.name,
                    price: s.price,
                    description: s.description,
                    departmentType: s.departmentType,
                    capabilityName: s.requiredCapabilityName || '',
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
            // Send full patient info regardless of customerId
            const body = {
                guestFullName: fullName,
                guestPhone: phone,
                guestAddress: address,
                guestAge: Number(age),
                guestGender: GENDER_VALUES[gender],
                scheduledAt: date ? `${date}T${timeSlot === 'afternoon' ? '14:00:00' : '09:00:00'}` : null,
                timeSlot: timeSlot?.toUpperCase(),
                serviceIds: selectedServiceIds,
            };

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/appointments/${id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(body),
                }
            );
            if (!res.ok) throw new Error('Lưu thất bại. Vui lòng thử lại.');
            const data = await res.json();
            setAppointment(data);
            toast.success('Lưu thông tin thành công!');
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
        if (status !== 'PENDING') {
            setError(status === 'CHECKED_IN'
                ? 'Lịch hẹn này đã được check-in.'
                : 'Chỉ có thể check-in lịch hẹn đang chờ tiếp nhận.');
            setShowConfirmModal(false);
            return;
        }
        setCheckingIn(true);
        setError('');
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const body = {
                appointmentId: id,
                serviceIds: selectedServiceIds,
                insuranceId: insuranceId || null
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
            const result = await res.json().catch(() => null);
            if (!res.ok) throw new Error(result?.message || result?.error || 'Check-in thất bại. Vui lòng thử lại.');
            toast.success('Nhận bệnh thành công!');
            navigate(ROUTES.RECEPTIONIST_CHECKIN);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra.');
            toast.error(err.message || 'Không thể check-in bệnh nhân.');
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
            if (!/^(\+84|0)\d{9,10}$/.test(phone.trim())) {
                setError('Số điện thoại Việt Nam không hợp lệ.');
                setShowConfirmModal(false);
                return;
            }
            if (date && date < new Date().toISOString().slice(0, 10)) {
                setError('Ngày hẹn không được nằm trong quá khứ.');
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
    const filteredServices = servicesToShow.filter(s =>
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const totalCost = servicesToShow
        .filter(s => selectedServiceIds.includes(s.id))
        .reduce((sum, s) => sum + (s.price || 0), 0);

    return (
        <ReceptionistLayout>
            <div className="max-w-6xl mx-auto space-y-6">

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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Cột trái: Thông tin bệnh nhân & Lịch hẹn */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-8">
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
                                            className={inputCls}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>{t('appointmentDetail.step1.phone')}</label>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                className={inputCls}
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
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>{t('appointmentDetail.step1.gender')}</label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setGender('male')}
                                                    className={`flex-1 h-10 px-3 text-sm font-medium border rounded-lg transition-colors ${
                                                        gender === 'male'
                                                            ? 'bg-gray-900 text-white border-gray-900'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                                    }`}
                                                >
                                                    {t('appointmentDetail.step1.genderOptions.male')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setGender('female')}
                                                    className={`flex-1 h-10 px-3 text-sm font-medium border rounded-lg transition-colors ${
                                                        gender === 'female'
                                                            ? 'bg-gray-900 text-white border-gray-900'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                                    }`}
                                                >
                                                    {t('appointmentDetail.step1.genderOptions.female')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                        {/* Loại Bảo hiểm (Chọn trước) */}
                                        <div>
                                            <label className={labelCls}>Bảo hiểm y tế (nếu có)</label>
                                            <select
                                                value={insuranceId}
                                                onChange={e => {
                                                    setInsuranceId(e.target.value);
                                                    setBhytCode('');
                                                }}
                                                className={inputCls}
                                            >
                                                <option value="">Không áp dụng</option>
                                                {insurances?.map(ins => (
                                                    <option key={ins.insuranceId} value={ins.insuranceId}>
                                                        {ins.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Mã thẻ BHYT hiện ra nếu có chọn bảo hiểm */}
                                        {insuranceId && (
                                            <div>
                                                <label className={labelCls}>Số thẻ bảo hiểm (để tra cứu & lưu hồ sơ)</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={bhytCode}
                                                        onChange={e => setBhytCode(e.target.value)}
                                                        placeholder="Nhập mã thẻ..."
                                                        className={inputCls}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={checkBhyt}
                                                        className="px-4 py-0 bg-blue-50 text-blue-600 border border-blue-200 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors shrink-0 h-10"
                                                    >
                                                        Kiểm tra
                                                    </button>
                                                </div>
                                                <p className="mt-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                                    Đã áp dụng chính sách giảm giá của <b>{insurances?.find(i => i.insuranceId === insuranceId)?.name}</b>. Xem chi tiết mức giảm trên từng dịch vụ.
                                                </p>
                                            </div>
                                        )}
                                </div>
                            </section>

                            <hr className="border-gray-100" />

                            {/* ── Step 3: Thời gian khám ── */}
                            <section>
                                <div className="flex items-center gap-2.5 mb-5">
                                    <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">
                                        2
                                    </span>
                                    <h2 className="text-sm font-semibold text-gray-900">
                                        {t('appointmentDetail.step3.heading')}
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelCls}>{t('appointmentDetail.step3.chooseDate')}</label>
                                        <input
                                            type="date"
                                            value={date}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={e => setDate(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>

                                    <div>
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
                    </div>

                    {/* Cột phải: Dịch vụ y tế */}
                    <div className="lg:col-span-7 h-full">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 h-full flex flex-col">
                            {/* ── Step 2: Dịch vụ y tế ── */}
                            <section className="flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between gap-4 mb-5 shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold shrink-0">
                                            3
                                        </span>
                                        <h2 className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                            {t('appointmentDetail.step2.heading')}
                                        </h2>
                                    </div>
                                    <div className="relative max-w-xs w-full">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm dịch vụ..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-50 focus:border-primary-500 transition-colors outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 min-h-0">
                                    {loadingServices ? (
                                        <p className="text-sm text-gray-400 text-center py-4">{t('step2.loading', { ns: 'receptionist' })}</p>
                                    ) : filteredServices.length > 0 ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                                            {Object.entries(
                                                filteredServices.reduce((acc, service) => {
                                                    const type = service.departmentType === 'EXAMINATION' ? 'EXAMINATION' : 'PARACLINICAL';
                                                    if (!acc[type]) acc[type] = [];
                                                    acc[type].push(service);
                                                    return acc;
                                                }, {})
                                            ).sort(([a], [b]) => a === 'EXAMINATION' ? -1 : b === 'EXAMINATION' ? 1 : 0).map(([type, services]) => (
                                                <div key={type} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col h-full overflow-hidden">
                                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 shrink-0">
                                                        {DEPARTMENT_TYPE_LABELS[type] || type}
                                                    </h3>
                                                    <div className="divide-y divide-gray-200 flex-1 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
                                                        {services.map(service => {
                                                            const checked = selectedServiceIds.includes(service.id);
                                                            return (
                                                                <label
                                                                    key={service.id}
                                                                    className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-gray-100/50 rounded-lg px-2 -mx-2 transition-colors w-full"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => toggleService(service.id)}
                                                                        className="mt-0.5 w-4 h-4 accent-primary-500 shrink-0 rounded border-gray-300"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-sm font-medium break-words ${checked ? 'text-primary-600' : 'text-gray-900'}`}>
                                                                            {service.name}
                                                                        </p>
                                                                        {type === 'PARACLINICAL' && service.capabilityName && <p className="text-xs text-gray-500 mt-0.5">{service.capabilityName}</p>}
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-gray-900 shrink-0 whitespace-nowrap pl-2">
                                                                        {formatVND(service.price)}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            Không tìm thấy dịch vụ nào phù hợp
                                        </p>
                                    )}
                                </div>

                                {/* Tổng tiền */}
                                <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between items-center shrink-0">
                                    <p className="text-sm text-gray-500 font-medium">
                                        {t('appointmentDetail.step2.total')} ({selectedServiceIds.length} dịch vụ)
                                    </p>
                                    <span className="text-xl font-bold text-gray-900">
                                        {formatVND(totalCost)}
                                    </span>
                                </div>
                            </section>
                        </div>
                    </div>
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
                        namespace="receptionist"
                        data={{
                            fullName: fullName,
                            phone: phone,
                            ageGender: `${age} / ${gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác'}`,
                            bhyt: insuranceId ? `${insurances?.find(i => i.insuranceId === insuranceId)?.name} - ${bhytCode}` : '',
                            email: appointment?.email || '',
                            address: address,
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
                        isLoading={saving || checkingIn}
                    />
                )}

            </div>
        </ReceptionistLayout>
    );
}

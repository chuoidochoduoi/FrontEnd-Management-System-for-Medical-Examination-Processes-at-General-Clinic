// src/pages/receptionist/AppointmentDetailPage.jsx

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    Search,
    UserRound,
    CalendarDays,
    Stethoscope,
    LogIn
} from 'lucide-react';
import { toast } from 'react-toastify';

import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { ROUTES } from '@/constants/routes';
import AppointmentConfirmModal from '@/components/ui/AppointmentConfirmModal';

const formatVND = amount =>
    new Intl.NumberFormat('vi-VN').format(amount || 0) + ' đ';

const calculateAge = dateOfBirth => {
    if (!dateOfBirth) return '';

    const birth = new Date(dateOfBirth);
    const today = new Date();

    let result =
        today.getFullYear() -
        birth.getFullYear();

    const month =
        today.getMonth() -
        birth.getMonth();

    if (
        month < 0 ||
        (
            month === 0 &&
            today.getDate() < birth.getDate()
        )
    ) {
        result--;
    }

    return result >= 0
        ? result
        : '';
};

const GENDER_VALUES = {
    male: 'MALE',
    female: 'FEMALE'
};

const DEPARTMENT_TYPE_LABELS = {
    EXAMINATION: 'Khám bệnh',
    PARACLINICAL: 'Cận lâm sàng',
    OTHER: 'Dịch vụ khác'
};

const STATUS_LABELS = {
    PENDING: 'Chờ tiếp nhận',
    CHECKED_IN: 'Đã check-in',
    WAITING_EXAMINATION: 'Chờ khám',
    IN_EXAMINATION: 'Đang khám',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    REJECTED: 'Từ chối'
};

export default function AppointmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { t } =
        useTranslation('receptionist');

    // =========================================================
    // DATA
    // =========================================================
    const [appointment, setAppointment] =
        useState(null);

    const [allServices, setAllServices] =
        useState([]);

    const [shifts, setShifts] =
        useState([]);

    // =========================================================
    // LOADING
    // =========================================================
    const [loading, setLoading] =
        useState(false);

    const [loadingServices, setLoadingServices] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [checkingIn, setCheckingIn] =
        useState(false);

    // =========================================================
    // PATIENT
    // =========================================================
    const [fullName, setFullName] =
        useState('');

    const [phone, setPhone] =
        useState('');

    const [email, setEmail] =
        useState('');

    const [age, setAge] =
        useState('');

    const [dob, setDob] =
        useState('');

    const [gender, setGender] =
        useState('');

    const [address, setAddress] =
        useState('');

    // =========================================================
    // APPOINTMENT
    // =========================================================
    const [
        selectedServiceIds,
        setSelectedServiceIds
    ] = useState([]);

    const [date, setDate] =
        useState('');

    const [timeSlot, setTimeSlot] =
        useState('');

    const [searchTerm, setSearchTerm] =
        useState('');

    // =========================================================
    // MODAL
    // =========================================================
    const [
        showConfirmModal,
        setShowConfirmModal
    ] = useState(false);

    const [
        confirmAction,
        setConfirmAction
    ] = useState(null);

    // =========================================================
    // HELPERS
    // =========================================================
    const getToken = () =>
        localStorage.getItem('token') ||
        sessionStorage.getItem('token');

    const selectedShift = useMemo(
        () =>
            shifts.find(
                shift =>
                    String(shift.id) ===
                    String(timeSlot)
            ),
        [shifts, timeSlot]
    );

    const servicesToShow =
        allServices.length > 0
            ? allServices
            : (
                appointment?.services ||
                []
            );

    const filteredServices =
        servicesToShow.filter(service => {
            const keyword =
                searchTerm
                    .trim()
                    .toLowerCase();

            if (!keyword) {
                return true;
            }

            return (
                (service.name || '')
                    .toLowerCase()
                    .includes(keyword) ||
                (service.description || '')
                    .toLowerCase()
                    .includes(keyword)
            );
        });

    const selectedServices =
        servicesToShow.filter(service =>
            selectedServiceIds.includes(
                service.id
            )
        );

    const totalCost =
        selectedServices.reduce(
            (sum, service) =>
                sum +
                Number(
                    service.price || 0
                ),
            0
        );

    const rawStatus = appointment?.status;
    const currentStatus = (
        typeof rawStatus === 'string'
            ? rawStatus
            : rawStatus?.name || rawStatus?.value || ''
    ).toUpperCase();

    const canCheckIn =
        currentStatus === 'PENDING';
    const isEditable = currentStatus === 'PENDING';

    // =========================================================
    // FETCH SHIFTS
    // =========================================================
    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/shifts/active`
                );

                if (!res.ok) {
                    return;
                }

                const body =
                    await res.json();

                const items =
                    Array.isArray(body)
                        ? body
                        : (
                            body.content ||
                            body.data ||
                            []
                        );

                setShifts(
                    items.map(item => ({
                        id:
                            item.shiftId ||
                            item.id,

                        name:
                        item.name,

                        startTime:
                        item.startTime,

                        endTime:
                        item.endTime
                    }))
                );

            } catch {
                setShifts([]);
            }
        };

        fetchShifts();
    }, []);

    // =========================================================
    // FETCH APPOINTMENT
    // =========================================================
    useEffect(() => {
        if (!id) {
            return;
        }

        const fetchDetail = async () => {
            setLoading(true);

            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/appointments/${id}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${getToken()}`
                        }
                    }
                );

                if (!res.ok) {
                    throw new Error(
                        'Không thể tải thông tin lịch hẹn.'
                    );
                }

                const data =
                    await res.json();

                const normalized = {
                    ...data,

                    services:
                        (
                            data.services ||
                            []
                        ).map(
                            service => ({
                                ...service,

                                id:
                                    service.id ||
                                    service.serviceId
                            })
                        )
                };

                setAppointment(
                    normalized
                );

                setSelectedServiceIds(
                    normalized.services
                        .map(
                            service =>
                                service.id
                        )
                        .filter(Boolean)
                );

                setFullName(
                    data.guestFullName ||
                    data.fullName ||
                    ''
                );

                setPhone(
                    data.guestPhone ||
                    data.phone ||
                    ''
                );

                setEmail(
                    data.guestEmail ||
                    data.email ||
                    ''
                );

                const patientDob =
                    data.guestDateOfBirth ||
                    data.dateOfBirth ||
                    '';

                setDob(
                    patientDob
                        ? patientDob.split(
                            'T'
                        )[0]
                        : ''
                );

                setAge(
                    patientDob
                        ? calculateAge(
                            patientDob
                        )
                        : (
                            data.guestAge ||
                            data.age ||
                            ''
                        )
                );

                const genderMap = {
                    MALE: 'male',
                    FEMALE: 'female'
                };

                setGender(
                    genderMap[
                    data.guestGender ||
                    data.gender
                        ] || ''
                );

                setAddress(
                    data.guestAddress ||
                    data.address ||
                    ''
                );

                if (data.scheduledAt) {
                    setDate(
                        data.scheduledAt
                            .split('T')[0]
                    );
                }

            } catch (err) {
                const message =
                    err?.message ||
                    'Có lỗi xảy ra.';

                toast.error(
                    message
                );

            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    // =========================================================
    // MATCH CURRENT SHIFT
    // =========================================================
    useEffect(() => {
        if (
            !appointment ||
            shifts.length === 0 ||
            timeSlot
        ) {
            return;
        }

        const scheduledTime =
            appointment
                .scheduledAt
                ?.split('T')[1]
                ?.slice(0, 5);

        const matched =
            shifts.find(
                shift =>
                    shift.name ===
                    appointment.shiftName ||
                    shift.startTime ===
                    scheduledTime
            );

        if (matched) {
            setTimeSlot(
                matched.id
            );
        }

    }, [
        appointment,
        shifts,
        timeSlot
    ]);

    // =========================================================
    // FETCH SERVICES
    // =========================================================
    useEffect(() => {
        const fetchServices =
            async () => {
                setLoadingServices(
                    true
                );

                try {
                    const res =
                        await fetch(
                            `${import.meta.env.VITE_API_URL}/api/v1/medical-services/available?size=1000`
                        );

                    if (!res.ok) {
                        throw new Error(
                            'Không thể tải dịch vụ.'
                        );
                    }

                    const data =
                        await res.json();

                    const rawList =
                        Array.isArray(data)
                            ? data
                            : (
                                data.content ||
                                data.data ||
                                []
                            );

                    setAllServices(
                        rawList.map(
                            service => ({
                                id:
                                    service.serviceId ||
                                    service.id,

                                name:
                                service.name,

                                price:
                                service.price,

                                description:
                                service.description,

                                departmentType:
                                service.departmentType,

                                capabilityName:
                                    service
                                        .requiredCapabilityName ||
                                    ''
                            })
                        )
                    );

                } catch {
                    // fallback appointment.services
                } finally {
                    setLoadingServices(
                        false
                    );
                }
            };

        fetchServices();
    }, []);

    // =========================================================
    // SERVICE TOGGLE
    // =========================================================
    const toggleService =
        serviceId => {
            setSelectedServiceIds(
                prev =>
                    prev.includes(
                        serviceId
                    )
                        ? prev.filter(
                            currentId =>
                                currentId !==
                                serviceId
                        )
                        : [
                            ...prev,
                            serviceId
                        ]
            );
        };

    // =========================================================
    // VALIDATION
    // =========================================================
    const validateBeforeSave = () => {
        if (!fullName.trim()) {
            return 'Vui lòng nhập họ và tên bệnh nhân.';
        }

        const hasPhone =
            !!phone?.trim();

        const hasEmail =
            !!email?.trim();

        if (
            !hasPhone &&
            !hasEmail
        ) {
            return 'Vui lòng nhập số điện thoại hoặc email.';
        }

        if (
            hasPhone &&
            !/^(\+84|0)\d{9,10}$/.test(
                phone.trim()
            )
        ) {
            return 'Số điện thoại Việt Nam không hợp lệ.';
        }

        if (
            hasEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email.trim()
            )
        ) {
            return 'Email không hợp lệ.';
        }

        if (!dob) {
            return 'Vui lòng chọn ngày sinh.';
        }

        if (!gender) {
            return 'Vui lòng chọn giới tính.';
        }

        if (!address.trim()) {
            return 'Vui lòng nhập địa chỉ.';
        }

        if (
            selectedServiceIds.length === 0
        ) {
            return 'Vui lòng chọn ít nhất một dịch vụ.';
        }

        if (!date) {
            return 'Vui lòng chọn ngày khám.';
        }

        if (!timeSlot) {
            return 'Vui lòng chọn ca khám.';
        }

        return null;
    };

    // =========================================================
    // SAVE CLICK
    // =========================================================
    const handleSaveClick = () => {
        if (!isEditable) {
            toast.info('Lịch hẹn đã check-in nên không thể chỉnh sửa.');
            return;
        }
        const validationError =
            validateBeforeSave();

        if (validationError) {
            toast.error(
                validationError
            );
            return;
        }

        setConfirmAction('save');
        setShowConfirmModal(
            true
        );
    };

    // =========================================================
    // SAVE
    // =========================================================
    const handleSave = async () => {
        if (!isEditable) {
            toast.info('Lịch hẹn đã check-in nên không thể chỉnh sửa.');
            setShowConfirmModal(false);
            return;
        }
        setSaving(true);

        try {
            const selectedShiftNow =
                shifts.find(
                    shift =>
                        String(
                            shift.id
                        ) ===
                        String(
                            timeSlot
                        )
                );

            const startTime =
                selectedShiftNow
                    ?.startTime;

            const normalizedStart =
                startTime
                    ? (
                        startTime.length === 5
                            ? `${startTime}:00`
                            : startTime
                    )
                    : null;

            const body = {
                guestFullName:
                    fullName.trim(),

                guestPhone:
                    phone?.trim() ||
                    null,

                guestEmail:
                    email?.trim()
                        ?.toLowerCase() ||
                    null,

                guestAddress:
                    address.trim() ||
                    null,

                guestDateOfBirth:
                    dob || null,

                guestAge:
                    dob
                        ? calculateAge(
                            dob
                        )
                        : Number(
                            age
                        ),

                guestGender:
                    GENDER_VALUES[
                        gender
                        ] || null,

                scheduledAt:
                    date &&
                    normalizedStart
                        ? `${date}T${normalizedStart}`
                        : null,

                shiftId:
                    timeSlot || null,

                serviceIds:
                selectedServiceIds
            };

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/appointments/${id}`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${getToken()}`
                    },

                    body:
                        JSON.stringify(
                            body
                        )
                }
            );

            const result =
                await res
                    .json()
                    .catch(() => null);

            if (!res.ok) {
                throw new Error(
                    result?.message ||
                    result?.error ||
                    'Lưu thất bại. Vui lòng thử lại.'
                );
            }

            setAppointment(
                prev => ({
                    ...prev,
                    ...(result || {})
                })
            );

            toast.success(
                'Lưu thông tin thành công.'
            );

            setShowConfirmModal(
                false
            );

        } catch (err) {
            toast.error(
                err?.message ||
                'Không thể lưu thông tin.'
            );

        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // CHECK-IN CLICK
    // =========================================================
    const handleCheckInClick = () => {
        if (!appointment) {
            toast.error(
                'Không tìm thấy lịch hẹn.'
            );
            return;
        }

        if (!canCheckIn) {
            if (
                currentStatus ===
                'CHECKED_IN'
            ) {
                toast.info(
                    'Lịch hẹn này đã được check-in.'
                );
            } else {
                toast.error(
                    'Lịch hẹn hiện không ở trạng thái chờ tiếp nhận.'
                );
            }

            return;
        }

        const validationError =
            validateBeforeSave();

        if (validationError) {
            toast.error(
                validationError
            );
            return;
        }

        setConfirmAction(
            'checkin'
        );

        setShowConfirmModal(
            true
        );
    };

    // =========================================================
    // CHECK-IN
    // =========================================================
    const handleCheckIn = async () => {
        if (!appointment) {
            return;
        }

        if (!canCheckIn) {
            toast.error(
                'Chỉ có thể check-in lịch hẹn đang chờ tiếp nhận.'
            );

            setShowConfirmModal(
                false
            );

            return;
        }

        setCheckingIn(true);

        try {
            const body = {
                appointmentId:
                id,

                serviceIds:
                selectedServiceIds,

                patientFullName:
                    fullName.trim(),

                patientPhone:
                    phone?.trim() || '',

                patientEmail:
                    email?.trim()?.toLowerCase() || '',

                patientAddress:
                    address.trim(),

                patientDateOfBirth:
                    dob || null,

                patientAge:
                    dob
                        ? calculateAge(dob)
                        : Number(age),

                patientGender:
                    GENDER_VALUES[gender] || null,

            };

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/appointments/${id}/check-in`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${getToken()}`
                    },

                    body:
                        JSON.stringify(
                            body
                        )
                }
            );

            const result =
                await res
                    .json()
                    .catch(() => null);

            if (!res.ok) {
                throw new Error(
                    result?.message ||
                    result?.error ||
                    'Check-in thất bại.'
                );
            }

            toast.success(
                'Check-in thành công. Bệnh nhân đã được tiếp nhận.'
            );

            navigate(
                ROUTES.RECEPTIONIST_CHECKIN
            );

        } catch (err) {
            toast.error(
                err?.message ||
                'Không thể check-in bệnh nhân.'
            );

        } finally {
            setCheckingIn(
                false
            );

            setShowConfirmModal(
                false
            );
        }
    };

    // =========================================================
    // MODAL CONFIRM
    // =========================================================
    const handleConfirm = () => {
        if (
            confirmAction ===
            'save'
        ) {
            handleSave();
            return;
        }

        if (
            confirmAction ===
            'checkin'
        ) {
            handleCheckIn();
        }
    };

    // =========================================================
    // CLASSES
    // =========================================================
    const inputCls =
        'w-full h-11 px-3.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 bg-white transition-all';

    const labelCls =
        'block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2';

    // =========================================================
    // LOADING
    // =========================================================
    if (loading) {
        return (
            <ReceptionistLayout>
                <div className="flex justify-center py-24">
                    <p className="text-sm text-slate-400">
                        {t(
                            'appointmentDetail.loading'
                        )}
                    </p>
                </div>
            </ReceptionistLayout>
        );
    }

    if (!appointment) {
        return (
            <ReceptionistLayout>
                <div className="max-w-5xl mx-auto py-24 text-center">
                    <p className="text-slate-500">
                        Không tìm thấy lịch hẹn.
                    </p>
                </div>
            </ReceptionistLayout>
        );
    }

    return (
        <ReceptionistLayout>
            <div className="flex min-h-[calc(100vh-3.5rem)] flex-col -m-8 bg-slate-50">

                {/* =====================================================
                BODY
            ===================================================== */}
                <div className="flex-1 overflow-y-auto px-5 py-5 pb-28 lg:px-8">
                    <div className="w-full space-y-5">

                        {/* =================================================
                        HEADER
                    ================================================= */}
                        <div className="flex flex-wrap items-start justify-between gap-4">

                            <div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            ROUTES.RECEPTIONIST_CHECKIN
                                        )
                                    }
                                    className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 transition hover:text-gray-700"
                                >
                                    <ArrowLeft size={14} />
                                    Quay lại danh sách
                                </button>

                                <h1 className="text-xl font-bold text-gray-900">
                                    Chi tiết tiếp nhận
                                </h1>

                                <p className="mt-1 text-sm text-gray-400">
                                    {isEditable
                                        ? 'Kiểm tra và cập nhật thông tin bệnh nhân trước khi check-in'
                                        : 'Thông tin đã được khóa sau khi bệnh nhân check-in'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                                Trạng thái
                            </span>

                                <span
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                        currentStatus === 'PENDING'
                                            ? 'border-amber-200 bg-amber-50 text-amber-600'
                                            : currentStatus === 'CHECKED_IN'
                                                ? 'border-green-200 bg-green-50 text-green-600'
                                                : 'border-gray-200 bg-gray-50 text-gray-500'
                                    }`}
                                >
                                {STATUS_LABELS[currentStatus] ||
                                    currentStatus ||
                                    'Không xác định'}
                            </span>
                            </div>
                        </div>

                        {/* =================================================
                        MAIN GRID
                    ================================================= */}
                        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">

                            {/* =================================================
                            LEFT - PATIENT
                        ================================================= */}
                            <div className="xl:col-span-5">
                                <div className="h-full rounded-2xl border border-gray-200 bg-white shadow-sm">

                                    {/* HEADER */}
                                    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">

                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                                        1
                                    </span>

                                        <div>
                                            <h2 className="text-sm font-bold text-gray-900">
                                                Thông tin bệnh nhân
                                            </h2>

                                            <p className="mt-0.5 text-xs text-gray-400">
                                                Kiểm tra thông tin trước khi tiếp nhận
                                            </p>
                                        </div>
                                    </div>

                                    {/* BODY */}
                                    <div className="space-y-4 p-5">

                                        {/* FULL NAME */}
                                        <div>
                                            <label className="mb-1.5 block text-xs text-gray-500">
                                                Họ và tên
                                                <span className="ml-1 text-red-400">*</span>
                                            </label>

                                            <input
                                                type="text"
                                                disabled={!isEditable}
                                                value={fullName}
                                                onChange={(e) =>
                                                    setFullName(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập họ và tên"
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>

                                        {/* PHONE + EMAIL */}
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                            <div>
                                                <label className="mb-1.5 block text-xs text-gray-500">
                                                    Số điện thoại
                                                </label>

                                                <input
                                                    type="tel"
                                                    disabled={!isEditable}
                                                    value={phone}
                                                    onChange={(e) =>
                                                        setPhone(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Nhập số điện thoại"
                                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-xs text-gray-500">
                                                    Email
                                                </label>

                                                <input
                                                    type="email"
                                                    disabled={!isEditable}
                                                    value={email}
                                                    onChange={(e) =>
                                                        setEmail(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Nhập email"
                                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                                />
                                            </div>
                                        </div>

                                        {/* DOB + GENDER */}
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                            <div>
                                                <label className="mb-1.5 block text-xs text-gray-500">
                                                    Ngày sinh
                                                </label>

                                                <input
                                                    type="date"
                                                    disabled={!isEditable}
                                                    max={new Date().toLocaleDateString(
                                                        'en-CA'
                                                    )}
                                                    value={dob}
                                                    onChange={(e) => {
                                                        setDob(
                                                            e.target.value
                                                        );

                                                        setAge(
                                                            calculateAge(
                                                                e.target.value
                                                            )
                                                        );
                                                    }}
                                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                                />

                                                <p className="mt-1 text-[11px] text-gray-400">
                                                    Tuổi: {age || '-'}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-xs text-gray-500">
                                                    Giới tính
                                                </label>

                                                <div className="grid grid-cols-2 gap-2">

                                                    {[
                                                        ['male', 'Nam'],
                                                        ['female', 'Nữ']
                                                    ].map(
                                                        ([value, label]) => (
                                                            <button
                                                                key={value}
                                                                type="button"
                                                                disabled={!isEditable}
                                                                onClick={() =>
                                                                    setGender(
                                                                        value
                                                                    )
                                                                }
                                                                className={`h-10 rounded-lg border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                                                    gender === value
                                                                        ? 'border-gray-900 bg-gray-900 text-white'
                                                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
                                                                }`}
                                                            >
                                                                {label}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ADDRESS */}
                                        <div>
                                            <label className="mb-1.5 block text-xs text-gray-500">
                                                Địa chỉ
                                            </label>

                                            <input
                                                type="text"
                                                disabled={!isEditable}
                                                value={address}
                                                onChange={(e) =>
                                                    setAddress(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập địa chỉ"
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* =================================================
                            RIGHT
                        ================================================= */}
                            <div className="space-y-5 xl:col-span-7">

                                {/* =================================================
                                APPOINTMENT TIME
                            ================================================= */}
                                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                                    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">

                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                                        2
                                    </span>

                                        <div>
                                            <h2 className="text-sm font-bold text-gray-900">
                                                Thời gian khám
                                            </h2>

                                            <p className="mt-0.5 text-xs text-gray-400">
                                                Ngày và ca khám của lịch hẹn
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[220px_minmax(0,1fr)]">

                                        <div>
                                            <label className="mb-1.5 block text-xs text-gray-500">
                                                Ngày khám
                                            </label>

                                            <input
                                                type="date"
                                                disabled={!isEditable}
                                                value={date}
                                                min={new Date().toLocaleDateString(
                                                    'en-CA'
                                                )}
                                                onChange={(e) =>
                                                    setDate(
                                                        e.target.value
                                                    )
                                                }
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs text-gray-500">
                                                Ca khám
                                            </label>

                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                                                {shifts.map((shift) => {
                                                    const active =
                                                        String(
                                                            timeSlot
                                                        ) ===
                                                        String(
                                                            shift.id
                                                        );

                                                    return (
                                                        <button
                                                            key={shift.id}
                                                            type="button"
                                                            disabled={!isEditable}
                                                            onClick={() =>
                                                                setTimeSlot(
                                                                    shift.id
                                                                )
                                                            }
                                                            className={`min-h-[56px] rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                                                active
                                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                                                            }`}
                                                        >
                                                            <p className="text-sm font-semibold">
                                                                {shift.name}
                                                            </p>

                                                            <p
                                                                className={`mt-0.5 text-xs ${
                                                                    active
                                                                        ? 'text-gray-300'
                                                                        : 'text-gray-400'
                                                                }`}
                                                            >
                                                                {shift.startTime}
                                                                {' - '}
                                                                {shift.endTime}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* =================================================
                                SERVICES
                            ================================================= */}
                                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                                    {/* HEADER */}
                                    <div className="border-b border-gray-100 px-5 py-4">

                                        <div className="flex flex-wrap items-center justify-between gap-4">

                                            <div className="flex items-center gap-3">

                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                                                3
                                            </span>

                                                <div>
                                                    <h2 className="text-sm font-bold text-gray-900">
                                                        Dịch vụ y tế
                                                    </h2>

                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        {isEditable
                                                            ? 'Có thể thêm hoặc bỏ dịch vụ trước khi check-in'
                                                            : 'Danh sách dịch vụ đã được khóa sau khi check-in'}
                                                    </p>
                                                </div>
                                            </div>

                                            {selectedServiceIds.length >
                                                0 && (
                                                    <span className="rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white">
                                                Đã chọn{' '}
                                                        {
                                                            selectedServiceIds.length
                                                        }
                                            </span>
                                                )}
                                        </div>

                                        {/* SEARCH */}
                                        <div className="relative mt-4">

                                            <Search
                                                size={16}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />

                                            <input
                                                type="text"
                                                disabled={!isEditable}
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Tìm kiếm dịch vụ..."
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>
                                    </div>

                                    {/* SERVICE LIST */}
                                    <div className="p-5">

                                        {loadingServices ? (
                                            <div className="flex h-40 items-center justify-center">
                                                <p className="text-sm text-gray-400">
                                                    Đang tải dịch vụ...
                                                </p>
                                            </div>
                                        ) : filteredServices.length ===
                                        0 ? (
                                            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
                                                <p className="text-sm text-gray-400">
                                                    Không tìm thấy dịch vụ
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                                                {Object.entries(
                                                    filteredServices.reduce(
                                                        (
                                                            acc,
                                                            service
                                                        ) => {
                                                            const type =
                                                                service.departmentType ===
                                                                'EXAMINATION'
                                                                    ? 'EXAMINATION'
                                                                    : service.departmentType ===
                                                                    'PARACLINICAL'
                                                                        ? 'PARACLINICAL'
                                                                        : 'OTHER';

                                                            if (!acc[type]) {
                                                                acc[type] =
                                                                    [];
                                                            }

                                                            acc[type].push(
                                                                service
                                                            );

                                                            return acc;
                                                        },
                                                        {}
                                                    )
                                                )
                                                    .sort(([a], [b]) =>
                                                        a === 'EXAMINATION'
                                                            ? -1
                                                            : b ===
                                                            'EXAMINATION'
                                                                ? 1
                                                                : 0
                                                    )
                                                    .map(
                                                        ([
                                                             type,
                                                             serviceList
                                                         ]) => (
                                                            <div
                                                                key={type}
                                                                className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50/60"
                                                            >

                                                                {/* GROUP HEADER */}
                                                                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">

                                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                                                        {DEPARTMENT_TYPE_LABELS[
                                                                                type
                                                                                ] ||
                                                                            type}
                                                                    </h3>

                                                                    <span className="text-[11px] text-gray-400">
                                                                    {
                                                                        serviceList.length
                                                                    }{' '}
                                                                        dịch vụ
                                                                </span>
                                                                </div>

                                                                {/* FIXED 4 ITEMS */}
                                                                <div className="h-[272px] divide-y divide-gray-200 overflow-y-auto overflow-x-hidden px-4 pr-2 custom-scrollbar">

                                                                    {serviceList.map(
                                                                        (
                                                                            service
                                                                        ) => {
                                                                            const checked =
                                                                                selectedServiceIds.includes(
                                                                                    service.id
                                                                                );

                                                                            return (
                                                                                <label
                                                                                    key={
                                                                                        service.id
                                                                                    }
                                                                                    className={`flex min-h-[64px] items-start gap-3 py-3 transition ${
                                                                                        isEditable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                                                                                    } ${
                                                                                        checked
                                                                                            ? 'bg-primary-50/50'
                                                                                            : ''
                                                                                    }`}
                                                                                >
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        disabled={!isEditable}
                                                                                        checked={
                                                                                            checked
                                                                                        }
                                                                                        onChange={() =>
                                                                                            toggleService(
                                                                                                service.id
                                                                                            )
                                                                                        }
                                                                                        className="mt-0.5 h-4 w-4 shrink-0 accent-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                                                                                    />

                                                                                    <div className="min-w-0 flex-1">

                                                                                        <p className="text-sm font-medium leading-snug text-gray-800">
                                                                                            {
                                                                                                service.name
                                                                                            }
                                                                                        </p>

                                                                                        {service.description && (
                                                                                            <p className="mt-1 truncate text-xs text-gray-400">
                                                                                                {
                                                                                                    service.description
                                                                                                }
                                                                                            </p>
                                                                                        )}

                                                                                        {type ===
                                                                                            'PARACLINICAL' &&
                                                                                            service.capabilityName && (
                                                                                                <p className="mt-1 truncate text-[11px] text-gray-500">
                                                                                                    Năng lực:{' '}
                                                                                                    {
                                                                                                        service.capabilityName
                                                                                                    }
                                                                                                </p>
                                                                                            )}
                                                                                    </div>

                                                                                    <p className="shrink-0 pl-2 text-sm font-semibold text-gray-900">
                                                                                        {formatVND(
                                                                                            service.price
                                                                                        )}
                                                                                    </p>
                                                                                </label>
                                                                            );
                                                                        }
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                            </div>
                                        )}

                                        {/* TOTAL */}
                                        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">

                                            <div>
                                                <p className="text-xs text-gray-400">
                                                    Dịch vụ đã chọn
                                                </p>

                                                <p className="mt-0.5 text-sm font-semibold text-gray-800">
                                                    {
                                                        selectedServiceIds.length
                                                    }
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">
                                                    Tổng chi phí dự kiến
                                                </p>

                                                <p className="mt-0.5 text-xl font-bold text-gray-900">
                                                    {formatVND(
                                                        totalCost
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                STICKY FOOTER
            ===================================================== */}
                <div className="fixed bottom-0 left-52 right-0 z-40 border-t border-gray-200 bg-white">

                    <div className="flex h-[72px] items-center justify-between gap-5 px-6 lg:px-8">

                        <div>
                            <p className="text-xs text-gray-400">
                                Trạng thái lịch hẹn
                            </p>

                            <p className="mt-0.5 text-sm font-semibold text-gray-800">
                                {STATUS_LABELS[
                                        currentStatus
                                        ] ||
                                    currentStatus ||
                                    '-'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">

                            {canCheckIn && (
                                <button
                                    type="button"
                                    onClick={
                                        handleCheckInClick
                                    }
                                    disabled={
                                        checkingIn ||
                                        saving
                                    }
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gray-900 px-7 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <LogIn size={15} />

                                    {checkingIn
                                        ? 'Đang check-in...'
                                        : 'Xác nhận Check-in'}
                                </button>
                            )}

                            {currentStatus ===
                                'CHECKED_IN' && (
                                    <div className="flex h-10 items-center rounded-xl border border-green-200 bg-green-50 px-4 text-sm font-semibold text-green-600">
                                        Bệnh nhân đã check-in
                                    </div>
                                )}
                        </div>
                    </div>
                </div>

                {/* =====================================================
                MODAL
            ===================================================== */}
                {showConfirmModal && (
                    <AppointmentConfirmModal
                        namespace="receptionist"
                        data={{
                            fullName:
                                fullName || '',

                            phone:
                                phone || '',

                            email:
                                email || '',

                            ageGender: `${
                                age || '-'
                            } / ${
                                gender === 'male'
                                    ? 'Nam'
                                    : gender === 'female'
                                        ? 'Nữ'
                                        : gender === 'other'
                                            ? 'Khác'
                                            : '-'
                            }`,

                            address:
                                address || '',

                            date: date
                                ? new Date(
                                    `${date}T00:00:00`
                                ).toLocaleDateString(
                                    'vi-VN'
                                )
                                : '',

                            timeSlot:
                                selectedShift
                                    ? `${selectedShift.name} (${selectedShift.startTime} - ${selectedShift.endTime})`
                                    : '',

                            method:
                                confirmAction ===
                                'checkin'
                                    ? 'Tiếp nhận tại quầy lễ tân'
                                    : 'Cập nhật lịch hẹn',

                            total:
                                formatVND(
                                    totalCost
                                ),

                            services:
                            selectedServices,

                            reason:
                                appointment.reason ||
                                ''
                        }}
                        onClose={() =>
                            setShowConfirmModal(
                                false
                            )
                        }
                        onConfirm={handleConfirm}
                        isLoading={
                            saving ||
                            checkingIn
                        }
                    />
                )}
            </div>
        </ReceptionistLayout>
    );
}

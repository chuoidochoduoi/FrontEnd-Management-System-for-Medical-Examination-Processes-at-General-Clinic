// src/pages/customer/CustomerAppointmentPage.jsx

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import CustomerLayout from '@/components/layout/CustomerLayout';
import { useAppointment } from '@/hooks/useAppointment';
import { useProfile } from '@/hooks/useProfile';
import AppointmentConfirmModal from '@/components/ui/AppointmentConfirmModal';
import { ROUTES } from '@/constants/routes';

const formatVND = amount =>
    new Intl.NumberFormat('vi-VN').format(amount || 0) + ' đ';

const calculateAge = dob => {
    if (!dob) return null;

    const birthDate = new Date(dob);
    const today = new Date();

    let age =
        today.getFullYear() -
        birthDate.getFullYear();

    const month =
        today.getMonth() -
        birthDate.getMonth();

    if (
        month < 0 ||
        (
            month === 0 &&
            today.getDate() < birthDate.getDate()
        )
    ) {
        age--;
    }

    return age;
};

export default function CustomerAppointmentPage() {
    const { t } = useTranslation('appointment');
    const { t: tCommon } = useTranslation('common');

    const navigate = useNavigate();
    const location = useLocation();

    const {
        services,
        loadingServices,
        book,
        loading: booking,
        error,
        shifts,
        shiftLoading
    } = useAppointment();

    const { profile } = useProfile();

    const initialState =
        location.state || {};

    const isReschedule =
        !!initialState.rescheduleApptId;

    // =========================================================
    // GUEST
    // =========================================================
    const [fullName, setFullName] =
        useState('');

    const [phone, setPhone] =
        useState('');

    const [age, setAge] =
        useState('');

    const [gender, setGender] =
        useState('');

    const [address, setAddress] =
        useState('');

    // =========================================================
    // SERVICES
    // =========================================================
    const [
        selectedServices,
        setSelectedServices
    ] = useState(
        initialState.initialServices || []
    );

    // =========================================================
    // TIME
    // =========================================================
    const [date, setDate] =
        useState(
            initialState.initialDate || ''
        );

    const [shiftId, setShiftId] =
        useState(
            initialState.initialShiftId || ''
        );

    const [
        showConfirmModal,
        setShowConfirmModal
    ] = useState(false);

    // =========================================================
    // SERVICE SELECT
    // =========================================================
    const toggleService = service => {
        setSelectedServices(prev => {
            const existed =
                prev.some(
                    item =>
                        item.id === service.id
                );

            if (existed) {
                return prev.filter(
                    item =>
                        item.id !== service.id
                );
            }

            if (service.departmentType === 'EXAMINATION') {
                const previousExamination = prev.find(
                    item => item.departmentType === 'EXAMINATION'
                );
                if (previousExamination) {
                    toast.info('Mỗi lịch hẹn chỉ được chọn một dịch vụ khám bệnh. Hệ thống đã thay dịch vụ khám đã chọn.');
                }
                return [
                    ...prev.filter(item => item.departmentType !== 'EXAMINATION'),
                    service
                ];
            }

            return [
                ...prev,
                service
            ];
        });
    };

    // =========================================================
    // ELIGIBILITY
    // =========================================================
    const getServiceEligibility = service => {
        const patientAge =
            profile
                ? (
                    profile.age ??
                    (
                        profile.dateOfBirth
                            ? calculateAge(
                                profile.dateOfBirth
                            )
                            : null
                    )
                )
                : (
                    age === ''
                        ? null
                        : Number(age)
                );

        const rawGender =
            profile?.gender ||
            gender;

        const patientGender =
            rawGender
                ? (
                    {
                        Nam: 'MALE',
                        Nữ: 'FEMALE',
                        Khác: 'OTHER',
                        male: 'MALE',
                        female: 'FEMALE',
                        other: 'OTHER'
                    }[rawGender] ||
                    rawGender.toUpperCase()
                )
                : '';

        const minAge =
            service.minimumAge ?? 0;

        const maxAge =
            service.maximumAge ?? 120;

        if (patientAge == null) {
            return {
                eligible: false,
                reason:
                    'Cập nhật ngày sinh để kiểm tra dịch vụ'
            };
        }

        if (
            patientAge < minAge ||
            patientAge > maxAge
        ) {
            return {
                eligible: false,
                reason:
                    `Chỉ áp dụng từ ${minAge}–${maxAge} tuổi`
            };
        }

        if (
            service.allowedGender &&
            !patientGender
        ) {
            return {
                eligible: false,
                reason:
                    'Cập nhật giới tính để kiểm tra dịch vụ'
            };
        }

        if (
            service.allowedGender &&
            service.allowedGender !==
            patientGender
        ) {
            return {
                eligible: false,
                reason:
                    'Không phù hợp với giới tính trong hồ sơ'
            };
        }

        return {
            eligible: true,
            reason: ''
        };
    };

    // =========================================================
    // TOTAL
    // =========================================================
    const totalCost =
        selectedServices.reduce(
            (sum, service) =>
                sum +
                Number(service.price || 0),
            0
        );

    // =========================================================
    // OPEN MODAL
    // =========================================================
    const handleSubmit = () => {
        if (selectedServices.length === 0) {
            toast.error(
                'Vui lòng chọn ít nhất một dịch vụ.'
            );
            return;
        }
        if (selectedServices.filter(service => service.departmentType === 'EXAMINATION').length > 1) {
            toast.error('Mỗi lịch hẹn chỉ được chọn một dịch vụ khám bệnh.');
            return;
        }

        if (!date) {
            toast.error(
                'Vui lòng chọn ngày khám.'
            );
            return;
        }

        if (!shiftId) {
            toast.error(
                'Vui lòng chọn ca khám.'
            );
            return;
        }

        setShowConfirmModal(true);
    };

    // =========================================================
    // CONFIRM BOOKING
    // =========================================================
    const handleConfirm = async () => {
        const patientInfo = profile
            ? {
                customerId: profile.id,

                fullName: profile.fullName || '',

                phone: profile.phone || '',

                email: profile.email || '',

                age: Number(
                    profile.age ??
                    (
                        profile.dateOfBirth
                            ? calculateAge(profile.dateOfBirth)
                            : 0
                    )
                ),

                gender:
                    profile.gender === 'Nam'
                        ? 'male'
                        : profile.gender === 'Nữ'
                            ? 'female'
                            : profile.gender === 'Khác'
                                ? 'other'
                                : profile.gender,

                address: profile.address || ''
            }
            : {
                fullName,
                phone,
                email: '',
                age,
                gender,
                address
            };

        const success = await book({
            ...patientInfo,

            selectedServices,

            date,

            shiftId,

            rescheduleApptId:
            initialState.rescheduleApptId
        });

        if (!success) {
            return;
        }

        setShowConfirmModal(false);

        setSelectedServices([]);
        setDate('');
        setShiftId('');

        navigate(
            ROUTES.MY_APPOINTMENTS
        );
    };

    return (
        <CustomerLayout>

            {/* =================================================
                PAGE CONTAINER
            ================================================= */}
            <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-14">

                {/* =================================================
                    HEADER
                ================================================= */}
                <div className="mb-7">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                ROUTES.MY_APPOINTMENTS
                            )
                        }
                        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <span className="text-lg leading-none">
                            ←
                        </span>

                        Quay lại
                    </button>

                    <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 pb-6 border-b border-slate-200">

                        <div>

                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600 mb-2">
                                CareS
                            </p>

                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                                {isReschedule
                                    ? 'Đổi lịch hẹn'
                                    : 'Đặt lịch dịch vụ'
                                }
                            </h1>

                            <p className="text-sm text-slate-500 mt-2">
                                Chọn dịch vụ và thời gian phù hợp với bạn.
                            </p>

                        </div>

                        {profile && (

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">

                                <span className="text-xs text-slate-400">
                                    Khách hàng
                                </span>

                                <span className="text-sm font-bold text-slate-900">
                                    {profile.fullName}
                                </span>

                                {profile.phone && (
                                    <>
                                        <span className="hidden sm:inline text-slate-300">
                                            |
                                        </span>

                                        <span className="text-xs text-slate-400">
                                            SĐT
                                        </span>

                                        <span className="text-sm font-medium text-slate-700">
                                            {profile.phone}
                                        </span>
                                    </>
                                )}

                            </div>

                        )}

                    </div>

                </div>

                {/* =================================================
                    CONTENT
                ================================================= */}
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] gap-6 items-start">

                    {/* =================================================
                        LEFT - SERVICES
                    ================================================= */}
                    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                        {/* HEADER */}
                        <div className="px-6 sm:px-7 py-5 border-b border-slate-100 flex items-center justify-between">

                            <div>

                                <span className="text-[11px] font-bold text-primary-600 tracking-[0.18em]">
                                    BƯỚC 01
                                </span>

                                <h2 className="text-lg font-bold text-slate-900 mt-1">
                                    Chọn dịch vụ
                                </h2>

                            </div>

                            <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                Có thể chọn nhiều
                            </span>

                        </div>

                        {/* BODY */}
                        <div className="p-6 sm:p-7">

                            {loadingServices ? (

                                <div className="h-[320px] flex items-center justify-center">

                                    <p className="text-sm text-slate-400">
                                        {t('step2.loading')}
                                    </p>

                                </div>

                            ) : services.length === 0 ? (

                                <div className="h-[320px] flex items-center justify-center text-center">

                                    <div>

                                        <p className="font-semibold text-slate-700">
                                            Chưa có dịch vụ
                                        </p>

                                        <p className="text-sm text-slate-400 mt-1">
                                            Vui lòng thử lại sau.
                                        </p>

                                    </div>

                                </div>

                            ) : (

                                <div className="space-y-8">

                                    {Object.entries(
                                        services.reduce(
                                            (
                                                acc,
                                                service
                                            ) => {

                                                const department =
                                                    service.departmentType ===
                                                    'EXAMINATION'
                                                        ? 'EXAMINATION'
                                                        : 'PARACLINICAL';

                                                if (
                                                    !acc[
                                                        department
                                                        ]
                                                ) {
                                                    acc[
                                                        department
                                                        ] = [];
                                                }

                                                acc[
                                                    department
                                                    ].push(
                                                    service
                                                );

                                                return acc;

                                            },
                                            {}
                                        )
                                    )
                                        .sort(
                                            (
                                                [a],
                                                [b]
                                            ) => {
                                                if (
                                                    a ===
                                                    'EXAMINATION'
                                                ) {
                                                    return -1;
                                                }

                                                if (
                                                    b ===
                                                    'EXAMINATION'
                                                ) {
                                                    return 1;
                                                }

                                                return 0;
                                            }
                                        )
                                        .map(
                                            ([
                                                 department,
                                                 deptServices
                                             ]) => (

                                                <div
                                                    key={
                                                        department
                                                    }
                                                >

                                                    {/* GROUP TITLE */}
                                                    <div className="flex items-center gap-3 mb-4">

                                                        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap">

                                                            {department ===
                                                            'EXAMINATION'
                                                                ? 'Khám bệnh'
                                                                : 'Cận lâm sàng'
                                                            }

                                                        </h3>

                                                        <div className="h-px bg-slate-100 flex-1" />

                                                    </div>

                                                    {/* SERVICES */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                                        {deptServices.map(
                                                            service => {

                                                                const checked =
                                                                    selectedServices.some(
                                                                        s =>
                                                                            s.id ===
                                                                            service.id
                                                                    );

                                                                const eligibility =
                                                                    getServiceEligibility(
                                                                        service
                                                                    );

                                                                return (

                                                                    <button
                                                                        key={
                                                                            service.id
                                                                        }
                                                                        type="button"
                                                                        disabled={
                                                                            !eligibility.eligible
                                                                        }
                                                                        onClick={() => {
                                                                            if (
                                                                                eligibility.eligible
                                                                            ) {
                                                                                toggleService(
                                                                                    service
                                                                                );
                                                                            }
                                                                        }}
                                                                        className={`
                                                                            text-left
                                                                            min-h-[142px]
                                                                            p-5
                                                                            rounded-2xl
                                                                            border
                                                                            transition-all
                                                                            duration-200
                                                                            ${
                                                                            !eligibility.eligible
                                                                                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                                                                : checked
                                                                                    ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500 shadow-sm'
                                                                                    : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-sm'
                                                                        }
                                                                        `}
                                                                    >

                                                                        <div className="flex items-start gap-4 h-full">

                                                                            {/* CHECKBOX */}
                                                                            <div
                                                                                className={`
                                                                                    mt-0.5
                                                                                    w-5
                                                                                    h-5
                                                                                    rounded-md
                                                                                    border
                                                                                    shrink-0
                                                                                    flex
                                                                                    items-center
                                                                                    justify-center
                                                                                    ${
                                                                                    checked
                                                                                        ? 'bg-primary-600 border-primary-600 text-white'
                                                                                        : 'border-slate-300 bg-white'
                                                                                }
                                                                                `}
                                                                            >
                                                                                {checked &&
                                                                                    '✓'
                                                                                }
                                                                            </div>

                                                                            {/* CONTENT */}
                                                                            <div className="flex-1 flex flex-col h-full min-w-0">

                                                                                <p className="text-[15px] font-semibold text-slate-900 leading-snug">
                                                                                    {
                                                                                        service.name
                                                                                    }
                                                                                </p>

                                                                                {service.capabilityName && (
                                                                                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                                                                        {
                                                                                            service.capabilityName
                                                                                        }
                                                                                    </p>
                                                                                )}

                                                                                {service.description && (
                                                                                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                                                                        {
                                                                                            service.description
                                                                                        }
                                                                                    </p>
                                                                                )}

                                                                                {!eligibility.eligible && (
                                                                                    <p className="text-xs text-red-500 mt-2">
                                                                                        {
                                                                                            eligibility.reason
                                                                                        }
                                                                                    </p>
                                                                                )}

                                                                                <div className="mt-auto pt-3 flex items-center justify-between gap-3">

                                                                                    <span className="text-sm font-bold text-primary-700">
                                                                                        {formatVND(
                                                                                            service.price
                                                                                        )}
                                                                                    </span>

                                                                                    {service.durationMinutes && (
                                                                                        <span className="text-[11px] text-slate-400">
                                                                                            {
                                                                                                service.durationMinutes
                                                                                            }{' '}
                                                                                            phút
                                                                                        </span>
                                                                                    )}

                                                                                </div>

                                                                            </div>

                                                                        </div>

                                                                    </button>

                                                                );

                                                            }
                                                        )}

                                                    </div>

                                                </div>

                                            )
                                        )}

                                </div>

                            )}

                        </div>

                    </section>

                    {/* =================================================
                        RIGHT
                    ================================================= */}
                    <aside className="space-y-5 xl:sticky xl:top-6">

                        {/* =================================================
                            TIME
                        ================================================= */}
                        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">

                            <div className="px-6 py-5 border-b border-slate-100">

                                <span className="text-[11px] font-bold text-primary-600 tracking-[0.18em]">
                                    BƯỚC 02
                                </span>

                                <h2 className="text-lg font-bold text-slate-900 mt-1">
                                    Chọn thời gian
                                </h2>

                            </div>

                            <div className="p-6 space-y-6">

                                {/* DATE */}
                                <div>

                                    <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-[0.15em]">
                                        Ngày khám
                                    </label>

                                    <input
                                        type="date"
                                        value={date}
                                        min={
                                            new Date()
                                                .toISOString()
                                                .split(
                                                    'T'
                                                )[0]
                                        }
                                        onChange={e =>
                                            setDate(
                                                e.target.value
                                            )
                                        }
                                        className="w-full h-13 px-4 py-3 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
                                    />

                                </div>

                                {/* SHIFT */}
                                <div>

                                    <div className="flex items-center justify-between mb-3">

                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                                            Ca khám
                                        </label>

                                        {shiftLoading && (
                                            <span className="text-xs text-slate-400">
                                                Đang tải...
                                            </span>
                                        )}

                                    </div>

                                    {!shiftLoading &&
                                    shifts.length === 0 ? (

                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">

                                            <p className="text-sm text-amber-700">
                                                Hiện chưa có ca khám khả dụng.
                                            </p>

                                        </div>

                                    ) : (

                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-3">

                                            {shifts.map(
                                                shift => {

                                                    const active =
                                                        String(
                                                            shiftId
                                                        ) ===
                                                        String(
                                                            shift.id
                                                        );

                                                    return (

                                                        <button
                                                            key={
                                                                shift.id
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                setShiftId(
                                                                    shift.id
                                                                )
                                                            }
                                                            className={`
                                                                min-h-[72px]
                                                                px-4
                                                                py-3
                                                                rounded-xl
                                                                border
                                                                transition-all
                                                                text-left
                                                                ${
                                                                active
                                                                    ? 'bg-slate-950 text-white border-slate-950 shadow-md'
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                                            }
                                                            `}
                                                        >

                                                            <p className="text-sm font-bold">
                                                                {
                                                                    shift.name
                                                                }
                                                            </p>

                                                            <p
                                                                className={`
                                                                    text-xs
                                                                    mt-1
                                                                    ${
                                                                    active
                                                                        ? 'text-slate-300'
                                                                        : 'text-slate-400'
                                                                }
                                                                `}
                                                            >
                                                                {
                                                                    shift.startTime
                                                                }
                                                                {' – '}
                                                                {
                                                                    shift.endTime
                                                                }
                                                            </p>

                                                        </button>

                                                    );

                                                }
                                            )}

                                        </div>

                                    )}

                                </div>

                            </div>

                        </section>

                        {/* =================================================
                            SUMMARY
                        ================================================= */}
                        <section className="bg-slate-950 text-white rounded-2xl shadow-xl overflow-hidden">

                            <div className="p-6">

                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                            Chi phí tạm tính
                                        </p>

                                        <p className="text-sm text-slate-400 mt-1">

                                            {selectedServices.length ===
                                            0
                                                ? 'Chưa chọn dịch vụ'
                                                : `${selectedServices.length} dịch vụ đã chọn`
                                            }

                                        </p>

                                    </div>

                                    <p className="text-2xl sm:text-3xl font-bold tracking-tight whitespace-nowrap">
                                        {formatVND(
                                            totalCost
                                        )}
                                    </p>

                                </div>

                                {/* SELECTED SERVICES */}
                                {selectedServices.length >
                                    0 && (

                                        <div className="mt-5 pt-5 border-t border-white/10 space-y-2 max-h-[145px] overflow-y-auto pr-1">

                                            {selectedServices.map(
                                                service => (

                                                    <div
                                                        key={
                                                            service.id
                                                        }
                                                        className="flex items-start justify-between gap-3 text-xs"
                                                    >

                                                    <span className="text-slate-300 leading-relaxed">
                                                        {
                                                            service.name
                                                        }
                                                    </span>

                                                        <span className="font-semibold text-white whitespace-nowrap">
                                                        {formatVND(
                                                            service.price
                                                        )}
                                                    </span>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    )}

                                {error && (
                                    <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-400/20">
                                        <p className="text-xs text-red-300">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={
                                        handleSubmit
                                    }
                                    disabled={
                                        booking
                                    }
                                    className="w-full h-14 mt-6 bg-white hover:bg-slate-100 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 text-sm font-bold uppercase tracking-[0.14em] rounded-xl transition-all"
                                >

                                    {booking
                                        ? tCommon(
                                            'loading'
                                        )
                                        : isReschedule
                                            ? 'Xác nhận đổi lịch'
                                            : 'Xác nhận đặt lịch'
                                    }

                                </button>

                            </div>

                        </section>

                    </aside>

                </div>

                {/* =================================================
                    CONFIRM MODAL
                ================================================= */}
                {showConfirmModal && (

                    <AppointmentConfirmModal
                        namespace="appointment"
                        data={{
                            fullName: profile?.fullName || fullName || '',

                            phone: profile?.phone || phone || '',

                            email: profile?.email || '',

                            ageGender: profile
                                ? `${
                                    profile.age ??
                                    calculateAge(profile.dateOfBirth) ??
                                    ''
                                } / ${
                                    profile.gender === 'Nam'
                                        ? 'Nam'
                                        : profile.gender === 'Nữ'
                                            ? 'Nữ'
                                            : profile.gender === 'Khác'
                                                ? 'Khác'
                                                : profile.gender || ''
                                }`
                                : '',

                            address: profile?.address || address || '',

                            date,

                            timeSlot:
                                shifts.find(
                                    s => String(s.id) === String(shiftId)
                                )?.name || '',

                            method: 'Khám trực tiếp tại phòng khám',

                            total: formatVND(totalCost),

                            services: selectedServices,

                            reason: ''
                        }}
                        isLoading={booking}
                        onClose={() => setShowConfirmModal(false)}
                        onConfirm={handleConfirm}
                    />

                )}

            </div>

        </CustomerLayout>
    );
}

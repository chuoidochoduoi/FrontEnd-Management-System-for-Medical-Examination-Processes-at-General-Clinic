// src/pages/customer/CustomerAppointmentPage.jsx

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ChevronDown, Info, Search } from 'lucide-react';

import CustomerLayout from '@/components/layout/CustomerLayout';
import { useAppointment } from '@/hooks/useAppointment';
import { useProfile } from '@/hooks/useProfile';
import AppointmentConfirmModal from '@/components/ui/AppointmentConfirmModal';
import { groupServicesBySpecialty } from '@/components/appointment/ServiceSelectionCard';
import { ROUTES } from '@/constants/routes';

const formatVND = amount =>
    new Intl.NumberFormat('vi-VN').format(amount || 0) + ' đ';

const toLocalDateValue = value => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getBookingDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minimum = new Date(today);
    minimum.setHours(0, 0, 0, 0);
    minimum.setDate(minimum.getDate() + 1);
    const maximum = new Date(today);
    maximum.setFullYear(maximum.getFullYear() + 1);
    return { minimum: toLocalDateValue(minimum), maximum: toLocalDateValue(maximum) };
};

const splitDate = value => {
    const [year = '', month = '', day = ''] = (value || '').split('-');
    return { year, month, day };
};

const daysInMonth = (year, month) => {
    if (!year || !month) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
};

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
        shiftLoading,
        fetchShifts
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
    const initialDateParts = splitDate(initialState.initialDate);
    const [dateParts, setDateParts] = useState(initialDateParts);

    const [shiftId, setShiftId] =
        useState(
            initialState.initialShiftId || ''
        );

    const selectedServiceKey = useMemo(
        () => selectedServices.map(service => service.id).sort().join(','),
        [selectedServices]
    );

    useEffect(() => {
        setShiftId('');
        fetchShifts(date, selectedServiceKey ? selectedServiceKey.split(',') : []);
        // fetchShifts is intentionally driven only by the booking selection.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, selectedServiceKey]);

    const [
        showConfirmModal,
        setShowConfirmModal
    ] = useState(false);

    const [activeServiceTab, setActiveServiceTab] = useState('EXAMINATION');
    const [serviceSearch, setServiceSearch] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({
        EXAMINATION: null,
        PARACLINICAL: null,
    });

    const bookingDateRange = useMemo(() => getBookingDateRange(), []);
    const bookingYears = useMemo(() => {
        const start = Number(bookingDateRange.minimum.slice(0, 4));
        const end = Number(bookingDateRange.maximum.slice(0, 4));
        return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
    }, [bookingDateRange]);

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
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase('vi')
                .includes(keyword);
        });
        return groupServicesBySpecialty(filtered);
    }, [services, activeServiceTab, serviceSearch]);

    useEffect(() => {
        if (visibleServiceGroups.length === 0 || serviceSearch.trim()) return;
        setExpandedGroups(previous => previous[activeServiceTab]
            ? previous
            : { ...previous, [activeServiceTab]: visibleServiceGroups[0][0] });
    }, [activeServiceTab, serviceSearch, visibleServiceGroups]);

    const updateAppointmentDate = (part, value) => {
        setDateParts(previous => {
            const next = { ...previous, [part]: value };
            const maximumDay = daysInMonth(next.year, next.month);
            if (next.day && Number(next.day) > maximumDay) next.day = '';
            if (!next.year || !next.month || !next.day) {
                setDate('');
                return next;
            }
            const candidate = `${next.year}-${String(next.month).padStart(2, '0')}-${String(next.day).padStart(2, '0')}`;
            setDate(candidate >= bookingDateRange.minimum && candidate <= bookingDateRange.maximum
                ? candidate : '');
            return next;
        });
    };

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
        setDateParts({ day: '', month: '', year: '' });
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

                        {/* SEARCH + TYPE */}
                        <div className="border-b border-slate-100 px-6 py-4 sm:px-7">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={serviceSearch}
                                    onChange={event => setServiceSearch(event.target.value)}
                                    placeholder="Tìm tên dịch vụ, chuyên khoa hoặc kỹ thuật..."
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-50"
                                />
                            </div>
                            <div className="mt-3 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                                {[
                                    ['EXAMINATION', 'Khám bệnh'],
                                    ['PARACLINICAL', 'Cận lâm sàng'],
                                ].map(([type, label]) => {
                                    const count = services.filter(service => type === 'EXAMINATION'
                                        ? service.departmentType === 'EXAMINATION'
                                        : service.departmentType !== 'EXAMINATION').length;
                                    const selectedCount = type === 'EXAMINATION'
                                        ? examinationCount : paraclinicalCount;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                setActiveServiceTab(type);
                                                setServiceSearch('');
                                            }}
                                            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${activeServiceTab === type
                                                ? 'bg-white text-slate-950 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            {label} · {count}{selectedCount > 0 ? ` (${selectedCount} đã chọn)` : ''}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className={`mt-3 flex gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5 ${activeServiceTab === 'EXAMINATION'
                                ? 'border-blue-200 bg-blue-50 text-blue-800'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                {activeServiceTab === 'EXAMINATION' ? (
                                    <p><strong>Lưu ý:</strong> Bạn có thể đặt nhiều dịch vụ khám trong một lịch hẹn. Khi check-in, các dịch vụ được thực hiện lần lượt và mỗi dịch vụ có một bệnh án riêng.</p>
                                ) : (
                                    <p>Có thể chọn nhiều dịch vụ cận lâm sàng. Dịch vụ khách tự đặt là bước độc lập; chỉ yêu cầu được bác sĩ chỉ định mới cần quay lại phòng khám.</p>
                                )}
                            </div>
                        </div>

                        {/* COMPACT SERVICE LIST */}
                        <div className="p-5 sm:p-6">
                            {loadingServices ? (
                                <div className="flex h-52 items-center justify-center text-sm text-slate-400">
                                    {t('step2.loading')}
                                </div>
                            ) : services.length === 0 ? (
                                <div className="flex h-52 items-center justify-center text-center">
                                    <div>
                                        <p className="font-semibold text-slate-700">Chưa có dịch vụ</p>
                                        <p className="mt-1 text-sm text-slate-400">Vui lòng thử lại sau.</p>
                                    </div>
                                </div>
                            ) : visibleServiceGroups.length === 0 ? (
                                <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                                    Không tìm thấy dịch vụ phù hợp
                                </div>
                            ) : (
                                <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
                                    {visibleServiceGroups.map(([groupName, groupServices]) => {
                                        const searching = serviceSearch.trim().length > 0;
                                        const open = searching || expandedGroups[activeServiceTab] === groupName;
                                        const selectedInGroup = groupServices.filter(service =>
                                            selectedServices.some(item => item.id === service.id)).length;
                                        return (
                                            <section key={groupName} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                <button
                                                    type="button"
                                                    onClick={() => !searching && setExpandedGroups(previous => ({
                                                        ...previous,
                                                        [activeServiceTab]: open ? null : groupName,
                                                    }))}
                                                    className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left"
                                                >
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {groupName} · {groupServices.length} dịch vụ
                                                        {selectedInGroup > 0 && <span className="ml-2 text-primary-700">· {selectedInGroup} đã chọn</span>}
                                                    </span>
                                                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
                                                </button>
                                                {open && (
                                                    <div className="divide-y divide-slate-100 px-4">
                                                        {groupServices.map(service => {
                                                            const selected = selectedServices.some(item => item.id === service.id);
                                                            const eligibility = getServiceEligibility(service);
                                                            const disabled = eligibility.eligible === false;
                                                            return (
                                                                <label
                                                                    key={service.id}
                                                                    className={`flex min-h-[74px] items-start gap-3 py-3 transition ${disabled
                                                                        ? 'cursor-not-allowed bg-slate-50 opacity-60'
                                                                        : 'cursor-pointer hover:bg-slate-50'} ${selected ? 'bg-primary-50/60' : ''}`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selected}
                                                                        disabled={disabled}
                                                                        onChange={() => toggleService(service)}
                                                                        className="mt-1 h-4 w-4 shrink-0 accent-primary-600"
                                                                    />
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                                                                        {service.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{service.description}</p>}
                                                                        {disabled && <p className="mt-1 text-xs font-medium text-red-600">{eligibility.reason}</p>}
                                                                    </div>
                                                                    <div className="shrink-0 text-right">
                                                                        <p className="text-sm font-bold text-primary-700">{formatVND(service.price)}</p>
                                                                        {service.durationMinutes && <p className="mt-1 text-[11px] text-slate-400">{service.durationMinutes} phút</p>}
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </section>
                                        );
                                    })}
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

                                    <div className="grid grid-cols-3 gap-2">
                                        <select
                                            aria-label="Ngày khám"
                                            value={dateParts.day}
                                            onChange={event => updateAppointmentDate('day', event.target.value)}
                                            className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                                        >
                                            <option value="">Ngày</option>
                                            {Array.from({ length: daysInMonth(dateParts.year, dateParts.month) }, (_, index) => String(index + 1).padStart(2, '0'))
                                                .map(day => <option key={day} value={day}>{day}</option>)}
                                        </select>
                                        <select
                                            aria-label="Tháng khám"
                                            value={dateParts.month}
                                            onChange={event => updateAppointmentDate('month', event.target.value)}
                                            className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                                        >
                                            <option value="">Tháng</option>
                                            {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
                                                .map(month => <option key={month} value={month}>{month}</option>)}
                                        </select>
                                        <select
                                            aria-label="Năm khám"
                                            value={dateParts.year}
                                            onChange={event => updateAppointmentDate('year', event.target.value)}
                                            className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                                        >
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
                                                            disabled={!shift.available}
                                                            onClick={() => shift.available &&
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
                                                                    : !shift.available
                                                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                                            }
                                                            `}
                                                        >

                                                            <p className="text-sm font-bold">
                                                                {
                                                                    shift.name
                                                                }
                                                            </p>

                                                            {!shift.available && <p className="mt-1 text-[11px] font-medium text-amber-700">Ca chưa có đủ nhân sự</p>}

                                                            {shift.timeSource === 'SPECIAL' && <p className="mt-1 text-[11px] font-medium text-blue-600">Giờ làm việc ngoại lệ</p>}

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
                                                : `${selectedServices.length} dịch vụ đã chọn · Khám bệnh: ${examinationCount} · Cận lâm sàng: ${paraclinicalCount}`
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

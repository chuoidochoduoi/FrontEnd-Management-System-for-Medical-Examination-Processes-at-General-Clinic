// src/pages/customer/CustomerAppointmentPage.jsx

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { CalendarDays, ChevronDown, Info, Search, UserRound, UsersRound } from 'lucide-react';

import CustomerLayout from '@/components/layout/CustomerLayout';
import { useAppointment } from '@/hooks/useAppointment';
import { useProfile } from '@/hooks/useProfile';
import AppointmentConfirmModal from '@/components/ui/AppointmentConfirmModal';
import { groupServicesBySpecialty } from '@/components/appointment/ServiceSelectionCard';
import { ROUTES } from '@/constants/routes';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { toggleServiceWithPolicy, serviceRelationHint } from '@/utils/serviceSelectionPolicy';

const formatVND = amount =>
    new Intl.NumberFormat('vi-VN').format(amount || 0) + ' đ';

const formatDateVi = value => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
};

const genderLabel = value => value === 'Nam' || value === 'MALE'
    ? 'Nam'
    : value === 'Nữ' || value === 'FEMALE'
        ? 'Nữ'
        : value || '';

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
        bookGroup,
        loading: booking,
        error,
        shifts,
        shiftLoading,
        fetchShifts
    } = useAppointment();

    const { profile } = useProfile();
    const { members: familyMembers, loading: familyLoading } = useFamilyMembers(false);

    const initialState =
        location.state || {};

    const isReschedule =
        !!initialState.rescheduleApptId;

    const [bookingMode, setBookingMode] = useState('single');
    const [selectedPatientId, setSelectedPatientId] = useState(initialState.patientProfileId || 'self');
    const [groupPatientIds, setGroupPatientIds] = useState([]);
    const [groupServiceMap, setGroupServiceMap] = useState({});
    const [editingGroupPatientId, setEditingGroupPatientId] = useState(null);

    const patientOptions = useMemo(() => [
        profile ? {
            patientProfileId: profile.profileId,
            fullName: profile.fullName,
            dateOfBirth: profile.dateOfBirth,
            age: profile.age,
            gender: profile.gender,
            patientCode: profile.patientCode,
            address: profile.address,
            phone: profile.phone,
            email: profile.email,
            relationshipName: 'Tôi',
            isSelf: true,
        } : null,
        ...familyMembers.map(member => ({ ...member, isSelf: false })),
    ].filter(Boolean), [profile, familyMembers]);

    const bookingPatient = useMemo(() => {
        if (bookingMode === 'group' && editingGroupPatientId) {
            return patientOptions.find(item => item.patientProfileId === editingGroupPatientId) || profile;
        }
        if (selectedPatientId === 'self') return profile;
        return patientOptions.find(item => item.patientProfileId === selectedPatientId) || profile;
    }, [bookingMode, editingGroupPatientId, patientOptions, profile, selectedPatientId]);

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

    // =========================================================
    // SERVICE SELECT
    // =========================================================
    const toggleService = service => {
        setSelectedServices(prev => {
            const resolution = toggleServiceWithPolicy(prev, service, services);
            if (resolution.message) toast.info(resolution.message);
            return resolution.services;
        });
    };

    // =========================================================
    // ELIGIBILITY
    // =========================================================
    const getServiceEligibility = service => {
        const patientAge =
            bookingPatient
                ? (
                    bookingPatient.age ??
                    (
                        bookingPatient.dateOfBirth
                            ? calculateAge(
                                bookingPatient.dateOfBirth
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
            bookingPatient?.gender ||
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
    const effectiveGroupServiceMap = useMemo(() => bookingMode !== 'group'
        ? {}
        : {
            ...groupServiceMap,
            ...(editingGroupPatientId ? { [editingGroupPatientId]: selectedServices } : {}),
        }, [bookingMode, groupServiceMap, editingGroupPatientId, selectedServices]);
    const groupServiceCount = bookingMode === 'group'
        ? groupPatientIds.reduce((sum, id) => sum + (effectiveGroupServiceMap[id]?.length || 0), 0)
        : 0;
    const groupTotalCost = bookingMode === 'group'
        ? groupPatientIds.reduce((sum, id) => sum + (effectiveGroupServiceMap[id] || [])
            .reduce((patientSum, service) => patientSum + Number(service.price || 0), 0), 0)
        : totalCost;
    const selectedShift = useMemo(() => shifts.find(
        shift => String(shift.id) === String(shiftId)
    ), [shiftId, shifts]);
    const confirmationGroupMembers = useMemo(() => bookingMode !== 'group' ? [] : groupPatientIds.map(id => {
        const patient = patientOptions.find(item => item.patientProfileId === id);
        const patientServices = effectiveGroupServiceMap[id] || [];
        return {
            patientProfileId: id,
            fullName: patient?.fullName || 'Chưa xác định',
            patientCode: patient?.patientCode,
            relationshipName: patient?.relationshipName || (patient?.isSelf ? 'Tôi' : 'Thành viên'),
            dateOfBirth: patient?.dateOfBirth ? formatDateVi(patient.dateOfBirth) : '',
            ageGender: `${patient?.age ?? calculateAge(patient?.dateOfBirth) ?? '—'} tuổi · ${genderLabel(patient?.gender) || 'Chưa rõ'}`,
            services: patientServices,
            total: patientServices.reduce((sum, service) => sum + Number(service.price || 0), 0),
        };
    }), [bookingMode, effectiveGroupServiceMap, groupPatientIds, patientOptions]);

    // =========================================================
    // OPEN MODAL
    // =========================================================
    const handleSubmit = () => {
        if (bookingMode === 'group' && groupPatientIds.length < 2) {
            toast.error('Vui lòng chọn ít nhất hai người để đặt lịch nhóm.');
            return;
        }
        if (bookingMode === 'group' && groupPatientIds.some(id => !(effectiveGroupServiceMap[id]?.length))) {
            toast.error('Mỗi người trong nhóm phải có ít nhất một dịch vụ.');
            return;
        }
        if (bookingMode !== 'group' && selectedServices.length === 0) {
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
        if (bookingMode === 'group') {
            const currentMap = editingGroupPatientId
                ? { ...groupServiceMap, [editingGroupPatientId]: selectedServices }
                : groupServiceMap;
            const groupBookings = groupPatientIds.map(patientProfileId => ({
                patientProfileId,
                services: currentMap[patientProfileId] || [],
            }));
            if (groupBookings.some(item => item.services.length === 0)) {
                toast.error('Mỗi thành viên cần được chọn ít nhất một dịch vụ.');
                return;
            }
            const success = await bookGroup({ date, shiftId, members: groupBookings });
            if (!success) return;
            setShowConfirmModal(false);
            navigate(ROUTES.MY_APPOINTMENTS);
            return;
        }
        const patientInfo = profile
            ? {
                patientProfileId: selectedPatientId === 'self' ? null : selectedPatientId,

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

    const toggleGroupPatient = patientProfileId => {
        setGroupPatientIds(previous => {
            const removing = previous.includes(patientProfileId);
            const next = removing ? previous.filter(id => id !== patientProfileId) : [...previous, patientProfileId];
            if (removing) {
                setGroupServiceMap(map => {
                    const copy = { ...map };
                    delete copy[patientProfileId];
                    return copy;
                });
                if (editingGroupPatientId === patientProfileId) {
                    setEditingGroupPatientId(null);
                    setSelectedServices([]);
                }
            }
            return next;
        });
    };

    const editGroupServices = patientProfileId => {
        if (editingGroupPatientId) {
            setGroupServiceMap(previous => ({ ...previous, [editingGroupPatientId]: selectedServices }));
        }
        setEditingGroupPatientId(patientProfileId);
        setSelectedServices(groupServiceMap[patientProfileId] || []);
    };

    const applyServicesToAll = () => {
        if (!selectedServices.length || groupPatientIds.length < 2) {
            toast.error('Hãy chọn người và dịch vụ trước khi áp dụng cho cả nhóm.');
            return;
        }
        setGroupServiceMap(Object.fromEntries(groupPatientIds.map(id => [id, [...selectedServices]])));
        toast.success('Đã áp dụng danh sách dịch vụ cho tất cả thành viên.');
    };

    return (
        <CustomerLayout>

            {/* =================================================
                PAGE CONTAINER
            ================================================= */}
            <div className="cares-booking-page w-full pb-14">

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

                {!isReschedule && (
                    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <span className="text-[11px] font-bold tracking-[0.18em] text-primary-600">BƯỚC 00</span>
                                <h2 className="mt-1 text-lg font-bold text-slate-900">Người được khám</h2>
                            </div>
                            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                                <button type="button" onClick={() => { setBookingMode('single'); setSelectedServices([]); }} className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${bookingMode === 'single' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}><UserRound size={16} /> Đặt cá nhân</button>
                                <button type="button" onClick={() => { setBookingMode('group'); setSelectedServices([]); }} className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${bookingMode === 'group' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}><UsersRound size={16} /> Đặt theo nhóm</button>
                            </div>
                        </div>
                        <div className="p-5 sm:p-6">
                            {familyLoading ? <p className="text-sm text-slate-400">Đang tải hồ sơ gia đình...</p> : bookingMode === 'single' ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {patientOptions.map(patient => {
                                        const value = patient.isSelf ? 'self' : patient.patientProfileId;
                                        const active = selectedPatientId === value;
                                        return <button key={value} type="button" onClick={() => setSelectedPatientId(value)} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${active ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100' : 'border-slate-200 hover:border-primary-200'}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-primary-700 shadow-sm">{patient.fullName?.[0] || 'T'}</span><span className="min-w-0"><strong className="block truncate text-sm text-slate-900">{patient.fullName}</strong><small className="text-xs text-slate-500">{patient.relationshipName || 'Thành viên'} · {patient.age ?? calculateAge(patient.dateOfBirth) ?? '-'} tuổi</small></span></button>;
                                    })}
                                </div>
                            ) : (
                                <div>
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {patientOptions.map(patient => {
                                            const id = patient.patientProfileId;
                                            const selected = groupPatientIds.includes(id);
                                            return <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${selected ? 'border-primary-500 bg-primary-50' : 'border-slate-200'}`}><input type="checkbox" checked={selected} onChange={() => toggleGroupPatient(id)} className="h-4 w-4 accent-primary-600" /><span className="min-w-0"><strong className="block truncate text-sm text-slate-900">{patient.fullName}</strong><small className="text-xs text-slate-500">{patient.relationshipName || 'Tôi'}</small></span></label>;
                                        })}
                                    </div>
                                    {groupPatientIds.length > 0 && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-700">Chọn người để cấu hình dịch vụ riêng</p><button type="button" onClick={applyServicesToAll} className="rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-bold text-primary-700">Áp dụng dịch vụ hiện tại cho tất cả</button></div><div className="flex flex-wrap gap-2">{groupPatientIds.map(id => { const patient = patientOptions.find(item => item.patientProfileId === id); const servicesForPatient = editingGroupPatientId === id ? selectedServices : (groupServiceMap[id] || []); const cost = servicesForPatient.reduce((sum, service) => sum + Number(service.price || 0), 0); return <button key={id} type="button" onClick={() => editGroupServices(id)} className={`rounded-lg px-3 py-2 text-left text-xs font-semibold ${editingGroupPatientId === id ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}><span className="block">{patient?.fullName} · {servicesForPatient.length} dịch vụ</span><span className={`mt-0.5 block text-[11px] ${editingGroupPatientId === id ? 'text-white/75' : 'text-slate-400'}`}>{formatVND(cost)}</span></button>; })}</div><p className="mt-3 text-xs text-slate-500">Mỗi người sẽ có một lịch hẹn độc lập nhưng dùng chung ngày và ca.</p></div>}
                                </div>
                            )}
                            <button type="button" onClick={() => navigate(ROUTES.CUSTOMER_FAMILY_MEMBERS)} className="mt-4 text-xs font-bold text-primary-700 hover:underline">+ Thêm hoặc quản lý thành viên gia đình</button>
                        </div>
                    </section>
                )}

                {/* =================================================
                    CONTENT
                ================================================= */}
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] gap-6 items-start">

                    {/* =================================================
                        LEFT - SERVICES
                    ================================================= */}
                    <section className="cares-booking-card bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

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
                                                                        {serviceRelationHint(service) && <p className="mt-1 text-xs font-semibold text-teal-700">{serviceRelationHint(service)}</p>}
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
                        <section className="cares-booking-card bg-white border border-slate-200 rounded-2xl shadow-sm">

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

                                    <div className="relative">
                                        <CalendarDays
                                            size={20}
                                            aria-hidden="true"
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary-600"
                                        />
                                        <input
                                            type="date"
                                            aria-label="Ngày khám"
                                            value={date}
                                            min={bookingDateRange.minimum}
                                            max={bookingDateRange.maximum}
                                            onChange={event => {
                                                setDate(event.target.value);
                                                setShiftId('');
                                            }}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-base font-semibold text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-50"
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Chọn ngày từ ngày mai đến tối đa 12 tháng tiếp theo.
                                    </p>

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
                                                                    String(shift.startTime || '').slice(0, 5)
                                                                }
                                                                {' – '}
                                                                {
                                                                    String(shift.endTime || '').slice(0, 5)
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
                        <section className="overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-white via-teal-50/70 to-emerald-50 text-slate-900 shadow-[0_18px_45px_rgba(15,159,145,0.14)] dark:border-teal-800/70 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/50 dark:text-white">

                            <div className="p-6">

                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                                            Chi phí tạm tính
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">

                                            {(bookingMode === 'group' ? groupServiceCount : selectedServices.length) ===
                                            0
                                                ? 'Chưa chọn dịch vụ'
                                                : bookingMode === 'group'
                                                    ? `${groupPatientIds.length} người · ${groupServiceCount} lượt dịch vụ`
                                                    : `${selectedServices.length} dịch vụ đã chọn · Khám bệnh: ${examinationCount} · Cận lâm sàng: ${paraclinicalCount}`
                                            }

                                        </p>

                                    </div>

                                    <p className="whitespace-nowrap text-2xl font-bold tracking-tight text-teal-700 sm:text-3xl dark:text-teal-300">
                                        {formatVND(
                                            groupTotalCost
                                        )}
                                    </p>

                                </div>

                                {/* SELECTED SERVICES */}
                                {selectedServices.length >
                                    0 && (

                                        <div className="mt-5 max-h-[145px] space-y-2 overflow-y-auto border-t border-teal-200 pt-5 pr-1 dark:border-teal-800/70">

                                            {selectedServices.map(
                                                service => (

                                                    <div
                                                        key={
                                                            service.id
                                                        }
                                                        className="flex items-start justify-between gap-3 text-xs"
                                                    >

                                                    <span className="leading-relaxed text-slate-700 dark:text-slate-300">
                                                        {
                                                            service.name
                                                        }
                                                    </span>

                                                        <span className="whitespace-nowrap font-semibold text-teal-700 dark:text-teal-300">
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
                                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800/70 dark:bg-red-950/40">
                                        <p className="text-sm text-red-700 dark:text-red-300">
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
                                    className="mt-6 h-14 w-full rounded-xl bg-teal-600 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
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
                            title: bookingMode === 'group' ? 'Xác nhận đặt lịch theo nhóm' : undefined,
                            subtitle: bookingMode === 'group'
                                ? 'Kiểm tra đúng người được khám và dịch vụ riêng của từng thành viên trước khi tạo lịch.'
                                : undefined,
                            fullName: bookingMode === 'group'
                                ? `${groupPatientIds.length} thành viên gia đình`
                                : bookingPatient?.fullName || fullName || '',

                            patientCode: bookingMode === 'group' ? undefined : bookingPatient?.patientCode,

                            dateOfBirth: bookingMode === 'group' || !bookingPatient?.dateOfBirth
                                ? undefined : formatDateVi(bookingPatient.dateOfBirth),

                            phone: bookingMode === 'group' || (bookingPatient && !bookingPatient.isSelf)
                                ? '' : profile?.phone || phone || '',

                            email: bookingMode === 'group' || (bookingPatient && !bookingPatient.isSelf)
                                ? '' : profile?.email || '',

                            ageGender: bookingMode === 'group' ? 'Đặt lịch nhóm' : bookingPatient
                                ? `${bookingPatient.age ?? calculateAge(bookingPatient.dateOfBirth) ?? '—'} tuổi · ${genderLabel(bookingPatient.gender) || 'Chưa rõ'}`
                                : '',

                            address: bookingPatient?.address || address || '',

                            date: formatDateVi(date),

                            timeSlot: selectedShift
                                ? `${selectedShift.name || 'Ca khám'}${selectedShift.startTime && selectedShift.endTime ? ` · ${selectedShift.startTime}–${selectedShift.endTime}` : ''}`
                                : '',

                            method: 'Khám trực tiếp tại phòng khám',

                            total: formatVND(groupTotalCost),

                            services: selectedServices,

                            groupMembers: confirmationGroupMembers,

                            contactManager: (bookingMode === 'group' || (bookingPatient && !bookingPatient.isSelf)) ? {
                                name: profile?.fullName,
                                phone: profile?.phone || phone,
                                email: profile?.email,
                            } : null,

                            reason: '',
                            note: bookingMode === 'group'
                                ? 'Hệ thống sẽ tạo một lịch hẹn độc lập cho mỗi người. Sau khi đặt, đổi lịch hoặc hủy lịch được thực hiện riêng từng người.'
                                : undefined,
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

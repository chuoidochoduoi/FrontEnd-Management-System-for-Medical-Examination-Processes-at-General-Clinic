// src/pages/receptionist/CreateTicketPage.jsx

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    RotateCcw,
    Search,
} from 'lucide-react';

import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { useCreateTicket } from '@/hooks/useCreateTicket';
import { useToast } from '@/hooks/useToast';
import CreateTicketConfirmModal from '@/components/ui/CreateTicketConfirmModal';

/* =========================================================
   HELPERS
========================================================= */

const fmt = (value) =>
    value != null
        ? `${new Intl.NumberFormat('vi-VN').format(
            Number(value)
        )}đ`
        : '—';

const DEPARTMENT_TYPE_LABELS = {
    EXAMINATION: 'Khám bệnh',
    PARACLINICAL: 'Cận lâm sàng',
    OTHER: 'Dịch vụ khác',
};

const inputCls =
    'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 bg-white placeholder:text-gray-300';

const labelCls =
    'block text-xs text-gray-500 mb-1.5';

const toGenderEnum = (gender) => {
    if (!gender) return null;

    if (gender === 'male') {
        return 'MALE';
    }

    if (gender === 'female') {
        return 'FEMALE';
    }

    if (gender === 'other') {
        return 'OTHER';
    }

    return gender;
};

/* =========================================================
   MAIN
========================================================= */

export default function CreateTicketPage() {
    const { t } = useTranslation([
        'receptionist',
        'createTicketConfirmModal',
    ]);

    const {
        services = [],
        loadingSvc,
        submitting,
        error: submitError,
        submit,
    } = useCreateTicket();

    const toast = useToast();

    const [searchParams] =
        useSearchParams();

    /* =========================================================
       ERROR
    ========================================================= */

    const [
        validationError,
        setValidationError,
    ] = useState('');

    /* =========================================================
       SERVICE
    ========================================================= */

    const [
        selectedServiceIds,
        setSelectedServiceIds,
    ] = useState([]);

    const [
        searchTerm,
        setSearchTerm,
    ] = useState('');

    const [
        departmentType,
        setDepartmentType,
    ] = useState('');

    /* =========================================================
       MODAL
    ========================================================= */

    const [
        showConfirmModal,
        setShowConfirmModal,
    ] = useState(false);

    /* =========================================================
       PATIENT
    ========================================================= */

    const [
        customerId,
        setCustomerId,
    ] = useState(null);

    const [
        fullName,
        setFullName,
    ] = useState('');

    const [
        phone,
        setPhone,
    ] = useState('');

    const [
        dob,
        setDob,
    ] = useState('');

    const [
        gender,
        setGender,
    ] = useState('male');

    const [
        address,
        setAddress,
    ] = useState('');

    const [
        reason,
        setReason,
    ] = useState('');

    /* =========================================================
       TOKEN
    ========================================================= */

    const getToken = () =>
        localStorage.getItem('token') ||
        sessionStorage.getItem(
            'token'
        );

    /* =========================================================
       AUTOFILL PATIENT FROM URL
    ========================================================= */

    useEffect(() => {
        const queryPhone =
            searchParams.get('phone');

        const queryCustomerId =
            searchParams.get(
                'customerId'
            );

        if (queryCustomerId) {
            setCustomerId(
                queryCustomerId
            );
        }

        if (!queryPhone) {
            return;
        }

        fetch(
            `${
                import.meta.env
                    .VITE_API_URL
            }/api/receptionist/records/search-by-phone?phone=${encodeURIComponent(
                queryPhone
            )}`,
            {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            }
        )
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(
                        'Không thể tải hồ sơ bệnh nhân'
                    );
                }

                return response.json();
            })
            .then((data) => {
                const patients =
                    Array.isArray(data)
                        ? data
                        : data?.data ||
                        data?.content ||
                        [];

                if (
                    patients.length ===
                    0
                ) {
                    toast.error(
                        'Không tìm thấy hồ sơ bệnh nhân theo số điện thoại'
                    );

                    return;
                }

                const patient =
                    patients.find(
                        (item) =>
                            item.customerId ===
                            queryCustomerId
                    ) || patients[0];

                if (
                    patient.customerId
                ) {
                    setCustomerId(
                        patient.customerId
                    );
                }

                setFullName(
                    patient.fullName ||
                    ''
                );

                setPhone(
                    patient.phone || ''
                );

                if (
                    patient.dateOfBirth
                ) {
                    setDob(
                        patient.dateOfBirth.split(
                            'T'
                        )[0]
                    );
                }

                if (patient.gender) {
                    const normalizedGender =
                        patient.gender.toLowerCase();

                    setGender(
                        normalizedGender ===
                        'male' ||
                        normalizedGender ===
                        'female'
                            ? normalizedGender
                            : 'other'
                    );
                }

                setAddress(
                    patient.address || ''
                );
            })
            .catch((error) => {
                console.error(error);

                toast.error(
                    'Không thể tải thông tin bệnh nhân tái khám'
                );
            });
    }, [searchParams]);

    /* =========================================================
       SERVICE TOGGLE
    ========================================================= */

    const toggleService = (
        service
    ) => {
        setSelectedServiceIds(
            (previous) =>
                previous.includes(
                    service.id
                )
                    ? previous.filter(
                        (id) =>
                            id !==
                            service.id
                    )
                    : [
                        ...previous,
                        service.id,
                    ]
        );

        setValidationError('');
    };

    /* =========================================================
       SELECTED SERVICES
    ========================================================= */

    const selectedServices =
        selectedServiceIds
            .map((id) =>
                services.find(
                    (service) =>
                        service.id === id
                )
            )
            .filter(Boolean);

    /*
     * Không còn BHYT ở Receptionist.
     * Tổng giá = tổng giá niêm yết của các dịch vụ.
     */
    const total =
        selectedServices.reduce(
            (sum, service) =>
                sum +
                Number(
                    service.price ||
                    0
                ),
            0
        );

    /* =========================================================
       FILTER SERVICE
    ========================================================= */

    const filteredServices =
        services.filter(
            (service) => {
                const keyword =
                    searchTerm
                        .trim()
                        .toLowerCase();

                const matchSearch =
                    !keyword ||
                    (
                        service.name ||
                        ''
                    )
                        .toLowerCase()
                        .includes(
                            keyword
                        ) ||
                    (
                        service.description ||
                        ''
                    )
                        .toLowerCase()
                        .includes(
                            keyword
                        );

                const matchDepartmentType =
                    !departmentType ||
                    service.departmentType ===
                    departmentType;

                return (
                    matchSearch &&
                    matchDepartmentType
                );
            }
        );

    /* =========================================================
       GROUP SERVICE
    ========================================================= */

    const groupedServices =
        filteredServices.reduce(
            (
                result,
                service
            ) => {
                let type =
                    service.departmentType;

                if (
                    type !==
                    'EXAMINATION' &&
                    type !==
                    'PARACLINICAL'
                ) {
                    return result;
                }

                if (!result[type]) {
                    result[type] = [];
                }

                result[type].push(
                    service
                );

                return result;
            },
            {
                EXAMINATION: [],
                PARACLINICAL: [],
            }
        );

    const orderedGroups =
        Object.entries(
            groupedServices
        ).sort(([a], [b]) => {
            const order = {
                EXAMINATION: 1,
                PARACLINICAL: 2,
                OTHER: 3,
            };

            return (
                (order[a] || 99) -
                (order[b] || 99)
            );
        });

    /* =========================================================
       RESET
    ========================================================= */

    const handleReset = () => {
        setSelectedServiceIds([]);
        setSearchTerm('');
        setDepartmentType('');

        setCustomerId(null);

        setFullName('');
        setPhone('');
        setDob('');
        setGender('male');
        setAddress('');
        setReason('');

        setValidationError('');
    };

    /* =========================================================
       VALIDATION
    ========================================================= */

    const handleSubmit = () => {
        setValidationError('');

        if (!fullName.trim()) {
            setValidationError(
                t(
                    'validation.fullNameRequired'
                )
            );

            return;
        }

        if (!phone.trim()) {
            setValidationError(
                t(
                    'validation.phoneRequired'
                )
            );

            return;
        }

        if (
            !/^(\+84|0)\d{9,10}$/.test(
                phone.trim()
            )
        ) {
            setValidationError(
                'Số điện thoại Việt Nam không hợp lệ'
            );

            return;
        }

        if (dob) {
            const birthDate =
                new Date(dob);

            const today =
                new Date();

            if (
                birthDate >= today
            ) {
                setValidationError(
                    'Ngày sinh phải là ngày trong quá khứ'
                );

                return;
            }
        }



        if (
            selectedServiceIds.length ===
            0
        ) {
            setValidationError(
                t(
                    'validation.serviceRequired'
                )
            );

            return;
        }

        setShowConfirmModal(
            true
        );
    };

    /* =========================================================
       ISSUER
    ========================================================= */

    const getIssuerId = () => {
        const storage =
            localStorage.getItem(
                'token'
            )
                ? localStorage
                : sessionStorage;

        return (
            storage.getItem(
                'staffId'
            ) ||
            storage.getItem(
                'accountId'
            )
        );
    };

    /* =========================================================
       CONFIRM
    ========================================================= */

    const handleConfirm = () => {
        submit({
            customerId,

            serviceIds:
            selectedServiceIds,

            issuedById:
                getIssuerId(),

            reason:
                reason.trim(),

            guestFullName:
                fullName.trim(),

            guestPhone:
                phone.trim(),

            guestAddress:
                address.trim(),

            guestDateOfBirth:
                dob || null,

            guestGender:
                toGenderEnum(
                    gender
                ),
        });

        setShowConfirmModal(
            false
        );
    };

    /* =========================================================
       UI
    ========================================================= */

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

                        <div className="flex flex-wrap items-end justify-between gap-4">

                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    Tạo phiếu khám
                                </h1>

                                <p className="mt-1 text-sm text-gray-400">
                                    Tiếp nhận thông tin bệnh nhân và lựa chọn dịch vụ y tế
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleReset
                                }
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-500 transition hover:border-gray-300 hover:text-gray-800"
                            >
                                <RotateCcw
                                    size={14}
                                />

                                Đặt lại
                            </button>
                        </div>

                        {/* =================================================
                            MAIN
                        ================================================= */}

                        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">

                            {/* =================================================
                                PATIENT INFO
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
                                                Thông tin tiếp nhận của lượt khám
                                            </p>
                                        </div>
                                    </div>

                                    {/* BODY */}

                                    <div className="space-y-4 p-5">

                                        {/* FULL NAME */}

                                        <div>
                                            <label className={labelCls}>
                                                {t(
                                                    'createTicket.patientInfo.fullName'
                                                )}

                                                <span className="ml-1 text-red-400">
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="text"
                                                maxLength={50}
                                                value={
                                                    fullName
                                                }
                                                onChange={(
                                                    event
                                                ) => {
                                                    setFullName(
                                                        event
                                                            .target
                                                            .value
                                                    );

                                                    setValidationError(
                                                        ''
                                                    );
                                                }}
                                                placeholder={t(
                                                    'createTicket.patientInfo.fullNamePlaceholder'
                                                )}
                                                className={
                                                    inputCls
                                                }
                                            />
                                        </div>

                                        {/* PHONE + DOB */}

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                            <div>
                                                <label className={labelCls}>
                                                    {t(
                                                        'createTicket.patientInfo.phone'
                                                    )}

                                                    <span className="ml-1 text-red-400">
                                                        *
                                                    </span>
                                                </label>

                                                <input
                                                    type="tel"
                                                    maxLength={20}
                                                    value={
                                                        phone
                                                    }
                                                    onChange={(
                                                        event
                                                    ) => {
                                                        setPhone(
                                                            event
                                                                .target
                                                                .value
                                                        );

                                                        setValidationError(
                                                            ''
                                                        );
                                                    }}
                                                    placeholder={t(
                                                        'createTicket.patientInfo.phonePlaceholder'
                                                    )}
                                                    className={
                                                        inputCls
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className={labelCls}>
                                                    {t(
                                                        'createTicket.patientInfo.dob'
                                                    )}
                                                </label>

                                                <input
                                                    type="date"
                                                    max={new Date().toLocaleDateString(
                                                        'en-CA'
                                                    )}
                                                    value={
                                                        dob
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setDob(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    className={
                                                        inputCls
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* GENDER + ADDRESS */}

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                            <div>
                                                <label className={labelCls}>
                                                    {t(
                                                        'createTicket.patientInfo.gender'
                                                    )}
                                                </label>

                                                <div className="grid grid-cols-2 gap-2">

                                                    {[
                                                        {
                                                            value:
                                                                'male',
                                                            label: t(
                                                                'createTicket.patientInfo.male'
                                                            ),
                                                        },
                                                        {
                                                            value:
                                                                'female',
                                                            label: t(
                                                                'createTicket.patientInfo.female'
                                                            ),
                                                        },
                                                    ].map(
                                                        ({
                                                             value,
                                                             label,
                                                         }) => (
                                                            <button
                                                                key={
                                                                    value
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    setGender(
                                                                        value
                                                                    )
                                                                }
                                                                className={`h-10 rounded-lg border text-sm font-medium transition ${
                                                                    gender ===
                                                                    value
                                                                        ? 'border-gray-900 bg-gray-900 text-white'
                                                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
                                                                }`}
                                                            >
                                                                {
                                                                    label
                                                                }
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className={labelCls}>
                                                    {t(
                                                        'createTicket.patientInfo.address'
                                                    )}
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        address
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setAddress(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'createTicket.patientInfo.addressPlaceholder'
                                                    )}
                                                    className={
                                                        inputCls
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* NOTE */}

                                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">

                                            <p className="text-xs leading-5 text-gray-500">
                                                Bảo hiểm y tế và mức giảm thanh toán sẽ được xử lý tại quầy thu ngân.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* =================================================
                                SERVICES
                            ================================================= */}

                            <div className="xl:col-span-7">

                                <div className="flex h-full min-h-[560px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">

                                    {/* HEADER */}

                                    <div className="border-b border-gray-100 px-5 py-4">

                                        <div className="flex flex-wrap items-center justify-between gap-4">

                                            <div className="flex items-center gap-3">

                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                                                    2
                                                </span>

                                                <div>
                                                    <h2 className="text-sm font-bold text-gray-900">
                                                        Dịch vụ y tế
                                                    </h2>

                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        Chọn dịch vụ cho lượt khám này
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

                                        {/* SEARCH + FILTER */}

                                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_190px]">

                                            <div className="relative">

                                                <Search
                                                    size={
                                                        16
                                                    }
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                />

                                                <input
                                                    type="text"
                                                    value={
                                                        searchTerm
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setSearchTerm(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Tìm kiếm dịch vụ..."
                                                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-200"
                                                />
                                            </div>

                                            <select
                                                value={
                                                    departmentType
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setDepartmentType(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className={
                                                    inputCls
                                                }
                                            >
                                                <option value="">
                                                    Tất cả loại dịch vụ
                                                </option>

                                                <option value="EXAMINATION">
                                                    Khám bệnh
                                                </option>

                                                <option value="PARACLINICAL">
                                                    Cận lâm sàng
                                                </option>


                                            </select>
                                        </div>
                                    </div>

                                    {/* =================================================
                                        SERVICE LIST
                                    ================================================= */}

                                    <div className="flex-1 min-h-0 p-5">

                                        {loadingSvc ? (
                                            <div className="flex h-40 items-center justify-center">

                                                <p className="text-sm text-gray-400">
                                                    {t(
                                                        'createTicket.loading'
                                                    )}
                                                </p>
                                            </div>
                                        ) : orderedGroups.length >
                                        0 ? (
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                                                {orderedGroups.map(
                                                    ([
                                                         type,
                                                         servicesGroup,
                                                     ]) => (
                                                        <div
                                                            key={
                                                                type
                                                            }
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
                                                                        servicesGroup.length
                                                                    }{' '}
                                                                    dịch vụ
                                                                </span>
                                                            </div>

                                                            {/* =================================================
                                                                FIXED HEIGHT SERVICE LIST
                                                                khoảng 4 item
                                                            ================================================= */}

                                                            <div className="h-[272px] divide-y divide-gray-200 overflow-y-auto overflow-x-hidden px-4 pr-2 custom-scrollbar">

                                                                {servicesGroup.length === 0 ? (
                                                                    <div className="flex h-full items-center justify-center">
                                                                        <span className="text-sm text-gray-400">Trống</span>
                                                                    </div>
                                                                ) : (
                                                                    servicesGroup.map(
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
                                                                                    className={`flex min-h-[64px] cursor-pointer items-start gap-3 py-3 transition ${
                                                                                        checked
                                                                                            ? 'bg-primary-50/50'
                                                                                            : 'hover:bg-gray-100/50'
                                                                                    }`}
                                                                                >

                                                                                    {/* CHECKBOX */}

                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={
                                                                                            checked
                                                                                        }
                                                                                        onChange={() =>
                                                                                            toggleService(
                                                                                                service
                                                                                            )
                                                                                        }
                                                                                        className="mt-0.5 h-4 w-4 shrink-0 accent-gray-900"
                                                                                    />

                                                                                    {/* INFO */}

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

                                                                                    {/* PRICE */}

                                                                                    <div className="shrink-0 pl-2 text-right">

                                                                                        <p className="text-sm font-semibold text-gray-900">
                                                                                            {fmt(
                                                                                                service.price
                                                                                            )}
                                                                                        </p>
                                                                                    </div>
                                                                                </label>
                                                                            );
                                                                        }
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">

                                                <p className="text-sm text-gray-400">
                                                    Không tìm thấy dịch vụ phù hợp
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* =================================================
                                        REASON
                                    ================================================= */}

                                    <div className="border-t border-gray-100 px-5 py-4">

                                        <label className={labelCls}>
                                            {t(
                                                'createTicket.bundle.reasonLabel'
                                            )}
                                        </label>

                                        <textarea
                                            value={
                                                reason
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setReason(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder={t(
                                                'createTicket.bundle.reasonPlaceholder'
                                            )}
                                            rows={2}
                                            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none placeholder:text-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {(validationError ||
                            submitError) && (
                            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">

                                <p className="text-sm text-red-500">
                                    {validationError ||
                                        submitError}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* =====================================================
                    STICKY FOOTER
                ===================================================== */}

                <div className="fixed bottom-0 left-52 right-0 z-40 border-t border-gray-200 bg-white">

                    <div className="flex h-[72px] items-center justify-between gap-5 px-6 lg:px-8">

                        {/* SUMMARY */}

                        <div className="flex min-w-0 items-center gap-6">

                            <div className="hidden border-r border-gray-200 pr-6 sm:block">

                                <p className="text-xs text-gray-400">
                                    Dịch vụ đã chọn
                                </p>

                                <p className="mt-0.5 text-sm font-semibold text-gray-800">
                                    {
                                        selectedServiceIds.length
                                    }
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400">
                                    Tổng chi phí dự kiến
                                </p>

                                <p className="text-xl font-bold text-gray-900">
                                    {fmt(total)}
                                </p>
                            </div>
                        </div>

                        {/* SUBMIT */}

                        <button
                            type="button"
                            onClick={
                                handleSubmit
                            }
                            disabled={
                                submitting
                            }
                            className="h-10 shrink-0 rounded-xl bg-gray-900 px-7 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting
                                ? t(
                                    'createTicket.submitting'
                                )
                                : t(
                                    'createTicket.submit'
                                )}
                        </button>
                    </div>
                </div>

                {/* =====================================================
                    CONFIRM MODAL
                ===================================================== */}

                {showConfirmModal && (
                    <CreateTicketConfirmModal
                        data={{
                            fullName,

                            phone,

                            age: dob
                                ? new Date().getFullYear() -
                                new Date(
                                    dob
                                ).getFullYear()
                                : '',

                            gender:
                                gender ===
                                'male'
                                    ? t(
                                        'createTicket.patientInfo.male'
                                    )
                                    : gender ===
                                    'female'
                                        ? t(
                                            'createTicket.patientInfo.female'
                                        )
                                        : t(
                                            'createTicket.patientInfo.other'
                                        ),

                            address,

                            total:
                                fmt(total),

                            services:
                            selectedServices,

                            reason,
                        }}
                        onClose={() => {
                            setShowConfirmModal(
                                false
                            );

                            setValidationError(
                                ''
                            );
                        }}
                        onConfirm={
                            handleConfirm
                        }
                        submitting={
                            submitting
                        }
                    />
                )}
            </div>
        </ReceptionistLayout>
    );
}
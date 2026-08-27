// src/pages/receptionist/CreateTicketPage.jsx

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ChevronDown,
    FileText,
    Info,
    RotateCcw,
    Search,
    UserCheck,
    X,
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

const EXAM_GROUPS = ['Nội khoa', 'Ngoại khoa', 'Nhi khoa', 'Sản phụ khoa', 'Da liễu', 'Khám bệnh khác'];
const PARACLINICAL_GROUPS = ['Xét nghiệm', 'Chẩn đoán hình ảnh', 'Cận lâm sàng khác'];

const normalizeText = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const normalizePhone = (value = '') => {
    const digits = value.replace(/\D/g, '');
    return digits.startsWith('84') ? `0${digits.slice(2)}` : digits;
};

const buildDobIso = (day, month, year) => {
    if (!day || !month || !year || String(year).length !== 4) return '';
    const numericDay = Number(day);
    const numericMonth = Number(month);
    const numericYear = Number(year);
    const value = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));
    if (value.getUTCFullYear() !== numericYear
        || value.getUTCMonth() !== numericMonth - 1
        || value.getUTCDate() !== numericDay) return '';
    return `${String(numericYear).padStart(4, '0')}-${String(numericMonth).padStart(2, '0')}-${String(numericDay).padStart(2, '0')}`;
};

const serviceGroup = (service) => {
    if (service.departmentType === 'EXAMINATION') {
        const name = normalizeText(service.specializationName || service.department);
        if (name.includes('noi khoa')) return 'Nội khoa';
        if (name.includes('ngoai khoa')) return 'Ngoại khoa';
        if (name.includes('nhi khoa')) return 'Nhi khoa';
        if (name.includes('san') || name.includes('phu khoa')) return 'Sản phụ khoa';
        if (name.includes('da lieu')) return 'Da liễu';
        return 'Khám bệnh khác';
    }
    const detail = normalizeText(`${service.department} ${service.capabilityName} ${service.name}`);
    if (/(x-quang|x quang|sieu am|ecg|dien tim|chan doan hinh anh)/.test(detail)) {
        return 'Chẩn đoán hình ảnh';
    }
    if (/(xet nghiem|huyet hoc|sinh hoa|nuoc tieu|test nhanh|crp)/.test(detail)) return 'Xét nghiệm';
    return 'Cận lâm sàng khác';
};

const inputCls =
    'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 bg-white placeholder:text-gray-300';

const labelCls =
    'block text-xs text-gray-500 mb-1.5';

const BLOOD_TYPES = [
    ['A_POSITIVE', 'A+'], ['A_NEGATIVE', 'A-'],
    ['B_POSITIVE', 'B+'], ['B_NEGATIVE', 'B-'],
    ['AB_POSITIVE', 'AB+'], ['AB_NEGATIVE', 'AB-'],
    ['O_POSITIVE', 'O+'], ['O_NEGATIVE', 'O-'],
];

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

    const [activeServiceTab, setActiveServiceTab] = useState('EXAMINATION');
    const [expandedGroups, setExpandedGroups] = useState({});

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

    const [dobDay, setDobDay] = useState('');
    const [dobMonth, setDobMonth] = useState('');
    const [dobYear, setDobYear] = useState('');
    const dob = buildDobIso(dobDay, dobMonth, dobYear);

    const [
        gender,
        setGender,
    ] = useState('male');

    const [
        address,
        setAddress,
    ] = useState('');

    const [email, setEmail] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [allergyStatus, setAllergyStatus] = useState('UNVERIFIED');
    const [allergies, setAllergies] = useState([]);
    const [allergyInput, setAllergyInput] = useState('');
    const [patientCode, setPatientCode] = useState('');
    const [resolvingPhone, setResolvingPhone] = useState(false);
    const [phoneLookupDone, setPhoneLookupDone] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [patientSearch, setPatientSearch] = useState('');
    const [patientSearchResults, setPatientSearchResults] = useState([]);
    const [searchingPatients, setSearchingPatients] = useState(false);

    useEffect(() => {
        if (!submitError) return;
        const message = submitError.toLowerCase();
        if (message.includes('số điện thoại')) {
            setFieldErrors(previous => ({ ...previous, phone: submitError }));
            document.getElementById('patient-phone')?.focus();
        } else if (message.includes('email')) {
            setFieldErrors(previous => ({ ...previous, email: submitError }));
            document.getElementById('patient-email')?.focus();
        }
    }, [submitError]);

    const patientInputClass = (field) => `${inputCls} ${fieldErrors[field] ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-100' : ''}`;

    const setDobFromIso = (value) => {
        const [year = '', month = '', day = ''] = (value || '').split('-');
        setDobDay(day ? String(Number(day)) : '');
        setDobMonth(month ? String(Number(month)) : '');
        setDobYear(year);
    };

    const [
        reason,
        setReason,
    ] = useState('');

    const [sameDayResults, setSameDayResults] = useState([]);
    const [loadingSameDayResults, setLoadingSameDayResults] = useState(false);
    const [sameDayExaminations, setSameDayExaminations] = useState([]);
    const [loadingSameDayExaminations, setLoadingSameDayExaminations] = useState(false);

    /* =========================================================
       TOKEN
    ========================================================= */

    const getToken = () =>
        localStorage.getItem('token') ||
        sessionStorage.getItem(
            'token'
        );

    const applyPatientData = (patient) => {
        if (!patient) return;
        setCustomerId(patient.customerId || null);
        setPatientCode(patient.patientCode || '');
        setFullName(patient.fullName || '');
        setPhone(patient.phone || '');
        setEmail(patient.email || '');
        setDobFromIso(patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '');
        if (patient.gender) {
            const normalizedGender = patient.gender.toLowerCase();
            setGender(normalizedGender === 'male' || normalizedGender === 'female' ? normalizedGender : 'male');
        }
        setAddress(patient.address || '');
        setBloodType(patient.bloodType || '');
        setAllergyStatus(patient.allergyStatus || 'UNVERIFIED');
        setAllergies(Array.isArray(patient.allergies) ? patient.allergies : []);
        setAllergyInput('');
        setPhoneLookupDone(true);
        setPatientSearch('');
        setPatientSearchResults([]);
    };

    const fetchPatientDetail = async (id, signal) => {
        const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/receptionist/records/customers/${id}`,
            { headers: { Authorization: `Bearer ${getToken()}` }, signal }
        );
        if (!response.ok) throw new Error('Không thể tải đầy đủ hồ sơ bệnh nhân');
        const body = await response.json();
        return body?.data || body;
    };

    const openSameDayAttachment = async (url) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!response.ok) throw new Error('Không thể mở tệp kết quả');
            const blobUrl = URL.createObjectURL(await response.blob());
            window.open(blobUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (error) {
            toast.error(error.message || 'Không thể mở tệp kết quả');
        }
    };

    useEffect(() => {
        const query = patientSearch.trim();
        if (query.length < 2 || customerId) {
            setPatientSearchResults([]);
            setSearchingPatients(false);
            return undefined;
        }
        const controller = new AbortController();
        setSearchingPatients(true);
        const timer = setTimeout(() => {
            fetch(`${import.meta.env.VITE_API_URL}/api/receptionist/records/customers?search=${encodeURIComponent(query)}&page=0&size=8`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                signal: controller.signal,
            })
                .then(async response => {
                    if (!response.ok) throw new Error('Không thể tìm hồ sơ bệnh nhân');
                    return response.json();
                })
                .then(body => {
                    const results = body?.data?.content ?? body?.content ?? body?.result?.content ?? [];
                    setPatientSearchResults(Array.isArray(results) ? results : []);
                    setSearchingPatients(false);
                })
                .catch(error => {
                    if (error.name !== 'AbortError') {
                        setPatientSearchResults([]);
                        setSearchingPatients(false);
                    }
                });
        }, 350);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [patientSearch, customerId]);

    const selectPatientFromSearch = async (patient) => {
        try {
            setSearchingPatients(true);
            applyPatientData(await fetchPatientDetail(patient.customerId));
            setFieldErrors({});
        } catch (error) {
            toast.error(error.message || 'Không thể tải hồ sơ bệnh nhân');
        } finally {
            setSearchingPatients(false);
        }
    };

    useEffect(() => {
        if (!customerId) {
            setSameDayResults([]);
            return undefined;
        }
        const controller = new AbortController();
        setLoadingSameDayResults(true);
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/customer-visits/customers/${customerId}/same-day-paraclinical-results`, {
            headers: { Authorization: `Bearer ${getToken()}` },
            signal: controller.signal,
        })
            .then(async response => {
                if (!response.ok) throw new Error('Không thể tải kết quả cận lâm sàng trong ngày');
                return response.json();
            })
            .then(body => {
                const results = body?.data ?? body?.result ?? body ?? [];
                const normalized = Array.isArray(results) ? results : [];
                setSameDayResults(normalized);
                const completedIds = new Set(normalized.map(item => item.serviceId));
                setSelectedServiceIds(previous => previous.filter(id => !completedIds.has(id)));
            })
            .catch(error => {
                if (error.name !== 'AbortError') setSameDayResults([]);
            })
            .finally(() => setLoadingSameDayResults(false));
        return () => controller.abort();
    }, [customerId]);

    useEffect(() => {
        if (!customerId) {
            setSameDayExaminations([]);
            return undefined;
        }
        const controller = new AbortController();
        setLoadingSameDayExaminations(true);
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/customer-visits/customers/${customerId}/same-day-examination-services`, {
            headers: { Authorization: `Bearer ${getToken()}` },
            signal: controller.signal,
        })
            .then(async response => {
                if (!response.ok) throw new Error('Không thể tải dịch vụ khám đã đăng ký trong ngày');
                return response.json();
            })
            .then(body => {
                const items = body?.data ?? body?.result ?? body ?? [];
                const normalized = Array.isArray(items) ? items : [];
                setSameDayExaminations(normalized);
                const lockedIds = new Set(normalized.filter(item => item.locked).map(item => item.serviceId));
                setSelectedServiceIds(previous => previous.filter(id => !lockedIds.has(id)));
            })
            .catch(error => {
                if (error.name !== 'AbortError') setSameDayExaminations([]);
            })
            .finally(() => setLoadingSameDayExaminations(false));
        return () => controller.abort();
    }, [customerId]);

    useEffect(() => {
        if (customerId) return undefined;
        const normalizedPhone = phone.trim();
        if (!/^(\+84|0)\d{9,10}$/.test(normalizedPhone)) {
            setPhoneLookupDone(false);
            setResolvingPhone(false);
            return undefined;
        }
        const controller = new AbortController();
        setResolvingPhone(true);
        setPhoneLookupDone(false);
        const timer = setTimeout(() => {
            fetch(`${import.meta.env.VITE_API_URL}/api/receptionist/records/search-by-phone?phone=${encodeURIComponent(normalizedPhone)}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                signal: controller.signal,
            })
                .then(response => response.ok ? response.json() : [])
                .then(async body => {
                    const patients = Array.isArray(body) ? body : body?.data || body?.content || [];
                    const patient = patients.find(item => normalizePhone(item.phone) === normalizePhone(normalizedPhone));
                    if (patient?.customerId) applyPatientData(await fetchPatientDetail(patient.customerId, controller.signal));
                    else if (patient) applyPatientData(patient);
                    else setPhoneLookupDone(true);
                })
                .catch(error => {
                    if (error.name !== 'AbortError') {
                        setCustomerId(null);
                        setPhoneLookupDone(true);
                    }
                })
                .finally(() => setResolvingPhone(false));
        }, 450);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [phone, customerId]);

    /* =========================================================
       AUTOFILL PATIENT FROM URL
    ========================================================= */

    useEffect(() => {
        const queryPhone = searchParams.get('phone');
        const queryCustomerId = searchParams.get('customerId');

        if (queryCustomerId) {
            setCustomerId(queryCustomerId);
            // Fetch directly by customerId
            fetch(
                `${import.meta.env.VITE_API_URL}/api/receptionist/records/customers/${queryCustomerId}`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            )
            .then(async (response) => {
                if (!response.ok) throw new Error('Không thể tải hồ sơ bệnh nhân');
                return response.json();
            })
            .then((data) => applyPatientData(data?.data || data))
            .catch(error => {
                console.error(error);
                toast.error('Không thể tải thông tin bệnh nhân tái khám');
            });
            return; // Skip phone fetch since we already fetched by ID
        }

        if (!queryPhone) {
            return;
        }

        fetch(
            `${import.meta.env.VITE_API_URL}/api/receptionist/records/search-by-phone?phone=${encodeURIComponent(queryPhone)}`,
            { headers: { Authorization: `Bearer ${getToken()}` } }
        )
            .then(async (response) => {
                if (!response.ok) throw new Error('Không thể tải hồ sơ bệnh nhân');
                return response.json();
            })
            .then((data) => {
                const patients = Array.isArray(data) ? data : data?.data || data?.content || [];
                if (patients.length === 0) {
                    toast.error('Không tìm thấy hồ sơ bệnh nhân theo số điện thoại');
                    return;
                }
                const patient = patients.find(item => item.customerId === queryCustomerId) || patients[0];
                if (patient.customerId) {
                    return fetchPatientDetail(patient.customerId).then(applyPatientData);
                }
                applyPatientData(patient);
            })
            .catch((error) => {
                console.error(error);
                toast.error('Không thể tải thông tin bệnh nhân tái khám');
            });
    }, [searchParams]);

    /* =========================================================
       SERVICE TOGGLE
    ========================================================= */

    const toggleService = (
        service
    ) => {
        const sameDayExam = sameDayExaminations.find(item => item.serviceId === service.id && item.locked);
        if (sameDayExam) {
            toast.warn(sameDayExam.reason || 'Dịch vụ khám này đã được đăng ký trong ngày hôm nay.');
            return;
        }
        if (sameDayResults.some(result => result.serviceId === service.id)) {
            toast.warn('Dịch vụ này đã có kết quả được ký trong ngày và không cần mua lại.');
            return;
        }
        setSelectedServiceIds(
            (previous) => {
                if (previous.includes(service.id)) {
                    return previous.filter(
                        (id) =>
                            id !==
                            service.id
                    );
                }
                if (service.departmentType === 'EXAMINATION') {
                    const examinationIds = new Set(
                        services.filter(item => item.departmentType === 'EXAMINATION').map(item => item.id)
                    );
                    const replaced = previous.some(id => examinationIds.has(id));
                    if (replaced) {
                        setTimeout(() => toast.info('Mỗi phiếu chỉ có một dịch vụ khám. Dịch vụ khám trước đã được thay thế.'), 0);
                    }
                    return [
                        ...previous.filter(id => !examinationIds.has(id)),
                        service.id,
                    ];
                }
                return [...previous, service.id];
            }
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

                const matchDepartmentType = service.departmentType === activeServiceTab;

                return (
                    matchSearch &&
                    matchDepartmentType
                );
            }
        );

    /* =========================================================
       GROUP SERVICE
    ========================================================= */

    const groupOrder = activeServiceTab === 'EXAMINATION' ? EXAM_GROUPS : PARACLINICAL_GROUPS;
    const orderedGroups = groupOrder
        .map(groupName => [groupName, filteredServices.filter(service => serviceGroup(service) === groupName)])
        .filter(([, items]) => items.length > 0);

    useEffect(() => {
        if (orderedGroups.length === 0) return;
        const firstGroup = orderedGroups[0][0];
        setExpandedGroups(previous => ({ ...previous, [activeServiceTab]: previous[activeServiceTab] || firstGroup }));
    }, [activeServiceTab, searchTerm, orderedGroups.map(([name]) => name).join('|')]);

    /* =========================================================
       RESET
    ========================================================= */

    const handleReset = () => {
        setSelectedServiceIds([]);
        setSearchTerm('');
        setActiveServiceTab('EXAMINATION');
        setExpandedGroups({});

        setCustomerId(null);

        setFullName('');
        setPhone('');
        setDobFromIso('');
        setGender('male');
        setAddress('');
        setEmail('');
        setBloodType('');
        setAllergyStatus('UNVERIFIED');
        setAllergies([]);
        setAllergyInput('');
        setPatientCode('');
        setPhoneLookupDone(false);
        setResolvingPhone(false);
        setPatientSearch('');
        setPatientSearchResults([]);
        setSearchingPatients(false);
        setReason('');

        setValidationError('');
        setFieldErrors({});
    };

    const handleChooseDifferentPatient = () => {
        setCustomerId(null);
        setPatientCode('');
        setFullName('');
        setPhone('');
        setEmail('');
        setDobFromIso('');
        setGender('male');
        setAddress('');
        setBloodType('');
        setAllergyStatus('UNVERIFIED');
        setAllergies([]);
        setAllergyInput('');
        setPhoneLookupDone(false);
        setPatientSearch('');
        setPatientSearchResults([]);
        setFieldErrors({});
        setSameDayResults([]);
        setSameDayExaminations([]);
    };

    const addAllergy = () => {
        const value = allergyInput.trim().replace(/\s+/g, ' ');
        if (!value) return;
        if (value.length > 100) {
            setFieldErrors(previous => ({ ...previous, allergies: 'Mỗi dị ứng không được vượt quá 100 ký tự' }));
            return;
        }
        if (allergies.length >= 20) {
            setFieldErrors(previous => ({ ...previous, allergies: 'Chỉ được nhập tối đa 20 dị ứng' }));
            return;
        }
        if (!allergies.some(item => item.toLowerCase() === value.toLowerCase())) {
            setAllergies(previous => [...previous, value]);
        }
        setAllergyInput('');
        setFieldErrors(previous => ({ ...previous, allergies: undefined }));
    };

    /* =========================================================
       VALIDATION
    ========================================================= */

    const handleSubmit = () => {
        setValidationError('');
        if (searchingPatients) {
            setValidationError('Vui lòng chờ hệ thống tìm hồ sơ bệnh nhân.');
            document.getElementById('patient-search')?.focus();
            return;
        }
        if (resolvingPhone) {
            setFieldErrors(previous => ({ ...previous, phone: 'Vui lòng chờ hệ thống đối chiếu số điện thoại' }));
            document.getElementById('patient-phone')?.focus();
            return;
        }
        if (!customerId && patientSearch.trim().length >= 2 && patientSearchResults.length > 0) {
            setValidationError('Có hồ sơ phù hợp. Vui lòng chọn đúng bệnh nhân hoặc xóa nội dung tìm kiếm để xác nhận tạo hồ sơ mới.');
            document.getElementById('patient-search')?.focus();
            return;
        }
        const errors = {};
        const normalizedName = fullName.trim().replace(/\s+/g, ' ');
        if (!normalizedName) errors.fullName = t('validation.fullNameRequired');
        else if (normalizedName.length < 2 || normalizedName.length > 100) errors.fullName = 'Họ tên phải có từ 2 đến 100 ký tự';
        else if (/\d/.test(normalizedName)) errors.fullName = 'Họ tên không được chứa chữ số';
        if (phone.trim() && !/^(\+84|0)\d{9,10}$/.test(phone.trim())) errors.phone = 'Số điện thoại Việt Nam không hợp lệ';
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Email không hợp lệ';
        const hasDobPart = Boolean(dobDay || dobMonth || dobYear);
        if (hasDobPart && !dob) errors.dob = 'Ngày sinh không hợp lệ';
        else if (dob && new Date(dob) >= new Date(new Date().toDateString())) errors.dob = 'Ngày sinh phải là ngày trong quá khứ';
        else if (!phone.trim() && !email.trim() && !dob) errors.dob = 'Ngày sinh là bắt buộc khi chưa có số điện thoại và email';
        if (address.length > 255) errors.address = 'Địa chỉ không được vượt quá 255 ký tự';
        if (allergyStatus === 'REPORTED' && allergies.length === 0) errors.allergies = 'Vui lòng nhập ít nhất một dị ứng';
        if (selectedServiceIds.length === 0) errors.services = t('validation.serviceRequired');
        if (selectedServices.filter(service => service.departmentType === 'EXAMINATION').length > 1) {
            errors.services = 'Mỗi lượt khám chỉ được chọn 1 dịch vụ khám bệnh.';
        }
        setFieldErrors(errors);
        const firstField = Object.keys(errors)[0];
        if (firstField) {
            if (firstField === 'services') setValidationError(errors[firstField]);
            setTimeout(() => document.getElementById(`patient-${firstField}`)?.focus(), 0);
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
            guestEmail: email.trim() || null,
            guestBloodType: bloodType || null,
            allergyStatus,
            guestAllergies: allergyStatus === 'REPORTED' ? allergies : [],
            updatePatientProfile: true,
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

                                        <div className="relative">
                                            <label className={labelCls}>Tìm hồ sơ bệnh nhân</label>
                                            <div className="relative">
                                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    id="patient-search"
                                                    type="text"
                                                    value={patientSearch}
                                                    onChange={(event) => setPatientSearch(event.target.value)}
                                                    disabled={Boolean(customerId)}
                                                    placeholder="SĐT, email, mã BN hoặc họ tên..."
                                                    className={`${inputCls} pl-9 disabled:bg-gray-50 disabled:text-gray-400`}
                                                />
                                            </div>
                                            {!customerId && patientSearch.trim().length >= 2 && (
                                                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
                                                    {searchingPatients ? (
                                                        <p className="px-3 py-4 text-center text-xs text-gray-400">Đang tìm hồ sơ...</p>
                                                    ) : patientSearchResults.length > 0 ? patientSearchResults.map(patient => (
                                                        <button
                                                            key={patient.customerId}
                                                            type="button"
                                                            onClick={() => selectPatientFromSearch(patient)}
                                                            className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-gray-50"
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="text-sm font-semibold text-gray-800">{patient.fullName}</span>
                                                                <span className="shrink-0 text-[11px] font-medium text-gray-500">{patient.patientCode}</span>
                                                            </div>
                                                            <p className="mt-1 text-[11px] text-gray-500">
                                                                {[patient.phone, patient.email, patient.dateOfBirth].filter(Boolean).join(' · ') || 'Chưa có thông tin liên hệ'}
                                                            </p>
                                                        </button>
                                                    )) : (
                                                        <p className="px-3 py-4 text-center text-xs text-gray-400">Không tìm thấy hồ sơ. Có thể nhập bệnh nhân mới bên dưới.</p>
                                                    )}
                                                </div>
                                            )}
                                            <p className="mt-1 text-[11px] text-gray-400">Luôn chọn đúng hồ sơ nếu đã tồn tại để giữ đầy đủ lịch sử khám.</p>
                                        </div>

                                        {(customerId || phoneLookupDone || resolvingPhone) && (
                                            <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${customerId ? 'border-emerald-200 bg-emerald-50' : 'border-blue-100 bg-blue-50'}`}>
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <UserCheck size={17} className={customerId ? 'text-emerald-600' : 'text-blue-500'} />
                                                    <div className="min-w-0">
                                                        <p className={`text-xs font-semibold ${customerId ? 'text-emerald-800' : 'text-blue-800'}`}>
                                                            {resolvingPhone ? 'Đang đối chiếu hồ sơ...' : customerId ? 'Đã tìm thấy hồ sơ bệnh nhân' : 'Bệnh nhân mới'}
                                                        </p>
                                                        {customerId && <p className="mt-0.5 text-[11px] text-emerald-700">{patientCode || customerId}</p>}
                                                    </div>
                                                </div>
                                                {customerId && (
                                                    <button type="button" onClick={handleChooseDifferentPatient} className="shrink-0 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900">
                                                        Chọn bệnh nhân khác
                                                    </button>
                                                )}
                                            </div>
                                        )}

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
                                                id="patient-fullName"
                                                type="text"
                                                maxLength={100}
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
                                                    setFieldErrors(previous => ({ ...previous, fullName: undefined }));
                                                }}
                                                placeholder={t(
                                                    'createTicket.patientInfo.fullNamePlaceholder'
                                                )}
                                                className={patientInputClass('fullName')}
                                            />
                                            {fieldErrors.fullName && <p className="mt-1 text-xs text-red-500">{fieldErrors.fullName}</p>}
                                        </div>

                                        {/* PHONE + DOB */}

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                            <div>
                                                <label className={labelCls}>
                                                    {t(
                                                        'createTicket.patientInfo.phone'
                                                    )}

                                                    <span className="ml-1 text-[11px] text-gray-400">(không bắt buộc)</span>
                                                </label>

                                                <input
                                                    id="patient-phone"
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
                                                    setFieldErrors(previous => ({ ...previous, phone: undefined }));
                                                    }}
                                                    placeholder={t(
                                                        'createTicket.patientInfo.phonePlaceholder'
                                                    )}
                                                    className={patientInputClass('phone')}
                                                />
                                                {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
                                            </div>

                                            <div>
                                                <label className={labelCls}>
                                                    {t(
                                                        'createTicket.patientInfo.dob'
                                                    )}
                                                    {!phone.trim() && !email.trim() && <span className="ml-1 text-red-400">*</span>}
                                                </label>
                                                <div id="patient-dob" tabIndex={-1} className="grid grid-cols-[1fr_1fr_1.35fr] gap-2">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={2}
                                                        value={dobDay}
                                                        onChange={(event) => {
                                                            setDobDay(event.target.value.replace(/\D/g, '').slice(0, 2));
                                                            setFieldErrors(previous => ({ ...previous, dob: undefined }));
                                                        }}
                                                        placeholder="Ngày"
                                                        aria-label="Ngày sinh"
                                                        className={patientInputClass('dob')}
                                                    />
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={2}
                                                        value={dobMonth}
                                                        onChange={(event) => {
                                                            setDobMonth(event.target.value.replace(/\D/g, '').slice(0, 2));
                                                            setFieldErrors(previous => ({ ...previous, dob: undefined }));
                                                        }}
                                                        placeholder="Tháng"
                                                        aria-label="Tháng sinh"
                                                        className={patientInputClass('dob')}
                                                    />
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={4}
                                                        value={dobYear}
                                                        onChange={(event) => {
                                                            setDobYear(event.target.value.replace(/\D/g, '').slice(0, 4));
                                                            setFieldErrors(previous => ({ ...previous, dob: undefined }));
                                                        }}
                                                        placeholder="Năm"
                                                        aria-label="Năm sinh"
                                                        className={patientInputClass('dob')}
                                                    />
                                                </div>
                                                <p className="mt-1 text-[11px] text-gray-400">Nhập trực tiếp ngày, tháng và năm; không cần cuộn lịch.</p>
                                                {fieldErrors.dob && <p className="mt-1 text-xs text-red-500">{fieldErrors.dob}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelCls}>Email <span className="ml-1 text-[11px] text-gray-400">(không bắt buộc)</span></label>
                                            <input
                                                id="patient-email"
                                                type="email"
                                                maxLength={255}
                                                value={email}
                                                onChange={(event) => {
                                                    setEmail(event.target.value);
                                                    setFieldErrors(previous => ({ ...previous, email: undefined }));
                                                }}
                                                placeholder="Ví dụ: nguyenthianh@example.com"
                                                className={patientInputClass('email')}
                                            />
                                            {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
                                            {!phone.trim() && !email.trim() && (
                                                <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-amber-700">
                                                    Hồ sơ khách chưa có thông tin đăng nhập. Hệ thống sẽ dùng mã bệnh nhân; khi cần tài khoản, lễ tân phải bổ sung SĐT hoặc email trước khi bệnh nhân xác minh OTP.
                                                </p>
                                            )}
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
                                                <label className={labelCls}>Nhóm máu</label>
                                                <select id="patient-bloodType" value={bloodType} onChange={(event) => setBloodType(event.target.value)} className={inputCls}>
                                                    <option value="">Chưa xác định</option>
                                                    {BLOOD_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelCls}>{t('createTicket.patientInfo.address')}</label>
                                            <input
                                                id="patient-address"
                                                type="text"
                                                maxLength={255}
                                                value={address}
                                                onChange={(event) => {
                                                    setAddress(event.target.value);
                                                    setFieldErrors(previous => ({ ...previous, address: undefined }));
                                                }}
                                                placeholder={t('createTicket.patientInfo.addressPlaceholder')}
                                                className={patientInputClass('address')}
                                            />
                                            {fieldErrors.address && <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p>}
                                        </div>

                                        <div id="patient-allergies" tabIndex={-1} className={`rounded-xl border p-3 ${fieldErrors.allergies ? 'border-red-400 bg-red-50/40' : 'border-gray-200'}`}>
                                            <label className="block text-xs font-semibold text-gray-700">Thông tin dị ứng</label>
                                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                {[
                                                    ['UNVERIFIED', 'Chưa xác minh'],
                                                    ['NONE_REPORTED', 'Không ghi nhận'],
                                                    ['REPORTED', 'Có dị ứng'],
                                                ].map(([value, label]) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => {
                                                            setAllergyStatus(value);
                                                            if (value !== 'REPORTED') setAllergyInput('');
                                                            setFieldErrors(previous => ({ ...previous, allergies: undefined }));
                                                        }}
                                                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${allergyStatus === value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                            {allergyStatus === 'REPORTED' && (
                                                <div className="mt-3">
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={allergyInput}
                                                            maxLength={100}
                                                            onChange={(event) => setAllergyInput(event.target.value)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter') {
                                                                    event.preventDefault();
                                                                    addAllergy();
                                                                }
                                                            }}
                                                            placeholder="Nhập dị ứng rồi nhấn Enter"
                                                            className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                                                        />
                                                        <button type="button" onClick={addAllergy} className="rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700">Thêm</button>
                                                    </div>
                                                    {allergies.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {allergies.map(item => (
                                                                <span key={item.toLowerCase()} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                                                                    {item}
                                                                    <button type="button" onClick={() => setAllergies(previous => previous.filter(value => value !== item))} aria-label={`Xóa ${item}`}><X size={12}/></button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {fieldErrors.allergies && <p className="mt-1 text-xs text-red-500">{fieldErrors.allergies}</p>}
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

                                        {/* SEARCH + SERVICE TABS */}

                                        <div className="mt-4 space-y-3">

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

                                            <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
                                                {[
                                                    ['EXAMINATION', 'Khám bệnh'],
                                                    ['PARACLINICAL', 'Cận lâm sàng'],
                                                ].map(([type, label]) => {
                                                    const count = services.filter(service => service.departmentType === type).length;
                                                    return (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveServiceTab(type);
                                                                setSearchTerm('');
                                                            }}
                                                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${activeServiceTab === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                                        >
                                                            {label} · {count}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {activeServiceTab === 'EXAMINATION' && (
                                            <div className="mt-3 flex gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800">
                                                <Info size={16} className="mt-0.5 shrink-0" />
                                                <p><strong>Lưu ý:</strong> Mỗi phiếu chỉ được chọn tối đa 01 dịch vụ khám bệnh. Bệnh nhân có thể tạo phiếu mới cho dịch vụ khám khác, nhưng không thể đăng ký lại dịch vụ khám đã chọn trong cùng ngày.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* =================================================
                                        SERVICE LIST
                                    ================================================= */}

                                    {customerId && (loadingSameDayResults || sameDayResults.length > 0) && (
                                        <div className="mx-5 mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                                            <p className="text-sm font-semibold text-blue-900">
                                                Kết quả cận lâm sàng đã thực hiện hôm nay
                                            </p>
                                            {loadingSameDayResults ? (
                                                <p className="mt-1 text-xs text-blue-700">Đang tải kết quả...</p>
                                            ) : (
                                                <div className="mt-2 space-y-2">
                                                    {sameDayResults.map(result => (
                                                        <div key={result.testRequestId} className="rounded-lg border border-blue-100 bg-white px-3 py-2">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <span className="text-xs font-semibold text-slate-800">{result.serviceName}</span>
                                                                <span className="text-[11px] font-medium text-blue-700">Đã có kết quả · Không thu lại</span>
                                                            </div>
                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                {result.sourceVisitCode} · {result.performingDepartmentName || 'Phòng cận lâm sàng'}
                                                            </p>
                                                            {result.conclusion && <p className="mt-1 text-xs text-slate-700">{result.conclusion}</p>}
                                                            {result.attachments?.length > 0 && (
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {result.attachments.map(file => (
                                                                        <button key={file.attachmentId} type="button" onClick={() => openSameDayAttachment(file.url)} className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 px-2 py-1 text-[11px] font-medium text-blue-700">
                                                                            <FileText size={12}/>{file.originalName || 'Xem tệp'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex-1 min-h-0 p-5">

                                        {loadingSvc ? (
                                            <div className="flex h-40 items-center justify-center">

                                                <p className="text-sm text-gray-400">
                                                    {t(
                                                        'createTicket.loading'
                                                    )}
                                                </p>
                                            </div>
                                        ) : orderedGroups.length > 0 ? (
                                            <div className="max-h-[390px] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                                                {orderedGroups.map(([groupName, servicesGroup]) => {
                                                    const open = expandedGroups[activeServiceTab] === groupName;
                                                    return (
                                                        <section key={groupName} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedGroups(previous => ({
                                                                    ...previous,
                                                                    [activeServiceTab]: open ? null : groupName,
                                                                }))}
                                                                className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left"
                                                            >
                                                                <span className="text-sm font-bold text-gray-700">{groupName} · {servicesGroup.length} dịch vụ</span>
                                                                <ChevronDown size={16} className={`text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
                                                            </button>
                                                            {open && (
                                                                <div className="divide-y divide-gray-100 px-4">
                                                                    {servicesGroup.map(service => {
                                                                        const checked = selectedServiceIds.includes(service.id);
                                                                        const completedToday = sameDayResults.some(result => result.serviceId === service.id);
                                                                        const registeredToday = sameDayExaminations.find(item => item.serviceId === service.id && item.locked);
                                                                        const disabled = completedToday || !!registeredToday;
                                                                        return (
                                                                            <label key={service.id} className={`flex min-h-[68px] items-start gap-3 py-3 transition ${disabled ? 'cursor-not-allowed bg-gray-50 opacity-70' : 'cursor-pointer hover:bg-gray-50'} ${checked ? 'bg-primary-50/50' : ''}`}>
                                                                                <input
                                                                                    type={activeServiceTab === 'EXAMINATION' ? 'radio' : 'checkbox'}
                                                                                    name={activeServiceTab === 'EXAMINATION' ? 'examination-service' : undefined}
                                                                                    checked={checked}
                                                                                    disabled={disabled}
                                                                                    onChange={() => toggleService(service)}
                                                                                    className="mt-1 h-4 w-4 shrink-0 accent-gray-900"
                                                                                />
                                                                                <div className="min-w-0 flex-1">
                                                                                    <p className="text-sm font-semibold text-gray-800">{service.name}</p>
                                                                                    {registeredToday && (
                                                                                        <p className="mt-1 text-[11px] font-semibold text-amber-700">
                                                                                            {registeredToday.reason || `Đã đăng ký hôm nay · ${registeredToday.visitCode}`}
                                                                                        </p>
                                                                                    )}
                                                                                    {completedToday && (
                                                                                        <p className="mt-1 text-[11px] font-semibold text-blue-700">Đã có kết quả hôm nay · Không cần mua lại</p>
                                                                                    )}
                                                                                    {service.description && <p className="mt-1 line-clamp-2 text-xs text-gray-400">{service.description}</p>}
                                                                                    {activeServiceTab === 'PARACLINICAL' && service.capabilityName && (
                                                                                        <p className="mt-1 text-[11px] text-gray-500">Năng lực: {service.capabilityName}</p>
                                                                                    )}
                                                                                </div>
                                                                                <p className="shrink-0 pl-2 text-sm font-bold text-gray-900">{fmt(service.price)}</p>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </section>
                                                    );
                                                })}
                                                {loadingSameDayExaminations && activeServiceTab === 'EXAMINATION' && (
                                                    <p className="text-xs text-gray-400">Đang kiểm tra dịch vụ đã đăng ký hôm nay...</p>
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

                                <p className="text-xs text-gray-400">Dịch vụ đã chọn</p>
                                <div className="mt-0.5 flex flex-wrap gap-x-4 text-sm font-semibold text-gray-800">
                                    <span>Khám bệnh: {selectedServices.filter(service => service.departmentType === 'EXAMINATION').length}/1</span>
                                    <span>Cận lâm sàng: {selectedServices.filter(service => service.departmentType === 'PARACLINICAL').length}</span>
                                    <span>Tổng: {selectedServiceIds.length}</span>
                                </div>
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
                                submitting || resolvingPhone || searchingPatients
                            }
                            className="h-10 shrink-0 rounded-xl bg-gray-900 px-7 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {resolvingPhone || searchingPatients
                                ? 'Đang đối chiếu hồ sơ...'
                                : submitting
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

                            email,

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

                            bloodType: BLOOD_TYPES.find(([value]) => value === bloodType)?.[1] || 'Chưa xác định',

                            allergyStatus,

                            allergies,

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

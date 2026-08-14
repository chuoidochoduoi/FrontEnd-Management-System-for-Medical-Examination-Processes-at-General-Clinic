// src/pages/doctor/ExaminationPage.jsx

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ChevronRight,
    Search,
    X,
} from 'lucide-react';

import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import { useInProgressPatient } from '@/hooks/useInProgressPatient';
import { useDiagnosis, useTagSearch } from '@/hooks/useDiagnosis';
import { useLabServices } from '@/hooks/useLabServices';

import { toast } from 'react-toastify';
import { ROUTES } from '@/constants/routes';

/* =========================================================
   HELPERS
========================================================= */

const get = (key) =>
    localStorage.getItem(key) ||
    sessionStorage.getItem(key);

const authHeader = () => ({
    Authorization: `Bearer ${get('token')}`,
});

const sectionTitle =
    'text-sm font-semibold text-gray-900';

const inputCls =
    'w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-100';

/* =========================================================
   SEARCH DROPDOWN
========================================================= */

function SearchDropdown({
                            query,
                            results,
                            loading,
                            onSearch,
                            onAdd,
                            placeholder,
                            addLabel,
                            showAddButton = true,
                        }) {
    const ref = useRef(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleOutside = (event) => {
            if (
                ref.current &&
                !ref.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener(
            'mousedown',
            handleOutside
        );

        return () =>
            document.removeEventListener(
                'mousedown',
                handleOutside
            );
    }, []);

    return (
        <div
            ref={ref}
            className="relative flex gap-2"
        >
            <div className="relative flex-1">
                <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                    type="text"
                    value={query}
                    placeholder={placeholder}
                    onChange={(event) => {
                        onSearch(
                            event.target.value
                        );

                        setOpen(true);
                    }}
                    onFocus={() =>
                        setOpen(true)
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-gray-400"
                />

                {open &&
                    results.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">

                            {loading && (
                                <p className="px-3 py-2 text-xs text-gray-400">
                                    Đang tìm...
                                </p>
                            )}

                            {results.map(
                                (
                                    result,
                                    index
                                ) => (
                                    <button
                                        key={
                                            result.code ??
                                            result.id ??
                                            index
                                        }
                                        type="button"
                                        onMouseDown={() => {
                                            onAdd(
                                                result
                                            );

                                            setOpen(
                                                false
                                            );
                                        }}
                                        className="block w-full border-b border-gray-100 px-3 py-2.5 text-left text-sm transition last:border-b-0 hover:bg-gray-50"
                                    >
                                        {result.code && (
                                            <span className="mr-2 font-mono text-xs text-gray-400">
                                                {
                                                    result.code
                                                }
                                            </span>
                                        )}

                                        {result.name ??
                                            result.label ??
                                            result.codeName ??
                                            result.title}
                                    </button>
                                )
                            )}
                        </div>
                    )}
            </div>

            {showAddButton && (
                <button
                    type="button"
                    onMouseDown={() => {
                        if (
                            query.trim()
                        ) {
                            onAdd({
                                id:
                                    Date.now(),
                                name:
                                query,
                            });
                        }
                    }}
                    className="h-10 whitespace-nowrap rounded-lg border border-gray-200 px-3 text-sm text-gray-600 transition hover:bg-gray-50"
                >
                    {addLabel}
                </button>
            )}
        </div>
    );
}

/* =========================================================
   TAG LIST
========================================================= */

function TagList({
                     items,
                     labelKey = 'name',
                     onRemove,
                     codeKey,
                 }) {
    if (!items?.length) {
        return null;
    }

    return (
        <div className="mt-2 flex flex-wrap gap-2">
            {items.map((item) => (
                <div
                    key={
                        item.code ??
                        item.id
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700"
                >
                    <span>
                        {codeKey &&
                            item[
                                codeKey
                                ] && (
                                <span className="mr-1.5 font-mono text-gray-400">
                                    {
                                        item[
                                            codeKey
                                            ]
                                    }
                                </span>
                            )}

                        {
                            item[
                                labelKey
                                ]
                        }
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            onRemove(
                                item.code ??
                                item.id
                            )
                        }
                        className="text-gray-300 transition hover:text-red-500"
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}
        </div>
    );
}

/* =========================================================
   STATUS
========================================================= */

const getTestStatus = (status) => {
    switch (status) {
        case 'COMPLETED':
            return {
                text: 'Đã có kết quả',
                cls:
                    'bg-green-50 text-green-600 border-green-100',
            };

        case 'IN_PROGRESS':
            return {
                text: 'Đang xử lý',
                cls:
                    'bg-blue-50 text-blue-600 border-blue-100',
            };

        case 'WAITING_FOR_RESULT':
            return {
                text: 'Chờ kết quả',
                cls:
                    'bg-gray-100 text-gray-600 border-gray-200',
            };

        case 'CANCELLED':
            return {
                text: 'Đã hủy',
                cls:
                    'bg-red-50 text-red-500 border-red-100',
            };

        case 'PENDING':
        default:
            return {
                text: 'Chờ thực hiện',
                cls:
                    'bg-gray-100 text-gray-500 border-gray-200',
            };
    }
};

/* =========================================================
   MAIN
========================================================= */

export default function ExaminationPage() {
    const systemRole =
        localStorage.getItem(
            'systemRole'
        ) ||
        sessionStorage.getItem(
            'systemRole'
        );

    const isNurse =
        systemRole === 'NURSE';

    const { departmentId } =
        useParams();

    const navigate =
        useNavigate();

    const { t: tDoctor } =
        useTranslation('doctor');

    const { t: tCommon } =
        useTranslation('common');

    const {
        ticket: examination,
        loading,
        error: loadError,
        reload,
    } = useInProgressPatient(
        departmentId
    );

    /* =====================================================
       FORM STATE
    ===================================================== */

    const [
        symptoms,
        setSymptoms,
    ] = useState('');

    const [
        examResult,
        setExamResult,
    ] = useState('');

    const [
        notes,
        setNotes,
    ] = useState('');

    const [
        heartRate,
        setHeartRate,
    ] = useState('');

    const [
        bloodPressure,
        setBloodPressure,
    ] = useState('');

    const [
        temperature,
        setTemperature,
    ] = useState('');

    const [
        height,
        setHeight,
    ] = useState('');

    const [
        weight,
        setWeight,
    ] = useState('');

    const diagnosis =
        useDiagnosis([]);

    const referrals =
        useTagSearch(
            [],
            '/api/doctor/specialties'
        );

    const labOrders =
        useTagSearch(
            [],
            '/api/doctor/lab-tests'
        );

    const {
        services: labServices,
        loading:
            loadingLabServices,
    } = useLabServices();

    const [
        labSelect,
        setLabSelect,
    ] = useState('');

    /* =====================================================
       INITIAL RECORD DATA
    ===================================================== */

    useEffect(() => {
        if (
            !examination
                ?.medicalRecord
        ) {
            return;
        }

        const mr =
            examination.medicalRecord;

        setSymptoms(
            mr.chiefComplaint ??
            ''
        );

        setExamResult(
            mr.clinicalFindings ??
            ''
        );

        setNotes(
            mr.conclusion ?? ''
        );

        if (mr.vitalSigns) {
            setHeartRate(
                mr.vitalSigns
                    .heartRate
                    ?.toString() ??
                ''
            );

            setBloodPressure(
                mr.vitalSigns
                    .bloodPressure ??
                ''
            );

            setTemperature(
                mr.vitalSigns
                    .temperature
                    ?.toString() ??
                ''
            );

            setHeight(
                mr.vitalSigns
                    .height
                    ?.toString() ??
                ''
            );

            setWeight(
                mr.vitalSigns
                    .weight
                    ?.toString() ??
                ''
            );
        }

        if (
            Array.isArray(
                mr.icdSelections
            )
        ) {
            diagnosis.setSelected(
                mr.icdSelections.map(
                    (item) => ({
                        code:
                        item.code,
                        label:
                            item.codeName ??
                            item.name,
                    })
                )
            );
        }
    }, [examination]);

    /* =====================================================
       PRESCRIPTION
    ===================================================== */

    const [
        prescriptionItems,
        setPrescriptionItems,
    ] = useState([
        {
            id: Date.now(),
            name: '',
            quantity: '0',
            unit: 'viên',
            note: '',
            frequencyPerDay:
                '',
        },
    ]);

    const [
        showPrescription,
        setShowPrescription,
    ] = useState(true);

    const [
        prescriptionAdvice,
        setPrescriptionAdvice,
    ] = useState(
        'Sử dụng thuốc đúng theo đơn. Liên hệ bác sĩ nếu có dấu hiệu bất thường.'
    );

    const [
        medicineSearchRowId,
        setMedicineSearchRowId,
    ] = useState(null);

    const [
        medicineSuggestions,
        setMedicineSuggestions,
    ] = useState([]);

    const [
        medicineSearching,
        setMedicineSearching,
    ] = useState(false);

    const activeMedicineName =
        prescriptionItems.find(
            (item) =>
                item.id ===
                medicineSearchRowId
        )?.name ?? '';

    useEffect(() => {
        if (
            !medicineSearchRowId
        ) {
            setMedicineSuggestions(
                []
            );

            return undefined;
        }

        const timer =
            setTimeout(
                async () => {
                    setMedicineSearching(
                        true
                    );

                    try {
                        const apiBase =
                            import.meta
                                .env
                                .VITE_API_URL ||
                            'http://localhost:8080';

                        const res =
                            await fetch(
                                `${apiBase}/api/v1/medicines?keyword=${encodeURIComponent(
                                    activeMedicineName
                                )}&size=20`,
                                {
                                    headers:
                                        authHeader(),
                                }
                            );

                        if (
                            !res.ok
                        ) {
                            throw new Error(
                                'Không thể tải danh mục thuốc'
                            );
                        }

                        const body =
                            await res.json();

                        setMedicineSuggestions(
                            body.data ??
                            body.result ??
                            body ??
                            []
                        );
                    } catch {
                        setMedicineSuggestions(
                            []
                        );
                    } finally {
                        setMedicineSearching(
                            false
                        );
                    }
                },
                250
            );

        return () =>
            clearTimeout(timer);
    }, [
        medicineSearchRowId,
        activeMedicineName,
    ]);

    const selectMedicine = (
        rowId,
        medicine
    ) => {
        setPrescriptionItems(
            (items) =>
                items.map(
                    (item) =>
                        item.id ===
                        rowId
                            ? {
                                ...item,

                                name:
                                medicine.name,

                                unit:
                                    medicine.defaultUnit ||
                                    item.unit ||
                                    'viên',

                                note:
                                    medicine.defaultUsage ||
                                    item.note,

                                frequencyPerDay:
                                    medicine.defaultFrequencyPerDay ??
                                    item.frequencyPerDay,
                            }
                            : item
                )
        );

        setMedicineSearchRowId(
            null
        );
    };

    const addPrescriptionRow =
        () => {
            setPrescriptionItems(
                (items) => [
                    ...items,

                    {
                        id:
                            Date.now(),
                        name: '',
                        quantity:
                            '0',
                        unit:
                            'viên',
                        note: '',
                        frequencyPerDay:
                            '',
                    },
                ]
            );
        };

    const updatePrescription = (
        id,
        field,
        value
    ) => {
        setPrescriptionItems(
            (items) =>
                items.map(
                    (item) =>
                        item.id === id
                            ? {
                                ...item,
                                [field]:
                                value,
                            }
                            : item
                )
        );
    };

    const removePrescription = (
        id
    ) => {
        setPrescriptionItems(
            (items) =>
                items.filter(
                    (item) =>
                        item.id !== id
                )
        );
    };

    /* =====================================================
       PAGE STATE
    ===================================================== */

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        completing,
        setCompleting,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState('');

    const [
        testRequests,
        setTestRequests,
    ] = useState([]);

    const [
        visitTestRequests,
        setVisitTestRequests,
    ] = useState([]);

    useEffect(() => {
        const visitId = examination?.visitId;
        if (!visitId) {
            setVisitTestRequests([]);
            return undefined;
        }

        const controller = new AbortController();
        const loadVisitTestRequests = async () => {
            try {
                const apiBase =
                    import.meta.env.VITE_API_URL || 'http://localhost:8080';
                const response = await fetch(
                    `${apiBase}/api/v1/test-requests/visit/${visitId}`,
                    {
                        headers: authHeader(),
                        signal: controller.signal,
                    }
                );
                if (!response.ok) {
                    throw new Error('Không thể tải các chỉ định cận lâm sàng của lượt khám.');
                }
                const body = await response.json();
                const data = body.data ?? body.result ?? body;
                setVisitTestRequests(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setVisitTestRequests([]);
                }
            }
        };

        loadVisitTestRequests();
        return () => controller.abort();
    }, [examination?.visitId]);

    const activeVisitTestRequests = visitTestRequests.filter(
        (request) => request.status !== 'CANCELLED'
    );
    const visitTestRequestByServiceId = new Map(
        activeVisitTestRequests.map((request) => [request.serviceId, request])
    );
    const unavailableLabServiceIds = new Set(
        activeVisitTestRequests
            .filter(
                (request) =>
                    request.linkedToExamination || request.status === 'COMPLETED'
            )
            .map((request) => request.serviceId)
            .filter(Boolean)
    );

    const [
        recordVersion,
        setRecordVersion,
    ] = useState(null);

    const [
        previousRecords,
        setPreviousRecords,
    ] = useState([]);

    const [
        previousRecordDetail,
        setPreviousRecordDetail,
    ] = useState(null);

    /* =====================================================
       FOLLOW UP
    ===================================================== */

    const [
        followUpNote,
        setFollowUpNote,
    ] = useState('');

    const [
        followUpDate,
        setFollowUpDate,
    ] = useState('');

    const [
        creatingFollowUp,
        setCreatingFollowUp,
    ] = useState(false);

    const [
        followUpServices,
        setFollowUpServices,
    ] = useState([]);

    const [
        followUpServiceId,
        setFollowUpServiceId,
    ] = useState('');

    /* =====================================================
       FETCH CURRENT RECORD
    ===================================================== */

    useEffect(() => {
        if (
            !examination?.recordId
        ) {
            return;
        }

        const fetchTestRequests =
            async () => {
                try {
                    const apiBase =
                        import.meta.env
                            .VITE_API_URL ||
                        'http://localhost:8080';

                    const token =
                        get('token');

                    const res =
                        await fetch(
                            `${apiBase}/api/v1/medical-records/${examination.recordId}`,
                            {
                                headers:
                                    token
                                        ? {
                                            Authorization: `Bearer ${token}`,
                                        }
                                        : undefined,
                            }
                        );

                    if (!res.ok) {
                        return;
                    }

                    const data =
                        await res.json();

                    const record =
                        data.data ??
                        data.result ??
                        data;

                    setRecordVersion(
                        record.version ??
                        null
                    );

                    setTestRequests(
                        record.testRequests ??
                        []
                    );

                    setSymptoms(
                        record.chiefComplaint ??
                        ''
                    );

                    setExamResult(
                        record.clinicalFindings ??
                        ''
                    );

                    setNotes(
                        record.conclusion ??
                        ''
                    );

                    setPrescriptionAdvice(
                        record.patientInstruction ||
                        record.prescriptionNote ||
                        'Sử dụng thuốc đúng theo đơn. Liên hệ bác sĩ nếu có dấu hiệu bất thường.'
                    );

                    setFollowUpNote(
                        record.followUpNote ??
                        ''
                    );

                    const vitalSigns =
                        record.vitalSigns;

                    setHeartRate(
                        vitalSigns?.heartRate?.toString() ??
                        ''
                    );

                    setBloodPressure(
                        vitalSigns?.bloodPressure ??
                        ''
                    );

                    setTemperature(
                        vitalSigns?.temperature?.toString() ??
                        ''
                    );

                    setHeight(
                        vitalSigns?.height?.toString() ??
                        ''
                    );

                    setWeight(
                        vitalSigns?.weight?.toString() ??
                        ''
                    );

                    diagnosis.setSelected(
                        (
                            record.icdSelections ??
                            []
                        ).map(
                            (
                                item
                            ) => ({
                                code:
                                item.code,

                                label:
                                    item.codeName ??
                                    item.name ??
                                    item.code,
                            })
                        )
                    );

                    const savedMedicines =
                        Array.from(
                            record.prescriptionItems ??
                            []
                        );

                    setPrescriptionItems(
                        savedMedicines.length >
                        0
                            ? savedMedicines.map(
                                (
                                    medicine,
                                    index
                                ) => ({
                                    id:
                                        medicine.prescriptionItemId ??
                                        `saved-${index}`,

                                    name:
                                        medicine.medicineName ??
                                        '',

                                    quantity:
                                        medicine.quantity?.toString() ??
                                        '',

                                    unit:
                                        medicine.unit ||
                                        'viên',

                                    note:
                                        medicine.note ??
                                        '',

                                    frequencyPerDay:
                                        medicine.frequencyPerDay?.toString() ??
                                        '',
                                })
                            )
                            : [
                                {
                                    id:
                                        Date.now(),
                                    name: '',
                                    quantity:
                                        '0',
                                    unit:
                                        'viên',
                                    note: '',
                                    frequencyPerDay:
                                        '',
                                },
                            ]
                    );
                } catch (
                    err
                    ) {
                    console.error(
                        'Fetch test requests failed:',
                        err
                    );
                }
            };

        fetchTestRequests();
    }, [
        examination?.recordId,
        examination
            ?.medicalRecord
            ?.version,
    ]);

    /* =====================================================
       PREVIOUS HISTORY
    ===================================================== */

    useEffect(() => {
        if (
            !examination?.recordId
        ) {
            setPreviousRecords(
                []
            );

            return;
        }

        const loadPreviousRecords =
            async () => {
                try {
                    const apiBase =
                        import.meta.env
                            .VITE_API_URL ||
                        'http://localhost:8080';

                    const response =
                        await fetch(
                            `${apiBase}/api/v1/medical-records/${examination.recordId}/previous-history`,
                            {
                                headers:
                                    authHeader(),
                            }
                        );

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            'Không thể tải bệnh án trước.'
                        );
                    }

                    const body =
                        await response.json();

                    setPreviousRecords(
                        body.data ??
                        body.result ??
                        body ??
                        []
                    );
                } catch {
                    setPreviousRecords(
                        []
                    );
                }
            };

        loadPreviousRecords();
    }, [examination?.recordId]);

    /* =====================================================
       FOLLOW UP SERVICES
    ===================================================== */

    useEffect(() => {
        if (!examination) {
            return;
        }

        setFollowUpServiceId(
            examination.serviceId ||
            ''
        );

        const loadServices =
            async () => {
                try {
                    const apiBase =
                        import.meta.env
                            .VITE_API_URL ||
                        'http://localhost:8080';

                    const response =
                        await fetch(
                            `${apiBase}/api/v1/medical-services/available?size=1000`,
                            {
                                headers:
                                    authHeader(),
                            }
                        );

                    if (
                        !response.ok
                    ) {
                        return;
                    }

                    const body =
                        await response.json();

                    const payload =
                        body.data ??
                        body.result ??
                        body;

                    setFollowUpServices(
                        payload.items ??
                        payload.content ??
                        []
                    );
                } catch {
                    setFollowUpServices(
                        []
                    );
                }
            };

        loadServices();
    }, [examination?.ticketId]);

    /* =====================================================
       PREVIOUS DETAIL
    ===================================================== */

    const openPreviousRecord =
        async (recordId) => {
            try {
                const apiBase =
                    import.meta.env
                        .VITE_API_URL ||
                    'http://localhost:8080';

                const response =
                    await fetch(
                        `${apiBase}/api/v1/medical-records/${recordId}`,
                        {
                            headers:
                                authHeader(),
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        'Không thể tải chi tiết bệnh án.'
                    );
                }

                const body =
                    await response.json();

                setPreviousRecordDetail(
                    body.data ??
                    body.result ??
                    body
                );
            } catch (err) {
                toast.error(
                    err.message
                );
            }
        };

    /* =====================================================
       CREATE FOLLOW UP
    ===================================================== */

    const createFollowUpAppointment =
        async () => {
            if (
                !examination?.recordId ||
                !examination?.visitId ||
                !followUpDate
            ) {
                toast.error(
                    'Vui lòng chọn ngày tái khám.'
                );

                return;
            }

            setCreatingFollowUp(
                true
            );

            try {
                const apiBase =
                    import.meta.env
                        .VITE_API_URL ||
                    'http://localhost:8080';

                const response =
                    await fetch(
                        `${apiBase}/api/v1/medical-records/${examination.recordId}/follow-up-appointment`,
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json',
                                ...authHeader(),
                            },

                            body:
                                JSON.stringify(
                                    {
                                        customerId:
                                        examination.visitId,

                                        scheduledAt: `${followUpDate}T08:00:00`,

                                        serviceIds:
                                            followUpServiceId
                                                ? [
                                                    followUpServiceId,
                                                ]
                                                : [],
                                    }
                                ),
                        }
                    );

                const body =
                    await response
                        .json()
                        .catch(
                            () => ({})
                        );

                if (
                    !response.ok
                ) {
                    throw new Error(
                        body.message ||
                        'Không thể tạo lịch tái khám.'
                    );
                }

                toast.success(
                    'Đã tạo lịch tái khám cho bệnh nhân.'
                );
            } catch (err) {
                toast.error(
                    err.message
                );
            } finally {
                setCreatingFollowUp(
                    false
                );
            }
        };

    /* =====================================================
       PATIENT
    ===================================================== */

    const patient =
        examination
            ? {
                id:
                examination.ticketId,

                fullName:
                examination.patientName,

                age:
                    examination.patientDob
                        ? new Date().getFullYear() -
                        new Date(
                            examination.patientDob
                        ).getFullYear()
                        : null,

                bloodType:
                examination.patientBloodType,

                phone:
                examination.patientPhone,

                email:
                examination.patientEmail,

                address:
                    examination.patientAddress ||
                    '',

                dateOfBirth:
                examination.patientDob,

                gender:
                examination.patientGender,

                visitId:
                examination.visitId,

                queueNumber:
                examination.queueNumber,
            }
            : null;

    /* =====================================================
       VITAL SIGNS LEGACY FUNCTION - GIỮ NGUYÊN
    ===================================================== */

    const saveVitalSigns =
        async () => {
            if (
                !examination?.recordId
            ) {
                return;
            }

            const apiBase =
                import.meta.env
                    .VITE_API_URL ||
                'http://localhost:8080';

            const values = {
                heartRate:
                    heartRate
                        ? Number(
                            heartRate
                        )
                        : null,

                bloodPressure:
                    bloodPressure ||
                    null,

                temperature:
                    temperature
                        ? Number(
                            temperature
                        )
                        : null,

                height:
                    height
                        ? Number(height)
                        : null,

                weight:
                    weight
                        ? Number(weight)
                        : null,
            };

            const sendVitalSigns =
                (vitalId) =>
                    fetch(
                        vitalId
                            ? `${apiBase}/api/v1/vital-signs/${vitalId}`
                            : `${apiBase}/api/v1/vital-signs`,
                        {
                            method:
                                vitalId
                                    ? 'PUT'
                                    : 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json',
                                ...authHeader(),
                            },

                            body:
                                JSON.stringify(
                                    vitalId
                                        ? values
                                        : {
                                            medicalRecordId:
                                            examination.recordId,

                                            ...values,
                                        }
                                ),
                        }
                    );

            let vitalId =
                examination
                    .medicalRecord
                    ?.vitalSigns
                    ?.vitalId ??
                examination
                    .vitalSigns
                    ?.vitalId;

            let updateResponse =
                await sendVitalSigns(
                    vitalId
                );

            if (
                updateResponse.status ===
                409 &&
                !vitalId
            ) {
                const recordResponse =
                    await fetch(
                        `${apiBase}/api/v1/medical-records/${examination.recordId}`,
                        {
                            headers:
                                authHeader(),
                        }
                    );

                if (
                    recordResponse.ok
                ) {
                    const recordBody =
                        await recordResponse.json();

                    const currentRecord =
                        recordBody.data ??
                        recordBody.result ??
                        recordBody;

                    vitalId =
                        currentRecord
                            .vitalSigns
                            ?.vitalId;

                    if (vitalId) {
                        updateResponse =
                            await sendVitalSigns(
                                vitalId
                            );
                    }
                }
            }

            if (
                !updateResponse.ok
            ) {
                const errorBody =
                    await updateResponse
                        .json()
                        .catch(
                            () => ({})
                        );

                throw new Error(
                    errorBody.message ||
                    'Không thể lưu chỉ số sinh hiệu'
                );
            }

            return updateResponse
                .json()
                .catch(() => null);
        };

    /* =====================================================
       VALIDATION
    ===================================================== */

    const validateExamination =
        (required) => {
            if (
                required &&
                !symptoms.trim()
            ) {
                return 'Vui lòng nhập triệu chứng/lý do khám';
            }

            if (
                required &&
                !examResult.trim()
            ) {
                return 'Vui lòng nhập kết quả khám lâm sàng';
            }

            if (
                required &&
                diagnosis.selected
                    .length === 0
            ) {
                return 'Vui lòng chọn ít nhất một chẩn đoán ICD-10';
            }

            if (
                heartRate &&
                isNaN(
                    Number(
                        heartRate
                    )
                )
            ) {
                return 'Nhịp tim phải là số hợp lệ';
            }

            if (
                temperature &&
                isNaN(
                    Number(
                        temperature
                    )
                )
            ) {
                return 'Nhiệt độ phải là số hợp lệ';
            }

            if (
                height &&
                isNaN(
                    Number(height)
                )
            ) {
                return 'Chiều cao phải là số hợp lệ';
            }

            if (
                weight &&
                isNaN(
                    Number(weight)
                )
            ) {
                return 'Cân nặng phải là số hợp lệ';
            }

            const invalidMedicine =
                prescriptionItems
                    .filter(
                        (medicine) =>
                            medicine.name?.trim() ||
                            medicine.note?.trim() ||
                            medicine.frequencyPerDay
                    )
                    .some(
                        (medicine) =>
                            !medicine.name?.trim() ||
                            Number(
                                medicine.quantity
                            ) <= 0 ||
                            !medicine.unit?.trim()
                    );

            if (
                invalidMedicine
            ) {
                return 'Mỗi thuốc phải có tên, số lượng dương và đơn vị';
            }

            return '';
        };

    /* =====================================================
       SAVE DRAFT
    ===================================================== */

    const saveDraft =
        async () => {
            if (
                !examination?.recordId
            ) {
                setError(
                    'Chưa có hồ sơ bệnh án'
                );

                toast.error(
                    'Chưa có hồ sơ bệnh án'
                );

                return;
            }

            const validationError =
                validateExamination(
                    false
                );

            if (
                validationError
            ) {
                toast.error(
                    validationError
                );

                return;
            }

            setSaving(true);
            setError('');

            try {
                const res =
                    await fetch(
                        `${import.meta.env.VITE_API_URL}/api/v1/medical-records/${examination.recordId}/draft`,
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json',

                                ...authHeader(),
                            },

                            body:
                                JSON.stringify(
                                    {
                                        chiefComplaint:
                                        symptoms,

                                        clinicalFindings:
                                        examResult,

                                        diagnosis:
                                            isNurse
                                                ? null
                                                : diagnosis.selected
                                                    .map(
                                                        (
                                                            item
                                                        ) =>
                                                            item.label
                                                    )
                                                    .join(
                                                        ', '
                                                    ),

                                        prescriptionNote:
                                            '',

                                        conclusion:
                                            isNurse
                                                ? null
                                                : notes,

                                        patientInstruction:
                                            isNurse
                                                ? null
                                                : '',

                                        bloodPressure,

                                        heartRate:
                                            heartRate
                                                ? parseInt(
                                                    heartRate
                                                )
                                                : null,

                                        temperature:
                                            temperature
                                                ? parseFloat(
                                                    temperature
                                                )
                                                : null,

                                        weight:
                                            weight
                                                ? parseFloat(
                                                    weight
                                                )
                                                : null,

                                        height:
                                            height
                                                ? parseFloat(
                                                    height
                                                )
                                                : null,

                                        prescriptionItems:
                                            isNurse
                                                ? null
                                                : prescriptionItems
                                                    .filter(
                                                        (
                                                            medicine
                                                        ) =>
                                                            medicine.name?.trim() &&
                                                            Number(
                                                                medicine.quantity
                                                            ) >
                                                            0
                                                    )
                                                    .map(
                                                        (
                                                            medicine
                                                        ) => ({
                                                            medicineName:
                                                                medicine.name.trim(),

                                                            quantity:
                                                                Number(
                                                                    medicine.quantity
                                                                ),

                                                            unit:
                                                                medicine.unit?.trim() ||
                                                                'viên',

                                                            note:
                                                                medicine.note?.trim() ||
                                                                null,

                                                            frequencyPerDay:
                                                                medicine.frequencyPerDay
                                                                    ? Number(
                                                                        medicine.frequencyPerDay
                                                                    )
                                                                    : null,
                                                        })
                                                    ),

                                        icdSelections:
                                            isNurse
                                                ? null
                                                : diagnosis.selected.map(
                                                    (
                                                        item
                                                    ) => ({
                                                        code:
                                                        item.code,
                                                    })
                                                ),

                                        followUp:
                                            followUpNote.trim()
                                                ? {
                                                    note:
                                                        followUpNote.trim(),

                                                    preferredDate:
                                                        null,
                                                }
                                                : null,

                                        version:
                                        recordVersion,
                                    }
                                ),
                        }
                    );

                if (!res.ok) {
                    const body =
                        await res
                            .json()
                            .catch(
                                () => ({})
                            );

                    throw new Error(
                        body.message ||
                        tDoctor(
                            'examination.errors.saveFailed'
                        )
                    );
                }

                const savedBody =
                    await res.json();

                const savedRecord =
                    savedBody.data ??
                    savedBody.result ??
                    savedBody;

                setRecordVersion(
                    savedRecord.version ??
                    recordVersion
                );

                await reload();

                toast.success(
                    'Lưu nháp thành công!'
                );
            } catch (err) {
                setError(
                    err.message ||
                    tDoctor(
                        'examination.errors.unknown'
                    )
                );

                toast.error(
                    err.message ||
                    tDoctor(
                        'examination.errors.saveFailed'
                    )
                );
            } finally {
                setSaving(false);
            }
        };

    /* =====================================================
       COMPLETE
    ===================================================== */

    const completeExam =
        async () => {
            if (
                !examination?.recordId
            ) {
                setError(
                    'Chưa có hồ sơ bệnh án'
                );

                toast.error(
                    'Chưa có hồ sơ bệnh án'
                );

                return;
            }

            const validationError =
                validateExamination(
                    true
                );

            if (
                validationError
            ) {
                toast.error(
                    validationError
                );

                return;
            }

            const enteredMedicines =
                prescriptionItems.filter(
                    (medicine) =>
                        medicine.name?.trim() ||
                        medicine.note?.trim() ||
                        medicine.frequencyPerDay
                );

            const invalidMedicine =
                enteredMedicines.find(
                    (medicine) =>
                        !medicine.name?.trim() ||
                        !Number.isInteger(
                            Number(
                                medicine.quantity
                            )
                        ) ||
                        Number(
                            medicine.quantity
                        ) <= 0
                );

            if (
                invalidMedicine
            ) {
                toast.error(
                    'Mỗi thuốc phải có tên thuốc và số lượng lớn hơn 0.'
                );

                return;
            }

            setCompleting(true);
            setError('');

            try {
                const res =
                    await fetch(
                        `${import.meta.env.VITE_API_URL}/api/v1/queue-tickets/${examination.ticketId}/complete`,
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json',
                                ...authHeader(),
                            },

                            body:
                                JSON.stringify(
                                    {
                                        chiefComplaint:
                                        symptoms,

                                        clinicalFindings:
                                        examResult,

                                        diagnosis:
                                            diagnosis.selected
                                                .map(
                                                    (
                                                        item
                                                    ) =>
                                                        item.label
                                                )
                                                .join(
                                                    ', '
                                                ),

                                        prescriptionNote:
                                            prescriptionAdvice.trim(),

                                        conclusion:
                                        notes,

                                        patientInstruction:
                                            prescriptionAdvice.trim(),

                                        bloodPressure,

                                        heartRate:
                                            heartRate
                                                ? parseInt(
                                                    heartRate
                                                )
                                                : null,

                                        temperature:
                                            temperature
                                                ? parseFloat(
                                                    temperature
                                                )
                                                : null,

                                        weight:
                                            weight
                                                ? parseFloat(
                                                    weight
                                                )
                                                : null,

                                        height:
                                            height
                                                ? parseFloat(
                                                    height
                                                )
                                                : null,

                                        prescriptionItems:
                                            enteredMedicines.map(
                                                (
                                                    medicine
                                                ) => ({
                                                    medicineName:
                                                        medicine.name.trim(),

                                                    quantity:
                                                        Number(
                                                            medicine.quantity
                                                        ),

                                                    unit:
                                                        medicine.unit?.trim() ||
                                                        'viên',

                                                    note:
                                                        medicine.note?.trim() ||
                                                        null,

                                                    frequencyPerDay:
                                                        medicine.frequencyPerDay
                                                            ? Number(
                                                                medicine.frequencyPerDay
                                                            )
                                                            : null,
                                                })
                                            ),

                                        icdSelections:
                                            diagnosis.selected.map(
                                                (
                                                    item
                                                ) => ({
                                                    code:
                                                    item.code,
                                                })
                                            ),

                                        testRequests:
                                            labOrders.selected.map(
                                                (
                                                    service
                                                ) => ({
                                                    serviceId:
                                                    service.id,

                                                    notes:
                                                        '',
                                                })
                                            ),

                                        followUp:
                                            followUpNote.trim()
                                                ? {
                                                    note:
                                                        followUpNote.trim(),

                                                    preferredDate:
                                                        null,
                                                }
                                                : null,

                                        version:
                                        recordVersion,
                                    }
                                ),
                        }
                    );

                const responseBody =
                    await res
                        .json()
                        .catch(
                            () => ({})
                        );

                if (!res.ok) {
                    throw new Error(
                        responseBody.message ||
                        tDoctor(
                            'examination.errors.completeFailed'
                        )
                    );
                }

                const completedRecord =
                    responseBody.data ??
                    responseBody.result ??
                    responseBody;

                toast.success(
                    'Hoàn thành khám thành công!'
                );

                const completionData =
                    {
                        record:
                        completedRecord,

                        patient,

                        serviceName:
                        examination.serviceName,

                        departmentName:
                        examination.departmentName,

                        completedAt:
                            completedRecord.completedAt ??
                            new Date().toISOString(),

                        waitingForTests:
                            labOrders.selected
                                .length >
                            0,
                    };

                sessionStorage.setItem(
                    `exam-completion:${completedRecord.recordId}`,
                    JSON.stringify(
                        completionData
                    )
                );

                sessionStorage.setItem(
                    `prescription-preview:${completedRecord.recordId}`,
                    JSON.stringify(
                        completionData
                    )
                );

                navigate(
                    ROUTES.DOCTOR_EXAM_COMPLETED.replace(
                        ':recordId',
                        completedRecord.recordId
                    ),
                    {
                        state:
                        completionData,
                    }
                );
            } catch (err) {
                setError(
                    err.message ||
                    tDoctor(
                        'examination.errors.unknown'
                    )
                );

                toast.error(
                    err.message ||
                    tDoctor(
                        'examination.errors.completeFailed'
                    )
                );
            } finally {
                setCompleting(
                    false
                );
            }
        };

    /* =====================================================
       LOADING / EMPTY
    ===================================================== */

    if (loading) {
        return (
            <MedicalStaffLayout>
                <p className="py-20 text-center text-sm text-gray-400">
                    {tDoctor(
                        'examination.loading'
                    )}
                </p>
            </MedicalStaffLayout>
        );
    }

    if (!examination) {
        return (
            <MedicalStaffLayout>
                <p className="py-20 text-center text-sm text-gray-400">
                    Không có bệnh nhân nào đang khám.
                </p>
            </MedicalStaffLayout>
        );
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <MedicalStaffLayout>
            <div className="flex-1 overflow-y-auto bg-gray-50 pb-24">

                <div className="mx-auto w-full max-w-[1500px] space-y-4 px-5 py-5">

                    {/* =================================================
                        TITLE
                    ================================================= */}

                    <h1 className="text-xl font-bold text-gray-900">
                        Khám bệnh
                    </h1>

                    {/* =================================================
                        PATIENT HEADER
                    ================================================= */}

                    {patient && (
                        <section className="rounded-2xl border border-gray-200 bg-white px-6 py-5">

                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(420px,1.4fr)_repeat(5,minmax(110px,0.6fr))] xl:items-center">

                                {/* PATIENT */}

                                <div className="flex min-w-0 items-center gap-5">

                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-500">
                                        {patient.fullName
                                                ?.trim()
                                                ?.charAt(0)
                                                ?.toUpperCase() ||
                                            'BN'}
                                    </div>

                                    <div className="min-w-0">

                                        <div className="flex flex-wrap items-center gap-2">

                                            <h2 className="text-xl font-bold text-gray-900">
                                                {patient.fullName ||
                                                    '—'}
                                            </h2>

                                            {patient.gender && (
                                                <span className="text-xs text-gray-500">
                                                    •{' '}
                                                    {patient.gender ===
                                                    'MALE'
                                                        ? tCommon(
                                                            'male'
                                                        )
                                                        : patient.gender ===
                                                        'FEMALE'
                                                            ? tCommon(
                                                                'female'
                                                            )
                                                            : tCommon(
                                                                'other'
                                                            )}
                                                </span>
                                            )}

                                            {patient.age !=
                                                null && (
                                                    <span className="text-xs text-gray-500">
                                                    •{' '}
                                                        {
                                                            patient.age
                                                        }{' '}
                                                        tuổi
                                                </span>
                                                )}

                                            {patient.bloodType && (
                                                <span className="text-xs text-gray-500">
                                                    • Nhóm máu:{' '}
                                                    {
                                                        patient.bloodType
                                                    }
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-2 truncate text-xs text-gray-500">
                                            ID:{' '}
                                            {patient.id ||
                                                '—'}
                                        </p>

                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">

                                            {patient.phone && (
                                                <span>
                                                    Số điện thoại:{' '}
                                                    {
                                                        patient.phone
                                                    }
                                                </span>
                                            )}

                                            {patient.dateOfBirth && (
                                                <span>
                                                    Ngày sinh:{' '}
                                                    {
                                                        patient.dateOfBirth
                                                    }
                                                </span>
                                            )}
                                        </div>

                                        {previousRecords.length >
                                            0 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openPreviousRecord(
                                                            previousRecords[
                                                                0
                                                                ].id
                                                        )
                                                    }
                                                    className="mt-2 text-xs font-medium text-gray-500 underline-offset-2 transition hover:text-gray-900 hover:underline"
                                                >
                                                    Xem bệnh án trước (
                                                    {
                                                        previousRecords.length
                                                    }
                                                    )
                                                </button>
                                            )}
                                    </div>
                                </div>

                                {/* HEART RATE */}

                                <VitalField
                                    label="Nhịp tim"
                                    unit="BPM"
                                    value={
                                        heartRate
                                    }
                                    onChange={
                                        setHeartRate
                                    }
                                    type="number"
                                    placeholder="60"
                                />

                                {/* BLOOD PRESSURE */}

                                <VitalField
                                    label="Huyết áp"
                                    unit="mmHg"
                                    value={
                                        bloodPressure
                                    }
                                    onChange={
                                        setBloodPressure
                                    }
                                    placeholder="120/80"
                                />

                                {/* TEMPERATURE */}

                                <VitalField
                                    label="Thân nhiệt"
                                    unit="°C"
                                    value={
                                        temperature
                                    }
                                    onChange={
                                        setTemperature
                                    }
                                    type="number"
                                    step="0.1"
                                    placeholder="36.5"
                                />

                                {/* HEIGHT */}

                                <VitalField
                                    label="Chiều cao"
                                    unit="cm"
                                    value={
                                        height
                                    }
                                    onChange={
                                        setHeight
                                    }
                                    type="number"
                                    placeholder="170"
                                />

                                {/* WEIGHT */}

                                <VitalField
                                    label="Cân nặng"
                                    unit="kg"
                                    value={
                                        weight
                                    }
                                    onChange={
                                        setWeight
                                    }
                                    type="number"
                                    placeholder="60"
                                />
                            </div>
                        </section>
                    )}

                    {/* =================================================
                        MAIN 2 COLUMNS
                    ================================================= */}

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(390px,0.95fr)]">

                        {/* =================================================
                            LEFT
                        ================================================= */}

                        <div className="space-y-4">

                            {/* =============================================
                                EXAMINATION FORM
                            ============================================= */}

                            <section className="rounded-2xl border border-gray-200 bg-white p-5">

                                {/* SYMPTOMS */}

                                <div>
                                    <p className={sectionTitle}>
                                        Triệu chứng và lý do khám bệnh
                                    </p>

                                    <textarea
                                        value={
                                            symptoms
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSymptoms(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder={tDoctor(
                                            'examination.symptoms.placeholder'
                                        )}
                                        rows={2}
                                        className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-400"
                                    />
                                </div>

                                {/* CLINICAL */}

                                <div className="mt-4">
                                    <p className={sectionTitle}>
                                        Khám lâm sàng
                                    </p>

                                    <textarea
                                        value={
                                            examResult
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setExamResult(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder={tDoctor(
                                            'examination.examResult.placeholder'
                                        )}
                                        rows={2}
                                        className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-400"
                                    />
                                </div>

                                {isNurse && (
                                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                                        Y tá được nhập thông tin hỗ trợ và lưu nháp. Chẩn đoán, chỉ định, kê đơn, kết luận và hoàn thành ca khám do bác sĩ phụ trách.
                                    </div>
                                )}

                                {/* DOCTOR ONLY */}

                                <div
                                    className={
                                        isNurse
                                            ? 'pointer-events-none mt-4 select-none opacity-50'
                                            : 'mt-4'
                                    }
                                >
                                    {/* ICD */}

                                    <p className={sectionTitle}>
                                        Chẩn đoán (ICD-10)
                                    </p>

                                    <div className="mt-2">

                                        <SearchDropdown
                                            query={
                                                diagnosis.query
                                            }
                                            results={
                                                diagnosis.results
                                            }
                                            loading={
                                                diagnosis.loading
                                            }
                                            onSearch={
                                                diagnosis.search
                                            }
                                            onAdd={
                                                diagnosis.add
                                            }
                                            placeholder={tDoctor(
                                                'examination.diagnosis.searchPlaceholder'
                                            )}
                                            addLabel={tDoctor(
                                                'examination.diagnosis.addBtn'
                                            )}
                                            showAddButton={
                                                false
                                            }
                                        />

                                        <TagList
                                            items={
                                                diagnosis.selected
                                            }
                                            labelKey="label"
                                            codeKey="code"
                                            onRemove={
                                                diagnosis.remove
                                            }
                                        />
                                    </div>

                                    {/* CONCLUSION */}

                                    <div className="mt-4">

                                        <p className={sectionTitle}>
                                            Kết luận và hướng điều trị
                                        </p>

                                        <textarea
                                            value={
                                                notes
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setNotes(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="Nhập kết luận, hướng xử trí và kế hoạch điều trị..."
                                            rows={3}
                                            className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-gray-400"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* =============================================
                                PRESCRIPTION
                            ============================================= */}

                            <section
                                className={`rounded-2xl border border-gray-200 bg-white p-5 ${
                                    isNurse
                                        ? 'pointer-events-none select-none opacity-50'
                                        : ''
                                }`}
                            >
                                <div className="mb-4 flex items-center justify-between gap-4">

                                    <div className="flex items-center gap-2">

                                        <h2 className="text-sm font-semibold text-gray-900">
                                            Đơn thuốc
                                        </h2>

                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                                            {
                                                prescriptionItems.length
                                            }{' '}
                                            thuốc
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">

                                        <button
                                            type="button"
                                            onClick={
                                                addPrescriptionRow
                                            }
                                            className="h-8 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                                        >
                                            + Thêm thuốc
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPrescription(
                                                    (
                                                        previous
                                                    ) =>
                                                        !previous
                                                )
                                            }
                                            className="text-xs text-gray-500 transition hover:text-gray-900"
                                        >
                                            {showPrescription
                                                ? 'Thu gọn'
                                                : 'Mở rộng'}
                                        </button>
                                    </div>
                                </div>

                                {showPrescription && (
                                    <>
                                        <div className="overflow-hidden rounded-xl border border-gray-200">

                                            {/* HEADER */}

                                            <div className="hidden grid-cols-[minmax(180px,1.45fr)_minmax(180px,1.4fr)_80px_90px_105px_36px] gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400 xl:grid">
                                                <span>
                                                    Tên thuốc / hoạt chất
                                                </span>

                                                <span>
                                                    Cách dùng
                                                </span>

                                                <span>
                                                    Số lượng
                                                </span>

                                                <span>
                                                    Đơn vị
                                                </span>

                                                <span>
                                                    Lần/ngày
                                                </span>

                                                <span />
                                            </div>

                                            {/* FIXED HEIGHT */}

                                            <div className="max-h-[260px] overflow-y-auto">

                                                {prescriptionItems.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (
                                                        <div
                                                            key={
                                                                item.id
                                                            }
                                                            className="grid grid-cols-1 gap-2 border-b border-gray-100 p-3 last:border-b-0 xl:grid-cols-[minmax(180px,1.45fr)_minmax(180px,1.4fr)_80px_90px_105px_36px] xl:items-center"
                                                        >
                                                            {/* NAME */}

                                                            <div className="relative min-w-0">

                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        item.name
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) => {
                                                                        updatePrescription(
                                                                            item.id,
                                                                            'name',
                                                                            event
                                                                                .target
                                                                                .value
                                                                        );

                                                                        setMedicineSearchRowId(
                                                                            item.id
                                                                        );
                                                                    }}
                                                                    onFocus={() =>
                                                                        setMedicineSearchRowId(
                                                                            item.id
                                                                        )
                                                                    }
                                                                    onBlur={() =>
                                                                        setTimeout(
                                                                            () =>
                                                                                setMedicineSearchRowId(
                                                                                    null
                                                                                ),
                                                                            150
                                                                        )
                                                                    }
                                                                    placeholder="Tên thuốc..."
                                                                    autoComplete="off"
                                                                    className="h-9 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-900 outline-none focus:border-gray-400"
                                                                />

                                                                {medicineSearchRowId ===
                                                                    item.id && (
                                                                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">

                                                                            {medicineSearching && (
                                                                                <p className="px-3 py-2 text-xs text-gray-400">
                                                                                    Đang tìm thuốc...
                                                                                </p>
                                                                            )}

                                                                            {!medicineSearching &&
                                                                                medicineSuggestions.map(
                                                                                    (
                                                                                        medicine
                                                                                    ) => (
                                                                                        <button
                                                                                            key={
                                                                                                medicine.medicineId
                                                                                            }
                                                                                            type="button"
                                                                                            onMouseDown={() =>
                                                                                                selectMedicine(
                                                                                                    item.id,
                                                                                                    medicine
                                                                                                )
                                                                                            }
                                                                                            className="block w-full border-b border-gray-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-gray-50"
                                                                                        >
                                                                                        <span className="block text-sm font-semibold text-gray-800">
                                                                                            {
                                                                                                medicine.name
                                                                                            }
                                                                                        </span>

                                                                                            <span className="block text-xs text-gray-400">
                                                                                            {
                                                                                                medicine.medicineCode
                                                                                            }

                                                                                                {medicine.activeIngredient
                                                                                                    ? ` • ${medicine.activeIngredient}`
                                                                                                    : ''}
                                                                                        </span>
                                                                                        </button>
                                                                                    )
                                                                                )}

                                                                            {!medicineSearching &&
                                                                                medicineSuggestions.length ===
                                                                                0 && (
                                                                                    <p className="px-3 py-2.5 text-xs text-gray-500">
                                                                                        Không có trong danh mục. Có thể tiếp tục dùng tên vừa nhập.
                                                                                    </p>
                                                                                )}
                                                                        </div>
                                                                    )}
                                                            </div>

                                                            {/* NOTE */}

                                                            <input
                                                                type="text"
                                                                value={
                                                                    item.note
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    updatePrescription(
                                                                        item.id,
                                                                        'note',
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Liều dùng"
                                                                className="h-9 min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-gray-400"
                                                            />

                                                            {/* QTY */}

                                                            <input
                                                                type="number"
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    updatePrescription(
                                                                        item.id,
                                                                        'quantity',
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-center text-xs outline-none focus:border-gray-400"
                                                            />

                                                            {/* UNIT */}

                                                            <select
                                                                value={
                                                                    item.unit
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    updatePrescription(
                                                                        item.id,
                                                                        'unit',
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-gray-400"
                                                            >
                                                                {[
                                                                    'viên',
                                                                    'gói',
                                                                    'ống',
                                                                    'lọ',
                                                                    'chai',
                                                                    'hộp',
                                                                    'ml',
                                                                    'mg',
                                                                ].map(
                                                                    (
                                                                        unit
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                unit
                                                                            }
                                                                            value={
                                                                                unit
                                                                            }
                                                                        >
                                                                            {
                                                                                unit
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>

                                                            {/* FREQUENCY */}

                                                            <select
                                                                value={
                                                                    item.frequencyPerDay
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    updatePrescription(
                                                                        item.id,
                                                                        'frequencyPerDay',
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-gray-400"
                                                            >
                                                                <option value="">
                                                                    Không chọn
                                                                </option>

                                                                {[
                                                                    1,
                                                                    2,
                                                                    3,
                                                                    4,
                                                                ].map(
                                                                    (
                                                                        times
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                times
                                                                            }
                                                                            value={
                                                                                times
                                                                            }
                                                                        >
                                                                            {
                                                                                times
                                                                            }{' '}
                                                                            lần/ngày
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>

                                                            {/* REMOVE */}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removePrescription(
                                                                        item.id
                                                                    )
                                                                }
                                                                className="flex h-9 items-center justify-center text-gray-300 transition hover:text-red-500"
                                                            >
                                                                <X
                                                                    size={
                                                                        14
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* ADVICE */}

                                        <textarea
                                            value={
                                                prescriptionAdvice
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setPrescriptionAdvice(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            rows={2}
                                            placeholder="Lời dặn khi sử dụng thuốc"
                                            className="mt-3 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-gray-400"
                                        />
                                    </>
                                )}
                            </section>
                        </div>

                        {/* =================================================
                            RIGHT
                        ================================================= */}

                        <div className="space-y-4">

                            {/* =============================================
                                LAB / TESTS
                            ============================================= */}

                            <section
                                className={`rounded-2xl border border-gray-200 bg-white p-4 ${
                                    isNurse
                                        ? 'pointer-events-none select-none opacity-50'
                                        : ''
                                }`}
                            >
                                <div className="mb-3 flex items-center justify-between gap-3">

                                    <h2 className="text-sm font-semibold text-gray-900">
                                        Xét nghiệm / cận lâm sàng
                                    </h2>

                                    {!isNurse && (
                                        <select
                                            value={
                                                labSelect
                                            }
                                            disabled={
                                                loadingLabServices
                                            }
                                            onChange={(
                                                event
                                            ) => {
                                                const service =
                                                    labServices.find(
                                                        (
                                                            item
                                                        ) =>
                                                            item.serviceId ===
                                                            event
                                                                .target
                                                                .value
                                                    );

                                                if (
                                                    service &&
                                                    !unavailableLabServiceIds.has(
                                                        service.serviceId
                                                    )
                                                ) {
                                                    labOrders.add(
                                                        {
                                                            id:
                                                            service.serviceId,

                                                            name:
                                                            service.name,
                                                        }
                                                    );
                                                }

                                                setLabSelect(
                                                    ''
                                                );
                                            }}
                                            className="h-8 max-w-[200px] rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-600 outline-none focus:border-gray-400"
                                        >
                                            <option value="">
                                                + Yêu cầu dịch vụ
                                            </option>

                                            {labServices.map(
                                                (
                                                    service
                                                ) => (
                                                    <option
                                                        key={
                                                            service.serviceId
                                                        }
                                                        value={
                                                            service.serviceId
                                                        }
                                                        disabled={
                                                            unavailableLabServiceIds.has(
                                                                service.serviceId
                                                            )
                                                        }
                                                    >
                                                        {
                                                            service.name
                                                        }
                                                        {(() => {
                                                            const existing =
                                                                visitTestRequestByServiceId.get(
                                                                    service.serviceId
                                                                );
                                                            if (!existing) return '';
                                                            if (existing.status === 'COMPLETED') {
                                                                return ' (Đã có kết quả)';
                                                            }
                                                            if (existing.linkedToExamination) {
                                                                return ' (Đã được bác sĩ chỉ định)';
                                                            }
                                                            return ' (Đã đặt trước - dùng cho ca khám này)';
                                                        })()}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    )}
                                </div>

                                {/* NEW ORDERS */}

                                {labOrders
                                        .selected
                                        .length >
                                    0 && (
                                        <div className="mb-3">

                                            <p className="mb-2 text-[11px] font-medium text-gray-400">
                                                Chỉ định mới
                                            </p>

                                            <TagList
                                                items={
                                                    labOrders.selected
                                                }
                                                labelKey="name"
                                                onRemove={
                                                    labOrders.remove
                                                }
                                            />
                                        </div>
                                    )}

                                {/* FIXED TEST LIST */}

                                <div className="overflow-hidden rounded-xl border border-gray-200">

                                    <div className="grid grid-cols-[minmax(0,1fr)_120px_24px] border-b border-gray-100 bg-gray-50 px-3 py-2">

                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                            Tên xét nghiệm
                                        </span>

                                        <span className="text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                            Trạng thái
                                        </span>

                                        <span />
                                    </div>

                                    <div className="h-[330px] overflow-y-auto">

                                        {testRequests.map(
                                            (
                                                lab,
                                                index
                                            ) => {
                                                const status =
                                                    getTestStatus(
                                                        lab.status
                                                    );

                                                return (
                                                    <button
                                                        key={
                                                            lab.testRequestId ??
                                                            index
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                ROUTES.DOCTOR_LAB_DETAIL.replace(
                                                                    ':id',
                                                                    lab.testRequestId
                                                                )
                                                            )
                                                        }
                                                        className="grid w-full grid-cols-[minmax(0,1fr)_120px_24px] items-center border-b border-gray-100 px-3 py-3 text-left transition last:border-b-0 hover:bg-gray-50"
                                                    >
                                                        <span className="truncate pr-2 text-xs font-medium text-gray-700">
                                                            {lab.serviceName ||
                                                                lab.testRequestId ||
                                                                '—'}
                                                        </span>

                                                        <span className="flex justify-center">

                                                            <span
                                                                className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-medium ${status.cls}`}
                                                            >
                                                                {
                                                                    status.text
                                                                }
                                                            </span>
                                                        </span>

                                                        <ChevronRight
                                                            size={
                                                                15
                                                            }
                                                            className="justify-self-end text-gray-300"
                                                        />
                                                    </button>
                                                );
                                            }
                                        )}

                                        {testRequests.length ===
                                            0 && (
                                                <div className="flex h-full items-center justify-center px-6 text-center">

                                                    <p className="text-sm text-gray-400">
                                                        Chưa có xét nghiệm / cận lâm sàng nào.
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                </div>

                                <p className="mt-2 text-[11px] text-gray-400">
                                    Chọn một xét nghiệm để xem chi tiết kết quả.
                                </p>
                            </section>

                            {/* =============================================
                                FOLLOW UP
                            ============================================= */}

                            <section
                                className={`rounded-2xl border border-gray-200 bg-white p-4 ${
                                    isNurse
                                        ? 'pointer-events-none select-none opacity-50'
                                        : ''
                                }`}
                            >
                                <h2 className="text-sm font-semibold text-gray-900">
                                    Yêu cầu tái khám
                                </h2>

                                <div className="mt-3 space-y-3">

                                    <div>
                                        <label className="mb-1.5 block text-xs text-gray-500">
                                            Ghi chú / Yêu cầu
                                        </label>

                                        <textarea
                                            value={
                                                followUpNote
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setFollowUpNote(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder="VD: Tái khám sau 1 tuần, tái khám sau khi hết thuốc..."
                                            rows={3}
                                            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none transition focus:border-gray-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs text-gray-500">
                                            Ngày tái khám dự kiến
                                        </label>

                                        <input
                                            type="date"
                                            min={new Date()
                                                .toISOString()
                                                .slice(
                                                    0,
                                                    10
                                                )}
                                            value={
                                                followUpDate
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setFollowUpDate(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs text-gray-500">
                                            Dịch vụ tái khám
                                        </label>

                                        <select
                                            value={
                                                followUpServiceId
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setFollowUpServiceId(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400"
                                        >
                                            <option value="">
                                                Theo dịch vụ khám hiện tại
                                            </option>

                                            {followUpServices.map(
                                                (
                                                    service
                                                ) => (
                                                    <option
                                                        key={
                                                            service.serviceId
                                                        }
                                                        value={
                                                            service.serviceId
                                                        }
                                                    >
                                                        {
                                                            service.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={
                                            creatingFollowUp
                                        }
                                        onClick={
                                            createFollowUpAppointment
                                        }
                                        className="h-10 w-full rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {creatingFollowUp
                                            ? 'Đang tạo...'
                                            : 'Tạo lịch tái khám'}
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>

                    {error && (
                        <p className="text-center text-sm text-red-500">
                            {error}
                        </p>
                    )}

                    {loadError && (
                        <p className="text-center text-sm text-red-500">
                            {loadError}
                        </p>
                    )}
                </div>
            </div>

            {/* =================================================
                STICKY FOOTER
            ================================================= */}

            <div className="fixed bottom-0 left-44 right-0 z-40 flex h-16 items-center justify-center gap-3 border-t border-gray-200 bg-white px-8">

                <button
                    type="button"
                    onClick={saveDraft}
                    disabled={
                        saving ||
                        completing
                    }
                    className="h-10 min-w-[140px] rounded-xl bg-gray-200 px-7 text-sm font-semibold text-gray-700 transition hover:bg-gray-300 disabled:opacity-50"
                >
                    {saving
                        ? 'Đang lưu...'
                        : tDoctor(
                            'examination.actions.draft'
                        )}
                </button>

                {!isNurse && (
                    <button
                        type="button"
                        onClick={
                            completeExam
                        }
                        disabled={
                            saving ||
                            completing
                        }
                        className="h-10 min-w-[160px] rounded-xl bg-gray-900 px-8 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50"
                    >
                        {completing
                            ? 'Đang hoàn thành...'
                            : tDoctor(
                                'examination.actions.complete'
                            )}
                    </button>
                )}
            </div>

            {/* =================================================
                PREVIOUS RECORD MODAL
            ================================================= */}

            {previousRecordDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">

                    <section className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

                        <div className="flex items-start justify-between gap-4">

                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Bệnh án trước
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    {previousRecordDetail.recordCode ||
                                        '-'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setPreviousRecordDetail(
                                        null
                                    )
                                }
                                className="text-sm text-gray-500 transition hover:text-gray-900"
                            >
                                Đóng
                            </button>
                        </div>

                        <dl className="mt-5 grid grid-cols-1 gap-5 text-sm md:grid-cols-2">

                            <div>
                                <dt className="text-xs text-gray-400">
                                    Chẩn đoán
                                </dt>

                                <dd className="mt-1 font-medium text-gray-800">
                                    {previousRecordDetail.diagnosis ||
                                        '-'}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-gray-400">
                                    Kết luận
                                </dt>

                                <dd className="mt-1 font-medium text-gray-800">
                                    {previousRecordDetail.conclusion ||
                                        '-'}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-gray-400">
                                    Kết quả khám
                                </dt>

                                <dd className="mt-1 whitespace-pre-wrap text-gray-700">
                                    {previousRecordDetail.clinicalFindings ||
                                        '-'}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-gray-400">
                                    Hướng điều trị
                                </dt>

                                <dd className="mt-1 whitespace-pre-wrap text-gray-700">
                                    {previousRecordDetail.patientInstruction ||
                                        previousRecordDetail.prescriptionNote ||
                                        '-'}
                                </dd>
                            </div>
                        </dl>
                    </section>
                </div>
            )}
        </MedicalStaffLayout>
    );
}

/* =========================================================
   VITAL FIELD
========================================================= */

function VitalField({
                        label,
                        unit,
                        value,
                        onChange,
                        type = 'text',
                        placeholder,
                        step,
                    }) {
    return (
        <div className="border-l border-gray-100 pl-4">

            <p className="text-xs font-medium text-gray-500">
                {label}
            </p>

            <input
                type={type}
                step={step}
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value
                    )
                }
                placeholder={
                    placeholder
                }
                className="mt-1 h-8 w-full max-w-[95px] border-0 bg-transparent p-0 text-lg font-semibold text-gray-900 outline-none placeholder:text-gray-300"
            />

            <p className="mt-0.5 text-[11px] text-gray-400">
                {unit}
            </p>
        </div>
    );
}

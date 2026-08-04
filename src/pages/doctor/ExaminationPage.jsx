// src/pages/doctor/ExaminationPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Bell, User, X } from 'lucide-react';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import { useInProgressPatient } from '@/hooks/useInProgressPatient';
import { useDiagnosis, useTagSearch } from '@/hooks/useDiagnosis';
import { useLabServices } from '@/hooks/useLabServices';
import { toast } from 'react-toastify';
import { ROUTES } from '@/constants/routes';

/* ── helpers ── */
const inputCls = 'w-full h-9 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100 bg-white';
const sectionTitle = 'text-sm font-semibold text-gray-800 mb-3';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const authHeader = () => ({ Authorization: `Bearer ${get('token')}` });

/* ── SearchDropdown: shared component for diagnosis / referral / lab ── */
function SearchDropdown({ query, results, loading, onSearch, onAdd, placeholder, addLabel, showAddButton = true }) {
    const ref = useRef(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    return (
        <div ref={ref} className="relative flex gap-2">
            <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                    type="text"
                    value={query}
                    placeholder={placeholder}
                    onChange={e => { onSearch(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 bg-white"
                />
                {open && results.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                        {results.map((r, i) => (
                            <button
                                key={r.code ?? r.id ?? i}
                                onMouseDown={() => { onAdd(r); setOpen(false); }}
                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                                {r.code && <span className="font-mono text-xs text-gray-400 mr-2">{r.code}</span>}
                                {r.name ?? r.label ?? r.codeName ?? r.title}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {showAddButton && (
                <button
                    onMouseDown={() => { if (query.trim()) onAdd({ id: Date.now(), name: query }); }}
                    className="px-3 h-9 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap transition-colors"
                >
                    {addLabel}
                </button>
            )}
        </div>
    );
}

/* ── Tag list ── */
function TagList({ items, labelKey = 'name', onRemove, codeKey }) {
    return (
        <div className="space-y-1.5 mt-2">
            {items.map((item) => (
                <div
                    key={item.code ?? item.id}
                    className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700"
                >
                    <span>
                        {codeKey && item[codeKey] && (
                            <span className="font-mono text-xs text-gray-400 mr-2">{item[codeKey]}</span>
                        )}
                        {item[labelKey]}
                    </span>
                    <button onClick={() => onRemove(item.code ?? item.id)} className="text-gray-300 hover:text-gray-600 ml-3 transition-colors">
                        <X size={13} />
                    </button>
                </div>
            ))}
        </div>
    );
}

/* ── Main Page ── */
export default function ExaminationPage() {
    const systemRole = localStorage.getItem('systemRole') || sessionStorage.getItem('systemRole');
    const isNurse = systemRole === 'NURSE';
    const { departmentId } = useParams();
    const navigate = useNavigate();
    const { t: tDoctor } = useTranslation('doctor');
    const { t: tCommon } = useTranslation('common');

    // Lấy thông tin ticket in-progress cho department
    const { ticket: examination, loading, error: loadError, reload } = useInProgressPatient(departmentId);

    // Local form state
    const [symptoms, setSymptoms] = useState('');
    const [examResult, setExamResult] = useState('');
    const [notes, setNotes] = useState('');
    const [heartRate, setHeartRate] = useState('');
    const [bloodPressure, setBloodPressure] = useState('');
    const [temperature, setTemperature] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');

    // Load dữ liệu từ medicalRecord khi examination thay đổi (quay lại từ xét nghiệm/...)
    useEffect(() => {
        if (examination?.medicalRecord) {
            const mr = examination.medicalRecord;
            setSymptoms(mr.chiefComplaint ?? '');
            setExamResult(mr.clinicalFindings ?? '');
            setNotes(mr.conclusion ?? '');
            // Load vital signs nếu có
            if (mr.vitalSigns) {
                setHeartRate(mr.vitalSigns.heartRate?.toString() ?? '');
                setBloodPressure(mr.vitalSigns.bloodPressure ?? '');
                setTemperature(mr.vitalSigns.temperature?.toString() ?? '');
                setHeight(mr.vitalSigns.height?.toString() ?? '');
                setWeight(mr.vitalSigns.weight?.toString() ?? '');
            }
            // Load ICD-10 selections nếu có
            if (mr.icdSelections && Array.isArray(mr.icdSelections)) {
                diagnosis.setSelected(mr.icdSelections.map(item => ({
                    code: item.code,
                    label: item.codeName ?? item.name
                })));
            }
        }
    }, [examination]);

    const diagnosis = useDiagnosis([]);
    const referrals = useTagSearch([], '/api/doctor/specialties');
    const labOrders = useTagSearch([], '/api/doctor/lab-tests');
    const { services: labServices, loading: loadingLabServices } = useLabServices();
    const [labSelect, setLabSelect] = useState('');

    // Prescription state
    const [prescriptionItems, setPrescriptionItems] = useState([{ id: Date.now(), name: '', quantity: '', unit: 'viên', note: '', frequencyPerDay: '' }]);
    const [showPrescription, setShowPrescription] = useState(true);
    const [prescriptionAdvice, setPrescriptionAdvice] = useState('Sử dụng thuốc đúng theo đơn. Liên hệ bác sĩ nếu có dấu hiệu bất thường.');
    const [medicineSearchRowId, setMedicineSearchRowId] = useState(null);
    const [medicineSuggestions, setMedicineSuggestions] = useState([]);
    const [medicineSearching, setMedicineSearching] = useState(false);

    const activeMedicineName = prescriptionItems.find(item => item.id === medicineSearchRowId)?.name ?? '';
    useEffect(() => {
        if (!medicineSearchRowId) {
            setMedicineSuggestions([]);
            return undefined;
        }
        const timer = setTimeout(async () => {
            setMedicineSearching(true);
            try {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                const res = await fetch(`${apiBase}/api/v1/medicines?keyword=${encodeURIComponent(activeMedicineName)}&size=20`, { headers: authHeader() });
                if (!res.ok) throw new Error('Không thể tải danh mục thuốc');
                const body = await res.json();
                setMedicineSuggestions(body.data ?? body.result ?? body ?? []);
            } catch {
                setMedicineSuggestions([]);
            } finally {
                setMedicineSearching(false);
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [medicineSearchRowId, activeMedicineName]);

    const selectMedicine = (rowId, medicine) => {
        setPrescriptionItems(items => items.map(item => item.id === rowId ? {
            ...item,
            name: medicine.name,
            unit: medicine.defaultUnit || item.unit || 'viên',
            note: medicine.defaultUsage || item.note,
            frequencyPerDay: medicine.defaultFrequencyPerDay ?? item.frequencyPerDay,
        } : item));
        setMedicineSearchRowId(null);
    };

    const addPrescriptionRow = () => {
        setPrescriptionItems([...prescriptionItems, { id: Date.now(), name: '', quantity: '', unit: 'viên', note: '', frequencyPerDay: '' }]);
    };

    const updatePrescription = (id, field, value) => {
        setPrescriptionItems(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removePrescription = (id) => {
        setPrescriptionItems(items => items.filter(item => item.id !== id));
    };

    // Button states
    const [saving, setSaving] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [error, setError] = useState('');
    const [testRequests, setTestRequests] = useState([]);

    // Follow-up (khám lại) state

    // Fetch test requests from medical record
    useEffect(() => {
        if (!examination?.recordId) return;
        const fetchTestRequests = async () => {
            try {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                const token = get('token');
                const res = await fetch(
                    `${apiBase}/api/v1/medical-records/${examination.recordId}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
                );
                if (res.ok) {
                    const data = await res.json();
                    const record = data.data ?? data.result ?? data;
                    setTestRequests(record.testRequests ?? []);
                    setSymptoms(record.chiefComplaint ?? '');
                    setExamResult(record.clinicalFindings ?? '');
                    setNotes(record.conclusion ?? '');
                    setPrescriptionAdvice(record.patientInstruction || record.prescriptionNote || 'Sử dụng thuốc đúng theo đơn. Liên hệ bác sĩ nếu có dấu hiệu bất thường.');

                    const vitalSigns = record.vitalSigns;
                    setHeartRate(vitalSigns?.heartRate?.toString() ?? '');
                    setBloodPressure(vitalSigns?.bloodPressure ?? '');
                    setTemperature(vitalSigns?.temperature?.toString() ?? '');
                    setHeight(vitalSigns?.height?.toString() ?? '');
                    setWeight(vitalSigns?.weight?.toString() ?? '');

                    diagnosis.setSelected((record.icdSelections ?? []).map(item => ({
                        code: item.code,
                        label: item.codeName ?? item.name ?? item.code,
                    })));

                    const savedMedicines = Array.from(record.prescriptionItems ?? []);
                    setPrescriptionItems(savedMedicines.length > 0 ? savedMedicines.map((medicine, index) => ({
                        id: medicine.prescriptionItemId ?? `saved-${index}`,
                        name: medicine.medicineName ?? '',
                        quantity: medicine.quantity?.toString() ?? '',
                        unit: medicine.unit || 'viên',
                        note: medicine.note ?? '',
                        frequencyPerDay: medicine.frequencyPerDay?.toString() ?? '',
                    })) : [{ id: Date.now(), name: '', quantity: '', unit: 'viên', note: '', frequencyPerDay: '' }]);

                }
            } catch (err) {
                console.error('Fetch test requests failed:', err);
            }
        };
        fetchTestRequests();
    }, [examination?.recordId, examination?.medicalRecord?.version]);

    // Map dữ liệu từ QueueTicketResponse sang format patient cho UI
    const patient = examination ? {
        id: examination.ticketId,
        fullName: examination.patientName,
        age: examination.patientDob ? new Date().getFullYear() - new Date(examination.patientDob).getFullYear() : null,
        bloodType: examination.patientBloodType,
        phone: examination.patientPhone,
        email: examination.patientEmail,
        address: examination.patientAddress || '',
        dateOfBirth: examination.patientDob,
        gender: examination.patientGender,
        visitId: examination.visitId,
        queueNumber: examination.queueNumber,
    } : null;

    // Lưu vital signs - gọi API vital-signs với medicalRecordId
    const saveVitalSigns = async () => {
        if (!examination?.recordId) return;
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const values = {
            heartRate: heartRate ? Number(heartRate) : null,
            bloodPressure: bloodPressure || null,
            temperature: temperature ? Number(temperature) : null,
            height: height ? Number(height) : null,
            weight: weight ? Number(weight) : null,
        };
        const sendVitalSigns = (vitalId) => fetch(
            vitalId ? `${apiBase}/api/v1/vital-signs/${vitalId}` : `${apiBase}/api/v1/vital-signs`,
            {
                method: vitalId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify(vitalId ? values : { medicalRecordId: examination.recordId, ...values }),
            }
        );
        let vitalId = examination.medicalRecord?.vitalSigns?.vitalId ?? examination.vitalSigns?.vitalId;
        let updateResponse = await sendVitalSigns(vitalId);
        if (updateResponse.status === 409 && !vitalId) {
            const recordResponse = await fetch(`${apiBase}/api/v1/medical-records/${examination.recordId}`, { headers: authHeader() });
            if (recordResponse.ok) {
                const recordBody = await recordResponse.json();
                const currentRecord = recordBody.data ?? recordBody.result ?? recordBody;
                vitalId = currentRecord.vitalSigns?.vitalId;
                if (vitalId) updateResponse = await sendVitalSigns(vitalId);
            }
        }
        if (!updateResponse.ok) {
            const errorBody = await updateResponse.json().catch(() => ({}));
            throw new Error(errorBody.message || 'Không thể lưu chỉ số sinh hiệu');
        }
        return updateResponse.json().catch(() => null);
        /* Luồng cũ phía dưới được giữ tạm để tránh ảnh hưởng lịch sử chỉnh sửa; không còn được thực thi. */
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/vital-signs`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({
                        medicalRecordId: examination.recordId,
                        heartRate: heartRate ? parseInt(heartRate) : null,
                        bloodPressure,
                        temperature: temperature ? parseFloat(temperature) : null,
                        height: height ? parseFloat(height) : null,
                        weight: weight ? parseFloat(weight) : null,
                    }),
                }
            );
            if (!res.ok) throw new Error('Không thể lưu dấu hiệu sinh tồn');
        } catch (err) {
            throw err;
        }
    };

    const validateExamination = (required) => {
        if (required && !symptoms.trim()) return 'Vui lòng nhập triệu chứng/lý do khám';
        if (required && !examResult.trim()) return 'Vui lòng nhập kết quả khám lâm sàng';
        if (required && diagnosis.selected.length === 0) return 'Vui lòng chọn ít nhất một chẩn đoán ICD-10';
        if (heartRate && (Number(heartRate) < 20 || Number(heartRate) > 250)) return 'Nhịp tim phải nằm trong khoảng 20-250 lần/phút';
        if (temperature && (Number(temperature) < 30 || Number(temperature) > 45)) return 'Nhiệt độ phải nằm trong khoảng 30-45°C';
        if (height && (Number(height) < 30 || Number(height) > 250)) return 'Chiều cao phải nằm trong khoảng 30-250 cm';
        if (weight && (Number(weight) < 2 || Number(weight) > 500)) return 'Cân nặng phải nằm trong khoảng 2-500 kg';
        if (bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(bloodPressure)) return 'Huyết áp phải có định dạng tâm thu/tâm trương, ví dụ 120/80';
        const invalidMedicine = prescriptionItems.some(med =>
            !med.name?.trim() || !med.quantity || Number(med.quantity) <= 0 || !med.unit?.trim());
        if (invalidMedicine) return 'Mỗi thuốc phải có tên, số lượng dương và đơn vị';
        return '';
    };

    // Lưu nháp - gọi API medical-records/{recordId}/draft
    const saveDraft = async () => {
        if (!examination?.recordId) {
            setError('Chưa có hồ sơ bệnh án');
            toast.error('Chưa có hồ sơ bệnh án');
            return;
        }
        const validationError = validateExamination(false);
        if (validationError) return toast.error(validationError);
        setSaving(true);
        setError('');
        try {
            // Lưu vital signs trước
            await saveVitalSigns();

            // Lưu medical record draft
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/medical-records/${examination.recordId}/draft`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({
                        chiefComplaint: symptoms,
                        clinicalFindings: examResult,
                        diagnosis: isNurse ? null : diagnosis.selected.map(item => item.label).join(', '),
                        prescriptionNote: '',
                        conclusion: isNurse ? null : notes,
                        patientInstruction: isNurse ? null : '',
                        bloodPressure,
                        heartRate: heartRate ? parseInt(heartRate) : null,
                        temperature: temperature ? parseFloat(temperature) : null,
                        weight: weight ? parseFloat(weight) : null,
                        height: height ? parseFloat(height) : null,
                        // Gửi danh sách thuốc
                        prescriptionItems: isNurse ? null : prescriptionItems
                            .filter(med => med.name?.trim() && Number(med.quantity) > 0)
                            .map(med => ({
                            medicineName: med.name.trim(),
                            quantity: Number(med.quantity),
                            unit: med.unit?.trim() || 'viên',
                            note: med.note?.trim() || null,
                            frequencyPerDay: med.frequencyPerDay ? Number(med.frequencyPerDay) : null,
                        })),
                        // Gửi danh sách ICD-10 chẩn đoán
                        icdSelections: isNurse ? null : diagnosis.selected.map(item => ({
                            code: item.code
                        })),
                        // Gửi thông tin khám lại (follow-up)
                        followUp: null,
                        version: examination.medicalRecord?.version ?? null,
                    }),
                }
            );
            if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.message || tDoctor('examination.errors.saveFailed')); }
            await res.json();
            await reload();
            toast.success('Lưu nháp thành công!');
        } catch (err) {
            setError(err.message || tDoctor('examination.errors.unknown'));
            toast.error(err.message || tDoctor('examination.errors.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    // Hoàn thành khám — gộp tạo yêu cầu xét nghiệm (testRequests) vào payload
    // Gọi API: POST /api/v1/queue-tickets/{ticketId}/complete
    const completeExam = async () => {
        if (!examination?.recordId) {
            setError('Chưa có hồ sơ bệnh án');
            toast.error('Chưa có hồ sơ bệnh án');
            return;
        }
        const validationError = validateExamination(true);
        if (validationError) return toast.error(validationError);
        const enteredMedicines = prescriptionItems.filter(med =>
            med.name?.trim() || med.quantity || med.note?.trim() || med.frequencyPerDay
        );
        const invalidMedicine = enteredMedicines.find(med =>
            !med.name?.trim() || !Number.isInteger(Number(med.quantity)) || Number(med.quantity) <= 0
        );
        if (invalidMedicine) return toast.error('Mỗi thuốc phải có tên thuốc và số lượng lớn hơn 0.');
        setCompleting(true);
        setError('');
        try {
            // Lưu vital signs trước
            await saveVitalSigns();

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/queue-tickets/${examination.ticketId}/complete`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({
                        // Thông tin chính
                        chiefComplaint: symptoms,
                        clinicalFindings: examResult,
                        diagnosis: diagnosis.selected.map(item => item.label).join(', '),
                        prescriptionNote: prescriptionAdvice.trim(),
                        conclusion: notes,
                        patientInstruction: prescriptionAdvice.trim(),

                        // Vital signs
                        bloodPressure,
                        heartRate: heartRate ? parseInt(heartRate) : null,
                        temperature: temperature ? parseFloat(temperature) : null,
                        weight: weight ? parseFloat(weight) : null,
                        height: height ? parseFloat(height) : null,

                        // Đơn thuốc
                        prescriptionItems: enteredMedicines.map(med => ({
                            medicineName: med.name.trim(),
                            quantity: Number(med.quantity),
                            unit: med.unit?.trim() || 'viên',
                            note: med.note?.trim() || null,
                            frequencyPerDay: med.frequencyPerDay ? Number(med.frequencyPerDay) : null,
                        })),

                        // ICD-10 chẩn đoán
                        icdSelections: diagnosis.selected.map(item => ({
                            code: item.code
                        })),

                        // Yêu cầu xét nghiệm — gộp vào luồng hoàn thành
                        testRequests: labOrders.selected.map(svc => ({
                            serviceId: svc.id,
                            notes: ''
                        })),

                        // Thông tin khám lại (follow-up)
                        followUp: null,
                        version: examination.medicalRecord?.version ?? null,
                    }),
                }
            );
            const responseBody = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(responseBody.message || tDoctor('examination.errors.completeFailed'));
            const completedRecord = responseBody.data ?? responseBody.result ?? responseBody;
            toast.success('Hoàn thành khám thành công!');
            const completionData = {
                record: completedRecord,
                patient,
                serviceName: examination.serviceName,
                departmentName: examination.departmentName,
                completedAt: completedRecord.completedAt ?? new Date().toISOString(),
                waitingForTests: labOrders.selected.length > 0,
            };
            sessionStorage.setItem(`exam-completion:${completedRecord.recordId}`, JSON.stringify(completionData));
            sessionStorage.setItem(`prescription-preview:${completedRecord.recordId}`, JSON.stringify(completionData));
            navigate(ROUTES.DOCTOR_EXAM_COMPLETED.replace(':recordId', completedRecord.recordId), { state: completionData });
        } catch (err) {
            setError(err.message || tDoctor('examination.errors.unknown'));
            toast.error(err.message || tDoctor('examination.errors.completeFailed'));
        } finally {
            setCompleting(false);
        }
    };

    if (loading) {
        return (
            <MedicalStaffLayout>
                <p className="text-sm text-gray-400 text-center py-20">{tDoctor('examination.loading')}</p>
            </MedicalStaffLayout>
        );
    }

    if (!examination) {
        return (
            <MedicalStaffLayout>
                <p className="text-sm text-gray-400 text-center py-20">Không có bệnh nhân nào đang khám.</p>
            </MedicalStaffLayout>
        );
    }

    return (
        <MedicalStaffLayout>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto bg-gray-50 pb-24">
                <div className="mx-auto max-w-7xl px-4 py-6 space-y-5 sm:px-6 lg:px-8">

                    {/* Patient card */}
                    {patient && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-5">
                            <div className="flex gap-4">
                                {/* Avatar */}
                                <div className="w-20 h-20 rounded-xl bg-red-100 shrink-0 overflow-hidden">
                                    <div className="w-full h-full bg-red-300" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-bold text-gray-900">{patient?.fullName ?? '—'}</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {tDoctor('examination.patient.id')}: {patient?.id} &nbsp;|&nbsp;
                                        {tDoctor('examination.patient.age')}: {patient?.age ?? '—'} &nbsp;|&nbsp;
                                        {tDoctor('examination.patient.bloodType')}: {patient?.bloodType}
                                    </p>
                                    {/* Thông tin profile chi tiết */}
                                    <div className="text-xs text-gray-400 mt-1 space-x-3">
                                        {patient?.phone && <span>{tDoctor('examination.patient.phone')}: {patient.phone}</span>}
                                        {patient?.email && <span>{tDoctor('examination.patient.email')}: {patient.email}</span>}
                                        {patient?.dateOfBirth && <span>{tDoctor('examination.patient.dob')}: {patient.dateOfBirth}</span>}
                                        {patient?.gender && <span>{tDoctor('examination.patient.gender')}: {patient.gender === 'MALE' ? tCommon('male') : patient.gender === 'FEMALE' ? tCommon('female') : tCommon('other')}</span>}
                                    </div>

                                    {/* Vitals - Editable */}
                                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 sm:grid-cols-3 lg:grid-cols-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-medium tracking-wide">{tDoctor('examination.vitals.heartRate')}</span>
                                            <input
                                                type="number"
                                                value={heartRate}
                                                onChange={e => setHeartRate(e.target.value)}
                                                placeholder="60"
                                                className="mt-1 w-14 h-7 px-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 text-center"
                                            />
                                            <span className="text-xs text-gray-300 mt-0.5">BPM</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-medium tracking-wide">{tDoctor('examination.vitals.bloodPressure')}</span>
                                            <input
                                                type="text"
                                                value={bloodPressure}
                                                onChange={e => setBloodPressure(e.target.value)}
                                                placeholder="120/80"
                                                className="mt-1 w-20 h-7 px-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-medium tracking-wide">{tDoctor('examination.vitals.temperature')}</span>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={temperature}
                                                onChange={e => setTemperature(e.target.value)}
                                                placeholder="36.5"
                                                className="mt-1 w-14 h-7 px-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 text-center"
                                            />
                                            <span className="text-xs text-gray-300 mt-0.5">°C</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-medium tracking-wide">{tDoctor('examination.vitals.height')}</span>
                                            <input
                                                type="number"
                                                value={height}
                                                onChange={e => setHeight(e.target.value)}
                                                placeholder="170"
                                                className="mt-1 w-14 h-7 px-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 text-center"
                                            />
                                            <span className="text-xs text-gray-300 mt-0.5">cm</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-medium tracking-wide">{tDoctor('examination.vitals.weight')}</span>
                                            <input
                                                type="number"
                                                value={weight}
                                                onChange={e => setWeight(e.target.value)}
                                                placeholder="60"
                                                className="mt-1 w-14 h-7 px-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 text-center"
                                            />
                                            <span className="text-xs text-gray-300 mt-0.5">kg</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History + Lab results */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Tiền sử bệnh án */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-gray-500 tracking-wide">{tDoctor('examination.history.title')}</p>
                                <button className="text-xs text-primary-500 hover:text-primary-600">{tDoctor('examination.history.viewMore')}</button>
                            </div>
                            <ul className="space-y-1.5">
                                {(examination?.history ?? []).map((h, i) => (
                                    <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                                        <span className="text-gray-300 mt-0.5">•</span>{h}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Xét nghiệm đã yêu cầu */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <p className="text-xs font-semibold text-gray-500 tracking-wide mb-3">{tDoctor('examination.labResults.title')}</p>
                            <ul className="space-y-1.5">
                                {testRequests.map((lab, i) => (
                                    <li key={i} className="text-sm text-gray-700 flex items-between gap-1.5">
                                        <span className="flex-1">{lab.serviceName || lab.testRequestId}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${lab.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            lab.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                lab.status === 'WAITING_FOR_RESULT' ? 'bg-purple-100 text-purple-700' :
                                                    lab.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                            }`}>
                                            {lab.status === 'COMPLETED' ? 'Hoàn thành' :
                                                lab.status === 'IN_PROGRESS' ? 'Đang xử lý' :
                                                    lab.status === 'WAITING_FOR_RESULT' ? 'Chờ kết quả' :
                                                        lab.status === 'CANCELLED' ? 'Đã hủy' :
                                                            'Chờ xử lý'}
                                        </span>
                                        <button
                                            onClick={() => navigate(`${ROUTES.DOCTOR_LAB_DETAIL.replace(':id', lab.testRequestId)}`)}
                                            className="text-xs text-primary-500 hover:text-primary-600 ml-2"
                                        >
                                            Chi tiết
                                        </button>
                                    </li>
                                ))}
                                {testRequests.length === 0 && (
                                    <li className="text-sm text-gray-400">Chưa có xét nghiệm nào</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Triệu chứng */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <p className={sectionTitle}>{tDoctor('examination.symptoms.title')}</p>
                        <textarea
                            value={symptoms}
                            onChange={e => setSymptoms(e.target.value)}
                            placeholder={tDoctor('examination.symptoms.placeholder')}
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 resize-none"
                        />
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <p className={sectionTitle}>{tDoctor('examination.examResult.title')}</p>
                        <textarea
                            value={examResult}
                            onChange={e => setExamResult(e.target.value)}
                            placeholder={tDoctor('examination.examResult.placeholder')}
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 resize-none"
                        />
                    </div>

                    {isNurse && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">Y tá được nhập thông tin hỗ trợ và lưu nháp. Chẩn đoán, chỉ định, kê đơn, kết luận và hoàn thành ca khám do bác sĩ phụ trách.</div>}
                    </div>
                    <div className={`${isNurse ? 'opacity-55 pointer-events-none select-none ' : ''}grid grid-cols-1 gap-5 xl:grid-cols-2`}>
                    {/* Chẩn đoán ICD-10 */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <p className={sectionTitle}>{tDoctor('examination.diagnosis.title')}</p>
                        <SearchDropdown
                            query={diagnosis.query}
                            results={diagnosis.results}
                            loading={diagnosis.loading}
                            onSearch={diagnosis.search}
                            onAdd={diagnosis.add}
                            placeholder={tDoctor('examination.diagnosis.searchPlaceholder')}
                            addLabel={tDoctor('examination.diagnosis.addBtn')}
                            showAddButton={false}
                        />
                        <TagList items={diagnosis.selected} labelKey="label" codeKey="code" onRemove={diagnosis.remove} />
                    </div>

                    {/* Xét nghiệm chỉ định — gộp vào luồng hoàn thành khám */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 xl:col-span-2">
                        <p className={sectionTitle}>Kết luận và hướng điều trị</p>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Nhập kết luận, hướng xử trí và kế hoạch điều trị..."
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 resize-none"
                        />
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 xl:col-span-2">
                        <p className="text-xs font-semibold text-gray-500 tracking-wide mb-3">{tDoctor('examination.labOrders.title')}</p>
                        {loadingLabServices ? (
                            <p className="text-sm text-gray-400">{tDoctor('examination.loading')}</p>
                        ) : (
                            <select
                                value={labSelect}
                                onChange={e => {
                                    const svc = labServices.find(s => s.serviceId === e.target.value);
                                    if (svc) labOrders.add({ id: svc.serviceId, name: svc.name });
                                    setLabSelect('');
                                }}
                                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 bg-white"
                            >
                                <option value="" disabled>{tDoctor('examination.labOrders.selectPlaceholder')}</option>
                                {labServices.map(svc => (
                                    <option key={svc.serviceId} value={svc.serviceId}>
                                        {svc.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <TagList items={labOrders.selected} labelKey="name" onRemove={labOrders.remove} />
                    </div>

                    {/* Đơn thuốc */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 xl:col-span-2">
                        <div className="flex items-center justify-between mb-3">
                            <p className={sectionTitle}>{tDoctor('examination.prescription.title')}</p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={addPrescriptionRow}
                                    className="px-3 h-7 text-xs border border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors"
                                >
                                    + Thêm thuốc
                                </button>
                                <button
                                    onClick={() => setShowPrescription(!showPrescription)}
                                    className="text-xs text-gray-500 hover:text-primary-500"
                                >
                                    {showPrescription ? 'Thu gọn' : 'Mở rộng'}
                                </button>
                            </div>
                        </div>

                        {showPrescription && (
                            <div className="space-y-2">
                                <div className="hidden xl:grid grid-cols-[minmax(220px,1.5fr)_minmax(260px,2fr)_100px_110px_120px_36px] gap-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                    <span>Tên thuốc / hoạt chất</span><span>Cách dùng</span><span>Số lượng</span><span>Đơn vị</span><span>Lần/ngày</span><span />
                                </div>
                                {prescriptionItems.map(item => (
                                    <div key={item.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 xl:grid-cols-[minmax(220px,1.5fr)_minmax(260px,2fr)_100px_110px_120px_36px]">
                                        <div className="relative min-w-0">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={e => { updatePrescription(item.id, 'name', e.target.value); setMedicineSearchRowId(item.id); }}
                                                onFocus={() => setMedicineSearchRowId(item.id)}
                                                onBlur={() => setTimeout(() => setMedicineSearchRowId(null), 150)}
                                                placeholder="Tìm hoặc nhập tên thuốc mới..."
                                                autoComplete="off"
                                                className="h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-primary-500"
                                            />
                                            {medicineSearchRowId === item.id && (
                                                <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                                                    {medicineSearching && <p className="px-3 py-2 text-xs text-gray-400">Đang tìm thuốc...</p>}
                                                    {!medicineSearching && medicineSuggestions.map(medicine => (
                                                        <button key={medicine.medicineId} type="button" onMouseDown={() => selectMedicine(item.id, medicine)} className="block w-full border-b border-gray-50 px-3 py-2.5 text-left hover:bg-primary-50">
                                                            <span className="block text-sm font-semibold text-gray-800">{medicine.name}</span>
                                                            <span className="block text-xs text-gray-400">{medicine.medicineCode}{medicine.activeIngredient ? ` • ${medicine.activeIngredient}` : ''}</span>
                                                        </button>
                                                    ))}
                                                    {!medicineSearching && medicineSuggestions.length === 0 && (
                                                        <p className="px-3 py-2.5 text-xs text-gray-500">Không có trong danh mục. Bác sĩ có thể giữ tên vừa nhập để kê thuốc ngoài danh mục.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={item.note}
                                            onChange={e => updatePrescription(item.id, 'note', e.target.value)}
                                            placeholder="Liều dùng"
                                            className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary-500"
                                        />
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={e => updatePrescription(item.id, 'quantity', e.target.value)}
                                            placeholder="Số lượng"
                                            className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-2 text-center text-sm outline-none focus:border-primary-500"
                                        />
                                        <select
                                            value={item.unit}
                                            onChange={e => updatePrescription(item.id, 'unit', e.target.value)}
                                            className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none focus:border-primary-500"
                                        >
                                            {['viên', 'gói', 'ống', 'lọ', 'chai', 'hộp', 'ml', 'mg'].map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                        </select>
                                        <select
                                            value={item.frequencyPerDay}
                                            onChange={e => updatePrescription(item.id, 'frequencyPerDay', e.target.value)}
                                            className="h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none focus:border-primary-500"
                                        >
                                            <option value="">Không chọn</option>
                                            {[1, 2, 3, 4].map(times => <option key={times} value={times}>{times} lần/ngày</option>)}
                                        </select>
                                        <input
                                            type="hidden"
                                            value={item.unit}
                                            list="prescription-unit-options"
                                            onChange={e => updatePrescription(item.id, 'unit', e.target.value)}
                                            placeholder="Đơn vị"
                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:border-primary-500"
                                        />
                                        <input
                                            type="hidden"
                                            value={item.frequencyPerDay}
                                            list="prescription-frequency-options"
                                            min="1"
                                            max="4"
                                            onChange={e => updatePrescription(item.id, 'frequencyPerDay', e.target.value)}
                                            placeholder="Sáng/Ngày"
                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-center focus:border-primary-500"
                                        />
                                        <button
                                            onClick={() => removePrescription(item.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <datalist id="prescription-unit-options">
                                    {['viên', 'gói', 'ống', 'lọ', 'chai', 'hộp', 'ml', 'mg'].map(unit => <option key={unit} value={unit} />)}
                                </datalist>
                                <datalist id="prescription-frequency-options">
                                    {[1, 2, 3, 4].map(times => <option key={times} value={times}>{times} lần/ngày</option>)}
                                </datalist>
                                <textarea
                                    value={prescriptionAdvice}
                                    onChange={e => setPrescriptionAdvice(e.target.value)}
                                    rows={2}
                                    placeholder="Lời dặn khi sử dụng thuốc"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 resize-none"
                                />
                            </div>
                        )}
                    </div>

                    {/* Ghi chú */}
                    {/* Yêu cầu khám lại (Follow-up) */}
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </div>
            </div>

            {/* ── Sticky footer ── */}
            <div className="fixed bottom-0 left-44 right-0 bg-white border-t border-gray-200 px-8 h-16 flex items-center justify-center gap-3 z-40">
                <button
                    onClick={saveDraft}
                    disabled={saving || completing}
                    className="px-8 h-10 bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-700 text-sm font-semibold rounded-xl transition-colors tracking-wide"
                >
                    {tDoctor('examination.actions.draft')}
                </button>
                <button
                    onClick={() => window.print()}
                    disabled={completing}
                    className="px-8 h-10 bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-700 text-sm font-semibold rounded-xl transition-colors tracking-wide"
                >
                    {tDoctor('examination.actions.print')}
                </button>
                {!isNurse && <button
                    onClick={completeExam}
                    disabled={saving || completing}
                    className="px-8 h-10 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors tracking-wide"
                >
                    {tDoctor('examination.actions.complete')}
                </button>}
            </div>
        </MedicalStaffLayout>
    );
}

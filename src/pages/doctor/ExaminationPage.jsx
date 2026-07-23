// src/pages/doctor/ExaminationPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Bell, User, X } from 'lucide-react';
import DoctorLayout from '@/components/layout/DoctorLayout';
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
    const { departmentId } = useParams();
    const navigate = useNavigate();
    const { t: tDoctor } = useTranslation('doctor');
    const { t: tCommon } = useTranslation('common');

    // Lấy thông tin ticket in-progress cho department
    const { ticket: examination, loading, error: loadError, reload } = useInProgressPatient(departmentId);

    // Local form state
    const [symptoms,   setSymptoms]   = useState('');
    const [examResult, setExamResult] = useState('');
    const [notes,      setNotes]      = useState('');
    const [heartRate,   setHeartRate]   = useState('');
    const [bloodPressure, setBloodPressure] = useState('');
    const [temperature, setTemperature] = useState('');
    const [height,      setHeight]      = useState('');
    const [weight,      setWeight]      = useState('');

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

    const diagnosis    = useDiagnosis([]);
    const referrals    = useTagSearch([], '/api/doctor/specialties');
    const labOrders    = useTagSearch([], '/api/doctor/lab-tests');
    const { services: labServices, loading: loadingLabServices } = useLabServices();
    const [labSelect, setLabSelect] = useState('');

    // Prescription state
    const [prescriptionItems, setPrescriptionItems] = useState([{ id: Date.now(), name: '', quantity: '', unit: 'viên', note: '', frequencyPerDay: '' }]);
    const [showPrescription, setShowPrescription] = useState(true);

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
                    const items = data.testRequests ?? data.data?.testRequests ?? [];
                    setTestRequests(items);
                }
            } catch (err) {
                console.error('Fetch test requests failed:', err);
            }
        };
        fetchTestRequests();
    }, [examination?.recordId]);

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
            if (res.ok) {
                console.log('Lưu vital signs thành công');
            }
        } catch (err) {
            console.error('Lưu vital signs lỗi:', err);
        }
    };

    // Lưu nháp - gọi API medical-records/{recordId}/draft
    const saveDraft = async () => {
        if (!examination?.recordId) {
            setError('Chưa có hồ sơ bệnh án');
            toast.error('Chưa có hồ sơ bệnh án');
            return;
        }
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
                        conclusion: notes,
                        // Gửi danh sách thuốc
                        prescriptionItems: prescriptionItems.map(med => ({
                            medicineName: med.name,
                            quantity: med.quantity ? parseInt(med.quantity) : null,
                            unit: med.unit,
                            note: med.note,
                            frequencyPerDay: med.frequencyPerDay ? parseInt(med.frequencyPerDay) : null,
                        })),
                        // Gửi danh sách ICD-10 chẩn đoán
                        icdSelections: diagnosis.selected.map(item => ({
                            code: item.code
                        })),
                    }),
                }
            );
            if (!res.ok) throw new Error(tDoctor('examination.errors.saveFailed'));
            await res.json();
            toast.success('Lưu nháp thành công!');
        } catch (err) {
            setError(err.message || tDoctor('examination.errors.unknown'));
            toast.error(err.message || tDoctor('examination.errors.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    // Hoàn thành khám - gọi API medical-records/{recordId}/complete
    const completeExam = async () => {
        if (!examination?.recordId) {
            setError('Chưa có hồ sơ bệnh án');
            toast.error('Chưa có hồ sơ bệnh án');
            return;
        }
        setCompleting(true);
        setError('');
        try {
            // Lưu vital signs trước
            await saveVitalSigns();

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/medical-records/${examination.recordId}/complete`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({
                        chiefComplaint: symptoms,
                        clinicalFindings: examResult,
                        conclusion: notes,
                        prescriptionItems: prescriptionItems.map(med => ({
                            medicineName: med.name,
                            quantity: med.quantity ? parseInt(med.quantity) : null,
                            unit: med.unit,
                            note: med.note,
                            frequencyPerDay: med.frequencyPerDay ? parseInt(med.frequencyPerDay) : null,
                        })),
                        // Gửi danh sách ICD-10 chẩn đoán
                        icdSelections: diagnosis.selected.map(item => ({
                            code: item.code
                        })),
                    }),
                }
            );
            if (!res.ok) throw new Error(tDoctor('examination.errors.completeFailed'));
            toast.success('Hoàn thành khám thành công!');
            setTimeout(() => navigate(ROUTES.DOCTOR_DEPARTMENTS), 1500);
        } catch (err) {
            setError(err.message || tDoctor('examination.errors.unknown'));
            toast.error(err.message || tDoctor('examination.errors.completeFailed'));
        } finally {
            setCompleting(false);
        }
    };

    if (loading) {
        return (
            <DoctorLayout>
                <p className="text-sm text-gray-400 text-center py-20">{tDoctor('examination.loading')}</p>
            </DoctorLayout>
        );
    }

    if (!examination) {
        return (
            <DoctorLayout>
                <p className="text-sm text-gray-400 text-center py-20">Không có bệnh nhân nào đang khám.</p>
            </DoctorLayout>
        );
    }

    return (
        <DoctorLayout>
            {/* ── Top bar ── */}
            <div className="h-13 bg-white border-b border-gray-200 px-6 flex items-center gap-4 shrink-0">
                <h1 className="text-sm font-semibold text-gray-800 shrink-0">{tDoctor('examination.pageTitle')}</h1>
                <div className="relative flex-1 max-w-lg">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                        type="text"
                        placeholder={tDoctor('examination.searchPlaceholder')}
                        className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 bg-gray-50"
                    />
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                        <Bell size={16} />
                    </button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                        <User size={16} />
                    </button>
                </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto bg-gray-50 pb-24">
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

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
                                    <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-100">
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
                    <div className="grid grid-cols-2 gap-4">
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
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            lab.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
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

                    {/* Xét nghiệm chỉ định */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-500 tracking-wide">{tDoctor('examination.labOrders.title')}</p>
                            <button
                                onClick={async () => {
                                    if (!examination?.recordId || labOrders.selected.length === 0) return;
                                    try {
                                        const res = await fetch(
                                            `${import.meta.env.VITE_API_URL}/api/v1/test-requests/batch`,
                                            {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json', ...authHeader() },
                                                body: JSON.stringify({
                                                    medicalRecordId: examination.recordId,
                                                    serviceIds: labOrders.selected.map(s => s.id),
                                                    performingDepartmentId: departmentId,
                                                    requestedById: get('staffId') || get('accountId'),
                                                    notes: ''
                                                }),
                                            }
                                        );
                                        if (!res.ok) throw new Error('Gửi yêu cầu xét nghiệm thất bại');
                                        toast.success('Gửi yêu cầu xét nghiệm thành công!');
                                        labOrders.clear && labOrders.clear();
                                    } catch (err) {
                                        toast.error(err.message || 'Gửi yêu cầu xét nghiệm thất bại');
                                    }
                                }}
                                disabled={labOrders.selected.length === 0}
                                className="px-3 h-7 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
                            >
                                {tDoctor('examination.labOrders.createBtn')}
                            </button>
                        </div>
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
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
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
                            {prescriptionItems.map(item => (
                                <div key={item.id} className="border border-gray-100 rounded-lg p-3 grid grid-cols-[1fr_120px_80px_80px_80px_30px] gap-2 items-center">
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={e => updatePrescription(item.id, 'name', e.target.value)}
                                        placeholder="Tên thuốc..."
                                        className="text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-2 py-1 focus:border-primary-500"
                                    />
                                    <input
                                        type="text"
                                        value={item.note}
                                        onChange={e => updatePrescription(item.id, 'note', e.target.value)}
                                        placeholder="Liều dùng"
                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:border-primary-500"
                                    />
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={e => updatePrescription(item.id, 'quantity', e.target.value)}
                                        placeholder="Số lượng"
                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-center focus:border-primary-500"
                                    />
                                    <input
                                        type="text"
                                        value={item.unit}
                                        onChange={e => updatePrescription(item.id, 'unit', e.target.value)}
                                        placeholder="Đơn vị"
                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:border-primary-500"
                                    />
                                    <input
                                        type="number"
                                        value={item.frequencyPerDay}
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
                        </div>
                        )}
                    </div>

                    {/* Ghi chú */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <p className={sectionTitle}>{tDoctor('examination.notes.title')}</p>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder={tDoctor('examination.notes.placeholder')}
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 resize-none"
                        />
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
                <button
                    onClick={completeExam}
                    disabled={saving || completing}
                    className="px-8 h-10 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors tracking-wide"
                >
                    {tDoctor('examination.actions.complete')}
                </button>
            </div>
        </DoctorLayout>
    );
}
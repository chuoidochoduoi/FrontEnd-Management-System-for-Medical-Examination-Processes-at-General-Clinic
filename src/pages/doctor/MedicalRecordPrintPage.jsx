import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, Printer, RefreshCw } from 'lucide-react';
import useClinicInformation from '@/hooks/useClinicInformation';

const stored = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const show = (value) => value === null || value === undefined || value === '' ? '—' : value;
const Field = ({ label, children, wide = false }) => <div className={wide ? 'col-span-2' : ''}><span className="font-semibold">{label}: </span><span className="whitespace-pre-wrap">{show(children)}</span></div>;
const genderLabel = (gender) => ({ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }[gender] || '—');
const testStatusLabel = (status) => ({ PENDING: 'Chờ thực hiện', WAITING: 'Chờ thực hiện', IN_PROGRESS: 'Đang thực hiện', COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy' }[status] || status || 'Chưa xác định');

const normalizeCustomerData = (visit, recordId) => {
    const record = (visit?.examinations || []).find((item) => String(item.recordId) === String(recordId) && item.status === 'COMPLETED');
    if (!record) return null;
    return {
        record: { ...record, icdSelections: record.diagnoses || [], prescriptionItems: record.prescriptionItems || [] },
        patient: { fullName: visit.patientName, dateOfBirth: visit.patientDateOfBirth, gender: visit.patientGender, phone: visit.patientPhone, address: visit.patientAddress },
        serviceName: record.serviceName,
        departmentName: record.departmentName,
        roomCode: record.roomCode,
        completedAt: record.completedAt,
        visitCode: visit.visitCode,
        patientAllergies: visit.patientAllergies,
        relatedTests: (visit.tests || []).filter((test) => String(test.orderingRecordId || '') === String(recordId)),
    };
};

export default function MedicalRecordPrintPage() {
    const { recordId } = useParams();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { clinicInformation } = useClinicInformation();
    const role = (stored('systemRole') || stored('role') || '').replace('ROLE_', '').toUpperCase();
    const isCustomer = role === 'CUSTOMER' || location.state?.source === 'CUSTOMER';
    const patientProfileId = searchParams.get('patientProfileId') || '';
    const initialData = useMemo(() => {
        if (location.state?.visit && isCustomer) return normalizeCustomerData(location.state.visit, recordId);
        if (location.state?.record) return location.state;
        try { return JSON.parse(sessionStorage.getItem(`exam-completion:${recordId}`)); } catch { return null; }
    }, [isCustomer, location.state, recordId]);
    const [data, setData] = useState(initialData);
    const [allergies, setAllergies] = useState(null);
    const [loading, setLoading] = useState(isCustomer);
    const [error, setError] = useState('');

    const loadCustomerRecord = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (patientProfileId) params.set('patientProfileId', patientProfileId);
            const query = params.toString();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/patient/medical-history/${recordId}${query ? `?${query}` : ''}`, { headers: { Authorization: `Bearer ${stored('token')}` } });
            if (!response.ok) {
                let message = 'Không thể tải bệnh án này.';
                try { message = (await response.json())?.message || message; } catch { /* Phản hồi lỗi không phải JSON. */ }
                throw new Error(message);
            }
            const normalized = normalizeCustomerData(await response.json(), recordId);
            if (!normalized) throw new Error('Bệnh án chưa hoàn thành hoặc không còn khả dụng.');
            setData(normalized);
        } catch (err) {
            setError(err?.message || 'Không thể tải bệnh án này.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isCustomer) {
            loadCustomerRecord();
            return;
        }
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-records/${recordId}/patient-allergies`, { headers: { Authorization: `Bearer ${stored('token')}` } })
            .then((response) => response.ok ? response.json() : null).then(setAllergies).catch(() => setAllergies(null));
    }, [isCustomer, patientProfileId, recordId]);

    if (loading && !data) return <div className="flex min-h-screen items-center justify-center gap-3 bg-gray-50 text-gray-600"><Loader2 className="animate-spin" size={22}/>Đang tải bệnh án...</div>;
    if (error || !data?.record) return <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6"><div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-7 text-center shadow-sm"><AlertCircle className="mx-auto text-red-500" size={34}/><h1 className="mt-3 text-lg font-bold text-gray-900">Không thể mở bệnh án</h1><p className="mt-2 text-sm text-gray-600">{error || 'Không tìm thấy dữ liệu bệnh án.'}</p><div className="mt-5 flex justify-center gap-3"><button onClick={() => navigate(-1)} className="rounded-lg border px-4 py-2 text-sm">Quay lại</button>{isCustomer && <button onClick={loadCustomerRecord} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"><RefreshCw size={15}/>Thử lại</button>}</div></div></div>;

    const { record, patient } = data;
    const vitals = record.vitalSigns || {};
    const diagnoses = Array.from(record.icdSelections || record.diagnoses || []);
    const medicines = Array.from(record.prescriptionItems || []);
    const relatedTests = Array.from(data.relatedTests || record.testRequests || []);
    const completedDate = data.completedAt || record.completedAt ? new Date(data.completedAt || record.completedAt) : new Date();
    const currentAllergies = allergies || data.patientAllergies || { status: 'UNVERIFIED', items: [] };
    const recordCode = record.recordCode || recordId.slice(0, 8).toUpperCase();
    const serviceName = data.serviceName || record.serviceName || 'Khám bệnh';
    const department = [data.departmentName || record.departmentName, data.roomCode || record.roomCode].filter(Boolean).join(' · ');

    return <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
        <style>{`@page{size:A4;margin:16mm 12mm 14mm}.print-block{break-inside:avoid;page-break-inside:avoid}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}@media print{.no-print{display:none!important}.record-sheet{box-shadow:none!important;width:100%!important;max-width:none!important;min-height:auto!important;margin:0!important;padding:0!important}.repeat-print-header{display:flex!important;position:fixed;top:-11mm;left:0;right:0;border-bottom:1px solid #9ca3af;padding-bottom:2mm;font-size:9px;background:white}}`}</style>
        <div className="repeat-print-header hidden items-center justify-between"><span>{clinicInformation.clinicName || 'CareS'}</span><strong>{serviceName}</strong><span>{recordCode}</span></div>
        <div className="no-print mx-auto mb-4 flex w-[210mm] max-w-[calc(100vw-32px)] justify-between"><button onClick={() => navigate(-1)} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm shadow"><ArrowLeft size={16}/>Quay lại</button><button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white"><Printer size={16}/>In bệnh án</button></div>
        <article className="record-sheet mx-auto min-h-[297mm] w-[210mm] max-w-[calc(100vw-32px)] bg-white px-[13mm] py-[11mm] text-[12px] leading-relaxed text-gray-900 shadow-lg">
            <header className="grid grid-cols-[64px_1fr_140px] items-center border-b-2 border-teal-800 pb-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-3xl font-bold text-teal-700">+</div><div className="text-center"><p className="text-lg font-bold uppercase">{clinicInformation.clinicName || 'CareS'}</p>{clinicInformation.legalName && <p>{clinicInformation.legalName}</p>}<p className="text-[10px]">Địa chỉ: {show(clinicInformation.address)} · Điện thoại: {show(clinicInformation.phone)}</p></div><div className="text-right text-[10px]"><p>Mã bệnh án</p><p className="text-xs font-bold">{recordCode}</p><p className="mt-1">Mã lượt: {show(data.visitCode)}</p></div></header>
            <div className="my-4 text-center"><h1 className="text-xl font-bold uppercase">Phiếu khám bệnh ngoại trú</h1><p className="mt-1 text-base font-bold text-teal-800">{serviceName}</p></div>
            <section className="print-block grid grid-cols-2 gap-x-8 gap-y-1 border border-gray-500 p-3"><Field label="Họ và tên">{patient?.fullName}</Field><Field label="Giới tính">{genderLabel(patient?.gender)}</Field><Field label="Ngày sinh">{patient?.dateOfBirth}</Field><Field label="Điện thoại">{patient?.phone}</Field><Field label="Địa chỉ" wide>{patient?.address}</Field><Field label="Ngày khám">{completedDate.toLocaleString('vi-VN')}</Field><Field label="Phòng khám">{department}</Field><Field label="Bác sĩ" wide>{record.doctorConfirmedByName || record.doctorName}</Field></section>
            <section className="print-block mt-3 border border-amber-400 bg-amber-50 p-3"><p className="font-bold uppercase">Cảnh báo dị ứng</p><p className="mt-1">{currentAllergies.status === 'REPORTED' ? (currentAllergies.items || []).join(', ') : currentAllergies.status === 'NONE_REPORTED' ? 'Đã xác nhận chưa ghi nhận dị ứng' : 'Chưa xác minh dị ứng'}</p></section>
            <section className="print-block"><h2 className="mt-4 border-b border-gray-500 pb-1 font-bold uppercase">I. Chỉ số sinh hiệu</h2><div className="mt-2 grid grid-cols-5 gap-2 text-center"><div><b>Nhịp tim</b><br/>{show(vitals.heartRate)} lần/phút</div><div><b>Huyết áp</b><br/>{show(vitals.bloodPressure)} mmHg</div><div><b>Nhiệt độ</b><br/>{show(vitals.temperature)} °C</div><div><b>Chiều cao</b><br/>{show(vitals.height)} cm</div><div><b>Cân nặng</b><br/>{show(vitals.weight)} kg</div></div></section>
            <h2 className="mt-4 border-b border-gray-500 pb-1 font-bold uppercase">II. Nội dung khám</h2><div className="mt-2 space-y-2"><Field label="Lý do khám / triệu chứng">{record.chiefComplaint || record.symptoms}</Field><Field label="Khám lâm sàng">{record.clinicalFindings || record.clinicalResult}</Field></div>
            <section className="print-block"><h2 className="mt-4 border-b border-gray-500 pb-1 font-bold uppercase">III. Chẩn đoán</h2><div className="mt-2">{diagnoses.length ? diagnoses.map((diagnosis, index) => <p key={`${diagnosis.code || 'diagnosis'}-${index}`}><b>{show(diagnosis.code)}</b> – {show(diagnosis.label || diagnosis.codeName || diagnosis.name)}</p>) : <p>{show(record.diagnosis)}</p>}</div></section>
            <section className="print-block"><h2 className="mt-4 border-b border-gray-500 pb-1 font-bold uppercase">IV. Kết luận và hướng điều trị</h2><p className="mt-2 whitespace-pre-wrap"><b>Kết luận:</b> {show(record.conclusion)}</p><p className="mt-1 whitespace-pre-wrap"><b>Hướng điều trị:</b> {show(record.treatmentPlan || record.conclusion)}</p><p className="mt-1 whitespace-pre-wrap"><b>Dặn dò / tái khám:</b> {show(record.patientInstruction || record.followUpNote)}</p></section>
            <section className="print-block"><h2 className="mt-4 border-b border-gray-500 pb-1 font-bold uppercase">V. Cận lâm sàng liên quan</h2>{relatedTests.length ? <table className="mt-2 w-full border-collapse"><thead><tr><th className="w-10 border border-gray-500 p-1">STT</th><th className="border border-gray-500 p-1 text-left">Dịch vụ</th><th className="w-36 border border-gray-500 p-1 text-left">Trạng thái</th></tr></thead><tbody>{relatedTests.map((test, index) => <tr key={test.testRequestId || test.id || index}><td className="border border-gray-500 p-1 text-center">{index + 1}</td><td className="border border-gray-500 p-1">{show(test.serviceName || test.name)}</td><td className="border border-gray-500 p-1">{testStatusLabel(test.status)}</td></tr>)}</tbody></table> : <p className="mt-2">Không chỉ định cận lâm sàng.</p>}<p className="mt-1 text-[10px] italic text-gray-500">Kết quả chi tiết được phát hành trên phiếu kết quả cận lâm sàng riêng.</p></section>
            <section className="print-block"><h2 className="mt-4 border-b border-gray-500 pb-1 font-bold uppercase">VI. Đơn thuốc</h2>{medicines.length ? <table className="mt-2 w-full border-collapse"><thead><tr><th className="border border-gray-500 p-1">STT</th><th className="border border-gray-500 p-1 text-left">Tên thuốc</th><th className="border border-gray-500 p-1">SL</th><th className="border border-gray-500 p-1">ĐVT</th><th className="border border-gray-500 p-1 text-left">Cách dùng</th></tr></thead><tbody>{medicines.map((medicine, index) => <tr key={medicine.prescriptionItemId || index}><td className="border border-gray-500 p-1 text-center">{index + 1}</td><td className="border border-gray-500 p-1">{medicine.medicineName}</td><td className="border border-gray-500 p-1 text-center">{medicine.quantity}</td><td className="border border-gray-500 p-1 text-center">{medicine.unit}</td><td className="border border-gray-500 p-1">{show(medicine.note)}{medicine.frequencyPerDay ? ` (${medicine.frequencyPerDay} lần/ngày)` : ''}</td></tr>)}</tbody></table> : <p className="mt-2">Không kê thuốc.</p>}</section>
            <footer className="print-block mt-8 ml-auto w-64 text-center"><p>Ngày {completedDate.getDate()} tháng {completedDate.getMonth() + 1} năm {completedDate.getFullYear()}</p><p className="font-bold uppercase">Bác sĩ điều trị</p><p className="text-[10px] italic">(Ký, ghi rõ họ tên)</p><div className="h-16"/><p className="font-bold">{show(record.doctorConfirmedByName || record.doctorName)}</p></footer>
        </article>
    </div>;
}

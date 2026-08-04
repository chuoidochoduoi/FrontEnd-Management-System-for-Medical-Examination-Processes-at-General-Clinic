import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';

const show = value => value === null || value === undefined || value === '' ? '-' : value;
const Field = ({ label, children, wide = false }) => <div className={wide ? 'col-span-2' : ''}><span className="font-bold">{label}: </span><span className="whitespace-pre-wrap">{show(children)}</span></div>;

export default function MedicalRecordPrintPage() {
    const { recordId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const data = useMemo(() => {
        if (location.state?.record) return location.state;
        try { return JSON.parse(sessionStorage.getItem(`exam-completion:${recordId}`)); } catch { return null; }
    }, [location.state, recordId]);
    if (!data?.record) return <div className="p-10 text-center">Không tìm thấy dữ liệu bệnh án.</div>;

    const { record, patient } = data;
    const vitals = record.vitalSigns ?? {};
    const diagnoses = Array.from(record.icdSelections ?? []);
    const medicines = Array.from(record.prescriptionItems ?? []);
    const completedDate = new Date(data.completedAt ?? Date.now());

    return <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
        <style>{`@page{size:A4;margin:10mm}@media print{.no-print{display:none!important}.record-sheet{box-shadow:none!important;width:100%!important;margin:0!important;padding:0!important}}`}</style>
        <div className="no-print mx-auto mb-4 flex w-[210mm] max-w-[calc(100vw-32px)] justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm shadow"><ArrowLeft size={16}/> Quay lại</button>
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white"><Printer size={16}/> In bệnh án</button>
        </div>
        <article className="record-sheet mx-auto min-h-[297mm] w-[210mm] max-w-[calc(100vw-32px)] bg-white px-[13mm] py-[11mm] text-[12px] leading-relaxed text-gray-900 shadow-lg">
            <header className="grid grid-cols-[70px_1fr_130px] border-b-2 border-gray-900 pb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-600 text-3xl font-bold text-red-600">+</div>
                <div className="text-center"><p className="text-lg font-bold uppercase">Phòng khám đa khoa</p><p>HỆ THỐNG QUẢN LÝ PHÒNG KHÁM</p><p className="text-[10px]">Địa chỉ: - &nbsp; • &nbsp; Điện thoại: -</p></div>
                <div className="text-right text-[10px]"><p>Mã bệnh án</p><p className="text-xs font-bold">{recordId.slice(0, 8).toUpperCase()}</p></div>
            </header>
            <h1 className="my-4 text-center text-xl font-bold uppercase">Phiếu bệnh án khám ngoại trú</h1>

            <section className="grid grid-cols-2 gap-x-8 gap-y-1 border border-gray-700 p-3">
                <Field label="Họ và tên">{patient?.fullName}</Field><Field label="Giới tính">{patient?.gender === 'MALE' ? 'Nam' : patient?.gender === 'FEMALE' ? 'Nữ' : '-'}</Field>
                <Field label="Ngày sinh">{patient?.dateOfBirth}</Field><Field label="Điện thoại">{patient?.phone}</Field>
                <Field label="Địa chỉ" wide>{patient?.address}</Field><Field label="Dịch vụ">{data.serviceName}</Field><Field label="Phòng khám">{data.departmentName}</Field>
            </section>

            <h2 className="mt-4 border-b border-gray-700 pb-1 font-bold uppercase">I. Chỉ số sinh hiệu</h2>
            <div className="mt-2 grid grid-cols-5 gap-2 text-center"><div><b>Mạch</b><br/>{show(vitals.heartRate)} lần/phút</div><div><b>Huyết áp</b><br/>{show(vitals.bloodPressure)} mmHg</div><div><b>Nhiệt độ</b><br/>{show(vitals.temperature)} °C</div><div><b>Chiều cao</b><br/>{show(vitals.height)} cm</div><div><b>Cân nặng</b><br/>{show(vitals.weight)} kg</div></div>

            <h2 className="mt-4 border-b border-gray-700 pb-1 font-bold uppercase">II. Nội dung khám</h2>
            <div className="mt-2 space-y-2"><Field label="Lý do khám / triệu chứng">{record.chiefComplaint}</Field><Field label="Khám lâm sàng">{record.clinicalFindings}</Field></div>

            <h2 className="mt-4 border-b border-gray-700 pb-1 font-bold uppercase">III. Chẩn đoán</h2>
            <div className="mt-2">{diagnoses.length ? diagnoses.map(d => <p key={d.code}><b>{d.code}</b> – {show(d.codeName || d.name)}</p>) : <p>{show(record.diagnosis)}</p>}</div>

            <h2 className="mt-4 border-b border-gray-700 pb-1 font-bold uppercase">IV. Kết luận và hướng điều trị</h2>
            <p className="mt-2 min-h-12 whitespace-pre-wrap">{show(record.conclusion)}</p>

            <h2 className="mt-4 border-b border-gray-700 pb-1 font-bold uppercase">V. Đơn thuốc</h2>
            {medicines.length ? <table className="mt-2 w-full border-collapse"><thead><tr><th className="border border-gray-700 p-1">STT</th><th className="border border-gray-700 p-1 text-left">Tên thuốc</th><th className="border border-gray-700 p-1">SL</th><th className="border border-gray-700 p-1">ĐVT</th><th className="border border-gray-700 p-1 text-left">Cách dùng</th></tr></thead><tbody>{medicines.map((m,i)=><tr key={m.prescriptionItemId ?? i}><td className="border border-gray-700 p-1 text-center">{i+1}</td><td className="border border-gray-700 p-1">{m.medicineName}</td><td className="border border-gray-700 p-1 text-center">{m.quantity}</td><td className="border border-gray-700 p-1 text-center">{m.unit}</td><td className="border border-gray-700 p-1">{show(m.note)}{m.frequencyPerDay ? ` (${m.frequencyPerDay} lần/ngày)` : ''}</td></tr>)}</tbody></table> : <p className="mt-2">Không kê thuốc.</p>}
            <p className="mt-2"><b>Lời dặn:</b> {show(record.patientInstruction || record.prescriptionNote)}</p>

            <footer className="mt-8 ml-auto w-64 text-center"><p>Ngày {completedDate.getDate()} tháng {completedDate.getMonth()+1} năm {completedDate.getFullYear()}</p><p className="font-bold uppercase">Bác sĩ điều trị</p><div className="h-16"/><p className="font-bold">{show(record.doctorConfirmedByName || record.doctorName)}</p></footer>
        </article>
    </div>;
}

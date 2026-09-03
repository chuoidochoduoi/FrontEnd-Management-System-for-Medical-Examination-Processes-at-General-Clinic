import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import PatientAllergyBanner from '@/components/clinical/PatientAllergyBanner';
import { ROUTES } from '@/constants/routes';

const show = value => value === null || value === undefined || value === '' ? '-' : value;
const token = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const examinationDiagnosis = exam => exam.diagnoses?.length
    ? exam.diagnoses.map(item => `${item.code || ''} ${item.name || item.codeName || ''}`.trim()).join(', ')
    : exam.diagnosis;

export default function PatientVisitDetailPage() {
    const { id, visitId } = useParams();
    const navigate = useNavigate();
    const [visit, setVisit] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/receptionist/records/customers/${id}/visits/${visitId}`, {
            headers: { Authorization: `Bearer ${token()}` },
        }).then(async response => {
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.message || 'Không thể tải bệnh án.');
            return body;
        }).then(setVisit).catch(requestError => setError(requestError.message));
    }, [id, visitId]);

    const openAttachment = async url => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, { headers: { Authorization: `Bearer ${token()}` } });
            if (!response.ok) throw new Error('Không thể mở tệp kết quả.');
            const blobUrl = URL.createObjectURL(await response.blob());
            window.open(blobUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (openError) {
            toast.error(openError.message);
        }
    };

    return <ReceptionistLayout><div className="cares-reception-screen">
        <div className="cares-reception-page-header"><div><h1 className="text-xl font-bold text-gray-900">Chi tiết lượt khám</h1><p className="mt-1 text-sm text-gray-400">Mã lượt khám: {show(visit?.visitCode || visit?.recordId)}</p></div><button onClick={() => navigate(ROUTES.RECEPTIONIST_PATIENT_DETAIL.replace(':id', id))} className="flex min-h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-500"><ArrowLeft size={18}/> Hồ sơ bệnh nhân</button></div>
        {error && <p className="py-16 text-center text-red-500">{error}</p>}
        {!visit && !error && <p className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</p>}
        {visit && <>
            <PatientAllergyBanner value={visit.patientAllergies} currentLabel/>
            <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Card title="Triệu chứng / Lý do khám" text={visit.symptoms}/><Card title="Kết quả khám lâm sàng" text={visit.clinicalResult}/><Card title="Chẩn đoán" text={visit.diagnoses?.map(item => `${item.code || ''} ${item.name || item.codeName || ''}`.trim()).join(', ')}/><Card title="Kết luận và hướng điều trị" text={visit.treatmentPlan}/><Card title="Dặn dò" text={visit.followUpNote}/><Card title="Đơn thuốc" text={visit.prescription}/>
            </section>

            <section className="space-y-4">
                <div><h2 className="text-base font-bold text-gray-900">Các bệnh án trong lượt khám</h2><p className="mt-1 text-xs text-gray-400">Mỗi dịch vụ khám được lưu thành một bệnh án độc lập.</p></div>
                {visit.examinations?.length ? visit.examinations.map(exam => <article key={exam.recordId} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div><h3 className="font-bold text-gray-900">{exam.serviceName || 'Khám bệnh'}</h3><p className="mt-1 text-xs text-gray-400">{exam.doctorName || '-'} • {exam.status || '-'}</p></div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card title="Lý do khám" text={exam.chiefComplaint || exam.symptoms}/>
                        <Card title="Kết quả khám lâm sàng" text={exam.clinicalFindings || exam.clinicalResult}/>
                        <Card title="Chẩn đoán" text={examinationDiagnosis(exam)}/>
                        <Card title="Kết luận và hướng điều trị" text={exam.conclusion || exam.treatmentPlan}/>
                    </div>
                    {exam.patientInstruction && <p className="rounded-xl bg-teal-50 p-4 text-sm text-teal-900"><b>Dặn dò:</b> {exam.patientInstruction}</p>}
                </article>) : <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">Không có bệnh án khám.</p>}
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="mb-4 text-sm font-bold">Kết quả cận lâm sàng</h2>{visit.tests?.length ? <div className="space-y-5">{visit.tests.map(test => <article key={test.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold text-gray-800">{test.name || test.serviceName}</p><p className="mt-1 text-xs text-gray-400">{test.departmentName || '-'} • {test.status || '-'}</p></div>{test.hasAbnormal && <span className="h-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Có chỉ số bất thường</span>}</div>
                {test.results?.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-3 py-2">Chỉ số</th><th className="px-3 py-2">Kết quả</th><th className="px-3 py-2">Khoảng tham chiếu</th><th className="px-3 py-2">Đánh giá</th></tr></thead><tbody className="divide-y divide-gray-100">{test.results.map((result, index) => <tr key={`${result.name}-${index}`}><td className="px-3 py-2 font-medium">{result.name}</td><td className="px-3 py-2">{result.result} {result.unit || ''}</td><td className="px-3 py-2 text-gray-500">{show(result.referenceRange)}</td><td className={`px-3 py-2 font-semibold ${['HIGH','LOW','ABNORMAL'].includes(result.assessment) ? 'text-amber-700' : 'text-emerald-700'}`}>{result.assessment || 'NOT_EVALUATED'}</td></tr>)}</tbody></table></div>}
                <p className="mt-4 whitespace-pre-wrap text-sm text-gray-600"><b>Kết luận:</b> {show(test.conclusion)}</p>
                {test.attachments?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{test.attachments.map(file => <button type="button" key={file.attachmentId} onClick={() => openAttachment(file.url)} className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700"><FileText size={14}/>{file.originalName}</button>)}</div>}
            </article>)}</div> : <p className="text-sm text-gray-400">Chưa có kết quả cận lâm sàng.</p>}</section>

            {visit.sameDayReferencedResults?.length > 0 && <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <h2 className="text-sm font-bold text-blue-900">Kết quả tham chiếu từ lượt khác trong cùng ngày</h2>
                <p className="mt-1 text-xs text-blue-700">Chỉ đọc; không thuộc hóa đơn hoặc chỉ định của lượt hiện tại.</p>
                <div className="mt-4 space-y-4">{visit.sameDayReferencedResults.map(test => <article key={test.testRequestId} className="rounded-xl border border-blue-100 bg-white p-4">
                    <div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold text-gray-800">{test.serviceName}</p><p className="mt-1 text-xs text-gray-400">{test.sourceVisitCode} • {test.sourceExaminationServiceName || 'Lượt khám trước'} • {test.performingDepartmentName || '-'}</p></div><span className="h-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Đã ký</span></div>
                    {test.results?.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-3 py-2">Chỉ số</th><th className="px-3 py-2">Kết quả</th><th className="px-3 py-2">Khoảng tham chiếu</th><th className="px-3 py-2">Đánh giá</th></tr></thead><tbody className="divide-y divide-gray-100">{test.results.map((result, index) => <tr key={`${result.name}-${index}`}><td className="px-3 py-2 font-medium">{result.name}</td><td className="px-3 py-2">{result.result} {result.unit || ''}</td><td className="px-3 py-2 text-gray-500">{show(result.referenceRange)}</td><td className={`px-3 py-2 font-semibold ${['HIGH','LOW','ABNORMAL'].includes(result.assessment) ? 'text-amber-700' : 'text-emerald-700'}`}>{result.assessment || 'NOT_EVALUATED'}</td></tr>)}</tbody></table></div>}
                    <p className="mt-4 whitespace-pre-wrap text-sm text-gray-600"><b>Kết luận:</b> {show(test.conclusion)}</p>
                    {test.attachments?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{test.attachments.map(file => <button type="button" key={file.attachmentId} onClick={() => openAttachment(file.url)} className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700"><FileText size={14}/>{file.originalName}</button>)}</div>}
                </article>)}</div>
            </section>}
        </>}
    </div></ReceptionistLayout>;
}

function Card({ title, text }) {
    return <section className="min-h-32 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="mb-3 text-sm font-bold text-gray-900">{title}</h2><p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">{show(text)}</p></section>;
}

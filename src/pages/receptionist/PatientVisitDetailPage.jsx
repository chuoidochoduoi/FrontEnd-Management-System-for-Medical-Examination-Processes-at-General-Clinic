import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { ROUTES } from '@/constants/routes';

const show = value => value || '-';
export default function PatientVisitDetailPage() {
    const { id, visitId } = useParams(); const navigate = useNavigate();
    const [visit, setVisit] = useState(null); const [error, setError] = useState('');
    useEffect(() => { fetch(`${import.meta.env.VITE_API_URL}/api/receptionist/records/customers/${id}/visits/${visitId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}` } }).then(async res => { if (!res.ok) throw new Error('Không thể tải bệnh án.'); return res.json(); }).then(setVisit).catch(e => setError(e.message)); }, [id, visitId]);
    return <ReceptionistLayout><div className="mx-auto max-w-6xl space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-gray-900">Chi tiết lượt khám</h1><p className="mt-1 text-sm text-gray-400">Mã bệnh án: {show(visit?.recordId)}</p></div><button onClick={() => navigate(ROUTES.RECEPTIONIST_PATIENT_DETAIL.replace(':id', id))} className="flex items-center gap-2 text-sm text-gray-500"><ArrowLeft size={16}/> Hồ sơ bệnh nhân</button></div>
        {error && <p className="py-16 text-center text-red-500">{error}</p>}
        {visit && <><section className="grid grid-cols-1 gap-5 md:grid-cols-2"><Card title="Triệu chứng / Lý do khám" text={visit.symptoms}/><Card title="Kết quả khám lâm sàng" text={visit.clinicalResult}/><Card title="Chẩn đoán" text={visit.diagnoses?.map(item => `${item.code || ''} ${item.name || item.codeName || ''}`.trim()).join(', ')}/><Card title="Kết luận và hướng điều trị" text={visit.treatmentPlan}/><Card title="Dặn dò" text={visit.followUpNote}/><Card title="Đơn thuốc" text={visit.prescription}/></section>
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="mb-4 text-sm font-bold">Kết quả cận lâm sàng</h2>{visit.tests?.length ? visit.tests.map(test => <div key={test.id} className="border-b border-gray-100 py-3"><p className="font-medium text-gray-800">{test.name || test.serviceName}</p><p className="mt-1 text-sm text-gray-500">{show(test.conclusion)}</p>{test.imageUrl && <a className="mt-1 inline-block text-sm text-primary-600" href={test.imageUrl} target="_blank" rel="noreferrer">Xem phiếu kết quả</a>}</div>) : <p className="text-sm text-gray-400">-</p>}</section></>}
    </div></ReceptionistLayout>;
}
function Card({ title, text }) { return <section className="min-h-32 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="mb-3 text-sm font-bold text-gray-900">{title}</h2><p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">{show(text)}</p></section>; }

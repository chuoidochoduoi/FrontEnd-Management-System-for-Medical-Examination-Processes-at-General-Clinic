import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, FlaskConical, FileText, Pill, ArrowLeft } from 'lucide-react';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import { ROUTES } from '@/constants/routes';

const text = value => value || '-';

export default function ExamCompletionPage() {
    const { recordId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const data = useMemo(() => {
        if (location.state?.record) return location.state;
        try { return JSON.parse(sessionStorage.getItem(`exam-completion:${recordId}`)); } catch { return null; }
    }, [location.state, recordId]);

    if (!data?.record) return <MedicalStaffLayout><div className="p-10 text-center text-gray-500">Không tìm thấy thông tin ca khám.</div></MedicalStaffLayout>;
    const { record, patient } = data;
    const medicines = Array.from(record.prescriptionItems ?? []);
    const diagnoses = Array.from(record.icdSelections ?? []);
    const go = (route) => navigate(route.replace(':recordId', recordId), { state: data });

    return <MedicalStaffLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-10">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className={`rounded-2xl border p-6 ${data.waitingForTests ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
                    <div className="flex items-start gap-4">
                        {data.waitingForTests ? <FlaskConical className="text-amber-600" size={34}/> : <CheckCircle2 className="text-emerald-600" size={34}/>} 
                        <div><h1 className="text-2xl font-bold text-gray-900">{data.waitingForTests ? 'Đã kết thúc bước khám – chờ cận lâm sàng' : 'Đã kết thúc ca khám'}</h1><p className="mt-1 text-sm text-gray-600">{data.waitingForTests ? 'Hồ sơ chưa phải kết luận cuối. Bệnh nhân cần hoàn thành xét nghiệm và quay lại bác sĩ.' : 'Kết luận đã được lưu vào bệnh án. Có thể xem trước và in giấy tờ bên dưới.'}</p></div>
                    </div>
                </section>

                <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div><p className="text-xs text-gray-400">Bệnh nhân</p><p className="font-semibold">{text(patient?.fullName)}</p></div>
                    <div><p className="text-xs text-gray-400">Dịch vụ</p><p className="font-semibold">{text(data.serviceName)}</p></div>
                    <div><p className="text-xs text-gray-400">Phòng khám</p><p className="font-semibold">{text(data.departmentName)}</p></div>
                    <div><p className="text-xs text-gray-400">Bác sĩ</p><p className="font-semibold">{text(record.doctorConfirmedByName || record.doctorName)}</p></div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                    <section className="rounded-2xl border border-gray-200 bg-white p-6"><h2 className="mb-3 font-bold">Chẩn đoán</h2>{diagnoses.length ? diagnoses.map(d => <p key={d.code} className="mb-2 rounded-lg bg-gray-50 p-3 text-sm"><b>{d.code}</b> – {d.codeName || d.name}</p>) : <p>-</p>}</section>
                    <section className="rounded-2xl border border-gray-200 bg-white p-6"><h2 className="mb-3 font-bold">Kết luận và hướng điều trị</h2><p className="whitespace-pre-wrap text-sm text-gray-700">{text(record.conclusion)}</p></section>
                    <section className="rounded-2xl border border-gray-200 bg-white p-6"><h2 className="mb-3 font-bold">Khám lâm sàng</h2><p className="whitespace-pre-wrap text-sm text-gray-700">{text(record.clinicalFindings)}</p></section>
                    <section className="rounded-2xl border border-gray-200 bg-white p-6"><h2 className="mb-3 font-bold">Đơn thuốc</h2><p className="text-sm text-gray-700">{medicines.length ? `${medicines.length} loại thuốc đã kê` : 'Không kê thuốc'}</p></section>
                </div>

                <section className="flex flex-wrap justify-end gap-3 rounded-2xl border border-gray-200 bg-white p-5">
                    <button onClick={() => navigate(ROUTES.DOCTOR_ROOMS)} className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-5 text-sm"><ArrowLeft size={16}/> Về danh sách phòng</button>
                    {medicines.length > 0 && <button onClick={() => go(ROUTES.DOCTOR_PRESCRIPTION_PREVIEW)} className="flex h-10 items-center gap-2 rounded-xl border border-primary-500 px-5 text-sm font-semibold text-primary-600"><Pill size={16}/> Xem và in đơn thuốc</button>}
                    <button onClick={() => go(ROUTES.DOCTOR_MEDICAL_RECORD_PRINT)} className="flex h-10 items-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white"><FileText size={16}/> Xem và in bệnh án</button>
                </section>
            </div>
        </div>
    </MedicalStaffLayout>;
}

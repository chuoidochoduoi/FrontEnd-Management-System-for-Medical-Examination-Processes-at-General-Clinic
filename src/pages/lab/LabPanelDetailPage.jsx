import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FlaskConical, LockKeyhole, Save, TriangleAlert } from 'lucide-react';
import { toast } from 'react-toastify';

import api from '@/lib/axios';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import DynamicClinicalForm, { validateClinicalForm } from '@/components/clinical/DynamicClinicalForm';
import { ROUTES } from '@/constants/routes';

const SAMPLE_TYPES = [
    ['BLOOD', 'Máu'], ['URINE', 'Nước tiểu'], ['STOOL', 'Phân'], ['SPUTUM', 'Đờm'],
    ['SWAB', 'Mẫu ngoáy'], ['BODY_FLUID', 'Dịch cơ thể'], ['TISSUE', 'Mô'], ['OTHER', 'Khác'],
];
const SAMPLE_STATUSES = [['ACCEPTED', 'Đạt yêu cầu'], ['REJECTED', 'Không đạt yêu cầu'], ['RECOLLECT', 'Cần lấy lại']];
const getStaffId = () => localStorage.getItem('staffId') || sessionStorage.getItem('staffId');

export default function LabPanelDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [panel, setPanel] = useState(null);
    const [values, setValues] = useState({});
    const [sampleId, setSampleId] = useState('');
    const [sampleType, setSampleType] = useState('');
    const [sampleStatus, setSampleStatus] = useState('ACCEPTED');
    const [conclusion, setConclusion] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState({});

    const hydrate = useCallback((data) => {
        setPanel(data);
        setValues(data?.resultData || data?.clinicalForm?.values || {});
        setSampleId(data?.sampleId || '');
        setSampleType(data?.sampleType || '');
        setSampleStatus(data?.sampleStatus || 'ACCEPTED');
        setConclusion(data?.conclusion || '');
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/api/v1/test-requests/${id}/panel-workbench`);
            hydrate(response.data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Không thể tải phiếu xét nghiệm. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [hydrate, id]);

    useEffect(() => { load(); }, [load]);

    const purchasedFieldKeys = useMemo(() => (panel?.analytes || [])
        .filter((item) => item.purchased)
        .map((item) => item.fieldKey), [panel]);
    const lockedFieldKeys = useMemo(() => (panel?.analytes || [])
        .filter((item) => !item.purchased)
        .map((item) => item.fieldKey), [panel]);
    const completed = panel?.completedCount === panel?.purchasedCount && panel?.purchasedCount > 0;
    const canEdit = !completed && panel?.queueStatus === 'IN_PROGRESS';

    const payload = () => ({
        resultData: values,
        sampleId: sampleId || null,
        sampleType: sampleType || null,
        sampleStatus: sampleStatus || null,
        conclusion: conclusion || '',
        formTemplateVersionId: panel?.formTemplateVersionId || null,
        performedById: getStaffId(),
    });

    const submit = async (complete) => {
        if (!getStaffId()) {
            toast.error('Không xác định được nhân viên đang thực hiện. Vui lòng đăng nhập lại.');
            return;
        }
        if (complete) {
            const nextErrors = validateClinicalForm(panel?.clinicalForm?.schema, values, true, purchasedFieldKeys);
            if (!conclusion.trim()) nextErrors.conclusion = 'Vui lòng nhập kết luận';
            if (Object.keys(nextErrors).length) {
                setFormErrors(nextErrors);
                toast.error('Vui lòng hoàn thành các chỉ số đã mua hoặc đánh dấu không thực hiện.');
                return;
            }
        }
        setSaving(true);
        setError('');
        try {
            const response = complete
                ? await api.post(`/api/v1/test-requests/${id}/panel-workbench/complete`, payload())
                : await api.put(`/api/v1/test-requests/${id}/panel-workbench/result`, payload());
            hydrate(response.data);
            setFormErrors({});
            toast.success(complete ? 'Đã hoàn thành phiếu xét nghiệm.' : 'Đã lưu nháp phiếu xét nghiệm.');
        } catch (requestError) {
            const message = requestError.response?.data?.message || 'Không thể lưu phiếu xét nghiệm.';
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const back = () => {
        if (panel?.performingDepartmentId) navigate(ROUTES.DOCTOR_LAB.replace(':departmentId', panel.performingDepartmentId));
        else navigate(-1);
    };

    return <MedicalStaffLayout>
        <main className="min-h-full bg-slate-50 px-4 py-5 lg:px-6">
            <div className="mx-auto w-full max-w-[1500px]">
                <button type="button" onClick={back} className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 hover:bg-white">
                    <ArrowLeft size={17} /> Quay lại danh sách phiếu
                </button>

                {loading ? <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"><div className="h-8 w-72 rounded bg-slate-200" /><div className="mt-5 h-80 rounded-xl bg-slate-100" /></div>
                    : error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"><p className="font-bold">Không tải được phiếu xét nghiệm</p><p className="mt-1 text-sm">{error}</p><button onClick={load} className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-bold">Tải lại</button></div>
                    : <>
                        <section className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white"><FlaskConical size={22} /></div><div><p className="text-sm font-bold uppercase tracking-wide text-teal-700">Phiếu xét nghiệm theo gói</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{panel?.panelName}</h1><p className="mt-1 text-sm text-slate-600">{panel?.patientName} · {panel?.patientCode || 'Chưa có mã bệnh nhân'} · Phiếu #{String(panel?.queueNumber ?? '—').padStart(3, '0')}</p></div></div>
                                <div className="rounded-xl border border-teal-200 bg-white px-4 py-3 text-right"><p className="text-xs font-semibold uppercase text-slate-500">Tiến độ</p><p className="mt-1 text-lg font-bold text-teal-700">Đã mua {panel?.purchasedCount}/{panel?.totalAnalyteCount} chỉ số</p><p className="text-sm text-slate-600">Đã hoàn thành {panel?.completedCount}/{panel?.purchasedCount}</p></div>
                            </div>
                            {!canEdit && !completed && <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><TriangleAlert size={17} /> Chỉ có thể nhập kết quả khi bệnh nhân đã được bắt đầu thực hiện tại phòng.</div>}
                            {completed && <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 size={17} /> Phiếu đã hoàn thành. Các chỉ số chưa mua vẫn được giữ ở trạng thái khóa.</div>}
                        </section>

                        <section className="mt-5 grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
                            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Mẫu bệnh phẩm dùng chung</h2><p className="mt-1 text-sm text-slate-500">Một thông tin mẫu được dùng nhất quán cho các chỉ số đã mua trong phiếu này.</p><label className="mt-4 block text-sm font-semibold text-slate-700">Mã mẫu<input disabled={!canEdit} value={sampleId} onChange={(event) => setSampleId(event.target.value)} placeholder="SMP-..." className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-100" /></label><label className="mt-3 block text-sm font-semibold text-slate-700">Loại mẫu<select disabled={!canEdit} value={sampleType} onChange={(event) => setSampleType(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-100"><option value="">Chọn loại mẫu</option>{SAMPLE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="mt-3 block text-sm font-semibold text-slate-700">Tình trạng mẫu<select disabled={!canEdit} value={sampleStatus} onChange={(event) => setSampleStatus(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-100">{SAMPLE_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><LockKeyhole className="mb-1 text-slate-500" size={15} /> Những chỉ số chưa mua vẫn hiện trong bảng để đối chiếu phạm vi gói, nhưng không thể nhập hoặc ký.</div></aside>
                            <div><DynamicClinicalForm schema={panel?.clinicalForm?.schema} value={values} onChange={(next) => { setValues(next); setFormErrors({}); }} disabled={!canEdit} lockedFieldKeys={lockedFieldKeys} errors={formErrors} title={`Chỉ số ${panel?.panelName}`} emptyMessage="Chưa cấu hình biểu mẫu cho gói này" /></div>
                        </section>

                        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><label className="block text-sm font-bold text-slate-800">Kết luận <span className="text-red-600">*</span><textarea disabled={!canEdit} value={conclusion} onChange={(event) => { setConclusion(event.target.value); setFormErrors((current) => ({ ...current, conclusion: undefined })); }} rows={3} placeholder="Nhập nhận xét và kết luận kết quả..." className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100" />{formErrors.conclusion && <p className="mt-1 text-sm text-red-600">{formErrors.conclusion}</p>}</label><div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" onClick={back} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600">Quay lại</button>{canEdit && <><button type="button" disabled={saving} onClick={() => submit(false)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-teal-300 px-5 text-sm font-bold text-teal-700 disabled:opacity-50"><Save size={16} /> Lưu nháp</button><button type="button" disabled={saving} onClick={() => submit(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 size={16} /> {saving ? 'Đang xử lý...' : 'Hoàn thành phiếu'}</button></>}</div></section>
                    </>}
            </div>
        </main>
    </MedicalStaffLayout>;
}

import { useEffect, useState } from 'react';
import { Plus, Send, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import OwnerLayout from '@/components/layout/OwnerLayout';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const headers = () => ({ Authorization: `Bearer ${get('token')}`, 'Content-Type': 'application/json' });
const emptyField = () => ({ key: '', label: '', type: 'TEXT', group: 'Kết quả', unit: '', required: false, min: '', max: '', normalValue: '', referenceMin: '', referenceMax: '' });
const SYSTEM_LAB_TEMPLATES = new Set(['LAB_CBC', 'LAB_GLUCOSE', 'LAB_BIOCHEM', 'LAB_LIVER', 'LAB_KIDNEY', 'LAB_URINALYSIS', 'LAB_CRP', 'LAB_RAPID_INFECTIOUS']);
const CONTEXT_LABELS = {
    LAB_RESULT: 'Xét nghiệm',
    IMAGING_RESULT: 'Chẩn đoán hình ảnh',
    ECG_RESULT: 'Điện tim',
};

export default function ClinicalFormTemplatePage() {
    const [templates, setTemplates] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ code: '', name: '', context: 'LAB_RESULT', description: '', changeReason: 'Khởi tạo biểu mẫu', effectiveFrom: new Date().toISOString().slice(0, 10), fields: [emptyField()] });
    const api = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const load = async () => {
        const [templateRes, serviceRes] = await Promise.all([
            fetch(`${api}/api/v1/clinical-form-templates`, { headers: headers() }),
            fetch(`${api}/api/v1/medical-services?departmentType=PARACLINICAL&size=200`, { headers: headers() }),
        ]);
        if (templateRes.ok) {
            const body = await templateRes.json();
            setTemplates((Array.isArray(body) ? body : []).filter(template => template.context !== 'EXAMINATION'));
        }
        if (serviceRes.ok) {
            const body = await serviceRes.json();
            const items = Array.isArray(body) ? body : body.content || [];
            setServices(items.filter(service => service.departmentType === 'PARACLINICAL'));
        }
    };

    useEffect(() => { load().catch(() => toast.error('Không thể tải danh sách biểu mẫu')); }, []);

    const updateField = (index, key, value) => setForm((current) => ({
        ...current,
        fields: current.fields.map((field, position) => position === index ? { ...field, [key]: value } : field),
    }));

    const schema = () => ({
        fields: form.fields.map((field, index) => {
            const output = {
                key: field.key.trim(), label: field.label.trim(), type: field.type,
                group: field.group.trim(), displayOrder: index + 1, required: field.required,
            };
            if (field.unit.trim()) output.unit = field.unit.trim();
            if (field.min !== '') output.min = Number(field.min);
            if (field.max !== '') output.max = Number(field.max);
            if (field.normalValue !== '') output.normalValue = field.type === 'NUMBER' ? Number(field.normalValue) : field.normalValue;
            if (field.type === 'SELECT') output.options = field.options?.split(',').map((item) => item.trim()).filter(Boolean) || [];
            if (field.referenceMin !== '' || field.referenceMax !== '') output.referenceRanges = [{
                sex: 'ANY', minAge: 0, maxAge: 200,
                ...(field.referenceMin !== '' ? { low: Number(field.referenceMin) } : {}),
                ...(field.referenceMax !== '' ? { high: Number(field.referenceMax) } : {}),
            }];
            return output;
        }),
    });

    const createTemplate = async () => {
        if (!form.code.trim() || !form.name.trim() || form.fields.some((field) => !field.key.trim() || !field.label.trim())) {
            toast.error('Vui lòng nhập mã, tên biểu mẫu và đầy đủ key/nhãn của trường'); return;
        }
        setSaving(true);
        try {
            const createRes = await fetch(editingTemplateId
                ? `${api}/api/v1/clinical-form-templates/${editingTemplateId}/draft`
                : `${api}/api/v1/clinical-form-templates`, {
                method: editingTemplateId ? 'PUT' : 'POST', headers: headers(),
                body: JSON.stringify(editingTemplateId
                    ? { schemaJson: schema(), changeReason: form.changeReason, effectiveFrom: form.effectiveFrom }
                    : { ...form, fields: undefined, schemaJson: schema() }),
            });
            const created = await createRes.json().catch(() => ({}));
            if (!createRes.ok) throw new Error(created.message || 'Không thể tạo biểu mẫu');
            if (editingTemplateId || selectedServices.length) {
                const bindRes = await fetch(`${api}/api/v1/clinical-form-templates/${created.templateId || editingTemplateId}/services`, {
                    method: 'PUT', headers: headers(), body: JSON.stringify({ serviceIds: selectedServices }),
                });
                if (!bindRes.ok) throw new Error('Đã tạo biểu mẫu nhưng chưa liên kết được dịch vụ');
            }
            toast.success('Đã tạo bản nháp biểu mẫu');
            setForm({ code: '', name: '', context: 'LAB_RESULT', description: '', changeReason: 'Khởi tạo biểu mẫu', effectiveFrom: new Date().toISOString().slice(0, 10), fields: [emptyField()] });
            setSelectedServices([]); await load();
            setEditingTemplateId(null);
        } catch (error) { toast.error(error.message); } finally { setSaving(false); }
    };

    const editTemplate = (template) => {
        const sourceFields = template.schemaJson?.fields || [];
        setEditingTemplateId(template.templateId);
        setSelectedServices(template.serviceIds || []);
        setForm({
            code: template.code, name: template.name, context: template.context,
            description: template.description || '', changeReason: '',
            effectiveFrom: new Date().toISOString().slice(0, 10),
            fields: sourceFields.map((field) => ({
                ...emptyField(), ...field,
                options: (field.options || []).map((option) => typeof option === 'string' ? option : option.value).join(', '),
                normalValue: field.normalValue ?? field.normalPreset ?? '',
                referenceMin: field.referenceRanges?.[0]?.low ?? '',
                referenceMax: field.referenceRanges?.[0]?.high ?? '',
            })),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const retire = async (templateId) => {
        const response = await fetch(`${api}/api/v1/clinical-form-templates/${templateId}/retire`, { method: 'POST', headers: headers() });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) return toast.error(body.message || 'Không thể ngừng sử dụng');
        toast.success('Đã ngừng sử dụng biểu mẫu'); load();
    };

    const publish = async (templateId) => {
        const response = await fetch(`${api}/api/v1/clinical-form-templates/${templateId}/publish`, { method: 'POST', headers: headers() });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) return toast.error(body.message || 'Không thể phát hành');
        toast.success('Đã phát hành biểu mẫu'); load();
    };

    return (
        <OwnerLayout>
            <div className="space-y-5">
                <div><h1 className="text-2xl font-bold text-slate-900">Biểu mẫu kết quả cận lâm sàng</h1><p className="mt-1 text-sm text-slate-500">Cấu hình trường nhập kết quả cho xét nghiệm, chẩn đoán hình ảnh và điện tim.</p></div>
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="grid gap-4 md:grid-cols-3">
                        <input disabled={editingTemplateId != null} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Mã biểu mẫu" className="rounded-lg border px-3 py-2 text-sm disabled:bg-slate-100" />
                        <input disabled={editingTemplateId != null} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tên biểu mẫu" className="rounded-lg border px-3 py-2 text-sm disabled:bg-slate-100" />
                        <select disabled={editingTemplateId != null} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} className="rounded-lg border px-3 py-2 text-sm disabled:bg-slate-100"><option value="LAB_RESULT">Xét nghiệm</option><option value="IMAGING_RESULT">Chẩn đoán hình ảnh</option><option value="ECG_RESULT">Điện tim</option></select>
                        <input value={form.changeReason} onChange={(e) => setForm({ ...form, changeReason: e.target.value })} placeholder="Lý do thay đổi" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
                        <input type="date" value={form.effectiveFrom} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                    </div>
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="mb-3 text-sm font-bold text-slate-800">Các trường nhập liệu</p>
                        <div className="space-y-3">
                            {form.fields.map((field, index) => (
                                <div key={index} className="grid gap-2 rounded-lg border bg-white p-3 lg:grid-cols-12">
                                    <input value={field.key} onChange={(e) => updateField(index, 'key', e.target.value)} placeholder="key" className="rounded border px-2 py-2 text-xs lg:col-span-2" />
                                    <input value={field.label} onChange={(e) => updateField(index, 'label', e.target.value)} placeholder="Nhãn hiển thị" className="rounded border px-2 py-2 text-xs lg:col-span-2" />
                                    <select value={field.type} onChange={(e) => updateField(index, 'type', e.target.value)} className="rounded border px-2 py-2 text-xs"><option>TEXT</option><option>TEXTAREA</option><option>NUMBER</option><option>DATE</option><option>SELECT</option><option>BOOLEAN</option></select>
                                    <input value={field.group} onChange={(e) => updateField(index, 'group', e.target.value)} placeholder="Nhóm" className="rounded border px-2 py-2 text-xs lg:col-span-2" />
                                    <input value={field.unit} onChange={(e) => updateField(index, 'unit', e.target.value)} placeholder="Đơn vị" className="rounded border px-2 py-2 text-xs" />
                                    <input value={field.referenceMin} onChange={(e) => updateField(index, 'referenceMin', e.target.value)} placeholder="Ngưỡng thấp" type="number" className="rounded border px-2 py-2 text-xs" />
                                    <input value={field.referenceMax} onChange={(e) => updateField(index, 'referenceMax', e.target.value)} placeholder="Ngưỡng cao" type="number" className="rounded border px-2 py-2 text-xs" />
                                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={field.required} onChange={(e) => updateField(index, 'required', e.target.checked)} /> Bắt buộc</label>
                                    <button type="button" onClick={() => setForm((current) => ({ ...current, fields: current.fields.filter((_, position) => position !== index) }))} className="text-red-500"><Trash2 size={16} /></button>
                                    {field.type === 'SELECT' && <input value={field.options || ''} onChange={(e) => updateField(index, 'options', e.target.value)} placeholder="Lựa chọn, cách nhau bằng dấu phẩy" className="rounded border px-2 py-2 text-xs lg:col-span-12" />}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => setForm((current) => ({ ...current, fields: [...current.fields, emptyField()] }))} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-600"><Plus size={16} /> Thêm trường</button>
                    </div>
                    <div className="mt-4"><p className="mb-2 text-sm font-bold">Dịch vụ sử dụng biểu mẫu</p><div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border p-3 md:grid-cols-2">{services.map((service) => <label key={service.serviceId} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selectedServices.includes(service.serviceId)} onChange={(e) => setSelectedServices((current) => e.target.checked ? [...current, service.serviceId] : current.filter((id) => id !== service.serviceId))} /> {service.name}</label>)}</div></div>
                    <button onClick={createTemplate} disabled={saving} className="mt-4 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : editingTemplateId ? 'Lưu phiên bản nháp' : 'Tạo bản nháp'}</button>
                </section>
                <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="mb-3 font-bold">Danh sách biểu mẫu</h2><div className="space-y-2">{templates.map((template) => {
                    const systemLabTemplate = SYSTEM_LAB_TEMPLATES.has(template.code);
                    return <div key={template.templateId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-semibold">{template.name} <span className="text-xs text-slate-400">v{template.versionNo}</span>{systemLabTemplate && <span className="ml-2 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">Biểu mẫu hệ thống</span>}</p><p className="text-xs text-slate-500">{template.code} · {CONTEXT_LABELS[template.context] || template.context} · {template.status} · {template.serviceIds?.length || 0} dịch vụ</p>{systemLabTemplate && <p className="mt-1 text-[11px] text-slate-400">Chỉ số và khoảng tham chiếu được khóa để bảo đảm nội dung chuyên môn nhất quán.</p>}</div>{!systemLabTemplate && <div className="flex gap-2"><button onClick={() => editTemplate(template)} className="rounded-lg border px-3 py-2 text-xs font-bold">{template.status === 'DRAFT' ? 'Sửa bản nháp' : 'Tạo phiên bản mới'}</button>{template.status === 'DRAFT' && <button onClick={() => publish(template.templateId)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Send size={14} /> Phát hành</button>}{template.status === 'PUBLISHED' && <button onClick={() => retire(template.templateId)} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white">Ngừng dùng</button>}</div>}</div>;
                })}</div></section>
            </div>
        </OwnerLayout>
    );
}

import { useMemo, useState } from 'react';
import { AlertTriangle, ArchiveRestore, CalendarPlus, Edit3, HeartPulse, Plus, UserRound, UsersRound, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import CustomerLayout from '@/components/layout/CustomerLayout';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { ROUTES } from '@/constants/routes';

const emptyForm = {
    fullName: '', dateOfBirth: '', gender: 'MALE', relationship: 'CHILD',
    address: '', bloodType: '', allergyStatus: 'UNVERIFIED', allergies: [],
    allergyInput: '', managementConfirmed: false,
};

const relationshipOptions = [
    ['CHILD', 'Con'], ['SPOUSE', 'Vợ/chồng'], ['PARENT', 'Cha/mẹ'],
    ['SIBLING', 'Anh/chị/em'], ['GRANDPARENT', 'Ông/bà'], ['OTHER', 'Khác'],
];
const bloodTypes = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'];
const bloodLabels = { A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-', AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-' };

export default function FamilyMembersPage() {
    const navigate = useNavigate();
    const [includeInactive, setIncludeInactive] = useState(false);
    const { members, loading, saving, error, createMember, updateMember, archiveMember, restoreMember } = useFamilyMembers(includeInactive);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const activeCount = useMemo(() => members.filter(member => member.active).length, [members]);

    const openCreate = () => { setEditing('new'); setForm({ ...emptyForm, allergies: [] }); };
    const openEdit = member => {
        setEditing(member);
        setForm({
            fullName: member.fullName || '', dateOfBirth: member.dateOfBirth || '',
            gender: member.gender || 'MALE', relationship: member.relationship || 'OTHER',
            address: member.address || '', bloodType: member.bloodType || '',
            allergyStatus: member.allergyStatus || ((member.allergies || []).length ? 'REPORTED' : 'UNVERIFIED'),
            allergies: member.allergies || [], allergyInput: '', managementConfirmed: true,
        });
    };
    const closeModal = () => { if (!saving) setEditing(null); };
    const updateField = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

    const addAllergy = () => {
        const clean = form.allergyInput.trim().replace(/\s+/g, ' ');
        if (!clean) return;
        if (clean.length > 100) return toast.error('Mỗi dị ứng không được vượt quá 100 ký tự.');
        if (form.allergies.length >= 20) return toast.error('Danh sách dị ứng không được vượt quá 20 mục.');
        if (form.allergies.some(item => item.toLowerCase() === clean.toLowerCase())) {
            return toast.info('Dị ứng này đã có trong danh sách.');
        }
        setForm(previous => ({ ...previous, allergyStatus: 'REPORTED', allergies: [...previous.allergies, clean], allergyInput: '' }));
    };

    const selectAllergyStatus = allergyStatus => setForm(previous => ({
        ...previous,
        allergyStatus,
        allergies: allergyStatus === 'REPORTED' ? previous.allergies : [],
        allergyInput: allergyStatus === 'REPORTED' ? previous.allergyInput : '',
    }));

    const submit = async event => {
        event.preventDefault();
        const pendingAllergy = form.allergyInput.trim().replace(/\s+/g, ' ');
        let allergies = [...form.allergies];
        if (form.allergyStatus === 'REPORTED' && pendingAllergy
            && !allergies.some(item => item.toLowerCase() === pendingAllergy.toLowerCase())) {
            if (pendingAllergy.length > 100) return toast.error('Mỗi dị ứng không được vượt quá 100 ký tự.');
            if (allergies.length >= 20) return toast.error('Danh sách dị ứng không được vượt quá 20 mục.');
            allergies.push(pendingAllergy);
        }
        if (form.allergyStatus === 'REPORTED' && allergies.length === 0) {
            return toast.error('Vui lòng thêm ít nhất một dị ứng đã ghi nhận.');
        }
        const payload = {
            ...form,
            bloodType: form.bloodType || null,
            address: form.address.trim() || null,
            allergies: form.allergyStatus === 'REPORTED' ? allergies : [],
        };
        delete payload.allergyInput;
        try {
            if (editing === 'new') await createMember(payload);
            else await updateMember(editing.id, payload);
            toast.success(editing === 'new' ? 'Đã thêm thành viên gia đình.' : 'Đã cập nhật thành viên.');
            setEditing(null);
        } catch (err) { toast.error(err.message); }
    };

    const changeStatus = async member => {
        try {
            if (member.active) await archiveMember(member.id);
            else await restoreMember(member.id);
            toast.success(member.active ? 'Đã ngừng quản lý thành viên.' : 'Đã khôi phục thành viên.');
        } catch (err) { toast.error(err.message); }
    };

    return (
        <CustomerLayout>
            <div className="w-full pb-12">
                <div className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600">Gia đình CareS</p>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Thành viên gia đình</h1>
                        <p className="mt-2 text-sm text-slate-500">Quản lý hồ sơ người thân và đặt lịch đúng người được khám.</p>
                    </div>
                    <button type="button" onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white hover:bg-primary-700">
                        <Plus size={18} /> Thêm thành viên
                    </button>
                </div>

                <div className="mb-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5"><UsersRound className="mb-3 text-primary-600" /><strong className="block text-2xl text-slate-950">{activeCount}</strong><span className="text-sm text-slate-500">Đang quản lý</span></div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:col-span-2"><HeartPulse className="mb-3 text-primary-600" /><p className="text-sm leading-6 text-slate-600"><strong className="text-slate-900">Dữ liệu y tế không bị xóa.</strong> Ngừng quản lý chỉ khóa đặt lịch mới; lịch sử khám, hóa đơn và kết quả vẫn được lưu.</p></div>
                </div>

                <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-sm font-semibold text-slate-700">Danh sách hồ sơ</span>
                    <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={includeInactive} onChange={event => setIncludeInactive(event.target.checked)} className="accent-primary-600" /> Hiện thành viên đã lưu trữ</label>
                </div>

                {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">Đang tải thành viên...</div>
                    : members.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><UserRound className="mx-auto mb-3 text-slate-300" size={38} /><p className="font-semibold text-slate-700">Chưa có thành viên gia đình</p><p className="mt-1 text-sm text-slate-400">Thêm người thân để đặt lịch và theo dõi hồ sơ giúp họ.</p></div>
                    : <div className="grid gap-4 lg:grid-cols-2">{members.map(member => (
                        <article key={member.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${member.active ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 font-bold text-primary-700">{member.fullName?.trim()?.[0] || 'T'}</span><div className="min-w-0"><h2 className="truncate font-bold text-slate-950">{member.fullName}</h2><p className="mt-1 text-xs text-slate-500">{member.patientCode} · {member.relationshipName}</p></div></div>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${member.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{member.active ? 'Đang quản lý' : 'Đã lưu trữ'}</span>
                            </div>
                            <dl className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-sm"><div><dt className="text-xs text-slate-400">Tuổi</dt><dd className="mt-1 font-semibold text-slate-800">{member.age ?? '-'}</dd></div><div><dt className="text-xs text-slate-400">Giới tính</dt><dd className="mt-1 font-semibold text-slate-800">{member.gender === 'MALE' ? 'Nam' : 'Nữ'}</dd></div><div><dt className="text-xs text-slate-400">Nhóm máu</dt><dd className="mt-1 font-semibold text-slate-800">{bloodLabels[member.bloodType] || '-'}</dd></div></dl>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {member.active && <button onClick={() => navigate(ROUTES.CUSTOMER_APPOINTMENT, { state: { patientProfileId: member.patientProfileId } })} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white"><CalendarPlus size={15} /> Đặt lịch</button>}
                                {member.active && <button onClick={() => openEdit(member)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"><Edit3 size={15} /> Sửa</button>}
                                <button onClick={() => changeStatus(member)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"><ArchiveRestore size={15} /> {member.active ? 'Ngừng quản lý' : 'Khôi phục'}</button>
                            </div>
                        </article>
                    ))}</div>}
            </div>

            {editing && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true">
                <form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="text-lg font-bold text-slate-950">{editing === 'new' ? 'Thêm thành viên' : 'Cập nhật thành viên'}</h2><p className="mt-1 text-xs text-slate-500">Không cần số điện thoại, email hoặc BHYT.</p></div><button type="button" onClick={closeModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div>
                    <div className="grid gap-4 p-6 sm:grid-cols-2">
                        <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600">Họ và tên *</span><input required name="fullName" value={form.fullName} onChange={updateField} pattern="[^0-9]*" className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-primary-500" /></label>
                        <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Ngày sinh *</span><input required type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={updateField} max={new Date().toISOString().slice(0, 10)} className="h-11 w-full rounded-xl border border-slate-200 px-3" /></label>
                        <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Giới tính *</span><select name="gender" value={form.gender} onChange={updateField} className="h-11 w-full rounded-xl border border-slate-200 px-3"><option value="MALE">Nam</option><option value="FEMALE">Nữ</option></select></label>
                        <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Quan hệ *</span><select name="relationship" value={form.relationship} onChange={updateField} className="h-11 w-full rounded-xl border border-slate-200 px-3">{relationshipOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                        <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Nhóm máu</span><select name="bloodType" value={form.bloodType} onChange={updateField} className="h-11 w-full rounded-xl border border-slate-200 px-3"><option value="">Chưa xác định</option>{bloodTypes.map(value => <option key={value} value={value}>{bloodLabels[value]}</option>)}</select></label>
                        <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600">Địa chỉ</span><input name="address" value={form.address} onChange={updateField} className="h-11 w-full rounded-xl border border-slate-200 px-3" /></label>
                        <fieldset className="sm:col-span-2 rounded-2xl border border-slate-200 p-4">
                            <legend className="px-2 text-sm font-bold text-slate-700">Thông tin dị ứng</legend>
                            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
                                <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={21} />
                                <div>
                                    <p className="text-sm font-bold">Thông tin an toàn quan trọng</p>
                                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6">
                                        <li>Nhập đúng tên từng thuốc, thực phẩm hoặc tác nhân; ví dụ: Penicillin, tôm, cao su latex.</li>
                                        <li>Không nhập bệnh nền, triệu chứng chung hoặc các nội dung mơ hồ như “không rõ”, “không biết”.</li>
                                        <li>Thông tin do người quản lý cung cấp chỉ hỗ trợ sàng lọc và phải được nhân viên y tế đối chiếu lại trước khi kê đơn hoặc làm thủ thuật.</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="grid gap-2 md:grid-cols-3">
                                {[
                                    ['UNVERIFIED', 'Chưa xác minh', 'Sẽ được nhân viên y tế xác minh khi thăm khám.'],
                                    ['NONE_REPORTED', 'Không ghi nhận dị ứng', 'Người quản lý khai báo hiện không có dị ứng đã biết.'],
                                    ['REPORTED', 'Có ghi nhận dị ứng', 'Thêm riêng từng thuốc, thực phẩm hoặc tác nhân.'],
                                ].map(([value, title, description]) => (
                                    <button key={value} type="button" onClick={() => selectAllergyStatus(value)}
                                        className={`rounded-xl border p-3 text-left transition ${form.allergyStatus === value ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200' : 'border-slate-200 bg-white hover:border-primary-200'}`}>
                                        <span className="block text-sm font-bold text-slate-800">{title}</span>
                                        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
                                    </button>
                                ))}
                            </div>
                            {form.allergyStatus === 'REPORTED' && <div className="mt-4">
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <input value={form.allergyInput} onChange={event => setForm(previous => ({ ...previous, allergyInput: event.target.value }))}
                                        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addAllergy(); } }}
                                        maxLength={100} placeholder="Ví dụ: Penicillin" className="h-11 flex-1 rounded-xl border border-slate-200 px-3 outline-none focus:border-primary-500" />
                                    <button type="button" onClick={addAllergy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white"><Plus size={17} /> Thêm</button>
                                </div>
                                <div className="mt-3 flex min-h-14 flex-wrap gap-2 rounded-xl border border-dashed border-slate-200 p-3">
                                    {form.allergies.length ? form.allergies.map(item => <button type="button" key={item}
                                        onClick={() => setForm(previous => ({ ...previous, allergies: previous.allergies.filter(value => value !== item) }))}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700" title="Bấm để xóa">
                                        {item}<X size={14} />
                                    </button>) : <span className="text-sm text-slate-400">Chưa thêm dị ứng nào.</span>}
                                </div>
                                <p className="mt-2 text-xs text-slate-500">{form.allergies.length}/20 mục · mỗi mục tối đa 100 ký tự.</p>
                            </div>}
                        </fieldset>
                        <label className="sm:col-span-2 flex items-start gap-2 rounded-xl bg-primary-50 p-4 text-sm text-slate-700"><input required type="checkbox" name="managementConfirmed" checked={form.managementConfirmed} onChange={updateField} className="mt-0.5 accent-primary-600" /><span>Tôi xác nhận có quyền quản lý hồ sơ và đặt lịch thay cho thành viên này.</span></label>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4"><button type="button" onClick={closeModal} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600">Hủy</button><button disabled={saving} className="h-11 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu thành viên'}</button></div>
                </form>
            </div>}
        </CustomerLayout>
    );
}

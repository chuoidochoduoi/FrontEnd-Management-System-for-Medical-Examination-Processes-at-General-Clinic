// src/pages/admin/RoomManagementPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Check, Settings, CalendarDays, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { useRoomManagement } from '@/hooks/useRoomManagement';
import { useSpecializations } from '@/hooks/useSpecializations';
import { useCapabilities } from '@/hooks/useCapabilities';
import ConfirmModal from '@/components/ui/ConfirmModal';

/* ── Status config ── */
const STATUS_CFG = {
    available:   { label: 'Sẵn sàng',   cls: 'bg-green-50 text-green-600 border border-green-200' },
    occupied:    { label: 'Đang có ca', cls: 'bg-blue-50  text-blue-600  border border-blue-200' },
    maintenance: { label: 'Bảo trì',    cls: 'bg-gray-100 text-gray-500  border border-gray-200' },
};

const ROOM_TYPES = ['examination', 'paraclinical'];
const ROOM_TYPE_LABELS = {
    examination: 'Phòng khám',
    paraclinical: 'Phòng cận lâm sàng',
};
const STATUSES   = ['available', 'occupied', 'maintenance'];
const CONFIG_STATUSES = ['available', 'maintenance'];

/* ── Input style ── */
const inputCls = 'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-200 bg-white';
const labelCls = 'block text-xs text-gray-500 mb-1.5';
const textareaCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-500 resize-none';

/* ── Status radio group ── */
function StatusGroup({ value, onChange }) {
    return (
        <div className="flex gap-4">
            {CONFIG_STATUSES.map(s => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                    <input
                        type="radio" name="status" value={s}
                        checked={value === s} onChange={() => onChange(s)}
                        className="accent-gray-900"
                    />
                    {STATUS_CFG[s].label}
                </label>
            ))}
        </div>
    );
}

/* ── Modal Base ── */
function Modal({ title, subtitle, onClose, children, footer }) {
    const ref = useRef(null);
    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, []);

    return (
        <div
            onClick={e => e.target === ref.current && onClose()}
            ref={ref}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
        >
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-xl flex flex-col">
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors mt-0.5">
                        <X size={18} />
                    </button>
                </div>
                <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto">{children}</div>
                <div className="px-6 py-4 border-t border-gray-100 shrink-0">{footer}</div>
            </div>
        </div>
    );
}

function StaffSelectionPanel({ title, hint, query, onQueryChange, items, selectedIds,
                                 onToggle, currentRoomId, emptyText }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>{title}</label>
                <span className="text-[11px] text-primary-600">Đã chọn {selectedIds.length}</span>
            </div>
            <div className="h-56 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-white">
                <input value={query} onChange={e => onQueryChange(e.target.value)}
                       placeholder={`Tìm ${title.toLowerCase()}...`}
                       className="sticky top-0 z-10 w-full text-xs px-2.5 py-2 mb-2 border border-gray-200 rounded-lg bg-white outline-none focus:border-primary-400" />
                <div className="space-y-1">
                    {items.length === 0 && <p className="text-xs text-gray-400 p-2">{emptyText}</p>}
                    {items.map(item => {
                        const belongsElsewhere = item.assignedDepartmentId
                            && item.assignedDepartmentId !== currentRoomId;
                        return (
                            <label key={item.staffId}
                                   className={`flex items-start gap-2 rounded-lg p-2 text-sm ${belongsElsewhere
                                       ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                                       : 'cursor-pointer text-gray-700 hover:bg-gray-50'}`}>
                                <input type="checkbox" className="mt-0.5 accent-gray-900"
                                       checked={selectedIds.includes(item.staffId)}
                                       disabled={belongsElsewhere}
                                       onChange={() => !belongsElsewhere && onToggle(item.staffId)} />
                                <span className="min-w-0">
                                    <span className="block truncate">{item.fullName}</span>
                                    <span className="block text-[11px] text-gray-400">
                                        {belongsElsewhere ? 'Đã thuộc phòng khác' : (item.specializationName || hint)}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ── Add Room Modal ── */
function AddRoomModal({ onClose, onSubmit, t, doctors, nurses, specializations, capabilities }) {
    const [form, setForm] = useState({ roomCode: '', type: '', name: '', specializationId: '', capabilityIds: [], doctorId: '', doctorIds: [], nurseIds: [], description: '', status: 'available' });
    const [docSearch, setDocSearch] = useState('');
    const [nurseSearch, setNurseSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!error) return;
        toast.error(error);
        setError('');
    }, [error]);
    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const matchesRoomQualification = (person, doctor) => {
        if (form.type === 'examination') return !doctor || (!!form.specializationId && person.specializationId === form.specializationId);
        if (form.type === 'paraclinical') return (form.capabilityIds || []).length > 0
            && (person.capabilityIds || []).some(id => form.capabilityIds.includes(id));
        return false;
    };
    const eligibleDoctors = doctors.filter(d => matchesRoomQualification(d, true));
    const filteredDoctors = eligibleDoctors.filter(d =>
        (d.fullName || '').toLowerCase().includes(docSearch.toLowerCase())
        || (d.specializationName || '').toLowerCase().includes(docSearch.toLowerCase()));
    const filteredNurses = nurses.filter(n => matchesRoomQualification(n, false)
        && (n.fullName || '').toLowerCase().includes(nurseSearch.toLowerCase()));

    const toggleNurse = (nurseId) => {
        const prev = form.nurseIds || [];
        if (prev.includes(nurseId)) set('nurseIds', prev.filter(id => id !== nurseId));
        else set('nurseIds', [...prev, nurseId]);
    };
    const toggleDoctor = (doctorId) => {
        const selected = form.doctorIds || [];
        if (selected.includes(doctorId)) {
            if (form.doctorId === doctorId) set('doctorId', '');
            set('doctorIds', selected.filter(id => id !== doctorId));
        } else set('doctorIds', [...selected, doctorId]);
    };

    const handleSubmit = async () => {
        if (!form.roomCode.trim()) return setError('Vui lòng nhập mã phòng');
        if (form.roomCode.trim().length > 20) return setError('Mã phòng không được vượt quá 20 ký tự');
        if (!form.type) return setError('Vui lòng chọn loại khoa/phòng');
        if (form.type === 'examination' && !form.specializationId) return setError('Vui lòng chọn chuyên khoa');
        if (form.type === 'paraclinical' && !(form.capabilityIds || []).length) return setError('Vui lòng chọn ít nhất một danh mục kỹ thuật');
        if (!form.name.trim()) return setError('Vui lòng nhập tên khoa/phòng');
        if (form.name.trim().length > 150) return setError('Tên khoa/phòng không được vượt quá 150 ký tự');
        if (form.description?.length > 500) return setError('Mô tả không được vượt quá 500 ký tự');
        setSubmitting(true); setError('');
        try { await onSubmit(form); onClose(); }
        catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    return (
        <Modal title={t('roomManagement.addModal.title')} onClose={onClose} footer={
            <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-5 h-9 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    {t('roomManagement.addModal.cancel')}
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                        className="px-6 h-9 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
                    {submitting ? t('roomManagement.addModal.submitting') : t('roomManagement.addModal.submit')}
                </button>
            </div>
        }>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('roomManagement.addModal.roomCode')}</label>
                    <input value={form.roomCode} onChange={e => set('roomCode', e.target.value)}
                           placeholder={t('roomManagement.addModal.roomCodePlaceholder')} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Nhóm chức năng</label>
                    <select value={form.type} onChange={e => setForm(prev => ({
                        ...prev,
                        type: e.target.value,
                        specializationId: '',
                        capabilityIds: [],
                        doctorId: '',
                        doctorIds: [],
                        nurseIds: [],
                    }))} className={inputCls}>
                        <option value="">-- Chọn nhóm chức năng --</option>
                        {ROOM_TYPES.map(type => <option key={type} value={type}>{ROOM_TYPE_LABELS[type]}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className={labelCls}>{t('roomManagement.addModal.roomName')}</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                       placeholder={t('roomManagement.addModal.roomNamePlaceholder')} className={inputCls} />
            </div>
            {form.type === 'examination' && (
                <div>
                    <label className={labelCls}>Chuyên khoa phục vụ</label>
                    <select value={form.specializationId} onChange={e => setForm(prev => ({
                        ...prev,
                        specializationId: e.target.value,
                        doctorId: '',
                        doctorIds: [],
                    }))} className={inputCls}>
                        <option value="">-- Chọn chuyên khoa --</option>
                        {specializations.map(item => <option key={item.specializationId} value={item.specializationId}>{item.name}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-gray-400">Chuyên khoa xác định nhóm bệnh nhân và dịch vụ được điều phối vào phòng. Nhiều phòng có thể cùng phục vụ một chuyên khoa.</p>
                </div>
            )}
            {form.type === 'paraclinical' && (
                <div>
                    <label className={labelCls}>Năng lực thực hiện (có thể chọn nhiều)</label>
                    <div className="w-full h-28 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white flex flex-col space-y-1">
                        {capabilities.map(c => {
                            const isChecked = (form.capabilityIds || []).includes(c.capabilityId);
                            return (
                                <label key={c.capabilityId} className="flex items-center gap-2 text-sm p-1.5 rounded cursor-pointer hover:bg-gray-50 text-gray-700 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => setForm(prev => ({
                                            ...prev,
                                            capabilityIds: isChecked
                                                ? (prev.capabilityIds || []).filter(id => id !== c.capabilityId)
                                                : [...(prev.capabilityIds || []), c.capabilityId],
                                            doctorId: '',
                                            doctorIds: [],
                                            nurseIds: [],
                                        }))}
                                        className="accent-gray-900 rounded border-gray-300"
                                    />
                                    <span>{c.name}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
            <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <label className={labelCls}>Bác sĩ phụ trách chuyên môn</label>
                <select value={form.doctorId}
                        onChange={e => {
                            const id = e.target.value;
                            setForm(prev => ({ ...prev, doctorId: id,
                                doctorIds: id && !prev.doctorIds.includes(id)
                                    ? [...prev.doctorIds, id] : prev.doctorIds }));
                        }} className={inputCls}>
                    <option value="">-- Chưa chọn --</option>
                    {eligibleDoctors.filter(doc => !doc.assignedDepartmentId).map(doc =>
                        <option key={doc.staffId} value={doc.staffId}>{doc.fullName}</option>)}
                </select>
                <p className="mt-1.5 text-xs text-blue-600">Chỉ là thông tin quản lý chuyên môn, không đại diện cho bác sĩ trực.</p>
            </div>
            <StaffSelectionPanel title="Bác sĩ thuộc phòng" hint="Bác sĩ có thể được phân lịch tại phòng"
                                 query={docSearch} onQueryChange={setDocSearch} items={filteredDoctors}
                                 selectedIds={form.doctorIds || []} onToggle={toggleDoctor}
                                 emptyText="Không tìm thấy bác sĩ" />
            <StaffSelectionPanel title="Y tá thuộc phòng" hint="Y tá có thể được phân lịch tại phòng"
                                 query={nurseSearch} onQueryChange={setNurseSearch} items={filteredNurses}
                                 selectedIds={form.nurseIds || []} onToggle={toggleNurse}
                                 emptyText="Không tìm thấy y tá" />
            <div>
                <label className={labelCls}>Mô tả</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                          rows={2} className={textareaCls} />
            </div>
            <div>
                <label className={labelCls}>{t('roomManagement.addModal.initialStatus')}</label>
                <StatusGroup value={form.status} onChange={v => set('status', v)} />
            </div>
        </Modal>
    );
}

/* ── Edit Room Modal ── */
function EditRoomModal({ room, onClose, onSubmit, onDelete, t, doctors, nurses, specializations, capabilities }) {
    const [form, setForm] = useState({
        type: room.type ?? '',
        name: room.name ?? '',
        specializationId: room.specializationId ?? '',
        capabilityIds: room.capabilityIds ?? [],
        description: room.equipment ?? room.description ?? '',
        doctorId: room.headDoctorId ?? room.doctorId ?? '',
        doctorIds: room.doctors?.map(d => d.staffId) || [],
        nurseIds: room.nurses?.map(n => n.staffId) || [],
        status: room.status ?? 'available',
    });
    const [docSearch, setDocSearch] = useState('');
    const [nurseSearch, setNurseSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!error) return;
        toast.error(error);
        setError('');
    }, [error]);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const matchesRoomQualification = (person, doctor) => {
        if (form.type === 'examination') return !doctor || (!!form.specializationId && person.specializationId === form.specializationId);
        if (form.type === 'paraclinical') return (form.capabilityIds || []).length > 0
            && (person.capabilityIds || []).some(id => form.capabilityIds.includes(id));
        return false;
    };
    const eligibleDoctors = doctors.filter(d => matchesRoomQualification(d, true));
    const filteredDoctors = eligibleDoctors.filter(d =>
        (d.fullName || '').toLowerCase().includes(docSearch.toLowerCase())
        || (d.specializationName || '').toLowerCase().includes(docSearch.toLowerCase()));
    const filteredNurses = nurses.filter(n => matchesRoomQualification(n, false)
        && (n.fullName || '').toLowerCase().includes(nurseSearch.toLowerCase()));

    const toggleNurse = (id) => setForm(p => ({
        ...p,
        nurseIds: p.nurseIds?.includes(id) ? p.nurseIds.filter(n => n !== id) : [...(p.nurseIds || []), id]
    }));
    const toggleDoctor = (id) => setForm(p => {
        const selected = p.doctorIds || [];
        const removing = selected.includes(id);
        return {
            ...p,
            doctorId: removing && p.doctorId === id ? '' : p.doctorId,
            doctorIds: removing ? selected.filter(value => value !== id) : [...selected, id],
        };
    });

    const handleSubmit = async () => {
        if (!form.type) return setError('Vui lòng chọn loại khoa/phòng');
        if (form.type === 'examination' && !form.specializationId) return setError('Vui lòng chọn chuyên khoa');
        if (form.type === 'paraclinical' && !(form.capabilityIds || []).length) return setError('Vui lòng chọn ít nhất một danh mục kỹ thuật');
        if (!form.name.trim()) return setError('Vui lòng nhập tên khoa/phòng');
        if (form.name.trim().length > 150) return setError('Tên khoa/phòng không được vượt quá 150 ký tự');
        if (form.description?.length > 500) return setError('Mô tả không được vượt quá 500 ký tự');
        setSubmitting(true); setError('');
        try { await onSubmit(room.id, form); onClose(); }
        catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try { await onDelete(room.id); onClose(); }
        catch (err) { setError(err.message); }
        finally { setDeleting(false); setShowConfirmDelete(false); }
    };

    return (
        <Modal
            title={t('roomManagement.editModal.title')}
            subtitle={`${t('roomManagement.editModal.subtitle')} ${room.roomCode}`}
            onClose={onClose}
            footer={
                <div className="flex items-center justify-between">
                    <button onClick={() => setShowConfirmDelete(true)} disabled={deleting}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-60">
                        {t('roomManagement.editModal.deleteBtn')}
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 h-9 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                            {t('roomManagement.editModal.cancel')}
                        </button>
                        <button onClick={handleSubmit} disabled={submitting}
                                className="px-6 h-9 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
                            {submitting ? t('roomManagement.editModal.submitting') : t('roomManagement.editModal.submit')}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('roomManagement.editModal.roomCode')}</label>
                    <input value={room.roomCode} disabled className={inputCls + ' bg-gray-50 text-gray-400'} />
                </div>
                <div>
                    <label className={labelCls}>Nhóm chức năng</label>
                    <select value={form.type} onChange={e => setForm(prev => ({
                        ...prev,
                        type: e.target.value,
                        specializationId: '',
                        capabilityIds: [],
                        doctorId: '',
                        doctorIds: [],
                        nurseIds: [],
                    }))} className={inputCls}>
                        {ROOM_TYPES.map(type => <option key={type} value={type}>{ROOM_TYPE_LABELS[type]}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className={labelCls}>{t('roomManagement.editModal.roomName')}</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
            </div>
            {form.type === 'examination' && (
                <div>
                    <label className={labelCls}>Chuyên khoa phục vụ</label>
                    <select value={form.specializationId} onChange={e => setForm(prev => ({
                        ...prev,
                        specializationId: e.target.value,
                        doctorId: '',
                        doctorIds: [],
                    }))} className={inputCls}>
                        <option value="">-- Chọn chuyên khoa --</option>
                        {specializations.map(item => <option key={item.specializationId} value={item.specializationId}>{item.name}</option>)}
                    </select>
                </div>
            )}
            {form.type === 'paraclinical' && (
                <div>
                    <label className={labelCls}>Năng lực thực hiện (có thể chọn nhiều)</label>
                    <div className="w-full h-28 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white flex flex-col space-y-1">
                        {capabilities.map(c => {
                            const isChecked = (form.capabilityIds || []).includes(c.capabilityId);
                            return (
                                <label key={c.capabilityId} className="flex items-center gap-2 text-sm p-1.5 rounded cursor-pointer hover:bg-gray-50 text-gray-700 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => setForm(prev => ({
                                            ...prev,
                                            capabilityIds: isChecked
                                                ? (prev.capabilityIds || []).filter(id => id !== c.capabilityId)
                                                : [...(prev.capabilityIds || []), c.capabilityId],
                                            doctorId: '',
                                            doctorIds: [],
                                            nurseIds: [],
                                        }))}
                                        className="accent-gray-900 rounded border-gray-300"
                                    />
                                    <span>{c.name}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
            <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <label className={labelCls}>Bác sĩ phụ trách chuyên môn</label>
                <select value={form.doctorId}
                        onChange={e => {
                            const id = e.target.value;
                            setForm(prev => ({ ...prev, doctorId: id,
                                doctorIds: id && !prev.doctorIds.includes(id)
                                    ? [...prev.doctorIds, id] : prev.doctorIds }));
                        }} className={inputCls}>
                    <option value="">-- Chưa chọn --</option>
                    {eligibleDoctors.filter(doc => !doc.assignedDepartmentId || doc.assignedDepartmentId === room.id)
                        .map(doc => <option key={doc.staffId} value={doc.staffId}>{doc.fullName}</option>)}
                </select>
                <p className="mt-1.5 text-xs text-blue-600">Chỉ là thông tin quản lý chuyên môn, không đại diện cho bác sĩ trực.</p>
            </div>
            <StaffSelectionPanel title="Bác sĩ thuộc phòng" hint="Bác sĩ có thể được phân lịch tại phòng"
                                 query={docSearch} onQueryChange={setDocSearch} items={filteredDoctors}
                                 selectedIds={form.doctorIds || []} onToggle={toggleDoctor}
                                 currentRoomId={room.id} emptyText="Không tìm thấy bác sĩ" />
            <StaffSelectionPanel title="Y tá thuộc phòng" hint="Y tá có thể được phân lịch tại phòng"
                                 query={nurseSearch} onQueryChange={setNurseSearch} items={filteredNurses}
                                 selectedIds={form.nurseIds || []} onToggle={toggleNurse}
                                 currentRoomId={room.id} emptyText="Không tìm thấy y tá" />
            <div>
                <label className={labelCls}>Mô tả</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                          rows={2} className={textareaCls} />
            </div>
            <div>
                <label className={labelCls}>{t('roomManagement.editModal.currentStatus')}</label>
                <StatusGroup value={form.status} onChange={v => set('status', v)} />
            </div>
            
            <ConfirmModal 
                isOpen={showConfirmDelete}
                onClose={() => !deleting && setShowConfirmDelete(false)}
                onConfirm={handleDelete}
                title="Xóa phòng"
                message="Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                isDanger={true}
                isLoading={deleting}
            />
        </Modal>
    );
}

/* ── Room Card ── */
function RoomCard({ room, onConfigure, onQuickStatus, onOpenSchedule, t }) {
    const cfg = STATUS_CFG[room.status] ?? STATUS_CFG.available;
    const dutyCfg = room.coverageStatus === 'COVERED'
        ? { label: 'Đủ bác sĩ trực', cls: 'bg-green-50 text-green-700' }
        : room.coverageStatus === 'MISSING_DOCTOR'
            ? { label: 'Thiếu bác sĩ trực', cls: 'bg-amber-50 text-amber-700' }
            : { label: 'Chưa có lịch ca hiện tại', cls: 'bg-gray-100 text-gray-500' };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">{room.roomCode}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {ROOM_TYPE_LABELS[room.type] || room.type}
                    </span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.cls}`}>
                    {cfg.label}
                </span>
            </div>

            <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">{room.name}</h3>
            <p className="text-xs text-gray-500 mb-1">
                <span className="font-medium">Chuyên khoa phục vụ:</span>{' '}
                {room.type === 'examination' ? (room.specializationName || 'Chưa phân loại') : 'Không áp dụng'}
            </p>
            <p className="text-xs text-gray-500 mb-1">
                <span className="font-medium">Phụ trách chuyên môn:</span> {room.doctor || 'Chưa phân công'}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1"><Users size={12}/>{room.doctors?.length || 0} bác sĩ</span>
                <span>{room.nurses?.length || 0} y tá</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-1 font-medium ${dutyCfg.cls}`}>{dutyCfg.label}</span>
                {room.doctorsOnDuty?.length > 0 && (
                    <span className="text-gray-500">Đang trực: {room.doctorsOnDuty.map(item => item.fullName).join(', ')}</span>
                )}
                {room.nursesOnDuty?.length > 0 && (
                    <span className="text-gray-500">Hỗ trợ: {room.nursesOnDuty.map(item => item.fullName).join(', ')}</span>
                )}
            </div>
            {room.equipment && (
                <p className="text-xs text-gray-400 leading-relaxed">
                    <span className="font-medium">{t('roomManagement.card.equipment')}</span>{room.equipment}
                </p>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <div className="relative group">
                    <button className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 transition-colors">
                        ⚡ {t('roomManagement.card.quickStatus')}
                    </button>
                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex flex-col bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 min-w-[130px]">
                        {CONFIG_STATUSES.map(s => (
                            <button key={s} onClick={() => onQuickStatus(room.id, s).catch(err => toast.error(err.message || 'Cập nhật trạng thái thất bại!'))}
                                    className={`text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${room.status === s ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                {STATUS_CFG[s].label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => onOpenSchedule(room)}
                            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700">
                        <CalendarDays size={12}/> Xem lịch
                    </button>
                    <button onClick={() => onConfigure(room)}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors font-medium">
                        <Settings size={12} /> {t('roomManagement.card.configure')}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function RoomManagementPage() {
    const navigate = useNavigate();
    const systemRole = localStorage.getItem('systemRole') || sessionStorage.getItem('systemRole');
    const Layout = systemRole === 'CLINIC_MANAGER' ? OwnerLayout : AdminLayout;
    const { t } = useTranslation('rooms');
    const { rooms, stats, loading, error, fetchRooms, createRoom, updateRoom, deleteRoom, quickStatus, fetchDoctors, fetchNurses } = useRoomManagement();
    const { specializations } = useSpecializations();
    const { capabilities } = useCapabilities();

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [editRoom, setEditRoom] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [nurses, setNurses] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);

    const loadStaff = async () => {
        setLoadingDoctors(true);
        try {
            const [docs, nurs] = await Promise.all([fetchDoctors(), fetchNurses()]);
            setDoctors(docs);
            setNurses(nurs);
        } catch (err) {
            console.error('Failed to load staff:', err);
        } finally {
            setLoadingDoctors(false);
        }
    };

    // Load doctors and nurses on mount
    useEffect(() => {
        loadStaff();
    }, [fetchDoctors, fetchNurses]);

    const handleSearch = () => fetchRooms({ search, type: typeFilter, status: statusFilter });

    // Filter rooms on frontend (backup if API doesn't filter)
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = !search || room.name?.toLowerCase().includes(search.toLowerCase()) || room.roomCode?.toLowerCase().includes(search.toLowerCase());
        const matchesType = !typeFilter || room.type === typeFilter.toLowerCase() || room.departmentType === typeFilter;
        const matchesStatus = !statusFilter || room.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    const handleCreate = async (payload) => {
        await createRoom(payload);
        toast.success('Thêm phòng thành công!');
        loadStaff();
    };

    const handleUpdate = async (id, payload) => {
        await updateRoom(id, payload);
        toast.success('Cập nhật phòng thành công!');
        loadStaff();
    };

    const handleDelete = async (id) => {
        await deleteRoom(id);
        toast.success('Xóa phòng thành công!');
        loadStaff();
    };

    return (
        <Layout>
            <div className="px-10 py-8 space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">Quản lý phòng — Phòng khám đa khoa</h1>
                        <p className="text-xs text-gray-400 mt-1">Mỗi phòng có một nhóm chức năng. Riêng phòng khám được gắn thêm chuyên khoa phục vụ.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">{t('roomManagement.statusLabel')}</p>
                        <span className="inline-block mt-1 text-xs font-medium bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full">
                            {t('roomManagement.statusValue')}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[
                        { value: String(stats.total || 0).padStart(2, '0'), label: t('roomManagement.stats.totalRooms'), sub: t('roomManagement.stats.totalRoomsUnit') },
                        { value: String(stats.occupied || 0).padStart(2, '0'), label: t('roomManagement.stats.serving'), sub: t('roomManagement.stats.servingUnit') },
                        { value: String(stats.maintenance || 0).padStart(2, '0'), label: t('roomManagement.stats.maintenance'), sub: t('roomManagement.stats.maintenanceUnit') },
                    ].map(({ value, label, sub }) => (
                        <div key={label} className="bg-white border border-gray-200 rounded-2xl px-6 py-5">
                            <p className="text-xs text-gray-400 mb-2">{label}</p>
                            <p className="text-3xl font-bold text-gray-900">{value}</p>
                            <p className="text-xs text-gray-400 mt-1">{sub}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-end gap-3">
                    <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1.5">{t('roomManagement.filter.search')}</p>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && handleSearch()}
                               placeholder={t('roomManagement.filter.searchPlaceholder')}
                               className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-500 placeholder:text-gray-300" />
                    </div>
                    <div className="w-44">
                        <p className="text-xs text-gray-400 mb-1.5">Nhóm chức năng</p>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            <option value="">Tất cả</option>
                            {ROOM_TYPES.map(type => <option key={type} value={type}>{ROOM_TYPE_LABELS[type]}</option>)}
                        </select>
                    </div>
                    <div className="w-52">
                        <p className="text-xs text-gray-400 mb-1.5">{t('roomManagement.filter.operationalStatus')}</p>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            <option value="">{t('roomManagement.statuses.all')}</option>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                        </select>
                    </div>
                    <button onClick={() => setShowAdd(true)}
                            className="h-10 px-4 border border-gray-200 text-sm text-gray-700 rounded-lg hover:border-gray-400 transition-colors whitespace-nowrap">
                        {t('roomManagement.filter.addBtn')}
                    </button>
                    <button onClick={handleSearch}
                            className="h-10 px-5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                        {t('roomManagement.filter.searchBtn')}
                    </button>
                </div>

                {loading && <p className="text-sm text-gray-400 text-center py-12">{t('roomManagement.loading')}</p>}
                {error && <p className="text-sm text-red-500 text-center py-12">{error}</p>}
                {!loading && !error && filteredRooms.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-12">{t('roomManagement.noData')}</p>
                )}
                {!loading && (
                    <div className="grid grid-cols-3 gap-4">
                        {filteredRooms.map(room => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                t={t}
                                onConfigure={setEditRoom}
                                onQuickStatus={quickStatus}
                                onOpenSchedule={room => {
                                    navigate(`${systemRole === 'ADMIN' ? '/admin/schedule' : '/owner/schedule'}?departmentId=${room.id}`);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAdd && (
                <AddRoomModal
                    t={t}
                    onClose={() => setShowAdd(false)}
                    onSubmit={handleCreate}
                    doctors={doctors}
                    nurses={nurses}
                    specializations={specializations}
                    capabilities={capabilities}
                />
            )}
            {editRoom && (
                <EditRoomModal
                    t={t}
                    room={editRoom}
                    onClose={() => setEditRoom(null)}
                    onSubmit={handleUpdate}
                    onDelete={handleDelete}
                    doctors={doctors}
                    nurses={nurses}
                    specializations={specializations}
                    capabilities={capabilities}
                />
            )}
        </Layout>
    );
}

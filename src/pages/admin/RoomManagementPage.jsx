// src/pages/admin/RoomManagementPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Settings } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useRoomManagement } from '@/hooks/useRoomManagement';

/* ── Status config ── */
const STATUS_CFG = {
    available:   { label: 'Sẵn sàng',   cls: 'bg-green-50 text-green-600 border border-green-200' },
    occupied:    { label: 'Đang có ca', cls: 'bg-blue-50  text-blue-600  border border-blue-200' },
    maintenance: { label: 'Bảo trì',    cls: 'bg-gray-100 text-gray-500  border border-gray-200' },
};

const ROOM_TYPES = ['examination', 'surgery', 'lab', 'imaging'];
const STATUSES   = ['available', 'occupied', 'maintenance'];

/* ── Input style ── */
const inputCls = 'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-200 bg-white';
const labelCls = 'block text-xs text-gray-500 mb-1.5';
const textareaCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-500 resize-none';

/* ── Status radio group ── */
function StatusGroup({ value, onChange }) {
    return (
        <div className="flex gap-4">
            {STATUSES.map(s => (
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
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors mt-0.5">
                        <X size={18} />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">{children}</div>
                <div className="px-6 py-4 border-t border-gray-100">{footer}</div>
            </div>
        </div>
    );
}

/* ── Add Room Modal ── */
function AddRoomModal({ onClose, onSubmit, t, doctors, loadingDoctors }) {
    const [form, setForm] = useState({ roomCode: '', type: '', name: '', doctorId: '', description: '', status: 'available' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async () => {
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
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('roomManagement.addModal.roomCode')}</label>
                    <input value={form.roomCode} onChange={e => set('roomCode', e.target.value)}
                           placeholder={t('roomManagement.addModal.roomCodePlaceholder')} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Loại khoa</label>
                    <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls}>
                        <option value="">-- Chọn loại --</option>
                        <option value="examination">Khám bệnh</option>
                        <option value="lab">Xét nghiệm</option>
                        <option value="imaging">Chẩn đoán hình ảnh</option>
                    </select>
                </div>
            </div>
            <div>
                <label className={labelCls}>{t('roomManagement.addModal.roomName')}</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                       placeholder={t('roomManagement.addModal.roomNamePlaceholder')} className={inputCls} />
            </div>
            <div>
                <label className={labelCls}>Bác sĩ phụ trách</label>
                <select
                    value={form.doctorId || ''}
                    onChange={e => set('doctorId', e.target.value)}
                    className={inputCls}
                >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map(doc => (
                        <option key={doc.staffId} value={doc.staffId}>
                            {doc.fullName} - {doc.specializationName}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className={labelCls}>Mô tả</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                          rows={2} className={textareaCls} />
            </div>
            <div>
                <label className={labelCls}>{t('roomManagement.addModal.initialStatus')}</label>
                <StatusGroup value={form.status} onChange={v => set('status', v)} />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </Modal>
    );
}

/* ── Edit Room Modal ── */
function EditRoomModal({ room, onClose, onSubmit, onDelete, t, doctors, loadingDoctors }) {
    const [form, setForm] = useState({
        type: room.type ?? '',
        name: room.name ?? '',
        description: room.equipment ?? room.description ?? '',
        doctorId: room.headDoctorId ?? '',
        status: room.status ?? 'available',
    });
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async () => {
        setSubmitting(true); setError('');
        try { await onSubmit(room.id, form); onClose(); }
        catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!confirm('Xác nhận xóa phòng này?')) return;
        setDeleting(true);
        try { await onDelete(room.id); onClose(); }
        catch (err) { setError(err.message); }
        finally { setDeleting(false); }
    };

    return (
        <Modal
            title={t('roomManagement.editModal.title')}
            subtitle={`${t('roomManagement.editModal.subtitle')} ${room.roomCode}`}
            onClose={onClose}
            footer={
                <div className="flex items-center justify-between">
                    <button onClick={handleDelete} disabled={deleting}
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
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('roomManagement.editModal.roomCode')}</label>
                    <input value={room.roomCode} disabled className={inputCls + ' bg-gray-50 text-gray-400'} />
                </div>
                <div>
                    <label className={labelCls}>{t('roomManagement.editModal.roomType')}</label>
                    <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls}>
                        {ROOM_TYPES.map(rt => <option key={rt} value={rt}>{t(`roomManagement.roomTypes.${rt}`)}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className={labelCls}>{t('roomManagement.editModal.roomName')}</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
            </div>
            <div>
                <label className={labelCls}>Bác sĩ phụ trách</label>
                <select
                    value={form.doctorId || ''}
                    onChange={e => set('doctorId', e.target.value)}
                    className={inputCls}
                >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map(doc => (
                        <option key={doc.staffId} value={doc.staffId}>
                            {doc.fullName} - {doc.specializationName}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className={labelCls}>Mô tả</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                          rows={2} className={textareaCls} />
            </div>
            <div>
                <label className={labelCls}>{t('roomManagement.editModal.currentStatus')}</label>
                <StatusGroup value={form.status} onChange={v => set('status', v)} />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </Modal>
    );
}

/* ── Room Card ── */
function RoomCard({ room, onConfigure, onQuickStatus, t }) {
    const cfg = STATUS_CFG[room.status] ?? STATUS_CFG.available;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">{room.roomCode}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {t(`roomManagement.roomTypes.${room.type}`) || room.type}
                    </span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.cls}`}>
                    {cfg.label}
                </span>
            </div>

            <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">{room.name}</h3>
            <p className="text-xs text-gray-500 mb-1">{t('roomManagement.card.doctor')} {room.doctor}</p>
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
                        {STATUSES.map(s => (
                            <button key={s} onClick={() => onQuickStatus(room.id, s)}
                                    className={`text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${room.status === s ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                {STATUS_CFG[s].label}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => onConfigure(room)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors font-medium"
                >
                    <Settings size={12} />
                    {t('roomManagement.card.configure')}
                </button>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function RoomManagementPage() {
    const { t } = useTranslation('rooms');
    const { rooms, stats, loading, error, fetchRooms, createRoom, updateRoom, deleteRoom, quickStatus, fetchDoctors } = useRoomManagement();

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [editRoom, setEditRoom] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);

    // Load doctors on mount
    useEffect(() => {
        const loadDoctors = async () => {
            setLoadingDoctors(true);
            try {
                const data = await fetchDoctors();
                setDoctors(data);
            } catch (err) {
                console.error('Failed to load doctors:', err);
            } finally {
                setLoadingDoctors(false);
            }
        };
        loadDoctors();
    }, [fetchDoctors]);

    // Fetch rooms initially
    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

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
    };

    const handleUpdate = async (id, payload) => {
        await updateRoom(id, payload);
    };

    const handleDelete = async (id) => {
        await deleteRoom(id);
    };

    return (
        <AdminLayout>
            <div className="px-10 py-8 space-y-6">
                <div className="flex items-start justify-between">
                    <h1 className="text-base font-semibold text-gray-900">{t('roomManagement.pageTitle')}</h1>
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
                        <p className="text-xs text-gray-400 mb-1.5">Loại khoa</p>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            <option value="">Tất cả</option>
                            <option value="EXAMINATION">Khám bệnh</option>
                            <option value="LABORATORY">Xét nghiệm</option>
                            <option value="IMAGING">Chẩn đoán hình ảnh</option>
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
                    loadingDoctors={loadingDoctors}
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
                    loadingDoctors={loadingDoctors}
                />
            )}
        </AdminLayout>
    );
}
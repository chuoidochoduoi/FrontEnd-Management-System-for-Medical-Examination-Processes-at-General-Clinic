// src/pages/admin/DepartmentManagementPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Settings } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAllDepartments } from '@/hooks/useAllDepartments';

/* ── Status config ── */
const STATUS_CFG = {
    available:   { label: 'Sẵn sàng',   cls: 'bg-green-50 text-green-600 border border-green-200' },
    occupied:    { label: 'Đang có ca', cls: 'bg-blue-50  text-blue-600  border border-blue-200' },
    maintenance: { label: 'Bảo trì',    cls: 'bg-gray-100 text-gray-500  border border-gray-200' },
};

const DEPARTMENT_TYPES = ['examination', 'lab', 'imaging'];
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

/* ── Add Department Modal ── */
function AddDepartmentModal({ onClose, onSubmit, doctors, loadingDoctors, t }) {
    const [form, setForm] = useState({
        roomCode: '',
        name: '',
        departmentType: 'EXAMINATION',
        status: 'AVAILABLE',
        description: '',
        headDoctorId: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async () => {
        setSubmitting(true); setError('');
        try { await onSubmit(form); onClose(); }
        catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    const typeToLabel = {
        EXAMINATION: 'Khám bệnh',
        LABORATORY: 'Xét nghiệm',
        IMAGING: 'Chẩn đoán hình ảnh',
        RECEPTION: 'Lễ tân',
        CASHIER: 'Thu ngân',
    };

    return (
        <Modal
            title="Thêm khoa mới"
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 h-9 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                        Hủy
                    </button>
                    <button onClick={handleSubmit} disabled={submitting}
                            className="px-6 h-9 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
                        {submitting ? 'Đang tạo...' : 'Tạo khoa'}
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Mã phòng</label>
                    <input
                        value={form.roomCode}
                        onChange={e => set('roomCode', e.target.value)}
                        placeholder="Ví dụ: R-101"
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}>Loại khoa</label>
                    <select
                        value={form.departmentType}
                        onChange={e => set('departmentType', e.target.value)}
                        className={inputCls}
                    >
                        <option value="">-- Chọn loại --</option>
                        <option value="EXAMINATION">Khám bệnh</option>
                        <option value="LABORATORY">Xét nghiệm</option>
                        <option value="IMAGING">Chẩn đoán hình ảnh</option>
                    </select>
                </div>
            </div>
            <div>
                <label className={labelCls}>Tên khoa</label>
                <input
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Ví dụ: Khoa Khám Nội"
                    className={inputCls}
                />
            </div>
            <div>
                <label className={labelCls}>Bác sĩ trưởng</label>
                <select
                    value={form.headDoctorId}
                    onChange={e => set('headDoctorId', e.target.value)}
                    className={inputCls}
                    disabled={loadingDoctors}
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
                <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={2}
                    placeholder="Mô tả khoa phòng..."
                    className={textareaCls}
                />
            </div>
            <div>
                <label className={labelCls}>Trạng thái ban đầu</label>
                <StatusGroup
                    value={form.status === 'AVAILABLE' ? 'available' : form.status === 'IN_SESSION' ? 'occupied' : 'maintenance'}
                    onChange={v => set('status', v === 'available' ? 'AVAILABLE' : v === 'occupied' ? 'IN_SESSION' : 'MAINTENANCE')}
                />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </Modal>
    );
}

/* ── Department Card ── */
function DepartmentCard({ department, onConfigure, onQuickStatus, t }) {
    const cfg = STATUS_CFG[department.status] ?? STATUS_CFG.available;
    const typeLabel = {
        examination: 'Khám bệnh',
        lab: 'Xét nghiệm',
        imaging: 'Chẩn đoán hình ảnh',
        reception: 'Lễ tân',
        cashier: 'Thu ngân',
    }[department.type] || department.type;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">{department.roomCode}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {typeLabel}
                    </span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.cls}`}>
                    {cfg.label}
                </span>
            </div>

            <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">{department.name}</h3>
            <p className="text-xs text-gray-500 mb-1">Bác sĩ trưởng: {department.headDoctor || '—'}</p>
            {department.description && (
                <p className="text-xs text-gray-400 leading-relaxed">
                    <span className="font-medium">Mô tả:</span> {department.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <div className="relative group">
                    <button className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 transition-colors">
                        ⚡ Trạng thái nhanh
                    </button>
                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex flex-col bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 min-w-[130px]">
                        {STATUSES.map(s => (
                            <button
                                key={s}
                                onClick={() => onQuickStatus(department.id, s)}
                                className={`text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${department.status === s ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                            >
                                {STATUS_CFG[s].label}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => onConfigure(department)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors font-medium"
                >
                    <Settings size={12} />
                    Cấu hình
                </button>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function DepartmentManagementPage() {
    const { t } = useTranslation('departments');
    const { allRooms, loading, error, fetchDoctors, createDepartment } = useAllDepartments();

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAdd, setShowAdd] = useState(false);
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

    const handleSearch = () => {};
    const filteredRooms = allRooms.filter(room => {
        const matchesSearch = !search || room.name?.toLowerCase().includes(search.toLowerCase()) || room.roomCode?.toLowerCase().includes(search.toLowerCase());
        // Match against departmentType (EXAMINATION, LABORATORY, IMAGING) or room type
        const matchesType = !typeFilter || room.departmentType === typeFilter || room.type === typeFilter.toLowerCase();
        const matchesStatus = !statusFilter || room.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    const stats = {
        total: allRooms.length,
        occupied: allRooms.filter(r => r.status === 'occupied').length,
        maintenance: allRooms.filter(r => r.status === 'maintenance').length,
    };

    const handleCreate = async (payload) => {
        await createDepartment(payload);
    };

    const handleQuickStatus = async (id, status) => {
        // Quick status update - not implemented yet
        console.log('Quick status update:', id, status);
    };

    const handleConfigure = (department) => {
        // Config edit - would open edit modal
        console.log('Configure:', department);
    };

    return (
        <AdminLayout>
            <div className="px-10 py-8 space-y-6">
                <div className="flex items-start justify-between">
                    <h1 className="text-base font-semibold text-gray-900">Quản lý Khoa/Phòng</h1>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Trạng thái hoạt động</p>
                        <span className="inline-block mt-1 text-xs font-medium bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full">
                            Sẵn sàng
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[
                        { value: String(stats.total || 0).padStart(2, '0'), label: 'Tổng số khoa/phòng', sub: 'khoa/phòng' },
                        { value: String(stats.occupied || 0).padStart(2, '0'), label: 'Đang phục vụ', sub: 'khoa đang có ca' },
                        { value: String(stats.maintenance || 0).padStart(2, '0'), label: 'Bảo trì', sub: 'khoa bảo trì' },
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
                        <p className="text-xs text-gray-400 mb-1.5">Tìm kiếm</p>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && filteredRooms}
                            placeholder="Nhập tên khoa, mã khoa..."
                            className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-500 placeholder:text-gray-300"
                        />
                    </div>
                    <div className="w-44">
                        <p className="text-xs text-gray-400 mb-1.5">Loại khoa</p>
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none bg-white"
                        >
                            <option value="">Tất cả</option>
                            <option value="EXAMINATION">Khám bệnh</option>
                            <option value="LABORATORY">Xét nghiệm</option>
                            <option value="IMAGING">Chẩn đoán hình ảnh</option>
                        </select>
                    </div>
                    <div className="w-52">
                        <p className="text-xs text-gray-400 mb-1.5">Trạng thái hoạt động</p>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none bg-white"
                        >
                            <option value="">Tất cả</option>
                            <option value="available">Sẵn sàng</option>
                            <option value="occupied">Đang có ca</option>
                            <option value="maintenance">Bảo trì</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="h-10 px-4 border border-gray-200 text-sm text-gray-700 rounded-lg hover:border-gray-400 transition-colors whitespace-nowrap"
                    >
                        + Thêm khoa mới
                    </button>
                    <button
                        onClick={() => {}}
                        className="h-10 px-5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                        Tìm kiếm
                    </button>
                </div>

                {loading && <p className="text-sm text-gray-400 text-center py-12">Đang tải...</p>}
                {error && <p className="text-sm text-red-500 text-center py-12">{error.message}</p>}
                {!loading && !error && filteredRooms.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-12">Không có khoa nào.</p>
                )}
                {!loading && (
                    <div className="grid grid-cols-3 gap-4">
                        {filteredRooms.map(room => (
                            <DepartmentCard
                                key={room.departmentId}
                                department={room}
                                onConfigure={handleConfigure}
                                onQuickStatus={handleQuickStatus}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAdd && (
                <AddDepartmentModal
                    t={t}
                    onClose={() => setShowAdd(false)}
                    onSubmit={handleCreate}
                    doctors={doctors}
                    loadingDoctors={loadingDoctors}
                />
            )}
        </AdminLayout>
    );
}
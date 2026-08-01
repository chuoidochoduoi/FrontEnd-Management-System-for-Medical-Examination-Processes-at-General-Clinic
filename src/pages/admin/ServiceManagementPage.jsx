// src/pages/admin/ServiceManagementPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';
import { useServiceManagement } from '@/hooks/useServiceManagement';
import ConfirmModal from '@/components/ui/ConfirmModal';

const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' đ' : '—';

const STATUS_CFG = {
    active:    { label: 'Đang áp dụng', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
    suspended: { label: 'Tạm ngưng',    cls: 'bg-orange-50 text-orange-500 border border-orange-200' },
    draft:     { label: 'Bản nháp',     cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

const SERVICE_TYPES = ['EXAMINATION', 'LABORATORY', 'IMAGING'];
const STATUSES      = ['active', 'suspended', 'draft'];

const inputCls  = 'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-500 bg-white';
const labelCls  = 'block text-xs text-gray-500 mb-1.5';

/* ── Modal base ── */
function Modal({ title, subtitle, onClose, children, footer }) {
    const ref = useRef(null);
    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, []);
    return (
        <div ref={ref} onClick={e => e.target === ref.current && onClose()}
             className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors"><X size={17} /></button>
                </div>
                <div className="px-6 py-5 space-y-4">{children}</div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">{footer}</div>
            </div>
        </div>
    );
}

/* ── Config Modal ── */
function ConfigModal({ service, onClose, onSubmit, t }) {
    const [status, setStatus] = useState(service.status ?? 'draft');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setSubmitting(true); setError('');
        try { await onSubmit(service.id, { status }); onClose(); }
        catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    return (
        <Modal
            title={t('serviceManagement.configModal.title')}
            subtitle={service.code}
            onClose={onClose}
            footer={<>
                <button onClick={onClose} className="px-4 h-9 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    {t('serviceManagement.configModal.cancel')}
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                        className="px-5 h-9 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
                    {submitting ? t('serviceManagement.configModal.submitting') : t('serviceManagement.configModal.submit')}
                </button>
            </>}
        >
            <div>
                <label className={labelCls}>{t('serviceManagement.configModal.serviceName')}</label>
                <p className="text-sm text-gray-900 font-medium">{service.name || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('serviceManagement.configModal.serviceType')}</label>
                    <p className="text-sm text-gray-900">{service.type || '—'}</p>
                </div>
                <div>
                    <label className={labelCls}>Chuyên khoa</label>
                    <p className="text-sm text-gray-900">{service.specialty || '—'}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('serviceManagement.configModal.price')}</label>
                    <p className="text-sm text-gray-900">{fmt(service.price) || '—'}</p>
                </div>

            </div>
            <div>
                <label className={labelCls}>{t('serviceManagement.configModal.status')}</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                    {STATUSES.filter(s => service.status === 'draft' || s !== 'draft').map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                </select>
            </div>
        </Modal>
    );
}

/* ── Edit Draft Modal ── */
function EditModal({ service, onClose, onSubmit, t }) {
    const [form, setForm] = useState({
        name:     service.name     ?? '',
        type:     service.type     ?? '',
        price:    service.price    ?? '',
        specialty: service.specialty ?? '',

        status:   service.status   ?? 'draft',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        setSubmitting(true); setError('');
        try { await onSubmit(service.id, form); onClose(); }
        catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    return (
        <Modal
            title={t('serviceManagement.editModal.title') || 'Chỉnh sửa dịch vụ'}
            subtitle={service.code}
            onClose={onClose}
            footer={<>
                <button onClick={onClose} className="px-4 h-9 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    {t('serviceManagement.editModal.cancel') || t('serviceManagement.configModal.cancel')}
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                        className="px-5 h-9 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
                    {submitting ? t('serviceManagement.editModal.submitting') || t('serviceManagement.configModal.submitting') : t('serviceManagement.editModal.submit') || t('serviceManagement.configModal.submit')}
                </button>
            </>}
        >
            <div>
                <label className={labelCls}>{t('serviceManagement.editModal.serviceName') || t('serviceManagement.configModal.serviceName')}</label>
                <input value={form.name} onChange={e => setField('name', e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('serviceManagement.editModal.serviceType') || t('serviceManagement.configModal.serviceType')}</label>
                    <select value={form.type} onChange={e => setField('type', e.target.value)} className={inputCls}>
                        {SERVICE_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelCls}>{t('serviceManagement.editModal.specialty') || 'Chuyên khoa'}</label>
                    <input value={form.specialty} onChange={e => setField('specialty', e.target.value)}
                           placeholder="Nhập tên chuyên khoa (bắt buộc với Xét Nghiệm)"
                           className={inputCls} />
                </div>
            </div>

                <div>
                    <label className={labelCls}>{t('serviceManagement.editModal.price') || t('serviceManagement.configModal.price')}</label>
                    <input type="number" value={form.price} onChange={e => setField('price', e.target.value)} className={inputCls} />
                </div>
            <div>
                <label className={labelCls}>{t('serviceManagement.editModal.status') || t('serviceManagement.configModal.status')}</label>
                <select value={form.status} onChange={e => setField('status', e.target.value)} className={inputCls}>
                    {STATUSES.filter(s => service.status === 'draft' || s !== 'draft').map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                </select>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </Modal>
    );
}

/* ── Add Modal ── */
function AddModal({ onClose, onSubmit, t }) {
    const [form, setForm] = useState({
        code: '', name: '', type: '', price: '', status: 'draft',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        setSubmitting(true); setError('');
        try { await onSubmit(form); onClose(); }
        catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    return (
        <Modal
            title={t('serviceManagement.addModal.title')}
            onClose={onClose}
            footer={<>
                <button onClick={onClose} className="px-4 h-9 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    {t('serviceManagement.addModal.cancel')}
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                        className="px-5 h-9 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
                    {submitting ? t('serviceManagement.addModal.submitting') : t('serviceManagement.addModal.submit')}
                </button>
            </>}
        >
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('serviceManagement.addModal.serviceCode')}</label>
                    <input value={form.code} onChange={e => set('code', e.target.value)}
                           placeholder={t('serviceManagement.addModal.serviceCodePlaceholder')} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>{t('serviceManagement.addModal.serviceType')}</label>
                    <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls}>
                        <option key="empty-type" value="">{t('serviceManagement.addModal.serviceTypeDefault')}</option>
                        {SERVICE_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className={labelCls}>{t('serviceManagement.addModal.serviceName')}</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                       placeholder={t('serviceManagement.addModal.serviceNamePlaceholder')} className={inputCls} />
            </div>

            <div>
                <label className={labelCls}>{t('serviceManagement.addModal.price')}</label>
                <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                       placeholder={t('serviceManagement.addModal.pricePlaceholder')} className={inputCls} />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </Modal>
    );
}

/* ── Pagination ── */
function Pagination({ page, total, pageSize, onChange }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-end gap-1 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => onChange(p)}
                        className={`w-8 h-8 text-sm rounded-lg transition-colors ${p === page ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                    {p}
                </button>
            ))}
        </div>
    );
}

/* ── Main Page ── */
export default function ServiceManagementPage() {
    const { t } = useTranslation('services');
    const { services, stats, loading, error, total, page, PAGE_SIZE, fetchServices, createService, updateService, deleteService } = useServiceManagement();

    const [search,    setSearch]    = useState('');
    const [typeF,     setTypeF]     = useState('');
    const [specialtyF,setSpecialtyF]= useState('');
    const [statusF,   setStatusF]   = useState('');
    const [showAdd,   setShowAdd]   = useState(false);
    const [configSvc, setConfigSvc] = useState(null);
    const [editSvc,   setEditSvc]   = useState(null);
    const [deleteId,  setDeleteId]  = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = () => fetchServices({ search, type: typeF, specialty: specialtyF, status: statusF, page: 1 });

    const handleCreate = async (payload) => {
        await createService(payload);
        toast.success('Thêm dịch vụ thành công!');
        fetchServices({ search, type: typeF, specialty: specialtyF, status: statusF, page: 1 });
    };

    const handleUpdate = async (id, payload) => {
        await updateService(id, payload);
        toast.success('Cập nhật dịch vụ thành công!');
        fetchServices({ search, type: typeF, specialty: specialtyF, status: statusF, page });
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteService(deleteId);
            toast.success('Xóa dịch vụ thành công!');
            fetchServices({ search, type: typeF, specialty: specialtyF, status: statusF, page });
        } catch (err) {
            toast.error(err.message || 'Xóa dịch vụ thất bại!');
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const thCls = 'text-xs font-medium text-gray-400 text-left px-4 py-3';
    const tdCls = 'text-sm text-gray-700 px-4 py-3.5 align-top';

    return (
        <AdminLayout>
            <div className="px-10 py-8 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-base font-semibold text-gray-900">{t('serviceManagement.pageTitle')}</h1>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        {t('serviceManagement.statusStructure')}
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
              {t('serviceManagement.statusStructureValue')}
            </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { key: 'total',     value: stats.total,     label: t('serviceManagement.stats.total') },
                        { key: 'active',    value: stats.active,    label: t('serviceManagement.stats.active') },
                        { key: 'suspended', value: stats.suspended, label: t('serviceManagement.stats.suspended') },
                        { key: 'draft',     value: stats.draft,     label: t('serviceManagement.stats.draft') },
                    ].map(({ key, value, label }) => (
                        <div key={key} className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
                            <p className="text-xs text-gray-400 mb-1">{label}</p>
                            <p className={`text-2xl font-bold ${key === 'draft' ? 'text-gray-300' : 'text-gray-900'}`}>
                                {String(value ?? 0).padStart(2, '0')}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Filter bar */}
                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-end gap-3 flex-wrap">
                    <div className="flex-1 min-w-40">
                        <p className="text-xs text-gray-400 mb-1.5">Tìm tên / Mã dịch vụ</p>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && handleSearch()}
                               placeholder={t('serviceManagement.filter.searchPlaceholder')}
                               className={inputCls + ' placeholder:text-gray-300'} />
                    </div>
                    <div className="w-44">
                        <p className="text-xs text-gray-400 mb-1.5">{t('serviceManagement.filter.serviceType')}</p>
                        <select value={typeF} onChange={e => setTypeF(e.target.value)} className={inputCls}>
                            <option value="">-- Tất cả --</option>
                            {SERVICE_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                    </div>
                    <div className="w-48">
                        <p className="text-xs text-gray-400 mb-1.5">{t('serviceManagement.filter.specialty')}</p>
                        <input value={specialtyF} onChange={e => setSpecialtyF(e.target.value)}
                               placeholder="Khoa: Tiêu Hóa – Gan Mật" className={inputCls + ' placeholder:text-gray-300'} />
                    </div>
                    <div className="w-44">
                        <p className="text-xs text-gray-400 mb-1.5">{t('serviceManagement.filter.status')}</p>
                        <select value={statusF} onChange={e => setStatusF(e.target.value)} className={inputCls}>
                            <option value="">{t('serviceManagement.filter.statusAll')}</option>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => setShowAdd(true)}
                                className="h-9 px-4 border border-gray-200 text-sm text-gray-700 rounded-lg hover:border-gray-400 transition-colors whitespace-nowrap">
                            {t('serviceManagement.filter.addBtn')}
                        </button>
                        <button onClick={handleSearch}
                                className="h-9 px-5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors">
                            {t('serviceManagement.filter.searchBtn')}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead className="border-b border-gray-100 bg-gray-50">
                        <tr>
                            {[
                                t('serviceManagement.table.code'),
                                t('serviceManagement.table.name'),
                                t('serviceManagement.table.type'),
                                t('serviceManagement.table.specialty'),
                                t('serviceManagement.table.price'),
                                t('serviceManagement.table.status'),
                                t('serviceManagement.table.actions'),
                            ].map(col => <th key={col} className={thCls}>{col}</th>)}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {loading && (
                            <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400">{t('serviceManagement.loading')}</td></tr>
                        )}
                        {!loading && error && (
                            <tr><td colSpan={7} className="text-center py-12 text-sm text-red-500">{error}</td></tr>
                        )}
                        {!loading && !error && services.length === 0 && (
                            <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400">{t('serviceManagement.noData')}</td></tr>
                        )}
                        {!loading && services.map(svc => {
                            const stCfg = STATUS_CFG[svc.status] ?? STATUS_CFG.draft;
                            const isDraft = svc.status === 'draft';
                            return (
                                <tr key={svc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className={tdCls + ' text-gray-400 font-mono text-xs'}>{svc.code}</td>
                                    <td className={tdCls}>
                                        <p className="font-medium text-gray-900 leading-snug">{svc.name}</p>
                                    </td>
                                    <td className={tdCls}>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {svc.type}
                      </span>
                                    </td>
                                    <td className={tdCls + ' text-gray-500 text-xs'}>{svc.specialty || 'Dùng chung / Mua tự do'}</td>
                                    <td className={tdCls + ' font-medium tabular-nums'}>{fmt(svc.price)}</td>
                                    <td className={tdCls}>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stCfg.cls}`}>
                        {stCfg.label}
                      </span>
                                    </td>
                                    <td className={tdCls}>
                                        {isDraft ? (
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setEditSvc(svc)}
                                                        className="text-xs text-gray-600 hover:text-primary-500 font-medium transition-colors">
                                                    {t('serviceManagement.actions.edit')}
                                                </button>
                                                <button onClick={() => handleDeleteClick(svc.id)}
                                                        className="text-xs text-red-400 hover:text-red-600 transition-colors">
                                                    {t('serviceManagement.actions.delete')}
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfigSvc(svc)}
                                                    className="text-xs text-gray-500 hover:text-primary-500 transition-colors flex items-center gap-1">
                                                {t('serviceManagement.actions.configure')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>

                    <Pagination page={page} total={total} pageSize={PAGE_SIZE}
                                onChange={p => fetchServices({ search, type: typeF, specialty: specialtyF, status: statusF, page: p })} />
                </div>
            </div>

            {/* Modals */}
            {showAdd && (
                <AddModal t={t} onClose={() => setShowAdd(false)} onSubmit={handleCreate} />
            )}
            {configSvc && (
                <ConfigModal t={t} service={configSvc} onClose={() => setConfigSvc(null)} onSubmit={handleUpdate} />
            )}
            {editSvc && (
                <EditModal t={t} service={editSvc} onClose={() => setEditSvc(null)} onSubmit={handleUpdate} />
            )}
            
            <ConfirmModal 
                isOpen={!!deleteId}
                onClose={() => !isDeleting && setDeleteId(null)}
                onConfirm={handleDeleteConfirm}
                title="Xóa dịch vụ"
                message={t('serviceManagement.deleteConfirm') || "Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác."}
                confirmText="Xóa"
                isDanger={true}
                isLoading={isDeleting}
            />
        </AdminLayout>
    );
}

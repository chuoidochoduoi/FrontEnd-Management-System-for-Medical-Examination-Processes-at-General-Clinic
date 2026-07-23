// src/pages/admin/ServiceManagementPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useServiceManagement } from '@/hooks/useServiceManagement';

const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' đ' : '—';

const STATUS_CFG = {
    active:    { label: 'Đang áp dụng', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
    suspended: { label: 'Tạm ngưng',    cls: 'bg-orange-50 text-orange-500 border border-orange-200' },
    draft:     { label: 'Bản nháp',     cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

const SERVICE_TYPES = ['Khám Đa Khoa', 'Khám Chuyên Khoa', 'Xét Nghiệm', 'Chẩn đoán Hình Ảnh', 'Phẫu Thuật', 'Điều Trị'];
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
    const [form, setForm] = useState({
        name:      service.name      ?? '',
        type:      service.type      ?? '',
        price:     service.price     ?? '',
        specialty: service.specialty ?? '',
        duration:  service.duration  ?? '',
        status:    service.status    ?? 'draft',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        setSubmitting(true); setError('');
        try { await onSubmit(service.id, form); onClose(); }
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
                <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('serviceManagement.configModal.serviceType')}</label>
                    <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls}>
                        {SERVICE_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelCls}>{t('serviceManagement.configModal.price')}</label>
                    <input type="number" value={form.price} onChange={e => set('price', e.target.value)} className={inputCls} />
                </div>
            </div>
            <div>
                <label className={labelCls}>{t('serviceManagement.configModal.specialty')}</label>
                <input value={form.specialty} onChange={e => set('specialty', e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('serviceManagement.configModal.duration')}</label>
                    <input value={form.duration} onChange={e => set('duration', e.target.value)}
                           placeholder={t('serviceManagement.configModal.durationPlaceholder')} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>{t('serviceManagement.configModal.status')}</label>
                    <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                    </select>
                </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </Modal>
    );
}

/* ── Add Modal ── */
function AddModal({ onClose, onSubmit, t }) {
    const [form, setForm] = useState({
        code: '', name: '', type: '', price: '', specialty: '', duration: '', status: 'draft',
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
                        <option value="">{t('serviceManagement.addModal.serviceTypeDefault')}</option>
                        {SERVICE_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className={labelCls}>{t('serviceManagement.addModal.serviceName')}</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                       placeholder={t('serviceManagement.addModal.serviceNamePlaceholder')} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('serviceManagement.addModal.price')}</label>
                    <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                           placeholder={t('serviceManagement.addModal.pricePlaceholder')} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>{t('serviceManagement.addModal.duration')}</label>
                    <input value={form.duration} onChange={e => set('duration', e.target.value)}
                           placeholder={t('serviceManagement.addModal.durationPlaceholder')} className={inputCls} />
                </div>
            </div>
            <div>
                <label className={labelCls}>{t('serviceManagement.addModal.specialty')}</label>
                <input value={form.specialty} onChange={e => set('specialty', e.target.value)}
                       placeholder={t('serviceManagement.addModal.specialtyPlaceholder')} className={inputCls} />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </Modal>
    );
}

/* ── Main Page ── */
export default function ServiceManagementPage() {
    const { t } = useTranslation('services');
    const { services, stats, loading, error, fetchServices, suspendService, deleteService, publishService } = useServiceManagement();

    const handleSuspend = async (id) => {
        if (confirm(t('serviceManagement.suspendConfirm'))) {
            await suspendService(id);
        }
    };

    const handleDelete = async (id) => {
        if (confirm(t('serviceManagement.deleteConfirm'))) {
            await deleteService(id);
        }
    };

    const handlePublish = async (id) => {
        if (confirm(t('serviceManagement.publishConfirm'))) {
            await publishService(id);
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
                                                <button onClick={() => setConfigSvc(svc)}
                                                        className="text-xs text-gray-600 hover:text-primary-500 font-medium transition-colors">
                                                    {t('serviceManagement.actions.edit')}
                                                </button>
                                                <button onClick={() => handleDelete(svc.id)}
                                                        className="text-xs text-red-400 hover:text-red-600 transition-colors">
                                                    {t('serviceManagement.actions.delete')}
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleDelete(svc.id)}
                                                    className="text-xs text-gray-500 hover:text-red-600 transition-colors">
                                                {t('serviceManagement.actions.suspend')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

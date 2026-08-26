// src/pages/admin/ServiceManagementPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';
import { useServiceManagement } from '@/hooks/useServiceManagement';
import { useSpecializations } from '@/hooks/useSpecializations';
import { useCapabilities } from '@/hooks/useCapabilities';
import ConfirmModal from '@/components/ui/ConfirmModal';

const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' đ' : '—';

const STATUS_CFG = {
    active:    { label: 'Đang áp dụng', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
    suspended: { label: 'Tạm ngưng',    cls: 'bg-orange-50 text-orange-500 border border-orange-200' },
    draft:     { label: 'Bản nháp',     cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

const SERVICE_TYPES = ['EXAMINATION', 'PARACLINICAL'];
const SERVICE_TYPE_LABELS = { EXAMINATION: 'Khám bệnh', PARACLINICAL: 'Cận lâm sàng' };
const STATUSES      = ['active', 'suspended', 'draft'];

const inputCls  = 'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-500 bg-white';
const labelCls  = 'block text-xs text-gray-500 mb-1.5';

/* ── Modal base ── */
function Modal({ title, subtitle, onClose, children, footer }) {
    const ref = useRef(null);

    useEffect(() => {
        const fn = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', fn);

        return () =>
            document.removeEventListener('keydown', fn);
    }, [onClose]);

    return (
        <div
            ref={ref}
            onClick={(e) =>
                e.target === ref.current && onClose()
            }
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* HEADER */}
                <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-7 py-5">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {title}
                        </h2>

                        {subtitle && (
                            <p className="mt-1 text-xs text-gray-400">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto px-7 py-5">
                    {children}
                </div>

                {/* FOOTER */}
                <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 px-7 py-4">
                    {footer}
                </div>
            </div>
        </div>
    );
}

/* ── Config Modal ── */
function ConfigModal({ service, onClose, onSubmit, t }) {
    const [status, setStatus] = useState(service.status ?? 'draft');
    const [price, setPrice] = useState(service.price ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!error) return;
        toast.error(error);
        setError('');
    }, [error]);

    const handleSubmit = async () => {
        if (price === '' || Number(price) < 0) {
            setError('Giá dịch vụ phải lớn hơn hoặc bằng 0');
            return;
        }
        setSubmitting(true); setError('');
        try { await onSubmit(service.id, { status, price: Number(price) }); onClose(); }
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
                    <p className="text-sm text-gray-900">{SERVICE_TYPE_LABELS[service.type] || service.type || '—'}</p>
                </div>
                <div>
                    <label className={labelCls}>Chuyên khoa phục vụ</label>
                    <p className="text-sm text-gray-900">{service.type === 'EXAMINATION' ? (service.specialty || 'Chưa cấu hình') : 'Không áp dụng'}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>{t('serviceManagement.configModal.price')}</label>
                    <input
                        type="number"
                        min="0"
                        step="1000"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className={inputCls}
                    />
                </div>

            </div>
            <div>
                <label className={labelCls}>{t('serviceManagement.configModal.status')}</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                    {(service.status === 'draft' ? ['draft', 'active'] : ['active', 'suspended']).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                </select>
            </div>
        </Modal>
    );
}
/* ── Edit Draft Modal ── */
function EditModal({
                       service,
                       specializations,
                       capabilities,
                       onClose,
                       onSubmit,
                       t,
                   }) {
    const [form, setForm] = useState({
        name: service.name ?? '',
        type: service.type ?? '',
        price: service.price ?? '',

        specialtyId:
            service.specialtyId ?? '',

        capabilityId:
            service.capabilityId ?? '',

        workflowPriority:
            service.workflowPriority ?? 1,

        requiresSpecimen:
            service.requiresSpecimen === true,

        minimumAge:
            service.minimumAge ?? 0,

        maximumAge:
            service.maximumAge ?? 120,

        allowedGender:
            service.allowedGender ?? '',

        status:
            service.status ?? 'draft',
    });

    const isActive = service.status === 'active';

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] = useState('');
    useEffect(() => {
        if (!error) return;
        toast.error(error);
        setError('');
    }, [error]);

    const setField = (key, value) =>
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));

    const handleSubmit = async () => {
        if (isActive) {
            if (form.price === '' || Number(form.price) < 0) {
                return setError('Giá dịch vụ phải lớn hơn hoặc bằng 0');
            }
            setSubmitting(true);
            setError('');
            try {
                await onSubmit(service.id, { price: form.price, priceOnly: true });
                onClose();
            } catch (err) {
                setError(err.message);
            } finally {
                setSubmitting(false);
            }
            return;
        }

        if (!form.name.trim()) {
            return setError(
                'Vui lòng nhập tên dịch vụ'
            );
        }

        if (!form.type) {
            return setError(
                'Vui lòng chọn loại dịch vụ'
            );
        }

        if (
            form.type === 'EXAMINATION' &&
            !form.specialtyId
        ) {
            return setError(
                'Vui lòng chọn chuyên khoa phục vụ'
            );
        }

        if (
            form.type === 'PARACLINICAL' &&
            !form.capabilityId
        ) {
            return setError(
                'Vui lòng chọn năng lực thực hiện'
            );
        }

        if (
            Number(form.minimumAge) < 0 ||
            Number(form.maximumAge) > 120 ||
            Number(form.minimumAge) >
            Number(form.maximumAge)
        ) {
            return setError(
                'Khoảng tuổi áp dụng không hợp lệ'
            );
        }

        if (
            form.price === '' ||
            Number(form.price) < 0
        ) {
            return setError(
                'Giá dịch vụ phải lớn hơn hoặc bằng 0'
            );
        }

        setSubmitting(true);
        setError('');

        try {
            await onSubmit(
                service.id,
                form
            );

            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Chỉnh sửa dịch vụ"
            subtitle={service.code}
            onClose={onClose}
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="h-10 rounded-xl px-5 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
                    >
                        Hủy bỏ
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="h-10 rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
                    >
                        {submitting
                            ? 'Đang lưu...'
                            : 'Lưu thay đổi'}
                    </button>
                </>
            }
        >
            <div className="space-y-5">

                {isActive ? (
                    <section className="space-y-5">
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm font-semibold text-amber-800">
                                Dịch vụ đang hoạt động
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-amber-700">
                                Để bảo toàn dữ liệu vận hành, dịch vụ đã hoạt động chỉ được thay đổi giá niêm yết.
                                Các cấu hình khác đã được khóa.
                            </p>
                        </div>

                        <div className="max-w-md">
                            <label className={labelCls}>Giá niêm yết mới (VNĐ)</label>
                            <input
                                type="number"
                                min="0"
                                value={form.price}
                                onChange={(e) => setField('price', e.target.value)}
                                className={inputCls}
                                autoFocus
                            />
                            <p className="mt-2 text-xs text-gray-400">
                                Giá mới chỉ áp dụng cho hóa đơn hoặc chỉ định được tạo sau khi cập nhật.
                            </p>
                        </div>
                    </section>
                ) : (
                    <>

                {/* BASIC */}

                <section>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-700">
                        Thông tin cơ bản
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">

                        <div>
                            <label className={labelCls}>
                                Tên dịch vụ y tế
                            </label>

                            <input
                                value={form.name}
                                onChange={(e) =>
                                    setField(
                                        'name',
                                        e.target.value
                                    )
                                }
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>
                                Loại dịch vụ
                            </label>

                            <select
                                value={form.type}
                                onChange={(e) =>
                                    setForm(
                                        (prev) => ({
                                            ...prev,

                                            type:
                                            e
                                                .target
                                                .value,

                                            specialtyId:
                                                '',

                                            capabilityId:
                                                '',

                                            requiresSpecimen:
                                                e
                                                    .target
                                                    .value ===
                                                'PARACLINICAL'
                                                    ? prev.requiresSpecimen
                                                    : false,
                                        })
                                    )
                                }
                                className={inputCls}
                            >
                                {SERVICE_TYPES.map(
                                    (type) => (
                                        <option
                                            key={type}
                                            value={type}
                                        >
                                            {
                                                SERVICE_TYPE_LABELS[
                                                    type
                                                    ]
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>
                                Giá niêm yết (VNĐ)
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={form.price}
                                onChange={(e) =>
                                    setField(
                                        'price',
                                        e.target.value
                                    )
                                }
                                className={inputCls}
                            />
                        </div>

                    </div>
                </section>

                <div className="border-t border-gray-100" />

                {/* EXECUTION */}

                <section>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-700">
                        Cấu hình thực hiện
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">

                        {form.type ===
                        'EXAMINATION' ? (
                            <div>
                                <label
                                    className={
                                        labelCls
                                    }
                                >
                                    Chuyên khoa phục vụ
                                </label>

                                <select
                                    value={
                                        form.specialtyId
                                    }
                                    onChange={(e) =>
                                        setField(
                                            'specialtyId',
                                            e.target
                                                .value
                                        )
                                    }
                                    className={
                                        inputCls
                                    }
                                >
                                    <option value="">
                                        -- Chọn chuyên khoa --
                                    </option>

                                    {specializations.map(
                                        (item) => (
                                            <option
                                                key={
                                                    item.specializationId
                                                }
                                                value={
                                                    item.specializationId
                                                }
                                            >
                                                {
                                                    item.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label
                                    className={
                                        labelCls
                                    }
                                >
                                    Năng lực thực hiện
                                </label>

                                <select
                                    value={
                                        form.capabilityId
                                    }
                                    onChange={(e) =>
                                        setField(
                                            'capabilityId',
                                            e.target
                                                .value
                                        )
                                    }
                                    className={
                                        inputCls
                                    }
                                >
                                    <option value="">
                                        -- Chọn năng lực --
                                    </option>

                                    {capabilities.map(
                                        (item) => (
                                            <option
                                                key={
                                                    item.capabilityId
                                                }
                                                value={
                                                    item.capabilityId
                                                }
                                            >
                                                {
                                                    item.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <p className="mt-1 text-xs text-gray-400">
                                    Hệ thống sẽ tự chọn
                                    phòng đang hoạt động
                                    có năng lực này.
                                </p>
                            </div>
                        )}

                        <div>
                            <label className={labelCls}>
                                Mức ưu tiên mặc định
                            </label>

                            <select
                                value={
                                    form.workflowPriority
                                }
                                onChange={(e) =>
                                    setField(
                                        'workflowPriority',
                                        Number(
                                            e.target
                                                .value
                                        )
                                    )
                                }
                                className={inputCls}
                            >
                                <option value={2}>
                                    Ưu tiên sớm
                                </option>

                                <option value={1}>
                                    Bình thường
                                </option>

                                <option value={0}>
                                    Có thể làm sau
                                </option>
                            </select>
                        </div>

                    </div>
                </section>

                <div className="border-t border-gray-100" />

                <section>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-700">
                        Đặc tính thực hiện
                    </h3>

                    <div className="grid gap-3 md:grid-cols-2">

                        <label
                            className={`rounded-xl border p-4 ${
                                form.type ===
                                'PARACLINICAL'
                                    ? 'cursor-pointer border-gray-200'
                                    : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                            }`}
                        >
                            <div className="flex items-start gap-3">

                                <input
                                    type="checkbox"
                                    checked={
                                        form.requiresSpecimen
                                    }
                                    disabled={
                                        form.type !==
                                        'PARACLINICAL'
                                    }
                                    onChange={(e) =>
                                        setField(
                                            'requiresSpecimen',
                                            e.target
                                                .checked
                                        )
                                    }
                                />

                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        Dịch vụ yêu cầu
                                        mẫu vật
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Áp dụng cho dịch
                                        vụ cần lấy mẫu.
                                    </p>
                                </div>

                            </div>
                        </label>

                    </div>
                </section>

                <div className="border-t border-gray-100" />

                {/* TARGET */}

                <section>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-700">
                        Đối tượng áp dụng
                    </h3>

                    <div className="grid gap-4 md:grid-cols-3">

                        <div>
                            <label className={labelCls}>
                                Tuổi tối thiểu
                            </label>

                            <input
                                type="number"
                                min="0"
                                max="120"
                                value={
                                    form.minimumAge
                                }
                                onChange={(e) =>
                                    setField(
                                        'minimumAge',
                                        e.target.value
                                    )
                                }
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>
                                Tuổi tối đa
                            </label>

                            <input
                                type="number"
                                min="0"
                                max="120"
                                value={
                                    form.maximumAge
                                }
                                onChange={(e) =>
                                    setField(
                                        'maximumAge',
                                        e.target.value
                                    )
                                }
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>
                                Giới tính áp dụng
                            </label>

                            <select
                                value={
                                    form.allowedGender
                                }
                                onChange={(e) =>
                                    setField(
                                        'allowedGender',
                                        e.target.value
                                    )
                                }
                                className={inputCls}
                            >
                                <option value="">
                                    Tất cả
                                </option>

                                <option value="MALE">
                                    Nam
                                </option>

                                <option value="FEMALE">
                                    Nữ
                                </option>
                            </select>
                        </div>

                    </div>
                </section>

                {/* STATUS */}

                <div className="max-w-sm">
                    <label className={labelCls}>
                        Trạng thái
                    </label>

                    <select
                        value={form.status}
                        onChange={(e) =>
                            setField(
                                'status',
                                e.target.value
                            )
                        }
                        className={inputCls}
                    >
                        {(service.status === 'draft' ? ['draft', 'active'] : ['active', 'suspended']).map((status) => (
                            <option
                                key={status}
                                value={status}
                            >
                                {
                                    STATUS_CFG[
                                        status
                                        ].label
                                }
                            </option>
                        ))}
                    </select>
                </div>

                    </>
                )}

            </div>
        </Modal>
    );
}

/* ── Add Modal ── */
/* ── Add Modal ── */
function AddModal({
                      specializations,
                      capabilities,
                      onClose,
                      onSubmit,
                      t,
                  }) {
    const [form, setForm] = useState({
        code: '',
        name: '',
        type: '',
        price: '',
        status: 'draft',

        specialtyId: '',
        capabilityId: '',

        minimumAge: 0,
        maximumAge: 120,
        allowedGender: '',

        workflowPriority: 1,

        requiresSpecimen: false,
    });

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] = useState('');
    useEffect(() => {
        if (!error) return;
        toast.error(error);
        setError('');
    }, [error]);

    const set = (key, value) =>
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));

    const handleSubmit = async () => {
        if (!form.code.trim()) {
            return setError(
                'Vui lòng nhập mã dịch vụ'
            );
        }

        if (form.code.trim().length > 20) {
            return setError(
                'Mã dịch vụ không được vượt quá 20 ký tự'
            );
        }

        if (!form.name.trim()) {
            return setError(
                'Vui lòng nhập tên dịch vụ'
            );
        }

        if (!form.type) {
            return setError(
                'Vui lòng chọn loại dịch vụ'
            );
        }

        if (
            form.type === 'EXAMINATION' &&
            !form.specialtyId
        ) {
            return setError(
                'Vui lòng chọn chuyên khoa phục vụ'
            );
        }

        if (
            form.type === 'PARACLINICAL' &&
            !form.capabilityId
        ) {
            return setError(
                'Vui lòng chọn năng lực thực hiện'
            );
        }

        if (
            Number(form.minimumAge) < 0 ||
            Number(form.maximumAge) > 120 ||
            Number(form.minimumAge) >
            Number(form.maximumAge)
        ) {
            return setError(
                'Khoảng tuổi áp dụng không hợp lệ'
            );
        }

        if (
            form.price === '' ||
            Number(form.price) < 0
        ) {
            return setError(
                'Giá dịch vụ phải lớn hơn hoặc bằng 0'
            );
        }

        setSubmitting(true);
        setError('');

        try {
            await onSubmit(form);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Tạo dịch vụ mới"
            onClose={onClose}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 rounded-xl px-5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
                    >
                        Hủy bỏ
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="h-10 rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
                    >
                        {submitting
                            ? 'Đang tạo...'
                            : 'Tạo bản nháp'}
                    </button>
                </>
            }
        >
            <div className="space-y-5">

                {/* =====================================================
                    THÔNG TIN CƠ BẢN
                ===================================================== */}

                <section>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-700">
                        Thông tin cơ bản
                    </h3>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                        {/* CODE */}
                        <div>
                            <label className={labelCls}>
                                Mã dịch vụ
                            </label>

                            <input
                                value={form.code}
                                onChange={(e) =>
                                    set(
                                        'code',
                                        e.target.value
                                    )
                                }
                                placeholder="Ví dụ: DV-101"
                                className={inputCls}
                            />

                            <p className="mt-1 text-xs text-gray-400">
                                Ví dụ: DV-101
                            </p>
                        </div>

                        {/* TYPE */}
                        <div>
                            <label className={labelCls}>
                                Loại dịch vụ
                            </label>

                            <select
                                value={form.type}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,

                                        type:
                                        e.target
                                            .value,

                                        specialtyId:
                                            '',

                                        capabilityId:
                                            '',

                                        requiresSpecimen:
                                            e.target
                                                .value ===
                                            'PARACLINICAL'
                                                ? prev.requiresSpecimen
                                                : false,
                                    }))
                                }
                                className={inputCls}
                            >
                                <option value="">
                                    -- Chọn loại dịch vụ --
                                </option>

                                {SERVICE_TYPES.map(
                                    (serviceType) => (
                                        <option
                                            key={
                                                serviceType
                                            }
                                            value={
                                                serviceType
                                            }
                                        >
                                            {
                                                SERVICE_TYPE_LABELS[
                                                    serviceType
                                                    ]
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {/* NAME */}
                        <div>
                            <label className={labelCls}>
                                Tên dịch vụ y tế
                            </label>

                            <input
                                value={form.name}
                                onChange={(e) =>
                                    set(
                                        'name',
                                        e.target.value
                                    )
                                }
                                placeholder="Nhập tên dịch vụ..."
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* PRICE */}
                    <div className="mt-4 max-w-[48%]">
                        <label className={labelCls}>
                            Giá niêm yết (VNĐ)
                        </label>

                        <input
                            type="number"
                            min="0"
                            value={form.price}
                            onChange={(e) =>
                                set(
                                    'price',
                                    e.target.value
                                )
                            }
                            placeholder="0"
                            className={inputCls}
                        />
                    </div>
                </section>

                {/* DIVIDER */}
                <div className="border-t border-gray-100" />

                {/* =====================================================
                    CẤU HÌNH THỰC HIỆN
                ===================================================== */}

                <section>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-700">
                        Cấu hình thực hiện
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        {/* EXAMINATION */}
                        {form.type ===
                            'EXAMINATION' && (
                                <div>
                                    <label
                                        className={
                                            labelCls
                                        }
                                    >
                                        Chuyên khoa phục vụ
                                    </label>

                                    <select
                                        value={
                                            form.specialtyId
                                        }
                                        onChange={(e) =>
                                            set(
                                                'specialtyId',
                                                e.target
                                                    .value
                                            )
                                        }
                                        className={
                                            inputCls
                                        }
                                    >
                                        <option value="">
                                            -- Chọn chuyên khoa --
                                        </option>

                                        {specializations.map(
                                            (
                                                specialization
                                            ) => (
                                                <option
                                                    key={
                                                        specialization.specializationId
                                                    }
                                                    value={
                                                        specialization.specializationId
                                                    }
                                                >
                                                    {
                                                        specialization.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Hệ thống sẽ chọn
                                        phòng phù hợp khi
                                        bệnh nhân check-in.
                                    </p>
                                </div>
                            )}

                        {/* PARACLINICAL */}
                        {form.type ===
                            'PARACLINICAL' && (
                                <div>
                                    <label
                                        className={
                                            labelCls
                                        }
                                    >
                                        Năng lực thực hiện
                                    </label>

                                    <select
                                        value={
                                            form.capabilityId
                                        }
                                        onChange={(e) =>
                                            set(
                                                'capabilityId',
                                                e.target
                                                    .value
                                            )
                                        }
                                        className={
                                            inputCls
                                        }
                                    >
                                        <option value="">
                                            -- Chọn năng lực --
                                        </option>

                                        {capabilities.map(
                                            (
                                                capability
                                            ) => (
                                                <option
                                                    key={
                                                        capability.capabilityId
                                                    }
                                                    value={
                                                        capability.capabilityId
                                                    }
                                                >
                                                    {
                                                        capability.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Hệ thống sẽ tự chọn
                                        phòng đang hoạt động
                                        có năng lực này.
                                    </p>
                                </div>
                            )}

                        {/* PRIORITY */}
                        <div>
                            <label className={labelCls}>
                                Mức ưu tiên mặc định
                            </label>

                            <select
                                value={
                                    form.workflowPriority
                                }
                                onChange={(e) =>
                                    set(
                                        'workflowPriority',
                                        Number(
                                            e.target
                                                .value
                                        )
                                    )
                                }
                                className={inputCls}
                            >
                                <option value={2}>
                                    Ưu tiên sớm
                                </option>

                                <option value={1}>
                                    Bình thường
                                </option>

                                <option value={0}>
                                    Có thể làm sau
                                </option>
                            </select>
                        </div>

                    </div>
                </section>

                <div className="border-t border-gray-100" />

                <section>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-700">
                        Đặc tính thực hiện
                    </h3>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

                        {/* SPECIMEN */}
                        <label
                            className={`rounded-xl border p-4 transition ${
                                form.type ===
                                'PARACLINICAL'
                                    ? 'cursor-pointer border-gray-200 hover:border-primary-200'
                                    : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                            }`}
                        >
                            <div className="flex items-start gap-3">

                                <input
                                    type="checkbox"
                                    checked={
                                        form.requiresSpecimen
                                    }
                                    disabled={
                                        form.type !==
                                        'PARACLINICAL'
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        set(
                                            'requiresSpecimen',
                                            e.target
                                                .checked
                                        )
                                    }
                                    className="mt-0.5"
                                />

                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        Dịch vụ yêu cầu
                                        mẫu vật
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-gray-400">
                                        Áp dụng cho dịch
                                        vụ cần lấy máu,
                                        nước tiểu, mẫu
                                        bệnh phẩm...
                                    </p>
                                </div>

                            </div>
                        </label>

                    </div>
                </section>

                <div className="border-t border-gray-100" />

                {/* =====================================================
                    ĐỐI TƯỢNG ÁP DỤNG
                ===================================================== */}

                <section>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-700">
                        Đối tượng áp dụng
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                        <div>
                            <label className={labelCls}>
                                Tuổi tối thiểu
                            </label>

                            <input
                                type="number"
                                min="0"
                                max="120"
                                value={
                                    form.minimumAge
                                }
                                onChange={(e) =>
                                    set(
                                        'minimumAge',
                                        e.target.value
                                    )
                                }
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>
                                Tuổi tối đa
                            </label>

                            <input
                                type="number"
                                min="0"
                                max="120"
                                value={
                                    form.maximumAge
                                }
                                onChange={(e) =>
                                    set(
                                        'maximumAge',
                                        e.target.value
                                    )
                                }
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>
                                Giới tính áp dụng
                            </label>

                            <select
                                value={
                                    form.allowedGender
                                }
                                onChange={(e) =>
                                    set(
                                        'allowedGender',
                                        e.target.value
                                    )
                                }
                                className={inputCls}
                            >
                                <option value="">
                                    Tất cả
                                </option>

                                <option value="MALE">
                                    Nam
                                </option>

                                <option value="FEMALE">
                                    Nữ
                                </option>
                            </select>
                        </div>

                    </div>
                </section>

            </div>
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
    const { specializations } = useSpecializations();
    const { capabilities } = useCapabilities();

    const [search,    setSearch]    = useState('');
    const [typeF,     setTypeF]     = useState('');
    const [specialtyF,setSpecialtyF]= useState('');
    const [statusF,   setStatusF]   = useState('');
    const [sortF, setSortF] = useState('name,asc');
    const [showAdd,   setShowAdd]   = useState(false);
    const [configSvc, setConfigSvc] = useState(null);
    const [editSvc,   setEditSvc]   = useState(null);
    const [deleteId,  setDeleteId]  = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const queryParams = (targetPage = page) => ({ search, type: typeF, specialty: specialtyF, status: statusF, sort: sortF, page: targetPage });
    const handleSearch = () => fetchServices(queryParams(1));

    const handleCreate = async (payload) => {
        await createService(payload);
        toast.success('Thêm dịch vụ thành công!');
        fetchServices(queryParams(1));
    };

    const handleUpdate = async (id, payload) => {
        await updateService(id, payload);
        toast.success('Cập nhật dịch vụ thành công!');
        fetchServices(queryParams(page));
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
            fetchServices(queryParams(page));
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
                            {SERVICE_TYPES.map(st => <option key={st} value={st}>{SERVICE_TYPE_LABELS[st]}</option>)}
                        </select>
                    </div>
                    <div className="w-48">
                        <p className="text-xs text-gray-400 mb-1.5">{t('serviceManagement.filter.specialty')}</p>
                        <select value={specialtyF} onChange={e => setSpecialtyF(e.target.value)} className={inputCls}>
                            <option value="">-- Tất cả --</option>
                            {specializations.map(s => <option key={s.specializationId} value={s.specializationId}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="w-44">
                        <p className="text-xs text-gray-400 mb-1.5">{t('serviceManagement.filter.status')}</p>
                        <select value={statusF} onChange={e => setStatusF(e.target.value)} className={inputCls}>
                            <option value="">{t('serviceManagement.filter.statusAll')}</option>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                        </select>
                    </div>
                    <div className="w-48">
                        <p className="text-xs text-gray-400 mb-1.5">Sắp xếp</p>
                        <select value={sortF} onChange={e => setSortF(e.target.value)} className={inputCls}>
                            <option value="name,asc">Tên A–Z</option><option value="name,desc">Tên Z–A</option>
                            <option value="price,asc">Giá thấp đến cao</option><option value="price,desc">Giá cao đến thấp</option>
                            <option value="durationMinutes,asc">Thời lượng ngắn trước</option><option value="durationMinutes,desc">Thời lượng dài trước</option>
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
                        {SERVICE_TYPE_LABELS[svc.type] || svc.type}
                      </span>
                                    </td>
                                    <td className={tdCls + ' text-gray-500 text-xs'}>{svc.type === 'EXAMINATION' ? (svc.specialty || 'Chưa cấu hình') : 'Không áp dụng'}</td>
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
                                onChange={p => fetchServices(queryParams(p))} />
                </div>
            </div>

            {/* Modals */}
            {showAdd && (
                <AddModal t={t} specializations={specializations} capabilities={capabilities} onClose={() => setShowAdd(false)} onSubmit={handleCreate} />
            )}
            {configSvc && (
                <ConfigModal t={t} service={configSvc} onClose={() => setConfigSvc(null)} onSubmit={handleUpdate} />
            )}
            {editSvc && (
                <EditModal t={t} service={editSvc} specializations={specializations} capabilities={capabilities} onClose={() => setEditSvc(null)} onSubmit={handleUpdate} />
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

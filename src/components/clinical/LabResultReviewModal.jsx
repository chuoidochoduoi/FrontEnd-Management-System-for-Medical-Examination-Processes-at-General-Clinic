import { useEffect, useState } from 'react';
import {
    AlertCircle,
    Beaker,
    CheckCircle2,
    Clock3,
    ExternalLink,
    FileText,
    MapPin,
    RefreshCw,
    X,
} from 'lucide-react';

import ClinicalDataDisplay from '@/components/clinical/ClinicalDataDisplay';
import { useLabDetail } from '@/hooks/useLabDetail';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const authHeader = () => ({ Authorization: `Bearer ${get('token')}` });

const STATUS = {
    PENDING: { label: 'Chờ thực hiện', className: 'border-amber-200 bg-amber-50 text-amber-800', icon: Clock3 },
    IN_PROGRESS: { label: 'Đang thực hiện', className: 'border-blue-200 bg-blue-50 text-blue-800', icon: Clock3 },
    COMPLETED: { label: 'Đã hoàn thành', className: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle2 },
    CANCELLED: { label: 'Đã hủy', className: 'border-red-200 bg-red-50 text-red-700', icon: AlertCircle },
};

const SAMPLE_TYPE = {
    BLOOD: 'Máu',
    URINE: 'Nước tiểu',
    STOOL: 'Phân',
    SPUTUM: 'Đờm',
    SWAB: 'Mẫu ngoáy',
    BODY_FLUID: 'Dịch cơ thể',
    TISSUE: 'Mô',
    OTHER: 'Khác',
};

const SAMPLE_STATUS = {
    ACCEPTED: 'Đạt yêu cầu',
    REJECTED: 'Không đạt yêu cầu',
    RECOLLECT: 'Cần lấy lại',
};

const dateTime = value => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('vi-VN');
};

function ResultContent({ testRequestId, onClose, onRetry }) {
    const { order, loading, error, clinicalFormError, clinicalFormLoading } = useLabDetail(testRequestId);
    const [fileError, setFileError] = useState('');

    const status = STATUS[order?.status] || STATUS.PENDING;
    const StatusIcon = status.icon;
    const completed = order?.status === 'COMPLETED';
    const files = order?.attachments || [];

    const openFile = async (url) => {
        if (!url) return;
        setFileError('');
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(url.startsWith('http') ? url : `${apiBase}${url}`, {
                headers: authHeader(),
            });
            if (!response.ok) throw new Error('Không thể mở tệp kết quả.');
            const blobUrl = URL.createObjectURL(await response.blob());
            window.open(blobUrl, '_blank', 'noopener,noreferrer');
            window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (openError) {
            setFileError(openError.message || 'Không thể mở tệp kết quả.');
        }
    };

    if (loading) {
        return <div className="flex min-h-[360px] items-center justify-center gap-3 text-slate-500">
            <RefreshCw size={22} className="animate-spin" /> Đang tải kết quả cận lâm sàng...
        </div>;
    }

    if (error || !order) {
        return <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <AlertCircle size={36} className="text-red-500" />
            <h3 className="mt-3 text-lg font-bold text-slate-900">Không thể tải chi tiết kết quả</h3>
            <p className="mt-2 max-w-lg text-slate-600">{error || 'Dữ liệu yêu cầu cận lâm sàng không tồn tại.'}</p>
            <div className="mt-5 flex gap-3">
                <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-300 px-5 font-semibold text-slate-700">Đóng</button>
                <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-5 font-bold text-white"><RefreshCw size={17} /> Thử lại</button>
            </div>
        </div>;
    }

    return <>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Beaker size={22} /></span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Chi tiết kết quả cận lâm sàng</p>
                    <h2 id="lab-result-review-title" className="mt-1 truncate text-2xl font-bold text-slate-900">{order.serviceName || 'Dịch vụ cận lâm sàng'}</h2>
                    <p className="mt-1 text-sm text-slate-500">{order.serviceCode || order.testRequestId || testRequestId}</p>
                </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng chi tiết kết quả"><X size={22} /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm font-bold ${status.className}`}><StatusIcon size={16} />{status.label}</span>
                <span className="inline-flex items-center gap-2 text-sm text-slate-600"><MapPin size={16} />{order.performingDepartmentName || order.departmentName || 'Chưa xác định phòng thực hiện'}</span>
            </div>

            {!completed ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <h3 className="font-bold text-amber-900">Kết quả chưa được công bố</h3>
                    <p className="mt-2 leading-6 text-amber-800">
                        Yêu cầu đang ở trạng thái “{status.label}”. Bác sĩ có thể xem kết quả chuyên môn sau khi phòng cận lâm sàng ký xác nhận và hoàn thành.
                    </p>
                </div>
            ) : (
                <div className="mt-5 space-y-4">
                    <section className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-bold text-slate-900">Thông tin mẫu bệnh phẩm</h3>
                            <span className="text-sm text-slate-500">Thu nhận: {dateTime(order.collectedAt)}</span>
                        </div>
                        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-sm text-slate-500">Mã mẫu</dt><dd className="mt-1 font-semibold text-slate-900">{order.specimenId || 'Không áp dụng'}</dd></div>
                            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-sm text-slate-500">Loại mẫu</dt><dd className="mt-1 font-semibold text-slate-900">{SAMPLE_TYPE[order.sampleType] || order.sampleType || 'Không áp dụng'}</dd></div>
                            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-sm text-slate-500">Tình trạng</dt><dd className="mt-1 font-semibold text-slate-900">{SAMPLE_STATUS[order.sampleStatus] || order.sampleStatus || 'Không áp dụng'}</dd></div>
                        </dl>
                    </section>

                    {clinicalFormLoading ? (
                        <div className="rounded-2xl border border-slate-200 p-5 text-slate-500">Đang tải biểu mẫu kết quả...</div>
                    ) : order.clinicalForm?.schema ? (
                        <ClinicalDataDisplay
                            clinicalForm={order.clinicalForm}
                            schema={order.clinicalForm.schema}
                            values={order.resultData || {}}
                            title={order.clinicalForm.templateName || order.clinicalForm.name || 'Kết quả chuyên môn'}
                        />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-slate-600">
                            {clinicalFormError || 'Dịch vụ không có biểu mẫu kết quả có cấu trúc.'}
                        </div>
                    )}

                    {order.notes && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold text-slate-900">Kết luận</h3><p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{order.notes}</p></section>}

                    {(files.length > 0 || order.resultFileUrl) && <section className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="font-bold text-slate-900">Tệp kết quả</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {files.map(file => <button key={file.attachmentId || file.url} type="button" onClick={() => openFile(file.url)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-teal-700 hover:border-teal-300"><FileText size={17} />{file.originalName || 'Mở tệp kết quả'}<ExternalLink size={14} /></button>)}
                            {order.resultFileUrl && files.length === 0 && <button type="button" onClick={() => openFile(order.resultFileUrl)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-teal-700 hover:border-teal-300"><FileText size={17} />{order.resultFileName || 'Mở tệp kết quả'}<ExternalLink size={14} /></button>}
                        </div>
                        {fileError && <p className="mt-3 text-sm font-semibold text-red-600">{fileError}</p>}
                    </section>}
                </div>
            )}
        </div>

        <footer className="flex justify-end border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-teal-600 px-6 font-bold text-white hover:bg-teal-700">Đóng</button>
        </footer>
    </>;
}

export default function LabResultReviewModal({ testRequestId, onClose }) {
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        if (!testRequestId) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const handleKeyDown = event => {
            if (event.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [testRequestId, onClose]);

    if (!testRequestId) return null;

    return <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-result-review-title"
        onMouseDown={event => {
            if (event.target === event.currentTarget) onClose?.();
        }}
    >
        <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={event => event.stopPropagation()}>
            <ResultContent key={`${testRequestId}-${retryKey}`} testRequestId={testRequestId} onClose={onClose} onRetry={() => setRetryKey(current => current + 1)} />
        </div>
    </div>;
}

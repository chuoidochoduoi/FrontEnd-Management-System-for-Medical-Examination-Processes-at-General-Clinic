// src/pages/lab/LabDetailPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, X, AlertTriangle, ArrowLeft, CheckCircle2, Circle, Clock3 } from 'lucide-react';
import LabLayout from '@/components/layout/LabLayout';
import { useLabDetail } from '@/hooks/useLabDetail';
import { ROUTES } from '@/constants/routes';
import { toast } from 'react-toastify';

/* ── Status toggle button ── */
function StatusBtn({ value, active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={() => onClick(value)}
            className={`px-5 h-10 text-sm rounded-lg border transition-colors font-medium ${
                active
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
        >
            {children}
        </button>
    );
}

/* ── File upload zone ── */
function FileUpload({ file, onFile, onClear, t }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
    };

    return (
        <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 transition-colors ${
                dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-white'
            }`}
        >
            {file ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 border border-gray-200 rounded-lg flex flex-col items-center justify-center bg-green-50 shrink-0">
                            <FileText size={20} className="text-green-500" />
                            <span className="text-xs text-green-600 mt-0.5 font-medium">
                {file.name?.split('.').pop()?.toUpperCase() ?? 'FILE'}
              </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">{t('labDetail.result.label')}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{file.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => inputRef.current?.click()}
                            className="px-4 h-9 border border-gray-200 text-sm text-gray-600 rounded-lg hover:border-gray-400 transition-colors"
                        >
                            {t('labDetail.result.uploadBtn')}
                        </button>
                        <button
                            onClick={onClear}
                            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center shrink-0">
                            <Upload size={18} className="text-gray-300" />
                            <span className="text-xs text-gray-300 mt-0.5">PDF</span>
                        </div>
                        <p className="text-sm font-medium text-gray-500">{t('labDetail.result.label')}</p>
                    </div>
                    <button
                        onClick={() => inputRef.current?.click()}
                        className="px-5 h-9 border border-gray-800 text-sm font-medium text-gray-800 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                    >
                        {t('labDetail.result.uploadBtn')}
                    </button>
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="application/pdf,.pdf"
                onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
            />
        </div>
    );
}

/* ── Main page ── */
export default function LabDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t }  = useTranslation('lab');
    const { order, loading, saving, error, saveDraft, save, uploadFile } = useLabDetail(id);
    const departmentId = order?.departmentId;
    const systemRole = (localStorage.getItem('systemRole') || sessionStorage.getItem('systemRole') || '').toUpperCase();
    const isNurse = systemRole === 'NURSE';

    // Form state
    const [specimenId, setSpecimenId] = useState('');
    const [status,     setStatus]     = useState('PENDING');
    const [notes,      setNotes]      = useState('');
    const [file,       setFile]       = useState(null);       // File object
    const [fileUrl,    setFileUrl]    = useState('');         // uploaded URL
    const [cancelReason, setCancelReason] = useState('');
    const [uploading,  setUploading]  = useState(false);
    const [queueRequests, setQueueRequests] = useState([]);

    useEffect(() => {
        if (!order) return;
        setSpecimenId(order.specimenId     ?? '');
        setStatus(order.status             ?? 'IN_PROGRESS');
        setNotes(order.notes               ?? '');
        setFileUrl(order.resultFileUrl     ?? '');
        setCancelReason(order.cancelReason ?? '');
    }, [order]);

    useEffect(() => {
        if (!order?.queueTicketId) {
            setQueueRequests(order ? [order] : []);
            return;
        }
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/test-requests/queue/${order.queueTicketId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async response => {
                if (!response.ok) throw new Error('Không thể tải danh sách xét nghiệm trong lượt');
                return response.json();
            })
            .then(setQueueRequests)
            .catch(error => toast.error(error.message));
    }, [order?.queueTicketId, id]);

    const handleFile = async (f) => {
        if (f.type !== 'application/pdf' && !f.name?.toLowerCase().endsWith('.pdf')) return toast.error('Chỉ chấp nhận phiếu kết quả định dạng PDF');
        if (f.size > 10 * 1024 * 1024) return toast.error('Tệp kết quả không được vượt quá 10 MB');
        setFile(f);
        setUploading(true);
        try {
            const res = await uploadFile(f);
            setFileUrl(res.imageUrl || res.fileUrl || '');
        } catch {
            // fileUrl stays empty; will be uploaded on save
        } finally { setUploading(false); }
    };

    const buildPayload = () => ({
        specimenId, status, notes,
        resultFileUrl: fileUrl,
        cancelReason: status === 'CANCELLED' ? cancelReason : '',
    });

    const validateResult = (finalize) => {
        if (!specimenId.trim()) return 'Vui lòng nhập mã mẫu vật';
        if (specimenId.trim().length > 100) return 'Mã mẫu vật không được vượt quá 100 ký tự';
        if (status === 'CANCELLED' && !cancelReason.trim()) return 'Vui lòng nhập lý do hủy';
        if (finalize && status === 'COMPLETED' && !notes.trim()) return 'Vui lòng nhập kết luận của bác sĩ';
        if (finalize && status === 'COMPLETED' && !fileUrl) return 'Vui lòng tải phiếu kết quả PDF';
        return '';
    };

    const handleSaveDraft = () => {
        const message = validateResult(false);
        if (message) return toast.error(message);
        saveDraft(buildPayload());
    };

    const handleSave = async () => {
        if (isNurse) return toast.error('Y tá chỉ được lưu nháp kết quả. Bác sĩ phải ký xác nhận để hoàn thành.');
        if (status !== 'COMPLETED' && status !== 'CANCELLED') {
            return toast.error('Hãy chọn Hoàn thành để ký xác nhận, hoặc dùng nút Lưu nháp.');
        }
        const message = validateResult(true);
        if (message) return toast.error(message);
        const saved = await save(buildPayload());
        if (!saved || status === 'CANCELLED') return;
        const next = queueRequests.find(request =>
            request.testRequestId !== id && !['COMPLETED', 'CANCELLED'].includes(request.status));
        if (next) {
            toast.info('Đã hoàn thành kỹ thuật này. Chuyển sang kỹ thuật tiếp theo.');
            navigate(ROUTES.DOCTOR_LAB_DETAIL.replace(':id', next.testRequestId));
        } else if (departmentId) {
            toast.success('Đã hoàn thành toàn bộ xét nghiệm trong số gọi.');
            navigate(ROUTES.DOCTOR_LAB.replace(':departmentId', departmentId));
        }
    };

    const handleBack = () => {
        if (departmentId) {
            navigate(ROUTES.DOCTOR_LAB.replace(':departmentId', departmentId));
        } else {
            navigate(-1);
        }
    };

    if (loading) {
        return (
            <LabLayout>
                <p className="text-sm text-gray-400 text-center py-20">{t('labDetail.errors.loadFailed')}</p>
            </LabLayout>
        );
    }

    const isCancelled = status === 'CANCELLED';
    const pdfUrl = fileUrl
        ? (fileUrl.startsWith('http') ? fileUrl : `${import.meta.env.VITE_API_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`)
        : '';

    const handlePrintPdf = async () => {
        if (!pdfUrl) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return toast.error('Trình duyệt đang chặn cửa sổ in');
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(pdfUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            if (!response.ok) throw new Error();
            const objectUrl = URL.createObjectURL(await response.blob());
            printWindow.location.href = objectUrl;
            window.setTimeout(() => { printWindow.focus(); printWindow.print(); }, 1200);
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        } catch {
            printWindow.location.href = pdfUrl;
            toast.info('Dùng nút in trong trình xem PDF của trình duyệt.');
        }
    };

    return (
        <LabLayout>
            {/* Top bar — simplified (no search needed on detail page) */}
            <div className="h-13 bg-white border-b border-gray-100 px-4 flex items-center shrink-0">
                <div className="ml-52 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                        {order?.serviceName || t('labDetail.pageTitle')}
                    </p>
                    <p className="text-xs text-gray-400">
                        {order?.patientName || '—'} • {order?.patientCode || '—'}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-8">
                <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-4 lg:sticky lg:top-6">
                        <div className="border-b border-gray-100 pb-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Phiếu số</p>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-3xl font-bold text-primary-600">#{order?.queueNumber ?? '-'}</span>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    order?.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                                    order?.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                                    order?.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
                                    'bg-amber-50 text-amber-700'
                                }`}>
                                    {order?.status === 'COMPLETED' ? 'Hoàn thành'
                                     : order?.status === 'CANCELLED' ? 'Đã hủy'
                                     : order?.status === 'IN_PROGRESS' ? 'Đang xử lý'
                                     : 'Chờ xử lý'}
                                </span>
                            </div>
                            <p className="mt-3 font-semibold text-gray-900">{order?.patientName || '-'}</p>
                            <p className="text-sm text-gray-500">{order?.patientCode || '-'}</p>
                        </div>
                        <div className="pt-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Các xét nghiệm ({queueRequests.length})</p>
                            <div className="space-y-2">
                                {queueRequests.map((request, index) => {
                                    const done = ['COMPLETED', 'CANCELLED'].includes(request.status);
                                    const active = request.testRequestId === id;
                                    return <button key={request.testRequestId} type="button"
                                        onClick={() => navigate(ROUTES.DOCTOR_LAB_DETAIL.replace(':id', request.testRequestId))}
                                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${active ? 'border-primary-300 bg-primary-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        {done ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-500"/> : active ? <Clock3 size={18} className="mt-0.5 shrink-0 text-blue-500"/> : <Circle size={18} className="mt-0.5 shrink-0 text-gray-300"/>}
                                        <span><span className="block text-xs text-gray-400">Kỹ thuật {index + 1}</span><span className="block text-sm font-semibold text-gray-800">{request.serviceName || '-'}</span><span className={`mt-1 block text-xs ${done ? 'text-green-600' : active ? 'text-blue-600' : 'text-gray-400'}`}>{done ? 'Đã hoàn thành' : active ? 'Đang chọn xử lý' : 'Chưa thực hiện'}</span></span>
                                    </button>;
                                })}
                            </div>
                        </div>
                    </aside>
                    <main className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <button
                                    onClick={handleBack}
                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <div><p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Xét nghiệm đang xử lý</p><h1 className="text-2xl font-bold text-gray-900">{order?.serviceName || t('labDetail.pageTitle')}</h1></div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {order?.patientName}
                                {order?.gender && ` (${order.gender}`}
                                {order?.age && `, ${order.age} tuổi)`}
                            </p>
                            <p className="text-sm text-gray-400">ID: {order?.patientCode}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">{t('labDetail.collectionDate')}</p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">{order?.collectionDate ?? '—'}</p>
                        </div>
                    </div>

                    {/* ID mẫu vật */}
                    <div className="mb-6">
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                            {t('labDetail.specimenId')}
                        </label>
                        <input
                            type="text"
                            value={specimenId}
                            onChange={e => setSpecimenId(e.target.value)}
                            placeholder={t('labDetail.specimenIdPlaceholder')}
                            className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100"
                        />
                    </div>

                    {/* Trạng thái */}
                    {!isNurse && !(order?.status === 'COMPLETED' || order?.status === 'CANCELLED') && (
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-500 mb-2">
                                {t('labDetail.status.label')}
                            </label>
                            <div className="flex gap-2">
                                <StatusBtn value="PENDING" active={status === 'PENDING'} onClick={setStatus}>
                                    {t('labDetail.status.pending')}
                                </StatusBtn>
                                <StatusBtn value="IN_PROGRESS" active={status === 'IN_PROGRESS'} onClick={setStatus}>
                                    {t('labDetail.status.inProgress')}
                                </StatusBtn>
                                <StatusBtn value="COMPLETED" active={status === 'COMPLETED'} onClick={setStatus}>
                                    {t('labDetail.status.completed')}
                                </StatusBtn>
                                <StatusBtn value="CANCELLED" active={status === 'CANCELLED'} onClick={setStatus}>
                                    {t('labDetail.status.cancelled')}
                                </StatusBtn>
                            </div>
                        </div>
                    )}

                    {isNurse && !(order?.status === 'COMPLETED' || order?.status === 'CANCELLED') && (
                        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                            Y tá có thể nhập thông tin và lưu nháp. Chỉ bác sĩ phụ trách mới được ký xác nhận và hoàn thành kết quả.
                        </div>
                    )}

                    {/* Lý do hủy — hiện thêm block cảnh báo */}
                    {isCancelled && (
                        <div className="mb-6 border border-orange-200 bg-orange-50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-orange-600">
                                <AlertTriangle size={16} />
                                <p className="text-sm font-semibold">{t('labDetail.cancel.reason')}</p>
                            </div>
                            <textarea
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                placeholder={t('labDetail.cancel.reasonPlaceholder')}
                                rows={3}
                                className="w-full px-3 py-2.5 text-sm border border-orange-200 rounded-lg outline-none focus:border-orange-400 bg-white resize-none"
                            />
                        </div>
                    )}

                    {/* Upload file kết quả (ẩn khi mẫu hỏng) */}
                    {!isCancelled && (
                        <div className="mb-6">
                            <FileUpload
                                file={file}
                                onFile={handleFile}
                                onClear={() => { setFile(null); setFileUrl(''); }}
                                t={t}
                            />
                            {uploading && (
                                <p className="text-xs text-gray-400 mt-2">Đang tải file lên...</p>
                            )}
                        </div>
                    )}

                    {!isCancelled && pdfUrl && (
                        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
                                <div><p className="text-sm font-semibold text-gray-900">Xem trước phiếu kết quả PDF</p><p className="text-xs text-gray-500">Kiểm tra nội dung trước khi in hoặc hoàn thành kết quả</p></div>
                                <div className="flex gap-2"><button type="button" onClick={() => window.open(pdfUrl, '_blank')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Mở toàn màn hình</button><button type="button" onClick={handlePrintPdf} className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white">In phiếu PDF</button></div>
                            </div>
                            <iframe title="Xem trước phiếu kết quả xét nghiệm" src={pdfUrl} className="h-[680px] w-full bg-white"/>
                        </div>
                    )}

                    {/* Nhận xét / Ghi chú */}
                    <div className="mb-8">
                        <label className="block text-xs font-semibold text-gray-500 tracking-wide mb-2">
                            {t('labDetail.notes.label')}
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder={t('labDetail.notes.placeholder')}
                            rows={5}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                    {/* Actions - hidden when COMPLETED or CANCELLED */}
                    {!(order?.status === 'COMPLETED' || order?.status === 'CANCELLED') && (
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleSaveDraft}
                                disabled={saving}
                                className="px-6 h-11 border border-gray-300 hover:border-gray-500 text-gray-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
                            >
                                {t('labDetail.actions.draft')}
                            </button>
                            {!isNurse && (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-8 h-11 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    {saving ? t('labDetail.actions.saving') : 'Ký xác nhận & hoàn thành'}
                                </button>
                            )}
                        </div>
                    )}

                    </main>
                </div>
            </div>
        </LabLayout>
    );
}

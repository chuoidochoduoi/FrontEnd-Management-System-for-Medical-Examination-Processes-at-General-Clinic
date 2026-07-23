// src/pages/lab/LabDetailPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Bell, User, Upload, FileText, X, AlertTriangle, ArrowLeft } from 'lucide-react';
import LabLayout from '@/components/layout/LabLayout';
import { useLabDetail } from '@/hooks/useLabDetail';
import { ROUTES } from '@/constants/routes';

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
                            <span className="text-xs text-gray-300 mt-0.5">Excel</span>
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
                accept=".xlsx,.xls,.pdf,.jpg,.jpeg,.png"
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

    // Form state
    const [specimenId, setSpecimenId] = useState('');
    const [status,     setStatus]     = useState('PENDING');
    const [notes,      setNotes]      = useState('');
    const [file,       setFile]       = useState(null);       // File object
    const [fileUrl,    setFileUrl]    = useState('');         // uploaded URL
    const [cancelReason, setCancelReason] = useState('');
    const [uploading,  setUploading]  = useState(false);

    useEffect(() => {
        if (!order) return;
        setSpecimenId(order.specimenId     ?? '');
        setStatus(order.status             ?? 'IN_PROGRESS');
        setNotes(order.notes               ?? '');
        setFileUrl(order.resultFileUrl     ?? '');
        setCancelReason(order.cancelReason ?? '');
    }, [order]);

    const handleFile = async (f) => {
        setFile(f);
        setUploading(true);
        try {
            const res = await uploadFile(f);
            setFileUrl(res.fileUrl);
        } catch {
            // fileUrl stays empty; will be uploaded on save
        } finally { setUploading(false); }
    };

    const buildPayload = () => ({
        specimenId, status, notes,
        resultFileUrl: fileUrl,
        cancelReason: status === 'CANCELLED' ? cancelReason : '',
    });

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

    return (
        <LabLayout>
            {/* Top bar */}
            <div className="h-13 bg-white border-b border-gray-100 px-6 flex items-center gap-3 shrink-0">
                <div className="relative flex-1 max-w-md ml-10">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                        type="text"
                        placeholder={t('labQueue.searchPlaceholder')}
                        className="w-full h-10 pl-9 pr-4 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100 bg-white"
                    />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                        <Bell size={16} />
                    </button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                        <User size={16} />
                    </button>
                </div>
            </div>

            {/* Content - centered */}
            <div className="flex-1 overflow-y-auto bg-white flex items-start justify-center pt-10 px-6">
                <div className="w-full max-w-2xl">

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
                                <h1 className="text-2xl font-bold text-gray-900">{t('labDetail.pageTitle')}</h1>
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
                    {!(order?.status === 'COMPLETED' || order?.status === 'CANCELLED') && (
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
                                onClick={() => saveDraft(buildPayload())}
                                disabled={saving}
                                className="px-6 h-11 border border-gray-300 hover:border-gray-500 text-gray-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
                            >
                                {t('labDetail.actions.draft')}
                            </button>
                            <button
                                onClick={() => save(buildPayload())}
                                disabled={saving}
                                className="px-8 h-11 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
                            >
                                {saving ? t('labDetail.actions.saving') : t('labDetail.actions.save')}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </LabLayout>
    );
}

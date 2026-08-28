// src/pages/lab/LabDetailPage.jsx

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Circle,
    Clock3,
    Eye,
    FileText,
    FlaskConical,
    Info,
    Upload,
    UserRound,
    X,
} from 'lucide-react';

import { toast } from 'react-toastify';

import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import DynamicClinicalForm, { validateClinicalForm } from '@/components/clinical/DynamicClinicalForm';
import ClinicalDataDisplay from '@/components/clinical/ClinicalDataDisplay';
import { useLabDetail } from '@/hooks/useLabDetail';
import { ROUTES } from '@/constants/routes';

/* =========================================================
   HELPERS
========================================================= */

const displayQueueNumber = (number) =>
    String(number ?? 0).padStart(3, '0');

const statusConfig = {
    PENDING: {
        label: 'Chờ xử lý',
        cls: 'bg-amber-50 text-amber-700',
    },

    IN_PROGRESS: {
        label: 'Đang xử lý',
        cls: 'bg-blue-50 text-blue-700',
    },

    COMPLETED: {
        label: 'Hoàn thành',
        cls: 'bg-emerald-50 text-emerald-700',
    },

    CANCELLED: {
        label: 'Đã hủy',
        cls: 'bg-red-50 text-red-600',
    },
};

const SAMPLE_TYPES = [
    { value: 'BLOOD', label: 'Máu' },
    { value: 'URINE', label: 'Nước tiểu' },
    { value: 'STOOL', label: 'Phân' },
    { value: 'SPUTUM', label: 'Đờm' },
    { value: 'SWAB', label: 'Mẫu ngoáy' },
    { value: 'BODY_FLUID', label: 'Dịch cơ thể' },
    { value: 'TISSUE', label: 'Mô' },
    { value: 'OTHER', label: 'Khác' },
];

const SAMPLE_STATUSES = [
    {
        value: 'ACCEPTED',
        label: 'Đạt yêu cầu',
    },
    {
        value: 'REJECTED',
        label: 'Không đạt yêu cầu',
    },
    {
        value: 'RECOLLECT',
        label: 'Cần lấy lại',
    },
];

/* =========================================================
   FILE UPLOAD
========================================================= */

function FileUpload({
                        file,
                        fileUrl,
                        onFile,
                        onClear,
                        uploading,
                        disabled,
                        pdfUrl,
                        fileName,
                        onOpenPdf,
                        attachments = [],
                        onFiles,
                    }) {
    const inputRef = useRef(null);

    const [dragging, setDragging] =
        useState(false);

    const handleDrop = (event) => {
        event.preventDefault();

        if (disabled) return;

        setDragging(false);

        const selectedFiles = Array.from(event.dataTransfer.files || []);
        if (selectedFiles.length) onFiles?.(selectedFiles);
    };

    const hasFile = !!file || !!fileUrl || attachments.length > 0;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">

            {/* HEADER */}

            <div className="mb-3 flex items-center gap-2">
                <FileText
                    size={18}
                    className="text-primary-600"
                />

                <h3 className="text-sm font-semibold text-slate-900">
                    Tệp / hình ảnh kết quả
                </h3>
            </div>

            {hasFile ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">

                    <div className="flex flex-wrap items-center justify-between gap-3">

                        <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50">
                                <FileText
                                    size={20}
                                    className="text-red-500"
                                />
                            </div>

                            <div className="min-w-0">

                                <p className="truncate text-sm font-semibold text-slate-800">
                                    {file?.name ||
                                        attachments[0]?.originalName ||
                                        fileName ||
                                        'Phiếu kết quả'}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                    {file
                                        ? `${(
                                            file.size /
                                            1024 /
                                            1024
                                        ).toFixed(
                                            2
                                        )} MB`
                                        : 'Tệp đã tải lên'}
                                </p>

                            </div>

                        </div>

                        <div className="flex items-center gap-2">

                            {pdfUrl && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onOpenPdf(pdfUrl)
                                    }
                                    className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    <Eye size={15} />

                                    Tải phiếu kết quả
                                </button>
                            )}

                            {!disabled && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            inputRef.current?.click()
                                        }
                                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        Thay đổi tệp
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            onClear
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:text-red-500"
                                    >
                                        <X
                                            size={
                                                15
                                            }
                                        />
                                    </button>
                                </>
                            )}

                        </div>

                    </div>

                </div>
            ) : (
                <div
                    onDragOver={(event) => {
                        event.preventDefault();

                        if (!disabled) {
                            setDragging(
                                true
                            );
                        }
                    }}
                    onDragLeave={() =>
                        setDragging(false)
                    }
                    onDrop={handleDrop}
                    className={`flex min-h-[92px] items-center justify-between gap-4 rounded-xl border border-dashed px-4 py-3 transition ${
                        dragging
                            ? 'border-primary-400 bg-primary-50'
                            : 'border-slate-200 bg-slate-50/40'
                    }`}
                >

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white">
                            <Upload
                                size={18}
                                className="text-slate-400"
                            />
                        </div>

                        <div>
                            <p className="text-sm font-medium text-slate-600">
                                Kéo thả tệp vào đây
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                                PDF tối đa 10 MB
                            </p>
                        </div>

                    </div>

                    {!disabled && (
                        <button
                            type="button"
                            onClick={() =>
                                inputRef.current?.click()
                            }
                            className="h-9 shrink-0 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Chọn tệp
                        </button>
                    )}

                </div>
            )}

            {uploading && (
                <p className="mt-2 text-xs text-slate-400">
                    Đang tải file lên...
                </p>
            )}

            {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                    {attachments.map((attachment) => (
                        <button key={attachment.attachmentId} type="button"
                                onClick={() => onOpenPdf(attachment.url)}
                                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-xs hover:bg-slate-50">
                            <span className="truncate font-medium text-slate-700">{attachment.originalName}</span>
                            <span className="shrink-0 text-slate-400">{(attachment.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        </button>
                    ))}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                multiple
                disabled={disabled}
                onChange={(event) => {
                    const selectedFiles = Array.from(event.target.files || []);
                    if (selectedFiles.length) onFiles?.(selectedFiles);
                }}
            />

        </div>
    );
}

/* =========================================================
   CONFIRM MODAL
========================================================= */

function ConfirmCompleteModal({
                                  open,
                                  onClose,
                                  onConfirm,
                                  saving,
                                  order,
                                  specimenId,
                                  requiresSpecimen,
                              }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-[1px]">

            <div className="w-full max-w-[460px] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">

                {/* HEADER */}

                <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
                            <AlertTriangle
                                size={19}
                                className="text-amber-600"
                            />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Xác nhận hoàn thành kết quả
                            </h2>

                            <p className="mt-1 text-sm leading-5 text-slate-500">
                                Bạn có chắc chắn muốn hoàn thành kết quả cận lâm sàng này?
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                    >
                        <X size={17} />
                    </button>

                </div>

                {/* INFORMATION */}

                <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">

                    <div className="grid grid-cols-[110px_1fr] gap-3">

                        <span className="text-slate-500">
                            Dịch vụ
                        </span>

                        <span className="font-semibold text-slate-800">
                            {order?.serviceName ||
                                '—'}
                        </span>

                    </div>

                    {requiresSpecimen && (
                        <div className="grid grid-cols-[110px_1fr] gap-3">

                            <span className="text-slate-500">
                                Mã mẫu vật
                            </span>

                            <span className="font-semibold text-slate-800">
                                {specimenId ||
                                    '—'}
                            </span>

                        </div>
                    )}

                    <div className="grid grid-cols-[110px_1fr] gap-3">

                        <span className="text-slate-500">
                            Bệnh nhân
                        </span>

                        <span className="font-semibold text-slate-800">
                            {order?.patientName ||
                                '—'}

                            {order?.patientCode &&
                                ` (${order.patientCode})`}
                        </span>

                    </div>

                </div>

                {/* WARNING */}

                <div className="mt-4 flex gap-2 rounded-xl bg-amber-50 px-3.5 py-3">

                    <Info
                        size={16}
                        className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <p className="text-xs leading-5 text-amber-800">
                        Sau khi xác nhận, kết quả sẽ chuyển sang trạng thái{' '}
                        <strong>
                            Hoàn thành
                        </strong>
                        .
                    </p>

                </div>

                {/* ACTION */}

                <div className="mt-5 flex justify-end gap-2">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={saving}
                        className="h-10 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
                    >
                        {saving
                            ? 'Đang xử lý...'
                            : 'Xác nhận hoàn thành'}
                    </button>

                </div>

            </div>

        </div>
    );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function LabDetailPage() {
    const { id } = useParams();

    const navigate = useNavigate();

    const { t } =
        useTranslation('lab');

    const {
        order,
        loading,
        saving,
        error,
        saveDraft,
        save,
        uploadFile,
        uploadAttachments,
        cancelRequest,
    } = useLabDetail(id);

    const departmentId =
        order?.departmentId;

    /* =========================================================
       STATE
    ========================================================= */

    const [
        specimenId,
        setSpecimenId,
    ] = useState('');

    const [
        sampleType,
        setSampleType,
    ] = useState('');

    const [
        sampleStatus,
        setSampleStatus,
    ] = useState('');

    const [notes, setNotes] =
        useState('');

    const [resultData, setResultData] = useState({});
    const [structuredErrors, setStructuredErrors] = useState({});

    const [file, setFile] =
        useState(null);

    const [attachments, setAttachments] = useState([]);

    const [fileUrl, setFileUrl] =
        useState('');

    const [
        localPreviewUrl,
        setLocalPreviewUrl,
    ] = useState('');

    const [
        uploading,
        setUploading,
    ] = useState(false);

    const [
        queueRequests,
        setQueueRequests,
    ] = useState([]);

    const [
        showAllServices,
        setShowAllServices,
    ] = useState(false);

    const [
        confirmOpen,
        setConfirmOpen,
    ] = useState(false);

    const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    /* =========================================================
       DATA INIT
    ========================================================= */

    useEffect(() => {
        if (!order) return;

        setSpecimenId(
            order.specimenId ?? ''
        );

        setSampleType(
            order.sampleType ?? ''
        );

        setSampleStatus(
            order.sampleStatus ?? ''
        );

        setNotes(
            order.notes ?? ''
        );

        setResultData(order.resultData ?? order.clinicalForm?.values ?? {});
        setStructuredErrors({});
        setAttachments(order.attachments ?? []);

        setFileUrl(
            order.resultFileUrl ?? ''
        );

    }, [order]);

    /* =========================================================
       LOAD SERVICES IN SAME QUEUE
    ========================================================= */

    useEffect(() => {
        if (!order?.queueTicketId) {
            setQueueRequests(
                order ? [order] : []
            );

            return;
        }

        const token =
            localStorage.getItem(
                'token'
            ) ||
            sessionStorage.getItem(
                'token'
            );

        fetch(
            `${
                import.meta.env
                    .VITE_API_URL
            }/api/v1/test-requests/queue/${
                order.queueTicketId
            }`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(
                        'Không thể tải danh sách xét nghiệm trong lượt'
                    );
                }

                return response.json();
            })
            .then(setQueueRequests)
            .catch((fetchError) =>
                toast.error(
                    fetchError.message
                )
            );
    }, [
        order?.queueTicketId,
        id,
    ]);

    /* =========================================================
       DERIVED
    ========================================================= */

    const requiresSpecimen =
        order?.requiresSpecimen ===
        true;

    const isFinished =
        order?.status ===
        'COMPLETED' ||
        order?.status ===
        'CANCELLED';

    const permissions = order?.permissions ?? {};
    const canEditResult = !isFinished && permissions.canEditResult === true;
    const canUpload = !isFinished && permissions.canUpload === true;
    const canSign = !isFinished && permissions.canSign === true;
    const canCancel = !isFinished && permissions.canCancel === true;
    const isReadOnly = isFinished || !canEditResult;

    const isCancelled =
        order?.status === 'CANCELLED';

    const currentRequest =
        queueRequests.find(
            (request) =>
                String(
                    request.testRequestId
                ) === String(id)
        ) || order;

    const otherRequests =
        queueRequests.filter(
            (request) =>
                String(
                    request.testRequestId
                ) !== String(id)
        );

    const completedCount =
        queueRequests.filter(
            (request) =>
                request.status ===
                'COMPLETED'
        ).length;

    const currentStatus =
        statusConfig[
            order?.status
            ] ||
        statusConfig.PENDING;

    const pdfUrl =
        localPreviewUrl ||
        (fileUrl
            ? fileUrl.startsWith(
                'http'
            )
                ? fileUrl
                : `${
                    import.meta.env
                        .VITE_API_URL
                }${
                    fileUrl.startsWith(
                        '/'
                    )
                        ? ''
                        : '/'
                }${fileUrl}`
            : '');

    /* =========================================================
       FILE
    ========================================================= */

    const handleFile = async (
        selectedFile
    ) => {
        if (!canUpload) {
            return toast.error('Bạn không có quyền tải kết quả tại phòng thực hiện này');
        }
        if (
            selectedFile.type !==
            'application/pdf' &&
            !selectedFile.name
                ?.toLowerCase()
                .endsWith('.pdf')
        ) {
            return toast.error(
                'Chỉ chấp nhận phiếu kết quả định dạng PDF'
            );
        }

        if (
            selectedFile.size >
            10 * 1024 * 1024
        ) {
            return toast.error(
                'Tệp kết quả không được vượt quá 10 MB'
            );
        }

        setFile(selectedFile);

        if (localPreviewUrl) {
            URL.revokeObjectURL(
                localPreviewUrl
            );
        }

        setLocalPreviewUrl(
            URL.createObjectURL(
                selectedFile
            )
        );

        setUploading(true);

        try {
            const response =
                await uploadFile(
                    selectedFile
                );

            setFileUrl(
                response.imageUrl ||
                response.fileUrl ||
                ''
            );
        } catch {
            // File se duoc upload lai theo logic cua hook neu can.
        } finally {
            setUploading(false);
        }
    };

    const handleFiles = async (selectedFiles) => {
        if (!canUpload) return toast.error('Bạn không có quyền tải kết quả tại phòng thực hiện này');
        if (selectedFiles.length + attachments.length > 10) return toast.error('Mỗi kết quả chỉ được tối đa 10 tệp');
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (selectedFiles.some((selected) => !allowed.includes(selected.type) || selected.size > 10 * 1024 * 1024))
            return toast.error('Chỉ nhận PDF/JPEG/PNG/WebP, tối đa 10 MB mỗi tệp');
        setUploading(true);
        try {
            const saved = await saveDraft(buildPayload());
            if (!saved) throw new Error('Không thể tạo bản nháp kết quả');
            const uploaded = await uploadAttachments(selectedFiles);
            setAttachments((current) => [...current, ...uploaded]);
            toast.success(`Đã tải ${uploaded.length} tệp`);
        } catch (uploadError) {
            toast.error(uploadError.message || 'Không thể tải tệp');
        } finally { setUploading(false); }
    };

    const handleClearFile = () => {
        if (localPreviewUrl) {
            URL.revokeObjectURL(
                localPreviewUrl
            );
        }

        setLocalPreviewUrl('');
        setFile(null);
        setFileUrl('');
    };
    /* =========================================================
       OPEN SECURE PDF
    ========================================================= */

    const openSecurePdf = async (url) => {
        if (!url) return;
        
        // Local preview doesn't need auth
        if (url.startsWith('blob:')) {
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const fullUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL}${url}`;
            const response = await fetch(fullUrl, { headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) throw new Error('Không thể mở tệp kết quả');
            const blobUrl = URL.createObjectURL(await response.blob());
            window.open(blobUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (error) {
            toast.error(error.message);
        }
    };

    /* =========================================================
       PAYLOAD
    ========================================================= */

    const buildPayload = (
        targetStatus = order?.status ?? 'IN_PROGRESS'
    ) => ({
        specimenId,
        status: targetStatus,
        notes,

        sampleType,
        sampleStatus,

        resultFileUrl: fileUrl,

        formTemplateVersionId:
            order?.formTemplateVersionId ?? order?.clinicalForm?.templateVersionId ?? null,

        resultData:
            order?.clinicalForm ? resultData : null,
    });

    /* =========================================================
       VALIDATE
    ========================================================= */

    const validateResult = (
        finalize,
        targetStatus = order?.status ?? 'IN_PROGRESS'
    ) => {
        if (order?.clinicalForm?.schema) {
            const formErrors = validateClinicalForm(order.clinicalForm.schema, resultData, finalize);
            setStructuredErrors(formErrors);
            const firstInvalidKey = Object.keys(formErrors)[0];
            if (firstInvalidKey) {
                window.setTimeout(() => document.getElementById(`clinical-${firstInvalidKey}`)?.focus(), 0);
                return formErrors[firstInvalidKey];
            }
        }
        if (
            requiresSpecimen &&
            specimenId.trim().length >
            100
        ) {
            return 'Mã mẫu vật không được vượt quá 100 ký tự';
        }

        if (
            finalize &&
            requiresSpecimen &&
            !specimenId.trim()
        ) {
            return 'Vui lòng nhập mã mẫu vật';
        }

        if (
            finalize &&
            requiresSpecimen &&
            (!sampleType ||
                !sampleStatus)
        ) {
            return 'Vui lòng chọn loại và tình trạng mẫu vật';
        }

        if (
            finalize &&
            targetStatus ===
            'COMPLETED' &&
            !notes.trim()
        ) {
            return 'Vui lòng nhập kết luận';
        }

        const structuredValues = Object.keys(resultData || {}).filter((key) => key !== '_meta');
        if (finalize && targetStatus === 'COMPLETED' && !fileUrl && attachments.length === 0 && structuredValues.length === 0)
            return 'Vui lòng nhập kết quả có cấu trúc hoặc tải tệp kết quả';

        return '';
    };

    /* =========================================================
       SAVE DRAFT
    ========================================================= */

    const handleSaveDraft = () => {
        if (!canEditResult) {
            return toast.error('Bạn chỉ có quyền xem kết quả cận lâm sàng');
        }
        const message =
            validateResult(false);

        if (message) {
            return toast.error(
                message
            );
        }

        saveDraft(
            buildPayload()
        );
    };

    /* =========================================================
       OPEN CONFIRM
    ========================================================= */

    const handleOpenConfirm = () => {
        if (!canSign) {
            return toast.error(
                'Chỉ bác sĩ phụ trách phòng thực hiện mới được ký kết quả.'
            );
        }

        const message =
            validateResult(
                true,
                'COMPLETED'
            );

        if (message) {
            return toast.error(
                message
            );
        }

        setConfirmOpen(true);
    };

    /* =========================================================
       CONFIRM COMPLETE
    ========================================================= */

    const handleConfirmComplete =
        async () => {
            if (!canSign) {
                setConfirmOpen(false);
                return toast.error('Bạn không còn quyền ký kết quả tại phòng này');
            }
            const message =
                validateResult(
                    true,
                    'COMPLETED'
                );

            if (message) {
                setConfirmOpen(false);

                return toast.error(
                    message
                );
            }

            const saved =
                await save(
                    buildPayload(
                        'COMPLETED'
                    )
                );

            if (!saved) return;

            setConfirmOpen(false);

            const next =
                queueRequests.find(
                    (request) =>
                        String(
                            request.testRequestId
                        ) !==
                        String(id) &&
                        ![
                            'COMPLETED',
                            'CANCELLED',
                        ].includes(
                            request.status
                        )
                );

            if (next) {
                toast.info(
                    'Đã hoàn thành dịch vụ. Chuyển sang dịch vụ tiếp theo.'
                );

                navigate(
                    ROUTES.DOCTOR_LAB_DETAIL.replace(
                        ':id',
                        next.testRequestId
                    )
                );

                return;
            }

            toast.success(
                'Đã hoàn thành yêu cầu cận lâm sàng.'
            );

            if (departmentId) {
                navigate(
                    ROUTES.DOCTOR_LAB.replace(
                        ':departmentId',
                        departmentId
                    )
                );
            } else {
                navigate(-1);
            }
        };

    const handleCancelRequest = async () => {
        if (!canCancel) {
            setCancelModalOpen(false);
            return toast.error('Chỉ bác sĩ phụ trách phòng thực hiện mới được hủy yêu cầu');
        }
        if (!cancelReason.trim()) {
            return toast.error('Vui lòng nhập lý do hủy');
        }
        const cancelled = await cancelRequest(cancelReason);
        if (cancelled) {
            setCancelModalOpen(false);
            setCancelReason('');
        }
    };

    /* =========================================================
       BACK
    ========================================================= */

    const handleBack = () => {
        if (departmentId) {
            navigate(
                ROUTES.DOCTOR_LAB.replace(
                    ':departmentId',
                    departmentId
                )
            );
        } else {
            navigate(-1);
        }
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <MedicalStaffLayout>
                <div className="flex flex-1 items-center justify-center bg-slate-50">
                    <p className="text-sm text-slate-400">
                        Đang tải dữ liệu...
                    </p>
                </div>
            </MedicalStaffLayout>
        );
    }

    /* =========================================================
       UI
    ========================================================= */

    return (
        <MedicalStaffLayout>

            {/* =================================================
                MAIN PAGE
            ================================================= */}

            <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-5">

                <div className="w-full">

                    {/* BACK */}

                    <button
                        type="button"
                        onClick={handleBack}
                        className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                    >
                        <ArrowLeft
                            size={17}
                        />

                        Quay lại danh sách
                    </button>

                    {/* =================================================
                        TWO COLUMNS
                    ================================================= */}

                    <div className="grid w-full gap-4 xl:grid-cols-[290px_minmax(0,1fr)]">

                        {/* =================================================
                            LEFT TICKET
                        ================================================= */}

                        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-5">

                            {/* TICKET */}

                            <div className="border-b border-slate-100 pb-4">

                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Phiếu xét nghiệm
                                </p>

                                <div className="mt-2 flex items-center justify-between gap-3">

                                    <span className="text-3xl font-bold text-primary-600">
                                        #
                                        {displayQueueNumber(
                                            order?.queueNumber
                                        )}
                                    </span>

                                    <span
                                        className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${currentStatus.cls}`}
                                    >
                                        {
                                            currentStatus.label
                                        }
                                    </span>

                                </div>

                                <p className="mt-3 truncate text-sm font-bold text-slate-900">
                                    {order?.patientName ||
                                        '—'}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                    {order?.patientCode ||
                                        '—'}
                                </p>

                            </div>

                            {/* CURRENT SERVICE */}

                            <div className="border-b border-slate-100 py-4">

                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Dịch vụ hiện tại
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (
                                            currentRequest?.testRequestId
                                        ) {
                                            navigate(
                                                ROUTES.DOCTOR_LAB_DETAIL.replace(
                                                    ':id',
                                                    currentRequest.testRequestId
                                                )
                                            );
                                        }
                                    }}
                                    className="mt-2 flex w-full items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-3 py-3 text-left transition hover:border-primary-300"
                                >

                                    <Clock3
                                        size={17}
                                        className="shrink-0 text-primary-600"
                                    />

                                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
                                        {currentRequest?.serviceName ||
                                            order?.serviceName ||
                                            '—'}
                                    </span>

                                </button>

                                {otherRequests.length >
                                    0 && (
                                        <div className="mt-3">

                                            <p className="text-xs text-slate-500">
                                                -{' '}
                                                {
                                                    otherRequests.length
                                                }{' '}
                                                dịch vụ khác
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowAllServices(
                                                        (
                                                            value
                                                        ) =>
                                                            !value
                                                    )
                                                }
                                                className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary-600 transition hover:text-primary-700"
                                            >
                                                {showAllServices
                                                    ? 'Thu gọn'
                                                    : 'Xem tất cả'}

                                                {showAllServices ? (
                                                    <ChevronUp
                                                        size={
                                                            15
                                                        }
                                                    />
                                                ) : (
                                                    <ChevronRight
                                                        size={
                                                            15
                                                        }
                                                    />
                                                )}
                                            </button>

                                        </div>
                                    )}

                                {/* EXPANDED SERVICES */}

                                {showAllServices &&
                                    otherRequests.length >
                                    0 && (
                                        <div className="mt-3 space-y-2">

                                            {otherRequests.map(
                                                (
                                                    request
                                                ) => {
                                                    const done =
                                                        [
                                                            'COMPLETED',
                                                            'CANCELLED',
                                                        ].includes(
                                                            request.status
                                                        );

                                                    return (
                                                        <button
                                                            key={
                                                                request.testRequestId
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    ROUTES.DOCTOR_LAB_DETAIL.replace(
                                                                        ':id',
                                                                        request.testRequestId
                                                                    )
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2.5 text-left transition hover:border-primary-200 hover:bg-primary-50/40"
                                                        >
                                                            {done ? (
                                                                <CheckCircle2
                                                                    size={
                                                                        16
                                                                    }
                                                                    className="shrink-0 text-emerald-500"
                                                                />
                                                            ) : (
                                                                <Circle
                                                                    size={
                                                                        16
                                                                    }
                                                                    className="shrink-0 text-slate-300"
                                                                />
                                                            )}

                                                            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                                                            {request.serviceName ||
                                                                '—'}
                                                        </span>

                                                            <ChevronRight
                                                                size={
                                                                    14
                                                                }
                                                                className="shrink-0 text-slate-300"
                                                            />
                                                        </button>
                                                    );
                                                }
                                            )}

                                        </div>
                                    )}

                            </div>

                            {/* SUMMARY */}

                            <div className="pt-4">

                                <div className="flex items-center justify-between text-xs">

                                    <span className="text-slate-400">
                                        Tiến độ
                                    </span>

                                    <span className="font-semibold text-slate-700">
                                        {
                                            completedCount
                                        }
                                        /
                                        {
                                            queueRequests.length
                                        }
                                    </span>

                                </div>

                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">

                                    <div
                                        className="h-full rounded-full bg-primary-500 transition-all"
                                        style={{
                                            width:
                                                queueRequests.length >
                                                0
                                                    ? `${(
                                                        completedCount /
                                                        queueRequests.length
                                                    ) *
                                                    100}%`
                                                    : '0%',
                                        }}
                                    />

                                </div>

                            </div>

                        </aside>

                        {/* =================================================
                            RIGHT CONTENT
                        ================================================= */}

                        <main className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                            {/* HEADER */}

                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">

                                <div>

                                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                                        Cận lâm sàng
                                    </p>

                                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                                        {order?.serviceName ||
                                            t(
                                                'labDetail.pageTitle'
                                            )}
                                    </h1>

                                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">

                                        <span>
                                            ID:{' '}
                                            {order?.testRequestId ||
                                                id}
                                        </span>

                                        {order?.patientCode && (
                                            <>
                                                <span>
                                                    •
                                                </span>

                                                <span>
                                                    {
                                                        order.patientCode
                                                    }
                                                </span>
                                            </>
                                        )}

                                    </div>

                                </div>

                                <span
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${currentStatus.cls}`}
                                >
                                    {
                                        currentStatus.label
                                    }
                                </span>

                            </div>

                            {!isFinished && !canEditResult && !canSign && !canCancel && (
                                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                                    Bạn chỉ có quyền xem kết quả cận lâm sàng. Chỉ nhân sự được phân công tại phòng thực hiện mới có thể cập nhật phiếu.
                                </div>
                            )}

                            {/* =================================================
                                SPECIMEN
                            ================================================= */}

                            {requiresSpecimen && (
                                <section className="mb-4 rounded-xl border border-primary-100 bg-primary-50/20 p-4">

                                    <div className="mb-4 flex items-center gap-2">

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                                            <FlaskConical
                                                size={
                                                    17
                                                }
                                                className="text-primary-600"
                                            />
                                        </div>

                                        <div>
                                            <h2 className="text-sm font-semibold text-slate-900">
                                                Thông tin mẫu vật
                                            </h2>

                                            <p className="text-xs text-slate-400">
                                                Thông tin dành cho dịch vụ có lấy mẫu
                                            </p>
                                        </div>

                                    </div>

                                    {/* FIRST ROW */}

                                    <div className="grid gap-3 lg:grid-cols-3">

                                        {/* SAMPLE ID */}

                                        <div>

                                            <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                                Mã mẫu vật
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    specimenId
                                                }
                                                disabled={
                                                    isReadOnly
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setSpecimenId(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                placeholder="VD: SMP-20260811-A8F912"
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-400 disabled:bg-slate-50 disabled:text-slate-500"
                                            />

                                        </div>

                                        {/* TYPE */}

                                        <div>

                                            <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                                Loại mẫu
                                            </label>

                                            <select
                                                value={
                                                    sampleType
                                                }
                                                disabled={
                                                    isReadOnly
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setSampleType(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none disabled:bg-slate-50"
                                            >
                                                <option value="">
                                                    -- Chọn loại mẫu --
                                                </option>

                                                {SAMPLE_TYPES.map(
                                                    (
                                                        option
                                                    ) => (
                                                        <option
                                                            key={
                                                                option.value
                                                            }
                                                            value={
                                                                option.value
                                                            }
                                                        >
                                                            {
                                                                option.label
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                        </div>

                                        {/* STATUS */}

                                        <div>

                                            <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                                Tình trạng mẫu
                                            </label>

                                            <select
                                                value={
                                                    sampleStatus
                                                }
                                                disabled={
                                                    isReadOnly
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setSampleStatus(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none disabled:bg-slate-50"
                                            >
                                                <option value="">
                                                    -- Chọn tình trạng --
                                                </option>

                                                {SAMPLE_STATUSES.map(
                                                    (
                                                        option
                                                    ) => (
                                                        <option
                                                            key={
                                                                option.value
                                                            }
                                                            value={
                                                                option.value
                                                            }
                                                        >
                                                            {
                                                                option.label
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                        </div>

                                    </div>

                                    {/* AUTO INFO */}

                                    <div className="mt-3 grid gap-3 md:grid-cols-2">

                                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">

                                            <p className="text-[11px] font-medium text-slate-400">
                                                Thời gian lấy mẫu
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {order?.collectedAt
                                                    ? new Date(
                                                        order.collectedAt
                                                    ).toLocaleString(
                                                        'vi-VN'
                                                    )
                                                    : 'Hệ thống tự ghi nhận khi lưu'}
                                            </p>

                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">

                                            <p className="text-[11px] font-medium text-slate-400">
                                                Người lấy mẫu
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {order?.collectedByName ||
                                                    'Hệ thống tự lấy nhân viên đang đăng nhập'}
                                            </p>

                                        </div>

                                    </div>

                                </section>
                            )}

                            {/* =================================================
                                FILE
                            ================================================= */}

                            {!isCancelled && (
                                <div className="mb-4">
                                    {isReadOnly ? <ClinicalDataDisplay
                                        clinicalForm={order?.clinicalForm}
                                        schema={order?.clinicalForm?.schema}
                                        values={resultData}
                                        title={order?.clinicalForm?.templateName || order?.clinicalForm?.name || 'Kết quả có cấu trúc'}
                                    /> : <DynamicClinicalForm
                                        schema={order?.clinicalForm?.schema}
                                        value={resultData}
                                        onChange={(nextValue) => {
                                            setResultData(nextValue);
                                            setStructuredErrors({});
                                        }}
                                        disabled={isReadOnly}
                                        errors={structuredErrors}
                                        title={order?.clinicalForm?.templateName || 'Kết quả có cấu trúc'}
                                        emptyMessage="Dịch vụ này chưa được cấu hình biểu mẫu kết quả"
                                        patientAge={order?.patientAge}
                                        patientGender={order?.patientGender}
                                    />}
                                </div>
                            )}

                            {!isCancelled && (
                                <div className="mb-4">

                                    <FileUpload
                                        file={file}
                                        fileUrl={
                                            fileUrl
                                        }
                                        pdfUrl={
                                            pdfUrl
                                        }
                                        fileName={
                                            order?.resultFileName
                                        }
                                        onFile={
                                            handleFile
                                        }
                                        onClear={
                                            handleClearFile
                                        }
                                        uploading={
                                            uploading
                                        }
                                        disabled={
                                            !canUpload
                                        }
                                        onOpenPdf={
                                            openSecurePdf
                                        }
                                        attachments={attachments}
                                        onFiles={handleFiles}
                                    />

                                </div>
                            )}

                            {/* =================================================
                                CANCEL
                            ================================================= */}

                            {isCancelled && (
                                <section className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4">

                                    <div className="mb-2 flex items-center gap-2 text-red-600">
                                        <AlertTriangle
                                            size={
                                                16
                                            }
                                        />

                                        <p className="text-sm font-semibold">
                                            Lý do hủy
                                        </p>
                                    </div>

                                    <textarea
                                        value={order?.cancelReason ?? ''}
                                        readOnly
                                        rows={3}
                                        className="w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm outline-none"
                                    />

                                </section>
                            )}

                            {/* =================================================
                                CONCLUSION
                            ================================================= */}

                            <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">

                                <label className="mb-2 block text-sm font-semibold text-slate-900">
                                    Kết luận
                                </label>

                                <div className="relative">

                                    <textarea
                                        value={
                                            notes
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNotes(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        disabled={
                                            isReadOnly
                                        }
                                        placeholder="Nhập kết luận / nhận xét kết quả..."
                                        rows={4}
                                        maxLength={
                                            500
                                        }
                                        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 pb-7 text-sm outline-none transition focus:border-primary-400 disabled:bg-slate-50"
                                    />

                                    <span className="absolute bottom-2 right-3 text-[11px] text-slate-400">
                                        {
                                            notes.length
                                        }
                                        /500
                                    </span>

                                </div>

                            </section>

                            {/* ERROR */}

                            {error && (
                                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                                    {error}
                                </p>
                            )}

                            {/* =================================================
                                ACTIONS
                            ================================================= */}

                            {!isFinished ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">

                                    {canCancel ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCancelReason('');
                                                setCancelModalOpen(true);
                                            }}
                                            className="text-xs font-semibold text-red-600 transition hover:text-red-700"
                                        >
                                            Hủy yêu cầu
                                        </button>
                                    ) : <span />}

                                    <div className="flex gap-2">

                                        {canEditResult && (
                                            <button
                                                type="button"
                                                onClick={handleSaveDraft}
                                                disabled={saving}
                                                className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                Lưu nháp
                                            </button>
                                        )}

                                        {canSign && (
                                            <button
                                                type="button"
                                                onClick={handleOpenConfirm}
                                                disabled={saving}
                                                className="h-10 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
                                            >
                                                Ký xác nhận & hoàn thành
                                            </button>
                                        )}

                                    </div>

                                </div>
                            ) : (
                                <div className="flex justify-end border-t border-slate-100 pt-4">

                                    <button
                                        type="button"
                                        onClick={
                                            handleBack
                                        }
                                        className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        Quay lại
                                    </button>

                                </div>
                            )}

                        </main>

                    </div>

                </div>

            </div>

            {/* =================================================
                CONFIRM MODAL
            ================================================= */}

            <ConfirmCompleteModal
                open={confirmOpen}
                onClose={() =>
                    setConfirmOpen(false)
                }
                onConfirm={
                    handleConfirmComplete
                }
                saving={saving}
                order={order}
                specimenId={specimenId}
                requiresSpecimen={
                    requiresSpecimen
                }
            />

            {cancelModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
                        <h2 className="text-base font-bold text-slate-900">Hủy yêu cầu cận lâm sàng</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Yêu cầu sẽ dừng xử lý và không thể tiếp tục nhập kết quả. Vui lòng ghi rõ lý do.
                        </p>
                        <label className="mt-4 block text-sm font-medium text-slate-800">
                            Lý do hủy <span className="text-red-600">*</span>
                        </label>
                        <textarea
                            value={cancelReason}
                            onChange={(event) => setCancelReason(event.target.value)}
                            rows={4}
                            maxLength={500}
                            className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400"
                            placeholder="Nhập lý do hủy yêu cầu..."
                        />
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCancelModalOpen(false)}
                                disabled={saving}
                                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 disabled:opacity-50"
                            >
                                Quay lại
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelRequest}
                                disabled={saving || !cancelReason.trim()}
                                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                Xác nhận hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </MedicalStaffLayout>
    );
}

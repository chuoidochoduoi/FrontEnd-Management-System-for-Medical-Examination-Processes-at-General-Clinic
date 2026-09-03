// src/pages/patient/VisitDetailPage.jsx

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
    ArrowLeft,
    CalendarPlus,
    ChevronRight,
    CircleSlash2,
    Download,
    FileText,
    FlaskConical,
    HeartPulse,
    Printer,
    RotateCcw,
    Star,
    Stethoscope,
    X,
} from 'lucide-react';

import PatientLayout from '@/components/layout/CustomerLayout';
import { useVisitDetail } from '@/hooks/useMedicalHistory';
import { ROUTES } from '@/constants/routes';
import PatientAllergyBanner from '@/components/clinical/PatientAllergyBanner';
import {
    formatDate,
    formatDateTime,
    groupTestsForPatient,
    statusConfig,
    testStatusConfig,
} from '@/features/medical-history/visitDetailUtils';

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function StatusBadge({ status }) {
    const cfg = statusConfig(status);

    return (
        <span
            className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${cfg.cls}`}
        >
            {cfg.label}
        </span>
    );
}

function SummaryItem({ label, value }) {
    return (
        <div className="min-w-0 border-r border-gray-100 pr-5 last:border-r-0">
            <p className="mb-1 text-xs text-gray-400">
                {label}
            </p>

            <p className="truncate text-sm font-semibold text-gray-900">
                {value ?? '-'}
            </p>
        </div>
    );
}

/* =========================================================
   EXAMINATION LIST ITEM
========================================================= */

function ExaminationItem({
                             exam,
                             index,
                             active,
                             onClick,
                             onPrint,
                         }) {
    const cfg = statusConfig(exam?.status);

    return (
        <div
            className={`w-full rounded-xl border p-3 text-left transition ${
                active
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
        >
            <button type="button" onClick={onClick} className="flex w-full items-start gap-3 text-left">
                <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        active
                            ? 'bg-primary-500 text-white'
                            : 'bg-primary-50 text-primary-500'
                    }`}
                >
                    <Stethoscope size={17} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">
                            {index + 1}.{' '}
                            {exam?.serviceName ||
                                `Khám bệnh ${index + 1}`}
                        </p>

                        <ChevronRight
                            size={15}
                            className="mt-0.5 shrink-0 text-gray-400"
                        />
                    </div>

                    <p className="mt-1 truncate text-xs text-gray-500">
                        BS. {exam?.doctorName || '-'}
                    </p>

                    <span
                        className={`mt-1.5 inline-flex rounded border px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}
                    >
                        {cfg.label}
                    </span>
                </div>
            </button>
            {exam?.status === 'COMPLETED' && (
                <button
                    type="button"
                    onClick={onPrint}
                    className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-primary-200 bg-white px-3 text-xs font-semibold text-primary-600 transition hover:border-primary-400 hover:bg-primary-50"
                >
                    <Printer size={14}/>
                    In bệnh án
                </button>
            )}
        </div>
    );
}

/* =========================================================
   TEST LIST ITEM
========================================================= */

function TestItem({
                      test,
                      index,
                      active,
                      onClick,
                  }) {
    const cfg = testStatusConfig(test);

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-xl border p-3 text-left transition ${
                active
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        active
                            ? 'bg-primary-500 text-white'
                            : 'bg-primary-50 text-primary-500'
                    }`}
                >
                    <FlaskConical size={15} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-gray-900">
                            {index + 1}. {test?.name || '-'}
                        </p>

                        <ChevronRight
                            size={14}
                            className="shrink-0 text-gray-400"
                        />
                    </div>

                    <p className="mt-1 text-[11px] text-gray-400">
                        {test?.performedAt
                            ? formatDateTime(test.performedAt)
                            : test?.createdAt
                                ? formatDateTime(test.createdAt)
                                : '-'}
                    </p>

                    {test?.orderingServiceName && (
                        <p className="mt-1 truncate text-[10px] text-primary-600">
                            Từ phiếu: {test.orderingServiceName}
                        </p>
                    )}

                    {test?.isPanelGroup && (
                        <p className="mt-1 text-[10px] font-medium text-gray-500">
                            {test.purchasedCount || test.results?.length || 0} chỉ số đã thực hiện
                        </p>
                    )}

                    <span
                        className={`mt-1 inline-flex rounded border px-1.5 py-0.5 text-[9px] font-medium ${cfg.cls}`}
                    >
                        {cfg.label}
                    </span>
                </div>
            </div>
        </button>
    );
}

/* =========================================================
   EXAMINATION DETAIL
========================================================= */

function ExaminationDetail({ exam }) {
    if (!exam) {
        return (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white">
                <p className="text-sm text-gray-400">
                    Không có hồ sơ khám bệnh.
                </p>
            </div>
        );
    }

    const cfg = statusConfig(exam.status);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold uppercase text-gray-900">
                        {exam.serviceName || 'Khám bệnh'}
                    </h2>

                    <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}
                    >
                        {cfg.label}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                    <span>
                        Bác sĩ:{' '}
                        <strong className="font-medium text-gray-700">
                            {exam.doctorName || '-'}
                        </strong>
                    </span>

                    {(exam.startedAt ||
                        exam.completedAt) && (
                        <span>
                            Thời gian:{' '}
                            <strong className="font-medium text-gray-700">
                                {exam.startedAt
                                    ? new Date(
                                        exam.startedAt
                                    ).toLocaleTimeString(
                                        'vi-VN',
                                        {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }
                                    )
                                    : '-'}
                                {' - '}
                                {exam.completedAt
                                    ? new Date(
                                        exam.completedAt
                                    ).toLocaleTimeString(
                                        'vi-VN',
                                        {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }
                                    )
                                    : '-'}
                            </strong>
                        </span>
                    )}
                </div>
            </div>

            {/* MAIN INFORMATION */}
            <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">

                {/* Symptoms + Clinical */}
                <div className="space-y-5 p-5">
                    <div>
                        <p className="mb-2 text-xs font-semibold text-gray-400">
                            Triệu chứng
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {exam.symptoms ||
                                exam.chiefComplaint ||
                                '-'}
                        </p>
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-semibold text-gray-400">
                            Kết quả lâm sàng
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {exam.clinicalResult ||
                                exam.clinicalFindings ||
                                '-'}
                        </p>
                    </div>
                </div>

                {/* Diagnosis + Conclusion */}
                <div className="space-y-5 p-5">
                    <div>
                        <p className="mb-2 text-xs font-semibold text-gray-400">
                            Chẩn đoán
                        </p>

                        {exam?.diagnoses?.length > 0 ? (
                            <div className="space-y-2">
                                {exam.diagnoses.map(
                                    (diagnosis, index) => (
                                        <div
                                            key={`${diagnosis.code}-${index}`}
                                            className="flex items-start gap-2"
                                        >
                                            <span className="shrink-0 rounded bg-primary-50 px-2 py-1 text-[10px] font-medium text-primary-600">
                                                {diagnosis.code ||
                                                    '-'}
                                            </span>

                                            <p className="pt-0.5 text-sm text-gray-700">
                                                {diagnosis.label ||
                                                    diagnosis.codeName ||
                                                    '-'}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                {exam.diagnosis || '-'}
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-semibold text-gray-400">
                            Kết luận và điều trị
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {exam.treatmentPlan ||
                                exam.conclusion ||
                                '-'}
                        </p>

                        {(exam.followUpNote ||
                            exam.patientInstruction) && (
                            <div className="mt-3 border-l-2 border-gray-300 pl-3">
                                <p className="mb-1 text-xs font-semibold text-gray-700">
                                    ▲ Hướng dẫn theo dõi /
                                    tái khám
                                </p>

                                <p className="whitespace-pre-wrap text-xs italic leading-5 text-gray-500">
                                    {exam.followUpNote ||
                                        exam.patientInstruction}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Prescription */}
                <div className="p-5">
                    <p className="mb-3 text-xs font-semibold text-gray-400">
                        Đơn thuốc
                    </p>

                    {exam?.prescriptionItems?.length >
                    0 ? (
                        <div className="space-y-3">
                            {exam.prescriptionItems.map(
                                (item, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-3"
                                    >
                                        <span className="text-xs font-bold text-gray-500">
                                            {index + 1}.
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-800">
                                                {item.medicineName ||
                                                    '-'}
                                            </p>

                                            <p className="mt-0.5 text-xs italic text-gray-500">
                                                {item.note ||
                                                    item.instruction ||
                                                    '-'}
                                            </p>
                                        </div>

                                        <p className="shrink-0 text-xs text-gray-400">
                                            {item.quantity
                                                ? `${item.quantity} ${item.unit || ''}`
                                                : ''}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    ) : exam.prescription ? (
                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {exam.prescription}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-400">
                            Không có đơn thuốc
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   TEST DETAIL
========================================================= */

function TestDetail({
                        test,
                        onOpenPdf,
                    }) {
    if (!test) {
        return (
            <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-gray-200 bg-white">
                <p className="text-sm text-gray-400">
                    Không có kết quả cận lâm sàng.
                </p>
            </div>
        );
    }

    const cfg = testStatusConfig(test);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h2 className="text-sm font-bold uppercase text-gray-900">
                            {test.name || 'Cận lâm sàng'}
                        </h2>
                        {test.isPanelGroup && (
                            <p className="mt-1 text-xs font-medium text-gray-500">
                                Phiếu kết quả gồm {test.purchasedCount || test.results?.length || 0} chỉ số
                            </p>
                        )}
                    </div>

                    <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}
                    >
                        {cfg.label}
                    </span>
                </div>
            </div>

            <div className="p-5">

                {/* INFO */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-6">
                    <div>
                        <p className="mb-1 text-xs text-gray-400">
                            Phiếu khám chỉ định
                        </p>

                        <p className="text-sm font-medium text-gray-800">
                            {test.orderingServiceName || 'Dịch vụ đặt trực tiếp'}
                        </p>

                        {test.orderingRecordCode && (
                            <p className="mt-1 text-xs text-gray-400">{test.orderingRecordCode}</p>
                        )}
                    </div>

                    <div>
                        <p className="mb-1 text-xs text-gray-400">
                            Phòng thực hiện
                        </p>

                        <p className="text-sm font-medium text-gray-800">
                            {test.departmentName || '-'}
                        </p>
                    </div>

                    <div className="md:col-span-1">
                        <p className="mb-1 text-xs text-gray-400">
                            Kết luận
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {test.conclusion || '-'}
                        </p>
                    </div>

                    <div>
                        <p className="mb-1 text-xs text-gray-400">
                            Mã mẫu
                        </p>

                        <p className="text-sm font-medium text-gray-800">
                            {test.sampleId || '-'}
                        </p>

                        {(test.sampleType || test.sampleStatus) && (
                            <p className="mt-1 text-xs text-gray-400">
                                {[test.sampleType, test.sampleStatus]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="mb-1 text-xs text-gray-400">
                            Bác sĩ/KTV thực hiện
                        </p>

                        <p className="text-sm font-medium text-gray-800">
                            {test.performedBy || '-'}
                        </p>
                    </div>

                    <div>
                        <p className="mb-1 text-xs text-gray-400">
                            Thời gian thực hiện
                        </p>

                        <p className="text-sm font-medium text-gray-800">
                            {test.performedAt
                                ? formatDateTime(
                                    test.performedAt
                                )
                                : '-'}
                        </p>
                    </div>
                </div>

                {/* STRUCTURED RESULTS */}
                {test?.results?.length > 0 && (
                    <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 sm:grid-cols-3 xl:grid-cols-6">
                        {test.results.map(
                            (result, index) => {
                                const abnormal =
                                    result.assessment &&
                                    result.assessment.toLowerCase() !==
                                    'normal';

                                return (
                                    <div
                                        key={index}
                                        className="border-b border-r border-gray-100 px-4 py-3"
                                    >
                                        <p className="text-[10px] font-semibold uppercase text-gray-400">
                                            {result.name ||
                                                '-'}
                                        </p>

                                        <p
                                            className={`mt-1 text-sm font-semibold ${
                                                abnormal
                                                    ? 'text-red-500'
                                                    : 'text-gray-800'
                                            }`}
                                        >
                                            {result.result ||
                                                '-'}{' '}
                                            <span className="text-xs font-normal text-gray-400">
                                                {result.unit ||
                                                    ''}
                                            </span>
                                        </p>

                                        {result.referenceRange && (
                                            <p className="mt-0.5 text-[10px] text-gray-400">
                                                {
                                                    result.referenceRange
                                                }
                                            </p>
                                        )}
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}

                {test?.attachments?.length > 0 && <div className="mt-5 flex flex-wrap gap-2">
                    {test.attachments.map(attachment => <button key={attachment.attachmentId} type="button" onClick={() => onOpenPdf(attachment.url)} className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700"><FileText size={15}/>{attachment.originalName || 'Xem tệp kết quả'}</button>)}
                </div>}

                {/* PDF */}
                {test.pdfUrl && (
                    <div className="mt-5">
                        <button
                            type="button"
                            onClick={() =>
                                onOpenPdf(test.pdfUrl)
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-700"
                        >
                            <FileText size={16} />
                            Xem trước phiếu kết quả
                        </button>
                    </div>
                )}

                {!test.pdfUrl &&
                    !test?.results?.length && (
                        <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-5 text-center">
                            <p className="text-sm text-gray-400">
                                Chưa có dữ liệu kết quả.
                            </p>
                        </div>
                    )}
            </div>
        </div>
    );
}

/* =========================================================
   MAIN
========================================================= */

export default function VisitDetailPage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const patientProfileId = searchParams.get('patientProfileId') || '';
    const navigate = useNavigate();
    const { t } = useTranslation(
        'medicalHistory'
    );

    const {
        visit,
        loading,
        error,
        fetchVisit,
        rateVisit,
    } = useVisitDetail(id, patientProfileId);

    const [activeExam, setActiveExam] =
        useState(0);

    const [activeTest, setActiveTest] =
        useState(0);

    const [previewPdf, setPreviewPdf] =
        useState('');

    const [showRating, setShowRating] =
        useState(false);

    const [activeTab, setActiveTab] = useState('EXAMINATIONS');

    useEffect(() => () => {
        if (previewPdf?.startsWith('blob:')) URL.revokeObjectURL(previewPdf);
    }, [previewPdf]);

    useEffect(() => {
        fetchVisit();
    }, [id]);

    const examinations =
        visit?.examinations ?? [];

    const tests =
        visit?.tests ?? [];

    const testGroups = useMemo(
        () => groupTestsForPatient(tests),
        [tests]
    );

    const skippedServices = visit?.skippedServices ?? [];

    const selectedExam =
        examinations[activeExam] ?? null;

    const selectedTest =
        testGroups[activeTest] ?? null;

    const openRecordPrint = (exam) => {
        if (!exam?.recordId || exam.status !== 'COMPLETED') return;
        const params = new URLSearchParams();
        if (patientProfileId) params.set('patientProfileId', patientProfileId);
        const query = params.toString();
        navigate(
            `${ROUTES.CUSTOMER_MEDICAL_RECORD_PRINT.replace(':recordId', exam.recordId)}${query ? `?${query}` : ''}`,
            {
                state: {
                    record: exam,
                    visit,
                    source: 'CUSTOMER',
                },
            },
        );
    };

    const sameDayReferencedResults = (visit?.sameDayReferencedResults ?? []).map(item => ({
        ...item,
        id: item.testRequestId,
        name: item.serviceName,
        status: 'COMPLETED',
        departmentName: item.performingDepartmentName,
        performedBy: item.verifiedByName,
        performedAt: item.verifiedAt,
    }));

    useEffect(() => {
        if (examinations.length === 0) {
            setActiveExam(0);
            return;
        }
        const selectedIndex = examinations.findIndex(
            exam => String(exam.recordId) === String(id)
        );
        setActiveExam(selectedIndex >= 0 ? selectedIndex : 0);
    }, [id, examinations.length]);

    useEffect(() => {
        if (activeTest >= testGroups.length) {
            setActiveTest(0);
        }
    }, [testGroups.length]);

    useEffect(() => {
        if (examinations.length > 0) setActiveTab('EXAMINATIONS');
        else if (testGroups.length > 0) setActiveTab('TESTS');
        else setActiveTab('SKIPPED');
    }, [visit?.visitId]);

    const doctors = useMemo(() => {
        const names = new Set();

        examinations.forEach((exam) => {
            if (exam?.doctorName) {
                names.add(exam.doctorName);
            }
        });

        tests.forEach((test) => {
            if (test?.performedBy) {
                names.add(test.performedBy);
            }
        });

        return Array.from(names);
    }, [examinations, tests]);

    const journeySteps = useMemo(() => {
        const steps = [];
        const linkedTestIds = new Set();
        examinations.forEach((exam) => {
            steps.push({
                key: `exam-${exam.recordId}`,
                type: 'EXAMINATION',
                title: exam.serviceName || 'Khám bệnh',
                subtitle: exam.doctorName ? `BS. ${exam.doctorName}` : 'Khám bệnh',
            });
            const linkedTests = testGroups.filter(
                test => String(test.orderingRecordId || '') === String(exam.recordId)
            );
            linkedTests.forEach((test) => {
                linkedTestIds.add(test.id || test.testRequestId);
                steps.push({
                    key: `test-${test.id || test.testRequestId}`,
                    type: 'PARACLINICAL',
                    title: test.name || 'Cận lâm sàng',
                    subtitle: test.departmentName || 'Phòng cận lâm sàng',
                });
            });
            if (linkedTests.length > 0) {
                steps.push({
                    key: `return-${exam.recordId}`,
                    type: 'RETURN',
                    title: `Quay lại ${exam.serviceName || 'phòng khám'}`,
                    subtitle: 'Bác sĩ xem kết quả và kết luận',
                });
            }
        });
        testGroups.filter(test => !linkedTestIds.has(test.id || test.testRequestId)).forEach((test) => {
            steps.push({
                key: `standalone-${test.id || test.testRequestId}`,
                type: 'PARACLINICAL',
                title: test.name || 'Cận lâm sàng',
                subtitle: test.departmentName || 'Dịch vụ đặt trực tiếp',
            });
        });
        return steps;
    }, [examinations, testGroups]);

    // Trang chi tiet phai tuan theo trang thai tong hop tu backend, thay vi
    // tu suy doan tu PDF (PDF co the da tai len khi yeu cau chua duoc ky xong).
    const completed = visit?.status === 'COMPLETED' && examinations.length > 0;

    /* =====================================================
       PDF
    ===================================================== */

    const openPdfPreview = async (url) => {
        if (!url || typeof url !== 'string') {
            toast.error('Phiếu kết quả chưa có tệp PDF để xem trước');
            return;
        }

        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const fullUrl =
                url.startsWith('http')
                    ? url
                    : `${apiBase}${
                        url.startsWith('/')
                            ? ''
                            : '/'
                    }${url}`;

            const token =
                localStorage.getItem('token') ||
                sessionStorage.getItem('token');

            const response = await fetch(fullUrl, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!response.ok) {
                let message = 'Không thể mở phiếu kết quả PDF';
                try {
                    const errorBody = await response.json();
                    message = errorBody.message || message;
                } catch {
                    // Phản hồi lỗi không phải JSON.
                }
                throw new Error(message);
            }

            const downloadedBlob = await response.blob();
            const blob = downloadedBlob.type.toLowerCase().includes('pdf')
                ? downloadedBlob
                : new Blob([downloadedBlob], { type: 'application/pdf' });
            if (previewPdf?.startsWith('blob:')) URL.revokeObjectURL(previewPdf);
            setPreviewPdf(URL.createObjectURL(blob));
        } catch (err) {
            console.error(err);
            toast.error(err?.message || 'Không thể mở phiếu kết quả PDF');
        }
    };

    const closePdfPreview = () => {
        setPreviewPdf('');
    };

    /* =====================================================
       RATING
    ===================================================== */

    const RatingModal = () => {
        const alreadyRated = Boolean(visit?.ratingScore);

        const [score, setScore] = useState(
            visit?.ratingScore || 5
        );

        const [comment, setComment] = useState(
            visit?.ratingComment || ''
        );

        const [submitting, setSubmitting] =
            useState(false);

        const receptionistResponse =
            visit?.receptionistResponse ||
            visit?.managerResponse ||
            '';

        const responseAt =
            visit?.receptionistRespondedAt ||
            visit?.respondedAt ||
            null;

        const receptionistName =
            visit?.receptionistName ||
            visit?.respondedByName ||
            'Lễ tân';

        const handleRate = async () => {
            if (alreadyRated) {
                return;
            }

            setSubmitting(true);

            const success = await rateVisit({
                overallRating: score,
                comment: comment.trim(),
            });

            setSubmitting(false);

            if (success) {
                setShowRating(false);
            }
        };

        const ratingText = {
            1: 'Rất không hài lòng',
            2: 'Không hài lòng',
            3: 'Bình thường',
            4: 'Hài lòng',
            5: 'Tuyệt vời',
        };

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowRating(false);
                    }
                }}
            >
                <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                    {/* ================= HEADER ================= */}
                    <div className="flex items-start justify-between px-6 pt-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {alreadyRated
                                    ? 'Đánh giá của bạn'
                                    : 'Đánh giá lượt khám'}
                            </h3>

                            {!alreadyRated && (
                                <p className="mt-1 text-sm text-gray-500">
                                    Bạn cảm thấy hài lòng với lượt khám này chứ?
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowRating(false)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>

                    {/* ================= CUSTOMER RATING ================= */}
                    <div className="px-6 pb-6 pt-5">

                        {/* STAR */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        disabled={alreadyRated}
                                        onClick={() =>
                                            !alreadyRated &&
                                            setScore(star)
                                        }
                                        className={`text-3xl leading-none transition ${
                                            score >= star
                                                ? 'text-yellow-400'
                                                : 'text-gray-200'
                                        } ${
                                            alreadyRated
                                                ? 'cursor-default'
                                                : 'hover:scale-110'
                                        }`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>

                            <span
                                className={`text-sm font-semibold ${
                                    score >= 4
                                        ? 'text-green-600'
                                        : score === 3
                                            ? 'text-orange-500'
                                            : 'text-red-500'
                                }`}
                            >
                            {ratingText[score]} ({score}/5)
                        </span>
                        </div>

                        {/* COMMENT */}
                        <div className="mt-6">
                            {alreadyRated ? (
                                <>
                                    <p className="mb-2 text-xs font-medium text-gray-500">
                                        Nhận xét của bạn
                                    </p>

                                    <div className="min-h-[90px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                            {visit?.ratingComment?.trim()
                                                ? visit.ratingComment
                                                : 'Không có nhận xét.'}
                                        </p>
                                    </div>

                                    {visit?.ratedAt && (
                                        <p className="mt-2 text-xs text-gray-400">
                                            Đánh giá lúc:{' '}
                                            {new Date(
                                                visit.ratedAt
                                            ).toLocaleString(
                                                'vi-VN'
                                            )}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="relative">
                                    <textarea
                                        value={comment}
                                        onChange={(e) =>
                                            setComment(
                                                e.target.value.slice(
                                                    0,
                                                    500
                                                )
                                            )
                                        }
                                        placeholder="Nhận xét của bạn..."
                                        rows={4}
                                        maxLength={500}
                                        className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 pb-8 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400"
                                    />

                                        <span className="absolute bottom-3 right-4 text-xs text-gray-400">
                                        {comment.length}/500
                                    </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ================= RECEPTIONIST RESPONSE ================= */}
                    {receptionistResponse && (
                        <div className="border-t border-gray-100 px-6 py-5">
                            <p className="mb-3 text-sm font-semibold text-gray-900">
                                Phản hồi của lễ tân
                            </p>

                            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">

                                <div className="flex items-start gap-3">

                                    {/* Avatar */}
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                                        {receptionistName
                                                ?.trim()
                                                ?.charAt(0)
                                                ?.toUpperCase() ||
                                            'L'}
                                    </div>

                                    <div className="min-w-0 flex-1">

                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {receptionistName}
                                            </p>

                                            <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                                            Lễ tân
                                        </span>
                                        </div>

                                        {responseAt && (
                                            <p className="mt-0.5 text-xs text-gray-400">
                                                {new Date(
                                                    responseAt
                                                ).toLocaleString(
                                                    'vi-VN'
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                    {receptionistResponse}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ================= FOOTER ================= */}
                    <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">

                        <button
                            type="button"
                            onClick={() => setShowRating(false)}
                            className="h-10 rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                            {alreadyRated ? 'Đóng' : 'Hủy'}
                        </button>

                        {!alreadyRated && (
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={handleRate}
                                className="h-10 rounded-xl bg-gray-900 px-6 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting
                                    ? 'Đang gửi...'
                                    : 'Gửi đánh giá'}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        );
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <PatientLayout>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <p className="text-sm text-gray-400">
                        Đang tải chi tiết lượt
                        khám...
                    </p>
                </div>
            </PatientLayout>
        );
    }

    return (
        <PatientLayout>
            <div className="cares-visit-detail-page w-full">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="cares-customer-page-heading">

                    <div>
                        <span className="cares-customer-eyebrow"><FileText size={15} /> Hồ sơ khám bệnh</span>
                        <h1 className="text-xl font-bold text-gray-900">
                            Chi tiết lượt khám
                        </h1>

                        <button
                            onClick={() =>
                                navigate(
                                    ROUTES.CUSTOMER_VISIT_HISTORY
                                )
                            }
                            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary-500 hover:text-primary-600"
                        >
                            <ArrowLeft size={14} />

                            Quay lại danh sách
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {completed && (
                                <button
                                    onClick={() =>
                                        setShowRating(
                                            true
                                        )
                                    }
                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm text-gray-600 transition hover:border-gray-400"
                                >
                                    <Star size={16} />
                                    {visit?.ratingScore ? 'Xem đánh giá' : 'Đánh giá'}
                                </button>
                            )}

                    </div>
                </div>

                {/* =================================================
                    SUMMARY
                ================================================= */}

                <div className="cares-visit-summary mb-5 grid grid-cols-2 gap-5 rounded-xl border border-gray-200 bg-white px-6 py-5 sm:grid-cols-3 xl:grid-cols-7">

                    <SummaryItem
                        label="Mã lượt khám"
                        value={
                            visit?.visitCode ||
                            visit?.recordCode ||
                            visit?.recordId ||
                            id
                        }
                    />

                    <SummaryItem
                        label="Ngày khám"
                        value={
                            visit?.appointmentDate ||
                            formatDate(
                                visit?.checkInTime
                            )
                        }
                    />

                    <div className="border-r border-gray-100 pr-5">
                        <p className="mb-1 text-xs text-gray-400">
                            Trạng thái
                        </p>

                        <StatusBadge
                            status={
                                visit?.completionStatus === 'PARTIAL'
                                    ? 'PARTIAL'
                                    : 'COMPLETED'
                            }
                        />
                    </div>

                    <SummaryItem
                        label="Số hồ sơ khám"
                        value={
                            examinations.length
                        }
                    />

                    <SummaryItem
                        label="Số phiếu kết quả CLS"
                        value={testGroups.length}
                    />

                    <SummaryItem
                        label="Bác sĩ tham gia"
                        value={doctors.length}
                    />

                    <SummaryItem
                        label="Dịch vụ bỏ lượt"
                        value={skippedServices.length}
                    />
                </div>

                <PatientAllergyBanner value={visit?.patientAllergies} currentLabel className="mb-5"/>

                {visit?.completionStatus === 'PARTIAL' && (
                    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                        <div className="flex items-start gap-3">
                            <CircleSlash2 size={22} className="mt-0.5 shrink-0"/>
                            <div><h2 className="text-lg font-bold">Lượt khám kết thúc một phần</h2><p className="mt-1 text-base">Các nội dung chuyên môn đã hoàn thành vẫn được lưu riêng. {skippedServices.length} dịch vụ chưa thực hiện được liệt kê trong tab Dịch vụ bỏ lượt.</p></div>
                        </div>
                    </div>
                )}

                <div className="mb-5 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2">
                    <div className="flex min-w-max gap-2" role="tablist" aria-label="Nội dung lượt khám">
                        {[
                            { key: 'EXAMINATIONS', label: 'Bệnh án đã hoàn thành', count: examinations.length, icon: HeartPulse },
                            { key: 'TESTS', label: 'Kết quả cận lâm sàng', count: testGroups.length, icon: FlaskConical },
                            { key: 'SKIPPED', label: 'Dịch vụ bỏ lượt', count: skippedServices.length, icon: CircleSlash2 },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-base font-semibold transition ${activeTab === tab.key ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}><Icon size={19}/>{tab.label}<span className={`rounded-full px-2 py-0.5 text-sm ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{tab.count}</span></button>;
                        })}
                    </div>
                </div>

                {journeySteps.length > 0 && (
                    <section className="cares-visit-journey mb-5 rounded-xl border border-gray-200 bg-white p-4">
                        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                            Hành trình của lượt khám
                        </h2>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {journeySteps.map((step, index) => {
                                const Icon = step.type === 'EXAMINATION'
                                    ? Stethoscope
                                    : step.type === 'RETURN'
                                        ? RotateCcw
                                        : FlaskConical;
                                return (
                                    <div key={step.key} className="flex shrink-0 items-center gap-3">
                                        {index > 0 && <ChevronRight size={16} className="text-gray-300"/>}
                                        <div className="min-w-[190px] rounded-xl border border-gray-100 bg-gray-50 p-3">
                                            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                                                <Icon size={16}/>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                                            <p className="mt-1 text-xs text-gray-400">{step.subtitle}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* =================================================
                    EXAMINATION SECTION
                ================================================= */}

                {activeTab === 'EXAMINATIONS' && (
                <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">

                    {/* EXAM LIST */}
                    <aside className="rounded-xl border border-gray-200 bg-white p-4">

                        <div className="mb-3 flex items-center gap-2">
                            <HeartPulse
                                size={16}
                                className="text-primary-500"
                            />

                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Bệnh án khác trong cùng lượt (
                                {
                                    Math.max(0, examinations.length - 1)
                                }
                                )
                            </h2>
                        </div>

                        {examinations.length > 0 ? (
                            <>
                                <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                                    {examinations.map(
                                        (
                                            exam,
                                            index
                                        ) => (
                                            <ExaminationItem
                                                key={
                                                    exam.recordId ||
                                                    index
                                                }
                                                exam={
                                                    exam
                                                }
                                                index={
                                                    index
                                                }
                                                active={activeExam === index}
                                                onClick={() => setActiveExam(index)}
                                                onPrint={() => openRecordPrint(exam)}
                                            />
                                        )
                                    )}
                                </div>

                                {examinations.length > 4 && (
                                        <p className="mt-3 text-center text-[11px] text-gray-400">
                                            ↓ Cuộn để xem
                                            thêm
                                        </p>
                                    )}
                            </>
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-400">
                                Lượt khám này không có bệnh án đã hoàn thành.
                            </div>
                        )}
                    </aside>

                    {/* EXAM DETAIL */}
                    <ExaminationDetail
                        exam={selectedExam}
                    />
                </div>
                )}

                {/* =================================================
                    TEST SECTION
                ================================================= */}

                {activeTab === 'TESTS' && (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">

                    {/* TEST LIST */}
                    <aside className="rounded-xl border border-gray-200 bg-white p-4">

                        <div className="mb-3 flex items-center gap-2">
                            <FlaskConical
                                size={16}
                                className="text-primary-500"
                            />

                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Phiếu kết quả cận lâm sàng (
                                {testGroups.length})
                            </h2>
                        </div>

                        {testGroups.length > 0 ? (
                            <>
                                <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                    {testGroups.map(
                                        (
                                            test,
                                            index
                                        ) => (
                                            <TestItem
                                                key={
                                                    test.id ||
                                                    test.testRequestId ||
                                                    index
                                                }
                                                test={
                                                    test
                                                }
                                                index={
                                                    index
                                                }
                                                active={
                                                    activeTest ===
                                                    index
                                                }
                                                onClick={() =>
                                                    setActiveTest(
                                                        index
                                                    )
                                                }
                                            />
                                        )
                                    )}
                                </div>

                                {testGroups.length >
                                    4 && (
                                        <p className="mt-3 text-center text-[11px] text-gray-400">
                                            ↓ Cuộn để xem
                                            thêm
                                        </p>
                                    )}
                            </>
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-400">
                                Không có kết quả cận
                                lâm sàng.
                            </div>
                        )}
                    </aside>

                    {/* TEST DETAIL */}
                    <TestDetail
                        test={selectedTest}
                        onOpenPdf={
                            openPdfPreview
                        }
                    />
                </div>
                )}

                {activeTab === 'TESTS' && sameDayReferencedResults.length > 0 && (
                    <section className="mt-5 space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-5">
                        <div>
                            <h2 className="text-sm font-bold text-blue-900">
                                Kết quả cận lâm sàng tham chiếu cùng ngày
                            </h2>
                            <p className="mt-1 text-xs text-blue-700">
                                Các kết quả này thuộc lượt khám khác và không được thực hiện hoặc thanh toán lại trong lượt hiện tại.
                            </p>
                        </div>
                        {sameDayReferencedResults.map(item => (
                            <div key={item.testRequestId}>
                                <div className="mb-2 text-xs font-medium text-blue-800">
                                    Nguồn: {item.sourceVisitCode} · {item.sourceExaminationServiceName || 'Lượt khám trước'}
                                </div>
                                <TestDetail test={item} onOpenPdf={openPdfPreview} />
                            </div>
                        ))}
                    </section>
                )}

                {activeTab === 'SKIPPED' && (
                    <section className="rounded-2xl border border-gray-200 bg-white p-5">
                        {skippedServices.length > 0 ? (
                            <div className="space-y-3">
                                {skippedServices.map((service, index) => (
                                    <article key={`${service.serviceId || service.serviceName}-${index}`} className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-amber-700"><CircleSlash2 size={20}/></div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{service.serviceName || 'Dịch vụ chưa thực hiện'}</h3>
                                                <p className="mt-1 text-base text-gray-600">{service.departmentName || 'Chưa xác định khoa/phòng'}{service.roomCode ? ` · ${service.roomCode}` : ''}</p>
                                                <p className="mt-1 text-sm font-medium text-amber-800">{service.reason || 'Đã bỏ lượt do kết thúc ngày làm việc'}</p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-sm text-gray-500">{service.workDate ? formatDate(service.workDate) : ''}</span>
                                    </article>
                                ))}
                                <div className="flex justify-end pt-2">
                                    <button type="button" onClick={() => navigate('/customer/appointment')} className="cares-customer-primary-button"><CalendarPlus size={18}/> Đặt lịch khám mới</button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-500"><CircleSlash2 size={30} className="mx-auto mb-3 text-gray-300"/><p>Không có dịch vụ bỏ lượt trong lượt khám này.</p></div>
                        )}
                    </section>
                )}

                {/* =================================================
                    RATING
                ================================================= */}

                {visit?.ratingScore && (
                    <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm font-semibold text-gray-900">
                                Đánh giá lượt khám
                            </p>

                            <span className="text-yellow-400">
                                ★
                            </span>

                            <span className="text-sm font-bold text-gray-700">
                                {visit.ratingScore}/5
                            </span>
                        </div>

                        {visit.ratingComment && (
                            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
                                {
                                    visit.ratingComment
                                }
                            </p>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
                        {error}
                    </div>
                )}
            </div>

            {/* =================================================
                RATING MODAL
            ================================================= */}

            {showRating && <RatingModal />}

            {previewPdf && (
                <div className="cares-pdf-preview-layer" role="dialog" aria-modal="true" aria-label="Xem trước phiếu kết quả">
                    <button type="button" className="cares-pdf-preview-backdrop" onClick={closePdfPreview} aria-label="Đóng xem trước" />
                    <section className="cares-pdf-preview-modal">
                        <header>
                            <div>
                                <span className="cares-customer-eyebrow"><FileText size={15} /> Phiếu kết quả</span>
                                <h2>Xem trước tài liệu</h2>
                            </div>
                            <div>
                                <a href={previewPdf} download="phieu-ket-qua.pdf" className="cares-customer-secondary-button">
                                    <Download size={16} /> Tải PDF
                                </a>
                                <button type="button" className="cares-customer-secondary-button" onClick={() => document.getElementById('customer-result-pdf-frame')?.contentWindow?.print()}>
                                    <Printer size={16} /> In
                                </button>
                                <button type="button" className="cares-pdf-preview-close" onClick={closePdfPreview} aria-label="Đóng">
                                    <X size={20} />
                                </button>
                            </div>
                        </header>
                        <iframe id="customer-result-pdf-frame" src={previewPdf} title="Phiếu kết quả PDF" />
                    </section>
                </div>
            )}



            <style>
                {`
                    @media print {
                        aside {
                            display: none !important;
                        }

                        header {
                            display: none !important;
                        }

                        button {
                            display: none !important;
                        }
                    }
                `}
            </style>
        </PatientLayout>
    );
}

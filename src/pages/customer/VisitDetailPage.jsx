// src/pages/patient/VisitDetailPage.jsx

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
    ArrowLeft,
    ChevronRight,
    FileText,
    FlaskConical,
    HeartPulse,
    Printer,
    Star,
    Stethoscope,
    X,
} from 'lucide-react';

import PatientLayout from '@/components/layout/CustomerLayout';
import { useVisitDetail } from '@/hooks/useMedicalHistory';
import { ROUTES } from '@/constants/routes';

/* =========================================================
   HELPERS
========================================================= */

const formatDateTime = (value) => {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatDate = (value) => {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('vi-VN');
};

const statusConfig = (status) => {
    switch (status) {
        case 'COMPLETED':
            return {
                label: 'Đã hoàn thành',
                cls: 'border-green-200 bg-green-50 text-green-600',
            };

        case 'IN_PROGRESS':
            return {
                label: 'Đang thực hiện',
                cls: 'border-blue-200 bg-blue-50 text-blue-600',
            };

        case 'WAITING_FOR_TEST':
            return {
                label: 'Chờ kết quả CLS',
                cls: 'border-purple-200 bg-purple-50 text-purple-600',
            };

        case 'TEST_DONE':
            return {
                label: 'Đã có kết quả',
                cls: 'border-emerald-200 bg-emerald-50 text-emerald-600',
            };

        case 'CANCELLED':
            return {
                label: 'Đã hủy',
                cls: 'border-red-200 bg-red-50 text-red-500',
            };

        default:
            return {
                label: status || 'Đang xử lý',
                cls: 'border-gray-200 bg-gray-50 text-gray-500',
            };
    }
};

const testStatusConfig = (test) => {
    if (test?.status === 'COMPLETED' || test?.pdfUrl || test?.hasResult) {
        return {
            label: 'Đã có kết quả',
            cls: 'border-green-200 bg-green-50 text-green-600',
        };
    }

    if (test?.status === 'IN_PROGRESS') {
        return {
            label: 'Đang xử lý',
            cls: 'border-blue-200 bg-blue-50 text-blue-600',
        };
    }

    if (test?.status === 'BLOCKED') {
        return {
            label: 'Bước tiếp theo',
            cls: 'border-gray-200 bg-gray-50 text-gray-500',
        };
    }

    return {
        label: 'Đang chờ',
        cls: 'border-orange-200 bg-orange-50 text-orange-600',
    };
};

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
                         }) {
    const cfg = statusConfig(exam?.status);

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
            </div>
        </button>
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
                    <h2 className="text-sm font-bold uppercase text-gray-900">
                        {test.name || 'Cận lâm sàng'}
                    </h2>

                    <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}
                    >
                        {cfg.label}
                    </span>
                </div>
            </div>

            <div className="p-5">

                {/* INFO */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
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
                            Xem trước phiếu kết quả PDF
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
    } = useVisitDetail(id);

    const [activeExam, setActiveExam] =
        useState(0);

    const [activeTest, setActiveTest] =
        useState(0);

    const [previewPdf, setPreviewPdf] =
        useState('');

    const [showRating, setShowRating] =
        useState(false);

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

    const selectedExam =
        examinations[activeExam] ?? null;

    const selectedTest =
        tests[activeTest] ?? null;

    useEffect(() => {
        if (activeExam >= examinations.length) {
            setActiveExam(0);
        }
    }, [examinations.length]);

    useEffect(() => {
        if (activeTest >= tests.length) {
            setActiveTest(0);
        }
    }, [tests.length]);

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

    // Trang chi tiet phai tuan theo trang thai tong hop tu backend, thay vi
    // tu suy doan tu PDF (PDF co the da tai len khi yeu cau chua duoc ky xong).
    const completed = visit?.status === 'COMPLETED';

    /* =====================================================
       PDF
    ===================================================== */

    const openPdfPreview = async (url) => {
        try {
            const fullUrl =
                url.startsWith('http')
                    ? url
                    : `${import.meta.env.VITE_API_URL}${
                        url.startsWith('/')
                            ? ''
                            : '/'
                    }${url}`;

            const token =
                localStorage.getItem('token') ||
                sessionStorage.getItem('token');

            const response = await fetch(
                fullUrl,
                {
                    headers: token
                        ? {
                            Authorization: `Bearer ${token}`,
                        }
                        : {},
                }
            );

            if (!response.ok) {
                throw new Error(
                    'Không thể mở phiếu kết quả PDF'
                );
            }

            const blob =
                await response.blob();

            setPreviewPdf(
                URL.createObjectURL(blob)
            );
        } catch (err) {
            console.error(err);
            toast.error(err?.message || 'Không thể mở phiếu kết quả PDF');
        }
    };

    const closePdfPreview = () => {
        if (
            previewPdf.startsWith('blob:')
        ) {
            URL.revokeObjectURL(
                previewPdf
            );
        }

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
            <div className="w-full px-5 py-5 lg:px-6">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">

                    <div>
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

                        <button
                            disabled={!selectedExam}
                            onClick={() => selectedExam && navigate(
                                ROUTES.DOCTOR_MEDICAL_RECORD_PRINT.replace(':recordId', selectedExam.recordId),
                                { state: { record: selectedExam, patient: {
                                    fullName: visit?.patientName, dateOfBirth: visit?.patientDateOfBirth,
                                    gender: visit?.patientGender, phone: visit?.patientPhone, address: visit?.patientAddress,
                                }, serviceName: selectedExam.serviceName, completedAt: selectedExam.completedAt,
                                    departmentName: selectedExam.departmentName } }
                            )}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-700"
                        >
                            <Printer size={16} />

                            In phiếu
                        </button>
                    </div>
                </div>

                {/* =================================================
                    SUMMARY
                ================================================= */}

                <div className="mb-5 grid grid-cols-2 gap-5 rounded-xl border border-gray-200 bg-white px-6 py-5 sm:grid-cols-3 xl:grid-cols-6">

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
                                completed
                                    ? 'COMPLETED'
                                    : visit?.status
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
                        label="Số kết quả cận lâm sàng"
                        value={tests.length}
                    />

                    <SummaryItem
                        label="Bác sĩ tham gia"
                        value={doctors.length}
                    />
                </div>

                {/* =================================================
                    EXAMINATION SECTION
                ================================================= */}

                <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">

                    {/* EXAM LIST */}
                    <aside className="rounded-xl border border-gray-200 bg-white p-4">

                        <div className="mb-3 flex items-center gap-2">
                            <HeartPulse
                                size={16}
                                className="text-primary-500"
                            />

                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Danh sách hồ sơ khám (
                                {
                                    examinations.length
                                }
                                )
                            </h2>
                        </div>

                        {examinations.length >
                        0 ? (
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
                                                active={
                                                    activeExam ===
                                                    index
                                                }
                                                onClick={() =>
                                                    setActiveExam(
                                                        index
                                                    )
                                                }
                                            />
                                        )
                                    )}
                                </div>

                                {examinations.length >
                                    3 && (
                                        <p className="mt-3 text-center text-[11px] text-gray-400">
                                            ↓ Cuộn để xem
                                            thêm
                                        </p>
                                    )}
                            </>
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-400">
                                Không có hồ sơ khám
                                bệnh.
                            </div>
                        )}
                    </aside>

                    {/* EXAM DETAIL */}
                    <ExaminationDetail
                        exam={selectedExam}
                    />
                </div>

                {/* =================================================
                    TEST SECTION
                ================================================= */}

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">

                    {/* TEST LIST */}
                    <aside className="rounded-xl border border-gray-200 bg-white p-4">

                        <div className="mb-3 flex items-center gap-2">
                            <FlaskConical
                                size={16}
                                className="text-primary-500"
                            />

                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Kết quả cận lâm sàng (
                                {tests.length})
                            </h2>
                        </div>

                        {tests.length > 0 ? (
                            <>
                                <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                    {tests.map(
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

                                {tests.length >
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

            {/* =================================================
                PDF PREVIEW
            ================================================= */}

            {previewPdf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 md:p-8">
                    <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b px-5 py-3">
                            <p className="font-semibold text-gray-900">
                                Xem trước phiếu kết
                                quả PDF
                            </p>

                            <button
                                onClick={
                                    closePdfPreview
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-white"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <iframe
                            title="Phiếu kết quả PDF"
                            src={previewPdf}
                            className="w-full flex-1 bg-gray-100"
                        />
                    </div>
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

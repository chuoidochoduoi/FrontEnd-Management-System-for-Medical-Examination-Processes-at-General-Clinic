// src/pages/patient/VisitDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PatientLayout from '@/components/layout/CustomerLayout';
import { useVisitDetail } from '@/hooks/useMedicalHistory';
import { ROUTES } from '@/constants/routes';

export default function VisitDetailPage() {
    const { id }   = useParams();
    const navigate = useNavigate();
    const { t }    = useTranslation('medicalHistory');
    const { visit, loading, error, fetchVisit, rateVisit } = useVisitDetail(id);
    const [activeTest, setActiveTest] = useState(0);
    const [activeExam, setActiveExam] = useState(0);
    const [previewPdf, setPreviewPdf] = useState('');
    const [showRating, setShowRating] = useState(false);

    useEffect(() => { fetchVisit(); }, [id]);

    if (loading) return (
        <PatientLayout>
            <p className="text-sm text-gray-400 text-center py-20">{t('visitDetail.errors.loadFailed')}</p>
        </PatientLayout>
    );

    const tests        = visit?.tests ?? [];
    const selectedTest = tests[activeTest];
    const examinations = visit?.examinations ?? [];
    const selectedExam = examinations[activeExam] ?? null;

    /* ── reusable styles ── */
    const sectionLabelCls = 'text-xs font-semibold text-gray-400 tracking-widest mb-3';
    const boxCls          = 'border border-gray-200 rounded-xl p-4 bg-white';

    /* ── Rating Modal ── */
    const RatingModal = () => {
        const [score, setScore] = useState(5);
        const [comment, setComment] = useState('');
        const [submitting, setSubmitting] = useState(false);
        const handleRate = async () => {
            setSubmitting(true);
            const success = await rateVisit({ overallRating: score, comment });
            setSubmitting(false);
            if (success) setShowRating(false);
        };
        return (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Đánh giá dịch vụ</h3>
                    <p className="text-sm text-gray-500 mb-6">Bạn cảm thấy hài lòng với lượt khám này chứ?</p>
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setScore(star)}
                                    className={`text-3xl transition-colors ${score >= star ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}>
                                ★
                            </button>
                        ))}
                    </div>
                    <div className="text-left mb-4">
                        <textarea value={comment} onChange={e => setComment(e.target.value.slice(0,500))} placeholder="Nhận xét của bạn (không bắt buộc)" className="w-full border rounded-xl p-3 text-sm mb-3" rows={3} />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowRating(false)}
                                className="flex-1 h-10 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                            Hủy
                        </button>
                        <button onClick={handleRate} disabled={submitting}
                                className="flex-1 h-10 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-60">
                            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <PatientLayout>
            <div className="w-full max-w-7xl mx-auto space-y-6 px-1 pb-10">

                {/* Page header */}
                <h1 className="text-sm font-bold text-gray-900 tracking-widest mb-4">
                    {t('visitDetail.pageTitle')}
                </h1>

                {/* Back + actions */}
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-5">
                    <div>
                        <button onClick={() => navigate(ROUTES.CUSTOMER_VISIT_HISTORY)}
                                className="text-xs text-gray-400 hover:text-primary-500 transition-colors flex items-center gap-1">
                            ← {t('visitDetail.backBtn')}
                        </button>
                        <div className="flex items-center gap-x-3 gap-y-2 mt-3 flex-wrap">
                            <p className="text-xs text-gray-400">
                                {t('visitDetail.recordId')} <span className="font-semibold text-primary-500">{visit?.recordId}</span>
                            </p>
                            {visit?.appointmentDate && (
                                <>
                                    <span className="text-gray-200">•</span>
                                    <p className="text-xs text-gray-400">
                                        {t('visitDetail.appointmentDate')} {visit.appointmentDate}
                                    </p>
                                </>
                            )}
                            {visit?.doctorName && (
                                <>
                                    <span className="text-gray-200">•</span>
                                    <p className="text-xs text-gray-400">
                                        Bác sĩ khám: <span className="font-medium text-gray-700">{visit.doctorName}</span>
                                    </p>
                                </>
                            )}
                            {visit?.labDoctors?.length > 0 && (
                                <>
                                    <span className="text-gray-200">•</span>
                                    <p className="text-xs text-gray-400">
                                        BS xét nghiệm: <span className="font-medium text-gray-700">{visit.labDoctors.join(', ')}</span>
                                    </p>
                                </>
                            )}
                            {visit?.status && (
                                <>
                                    <span className="text-gray-200">•</span>
                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                        visit.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border border-green-200'
                                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                                    }`}>
                                        {visit.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang xử lý'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {visit?.status === 'COMPLETED' && !visit?.ratingScore && (
                            <button onClick={() => setShowRating(true)} className="px-4 h-9 border border-gray-300 text-sm text-gray-600 rounded-xl hover:border-gray-500 transition-colors">
                                Đánh giá
                            </button>
                        )}
                        {visit?.ratingScore && (
                            <div className="px-4 h-9 flex items-center gap-1 border border-yellow-200 bg-yellow-50 rounded-xl">
                                <span className="text-sm font-semibold text-yellow-600">{visit.ratingScore}</span>
                                <span className="text-yellow-400 text-sm">★</span>
                            </div>
                        )}
                        <button onClick={() => window.print()}
                                className="px-4 h-9 bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium rounded-xl transition-colors">
                            {t('visitDetail.printBtn')}
                        </button>
                    </div>
                </div>

                {/* ── Triage ── */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
                    <div><p className="text-xs text-gray-400 mb-1">Mã hồ sơ</p><p className="text-sm font-semibold text-gray-800 break-all">{visit?.recordCode || visit?.recordId || '-'}</p></div>
                    <div><p className="text-xs text-gray-400 mb-1">Ngày khám</p><p className="text-sm font-semibold text-gray-800">{visit?.appointmentDate || '-'}</p></div>
                    <div><p className="text-xs text-gray-400 mb-1">Bác sĩ khám</p><p className="text-sm font-semibold text-gray-800">{visit?.doctorName || '-'}</p></div>
                    <div><p className="text-xs text-gray-400 mb-1">Bác sĩ cận lâm sàng</p><p className="text-sm font-semibold text-gray-800">{visit?.labDoctors?.length ? visit.labDoctors.join(', ') : '-'}</p></div>
                    <div><p className="text-xs text-gray-400 mb-1">Đánh giá</p><p className="text-sm font-semibold text-gray-800">{visit?.ratingScore ? `${visit.ratingScore}/5` : '-'}</p></div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className={sectionLabelCls}>CÁC DỊCH VỤ KHÁM BỆNH ({examinations.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {examinations.map((exam, index) => <button key={exam?.recordId || index} onClick={() => setActiveExam(index)} className={`text-left rounded-xl border p-4 transition-colors ${activeExam === index ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <p className="text-sm font-semibold text-gray-900">{exam?.serviceName || `Khám bệnh ${index + 1}`}</p>
                            <p className="text-xs text-gray-500 mt-1">Bác sĩ: {exam?.doctorName || '-'}</p>
                            <p className="text-xs text-gray-500 mt-1">Trạng thái: {exam?.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang xử lý'}</p>
                        </button>)}
                        {examinations.length === 0 && <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">-</div>}
                    </div>
                </div>

                {visit?.ratingScore && (
                    <div className="border border-gray-200 rounded-xl p-5 bg-white mb-4">
                        <p className={sectionLabelCls}>{t('visitDetail.feedback.title')}</p>

                        <div className="space-y-4">
                            {/* Rating summary: score, date, status */}
                            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-yellow-400 text-lg">★★★★★</span>
                                    <span className="font-semibold text-gray-800">{visit.ratingScore}/5</span>
                                </div>
                                <div className="flex flex-wrap gap-4 items-center text-xs">
                                    {visit.ratedAt && (
                                        <span className="text-gray-400">
                                            {t('visitDetail.feedback.ratingDate')}:{' '}
                                            {new Date(visit.ratedAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    )}
                                    {visit.feedbackStatus && (
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                            visit.feedbackStatus === 'RESPONDED' ? 'bg-green-50 text-green-600 border border-green-200'
                                            : visit.feedbackStatus === 'CLOSED' ? 'bg-gray-100 text-gray-500 border border-gray-200'
                                            : visit.feedbackStatus === 'WAITING_INTERNAL' ? 'bg-orange-50 text-orange-600 border border-orange-200'
                                            : visit.feedbackStatus === 'IN_REVIEW' || visit.feedbackStatus === 'PROCESSING' ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                                        }`}>
                                            {visit.feedbackStatus === 'RESPONDED' ? t('visitDetail.feedback.statusResponded')
                                             : visit.feedbackStatus === 'CLOSED' ? t('visitDetail.feedback.statusClosed')
                                             : visit.feedbackStatus === 'WAITING_INTERNAL' ? t('visitDetail.feedback.statusWaitingInternal')
                                             : visit.feedbackStatus === 'IN_REVIEW' || visit.feedbackStatus === 'PROCESSING' ? t('visitDetail.feedback.statusInReview')
                                             : t('visitDetail.feedback.statusNew')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Contact requested indicator */}
                            {visit.contactRequested && (
                                <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                                    {t('visitDetail.feedback.contactRequested')}
                                </div>
                            )}

                            {/* Customer comment */}
                            <div>
                                <p className="text-xs text-gray-400 mb-1">{t('visitDetail.feedback.commentLabel')}</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.ratingComment || t('visitDetail.feedback.noComment')}</p>
                            </div>

                            {/* Manager response */}
                            <div>
                                <p className="text-xs text-gray-400 mb-1">{t('visitDetail.feedback.responseLabel')}</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.managerResponse || t('visitDetail.feedback.noResponse')}</p>
                                {visit.respondedAt && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        {t('visitDetail.feedback.responseDate')}:{' '}
                                        {new Date(visit.respondedAt).toLocaleString('vi-VN')}
                                    </p>
                                )}
                            </div>

                            {/* Doctor explanation */}
                            {visit.doctorExplanation && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">{t('visitDetail.feedback.doctorExplanation')}</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.doctorExplanation}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="border border-gray-200 rounded-xl p-5 bg-white mb-4">
                    <p className={sectionLabelCls}>{t('visitDetail.triage.title')}</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 mb-2">{t('visitDetail.triage.symptoms')}</p>
                            <div className={boxCls}>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedExam?.symptoms || '-'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 mb-2">{t('visitDetail.triage.clinicalResult')}</p>
                            <div className={boxCls}>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedExam?.clinicalResult || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Diagnosis + Treatment ── */}
                <div className="border border-gray-200 rounded-xl p-5 bg-white mb-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 mb-3">{t('visitDetail.diagnosis.title')}</p>
                            {selectedExam?.diagnoses?.map((d, i) => (
                                <div key={i} className="bg-gray-900 text-white rounded-lg px-4 py-3 mb-2">
                                    <p className="text-xs text-gray-400">{d.code}</p>
                                    <p className="text-sm font-semibold mt-0.5">{d.label}</p>
                                </div>
                            ))}
                            {!selectedExam?.diagnoses?.length && <div className={boxCls}><p className="text-sm text-gray-500">-</p></div>}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 mb-3">{t('visitDetail.diagnosis.treatmentTitle')}</p>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">{selectedExam?.treatmentPlan || '-'}</p>
                            {(
                                <div className="border-l-2 border-gray-300 pl-3">
                                    <p className="text-xs font-bold text-gray-700 mb-1">▲ {t('visitDetail.diagnosis.followUp')}</p>
                                    <p className="text-xs text-gray-600 italic leading-relaxed">{selectedExam?.followUpNote || '-'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                
                {/* ── Prescription ── */}
                {(
                    <div className="border border-gray-200 rounded-xl p-5 bg-white mb-4">
                        <p className={sectionLabelCls}>🗒 {t('visitDetail.prescription.title')}</p>
                        <p className="text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-line">
                            {selectedExam?.prescription || '-'}
                        </p>
                    </div>
                )}

                {/* ── Tests ── */}
                {tests.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 border border-gray-200 rounded-xl p-5 bg-gray-50/40">
                        {/* Sidebar list */}
                        <div className="lg:col-span-4 xl:col-span-3">
                            <p className="text-xs font-semibold text-gray-400 tracking-widest mb-2 uppercase">
                                {t('visitDetail.tests.title')} ({tests.length})
                            </p>
                            <div className="space-y-1">
                                {tests.map((test, i) => (
                                    <button key={test.id || i} onClick={() => setActiveTest(i)}
                                            className={`w-full text-left px-3 py-3 rounded-xl border transition-colors ${
                                                i === activeTest
                                                    ? 'border-primary-300 bg-primary-50'
                                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                            }`}>
                                        <p className="text-xs text-gray-400 break-all">Mã yêu cầu: {test.id || '-'}</p>
                                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{i+1}. {test.name || '-'}</p>
                                        {test.hasAbnormal
                                            ? <p className="text-xs text-orange-500 mt-0.5">▲ {t('visitDetail.tests.abnormal')}</p>
                                            : <p className="text-xs text-gray-400 mt-0.5">{t('visitDetail.tests.normal')}</p>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Test table */}
                        {selectedTest && (
                            <div className="lg:col-span-8 xl:col-span-9 bg-white border border-gray-200 rounded-xl overflow-hidden min-h-64">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900">{selectedTest.name || '-'}</h3>
                                </div>
                                {selectedTest.pdfUrl && <div className="p-5 space-y-4">
                                    <div><p className="text-xs text-gray-400 mb-1">Kết luận của bác sĩ</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTest.conclusion || '-'}</p></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                        <div><p className="text-xs text-gray-400">Mã mẫu</p><p>{selectedTest.sampleId || '-'}</p></div>
                                        <div><p className="text-xs text-gray-400">Bác sĩ thực hiện</p><p>{selectedTest.performedBy || '-'}</p></div>
                                        <div><p className="text-xs text-gray-400">Thời gian</p><p>{selectedTest.performedAt ? new Date(selectedTest.performedAt).toLocaleString('vi-VN') : '-'}</p></div>
                                    </div>
                                    <button onClick={() => {
                                        const url = selectedTest.pdfUrl;
                                        const fullUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
                                        setPreviewPdf(fullUrl);
                                    }} className="inline-flex h-10 items-center px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700">Xem trước phiếu kết quả PDF</button>
                                </div>}
                                {!selectedTest.pdfUrl && <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        {[
                                            t('visitDetail.tests.tableName'),
                                            t('visitDetail.tests.tableResult'),
                                            t('visitDetail.tests.tableRange'),
                                            t('visitDetail.tests.tableUnit'),
                                            t('visitDetail.tests.tableAssessment'),
                                        ].map(col => (
                                            <th key={col} className="text-xs font-medium text-gray-400 text-left px-4 py-2.5">{col}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                    {(selectedTest.results ?? []).map((r, i) => {
                                        const isHigh = r.assessment?.toLowerCase() === 'high';
                                        const isLow  = r.assessment?.toLowerCase() === 'low';
                                        return (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-800">{r.name || '-'}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 tabular-nums">{r.result || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-400 tabular-nums">{r.referenceRange || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{r.unit || '-'}</td>
                                                <td className="px-4 py-3">
                                                    {(isHigh || isLow) ? (
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                                                            isHigh
                                                                ? 'text-red-600 border-red-300 bg-red-50'
                                                                : 'text-blue-600 border-blue-300 bg-blue-50'
                                                        }`}>
                                    {isHigh ? t('visitDetail.tests.high') : t('visitDetail.tests.low')}
                                  </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">{r.assessment || '-'}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>}
                            </div>
                        )}
                    </div>
                )}
                {tests.length === 0 && <div className="border border-gray-200 rounded-xl bg-white min-h-36 p-5 flex flex-col justify-center items-center">
                    <p className={sectionLabelCls}>{t('visitDetail.tests.title')} (0)</p>
                    <p className="text-sm text-gray-400">-</p>
                </div>}

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>

            {showRating && <RatingModal />}
            {previewPdf && <div className="fixed inset-0 z-50 bg-black/60 p-4 md:p-8 flex items-center justify-center">
                <div className="bg-white rounded-2xl w-full max-w-6xl h-full flex flex-col overflow-hidden shadow-2xl">
                    <div className="px-5 py-3 border-b flex items-center justify-between gap-3">
                        <p className="font-semibold text-gray-900">Xem trước phiếu kết quả PDF</p>
                        <div className="flex gap-2"><a href={previewPdf} download className="px-4 h-9 inline-flex items-center rounded-lg border border-gray-300 text-sm">Tải PDF</a><button onClick={() => setPreviewPdf('')} className="px-4 h-9 rounded-lg bg-gray-900 text-white text-sm">Đóng</button></div>
                    </div>
                    <iframe title="Phiếu kết quả PDF" src={previewPdf} className="w-full flex-1 bg-gray-100" />
                </div>
            </div>}

            <style>{`@media print { aside { display: none; } header { display: none; } }`}</style>
        </PatientLayout>
    );
}

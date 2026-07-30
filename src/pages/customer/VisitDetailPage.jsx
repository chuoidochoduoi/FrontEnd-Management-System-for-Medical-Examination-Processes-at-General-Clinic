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
    const [showRating, setShowRating] = useState(false);

    useEffect(() => { fetchVisit(); }, [id]);

    if (loading) return (
        <PatientLayout>
            <p className="text-sm text-gray-400 text-center py-20">{t('visitDetail.errors.loadFailed')}</p>
        </PatientLayout>
    );

    const tests        = visit?.tests ?? [];
    const selectedTest = tests[activeTest];

    /* ── reusable styles ── */
    const sectionLabelCls = 'text-xs font-semibold text-gray-400 tracking-widest mb-3';
    const boxCls          = 'border border-gray-200 rounded-xl p-4 bg-white';

    /* ── Rating Modal ── */
    const RatingModal = () => {
        const [score, setScore] = useState(5);
        const [submitting, setSubmitting] = useState(false);
        const handleRate = async () => {
            setSubmitting(true);
            const success = await rateVisit(score);
            setSubmitting(false);
            if (success) setShowRating(false);
        };
        return (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center">
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
            <div className="space-y-1 max-w-4xl">

                {/* Page header */}
                <h1 className="text-sm font-bold text-gray-900 tracking-widest mb-4">
                    {t('visitDetail.pageTitle')}
                </h1>

                {/* Back + actions */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <button onClick={() => navigate(ROUTES.CUSTOMER_VISIT_HISTORY)}
                                className="text-xs text-gray-400 hover:text-primary-500 transition-colors flex items-center gap-1">
                            ← {t('visitDetail.backBtn')}
                        </button>
                        <div className="flex items-center gap-3 mt-1">
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
                <div className="border border-gray-200 rounded-xl p-5 bg-white mb-4">
                    <p className={sectionLabelCls}>{t('visitDetail.triage.title')}</p>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 mb-2">{t('visitDetail.triage.symptoms')}</p>
                            <div className={boxCls}>
                                <p className="text-sm text-gray-700 leading-relaxed">{visit?.symptoms}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 mb-2">{t('visitDetail.triage.clinicalResult')}</p>
                            <div className={boxCls}>
                                <p className="text-sm text-gray-700 leading-relaxed">{visit?.clinicalResult}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Diagnosis + Treatment ── */}
                <div className="border border-gray-200 rounded-xl p-5 bg-white mb-4">
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 mb-3">{t('visitDetail.diagnosis.title')}</p>
                            {visit?.diagnoses?.map((d, i) => (
                                <div key={i} className="bg-gray-900 text-white rounded-lg px-4 py-3 mb-2">
                                    <p className="text-xs text-gray-400">{d.code}</p>
                                    <p className="text-sm font-semibold mt-0.5">{d.label}</p>
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 mb-3">{t('visitDetail.diagnosis.treatmentTitle')}</p>
                            <p className="text-sm text-gray-700 leading-relaxed mb-3">{visit?.treatmentPlan}</p>
                            {visit?.followUpNote && (
                                <div className="border-l-2 border-gray-300 pl-3">
                                    <p className="text-xs font-bold text-gray-700 mb-1">▲ {t('visitDetail.diagnosis.followUp')}</p>
                                    <p className="text-xs text-gray-600 italic leading-relaxed">{visit.followUpNote}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                
                {/* ── Prescription ── */}
                {visit?.prescription && (
                    <div className="border border-gray-200 rounded-xl p-5 bg-white mb-4">
                        <p className={sectionLabelCls}>🗒 {t('visitDetail.prescription.title')}</p>
                        <p className="text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-line">
                            {visit.prescription}
                        </p>
                    </div>
                )}

                {/* ── Tests ── */}
                {tests.length > 0 && (
                    <div className="flex gap-4">
                        {/* Sidebar list */}
                        <div className="w-52 shrink-0">
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
                                        <p className="text-xs text-gray-400">ID: {test.id}</p>
                                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{i+1}. {test.name}</p>
                                        {test.hasAbnormal
                                            ? <p className="text-xs text-orange-500 mt-0.5">▲ {t('visitDetail.tests.abnormal')}</p>
                                            : <p className="text-xs text-gray-400 mt-0.5">{t('visitDetail.tests.normal')}</p>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Test table */}
                        {selectedTest && (
                            <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900">{selectedTest.name}</h3>
                                </div>
                                <table className="w-full">
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
                                                <td className="px-4 py-3 text-sm text-gray-800">{r.name}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 tabular-nums">{r.result}</td>
                                                <td className="px-4 py-3 text-sm text-gray-400 tabular-nums">{r.referenceRange}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{r.unit}</td>
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
                                                        <span className="text-xs text-gray-400">{r.assessment}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>

            {showRating && <RatingModal />}

            <style>{`@media print { aside { display: none; } header { display: none; } }`}</style>
        </PatientLayout>
    );
}

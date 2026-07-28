// src/pages/patient/AppointmentDetailPage.jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PatientLayout from '@/components/layout/CustomerLayout';
import { useAppointmentDetail } from '@/hooks/useAppointmentsCustomer';
import { ROUTES } from '@/constants/routes';

const fmtVND = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' đ' : '—';

const STATUS_DISPLAY = {
    upcoming:  'UPCOMING (WAITING FOR QUEUE NUMBER)',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED',
};

export default function AppointmentDetailPage() {
    const { id }   = useParams();
    const navigate = useNavigate();
    const { t }    = useTranslation('appointments');
    const { detail, loading, cancelling, error, fetchDetail, cancel } = useAppointmentDetail(id);

    useEffect(() => { fetchDetail(); }, [id]);

    const services = detail?.services ?? [];
    const total    = services.reduce((s, svc) => s + (svc.cost ?? 0), 0);
    const isActive = detail?.status === 'upcoming';

    const boxCls   = 'bg-white border border-gray-200 rounded-xl p-5';
    const labelCls = 'text-xs text-gray-400 mb-1';

    if (loading) return (
        <PatientLayout>
            <p className="text-sm text-gray-400 text-center py-20">{t('myAppointments.loading')}</p>
        </PatientLayout>
    );

    return (
        <PatientLayout>
            {/* Breadcrumb + actions */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500 tracking-widest">
                    <button onClick={() => navigate(ROUTES.APPOINTMENT)}
                            className="hover:text-primary-500 transition-colors">
                        {t('appointmentDetail.breadcrumb')}
                    </button>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-900">{t('appointmentDetail.pageTitle')}</span>
                </div>
            </div>

            {/* Back + Cancel / Reschedule */}
            <div className="flex items-center justify-between mb-5">
                <button onClick={() => navigate(ROUTES.APPOINTMENT)}
                        className="text-xs text-gray-500 hover:text-primary-500 transition-colors">
                    {t('appointmentDetail.backBtn')}
                </button>
                {isActive && (
                    <div className="flex gap-2">
                        <button onClick={cancel} disabled={cancelling}
                                className="px-5 h-9 border border-gray-300 text-sm text-gray-700 rounded-xl hover:border-gray-500 transition-colors disabled:opacity-60">
                            {t('appointmentDetail.cancelBtn')}
                        </button>
                        <button className="px-5 h-9 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors">
                            {t('appointmentDetail.rescheduleBtn')}
                        </button>
                    </div>
                )}
            </div>

            {/* Main card */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 tracking-wide mb-1">{t('appointmentDetail.appointmentCode')}</p>
                        <p className="text-2xl font-bold text-gray-900">{detail?.code}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">{t('appointmentDetail.statusLabel')}</p>
                        <p className="text-xs font-bold text-gray-800 tracking-wide">
                            {STATUS_DISPLAY[detail?.status] ?? detail?.status}
                        </p>
                    </div>
                </div>

                {/* 3-col body */}
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                    {/* Col 1: Appointment */}
                    <div className="px-6 py-6 space-y-4">
                        <p className="text-xs font-semibold text-gray-500 tracking-wide">{t('appointmentDetail.sections.appointment')}</p>

                        <div className={boxCls}>
                            <p className={labelCls}>{t('appointmentDetail.fields.date')}</p>
                            <p className="text-base font-bold text-gray-900">{detail?.date}</p>
                        </div>

                        <div className={boxCls}>
                            <p className={labelCls}>{t('appointmentDetail.fields.timeSlot')}</p>
                            <p className="text-sm font-bold text-gray-900">{detail?.timeSlot}</p>
                        </div>

                        <div className={boxCls}>
                            <p className="text-xs font-semibold text-gray-400 mb-2">{t('appointmentDetail.fields.queueTicket')}</p>
                            {detail?.queueNumber ? (
                                <p className="text-sm font-bold text-gray-900">
                                    {t('appointmentDetail.fields.queueNumber')} {detail.queueNumber}
                                </p>
                            ) : (
                                <>
                                    <p className="text-xs text-gray-400 italic mb-1">{t('appointmentDetail.fields.queueWaiting')}</p>
                                    <p className="text-xs text-gray-300 leading-relaxed">{t('appointmentDetail.fields.queueNote')}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Col 2: Ordered Services */}
                    <div className="px-6 py-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-semibold text-gray-500 tracking-wide">{t('appointmentDetail.sections.orderedServices')}</p>
                            <span className="text-xs text-gray-400">{services.length} {t('appointmentDetail.items')}</span>
                        </div>

                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="grid grid-cols-[1fr_auto] px-4 py-2 bg-gray-50 border-b border-gray-100">
                                <span className="text-xs font-medium text-gray-400">{t('appointmentDetail.table.service')}</span>
                                <span className="text-xs font-medium text-gray-400">{t('appointmentDetail.table.cost')}</span>
                            </div>
                            {services.map((svc, i) => (
                                <div key={i} className="grid grid-cols-[1fr_auto] px-4 py-3 border-b border-gray-50 last:border-0 items-center">
                                    <span className="text-sm font-semibold text-gray-900">{svc.name}</span>
                                    <span className="text-sm text-gray-700 tabular-nums">{fmtVND(svc.cost)}</span>
                                </div>
                            ))}
                            <div className="grid grid-cols-[1fr_auto] px-4 py-3 bg-gray-50 border-t border-gray-100">
                                <span className="text-xs font-semibold text-gray-500">{t('appointmentDetail.table.total')}</span>
                                <span className="text-sm font-bold text-gray-900 tabular-nums">{fmtVND(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Reason */}
                    <div className="px-6 py-6 space-y-4">
                        <p className="text-xs font-semibold text-gray-500 tracking-wide">{t('appointmentDetail.sections.reason')}</p>

                        <div className={boxCls}>
                            <p className="text-sm text-gray-700">{detail?.reason || '—'}</p>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-gray-400 mb-2">{t('appointmentDetail.sections.complaint')}</p>
                            <div className={boxCls}>
                                <p className="text-sm text-gray-700 leading-relaxed">{detail?.symptoms || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-400">{t('appointmentDetail.footer')}</p>
                    <button onClick={() => window.print()}
                            className="text-xs font-medium text-gray-600 hover:text-primary-500 transition-colors">
                        {t('appointmentDetail.printBtn')}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </PatientLayout>
    );
}

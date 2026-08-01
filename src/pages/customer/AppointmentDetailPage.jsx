// src/pages/patient/AppointmentDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PatientLayout from '@/components/layout/CustomerLayout';
import { useAppointmentDetail } from '@/hooks/useAppointmentsCustomer';
import { ROUTES } from '@/constants/routes';
import CancelConfirmModal from '@/components/ui/CancelConfirmModal';

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
    const [showCancelModal, setShowCancelModal] = useState(false);

    useEffect(() => { fetchDetail(); }, [id]);

    const services = detail?.services ?? [];
    const total    = services.reduce((s, svc) => s + (svc.cost ?? 0), 0);
    
    let isPast = false;
    if (detail?.date) {
        const [day, month, year] = detail.date.split('/');
        const apptDate = new Date(`${year}-${month}-${day}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (apptDate <= today) isPast = true;
    }
    
    const isActive = detail?.status === 'upcoming' && !isPast;

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
                    <button onClick={() => navigate(ROUTES.MY_APPOINTMENTS)}
                            className="hover:text-primary-500 transition-colors">
                        {t('appointmentDetail.breadcrumb')}
                    </button>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-900">{t('appointmentDetail.pageTitle')}</span>
                </div>
            </div>

            {/* Back + Cancel / Reschedule */}
            <div className="flex items-center justify-between mb-5">
                <button onClick={() => navigate(ROUTES.MY_APPOINTMENTS)}
                        className="text-xs text-gray-500 hover:text-primary-500 transition-colors">
                    {t('appointmentDetail.backBtn')}
                </button>
                {isActive && (
                    <div className="flex gap-2">
                        <button onClick={() => setShowCancelModal(true)} disabled={cancelling}
                                className="px-5 h-9 border border-red-500 text-sm text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60">
                            {t('appointmentDetail.cancelBtn')}
                        </button>
                        <button 
                            onClick={() => {
                                const parsedDate = detail.date ? detail.date.split('/').reverse().join('-') : '';
                                const parsedTimeSlot = detail.timeSlot?.includes('Sáng') ? 'morning' : 'afternoon';
                                navigate(ROUTES.CUSTOMER_APPOINTMENT, {
                                    state: {
                                        rescheduleApptId: detail.id,
                                        initialServices: detail.services.map(s => ({
                                            id: s.id,
                                            name: s.name,
                                            price: s.cost
                                        })),
                                        initialDate: parsedDate,
                                        initialTimeSlot: parsedTimeSlot
                                    }
                                });
                            }}
                            className="px-5 h-9 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors">
                            {t('appointmentDetail.rescheduleBtn')}
                        </button>
                    </div>
                )}
            </div>

            {/* Main card */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {/* Removed Header */}

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

                        {/* Removed Queue Ticket */}
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

            <CancelConfirmModal 
                isOpen={showCancelModal}
                isLoading={cancelling}
                onClose={() => setShowCancelModal(false)}
                onConfirm={async () => {
                    await cancel();
                    setShowCancelModal(false);
                }}
            />
        </PatientLayout>
    );
}

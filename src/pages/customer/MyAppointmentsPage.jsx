// src/pages/patient/MyAppointmentsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PatientLayout from '@/components/layout/CustomerLayout';
import CancelConfirmModal from '@/components/ui/CancelConfirmModal';
import { useAppointments } from '@/hooks/useAppointmentsCustomer';
import { ROUTES } from '@/constants/routes';

const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' đ' : '—';

/** Normalize a raw API status string to the lowercase key used by i18n / STATUS_CFG */
const normalizeStatus = (status) => (status || '').toString().toLowerCase().trim();

/* ── Class-only config (labels are translated via t() inside component) ── */
const STATUS_CLS = {
    upcoming:   { cls: 'border border-gray-800 text-gray-800 bg-white text-xs font-semibold px-2.5 py-1 rounded' },
    completed:  { cls: 'border border-gray-300 text-gray-400 bg-white text-xs px-2.5 py-1 rounded' },
    cancelled:  { cls: 'border border-red-200 text-red-400 bg-white text-xs px-2.5 py-1 rounded' },
    checked_in: { cls: 'border border-blue-200 text-blue-600 bg-blue-50 text-xs px-2.5 py-1 rounded' },
};

const SPECIALTIES = ['', 'Cardiology', 'Endocrinology', 'General Physician', 'Ophthalmology', 'Dermatology'];
const STATUSES    = ['', 'upcoming', 'checked_in', 'completed', 'cancelled'];

const inputCls  = 'w-full h-9 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-500 bg-white';
const labelCls  = 'block text-xs font-semibold text-gray-400 tracking-wide mb-1.5';

function Pagination({ page, total, pageSize, onChange }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-end gap-1 mt-4">
            <button onClick={() => onChange(page - 1)} disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-400 disabled:opacity-30 hover:border-gray-400 transition-colors text-sm">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => onChange(p)}
                        className={`w-8 h-8 text-sm rounded border transition-colors ${p === page ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                    {p}
                </button>
            ))}
            <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-400 disabled:opacity-30 hover:border-gray-400 transition-colors text-sm">›</button>
        </div>
    );
}

export default function MyAppointmentsPage() {
    const { t }    = useTranslation('appointments');
    const navigate = useNavigate();
    const { appointments, loading, error, total, page, PAGE_SIZE, fetchAppointments, cancelAppointment } = useAppointments();
    const [cancelApptId, setCancelApptId] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    // Build status config with Vietnamese labels via i18n
    const STATUS_CFG = {
        upcoming:   { label: t('myAppointments.status.upcoming'),   cls: STATUS_CLS.upcoming.cls },
        completed:  { label: t('myAppointments.status.completed'),  cls: STATUS_CLS.completed.cls },
        cancelled:  { label: t('myAppointments.status.cancelled'),  cls: STATUS_CLS.cancelled.cls },
        checked_in: { label: t('myAppointments.status.checked_in'),  cls: STATUS_CLS.checked_in.cls },
    };

    const [code,      setCode]      = useState('');
    const [specialty, setSpecialty] = useState('');
    const [status,    setStatus]    = useState('');

    useEffect(() => { fetchAppointments(); }, []);

    const handleFilter = () => fetchAppointments({ code, specialty, status, page: 0 });
    const handlePage   = (p) => fetchAppointments({ code, specialty, status, page: p - 1 }); // Frontend 1-based → backend 0-based

    const thCls = 'text-xs font-semibold text-gray-400 tracking-wide text-left px-4 py-3';
    const tdCls = 'px-4 py-4 align-top text-sm';

    return (
        <PatientLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <h1 className="text-sm font-bold text-gray-900 tracking-widest">{t('myAppointments.pageTitle')}</h1>
                    <button
                        onClick={() => navigate(ROUTES.CUSTOMER_APPOINTMENT)}
                        className="px-5 h-9 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl transition-colors tracking-wide">
                        {t('myAppointments.newBtn')}
                    </button>
                </div>

                {/* Notice */}
                <p className="text-xs text-gray-400 leading-relaxed">
                    {t('myAppointments.notice')}<br />{t('myAppointments.noticeQueue')}
                </p>

                {/* Filter */}
                <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                    {/* Removed Code Filter */}
                    <div>
                        <label className={labelCls}>{t('myAppointments.filter.specialty')}</label>
                        <select value={specialty} onChange={e => setSpecialty(e.target.value)} className={inputCls}>
                            <option value="">{t('myAppointments.filter.specialtyAll')}</option>
                            {SPECIALTIES.filter(Boolean).map(s => <option key={s} value={s}>{t(`myAppointments.specialties.${s}`, { defaultValue: s })}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>{t('myAppointments.filter.status')}</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                            <option value="">{t('myAppointments.filter.statusAll')}</option>
                            {STATUSES.filter(Boolean).map(s => (
                                <option key={s} value={s}>{t(`myAppointments.status.${s}`)}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleFilter}
                            className="h-9 px-4 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors tracking-wide whitespace-nowrap">
                        {t('myAppointments.filter.filterBtn')}
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="border-b border-gray-100">
                        <tr>
                            <th className={thCls}>{t('myAppointments.table.dateTime')}</th>
                            <th className={thCls}>{t('myAppointments.table.specialty')}</th>
                            <th className={thCls}>{t('myAppointments.table.status')}</th>
                            <th className={thCls}>{t('myAppointments.table.actions')}</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {loading && <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">{t('myAppointments.loading')}</td></tr>}
                        {!loading && error && <tr><td colSpan={4} className="text-center py-12 text-sm text-red-500">{error}</td></tr>}
                        {!loading && !error && appointments.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-12 text-sm text-gray-400">{t('myAppointments.noData')}</td></tr>
                        )}
                        {!loading && appointments.map(appt => {
                            const normStatus = normalizeStatus(appt.status);
                            const stCfg   = STATUS_CFG[normStatus] ?? STATUS_CFG.upcoming;

                            let isPast = false;
                            if (appt.date) {
                                const [day, month, year] = appt.date.split('/');
                                const apptDate = new Date(`${year}-${month}-${day}T00:00:00`);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                if (apptDate <= today) isPast = true;
                            }

                            const isActive = normStatus === 'upcoming' && !isPast;
                            const isDone   = normStatus === 'completed';
                            return (
                                <tr key={appt.id} className={`hover:bg-gray-50 transition-colors ${isDone ? 'opacity-50' : ''}`}>
                                    <td className={tdCls}>
                                        <p className={`font-semibold ${isDone ? 'text-gray-400' : 'text-gray-800'}`}>{appt.date}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{appt.timeWindow}</p>
                                        <p className="text-xs text-gray-400">({appt.shift})</p>
                                    </td>
                                    <td className={tdCls + (isDone ? ' text-gray-400' : ' text-gray-700')}>{t(`myAppointments.specialties.${appt.specialty}`, { defaultValue: appt.specialty })}</td>
                                    <td className={tdCls}>
                                        <span className={stCfg.cls}>{stCfg.label}</span>
                                    </td>
                                    <td className={tdCls}>
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => navigate(`/my-appointments/${appt.id}`)}
                                                className="text-xs text-gray-500 hover:text-primary-500 transition-colors text-left">
                                                {t('myAppointments.viewBtn')}
                                            </button>
                                            {isActive && (
                                                <button
                                                    onClick={() => setCancelApptId(appt.id)}
                                                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors text-left">
                                                    {t('myAppointments.cancelBtn')}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-gray-50">
                        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={handlePage} />
                    </div>
                </div>
            </div>

            <CancelConfirmModal 
                isOpen={!!cancelApptId}
                isLoading={isCancelling}
                onClose={() => setCancelApptId(null)}
                onConfirm={async () => {
                    setIsCancelling(true);
                    try { 
                        await cancelAppointment(cancelApptId); 
                        setCancelApptId(null);
                    } catch (e) { 
                        alert(e.message); 
                    } finally {
                        setIsCancelling(false);
                    }
                }}
            />
        </PatientLayout>
    );
}

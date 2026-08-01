// src/pages/patient/MedicalHistoryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Stethoscope, ChevronRight, Activity } from 'lucide-react';
import PatientLayout from '@/components/layout/CustomerLayout';
import { useMedicalHistory } from '@/hooks/useMedicalHistory';
import { ROUTES } from '@/constants/routes';

const PAGE_SIZE = 10;

function Pagination({ page, total, pageSize, onChange }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center gap-1">
            <button onClick={() => onChange(page - 1)} disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-400 disabled:opacity-30 hover:border-gray-400 transition-colors text-sm">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => onChange(p)}
                        className={`w-8 h-8 text-sm rounded border transition-colors ${
                            p === page ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}>{p}</button>
            ))}
            <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-400 disabled:opacity-30 hover:border-gray-400 transition-colors text-sm">›</button>
        </div>
    );
}

export default function MedicalHistoryPage() {
    const { t }    = useTranslation('medicalHistory');
    const navigate = useNavigate();
    const { visits, loading, error, total, page, PAGE_SIZE: PS, fetchHistory } = useMedicalHistory();
    const [search, setSearch] = useState('');

    useEffect(() => { fetchHistory(); }, []);

    const handleSearch = (val) => { setSearch(val); fetchHistory({ search: val, page: 0 }); };
    const handlePage   = (p)   => fetchHistory({ search, page: p - 1 }); // Frontend 1-based → backend 0-based

    const from = (page - 1) * (PS ?? PAGE_SIZE) + 1;
    const to   = Math.min(page * (PS ?? PAGE_SIZE), total);

    const thCls = 'text-xs font-medium text-primary-500 text-left px-5 py-3';
    const tdCls = 'px-5 py-4 text-sm align-middle';

    return (
        <PatientLayout>
            <div className="space-y-5">
                {/* Page title */}
                <h1 className="text-base font-semibold text-gray-900">{t('medicalHistory.pageTitle')}</h1>

                {/* Search bar */}
                <div className="flex items-center gap-0">
                    <label className="text-sm text-gray-500 whitespace-nowrap mr-3">
                        {t('medicalHistory.searchPlaceholder')}
                    </label>
                    <input
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        className="w-64 h-9 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 bg-white"
                    />
                </div>

                {/* List View */}
                <div className="space-y-3">
                    {loading && (
                        <div className="text-center py-12 text-sm text-gray-400 bg-white rounded-xl border border-gray-200">
                            {t('medicalHistory.loading')}
                        </div>
                    )}
                    {!loading && error && (
                        <div className="text-center py-12 text-sm text-red-500 bg-white rounded-xl border border-gray-200">
                            {error}
                        </div>
                    )}
                    {!loading && !error && visits.length === 0 && (
                        <div className="text-center py-12 text-sm text-gray-400 bg-white rounded-xl border border-gray-200">
                            {t('medicalHistory.noData')}
                        </div>
                    )}
                    {!loading && visits.map(v => (
                        <div 
                            key={v.id} 
                            onClick={() => navigate(`${ROUTES.CUSTOMER_VISIT_HISTORY}/${v.id}`)}
                            className="group bg-white border border-gray-100 rounded-2xl p-5 hover:border-primary-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all cursor-pointer flex flex-col md:flex-row md:items-center gap-4"
                        >
                            {/* Date & Time */}
                            <div className="flex items-start gap-3 md:w-1/4 shrink-0">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors shrink-0">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{v.date}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{v.time}</p>
                                </div>
                            </div>

                            {/* Specialty & Doctor */}
                            <div className="flex flex-col md:w-1/4 shrink-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Activity className="w-3.5 h-3.5 text-primary-500" />
                                    <p className="text-sm font-semibold text-primary-600">{v.specialty}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                                    <p className="text-xs text-gray-600">{v.doctor}</p>
                                </div>
                            </div>

                            {/* Diagnosis & Status */}
                            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 mb-0.5">{t('medicalHistory.table.diagnosis')}</p>
                                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{v.diagnosis}</p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 border border-green-100">
                                        {t('medicalHistory.statusAvailable')}
                                    </span>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                    {/* Footer: count + pagination */}
                    {total > 0 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                Showing {from}–{to} of {total} appointments
                            </p>
                            <Pagination page={page} total={total} pageSize={PS ?? PAGE_SIZE} onChange={handlePage} />
                        </div>
                    )}
            </div>
        </PatientLayout>
    );
}

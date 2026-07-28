// src/pages/patient/MedicalHistoryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="border-b border-gray-100">
                        <tr>
                            <th className={thCls}>{t('medicalHistory.table.date')}</th>
                            <th className={thCls}>{t('medicalHistory.table.specialty')}</th>
                            <th className={thCls}>{t('medicalHistory.table.doctor')}</th>
                            <th className={thCls}>{t('medicalHistory.table.diagnosis')}</th>
                            <th className={thCls}>{t('medicalHistory.table.status')}</th>
                            <th className={thCls}>{t('medicalHistory.table.actions')}</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {loading && (
                            <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">{t('medicalHistory.loading')}</td></tr>
                        )}
                        {!loading && error && (
                            <tr><td colSpan={6} className="text-center py-12 text-sm text-red-500">{error}</td></tr>
                        )}
                        {!loading && !error && visits.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">{t('medicalHistory.noData')}</td></tr>
                        )}
                        {!loading && visits.map(v => (
                            <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                <td className={tdCls}>
                                    <p className="font-bold text-gray-900">{v.date}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{v.time}</p>
                                </td>
                                <td className={tdCls + ' text-primary-500'}>{v.specialty}</td>
                                <td className={tdCls + ' text-gray-600'}>{v.doctor}</td>
                                <td className={tdCls + ' font-bold text-gray-900'}>{v.diagnosis}</td>
                                <td className={tdCls}>
                    <span className="text-xs font-semibold text-green-500">
                      {t('medicalHistory.statusAvailable')}
                    </span>
                                </td>
                                <td className={tdCls}>
                                    <button
                                        onClick={() => navigate(`${ROUTES.CUSTOMER_VISIT_HISTORY}/${v.id}`)}
                                        className="text-xs font-bold text-gray-800 hover:text-primary-500 transition-colors tracking-wide"
                                    >
                                        {t('medicalHistory.viewDetails')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

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
            </div>
        </PatientLayout>
    );
}

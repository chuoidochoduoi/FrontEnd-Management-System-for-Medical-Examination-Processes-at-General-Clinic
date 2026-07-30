// src/pages/owner/ReportPage.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { useReport } from '@/hooks/useReport';

/* ── helpers ── */
const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) : '—';
const fmtVND = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '—';
const PERIODS = ['day', 'month', 'year'];

/* ── Simple bar chart (SVG, no lib) ── */
function BarChart({ data }) {
    if (!data?.length) return <div className="h-48 flex items-center justify-center text-xs text-gray-300">Chưa có dữ liệu</div>;
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex items-end gap-6 h-52 px-2">
            {data.map((d, i) => {
                const pct = (d.value / max) * 100;
                return (
                    <div key={i} className="flex flex-col items-center flex-1 gap-1">
                        <span className="text-xs text-gray-500 font-medium">{fmt(d.value)}</span>
                        <div className="w-full rounded-t-sm" style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: i === 0 ? '#1a1a2e' : '#b0b8c9' }} />
                        <span className="text-xs text-gray-400 text-center leading-tight">{d.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

/* ── Donut chart (SVG) ── */
function DonutChart({ segments, total, label }) {
    const SIZE = 140, CX = 70, CY = 70, R = 52, STROKE = 22;
    const circ = 2 * Math.PI * R;
    let offset = 0;
    const colors = ['#1a1a2e', '#b0b8c9', '#5b8dee', '#f59e0b'];

    // Filter out invalid segments
    const validSegments = segments?.filter(seg => typeof seg.pct === 'number' && !isNaN(seg.pct)) || [];
    const safeTotal = typeof total === 'number' && !isNaN(total) ? total : 0;

    return (
        <div className="flex flex-col items-center gap-3">
            <svg width={SIZE} height={SIZE} className="-rotate-90">
                {validSegments.map((seg, i) => {
                    const pct = seg.pct || 0;
                    const dash = (pct / 100) * circ;
                    const gap = circ - dash;
                    const el = (
                        <circle key={i} cx={CX} cy={CY} r={R}
                            fill="none" stroke={colors[i % colors.length]} strokeWidth={STROKE}
                            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-(offset * circ) / 100} />
                    );
                    offset += pct;
                    return el;
                })}
                {/* Center text */}
                <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle"
                    className="rotate-90" style={{ transform: `rotate(90deg)`, transformOrigin: `${CX}px ${CY}px` }}>
                    <tspan x={CX} dy="-6" fontSize="18" fontWeight="700" fill="#1a1a2e">{safeTotal}</tspan>
                    <tspan x={CX} dy="16" fontSize="9" fill="#9ca3af">{label}</tspan>
                </text>
            </svg>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
                {validSegments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
                        <span className="text-xs text-gray-600">{seg.label} ({seg.pct || 0}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Progress bar breakdown ── */
function BreakdownBar({ label, pct, amount, color = 'bg-gray-900' }) {
    return (
        <div className="mb-5">
            <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-700 font-medium">{label}</span>
                <span className="text-gray-500">{pct}% ({fmtVND(amount)})</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

/* ── Stat card ── */
function StatCard({ label, value, note, muted }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5">
            <p className="text-xs text-gray-400 mb-2">{label}</p>
            <p className={`text-2xl font-bold ${muted ? 'text-gray-300' : 'text-gray-900'}`}>{value}</p>
            {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
        </div>
    );
}

/* ── Tab 1 content ── */
function Tab1({ data, t }) {
    if (!data) return null;
    const { revenueChart = [], sessionChart = [], totalSessions = 0, table = [] } = data;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
                {/* Bar chart */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6">
                    <p className="text-xs font-medium text-gray-500 mb-4">{t('report.tab1.revenueChart')}</p>
                    <BarChart data={revenueChart} />
                </div>
                {/* Donut */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col">
                    <p className="text-xs font-medium text-gray-500 mb-4">{t('report.tab1.sessionChart')}</p>
                    <div className="flex-1 flex items-center justify-center">
                        <DonutChart
                            segments={sessionChart.map(s => ({
                                label: s.label,
                                pct: totalSessions ? Math.round((s.value / totalSessions) * 100) : 0,
                                value: s.value
                            }))}
                            total={totalSessions}
                            label={t('report.tab1.totalSessions')}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{t('report.tab1.table.title')}</p>
                </div>
                <table className="w-full">
                    <thead className="border-b border-gray-100 bg-gray-50">
                        <tr>
                            {[
                                t('report.tab1.table.code'),
                                t('report.tab1.table.dept'),
                                t('report.tab1.table.revenue'),
                                t('report.tab1.table.sessions'),
                                t('report.tab1.table.occupancy'),
                                t('report.tab1.table.csat'),
                            ].map(col => (
                                <th key={col} className="text-xs font-medium text-gray-400 text-left px-5 py-3">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {table.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-4 text-xs text-gray-400 font-mono">{row.code}</td>
                                <td className="px-5 py-4 text-sm font-semibold text-gray-900">{row.dept}</td>
                                <td className="px-5 py-4 text-sm text-gray-700 tabular-nums">{fmtVND(row.revenue)}</td>
                                <td className="px-5 py-4 text-sm text-gray-600">{row.sessions} ca</td>
                                <td className="px-5 py-4 text-sm">
                                    <span className={row.occupancy >= 90 ? 'text-red-500 font-medium' : 'text-gray-700'}>
                                        {row.occupancy}% {row.occupancy >= 90 && '(Quá tải)'}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-sm font-semibold text-gray-800">{row.csat} / 5.0</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ── Tab 2 content ── */
function Tab2({ data, t }) {
    if (!data) return null;
    const {
        totalRevenue = 0, totalSessions = 0,
        avgPerSession = 0, bhytTotal = 0, bhytRate = 0,
        drugRevenue = 0,
        breakdown = [],
        table = [],
    } = data;

    const [filter, setFilter] = useState('');
    const [sortDesc, setSortDesc] = useState(true);

    const filtered = table
        .filter(r => !filter || r.category === filter)
        .sort((a, b) => sortDesc ? b.totalRevenue - a.totalRevenue : a.totalRevenue - b.totalRevenue);

    const categories = [...new Set(table.map(r => r.category).filter(Boolean))];
    const barColors = ['bg-gray-900', 'bg-gray-400', 'bg-gray-300'];

    return (
        <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard label={t('report.tab2.stats.totalRevenue')} value={fmtVND(totalRevenue)}
                    note={t('report.tab2.stats.totalRevenueNote', { total: totalSessions })} />
                <StatCard label={t('report.tab2.stats.avgPerSession')} value={fmtVND(avgPerSession)}
                    note={t('report.tab2.stats.avgPerSessionNote')} />
                <StatCard label={t('report.tab2.stats.bhytTotal')} value={fmtVND(bhytTotal)}
                    note={t('report.tab2.stats.bhytNote', { rate: bhytRate })} />
                <StatCard label={t('report.tab2.stats.drugRevenue')} value={fmtVND(drugRevenue)}
                    note={t('report.tab2.stats.drugNote')} muted />
            </div>

            {/* Breakdown bars */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <p className="text-xs font-medium text-gray-500 mb-5">{t('report.tab2.breakdown.title')}</p>
                {breakdown.map((b, i) => (
                    <BreakdownBar key={i} label={b.label} pct={b.pct} amount={b.amount} color={barColors[i] ?? 'bg-gray-200'} />
                ))}
            </div>

            {/* Detail table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">{t('report.tab2.table.title')}</p>
                    <div className="flex items-center gap-3">
                        <select value={filter} onChange={e => setFilter(e.target.value)}
                            className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none bg-white">
                            <option value="">{t('report.tab2.table.filterAll')}</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button onClick={() => setSortDesc(v => !v)}
                            className="flex items-center gap-1.5 h-8 px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400 transition-colors">
                            {t('report.tab2.table.sort')} {sortDesc ? '↓' : '↑'}
                        </button>
                    </div>
                </div>
                <table className="w-full">
                    <thead className="border-b border-gray-100 bg-gray-50">
                        <tr>
                            {[
                                t('report.tab2.table.stt'),
                                t('report.tab2.table.serviceName'),
                                t('report.tab2.table.totalOrders'),
                                t('report.tab2.table.unitPrice'),
                                t('report.tab2.table.totalRevenue'),
                                t('report.tab2.table.bhytQty'),
                                t('report.tab2.table.bhytFund'),
                            ].map(col => (
                                <th key={col} className="text-xs font-medium text-gray-400 text-left px-5 py-3">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-4 text-xs text-gray-400">{String(i + 1).padStart(2, '0')}</td>
                                <td className="px-5 py-4">
                                    <p className="text-sm font-medium text-gray-900 leading-snug">{row.name}</p>
                                    {row.note && <p className="text-xs text-gray-400 mt-0.5">{row.note}</p>}
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-600 tabular-nums">{fmt(row.totalOrders)} đơn ca</td>
                                <td className="px-5 py-4 text-sm text-gray-600 tabular-nums">{fmt(row.unitPrice)}</td>
                                <td className="px-5 py-4 text-sm font-bold text-gray-900 tabular-nums">{fmt(row.totalRevenue)}</td>
                                <td className="px-5 py-4 text-sm text-gray-600 tabular-nums">{fmt(row.bhytQty)}</td>
                                <td className="px-5 py-4 text-sm text-gray-600 tabular-nums">{fmt(row.bhytFund)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function ReportPage() {
    const { t } = useTranslation('report');
    const { tab1Data, tab2Data, loading, error, fetchTab1, fetchTab2, exportCSV } = useReport();

    const [activeTab, setActiveTab] = useState('tab1');
    const [period, setPeriod] = useState('day');

    useEffect(() => {
        fetchTab1(period);
        fetchTab2(period);
    }, [period]);

    const handlePeriod = (p) => {
        setPeriod(p);
    };

    return (
        <OwnerLayout>
            <div className="px-10 py-8 min-h-screen flex flex-col space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">{t('report.pageTitle')}</h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {activeTab === 'tab1' ? t('report.subtitle1') : t('report.subtitle2')}
                        </p>
                    </div>
                    {/* Period switcher */}
                    <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1 bg-white">
                        {PERIODS.map(p => (
                            <button key={p} onClick={() => handlePeriod(p)}
                                className={`px-4 h-7 text-sm rounded-lg transition-colors ${period === p ? 'bg-gray-900 text-white font-medium' : 'text-gray-500 hover:text-gray-800'
                                    }`}>
                                {t(`report.periods.${p}`)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabs + Export */}
                <div className="flex items-end justify-between border-b border-gray-200">
                    <div className="flex">
                        {[
                            { key: 'tab1', label: t('report.tab1.label') },
                            { key: 'tab2', label: t('report.tab2.label') },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`px-5 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-400 hover:text-gray-700'
                                    }`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => exportCSV(period)}
                        className="mb-3 px-4 h-9 bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium rounded-xl transition-colors whitespace-nowrap">
                        {t('report.exportBtn')}
                    </button>
                </div>

                {/* Content */}
                {loading && <p className="text-sm text-gray-400 text-center py-12">{t('report.loading')}</p>}
                {error && <p className="text-sm text-red-500 text-center py-4">{error}</p>}

                {!loading && activeTab === 'tab1' && <Tab1 data={tab1Data} t={t} />}
                {!loading && activeTab === 'tab2' && <Tab2 data={tab2Data} t={t} />}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
                    <p className="text-xs text-gray-400">{t('report.footer1')}</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <p className="text-xs text-gray-400">{t('report.footer2')}</p>
                    </div>
                </div>
            </div>
        </OwnerLayout>
    );
}

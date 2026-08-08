// src/pages/owner/ReportPage.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { useReport } from '@/hooks/useReport';

/* ── helpers ── */
const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) : '—';
const fmtVND = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '—';
const PERIODS = ['day', 'month', 'quarter', 'year', 'custom'];

/* ── Simple bar chart (SVG, no lib) ── */
function BarChart({ data }) {
    if (!data?.length) return <div className="h-48 flex items-center justify-center text-xs text-gray-300">Chưa có dữ liệu</div>;
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex gap-6 h-52 px-2">
            {data.map((d, i) => {
                const pct = (d.value / max) * 100;
                return (
                    <div key={i} className="flex flex-col items-center justify-end flex-1 gap-1 h-full">
                        <span className="text-xs text-gray-500 font-medium">{fmt(d.value)}</span>
                        <div className="w-full rounded-t-sm" style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: '#1a1a2e' }} />
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

/* ── Print Layout ── */
function PrintLayout({ activeTab, period, fromDate, toDate, tab1Data, tab2Data, t }) {
    // Build period text
    let periodText;
    if (period === 'custom' && fromDate && toDate) {
        const fmt = (d) => {
            const [y, m, day] = d.split('-');
            return `${day}/${m}/${y}`;
        };
        periodText = `Từ ngày ${fmt(fromDate)} đến ngày ${fmt(toDate)}`;
    } else if (period === 'day') {
        const today = new Date();
        periodText = `Ngày ${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;
    } else if (period === 'month') {
        const today = new Date();
        periodText = `Tháng ${today.getMonth()+1}/${today.getFullYear()}`;
    } else if (period === 'quarter') {
        const today = new Date();
        const q = Math.floor(today.getMonth() / 3) + 1;
        periodText = `Quý ${q} năm ${today.getFullYear()}`;
    } else {
        periodText = `Năm ${new Date().getFullYear()}`;
    }
    const isTab1 = activeTab === 'tab1';

    return (
        <div className="hidden print:block w-full text-black font-serif bg-white p-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="font-bold text-lg">PHÒNG KHÁM CARES</h2>
                    <p className="text-sm">Địa chỉ: 123 Đường Y Tế, TP. HCM</p>
                </div>
                <div className="text-right">
                    <p className="text-sm italic">Mẫu biểu: BCH/2026</p>
                </div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-xl font-bold uppercase mb-2">
                    BÁO CÁO THỐNG KÊ {isTab1 ? 'TỔNG QUAN & CÔNG SUẤT' : 'DOANH THU THEO DỊCH VỤ'}
                </h1>
                <p className="text-sm italic">Kỳ báo cáo: {periodText}</p>
                <p className="text-sm italic">Đơn vị tính: VNĐ / Lượt</p>
            </div>

            {isTab1 && tab1Data?.table && (
                <table className="w-full border-collapse border border-black mb-8 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2">Mã phòng</th>
                            <th className="border border-black p-2">Tên phòng ban</th>
                            <th className="border border-black p-2">Doanh thu lũy kế</th>
                            <th className="border border-black p-2">Tổng số ca</th>
                            <th className="border border-black p-2">Công suất</th>
                            <th className="border border-black p-2">CSAT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tab1Data.table.map((row, i) => (
                            <tr key={i}>
                                <td className="border border-black p-2 text-center">{row.code}</td>
                                <td className="border border-black p-2">{row.dept}</td>
                                <td className="border border-black p-2 text-right">{fmtVND(row.revenue)}</td>
                                <td className="border border-black p-2 text-center">{row.sessions}</td>
                                <td className="border border-black p-2 text-center">{row.occupancy}%</td>
                                <td className="border border-black p-2 text-center">{row.csat}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {!isTab1 && tab2Data?.table && (
                <table className="w-full border-collapse border border-black mb-8 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2">STT</th>
                            <th className="border border-black p-2">Tên dịch vụ</th>
                            <th className="border border-black p-2">Số ca</th>
                            <th className="border border-black p-2">Đơn giá</th>
                            <th className="border border-black p-2">Tổng doanh thu</th>
                            <th className="border border-black p-2">Lượt BHYT</th>
                            <th className="border border-black p-2">Quỹ BHYT trả</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tab2Data.table.map((row, i) => (
                            <tr key={i}>
                                <td className="border border-black p-2 text-center">{i + 1}</td>
                                <td className="border border-black p-2">{row.name}</td>
                                <td className="border border-black p-2 text-center">{row.totalOrders}</td>
                                <td className="border border-black p-2 text-right">{fmtVND(row.unitPrice)}</td>
                                <td className="border border-black p-2 text-right font-bold">{fmtVND(row.totalRevenue)}</td>
                                <td className="border border-black p-2 text-center">{row.bhytQty}</td>
                                <td className="border border-black p-2 text-right">{fmtVND(row.bhytFund)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div className="flex justify-between mt-12">
                <div className="text-center w-1/3">
                    <p className="font-bold">Người lập bảng</p>
                    <p className="italic text-xs">(Ký, ghi rõ họ tên)</p>
                </div>
                <div className="text-center w-1/3">
                    <p className="font-bold">Kế toán trưởng</p>
                    <p className="italic text-xs">(Ký, ghi rõ họ tên)</p>
                </div>
                <div className="text-center w-1/3">
                    <p className="italic mb-1">Ngày ..... tháng ..... năm 20.....</p>
                    <p className="font-bold">Giám đốc</p>
                    <p className="italic text-xs">(Ký, họ tên, đóng dấu)</p>
                </div>
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
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        if (period === 'day') {
            fetchTab1('day');
            fetchTab2('day');
        } else if (period === 'year') {
            const f = `${selectedYear}-01-01`;
            const t = `${selectedYear}-12-31`;
            fetchTab1('custom', f, t);
            fetchTab2('custom', f, t);
        } else if (period === 'quarter') {
            const startMonth = (selectedQuarter - 1) * 3 + 1;
            const endMonth = startMonth + 2;
            const f = `${selectedYear}-${String(startMonth).padStart(2, '0')}-01`;
            const daysInEndMonth = new Date(selectedYear, endMonth, 0).getDate();
            const t = `${selectedYear}-${String(endMonth).padStart(2, '0')}-${daysInEndMonth}`;
            fetchTab1('custom', f, t);
            fetchTab2('custom', f, t);
        } else if (period === 'month') {
            const f = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
            const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
            const t = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${daysInMonth}`;
            fetchTab1('custom', f, t);
            fetchTab2('custom', f, t);
        }
    }, [period, selectedYear, selectedQuarter, selectedMonth]);

    const handlePeriod = (p) => {
        setPeriod(p);
    };

    const handleApplyCustom = () => {
        if (!fromDate || !toDate) {
            alert('Vui lòng chọn đầy đủ từ ngày và đến ngày');
            return;
        }
        if (new Date(fromDate) > new Date(toDate)) {
            alert('Từ ngày không được lớn hơn đến ngày');
            return;
        }
        fetchTab1('custom', fromDate, toDate);
        fetchTab2('custom', fromDate, toDate);
    };

    return (
        <OwnerLayout>
            <div className="px-10 py-8 min-h-screen flex flex-col space-y-5 print:hidden">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">{t('report.pageTitle')}</h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {activeTab === 'tab1' ? t('report.subtitle1') : t('report.subtitle2')}
                        </p>
                    </div>
                    {/* Period switcher */}
                    <div className="flex items-center gap-2 print:hidden">
                        {period === 'custom' && (
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1 bg-white">
                                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-2 h-7 text-xs border border-gray-200 rounded-md outline-none" />
                                <span className="text-gray-400 text-xs">-</span>
                                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-2 h-7 text-xs border border-gray-200 rounded-md outline-none" />
                                <button onClick={handleApplyCustom} className="px-3 h-7 bg-blue-500 text-white text-xs font-medium rounded-lg ml-1 hover:bg-blue-600 transition-colors">Áp dụng</button>
                            </div>
                        )}
                        {(period === 'year' || period === 'quarter' || period === 'month') && (
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1 bg-white">
                                {period === 'month' && (
                                    <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="px-2 h-7 text-xs border-r border-gray-200 outline-none bg-transparent">
                                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>Tháng {m}</option>
                                        ))}
                                    </select>
                                )}
                                {period === 'quarter' && (
                                    <select value={selectedQuarter} onChange={e => setSelectedQuarter(Number(e.target.value))} className="px-2 h-7 text-xs border-r border-gray-200 outline-none bg-transparent">
                                        {[1, 2, 3, 4].map(q => (
                                            <option key={q} value={q}>Quý {q}</option>
                                        ))}
                                    </select>
                                )}
                                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="px-2 h-7 text-xs outline-none bg-transparent">
                                    {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(y => (
                                        <option key={y} value={y}>Năm {y}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1 bg-white">
                            {PERIODS.map(p => (
                                <button key={p} onClick={() => handlePeriod(p)}
                                    className={`px-4 h-7 text-sm rounded-lg transition-colors ${period === p ? 'bg-gray-900 text-white font-medium' : 'text-gray-500 hover:text-gray-800'
                                        }`}>
                                    {p === 'custom' ? 'Tùy chỉnh' : t(`report.periods.${p}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabs + Export */}
                <div className="flex items-end justify-between border-b border-gray-200 print:hidden">
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
                    <button onClick={() => window.print()}
                        className="mb-3 px-4 h-9 bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        In bản thống kê (Xem trước)
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

            <PrintLayout activeTab={activeTab} period={period} fromDate={fromDate} toDate={toDate} tab1Data={tab1Data} tab2Data={tab2Data} t={t} />
        </OwnerLayout>
    );
}

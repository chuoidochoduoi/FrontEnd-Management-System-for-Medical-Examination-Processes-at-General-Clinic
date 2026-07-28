// src/pages/owner/SchedulePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { useSchedule } from '@/hooks/useSchedule';

const DAY_KEYS = ['mon','tue','wed','thu','fri','sat','sun'];

/* ── Helpers ── */
function getMonday(d = new Date()) {
    const day = d.getDay() || 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - day + 1);
    return mon;
}
function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}
function fmtDate(d) {
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}
function toISO(d) {
    return d.toISOString().split('T')[0];
}

/* ── Modal base ── */
function Modal({ title, subtitle, onClose, children, footer, wide = false }) {
    const ref = useRef(null);
    useEffect(() => {
        const fn = e => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, []);
    return (
        <div ref={ref} onClick={e => e.target === ref.current && onClose()}
             className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl shadow-xl ${wide ? 'w-full max-w-lg' : 'w-full max-w-sm'}`}>
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors ml-4"><X size={17}/></button>
                </div>
                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">{children}</div>
                {footer && <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">{footer}</div>}
            </div>
        </div>
    );
}

/* ── Assign Staff Modal ── */
function AssignModal({ shiftName, dayLabel, selectedIds, staff, onToggle, onClose, t }) {
    const [query, setQuery] = useState('');
    const doctors = staff.filter(s => s.role === 'BS');
    const nurses  = staff.filter(s => s.role === 'YT');
    const receptionists = staff.filter(s => s.role === 'RECEPTIONIST');
    const cashiers = staff.filter(s => s.role === 'CASHIER');
    const filter  = (list) => list.filter(s => !query || s.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <Modal
            title={t('scheduleManagement.assignModal.title')}
            subtitle={`${shiftName} - ${dayLabel}`}
            onClose={onClose}
            footer={
                <button onClick={onClose}
                        className="px-6 h-9 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors">
                    {t('scheduleManagement.assignModal.done')}
                </button>
            }
        >
            {/* Search */}
            <div className="relative mb-4">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                       placeholder={t('scheduleManagement.assignModal.searchPlaceholder')}
                       className="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500" />
            </div>

            {/* Bác sĩ */}
            {filter(doctors).length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 mb-2">{t('scheduleManagement.assignModal.doctorGroup')}</p>
                    <div className="space-y-1">
                        {filter(doctors).map((s, i) => {
                            const selected = selectedIds.includes(s.id);
                            return (
                                <div key={s.id || i} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                                    <p className="text-sm text-gray-800">{s.name}</p>
                                    <button onClick={() => onToggle(s.id, !selected)}
                                            className={`px-3 h-7 text-xs font-medium rounded-lg transition-colors ${
                                                selected
                                                    ? 'bg-gray-900 text-white'
                                                    : 'border border-gray-300 text-gray-600 hover:border-gray-500'
                                            }`}>
                                        {selected ? t('scheduleManagement.assignModal.selectedBtn') : t('scheduleManagement.assignModal.selectBtn')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Y tá */}
            {filter(nurses).length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-gray-400 mb-2">{t('scheduleManagement.assignModal.nurseGroup')}</p>
                    <div className="space-y-1">
                        {filter(nurses).map((s, i) => {
                            const selected = selectedIds.includes(s.id);
                            return (
                                <div key={s.id || i} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                                    <p className="text-sm text-gray-800">{s.name}</p>
                                    <button onClick={() => onToggle(s.id, !selected)}
                                            className={`px-3 h-7 text-xs font-medium rounded-lg transition-colors ${
                                                selected
                                                    ? 'bg-gray-900 text-white'
                                                    : 'border border-gray-300 text-gray-600 hover:border-gray-500'
                                            }`}>
                                        {selected ? t('scheduleManagement.assignModal.selectedBtn') : t('scheduleManagement.assignModal.selectBtn')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Lễ tân */}
            {filter(receptionists).length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-gray-400 mb-2">{t('scheduleManagement.assignModal.receptionistGroup')}</p>
                    <div className="space-y-1">
                        {filter(receptionists).map((s, i) => {
                            const selected = selectedIds.includes(s.id);
                            return (
                                <div key={s.id || i} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                                    <p className="text-sm text-gray-800">{s.name}</p>
                                    <button onClick={() => onToggle(s.id, !selected)}
                                            className={`px-3 h-7 text-xs font-medium rounded-lg transition-colors ${
                                                selected
                                                    ? 'bg-gray-900 text-white'
                                                    : 'border border-gray-300 text-gray-600 hover:border-gray-500'
                                            }`}>
                                        {selected ? t('scheduleManagement.assignModal.selectedBtn') : t('scheduleManagement.assignModal.selectBtn')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Thu ngân */}
            {filter(cashiers).length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-gray-400 mb-2">{t('scheduleManagement.assignModal.cashierGroup')}</p>
                    <div className="space-y-1">
                        {filter(cashiers).map((s, i) => {
                            const selected = selectedIds.includes(s.id);
                            return (
                                <div key={s.id || i} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                                    <p className="text-sm text-gray-800">{s.name}</p>
                                    <button onClick={() => onToggle(s.id, !selected)}
                                            className={`px-3 h-7 text-xs font-medium rounded-lg transition-colors ${
                                                selected
                                                    ? 'bg-gray-900 text-white'
                                                    : 'border border-gray-300 text-gray-600 hover:border-gray-500'
                                            }`}>
                                        {selected ? t('scheduleManagement.assignModal.selectedBtn') : t('scheduleManagement.assignModal.selectBtn')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </Modal>
    );
}

/* ── Main Page ── */
export default function SchedulePage() {
    const { t } = useTranslation('schedule');
    const { schedule, shifts, staff, weekStart, loading, error, fetchSchedule, assignStaff, copyLastWeek, saveShifts, fetchStaffList } = useSchedule();

    const [monday,         setMonday]         = useState(() => getMonday());
    const [assignCell,     setAssignCell]     = useState(null); // { shiftId, dayKey, shiftName, dayLabel }

    useEffect(() => { fetchSchedule(toISO(monday)); }, [monday]);

    const prevWeek = () => setMonday(prev => addDays(prev, -7));
    const nextWeek = () => setMonday(prev => addDays(prev,  7));

    const weekLabel = `${fmtDate(monday)} – ${fmtDate(addDays(monday, 6))}`;

    const getCellKey = (shiftId, dayKey) => `${shiftId}_${dayKey}`;
    const getCellPeople = (shiftId, dayKey) => schedule[getCellKey(shiftId, dayKey)] ?? [];
    const getSelectedIds = (shiftId, dayKey) => getCellPeople(shiftId, dayKey).map(p => p.id);

    const handleToggle = (staffId, add) => {
        if (!assignCell) return;
        assignStaff(assignCell.shiftId, assignCell.dayKey, staffId, add);
    };

    return (
        <OwnerLayout>
            <div className="px-8 py-8 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-base font-semibold text-gray-900">{t('scheduleManagement.pageTitle')}</h1>
                    <span className="text-xs text-gray-400">{t('scheduleManagement.systemStatus')}</span>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Week nav */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 h-10">
                        <button onClick={prevWeek} className="text-gray-400 hover:text-gray-700 transition-colors"><ChevronLeft size={15}/></button>
                        <span className="text-sm font-medium text-gray-700 min-w-[130px] text-center">
              {t('scheduleManagement.week')} {weekLabel}
            </span>
                        <button onClick={nextWeek} className="text-gray-400 hover:text-gray-700 transition-colors"><ChevronRight size={15}/></button>
                    </div>

                    <button onClick={copyLastWeek}
                            className="h-10 px-4 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-gray-400 transition-colors whitespace-nowrap ml-auto">
                        {t('scheduleManagement.copyLastWeek')}
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <p className="text-sm text-gray-400 text-center py-12">{t('scheduleManagement.loading')}</p>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-xs font-medium text-gray-400 text-left px-5 py-3 w-28">
                                    {t('scheduleManagement.shift')}
                                </th>
                                {DAY_KEYS.map((dk, i) => (
                                    <th key={dk} className="text-xs font-medium text-gray-500 text-left px-3 py-3 border-l border-gray-100">
                                        {t(`scheduleManagement.days.${dk}`)}
                                        <span className="text-gray-300 ml-1.5">{fmtDate(addDays(monday, i))}</span>
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {shifts.map(shift => (
                                <tr key={shift.id} className="border-b border-gray-50 last:border-0">
                                    {/* Shift label */}
                                    <td className="px-5 py-4 align-top">
                                        <p className="text-xs font-semibold text-gray-700">{shift.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{shift.startTime} – {shift.endTime}</p>
                                    </td>

                                    {/* Day cells */}
                                    {DAY_KEYS.map((dk, di) => {
                                        const people = getCellPeople(shift.id, dk);
                                        const dayLabel = `${t(`scheduleManagement.days.${dk}`)} ${fmtDate(addDays(monday, di))}`;
                                        return (
                                            <td key={dk} className="px-3 py-3 align-top border-l border-gray-100 min-w-[120px]">
                                                <div className="space-y-1">
                                                    {people.map((p, pi) => (
                                                        <div key={p.id || pi}
                                                             className="text-xs text-gray-800 bg-gray-50 rounded px-2 py-1 flex items-center justify-between gap-1">
                                                            <span>{p.name} <span className="text-gray-400">({p.role})</span></span>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            fetchStaffList(); // Load staff when opening modal
                                                            setAssignCell({ shiftId: shift.id, dayKey: dk, shiftName: shift.name, dayLabel });
                                                        }}
                                                        className="text-xs text-primary-500 hover:text-primary-600 transition-colors mt-1">
                                                        {t('scheduleManagement.addPerson')}
                                                    </button>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            {/* Modals */}
            {assignCell && (
                <AssignModal
                    t={t}
                    shiftName={assignCell.shiftName}
                    dayLabel={assignCell.dayLabel}
                    selectedIds={getSelectedIds(assignCell.shiftId, assignCell.dayKey)}
                    staff={staff}
                    onToggle={handleToggle}
                    onClose={() => setAssignCell(null)}
                />
            )}
        </OwnerLayout>
    );
}

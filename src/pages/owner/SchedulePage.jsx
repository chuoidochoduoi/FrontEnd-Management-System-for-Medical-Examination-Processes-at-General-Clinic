// src/pages/owner/SchedulePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
import OwnerLayout from '@/components/layout/OwnerLayout';
import AdminLayout from '@/components/layout/AdminLayout';
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
function AssignModal({ shiftName, dayLabel, selectedIds, staff, assigning, onToggle, onClose, t }) {
    const [query, setQuery] = useState('');
    const doctors = staff.filter(s => s.role === 'BS');
    const nurses  = staff.filter(s => s.role === 'YT');
    const receptionists = staff.filter(s => s.role === 'RECEPTIONIST');
    const cashiers = staff.filter(s => s.role === 'CASHIER');
    const managers = staff.filter(s => s.role === 'CLINIC_MANAGER' || s.role === 'QL');
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
                                    <button disabled={assigning} onClick={() => onToggle(s.id, !selected)}
                                            className={`px-3 h-7 text-xs font-medium rounded-lg transition-colors ${
                                                selected
                                                    ? 'bg-gray-900 text-white'
                                                    : 'border border-gray-300 text-gray-600 hover:border-gray-500'
                                            } disabled:cursor-not-allowed disabled:opacity-50`}>
                                        {selected ? t('scheduleManagement.assignModal.removeBtn') : t('scheduleManagement.assignModal.selectBtn')}
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
                                    <button disabled={assigning} onClick={() => onToggle(s.id, !selected)}
                                            className={`px-3 h-7 text-xs font-medium rounded-lg transition-colors ${
                                                selected
                                                    ? 'bg-gray-900 text-white'
                                                    : 'border border-gray-300 text-gray-600 hover:border-gray-500'
                                            } disabled:cursor-not-allowed disabled:opacity-50`}>
                                        {selected ? t('scheduleManagement.assignModal.removeBtn') : t('scheduleManagement.assignModal.selectBtn')}
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
                                    <button disabled={assigning} onClick={() => onToggle(s.id, !selected)}
                                            className={`px-3 h-7 text-xs font-medium rounded-lg transition-colors ${
                                                selected
                                                    ? 'bg-gray-900 text-white'
                                                    : 'border border-gray-300 text-gray-600 hover:border-gray-500'
                                            } disabled:cursor-not-allowed disabled:opacity-50`}>
                                        {selected ? t('scheduleManagement.assignModal.removeBtn') : t('scheduleManagement.assignModal.selectBtn')}
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
                                    <button disabled={assigning} onClick={() => onToggle(s.id, !selected)}
                                            className={`px-3 h-7 text-xs font-medium rounded-lg transition-colors ${
                                                selected
                                                    ? 'bg-gray-900 text-white'
                                                    : 'border border-gray-300 text-gray-600 hover:border-gray-500'
                                            } disabled:cursor-not-allowed disabled:opacity-50`}>
                                        {selected ? t('scheduleManagement.assignModal.removeBtn') : t('scheduleManagement.assignModal.selectBtn')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quản lý phòng khám */}
            {filter(managers).length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-gray-400 mb-2">QUẢN LÝ PHÒNG KHÁM</p>
                    <div className="space-y-1">
                        {filter(managers).map((s, i) => {
                            const selected = selectedIds.includes(s.id);
                            return (
                                <div key={s.id || i} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                                    <p className="text-sm text-gray-800">{s.name}</p>
                                    <button disabled={assigning} onClick={() => onToggle(s.id, !selected)}
                                            className={`px-3 h-7 text-xs font-medium rounded-lg transition-colors ${selected
                                                ? 'bg-gray-900 text-white'
                                                : 'border border-gray-300 text-gray-600 hover:border-gray-500'} disabled:cursor-not-allowed disabled:opacity-50`}>
                                        {selected ? t('scheduleManagement.assignModal.removeBtn') : t('scheduleManagement.assignModal.selectBtn')}
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
    const { schedule, shifts, staff, coverage, weekStart, loading, copying, assigning, error, fetchSchedule, assignStaff, copyLastWeek, fetchStaffList } = useSchedule();
    const [searchParams] = useSearchParams();
    const [view, setView] = useState('professional');
    const [departments, setDepartments] = useState([]);
    const [departmentId, setDepartmentId] = useState(searchParams.get('departmentId') || '');

    const [monday,         setMonday]         = useState(() => getMonday());
    const [assignCell,     setAssignCell]     = useState(null); // { shiftId, dayKey, shiftName, dayLabel }
    const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);
    const readOnly = false;

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments/admin?page=0&size=200`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}` },
        }).then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
                const rooms = data.content || [];
                setDepartments(rooms);
                if (!departmentId && rooms.length) setDepartmentId(rooms[0].departmentId);
            }).catch(() => setDepartments([]));
    }, []);

    useEffect(() => {
        if (view === 'professional' && !departmentId) return;
        fetchSchedule(toISO(monday), view === 'professional'
            ? { departmentId, staffGroup: 'PROFESSIONAL' }
            : { staffGroup: 'GENERAL' });
    }, [monday, view, departmentId]);

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

    const handleCopyLastWeek = () => {
        const targetHasSchedule = Object.values(schedule).some(people => (people || []).length > 0);
        if (targetHasSchedule) {
            setCopyConfirmOpen(true);
            return;
        }
        copyLastWeek();
    };

    const confirmCopyLastWeek = () => {
        setCopyConfirmOpen(false);
        copyLastWeek();
    };

    const selectedDepartment = departments.find(room => room.departmentId === departmentId);
    const eligibleStaff = view === 'professional'
        ? staff.filter(person => person.departmentId === departmentId && ['BS', 'YT'].includes(person.role))
        : staff.filter(person => ['RECEPTIONIST', 'CASHIER', 'CLINIC_MANAGER', 'LT', 'TN', 'QL'].includes(person.role));
    const systemRole = localStorage.getItem('systemRole') || sessionStorage.getItem('systemRole');
    const Layout = systemRole === 'ADMIN' ? AdminLayout : OwnerLayout;

    return (
        <Layout>
            <div className="px-8 py-8 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">Phân công lịch trực</h1>
                        <p className="mt-1 text-xs text-gray-400">Nhân sự thuộc phòng được cấu hình trước, sau đó mới phân vào từng ngày và ca.</p>
                    </div>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                        {t('scheduleManagement.systemStatus')}
                    </span>
                </div>

                {/* Toolbar */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex rounded-xl bg-gray-100 p-1">
                            <button onClick={() => setView('professional')}
                                    className={`rounded-lg px-4 py-2 text-sm ${view === 'professional' ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                                Phòng chuyên môn
                            </button>
                            <button onClick={() => setView('general')}
                                    className={`rounded-lg px-4 py-2 text-sm ${view === 'general' ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                                Vận hành chung
                            </button>
                        </div>
                        {view === 'professional' && (
                            <select value={departmentId} onChange={e => setDepartmentId(e.target.value)}
                                    className="h-10 min-w-[280px] rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary-400">
                                {departments.map(room => <option key={room.departmentId} value={room.departmentId}>
                                    {room.roomCode} — {room.name}
                                </option>)}
                            </select>
                        )}
                    </div>
                    {view === 'professional' && selectedDepartment && (
                        <div className="grid gap-3 rounded-xl bg-blue-50/60 p-3 text-xs text-gray-600 sm:grid-cols-3">
                            <span><b>Phụ trách chuyên môn:</b> {selectedDepartment.headDoctor?.fullName || 'Chưa chọn'}</span>
                            <span><b>Nhân sự phòng:</b> {selectedDepartment.doctors?.length || 0} bác sĩ, {selectedDepartment.nurses?.length || 0} y tá</span>
                            <span><b>Phân lịch:</b> mỗi ca tối đa 1 bác sĩ</span>
                        </div>
                    )}
                    {view === 'general' && (
                        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                            <span>Mỗi ca từ <b>Thứ Hai đến Chủ nhật</b> cần có ít nhất <b>01 lễ tân (LT)</b> và <b>01 thu ngân (TN)</b>. Ca thiếu người sẽ được cảnh báo để quản lý bổ sung trước khi vận hành.</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Week nav */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 h-10">
                        <button onClick={prevWeek} className="text-gray-400 hover:text-gray-700 transition-colors"><ChevronLeft size={15}/></button>
                        <span className="text-sm font-medium text-gray-700 min-w-[130px] text-center">
              {t('scheduleManagement.week')} {weekLabel}
            </span>
                        <button onClick={nextWeek} className="text-gray-400 hover:text-gray-700 transition-colors"><ChevronRight size={15}/></button>
                    </div>

                    {!readOnly && <button onClick={handleCopyLastWeek} disabled={copying || loading}
                            className="h-10 px-4 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-gray-400 transition-colors whitespace-nowrap ml-auto disabled:cursor-not-allowed disabled:opacity-60">
                        {copying ? t('scheduleManagement.loading') : t('scheduleManagement.copyLastWeek')}
                    </button>}
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
                                        const cellCoverage = coverage[getCellKey(shift.id, dk)];
                                        const examinationRoom = selectedDepartment?.departmentType === 'EXAMINATION';
                                        const hasProfessionalCoverage = cellCoverage?.status === 'COVERED';
                                        const hasReceptionist = people.some(person => ['LT', 'RECEPTIONIST'].includes(person.role));
                                        const hasCashier = people.some(person => ['TN', 'CASHIER'].includes(person.role));
                                        const missingOperationalRoles = [
                                            !hasReceptionist ? 'RECEPTIONIST' : null,
                                            !hasCashier ? 'CASHIER' : null,
                                        ].filter(Boolean);
                                        const operationalCoverageStatus = missingOperationalRoles.length === 0
                                            ? 'COVERED'
                                            : 'MISSING_OPERATIONAL_ROLE';
                                        const dayLabel = `${t(`scheduleManagement.days.${dk}`)} ${fmtDate(addDays(monday, di))}`;
                                        return (
                                            <td key={dk} className="px-3 py-3 align-top border-l border-gray-100 min-w-[120px]">
                                                <div className="space-y-1">
                                                    {view === 'professional' && (
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${hasProfessionalCoverage
                                                            ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {examinationRoom
                                                                ? (hasProfessionalCoverage ? 'Đủ bác sĩ' : 'Thiếu bác sĩ')
                                                                : (hasProfessionalCoverage ? 'Đủ nhân sự chuyên môn' : 'Thiếu nhân sự chuyên môn')}
                                                        </span>
                                                    )}
                                                    {view === 'general' && (
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${operationalCoverageStatus === 'COVERED'
                                                            ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                            {operationalCoverageStatus === 'COVERED'
                                                                ? 'Đủ LT · TN'
                                                                : `Thiếu ${[
                                                                    missingOperationalRoles.includes('RECEPTIONIST') ? 'lễ tân' : null,
                                                                    missingOperationalRoles.includes('CASHIER') ? 'thu ngân' : null,
                                                                ].filter(Boolean).join(' và ') || 'nhân sự vận hành'}`}
                                                        </span>
                                                    )}
                                                    {people.map((p, pi) => (
                                                        <div key={p.id || pi}
                                                             className="text-xs text-gray-800 bg-gray-50 rounded px-2 py-1 flex items-center justify-between gap-1">
                                                            <span className="min-w-0 truncate">{p.name} <span className="text-gray-400">({p.role})</span></span>
                                                            {!readOnly && (
                                                                <button
                                                                    type="button"
                                                                    disabled={assigning}
                                                                    onClick={() => assignStaff(shift.id, dk, p.id, false)}
                                                                    title={t('scheduleManagement.assignModal.removeBtn')}
                                                                    aria-label={`${t('scheduleManagement.assignModal.removeBtn')} ${p.name}`}
                                                                    className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                                                                >
                                                                    <X size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {!readOnly && <button
                                                        onClick={() => {
                                                            fetchStaffList(); // Load staff when opening modal
                                                            setAssignCell({ shiftId: shift.id, dayKey: dk, shiftName: shift.name, dayLabel });
                                                        }}
                                                        className="text-xs text-primary-500 hover:text-primary-600 transition-colors mt-1">
                                                        {t('scheduleManagement.addPerson')}
                                                    </button>}
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
                    staff={eligibleStaff}
                    assigning={assigning}
                    onToggle={handleToggle}
                    onClose={() => setAssignCell(null)}
                />
            )}
            {copyConfirmOpen && (
                <Modal
                    title="Xác nhận sao chép lịch trực"
                    subtitle={`Tuần đích ${weekLabel} đã có phân công`}
                    onClose={() => !copying && setCopyConfirmOpen(false)}
                    footer={(
                        <>
                            <button
                                type="button"
                                disabled={copying}
                                onClick={() => setCopyConfirmOpen(false)}
                                className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Giữ lịch hiện tại
                            </button>
                            <button
                                type="button"
                                disabled={copying}
                                onClick={confirmCopyLastWeek}
                                className="h-11 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                            >
                                {copying ? 'Đang sao chép...' : 'Thay bằng lịch tuần trước'}
                            </button>
                        </>
                    )}
                >
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={19} className="mt-0.5 shrink-0" />
                            <p>
                                Toàn bộ phân công đang có trong tuần này sẽ được thay bằng lịch của tuần trước.
                                Hệ thống ghi đè có kiểm soát và không cộng thêm bản ghi trùng.
                            </p>
                        </div>
                    </div>
                </Modal>
            )}
        </Layout>
    );
}

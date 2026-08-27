// src/pages/staff/MySchedulePage.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import CashierLayout from '@/components/layout/CashierLayout';

/* ── Helpers (same as SchedulePage) ── */
function getMonday(d = new Date()) {
    const day = d.getDay() || 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - day + 1);
    return mon;
}
function addDays(date, n) {
    const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function fmtDate(d) {
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}
function toISO(d) { return d.toISOString().split('T')[0]; }

const DAY_KEYS = ['mon','tue','wed','thu','fri','sat','sun'];

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

export default function MySchedulePage() {
    const { t } = useTranslation('schedule');

    const [monday,  setMonday]  = useState(() => getMonday());
    const [shifts,  setShifts]  = useState([]);
    const [schedule,setSchedule]= useState({});
    const [myId,    setMyId]    = useState(get('accountId') ?? '');
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const weekLabel = `${fmtDate(monday)} – ${fmtDate(addDays(monday, 6))}`;

    useEffect(() => { fetchMySchedule(monday); }, [monday]);

    const fetchMySchedule = async (mon) => {
        setLoading(true); setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/staff/my-schedule?week=${toISO(mon)}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('scheduleManagement.errors.loadFailed'));
            const data = await res.json();
            setShifts(data.shifts   ?? []);
            setSchedule(data.schedule ?? {});
            if (data.myStaffId) setMyId(data.myStaffId);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const getCellPeople = (shiftId, dayKey) =>
        schedule[`${shiftId}_${dayKey}`] ?? [];

    // Kiểm tra ô có nhân viên hiện tại không
    const isMyShift = (shiftId, dayKey) =>
        getCellPeople(shiftId, dayKey).some(p => String(p.id) === String(myId));

    // Đếm ca trực trong tuần của mình
    const myShiftCount = shifts.reduce((acc, shift) =>
        acc + DAY_KEYS.filter(dk => isMyShift(shift.id, dk)).length, 0);

    // Chọn layout dựa vào systemRole
    const systemRole = get('systemRole')?.toUpperCase();
    const Layout = systemRole === 'RECEPTIONIST' ? ReceptionistLayout :
                   systemRole === 'CASHIER' ? CashierLayout : MedicalStaffLayout;

    return (
        <Layout>
            <div className="px-8 py-8 space-y-5">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">
                            {t('scheduleManagement.pageTitle')}
                        </h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {t('scheduleManagement.personalWeek', { week: weekLabel })}
                        </p>
                    </div>
                    {/* My shift count badge (Hidden) */}
                    <div className="text-right hidden">
                        <p className="text-xs text-gray-400">{t('scheduleManagement.myShiftCount')}</p>
                        <p className="text-2xl font-bold text-primary-500 mt-0.5">{t('scheduleManagement.shiftCount', { count: myShiftCount })}</p>
                    </div>
                </div>

                {/* Week nav */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 h-10">
                        <button onClick={() => setMonday(prev => addDays(prev, -7))}
                                className="text-gray-400 hover:text-gray-700 transition-colors">
                            <ChevronLeft size={15}/>
                        </button>
                        <span className="text-sm font-medium text-gray-700 min-w-[130px] text-center">
              {t('scheduleManagement.week')} {weekLabel}
            </span>
                        <button onClick={() => setMonday(prev => addDays(prev, 7))}
                                className="text-gray-400 hover:text-gray-700 transition-colors">
                            <ChevronRight size={15}/>
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 ml-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-primary-500" />
                            <span className="text-xs text-gray-500">{t('scheduleManagement.myShift')}</span>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <p className="text-sm text-gray-400 text-center py-12">{t('scheduleManagement.loading')}</p>
                ) : error ? (
                    <p className="text-sm text-red-500 text-center py-12">{error}</p>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-auto">
                        <table className="w-full min-w-[900px] border-collapse">
                            <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-xs font-medium text-gray-400 text-left px-5 py-3 w-28">
                                    {t('scheduleManagement.shift')}
                                </th>
                                {DAY_KEYS.map((dk, i) => {
                                    const dayDate  = addDays(monday, i);
                                    const isToday  = toISO(dayDate) === toISO(new Date());
                                    return (
                                        <th key={dk} className="text-xs text-left px-3 py-3 border-l border-gray-100">
                        <span className={`font-medium ${isToday ? 'text-primary-500' : 'text-gray-500'}`}>
                          {t(`scheduleManagement.days.${dk}`)}
                        </span>
                                            <span className={`ml-1.5 ${isToday ? 'text-primary-400' : 'text-gray-300'}`}>
                          {fmtDate(dayDate)}
                        </span>
                                            {isToday && (
                                                <span className="ml-1.5 text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded-full">
                            {t('scheduleManagement.today')}
                          </span>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                            </thead>
                            <tbody>
                            {shifts.map((shift, si) => (
                                <tr key={shift.id || si} className="border-b border-gray-50 last:border-0">
                                    {/* Shift label */}
                                    <td className="px-5 py-4 align-top">
                                        <p className="text-xs font-semibold text-gray-700">{shift.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{shift.startTime} – {shift.endTime}</p>
                                    </td>

                                    {/* Day cells */}
                                    {DAY_KEYS.map((dk, di) => {
                                        const people  = getCellPeople(shift.id, dk);
                                        const mine    = isMyShift(shift.id, dk);
                                        return (
                                            <td
                                                key={`${shift.id || si}_${dk}`}
                                                className={`px-3 py-3 align-top border-l border-gray-100 min-w-[120px] transition-colors ${
                                                    mine ? 'bg-primary-50' : ''
                                                }`}
                                            >
                                                {people.length === 0 ? (
                                                    <span className="text-xs text-gray-200">—</span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {people.map((p, pi) => {
                                                            const isMe = String(p.id) === String(myId);
                                                            return (
                                                                <div
                                                                    key={p.id || pi}
                                                                    className={`text-xs rounded px-2 py-1.5 flex items-center gap-1.5 ${
                                                                        isMe
                                                                            ? 'bg-primary-500 text-white font-semibold'
                                                                            : 'bg-gray-100 text-gray-600'
                                                                    }`}
                                                                >
                                                                    {isMe && <span>👤</span>}
                                                                    <span>{p.name}</span>
                                                                    <span className={`text-xs ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                                      ({p.role})
                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </Layout>
    );
}

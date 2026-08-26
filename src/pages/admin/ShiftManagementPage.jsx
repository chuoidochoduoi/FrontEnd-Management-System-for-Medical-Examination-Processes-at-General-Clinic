import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Clock, History, Plus, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';

const apiBase = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const authHeaders = (json = false) => ({ Authorization: `Bearer ${token()}`, ...(json ? { 'Content-Type': 'application/json' } : {}) });
const tomorrow = () => { const date = new Date(); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10); };
const monthValue = () => new Date().toISOString().slice(0, 7);
const timeOptions = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const readJson = async response => { const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.message || data?.error || 'Request failed'); return data?.data ?? data; };

export default function ShiftManagementPage() {
    const [tab, setTab] = useState('shifts');
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [shiftModal, setShiftModal] = useState(null);
    const [versionModal, setVersionModal] = useState(null);
    const [historyModal, setHistoryModal] = useState(null);
    const [history, setHistory] = useState([]);
    const [month, setMonth] = useState(monthValue());
    const [exceptions, setExceptions] = useState([]);
    const [exceptionForm, setExceptionForm] = useState(null);
    const [impact, setImpact] = useState(null);
    const [coverageShift, setCoverageShift] = useState('');
    const [coverageDate, setCoverageDate] = useState(tomorrow());
    const [coverage, setCoverage] = useState(null);
    const [saving, setSaving] = useState(false);

    const loadShifts = async () => {
        setLoading(true);
        try { setShifts(await readJson(await fetch(`${apiBase}/api/v1/shifts`, { headers: authHeaders() })) || []); }
        catch (error) { toast.error(error.message); }
        finally { setLoading(false); }
    };

    const monthRange = useMemo(() => {
        const [year, value] = month.split('-').map(Number);
        return { first: `${month}-01`, last: new Date(year, value, 0).toISOString().slice(0, 10), days: new Date(year, value, 0).getDate(), startDay: (new Date(year, value - 1, 1).getDay() + 6) % 7 };
    }, [month]);

    const loadExceptions = async () => {
        try { setExceptions(await readJson(await fetch(`${apiBase}/api/v1/clinic-schedule/exceptions?from=${monthRange.first}&to=${monthRange.last}`, { headers: authHeaders() })) || []); }
        catch (error) { toast.error(error.message); }
    };

    useEffect(() => { loadShifts(); }, []);
    useEffect(() => { if (tab === 'calendar') loadExceptions(); }, [tab, month]);

    const saveShift = async form => {
        setSaving(true);
        try {
            const editing = Boolean(form.shiftId);
            const body = editing ? { name: form.name.trim(), isActive: form.isActive } : { name: form.name.trim(), startTime: form.startTime, endTime: form.endTime, isActive: form.isActive };
            await readJson(await fetch(`${apiBase}/api/v1/shifts${editing ? `/${form.shiftId}` : ''}`, { method: editing ? 'PUT' : 'POST', headers: authHeaders(true), body: JSON.stringify(body) }));
            toast.success(editing ? 'Shift updated' : 'Shift created'); setShiftModal(null); await loadShifts();
        } catch (error) { toast.error(error.message); } finally { setSaving(false); }
    };

    const previewVersion = async form => {
        try { const data = await readJson(await fetch(`${apiBase}/api/v1/shifts/${form.shiftId}/versions/impact?effectiveFrom=${form.effectiveFrom}`, { headers: authHeaders() })); setVersionModal(current => ({ ...current, impact: data })); }
        catch (error) { toast.error(error.message); }
    };

    const saveVersion = async form => {
        setSaving(true);
        try {
            await readJson(await fetch(`${apiBase}/api/v1/shifts/${form.shiftId}/versions`, { method: 'POST', headers: authHeaders(true), body: JSON.stringify({ startTime: form.startTime, endTime: form.endTime, effectiveFrom: form.effectiveFrom, changeReason: form.changeReason }) }));
            toast.success('New working hours scheduled'); setVersionModal(null); await loadShifts();
        } catch (error) { toast.error(error.message); } finally { setSaving(false); }
    };

    const openHistory = async shift => {
        setHistoryModal(shift);
        try { setHistory(await readJson(await fetch(`${apiBase}/api/v1/shifts/${shift.shiftId}/versions`, { headers: authHeaders() })) || []); }
        catch (error) { toast.error(error.message); }
    };

    const previewException = async form => {
        try { setImpact(await readJson(await fetch(`${apiBase}/api/v1/clinic-schedule/exceptions/impact`, { method: 'POST', headers: authHeaders(true), body: JSON.stringify(form) }))); }
        catch (error) { toast.error(error.message); }
    };

    const saveException = async form => {
        setSaving(true);
        try { await readJson(await fetch(`${apiBase}/api/v1/clinic-schedule/exceptions`, { method: 'POST', headers: authHeaders(true), body: JSON.stringify(form) })); toast.success('Clinic calendar updated'); setExceptionForm(null); setImpact(null); await loadExceptions(); }
        catch (error) { toast.error(error.message); } finally { setSaving(false); }
    };

    const reopen = async id => {
        try { await readJson(await fetch(`${apiBase}/api/v1/clinic-schedule/exceptions/${id}`, { method: 'DELETE', headers: authHeaders() })); toast.success('Working day reopened'); await loadExceptions(); }
        catch (error) { toast.error(error.message); }
    };

    const loadCoverage = async () => {
        if (!coverageShift || !coverageDate) return;
        try { setCoverage(await readJson(await fetch(`${apiBase}/api/v1/clinic-schedule/coverage?date=${coverageDate}&shiftId=${coverageShift}`, { headers: authHeaders() }))); }
        catch (error) { toast.error(error.message); }
    };

    const openDay = date => {
        if (date < tomorrow()) return toast.info('Only future dates can be configured');
        setImpact(null); setExceptionForm({ workDate: date, shiftId: null, type: 'CLOSED_DAY', specialStartTime: null, specialEndTime: null, reason: '' });
    };

    return <AdminLayout><div className="max-w-7xl mx-auto space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center"><CalendarClock /></div><div><h1 className="text-xl font-bold text-slate-900">Clinic working schedule</h1><p className="text-sm text-slate-500">Versioned shifts, special days and service coverage</p></div></div><div className="flex rounded-xl bg-slate-100 p-1"><Tab active={tab === 'shifts'} onClick={() => setTab('shifts')}>Shift versions</Tab><Tab active={tab === 'calendar'} onClick={() => setTab('calendar')}>Clinic calendar</Tab></div></section>

        {tab === 'shifts' ? <><div className="flex justify-end"><button onClick={() => setShiftModal({ name: '', startTime: '07:30', endTime: '11:30', isActive: true })} className="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold flex gap-2"><Plus size={17}/>Add shift</button></div><section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{loading ? <p className="text-sm text-slate-500">Loading...</p> : shifts.map(shift => <article key={shift.shiftId} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><div className="flex justify-between"><div><p className="font-bold text-slate-900">{shift.name}</p><p className="mt-2 text-2xl font-light text-slate-700">{shift.startTime} – {shift.endTime}</p></div><span className={`h-fit px-2 py-1 rounded-full text-xs font-semibold ${shift.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{shift.isActive ? 'ACTIVE' : 'INACTIVE'}</span></div><div className="mt-5 pt-4 border-t flex flex-wrap gap-2"><SmallButton onClick={() => setShiftModal({ ...shift })}>Edit identity</SmallButton><SmallButton primary onClick={() => setVersionModal({ shiftId: shift.shiftId, shiftName: shift.name, startTime: shift.startTime, endTime: shift.endTime, effectiveFrom: tomorrow(), changeReason: '', impact: null })}><Clock size={14}/>Schedule hours</SmallButton><SmallButton onClick={() => openHistory(shift)}><History size={14}/>History</SmallButton></div></article>)}</section></>
        : <section className="grid xl:grid-cols-[1.4fr_1fr] gap-6"><div className="bg-white border border-slate-200 rounded-2xl p-5"><div className="flex justify-between items-center mb-5"><div><h2 className="font-bold">Monthly calendar</h2><p className="text-xs text-slate-500">Select a future day to configure it</p></div><input type="month" value={month} onChange={e => setMonth(e.target.value)} className="border rounded-lg px-3 py-2 text-sm"/></div><div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-2">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => <span key={day}>{day}</span>)}</div><div className="grid grid-cols-7 gap-2">{Array.from({ length: monthRange.startDay }).map((_, i) => <div key={`blank-${i}`}/>)}{Array.from({ length: monthRange.days }, (_, i) => { const date = `${month}-${String(i + 1).padStart(2, '0')}`; const dayItems = exceptions.filter(item => item.workDate === date); return <button key={date} onClick={() => openDay(date)} className={`min-h-24 rounded-xl border p-2 text-left ${date < tomorrow() ? 'bg-slate-50 text-slate-300' : 'hover:border-primary-400'} ${dayItems.some(e => e.type === 'CLOSED_DAY') ? 'bg-red-50 border-red-200' : ''}`}><span className="text-sm font-bold">{i + 1}</span>{dayItems.map(e => <span key={e.exceptionId} className="block mt-1 px-1.5 py-1 rounded bg-white/80 text-[10px] truncate">{e.type === 'CLOSED_DAY' ? 'Closed day' : `${e.shiftName}: ${e.type === 'SHIFT_OFF' ? 'Off' : `${e.specialStartTime?.slice(0,5)}–${e.specialEndTime?.slice(0,5)}`}`}</span>)}</button>; })}</div></div>
            <div className="space-y-5"><div className="bg-white border border-slate-200 rounded-2xl p-5"><h2 className="font-bold flex items-center gap-2"><ShieldAlert size={18}/>Service coverage</h2><div className="grid grid-cols-2 gap-3 mt-4"><input type="date" min={tomorrow()} value={coverageDate} onChange={e => setCoverageDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm"/><select value={coverageShift} onChange={e => setCoverageShift(e.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="">Select shift</option>{shifts.filter(s => s.isActive).map(s => <option key={s.shiftId} value={s.shiftId}>{s.name}</option>)}</select></div><button onClick={loadCoverage} className="mt-3 w-full rounded-lg bg-slate-900 text-white py-2 text-sm font-semibold">Check coverage</button>{coverage && <div className="mt-4"><div className="grid grid-cols-3 gap-2 text-center"><Metric label="Services" value={coverage.totalActiveServices}/><Metric label="Covered" value={coverage.coveredServices} good/><Metric label="Missing" value={coverage.uncoveredServices} bad/></div><div className="mt-3 max-h-64 overflow-auto divide-y">{coverage.services.filter(s => !s.available).map(s => <div key={s.serviceId} className="py-2"><p className="text-xs font-semibold">{s.serviceCode} — {s.serviceName}</p><p className="text-[11px] text-red-600">{s.reason}</p></div>)}</div></div>}</div><div className="bg-white border border-slate-200 rounded-2xl p-5"><h2 className="font-bold">Configured exceptions</h2><div className="mt-3 max-h-72 overflow-auto divide-y">{exceptions.length === 0 ? <p className="text-sm text-slate-400 py-4">No exceptions this month</p> : exceptions.map(item => <div key={item.exceptionId} className="py-3 flex justify-between gap-3"><div><p className="text-sm font-semibold">{item.workDate} · {item.type}</p><p className="text-xs text-slate-500">{item.shiftName || 'Whole clinic'} — {item.reason}</p></div><button onClick={() => reopen(item.exceptionId)} className="text-xs text-primary-600 font-semibold">Reopen</button></div>)}</div></div></div></section>}
    </div>
    {shiftModal && <Modal title={shiftModal.shiftId ? 'Edit shift identity' : 'Create shift'} close={() => setShiftModal(null)}><ShiftForm value={shiftModal} setValue={setShiftModal} editing={Boolean(shiftModal.shiftId)} save={() => saveShift(shiftModal)} saving={saving}/></Modal>}
    {versionModal && <Modal title={`Schedule hours · ${versionModal.shiftName}`} close={() => setVersionModal(null)}><VersionForm value={versionModal} setValue={setVersionModal} preview={() => previewVersion(versionModal)} save={() => saveVersion(versionModal)} saving={saving}/></Modal>}
    {historyModal && <Modal title={`Version history · ${historyModal.name}`} close={() => setHistoryModal(null)}><div className="space-y-3 max-h-[60vh] overflow-auto">{history.map(item => <div key={item.shiftVersionId} className="border rounded-xl p-4"><div className="flex justify-between"><b>{item.startTime?.slice(0,5)} – {item.endTime?.slice(0,5)}</b><span className="text-xs text-slate-500">{item.effectiveFrom} → {item.effectiveTo || 'Present'}</span></div><p className="text-xs text-slate-500 mt-2">{item.changeReason}</p></div>)}</div></Modal>}
    {exceptionForm && <Modal title={`Configure ${exceptionForm.workDate}`} close={() => { setExceptionForm(null); setImpact(null); }}><ExceptionForm value={exceptionForm} setValue={value => { setExceptionForm(value); setImpact(null); }} shifts={shifts} impact={impact} preview={() => previewException(exceptionForm)} save={() => saveException(exceptionForm)} saving={saving}/></Modal>}
    </AdminLayout>;
}

function Tab({ active, onClick, children }) { return <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-semibold ${active ? 'bg-white shadow text-primary-700' : 'text-slate-500'}`}>{children}</button>; }
function SmallButton({ primary, onClick, children }) { return <button onClick={onClick} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 ${primary ? 'bg-primary-50 text-primary-700' : 'border'}`}>{children}</button>; }
function Modal({ title, close, children }) { return <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"><div className="px-6 py-4 border-b flex justify-between"><h2 className="font-bold">{title}</h2><button onClick={close}><X size={19}/></button></div><div className="p-6">{children}</div></div></div>; }
function Field({ label, children }) { return <label className="block"><span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</span>{children}</label>; }
const inputClass = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500';
function ShiftForm({ value, setValue, editing, save, saving }) { return <div className="space-y-4"><Field label="Name"><input className={inputClass} value={value.name} onChange={e => setValue({ ...value, name: e.target.value })}/></Field>{!editing && <div className="grid grid-cols-2 gap-3"><TimeField label="Start" value={value.startTime} onChange={startTime => setValue({ ...value, startTime })}/><TimeField label="End" value={value.endTime} onChange={endTime => setValue({ ...value, endTime })}/></div>}<label className="flex gap-2 text-sm"><input type="checkbox" checked={value.isActive} onChange={e => setValue({ ...value, isActive: e.target.checked })}/>Active</label><SaveButton onClick={save} disabled={saving || !value.name || (!editing && (!value.startTime || !value.endTime))}/></div>; }
function VersionForm({ value, setValue, preview, save, saving }) { return <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><TimeField label="New start" value={value.startTime} onChange={startTime => setValue({ ...value, startTime, impact: null })}/><TimeField label="New end" value={value.endTime} onChange={endTime => setValue({ ...value, endTime, impact: null })}/></div><Field label="Effective from"><input type="date" min={tomorrow()} className={inputClass} value={value.effectiveFrom} onChange={e => setValue({ ...value, effectiveFrom: e.target.value, impact: null })}/></Field><Field label="Change reason"><textarea className={inputClass} rows="3" value={value.changeReason} onChange={e => setValue({ ...value, changeReason: e.target.value })}/></Field><button onClick={preview} className="w-full border rounded-xl py-2.5 text-sm font-semibold flex justify-center gap-2"><RefreshCw size={16}/>Preview impact</button>{value.impact && <Impact value={value.impact}/>}<SaveButton onClick={save} disabled={saving || !value.changeReason || !value.impact || value.impact.blocked}/></div>; }
function ExceptionForm({ value, setValue, shifts, impact, preview, save, saving }) { const requiresShift = value.type !== 'CLOSED_DAY'; const special = value.type === 'SPECIAL_HOURS'; const valid = value.reason && (!requiresShift || value.shiftId) && (!special || value.specialStartTime && value.specialEndTime); return <div className="space-y-4"><Field label="Action"><select className={inputClass} value={value.type} onChange={e => setValue({ ...value, type: e.target.value, shiftId: e.target.value === 'CLOSED_DAY' ? null : '', specialStartTime: null, specialEndTime: null })}><option value="CLOSED_DAY">Close entire clinic</option><option value="SHIFT_OFF">Turn off one shift</option><option value="SPECIAL_HOURS">Special hours for one shift</option></select></Field>{requiresShift && <Field label="Shift"><select className={inputClass} value={value.shiftId || ''} onChange={e => setValue({ ...value, shiftId: e.target.value })}><option value="">Select shift</option>{shifts.filter(s => s.isActive).map(s => <option key={s.shiftId} value={s.shiftId}>{s.name}</option>)}</select></Field>}{special && <div className="grid grid-cols-2 gap-3"><TimeField label="Special start" value={value.specialStartTime || ''} onChange={specialStartTime => setValue({ ...value, specialStartTime })}/><TimeField label="Special end" value={value.specialEndTime || ''} onChange={specialEndTime => setValue({ ...value, specialEndTime })}/></div>}<Field label="Reason"><textarea className={inputClass} rows="3" value={value.reason} onChange={e => setValue({ ...value, reason: e.target.value })}/></Field><button disabled={!valid} onClick={preview} className="w-full border rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">Preview impact</button>{impact && <Impact value={impact}/>}<SaveButton onClick={save} disabled={saving || !valid || !impact || impact.blocked}/></div>; }
function TimeField({ label, value, onChange }) { return <Field label={label}><select className={inputClass} value={value} onChange={e => onChange(e.target.value)}>{timeOptions.map(time => <option key={time}>{time}</option>)}</select></Field>; }
function Impact({ value }) { return <div className={`rounded-xl p-4 text-sm ${value.blocked ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}><b>{value.blocked ? 'Change blocked' : 'Safe to apply'}</b><p className="mt-1">{value.appointmentCount} appointments · {value.staffScheduleCount} staff schedules affected</p></div>; }
function SaveButton({ onClick, disabled }) { return <button onClick={onClick} disabled={disabled} className="w-full rounded-xl bg-primary-600 text-white py-3 text-sm font-bold disabled:opacity-40">Save changes</button>; }
function Metric({ label, value, good, bad }) { return <div className={`rounded-xl p-3 ${good ? 'bg-emerald-50 text-emerald-700' : bad ? 'bg-red-50 text-red-700' : 'bg-slate-50'}`}><p className="text-xl font-bold">{value}</p><p className="text-[10px] uppercase font-semibold">{label}</p></div>; }

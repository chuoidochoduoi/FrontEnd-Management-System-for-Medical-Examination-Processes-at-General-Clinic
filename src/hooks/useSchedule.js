// src/hooks/useSchedule.js
import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

// weekStart: 'YYYY-MM-DD' (Monday)
export function useSchedule() {
    const { t } = useTranslation('schedule');

    const [schedule,   setSchedule]   = useState({});   // { shiftId_dayKey: [{ id, name, role }] }
    const [shifts,     setShifts]     = useState([]);   // [{ id, name, startTime, endTime }]
    const [staff,      setStaff]      = useState([]);   // [{ id, name, role: 'BS'|'YT' }]
    const [weekStart,  setWeekStart]  = useState('');
    const [loading,    setLoading]    = useState(false);
    const [copying,    setCopying]    = useState(false);
    const [assigningKeys, setAssigningKeys] = useState(() => new Set());
    const assigningKeysRef = useRef(new Set());
    const [error,      setError]      = useState('');

    const fetchSchedule = useCallback(async (week) => {
        setLoading(true); setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/clinic-manager/schedules?week=${week}`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('scheduleManagement.errors.loadFailed'));
            const data = await res.json();
            const normalizePerson = person => ({ ...person, id: person.id ?? person.staffId });
            setSchedule(Object.fromEntries(Object.entries(data.schedule ?? {}).map(
                ([key, people]) => [key, (people ?? []).map(normalizePerson)]
            )));
            setShifts(data.shifts ?? []);
            setStaff((data.staff ?? []).map(normalizePerson));
            setWeekStart(week);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    // Gán / bỏ nhân sự vào 1 ô (shiftId + dayKey)
    const assignStaff = async (shiftId, dayKey, staffId, add) => {
        const assignmentKey = `${shiftId}|${dayKey}|${staffId}`;
        if (assigningKeysRef.current.has(assignmentKey)) return;
        assigningKeysRef.current.add(assignmentKey);
        setAssigningKeys(previous => new Set(previous).add(assignmentKey));
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/clinic-manager/schedules/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...bearer() },
                body: JSON.stringify({ week: weekStart, shiftId, dayKey, staffId, action: add ? 'add' : 'remove' }),
            });
            const responseData = await res.json().catch(() => null);
            if (!res.ok) throw new Error(responseData?.message || t('scheduleManagement.errors.saveFailed'));
            const cellKey = `${shiftId}_${dayKey}`;
            setSchedule(prev => {
                const cell = prev[cellKey] ?? [];
                const exists = cell.some(person => (person.id ?? person.staffId) === staffId);
                const selectedStaff = staff.find(person => (person.id ?? person.staffId) === staffId);
                return {
                    ...prev,
                    [cellKey]: add
                        ? (exists || !selectedStaff ? cell : [...cell, { ...selectedStaff, id: staffId }])
                        : cell.filter(person => (person.id ?? person.staffId) !== staffId),
                };
            });
            toast.success(add ? 'Phân công nhân sự thành công!' : 'Gỡ nhân sự khỏi ca thành công!');
        } catch (requestError) { setError(requestError.message); toast.error(requestError.message); }
        finally {
            assigningKeysRef.current.delete(assignmentKey);
            setAssigningKeys(previous => {
                const next = new Set(previous); next.delete(assignmentKey); return next;
            });
        }
    };

    // Sao chép tuần trước
    const copyLastWeek = async () => {
        if (copying || !weekStart) return;
        setCopying(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/clinic-manager/schedules/copy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...bearer() },
                body: JSON.stringify({ week: weekStart }),
            });
            if (!res.ok) throw new Error(t('scheduleManagement.errors.saveFailed'));
            const data = await res.json();
            setSchedule(data.schedule ?? {});
            toast.success('Sao chép lịch tuần trước thành công!');
        } catch (err) { setError(err.message); toast.error(err.message); }
        finally { setCopying(false); }
    };

    // Lấy danh sách nhân sự cho lịch
    const fetchStaffList = useCallback(async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/staff/list`,
                { headers: bearer() }
            );
            if (!res.ok) throw new Error(t('scheduleManagement.errors.loadFailed'));
            const data = await res.json();
            setStaff(data.map(s => ({
                id: s.staffId,
                name: s.fullName,
                role: ['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR'].includes(s.systemRole) ? 'BS' :
                      s.systemRole === 'NURSE' ? 'YT' : s.systemRole,
            })));
        } catch (err) {
            console.error('[fetchStaffList] Error:', err);
            setError(err.message);
        }
    }, []);

    const saveShifts = async (nextShifts = shifts) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/clinic-manager/schedules/shifts`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...bearer() },
                body: JSON.stringify({ shifts: nextShifts }),
            });
            if (!res.ok) throw new Error(t('scheduleManagement.errors.saveFailed'));
            toast.success('Lưu cấu hình ca trực thành công!');
            return true;
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
            return false;
        }
    };

    return { schedule, shifts, staff, weekStart, loading, copying, assigning: assigningKeys.size > 0, error, fetchSchedule, assignStaff, copyLastWeek, saveShifts, fetchStaffList };
}

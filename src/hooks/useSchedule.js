// src/hooks/useSchedule.js
import { useState, useCallback } from 'react';
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
            setSchedule(data.schedule ?? {});
            setShifts(data.shifts ?? []);
            setStaff(data.staff ?? []);
            setWeekStart(week);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    // Gán / bỏ nhân sự vào 1 ô (shiftId + dayKey)
    const assignStaff = async (shiftId, dayKey, staffId, add) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/clinic-manager/schedules/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...bearer() },
                body: JSON.stringify({ week: weekStart, shiftId, dayKey, staffId, action: add ? 'add' : 'remove' }),
            });
            if (!res.ok) throw new Error(t('scheduleManagement.errors.saveFailed'));
            const cellKey = `${shiftId}_${dayKey}`;
            setSchedule(prev => {
                const cell = prev[cellKey] ?? [];
                return {
                    ...prev,
                    [cellKey]: add
                        ? [...cell, staff.find(s => s.id === staffId)].filter(Boolean)
                        : cell.filter(s => s.id !== staffId),
                };
            });
            toast.success(add ? 'Phân công nhân sự thành công!' : 'Gỡ nhân sự khỏi ca thành công!');
        } catch { setError(t('scheduleManagement.errors.saveFailed')); toast.error(t('scheduleManagement.errors.saveFailed')); }
    };

    // Sao chép tuần trước
    const copyLastWeek = async () => {
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
    };

    // Lấy danh sách nhân sự cho lịch
    const fetchStaffList = useCallback(async () => {
        console.log('[fetchStaffList] Fetching staff list from /api/v1/staff/list');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/staff/list`,
                { headers: bearer() }
            );
            console.log('[fetchStaffList] Response status:', res.status);
            if (!res.ok) throw new Error(t('scheduleManagement.errors.loadFailed'));
            const data = await res.json();
            console.log('[fetchStaffList] Data received:', data);
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

    return { schedule, shifts, staff, weekStart, loading, error, fetchSchedule, assignStaff, copyLastWeek, saveShifts, fetchStaffList };
}

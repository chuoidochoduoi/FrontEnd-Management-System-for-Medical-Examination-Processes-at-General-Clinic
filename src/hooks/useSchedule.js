// src/hooks/useSchedule.js
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
            await fetch(`${import.meta.env.VITE_API_URL}/api/v1/clinic-manager/schedules/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...bearer() },
                body: JSON.stringify({ week: weekStart, shiftId, dayKey, staffId, action: add ? 'add' : 'remove' }),
            });
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
        } catch { setError(t('scheduleManagement.errors.saveFailed')); }
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
        } catch (err) { setError(err.message); }
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
                role: s.systemRole === 'GENERAL_DOCTOR' || s.systemRole === 'SPECIALIST_DOCTOR' ? 'BS' :
                      s.systemRole === 'NURSE' ? 'YT' : s.systemRole,
            })));
        } catch (err) {
            console.error('[fetchStaffList] Error:', err);
            setError(err.message);
        }
    }, []);

    // Lưu cấu hình ca - không cho sửa
    const saveShifts = async () => {
        // Placeholder - not implemented
        console.log('saveShifts - not implemented');
    };

    return { schedule, shifts, staff, weekStart, loading, error, fetchSchedule, assignStaff, copyLastWeek, saveShifts, fetchStaffList };
}
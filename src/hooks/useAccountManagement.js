// src/hooks/useAccountManagement.js
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const PAGE_SIZE = 10;

export function useStaffList() {
    const { t } = useTranslation('admin');
    const [staff,   setStaff]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [total,   setTotal]   = useState(0);
    const [page,    setPage]    = useState(0);

    const fetchStaff = useCallback(async ({ search = '', page = 0 } = {}) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ search, page, size: PAGE_SIZE });
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/staff?${params}`, { headers: bearer() });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || t('accountManagement.errors.loadFailed'));
            }
            const data = await res.json();
            // Spring Data format: { content: [...], totalElements: N, ... }
            setStaff(Array.isArray(data.content) ? data.content : []);
            setTotal(data.totalElements ?? 0);
            setPage(data.page ?? page);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    const addStaff = async (payload) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            let msg = t('accountManagement.errors.saveFailed');
            try { const errData = await res.json(); msg = errData.message || errData.error || msg; } catch(e){}
            throw new Error(msg);
        }
        return await res.json();
    };

    const lockStaff = async (id) => {
        await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/${id}/lock`, { method: 'PATCH', headers: bearer() });
        await fetchStaff({ page });
    };

    const updateStaff = async (id, payload) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            let msg = t('accountManagement.errors.saveFailed');
            try { const errData = await res.json(); msg = errData.message || errData.error || msg; } catch(e){}
            throw new Error(msg);
        }
        await fetchStaff({ page });
    };

    const updateStaffFull = async (staffId, payload) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${staffId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            let msg = t('accountManagement.errors.saveFailed');
            try { const errData = await res.json(); msg = errData.message || errData.error || msg; } catch(e){}
            throw new Error(msg);
        }
        await fetchStaff({ page });
    };

    const fetchStaffByAccountId = async (accountId) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/account/${accountId}`, { headers: bearer() });
        if (!res.ok) throw new Error("Không thể tải thông tin nhân sự");
        return await res.json();
    };

    const resetPassword = async (accountId, newPassword) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/${accountId}/password-reset`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify({ newPassword }),
        });
        if (!res.ok) throw new Error("Lỗi khi đặt lại mật khẩu");
    };

    return { staff, loading, error, total, page, PAGE_SIZE, fetchStaff, addStaff, lockStaff, updateStaff, updateStaffFull, fetchStaffByAccountId, resetPassword };
}

export function usePatientList() {
    const { t } = useTranslation('admin');
    const [patients, setPatients] = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [total,    setTotal]    = useState(0);
    const [page,     setPage]     = useState(0);

    const fetchPatients = useCallback(async ({ search = '', status = '', page = 0 } = {}) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ search, status, page, size: PAGE_SIZE });
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/customers?${params}`, { headers: bearer() });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || t('accountManagement.errors.loadFailed'));
            }
            const data = await res.json();
            // Spring Data format: { content: [...], totalElements: N, ... }
            setPatients(Array.isArray(data.content) ? data.content : []);
            setTotal(data.totalElements ?? 0);
            setPage(data.page ?? page);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    const updatePatient = async (id, payload) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(t('accountManagement.errors.saveFailed'));
        await fetchPatients({ page });
    };

    const lockPatient = async (id) => {
        await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/${id}/lock`, { method: 'PATCH', headers: bearer() });
        await fetchPatients({ page });
    };

    const resetPassword = async (accountId, newPassword) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/${accountId}/password-reset`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify({ newPassword }),
        });
        if (!res.ok) throw new Error("Lỗi khi đặt lại mật khẩu");
    };

    return { patients, loading, error, total, page, PAGE_SIZE, fetchPatients, updatePatient, lockPatient, resetPassword };
}

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
            console.log('[fetchStaff] Response:', data);
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
        if (!res.ok) throw new Error(t('accountManagement.errors.saveFailed'));
        return await res.json();
    };

    const lockStaff = async (id) => {
        await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/${id}/lock`, { method: 'POST', headers: bearer() });
        await fetchStaff({ page });
    };

    return { staff, loading, error, total, page, PAGE_SIZE, fetchStaff, addStaff, lockStaff };
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
            console.log('[fetchPatients] Response:', data);
            // Spring Data format: { content: [...], totalElements: N, ... }
            setPatients(Array.isArray(data.content) ? data.content : []);
            setTotal(data.totalElements ?? 0);
            setPage(data.page ?? page);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    const updatePatient = async (id, payload) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/customers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(t('accountManagement.errors.saveFailed'));
        return await res.json();
    };

    const lockPatient = async (id) => {
        await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/${id}/lock`, { method: 'POST', headers: bearer() });
        await fetchPatients({ page });
    };

    return { patients, loading, error, total, page, PAGE_SIZE, fetchPatients, updatePatient, lockPatient };
}
// src/hooks/useAccountManagement.js
import { useState, useCallback } from "react";
import axios from "@/lib/axios";

export const useStaffList = () => {
    const [staff, setStaff] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStaff = useCallback(async ({ search = "", page = 0, size = 7 } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("/api/v1/staff", {
                params: { search, page, size },
            });
            const data = res.data?.data || res.data;
            const rawList = data.content || data.items || (Array.isArray(data) ? data : []);

            const mappedStaff = rawList.map((item) => ({
                accountId: item.profile?.accountId || item.accountId || item.staffId,
                staffId: item.staffId,
                code: item.staffCode || item.code || "-",
                fullNameOrDepartment: item.profile?.fullName || item.fullName || "-",
                username: item.profile?.username || item.username || "-",
                systemRole: item.systemRole || "-",
                isActive: item.profile?.isActive ?? item.isActive ?? true,
            }));

            setStaff(mappedStaff);
            setTotal(data.totalElements || data.total || mappedStaff.length || 0);
            setPage(data.page ?? page);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStaffByAccountId = useCallback(async (accountId) => {
        const res = await axios.get(`/api/v1/staff/account/${accountId}`);
        return res.data?.data || res.data;
    }, []);

    const addStaff = async (staffData) => {
        const res = await axios.post("/api/v1/staff", staffData);
        return res.data?.data || res.data;
    };

    const updateStaffFull = async (staffId, staffData) => {
        const res = await axios.put(`/api/v1/staff/${staffId}`, staffData);
        return res.data?.data || res.data;
    };

    const resetPassword = async (accountId, newPassword) => {
        const res = await axios.put(`/api/v1/accounts/${accountId}/reset-password`, { newPassword });
        return res.data;
    };

    const lockStaff = async (accountId) => {
        const res = await axios.put(`/api/v1/accounts/${accountId}/toggle-status`);
        fetchStaff();
        return res.data;
    };

    return {
        staff,
        total,
        page,
        loading,
        error,
        fetchStaff,
        fetchStaffByAccountId,
        addStaff,
        updateStaffFull,
        resetPassword,
        lockStaff,
    };
};

export const usePatientList = () => {
    const [patients, setPatients] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPatients = useCallback(async ({ search = "", status = "", page = 0, size = 7 } = {}) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("/api/v1/patients", {
                params: { search, status: status || undefined, page, size },
            }).catch(() => null);

            if (res && res.data) {
                const data = res.data?.data || res.data;
                setPatients(data.content || data.items || []);
                setTotal(data.totalElements || data.total || 0);
                setPage(data.page ?? page);
            } else {
                setPatients([]);
                setTotal(0);
            }
        } catch (err) {
            setPatients([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, []);

    const lockPatient = async (accountId) => {
        const res = await axios.put(`/api/v1/accounts/${accountId}/toggle-status`);
        fetchPatients();
        return res.data;
    };

    return {
        patients,
        total,
        page,
        loading,
        error,
        fetchPatients,
        lockPatient,
    };
};
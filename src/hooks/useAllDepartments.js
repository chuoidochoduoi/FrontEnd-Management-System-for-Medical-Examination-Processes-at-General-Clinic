// src/hooks/useAllDepartments.js
import { useState, useEffect, useCallback } from 'react';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

/**
 * Fetches all departments and groups them by type.
 * Calls API once for each type since backend doesn't support multiple values.
 */
export function useAllDepartments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Map API status to UI format
    const mapStatusToUI = (status) => {
        const statusMap = {
            AVAILABLE: 'available',
            IN_SESSION: 'occupied',
            MAINTENANCE: 'maintenance',
        };
        return statusMap[status] || 'available';
    };

    // Map DepartmentType to room type for display
    const DEPT_TO_ROOM_TYPE = {
        EXAMINATION: 'examination',
        LABORATORY: 'lab',
        IMAGING: 'imaging',
    };

    // Map room types to DepartmentType enum
    const ROOM_TO_DEPT_TYPE = {
        examination: 'EXAMINATION',
        surgery: 'EXAMINATION',
        lab: 'LABORATORY',
        imaging: 'IMAGING',
    };

    useEffect(() => {
        const fetchDepartments = async () => {
            setLoading(true);
            setError(null);
            try {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                const token = get('token');

                const res = await fetch(`${apiBase}/api/v1/departments/clinical?page=0&size=100`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();
                const items = data.content ?? data.items ?? [];
                setDepartments(items);
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    // Fetch doctors for department head selection
    const fetchDoctors = useCallback(async () => {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const token = get('token');

        const res = await fetch(`${apiBase}/api/v1/departments/doctors`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
            throw new Error('Failed to fetch doctors');
        }

        const data = await res.json();
        return Array.isArray(data) ? data : (data.content ?? []);
    }, []);

    // Create department
    const createDepartment = useCallback(async (payload) => {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const token = get('token');

        const body = {
            roomCode: payload.roomCode,
            name: payload.name,
            departmentType: payload.departmentType || ROOM_TO_DEPT_TYPE[payload.type] || 'EXAMINATION',
            status: payload.status || 'AVAILABLE',
            description: payload.description || '',
            headDoctorId: payload.headDoctorId || null,
        };

        const res = await fetch(`${apiBase}/api/v1/departments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Failed to create department');
        }

        // Refresh departments after create
        const refreshRes = await fetch(`${apiBase}/api/v1/departments/clinical?page=0&size=100`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const items = refreshData.content ?? refreshData.items ?? [];
            setDepartments(items);
        }

        return await res.json();
    }, []);

    // Grouped by type
    const examinationRooms = departments.filter(d => d.departmentType === 'EXAMINATION');
    const laboratoryRooms = departments.filter(d => d.departmentType === 'LABORATORY');
    const imagingRooms = departments.filter(d => d.departmentType === 'IMAGING');

    // Map for UI consumption (for allRooms)
    const allRooms = [...examinationRooms, ...laboratoryRooms, ...imagingRooms].map(d => ({
        id: d.departmentId,
        roomCode: d.roomCode || d.departmentId?.substring(0, 8) || '---',
        name: d.name,
        type: DEPT_TO_ROOM_TYPE[d.departmentType] || d.departmentType?.toLowerCase() || 'examination',
        status: mapStatusToUI(d.status),
        headDoctor: d.headDoctor?.fullName || '',
        headDoctorId: d.headDoctor?.staffId || d.headDoctorId || '',
        description: d.description || '',
        departmentType: d.departmentType,
    }));

    return {
        departments,
        examinationRooms,
        laboratoryRooms,
        imagingRooms,
        allRooms,
        loading,
        error,
        fetchDoctors,
        createDepartment,
    };
}

export default useAllDepartments;
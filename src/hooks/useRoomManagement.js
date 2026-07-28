// src/hooks/useRoomManagement.js
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const PAGE_SIZE = 20;

// Map API status to UI status
const STATUS_MAP = {
    AVAILABLE:   'available',
    IN_SESSION:  'occupied',
    MAINTENANCE: 'maintenance',
};

// Map room types to DepartmentType enum (backend only supports EXAMINATION, LABORATORY, IMAGING)
const ROOM_TO_DEPT_TYPE = {
    examination: 'EXAMINATION',
    surgery: 'EXAMINATION',
    lab: 'LABORATORY',
    imaging: 'IMAGING',
    reception: 'EXAMINATION',  // Map to EXAMINATION if backend doesn't support
    cashier: 'EXAMINATION',    // Map to EXAMINATION if backend doesn't support
};

// Map DepartmentType to room type for display
const DEPT_TO_ROOM_TYPE = {
    EXAMINATION: 'examination',
    LABORATORY: 'lab',
    IMAGING: 'imaging',
    RECEPTION: 'reception',
    CASHIER: 'cashier',
};

// Map room types to department type for API filter (array of types)
const ROOM_TYPE_TO_DEPT_TYPES = {
    examination: ['EXAMINATION'],
    surgery: ['EXAMINATION'],
    lab: ['LABORATORY'],
    imaging: ['IMAGING'],
};

export function useRoomManagement() {
    const { t } = useTranslation('rooms');
    const [rooms, setRooms] = useState([]);
    const [stats, setStats] = useState({ total: 0, occupied: 0, maintenance: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchRooms = useCallback(async ({ type = '', page = 0, status = '' } = {}) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams();

            // Handle departmentTypes filter - support array for multiple types
            if (type) {
                const deptTypes = ROOM_TYPE_TO_DEPT_TYPES[type] || [ROOM_TO_DEPT_TYPE[type] || type];
                deptTypes.forEach(dt => params.append('departmentTypes', dt));
            }

            // Handle status filter
            if (status) {
                const statusMap = {
                    available: 'AVAILABLE',
                    occupied: 'IN_SESSION',
                    maintenance: 'MAINTENANCE',
                };
                params.append('status', statusMap[status] || status);
            }

            params.append('page', page);
            params.append('size', PAGE_SIZE);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments/admin?${params}`, { headers: bearer() });
            console.log('[fetchRooms] Response status:', res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('[fetchRooms] Error:', errorText);
                throw new Error(t('roomManagement.errors.loadFailed'));
            }

            const data = await res.json();
            console.log('[fetchRooms] Data:', data);

            // API returns paginated response
            const deptList = Array.isArray(data) ? data : (data.content ?? []);

            // Map API response to room format for UI
            const mapped = deptList.map(d => ({
                id: d.departmentId,
                roomCode: d.roomCode || d.departmentId?.substring(0, 8) || '---',
                name: d.name,
                type: DEPT_TO_ROOM_TYPE[d.departmentType] || d.departmentType?.toLowerCase() || 'examination',
                status: STATUS_MAP[d.status] || 'available',
                doctor: d.headDoctor?.fullName || '',
                equipment: d.description || '',
            }));

            setRooms(mapped);

            // Calculate stats from actual data
            const occupied = mapped.filter(r => r.status === 'occupied').length;
            const maintenance = mapped.filter(r => r.status === 'maintenance').length;

            setStats({
                total: data.totalElements || mapped.length,
                occupied,
                maintenance,
            });

            return data;
        } catch (err) {
            console.error('[fetchRooms] Catch error:', err);
            setError(err.message);
        } finally { setLoading(false); }
    }, [t]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const createRoom = async (payload) => {
        const deptType = ROOM_TO_DEPT_TYPE[payload.type] || payload.type;
        const body = {
            roomCode: payload.roomCode || '',
            name: payload.name,
            departmentType: deptType,
            status: 'AVAILABLE',
            description: payload.description || payload.doctor || '',
            headDoctorId: payload.doctorId || payload.headDoctorId || null,
        };

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(t('roomManagement.errors.saveFailed'));
        fetchRooms();
    };

    const updateRoom = async (id, payload) => {
        const body = {};
        if (payload.roomCode) body.roomCode = payload.roomCode;
        if (payload.name) body.name = payload.name;
        // description maps to equipment in old form, or description directly
        if (payload.description !== undefined || payload.equipment !== undefined) {
            body.description = payload.description || payload.equipment || '';
        }
        if (payload.type) {
            body.departmentType = ROOM_TO_DEPT_TYPE[payload.type] || payload.type;
        }
        if (payload.status) {
            const statusMap = {
                available: 'AVAILABLE',
                occupied: 'IN_SESSION',
                maintenance: 'MAINTENANCE',
            };
            body.status = statusMap[payload.status] || payload.status;
        }
        if (payload.doctorId !== undefined) {
            body.headDoctorId = payload.doctorId;
        }
        if (payload.headDoctorId !== undefined) {
            body.headDoctorId = payload.headDoctorId;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(t('roomManagement.errors.saveFailed'));
        fetchRooms();
    };

    const deleteRoom = async (id) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments/admin/${id}`, {
            method: 'DELETE', headers: bearer(),
        });
        if (!res.ok) throw new Error(t('roomManagement.errors.saveFailed'));
        fetchRooms();
    };

    const quickStatus = async (id, status) => {
        const statusMap = {
            available: 'AVAILABLE',
            occupied: 'IN_SESSION',
            maintenance: 'MAINTENANCE',
        };
        const apiStatus = statusMap[status] || status;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify({ status: apiStatus }),
        });
        if (!res.ok) throw new Error(t('roomManagement.errors.saveFailed'));
        fetchRooms();
    };

    // Fetch doctors for department head selection
    const fetchDoctors = useCallback(async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments/doctors`, {
            headers: bearer(),
        });
        if (!res.ok) throw new Error('Failed to fetch doctors');
        const data = await res.json();
        return Array.isArray(data) ? data : (data.content ?? []);
    }, [t]);

    return { rooms, stats, loading, error, fetchRooms, createRoom, updateRoom, deleteRoom, quickStatus, fetchDoctors };
}
// src/hooks/useRoomManagement.js
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
// Danh mục phòng có quy mô nhỏ và màn hình hiện không có điều khiển phân trang.
// Tải đầy đủ để không làm ẩn các phòng nằm sau trang đầu.
const PAGE_SIZE = 100;

// Map API status to UI status
const STATUS_MAP = {
    AVAILABLE:   'available',
    IN_SESSION:  'occupied',
    MAINTENANCE: 'maintenance',
};

// Phòng chỉ có 2 nhóm; kỹ thuật cụ thể được cấu hình bằng capability.
const ROOM_TO_DEPT_TYPE = {
    examination: 'EXAMINATION',
    paraclinical: 'PARACLINICAL',
    reception: 'EXAMINATION',  // Map to EXAMINATION if backend doesn't support
    cashier: 'EXAMINATION',    // Map to EXAMINATION if backend doesn't support
};

// Map DepartmentType to room type for display
const DEPT_TO_ROOM_TYPE = {
    EXAMINATION: 'examination',
    PARACLINICAL: 'paraclinical',
    LABORATORY: 'paraclinical',
    IMAGING: 'paraclinical',
    RECEPTION: 'reception',
    CASHIER: 'cashier',
};

// Map room types to department type for API filter (array of types)
const ROOM_TYPE_TO_DEPT_TYPES = {
    examination: ['EXAMINATION'],
    paraclinical: ['PARACLINICAL', 'LABORATORY', 'IMAGING'],
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

            if (!res.ok) {
                const errorText = await res.text();
                console.error('[fetchRooms] Error:', errorText);
                throw new Error(t('roomManagement.errors.loadFailed'));
            }

            const data = await res.json();

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
                headDoctorId: d.headDoctor?.staffId || null,
                doctors: d.doctors || [],
                doctorsOnDuty: d.doctorsOnDuty || [],
                nursesOnDuty: d.nursesOnDuty || [],
                coverageStatus: d.coverageStatus || 'UNASSIGNED',
                specializationId: d.specializationId || null,
                specializationName: d.specializationName || '',
                nurses: d.nurses || [],
                capabilityIds: (d.capabilities || []).map(c => c.capabilityId),
                capabilities: d.capabilities || [],
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
            status: ({ available: 'AVAILABLE', occupied: 'IN_SESSION', maintenance: 'MAINTENANCE' })[payload.status]
                || payload.status || 'AVAILABLE',
            description: payload.description || payload.doctor || '',
            headDoctorId: payload.doctorId || payload.headDoctorId || null,
            doctorIds: payload.doctorIds || [],
            specializationId: payload.specializationId || null,
            nurseIds: payload.nurseIds || [],
            capabilityIds: payload.capabilityIds || [],
        };

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || data?.error || t('roomManagement.errors.saveFailed'));
        }
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
        if (payload.doctorIds !== undefined) {
            body.doctorIds = payload.doctorIds;
        }
        if (payload.nurseIds !== undefined) {
            body.nurseIds = payload.nurseIds;
        }
        if (payload.specializationId !== undefined) {
            body.specializationId = payload.specializationId || null;
        }
        if (payload.capabilityIds !== undefined) body.capabilityIds = payload.capabilityIds;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...bearer() },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || data?.error || t('roomManagement.errors.saveFailed'));
        }
        fetchRooms();
    };

    const deleteRoom = async (id) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments/${id}`, {
            method: 'DELETE', headers: bearer(),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || data?.error || t('roomManagement.errors.saveFailed'));
        }
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
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || data?.error || t('roomManagement.errors.saveFailed'));
        }
        fetchRooms();
        toast.success('Cập nhật trạng thái phòng thành công!');
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

    // Fetch nurses for department assignment
    const fetchNurses = useCallback(async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments/nurses`, {
            headers: bearer(),
        });
        if (!res.ok) throw new Error('Failed to fetch nurses');
        const data = await res.json();
        return Array.isArray(data) ? data : (data.content ?? []);
    }, [t]);

    return { rooms, stats, loading, error, fetchRooms, createRoom, updateRoom, deleteRoom, quickStatus, fetchDoctors, fetchNurses };
}

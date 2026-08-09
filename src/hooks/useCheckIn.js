// src/hooks/useCheckIn.js
import { useState, useCallback } from 'react';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

// Map API response (AppointmentResponse) to component format
const mapAppointment = (appt) => {
    if (!appt) return null;

    // Map status to lowercase for component compatibility
    const status = appt.status
        ? appt.status.toString().toLowerCase()
        : '';

    // Map gender
    const genderMap = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };
    const gender = appt.guestGender
        ? genderMap[appt.guestGender] || appt.guestGender
        : '';

    return {
        id: appt.appointmentId,
        code: appt.appointmentId?.toString().slice(0, 8) || '',
        patientName: appt.customerName || appt.guestFullName || '',
        phone: appt.guestPhone || '',
        age: appt.guestAge || '',
        gender,
        address: appt.guestAddress || '',
        status,
        timeSlot: appt.timeSlot || '',
        scheduledAt: appt.scheduledAt || '',
        services: appt.services || [],
        ...appt, // Include original fields for backward compatibility
    };
};

export function useCheckIn() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState('');

    const fetchAppointments = useCallback(async ({ customerId, status, date, timeSlot } = {}) => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (customerId) params.set('customerId', customerId);
            if (status) params.set('status', status);

            // Xử lý date -> from/to (LocalDateTime)
            if (date) {
                // Backend yêu cầu 'from' và 'to', ta gửi cùng ngày
                // Format: YYYY-MM-DDTHH:MM:SS
                const from = `${date}T00:00:00`;
                const to = `${date}T23:59:59`;
                params.set('from', from);
                params.set('to', to);
            }
            params.set('sort', 'createdAt,desc'); // Sắp xếp mới nhất đến cũ nhất

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/appointments?${params}`,
                {
                    headers: {
                        Authorization: `Bearer ${get('token')}`,
                    },
                }
            );
            if (!res.ok) throw new Error('Không thể tải danh sách lịch hẹn.');
            const data = await res.json();
            // Ensure data is always an array (handle paginated response with 'content' or { data: [...] } response)
            const appointmentsArray = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
            // Map API response to component format
            const mappedAppointments = appointmentsArray.map(mapAppointment).filter(Boolean);
            setAppointments(mappedAppointments);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    }, []);

    return { appointments, loading, error, fetchAppointments };
}

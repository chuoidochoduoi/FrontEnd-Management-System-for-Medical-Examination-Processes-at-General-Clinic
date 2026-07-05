// src/hooks/useCheckIn.js
import { useState, useCallback } from 'react';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

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
            setAppointments(data);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    }, []);

    return { appointments, loading, error, fetchAppointments };
}
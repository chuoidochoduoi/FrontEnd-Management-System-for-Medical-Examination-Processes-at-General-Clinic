// src/hooks/useAppointment.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { validateAppointment } from '@/validators/appointmentValidator';

// Helper: chuyển đổi date + timeSlot thành scheduledAt (LocalDateTime format)
const buildScheduledAt = (date, timeSlot) => {
    if (!date || !timeSlot) return null;
    const [year, month, day] = date.split('-');
    // morning -> 09:00, afternoon -> 14:00
    const hour = timeSlot === 'morning' ? '09:00:00' : '14:00:00';
    return `${year}-${month}-${day}T${hour}`;
};

// Helper: chuyển đổi timeSlot sang format Enum backend (MORNING, AFTERNOON)
const toTimeSlotEnum = (timeSlot) => {
    if (!timeSlot) return null;
    return timeSlot.toUpperCase();
};

export function useAppointment() {
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fetch danh sách dịch vụ khi mount
    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services/available`);
                if (!res.ok) throw new Error('Không thể tải danh sách dịch vụ.');
                const data = await res.json();
                // Map API response để component sử dụng được
                const mappedServices = (data.content || []).map(s => ({
                    id: s.serviceId,
                    name: s.name,
                    description: s.description,
                    price: s.price,
                    department: s.departmentName,
                    categoryName: s.categoryName,
                    durationMinutes: s.durationMinutes,
                    serviceType: s.serviceType,
                }));
                setServices(mappedServices);
            } catch (err) {
                setError(err.message || 'Có lỗi xảy ra khi tải dịch vụ.');
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, []);

    const book = async (formData) => {
        setError('');

        // Validate date/timeSlot để tính scheduledAt
        if (!formData.date) return setError('Vui lòng chọn ngày khám.');
        if (!formData.timeSlot) return setError('Vui lòng chọn khung giờ.');

        const validationError = validateAppointment(formData);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const isLoggedIn = !!token;
            const scheduledAt = buildScheduledAt(formData.date, formData.timeSlot);
            const timeSlotEnum = toTimeSlotEnum(formData.timeSlot);

            // Xây dựng body request dựa trên trạng thái đăng nhập
            const body = isLoggedIn
                ? {
                      customerId: formData.customerId,
                      scheduledAt,
                      cancelReason: formData.cancelReason || null,
                      timeSlot: timeSlotEnum,
                      serviceIds: formData.selectedServices.map(s => s.id),
                  }
                : {
                      guestFullName: formData.fullName,
                      guestPhone: formData.phone,
                      guestAddress: formData.address || null,
                      guestAge: Number(formData.age),
                      guestGender: formData.gender,
                      scheduledAt,
                      timeSlot: timeSlotEnum,
                      serviceIds: formData.selectedServices.map(s => s.id),
                  };

            // Chọn endpoint dựa trên trạng thái đăng nhập
            const endpoint = isLoggedIn
                ? `${import.meta.env.VITE_API_URL}/api/v1/appointments`
                : `${import.meta.env.VITE_API_URL}/api/v1/appointments/guest`;

            // Debug log
            console.log('Appointment API request:', { endpoint, isLoggedIn, customerId: formData.customerId, body });

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorText = await res.text().catch(() => '');
                throw new Error(errorText || 'Đặt lịch thất bại. Vui lòng thử lại.');
            }

            navigate(ROUTES.PROFILE);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    return { services, loadingServices, book, loading, error };
}
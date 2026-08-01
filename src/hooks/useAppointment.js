// src/hooks/useAppointment.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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

// Helper: chuyển đổi gender sang format Enum backend (MALE, FEMALE, OTHER)
const toGenderEnum = (gender) => {
    if (!gender) return null;
    const genderMap = { male: 'MALE', female: 'FEMALE', other: 'OTHER' };
    return genderMap[gender.toLowerCase()] || gender.toUpperCase();
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
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-services/available?size=1000`);
                if (!res.ok) throw new Error('Không thể tải danh sách dịch vụ.');
                const data = await res.json();
                
                const rawList = Array.isArray(data) ? data : (data.content ?? []);
                
                // Map API response để component sử dụng được
                const mappedServices = rawList.map(s => ({
                    id: s.serviceId,
                    name: s.name,
                    description: s.description,
                    price: s.price,
                    department: s.departmentName,
                    categoryName: s.categoryName,
                    durationMinutes: s.durationMinutes,
                    departmentType: s.departmentType,
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
                      guestGender: toGenderEnum(formData.gender),
                      scheduledAt,
                      timeSlot: timeSlotEnum,
                      serviceIds: formData.selectedServices.map(s => s.id),
                  };

            // Chọn endpoint và method dựa trên trạng thái đăng nhập và hành động
            let endpoint = '';
            let method = 'POST';
            
            if (formData.rescheduleApptId && isLoggedIn) {
                endpoint = `${import.meta.env.VITE_API_URL}/api/v1/appointments/my/${formData.rescheduleApptId}`;
                method = 'PUT';
            } else if (isLoggedIn) {
                endpoint = `${import.meta.env.VITE_API_URL}/api/v1/appointments`;
            } else {
                endpoint = `${import.meta.env.VITE_API_URL}/api/v1/appointments/guest`;
            }

            // Debug log
            console.log('Appointment API request:', { endpoint, method, isLoggedIn, customerId: formData.customerId, body });

            const res = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorText = await res.text().catch(() => '');
                let parsedMsg = errorText;
                try {
                    const errorJson = JSON.parse(errorText);
                    parsedMsg = errorJson.message || errorJson.error || errorText;
                } catch (e) {
                    // Not JSON, ignore
                }
                throw new Error(parsedMsg || 'Đặt lịch thất bại. Vui lòng thử lại.');
            }

            toast.success(formData.rescheduleApptId ? 'Đổi lịch thành công!' : 'Đặt lịch thành công! Chúng tôi sẽ liên hệ sớm nhất.');
            return true;
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra.');
            toast.error(err.message || 'Có lỗi xảy ra.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { services, loadingServices, book, loading, error };
}
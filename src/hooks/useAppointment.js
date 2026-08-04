// src/hooks/useAppointment.js
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ROUTES } from '@/constants/routes';
import { validateAppointment } from '@/validators/appointmentValidator';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

// Helper: chuyển đổi date + timeSlot thành scheduledAt (LocalDateTime format)
// Sử dụng giờ bắt đầu ca từ cấu hình shifts (admin cấu hình) thay vì hard-coded
const buildScheduledAt = (date, timeSlot, shifts) => {
    if (!date || !timeSlot) return null;
    const [year, month, day] = date.split('-');

    // Tìm giờ bắt đầu của ca tương ứng từ danh sách shifts được cấu hình
    const shift = shifts.find(s => {
        const name = (s.name || '').toLowerCase();
        return (timeSlot === 'morning' && (name.includes('sáng') || name.includes('morning'))) ||
               (timeSlot === 'afternoon' && (name.includes('chiều') || name.includes('afternoon')));
    });

    // Nếu tìm thấy ca cấu hình, dùng startTime của ca đó; nếu không có, dùng giờ mặc định theo timeSlot
    const hour = shift?.startTime || null;
    if (!hour) {
        const defaultHour = timeSlot === 'morning' || timeSlot === 'MORNING' ? '09:00:00' : '14:00:00';
        return `${year}-${month}-${day}T${defaultHour}`;
    }
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

    // Shift configuration (admin-configured hours, not hardcoded)
    const [shifts, setShifts] = useState([]);
    const [shiftLoading, setShiftLoading] = useState(false);

    // Map shifts to morning/afternoon hours for display
    const shiftHours = shifts.reduce((acc, shift) => {
        const name = (shift.name || '').toLowerCase();
        if (name.includes('sáng') || name.includes('morning')) {
            acc.morning = { start: shift.startTime, end: shift.endTime };
        } else if (name.includes('chiều') || name.includes('afternoon')) {
            acc.afternoon = { start: shift.startTime, end: shift.endTime };
        }
        return acc;
    }, {});

    // Fetch danh sách dịch vụ và cấu hình ca (shifts) khi mount
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
                    capabilityName: s.requiredCapabilityName || '',
                    minimumAge: s.minimumAge ?? 0,
                    maximumAge: s.maximumAge ?? 120,
                    allowedGender: s.allowedGender || '',
                    specializationName: s.requiredSpecializationName || '',
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

    // Fetch cấu hình ca trực (admin cấu hình giờ sáng/chiều) để không hard-code
    const fetchShifts = async () => {
        setShiftLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/shifts`, { headers: bearer() });
            if (res.ok) {
                const data = await res.json();
                const rawShifts = Array.isArray(data) ? data : (data.shifts ?? data.content ?? []);
                setShifts(rawShifts.map(s => ({
                    id: s.id,
                    name: s.name,
                    startTime: s.startTime,
                    endTime: s.endTime,
                })));
            }
        } catch {
            // silent — shift hours are optional for display
        } finally {
            setShiftLoading(false);
        }
    };

    useEffect(() => { fetchShifts(); }, []);

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
            const scheduledAt = buildScheduledAt(formData.date, formData.timeSlot, shifts);
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

    return { services, loadingServices, book, loading, error, shifts, shiftHours, shiftLoading, fetchShifts };
}

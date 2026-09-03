// src/hooks/useAppointment.js
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ROUTES } from '@/constants/routes';
import { validateAppointment } from '@/validators/appointmentValidator';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });

const getMinimumAppointmentDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 1);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getMaximumAppointmentDate = () => {
    const maximum = new Date();
    maximum.setHours(0, 0, 0, 0);
    maximum.setFullYear(maximum.getFullYear() + 1);
    const year = maximum.getFullYear();
    const month = String(maximum.getMonth() + 1).padStart(2, '0');
    const day = String(maximum.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildScheduledAt = (date, shiftId, shifts) => {
    if (!date || !shiftId) return null;
    const [year, month, day] = date.split('-');

    const shift = shifts.find(s => s.id === shiftId || s.shiftId === shiftId);
    if (!shift) return null;

    const [hour = '00', minute = '00', second = '00'] = String(shift.startTime || '')
        .trim()
        .split(':');
    if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute) || !/^\d{1,2}$/.test(second)) {
        return null;
    }

    const normalizedTime = [hour, minute, second]
        .map(value => value.padStart(2, '0'))
        .join(':');

    return `${year}-${month}-${day}T${normalizedTime}`;
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

    // Fetch danh sách dịch vụ khi mount. Ca khám được tải theo ngày và dịch vụ đã chọn.
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
                    code: s.serviceCode,
                    name: s.name,
                    description: s.description,
                    price: s.price,
                    department: s.departmentName,
                    categoryName: s.categoryName,
                    durationMinutes: s.durationMinutes,
                    workflowPriority: s.workflowPriority ?? 1,
                    departmentType: s.departmentType,
                    capabilityName: s.requiredCapabilityName || '',
                    minimumAge: s.minimumAge ?? 0,
                    maximumAge: s.maximumAge ?? 120,
                    allowedGender: s.allowedGender || '',
                    specializationName: s.requiredSpecializationName || '',
                    relations: s.relations || [],
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
    const fetchShifts = async (date, selectedServiceIds = []) => {
        if (!date) {
            setShifts([]);
            return;
        }
        setShiftLoading(true);

        try {
            const params = new URLSearchParams({ date });
            selectedServiceIds.forEach(id => params.append('serviceIds', id));
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/shifts/available?${params}`);

            if (!res.ok) {
                throw new Error(
                    `Không tải được ca khám (${res.status})`
                );
            }

            const data = await res.json();

            const rawShifts =
                Array.isArray(data)
                    ? data
                    : (
                        data.data ??
                        data.shifts ??
                        data.content ??
                        []
                    );

            const mappedShifts = rawShifts.map(s => ({
                id: s.shiftId || s.id,
                name: s.name,
                startTime: s.startTime,
                endTime: s.endTime,
                available: s.available !== false,
                timeSource: s.timeSource || 'NORMAL',
                unavailableReasonCode: s.unavailableReasonCode || null,
                serviceUnavailableReasons: s.serviceUnavailableReasons || {}
            }));

            console.log(
                'Shifts loaded:',
                mappedShifts
            );

            setShifts(mappedShifts);

        } catch (err) {
            console.error(
                'Load shifts error:',
                err
            );

            setError(
                err.message ||
                'Không thể tải ca khám.'
            );

        } finally {
            setShiftLoading(false);
        }
    };

    const book = async (formData) => {
        setError('');

        if (formData.date && formData.date < getMinimumAppointmentDate()) {
            setError('Lịch hẹn phải được đặt từ ngày mai trở đi.');
            return;
        }
        if (formData.date && formData.date > getMaximumAppointmentDate()) {
            setError('Lịch hẹn chỉ được đặt trước tối đa 12 tháng.');
            return;
        }

        // Validate date/timeSlot để tính scheduledAt
        if (!formData.date) return setError('Vui lòng chọn ngày khám.');
        if (!formData.shiftId) return setError('Vui lòng chọn khung giờ.');

        const validationError = validateAppointment(formData);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const isLoggedIn = !!token;
            const scheduledAt = buildScheduledAt(formData.date, formData.shiftId, shifts);
            if (!scheduledAt) {
                throw new Error('Ca khám đã chọn không còn khả dụng. Vui lòng tải lại và chọn ca khám khác.');
            }
            const selectedShift = shifts.find(s => s.id === formData.shiftId);
            if (!selectedShift?.available) {
                throw new Error('Ca khám không có nhân sự đủ điều kiện cho các dịch vụ đã chọn.');
            }

            // Xây dựng body request dựa trên trạng thái đăng nhập
            const body = isLoggedIn
                ? {
                      patientProfileId: formData.patientProfileId || null,
                      scheduledAt,
                      shiftId: formData.shiftId,
                      serviceIds: formData.selectedServices.map(s => s.id),
                  }
                : {
                      guestFullName: formData.fullName,
                      guestPhone: formData.phone,
                      guestAddress: formData.address || null,
                      guestAge: Number(formData.age),
                      guestGender: toGenderEnum(formData.gender),
                      scheduledAt,
                      shiftId: formData.shiftId,
                      serviceIds: formData.selectedServices.map(s => s.id),
                  };

            // Chọn endpoint và method dựa trên trạng thái đăng nhập và hành động
            let endpoint = '';
            let method = 'POST';

            if (formData.rescheduleApptId && isLoggedIn) {
                endpoint = `${import.meta.env.VITE_API_URL}/api/v1/appointments/my/${formData.rescheduleApptId}`;
                method = 'PUT';
            } else if (isLoggedIn) {
                endpoint = `${import.meta.env.VITE_API_URL}/api/v1/appointments/my`;
            } else {
                endpoint = `${import.meta.env.VITE_API_URL}/api/v1/appointments/guest`;
            }

            // Debug log

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

    const bookGroup = async ({ date, shiftId, members }) => {
        setError('');
        if (!date) return setError('Vui lòng chọn ngày khám.');
        if (!shiftId) return setError('Vui lòng chọn ca khám.');
        if (!Array.isArray(members) || members.length < 2) return setError('Đặt lịch nhóm cần ít nhất hai người.');
        const scheduledAt = buildScheduledAt(date, shiftId, shifts);
        if (!scheduledAt) return setError('Ca khám đã chọn không còn khả dụng.');
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/appointments/my/group`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...bearer() },
                body: JSON.stringify({
                    scheduledAt,
                    shiftId,
                    members: members.map(member => ({
                        patientProfileId: member.patientProfileId,
                        serviceIds: member.services.map(service => service.id),
                    })),
                }),
            });
            const body = await response.json().catch(() => null);
            if (!response.ok) throw new Error(body?.message || body?.error || 'Không thể đặt lịch nhóm.');
            toast.success(`Đã tạo ${members.length} lịch hẹn độc lập cho gia đình.`);
            return true;
        } catch (err) {
            setError(err.message || 'Không thể đặt lịch nhóm.');
            toast.error(err.message || 'Không thể đặt lịch nhóm.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { services, loadingServices, book, bookGroup, loading, error, shifts, shiftLoading, fetchShifts };
}

// src/validators/appointmentValidator.js

// Regex phone cho cả VN (0...) và (+84...)
const PHONE_REGEX = /^(\+84|0)[3|5|7|8|9][0-9]{8}$/;

export function validateAppointment({ fullName, phone, age, gender, selectedServices, date, timeSlot }) {
    if (!fullName?.trim())               return 'Vui lòng nhập họ và tên.';
    if (!phone)                          return 'Vui lòng nhập số điện thoại.';
    if (!PHONE_REGEX.test(phone))        return 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84).';
    if (!age)                            return 'Vui lòng nhập tuổi.';
    if (isNaN(age) || age < 1 || age > 120) return 'Tuổi không hợp lệ.';
    if (!gender)                         return 'Vui lòng chọn giới tính.';
    if (!selectedServices?.length)       return 'Vui lòng chọn ít nhất một dịch vụ.';
    if (!date)                           return 'Vui lòng chọn ngày khám.';
    if (!timeSlot)                       return 'Vui lòng chọn khung giờ.';
    return null;
}
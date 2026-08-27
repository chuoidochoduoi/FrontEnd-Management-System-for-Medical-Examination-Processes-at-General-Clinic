const PHONE_REGEX = /^(\+84|0)\d{9,10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAppointment({
                                        fullName,
                                        phone,
                                        email,
                                        age,
                                        gender,
                                        selectedServices,
                                        date,
                                        shiftId,
                                        timeSlot
                                    }) {
    if (!fullName?.trim()) {
        return 'Vui lòng nhập họ và tên.';
    }

    const normalizedPhone = phone?.trim() || '';
    const normalizedEmail = email?.trim() || '';

    // Chỉ cần một trong hai
    if (!normalizedPhone && !normalizedEmail) {
        return 'Vui lòng cung cấp số điện thoại hoặc email.';
    }

    // Nếu có số điện thoại thì validate số điện thoại
    if (
        normalizedPhone &&
        !PHONE_REGEX.test(normalizedPhone)
    ) {
        return 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84).';
    }

    // Nếu có email thì validate email
    if (
        normalizedEmail &&
        !EMAIL_REGEX.test(normalizedEmail)
    ) {
        return 'Email không hợp lệ.';
    }

    if (
        age === null ||
        age === undefined ||
        age === ''
    ) {
        return 'Vui lòng nhập tuổi.';
    }

    const numericAge = Number(age);

    if (
        Number.isNaN(numericAge) ||
        numericAge < 1 ||
        numericAge > 120
    ) {
        return 'Tuổi không hợp lệ.';
    }

    if (!gender) {
        return 'Vui lòng chọn giới tính.';
    }

    if (!selectedServices?.length) {
        return 'Vui lòng chọn ít nhất một dịch vụ.';
    }

    if (!date) {
        return 'Vui lòng chọn ngày khám.';
    }

    // Form hiện tại gửi mã ca làm việc;
    // timeSlot giữ để tương thích màn cũ
    if (!shiftId && !timeSlot) {
        return 'Vui lòng chọn khung giờ.';
    }

    return null;
}
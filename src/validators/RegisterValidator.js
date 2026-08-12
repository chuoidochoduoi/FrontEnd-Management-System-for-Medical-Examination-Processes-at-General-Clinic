const PHONE_REGEX = /^(\+84|0)\d{9,10}$/;
const EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

export function validateRegister({ identifier, password, confirmPassword, fullName }) {
    if (!identifier) return 'Vui lòng nhập Email hoặc Số điện thoại.';
    if (!PHONE_REGEX.test(identifier) && !EMAIL_REGEX.test(identifier)) return 'Email hoặc Số điện thoại không hợp lệ.';

    if (!fullName || fullName.trim() === '') return 'Vui lòng nhập họ và tên.';

    if (!password) return 'Vui lòng nhập mật khẩu.';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';

    if (!confirmPassword) return 'Vui lòng xác nhận mật khẩu.';
    if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp.';

    return null;
}

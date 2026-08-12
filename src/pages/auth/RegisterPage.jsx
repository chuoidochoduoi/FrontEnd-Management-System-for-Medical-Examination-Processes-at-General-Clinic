// src/pages/auth/RegisterPage.jsx

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Eye,
    EyeOff,
    ArrowRight,
    Phone,
    Mail,
    Lock,
    Hash,
    User,
    Calendar,
    MapPin
} from 'lucide-react';

import { useRegister } from '@/hooks/useRegister';
import { ROUTES } from '@/constants/routes';
import logoUrl from '@/assets/logo.jpg';

export default function RegisterPage() {
    const navigate = useNavigate();

    // =========================================================
    // STEP
    // 1 = Nhập SĐT hoặc Email
    // 2 = Nhập OTP
    // 3 = Nhập thông tin cá nhân + mật khẩu
    // =========================================================
    const [step, setStep] = useState(1);

    // =========================================================
    // BƯỚC 1
    // =========================================================
    const [registerMethod, setRegisterMethod] = useState('phone');
    const [identifier, setIdentifier] = useState('');

    // =========================================================
    // BƯỚC 2
    // =========================================================
    const [otp, setOtp] = useState('');
    const [countdown, setCountdown] = useState(0);

    // =========================================================
    // BƯỚC 3
    // =========================================================
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('MALE');
    const [address, setAddress] = useState('');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    // =========================================================
    // UI
    // =========================================================
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formError, setFormError] = useState('');

    const intervalRef = useRef(null);

    const {
        sendOtp,
        verifyOtp,
        register,
        loadingSendOtp,
        loadingVerifyOtp,
        loadingRegister,
        error
    } = useRegister();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // =========================================================
    // COUNTDOWN GỬI LẠI OTP
    // =========================================================
    useEffect(() => {
        if (countdown <= 0) {
            clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [countdown]);

    // =========================================================
    // VALIDATE SĐT
    // Khớp backend:
    // ^(\+84|0)\d{9,10}$
    // =========================================================
    const isValidPhone = value => {
        return /^(\+84|0)\d{9,10}$/.test(value.trim());
    };

    // =========================================================
    // VALIDATE EMAIL
    // =========================================================
    const isValidEmail = value => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    };

    // =========================================================
    // BƯỚC 1 - GỬI OTP
    // =========================================================
    const handleSendOtp = async () => {
        setFormError('');

        const value = identifier.trim();

        if (!value) {
            setFormError(
                registerMethod === 'phone'
                    ? 'Vui lòng nhập số điện thoại.'
                    : 'Vui lòng nhập email.'
            );
            return;
        }

        if (registerMethod === 'phone' && !isValidPhone(value)) {
            setFormError('Số điện thoại không hợp lệ.');
            return;
        }

        if (registerMethod === 'email' && !isValidEmail(value)) {
            setFormError('Email không hợp lệ.');
            return;
        }

        const success = await sendOtp(value);

        if (success) {
            setOtp('');
            setStep(2);
            setCountdown(60);
        }
    };

    // =========================================================
    // GỬI LẠI OTP
    // =========================================================
    const handleResendOtp = async () => {
        if (countdown > 0) {
            return;
        }

        const success = await sendOtp(identifier.trim());

        if (success) {
            setCountdown(60);
        }
    };

    // =========================================================
    // BƯỚC 2 - XÁC THỰC OTP
    // =========================================================
    const handleVerifyOtp = async () => {
        setFormError('');

        if (!otp.trim()) {
            setFormError('Vui lòng nhập mã OTP.');
            return;
        }

        if (otp.trim().length !== 6) {
            setFormError('Mã OTP phải gồm 6 số.');
            return;
        }

        const success = await verifyOtp(
            identifier.trim(),
            otp.trim()
        );

        if (success) {
            setStep(3);
            setFormError('');
        }
    };

    // =========================================================
    // VALIDATE BƯỚC 3
    // =========================================================
    const validateProfile = () => {
        setFormError('');

        if (!fullName.trim()) {
            setFormError('Vui lòng nhập họ và tên.');
            return false;
        }

        if (!dob) {
            setFormError('Vui lòng chọn ngày sinh.');
            return false;
        }

        const birthDate = new Date(dob);
        const today = new Date();
        if (birthDate > today) {
            setFormError('Ngày sinh không thể ở trong tương lai.');
            return false;
        }
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age > 150) {
            setFormError('Tuổi không hợp lệ (lớn hơn 150 tuổi).');
            return false;
        }

        if (!gender) {
            setFormError('Vui lòng chọn giới tính.');
            return false;
        }

        if (!password) {
            setFormError('Vui lòng nhập mật khẩu.');
            return false;
        }

        if (password.length < 8) {
            setFormError('Mật khẩu phải có ít nhất 8 ký tự.');
            return false;
        }

        if (password.length > 64) {
            setFormError('Mật khẩu không được vượt quá 64 ký tự.');
            return false;
        }

        if (!confirm) {
            setFormError('Vui lòng xác nhận mật khẩu.');
            return false;
        }

        if (password !== confirm) {
            setFormError('Mật khẩu xác nhận không khớp.');
            return false;
        }

        return true;
    };

    // =========================================================
    // BƯỚC 3 - TẠO TÀI KHOẢN
    // =========================================================
    const handleRegister = async () => {
        if (!validateProfile()) {
            return;
        }

        const profileData = {
            identifier: identifier.trim(),
            password,
            fullName: fullName.trim(),
            dob,
            gender,

            // Nếu đăng ký bằng phone thì lưu phone
            phone:
                registerMethod === 'phone'
                    ? identifier.trim()
                    : '',

            // Nếu đăng ký bằng email thì lưu email
            email:
                registerMethod === 'email'
                    ? identifier.trim().toLowerCase()
                    : '',

            address: address.trim()
        };

        const authData = await register(profileData);

        if (!authData) {
            return;
        }

        // =====================================================
        // AUTO LOGIN
        // =====================================================
        localStorage.setItem(
            'token',
            authData.accessToken
        );

        localStorage.setItem(
            'refreshToken',
            authData.refreshToken
        );

        localStorage.setItem(
            'role',
            authData.account.role
        );

        localStorage.setItem(
            'username',
            authData.account.username
        );

        localStorage.setItem(
            'accountId',
            authData.account.accountId
        );

        localStorage.setItem(
            'systemRole',
            authData.account.systemRole || ''
        );

        // Nếu chưa có route CUSTOMER_APPOINTMENTS
        // thì fallback về booking.
        navigate(
            ROUTES.MY_APPOINTMENTS
        );
    };

    // =========================================================
    // ĐỔI PHƯƠNG THỨC ĐĂNG KÝ
    // =========================================================
    const handleChangeMethod = method => {
        setRegisterMethod(method);
        setIdentifier('');
        setOtp('');
        setFormError('');
    };

    return (
        <div className="font-jakarta selection:bg-primary-900 selection:text-white relative">

            <div className="min-h-screen flex bg-white relative">

                {/* Back Home Desktop */}
                <Link
                    to="/"
                    className="absolute top-8 left-8 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white transition-all duration-300 lg:flex hidden border border-white/20 group"
                >
                    <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                </Link>

                {/* Back Home Mobile */}
                <Link
                    to="/"
                    className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest lg:hidden hover:text-slate-900 transition-colors"
                >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Trang chủ
                </Link>

                {/* =====================================================
                    LEFT SIDE
                ===================================================== */}
                <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">

                    <img
                        src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1600&auto=format&fit=crop"
                        alt="Medical Research"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity animate-slow-zoom"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/30" />

                    <div
                        className="relative z-10 p-16 flex flex-col justify-end h-full w-full animate-fade-in-smooth"
                        style={{ animationDelay: '400ms' }}
                    >

                        <img
                            src={logoUrl}
                            alt="CareS"
                            className="w-16 h-16 rounded-xl object-contain mb-8 shadow-lg shadow-black/20"
                        />

                        <h1 className="text-4xl md:text-5xl font-light text-white leading-tight mb-6">
                            Khởi đầu hành trình <br />

                            <span className="font-bold">
                                Chăm sóc sức khỏe
                            </span>
                        </h1>

                        <p className="text-slate-300 font-light text-lg max-w-md leading-relaxed mb-12">
                            Tạo tài khoản để dễ dàng đặt lịch hẹn,
                            quản lý lịch khám và theo dõi thông tin
                            chăm sóc sức khỏe tại CareS.
                        </p>

                    </div>

                </div>

                {/* =====================================================
                    RIGHT SIDE
                ===================================================== */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-white relative overflow-y-auto">

                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-50/50 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3" />

                    <div
                        className="w-full max-w-[440px] animate-slide-up-fade"
                        style={{ animationDelay: '200ms' }}
                    >

                        {/* =================================================
                            HEADER
                        ================================================= */}
                        <div className="mb-10">

                            <h2 className="text-3xl font-light text-slate-900 mb-3">

                                {step === 1 && 'Đăng ký tài khoản'}

                                {step === 2 && 'Xác thực OTP'}

                                {step === 3 && 'Thông tin cá nhân'}

                            </h2>

                            <p className="text-slate-500 font-light text-sm">

                                {step === 1 &&
                                    'Đăng ký bằng số điện thoại hoặc email của bạn.'
                                }

                                {step === 2 && (
                                    <>
                                        Nhập mã OTP đã được gửi đến{' '}

                                        <span className="font-semibold text-slate-700">
                                            {identifier}
                                        </span>
                                    </>
                                )}

                                {step === 3 &&
                                    'Hoàn tất thông tin để tạo tài khoản.'
                                }

                            </p>

                        </div>

                        <div className="space-y-5">

                            {/* =================================================
                                STEP 1
                            ================================================= */}
                            {step === 1 && (

                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">

                                    {/* METHOD */}
                                    <div className="flex bg-slate-100 p-1 rounded-xl mb-6">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleChangeMethod('phone')
                                            }
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                                registerMethod === 'phone'
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >

                                            <Phone className="w-4 h-4" />

                                            Số điện thoại

                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleChangeMethod('email')
                                            }
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                                registerMethod === 'email'
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >

                                            <Mail className="w-4 h-4" />

                                            Email

                                        </button>

                                    </div>

                                    {/* IDENTIFIER */}
                                    <div>

                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">

                                            {registerMethod === 'phone'
                                                ? 'Số điện thoại'
                                                : 'Email'
                                            }

                                        </label>

                                        <div className="relative">

                                            {registerMethod === 'phone'
                                                ? (
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                )
                                                : (
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                )
                                            }

                                            <input
                                                type={
                                                    registerMethod === 'email'
                                                        ? 'email'
                                                        : 'tel'
                                                }
                                                value={identifier}
                                                onChange={e =>
                                                    setIdentifier(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={
                                                    registerMethod === 'phone'
                                                        ? 'Ví dụ: 0912345678'
                                                        : 'example@gmail.com'
                                                }
                                                className="w-full h-14 pl-11 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-slate-900"
                                            />

                                        </div>

                                    </div>

                                    {(formError || error) && (

                                        <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">

                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />

                                            <p className="text-red-600 text-sm font-medium">
                                                {formError || error}
                                            </p>

                                        </div>

                                    )}

                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={
                                            loadingSendOtp ||
                                            !identifier.trim()
                                        }
                                        className="group relative w-full h-14 mt-6 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl overflow-hidden transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.3)] disabled:shadow-none"
                                    >

                                        <span className="relative z-10 flex items-center justify-center gap-3 text-sm font-bold tracking-[0.1em] uppercase">

                                            {loadingSendOtp
                                                ? 'Đang gửi...'
                                                : (
                                                    <>
                                                        Tiếp tục
                                                        <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )
                                            }

                                        </span>

                                    </button>

                                </div>

                            )}

                            {/* =================================================
                                STEP 2
                            ================================================= */}
                            {step === 2 && (

                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">

                                    <div className="flex justify-between items-center mb-2">

                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                            Mã OTP
                                        </label>

                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={
                                                countdown > 0 ||
                                                loadingSendOtp
                                            }
                                            className="text-[11px] font-bold text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors disabled:text-slate-400"
                                        >

                                            {loadingSendOtp
                                                ? 'Đang gửi...'
                                                : countdown > 0
                                                    ? `Gửi lại sau ${countdown}s`
                                                    : 'Gửi lại mã'
                                            }

                                        </button>

                                    </div>

                                    <div className="relative">

                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={otp}
                                            onChange={e => {
                                                const value =
                                                    e.target.value.replace(
                                                        /\D/g,
                                                        ''
                                                    );

                                                setOtp(value);
                                                setFormError('');
                                            }}
                                            maxLength={6}
                                            placeholder="Nhập 6 số OTP..."
                                            className="w-full h-14 pl-11 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-slate-900 font-bold tracking-[0.3em]"
                                        />

                                    </div>

                                    {(formError || error) && (

                                        <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">

                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />

                                            <p className="text-red-600 text-sm font-medium">
                                                {formError || error}
                                            </p>

                                        </div>

                                    )}

                                    <div className="flex gap-3 mt-6">

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep(1);
                                                setOtp('');
                                                setFormError('');
                                            }}
                                            className="h-14 px-6 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            Trở lại
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleVerifyOtp}
                                            disabled={
                                                otp.length !== 6 ||
                                                loadingVerifyOtp
                                            }
                                            className="flex-1 h-14 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold tracking-[0.1em] uppercase transition-all"
                                        >

                                            {loadingVerifyOtp
                                                ? 'Đang xác thực...'
                                                : 'Xác nhận'
                                            }

                                        </button>

                                    </div>

                                </div>

                            )}

                            {/* =================================================
                                STEP 3
                            ================================================= */}
                            {step === 3 && (

                                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">

                                    {/* FULL NAME */}
                                    <div>

                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                            Họ và tên
                                        </label>

                                        <div className="relative">

                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={e =>
                                                    setFullName(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập họ và tên..."
                                                className="w-full h-12 pl-11 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
                                            />

                                        </div>

                                    </div>

                                    {/* DOB + GENDER */}
                                    <div className="flex gap-4">

                                        <div className="flex-1">

                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                                Ngày sinh
                                            </label>

                                            <div className="relative">

                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

                                                <input
                                                    type="date"
                                                    value={dob}
                                                    onChange={e =>
                                                        setDob(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full h-12 pl-11 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
                                                />

                                            </div>

                                        </div>

                                        <div className="w-[35%]">

                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                                Giới tính
                                            </label>

                                            <select
                                                value={gender}
                                                onChange={e =>
                                                    setGender(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full h-12 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
                                            >

                                                <option value="MALE">
                                                    Nam
                                                </option>

                                                <option value="FEMALE">
                                                    Nữ
                                                </option>

                                                <option value="OTHER">
                                                    Khác
                                                </option>

                                            </select>

                                        </div>

                                    </div>

                                    {/* ADDRESS */}
                                    <div>

                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                            Địa chỉ
                                        </label>

                                        <div className="relative">

                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                                            <input
                                                type="text"
                                                value={address}
                                                onChange={e =>
                                                    setAddress(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập địa chỉ..."
                                                className="w-full h-12 pl-11 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
                                            />

                                        </div>

                                    </div>

                                    {/* PASSWORD */}
                                    <div>

                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                            Mật khẩu
                                        </label>

                                        <div className="relative">

                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                                            <input
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                value={password}
                                                onChange={e =>
                                                    setPassword(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Tối thiểu 8 ký tự"
                                                className="w-full h-12 pl-11 pr-12 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                            >

                                                {showPassword
                                                    ? <EyeOff className="w-4 h-4" />
                                                    : <Eye className="w-4 h-4" />
                                                }

                                            </button>

                                        </div>

                                    </div>

                                    {/* CONFIRM PASSWORD */}
                                    <div>

                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                            Xác nhận mật khẩu
                                        </label>

                                        <div className="relative">

                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                                            <input
                                                type={
                                                    showConfirmPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                value={confirm}
                                                onChange={e =>
                                                    setConfirm(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập lại mật khẩu"
                                                className="w-full h-12 pl-11 pr-12 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        !showConfirmPassword
                                                    )
                                                }
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                            >

                                                {showConfirmPassword
                                                    ? <EyeOff className="w-4 h-4" />
                                                    : <Eye className="w-4 h-4" />
                                                }

                                            </button>

                                        </div>

                                    </div>

                                    {/* IDENTIFIER INFO */}
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">

                                        <p className="text-xs text-slate-500">
                                            Tài khoản được xác thực bằng
                                        </p>

                                        <div className="flex items-center gap-2 mt-1">

                                            {registerMethod === 'phone'
                                                ? <Phone className="w-4 h-4 text-primary-600" />
                                                : <Mail className="w-4 h-4 text-primary-600" />
                                            }

                                            <span className="font-bold text-sm text-slate-800">
                                                {identifier}
                                            </span>

                                        </div>

                                    </div>

                                    {(formError || error) && (

                                        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">

                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />

                                            <p className="text-red-600 text-sm font-medium">
                                                {formError || error}
                                            </p>

                                        </div>

                                    )}

                                    <div className="flex gap-3 mt-6">

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep(2);
                                                setFormError('');
                                            }}
                                            disabled={loadingRegister}
                                            className="h-14 px-6 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            Trở lại
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleRegister}
                                            disabled={loadingRegister}
                                            className="flex-1 h-14 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold tracking-[0.1em] uppercase transition-all shadow-[0_10px_20px_-10px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2"
                                        >

                                            {loadingRegister
                                                ? 'Đang tạo tài khoản...'
                                                : (
                                                    <>
                                                        Tạo tài khoản
                                                        <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )
                                            }

                                        </button>

                                    </div>

                                </div>

                            )}

                        </div>

                        {/* =================================================
                            LOGIN
                        ================================================= */}
                        {step === 1 && (

                            <div className="mt-12 pt-8 border-t border-slate-100 text-center">

                                <p className="text-sm text-slate-500">

                                    Đã có tài khoản?{' '}

                                    <Link
                                        to={ROUTES.LOGIN}
                                        className="font-bold text-slate-900 hover:text-primary-600 transition-colors"
                                    >
                                        Đăng nhập ngay
                                    </Link>

                                </p>

                            </div>

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}
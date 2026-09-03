// src/pages/customer/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Pencil, Key, Calendar, User, Users, Phone, Mail, MapPin, Droplets, Shield, CheckCircle, AlertCircle, Loader2, HeartPulse } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { useProfile } from '@/hooks/useProfile';

const STATUS_STYLE = {
    DONE: 'text-gray-800 font-semibold text-xs tracking-wide',
    UPCOMING: 'text-primary-500 font-semibold text-xs tracking-wide',
};

const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split(' ').map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '').join(' ');
};

const DateDropdowns = ({ value, onChange, className }) => {
    const parts = (value || '').split('-');
    const year = parts[0] || '';
    const month = parts[1] ? String(parseInt(parts[1], 10)) : '';
    const day = parts[2] ? String(parseInt(parts[2], 10)) : '';

    const handleUpdate = (y, m, d) => {
        const py = y || '';
        const pm = m ? m.padStart(2, '0') : '';
        const pd = d ? d.padStart(2, '0') : '';
        if (!py && !pm && !pd) onChange('');
        else onChange(`${py}-${pm}-${pd}`);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 120 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    let daysInMonth = 31;
    if (month) {
        const m = parseInt(month, 10);
        const y = year ? parseInt(year, 10) : currentYear;
        daysInMonth = new Date(y, m, 0).getDate();
    }
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="flex gap-2 w-full">
            <select value={day} onChange={e => handleUpdate(year, month, e.target.value)} className={className}>
                <option value="">Ngày</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={month} onChange={e => handleUpdate(year, e.target.value, day)} className={className}>
                <option value="">Tháng</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={year} onChange={e => handleUpdate(e.target.value, month, day)} className={className}>
                <option value="">Năm</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
    );
};

export default function ProfilePage() {
    const { t } = useTranslation('customer');
    const navigate = useNavigate();
    const { profile, loading, saving, error, saveProfile } = useProfile();

    const [editing, setEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [onboardingSaving, setOnboardingSaving] = useState(false);
    const [onboardingErrors, setOnboardingErrors] = useState({});

    // Editable fields
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [allergies, setAllergies] = useState([]);
    const [allergyStatus, setAllergyStatus] = useState('UNVERIFIED');

    // BHYT (bảo hiểm y tế) — READ-ONLY cho khách hàng
    // Chỉ có lễ tân mới được nhập/sửa BHYT qua luồng check-in.
    // Khách hàng chỉ có thể xem giá trị đã có, không thể tự thêm hoặc sửa.
    // bhytCode chỉ được load từ profile để gửi lại khi lưu (giữ nguyên giá trị hiện tại).
    const [bhytCode, setBhytCode] = useState('');

    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    useEffect(() => {
        if (!profile) return;
        setFullName(profile.fullName ?? '');
        setDob(formatDateForInput(profile.dateOfBirth));
        setGender((profile.gender ?? '').toUpperCase());
        setPhone(profile.phone ?? '');
        setEmail(profile.email ?? '');
        setAddress(profile.address ?? '');
        setBloodType((profile.bloodType ?? '').toUpperCase());
        setBhytCode(profile.insuranceId ?? '');
        setHeight(profile.height ?? '');
        setWeight(profile.weight ?? '');
        setAllergies(profile.allergies ?? []);
        setAllergyStatus(profile.allergyStatus ?? ((profile.allergies ?? []).length ? 'REPORTED' : 'UNVERIFIED'));
    }, [profile]);

    const handleSave = async () => {
        const validationError = validateProfileFields();
        if (validationError) {
            toast.error(validationError);
            return;
        }
        const ok = await saveProfile({
            fullName,
            dateOfBirth: dob,
            gender: gender || null,
            address: address || null,
            bloodType: bloodType || null,
            insuranceId: bhytCode || null,
            height: height ? Number(height) : null,
            weight: weight ? Number(weight) : null,
            allergies: allergyStatus === 'UNVERIFIED' ? undefined : allergies
        });
        if (ok) {
            toast.success('Cập nhật hồ sơ thành công!');
            setEditing(false);
        } else {
            toast.error('Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại thông tin.');
        }
    };

    const handleCancel = () => {
        if (!profile) return;
        setFullName(profile.fullName ?? '');
        setDob(formatDateForInput(profile.dateOfBirth));
        setGender((profile.gender ?? '').toUpperCase());
        setPhone(profile.phone ?? '');
        setEmail(profile.email ?? '');
        setAddress(profile.address ?? '');
        setBloodType((profile.bloodType ?? '').toUpperCase());
        setBhytCode(profile.insuranceId ?? '');
        setHeight(profile.height ?? '');
        setWeight(profile.weight ?? '');
        setAllergies(profile.allergies ?? []);
        setAllergyStatus(profile.allergyStatus ?? ((profile.allergies ?? []).length ? 'REPORTED' : 'UNVERIFIED'));
        setEditing(false);
    };

    const bmi = height && weight
        ? (weight / ((height / 100) ** 2)).toFixed(1)
        : profile?.bmi ?? '—';

    const inputCls = 'w-full h-10 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 transition-colors';
    const fieldLabel = 'flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5';
    const fieldValue = 'text-[15px] font-semibold text-gray-900';

    const genderLabel = (val) => {
        if (!val) return '—';
        const map = {
            MALE: t('profile.personalInfo.genderOptions.male'),
            FEMALE: t('profile.personalInfo.genderOptions.female'),
            OTHER: t('profile.personalInfo.genderOptions.other'),
        };
        return map[val] || val || '—';
    };

    const bloodTypeLabel = (val) => {
        if (!val) return '—';
        const map = {
            A_POSITIVE: t('profile.personalInfo.bloodTypeOptions.A_POSITIVE', 'A+'),
            A_NEGATIVE: t('profile.personalInfo.bloodTypeOptions.A_NEGATIVE', 'A-'),
            B_POSITIVE: t('profile.personalInfo.bloodTypeOptions.B_POSITIVE', 'B+'),
            B_NEGATIVE: t('profile.personalInfo.bloodTypeOptions.B_NEGATIVE', 'B-'),
            AB_POSITIVE: t('profile.personalInfo.bloodTypeOptions.AB_POSITIVE', 'AB+'),
            AB_NEGATIVE: t('profile.personalInfo.bloodTypeOptions.AB_NEGATIVE', 'AB-'),
            O_POSITIVE: t('profile.personalInfo.bloodTypeOptions.O_POSITIVE', 'O+'),
            O_NEGATIVE: t('profile.personalInfo.bloodTypeOptions.O_NEGATIVE', 'O-'),
        };
        return map[val] || val || '—';
    };

    const formatDob = (dobStr) => {
        if (!dobStr) return '—';
        const d = new Date(dobStr);
        if (Number.isNaN(d)) return dobStr;
        const age = new Date().getFullYear() - d.getFullYear();
        return `${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()} (${age} ${t('profile.personalInfo.age')})`;
    };

    // ── Detect new profile (required fields missing or fullName = ID default from backend) ──
    const nameIsDefault = profile && (
        !profile.fullName ||
        profile.fullName === String(profile.accountId) ||
        profile.fullName === String(profile.id) ||
        profile.fullName === profile.customerCode ||
        /^User\s+[a-f0-9-]+$/i.test(profile.fullName)
    );
    const isNewProfile = profile && (nameIsDefault || !profile.dateOfBirth || !profile.gender);

    // Clear fullName if it's just the auto-generated default so the input starts empty
    useEffect(() => {
        if (nameIsDefault && fullName) {
            setFullName('');
        }
    }, [nameIsDefault]);

    if (loading) {
        return (
            <CustomerLayout>
                <p className="text-sm text-gray-400 text-center py-20">{t('profile.loading')}</p>
            </CustomerLayout>
        );
    }

    const validateOnboarding = () => {
        const errs = {};
        if (!fullName.trim()) errs.fullName = 'Vui lòng nhập họ và tên';
        else if (/\d/.test(fullName)) errs.fullName = 'Họ tên không được chứa chữ số';
        if (!dob || dob.length !== 10) errs.dob = 'Vui lòng chọn đầy đủ ngày sinh';
        if (!gender) errs.gender = 'Vui lòng chọn giới tính';

        if (address && address.length > 255) errs.address = 'Địa chỉ không được vượt quá 255 ký tự';
        setOnboardingErrors(errs);
        if (Object.keys(errs).length > 0) toast.error(Object.values(errs)[0]);
        return Object.keys(errs).length === 0;
    };

    const validateProfileFields = () => {
        if (!fullName.trim() || fullName.trim().length < 2) return 'Họ tên phải có ít nhất 2 ký tự';
        if (/\d/.test(fullName)) return 'Họ tên không được chứa chữ số';
        if (!dob || Number.isNaN(new Date(dob).getTime()) || new Date(dob) >= new Date()) return 'Ngày sinh phải là ngày hợp lệ trong quá khứ';
        if (!gender) return 'Vui lòng chọn giới tính';

        if (address && address.trim().length > 255) return 'Địa chỉ không được vượt quá 255 ký tự';
        return '';
    };

    const handleOnboardingSave = async () => {
        if (!validateOnboarding()) return;
        setOnboardingSaving(true);
        const ok = await saveProfile({
            fullName,
            dateOfBirth: dob,
            gender: gender || null,
            address: address || null,
            bloodType: bloodType || null,
            insuranceId: bhytCode || null,
            height: height ? Number(height) : null,
            weight: weight ? Number(weight) : null,
            allergies: allergyStatus === 'UNVERIFIED' ? undefined : allergies
        });
        setOnboardingSaving(false);
        if (ok) {
            toast.success('Cập nhật hồ sơ thành công!');
        }
    };

    // ── Onboarding Screen ──
    if (isNewProfile) {
        const onboardInputCls = (field) =>
            `w-full h-12 px-4 text-sm border rounded-xl outline-none transition-all duration-200 ${onboardingErrors[field]
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-50 bg-red-50/30'
                : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-50 bg-white'
            }`;

        return (
            <CustomerLayout>
                <div className="cares-profile-onboarding mx-auto w-full py-8">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hoàn tất hồ sơ cá nhân</h1>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            Chào mừng bạn! Vui lòng điền thông tin cá nhân để hoàn tất việc đăng ký và sử dụng dịch vụ.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                        {/* Required Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-5">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <h3 className="text-sm font-bold text-gray-900">Thông tin bắt buộc</h3>
                                <span className="text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">BẮT BUỘC</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Họ và tên */}
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                                        <User className="w-3.5 h-3.5 text-primary-400" />
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={50}
                                        value={fullName}
                                        onChange={e => { setFullName(capitalizeWords(e.target.value.replace(/\d/g, ''))); setOnboardingErrors(p => ({ ...p, fullName: '' })); }}
                                        placeholder="Nhập họ và tên đầy đủ"
                                        className={onboardInputCls('fullName')}
                                    />
                                    {onboardingErrors.fullName && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{onboardingErrors.fullName}</p>}
                                </div>

                                {/* Ngày sinh */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                                        <Calendar className="w-3.5 h-3.5 text-primary-400" />
                                        Ngày sinh <span className="text-red-500">*</span>
                                    </label>
                                    <DateDropdowns
                                        value={dob}
                                        onChange={val => { setDob(val); setOnboardingErrors(p => ({ ...p, dob: '' })); }}
                                        className={onboardInputCls('dob') + ' bg-white px-2'}
                                    />
                                    {onboardingErrors.dob && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{onboardingErrors.dob}</p>}
                                </div>

                                {/* Giới tính */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                                        <Users className="w-3.5 h-3.5 text-primary-400" />
                                        Giới tính <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={gender}
                                        onChange={e => { setGender(e.target.value); setOnboardingErrors(p => ({ ...p, gender: '' })); }}
                                        className={onboardInputCls('gender') + ' bg-white'}
                                    >
                                        <option value="">Chọn giới tính</option>
                                        <option value="MALE">{t('profile.personalInfo.genderOptions.male')}</option>
                                        <option value="FEMALE">{t('profile.personalInfo.genderOptions.female')}</option>
                                    </select>
                                    {onboardingErrors.gender && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{onboardingErrors.gender}</p>}
                                </div>

                                {/* HIỂN THỊ PHƯƠNG THỨC LIÊN HỆ ĐÃ ĐĂNG KÝ (SĐT hoặc Email) */}
                                {profile?.phone ? (
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                                            <Phone className="w-3.5 h-3.5 text-primary-400" />
                                            Số điện thoại
                                            <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                <CheckCircle className="w-2.5 h-2.5" />Đã có từ đăng ký
                                            </span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            disabled
                                            className="w-full h-12 px-4 text-sm border border-gray-200 bg-gray-50 text-gray-500 rounded-xl outline-none cursor-not-allowed"
                                        />
                                    </div>
                                ) : profile?.email ? (
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                                            <Mail className="w-3.5 h-3.5 text-primary-400" />
                                            Email
                                            <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                <CheckCircle className="w-2.5 h-2.5" />Đã có từ đăng ký
                                            </span>
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            disabled
                                            className="w-full h-12 px-4 text-sm border border-gray-200 bg-gray-50 text-gray-500 rounded-xl outline-none cursor-not-allowed"
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-dashed border-gray-200 my-6"></div>

                        {/* Optional Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-5">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <h3 className="text-sm font-bold text-gray-900">Thông tin bổ sung</h3>
                                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">TÙY CHỌN</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {!profile?.email || !profile?.phone ? (
                                    <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                        Nếu cần bổ sung hoặc thay đổi số điện thoại/email, vui lòng liên hệ lễ tân để bảo đảm lịch sử khám được giữ đúng hồ sơ.
                                    </div>
                                ) : null}

                                {/* Địa chỉ */}
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                        Địa chỉ
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={255}
                                        value={address}
                                        onChange={e => { setAddress(e.target.value); setOnboardingErrors(p => ({ ...p, address: '' })); }}
                                        placeholder="Nhập địa chỉ hiện tại"
                                        className={onboardInputCls('address')}
                                    />
                                    {onboardingErrors.address && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{onboardingErrors.address}</p>}
                                </div>

                                <div className="cares-profile-section-title md:col-span-2">
                                    <HeartPulse size={17} />
                                    <span>
                                        <strong>Thông tin sức khỏe</strong>
                                        <small>Dữ liệu hỗ trợ bác sĩ trong quá trình thăm khám</small>
                                    </span>
                                </div>
                                {/* Nhóm máu */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                                        <Droplets className="w-3.5 h-3.5 text-gray-400" />
                                        Nhóm máu
                                    </label>
                                    <select
                                        value={bloodType}
                                        onChange={e => setBloodType(e.target.value)}
                                        className="w-full h-12 px-4 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 bg-white transition-all duration-200"
                                    >
                                        <option value="">Chọn nhóm máu</option>
                                        <option value="A_POSITIVE">A+</option>
                                        <option value="A_NEGATIVE">A-</option>
                                        <option value="B_POSITIVE">B+</option>
                                        <option value="B_NEGATIVE">B-</option>
                                        <option value="AB_POSITIVE">AB+</option>
                                        <option value="AB_NEGATIVE">AB-</option>
                                        <option value="O_POSITIVE">O+</option>
                                        <option value="O_NEGATIVE">O-</option>
                                    </select>
                                </div>

                                {/* Bảo hiểm y tế — chỉ lễ tân được nhập */}
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                                        <Shield className="w-3.5 h-3.5 text-green-500" />
                                        Bảo hiểm y tế (BHYT)
                                    </label>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                                        Chỉ có lễ tân mới được nhập bảo hiểm y tế. Vui lòng liên hệ lễ tân để cập nhật.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <button
                                onClick={handleOnboardingSave}
                                disabled={onboardingSaving}
                                className="w-full h-12 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-bold tracking-wide rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10"
                            >
                                {onboardingSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Hoàn tất hồ sơ
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-gray-400 text-center mt-3">
                                Bạn có thể cập nhật lại thông tin bất cứ lúc nào trong phần Hồ sơ.
                            </p>
                        </div>
                    </div>
                </div>
            </CustomerLayout>
        );
    }

    // ── Change Password Modal ──
    const ChangePasswordModal = () => {
        const [oldPass, setOldPass] = useState('');
        const [newPass, setNewPass] = useState('');
        const [confirmPass, setConfirmPass] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);

        const handleChangePass = async () => {
            if (!oldPass || !newPass || !confirmPass) {
                return toast.error('Vui lòng điền đủ thông tin');
            }
            if (newPass !== confirmPass) {
                return toast.error('Mật khẩu xác nhận không khớp');
            }

            setIsSubmitting(true);
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass })
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || 'Mật khẩu cũ không đúng');
                }

                toast.success('Đổi mật khẩu thành công!');
                setShowPasswordModal(false);
            } catch (err) {
                toast.error(err.message);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Đổi mật khẩu</h3>
                    <p className="text-sm text-gray-500 mb-5">Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.</p>

                    <div className="space-y-4">
                        <input type="password" placeholder="Mật khẩu hiện tại" value={oldPass} onChange={e => setOldPass(e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500" />
                        <input type="password" placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" value={newPass} onChange={e => setNewPass(e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500" />
                        <input type="password" placeholder="Xác nhận mật khẩu mới" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500" />
                        <div className="flex gap-3">
                            <button onClick={() => setShowPasswordModal(false)} className="flex-1 h-10 border text-gray-600 rounded-md text-sm font-medium">Hủy</button>
                            <button onClick={handleChangePass} disabled={isSubmitting} className="flex-1 h-10 bg-primary-500 text-white rounded-md text-sm font-medium disabled:opacity-60">
                                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <CustomerLayout>
            <div className="cares-profile-page space-y-5">
                <header className="cares-customer-page-heading">
                    <div>
                        <span className="cares-customer-eyebrow"><User size={15} /> Thông tin của bạn</span>
                        <h1 className="text-lg font-semibold text-gray-900">{t('profile.pageTitle')}</h1>
                        <p>Quản lý thông tin cá nhân và dữ liệu sức khỏe cơ bản.</p>
                    </div>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-all shadow-sm"
                    >
                        <Key size={16} />
                        Đổi mật khẩu
                    </button>
                </header>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex flex-col gap-5 items-start w-full">

                    {/* ── Main content ── */}
                    <div className="w-full space-y-5">

                        {/* Thông tin cá nhân */}
                        <div className="cares-profile-card bg-white border border-gray-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {t('profile.personalInfo.title')}
                                </h3>
                                {!editing ? (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                        <Pencil size={12} />
                                        {t('profile.edit')}
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancel}
                                            className="px-4 py-1.5 text-xs border border-gray-300 text-gray-600 hover:border-gray-400 rounded-lg transition-colors"
                                        >
                                            {t('profile.cancel')}
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors"
                                        >
                                            {saving ? t('profile.saving') : t('profile.save')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">
                                {/* Họ và tên */}
                                <div>
                                    <div className={fieldLabel}>
                                        <User className="w-3.5 h-3.5 text-primary-400" />
                                        <span>{t('profile.personalInfo.fullName')}</span>
                                    </div>
                                    {editing
                                        ? <input type="text" maxLength={50} value={fullName} onChange={e => setFullName(capitalizeWords(e.target.value.replace(/\d/g, '')))} className={inputCls} />
                                        : <p className={fieldValue}>{fullName || '—'}</p>}
                                </div>
                                {/* Ngày sinh */}
                                <div>
                                    <div className={fieldLabel}>
                                        <Calendar className="w-3.5 h-3.5 text-primary-400" />
                                        <span>{t('profile.personalInfo.dob')}</span>
                                    </div>
                                    {editing
                                        ? <DateDropdowns value={dob} onChange={setDob} className={inputCls + ' bg-white px-2'} />
                                        : <p className={fieldValue}>{formatDob(dob)}</p>}
                                </div>
                                {/* Giới tính */}
                                <div>
                                    <div className={fieldLabel}>
                                        <Users className="w-3.5 h-3.5 text-primary-400" />
                                        <span>{t('profile.personalInfo.gender')}</span>
                                    </div>
                                    {editing
                                        ? (
                                            <select value={gender} onChange={e => setGender(e.target.value)} className={inputCls + ' bg-white'}>
                                                <option value="" />
                                                <option value="MALE">{t('profile.personalInfo.genderOptions.male')}</option>
                                                <option value="FEMALE">{t('profile.personalInfo.genderOptions.female')}</option>
                                            </select>
                                        )
                                        : <p className={fieldValue}>{genderLabel(gender)}</p>}
                                </div>
                                {/* SĐT */}
                                <div>
                                    <div className={fieldLabel}>
                                        <Phone className="w-3.5 h-3.5 text-primary-400" />
                                        <span>{t('profile.personalInfo.phone')}</span>
                                    </div>
                                    <p className={fieldValue}>{phone || '—'}</p>
                                    {editing && <p className="mt-1 text-xs text-amber-600">Liên hệ lễ tân để thay đổi số điện thoại.</p>}
                                </div>
                                {/* Email */}
                                <div className="md:col-span-2">
                                    <div className={fieldLabel}>
                                        <Mail className="w-3.5 h-3.5 text-primary-400" />
                                        <span>{t('profile.personalInfo.email')}</span>
                                    </div>
                                    <p className={fieldValue}>{email || '—'}</p>
                                    {editing && <p className="mt-1 text-xs text-amber-600">Liên hệ lễ tân để thay đổi email.</p>}
                                </div>
                                {/* Địa chỉ — full width */}
                                <div className="md:col-span-2">
                                    <div className={fieldLabel}>
                                        <MapPin className="w-3.5 h-3.5 text-primary-400" />
                                        <span>{t('profile.personalInfo.address')}</span>
                                    </div>
                                    {editing
                                        ? <input type="text" maxLength={255} value={address} onChange={e => setAddress(e.target.value)} className={inputCls} />
                                        : <p className={fieldValue}>{address || '—'}</p>}
                                </div>
                                <div className="cares-profile-section-title md:col-span-2">
                                    <HeartPulse size={17} />
                                    <span>
                                        <strong>Thông tin sức khỏe</strong>
                                        <small>Dữ liệu hỗ trợ bác sĩ trong quá trình thăm khám</small>
                                    </span>
                                </div>
                                {/* Nhóm máu */}
                                <div>
                                    <div className={fieldLabel}>
                                        <Droplets className="w-3.5 h-3.5 text-red-400" />
                                        <span>{t('profile.bloodType')}</span>
                                    </div>
                                    {editing
                                        ? (
                                            <select value={bloodType} onChange={e => setBloodType(e.target.value)} className={inputCls + ' bg-white'}>
                                                <option value="">Chọn...</option>
                                                <option value="A_POSITIVE">A+</option>
                                                <option value="A_NEGATIVE">A-</option>
                                                <option value="B_POSITIVE">B+</option>
                                                <option value="B_NEGATIVE">B-</option>
                                                <option value="AB_POSITIVE">AB+</option>
                                                <option value="AB_NEGATIVE">AB-</option>
                                                <option value="O_POSITIVE">O+</option>
                                                <option value="O_NEGATIVE">O-</option>
                                            </select>
                                        )
                                        : <p className={fieldValue}>{bloodTypeLabel(bloodType)}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <div className={fieldLabel}><AlertCircle className="h-3.5 w-3.5 text-amber-500"/><span>Dị ứng</span></div>
                                    {editing ? <div className="space-y-3 rounded-xl border border-gray-200 p-3">
                                        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={allergyStatus === 'NONE_REPORTED'} onChange={event => { if (event.target.checked) { setAllergyStatus('NONE_REPORTED'); setAllergies([]); } else { setAllergyStatus('UNVERIFIED'); } }}/><span>Đã xác nhận chưa ghi nhận dị ứng</span></label>
                                        {allergyStatus !== 'NONE_REPORTED' && <textarea rows={3} value={allergies.join('\n')} onChange={event => { const values = event.target.value.split(/[,;\n]+/).map(value => value.trim()).filter(Boolean); setAllergies(values); setAllergyStatus(values.length ? 'REPORTED' : 'UNVERIFIED'); }} placeholder="Mỗi dị ứng nhập trên một dòng, ví dụ: Penicillin" className={inputCls + ' h-auto py-2'}/>}
                                    </div> : allergyStatus === 'REPORTED' ? <div className="flex flex-wrap gap-2">{allergies.map(item => <span key={item} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">{item}</span>)}</div> : allergyStatus === 'NONE_REPORTED' ? <p className="text-sm font-medium text-emerald-700">Đã xác nhận chưa ghi nhận dị ứng</p> : <p className="text-sm font-medium text-amber-700">Chưa xác minh dị ứng</p>}
                                </div>
                                {/* Bảo hiểm y tế — chỉ lễ tân được nhập */}
                                <div className="md:col-span-2">
                                    <div className={fieldLabel}>
                                        <Shield className="w-3.5 h-3.5 text-green-500" />
                                        <span>Bảo hiểm y tế (BHYT)</span>
                                    </div>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                                        Chỉ có lễ tân mới được nhập bảo hiểm y tế. Vui lòng liên hệ lễ tân để cập nhật.
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Cuộc hẹn gần đây */}
                        <div className="cares-profile-card bg-white border border-gray-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {t('profile.appointments.title')}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => navigate('/my-appointments')}
                                    className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                                >
                                    {t('profile.appointments.viewAll')}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(profile?.appointments ?? []).length === 0 ? (
                                    <p className="text-sm text-gray-400 py-4 text-center">Chưa có lịch hẹn nào</p>
                                ) : (
                                    (profile?.appointments ?? []).map((appt, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-primary-500 shadow-sm transition-colors shrink-0">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{appt.date}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{appt.specialty} • {appt.doctor}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${['PENDING', 'SCHEDULED', 'RESCHEDULED', 'CHECKED_IN'].includes((appt.status || '').toUpperCase())
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    : (appt.status || '').toUpperCase() === 'CANCELLED'
                                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                                        : 'bg-green-50 text-green-600 border border-green-100'
                                                    }`}>
                                                    {['PENDING', 'SCHEDULED', 'RESCHEDULED', 'CHECKED_IN'].includes((appt.status || '').toUpperCase())
                                                        ? t('profile.appointments.statusUpcoming')
                                                        : (appt.status || '').toUpperCase() === 'CANCELLED'
                                                            ? t('profile.appointments.statusCancelled')
                                                            : t('profile.appointments.statusDone')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {showPasswordModal && <ChangePasswordModal />}
        </CustomerLayout>
    );
}

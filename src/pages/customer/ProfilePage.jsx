// src/pages/customer/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, UserCircle, Key } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { useProfile } from '@/hooks/useProfile';

const STATUS_STYLE = {
    DONE:     'text-gray-800 font-semibold text-xs tracking-wide',
    UPCOMING: 'text-primary-500 font-semibold text-xs tracking-wide',
};

export default function ProfilePage() {
    const { t } = useTranslation('customer');
    const { profile, loading, saving, error, saveProfile } = useProfile();

    const [editing, setEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Editable fields
    const [fullName,   setFullName]   = useState('');
    const [dob,        setDob]        = useState('');
    const [gender,     setGender]     = useState('');
    const [phone,      setPhone]      = useState('');
    const [email,      setEmail]      = useState('');
    const [address,    setAddress]    = useState('');
    const [bloodType,  setBloodType]  = useState('');
    const [insuranceId,setInsuranceId]= useState('');
    const [height,     setHeight]     = useState('');
    const [weight,     setWeight]     = useState('');
    const [allergies,  setAllergies]  = useState([]);

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
        setFullName(profile.fullName       ?? '');
        setDob(formatDateForInput(profile.dateOfBirth));
        setGender((profile.gender         ?? '').toUpperCase());
        setPhone(profile.phone           ?? '');
        setEmail(profile.email           ?? '');
        setAddress(profile.address       ?? '');
        setBloodType((profile.bloodType  ?? '').toUpperCase());
        setInsuranceId(profile.insuranceId ?? '');
        setHeight(profile.height         ?? '');
        setWeight(profile.weight         ?? '');
        setAllergies(profile.allergies   ?? []);
    }, [profile]);

    const handleSave = async () => {
        const ok = await saveProfile({ fullName, dateOfBirth: dob, gender, phone, email, address, bloodType });
        if (ok) setEditing(false);
    };

    const handleCancel = () => {
        if (!profile) return;
        setFullName(profile.fullName     ?? '');
        setDob(formatDateForInput(profile.dateOfBirth));
        setGender((profile.gender         ?? '').toUpperCase());
        setPhone(profile.phone           ?? '');
        setEmail(profile.email           ?? '');
        setAddress(profile.address       ?? '');
        setBloodType((profile.bloodType  ?? '').toUpperCase());
        setInsuranceId(profile.insuranceId ?? '');
        setHeight(profile.height         ?? '');
        setWeight(profile.weight         ?? '');
        setAllergies(profile.allergies   ?? []);
        setEditing(false);
    };

    const bmi = height && weight
        ? (weight / ((height / 100) ** 2)).toFixed(1)
        : profile?.bmi ?? '—';

    const inputCls = 'w-full h-9 px-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50';
    const fieldLabel = 'text-xs text-primary-500 mb-1';
    const fieldValue = 'text-sm font-medium text-gray-900';

    const genderLabel = (val) => {
        const map = {
            MALE:   t('profile.personalInfo.genderOptions.male'),
            FEMALE: t('profile.personalInfo.genderOptions.female'),
            OTHER:  t('profile.personalInfo.genderOptions.other'),
        };
        return map[val] ?? val ?? '—';
    };

    const bloodTypeLabel = (val) => {
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
        return map[val] ?? val ?? '—';
    };

    const formatDob = (dobStr) => {
        if (!dobStr) return '—';
        const d = new Date(dobStr);
        if (Number.isNaN(d)) return dobStr;
        const age = new Date().getFullYear() - d.getFullYear();
        return `${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()} (${age} ${t('profile.personalInfo.age')})`;
    };

    if (loading) {
        return (
            <CustomerLayout>
                <p className="text-sm text-gray-400 text-center py-20">{t('profile.loading')}</p>
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
            <div className="space-y-5">
                <h1 className="text-lg font-semibold text-gray-900">{t('profile.pageTitle')}</h1>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                {/* ── Identity card ── */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            <UserCircle size={48} className="text-gray-300" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{fullName || '—'}</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {t('profile.customerCode')}: <span className="text-gray-600">{profile?.customerCode ?? '—'}</span>
                            </p>
                            <p className="text-sm text-gray-400">
                                {t('profile.bloodType')}: <span className="text-gray-600">{bloodTypeLabel(bloodType)}</span>
                                <span className="mx-3 text-gray-200">|</span>
                                {t('profile.insurance')}: <span className="text-gray-600">{profile?.insuranceId ?? '—'}</span>
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Key size={16} />
                        Đổi mật khẩu
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-5 items-start">

                    {/* ── Left col (2/3) ── */}
                    <div className="col-span-2 space-y-5">

                        {/* Thông tin cá nhân */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6">
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

                            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                {/* Họ và tên */}
                                <div>
                                    <p className={fieldLabel}>{t('profile.personalInfo.fullName')}</p>
                                    {editing
                                        ? <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
                                        : <p className={fieldValue}>{fullName || '—'}</p>}
                                </div>
                                {/* Ngày sinh */}
                                <div>
                                    <p className={fieldLabel}>{t('profile.personalInfo.dob')}</p>
                                    {editing
                                        ? <input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} />
                                        : <p className={fieldValue}>{formatDob(dob)}</p>}
                                </div>
                                {/* Giới tính */}
                                <div>
                                    <p className={fieldLabel}>{t('profile.personalInfo.gender')}</p>
                                    {editing
                                        ? (
                                            <select value={gender} onChange={e => setGender(e.target.value)} className={inputCls + ' bg-white'}>
                                                <option value="" />
                                                <option value="MALE">{t('profile.personalInfo.genderOptions.male')}</option>
                                                <option value="FEMALE">{t('profile.personalInfo.genderOptions.female')}</option>
                                                <option value="OTHER">{t('profile.personalInfo.genderOptions.other')}</option>
                                            </select>
                                        )
                                        : <p className={fieldValue}>{genderLabel(gender)}</p>}
                                </div>
                                {/* SĐT */}
                                <div>
                                    <p className={fieldLabel}>{t('profile.personalInfo.phone')}</p>
                                    {editing
                                        ? <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
                                        : <p className={fieldValue}>{phone || '—'}</p>}
                                </div>
                                {/* Email */}
                                <div>
                                    <p className={fieldLabel}>{t('profile.personalInfo.email')}</p>
                                    {editing
                                        ? <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                                        : <p className={fieldValue}>{email || '—'}</p>}
                                </div>
                                {/* Địa chỉ — full width */}
                                <div className="col-span-2">
                                    <p className={fieldLabel}>{t('profile.personalInfo.address')}</p>
                                    {editing
                                        ? <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputCls} />
                                        : <p className={fieldValue}>{address || '—'}</p>}
                                </div>
                                {/* Nhóm máu */}
                                <div>
                                    <p className={fieldLabel}>{t('profile.bloodType')}</p>
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
                                        : <p className={fieldValue}>{bloodTypeLabel(bloodType) || '—'}</p>}
                                </div>
                                {/* Bảo hiểm */}
                                <div className="col-span-2">
                                    <p className={fieldLabel}>{t('profile.personalInfo.insuranceId')}</p>
                                    {editing
                                        ? <input type="text" value={insuranceId} onChange={e => setInsuranceId(e.target.value)} className={inputCls} />
                                        : <p className={fieldValue}>{insuranceId || '—'}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Thông tin y tế cơ bản */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-5">
                                {t('profile.medicalInfo.title')}
                            </h3>

                            <div className="grid grid-cols-3 gap-4 mb-5">
                                {[
                                    { label: t('profile.medicalInfo.height'), value: height, unit: t('profile.medicalInfo.heightUnit'), set: setHeight },
                                    { label: t('profile.medicalInfo.weight'), value: weight, unit: t('profile.medicalInfo.weightUnit'), set: setWeight },
                                    { label: t('profile.medicalInfo.bmi'),    value: bmi,   unit: '',                                  set: null },
                                ].map(({ label, value, unit, set }) => (
                                    <div key={label} className="border border-gray-100 rounded-xl p-4 text-center">
                                        <p className="text-xs text-primary-400 mb-2">{label}</p>
                                        {editing && set ? (
                                            <input
                                                type="number"
                                                value={value}
                                                onChange={e => set(e.target.value)}
                                                className="w-full text-center text-lg font-semibold text-gray-900 border border-gray-200 rounded-lg outline-none focus:border-primary-500 py-1"
                                            />
                                        ) : (
                                            <p className="text-lg font-semibold text-gray-900">
                                                {value || '—'}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 mb-2">{t('profile.medicalInfo.allergies')}:</p>
                                <div className="flex flex-wrap gap-2">
                                    {allergies.length > 0
                                        ? allergies.map((a, i) => (
                                            <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {a}
                        </span>
                                        ))
                                        : <span className="text-sm text-gray-400">—</span>}
                                </div>
                            </div>
                        </div>

                        {/* Cuộc hẹn gần đây */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {t('profile.appointments.title')}
                                </h3>
                                <button className="text-xs text-primary-500 hover:text-primary-600">
                                    {t('profile.appointments.viewAll')}
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-4 pb-2 border-b border-gray-100 mb-2">
                                {[
                                    t('profile.appointments.date'),
                                    t('profile.appointments.doctor'),
                                    t('profile.appointments.specialty'),
                                    t('profile.appointments.status'),
                                ].map(col => (
                                    <p key={col} className="text-xs text-gray-400">{col}</p>
                                ))}
                            </div>

                            {(profile?.appointments ?? []).map((appt, i) => (
                                <div key={i} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-50 last:border-0">
                                    <p className="text-sm font-medium text-gray-900">{appt.date}</p>
                                    <p className="text-sm text-gray-600">{appt.doctor}</p>
                                    <p className="text-sm text-gray-500">{appt.specialty}</p>
                                    <p className={appt.status === 'UPCOMING' ? STATUS_STYLE.UPCOMING : STATUS_STYLE.DONE}>
                                        {appt.status === 'UPCOMING'
                                            ? t('profile.appointments.statusUpcoming')
                                            : t('profile.appointments.statusDone')}
                                    </p>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* ── Right col (1/3) ── */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">
                            {t('profile.testResults.title')}
                        </h3>

                        <div className="space-y-4">
                            {(profile?.testResults ?? []).map((result, i) => (
                                <div key={i} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                    <p className="text-sm font-medium text-gray-900 leading-snug">{result.name}</p>
                                    <p className="text-xs text-gray-400 mt-1">{result.date}</p>
                                </div>
                            ))}
                        </div>

                        <button className="mt-5 text-xs text-gray-500 hover:text-primary-500 transition-colors w-full text-center">
                            {t('profile.testResults.viewAll')}
                        </button>
                    </div>

                </div>
            </div>

            {showPasswordModal && <ChangePasswordModal />}
        </CustomerLayout>
    );
}
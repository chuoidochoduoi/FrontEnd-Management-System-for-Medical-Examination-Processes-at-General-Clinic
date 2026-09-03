import { useState, useEffect } from 'react';
import { UserCircle, Key, Phone, Mail, User, Shield, Briefcase, MapPin, Calendar, Edit2, Check, X, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import OwnerLayout from '@/components/layout/OwnerLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import CashierLayout from '@/components/layout/CashierLayout';
import styles from './StaffProfilePage.module.css';

function ProfileField({ label, icon: Icon, id, wide, readOnly, children }) {
    const Label = id ? 'label' : 'div';
    return <div className={`${styles.field} ${wide ? styles.wide : ''}`}>
        <Label className={styles.label} htmlFor={id}>{Icon && <Icon size={16}/>}<span>{label}</span>{readOnly && <small>Chỉ xem</small>}</Label>
        {children}
    </div>;
}

export default function StaffProfilePage() {
    const [profile, setProfile] = useState(null); // This is StaffResponse
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [saving, setSaving] = useState(false);

    // --- DateDropdowns component ---
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
            <div className={styles.dates}>
                <select aria-label="Ngày sinh" value={day} onChange={e => handleUpdate(year, month, e.target.value)} className={className}>
                    <option value="">Ngày</option>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select aria-label="Tháng sinh" value={month} onChange={e => handleUpdate(year, e.target.value, day)} className={className}>
                    <option value="">Tháng</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select aria-label="Năm sinh" value={year} onChange={e => handleUpdate(e.target.value, month, day)} className={className}>
                    <option value="">Năm</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
        );
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (!token) return;

                // Lấy thông tin account hiện tại
                const meRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!meRes.ok) throw new Error('Không thể tải thông tin tài khoản');
                const meData = await meRes.json();
                setAccount(meData);

                // Lấy thông tin nhân viên theo accountId
                const staffRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/account/${meData.accountId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (staffRes.ok) {
                    const staffData = await staffRes.json();
                    setProfile(staffData);
                    setEditForm({
                        fullName: staffData.profile?.fullName || '',
                        phone: staffData.profile?.phone || '',
                        email: staffData.profile?.email || '',
                        gender: staffData.profile?.gender || '',
                        dateOfBirth: staffData.profile?.dateOfBirth || '',
                        address: staffData.profile?.address || '',
                        highestDegree: staffData.highestDegree || '',
                        university: staffData.university || '',
                    });
                } else if (staffRes.status === 404) {
                    // Not found or not a staff, that's fine
                } else {
                    throw new Error('Không thể tải hồ sơ nhân viên');
                }
            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // ── Change Password Modal ──
    const ChangePasswordModal = () => {
        const [oldPass, setOldPass] = useState('');
        const [newPass, setNewPass] = useState('');
        const [confirmPass, setConfirmPass] = useState('');
        const [changing, setChanging] = useState(false);

        const handleSubmit = async () => {
            if (!oldPass || !newPass || !confirmPass) {
                return toast.error('Vui lòng nhập đủ thông tin');
            }
            if (newPass.length < 6) {
                return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
            }
            if (newPass !== confirmPass) {
                return toast.error('Mật khẩu xác nhận không khớp');
            }

            setChanging(true);
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
                    let msg = 'Đổi mật khẩu thất bại';
                    try { const errData = await res.json(); msg = errData.message || errData.error || msg; } catch(e){}
                    throw new Error(msg);
                }
                toast.success('Đổi mật khẩu thành công!');
                setShowPasswordModal(false);
            } catch (err) {
                toast.error(err.message);
            } finally {
                setChanging(false);
            }
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Key className="w-6 h-6 text-primary-500" />
                        Đổi Mật Khẩu
                    </h3>
                    <div className="space-y-4">
                        <input type="password" placeholder="Mật khẩu hiện tại" value={oldPass} onChange={e => setOldPass(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none" />
                        <input type="password" placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" value={newPass} onChange={e => setNewPass(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none" />
                        <input type="password" placeholder="Xác nhận mật khẩu mới" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none" />
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setShowPasswordModal(false)} className="flex-1 h-10 border text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50">Hủy</button>
                        <button onClick={handleSubmit} disabled={changing} className="flex-1 h-10 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                            {changing ? 'Đang lưu...' : 'Xác nhận'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };



    const handleSaveProfile = async () => {
        if (!editForm.fullName?.trim()) return toast.error('Vui lòng nhập họ và tên');
        if (/\d/.test(editForm.fullName)) return toast.error('Họ tên không được chứa chữ số');
        if (!editForm.gender) return toast.error('Vui lòng chọn giới tính');
        if (!editForm.dateOfBirth || new Date(editForm.dateOfBirth) >= new Date()) return toast.error('Ngày sinh phải là ngày hợp lệ trong quá khứ');
        if (editForm.address?.length > 255) return toast.error('Địa chỉ không được vượt quá 255 ký tự');
        setSaving(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/profiles/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ fullName: editForm.fullName, dateOfBirth: editForm.dateOfBirth, gender: editForm.gender, address: editForm.address })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || data?.error || 'Cập nhật hồ sơ thất bại');
            }
            const updatedProfile = await res.json();
            const professionalRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/me/professional`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ highestDegree: editForm.highestDegree?.trim() || null, university: editForm.university?.trim() || null })
            });
            if (!professionalRes.ok) {
                const data = await professionalRes.json().catch(() => null);
                throw new Error(data?.message || data?.error || 'Cập nhật học vị và trường đào tạo thất bại');
            }
            const updatedStaff = await professionalRes.json();
            setProfile(prev => ({ ...prev, ...updatedStaff, profile: updatedProfile }));
            toast.success('Đã cập nhật hồ sơ cá nhân');
            setEditing(false);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const roleLabels = {
        ADMIN: 'Quản trị viên', CLINIC_MANAGER: 'Quản lý phòng khám', CASHIER: 'Thu ngân',
        RECEPTIONIST: 'Lễ tân', DOCTOR: 'Bác sĩ', GENERAL_DOCTOR: 'Bác sĩ đa khoa',
        SPECIALIST_DOCTOR: 'Bác sĩ chuyên khoa', NURSE: 'Y tá',
    };
    const role = account?.systemRole || account?.role || '';
    const roleLabel = roleLabels[role] || role || 'Nhân viên';
    const beginEditing = () => {
        setEditForm({
            fullName: profile?.profile?.fullName || '', phone: profile?.profile?.phone || '',
            email: profile?.profile?.email || '', gender: profile?.profile?.gender || '',
            dateOfBirth: profile?.profile?.dateOfBirth || '', address: profile?.profile?.address || '',
            highestDegree: profile?.highestDegree || '', university: profile?.university || '',
        });
        setEditing(true);
    };

    const renderContent = () => {
        if (loading) return <div className={styles.state} role="status">Đang tải hồ sơ...</div>;
        if (!profile && !account) return <div className={styles.state} role="alert">Không thể hiển thị hồ sơ. Vui lòng tải lại trang.</div>;
        const inputCls = styles.input;
        const displayName = profile?.profile?.fullName || account?.username || 'Chưa cập nhật';

        return <div className={styles.content}>
            <header className={styles.heading}>
                <div><span className={styles.eyebrow}>Tài khoản của bạn</span><h1>Hồ sơ nhân viên</h1><p>Thông tin cá nhân, liên hệ và chuyên môn.</p></div>
                <div className={styles.actions}>
                    {editing ? <>
                        <button type="button" disabled={saving} onClick={() => setEditing(false)} className={styles.secondary}><X size={18}/>Hủy thay đổi</button>
                        <button type="button" onClick={handleSaveProfile} disabled={saving} className={styles.primary}><Check size={18}/>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
                    </> : <>
                        <button type="button" onClick={() => setShowPasswordModal(true)} className={styles.secondary}><Key size={18}/>Đổi mật khẩu</button>
                        {profile && <button type="button" onClick={beginEditing} className={styles.primary}><Edit2 size={18}/>Chỉnh sửa hồ sơ</button>}
                    </>}
                </div>
            </header>

            <section className={styles.identity} aria-label="Thông tin tài khoản">
                <span className={styles.avatar}><UserCircle size={38}/></span>
                <div className={styles.identityName}><h2>{displayName}</h2><span className={styles.role}><Shield size={16}/>{roleLabel}</span></div>
                <div className={styles.account}><span>Tên đăng nhập</span><strong>{account?.username || 'Chưa cập nhật'}</strong></div>
            </section>

            {!profile ? <section className={styles.card}>
                <div className={styles.cardHeading}><Shield size={21}/><div><h2>Thông tin tài khoản quản trị</h2><p>Tài khoản này chưa có hồ sơ nhân viên liên kết. Bạn có thể đổi mật khẩu ở phía trên.</p></div></div>
            </section> : <div className={styles.columns}>
                <section className={styles.card}>
                    <div className={styles.cardHeading}><User size={21}/><div><h2>Thông tin cá nhân</h2><p>Hồ sơ và thông tin liên hệ của bạn.</p></div></div>
                    <div className={styles.fields}>
                        <ProfileField label="Họ và tên" icon={UserCircle} id={editing ? 'staff-full-name' : undefined} wide>
                            {editing ? <input id="staff-full-name" value={editForm.fullName} onChange={e => setEditForm(p => ({...p, fullName: e.target.value.replace(/\d/g, '')}))} className={inputCls} placeholder="Nhập họ tên"/> : <div className={styles.value}>{profile.profile?.fullName || 'Chưa cập nhật'}</div>}
                        </ProfileField>
                        <ProfileField label="Ngày sinh" icon={Calendar}>
                            {editing ? <DateDropdowns value={editForm.dateOfBirth} onChange={value => setEditForm(p => ({...p, dateOfBirth: value}))} className={inputCls}/> : <div className={styles.value}>{profile.profile?.dateOfBirth ? new Date(profile.profile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</div>}
                        </ProfileField>
                        <ProfileField label="Giới tính" icon={Users} id={editing ? 'staff-gender' : undefined}>
                            {editing ? <select id="staff-gender" value={editForm.gender} onChange={e => setEditForm(p => ({...p, gender: e.target.value}))} className={inputCls}><option value="">Chưa cập nhật</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option></select> : <div className={styles.value}>{profile.profile?.gender === 'MALE' ? 'Nam' : profile.profile?.gender === 'FEMALE' ? 'Nữ' : 'Chưa cập nhật'}</div>}
                        </ProfileField>
                        <ProfileField label="Số điện thoại" icon={Phone} readOnly>
                            <div className={styles.value}>{profile.profile?.phone || 'Chưa cập nhật'}</div>
                        </ProfileField>
                        <ProfileField label="Email" icon={Mail} readOnly>
                            <div className={styles.value}>{profile.profile?.email || 'Chưa cập nhật'}</div>
                        </ProfileField>
                        <ProfileField label="Địa chỉ" icon={MapPin} id={editing ? 'staff-address' : undefined} wide>
                            {editing ? <textarea id="staff-address" rows={2} value={editForm.address} onChange={e => setEditForm(p => ({...p, address: e.target.value}))} className={inputCls} placeholder="Địa chỉ"/> : <div className={styles.value}>{profile.profile?.address || 'Chưa cập nhật'}</div>}
                        </ProfileField>
                    </div>
                    <p className={styles.note}><Shield size={17}/>Email và số điện thoại chỉ xem tại đây, không chỉnh sửa trong hồ sơ cá nhân.</p>
                </section>

                <section className={styles.card}>
                    <div className={styles.cardHeading}><Briefcase size={21}/><div><h2>Thông tin công việc</h2><p>Chuyên khoa, học vị và nơi đào tạo.</p></div></div>
                    <div className={styles.fields}>
                        <ProfileField label="Vai trò" icon={Shield} readOnly><div className={styles.value}>{roleLabel}</div></ProfileField>
                        <ProfileField label="Chuyên khoa" icon={Briefcase} readOnly><div className={styles.value}>{profile.specialization?.name || 'Không có'}</div></ProfileField>
                        <ProfileField label="Học vị" id={editing ? 'staff-degree' : undefined} wide>
                            {editing ? <input id="staff-degree" value={editForm.highestDegree || ''} onChange={e => setEditForm(p => ({...p, highestDegree: e.target.value}))} className={inputCls} placeholder="Ví dụ: Bác sĩ chuyên khoa I, Thạc sĩ" maxLength={100}/> : <div className={styles.value}>{profile.highestDegree || 'Chưa cập nhật'}</div>}
                        </ProfileField>
                        <ProfileField label="Trường đào tạo" id={editing ? 'staff-university' : undefined} wide>
                            {editing ? <input id="staff-university" value={editForm.university || ''} onChange={e => setEditForm(p => ({...p, university: e.target.value}))} className={inputCls} placeholder="Tên trường đào tạo" maxLength={200}/> : <div className={styles.value}>{profile.university || 'Chưa cập nhật'}</div>}
                        </ProfileField>
                    </div>
                    <p className={styles.note}><Briefcase size={17}/>Học vị và trường đào tạo không bắt buộc. Vai trò và chuyên khoa do quản trị quản lý.</p>
                </section>
            </div>}
        </div>;
    };


    // Chọn Layout dựa trên systemRole
    const systemRole = localStorage.getItem('systemRole') || sessionStorage.getItem('systemRole') || '';

    let Layout = ReceptionistLayout; // fallback
    if (systemRole === 'ADMIN') {
        Layout = AdminLayout;
    } else if (systemRole === 'CLINIC_MANAGER') {
        Layout = OwnerLayout;
    } else if (systemRole === 'CASHIER') {
        Layout = CashierLayout;
    } else if (['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'NURSE'].includes(systemRole)) {
        Layout = MedicalStaffLayout;
    }

    return (
        <Layout>
            <div className={styles.page}>
                {renderContent()}
                {showPasswordModal && <ChangePasswordModal />}
            </div>
        </Layout>
    );
}

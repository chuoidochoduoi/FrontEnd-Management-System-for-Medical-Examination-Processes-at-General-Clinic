import { useState, useEffect } from 'react';
import { UserCircle, Key, Phone, Mail, User, Shield, Briefcase, MapPin, Calendar, Edit2, Check, X, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import OwnerLayout from '@/components/layout/OwnerLayout';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import CashierLayout from '@/components/layout/CashierLayout';

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
        if (!/^(\+84|0)\d{9,10}$/.test(editForm.phone?.trim() || '')) return toast.error('Số điện thoại Việt Nam không hợp lệ');
        if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) return toast.error('Email không hợp lệ');
        if (!editForm.gender) return toast.error('Vui lòng chọn giới tính');
        if (!editForm.dateOfBirth || new Date(editForm.dateOfBirth) >= new Date()) return toast.error('Ngày sinh phải là ngày hợp lệ trong quá khứ');
        if (editForm.address?.length > 255) return toast.error('Địa chỉ không được vượt quá 255 ký tự');
        setSaving(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/profiles/me`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || data?.error || 'Cập nhật hồ sơ thất bại');
            }
            const updatedProfile = await res.json();

            const professionalRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/me/professional`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    highestDegree: editForm.highestDegree?.trim() || null,
                    university: editForm.university?.trim() || null
                })
            });
            if (!professionalRes.ok) {
                const data = await professionalRes.json().catch(() => null);
                throw new Error(data?.message || data?.error || 'Cập nhật học vị và trường đào tạo thất bại');
            }
            const updatedStaff = await professionalRes.json();

            setProfile(prev => ({
                ...prev,
                ...updatedStaff,
                profile: updatedProfile
            }));
            
            toast.success('Đã cập nhật hồ sơ cá nhân');
            setEditing(false);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const renderContent = () => {
        if (loading) return <div className="p-8 text-center text-gray-500">Đang tải hồ sơ...</div>;
        
        const inputCls = "w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all";
        
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Profile */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-inner">
                            <UserCircle className="w-20 h-20 text-primary-400" />
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile?.profile?.fullName || account?.username || 'Chưa cập nhật'}</h1>
                                <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2 text-sm">
                                    <Shield className="w-4 h-4" />
                                    Vai trò: <span className="font-semibold text-gray-700">{account?.systemRole || account?.role || 'Nhân viên'}</span>
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {editing ? (
                                    <>
                                        <button 
                                            onClick={() => setEditing(false)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                        >
                                            <X className="w-4 h-4" /> Hủy
                                        </button>
                                        <button 
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                                        >
                                            <Check className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => setEditing(true)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all active:scale-95 shadow-sm"
                                        >
                                            <Edit2 className="w-4 h-4" /> Sửa hồ sơ
                                        </button>
                                        <button 
                                            onClick={() => setShowPasswordModal(true)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                                        >
                                            <Key className="w-4 h-4" /> Đổi mật khẩu
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-500" />
                            Thông tin cá nhân & Công việc
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Tên Đăng Nhập</label>
                                <div className="px-4 py-2.5 bg-gray-100 border border-gray-100 rounded-lg text-gray-600 text-sm opacity-80 cursor-not-allowed">
                                    {account?.username || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5"/> Họ & Tên</label>
                                {editing ? (
                                    <input value={editForm.fullName} onChange={e => setEditForm(p => ({...p, fullName: e.target.value.replace(/\d/g, '')}))} className={inputCls} placeholder="Nhập họ tên" />
                                ) : (
                                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-gray-800 text-sm">
                                        {profile?.profile?.fullName || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Số Điện Thoại</label>
                                {editing ? (
                                    <input value={editForm.phone} onChange={e => setEditForm(p => ({...p, phone: e.target.value}))} className={inputCls} placeholder="Số điện thoại" />
                                ) : (
                                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-gray-800 text-sm">
                                        {profile?.profile?.phone || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> Email</label>
                                {editing ? (
                                    <input value={editForm.email} onChange={e => setEditForm(p => ({...p, email: e.target.value}))} className={inputCls} placeholder="Email" />
                                ) : (
                                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-gray-800 text-sm">
                                        {profile?.profile?.email || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Giới Tính</label>
                                {editing ? (
                                    <select value={editForm.gender} onChange={e => setEditForm(p => ({...p, gender: e.target.value}))} className={inputCls}>
                                        <option value="">Chưa cập nhật</option>
                                        <option value="MALE">Nam</option>
                                        <option value="FEMALE">Nữ</option>
                                    </select>
                                ) : (
                                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-gray-800 text-sm">
                                        {profile?.profile?.gender === 'MALE' ? 'Nam' : profile?.profile?.gender === 'FEMALE' ? 'Nữ' : 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Ngày Sinh</label>
                                {editing ? (
                                    <DateDropdowns value={editForm.dateOfBirth} onChange={val => setEditForm(p => ({...p, dateOfBirth: val}))} className={inputCls + " px-2"} />
                                ) : (
                                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-gray-800 text-sm">
                                        {profile?.profile?.dateOfBirth ? new Date(profile.profile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Địa Chỉ</label>
                                {editing ? (
                                    <input value={editForm.address} onChange={e => setEditForm(p => ({...p, address: e.target.value}))} className={inputCls} placeholder="Địa chỉ" />
                                ) : (
                                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-gray-800 text-sm">
                                        {profile?.profile?.address || 'Chưa cập nhật'}
                                    </div>
                                )}
                            </div>
                            
                            {/* Readonly Info: Job related */}
                            <div className="pt-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> Chuyên Khoa</label>
                                <div className="px-4 py-2.5 bg-gray-100 border border-gray-100 rounded-lg text-gray-600 text-sm opacity-80 cursor-not-allowed">
                                    {profile?.specialization?.name || 'Không có'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Học vị (không bắt buộc)</label>
                                {editing ? (
                                    <input value={editForm.highestDegree || ''} onChange={e => setEditForm(p => ({...p, highestDegree: e.target.value}))} className={inputCls} placeholder="Ví dụ: Bác sĩ chuyên khoa I, Thạc sĩ" maxLength={100} />
                                ) : (
                                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-gray-800 text-sm">{profile?.highestDegree || 'Chưa cập nhật'}</div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Trường đào tạo (không bắt buộc)</label>
                                {editing ? (
                                    <input value={editForm.university || ''} onChange={e => setEditForm(p => ({...p, university: e.target.value}))} className={inputCls} placeholder="Tên trường đào tạo" maxLength={200} />
                                ) : (
                                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-lg text-gray-800 text-sm">{profile?.university || 'Chưa cập nhật'}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Chọn Layout dựa trên systemRole
    const systemRole = localStorage.getItem('systemRole') || sessionStorage.getItem('systemRole') || '';
    
    let Layout = ReceptionistLayout; // fallback
    if (systemRole === 'CLINIC_MANAGER') {
        Layout = OwnerLayout;
    } else if (systemRole === 'CASHIER') {
        Layout = CashierLayout;
    } else if (['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'NURSE'].includes(systemRole)) {
        Layout = MedicalStaffLayout;
    }

    return (
        <Layout>
            <div className="p-4 md:p-8 min-h-screen bg-gray-50/50">
                {renderContent()}
                {showPasswordModal && <ChangePasswordModal />}
            </div>
        </Layout>
    );
}

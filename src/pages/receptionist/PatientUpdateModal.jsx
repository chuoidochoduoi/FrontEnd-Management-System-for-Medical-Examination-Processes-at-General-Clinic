import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function PatientUpdateModal({ patient, onClose, onUpdateSuccess }) {
    const [formData, setFormData] = useState({
        fullName: patient.fullName || '',
        phone: patient.phone || '',
        email: patient.email || '',
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
        gender: patient.gender || 'MALE',
        bloodType: patient.bloodType || 'UNKNOWN',
        address: patient.address || '',
        height: patient.height || '',
        weight: patient.weight || '',
        allergies: patient.allergies || ''
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/receptionist/records/customers/${patient.id || patient.profileId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Lỗi cập nhật hồ sơ');
            }

            toast.success('Cập nhật hồ sơ bệnh nhân thành công!');
            onUpdateSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 className="text-base font-bold text-gray-900">Cập nhật hồ sơ bệnh nhân</h2>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="max-h-[70vh] overflow-y-auto px-6 py-5 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="mb-1 block text-xs font-medium text-gray-700">Họ và tên *</label>
                                <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="mb-1 block text-xs font-medium text-gray-700">Số điện thoại *</label>
                                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="mb-1 block text-xs font-medium text-gray-700">Ngày sinh</label>
                                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="mb-1 block text-xs font-medium text-gray-700">Giới tính</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
                                    <option value="MALE">Nam</option>
                                    <option value="FEMALE">Nữ</option>
                                    <option value="OTHER">Khác</option>
                                </select>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="mb-1 block text-xs font-medium text-gray-700">Nhóm máu</label>
                                <select name="bloodType" value={formData.bloodType} onChange={handleChange} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
                                    <option value="UNKNOWN">Chưa rõ</option>
                                    <option value="A_PLUS">A+</option>
                                    <option value="A_MINUS">A-</option>
                                    <option value="B_PLUS">B+</option>
                                    <option value="B_MINUS">B-</option>
                                    <option value="O_PLUS">O+</option>
                                    <option value="O_MINUS">O-</option>
                                    <option value="AB_PLUS">AB+</option>
                                    <option value="AB_MINUS">AB-</option>
                                </select>
                            </div>
                            
                            <div className="col-span-2 sm:col-span-1">
                                <label className="mb-1 block text-xs font-medium text-gray-700">Chiều cao (cm)</label>
                                <input type="number" name="height" value={formData.height} onChange={handleChange} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="mb-1 block text-xs font-medium text-gray-700">Cân nặng (kg)</label>
                                <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
                            </div>

                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-medium text-gray-700">Địa chỉ</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
                            </div>

                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-medium text-gray-700">Dị ứng</label>
                                <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows="2" className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
                        <button type="button" onClick={onClose} disabled={saving} className="h-9 rounded-xl px-5 text-sm font-medium text-gray-600 hover:bg-gray-100">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving} className="h-9 rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-70">
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { Eye, Search, X, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import OwnerLayout from '@/components/layout/OwnerLayout';

const PAGE_SIZE = 7;
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop";

const workplace = (staff) => {
    if (staff.departmentName) return staff.departmentName;
    if (staff.systemRole === 'RECEPTIONIST') return 'Quầy lễ tân';
    if (staff.systemRole === 'CASHIER') return 'Phòng thu ngân';
    return '-';
};
const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '-';
const gender = (value) => value === 'MALE' ? 'Nam' : value === 'FEMALE' ? 'Nữ' : '-';

// Modal Xem Chi Tiết
function StaffModal({ staff, onClose, onOpenEditAvatar }) {
    if (!staff) return null;
    const Field = ({ label, value }) => (
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="mt-1 text-sm text-gray-800">{value || '-'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <h2 className="font-bold text-gray-900">Chi tiết nhân sự</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
                </div>
                <div className="p-5">
                    {/* Ảnh đại diện */}
                    <div className="mb-5 flex items-center gap-4 rounded-xl bg-gray-50 p-3 border border-gray-100">
                        <img
                            src={staff.address?.startsWith('http') ? staff.address : DEFAULT_AVATAR}
                            alt={staff.fullName}
                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                            className="h-16 w-16 rounded-full object-cover border border-gray-200"
                        />
                        <div className="flex-1">
                            <h4 className="text-base font-bold text-gray-900">{staff.fullName}</h4>
                            <p className="text-xs text-gray-500">{staff.systemRole} • {staff.specializationName || 'Chưa phân khoa'}</p>
                        </div>
                        <button
                            onClick={() => { onClose(); onOpenEditAvatar(staff); }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs"
                        >
                            <ImageIcon size={14}/> Đổi ảnh đại diện
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2"><h3 className="text-xs font-bold uppercase tracking-wide text-primary-600">Thông tin cá nhân</h3></div>
                        <Field label="Mã nhân viên" value={staff.staffCode}/><Field label="Họ và tên" value={staff.fullName}/>
                        <Field label="Ngày sinh" value={formatDate(staff.dateOfBirth)}/><Field label="Giới tính" value={gender(staff.gender)}/>
                        <Field label="Số điện thoại" value={staff.phone}/><Field label="Email" value={staff.email}/>
                        <div className="sm:col-span-2"><Field label="Địa chỉ / Link ảnh" value={staff.address}/></div>

                        <div className="sm:col-span-2 mt-1"><h3 className="text-xs font-bold uppercase tracking-wide text-primary-600">Thông tin chuyên môn</h3></div>
                        <Field label="Chức danh" value={staff.systemRole}/><Field label="Chuyên khoa" value={staff.specializationName}/>
                        <Field label="Phòng làm việc" value={workplace(staff)}/><Field label="Học vị" value={staff.highestDegree}/>
                        <div className="sm:col-span-2"><Field label="Trường đào tạo" value={staff.university}/></div>
                    </div>
                </div>
                <div className="flex justify-end border-t px-5 py-4">
                    <button onClick={onClose} className="h-10 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white hover:bg-gray-800 transition">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

// Modal Cập Nhật Ảnh Đại Diện Bác Sĩ
function EditAvatarModal({ staff, onClose, onSuccess }) {
    if (!staff) return null;
    const [avatarUrl, setAvatarUrl] = useState(staff.address || '');
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setErrorMsg('');
        try {
            // Lấy dữ liệu chi tiết hiện tại của staff để giữ nguyên các trường khác
            const getRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${staff.staffId}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const curData = getRes.ok ? (await getRes.json()).data || {} : {};

            const payload = {
                fullName: curData.fullName || staff.fullName,
                phone: curData.phone || staff.phone,
                email: curData.email || staff.email,
                dateOfBirth: curData.dateOfBirth || staff.dateOfBirth,
                gender: curData.gender || staff.gender,
                address: avatarUrl.trim(), // Lưu URL ảnh vào address
                nationalId: curData.nationalId || staff.nationalId,
                licenseNumber: curData.licenseNumber || staff.licenseNumber,
                bankAccount: curData.bankAccount || staff.bankAccount,
                highestDegree: curData.highestDegree || staff.highestDegree,
                university: curData.university || staff.university,
                specializationId: curData.specialization?.specializationId || staff.specializationId
            };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${staff.staffId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Không thể cập nhật ảnh đại diện');
            }

            onSuccess();
            onClose();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-fadeIn">
                <div className="flex items-center justify-between border-b px-5 py-4 bg-slate-50">
                    <h3 className="font-bold text-gray-900 text-sm">Cập nhật ảnh đại diện bác sĩ</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18}/></button>
                </div>

                <div className="p-5 space-y-4">
                    {errorMsg && (
                        <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex flex-col items-center justify-center gap-2">
                        <img
                            src={avatarUrl.startsWith('http') ? avatarUrl : DEFAULT_AVATAR}
                            alt="Preview"
                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                            className="h-24 w-24 rounded-full object-cover border-2 border-primary-500 shadow-md"
                        />
                        <span className="text-xs text-gray-400">Xem trước ảnh đại diện</span>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Đường dẫn ảnh (URL)
                        </label>
                        <input
                            type="text"
                            placeholder="https://images.unsplash.com/..."
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            className="w-full h-10 px-3 border border-gray-300 rounded-xl text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">Dán link ảnh trực tuyến (JPG, PNG) để hiển thị lên Landing Page.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t px-5 py-3.5 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Lưu ảnh
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ManagerStaffPage() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [editingAvatarStaff, setEditingAvatarStaff] = useState(null);

    const load = async (nextPage = 0, nextSearch = search) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ page: String(nextPage), size: String(PAGE_SIZE), search: nextSearch });
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/clinic-manager?${params}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!response.ok) throw new Error('Không thể tải danh sách nhân sự.');
            const data = await response.json();
            const payload = data.data ?? data;
            setItems(payload.content ?? payload.items ?? []);
            setTotal(payload.totalElements ?? payload.total ?? 0);
            setPage(payload.page ?? nextPage);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(0, ''); }, []);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <OwnerLayout>
            <div className="px-6 py-6 lg:px-8">
                <div className="mb-5">
                    <h1 className="text-lg font-semibold text-gray-900">Nhân sự</h1>
                    <p className="mt-1 text-sm text-gray-500">Tra cứu và quản lý thông tin, ảnh đại diện nhân sự trong phòng khám.</p>
                </div>

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="border-b p-4">
                        <div className="relative max-w-md">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input
                                value={search}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setSearch(value);
                                    load(0, value);
                                }}
                                placeholder="Tìm theo mã hoặc họ tên..."
                                className="h-10 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-primary-400"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px]">
                            <thead className="bg-gray-50 text-left text-xs text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Nhân sự</th>
                                <th className="px-4 py-3">Mã nhân viên</th>
                                <th className="px-4 py-3">Chức danh</th>
                                <th className="px-4 py-3">Chuyên môn</th>
                                <th className="px-4 py-3">Phòng làm việc</th>
                                <th className="px-4 py-3">Số điện thoại</th>
                                <th className="px-4 py-3">Trạng thái</th>
                                <th className="px-4 py-3 text-right">Thao tác</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="8" className="px-4 py-12 text-center text-sm text-gray-400">Đang tải...</td></tr>
                            ) : error ? (
                                <tr><td colSpan="8" className="px-4 py-12 text-center text-sm text-red-600">{error}</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan="8" className="px-4 py-12 text-center text-sm text-gray-400">Không có nhân sự phù hợp.</td></tr>
                            ) : (
                                items.map((staff) => (
                                    <tr key={staff.staffId} className="hover:bg-gray-50">
                                        {/* Cột ảnh + tên */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={staff.address?.startsWith('http') ? staff.address : DEFAULT_AVATAR}
                                                    alt={staff.fullName}
                                                    onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                                                    className="h-9 w-9 rounded-full object-cover border border-gray-200 shrink-0"
                                                />
                                                <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                                    {staff.fullName}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{staff.staffCode}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{staff.systemRole || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{staff.specializationName || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{workplace(staff)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{staff.phone || '-'}</td>
                                        <td className="px-4 py-3 text-sm">
                                                <span className={`rounded-full px-2 py-1 text-xs ${staff.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {staff.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    onClick={() => setEditingAvatarStaff(staff)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                    title="Đổi ảnh đại diện"
                                                >
                                                    <ImageIcon size={13}/> Ảnh
                                                </button>
                                                <button
                                                    onClick={() => setSelected(staff)}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                                                >
                                                    <Eye size={15}/> Chi tiết
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {total > 0 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <p className="text-xs text-gray-500">
                                Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}
                            </p>
                            <div className="flex gap-2">
                                <button disabled={page === 0} onClick={() => load(page - 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">
                                    Trước
                                </button>
                                <span className="px-2 py-1.5 text-sm">{page + 1}/{totalPages}</span>
                                <button disabled={page + 1 >= totalPages} onClick={() => load(page + 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Modal Xem chi tiết */}
                <StaffModal
                    staff={selected}
                    onClose={() => setSelected(null)}
                    onOpenEditAvatar={(st) => setEditingAvatarStaff(st)}
                />

                {/* Modal Cập nhật ảnh đại diện */}
                <EditAvatarModal
                    staff={editingAvatarStaff}
                    onClose={() => setEditingAvatarStaff(null)}
                    onSuccess={() => load(page, search)}
                />
            </div>
        </OwnerLayout>
    );
}
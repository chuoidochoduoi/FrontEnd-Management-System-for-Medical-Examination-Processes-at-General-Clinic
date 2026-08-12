import { useEffect, useState } from 'react';
import { Eye, Search, X } from 'lucide-react';
import OwnerLayout from '@/components/layout/OwnerLayout';

const PAGE_SIZE = 7;
const workplace = (staff) => {
    if (staff.departmentName) return staff.departmentName;
    if (staff.systemRole === 'RECEPTIONIST') return 'Quầy lễ tân';
    if (staff.systemRole === 'CASHIER') return 'Phòng thu ngân';
    return '-';
};
const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '-';
const gender = (value) => value === 'MALE' ? 'Nam' : value === 'FEMALE' ? 'Nữ' : '-';

function StaffModal({ staff, onClose }) {
    if (!staff) return null;
    const Field = ({ label, value }) => <div><p className="text-xs text-gray-400">{label}</p><p className="mt-1 text-sm text-gray-800">{value || '-'}</p></div>;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-bold text-gray-900">Chi tiết nhân sự</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20}/></button></div>
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2"><h3 className="text-xs font-bold uppercase tracking-wide text-primary-600">Thông tin cá nhân</h3></div>
                <Field label="Mã nhân viên" value={staff.staffCode}/><Field label="Họ và tên" value={staff.fullName}/>
                <Field label="Ngày sinh" value={formatDate(staff.dateOfBirth)}/><Field label="Giới tính" value={gender(staff.gender)}/>
                <Field label="Số điện thoại" value={staff.phone}/><Field label="Email" value={staff.email}/>
                <div className="sm:col-span-2"><Field label="Địa chỉ" value={staff.address}/></div>
                <div className="sm:col-span-2 mt-1"><h3 className="text-xs font-bold uppercase tracking-wide text-primary-600">Thông tin chuyên môn</h3></div>
                <Field label="Chức danh" value={staff.systemRole}/><Field label="Chuyên khoa" value={staff.specializationName}/>
                <Field label="Phòng làm việc" value={workplace(staff)}/><Field label="Học vị" value={staff.highestDegree}/>
                <div className="sm:col-span-2"><Field label="Trường đào tạo" value={staff.university}/></div>
            </div>
            <div className="flex justify-end border-t px-5 py-4"><button onClick={onClose} className="h-10 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white">Đóng</button></div>
        </div>
    </div>;
}

export default function ManagerStaffPage() {
    const [items, setItems] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(0);
    const [search, setSearch] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [selected, setSelected] = useState(null);
    const load = async (nextPage = 0, nextSearch = search) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ page: String(nextPage), size: String(PAGE_SIZE), search: nextSearch });
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/clinic-manager?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } });
            if (!response.ok) throw new Error('Không thể tải danh sách nhân sự.');
            const data = await response.json(); const payload = data.data ?? data;
            setItems(payload.content ?? payload.items ?? []); setTotal(payload.totalElements ?? payload.total ?? 0); setPage(payload.page ?? nextPage);
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    useEffect(() => { load(0, ''); }, []);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return <OwnerLayout><div className="px-6 py-6 lg:px-8">
        <div className="mb-5"><h1 className="text-lg font-semibold text-gray-900">Nhân sự</h1><p className="mt-1 text-sm text-gray-500">Tra cứu thông tin nhân sự và chuyên môn trong phòng khám.</p></div>
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b p-4"><div className="relative max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={(event) => { const value = event.target.value; setSearch(value); load(0, value); }} placeholder="Tìm theo mã hoặc họ tên..." className="h-10 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-primary-400"/></div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[900px]"><thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Mã nhân viên</th><th className="px-4 py-3">Họ và tên</th><th className="px-4 py-3">Chức danh</th><th className="px-4 py-3">Chuyên môn</th><th className="px-4 py-3">Phòng làm việc</th><th className="px-4 py-3">Số điện thoại</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-gray-100">
                {loading ? <tr><td colSpan="8" className="px-4 py-12 text-center text-sm text-gray-400">Đang tải...</td></tr> : error ? <tr><td colSpan="8" className="px-4 py-12 text-center text-sm text-red-600">{error}</td></tr> : items.length === 0 ? <tr><td colSpan="8" className="px-4 py-12 text-center text-sm text-gray-400">Không có nhân sự phù hợp.</td></tr> : items.map((staff) => <tr key={staff.staffId} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm text-gray-500">{staff.staffCode}</td><td className="px-4 py-3 text-sm font-medium text-gray-900">{staff.fullName}</td><td className="px-4 py-3 text-sm text-gray-700">{staff.systemRole || '-'}</td><td className="px-4 py-3 text-sm text-gray-700">{staff.specializationName || '-'}</td><td className="px-4 py-3 text-sm text-gray-700">{workplace(staff)}</td><td className="px-4 py-3 text-sm text-gray-700">{staff.phone || '-'}</td><td className="px-4 py-3 text-sm"><span className={`rounded-full px-2 py-1 text-xs ${staff.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{staff.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span></td><td className="px-4 py-3 text-right"><button onClick={() => setSelected(staff)} className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"><Eye size={15}/> Xem chi tiết</button></td></tr>)}
            </tbody></table></div>
            {total > 0 && <div className="flex items-center justify-between border-t px-4 py-3"><p className="text-xs text-gray-500">Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}</p><div className="flex gap-2"><button disabled={page === 0} onClick={() => load(page - 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Trước</button><span className="px-2 py-1.5 text-sm">{page + 1}/{totalPages}</span><button disabled={page + 1 >= totalPages} onClick={() => load(page + 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Sau</button></div></div>}
        </section>
        <StaffModal staff={selected} onClose={() => setSelected(null)}/>
    </div></OwnerLayout>;
}

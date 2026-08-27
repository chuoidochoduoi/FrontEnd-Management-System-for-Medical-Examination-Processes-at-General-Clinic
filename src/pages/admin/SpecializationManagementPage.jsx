import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmModal from '@/components/ui/ConfirmModal';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const headers = () => ({ Authorization: `Bearer ${get('token')}` });

const readError = async (response, fallback) => {
    const data = await response.json().catch(() => null);
    return data?.message || fallback;
};

export default function SpecializationManagementPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', active: true });
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('ALL');
    const [sort, setSort] = useState('name-asc');

    const load = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/specializations?page=0&size=200`,
                { headers: headers() },
            );
            if (!response.ok) throw new Error(await readError(response, 'Không thể tải danh mục chuyên khoa'));
            const data = await response.json();
            setItems(data.content ?? []);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing({});
        setForm({ name: '', description: '', active: true });
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            name: item.name || '',
            description: item.description || '',
            active: item.active !== false,
        });
    };

    const save = async () => {
        const normalizedName = form.name.trim().replace(/\s+/g, ' ');
        if (!normalizedName) return toast.error('Vui lòng nhập tên chuyên khoa');
        if (normalizedName.length > 150) return toast.error('Tên chuyên khoa không được quá 150 ký tự');
        if (form.description.length > 500) return toast.error('Mô tả không được quá 500 ký tự');
        const duplicated = items.some((item) => item.specializationId !== editing.specializationId
            && item.name?.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi') === normalizedName.toLocaleLowerCase('vi'));
        if (duplicated) return toast.error(`Tên chuyên khoa đã tồn tại: ${normalizedName}`);

        setSaving(true);
        try {
            const isEdit = Boolean(editing.specializationId);
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/specializations${isEdit ? `/${editing.specializationId}` : ''}`,
                {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: { ...headers(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: normalizedName,
                        description: form.description.trim(),
                        active: form.active,
                    }),
                },
            );
            if (!response.ok) throw new Error(await readError(response, 'Không thể lưu chuyên khoa'));
            toast.success(isEdit ? 'Cập nhật chuyên khoa thành công!' : 'Thêm chuyên khoa thành công!');
            setEditing(null);
            await load();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/specializations/${deleting.specializationId}`,
                { method: 'DELETE', headers: headers() },
            );
            if (!response.ok) throw new Error(await readError(response, 'Không thể xóa chuyên khoa'));
            toast.success('Xóa chuyên khoa thành công!');
            setDeleting(null);
            await load();
        } catch (error) {
            toast.error(error.message);
            setDeleting(null);
        }
    };

    const visibleItems = useMemo(() => items
        .filter((item) => !search.trim()
            || item.name?.toLowerCase().includes(search.trim().toLowerCase())
            || item.description?.toLowerCase().includes(search.trim().toLowerCase()))
        .filter((item) => status === 'ALL' || (status === 'ACTIVE') === (item.active !== false))
        .sort((a, b) => {
            const result = (a.name || '').localeCompare(b.name || '', 'vi');
            return sort === 'name-desc' ? -result : result;
        }), [items, search, status, sort]);

    return <AdminLayout><div className="px-10 py-8 space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">Chuyên khoa phục vụ</h1>
                <p className="text-xs text-gray-400 mt-1">Quản lý chuyên khoa dùng cho phòng, dịch vụ, nhân sự và điều phối bệnh nhân.</p>
            </div>
            <button onClick={openCreate} className="h-10 px-4 bg-gray-900 text-white rounded-lg text-sm flex items-center gap-2">
                <Plus size={15}/>Thêm chuyên khoa
            </button>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 grid grid-cols-[1fr_200px_200px] gap-3">
            <div><label className="block text-xs text-gray-400 mb-1.5">Tìm kiếm</label><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full h-10 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent" placeholder="Tìm theo tên hoặc mô tả chuyên khoa"/></div>
            <div><label className="block text-xs text-gray-400 mb-1.5">Trạng thái hoạt động</label><select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full h-10 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"><option value="ALL">Tất cả</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option></select></div>
            <div><label className="block text-xs text-gray-400 mb-1.5">Sắp xếp</label><select value={sort} onChange={(event) => setSort(event.target.value)} className="w-full h-10 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"><option value="name-asc">Tên A–Z</option><option value="name-desc">Tên Z–A</option></select></div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_2fr_160px_120px] bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3 text-xs text-gray-500"><span>Tên chuyên khoa</span><span>Mô tả</span><span>Trạng thái hoạt động</span><span>Thao tác</span></div>
            {loading
                ? <p className="text-sm text-gray-400 text-center py-12">Đang tải...</p>
                : visibleItems.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-12">Không tìm thấy chuyên khoa</p>
                    : visibleItems.map((item) => <div key={item.specializationId} className="grid grid-cols-[1fr_2fr_160px_120px] px-6 py-4 border-b border-gray-50 dark:border-gray-800 items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white break-words pr-4">{item.name}</span>
                        <span className="text-sm text-gray-500 break-words pr-4">{item.description || '—'}</span>
                        <span><span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${item.active !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.active !== false ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span></span>
                        <div className="flex gap-3"><button title="Chỉnh sửa" onClick={() => openEdit(item)} className="text-gray-500 hover:text-gray-900"><Pencil size={15}/></button><button title="Xóa" onClick={() => setDeleting(item)} className="text-red-400 hover:text-red-600"><Trash2 size={15}/></button></div>
                    </div>)}
        </div>

        {editing && <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"><div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl">
            <div className="px-6 py-5 border-b dark:border-gray-700 flex justify-between"><h2 className="text-sm font-semibold">{editing.specializationId ? 'Sửa chuyên khoa' : 'Thêm chuyên khoa'}</h2><button onClick={() => setEditing(null)}><X size={18}/></button></div>
            <div className="p-6 space-y-4">
                <div><label className="block text-xs text-gray-500 mb-1.5">Tên chuyên khoa</label><input value={form.name} onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))} className="w-full h-10 px-3 border dark:border-gray-700 rounded-lg text-sm bg-transparent" placeholder="Ví dụ: Khám tổng quát, Nhi khoa"/></div>
                <div><label className="block text-xs text-gray-500 mb-1.5">Mô tả</label><textarea value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))} rows={3} className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-transparent"/></div>
                <div><label className="block text-xs text-gray-500 mb-1.5">Trạng thái hoạt động</label><select value={form.active ? 'ACTIVE' : 'INACTIVE'} onChange={(event) => setForm((previous) => ({ ...previous, active: event.target.value === 'ACTIVE' }))} className="w-full h-10 px-3 border dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option></select><p className="mt-1.5 text-xs text-gray-400">Chuyên khoa ngừng hoạt động không thể dùng cho cấu hình mới.</p></div>
            </div>
            <div className="px-6 py-4 border-t dark:border-gray-700 flex justify-end gap-3"><button onClick={() => setEditing(null)} className="px-4 text-sm text-gray-500">Hủy</button><button disabled={saving} onClick={save} className="h-9 px-5 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu'}</button></div>
        </div></div>}

        <ConfirmModal isOpen={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} title="Xóa chuyên khoa" message={`Chỉ có thể xóa chuyên khoa chưa từng được sử dụng. Bạn có chắc muốn xóa “${deleting?.name || ''}”?`} confirmText="Xóa" isDanger/>
    </div></AdminLayout>;
}

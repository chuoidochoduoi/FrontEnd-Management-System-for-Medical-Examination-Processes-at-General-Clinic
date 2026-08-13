import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmModal from '@/components/ui/ConfirmModal';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const headers = () => ({ Authorization: `Bearer ${get('token')}` });

export default function SpecializationManagementPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [form, setForm] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('name-asc');

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/specializations?page=0&size=200`, { headers: headers() });
            if (!res.ok) throw new Error('Không thể tải danh mục chuyên khoa');
            const data = await res.json();
            setItems(data.content ?? []);
        } catch (error) { toast.error(error.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing({}); setForm({ name: '', description: '' }); };
    const openEdit = item => { setEditing(item); setForm({ name: item.name || '', description: item.description || '' }); };
    const save = async () => {
        if (!form.name.trim()) return toast.error('Vui lòng nhập tên chuyên khoa');
        if (form.name.trim().length > 150) return toast.error('Tên chuyên khoa không được quá 150 ký tự');
        if (form.description.length > 500) return toast.error('Mô tả không được quá 500 ký tự');
        const normalizedName = form.name.trim().replace(/\s+/g, ' ');
        const duplicated = items.some(item => item.specializationId !== editing.specializationId
            && item.name?.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi') === normalizedName.toLocaleLowerCase('vi'));
        if (duplicated) return toast.error(`Tên chuyên khoa đã tồn tại: ${normalizedName}`);
        setSaving(true);
        try {
            const isEdit = !!editing.specializationId;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/specializations${isEdit ? `/${editing.specializationId}` : ''}`, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { ...headers(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: normalizedName, description: form.description.trim() })
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || 'Không thể lưu chuyên khoa');
            toast.success(isEdit ? 'Cập nhật chuyên khoa thành công!' : 'Thêm chuyên khoa thành công!');
            setEditing(null); await load();
        } catch (error) { toast.error(error.message); }
        finally { setSaving(false); }
    };

    const remove = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/specializations/${deleting.specializationId}`, { method: 'DELETE', headers: headers() });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || 'Không thể xóa chuyên khoa đang được sử dụng');
            toast.success('Xóa chuyên khoa thành công!'); setDeleting(null); await load();
        } catch (error) { toast.error(error.message); setDeleting(null); }
    };

    const visibleItems = items
        .filter(item => !search.trim() || item.name?.toLowerCase().includes(search.trim().toLowerCase()) || item.description?.toLowerCase().includes(search.trim().toLowerCase()))
        .sort((a, b) => {
            const result = (a.name || '').localeCompare(b.name || '', 'vi');
            return sort === 'name-desc' ? -result : result;
        });

    return <AdminLayout><div className="px-10 py-8 space-y-6">
        <div className="flex justify-between items-start">
            <div><h1 className="text-base font-semibold text-gray-900">Chuyên khoa phục vụ</h1><p className="text-xs text-gray-400 mt-1">Quản lý danh mục dùng chung cho phòng, dịch vụ và điều phối bệnh nhân.</p></div>
            <button onClick={openCreate} className="h-10 px-4 bg-gray-900 text-white rounded-lg text-sm flex items-center gap-2"><Plus size={15}/>Thêm chuyên khoa</button>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3">
            <div className="flex-1"><label className="block text-xs text-gray-400 mb-1.5">Tìm kiếm</label><input value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" placeholder="Tìm theo tên hoặc mô tả chuyên khoa"/></div>
            <div className="w-48"><label className="block text-xs text-gray-400 mb-1.5">Sắp xếp</label><select value={sort} onChange={e => setSort(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white"><option value="name-asc">Tên A–Z</option><option value="name-desc">Tên Z–A</option></select></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_2fr_120px] bg-gray-50 border-b px-6 py-3 text-xs text-gray-400"><span>Tên chuyên khoa</span><span>Mô tả</span><span>Thao tác</span></div>
            {loading ? <p className="text-sm text-gray-400 text-center py-12">Đang tải...</p> : visibleItems.length === 0 ? <p className="text-sm text-gray-400 text-center py-12">Không tìm thấy chuyên khoa</p> : visibleItems.map(item => <div key={item.specializationId} className="grid grid-cols-[1fr_2fr_120px] px-6 py-4 border-b border-gray-50 items-center">
                <span className="text-sm font-medium text-gray-900">{item.name}</span><span className="text-sm text-gray-500">{item.description || '—'}</span>
                <div className="flex gap-3"><button onClick={() => openEdit(item)} className="text-gray-500 hover:text-gray-900"><Pencil size={15}/></button><button onClick={() => setDeleting(item)} className="text-red-400 hover:text-red-600"><Trash2 size={15}/></button></div>
            </div>)}
        </div>
        {editing && <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="px-6 py-5 border-b flex justify-between"><h2 className="text-sm font-semibold">{editing.specializationId ? 'Sửa chuyên khoa' : 'Thêm chuyên khoa'}</h2><button onClick={() => setEditing(null)}><X size={18}/></button></div>
            <div className="p-6 space-y-4"><div><label className="block text-xs text-gray-500 mb-1.5">Tên chuyên khoa</label><input value={form.name} onChange={e => setForm(p => ({...p,name:e.target.value}))} className="w-full h-10 px-3 border rounded-lg text-sm" placeholder="Ví dụ: Khám tổng quát, Nhi khoa"/></div><div><label className="block text-xs text-gray-500 mb-1.5">Mô tả</label><textarea value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm"/></div></div>
            <div className="px-6 py-4 border-t flex justify-end gap-3"><button onClick={() => setEditing(null)} className="px-4 text-sm text-gray-500">Hủy</button><button disabled={saving} onClick={save} className="h-9 px-5 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu'}</button></div>
        </div></div>}
        <ConfirmModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} title="Xóa chuyên khoa" message={`Bạn có chắc muốn xóa “${deleting?.name || ''}”?`} confirmText="Xóa" isDanger/>
    </div></AdminLayout>;
}

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmModal from '@/components/ui/ConfirmModal';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const authHeaders = () => ({ Authorization: `Bearer ${get('token')}` });

export default function CapabilityManagementPage() {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [form, setForm] = useState({ code: '', name: '', description: '', active: true });

    const load = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/service-capabilities`, { headers: authHeaders() });
        if (!response.ok) return toast.error('Không thể tải danh mục năng lực');
        setItems(await response.json());
    };
    useEffect(() => { load(); }, []);

    const visible = useMemo(() => items.filter(item => {
        const keyword = search.trim().toLowerCase();
        return !keyword || item.code.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword);
    }), [items, search]);

    const open = item => {
        setEditing(item || {});
        setForm(item ? { code: item.code, name: item.name, description: item.description || '', active: item.active !== false }
            : { code: '', name: '', description: '', active: true });
    };
    const save = async () => {
        if (!form.code.trim() || !form.name.trim()) return toast.error('Vui lòng nhập mã và tên năng lực');
        const isEdit = !!editing.capabilityId;
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/service-capabilities${isEdit ? `/${editing.capabilityId}` : ''}`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) return toast.error(data?.message || 'Không thể lưu năng lực');
        toast.success(isEdit ? 'Cập nhật năng lực thành công' : 'Thêm năng lực thành công');
        setEditing(null); load();
    };
    const remove = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/service-capabilities/${deleting.capabilityId}`, { method: 'DELETE', headers: authHeaders() });
        const data = await response.json().catch(() => null);
        if (!response.ok) toast.error(data?.message || 'Không thể xóa danh mục kỹ thuật đang được sử dụng');
        else { toast.success('Xóa năng lực thành công'); load(); }
        setDeleting(null);
    };

    return <AdminLayout><div className="px-10 py-8 space-y-6">
        <div className="flex justify-between"><div><h1 className="text-base font-semibold">Năng lực thực hiện</h1><p className="text-xs text-gray-400 mt-1">Danh mục mở dùng để ghép dịch vụ với phòng phù hợp.</p></div><button onClick={() => open(null)} className="h-10 px-4 bg-gray-900 text-white rounded-lg text-sm flex gap-2 items-center"><Plus size={15}/>Thêm năng lực</button></div>
        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm" placeholder="Tìm theo mã hoặc tên năng lực"/>
        <div className="bg-white border rounded-2xl overflow-hidden"><div className="grid grid-cols-[180px_1fr_2fr_100px_100px] px-6 py-3 bg-gray-50 text-xs text-gray-400"><span>Mã</span><span>Tên năng lực</span><span>Mô tả</span><span>Trạng thái</span><span>Thao tác</span></div>
            {visible.map(item => <div key={item.capabilityId} className="grid grid-cols-[180px_1fr_2fr_100px_100px] px-6 py-4 border-t text-sm items-center"><span className="font-mono">{item.code}</span><span className="font-medium">{item.name}</span><span className="text-gray-500">{item.description || '—'}</span><span>{item.active ? 'Hoạt động' : 'Đã khóa'}</span><div className="flex gap-3"><button onClick={() => open(item)}><Pencil size={15}/></button><button className="text-red-500" onClick={() => setDeleting(item)}><Trash2 size={15}/></button></div></div>)}
        </div>
        {editing && <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"><div className="bg-white rounded-2xl w-full max-w-lg"><div className="p-5 border-b flex justify-between"><b>{editing.capabilityId ? 'Sửa năng lực' : 'Thêm năng lực'}</b><button onClick={() => setEditing(null)}><X size={18}/></button></div><div className="p-6 space-y-4"><input value={form.code} onChange={e => setForm(p => ({...p,code:e.target.value}))} className="w-full h-10 px-3 border rounded-lg" placeholder="Mã, ví dụ: HEMATOLOGY"/><input value={form.name} onChange={e => setForm(p => ({...p,name:e.target.value}))} className="w-full h-10 px-3 border rounded-lg" placeholder="Tên năng lực"/><textarea value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))} className="w-full p-3 border rounded-lg" placeholder="Mô tả"/><label className="flex gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm(p => ({...p,active:e.target.checked}))}/>Đang hoạt động</label></div><div className="p-5 border-t flex justify-end gap-3"><button onClick={() => setEditing(null)}>Hủy</button><button onClick={save} className="h-9 px-5 bg-gray-900 text-white rounded-lg">Lưu</button></div></div></div>}
        <ConfirmModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} title="Xóa năng lực" message={`Xóa “${deleting?.name || ''}”? Nếu đang được gắn với dịch vụ, phòng hoặc nhân sự, hệ thống sẽ yêu cầu chuyển sang ngừng hoạt động.`} confirmText="Xóa" isDanger/>
    </div></AdminLayout>;
}

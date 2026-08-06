import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X, Clock, Calendar, Check, Search, CalendarClock } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmModal from '@/components/ui/ConfirmModal';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const headers = () => ({ Authorization: `Bearer ${get('token')}` });

export default function ShiftManagementPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [form, setForm] = useState({ name: '', startTime: '', endTime: '', isActive: true });
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('startTime-asc');

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/shifts`, { headers: headers() });
            if (!res.ok) throw new Error('Không thể tải danh sách ca làm việc');
            const data = await res.json();
            // The API might return the array directly in data.data or data based on ShiftConfigController 
            setItems(data.data ?? []);
        } catch (error) { toast.error(error.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { 
        setEditing({}); 
        setForm({ name: '', startTime: '', endTime: '', isActive: true }); 
    };
    
    const openEdit = item => { 
        setEditing(item); 
        setForm({ 
            name: item.name || '', 
            startTime: item.startTime || '', 
            endTime: item.endTime || '',
            isActive: item.isActive !== false
        }); 
    };

    const save = async () => {
        if (!form.name.trim()) return toast.error('Vui lòng nhập tên ca làm việc');
        if (!form.startTime) return toast.error('Vui lòng chọn giờ bắt đầu');
        if (!form.endTime) return toast.error('Vui lòng chọn giờ kết thúc');
        if (form.startTime >= form.endTime) return toast.error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
        
        setSaving(true);
        try {
            const isEdit = !!editing.shiftId;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/shifts${isEdit ? `/${editing.shiftId}` : ''}`, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { ...headers(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: form.name.trim(), 
                    startTime: form.startTime, 
                    endTime: form.endTime,
                    isActive: form.isActive
                })
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || 'Không thể lưu ca làm việc');
            toast.success(isEdit ? 'Cập nhật ca làm việc thành công!' : 'Thêm ca làm việc thành công!');
            setEditing(null); 
            await load();
        } catch (error) { toast.error(error.message); }
        finally { setSaving(false); }
    };

    const remove = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/shifts/${deleting.shiftId}`, { 
                method: 'DELETE', 
                headers: headers() 
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || 'Không thể xóa ca làm việc này');
            toast.success('Xóa ca làm việc thành công!'); 
            setDeleting(null); 
            await load();
        } catch (error) { 
            toast.error(error.message); 
            setDeleting(null); 
        }
    };

    const visibleItems = items
        .filter(item => !search.trim() || item.name?.toLowerCase().includes(search.trim().toLowerCase()))
        .sort((a, b) => {
            if (sort === 'startTime-asc') return (a.startTime || '').localeCompare(b.startTime || '');
            if (sort === 'startTime-desc') return (b.startTime || '').localeCompare(a.startTime || '');
            const result = (a.name || '').localeCompare(b.name || '', 'vi');
            return sort === 'name-desc' ? -result : result;
        });

    return (
        <AdminLayout>
            <div className="px-10 py-8 space-y-8 max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="flex justify-between items-start bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                            <CalendarClock size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Cấu hình ca làm việc</h1>
                            <p className="text-sm text-gray-500 mt-1">Quản lý các khung giờ làm việc và phân ca trực cho phòng khám.</p>
                        </div>
                    </div>
                    <button 
                        onClick={openCreate} 
                        className="h-10 px-5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl text-sm flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Thêm ca mới
                    </button>
                </div>

                {/* Toolbar */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-4 shadow-sm items-end">
                    <div className="flex-1 relative">
                        <label className="block text-xs font-medium text-gray-500 mb-2">Tìm kiếm ca</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                className="w-full h-10 pl-10 pr-4 border border-gray-200 focus:border-primary-500 rounded-xl text-sm outline-none transition-colors" 
                                placeholder="Tìm theo tên ca làm việc..."
                            />
                        </div>
                    </div>
                    <div className="w-56">
                        <label className="block text-xs font-medium text-gray-500 mb-2">Sắp xếp theo</label>
                        <select 
                            value={sort} 
                            onChange={e => setSort(e.target.value)} 
                            className="w-full h-10 px-4 border border-gray-200 focus:border-primary-500 rounded-xl text-sm bg-white outline-none transition-colors appearance-none cursor-pointer"
                        >
                            <option value="startTime-asc">Giờ bắt đầu (Sớm - Muộn)</option>
                            <option value="startTime-desc">Giờ bắt đầu (Muộn - Sớm)</option>
                            <option value="name-asc">Tên (A–Z)</option>
                            <option value="name-desc">Tên (Z–A)</option>
                        </select>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-[1fr_1.5fr_1fr_100px] bg-gray-50/80 border-b border-gray-200 px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span>Tên ca làm việc</span>
                        <span>Khung giờ</span>
                        <span>Trạng thái</span>
                        <span className="text-right">Thao tác</span>
                    </div>
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
                            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm">Đang tải dữ liệu...</p>
                        </div>
                    ) : visibleItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">Chưa có ca làm việc nào</h3>
                            <p className="text-sm text-gray-400 mb-4">Hãy thêm mới để bắt đầu quản lý lịch trực.</p>
                            <button onClick={openCreate} className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
                                <Plus size={16} /> Thêm ca đầu tiên
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {visibleItems.map(item => (
                                <div key={item.shiftId} className="grid grid-cols-[1fr_1.5fr_1fr_100px] px-6 py-4 items-center hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Clock size={16} />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                        <span className="bg-gray-100 px-2 py-1 rounded-md border border-gray-200">{item.startTime}</span>
                                        <span className="text-gray-400">—</span>
                                        <span className="bg-gray-100 px-2 py-1 rounded-md border border-gray-200">{item.endTime}</span>
                                    </div>
                                    
                                    <div>
                                        {item.isActive ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Đang hoạt động
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Đã tạm ẩn
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => openEdit(item)} 
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                            title="Sửa"
                                        >
                                            <Pencil size={16}/>
                                        </button>
                                        <button 
                                            onClick={() => setDeleting(item)} 
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            title="Xóa"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal Thêm/Sửa */}
                {editing && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-base font-bold text-gray-900">
                                    {editing.shiftId ? 'Cập nhật ca làm việc' : 'Thêm ca làm việc mới'}
                                </h2>
                                <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                                    <X size={20}/>
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên ca làm việc <span className="text-red-500">*</span></label>
                                    <input 
                                        value={form.name} 
                                        onChange={e => setForm(p => ({...p, name: e.target.value}))} 
                                        className="w-full h-11 px-4 border border-gray-200 focus:border-primary-500 rounded-xl text-sm outline-none transition-colors" 
                                        placeholder="Ví dụ: Ca Sáng, Ca Chiều..."
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Giờ bắt đầu <span className="text-red-500">*</span></label>
                                        <input 
                                            type="time"
                                            value={form.startTime} 
                                            onChange={e => setForm(p => ({...p, startTime: e.target.value}))} 
                                            className="w-full h-11 px-4 border border-gray-200 focus:border-primary-500 rounded-xl text-sm outline-none transition-colors" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Giờ kết thúc <span className="text-red-500">*</span></label>
                                        <input 
                                            type="time"
                                            value={form.endTime} 
                                            onChange={e => setForm(p => ({...p, endTime: e.target.value}))} 
                                            className="w-full h-11 px-4 border border-gray-200 focus:border-primary-500 rounded-xl text-sm outline-none transition-colors" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${form.isActive ? 'bg-primary-500' : 'bg-gray-200'}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={form.isActive} 
                                            onChange={e => setForm(p => ({...p, isActive: e.target.checked}))}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">Trạng thái hoạt động</p>
                                            <p className="text-xs text-gray-500">Cho phép phân công nhân viên vào ca này</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                                <button 
                                    onClick={() => setEditing(null)} 
                                    className="px-5 h-10 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    disabled={saving} 
                                    onClick={save} 
                                    className="h-10 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium disabled:opacity-70 transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    {saving ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang lưu...</>
                                    ) : (
                                        <><Check size={16}/> Lưu thay đổi</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <ConfirmModal 
                    isOpen={!!deleting} 
                    onClose={() => setDeleting(null)} 
                    onConfirm={remove} 
                    title="Xóa ca làm việc" 
                    message={`Bạn có chắc muốn xóa ca “${deleting?.name || ''}”? Dữ liệu liên quan đến ca này có thể bị ảnh hưởng.`} 
                    confirmText="Xóa vĩnh viễn" 
                    isDanger
                />
            </div>
        </AdminLayout>
    );
}

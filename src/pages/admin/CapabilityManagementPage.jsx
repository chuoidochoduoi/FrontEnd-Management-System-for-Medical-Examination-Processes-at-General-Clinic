import { useEffect, useMemo, useState } from 'react';
import { LockKeyhole, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const authHeaders = () => ({ Authorization: `Bearer ${get('token')}` });

export default function CapabilityManagementPage() {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');

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

    return <AdminLayout><div className="px-10 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 className="text-base font-semibold text-slate-900">Danh mục kỹ thuật</h1>
                <p className="mt-1 text-xs text-slate-500">Danh mục cố định dùng để định tuyến dịch vụ cận lâm sàng.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                <LockKeyhole size={15}/>
                Dữ liệu hệ thống chỉ được phép xem
            </div>
        </div>

        <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-primary-500" placeholder="Tìm theo mã hoặc tên kỹ thuật"/>
        </label>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <div className="grid min-w-[760px] grid-cols-[180px_1fr_2fr_120px] bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                <span>Mã kỹ thuật</span><span>Tên kỹ thuật</span><span>Mô tả</span><span>Trạng thái</span>
            </div>
            {visible.length === 0
                ? <p className="px-6 py-10 text-center text-sm text-slate-400">Không tìm thấy kỹ thuật phù hợp.</p>
                : visible.map(item => <div key={item.capabilityId} className="grid min-w-[760px] grid-cols-[180px_1fr_2fr_120px] items-center border-t border-slate-100 px-6 py-4 text-sm">
                    <span className="font-mono text-slate-600">{item.code}</span>
                    <span className="font-medium text-slate-900">{item.name}</span>
                    <span className="pr-5 text-slate-500">{item.description || '—'}</span>
                    <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.active ? 'Đang áp dụng' : 'Ngừng áp dụng'}</span>
                </div>)}
        </div>
    </div></AdminLayout>;
}

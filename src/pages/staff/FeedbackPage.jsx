import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import OwnerLayout from '@/components/layout/OwnerLayout';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';

const stored = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const apiUrl = import.meta.env.VITE_API_URL;

export default function FeedbackPage() {
    const isManager = stored('systemRole') === 'CLINIC_MANAGER';
    const Layout = isManager ? OwnerLayout : MedicalStaffLayout;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('ALL');
    const [drafts, setDrafts] = useState({});
    const request = useCallback(async (url, options = {}) => {
        const response = await fetch(`${apiUrl}${url}`, { ...options, headers: { Authorization: `Bearer ${stored('token')}`, 'Content-Type': 'application/json', ...options.headers } });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || 'Không thể xử lý yêu cầu.');
        return body.data ?? body;
    }, []);
    const load = useCallback(async () => {
        setLoading(true);
        try { const data = await request('/api/v1/feedbacks?page=0&size=100&sort=ratedAt,desc'); setItems(data.content ?? []); }
        catch (error) { toast.error(error.message); } finally { setLoading(false); }
    }, [request]);
    useEffect(() => { load(); }, [load]);
    const change = (id, field, value) => setDrafts(old => ({ ...old, [id]: { ...old[id], [field]: value } }));
    const save = async item => {
        const draft = drafts[item.recordId] ?? {};
        const url = isManager ? `/api/v1/feedbacks/${item.recordId}/respond` : `/api/v1/feedbacks/${item.recordId}/explain`;
        const payload = isManager ? { response: draft.response ?? item.managerResponse ?? '', internalNote: draft.internalNote ?? item.internalNote ?? '', status: draft.status ?? item.status ?? 'PROCESSING' } : { explanation: draft.explanation ?? item.doctorExplanation ?? '' };
        try { await request(url, { method: 'PUT', body: JSON.stringify(payload) }); toast.success('Đã cập nhật đánh giá.'); await load(); }
        catch (error) { toast.error(error.message); }
    };
    const visible = status === 'ALL' ? items : items.filter(x => (x.status || 'NEW') === status);
    return <Layout><div className="w-full p-6 lg:p-8 space-y-5 overflow-y-auto">
        <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold">Đánh giá của khách hàng</h1><p className="text-sm text-gray-500 mt-1">{isManager ? 'Theo dõi, ghi chú nội bộ và trả lời khách hàng trong hệ thống.' : 'Các đánh giá liên quan đến lượt khám do bạn phụ trách.'}</p></div><button onClick={load} className="h-10 px-4 border rounded-xl flex items-center gap-2 text-sm"><RefreshCw size={16}/>Làm mới</button></div>
        <div className="flex flex-wrap gap-2">{[['ALL','Tất cả'],['NEW','Mới'],['PROCESSING','Đang xử lý'],['RESPONDED','Đã phản hồi'],['CLOSED','Đã đóng']].map(([v,l]) => <button key={v} onClick={() => setStatus(v)} className={`px-3 py-2 rounded-lg text-sm border ${status === v ? 'bg-gray-900 text-white' : 'bg-white'}`}>{l}</button>)}</div>
        {loading && <p className="text-sm text-gray-500">Đang tải đánh giá...</p>}
        {!loading && !visible.length && <div className="bg-white border rounded-xl p-12 text-center text-gray-400"><MessageSquare className="mx-auto mb-2"/>Chưa có đánh giá phù hợp.</div>}
        <div className="space-y-4">{visible.map(item => <div key={item.recordId} className="bg-white border rounded-2xl p-5">
            <div className="flex flex-wrap justify-between gap-3 border-b pb-4 mb-4"><div><p className="font-semibold">{item.patientName || '-'} · {item.serviceName || '-'}</p><p className="text-xs text-gray-500 mt-1">Bác sĩ: {item.doctorName || '-'} · {item.ratedAt ? new Date(item.ratedAt).toLocaleString('vi-VN') : '-'}</p></div><div className="flex gap-1 text-yellow-500 font-semibold"><Star size={17} fill="currentColor"/>{item.overallRating}/5</div></div>
            <div className="bg-gray-50 rounded-xl p-3 text-sm mb-4 whitespace-pre-wrap">{item.comment || 'Không có nhận xét.'}</div>
            {isManager ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-3"><textarea rows={3} value={drafts[item.recordId]?.response ?? item.managerResponse ?? ''} onChange={e => change(item.recordId,'response',e.target.value)} placeholder="Phản hồi chính thức (khách hàng sẽ nhìn thấy)" className="border rounded-xl p-3 text-sm"/><textarea rows={3} value={drafts[item.recordId]?.internalNote ?? item.internalNote ?? ''} onChange={e => change(item.recordId,'internalNote',e.target.value)} placeholder="Ghi chú nội bộ (khách hàng không nhìn thấy)" className="border rounded-xl p-3 text-sm"/>{item.doctorExplanation && <div className="lg:col-span-2 text-sm bg-blue-50 p-3 rounded-xl"><b>Giải trình của bác sĩ:</b> {item.doctorExplanation}</div>}<select value={drafts[item.recordId]?.status ?? item.status ?? 'NEW'} onChange={e => change(item.recordId,'status',e.target.value)} className="border rounded-xl px-3 h-10 text-sm"><option value="NEW">Mới</option><option value="PROCESSING">Đang xử lý</option><option value="RESPONDED">Đã phản hồi</option><option value="CLOSED">Đã đóng</option></select><button onClick={() => save(item)} className="h-10 rounded-xl bg-gray-900 text-white text-sm">Lưu xử lý</button></div> : <div className="space-y-3"><textarea rows={3} value={drafts[item.recordId]?.explanation ?? item.doctorExplanation ?? ''} onChange={e => change(item.recordId,'explanation',e.target.value)} placeholder="Giải trình cho quản lý phòng khám" className="w-full border rounded-xl p-3 text-sm"/><button onClick={() => save(item)} className="px-5 h-10 rounded-xl bg-gray-900 text-white text-sm">Gửi giải trình</button></div>}
        </div>)}</div>
    </div></Layout>;
}

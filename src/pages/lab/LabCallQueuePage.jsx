import { useMemo, useState } from 'react';
import { ArrowLeft, RotateCcw, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import { useLabQueue } from '@/hooks/useLabQueue';
import { ROUTES } from '@/constants/routes';

const statusText = {
    WAITING: 'Đang chờ gọi', CALLED: 'Đã gọi', IN_PROGRESS: 'Đã vào phòng',
    BLOCKED: 'Chưa đến lượt', DONE: 'Đã hoàn thành', SKIPPED: 'Vắng mặt',
};

export default function LabCallQueuePage() {
    const { departmentId } = useParams();
    const navigate = useNavigate();
    const { orders, loading, fetchOrders } = useLabQueue(departmentId);
    const [search, setSearch] = useState('');

    const groups = useMemo(() => Object.values(orders.reduce((result, request) => {
        if (!request.queueTicketId) return result;
        const key = request.queueTicketId;
        if (!result[key]) result[key] = {
            ticketId: key, number: request.queueNumber, status: request.queueStatus,
            patientName: request.patientName, patientCode: request.patientCode, requests: [],
        };
        result[key].requests.push(request);
        return result;
    }, {})).filter(group => ['WAITING', 'CALLED', 'IN_PROGRESS', 'BLOCKED'].includes(group.status)), [orders]);

    const callAction = async (ticketId, action) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/queue-tickets/${ticketId}/${action}`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            return toast.error(body.message || 'Không thể cập nhật số gọi');
        }
        toast.success(action === 'call' ? 'Đã gọi bệnh nhân' : action === 'start-exam' ? 'Đã xác nhận bệnh nhân vào phòng' : 'Đã đánh dấu vắng');
        fetchOrders({ departmentId, search, page: 1 });
    };

    return <MedicalStaffLayout>
        <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-7 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-5">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(ROUTES.DOCTOR_LAB.replace(':departmentId', departmentId))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white"><ArrowLeft size={17}/></button>
                        <div><h1 className="text-xl font-bold text-gray-900">Gọi số cận lâm sàng</h1><p className="text-sm text-gray-500">Chỉ dùng để gọi và xác nhận bệnh nhân đã vào phòng</p></div>
                    </div>
                    <div className="flex gap-2"><button onClick={() => window.open(ROUTES.ALL_QUEUE_DISPLAY, '_blank')} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Mở màn hình TV chung</button><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={event => { setSearch(event.target.value); fetchOrders({ departmentId, search: event.target.value, page: 1 }); }} placeholder="Tìm bệnh nhân..." className="h-10 w-64 rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm"/></div><button onClick={() => fetchOrders({ departmentId, search, page: 1 })} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white"><RotateCcw size={16}/></button></div>
                </header>

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <div className="grid grid-cols-[90px_1fr_1.5fr_150px_220px] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase text-gray-400"><span>Số</span><span>Bệnh nhân</span><span>Dịch vụ</span><span>Trạng thái</span><span>Thao tác gọi</span></div>
                    {loading ? <p className="p-10 text-center text-sm text-gray-400">Đang tải...</p> : groups.length === 0 ? <p className="p-10 text-center text-sm text-gray-400">Không có bệnh nhân trong hàng chờ.</p> : <div className="divide-y divide-gray-100">{groups.map(group => <div key={group.ticketId} className="grid grid-cols-[90px_1fr_1.5fr_150px_220px] items-center gap-4 px-5 py-4">
                        <span className="text-2xl font-bold text-primary-600">{group.number ?? '-'}</span>
                        <div><p className="font-semibold text-gray-900">{group.patientName || '-'}</p><p className="text-xs text-gray-400">{group.patientCode || '-'}</p></div>
                        <p className="text-sm text-gray-600">{group.requests.map(request => request.serviceName).join(', ')}</p>
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${group.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' : group.status === 'CALLED' ? 'bg-green-50 text-green-700' : group.status === 'BLOCKED' ? 'bg-gray-100 text-gray-400' : 'bg-amber-50 text-amber-700'}`}>{statusText[group.status] || group.status}</span>
                        <div className="flex gap-2">{group.status === 'WAITING' && <button onClick={() => callAction(group.ticketId, 'call')} className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white">Gọi số</button>}{group.status === 'CALLED' && <><button onClick={() => callAction(group.ticketId, 'call')} className="rounded-lg border border-primary-300 px-3 py-2 text-xs font-semibold text-primary-600">Gọi lại</button><button onClick={() => callAction(group.ticketId, 'start-exam')} className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white">Đã vào phòng</button></>}{['WAITING', 'CALLED'].includes(group.status) && <button onClick={() => callAction(group.ticketId, 'skip')} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">Vắng</button>}</div>
                    </div>)}</div>}
                </section>
            </div>
        </div>
    </MedicalStaffLayout>;
}

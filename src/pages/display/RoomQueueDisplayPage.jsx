import { useCallback, useEffect, useMemo, useState } from 'react';
import { Maximize, RefreshCw } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '@/hooks/useWebSocket.js';

const token = () => localStorage.getItem('token') || sessionStorage.getItem('token');

export default function RoomQueueDisplayPage() {
    const { departmentId } = useParams();
    const [tickets, setTickets] = useState([]);
    const [updatedAt, setUpdatedAt] = useState(new Date());

    const load = useCallback(async () => {
        const params = new URLSearchParams({ page: '0', size: '200', sort: 'calledAt,desc', workDate: new Date().toISOString().slice(0, 10) });
        if (departmentId) params.set('departmentId', departmentId);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/queue-tickets?${params}`, {
            headers: { Authorization: `Bearer ${token()}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        setTickets(data.content ?? data.items ?? []);
        setUpdatedAt(new Date());
    }, [departmentId]);

    useEffect(() => {
        load();
    }, [load]);

    useWebSocket(departmentId ? `/topic/department-${departmentId}-queue` : null, null, () => {
        load();
    });

    const current = useMemo(() => tickets.find(ticket => ['CALLED', 'IN_PROGRESS'].includes(ticket.status)), [tickets]);
    const waiting = useMemo(() => tickets.filter(ticket => ticket.status === 'WAITING').slice(0, 8), [tickets]);
    const departmentName = current?.departmentName || tickets[0]?.departmentName || 'Phòng khám';
    const globalCalling = useMemo(() => {
        const byDepartment = new Map();
        tickets.filter(ticket => ['CALLED', 'IN_PROGRESS'].includes(ticket.status))
            .sort((left, right) => new Date(right.calledAt || 0) - new Date(left.calledAt || 0))
            .forEach(ticket => {
                if (!byDepartment.has(ticket.departmentId)) byDepartment.set(ticket.departmentId, ticket);
            });
        return [...byDepartment.values()];
    }, [tickets]);

    if (!departmentId) return <div className="min-h-screen bg-slate-100 text-slate-900">
        <header className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-cyan-600 px-8 py-5 text-white shadow-lg">
            <div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100">Phòng khám đa khoa</p><h1 className="mt-1 text-3xl font-black uppercase tracking-wide">Bảng gọi tên khám bệnh</h1></div>
            <div className="flex items-center gap-3"><span className="text-lg font-semibold">{updatedAt.toLocaleTimeString('vi-VN')}</span><button onClick={load} className="rounded-xl border border-white/30 bg-white/10 p-3"><RefreshCw size={22}/></button><button onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-xl border border-white/30 bg-white/10 p-3"><Maximize size={22}/></button></div>
        </header>
        <main className="p-6 lg:p-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="grid grid-cols-[1.3fr_120px_1.4fr] items-center bg-slate-800 px-8 py-5 text-center text-xl font-black uppercase tracking-wider text-white"><span>Tên bệnh nhân</span><span></span><span>Phòng phục vụ</span></div>
                {globalCalling.length ? <div className="divide-y-2 divide-white">{globalCalling.map((ticket, index) => <div key={ticket.ticketId} className={`grid min-h-[105px] grid-cols-[1.3fr_120px_1.4fr] items-center px-8 py-4 ${index % 2 === 0 ? 'bg-blue-50' : 'bg-slate-100'}`}>
                    <span className="text-center text-4xl font-black uppercase text-blue-800">{ticket.patientName || 'Khách hàng'}</span>
                    <span className="text-center text-5xl font-black text-red-500">→</span>
                    <div className="text-center"><p className="text-3xl font-black uppercase text-slate-900">{ticket.departmentName || 'Phòng khám'}</p><p className={`mt-1 text-lg font-bold ${ticket.status === 'CALLED' ? 'text-red-600' : 'text-blue-600'}`}>{ticket.status === 'CALLED' ? 'MỜI VÀO PHÒNG' : 'ĐANG PHỤC VỤ'}</p></div>
                </div>)}</div> : <div className="flex min-h-[420px] items-center justify-center text-3xl font-semibold text-slate-400">Chưa có số đang được gọi</div>}
            </div>
            <p className="mt-5 text-center text-lg font-medium text-slate-500">Vui lòng theo dõi tên và di chuyển đến đúng phòng khi được gọi</p>
        </main>
    </div>;

    return <div className="min-h-screen bg-slate-950 p-6 text-white lg:p-10">
        <header className="mb-8 flex items-center justify-between border-b border-slate-700 pb-6">
            <div><p className="text-lg font-semibold uppercase tracking-[0.25em] text-cyan-400">Phòng khám đa khoa</p><h1 className="mt-2 text-4xl font-bold lg:text-5xl">{departmentName}</h1></div>
            <div className="flex items-center gap-4 text-slate-400"><span>Cập nhật {updatedAt.toLocaleTimeString('vi-VN')}</span><button onClick={load} className="rounded-xl border border-slate-700 p-3"><RefreshCw size={22}/></button><button onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-xl border border-slate-700 p-3"><Maximize size={22}/></button></div>
        </header>
        <main className="grid gap-7 lg:grid-cols-[1.35fr_1fr]">
            <section className="flex min-h-[560px] flex-col items-center justify-center rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950 to-slate-900 p-10 text-center">
                <p className="text-2xl font-semibold uppercase tracking-[0.2em] text-cyan-300">Mời số</p>
                <p className="my-6 text-[11rem] font-black leading-none text-white drop-shadow-2xl">{current?.queueNumber ?? '--'}</p>
                <p className="text-3xl font-bold">{current ? (current.status === 'CALLED' ? 'Mời vào phòng' : 'Đang phục vụ') : 'Đang chờ gọi số'}</p>
                {current?.serviceName && <p className="mt-4 text-xl text-slate-300">{current.serviceName}</p>}
            </section>
            <section className="rounded-3xl border border-slate-700 bg-slate-900 p-7">
                <h2 className="mb-6 text-2xl font-bold">Số chờ tiếp theo</h2>
                <div className="grid grid-cols-2 gap-4">{waiting.length ? waiting.map(ticket => <div key={ticket.ticketId} className="rounded-2xl border border-slate-700 bg-slate-800 p-5 text-center"><p className="text-5xl font-black text-cyan-300">{ticket.queueNumber}</p><p className="mt-2 truncate text-sm text-slate-400">{ticket.serviceName || 'Dịch vụ'}</p></div>) : <p className="col-span-2 py-20 text-center text-xl text-slate-500">Chưa có số đang chờ</p>}</div>
            </section>
        </main>
    </div>;
}

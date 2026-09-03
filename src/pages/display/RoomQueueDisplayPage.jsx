import { useCallback, useEffect, useMemo, useState } from 'react';
import { HeartPulse, Maximize, RefreshCw, Stethoscope } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '@/hooks/useWebSocket.js';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const unwrap = (payload) => payload?.data ?? payload?.result ?? payload;
const unwrapList = (payload) => {
    const data = unwrap(payload);
    return data?.content ?? data?.items ?? (Array.isArray(data) ? data : []);
};
const patientName = (ticket) => ticket?.patientName?.trim() || 'Bệnh nhân';
const birthYear = (ticket) => {
    const match = String(ticket?.patientDob || '').match(/^\d{4}/);
    return match?.[0] || null;
};

function DisplayHeader({ roomMode = false, roomName, roomCode, clock, date, loading, onRefresh }) {
    return <header className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-teal-700 to-cyan-800 px-6 py-4 text-white lg:px-8">
        <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">{roomMode ? <Stethoscope size={24}/> : <HeartPulse size={25}/>}</span><div className="min-w-0"><strong className="block truncate text-xl font-bold">{roomMode ? `${roomName}${roomCode ? ` · ${roomCode}` : ''}` : 'CareS'}</strong><span className="block truncate text-xs uppercase tracking-[0.16em] text-teal-100">{roomMode ? 'Màn hình gọi tên tại phòng' : 'Phòng khám đa khoa'}</span></div></div>
        <div className="flex items-center gap-3"><div className="text-right"><strong className="block text-2xl tabular-nums">{clock}</strong><span className="text-xs capitalize text-teal-100">{date}</span></div><button type="button" onClick={onRefresh} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/20" aria-label="Làm mới"><RefreshCw size={21} className={loading ? 'animate-spin' : ''}/></button><button type="button" onClick={() => document.documentElement.requestFullscreen?.()} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/20" aria-label="Toàn màn hình"><Maximize size={21}/></button></div>
    </header>;
}

export default function RoomQueueDisplayPage() {
    const { departmentId } = useParams();
    const [tickets, setTickets] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [updatedAt, setUpdatedAt] = useState(new Date());
    const [now, setNow] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        const workDate = new Date().toLocaleDateString('en-CA');
        const params = new URLSearchParams({ page: '0', size: '200', workDate });
        if (!departmentId) {
            params.set('sort', 'calledAt,desc');
            params.set('status', 'CALLED');
        }
        const headers = { Authorization: `Bearer ${get('token') || ''}` };
        const queueUrl = departmentId
            ? `${apiBase}/api/v1/queue-tickets/waiting/${departmentId}?${params}`
            : `${apiBase}/api/v1/queue-tickets?${params}`;
        try {
            setError('');
            const [queueResponse, inProgressResponse, departmentResponse] = await Promise.all([
                fetch(queueUrl, { headers }),
                departmentId ? fetch(`${apiBase}/api/v1/queue-tickets/in-progress/${departmentId}`, { headers }) : Promise.resolve(null),
                fetch(`${apiBase}/api/v1/departments/clinical?page=0&size=200`, { headers }),
            ]);
            if (!queueResponse.ok) throw new Error('Không thể cập nhật danh sách gọi bệnh nhân.');
            const queued = unwrapList(await queueResponse.json());
            let inProgress = null;
            if (inProgressResponse?.ok && inProgressResponse.status !== 204) inProgress = unwrap(await inProgressResponse.json());
            if (departmentResponse.ok) setDepartments(unwrapList(await departmentResponse.json()));
            setTickets(inProgress ? [inProgress, ...queued.filter((item) => item.ticketId !== inProgress.ticketId)] : queued);
            setUpdatedAt(new Date());
        } catch (reason) {
            setError(reason.message || 'Không thể cập nhật danh sách gọi bệnh nhân.');
        } finally {
            setLoading(false);
        }
    }, [departmentId]);

    useEffect(() => {
        const initialTimer = window.setTimeout(load, 0);
        const refreshTimer = window.setInterval(load, 30000);
        const clockTimer = window.setInterval(() => setNow(new Date()), 1000);
        return () => { window.clearTimeout(initialTimer); window.clearInterval(refreshTimer); window.clearInterval(clockTimer); };
    }, [load]);

    useWebSocket('/topic/queue-display', null, load, { authenticated: true, onConnect: load });
    useWebSocket(departmentId ? `/topic/department-${departmentId}-queue` : null, null, load, { authenticated: true });

    const room = useMemo(() => departments.find((item) => item.departmentId === departmentId), [departments, departmentId]);
    const current = useMemo(() => tickets.find((ticket) => ticket.status === 'IN_PROGRESS') || tickets.find((ticket) => ticket.status === 'CALLED'), [tickets]);
    const waiting = useMemo(() => tickets.filter((ticket) => ['WAITING', 'TEST_DONE'].includes(ticket.status))
        .sort((left, right) => (left.waitingPosition ?? Number.MAX_SAFE_INTEGER) - (right.waitingPosition ?? Number.MAX_SAFE_INTEGER)).slice(0, 8), [tickets]);
    const globalCalling = useMemo(() => {
        const byDepartment = new Map();
        tickets.filter((ticket) => ticket.status === 'CALLED')
            .sort((left, right) => new Date(right.calledAt || 0) - new Date(left.calledAt || 0))
            .forEach((ticket) => {
                if (ticket.departmentId && !byDepartment.has(ticket.departmentId)) byDepartment.set(ticket.departmentId, ticket);
            });
        return [...byDepartment.values()];
    }, [tickets]);
    const roomName = room?.name || current?.departmentName || tickets[0]?.departmentName || 'Phòng phục vụ';
    const roomCode = room?.roomCode || '';
    const clock = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

    if (!departmentId) return <div className="min-h-screen bg-[#061f26] text-white">
        <DisplayHeader roomName={roomName} roomCode={roomCode} clock={clock} date={date} loading={loading} onRefresh={load}/>
        <main className="p-5 lg:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold lg:text-3xl">Danh sách bệnh nhân đang được gọi</h1><p className="mt-1 text-sm text-slate-300">Vui lòng nghe tên và di chuyển đến đúng phòng phục vụ</p></div><span className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300"><span className="h-2.5 w-2.5 rounded-full bg-teal-400 shadow-[0_0_0_5px_rgba(45,212,191,0.12)]"/>Cập nhật trực tiếp</span></div>
            {error && <div className="mb-4 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-center text-sm text-red-200" role="alert">{error}</div>}
            {globalCalling.length ? <div><div className="hidden grid-cols-[150px_minmax(240px,1.2fr)_minmax(190px,.8fr)_minmax(220px,1fr)] gap-5 px-5 pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid"><span>Trạng thái</span><span>Bệnh nhân</span><span>Phòng phục vụ</span><span>Dịch vụ</span></div><div className="grid gap-2.5">{globalCalling.map((ticket, index) => {
                const department = departments.find((item) => item.departmentId === ticket.departmentId);
                return <article key={ticket.ticketId} className={`grid min-h-[76px] items-center gap-3 rounded-xl px-5 py-4 md:grid-cols-[150px_minmax(240px,1.2fr)_minmax(190px,.8fr)_minmax(220px,1fr)] md:gap-5 ${index === 0 ? 'border-l-4 border-teal-300 bg-gradient-to-r from-teal-900/90 to-[#0c3940]' : 'bg-[#0b2b34]'}`}><span className="inline-flex w-fit items-center gap-2 rounded-lg bg-teal-400/10 px-2.5 py-1.5 text-xs font-semibold text-teal-200"><span className="h-2 w-2 rounded-full bg-teal-300"/>Đang gọi</span><div className="min-w-0"><strong className={`block truncate font-bold ${index === 0 ? 'text-2xl text-teal-300' : 'text-lg text-white'}`}>{patientName(ticket)}</strong><small className="mt-1 block text-sm text-slate-400">Vui lòng vào phòng</small></div><div className="min-w-0"><strong className="block truncate text-base text-white">{ticket.departmentName || department?.name || 'Phòng phục vụ'}</strong><small className="mt-1 block text-sm text-slate-400">{department?.roomCode || 'Đang hoạt động'}</small></div><p className="truncate text-sm text-slate-200">{ticket.serviceName || 'Dịch vụ khám'}</p></article>;
            })}</div></div> : <div className="flex min-h-[440px] flex-col items-center justify-center rounded-2xl border border-cyan-900 bg-[#0b2b34] text-center"><HeartPulse size={48} className="text-slate-600"/><p className="mt-4 text-2xl font-semibold text-slate-300">Chưa có bệnh nhân đang được gọi</p><span className="mt-2 text-sm text-slate-500">Màn hình sẽ tự cập nhật khi một phòng gọi bệnh nhân</span></div>}
        </main>
        <footer className="px-6 pb-5 text-center text-sm text-slate-400">Tên ở hàng đầu được nhấn nhẹ để dễ nhận biết; màn hình không sử dụng số phiếu. · Cập nhật lúc {updatedAt.toLocaleTimeString('vi-VN')}</footer>
    </div>;

    return <div className="min-h-screen bg-[#061f26] text-white">
        <DisplayHeader roomMode roomName={roomName} roomCode={roomCode} clock={clock} date={date} loading={loading} onRefresh={load}/>
        {error && <div className="mx-5 mt-4 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-center text-sm text-red-200" role="alert">{error}</div>}
        <main className="grid gap-5 p-5 lg:grid-cols-[1.25fr_0.75fr] lg:p-7">
            <section className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-cyan-900 bg-[#0b2b34] p-8 text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{current?.status === 'IN_PROGRESS' ? 'Đang phục vụ bệnh nhân' : 'Đang mời bệnh nhân'}</p><h1 className="my-6 max-w-full text-6xl font-black leading-tight tracking-[-0.04em] text-teal-300 sm:text-7xl lg:text-8xl">{current ? patientName(current) : 'Chưa có bệnh nhân'}</h1>{current && <><p className="text-base text-slate-300">{birthYear(current) ? `Năm sinh: ${birthYear(current)}` : 'Chưa có thông tin năm sinh'}</p><h2 className="mt-5 text-3xl font-bold">{current.status === 'CALLED' ? `Mời vào ${roomName}` : `Đang phục vụ tại ${roomName}`}</h2><p className="mt-3 text-base font-semibold text-amber-300">{current.serviceName || 'Dịch vụ khám'}</p></>}</section>
            <section className="rounded-2xl border border-cyan-900 bg-[#0b2b34] p-5"><h2 className="text-xl font-bold">Danh sách chờ tiếp theo</h2><p className="mt-1 text-sm text-slate-400">Thứ tự có thể thay đổi theo quy tắc ưu tiên</p><div className="mt-5 grid gap-3">{waiting.length ? waiting.map((ticket) => <div key={ticket.ticketId} className="flex min-h-[76px] items-center justify-between gap-4 rounded-xl bg-[#113640] p-4"><div className="min-w-0"><strong className="block truncate text-lg font-bold text-teal-50">{patientName(ticket)}</strong><small className="mt-1 block text-sm text-slate-400">{birthYear(ticket) ? `Năm sinh: ${birthYear(ticket)}` : 'Chưa có năm sinh'}</small></div><span className="shrink-0 text-right text-xs font-semibold text-amber-300">{ticket.priorityLabel || 'Đang chờ'}</span></div>) : <p className="py-20 text-center text-lg text-slate-500">Chưa có bệnh nhân đang chờ</p>}</div></section>
        </main>
        <footer className="px-6 pb-5 text-center text-sm text-slate-400">Khi nghe gọi tên, vui lòng di chuyển vào phòng. · Cập nhật lúc {updatedAt.toLocaleTimeString('vi-VN')}</footer>
    </div>;
}

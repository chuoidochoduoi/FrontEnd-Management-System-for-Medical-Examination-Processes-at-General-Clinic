import { useEffect, useState } from 'react';
import { CreditCard, MapPin, RefreshCw } from 'lucide-react';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { toast } from 'react-toastify';

const stored = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const labels = {
    PAYMENT_PENDING: 'Chờ thanh toán', WAITING: 'Đang chờ gọi', CALLED: 'Đã được gọi', IN_PROGRESS: 'Đang thực hiện',
    WAITING_FOR_TEST: 'Chờ khám cận lâm sàng', TEST_DONE: 'Chờ quay lại bác sĩ', RESULT_PENDING: 'Đang chờ kết quả cận lâm sàng',
    BLOCKED: 'Bước tiếp theo', DONE: 'Đã hoàn thành', COMPLETED: 'Đã hoàn thành', UNASSIGNED: 'Chưa phân luồng'
};
const hiddenStatuses = new Set(['CANCELLED', 'SKIPPED']);
const stepStyle = (status) => {
    if (['DONE', 'COMPLETED'].includes(status)) return { dot: 'bg-emerald-500', text: 'text-emerald-700', icon: '✓' };
    if (status === 'BLOCKED') return { dot: 'bg-white border-2 border-slate-300', text: 'text-slate-500', icon: '○' };
    if (status === 'PAYMENT_PENDING') return { dot: 'bg-amber-500', text: 'text-amber-700', icon: '●' };
    if (status === 'RESULT_PENDING') return { dot: 'bg-violet-500', text: 'text-violet-700', icon: '●' };
    if (status === 'IN_PROGRESS') return { dot: 'bg-blue-700', text: 'text-blue-800', icon: '●' };
    return { dot: 'bg-sky-500', text: 'text-sky-700', icon: '●' };
};

export default function WaitingRoomPage() {
    const [journeys, setJourneys] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/patient/my-journeys`, { headers: { Authorization: `Bearer ${stored('token')}` } });
            const body = await response.json();
            if (!response.ok) throw new Error(body.message || 'Không thể tải hành trình.');
            setJourneys(body.data ?? body);
        } catch (error) { if (!silent) toast.error(error.message); } finally { if (!silent) setLoading(false); }
    };
    useEffect(() => { load(); const timer = setInterval(() => load(true), 20000); return () => clearInterval(timer); }, []);

    const current = journeys.find((journey) => !['COMPLETED', 'UNASSIGNED'].includes(journey.currentStatus)) || journeys[0];
    const needsPayment = current?.currentStatus === 'PAYMENT_PENDING';
    const waitingResults = current?.currentStatus === 'RESULT_PENDING';
    const allVisibleSteps = (current?.steps || []).filter((step) => !hiddenStatuses.has(step.status));
    const visibleSteps = needsPayment ? allVisibleSteps.filter((step) => step.status === 'PAYMENT_PENDING') : allVisibleSteps;
    const active = visibleSteps.find((step) => !['PAYMENT_PENDING', 'RESULT_PENDING', 'BLOCKED', 'DONE', 'COMPLETED'].includes(step.status)) || visibleSteps[0];

    return <CustomerLayout><div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-900">Hành trình của tôi</h1><p className="mt-1 text-sm text-slate-500">Trang tự cập nhật mỗi 20 giây.</p></div><button onClick={() => load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm"><RefreshCw size={16} />Cập nhật</button></header>
        {loading && <div className="rounded-2xl border bg-white p-12 text-center text-sm text-slate-400">Đang tải hành trình...</div>}
        {!loading && !current && <div className="rounded-2xl border bg-white p-12 text-center text-sm text-slate-400">Bạn chưa có lượt khám đã check-in.</div>}
        {!loading && current && <>
            <section className="grid gap-5 rounded-2xl bg-slate-900 p-6 text-white md:grid-cols-3"><div><p className="text-xs text-slate-400">VIỆC CẦN LÀM</p><p className="mt-2 text-xl font-bold">{labels[current.currentStatus] || current.currentStatus}</p><p className="mt-1 text-sm text-slate-300">{current.currentStep}</p></div><div><p className="text-xs text-slate-400">VỊ TRÍ</p><p className="mt-2 flex text-lg font-semibold"><MapPin className="mr-2" size={20} />{needsPayment ? 'Quầy thu ngân' : waitingResults ? 'Vui lòng chờ thông báo' : current.currentRoom || '—'}</p></div><div><p className="text-xs text-slate-400">SỐ THỨ TỰ</p><p className="mt-1 text-4xl font-black">{active?.queueNumber != null ? String(active.queueNumber).padStart(3, '0') : '—'}</p></div></section>
            {needsPayment && <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 font-semibold text-amber-800"><CreditCard />Vui lòng đến quầy thu ngân thanh toán dịch vụ trước khi vào hàng chờ.</div>}
            {current.currentStatus === 'CALLED' && <div className="rounded-xl border border-teal-300 bg-teal-50 p-4 font-semibold text-teal-800">Bạn đã được gọi. Vui lòng đến {current.currentRoom}.</div>}
            {waitingResults && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 font-semibold text-blue-800">Các thao tác tại phòng đã hoàn tất. Hệ thống đang chờ kết quả cận lâm sàng.</div>}
            <section className="rounded-2xl border bg-white p-6"><h2 className="mb-5 font-bold text-slate-900">Các bước cần theo dõi</h2><div className="space-y-4">{visibleSteps.map((step) => { const style = stepStyle(step.status); return <div key={step.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"><span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${style.dot}`}>{style.icon}</span><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{step.serviceName}</p>{step.roomName && <p className="mt-1 text-sm text-slate-500">{step.roomName}{step.roomCode ? ` (${step.roomCode})` : ''}</p>}<p className={`mt-1 text-xs font-medium ${style.text}`}>{labels[step.status] || step.status}</p></div>{step.queueNumber != null && <span className="text-sm font-bold text-slate-700">Số {String(step.queueNumber).padStart(3, '0')}</span>}</div>; })}</div></section>
        </>}
    </div></CustomerLayout>;
}

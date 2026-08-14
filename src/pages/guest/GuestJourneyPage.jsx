import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const statusLabels = {
    PAYMENT_PENDING: 'Chờ thanh toán',
    WAITING: 'Đang chờ gọi',
    CALLED: 'Đã được gọi',
    IN_PROGRESS: 'Đang thực hiện',
    WAITING_FOR_TEST: 'Chờ thực hiện cận lâm sàng',
    TEST_DONE: 'Chờ quay lại bác sĩ',
    RESULT_PENDING: 'Đang chờ kết quả cận lâm sàng',
    BLOCKED: 'Chưa đến lượt',
    DONE: 'Đã hoàn thành',
    COMPLETED: 'Đã hoàn thành',
    UNASSIGNED: 'Chưa phân luồng'
};

const hiddenStatuses = new Set(['CANCELLED', 'SKIPPED']);

const stepColor = (status) => {
    if (['DONE', 'COMPLETED'].includes(status)) return 'bg-emerald-500';
    if (status === 'BLOCKED') return 'border-2 border-slate-300 bg-white';
    if (status === 'PAYMENT_PENDING') return 'bg-amber-500';
    if (status === 'RESULT_PENDING') return 'bg-violet-500';
    return 'bg-teal-500';
};

export default function GuestJourneyPage() {
    const navigate = useNavigate();
    const [visitCode, setVisitCode] = useState('');
    const [phone, setPhone] = useState('');
    const [journey, setJourney] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = async ({ silent = false } = {}) => {
        const code = visitCode.trim().toUpperCase();
        const normalizedPhone = phone.replace(/\s+/g, '');
        if (!code || !normalizedPhone) {
            if (!silent) toast.error('Vui lòng nhập mã lượt khám và số điện thoại.');
            return;
        }
        if (!silent) setLoading(true);
        try {
            const params = new URLSearchParams({ visitCode: code, phone: normalizedPhone });
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/patient-journeys/lookup?${params}`);
            const body = await response.json();
            if (!response.ok) throw new Error(body.message || 'Không tìm thấy lượt khám phù hợp.');
            setJourney(body.data ?? body);
        } catch (error) {
            if (!silent) {
                setJourney(null);
                toast.error(error.message);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (!journey) return undefined;
        const timer = setInterval(() => load({ silent: true }), 20000);
        return () => clearInterval(timer);
    }, [journey?.visitId, visitCode, phone]);

    const visibleSteps = useMemo(
        () => (journey?.steps || []).filter((step) => !hiddenStatuses.has(step.status)),
        [journey]
    );
    const activeStep = visibleSteps.find((step) =>
        !['PAYMENT_PENDING', 'RESULT_PENDING', 'BLOCKED', 'DONE', 'COMPLETED'].includes(step.status)
    );

    return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-6">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-bold tracking-[0.2em] text-teal-600">CARES</p>
                    <h1 className="mt-1 text-2xl font-bold">Tra cứu hành trình khám</h1>
                    <p className="mt-1 text-sm text-slate-500">Dành cho bệnh nhân chưa có tài khoản.</p>
                </div>
                <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
                    <ArrowLeft size={16} /> Trang chủ
                </button>
            </header>

            <form onSubmit={(event) => { event.preventDefault(); load(); }} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto] md:items-end">
                <label className="space-y-2 text-sm font-medium">
                    <span>Mã lượt khám</span>
                    <input value={visitCode} onChange={(event) => setVisitCode(event.target.value.toUpperCase())} placeholder="Ví dụ: VIS-12AB34CD" maxLength={12} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                </label>
                <label className="space-y-2 text-sm font-medium">
                    <span>Số điện thoại</span>
                    <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Số điện thoại trên phiếu khám" inputMode="tel" className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                </label>
                <button disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white disabled:opacity-60">
                    {loading ? <RefreshCw className="animate-spin" size={17} /> : <Search size={17} />} Tra cứu
                </button>
            </form>

            {journey && <>
                <section className="grid gap-5 rounded-2xl bg-slate-900 p-6 text-white md:grid-cols-3">
                    <div>
                        <p className="text-xs uppercase text-slate-400">Trạng thái hiện tại</p>
                        <p className="mt-2 text-xl font-bold">{statusLabels[journey.currentStatus] || journey.currentStatus}</p>
                        <p className="mt-1 text-sm text-slate-300">{journey.currentStep || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-slate-400">Vị trí</p>
                        <p className="mt-2 flex items-start gap-2 text-lg font-semibold"><MapPin className="mt-0.5 shrink-0" size={20} />{journey.currentRoom || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-slate-400">Số thứ tự</p>
                        <p className="mt-1 text-4xl font-black">{activeStep?.queueNumber != null ? String(activeStep.queueNumber).padStart(3, '0') : '-'}</p>
                    </div>
                </section>

                {journey.currentStatus === 'CALLED' && <div className="rounded-xl border border-teal-300 bg-teal-50 p-4 font-semibold text-teal-800">Bạn đã được gọi. Vui lòng đến {journey.currentRoom}.</div>}
                {journey.currentStatus === 'PAYMENT_PENDING' && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 font-semibold text-amber-800">Vui lòng đến quầy thu ngân thanh toán để được xếp hàng chờ.</div>}

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                        <div><h2 className="font-bold">Các bước trong lượt khám</h2><p className="mt-1 text-sm text-slate-500">{journey.patientName} · {journey.visitCode}</p></div>
                        <button type="button" onClick={() => load()} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><RefreshCw size={15} /> Cập nhật</button>
                    </div>
                    <div className="space-y-4">
                        {visibleSteps.map((step) => <div key={step.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                            <span className={`mt-1 h-5 w-5 shrink-0 rounded-full ${stepColor(step.status)}`} />
                            <div className="min-w-0 flex-1">
                                <p className="break-words font-semibold">{step.serviceName}</p>
                                {step.roomName && <p className="mt-1 text-sm text-slate-500">{step.roomName}{step.roomCode ? ` (${step.roomCode})` : ''}</p>}
                                <p className="mt-1 text-xs font-medium text-teal-700">{statusLabels[step.status] || step.status}</p>
                            </div>
                            {step.queueNumber != null && <span className="shrink-0 text-sm font-bold">Số {String(step.queueNumber).padStart(3, '0')}</span>}
                        </div>)}
                    </div>
                </section>
            </>}
        </div>
    </main>;
}

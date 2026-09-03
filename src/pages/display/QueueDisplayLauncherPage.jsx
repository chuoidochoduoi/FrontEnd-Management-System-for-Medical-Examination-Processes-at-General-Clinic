import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, LayoutGrid, LoaderCircle, MonitorUp, RefreshCw } from 'lucide-react';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { ROUTES } from '@/constants/routes';
import { openAuthenticatedTab } from '@/utils/openAuthenticatedTab';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

const unwrapPage = (payload) => {
    const data = payload?.data ?? payload?.result ?? payload;
    return data?.content ?? data?.items ?? (Array.isArray(data) ? data : []);
};

export default function QueueDisplayLauncherPage() {
    const [departments, setDepartments] = useState([]);
    const [departmentId, setDepartmentId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadDepartments = useCallback(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        fetch(`${import.meta.env.VITE_API_URL}/api/v1/departments/clinical?page=0&size=200`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${get('token')}` },
        })
            .then((response) => {
                if (!response.ok) throw new Error('Không thể tải danh sách phòng.');
                return response.json();
            })
            .then((payload) => {
                const rooms = unwrapPage(payload).filter((room) => room?.departmentId);
                setDepartments(rooms);
                setDepartmentId((current) => current || rooms[0]?.departmentId || '');
            })
            .catch((reason) => {
                if (reason.name !== 'AbortError') setError(reason.message || 'Không thể tải danh sách phòng.');
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(loadDepartments, 0);
        return () => window.clearTimeout(timer);
    }, [loadDepartments]);

    const selectedRoom = useMemo(
        () => departments.find((room) => room.departmentId === departmentId),
        [departments, departmentId]
    );
    return <ReceptionistLayout>
        <div className="min-h-full bg-slate-50 p-4 sm:p-6">
            <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Vận hành màn hình TV</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900">Màn hình gọi tên</h1>
                    <p className="mt-1 text-sm text-slate-500">Chỉ mở màn hình trình chiếu; việc gọi bệnh nhân vẫn do nhân viên tại từng phòng thực hiện.</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
                    <span className="h-2 w-2 rounded-full bg-teal-500" /> Cập nhật trực tiếp
                </span>
            </header>

            {error && <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert"><span>{error}</span><button type="button" onClick={loadDepartments} className="inline-flex items-center gap-2 font-semibold"><RefreshCw size={16}/>Thử lại</button></div>}

            <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><LayoutGrid size={24}/></span>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">Màn tổng các phòng</h2>
                    <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">Dùng cho TV tại sảnh chính, chỉ hiển thị bệnh nhân đang được các phòng gọi.</p>
                    <button type="button" onClick={() => openAuthenticatedTab(ROUTES.ALL_QUEUE_DISPLAY)} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700">
                        <ExternalLink size={18}/> Mở màn tổng
                    </button>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><MonitorUp size={24}/></span>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">Màn riêng từng phòng</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Dùng cho TV trước cửa phòng, hiển thị tên và năm sinh của người đang gọi cùng danh sách chờ tiếp theo.</p>
                    <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor="queue-display-room">Chọn phòng trình chiếu</label>
                    <select id="queue-display-room" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} disabled={loading || !departments.length} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100">
                        {loading && <option value="">Đang tải danh sách phòng...</option>}
                        {!loading && !departments.length && <option value="">Chưa có phòng phù hợp</option>}
                        {departments.map((room) => <option key={room.departmentId} value={room.departmentId}>{room.name}{room.roomCode ? ` · ${room.roomCode}` : ''}</option>)}
                    </select>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button type="button" disabled={!departmentId || loading} onClick={() => openAuthenticatedTab(ROUTES.ROOM_QUEUE_DISPLAY.replace(':departmentId', departmentId))} className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
                            {loading ? <LoaderCircle className="animate-spin" size={18}/> : <ExternalLink size={18}/>} Mở màn phòng
                        </button>
                        {selectedRoom && <span className="text-sm text-slate-500">{selectedRoom.name}{selectedRoom.roomCode ? ` (${selectedRoom.roomCode})` : ''}</span>}
                    </div>
                </section>
            </div>
        </div>
    </ReceptionistLayout>;
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Eye, FilePlus, Filter, LoaderCircle, Printer, Search } from 'lucide-react';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { ROUTES } from '@/constants/routes';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const PAGE_SIZE = 10;

const STATUS_LABELS = {
    CHECKED_IN: 'Đã check-in',
    IN_PROGRESS: 'Đang khám',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
};

const INVOICE_LABELS = { PENDING: 'Chờ thanh toán', PAID: 'Đã thanh toán', CANCELLED: 'Hóa đơn đã hủy' };

const formatDateTime = (value) => value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
    : '—';

const visitCode = (visit) => visit?.visitId ? `PK${visit.visitId.replaceAll('-', '').slice(0, 8).toUpperCase()}` : '—';

const printVisit = (visit) => {
    const popup = window.open('', '_blank', 'width=840,height=720');
    if (!popup) return;
    popup.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"/><title>Phiếu khám ${visitCode(visit)}</title><style>body{font:14px Arial,sans-serif;color:#111;margin:36px}h1{text-align:center;font-size:22px;margin:4px 0 24px}.clinic{text-align:center;font-weight:700;font-size:16px}.line{border-top:2px solid #111;margin:18px 0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #777;padding:10px;text-align:left}th{background:#f3f4f6}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;line-height:1.7}.sign{display:flex;justify-content:space-between;text-align:center;margin-top:70px}@media print{body{margin:20px}}</style></head><body><div class="clinic">CareS – PHÒNG KHÁM ĐA KHOA</div><h1>PHIẾU KHÁM</h1><div class="meta"><div><b>Mã phiếu:</b> ${visitCode(visit)}<br/><b>Họ tên:</b> ${visit.customerName || 'Khách vãng lai'}<br/><b>Số điện thoại:</b> ${visit.patientPhone || '—'}</div><div><b>Thời gian tạo:</b> ${formatDateTime(visit.checkInTime || visit.createdAt)}<br/><b>Trạng thái:</b> ${STATUS_LABELS[visit.status] || visit.status || '—'}<br/><b>Thanh toán:</b> ${INVOICE_LABELS[visit.invoiceStatus] || 'Chưa có thông tin'}</div></div><div class="line"></div><table><thead><tr><th>STT</th><th>Dịch vụ đăng ký</th></tr></thead><tbody><tr><td>1</td><td>${visit.serviceSummary || 'Chưa có dịch vụ'}</td></tr></tbody></table><div class="sign"><div>Người lập phiếu<br/><br/><br/>(Ký, ghi rõ họ tên)</div><div>Bệnh nhân<br/><br/><br/>(Ký, ghi rõ họ tên)</div></div><script>window.onload=()=>window.print();<\/script></body></html>`);
    popup.document.close();
};

function StatusBadge({ visit }) {
    const label = STATUS_LABELS[visit.status] || visit.status || '—';
    const invoice = visit.invoiceStatus;
    const style = visit.status === 'COMPLETED'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : visit.status === 'IN_PROGRESS'
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : visit.status === 'CANCELLED'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-amber-200 bg-amber-50 text-amber-700';
    return <div className="space-y-1"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>{label}</span>
        {invoice && <p className="text-[11px] text-gray-400">{INVOICE_LABELS[invoice] || invoice}</p>}</div>;
}

export default function VisitManagementPage() {
    const navigate = useNavigate();
    const [visits, setVisits] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [draftSearch, setDraftSearch] = useState('');
    const [status, setStatus] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [page, setPage] = useState(0);

    const loadVisits = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE), sort: 'checkInTime,desc' });
            if (status) params.set('status', status);
            if (date) { params.set('from', `${date}T00:00:00`); params.set('to', `${date}T23:59:59`); }
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/customer-visits?${params}`, {
                headers: { Authorization: `Bearer ${get('token')}` },
            });
            if (!response.ok) throw new Error('Không thể tải danh sách phiếu khám.');
            const raw = await response.json();
            const data = raw.data ?? raw;
            setVisits(data.items ?? data.content ?? []);
            setTotal(data.totalItems ?? data.totalElements ?? 0);
        } catch (e) { setError(e.message); setVisits([]); setTotal(0); }
        finally { setLoading(false); }
    }, [date, page, status]);

    useEffect(() => { loadVisits(); }, [loadVisits]);

    const visibleVisits = useMemo(() => {
        const keyword = search.trim().toLocaleLowerCase('vi');
        if (!keyword) return visits;
        return visits.filter(visit => [visitCode(visit), visit.customerName, visit.patientCode, visit.patientPhone, visit.serviceSummary]
            .some(value => String(value ?? '').toLocaleLowerCase('vi').includes(keyword)));
    }, [search, visits]);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return <ReceptionistLayout>
        <div className="mx-auto max-w-[1500px] space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-gray-900">Quản lý phiếu khám</h1>
                    <p className="mt-1 text-sm text-gray-500">Theo dõi và xử lý các lượt khám đã tạo trong ngày.</p></div>
                <button onClick={() => navigate(ROUTES.RECEPTIONIST_CREATE_TICKET)} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"><FilePlus size={17} />Tạo phiếu khám</button>
            </div>

            <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto] lg:items-end">
                <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">Tìm kiếm</span><div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={draftSearch} onChange={e => setDraftSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSearch(draftSearch)} placeholder="Mã phiếu, tên bệnh nhân hoặc SĐT..." className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-primary-500" /></div></label>
                <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">Ngày tạo</span><div className="relative"><CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="date" value={date} onChange={e => { setDate(e.target.value); setPage(0); }} className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-primary-500" /></div></label>
                <label className="block"><span className="mb-1.5 block text-xs font-medium text-gray-500">Trạng thái</span><select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-primary-500"><option value="">Tất cả</option>{Object.entries(STATUS_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
                <button onClick={() => { setSearch(draftSearch); setPage(0); loadVisits(); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-100 px-5 text-sm font-medium text-gray-700 hover:bg-gray-200"><Filter size={16} />Lọc</button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500"><tr><th className="px-5 py-4">Mã phiếu</th><th className="px-5 py-4">Bệnh nhân</th><th className="px-5 py-4">Số điện thoại</th><th className="px-5 py-4">Dịch vụ</th><th className="px-5 py-4">Ngày tạo</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{loading ? <tr><td colSpan="7" className="px-5 py-14 text-center text-gray-400"><LoaderCircle className="mx-auto mb-2 animate-spin" size={22} />Đang tải phiếu khám...</td></tr> : error ? <tr><td colSpan="7" className="px-5 py-12 text-center text-red-600">{error}</td></tr> : visibleVisits.length === 0 ? <tr><td colSpan="7" className="px-5 py-14 text-center text-gray-400">Không có phiếu khám phù hợp.</td></tr> : visibleVisits.map(visit => <tr key={visit.visitId} className="hover:bg-gray-50/70"><td className="px-5 py-4 font-semibold text-gray-700">{visitCode(visit)}<p className="mt-1 text-[11px] font-normal text-gray-400">{visit.patientCode || '—'}</p></td><td className="px-5 py-4"><p className="font-semibold text-gray-900">{visit.customerName || 'Khách vãng lai'}</p></td><td className="px-5 py-4 text-gray-600">{visit.patientPhone || '—'}</td><td className="max-w-[220px] px-5 py-4 text-gray-700"><p className="line-clamp-2">{visit.serviceSummary || 'Chưa có dịch vụ'}</p></td><td className="px-5 py-4 text-gray-600">{formatDateTime(visit.checkInTime || visit.createdAt)}</td><td className="px-5 py-4"><StatusBadge visit={visit} /></td><td className="px-5 py-4 text-right"><div className="flex justify-end gap-1"><button disabled={!visit.customerId} onClick={() => visit.customerId && navigate(ROUTES.RECEPTIONIST_PATIENT_DETAIL.replace(':id', visit.customerId))} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-gray-300"><Eye size={16} />Xem chi tiết</button><button onClick={() => printVisit(visit)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"><Printer size={16} />In phiếu</button></div></td></tr>)}</tbody></table></div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 text-sm text-gray-500"><span>Hiển thị {total ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} trên tổng số ${total}` : '0'} kết quả</span><div className="flex gap-2"><button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Trước</button><span className="rounded-lg bg-gray-900 px-3 py-1.5 text-white">{page + 1}</span><button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sau</button></div></div>
            </div>
        </div>
    </ReceptionistLayout>;
}

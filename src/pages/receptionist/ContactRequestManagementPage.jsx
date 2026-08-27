import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Eye, Inbox, Search, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';

const getStored = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const API_URL = import.meta.env.VITE_API_URL;

const STATUS = {
  NEW: { label: 'Mới', className: 'bg-blue-50 text-blue-700' },
  PROCESSING: { label: 'Đang xử lý', className: 'bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Đã liên hệ', className: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Không thể liên hệ', className: 'bg-red-50 text-red-700' },
};

const formatTime = value => value ? new Date(value).toLocaleString('vi-VN') : '-';

export default function ContactRequestManagementPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 0, totalElements: 0 });
  const [selected, setSelected] = useState(null);
  const [resolveAction, setResolveAction] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const staffId = getStored('staffId');
  const systemRole = getStored('systemRole');

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${getStored('token')}`, 'Content-Type': 'application/json', ...options.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Không thể xử lý yêu cầu liên hệ.');
    return data;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '10', sort: `createdAt,${sortDirection}` });
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      const data = await request(`/api/v1/contact-requests?${params}`);
      setItems(data.content || []);
      setPageInfo({ totalPages: data.totalPages || 0, totalElements: data.totalElements || 0 });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, fromDate, toDate, sortDirection, request]);

  useEffect(() => { loadData(); }, [loadData]);

  const accept = async item => {
    setSubmitting(true);
    try {
      const updated = await request(`/api/v1/contact-requests/${item.contactRequestId}/accept`, { method: 'POST' });
      setSelected(updated);
      toast.success('Đã tiếp nhận yêu cầu liên hệ.');
      await loadData();
    } catch (error) {
      toast.error(error.message);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const resolve = async event => {
    event.preventDefault();
    if (!internalNote.trim()) return toast.error('Vui lòng nhập ghi chú nội bộ.');
    setSubmitting(true);
    try {
      const updated = await request(`/api/v1/contact-requests/${selected.contactRequestId}/${resolveAction}`, {
        method: 'POST', body: JSON.stringify({ internalNote: internalNote.trim() }),
      });
      setSelected(updated);
      setResolveAction('');
      setInternalNote('');
      toast.success(resolveAction === 'complete' ? 'Đã xác nhận liên hệ với khách hàng.' : 'Đã ghi nhận không thể liên hệ với khách hàng.');
      await loadData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canResolve = selected?.status === 'PROCESSING'
    && (systemRole === 'CLINIC_MANAGER' || selected.assignedStaffId === staffId);

  return (
    <ReceptionistLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yêu cầu liên hệ</h1>
            <p className="mt-1 text-sm text-gray-500">Tiếp nhận và theo dõi các yêu cầu được gửi từ trang Liên hệ.</p>
          </div>
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Tổng cộng: <strong>{pageInfo.totalElements}</strong> yêu cầu
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-[1fr_180px_150px_150px_170px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input value={search} onChange={event => { setSearch(event.target.value); setPage(0); }}
              placeholder="Tìm mã yêu cầu, tên, số điện thoại, email..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary-500" />
          </div>
          <select value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS).map(([value, info]) => <option key={value} value={value}>{info.label}</option>)}
          </select>
          <input type="date" aria-label="Từ ngày" title="Từ ngày" value={fromDate} onChange={event => { setFromDate(event.target.value); setPage(0); }} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
          <input type="date" aria-label="Đến ngày" title="Đến ngày" min={fromDate || undefined} value={toDate} onChange={event => { setToDate(event.target.value); setPage(0); }} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500" />
          <select value={sortDirection} onChange={event => { setSortDirection(event.target.value); setPage(0); }} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500"><option value="desc">Mới nhất trước</option><option value="asc">Cũ nhất trước</option></select>
          <button onClick={loadData} className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white">Làm mới</button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr><th className="px-5 py-4">Mã yêu cầu</th><th className="px-5 py-4">Người gửi</th><th className="px-5 py-4">Chủ đề</th><th className="px-5 py-4">Thời gian</th><th className="px-5 py-4">Phụ trách</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? <tr><td colSpan="7" className="px-5 py-12 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
                  : items.length === 0 ? <tr><td colSpan="7" className="px-5 py-12 text-center text-gray-500"><Inbox className="mx-auto mb-2 h-8 w-8" />Chưa có yêu cầu phù hợp.</td></tr>
                  : items.map(item => {
                    const statusInfo = STATUS[item.status] || STATUS.NEW;
                    return <tr key={item.contactRequestId} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-900">{item.requestCode}</td>
                      <td className="px-5 py-4"><p className="font-medium text-gray-900">{item.fullName}</p><p className="text-xs text-gray-500">{item.phone}</p></td>
                      <td className="max-w-xs px-5 py-4"><p className="truncate" title={item.subject}>{item.subject}</p></td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatTime(item.createdAt)}</td>
                      <td className="px-5 py-4 text-gray-600">{item.assignedStaffName || '-'}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}>{statusInfo.label}</span></td>
                      <td className="px-5 py-4 text-right"><button onClick={() => setSelected(item)} className="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"><Eye className="h-4 w-4" /> Xem</button></td>
                    </tr>;
                  })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 text-sm text-gray-500">
            <span>Trang {page + 1}/{Math.max(pageInfo.totalPages, 1)}</span>
            <div className="flex gap-2"><button disabled={page === 0} onClick={() => setPage(value => value - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Trước</button><button disabled={page + 1 >= pageInfo.totalPages} onClick={() => setPage(value => value + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sau</button></div>
          </div>
        </div>
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
          <div className="flex items-start justify-between border-b p-6"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary-600">{selected.requestCode}</p><h2 className="mt-1 text-xl font-bold text-gray-900">{selected.subject}</h2></div><button onClick={() => { setSelected(null); setResolveAction(''); }} className="text-2xl text-gray-400">×</button></div>
          <div className="space-y-5 p-6 text-sm">
            <div className="grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2"><div><p className="text-gray-500">Người gửi</p><p className="font-medium">{selected.fullName}</p></div><div><p className="text-gray-500">Số điện thoại</p><p className="font-medium">{selected.phone}</p></div><div><p className="text-gray-500">Email</p><p className="font-medium break-all">{selected.email || '-'}</p></div><div><p className="text-gray-500">Thời gian gửi</p><p className="font-medium">{formatTime(selected.createdAt)}</p></div></div>
            <div><p className="mb-2 font-semibold text-gray-700">Nội dung liên hệ</p><div className="whitespace-pre-wrap rounded-xl border border-gray-200 p-4 text-gray-700">{selected.message}</div></div>
            <div><p className="mb-2 font-semibold text-gray-700">Người phụ trách</p><p>{selected.assignedStaffName || '-'}</p></div>
            {selected.internalNote && <div><p className="mb-2 font-semibold text-gray-700">Ghi chú nội bộ</p><div className="whitespace-pre-wrap rounded-xl bg-amber-50 p-4 text-amber-900">{selected.internalNote}</div></div>}
            {resolveAction && <form onSubmit={resolve} className="space-y-3 rounded-xl border border-gray-200 p-4"><label className="font-semibold text-gray-700">{resolveAction === 'complete' ? 'Ghi chú kết quả liên hệ' : 'Lý do không thể liên hệ'}</label><textarea value={internalNote} onChange={event => setInternalNote(event.target.value)} maxLength={1000} rows="4" placeholder={resolveAction === 'complete' ? 'Ví dụ: Đã tư vấn dịch vụ; khách đã nắm được thông tin...' : 'Ví dụ: Khách không nghe máy sau nhiều lần gọi, sai số điện thoại...'} className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-primary-500" /><p className="text-xs text-gray-500">{resolveAction === 'complete' ? 'Ghi lại kết quả trao đổi để tiện tra cứu sau này.' : 'Lý do không thể liên hệ là bắt buộc và sẽ được lưu trong lịch sử yêu cầu.'}</p><div className="flex justify-end gap-2"><button type="button" onClick={() => setResolveAction('')} className="rounded-lg border px-4 py-2">Quay lại</button><button disabled={submitting} className={`rounded-lg px-4 py-2 font-medium text-white disabled:opacity-60 ${resolveAction === 'complete' ? 'bg-emerald-600' : 'bg-red-600'}`}>{resolveAction === 'complete' ? 'Xác nhận đã liên hệ' : 'Xác nhận không thể liên hệ'}</button></div></form>}
          </div>
          {!resolveAction && <div className="flex flex-wrap justify-end gap-3 border-t p-5">
            {selected.status === 'NEW' && <button disabled={submitting} onClick={() => accept(selected)} className="rounded-xl bg-primary-600 px-5 py-2.5 font-medium text-white">Tiếp nhận</button>}
            {canResolve && <><button onClick={() => { setResolveAction('cancel'); setInternalNote(''); }} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 font-medium text-red-600"><XCircle className="h-4 w-4" /> Không thể liên hệ</button><button onClick={() => { setResolveAction('complete'); setInternalNote(''); }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white"><CheckCircle2 className="h-4 w-4" /> Xác nhận đã liên hệ</button></>}
          </div>}
        </div>
      </div>}
    </ReceptionistLayout>
  );
}

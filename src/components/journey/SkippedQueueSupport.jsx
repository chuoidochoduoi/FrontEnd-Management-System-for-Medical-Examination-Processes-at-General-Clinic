import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, UserCheck, X } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getSkippedReturnTickets, restoreSkippedTicket } from '@/services/queueReturnRequestService';

const formatMoment = value => value ? new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export default function SkippedQueueSupport() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [restoringId, setRestoringId] = useState('');
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const loadTickets = useCallback(async (silent = false) => {
        const controller = new AbortController();
        if (!silent) setLoading(true);
        try { const data = await getSkippedReturnTickets(controller.signal); setTickets(Array.isArray(data) ? data : []); setError(''); }
        catch (failure) { if (!controller.signal.aborted) setError(failure.message); }
        finally { if (!controller.signal.aborted) setLoading(false); }
        return () => controller.abort();
    }, []);
    useEffect(() => { loadTickets(); const timer = window.setInterval(() => { if (!document.hidden) loadTickets(true); }, 20000); return () => window.clearInterval(timer); }, [loadTickets]);
    useWebSocket('/topic/queue-return-requests', null, () => loadTickets(true), { authenticated: true });
    const restoreToQueue = async queueTicketId => {
        if (!queueTicketId || restoringId) return;
        setRestoringId(queueTicketId); setError('');
        try { await restoreSkippedTicket(queueTicketId); setTickets(current => current.filter(item => item.queueTicketId !== queueTicketId)); }
        catch (failure) { setError(failure.message); await loadTickets(true); }
        finally { setRestoringId(''); }
    };
    const visibleTickets = useMemo(() => {
        const keyword = query.trim().toLocaleLowerCase('vi');
        return !keyword ? tickets : tickets.filter(item => [item.patientName, item.patientCode, item.phone, item.visitCode, item.roomName, item.roomCode].some(value => String(value || '').toLocaleLowerCase('vi').includes(keyword)));
    }, [query, tickets]);
    const birthLabel = item => item.dateOfBirth ? new Date(`${item.dateOfBirth}T00:00:00`).toLocaleDateString('vi-VN') : item.age != null ? `${item.age} tuổi` : 'Chưa có ngày sinh';
    return <>
        <section className="cares-return-summary" aria-label="Bệnh nhân vắng cần hỗ trợ"><div><span><UserCheck size={18} /> Điều phối tại quầy</span><p><strong>{loading ? 'Đang kiểm tra...' : `${tickets.length} bệnh nhân vắng cần hỗ trợ`}</strong> · Xác minh và đưa lại hàng chờ ngay tại màn này.</p></div><button type="button" onClick={() => setOpen(true)}>Xử lý danh sách {tickets.length > 0 && <b>{tickets.length}</b>}</button></section>
        {open && <div className="cares-return-modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setOpen(false)}><section className="cares-return-modal" role="dialog" aria-modal="true" aria-labelledby="return-request-title">
            <header><div><span><UserCheck size={19} /> Điều phối tại quầy</span><h2 id="return-request-title">Bệnh nhân vắng cần hỗ trợ</h2><p>Đối chiếu họ tên cùng số điện thoại hoặc mã bệnh nhân trước khi xác nhận.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Đóng"><X size={22} /></button></header>
            <label className="cares-return-search"><Search size={18} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên, SĐT, mã bệnh nhân, mã VIS hoặc phòng" /></label>
            {error && <div className="cares-return-request-error" role="alert">{error}<button type="button" onClick={() => loadTickets()}>Tải lại</button></div>}
            {loading && <div className="cares-return-request-empty"><span className="cares-reception-spinner" /> Đang tải phiếu vắng...</div>}
            {!loading && !error && visibleTickets.length === 0 && <div className="cares-return-request-empty">{tickets.length ? 'Không tìm thấy bệnh nhân phù hợp.' : 'Hôm nay chưa có bệnh nhân bị đánh dấu vắng.'}</div>}
            {!loading && visibleTickets.length > 0 && <div className="cares-return-request-list">{visibleTickets.map(item => <article key={item.queueTicketId}>
                <div><strong>{item.patientName || 'Người được khám'}</strong><span>{item.patientCode || 'Khách vãng lai'} · {birthLabel(item)}</span><span>{item.phone || 'Chưa có SĐT'}</span></div>
                <div><strong>{item.roomName || 'Chưa xác định phòng'}</strong><span>{item.roomCode || '—'} · Phiếu {item.queueNumber ?? '—'}</span><span>{item.visitCode}</span></div>
                <div><small>Đã gọi lúc</small><span>{formatMoment(item.calledAt)}</span></div>
                <button type="button" disabled={restoringId === item.queueTicketId} onClick={() => restoreToQueue(item.queueTicketId)}>{restoringId === item.queueTicketId ? <span className="cares-reception-spinner" /> : <UserCheck size={18} />}{restoringId === item.queueTicketId ? 'Đang xử lý...' : 'Xác nhận và đưa lại'}</button>
            </article>)}</div>}
        </section></div>}
    </>;
}

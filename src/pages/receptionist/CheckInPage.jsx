import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, FilePlus, RotateCcw, Search, UsersRound } from 'lucide-react';

import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { useCheckIn } from '@/hooks/useCheckIn';
import { ROUTES } from '@/constants/routes';

const STATUS_LABEL = {
    pending: 'Chờ check-in',
    checked_in: 'Đã check-in',
    cancelled: 'Đã hủy',
    rescheduled: 'Đã đổi lịch',
};

const statusKey = (value) => String(value || '').toLowerCase();
const slotKey = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized.includes('tối') || normalized.includes('evening')) return 'EVENING';
    if (normalized.includes('chiều') || normalized.includes('afternoon')) return 'AFTERNOON';
    if (normalized.includes('sáng') || normalized.includes('morning')) return 'MORNING';
    return normalized.toUpperCase();
};
const slotLabel = (value) => ({ MORNING: 'Ca sáng', AFTERNOON: 'Ca chiều', EVENING: 'Ca tối' }[slotKey(value)] || value || 'Chưa xác định');

function StatusBadge({ appointment }) {
    if (appointment.followUp) return <span className="cares-reception-badge is-warning">Cần tái khám</span>;
    const key = statusKey(appointment.status);
    return <span className={`cares-reception-badge is-${key || 'neutral'}`}>{STATUS_LABEL[key] || appointment.status || 'Chưa xác định'}</span>;
}

export default function CheckInPage() {
    const navigate = useNavigate();
    const { appointments, loading, error, fetchAppointments } = useCheckIn();
    const [search, setSearch] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [timeSlot, setTimeSlot] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => { fetchAppointments({ date, status }); }, [date, status, fetchAppointments]);

    const filteredAppointments = useMemo(() => (Array.isArray(appointments) ? appointments : []).filter((appointment) => {
        const keyword = search.trim().toLowerCase();
        const matchesSearch = !keyword || [appointment.patientName, appointment.phone, appointment.code, appointment.patientCode]
            .some((value) => String(value || '').toLowerCase().includes(keyword));
        return matchesSearch && (!timeSlot || slotKey(appointment.timeSlot || appointment.shiftName) === timeSlot);
    }), [appointments, search, timeSlot]);

    const summary = useMemo(() => {
        const rows = Array.isArray(appointments) ? appointments : [];
        return {
            total: rows.length,
            pending: rows.filter((item) => statusKey(item.status) === 'pending').length,
            checkedIn: rows.filter((item) => statusKey(item.status) === 'checked_in').length,
            followUp: rows.filter((item) => item.followUp).length,
        };
    }, [appointments]);

    const selectedDateLabel = date
        ? new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';
    const openDetail = (appointment) => navigate(ROUTES.RECEPTIONIST_APPOINTMENT_DETAIL.replace(':id', appointment.id));

    return <ReceptionistLayout>
        <div className="cares-reception-screen cares-checkin-screen">
            <header className="cares-reception-page-header">
                <div>
                    <span className="cares-reception-eyebrow"><ClipboardCheck size={17} /> Quầy tiếp đón</span>
                    <h1>Tiếp đón & Check-in</h1>
                    <p>Tra cứu lịch hẹn, xác nhận thông tin và tiếp nhận bệnh nhân trong ngày.</p>
                </div>
                <button type="button" className="cares-reception-primary" onClick={() => navigate(ROUTES.RECEPTIONIST_CREATE_TICKET)}>
                    <FilePlus size={20} /> Tạo phiếu khám
                </button>
            </header>

            <section className="cares-reception-stats" aria-label="Tổng hợp lịch hẹn">
                <article><span><CalendarDays size={21} /></span><div><small>Tổng lịch hẹn</small><strong>{summary.total}</strong></div></article>
                <article><span className="is-warning"><Clock3 size={21} /></span><div><small>Chờ check-in</small><strong>{summary.pending}</strong></div></article>
                <article><span className="is-info"><CheckCircle2 size={21} /></span><div><small>Đã check-in</small><strong>{summary.checkedIn}</strong></div></article>
                <article><span className="is-purple"><RotateCcw size={21} /></span><div><small>Cần tái khám</small><strong>{summary.followUp}</strong></div></article>
            </section>

            <section className="cares-reception-filter-bar">
                <label className="is-search"><span>Tìm bệnh nhân hoặc mã lịch</span><div><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, số điện thoại hoặc mã lịch..." /></div></label>
                <label><span>Ngày tiếp đón</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
                <label><span>Ca khám</span><select value={timeSlot} onChange={(event) => setTimeSlot(event.target.value)}><option value="">Tất cả ca</option><option value="MORNING">Ca sáng</option><option value="AFTERNOON">Ca chiều</option><option value="EVENING">Ca tối</option></select></label>
                <label><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option><option value="PENDING">Chờ check-in</option><option value="CHECKED_IN">Đã check-in</option><option value="CANCELLED">Đã hủy</option></select></label>
            </section>

            <section className="cares-reception-table-card">
                <header><div><h2>Lịch hẹn ngày {date ? new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN') : ''}</h2><p>{selectedDateLabel}</p></div><span>{filteredAppointments.length} lịch phù hợp</span></header>
                <div className="cares-reception-table-scroll">
                    <table className="cares-reception-table">
                        <thead><tr><th>Ca khám</th><th>Mã lịch</th><th>Bệnh nhân</th><th>Liên hệ</th><th>Tuổi/Giới tính</th><th>Trạng thái</th><th className="text-right">Thao tác</th></tr></thead>
                        <tbody>
                            {loading && <tr><td colSpan="7"><div className="cares-reception-state"><span className="cares-reception-spinner" /><strong>Đang tải lịch hẹn...</strong></div></td></tr>}
                            {!loading && error && <tr><td colSpan="7"><div className="cares-reception-state is-error"><strong>{error}</strong><button type="button" onClick={() => fetchAppointments({ date, status })}>Thử lại</button></div></td></tr>}
                            {!loading && !error && filteredAppointments.length === 0 && <tr><td colSpan="7"><div className="cares-reception-state"><UsersRound size={34} /><strong>Không có lịch hẹn phù hợp</strong><p>Hãy thay đổi ngày hoặc bộ lọc để tìm lịch khác.</p></div></td></tr>}
                            {!loading && !error && filteredAppointments.map((appointment, index) => <tr key={appointment.id || index} className={appointment.followUp ? 'is-follow-up' : ''}>
                                <td><strong className="cares-reception-slot">{slotLabel(appointment.timeSlot || appointment.shiftName)}</strong><small>{appointment.shiftTime || ''}</small></td>
                                <td><strong>{appointment.code || '—'}</strong></td>
                                <td><strong>{appointment.patientName || 'Khách vãng lai'}</strong>{appointment.patientCode && <small>{appointment.patientCode}</small>}</td>
                                <td><span>{appointment.phone || '—'}</span></td>
                                <td><span>{appointment.age || '—'} / {appointment.gender || '—'}</span></td>
                                <td><StatusBadge appointment={appointment} /></td>
                                <td><div className="cares-reception-row-actions"><button type="button" onClick={() => openDetail(appointment)}>{statusKey(appointment.status) === 'pending' ? 'Tiếp nhận' : 'Xem chi tiết'}<ChevronRight size={17} /></button></div></td>
                            </tr>)}
                        </tbody>
                    </table>
                </div>

                <div className="cares-reception-mobile-list">
                    {loading && <div className="cares-reception-state"><span className="cares-reception-spinner" /><strong>Đang tải lịch hẹn...</strong></div>}
                    {!loading && error && <div className="cares-reception-state is-error"><strong>{error}</strong><button type="button" onClick={() => fetchAppointments({ date, status })}>Thử lại</button></div>}
                    {!loading && !error && filteredAppointments.length === 0 && <div className="cares-reception-state"><UsersRound size={34} /><strong>Không có lịch hẹn phù hợp</strong></div>}
                    {!loading && !error && filteredAppointments.map((appointment, index) => <article key={appointment.id || index}>
                        <div><span className="cares-reception-slot">{slotLabel(appointment.timeSlot || appointment.shiftName)}</span><StatusBadge appointment={appointment} /></div>
                        <h3>{appointment.patientName || 'Khách vãng lai'}</h3>
                        <p>{appointment.code || '—'} · {appointment.phone || 'Chưa có SĐT'}</p>
                        <button type="button" onClick={() => openDetail(appointment)}>{statusKey(appointment.status) === 'pending' ? 'Tiếp nhận bệnh nhân' : 'Xem chi tiết'}<ChevronRight size={18} /></button>
                    </article>)}
                </div>
            </section>
        </div>
    </ReceptionistLayout>;
}

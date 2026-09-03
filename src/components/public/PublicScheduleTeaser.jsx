import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Clock3, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPublicDepartmentSchedule } from '@/services/publicDepartmentScheduleService';

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DEFAULT_SHIFTS = [
  { fallbackId: 'morning', name: 'Ca Sáng', startTime: '00:00', endTime: '08:00' },
  { fallbackId: 'afternoon', name: 'Ca Chiều', startTime: '08:00', endTime: '16:00' },
  { fallbackId: 'evening', name: 'Ca Tối', startTime: '16:00', endTime: '23:59' },
];

const normalizeText = value => (value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLocaleLowerCase('vi-VN');

const vietnamNow = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

const mondayOfIsoDate = isoDate => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay();
  date.setDate(date.getDate() - (weekday === 0 ? 6 : weekday - 1));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const displayVietnamDate = isoDate => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: VIETNAM_TIME_ZONE,
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
};

const toMinutes = value => {
  const [hour = 0, minute = 0] = String(value || '').split(':').map(Number);
  return hour * 60 + minute;
};

const buildTodayShifts = schedule => {
  const apiShifts = schedule?.shifts || [];
  return DEFAULT_SHIFTS.map((fallback, index) => {
    const apiShift = apiShifts.find(item => normalizeText(item.name) === normalizeText(fallback.name)) || apiShifts[index];
    return apiShift ? { ...fallback, ...apiShift, fallbackId: fallback.fallbackId } : fallback;
  });
};

export default function PublicScheduleTeaser() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(vietnamNow);

  const loadSchedule = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getPublicDepartmentSchedule(mondayOfIsoDate(vietnamNow().date), controller.signal)
      .then(setSchedule)
      .catch(requestError => {
        if (requestError.name !== 'AbortError') {
          setSchedule(null);
          setError(requestError.message || 'Không thể tải lịch khám Nội khoa.');
        }
      })
      .finally(() => setLoading(false));
    return controller;
  }, []);

  useEffect(() => {
    const controller = loadSchedule();
    return () => controller.abort();
  }, [loadSchedule, now.date]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(vietnamNow()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const internalMedicine = useMemo(() => (schedule?.departments || [])
    .find(department => normalizeText(department.groupName) === 'noi khoa'), [schedule]);

  const shifts = useMemo(() => {
    const availability = new Map((internalMedicine?.availability || [])
      .filter(item => item.date === now.date)
      .map(item => [item.shiftId, item.available]));

    return buildTodayShifts(schedule).map(shift => {
      const endMinutes = toMinutes(shift.endTime);
      const available = Boolean(shift.shiftId && availability.get(shift.shiftId));
      const ended = now.minutes >= endMinutes && endMinutes !== 1439;
      const ongoing = now.minutes >= toMinutes(shift.startTime)
        && (endMinutes === 1439 ? now.minutes <= endMinutes : now.minutes < endMinutes);
      return {
        ...shift,
        available,
        ended,
        ongoing: ongoing && available,
      };
    });
  }, [internalMedicine, now.date, now.minutes, schedule]);

  const openWeeklySchedule = () => {
    const query = internalMedicine?.groupId ? `?department=${encodeURIComponent(internalMedicine.groupId)}` : '';
    navigate(`/schedule${query}`);
  };

  return (
    <section className="cares-home-schedule">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="cares-home-schedule-card cares-home-today-schedule">
          <div className="cares-home-schedule-copy">
            <span><CalendarDays size={18} /> Lịch khám hôm nay</span>
            <h2>Lịch khám Nội khoa</h2>
            <strong className="cares-home-today-date">{displayVietnamDate(now.date)}</strong>
            <p>Lịch được cập nhật từ phân công thực tế của bác sĩ Nội khoa theo từng ca.</p>
            <button type="button" onClick={openWeeklySchedule}>Xem lịch Nội khoa cả tuần <ArrowRight size={20} /></button>
          </div>

          <div className="cares-home-today-shifts" aria-live="polite">
            {loading && DEFAULT_SHIFTS.map(shift => (
              <div className="cares-home-today-shift is-loading" key={shift.fallbackId}><span /><div><i /><i /></div></div>
            ))}

            {!loading && error && (
              <div className="cares-home-today-message is-error">
                <RefreshCw size={25} />
                <div><strong>Chưa thể tải lịch Nội khoa</strong><p>{error}</p></div>
                <button type="button" onClick={loadSchedule}>Tải lại</button>
              </div>
            )}

            {!loading && !error && !internalMedicine && (
              <div className="cares-home-today-message">
                <CalendarDays size={25} />
                <div><strong>Chưa cấu hình lịch Nội khoa</strong><p>Vui lòng xem lịch đầy đủ hoặc quay lại sau.</p></div>
              </div>
            )}

            {!loading && !error && internalMedicine && shifts.map(shift => {
              const status = shift.ended ? 'Đã kết thúc' : shift.available ? 'Có khám' : 'Không khám';
              const StatusIcon = shift.ended ? Clock3 : shift.available ? Check : X;
              return (
                <article className={`cares-home-today-shift${shift.ongoing ? ' is-current' : ''}${shift.ended ? ' is-ended' : ''}${!shift.available ? ' is-unavailable' : ''}`} key={shift.shiftId || shift.fallbackId}>
                  <span className="cares-home-today-shift-icon"><Clock3 size={23} /></span>
                  <div><strong>{shift.name}</strong><small>{shift.startTime} – {shift.endTime}</small></div>
                  <span className="cares-home-today-status"><StatusIcon size={18} /> {status}</span>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

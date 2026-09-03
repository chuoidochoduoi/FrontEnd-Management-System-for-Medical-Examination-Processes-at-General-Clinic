import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, RefreshCw, Stethoscope } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PublicSiteShell from '@/components/public/PublicSiteShell';
import { getPublicDepartmentSchedule } from '@/services/publicDepartmentScheduleService';
import { CaresButton } from '@/components/ui/CaresUI';

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const toIsoDate = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromIsoDate = value => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const mondayOf = value => {
  const date = value instanceof Date ? new Date(value) : fromIsoDate(value);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value, days) => {
  const date = value instanceof Date ? new Date(value) : fromIsoDate(value);
  date.setDate(date.getDate() + days);
  return date;
};

const displayDate = value => fromIsoDate(value).toLocaleDateString('vi-VN');
const displayShortDate = value => displayDate(value).replace(/\/\d{4}$/, '');

function AvailabilityMark({ available }) {
  return available
    ? <span className="cares-availability yes" title="Có khám"><Check size={17} /></span>
    : <span className="cares-availability no" title="Không khám">−</span>;
}

function ScheduleSkeleton() {
  return <div className="cares-schedule-skeleton" aria-label="Đang tải lịch khám">{Array.from({ length: 9 }, (_, index) => <span key={index} />)}</div>;
}

function MobileDepartment({ department, shifts, dates, isOpen, onToggle }) {
  const availability = new Map(department.availability.map(item => [`${item.date}-${item.shiftId}`, item.available]));
  return (
    <article className="cares-mobile-department">
      <button type="button" onClick={onToggle} aria-expanded={isOpen}>
        <span><Stethoscope size={20} />{department.groupName}</span><ChevronDown className={isOpen ? 'rotate-180' : ''} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="cares-mobile-department-body">
            {dates.map((date, dayIndex) => (
              <div className="cares-mobile-day" key={date}>
                <div><strong>{DAY_LABELS[dayIndex]}</strong><span>{displayDate(date)}</span></div>
                <div>{shifts.map(shift => <div key={shift.shiftId}><span>{shift.name}<small>{shift.startTime} – {shift.endTime}</small></span><AvailabilityMark available={availability.get(`${date}-${shift.shiftId}`)} /></div>)}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

export default function PublicSchedulePage() {
  const [searchParams] = useSearchParams();
  const requestedDepartment = searchParams.get('department');
  const [weekStart, setWeekStart] = useState(() => toIsoDate(mondayOf(new Date())));
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(requestedDepartment || 'ALL');
  const [openDepartment, setOpenDepartment] = useState(null);

  const loadSchedule = () => {
    const controller = new AbortController();
    setLoading(true); setError('');
    getPublicDepartmentSchedule(weekStart, controller.signal)
      .then(data => {
        setSchedule(data);
        const requestedExists = requestedDepartment
          && data.departments?.some(item => item.groupId === requestedDepartment);
        const selectedDepartment = requestedExists ? requestedDepartment : data.departments?.[0]?.groupId;
        setFilter(requestedExists ? requestedDepartment : 'ALL');
        setOpenDepartment(selectedDepartment || null);
      })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  };

  useEffect(loadSchedule, [weekStart]);

  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(weekStart, index))), [weekStart]);
  const departments = useMemo(() => {
    const items = schedule?.departments || [];
    return filter === 'ALL' ? items : items.filter(item => item.groupId === filter);
  }, [schedule, filter]);

  const moveWeek = amount => setWeekStart(toIsoDate(addDays(weekStart, amount * 7)));

  return (
    <PublicSiteShell>
      <section className="cares-schedule-page">
        <div className="cares-schedule-glow one" /><div className="cares-schedule-glow two" />
        <div className="cares-public-container cares-schedule-content">
          <div className="cares-schedule-heading">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <span className="cares-eyebrow"><CalendarDays size={16} /> Thông tin hoạt động trong tuần</span>
              <h1>Lịch khám theo khoa</h1>
              <p>Tra cứu nhanh khoa có lịch phục vụ theo từng ngày và ca làm việc. Lịch không công khai thông tin cá nhân của nhân viên.</p>
            </motion.div>
            <CaresButton size="lg" icon={CalendarDays} onClick={() => window.location.assign('/appointment')}>Đặt lịch khám</CaresButton>
          </div>

          <div className="cares-schedule-toolbar">
            <div className="cares-week-navigation">
              <button type="button" onClick={() => moveWeek(-1)}><ChevronLeft size={18} /> Tuần trước</button>
              <div><CalendarDays size={18} /><strong>{displayDate(weekStart)} – {displayDate(toIsoDate(addDays(weekStart, 6)))}</strong></div>
              <button type="button" onClick={() => moveWeek(1)}>Tuần sau <ChevronRight size={18} /></button>
            </div>
            <div className="cares-schedule-options">
              <label><span className="sr-only">Lọc chuyên khoa</span><select value={filter} onChange={event => setFilter(event.target.value)}><option value="ALL">Tất cả chuyên khoa</option>{(schedule?.departments || []).map(item => <option value={item.groupId} key={item.groupId}>{item.groupName}</option>)}</select></label>
              <div className="cares-schedule-legend"><span><AvailabilityMark available /> Có khám</span><span><AvailabilityMark available={false} /> Không khám</span></div>
            </div>
          </div>

          {loading && <ScheduleSkeleton />}
          {!loading && error && <div className="cares-schedule-state"><RefreshCw size={32} /><h2>Chưa thể tải lịch khám</h2><p>{error}</p><CaresButton icon={RefreshCw} onClick={loadSchedule}>Thử lại</CaresButton></div>}
          {!loading && !error && departments.length === 0 && <div className="cares-schedule-state"><CalendarDays size={32} /><h2>Chưa có lịch khám trong tuần</h2><p>Vui lòng chọn tuần khác hoặc quay lại sau.</p></div>}

          {!loading && !error && departments.length > 0 && (
            <>
              <div className="cares-schedule-table-wrap">
                <table className="cares-schedule-table">
                  <thead><tr><th>Chuyên khoa</th><th>Ca làm việc</th>{dates.map((date, index) => <th key={date}>{DAY_LABELS[index]}<span>{displayShortDate(date)}</span></th>)}</tr></thead>
                  <tbody>{departments.flatMap(department => {
                    const availability = new Map(department.availability.map(item => [`${item.date}-${item.shiftId}`, item.available]));
                    return (schedule.shifts || []).map((shift, shiftIndex) => (
                      <tr key={`${department.groupId}-${shift.shiftId}`}>
                        {shiftIndex === 0 && <th rowSpan={schedule.shifts.length} scope="rowgroup"><span className="cares-department-name"><Stethoscope size={22} />{department.groupName}</span></th>}
                        <td className="cares-shift-cell"><strong>{shift.name}</strong><span><Clock3 size={13} />{shift.startTime} – {shift.endTime}</span></td>
                        {dates.map(date => <td key={date}><AvailabilityMark available={availability.get(`${date}-${shift.shiftId}`)} /></td>)}
                      </tr>
                    ));
                  })}</tbody>
                </table>
              </div>
              <div className="cares-mobile-schedule">{departments.map(department => <MobileDepartment key={department.groupId} department={department} shifts={schedule.shifts || []} dates={dates} isOpen={openDepartment === department.groupId} onToggle={() => setOpenDepartment(current => current === department.groupId ? null : department.groupId)} />)}</div>
            </>
          )}
        </div>
      </section>
    </PublicSiteShell>
  );
}

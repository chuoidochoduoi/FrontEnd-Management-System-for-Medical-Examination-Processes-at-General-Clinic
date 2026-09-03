import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Search, Stethoscope, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicSiteShell from '@/components/public/PublicSiteShell';
import { CaresButton, CaresCard, CaresState } from '@/components/ui/CaresUI';

const initialsOf = name => (name || 'BS').trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();

export default function PublicDoctorsPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('ALL');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/public/doctors`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('Không thể tải danh sách bác sĩ.'); return response.json(); })
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const specialties = useMemo(() => ['ALL', ...new Set(doctors.map(item => item.specializationName).filter(Boolean))], [doctors]);
  const visible = useMemo(() => doctors.filter(doctor => {
    const keyword = query.trim().toLocaleLowerCase('vi');
    return (specialty === 'ALL' || doctor.specializationName === specialty)
      && (!keyword || `${doctor.fullName} ${doctor.specializationName || ''}`.toLocaleLowerCase('vi').includes(keyword));
  }), [doctors, query, specialty]);

  return (
    <PublicSiteShell>
      <section className="cares-directory-hero"><div className="cares-public-container"><span className="cares-eyebrow"><UserRound size={16} /> Đội ngũ CareS</span><h1>Chuyên môn vững vàng, chăm sóc tận tâm</h1><p>Danh sách chỉ công khai họ tên và chuyên khoa; lịch trực chi tiết của nhân viên luôn được bảo vệ.</p></div></section>
      <section className="cares-public-container cares-directory-content">
        <div className="cares-directory-toolbar"><label><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm bác sĩ hoặc chuyên khoa..." /></label><div>{specialties.map(item => <button type="button" key={item} className={specialty === item ? 'is-active' : ''} onClick={() => setSpecialty(item)}>{item === 'ALL' ? 'Tất cả' : item}</button>)}</div></div>
        {loading && <CaresCard><CaresState type="loading" title="Đang tải đội ngũ bác sĩ" /></CaresCard>}
        {!loading && error && <CaresCard><CaresState type="error" title="Chưa thể tải danh sách bác sĩ" description={error} /></CaresCard>}
        {!loading && !error && visible.length === 0 && <CaresCard><CaresState title="Không tìm thấy bác sĩ phù hợp" /></CaresCard>}
        {!loading && !error && visible.length > 0 && <motion.div layout className="cares-doctor-directory-grid">{visible.map((doctor, index) => <motion.article layout initial={{ opacity: 0, scale: .96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * .05 }} key={doctor.staffId} className="cares-doctor-directory-card"><div className="cares-doctor-photo">{doctor.avatarUrl ? <img src={doctor.avatarUrl} alt={doctor.fullName} loading="lazy" /> : <span>{initialsOf(doctor.fullName)}</span>}<i><Stethoscope size={16} /></i></div><div><h2>{doctor.fullName || 'Bác sĩ CareS'}</h2><p>{doctor.specializationName || 'Khám tổng quát'}</p><small>Lịch trực cá nhân được bảo mật; vui lòng xem lịch theo khoa.</small></div></motion.article>)}</motion.div>}
        <div className="cares-directory-cta"><div><h2>Xem lịch khoa trước khi đặt hẹn</h2><p>Lịch công khai cho biết khoa nào đang hoạt động mà không tiết lộ lịch cá nhân của bác sĩ.</p></div><div><CaresButton variant="secondary" size="lg" icon={CalendarDays} onClick={() => navigate('/schedule')}>Xem lịch khoa</CaresButton><CaresButton size="lg" icon={CalendarDays} onClick={() => navigate('/appointment')}>Đặt lịch khám</CaresButton></div></div>
      </section>
    </PublicSiteShell>
  );
}

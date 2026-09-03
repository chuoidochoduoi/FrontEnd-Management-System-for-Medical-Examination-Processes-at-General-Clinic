import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CalendarDays, Microscope, Search, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicSiteShell from '@/components/public/PublicSiteShell';
import { CaresButton, CaresCard, CaresState } from '@/components/ui/CaresUI';
import { useAppointment } from '@/hooks/useAppointment';

const formatMoney = value => new Intl.NumberFormat('vi-VN').format(Number(value || 0));
const groupOf = service => service.departmentType === 'PARACLINICAL'
  ? 'Cận lâm sàng'
  : service.specializationName || service.department || 'Khám tổng quát';

export default function PublicServicesPage() {
  const navigate = useNavigate();
  const { services, loadingServices, error } = useAppointment();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('ALL');

  const groups = useMemo(() => ['ALL', ...new Set(services.map(groupOf))], [services]);
  const visible = useMemo(() => services.filter(service => {
    const matchesGroup = group === 'ALL' || groupOf(service) === group;
    const keyword = query.trim().toLocaleLowerCase('vi');
    return matchesGroup && (!keyword || `${service.name} ${service.description || ''}`.toLocaleLowerCase('vi').includes(keyword));
  }), [services, group, query]);

  return (
    <PublicSiteShell>
      <section className="cares-directory-hero"><div className="cares-public-container"><span className="cares-eyebrow"><Stethoscope size={16} /> Danh mục chăm sóc</span><h1>Dịch vụ phù hợp cho từng nhu cầu sức khỏe</h1><p>Thông tin dịch vụ và giá được lấy trực tiếp từ danh mục đang áp dụng của phòng khám.</p></div></section>
      <section className="cares-public-container cares-directory-content">
        <div className="cares-directory-toolbar">
          <label><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên hoặc mô tả dịch vụ..." /></label>
          <div>{groups.map(item => <button type="button" key={item} className={group === item ? 'is-active' : ''} onClick={() => setGroup(item)}>{item === 'ALL' ? 'Tất cả' : item}</button>)}</div>
        </div>

        {loadingServices && <CaresCard><CaresState type="loading" title="Đang tải danh mục dịch vụ" /></CaresCard>}
        {!loadingServices && error && <CaresCard><CaresState type="error" title="Chưa thể tải dịch vụ" description={error} /></CaresCard>}
        {!loadingServices && !error && visible.length === 0 && <CaresCard><CaresState title="Không tìm thấy dịch vụ phù hợp" description="Hãy thử từ khóa hoặc nhóm dịch vụ khác." /></CaresCard>}
        {!loadingServices && !error && visible.length > 0 && <motion.div layout className="cares-service-directory-grid">{visible.map((service, index) => {
          const paraclinical = service.departmentType === 'PARACLINICAL';
          const Icon = paraclinical ? Microscope : index % 2 ? Activity : Stethoscope;
          return <motion.article layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * .035 }} key={service.id} className="cares-service-directory-card"><div><span><Icon size={20} /></span><small>{groupOf(service)}</small></div><h2>{service.name}</h2><p>{service.description || 'Dịch vụ được thực hiện theo quy trình chuyên môn của phòng khám.'}</p><footer><strong>{formatMoney(service.price)} đ</strong>{service.durationMinutes ? <span>{service.durationMinutes} phút</span> : null}</footer></motion.article>;
        })}</motion.div>}

        <div className="cares-directory-cta"><div><h2>Bạn đã chọn được dịch vụ phù hợp?</h2><p>Đặt lịch trước để hệ thống kiểm tra ca khám đang có nhân sự phù hợp.</p></div><CaresButton size="lg" icon={CalendarDays} onClick={() => navigate('/appointment')}>Đặt lịch khám</CaresButton></div>
      </section>
    </PublicSiteShell>
  );
}

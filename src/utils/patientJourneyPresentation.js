const states = {
  PAYMENT_PENDING: { label: 'Chờ thanh toán', tone: 'orange' },
  WAITING: { label: 'Đang chờ', tone: 'amber' },
  PENDING: { label: 'Đang chờ', tone: 'amber' },
  CALLED: { label: 'Đã gọi', tone: 'blue' },
  IN_PROGRESS: { label: 'Đang thực hiện', tone: 'deepBlue' },
  WAITING_FOR_TEST: { label: 'Chờ cận lâm sàng', tone: 'lightPurple' },
  RESULT_PENDING: { label: 'Chờ kết quả', tone: 'purple' },
  TEST_DONE: { label: 'Cần quay lại bác sĩ', tone: 'deepPurple' },
  DONE: { label: 'Đã hoàn thành', tone: 'teal' },
  COMPLETED: { label: 'Đã hoàn thành', tone: 'teal' },
  BLOCKED: { label: 'Chưa đến lượt', tone: 'gray' },
  SKIPPED: { label: 'Vắng mặt / bỏ lượt', tone: 'deepOrange' },
  CANCELLED: { label: 'Đã hủy', tone: 'red' },
  UNASSIGNED: { label: 'Chưa phân luồng', tone: 'red' },
};

export const journeyFilters = [
  'PAYMENT_PENDING', 'WAITING', 'CALLED', 'IN_PROGRESS', 'WAITING_FOR_TEST',
  'RESULT_PENDING', 'TEST_DONE', 'PENDING', 'SKIPPED', 'COMPLETED', 'UNASSIGNED',
];

export const journeyStatus = value => Object.hasOwn(states, value)
  ? states[value] : { label: value || '—', tone: 'gray' };

export const isJourneyCompleted = value => value === 'DONE' || value === 'COMPLETED';

export function formatCheckInDuration(value) {
  const totalMinutes = Math.max(0, Math.floor(Number(value) || 0));
  if (totalMinutes < 60) return `${totalMinutes} phút`;

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return hours > 0 ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
}

export function formatTodayCheckInDuration(value) {
  const totalMinutes = Math.max(0, Math.floor(Number(value) || 0));
  if (totalMinutes >= 1440) return '24 giờ+';
  if (totalMinutes < 60) return `${totalMinutes} phút`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
}

export function formatClinicDateTime(value) {
  const matched = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!matched) return '—';
  return `${matched[3]}/${matched[2]}/${matched[1]} ${matched[4]}:${matched[5]}`;
}

export function journeyWarnings(item, { overdue = false } = {}) {
  const warnings = [];
  if (overdue && !isJourneyCompleted(item.currentStatus)) {
    warnings.push('Lượt đang xử lý chưa được kết thúc.');
  }
  if (item.currentStatus === 'UNASSIGNED') warnings.push('Lượt khám chưa được phân luồng.');
  if (!overdue && !isJourneyCompleted(item.currentStatus) && Number(item.waitingMinutes) >= 60) {
    warnings.push('Đã qua 60 phút từ lúc check-in.');
  }
  if (item.warning && !warnings.length && !isJourneyCompleted(item.currentStatus)) {
    warnings.push('Lượt khám cần được kiểm tra.');
  }
  return warnings;
}

export function sortJourneyPage(items, order, locale = 'vi') {
  const time = value => Date.parse(value) || 0;
  return [...items].sort((a, b) => order === 'waiting'
    ? Number(b.waitingMinutes || 0) - Number(a.waitingMinutes || 0)
    : order === 'name'
      ? (a.patientName || '').localeCompare(b.patientName || '', locale)
      : time(b.checkInTime) - time(a.checkInTime));
}

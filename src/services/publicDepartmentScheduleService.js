const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const readError = async (response) => {
  const payload = await response.json().catch(() => null);
  return payload?.message || payload?.error || 'Không thể tải lịch khám. Vui lòng thử lại.';
};

export async function getPublicDepartmentSchedule(weekStart, signal) {
  const query = weekStart ? `?week=${encodeURIComponent(weekStart)}` : '';
  const response = await fetch(`${apiUrl}/api/public/department-schedules${query}`, { signal });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

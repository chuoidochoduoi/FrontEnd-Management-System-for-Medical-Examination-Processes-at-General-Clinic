const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const stored = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.message || body?.error || 'Không thể xử lý yêu cầu quay lại. Vui lòng thử lại.');
    error.status = response.status;
    throw error;
  }
  return body?.data ?? body;
}

const authHeaders = () => ({ Authorization: `Bearer ${stored('token')}` });

export const requestCustomerReturn = (visitId) => request(`/api/patient/my-journeys/${visitId}/return-request`, {
  method: 'POST', headers: authHeaders(),
});

export const requestGuestReturn = (criteria) => request('/api/public/patient-journeys/return-request', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
  body: JSON.stringify(criteria),
});

export const getPendingReturnRequests = (signal) => request('/api/v1/queue-return-requests', {
  signal, headers: authHeaders(),
});

export const confirmQueueReturn = (queueTicketId) => request(`/api/v1/queue-return-requests/${queueTicketId}/confirm`, {
  method: 'POST', headers: authHeaders(),
});

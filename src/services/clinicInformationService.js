const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const stored = key => localStorage.getItem(key) || sessionStorage.getItem(key);

const parse = async response => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || 'Không thể tải thông tin phòng khám.');
    error.fields = body.errors || {};
    throw error;
  }
  return body.data ?? body;
};

export const getPublicClinicInformation = () =>
  fetch(`${apiBase}/api/public/clinic-information`).then(parse);

export const getClinicInformation = () =>
  fetch(`${apiBase}/api/v1/clinic-information`, {
    headers: { Authorization: `Bearer ${stored('token')}` },
  }).then(parse);

export const updateClinicInformation = payload =>
  fetch(`${apiBase}/api/v1/clinic-information`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${stored('token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).then(parse);

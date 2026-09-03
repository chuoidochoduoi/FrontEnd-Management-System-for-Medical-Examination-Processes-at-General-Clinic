const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${get('token')}`,
});

const parseResponse = async response => {
  if (response.ok) return response.status === 204 ? null : response.json();
  const data = await response.json().catch(() => null);
  throw new Error(data?.message || data?.error || 'Không thể thực hiện thao tác.');
};

export const getVisibleAnnouncements = async () =>
  parseResponse(await fetch(`${apiUrl}/api/public/announcements`));

export const getAllAnnouncements = async () =>
  parseResponse(await fetch(`${apiUrl}/api/v1/public-announcements`, { headers: authHeaders() }));

export const createAnnouncement = async payload =>
  parseResponse(await fetch(`${apiUrl}/api/v1/public-announcements`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
  }));

export const updateAnnouncement = async (id, payload) =>
  parseResponse(await fetch(`${apiUrl}/api/v1/public-announcements/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload),
  }));

export const setAnnouncementPublication = async (id, published) =>
  parseResponse(await fetch(`${apiUrl}/api/v1/public-announcements/${id}/publication?published=${published}`, {
    method: 'PATCH', headers: authHeaders(),
  }));

export const deleteAnnouncement = async id =>
  parseResponse(await fetch(`${apiUrl}/api/v1/public-announcements/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  }));

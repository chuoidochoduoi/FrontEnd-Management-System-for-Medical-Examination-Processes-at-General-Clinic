export async function readPatientJourney(path, signal) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const apiBase = import.meta.env?.VITE_API_URL || 'http://localhost:8080';
  const response = await fetch(`${apiBase}/api/v1/patient-journeys${path}`, {
    signal, headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    if (response.status === 403) throw new Error('Bạn không có quyền xem hành trình này.');
    throw new Error(body?.message || 'Không thể tải hành trình bệnh nhân. Vui lòng thử lại.');
  }
  if (!body) throw new Error('Dữ liệu hành trình không hợp lệ. Vui lòng thử lại.');
  return body.data ?? body;
}

// Independent loaders for list and details; obsolete responses never update the UI,
// including when a transport finishes after its AbortSignal has been cancelled.
export function createJourneyLoader(read = readPatientJourney) {
  let current;
  return {
    cancel() { current?.abort(); },
    async load(path, { success, error, settled }) {
      current?.abort();
      const request = new AbortController();
      current = request;
      try {
        const result = await read(path, request.signal);
        if (!request.signal.aborted) success(result);
      } catch (failure) {
        if (!request.signal.aborted) error(failure);
      } finally {
        if (!request.signal.aborted) settled();
      }
    },
  };
}

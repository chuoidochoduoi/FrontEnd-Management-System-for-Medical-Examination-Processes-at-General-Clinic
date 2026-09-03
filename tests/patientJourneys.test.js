import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatCheckInDuration, formatTodayCheckInDuration, formatClinicDateTime, journeyFilters, journeyStatus, journeyWarnings, isJourneyCompleted, sortJourneyPage } from '../src/utils/patientJourneyPresentation.js';
import { createJourneyLoader, readPatientJourney } from '../src/services/patientJourneyService.js';

test('all known journey statuses have the approved label and semantic color', () => {
  const expected = {
    PAYMENT_PENDING: ['Chờ thanh toán', 'orange'], WAITING: ['Đang chờ', 'amber'], PENDING: ['Đang chờ', 'amber'],
    CALLED: ['Đã gọi', 'blue'], IN_PROGRESS: ['Đang thực hiện', 'deepBlue'],
    WAITING_FOR_TEST: ['Chờ cận lâm sàng', 'lightPurple'], RESULT_PENDING: ['Chờ kết quả', 'purple'],
    TEST_DONE: ['Cần quay lại bác sĩ', 'deepPurple'], DONE: ['Đã hoàn thành', 'teal'], COMPLETED: ['Đã hoàn thành', 'teal'],
    BLOCKED: ['Chưa đến lượt', 'gray'], SKIPPED: ['Vắng mặt / bỏ lượt', 'deepOrange'],
    CANCELLED: ['Đã hủy', 'red'], UNASSIGNED: ['Chưa phân luồng', 'red'],
  };
  for (const [status, [label, tone]] of Object.entries(expected)) assert.deepEqual(journeyStatus(status), { label, tone });
});

test('unknown statuses remain neutral and never look completed', () => {
  for (const status of ['UNKNOWN', 'constructor', '__proto__']) {
    assert.deepEqual(journeyStatus(status), { label: status, tone: 'gray' });
    assert.equal(isJourneyCompleted(status), false);
  }
  assert.deepEqual(journeyStatus(null), { label: '—', tone: 'gray' });
  assert.equal(isJourneyCompleted('CANCELLED'), false);
  assert.equal(isJourneyCompleted('SKIPPED'), false);
  assert.equal(isJourneyCompleted('DONE'), true);
  assert.equal(isJourneyCompleted('COMPLETED'), true);
});

test('filters include payment, result waiting, and absence but not blocked steps', () => {
  for (const status of ['PAYMENT_PENDING', 'RESULT_PENDING', 'SKIPPED']) assert.ok(journeyFilters.includes(status));
  assert.ok(!journeyFilters.includes('BLOCKED'));
  assert.equal(new Set(journeyFilters).size, journeyFilters.length);
});

test('warnings distinguish check-in duration from an unassigned journey', () => {
  assert.deepEqual(journeyWarnings({ currentStatus: 'WAITING', waitingMinutes: 59 }), []);
  assert.deepEqual(journeyWarnings({ currentStatus: 'WAITING', waitingMinutes: 60 }), ['Đã qua 60 phút từ lúc check-in.']);
  assert.deepEqual(journeyWarnings({ currentStatus: 'UNASSIGNED', waitingMinutes: 10 }), ['Lượt khám chưa được phân luồng.']);
  assert.equal(journeyWarnings({ currentStatus: 'UNASSIGNED', waitingMinutes: 60 }).length, 2);
  assert.deepEqual(journeyWarnings({ currentStatus: 'COMPLETED', waitingMinutes: 90, warning: true }), []);
  assert.deepEqual(journeyWarnings({ currentStatus: 'IN_PROGRESS', waitingMinutes: 10734 }, { overdue: true }),
    ['Lượt đang xử lý chưa được kết thúc.']);
});

test('check-in duration is readable instead of exposing a large raw minute count', () => {
  assert.equal(formatCheckInDuration(0), '0 phút');
  assert.equal(formatCheckInDuration(59), '59 phút');
  assert.equal(formatCheckInDuration(60), '1 giờ');
  assert.equal(formatCheckInDuration(125), '2 giờ 5 phút');
  assert.equal(formatCheckInDuration(2165), '1 ngày 12 giờ');
  assert.equal(formatCheckInDuration(10734), '7 ngày 10 giờ');
  assert.equal(formatCheckInDuration(-10), '0 phút');
  assert.equal(formatTodayCheckInDuration(125), '2 giờ 5 phút');
  assert.equal(formatTodayCheckInDuration(2165), '24 giờ+');
  assert.equal(formatClinicDateTime('2026-09-01T08:05:00'), '01/09/2026 08:05');
  assert.equal(formatClinicDateTime(undefined), '—');
});

test('local sorting never mutates or filters the paginated server result', () => {
  const rows = [
    { patientName: 'Bình', checkInTime: '2026-09-01T10:00:00', waitingMinutes: 5 },
    { patientName: 'An', checkInTime: '2026-09-01T09:00:00', waitingMinutes: 65 },
  ];
  assert.equal(sortJourneyPage(rows, 'name')[0].patientName, 'An');
  assert.equal(sortJourneyPage(rows, 'waiting')[0].patientName, 'An');
  assert.equal(sortJourneyPage(rows, 'newest')[0].patientName, 'Bình');
  assert.equal(rows[0].patientName, 'Bình');
  assert.equal(sortJourneyPage(rows, 'waiting').length, rows.length);
});

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const recorder = () => {
  const events = [];
  return { events, callbacks: {
    success: value => events.push(['success', value]),
    error: value => events.push(['error', value.message]),
    settled: () => events.push(['settled']),
  } };
};

test('new list query aborts old request and ignores its late response', async () => {
  const requests = [];
  const loader = createJourneyLoader((path, signal) => {
    const request = { ...deferred(), path, signal }; requests.push(request); return request.promise;
  });
  const view = recorder();
  const old = loader.load('?search=a', view.callbacks);
  const current = loader.load('?search=an', view.callbacks);
  assert.equal(requests[0].signal.aborted, true);
  requests[1].resolve('new results'); await current;
  requests[0].resolve('obsolete results'); await old;
  assert.deepEqual(view.events, [['success', 'new results'], ['settled']]);
});

test('closing details ignores both success and errors from cancelled requests', async () => {
  for (const fail of [false, true]) {
    const request = deferred();
    const view = recorder();
    const loader = createJourneyLoader(() => request.promise);
    const pending = loader.load('/visit-a', view.callbacks);
    loader.cancel();
    if (fail) request.reject(new Error('Old failure')); else request.resolve('Old patient');
    await pending;
    assert.deepEqual(view.events, []);
  }
});

test('refreshing list does not cancel the independent detail request', async () => {
  const detailRequest = deferred(); let detailSignal;
  const detailLoader = createJourneyLoader((path, signal) => { detailSignal = signal; return detailRequest.promise; });
  const listLoader = createJourneyLoader(async () => 'list');
  const detail = recorder(); const list = recorder();
  const pending = detailLoader.load('/visit-a', detail.callbacks);
  await listLoader.load('?page=0', list.callbacks);
  assert.equal(detailSignal.aborted, false);
  detailRequest.resolve('detail'); await pending;
  assert.deepEqual(detail.events, [['success', 'detail'], ['settled']]);
});

test('detail error can be retried without reusing an old patient snapshot', async () => {
  let attempts = 0;
  const loader = createJourneyLoader(async () => {
    if (++attempts === 1) throw new Error('Không thể tải');
    return { visitId: 'visit-a', currentStatus: 'TEST_DONE' };
  });
  const view = recorder();
  await loader.load('/visit-a', view.callbacks);
  await loader.load('/visit-a', view.callbacks);
  assert.deepEqual(view.events, [['error', 'Không thể tải'], ['settled'], ['success', { visitId: 'visit-a', currentStatus: 'TEST_DONE' }], ['settled']]);
});

test('journey reader is GET-only, forwards cancellation, and unwraps responses', async () => {
  const original = { fetch: globalThis.fetch, localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage };
  try {
    globalThis.localStorage = { getItem: () => 'test-token' };
    globalThis.sessionStorage = { getItem: () => null };
    const signal = new AbortController().signal;
    globalThis.fetch = async (url, options) => {
      assert.ok(url.endsWith('/api/v1/patient-journeys/visit-a'));
      assert.equal(options.signal, signal);
      assert.equal(options.method ?? 'GET', 'GET');
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      return { ok: true, json: async () => ({ data: { visitId: 'visit-a' } }) };
    };
    assert.deepEqual(await readPatientJourney('/visit-a', signal), { visitId: 'visit-a' });
    globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({}) });
    await assert.rejects(readPatientJourney('/visit-a', signal), /không có quyền/);
    globalThis.fetch = async () => ({ ok: true, json: async () => { throw new Error('invalid JSON'); } });
    await assert.rejects(readPatientJourney('/visit-a', signal), /không hợp lệ/);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
});

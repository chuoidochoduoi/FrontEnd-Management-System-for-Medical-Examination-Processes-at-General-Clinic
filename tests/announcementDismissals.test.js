import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import {
  announcementSignature, DISMISSED_ANNOUNCEMENTS_KEY,
  parseDismissedAnnouncements, persistAnnouncementDismissal, readDismissedAnnouncements,
} from '../src/utils/announcementDismissals.js';

const first = { announcementId: 'a', title: 'Lịch khám', content: 'Khám cả tuần' };
const second = { announcementId: 'b', title: 'Chuẩn bị', content: 'Hướng dẫn lấy mẫu' };
let storage;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

beforeEach(() => {
  storage = new Map();
  globalThis.window = { localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } };
});
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else delete globalThis.window;
});

test('dismissal survives a fresh read and hides only the matching announcement', () => {
  assert.equal(persistAnnouncementDismissal(first).saved, true);
  const restored = readDismissedAnnouncements();
  assert.equal(restored.a, announcementSignature(first));
  assert.equal(restored.b, undefined);
  assert.deepEqual([first, second].filter(item => restored[item.announcementId] !== announcementSignature(item)), [second]);
});

test('changes to title or content are visible; another ID with identical copy is visible', () => {
  persistAnnouncementDismissal(first);
  const restored = readDismissedAnnouncements();
  assert.notEqual(restored.a, announcementSignature({ ...first, title: 'Lịch mới' }));
  assert.notEqual(restored.a, announcementSignature({ ...first, content: 'Nội dung mới' }));
  assert.notEqual(restored.c, announcementSignature(first));
});

test('publication changes do not alter the content signature', () => {
  assert.equal(announcementSignature(first), announcementSignature({
    ...first, published: false, startsAt: '2026-09-02', endsAt: '2026-10-01', updatedAt: '2026-09-01',
  }));
});

test('dismissing the revised copy remembers that version', () => {
  persistAnnouncementDismissal(first);
  const revised = { ...first, content: 'Đã đổi nội dung' };
  persistAnnouncementDismissal(revised);
  assert.equal(readDismissedAnnouncements().a, announcementSignature(revised));
});

test('each write merges the latest storage rather than an earlier tab snapshot', () => {
  const earlierTabSnapshot = readDismissedAnnouncements();
  persistAnnouncementDismissal(first);
  persistAnnouncementDismissal(second);
  assert.deepEqual(earlierTabSnapshot, {});
  assert.deepEqual(readDismissedAnnouncements(), {
    a: announcementSignature(first), b: announcementSignature(second),
  });
});

test('corrupt JSON and unexpected shapes are ignored safely', () => {
  for (const value of [undefined, null, 'undefined', '{', 'null', '[]', '42', '"string"']) {
    assert.deepEqual(parseDismissedAnnouncements(value), {});
    storage.set(DISMISSED_ANNOUNCEMENTS_KEY, value);
    assert.deepEqual(readDismissedAnnouncements(), {});
  }
  assert.deepEqual(parseDismissedAnnouncements('{"a":123,"b":"valid","": "invalid"}'), { b: 'valid' });
  assert.equal(persistAnnouncementDismissal(first).saved, true);
});

test('blocked localStorage still returns the dismissal for the current page', () => {
  Object.defineProperty(window, 'localStorage', { get() { throw new Error('Blocked'); } });
  assert.deepEqual(readDismissedAnnouncements(), {});
  const result = persistAnnouncementDismissal(first);
  assert.equal(result.saved, false);
  assert.equal(result.dismissed.a, announcementSignature(first));
});

test('quota failure preserves existing dismissals and the clicked item in memory', () => {
  persistAnnouncementDismissal(first);
  window.localStorage.setItem = () => { throw new Error('Quota exceeded'); };
  const result = persistAnnouncementDismissal(second);
  assert.equal(result.saved, false);
  assert.equal(result.dismissed.a, announcementSignature(first));
  assert.equal(result.dismissed.b, announcementSignature(second));
});

test('cleared storage makes announcements eligible to display again', () => {
  persistAnnouncementDismissal(first);
  storage.clear();
  assert.deepEqual(readDismissedAnnouncements(), {});
});

test('signature is unambiguous even when the copy contains delimiters', () => {
  assert.notEqual(announcementSignature({ title: 'a|b', content: 'c' }), announcementSignature({ title: 'a', content: 'b|c' }));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { availableReportTypes, buildReport, filterReportRows, paginate, reportCsv, reportPrintHtml, REPORT_TYPES } from '../src/features/reports/reportExport.js';

const services = Array.from({ length: 31 }, (_, i) => ({ code: `LAB-${i}`, name: `Đường huyết ${i}`, category: 'PARACLINICAL', quantity: 2, gross: 100000, insurance: 20000, patientAmount: 80000 - i }));
const rooms = Array.from({ length: 21 }, (_, i) => ({ code: `P-${i}`, name: `Phòng Nội ${i}`, completedExaminations: 2, completedTests: 3, waiting: 0, inProgress: 1, skipped: 0, rating: null, ratingCount: 0 }));
const data = { fromDate: '2026-09-01', toDate: '2026-09-04', services, rooms,
    activity: { arrivals: 5, closedVisits: 4, partialVisits: 1, cancelledVisits: 1, completedExaminations: 8, completedTests: 20 },
    finance: { collected: 150000, successfulPayments: 3, invoiceGross: 200000, insurance: 20000, caresBenefit: 15000, otherDiscount: -5000, tax: 0, invoicePayable: 170000, invoicePaid: 150000, outstanding: 20000 },
    paymentChart: [{ label: '2026-09-01', amount: 0 }, { label: '2026-09-02', amount: 150000 }], paymentMethods: [{ label: 'MEMBERSHIP_CARD', amount: 150000 }] };
const options = { exportedAt: '2026-09-04 09:00:00' };

test('hide unavailable report types, keep meaningful zero overview and zero-price invoices', () => {
    assert.equal(availableReportTypes(data).length, 6);
    const empty = { ...data, finance: {}, services: [], rooms: [], paymentMethods: [] };
    assert.deepEqual(availableReportTypes(empty).map(([key]) => key), ['overview']);
    assert.ok(availableReportTypes({ ...empty, services: [services[0]] }).some(([key]) => key === 'reconciliation'));
    assert.deepEqual(availableReportTypes({}), []);
    // Availability is based on the period, not a temporary search with no matches.
    assert.ok(availableReportTypes(data).some(([key]) => key === 'services'));
});

test('fixed ten rows for 0, 1, 10, 11 and many rows; page clamped after filtering', () => {
    for (const length of [0, 1, 10, 11, 31]) {
        const rows = services.slice(0, length);
        assert.equal(paginate(rows, 1).rows.length, Math.min(10, length));
        assert.equal(paginate(rows, 100).page, Math.max(1, Math.ceil(length / 10)));
    }
    assert.deepEqual(paginate([], 2), { page: 1, pages: 1, rows: [], from: 0, to: 0, total: 0 });
    assert.equal(paginate(services, 2).from, 11);
    assert.equal(paginate(services, 2).to, 20);
    assert.equal(paginate(services.slice(0, 1), 2).page, 1);
});
test('search supports code, accents, case, whitespace and independent room search', () => {
    assert.equal(filterReportRows(services, '  DUONG HUYET  ').length, 31);
    assert.equal(filterReportRows(services, 'lab-30')[0].code, 'LAB-30');
    assert.equal(filterReportRows(rooms, 'phong noi').length, 21);
    assert.equal(filterReportRows(rooms, 'unknown').length, 0);
});
test('exports all matches independently of current screen page; all bypasses only search', () => {
    assert.equal(paginate(services, 2).rows.length, 10);
    assert.equal(buildReport(data, 'services', options).rows.length, 31);
    assert.equal(buildReport(data, 'services', { ...options, serviceSearch: 'LAB-30' }).rows.length, 1);
    assert.equal(buildReport(data, 'services', { ...options, serviceSearch: 'LAB-30', all: true }).rows.length, 31);
    assert.equal(buildReport(data, 'rooms', { ...options, roomSearch: 'P-20' }).rows.length, 1);
    assert.equal(buildReport(data, 'services', { ...options, serviceSearch: 'missing' }).rows.length, 0);
    assert.equal(buildReport(data, 'overview', { ...options, serviceSearch: 'missing' }).rows[0][1], 5);
    assert.equal(data.services[0].code, 'LAB-0');
});
test('six reports have a uniform table schema and raw numeric amounts', () => {
    assert.equal(REPORT_TYPES.length, 6);
    for (const [type] of REPORT_TYPES) {
        const report = buildReport(data, type, options);
        assert.ok(report.rows.length);
        assert.ok(report.rows.every(row => row.length === report.headers.length));
        const csv = reportCsv(report);
        assert.ok(csv.startsWith('\uFEFF"Từ ngày"'));
        assert.equal(csv.split('\r\n').length, report.rows.length + 1);
        assert.ok(csv.includes('Asia/Ho_Chi_Minh'));
    }
    assert.ok(reportCsv(buildReport(data, 'services', options)).includes('"100000"'));
    assert.ok(reportCsv(buildReport(data, 'reconciliation', options)).includes('"-5000"'));
    const room = buildReport(data, 'rooms', options).rows[0];
    assert.equal(room[7], null);
    assert.equal(room[8], 0);
});
test('CSV escapes text and formulas but preserves negative numeric amounts', () => {
    const report = buildReport(data, 'services', options);
    report.rows = [['=1+1', 'Tên, "đặc biệt"\nxuống dòng', '@formula', 1, -5000, 0, 0]];
    const csv = reportCsv(report);
    assert.ok(csv.includes('"\'=1+1"'));
    assert.ok(csv.includes('"\'@formula"'));
    assert.ok(csv.includes('"Tên, ""đặc biệt""\nxuống dòng"'));
    assert.ok(csv.includes('"-5000"'));
});
test('print document contains full dataset, isolated A4 layout and escaped content', () => {
    for (const [type] of REPORT_TYPES) {
        const report = buildReport(data, type, options);
        const html = reportPrintHtml(report);
        assert.ok(html.includes(`A4 ${['services', 'rooms'].includes(type) ? 'landscape' : 'portrait'}`));
        assert.ok(html.includes('table-header-group'));
        assert.ok(!html.includes('<button'));
        assert.ok(html.includes('2026-09-04 09:00:00'));
    }
    const report = buildReport(data, 'services', options);
    report.rows[0][1] = '<script>alert(1)</script>';
    const html = reportPrintHtml(report);
    assert.ok(html.includes('LAB-30'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(!html.includes('<script>'));
    assert.equal((html.match(/<tbody>/g) ?? []).length, 1);
});

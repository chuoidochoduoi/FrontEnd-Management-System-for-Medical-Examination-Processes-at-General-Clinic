export const REPORT_TYPES = [
    ['overview', 'Tổng quan'], ['timeline', 'Thanh toán theo thời gian'],
    ['methods', 'Phương thức thanh toán'], ['reconciliation', 'Đối soát hóa đơn'],
    ['services', 'Chi tiết dịch vụ'], ['rooms', 'Hoạt động phòng'],
];
export const PAYMENT_METHODS = { CASH: 'Tiền mặt', CARD: 'Thẻ ngân hàng', BANK_TRANSFER: 'Chuyển khoản', MEMBERSHIP_CARD: 'Thẻ trả trước CareS', MOMO: 'MoMo', VNPAY: 'VNPay', ZALOPAY: 'ZaloPay', OTHER: 'Khác' };
export function availableReportTypes(data) {
    const hasInvoices = !!data.services?.length || ['invoiceGross', 'insurance', 'caresBenefit', 'otherDiscount', 'tax', 'invoicePayable', 'invoicePaid', 'outstanding']
        .some(key => Number(data.finance?.[key] ?? 0) !== 0);
    const available = {
        overview: !!data.activity && !!data.finance,
        timeline: !!data.paymentChart?.length && Number(data.finance?.successfulPayments ?? 0) > 0,
        methods: !!data.paymentMethods?.length,
        reconciliation: hasInvoices,
        services: !!data.services?.length,
        rooms: !!data.rooms?.length,
    };
    return REPORT_TYPES.filter(([type]) => available[type]);
}
const categories = { EXAMINATION: 'Khám bệnh', PARACLINICAL: 'Cận lâm sàng', LABORATORY: 'Xét nghiệm', IMAGING: 'Chẩn đoán hình ảnh', OTHER: 'Khác' };
export const normalizeSearch = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();
export function filterReportRows(rows, search) {
    const query = normalizeSearch(search);
    return rows.filter(row => normalizeSearch(`${row.code ?? ''} ${row.name ?? ''}`).includes(query));
}
export function paginate(rows, requestedPage) {
    const pages = Math.max(1, Math.ceil(rows.length / 10));
    const page = Math.max(1, Math.min(requestedPage, pages));
    const start = (page - 1) * 10;
    return { page, pages, rows: rows.slice(start, start + 10), from: rows.length ? start + 1 : 0, to: Math.min(start + 10, rows.length), total: rows.length };
}
export function reconciliationRows(f) {
    return [
        ['Tổng giá trị hóa đơn', Number(f.invoiceGross)], ['BHYT ghi nhận', Number(f.insurance)],
        ['Ưu đãi thẻ CareS', Number(f.caresBenefit)], ['Giảm trừ khác (âm là phụ thu)', Number(f.otherDiscount)],
        ['Thuế', Number(f.tax)], ['Người bệnh phải trả', Number(f.invoicePayable)],
        ['Đã thanh toán cho các hóa đơn này', Number(f.invoicePaid)], ['Còn phải thu hiện tại', Number(f.outstanding)],
    ];
}
// Build the complete filtered dataset once, independent of on-screen pagination.
export function buildReport(data, type, { serviceSearch = '', roomSearch = '', all = false, exportedAt } = {}) {
    const report = { type, title: REPORT_TYPES.find(([key]) => key === type)?.[1], from: data.fromDate, to: data.toDate,
        exportedAt: exportedAt ?? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'medium' }).format(new Date()),
        filter: 'Tất cả', landscape: ['services', 'rooms'].includes(type), moneyColumns: [], headers: [], rows: [] };
    const a = data.activity, f = data.finance;
    switch (type) {
        case 'overview':
            report.headers = ['Chỉ tiêu', 'Giá trị', 'Đơn vị'];
            report.rows = [['Lượt đến khám', a.arrivals, 'VIS'], ['Lượt đã kết thúc', a.closedVisits, 'VIS'],
                ['Trong đó bỏ lượt một phần', a.partialVisits, 'VIS'], ['Lượt đã hủy', a.cancelledVisits, 'VIS'],
                ['Bệnh án hoàn thành', a.completedExaminations, 'Bệnh án'], ['CLS hoàn thành và có bản ký', a.completedTests, 'Yêu cầu'],
                ['Thanh toán dịch vụ', Number(f.collected), 'VND'], ['Giao dịch thành công', f.successfulPayments, 'Giao dịch']];
            report.note = 'VIS theo ngày check-in/checkout; bệnh án và CLS theo ngày hoàn tất. Chỉ số lẻ là yêu cầu riêng, không phải lượt gọi. Thanh toán theo paidAt, trạng thái SUCCESS hiện tại; không phải tiền mặt ròng.';
            break;
        case 'timeline':
            report.headers = ['Ngày / tháng thanh toán', 'Số tiền (VND)']; report.moneyColumns = [1];
            report.rows = data.paymentChart.map(p => [p.label, Number(p.amount)]);
            report.note = 'Theo ngày thanh toán, kể cả hóa đơn lập ngoài kỳ. Chỉ tính giao dịch hiện còn SUCCESS; không tính tiền nạp thẻ, BHYT hoặc giao dịch hủy/thất bại. Không phải báo cáo tiền mặt ròng.';
            break;
        case 'methods':
            report.headers = ['Phương thức thanh toán', 'Số tiền (VND)']; report.moneyColumns = [1];
            report.rows = data.paymentMethods.map(p => [PAYMENT_METHODS[p.label] ?? p.label, Number(p.amount)]);
            report.note = 'Theo ngày thanh toán và trạng thái SUCCESS hiện tại. Bao gồm thanh toán dịch vụ bằng CareS, không cộng tiền nạp thẻ lần nữa; không phải báo cáo dòng tiền ròng.';
            break;
        case 'reconciliation':
            report.headers = ['Chỉ tiêu', 'Số tiền (VND)']; report.moneyColumns = [1];
            report.rows = reconciliationRows(f);
            report.note = 'Hóa đơn lập trong kỳ, loại hóa đơn hủy. Đã trả/còn phải thu là trạng thái tại thời điểm tải, không phải số dư cuối kỳ. BHYT ghi nhận không phải tiền đã quyết toán. Phải trả = Tổng hóa đơn − BHYT − CareS − Giảm trừ khác + Thuế.';
            break;
        case 'services': {
            report.filter = !all && serviceSearch.trim() ? serviceSearch.trim() : 'Tất cả';
            report.headers = ['Mã dịch vụ', 'Tên dịch vụ', 'Nhóm', 'Số lượng', 'Giá trị niêm yết (VND)', 'BHYT (VND)', 'Sau giảm trừ tại dòng (VND)'];
            report.moneyColumns = [4, 5, 6];
            const services = filterReportRows(data.services, all ? '' : serviceSearch).sort((x, y) => Number(y.patientAmount) - Number(x.patientAmount));
            report.rows = services.map(s => [s.code, s.name, categories[s.category] ?? s.category, s.quantity, Number(s.gross), Number(s.insurance), Number(s.patientAmount)]);
            report.note = 'Hóa đơn lập trong kỳ, loại hóa đơn hủy. Giá chụp trên hóa đơn; chưa phân bổ ưu đãi CareS/điều chỉnh cấp hóa đơn. Không phải thực thu theo dịch vụ. Bộ lọc chỉ áp dụng bảng chi tiết, không thay đổi tổng kết toàn kỳ.';
            break;
        }
        case 'rooms':
            report.filter = !all && roomSearch.trim() ? roomSearch.trim() : 'Tất cả';
            report.headers = ['Mã phòng', 'Tên phòng', 'Bệnh án hoàn thành', 'CLS hoàn thành', 'Chờ / đã gọi', 'Đang xử lý', 'Bỏ lượt', 'Điểm / 5', 'Số đánh giá'];
            report.rows = filterReportRows(data.rooms, all ? '' : roomSearch).map(r => [r.code, r.name, r.completedExaminations, r.completedTests, r.waiting, r.inProgress, r.skipped, r.ratingCount ? r.rating : null, r.ratingCount]);
            report.note = 'Hoàn thành theo ngày hoàn tất. Hàng chờ là trạng thái hiện tại của phiếu có ngày làm việc trong kỳ; đang xử lý gồm chờ CLS. Đánh giá theo ngày đánh giá của bệnh án tại phòng khám nguồn, không phải điểm riêng nhân viên. Không có phản hồi không đồng nghĩa 0 sao.';
            break;
        default: throw new Error('Loại báo cáo không hợp lệ');
    }
    return report;
}
function csvCell(value) {
    let text = String(value ?? '');
    if (typeof value === 'string' && (/^\s*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
}
export function reportCsv(report) {
    const metadata = [report.from, report.to, report.exportedAt, 'Asia/Ho_Chi_Minh', report.filter, report.note];
    return '\uFEFF' + [
        ['Từ ngày', 'Đến ngày', 'Thời điểm xuất', 'Múi giờ', 'Bộ lọc', 'Phạm vi số liệu', ...report.headers],
        ...report.rows.map(row => [...metadata, ...row]),
    ].map(row => row.map(csvCell).join(',')).join('\r\n');
}
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export function reportPrintHtml(report) {
    const format = value => typeof value === 'number' ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value) : value ?? '—';
    const body = report.type === 'overview'
        ? `<div class="metrics">${report.rows.map(([label, value, unit]) => `<section><div>${escapeHtml(label)}</div><strong>${escapeHtml(format(value))}</strong> ${escapeHtml(unit)}</section>`).join('')}</div>`
        : `<table><thead><tr>${report.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${report.rows.map(row => `<tr>${row.map(value => `<td>${escapeHtml(format(value))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(report.title)} — CareS</title><style>
        @page { size: A4 ${report.landscape ? 'landscape' : 'portrait'}; margin: 12mm; }
        * { box-sizing: border-box; } body { margin: 0; padding: 24px; font: 14px Arial,sans-serif; color: #111; background: white; }
        h1 { font-size: 23px; margin: 18px 0; } p { margin: 7px 0; } header { border-bottom: 1px solid #aaa; padding-bottom: 15px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: auto; } th,td { border: 1px solid #bbb; padding: 9px 7px; text-align: left; overflow-wrap: anywhere; }
        th { background: #f3f4f6; } thead { display: table-header-group; } tr { break-inside: avoid; } .note { margin-top: 20px; line-height: 1.5; font-size: 12px; }
        .metrics { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; } section { border: 1px solid #ccc; padding: 18px; break-inside: avoid; } strong { display: inline-block; margin-top: 12px; font-size: 24px; }
        @media screen and (max-width: 600px) { .metrics { grid-template-columns: 1fr; } body { padding: 12px; } }
        @media print { body { padding: 0; } table { font-size: 10pt; } }
        </style></head><body><header><b>CareS — PHÒNG KHÁM ĐA KHOA</b><h1>${escapeHtml(report.title)}</h1>
        <p>Kỳ báo cáo: ${escapeHtml(report.from)} – ${escapeHtml(report.to)}</p><p>Xuất lúc: ${escapeHtml(report.exportedAt)} · Giờ Việt Nam</p>
        <p>Bộ lọc: ${escapeHtml(report.filter)} · Số dòng: ${report.rows.length}</p></header>${body}<p class="note">${escapeHtml(report.note)}</p></body></html>`;
}

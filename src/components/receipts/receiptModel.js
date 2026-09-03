const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const number = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
export const receiptMoney = value => number(value) == null ? '—' : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(value));
export const receiptText = value => value == null || String(value).trim() === '' ? '—' : String(value);

export function receiptDate(value, withTime = false) {
    if (!value) return '—';
    // Backend dates without an offset are clinic-local, not UTC/browser-local.
    const local = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?$/);
    if (local) return `${local[3]}/${local[2]}/${local[1]}${withTime && local[4] ? ` - ${local[4]}:${local[5]}` : ''}`;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
    });
}

export function amountInWords(value) {
    const amount = number(value);
    if (amount == null || amount < 0) return '—';
    // Do not silently round an exact monetary amount printed on a receipt.
    if (!Number.isSafeInteger(Math.trunc(amount))) return `${receiptMoney(amount)} đồng`;
    if (!Number.isInteger(amount)) {
        const [whole, fraction] = amount.toFixed(2).split('.');
        return `${amountInWords(Number(whole)).replace(/ đồng$/, '')} phẩy ${fraction.split('').map(digit => digits[Number(digit)]).join(' ')} đồng`;
    }
    if (amount === 0) return 'Không đồng';
    const readGroup = (n, full) => {
        const h = Math.floor(n / 100), t = Math.floor(n % 100 / 10), u = n % 10;
        const words = h || full ? [digits[h], 'trăm'] : [];
        if (t > 1) {
            words.push(digits[t], 'mươi');
            if (u) words.push(u === 1 ? 'mốt' : u === 5 ? 'lăm' : digits[u]);
        } else if (t === 1) {
            words.push('mười');
            if (u) words.push(u === 5 ? 'lăm' : digits[u]);
        } else if (u) {
            if (h || full) words.push('lẻ');
            words.push(digits[u]);
        }
        return words.join(' ');
    };
    const groups = [];
    let remaining = amount;
    while (remaining > 0) { groups.push(remaining % 1000); remaining = Math.floor(remaining / 1000); }
    const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
    const words = groups.map((part, i) => part ? `${readGroup(part, i < groups.length - 1)} ${units[i] || ''}` : '').reverse().join(' ').replace(/\s+/g, ' ').trim();
    return `${words[0].toUpperCase()}${words.slice(1)} đồng`;
}

export function paymentMethodLabel(value) {
    const labels = { CASH: 'Tiền mặt', CARD: 'Thẻ ngân hàng', BANK_TRANSFER: 'Chuyển khoản', MEMBERSHIP_CARD: 'Thẻ trả trước CareS', MOMO: 'Ví MoMo', VNPAY: 'VNPay', ZALOPAY: 'ZaloPay', INSURANCE: 'Bảo hiểm', OTHER: 'Khác',
        'Tien mat': 'Tiền mặt', 'The ngan hang': 'Thẻ ngân hàng', 'Chuyen khoan': 'Chuyển khoản', 'The tra truoc CareS': 'Thẻ trả trước CareS', 'Vi MoMo': 'Ví MoMo', 'Bao hiem': 'Bảo hiểm', Khac: 'Khác' };
    return labels[value] || receiptText(value);
}

/** Presentation only: read persisted amounts; never reconstruct BHYT from rounded rates. */
export function serviceReceipt(data) {
    const total = number(data.subtotal), insurance = number(data.bhytAmount), tax = number(data.tax);
    const due = number(data.totalAmount), paid = number(data.paidAmount), balance = number(data.balance);
    const membershipBenefit = number(data.membershipBenefitAmount) || 0;
    const patientBeforeMembership = number(data.patientPayableBeforeMembership) ?? (due == null ? null : due + membershipBenefit);
    return {
        kind: 'services', title: 'PHIẾU THU DỊCH VỤ Y TẾ', code: data.receiptNumber || data.invoiceCode,
        invoiceCode: data.invoiceCode, date: data.paidAt || data.issuedAt, dateLabel: data.paidAt ? 'Ngày thu' : 'Ngày lập',
        name: data.patientName, patientCode: data.patientCode, dob: data.dateOfBirth,
        gender: ({ Nu: 'Nữ', Khac: 'Khác' })[data.gender] || data.gender, address: data.patientAddress,
        insuranceCode: data.bhytCode, cashier: data.cashierName, method: paymentMethodLabel(data.paymentMethod), note: data.note,
        transactionCode: data.paymentTransactionCode, membershipCard: data.membershipCardCodeMasked,
        membershipBenefitPercent: number(data.membershipBenefitPercent), membershipBenefit,
        patientBeforeMembership, total, insurance, tax, due, paid, balance,
        adjustment: [total, insurance, tax, patientBeforeMembership].every(v => v != null)
            ? Math.round((total - insurance + tax - patientBeforeMembership) * 100) / 100 : null,
        items: (data.items || []).map((item, i) => ({
            id: item.itemId || i, name: item.serviceSnapshot || item.serviceName || 'Dịch vụ',
            qty: number(item.quantity), unitPrice: number(item.unitPrice), total: number(item.lineTotal),
            insurance: number(item.bhytAmount), due: number(item.patientAmount),
            adjustment: [item.lineTotal, item.bhytAmount, item.patientAmount].every(v => number(v) != null)
                ? Math.round((Number(item.lineTotal) - Number(item.bhytAmount) - Number(item.patientAmount)) * 100) / 100 : null,
        })),
    };
}

export function topUpReceipt(data) {
    return { kind: 'top-up', title: 'PHIẾU THU NẠP TIỀN THẺ CARES', code: data.referenceCode,
        name: data.ownerName, cardCode: data.cardCode, date: data.createdAt, dateLabel: 'Ngày thu',
        method: paymentMethodLabel(data.paymentMethod), cashier: data.cashierName,
        total: number(data.amount), due: number(data.amount), paid: number(data.amount), balance: 0,
        cardBalance: number(data.balance),
        note: 'Khoản nạp thẻ không phải doanh thu dịch vụ y tế và không được rút/chuyển thành tiền mặt.',
    };
}

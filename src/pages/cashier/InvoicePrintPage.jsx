import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Printer, RotateCcw } from 'lucide-react';
import CashierLayout from '@/components/layout/CashierLayout';
import { useInvoicePrint } from '@/hooks/useInvoicePrint';

const money = (value) => new Intl.NumberFormat('vi-VN').format(Math.round(value || 0));
const valueOrDash = (value) => value || '—';
const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
};

const amountInWords = (amount) => {
    const number = Math.max(0, Math.round(Number(amount) || 0));
    if (!number) return 'Không đồng';
    const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const readGroup = (group, forceHundred) => {
        const hundred = Math.floor(group / 100);
        const tens = Math.floor((group % 100) / 10);
        const units = group % 10;
        const result = [];
        if (hundred || forceHundred) result.push(`${digits[hundred]} trăm`);
        if (tens > 1) result.push(`${digits[tens]} mươi`);
        else if (tens === 1) result.push('mười');
        else if ((hundred || forceHundred) && units) result.push('lẻ');
        if (units) result.push(tens > 1 && units === 1 ? 'mốt' : tens > 0 && units === 5 ? 'lăm' : digits[units]);
        return result.join(' ');
    };
    const units = ['', 'nghìn', 'triệu', 'tỷ'];
    const groups = [];
    let current = number;
    while (current) { groups.push(current % 1000); current = Math.floor(current / 1000); }
    const result = groups.map((group, index) => group ? `${readGroup(group, index < groups.length - 1)} ${units[index]}`.trim() : '')
        .reverse().filter(Boolean).join(' ');
    return `${result.charAt(0).toUpperCase()}${result.slice(1)} đồng`;
};

export default function InvoicePrintPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { invoice, loading, error, reload } = useInvoicePrint(id);

    useEffect(() => {
        const shortcut = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
                event.preventDefault();
                window.print();
            }
        };
        window.addEventListener('keydown', shortcut);
        return () => window.removeEventListener('keydown', shortcut);
    }, []);

    if (loading) return <CashierLayout><p className="py-20 text-center text-sm text-slate-500">Đang tải phiếu thu...</p></CashierLayout>;
    if (error || !invoice) {
        return <CashierLayout><div className="flex min-h-72 flex-col items-center justify-center gap-3"><p className="text-sm text-slate-600">{error?.message || 'Không tìm thấy phiếu thu.'}</p><button onClick={reload} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm"><RotateCcw className="h-4 w-4" />Tải lại</button></div></CashierLayout>;
    }

    return (
        <CashierLayout>
            <div className="receipt-screen mx-auto max-w-5xl px-4 py-6">
                <div className="receipt-actions mb-5 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" />Quay lại</button>
                    <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"><Printer className="h-4 w-4" />In phiếu thu</button>
                </div>

                <main id="receipt-print-area" className="receipt-sheet mx-auto bg-white text-slate-900 shadow-sm">
                    <header className="receipt-head">
                        <div className="clinic-block">
                            <div className="clinic-mark">✚</div>
                            <div><h2>PHÒNG KHÁM ĐA KHOA CARES</h2><p>Địa chỉ: —</p><p>Điện thoại: —</p></div>
                        </div>
                        <div className="receipt-heading">
                            <h1>PHIẾU THU</h1>
                            <p>Ngày thu: <strong>{formatDateTime(invoice.paidAt)}</strong></p>
                            <p>Số hóa đơn: <strong>{valueOrDash(invoice.code)}</strong></p>
                            <p>Số phiếu: <strong>{valueOrDash(invoice.receiptNumber)}</strong></p>
                        </div>
                    </header>

                    <section className="patient-lines">
                        <p><strong>Họ tên:</strong> {valueOrDash(invoice.patientName)}</p>
                        <p><strong>Ngày sinh:</strong> {valueOrDash(invoice.dob)}</p>
                        <p><strong>Giới tính:</strong> {valueOrDash(invoice.gender)}</p>
                        <p className="patient-address"><strong>Địa chỉ:</strong> {valueOrDash(invoice.address)}</p>
                    </section>

                    <table className="receipt-table">
                        <thead><tr><th>STT</th><th>Nội dung</th><th>ĐVT</th><th>SL</th><th>Đơn giá</th><th>Giảm giá</th><th>Thành tiền</th></tr></thead>
                        <tbody>{invoice.items.map((item, index) => <tr key={item.id || index}>
                            <td>{index + 1}</td><td className="service-cell"><strong>{item.name}</strong><small>Mã DV: {item.code}</small></td><td>Lượt</td><td>{item.qty}</td><td>{money(item.lineTotal)}</td><td>{item.bhytDeductAmount ? money(item.bhytDeductAmount) : '—'}</td><td>{money(item.patientPay)}</td>
                        </tr>)}</tbody>
                    </table>

                    <section className="receipt-total">
                        <p><strong>Tổng tiền:</strong> <b>{money(invoice.grandTotal)} đồng</b></p>
                        <p><strong>Bằng chữ:</strong> <em>{amountInWords(invoice.grandTotal)}</em></p>
                        {invoice.bhytDeduct > 0 && <p><strong>BHYT chi trả:</strong> {money(invoice.bhytDeduct)} đồng</p>}
                        <p><strong>Nội dung thu:</strong> Thanh toán chi phí dịch vụ khám, chữa bệnh.</p>
                    </section>

                    <footer className="receipt-footer">
                        <div><strong>Người thu tiền</strong><span>(Ký, ghi rõ họ tên)</span><b>{valueOrDash(invoice.cashierName)}</b></div>
                        <div><strong>Bệnh nhân</strong><span>(Ký, ghi rõ họ tên)</span><b>{valueOrDash(invoice.patientName)}</b></div>
                    </footer>
                </main>
            </div>
            <style>{`
                .receipt-sheet { width: 210mm; min-height: 297mm; padding: 16mm 15mm; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.35; }
                .receipt-head { display:flex; justify-content:space-between; gap:20px; border-bottom:1.5px solid #111827; padding-bottom:10px; }
                .clinic-block { display:flex; align-items:flex-start; gap:8px; } .clinic-mark { color:#087e8b; font-size:27px; font-weight:900; line-height:1; }
                .clinic-block h2 { margin:0 0 3px; font-size:14px; } .clinic-block p, .receipt-heading p { margin:1px 0; font-size:11px; }
                .receipt-heading { text-align:right; } .receipt-heading h1 { margin:0 0 6px; font-size:19px; letter-spacing:.5px; }
                .patient-lines { display:grid; grid-template-columns:1.5fr .8fr .7fr; gap:7px 18px; padding:12px 0; border-bottom:1px solid #777; }
                .patient-lines p { margin:0; } .patient-address { grid-column:1 / -1; }
                .receipt-table { width:100%; margin-top:12px; border-collapse:collapse; } .receipt-table th,.receipt-table td { border:1px solid #4b5563; padding:5px 6px; }
                .receipt-table th { background:#f5eebc; text-align:center; font-size:11px; } .receipt-table td { text-align:center; vertical-align:top; } .receipt-table td:nth-child(2) { text-align:left; }
                .service-cell small { display:block; margin-top:2px; color:#596579; font-size:10px; }
                .receipt-total { margin-top:9px; } .receipt-total p { margin:4px 0; } .receipt-total b { margin-left:16px; }
                .receipt-footer { display:grid; grid-template-columns:1fr 1fr; margin-top:32px; text-align:center; } .receipt-footer div { display:flex; min-height:86px; flex-direction:column; gap:3px; } .receipt-footer span { font-size:10px; font-style:italic; } .receipt-footer b { margin-top:auto; }
                @media screen and (max-width: 760px) { .receipt-sheet { width:100%; min-height:0; padding:22px 16px; } .receipt-head { display:block; } .receipt-heading { margin-top:14px; text-align:left; } .patient-lines { grid-template-columns:1fr; } .patient-address { grid-column:auto; } .receipt-table { font-size:10px; } .receipt-table th,.receipt-table td { padding:4px 3px; } }
                @media print { @page { size:A4 portrait; margin:0; } body * { visibility:hidden !important; } #receipt-print-area, #receipt-print-area * { visibility:visible !important; } #receipt-print-area { position:absolute; left:0; top:0; width:210mm; min-height:297mm; margin:0; padding:16mm 15mm; box-shadow:none; } }
            `}</style>
        </CashierLayout>
    );
}

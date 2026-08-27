import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Printer, RotateCcw } from 'lucide-react';
import CashierLayout from '@/components/layout/CashierLayout';
import { useInvoicePrint } from '@/hooks/useInvoicePrint';
import useClinicInformation from '@/hooks/useClinicInformation';

const empty = (value) => value === null || value === undefined || String(value).trim() === '' ? '-' : value;
const money = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)} đồng`;
const dateTime = (value) => value ? new Date(value).toLocaleString('vi-VN', { hour12: false }) : '-';

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
function readThreeDigits(number, full = false) {
    const hundred = Math.floor(number / 100);
    const ten = Math.floor((number % 100) / 10);
    const unit = number % 10;
    const words = [];
    if (hundred || full) words.push(`${DIGITS[hundred]} trăm`);
    if (ten > 1) {
        words.push(`${DIGITS[ten]} mươi`);
        if (unit === 1) words.push('mốt');
        else if (unit === 5) words.push('lăm');
        else if (unit) words.push(DIGITS[unit]);
    } else if (ten === 1) {
        words.push('mười');
        if (unit === 5) words.push('lăm');
        else if (unit) words.push(DIGITS[unit]);
    } else if (unit) {
        if (hundred || full) words.push('lẻ');
        words.push(DIGITS[unit]);
    }
    return words.join(' ');
}

function amountInWords(value) {
    let number = Math.round(Number(value) || 0);
    if (number === 0) return 'Không đồng';
    const units = ['', 'nghìn', 'triệu', 'tỷ'];
    const groups = [];
    while (number > 0) {
        groups.push(number % 1000);
        number = Math.floor(number / 1000);
    }
    const words = [];
    for (let index = groups.length - 1; index >= 0; index -= 1) {
        if (!groups[index]) continue;
        words.push(readThreeDigits(groups[index], index < groups.length - 1));
        if (units[index]) words.push(units[index]);
    }
    const result = words.join(' ').replace(/\s+/g, ' ').trim();
    return `${result.charAt(0).toUpperCase()}${result.slice(1)} đồng`;
}

export default function InvoicePrintPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { invoice, loading, error, reload } = useInvoicePrint(id);
    const { clinicInformation } = useClinicInformation();

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
    if (error || !invoice) return <CashierLayout><div className="flex min-h-72 flex-col items-center justify-center gap-3"><p className="text-sm text-slate-600">{error?.message || 'Không tìm thấy phiếu thu.'}</p><button onClick={reload} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"><RotateCcw size={16}/>Tải lại</button></div></CashierLayout>;

    const items = invoice.items || [];
    const paidAt = invoice.paidAt || invoice.issuedAt;

    return <CashierLayout>
        <div className="mx-auto max-w-[210mm] px-4 py-6 print:p-0">
            <div className="mb-5 flex items-center justify-between print:hidden">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm"><ChevronLeft size={16}/>Quay lại</button>
                <button onClick={() => { window.print(); return false; }} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"><Printer size={16}/>In phiếu thu</button>
            </div>

            <article id="receipt-print-area" className="receipt-paper bg-white px-[12mm] py-[10mm] text-[12px] leading-relaxed text-slate-950 shadow-lg print:shadow-none">
                <header className="grid grid-cols-[1fr_1.25fr_1fr] items-start border-b-2 border-slate-900 pb-4">
                    <div>
                        <p className="text-lg font-black uppercase tracking-wide">{clinicInformation.clinicName}</p>
                        <p className="font-bold uppercase">{clinicInformation.legalName}</p>
                        <p className="mt-1 text-[10px]">MST: {clinicInformation.taxCode}</p>
                        <p className="text-[10px]">Địa chỉ: {clinicInformation.address}</p>
                        <p className="text-[10px]">Điện thoại: {clinicInformation.phone}</p>
                    </div>
                    <div className="text-center">
                        <h1 style={{ fontFamily: 'Arial, sans-serif' }} className="text-2xl font-black uppercase">Phiếu thu</h1>
                        <p className="mt-1">Ngày lập: {dateTime(paidAt)}</p>
                    </div>
                    <div className="text-right text-[11px]">
                        <p>Số phiếu: <b>{empty(invoice.receiptNumber)}</b></p>
                        <p>Mã hóa đơn: <b>{empty(invoice.code)}</b></p>
                    </div>
                </header>

                <section className="mt-4 grid grid-cols-2 gap-x-10 gap-y-2 border-b border-slate-400 pb-4">
                    <p><b>Họ và tên:</b> {empty(invoice.patientName)}</p>
                    <p><b>Ngày sinh:</b> {empty(invoice.dob)}</p>
                    <p><b>Giới tính:</b> {empty(invoice.gender)}</p>
                    <p className="min-w-0 break-words"><b>Địa chỉ:</b> {empty(invoice.address)}</p>
                </section>

                <h2 className="mt-4 font-bold uppercase">Nội dung thu</h2>
                <table className="mt-2 w-full table-fixed border-collapse">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="w-10 border border-slate-700 p-2">STT</th>
                            <th className="border border-slate-700 p-2 text-left">Nội dung</th>
                            <th className="w-14 border border-slate-700 p-2">ĐVT</th>
                            <th className="w-12 border border-slate-700 p-2">SL</th>
                            <th className="w-24 border border-slate-700 p-2 text-right">Đơn giá</th>
                            <th className="w-24 border border-slate-700 p-2 text-right">BHYT</th>
                            <th className="w-28 border border-slate-700 p-2 text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => <tr key={item.id || index}>
                            <td className="border border-slate-700 p-2 text-center">{index + 1}</td>
                            <td className="break-words border border-slate-700 p-2"><b>{empty(item.name)}</b>{item.code && item.code !== '-' && <div className="text-[10px] text-slate-500">Mã: {item.code}</div>}</td>
                            <td className="border border-slate-700 p-2 text-center">Lượt</td>
                            <td className="border border-slate-700 p-2 text-center">{item.qty || 1}</td>
                            <td className="border border-slate-700 p-2 text-right">{money(item.basePrice).replace(' đồng', '')}</td>
                            <td className="border border-slate-700 p-2 text-right">{money(item.bhytDeductAmount).replace(' đồng', '')}</td>
                            <td className="border border-slate-700 p-2 text-right font-semibold">{money(item.patientPay ?? item.lineTotal).replace(' đồng', '')}</td>
                        </tr>)}
                    </tbody>
                    <tfoot>
                        <tr><td colSpan="6" className="border border-slate-700 p-2 text-right font-bold">Tổng cộng</td><td className="border border-slate-700 p-2 text-right font-black">{money(invoice.grandTotal).replace(' đồng', '')}</td></tr>
                    </tfoot>
                </table>

                <section className="mt-4 space-y-1">
                    <p><b>Bằng chữ:</b> <i>{amountInWords(invoice.grandTotal)}.</i></p>
                    <p><b>Phương thức thanh toán:</b> {empty(invoice.paymentMethod)}</p>
                    {invoice.bhytCode && invoice.bhytCode !== '-' && <p><b>Mã BHYT:</b> {invoice.bhytCode} · Quỹ BHYT chi trả: {money(invoice.bhytDeduct)}</p>}
                    {invoice.note && <p><b>Ghi chú:</b> {invoice.note}</p>}
                </section>

                <footer className="mt-8 grid grid-cols-2 text-center">
                    <div><p className="font-bold">Người nộp tiền</p><p className="text-[10px] italic">(Ký, ghi rõ họ tên)</p><div className="h-20"/><p className="font-semibold">{empty(invoice.patientName)}</p></div>
                    <div><p className="font-bold">Người thu tiền</p><p className="text-[10px] italic">(Ký, ghi rõ họ tên)</p><div className="h-20"/><p className="font-semibold">{empty(invoice.cashierName)}</p></div>
                </footer>
                <p className="mt-6 border-t pt-2 text-center text-[9px] text-slate-500">Phiếu thu được lập và lưu trữ điện tử trên hệ thống {clinicInformation.clinicName}.</p>
            </article>
        </div>
        <style>{`
            @media print {
                @page { size: A4 portrait; margin: 10mm; }
                html, body, #root { height: auto !important; overflow: visible !important; background: white !important; }
                body * { visibility: hidden !important; }
                #receipt-print-area, #receipt-print-area * { visibility: visible !important; }
                #receipt-print-area { position: absolute !important; inset: 0 !important; width: 190mm !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
                #receipt-print-area tr, #receipt-print-area section, #receipt-print-area footer { break-inside: avoid; page-break-inside: avoid; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
        `}</style>
    </CashierLayout>;
}

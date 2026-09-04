import { useMemo, useState } from 'react';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { useReport } from '@/hooks/useReport';
import { Download, Printer, RefreshCw } from 'lucide-react';
import ReportExportDialog from '@/features/reports/ReportExportDialog';
import { filterReportRows, paginate } from '@/features/reports/reportExport';

const money = n => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n ?? 0) + ' đ';
const number = n => new Intl.NumberFormat('vi-VN').format(n ?? 0);
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const methods = { CASH: 'Tiền mặt', CARD: 'Thẻ ngân hàng', BANK_TRANSFER: 'Chuyển khoản', MEMBERSHIP_CARD: 'Thẻ trả trước CareS', MOMO: 'MoMo', VNPAY: 'VNPay', ZALOPAY: 'ZaloPay', OTHER: 'Khác' };
const categories = { EXAMINATION: 'Khám bệnh', PARACLINICAL: 'Cận lâm sàng', LABORATORY: 'Xét nghiệm', IMAGING: 'Chẩn đoán hình ảnh', OTHER: 'Khác' };
const panel = 'rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900';
const control = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900';
const tabs = [['overview', 'Tổng quan'], ['payments', 'Thu tiền & hóa đơn'], ['rooms', 'Hoạt động phòng']];

function rangeFor(period, year, month, quarter) {
    const day = today();
    if (period === 'day') return { from: day, to: day };
    let first = period === 'year' ? 1 : period === 'quarter' ? (quarter - 1) * 3 + 1 : month;
    let last = period === 'year' ? 12 : period === 'quarter' ? first + 2 : month;
    const lastDay = new Date(Date.UTC(year, last, 0)).getUTCDate();
    return { from: `${year}-${String(first).padStart(2, '0')}-01`, to: `${year}-${String(last).padStart(2, '0')}-${lastDay}` };
}
function Stat({ label, value, note }) {
    return <div className={panel}><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{note}</p></div>;
}
function DataTable({ headers, rows, unit }) {
    const [page, setPage] = useState(1);
    const slice = paginate(rows, page);
    return <><div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><tr>{headers.map(h => <th className="whitespace-nowrap px-3 py-3 font-medium" key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.length ? slice.rows.map((row, i) => <tr key={i} className="border-t border-slate-100 dark:border-slate-800">{row.map((value, j) => <td key={j} className="px-3 py-3 tabular-nums">{value}</td>)}</tr>) : <tr><td className="p-8 text-center text-slate-500" colSpan={headers.length}>Không có dữ liệu phù hợp với tìm kiếm và khoảng ngày đã chọn.</td></tr>}</tbody>
    </table></div>{rows.length > 0 && <nav aria-label={'Phân trang ' + unit} className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span>{slice.from}–{slice.to} / {slice.total} {unit}</span><div className="flex items-center gap-3"><button className={control + ' disabled:opacity-40'} disabled={slice.page === 1} onClick={() => setPage(slice.page - 1)}>Trang trước</button><span>Trang {slice.page} / {slice.pages}</span><button className={control + ' disabled:opacity-40'} disabled={slice.page === slice.pages} onClick={() => setPage(slice.page + 1)}>Trang sau</button></div>
    </nav>}</>;
}
function Trend({ points }) {
    const max = Math.max(1, ...points.map(p => Number(p.amount)));
    return <div className="overflow-x-auto pb-2"><div className="flex h-52 items-end gap-3" style={{ minWidth: Math.max(280, points.length * 55) }}>
        {points.map(p => <div key={p.label} className="flex h-full min-w-10 flex-1 flex-col justify-end text-center" title={p.label + ': ' + money(p.amount)}>
            <div className="mx-auto w-7 rounded-t bg-teal-600" style={{ height: Number(p.amount) ? Math.max(2, Number(p.amount) / max * 165) : 0 }} />
            <span className="mt-2 text-[10px] text-slate-500">{p.label.slice(5)}</span><span className="sr-only">{money(p.amount)}</span>
        </div>)}
    </div></div>;
}

export default function ReportPage() {
    const initialDay = today();
    const [tab, setTab] = useState('overview');
    const [period, setPeriod] = useState('day');
    const [year, setYear] = useState(Number(initialDay.slice(0, 4)));
    const [month, setMonth] = useState(Number(initialDay.slice(5, 7)));
    const [quarter, setQuarter] = useState(Math.ceil(Number(initialDay.slice(5, 7)) / 3));
    const [customFrom, setCustomFrom] = useState(initialDay);
    const [customTo, setCustomTo] = useState(initialDay);
    const [applied, setApplied] = useState({ from: initialDay, to: initialDay });
    const [rangeError, setRangeError] = useState('');
    const [search, setSearch] = useState('');
    const [roomSearch, setRoomSearch] = useState('');
    const [exportMode, setExportMode] = useState(null);
    const range = period === 'custom' ? applied : rangeFor(period, year, month, quarter);
    const { data, loading, error, refresh } = useReport(range.from, range.to);
    const serviceRows = useMemo(() => filterReportRows(data?.services ?? [], search)
        .sort((a, b) => Number(b.patientAmount) - Number(a.patientAmount)), [data, search]);
    const roomHeaders = ['Phòng', 'Bệnh án hoàn thành', 'CLS hoàn thành', 'Chờ gọi / đã gọi', 'Đang xử lý', 'Bỏ lượt', 'Đánh giá'];
    const roomRows = filterReportRows(data?.rooms ?? [], roomSearch).map(r => [r.code + ' · ' + r.name, r.completedExaminations, r.completedTests, r.waiting, r.inProgress, r.skipped,
        r.ratingCount ? `${r.rating}/5 · ${r.ratingCount} đánh giá` : 'Chưa có đánh giá']);
    const serviceHeaders = ['Dịch vụ', 'Nhóm', 'Số lượng', 'Giá trị niêm yết', 'BHYT ghi nhận', 'Sau giảm trừ tại dòng'];
    const mappedServices = serviceRows.map(s => [s.code + ' · ' + s.name, categories[s.category] ?? s.category, s.quantity, money(s.gross), money(s.insurance), money(s.patientAmount)]);
    const a = data?.activity;
    const f = data?.finance;
    const reconciliation = f ? [
        ['Tổng giá trị hóa đơn', f.invoiceGross], ['BHYT ghi nhận (không phải tiền đã quyết toán)', f.insurance],
        ['Ưu đãi thẻ CareS', f.caresBenefit], ['Giảm trừ khác (âm là phụ thu)', f.otherDiscount],
        ['Thuế', f.tax], ['Người bệnh phải trả', f.invoicePayable], ['Đã thanh toán cho các hóa đơn này', f.invoicePaid], ['Còn phải thu hiện tại', f.outstanding],
    ] : [];
    function applyCustom() {
        const days = (Date.parse(customTo) - Date.parse(customFrom)) / 86400000;
        if (!customFrom || !customTo || !Number.isFinite(days) || days < 0 || days > 366) {
            setRangeError('Chọn ngày bắt đầu và kết thúc hợp lệ, tối đa 367 ngày.'); return;
        }
        setRangeError('');
        setApplied({ from: customFrom, to: customTo });
    }
    return <OwnerLayout><div id="cares-manager-report" className="space-y-5 p-4 text-slate-800 dark:text-slate-100 md:p-6">
        {exportMode && data && !loading && !error && data.fromDate === range.from && data.toDate === range.to && <ReportExportDialog
            data={data} mode={exportMode} serviceSearch={search} roomSearch={roomSearch}
            defaultType={tab === 'payments' ? 'reconciliation' : tab} onClose={() => setExportMode(null)} />}
        <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-xl font-semibold">Thống kê phòng khám</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{range.from} – {range.to} · Giờ Việt Nam</p></div>
            <div className="report-controls flex gap-2"><button className={control} onClick={refresh} disabled={loading} aria-label="Tải lại báo cáo"><RefreshCw size={16} /></button>
                <button className={control + ' flex items-center gap-2'} disabled={!data || loading || !!error || data.fromDate !== range.from || data.toDate !== range.to} onClick={() => setExportMode('csv')}><Download size={16} />Xuất CSV</button>
                <button className={control + ' flex items-center gap-2'} disabled={!data || loading || !!error || data.fromDate !== range.from || data.toDate !== range.to} onClick={() => setExportMode('print')}><Printer size={16} />In báo cáo</button></div>
        </header>
        <div className={panel + ' report-controls flex flex-wrap items-center gap-3'}>
            <label className="text-sm">Khoảng thời gian <select className={control + ' ml-2'} value={period} onChange={e => { setPeriod(e.target.value); setRangeError(''); }}>
                <option value="day">Hôm nay</option><option value="month">Tháng</option><option value="quarter">Quý</option><option value="year">Năm</option><option value="custom">Tùy chọn</option></select></label>
            {!['day', 'custom'].includes(period) && <select aria-label="Năm" className={control} value={year} onChange={e => setYear(Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => Number(initialDay.slice(0, 4)) - i).map(y => <option key={y}>{y}</option>)}</select>}
            {period === 'month' && <select aria-label="Tháng" className={control} value={month} onChange={e => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Tháng {i + 1}</option>)}</select>}
            {period === 'quarter' && <select aria-label="Quý" className={control} value={quarter} onChange={e => setQuarter(Number(e.target.value))}>{[1, 2, 3, 4].map(q => <option key={q} value={q}>Quý {q}</option>)}</select>}
            {period === 'custom' && <><input aria-label="Từ ngày" className={control} type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} /><input aria-label="Đến ngày" className={control} type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} /><button className={control} onClick={applyCustom}>Áp dụng</button></>}
            {rangeError && <p role="alert" className="text-sm text-red-600">{rangeError}</p>}
        </div>
        <nav className="report-controls flex gap-2 overflow-x-auto" aria-label="Nhóm thống kê">{tabs.map(([key, label]) => <button key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)} className={'whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ' + (tab === key ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200')}>{label}</button>)}</nav>
        <h2 className="text-lg font-semibold">{tabs.find(([key]) => key === tab)[1]}</h2>
        {loading && <p role="status" className={panel}>Đang tải số liệu…</p>}
        {error && <div role="alert" className={panel + ' text-red-600'}>{error} <button className={control} onClick={refresh}>Thử lại</button></div>}
        {data && !loading && <>
            {tab === 'overview' && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Stat label="Lượt đến khám" value={number(a.arrivals)} note="Số VIS check-in trong khoảng ngày; không phải số người duy nhất." />
                <Stat label="Lượt đã kết thúc" value={number(a.closedVisits)} note={`Theo ngày checkout; gồm ${a.partialVisits} lượt bỏ dở một phần.`} />
                <Stat label="Lượt đã hủy" value={number(a.cancelledVisits)} note="VIS CANCELLED theo ngày checkout; không phải lịch hẹn bị hủy." />
                <Stat label="Bệnh án hoàn thành" value={number(a.completedExaminations)} note="Mỗi dịch vụ khám một bệnh án; tính theo completedAt." />
                <Stat label="Yêu cầu CLS hoàn thành" value={number(a.completedTests)} note="Có bản kết quả đã ký; chỉ số lẻ là yêu cầu riêng, không phải lượt gọi." />
                <Stat label="Thanh toán dịch vụ" value={money(f.collected)} note={`${f.successfulPayments} giao dịch thành công theo ngày thanh toán.`} />
            </div><section className={panel}><h3 className="font-semibold">Thanh toán dịch vụ theo thời gian</h3><p className="my-2 text-xs text-slate-500">Di chuột vào cột để xem số tiền. Ngày không phát sinh giữ giá trị 0.</p><Trend points={data.paymentChart} /></section></>}
            {tab === 'payments' && <><div className="grid gap-4 md:grid-cols-2"><Stat label="Thanh toán trong kỳ" value={money(f.collected)} note="Giao dịch SUCCESS theo paidAt, kể cả hóa đơn lập ngoài kỳ. Không tính giao dịch hủy/thất bại." />
                <section className={panel}><h3 className="mb-3 font-semibold">Phương thức thanh toán</h3>{data.paymentMethods.length ? data.paymentMethods.map(p => <p key={p.label} className="flex justify-between gap-3 py-1 text-sm"><span>{methods[p.label] ?? p.label}</span><span>{money(p.amount)}</span></p>) : <p className="text-sm text-slate-500">Chưa có giao dịch thành công.</p>}</section></div>
                <p className="text-sm text-slate-500">Bao gồm giá trị thanh toán bằng thẻ CareS, không cộng tiền nạp thẻ lần nữa. Đây không phải báo cáo tiền mặt ròng hoặc báo cáo hoàn tiền theo ngày.</p>
                <section className={panel}><h3 className="font-semibold">Đối soát các hóa đơn lập trong kỳ</h3><p className="my-2 text-sm text-slate-500">Loại hóa đơn hủy. Số đã thanh toán/còn phải thu là trạng thái hiện tại của nhóm hóa đơn này, không phải số dư tại cuối kỳ.</p>
                    <dl className="grid gap-x-8 md:grid-cols-2">{reconciliation.map(([label, amount]) => <div className="flex justify-between gap-4 border-b border-slate-100 py-3 text-sm dark:border-slate-800" key={label}><dt>{label}</dt><dd className="font-medium tabular-nums">{money(amount)}</dd></div>)}</dl>
                    <p className="mt-3 text-xs text-slate-500">Phải trả = Tổng hóa đơn − BHYT − CareS − Giảm trừ khác + Thuế. Hai khối dùng ngày ghi nhận khác nhau nên không mặc định bằng nhau.</p></section>
                <section className={panel}><div className="mb-3 flex flex-wrap justify-between gap-3"><h3 className="font-semibold">Dịch vụ trên hóa đơn trong kỳ</h3><input className={control + ' report-controls'} placeholder="Tìm mã hoặc tên dịch vụ…" aria-label="Tìm dịch vụ" value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <p className="mb-3 text-xs text-slate-500">Tìm kiếm chỉ lọc bảng chi tiết, không thay đổi tổng kết toàn kỳ. Giá lấy từ hóa đơn, không lấy giá danh mục hiện tại. Cột cuối chưa trừ ưu đãi CareS/điều chỉnh cấp hóa đơn, không gọi là thực thu.</p><DataTable key={`services-${search}-${range.from}-${range.to}`} headers={serviceHeaders} rows={mappedServices} unit="dịch vụ" /></section></>}
            {tab === 'rooms' && <section className={panel}><p className="mb-4 text-sm text-slate-500">Hoàn thành tính theo ngày hoàn tất. Hàng chờ là trạng thái hiện tại của phiếu có ngày làm việc trong kỳ; “đang xử lý” gồm chờ CLS. Đánh giá là điểm bệnh án theo ngày đánh giá, không phải điểm riêng cho nhân viên.</p>
                <input className={control + ' mb-3 w-full sm:max-w-sm'} placeholder="Tìm mã hoặc tên phòng…" aria-label="Tìm phòng" value={roomSearch} onChange={e => setRoomSearch(e.target.value)} />
                <p className="mb-3 text-xs text-slate-500">Tìm kiếm chỉ áp dụng bảng phòng, không thay đổi tổng kết toàn kỳ.</p>
                <DataTable key={`rooms-${roomSearch}-${range.from}-${range.to}`} headers={roomHeaders} rows={roomRows} unit="phòng" /><p className="mt-3 text-xs text-slate-500">Chưa có cơ sở tính công suất phòng nên không hiển thị phần trăm. Phòng chưa có phản hồi không bị chấm 0 sao.</p></section>}
        </>}
    </div></OwnerLayout>;
}

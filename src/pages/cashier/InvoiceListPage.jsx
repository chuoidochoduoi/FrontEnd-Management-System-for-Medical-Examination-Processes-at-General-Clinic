import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, FileText, Search, WalletCards } from 'lucide-react';
import CashierLayout from '@/components/layout/CashierLayout';
import { useInvoiceList } from '@/hooks/useInvoiceList';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ROUTES } from '@/constants/routes';
import styles from './InvoiceListPage.module.css';

const fmt = (value) => value != null ? `${new Intl.NumberFormat('vi-VN').format(value)} đ` : '—';
const statusKey = (value = '') => value.toLowerCase();
const statusLabel = { pending: 'Chờ thanh toán', paid: 'Đã thanh toán', cancelled: 'Đã hủy' };
const formatDate = (invoice) => {
    const value = invoice.checkInTime || invoice.createdAt;
    if (!value) return invoice.issueDate || '—';
    try { return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)); } catch { return value; }
};

function ServiceSummary({ services = [] }) {
    if (!services.length) return <span className="text-gray-400">Chưa có dịch vụ</span>;
    return <div className={styles.serviceSummary}><strong>{services[0].name}</strong>{services[0].description && services[0].description !== services[0].name && <small className={styles.description} title={services[0].description}>{services[0].description}</small>}{services.length > 1 && <small className={styles.moreServices}>+{services.length - 1} dịch vụ khác</small>}</div>;
}

export default function InvoiceListPage() {
    const { invoices, loading, error, page, total, fetchInvoices } = useInvoiceList();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [category, setCategory] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const pageSize = 7;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const query = (nextPage = 0) => ({ search, status, category, fromDate, toDate, page: nextPage, size: pageSize });

    useEffect(() => { fetchInvoices({ page: 0, size: pageSize }); }, []);
    useWebSocket('/topic/cashier-invoices', null, (message) => {
        if (message === 'INVOICE_UPDATED') fetchInvoices(query(Math.max(0, page - 1)));
    });

    const renderState = () => {
        if (loading) return <div className="cares-reception-state"><span className="cares-reception-spinner"/><strong>Đang tải hóa đơn...</strong></div>;
        if (error) return <div className="cares-reception-state is-error"><strong>{error}</strong><button type="button" onClick={() => fetchInvoices(query(Math.max(0, page - 1)))}>Thử lại</button></div>;
        if (!invoices.length) return <div className="cares-reception-state"><FileText size={36}/><strong>Không có hóa đơn phù hợp</strong><p>Hãy thay đổi bộ lọc hoặc khoảng ngày.</p></div>;
        return null;
    };

    return <CashierLayout><div className={`cares-ops-screen ${styles.page}`}>
        <header className="cares-ops-header"><div><span className="cares-ops-eyebrow"><WalletCards size={17}/>Quầy thanh toán</span><h1>Danh sách hóa đơn</h1><p>Theo dõi hóa đơn, thu tiền và mở phiếu thu của bệnh nhân.</p></div></header>

        <section className="cares-ops-filter">
            <label><span>Tìm kiếm</span><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && fetchInvoices(query(0))} placeholder="Mã hóa đơn, bệnh nhân hoặc mã bệnh nhân..."/></label>
            <label><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả</option><option value="pending">Chờ thanh toán</option><option value="paid">Đã thanh toán</option><option value="cancelled">Đã hủy</option></select></label>
            <label><span>Dịch vụ</span><input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Tên dịch vụ..."/></label>
            <label><span>Từ ngày</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)}/></label>
            <label><span>Đến ngày</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)}/></label>
            <button type="button" className="cares-ops-primary" onClick={() => fetchInvoices(query(0))}><Search size={18}/>Tìm kiếm</button>
        </section>

        <section className="cares-ops-card">
            <header className="cares-ops-card-header"><div><h2>Hóa đơn hiện có</h2><p className="text-sm text-gray-500">Kết quả được cập nhật khi trạng thái thanh toán thay đổi.</p></div><span className="cares-ops-badge is-active">{total} hóa đơn</span></header>
            <div className="cares-ops-table-scroll" tabIndex={0} role="region" aria-label="Danh sách hóa đơn, cuộn ngang để xem đầy đủ các cột"><table className={`cares-ops-table ${styles.table}`}>
                <colgroup><col className={styles.codeColumn}/><col className={styles.dateColumn}/><col className={styles.patientColumn}/><col/><col className={styles.amountColumn}/><col className={styles.statusColumn}/><col className={styles.actionColumn}/></colgroup>
                <thead><tr>{['Mã hóa đơn', 'Thời gian', 'Bệnh nhân', 'Dịch vụ', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>
                {(loading || error || !invoices.length) && <tr><td colSpan="7">{renderState()}</td></tr>}
                {!loading && !error && invoices.map((invoice) => <tr key={invoice.id}><td><strong>{invoice.code}</strong></td><td>{formatDate(invoice)}</td><td><strong>{invoice.patientName || '—'}</strong><small>{invoice.patientCode || 'Chưa có mã bệnh nhân'}</small></td><td><ServiceSummary services={invoice.services}/></td><td><strong>{fmt(invoice.total)}</strong></td><td><span className={`cares-ops-badge is-${statusKey(invoice.status)}`}>{statusLabel[statusKey(invoice.status)] || invoice.status}</span></td><td><Link className="cares-ops-row-link" to={ROUTES.CASHIER_INVOICE_DETAIL.replace(':id', invoice.id)}><Eye size={17}/>Xem chi tiết</Link></td></tr>)}
            </tbody></table></div>
            <div className="cares-ops-mobile-list">{renderState() || invoices.map((invoice) => <article key={invoice.id}><header><strong>{invoice.code}</strong><span className={`cares-ops-badge is-${statusKey(invoice.status)}`}>{statusLabel[statusKey(invoice.status)] || invoice.status}</span></header><h3>{invoice.patientName || '—'}</h3><p>{invoice.patientCode || 'Chưa có mã'} · {formatDate(invoice)}</p><ServiceSummary services={invoice.services}/><footer><strong>{fmt(invoice.total)}</strong><Link className="cares-ops-row-link" to={ROUTES.CASHIER_INVOICE_DETAIL.replace(':id', invoice.id)}><Eye size={17}/>Chi tiết</Link></footer></article>)}</div>
        </section>

        {totalPages > 1 && <nav className="cares-ops-pagination" aria-label="Phân trang">{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button type="button" key={number} className={number === page ? 'is-active' : ''} onClick={() => fetchInvoices(query(number - 1))}>{number}</button>)}</nav>}
    </div></CashierLayout>;
}

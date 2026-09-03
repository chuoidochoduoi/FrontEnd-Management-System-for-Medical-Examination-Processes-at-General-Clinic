import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, History, RefreshCw } from 'lucide-react';
import CashierLayout from '@/components/layout/CashierLayout';
import { ROUTES } from '@/constants/routes';

const money = value => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)} đ`;
const methods = { CASH: 'Tiền mặt', BANK_TRANSFER: 'Chuyển khoản', CARD: 'Thẻ ngân hàng' };
const dateTime = value => value ? new Date(value).toLocaleString('vi-VN') : '—';

export default function MembershipTopUpHistoryPage() {
    const [params, setParams] = useSearchParams();
    const requestedPage = Number(params.get('page') || 0);
    const page = Number.isSafeInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true); setError(''); setData(null);
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/membership-cards/top-ups?page=${page}&size=20`, {
                    headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
                });
                const body = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(body.message || 'Không thể tải lịch sử nạp tiền.');
                if (!Array.isArray(body.content)) throw new Error('Dữ liệu lịch sử không hợp lệ. Vui lòng tải lại.');
                if (!controller.signal.aborted) setData(body);
            } catch (error) {
                if (!controller.signal.aborted) setError(error.message || 'Không thể kết nối đến hệ thống.');
            } finally { if (!controller.signal.aborted) setLoading(false); }
        };
        load();
        return () => controller.abort();
    }, [page, reload]);

    const changePage = next => setParams(previous => {
        const updated = new URLSearchParams(previous);
        updated.set('page', String(next));
        return updated;
    });

    return <CashierLayout><div className="cares-ops-screen">
        <header className="cares-ops-header"><div><span className="cares-ops-eyebrow"><History size={18}/>Thẻ trả trước</span>
            <h1>Lịch sử nạp tiền</h1><p>Các khoản nạp đã được hệ thống ghi nhận, mới nhất trước. Không bao gồm giao dịch thanh toán dịch vụ.</p>
        </div><div className="flex flex-wrap gap-3">
            <Link to={ROUTES.CASHIER_MEMBERSHIP_TOPUP} className="cares-ops-secondary"><ArrowLeft size={20}/>Quay lại nạp tiền</Link>
            <button type="button" className="cares-ops-secondary" disabled={loading} onClick={() => setReload(value => value + 1)}><RefreshCw size={18}/>Tải lại</button>
        </div></header>

        <section className="cares-ops-card" aria-busy={loading}>
            <div className="cares-ops-card-header"><h2>Giao dịch nạp tiền</h2>{data && <span>{data.totalElements} giao dịch</span>}</div>
            {loading ? <div className="p-6 space-y-4" role="status"><p>Đang tải lịch sử nạp tiền...</p>{[1, 2, 3].map(key => <div key={key} className="h-14 rounded-xl" style={{ background: 'var(--cares-surface-subtle)' }}/>)}</div>
                : error ? <div className="p-6" role="alert"><p className="text-red-600">{error}</p><button type="button" className="cares-ops-secondary mt-4" onClick={() => setReload(value => value + 1)}>Thử lại</button></div>
                : !data?.content.length ? <p className="p-8 text-center">{page === 0 ? 'Chưa có giao dịch nạp tiền.' : 'Không có giao dịch ở trang này.'}</p>
                : <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng lịch sử nạp tiền">
                    <table className="w-full min-w-[960px] text-left">
                        <thead style={{ background: 'var(--cares-surface-subtle)' }}><tr>{['Mã phiếu', 'Mã thẻ', 'Thời gian', 'Phương thức', 'Số tiền nạp', 'Số dư sau nạp'].map(label => <th key={label} scope="col" className="p-4 whitespace-nowrap">{label}</th>)}</tr></thead>
                        <tbody>{data.content.map(row => <tr key={row.ledgerId} className="border-t" style={{ borderColor: 'var(--cares-border)' }}>
                            <td className="p-4 font-medium">{row.referenceCode || '—'}</td>
                            <td className="p-4 whitespace-nowrap">{row.cardCode}</td>
                            <td className="p-4 whitespace-nowrap">{dateTime(row.createdAt)}</td>
                            <td className="p-4">{methods[row.paymentMethod] || row.paymentMethod || '—'}</td>
                            <td className="p-4 font-bold whitespace-nowrap" style={{ color: 'var(--cares-brand-strong)' }}>{money(row.amount)}</td>
                            <td className="p-4 whitespace-nowrap">{money(row.balanceAfter)}</td>
                        </tr>)}</tbody>
                    </table>
                </div>}
            {!loading && !error && <nav className="flex flex-wrap items-center justify-between gap-3 p-5 border-t" style={{ borderColor: 'var(--cares-border)' }} aria-label="Phân trang lịch sử">
                <span>Trang {page + 1}{data?.totalPages > 0 ? ` / ${data.totalPages}` : ''}</span>
                <div className="flex gap-3"><button type="button" className="cares-ops-secondary" disabled={page === 0} onClick={() => changePage(page - 1)}>Trang trước</button>
                    <button type="button" className="cares-ops-secondary" disabled={!data || page + 1 >= data.totalPages} onClick={() => changePage(page + 1)}>Trang sau</button></div>
            </nav>}
        </section>
    </div></CashierLayout>;
}

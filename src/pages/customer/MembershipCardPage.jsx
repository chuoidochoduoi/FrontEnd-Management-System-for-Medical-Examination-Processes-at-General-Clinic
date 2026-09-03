import { useCallback, useEffect, useRef, useState } from 'react';
import { CreditCard, History, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { useWebSocket } from '@/hooks/useWebSocket';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const headers = () => ({ Authorization: `Bearer ${get('token')}`, 'Content-Type': 'application/json' });
const money = value => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const api = import.meta.env.VITE_API_URL;

export default function MembershipCardPage() {
    const [card, setCard] = useState(null);
    const [policy, setPolicy] = useState(null);
    const [history, setHistory] = useState([]);
    const [pin, setPin] = useState('');
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [syncError, setSyncError] = useState('');
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const inFlight = useRef(false);
    const mounted = useRef(true);
    const pendingRefresh = useRef(false);

    const load = useCallback(async ({ initial = false, invalidate = false } = {}) => {
        if (inFlight.current) {
            // Do not lose a committed update arriving while an older snapshot is loading.
            if (invalidate) pendingRefresh.current = true;
            return;
        }
        inFlight.current = true;
        pendingRefresh.current = false;
        if (initial) setLoading(true);
        else setRefreshing(true);
        setSyncError('');
        try {
            const [cardRes, policyRes] = await Promise.all([
                fetch(`${api}/api/v1/membership-cards/my`, { headers: headers(), cache: 'no-store' }),
                fetch(`${api}/api/v1/membership-cards/policy`, { headers: headers(), cache: 'no-store' })
            ]);
            if (cardRes.ok) {
                const nextCard = await cardRes.json();
                const historyRes = await fetch(`${api}/api/v1/membership-cards/my/history?size=20`, { headers: headers(), cache: 'no-store' });
                if (!historyRes.ok) throw new Error('Không thể tải lịch sử số dư mới nhất.');
                const nextHistory = (await historyRes.json()).content || [];
                if (mounted.current) {
                    setCard(nextCard);
                    setHistory(nextHistory);
                }
            } else if (cardRes.status !== 404) {
                const errorBody = await cardRes.json().catch(() => ({}));
                throw new Error(errorBody.message || 'Không thể tải số dư thẻ CareS.');
            }
            if (policyRes.ok && mounted.current) setPolicy(await policyRes.json());
            if (mounted.current) setLastUpdatedAt(new Date());
        } catch (error) {
            if (mounted.current) setSyncError(error.message || 'Không thể đồng bộ thông tin thẻ.');
        } finally {
            inFlight.current = false;
            if (mounted.current) { setLoading(false); setRefreshing(false); }
            if (mounted.current && pendingRefresh.current && document.visibilityState === 'visible') load();
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        load({ initial: true });
        const refreshWhenVisible = () => {
            if (document.visibilityState === 'visible') load();
        };
        window.addEventListener('focus', refreshWhenVisible);
        document.addEventListener('visibilitychange', refreshWhenVisible);
        return () => {
            mounted.current = false;
            window.removeEventListener('focus', refreshWhenVisible);
            document.removeEventListener('visibilitychange', refreshWhenVisible);
        };
    }, [load]);

    const syncFromSocket = useCallback(() => {
        if (!mounted.current) return;
        if (document.visibilityState !== 'visible') {
            pendingRefresh.current = true;
            return;
        }
        load({ invalidate: true });
    }, [load]);

    useWebSocket('/user/queue/membership-card', null, syncFromSocket, {
        authenticated: true,
        onConnect: syncFromSocket,
    });

    const register = async () => {
        const res = await fetch(`${api}/api/v1/membership-cards/my/register`, {
            method: 'POST', headers: headers(), body: JSON.stringify({ pin, acceptedTerms: accepted })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return toast.error(data.message || 'Không thể đăng ký thẻ.');
        toast.success('Đăng ký thẻ thành công. Vui lòng nạp tiền tại quầy để kích hoạt.');
        setPin(''); setCard(data); load();
    };

    return <CustomerLayout><div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-primary-600 font-semibold">THẺ TRẢ TRƯỚC CARES</p><h1 className="text-3xl font-bold text-gray-900">Thẻ của tôi</h1>
            <p className="text-gray-500 mt-1">Quản lý số dư, thời hạn ưu đãi và lịch sử sử dụng cho bạn cùng gia đình.</p></div>
            <div className="flex flex-col items-end gap-1"><button type="button" onClick={() => load()} disabled={refreshing || loading} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-primary-200 bg-white px-5 font-semibold text-primary-700 disabled:opacity-60"><RefreshCw size={20} className={refreshing ? 'animate-spin' : ''}/>{refreshing ? 'Đang đồng bộ...' : 'Cập nhật số dư'}</button>
                {lastUpdatedAt && <span className="text-sm text-gray-500">Cập nhật lúc {lastUpdatedAt.toLocaleTimeString('vi-VN')}</span>}</div></header>
        {syncError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800"><span>{syncError} Dữ liệu đang hiển thị có thể chưa phải mới nhất.</span><button type="button" className="font-bold underline" onClick={() => load()}>Thử lại</button></div>}
        {loading ? <div className="h-64 animate-pulse rounded-2xl bg-gray-100" /> : !card ? (
            <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                <div className="rounded-2xl border bg-white p-7"><WalletCards className="text-primary-600" size={34}/><h2 className="mt-4 text-2xl font-bold">Đăng ký thẻ điện tử</h2>
                    <p className="mt-2 text-gray-600">Số tiền nạp được ghi nhận đúng 1:1. Nạp lần đầu từ {money(policy?.minimumTopUp || 1000000)} để kích hoạt ưu đãi {policy?.discountPercent || 15}% trong {policy?.validityMonths || 12} tháng.</p>
                    <label className="mt-5 block font-medium">Tạo mã PIN 6 số<input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,6))} type="password" inputMode="numeric" className="mt-2 h-12 w-full rounded-xl border px-4" placeholder="••••••"/></label>
                    <label className="mt-4 flex gap-3"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>Tôi xác nhận có quyền quản lý thẻ và đồng ý thẻ không hỗ trợ rút/chuyển số dư thành tiền mặt.</span></label>
                    <button onClick={register} disabled={pin.length!==6 || !accepted} className="mt-5 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white disabled:opacity-50">Đăng ký thẻ</button>
                </div>
                <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-cyan-50 p-7 text-slate-800 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                        <ShieldCheck size={28}/>
                    </div>
                    <p className="mt-5 text-sm font-bold uppercase tracking-[0.12em] text-primary-700">Thông tin cần biết</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">Quy tắc sử dụng thẻ</h3>
                    <ul className="mt-5 space-y-3">
                        <li className="flex gap-3 rounded-xl border border-primary-100 bg-white/80 p-4">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700">✓</span>
                            <span>Dùng chung cho các thành viên gia đình đang hoạt động.</span>
                        </li>
                        <li className="flex gap-3 rounded-xl border border-primary-100 bg-white/80 p-4">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700">✓</span>
                            <span>Không cộng dồn với BHYT hoặc ưu đãi khác trên cùng dịch vụ.</span>
                        </li>
                        <li className="flex gap-3 rounded-xl border border-primary-100 bg-white/80 p-4">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700">✓</span>
                            <span>Hết thời hạn ưu đãi không làm mất số dư hiện có trong thẻ.</span>
                        </li>
                    </ul>
                </div>
            </section>
        ) : <>
            <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 to-teal-500 p-8 text-white shadow-xl"><CreditCard size={34}/><p className="mt-8 text-sm tracking-[.2em]">{card.cardCode}</p><p className="mt-3 text-4xl font-bold">{money(card.balance)}</p><div className="mt-8 flex flex-wrap justify-between gap-3"><span>Trạng thái: {card.status === 'ACTIVE' ? 'Đang hoạt động' : 'Chờ nạp tiền kích hoạt'}</span><span>Ưu đãi: {card.benefitActive ? `${card.benefitPercent}%` : 'Không áp dụng'}</span></div></div>
                <div className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Thời hạn quyền lợi</h2><p className="mt-3 text-gray-600">{card.benefitExpiresAt ? new Date(card.benefitExpiresAt).toLocaleString('vi-VN') : 'Chưa kích hoạt'}</p><p className="mt-5 rounded-xl bg-amber-50 p-4 text-amber-800">Nạp tiền tại quầy thu ngân. Mỗi lần nạp từ {money(policy?.minimumTopUp)} sẽ gia hạn quyền lợi.</p></div>
            </section>
            <section className="rounded-2xl border bg-white"><div className="flex items-center gap-2 border-b p-5"><History/><h2 className="text-xl font-bold">Lịch sử số dư</h2></div><div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-50 text-left"><th className="p-4">Thời gian</th><th className="p-4">Nội dung</th><th className="p-4">Số tiền</th><th className="p-4">Số dư sau</th></tr></thead><tbody>{history.map(row=><tr key={row.ledgerId} className="border-t"><td className="p-4">{new Date(row.createdAt).toLocaleString('vi-VN')}</td><td className="p-4">{row.type==='TOP_UP'?'Nạp tiền':row.type==='PAYMENT'?'Thanh toán':'Hoàn tác thanh toán'}</td><td className="p-4 font-semibold">{row.type==='PAYMENT'?'-':'+'}{money(row.amount)}</td><td className="p-4">{money(row.balanceAfter)}</td></tr>)}</tbody></table>{!history.length&&<p className="p-8 text-center text-gray-500">Chưa có giao dịch.</p>}</div></section>
        </>}
    </div></CustomerLayout>;
}

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Banknote, CreditCard, History, ReceiptText, WalletCards } from 'lucide-react';
import CashierLayout from '@/components/layout/CashierLayout';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ROUTES } from '@/constants/routes';
import useClinicInformation from '@/hooks/useClinicInformation';
import ReceiptPreview from '@/components/receipts/ReceiptPreview';
import { topUpReceipt } from '@/components/receipts/receiptModel';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const money = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)} đ`;
const methodLabel = { CASH: 'Tiền mặt', BANK_TRANSFER: 'Chuyển khoản', CARD: 'Thẻ ngân hàng' };
const presets = [500000, 1000000, 2000000];

export default function MembershipTopUpPage() {
    const { clinicInformation, loading: clinicLoading } = useClinicInformation();
    const [cardCode, setCardCode] = useState('');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('CASH');
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [confirmation, setConfirmation] = useState(null);
    const [error, setError] = useState('');
    const sending = useRef(false);
    const attempt = useRef(null);

    const review = () => {
        const value = Number(amount);
        if (!cardCode.trim() || !Number.isSafeInteger(value) || value <= 0) {
            setError('Vui lòng nhập mã thẻ và số tiền nguyên dương hợp lệ.');
            return;
        }
        const details = { cardCode: cardCode.trim(), amount: value, paymentMethod: method };
        // Keep the same key on retry if the previous response was lost.
        if (!attempt.current || JSON.stringify(attempt.current.details) !== JSON.stringify(details)) {
            attempt.current = { details, idempotencyKey: crypto.randomUUID() };
        }
        setError('');
        setConfirmation(attempt.current);
    };

    const submit = async () => {
        if (sending.current || !confirmation) return;
        sending.current = true;
        setBusy(true);
        setError('');
        const { details, idempotencyKey } = confirmation;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/membership-cards/${encodeURIComponent(details.cardCode)}/top-up`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${get('token')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: details.amount, paymentMethod: details.paymentMethod, idempotencyKey }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || 'Không thể nạp tiền.');
            setResult(data);
            setConfirmation(null);
            attempt.current = null;
            setAmount('');
            toast.success('Nạp tiền và cập nhật thẻ thành công.');
        } catch (error) {
            const message = error.message || 'Không thể nạp tiền. Vui lòng thử lại.';
            setError(message);
            toast.error(message);
        } finally { setBusy(false); sending.current = false; }
    };

    return <CashierLayout><div className="cares-ops-screen cares-membership-screen">
        <header className="cares-ops-header print:hidden"><div><span className="cares-ops-eyebrow"><WalletCards size={17}/>Thẻ trả trước</span><h1>Nạp tiền thẻ CareS</h1><p>Khoản nạp được quản lý riêng với doanh thu dịch vụ y tế.</p></div><Link to={ROUTES.CASHIER_MEMBERSHIP_TOPUP_HISTORY} className="cares-ops-secondary"><History size={20}/>Lịch sử nạp tiền</Link></header>
        <div className="cares-membership-grid print:block">
            <section className="cares-ops-card cares-membership-form-card print:hidden">
                <div className="cares-ops-card-header"><div><h2>Thông tin nạp tiền</h2><p className="text-sm text-gray-500">Kiểm tra đúng mã thẻ trước khi xác nhận giao dịch.</p></div><span className="cares-membership-icon"><CreditCard size={24}/></span></div>
                <div className="cares-membership-fields">
                    <label><span>Mã thẻ CareS</span><input value={cardCode} onChange={(event) => setCardCode(event.target.value.toUpperCase())} placeholder="CS-..."/></label>
                    <label><span>Số tiền nạp</span><input value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Nhập số tiền"/><strong>{amount ? money(amount) : '0 đ'}</strong></label>
                    <div><span className="cares-field-label">Chọn nhanh</span><div className="cares-membership-presets">{presets.map((value) => <button type="button" key={value} className={Number(amount) === value ? 'is-active' : ''} onClick={() => setAmount(String(value))}>{money(value)}</button>)}</div></div>
                    <label><span>Phương thức thu</span><select value={method} onChange={(event) => setMethod(event.target.value)}><option value="CASH">Tiền mặt</option><option value="BANK_TRANSFER">Chuyển khoản</option><option value="CARD">Thẻ ngân hàng</option></select></label>
                    <div className="cares-membership-note"><Banknote size={21}/><p>Tiền nạp được cộng đúng vào số dư thẻ. Quyền lợi được áp dụng khi chủ thẻ dùng thẻ để thanh toán dịch vụ.</p></div>
                    {error && !confirmation && <p role="alert" className="text-red-600">{error}</p>}
                    <button type="button" onClick={review} disabled={busy || !cardCode.trim() || Number(amount) <= 0} className="cares-ops-primary cares-membership-submit">{busy ? 'Đang xử lý...' : 'Nạp tiền'}</button>
                </div>
            </section>
            <aside className="cares-membership-guide print:hidden"><ReceiptText size={27}/><h2>Kiểm tra trước khi thu</h2><ol><li>Đối chiếu mã thẻ với thông tin khách hàng.</li><li>Xác nhận số tiền và phương thức thu.</li><li>Chỉ giao phiếu sau khi hệ thống báo thành công.</li></ol><p>Khoản nạp không được rút hoặc chuyển thành tiền mặt trong hệ thống.</p></aside>
        </div>
        {result && (clinicLoading ? <p role="status">Đang tải thông tin phiếu thu...</p> : <ReceiptPreview receipt={topUpReceipt(result)} clinic={clinicInformation}/>)}
        <ConfirmModal isOpen={Boolean(confirmation)} onClose={() => { if (!sending.current) setConfirmation(null); }}
            onConfirm={submit} isLoading={busy} isDanger={false} maxWidth="680px" panelClassName="cares-ops-modal print:hidden"
            title="Xác nhận nạp tiền thẻ CareS" message="Vui lòng đối chiếu mã thẻ và xác nhận đã nhận đủ tiền trước khi tiếp tục."
            confirmText="Đã thu tiền — Xác nhận nạp" cancelText="Quay lại kiểm tra">
            {confirmation && <div className="mt-5 text-left">
                <dl className="grid gap-4 rounded-xl border p-4" style={{ borderColor: 'var(--cares-border)', background: 'var(--cares-brand-soft)' }}>
                    <div><dt>Mã thẻ</dt><dd className="font-bold break-all">{confirmation.details.cardCode}</dd></div>
                    <div><dt>Số tiền cộng vào thẻ</dt><dd className="text-2xl font-bold" style={{ color: 'var(--cares-brand-strong)' }}>{money(confirmation.details.amount)}</dd></div>
                    <div><dt>Phương thức thu</dt><dd className="font-semibold">{methodLabel[confirmation.details.paymentMethod]}</dd></div>
                </dl>
                <p className="mt-4">Số dư được cộng đúng bằng số tiền nạp. Chỉ in phiếu khi hệ thống báo thành công.</p>
                {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
            </div>}
        </ConfirmModal>
    </div></CashierLayout>;
}

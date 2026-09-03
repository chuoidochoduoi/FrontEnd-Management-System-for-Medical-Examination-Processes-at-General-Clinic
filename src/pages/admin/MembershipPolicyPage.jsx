import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';
const get = k => localStorage.getItem(k) || sessionStorage.getItem(k);
const headers = () => ({ Authorization: `Bearer ${get('token')}`, 'Content-Type': 'application/json' });
const base = () => `${import.meta.env.VITE_API_URL}/api/v1/membership-cards`;
const money = n => `${new Intl.NumberFormat('vi-VN').format(Number(n || 0))} đ`;

export default function MembershipPolicyPage() {
  const [form, setForm] = useState({ minimumTopUp: 1000000, discountPercent: 15, validityMonths: 12 });
  const [ledger, setLedger] = useState([]);
  const load = () => {
    fetch(`${base()}/policy`, { headers: headers() }).then(r => r.json()).then(setForm);
    fetch(`${base()}/ledger?size=30`, { headers: headers() }).then(r => r.json()).then(d => setLedger(d.content || []));
  };
  useEffect(load, []);
  const save = async () => {
    const r = await fetch(`${base()}/policy`, { method: 'PUT', headers: headers(), body: JSON.stringify(form) });
    const d = await r.json().catch(() => ({}));
    r.ok ? toast.success('Đã cập nhật chính sách cho lần kích hoạt/gia hạn tiếp theo.') : toast.error(d.message || 'Không thể cập nhật.');
  };
  const reverse = async row => {
    const reason = window.prompt('Nhập lý do hoàn tác giao dịch thẻ:');
    if (!reason?.trim()) return;
    const r = await fetch(`${base()}/ledger/${row.ledgerId}/reverse`, { method: 'POST', headers: headers(), body: JSON.stringify({ reason, idempotencyKey: crypto.randomUUID() }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return toast.error(d.message || 'Không thể hoàn tác.');
    toast.success('Đã hoàn số tiền về thẻ.'); load();
  };
  return <AdminLayout><div className="space-y-6">
    <header><h1 className="text-3xl font-bold">Chính sách thẻ trả trước</h1><p className="text-gray-500">Thay đổi không hồi tố quyền lợi đã kích hoạt.</p></header>
    <section className="grid gap-5 rounded-2xl border bg-white p-7 md:grid-cols-3">
      {[['minimumTopUp','Mức nạp kích hoạt'],['discountPercent','Ưu đãi (%)'],['validityMonths','Thời hạn (tháng)']].map(([key,label]) => <label key={key} className="font-medium">{label}<input type="number" value={form[key] ?? ''} onChange={e => setForm({...form,[key]:Number(e.target.value)})} className="mt-2 h-12 w-full rounded-xl border px-4"/></label>)}
      <div className="md:col-span-3"><button onClick={save} className="rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white">Lưu chính sách</button></div>
    </section>
    <section className="rounded-2xl border bg-white"><div className="border-b p-5"><h2 className="text-xl font-bold">Sổ giao dịch thẻ</h2><p className="text-gray-500">Chỉ hoàn tác thanh toán do sai sót khi dịch vụ chưa bắt đầu.</p></div><div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-50 text-left"><th className="p-4">Thời gian</th><th className="p-4">Mã thẻ</th><th className="p-4">Loại</th><th className="p-4">Số tiền</th><th className="p-4">Thao tác</th></tr></thead><tbody>{ledger.map(row => <tr key={row.ledgerId} className="border-t"><td className="p-4">{new Date(row.createdAt).toLocaleString('vi-VN')}</td><td className="p-4">{row.cardCode}</td><td className="p-4">{row.type}</td><td className="p-4">{money(row.amount)}</td><td className="p-4">{row.type === 'PAYMENT' && <button onClick={() => reverse(row)} className="text-red-600 hover:underline">Hoàn tác</button>}</td></tr>)}</tbody></table></div></section>
  </div></AdminLayout>;
}

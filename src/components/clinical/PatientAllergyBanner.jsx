import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldQuestion, X } from 'lucide-react';
import { toast } from 'react-toastify';

const EMPTY = { status: 'UNVERIFIED', items: [] };

export default function PatientAllergyBanner({
    recordId,
    value,
    editable = false,
    currentLabel = false,
    historicalContext = false,
    onChange,
    openEditorSignal,
    className = '',
}) {
    const [allergy, setAllergy] = useState(value || EMPTY);
    const [editing, setEditing] = useState(false);
    const [items, setItems] = useState([]);
    const [input, setInput] = useState('');
    const [noneReported, setNoneReported] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => setAllergy(value || EMPTY), [value]);

    const openEditor = () => {
        setItems(allergy.items || []);
        setNoneReported(allergy.status === 'NONE_REPORTED');
        setInput('');
        setEditing(true);
    };

    useEffect(() => {
        if (editable && openEditorSignal) openEditor();
        // The signal is an event counter controlled by the parent.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openEditorSignal]);

    const addItem = () => {
        const clean = input.trim().replace(/\s+/g, ' ');
        if (!clean) return;
        if (clean.length > 100) return toast.error('Mỗi dị ứng không được vượt quá 100 ký tự.');
        if (items.length >= 20) return toast.error('Danh sách dị ứng không được vượt quá 20 mục.');
        if (!items.some(item => item.toLowerCase() === clean.toLowerCase())) setItems([...items, clean]);
        setNoneReported(false);
        setInput('');
    };

    const save = async () => {
        if (!noneReported && items.length === 0) return toast.error('Hãy nhập dị ứng hoặc xác nhận không ghi nhận dị ứng.');
        if (allergy.status !== 'UNVERIFIED' && !window.confirm('Bạn có chắc muốn cập nhật lại thông tin dị ứng hiện tại?')) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-records/${recordId}/patient-allergies`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: noneReported ? 'NONE_REPORTED' : 'REPORTED', items: noneReported ? [] : items }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.message || 'Không thể cập nhật dị ứng.');
            setAllergy(body);
            onChange?.(body);
            setEditing(false);
            toast.success('Đã cập nhật thông tin dị ứng.');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const status = allergy?.status || 'UNVERIFIED';
    const styles = status === 'REPORTED'
        ? { wrap: 'border-red-200 bg-red-50', icon: <AlertTriangle className="text-red-600" size={21}/>, title: 'Có ghi nhận dị ứng', text: 'text-red-800' }
        : status === 'NONE_REPORTED'
            ? { wrap: 'border-emerald-200 bg-emerald-50', icon: <CheckCircle2 className="text-emerald-600" size={21}/>, title: 'Đã xác nhận chưa ghi nhận dị ứng', text: 'text-emerald-800' }
            : { wrap: 'border-amber-200 bg-amber-50', icon: <ShieldQuestion className="text-amber-600" size={21}/>, title: 'Chưa xác minh dị ứng', text: 'text-amber-800' };

    return <>
        <section className={`rounded-2xl border p-4 ${styles.wrap} ${className}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 shrink-0">{styles.icon}</div>
                    <div className="min-w-0">
                        <p className={`text-sm font-bold ${styles.text}`}>{currentLabel ? `Dị ứng hiện tại — ${styles.title}` : styles.title}</p>
                        {historicalContext && <p className="mt-1 text-xs text-slate-500">Đây là dữ liệu hiện tại, không phải thông tin được chụp lại tại thời điểm khám cũ.</p>}
                        {status === 'REPORTED' && <div className="mt-2 flex flex-wrap gap-2">{(allergy.items || []).map(item => <span key={item} className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700">{item}</span>)}</div>}
                        {status === 'UNVERIFIED' && <p className="mt-1 text-xs text-amber-700">Cần xác minh trước khi lưu đơn thuốc.</p>}
                        <p className={`mt-2 text-xs font-semibold leading-5 ${styles.text}`}>
                            An toàn kê đơn: hỏi lại bệnh nhân hoặc người giám hộ về tác nhân, biểu hiện và thời điểm phản ứng; không dựa duy nhất vào dữ liệu đã khai báo.
                        </p>
                    </div>
                </div>
                {editable && recordId && <button type="button" onClick={openEditor} className="shrink-0 rounded-lg border border-current/20 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white">Cập nhật</button>}
            </div>
        </section>

        {editing && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={() => setEditing(false)}>
            <section className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onMouseDown={event => event.stopPropagation()}>
                <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="font-bold text-slate-900">Xác minh dị ứng</h3><p className="mt-1 text-xs text-slate-500">Thông tin này được dùng trong các lần khám tiếp theo.</p></div><button type="button" onClick={() => setEditing(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18}/></button></header>
                <div className="space-y-4 p-5">
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                        <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={17}/>
                        <span>Đối chiếu trực tiếp với bệnh nhân/người giám hộ. Nhập riêng từng tác nhân cụ thể; không nhập triệu chứng hoặc nội dung “không rõ”.</span>
                    </div>
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" checked={noneReported} onChange={event => { setNoneReported(event.target.checked); if (event.target.checked) setItems([]); }}/><span>Đã xác nhận chưa ghi nhận dị ứng</span></label>
                    {!noneReported && <>
                        <div className="flex gap-2"><input value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addItem(); } }} placeholder="Ví dụ: Penicillin" className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary-400"/><button type="button" onClick={addItem} className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">Thêm</button></div>
                        <div className="flex min-h-12 flex-wrap gap-2 rounded-xl border border-dashed border-slate-200 p-3">{items.length ? items.map(item => <button type="button" key={item} onClick={() => setItems(items.filter(value => value !== item))} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">{item}<X size={12}/></button>) : <span className="text-xs text-slate-400">Chưa thêm dị ứng nào.</span>}</div>
                    </>}
                </div>
                <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4"><button type="button" onClick={() => setEditing(false)} className="h-9 rounded-xl px-4 text-sm text-slate-600">Hủy</button><button type="button" disabled={saving} onClick={save} className="h-9 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu xác minh'}</button></footer>
            </section>
        </div>}
    </>;
}

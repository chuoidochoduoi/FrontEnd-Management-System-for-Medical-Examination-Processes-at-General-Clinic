import { useEffect, useState } from 'react';
import { AlertCircle, Beaker, Clock3, RefreshCw, X } from 'lucide-react';

import ClinicalDataDisplay from '@/components/clinical/ClinicalDataDisplay';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const authHeader = () => ({ Authorization: `Bearer ${get('token')}` });

const statusLabel = status => ({
    PENDING: 'Chờ thực hiện',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
}[status] || 'Chưa đến lượt');

/** Read-only result view for a parent laboratory panel. It deliberately stays
 * in the examination screen, rather than sending a doctor into the Lab flow. */
export default function LabPanelResultReviewModal({ representativeId, onClose }) {
    const [panel, setPanel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        if (!representativeId) return undefined;
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                const response = await fetch(
                    `${apiBase}/api/v1/test-requests/${representativeId}/panel-workbench`,
                    { headers: authHeader(), signal: controller.signal }
                );
                if (!response.ok) throw new Error('Không thể tải phiếu xét nghiệm theo gói.');
                const body = await response.json();
                if (!controller.signal.aborted) setPanel(body?.data ?? body?.result ?? body);
            } catch (loadError) {
                if (loadError.name !== 'AbortError') setError(loadError.message || 'Không thể tải kết quả.');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        load();
        return () => controller.abort();
    }, [representativeId, retry]);

    useEffect(() => {
        if (!representativeId) return undefined;
        const previousOverflow = document.body.style.overflow;
        const onKeyDown = event => { if (event.key === 'Escape') onClose?.(); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [representativeId, onClose]);

    if (!representativeId) return null;
    const completed = panel?.purchasedCount > 0 && panel.completedCount === panel.purchasedCount;

    return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-3 sm:p-6"
        role="dialog" aria-modal="true" aria-labelledby="lab-panel-result-title"
        onMouseDown={event => { if (event.target === event.currentTarget) onClose?.(); }}>
        <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={event => event.stopPropagation()}>
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Beaker size={22} /></span>
                    <div className="min-w-0"><p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Kết quả xét nghiệm theo gói</p><h2 id="lab-panel-result-title" className="mt-1 truncate text-2xl font-bold text-slate-900">{panel?.panelName || 'Đang tải phiếu xét nghiệm'}</h2><p className="mt-1 text-sm text-slate-500">Đã mua {panel?.purchasedCount ?? 0}/{panel?.totalAnalyteCount ?? 0} chỉ số · Hoàn thành {panel?.completedCount ?? 0}/{panel?.purchasedCount ?? 0}</p></div>
                </div>
                <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng chi tiết kết quả"><X size={22} /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                {loading ? <div className="flex min-h-[300px] items-center justify-center gap-3 text-slate-500"><RefreshCw size={22} className="animate-spin" /> Đang tải kết quả...</div>
                    : error ? <div className="flex min-h-[300px] flex-col items-center justify-center text-center"><AlertCircle size={36} className="text-red-500" /><p className="mt-3 font-semibold text-slate-800">{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-4 rounded-xl border px-4 py-2 font-semibold text-teal-700">Thử lại</button></div>
                        : <>
                            <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="font-bold text-slate-900">Các chỉ số đã đặt</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{(panel?.analytes || []).filter(item => item.purchased).map(item => <div key={item.testRequestId || item.fieldKey} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"><span className="font-semibold text-slate-800">{item.name}</span><span className={`text-sm font-semibold ${item.status === 'COMPLETED' ? 'text-emerald-700' : 'text-amber-700'}`}>{statusLabel(item.status)}</span></div>)}</div></section>
                            {!completed ? <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><Clock3 className="shrink-0 text-amber-700" /><div><h3 className="font-bold text-amber-900">Kết quả chưa công bố đầy đủ</h3><p className="mt-1 leading-6 text-amber-800">Bác sĩ chỉ xem dữ liệu chuyên môn sau khi phòng cận lâm sàng hoàn thành toàn bộ chỉ số đã đặt trong gói.</p></div></div></section>
                                : panel?.clinicalForm?.schema ? <div className="mt-4"><ClinicalDataDisplay clinicalForm={panel.clinicalForm} schema={panel.clinicalForm.schema} values={panel.resultData || {}} title={panel.clinicalForm.templateName || panel.panelName || 'Kết quả chuyên môn'} /></div>
                                    : <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">Phiếu chưa có biểu mẫu kết quả có cấu trúc.</section>}
                        </>}
            </div>
            <footer className="flex justify-end border-t border-slate-200 px-5 py-4"><button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-teal-600 px-6 font-bold text-white">Đóng</button></footer>
        </div>
    </div>;
}

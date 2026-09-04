import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { availableReportTypes, buildReport, reportCsv, reportPrintHtml } from './reportExport';

export default function ReportExportDialog({ data, mode, defaultType, serviceSearch, roomSearch, onClose }) {
    const dialog = useRef(null);
    const preview = useRef(null);
    const availableTypes = useMemo(() => availableReportTypes(data), [data]);
    const [selectedType, setType] = useState(defaultType);
    const type = availableTypes.some(([key]) => key === selectedType) ? selectedType : availableTypes[0]?.[0];
    const [all, setAll] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewReady, setPreviewReady] = useState(false);
    const [printError, setPrintError] = useState('');
    const report = useMemo(() => type ? buildReport(data, type, { serviceSearch, roomSearch, all }) : null, [data, type, serviceSearch, roomSearch, all]);
    const html = useMemo(() => report ? reportPrintHtml(report) : '', [report]);
    const relatedSearch = type === 'services' ? serviceSearch : type === 'rooms' ? roomSearch : '';
    useEffect(() => {
        const element = dialog.current;
        const originalOverflow = document.body.style.overflow;
        const originalFocus = document.activeElement;
        document.body.style.overflow = 'hidden';
        element.showModal();
        return () => { element.close(); document.body.style.overflow = originalOverflow; originalFocus?.focus(); };
    }, []);
    function download() {
        if (!report.rows.length) return;
        const url = URL.createObjectURL(new Blob([reportCsv(report)], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `cares-${type}-${report.from}-${report.to}.csv`;
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function print() {
        try { preview.current.contentWindow.focus(); preview.current.contentWindow.print(); }
        catch { setPrintError('Trình duyệt không mở được hộp thoại in. Vui lòng thử lại.'); }
    }
    const control = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900';
    return createPortal(<dialog ref={dialog} aria-labelledby="report-export-title" onCancel={onClose}
        onClick={event => { if (event.target === dialog.current) { const r = dialog.current.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose(); } }}
        style={{ position: 'fixed', inset: 0, margin: 'auto', width: 'calc(100% - 2rem)' }}
        className={'max-h-[92dvh] overflow-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-black/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ' + (showPreview ? 'max-w-6xl' : 'max-w-xl')}>
        <header className="mb-4 flex items-center justify-between gap-4"><h2 id="report-export-title" className="text-lg font-semibold">{mode === 'print' ? 'In báo cáo' : 'Xuất CSV'}</h2><button className={control} onClick={onClose} aria-label="Đóng">✕</button></header>
        {!report ? <p role="status">Chưa có báo cáo để xuất trong kỳ này.</p> : !showPreview ? <>
            <label className="block text-sm">Loại báo cáo<select className={control + ' mt-2 w-full'} value={type} onChange={e => { setType(e.target.value); setAll(false); }}>{availableTypes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Chỉ hiển thị các loại báo cáo có dữ liệu trong kỳ. Tổng quan vẫn có thể hiển thị số 0.</p>
            <dl className="my-5 space-y-2 text-sm"><div><dt className="inline font-medium">Kỳ báo cáo: </dt><dd className="inline">{report.from} – {report.to}</dd></div><div><dt className="inline font-medium">Bộ lọc: </dt><dd className="inline break-words">{report.filter}</dd></div><div><dt className="inline font-medium">Số dòng sẽ xuất: </dt><dd className="inline">{report.rows.length}</dd></div></dl>
            {relatedSearch.trim() && <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} />Bỏ tìm kiếm, xuất toàn bộ trong kỳ</label>}
            <p className="text-sm text-slate-500 dark:text-slate-400">Xuất toàn bộ kết quả đang lọc, không chỉ 10 dòng của trang đang xem.</p>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{report.note}</p>
            {!report.rows.length && <p role="status" className="mt-4 text-amber-700 dark:text-amber-300">Không có dữ liệu phù hợp để xuất.</p>}
            <footer className="mt-5 flex justify-end gap-2"><button className={control} onClick={onClose}>Đóng</button><button className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white disabled:opacity-40" disabled={!report.rows.length} onClick={() => { if (mode === 'csv') download(); else { setPreviewReady(false); setShowPreview(true); } }}>{mode === 'csv' ? 'Tải CSV' : 'Xem trước bản in'}</button></footer>
        </> : <>
            <p className="mb-3 text-sm">A4 {report.landscape ? 'ngang' : 'dọc'} · {report.rows.length} dòng. Có thể bật số trang trong tùy chọn in của trình duyệt.</p>
            <iframe ref={preview} title="Xem trước bản in báo cáo" srcDoc={html} onLoad={() => setPreviewReady(true)} className="h-[65dvh] w-full border bg-white" />
            {printError && <p role="alert" className="mt-2 text-red-600">{printError}</p>}
            <footer className="mt-4 flex justify-end gap-2"><button className={control} onClick={() => setShowPreview(false)}>Quay lại lựa chọn</button><button className={control} disabled={!previewReady} onClick={print}>In báo cáo</button></footer>
        </>}
    </dialog>, document.body);
}

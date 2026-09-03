import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { Printer } from 'lucide-react';
import ReceiptDocument from './ReceiptDocument';
import documentCss from './receiptDocument.css?inline';

/** An isolated A4 screen proof plus an in-flow print portal, outside all app shells. */
export default function ReceiptPreview({ receipt, clinic }) {
    const frame = useRef(null);
    const observer = useRef(null);
    const [height, setHeight] = useState(1123);
    const html = useMemo(() => `<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>
        html, body { margin:0; padding:0; background:white; } body { padding:10mm; width:210mm; box-sizing:border-box; }
        @media print { body#cares-receipt-frame { padding:0; width:190mm; page:caresReceipt; } }
        ${documentCss}</style></head><body id="cares-receipt-frame">${renderToStaticMarkup(<ReceiptDocument receipt={receipt} clinic={clinic}/>)}</body></html>`, [receipt, clinic]);

    useEffect(() => () => observer.current?.disconnect(), []);
    const resize = () => {
        observer.current?.disconnect();
        const body = frame.current?.contentDocument?.body;
        if (!body) return;
        const measure = () => setHeight(Math.max(1123, Math.ceil(body.getBoundingClientRect().height)));
        measure();
        observer.current = new ResizeObserver(measure);
        observer.current.observe(body);
    };

    return <>
        <div className="print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p style={{ color: 'var(--cares-text-muted)', fontSize: 16 }}>Mẫu A4 · In tỷ lệ 100% · Tắt đầu/chân trang của trình duyệt. Danh sách dài tự sang trang khi in.</p>
                <button type="button" className="cares-customer-primary-button cares-ops-primary" onClick={() => window.print()}><Printer size={18}/>In phiếu thu</button>
            </div>
            <div role="region" aria-label="Bản xem trước phiếu thu A4, cuộn ngang trên màn hình nhỏ" tabIndex={0} style={{ width: '100%', overflowX: 'auto', padding: '4px 0 16px' }}>
                <iframe ref={frame} title={receipt.title} srcDoc={html} onLoad={resize} sandbox="allow-same-origin"
                    style={{ display: 'block', width: '210mm', minWidth: '210mm', maxWidth: 'none', height, border: '1px solid #d7e1e5', background: '#fff', margin: '0 auto', boxShadow: '0 8px 24px #102a4314' }}/>
            </div>
        </div>
        {createPortal(<div id="cares-receipt-print-root" style={{ display: 'none' }}><style>{documentCss}</style><ReceiptDocument receipt={receipt} clinic={clinic}/></div>, document.body)}
    </>;
}

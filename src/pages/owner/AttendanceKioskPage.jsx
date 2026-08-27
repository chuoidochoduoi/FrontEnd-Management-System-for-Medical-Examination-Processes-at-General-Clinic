import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Maximize2, QrCode, RefreshCw } from 'lucide-react';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const headers = () => ({ Authorization: `Bearer ${get('token')}` });

export default function AttendanceKioskPage() {
  const [qr, setQr] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/attendance/kiosk-token`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể tạo mã QR điểm danh.');
      setQr(await QRCode.toDataURL(data.value, { width: 520, margin: 2, errorCorrectionLevel: 'M' }));
      setExpiresAt(new Date(data.expiresAt));
      setError('');
    } catch (e) { setError(e.message); }
  };

  useEffect(() => { refresh(); const id = setInterval(refresh, 25000); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setInterval(() => setSeconds(expiresAt ? Math.max(0, Math.ceil((expiresAt - new Date()) / 1000)) : 0), 500); return () => clearInterval(id); }, [expiresAt]);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6 py-8">
      <button onClick={() => document.documentElement.requestFullscreen?.()} className="absolute right-6 top-6 rounded-xl bg-white/10 p-3 hover:bg-white/20" title="Toàn màn hình"><Maximize2 /></button>
      <div className="flex items-center gap-3 text-cyan-300 mb-3"><QrCode size={32}/><h1 className="text-3xl font-bold">Điểm danh nhân viên</h1></div>
      <p className="text-slate-300 mb-7">Mở trang Điểm danh trên điện thoại và quét mã đang hiển thị</p>
      <div className="rounded-3xl bg-white p-5 shadow-2xl shadow-cyan-500/20 min-h-[420px] min-w-[420px] flex items-center justify-center">
        {qr ? <img src={qr} alt="Mã QR điểm danh động" className="h-[400px] w-[400px]"/> : <RefreshCw className="text-slate-500 animate-spin"/>}
      </div>
      <p className="mt-5 text-lg">Mã tự đổi sau <span className="font-bold text-cyan-300">{seconds} giây</span></p>
      <p className="mt-2 text-sm text-slate-400">Thời gian được ghi nhận theo máy chủ • Không chụp và gửi mã cho người khác</p>
      {error && <p className="mt-5 rounded-xl bg-red-500/20 px-4 py-3 text-red-200">{error}</p>}
    </main>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Clock3, FilePenLine, LogIn, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import CashierLayout from '@/components/layout/CashierLayout';
import OwnerLayout from '@/components/layout/OwnerLayout';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const auth = () => ({ Authorization: `Bearer ${get('token')}` });
const labels = { MORNING:'Ca sáng', AFTERNOON:'Ca chiều', EVENING:'Ca tối', ON_TIME:'Đúng giờ', LATE:'Đi muộn', WORKING:'Đang làm việc', COMPLETED:'Đã hoàn thành', LEFT_EARLY:'Về sớm', ABSENT:'Vắng mặt', ADJUSTMENT_PENDING:'Chờ duyệt điều chỉnh', NOT_CHECKED_IN:'Chưa check-in' };
const time = (v) => v ? new Date(v).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}) : '—';

export default function AttendancePage(){
 const [items,setItems]=useState([]); const [scanning,setScanning]=useState(false); const [adjust,setAdjust]=useState(null); const scanner=useRef(null);
 const load=async()=>{const r=await fetch(`${import.meta.env.VITE_API_URL}/api/v1/attendance/me/today`,{headers:auth()});const d=await r.json();if(r.ok)setItems(d);else toast.error(d.message||'Không thể tải thông tin điểm danh.');};
 useEffect(()=>{load();},[]);
 useEffect(()=>{if(!scanning)return; const q=new Html5Qrcode('attendance-reader');scanner.current=q;q.start({facingMode:'environment'},{fps:10,qrbox:{width:260,height:260}},async text=>{await q.stop();setScanning(false);await scan(text);},()=>{}).catch(e=>{toast.error('Không thể mở camera. Hãy cấp quyền camera.');setScanning(false);});return()=>{if(q.isScanning)q.stop().catch(()=>{});};},[scanning]);
 const scan=async token=>{const r=await fetch(`${import.meta.env.VITE_API_URL}/api/v1/attendance/scan`,{method:'POST',headers:{...auth(),'Content-Type':'application/json'},body:JSON.stringify({token})});const d=await r.json();if(!r.ok)return toast.error(d.message||'Điểm danh không thành công.');toast.success(d.checkOutAt?'Check-out thành công.':'Check-in thành công.');load();};
 const submit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const body={scheduleId:adjust.scheduleId,reason:f.get('reason'),requestedCheckIn:f.get('checkIn')||null,requestedCheckOut:f.get('checkOut')||null};const r=await fetch(`${import.meta.env.VITE_API_URL}/api/v1/attendance/adjustments`,{method:'POST',headers:{...auth(),'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)return toast.error(d.message||'Không thể gửi đề nghị.');toast.success('Đã gửi đề nghị cho quản lý phòng khám.');setAdjust(null);load();};
 const role=get('systemRole')?.toUpperCase();const Layout=role==='RECEPTIONIST'?ReceptionistLayout:role==='CASHIER'?CashierLayout:role==='CLINIC_MANAGER'?OwnerLayout:MedicalStaffLayout;
 return <Layout><div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
  <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Điểm danh</h1><p className="text-sm text-gray-500 mt-1">Check-in và check-out theo ca làm việc hôm nay</p></div><button onClick={()=>setScanning(true)} className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-800"><Camera size={19}/>Quét mã QR</button></div>
  {scanning&&<div className="rounded-2xl border bg-white p-4"><div id="attendance-reader" className="max-w-lg mx-auto"/><button onClick={()=>setScanning(false)} className="block mx-auto mt-3 text-sm text-gray-500">Đóng camera</button></div>}
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(x=><section key={x.scheduleId} className="rounded-2xl border bg-white p-5 shadow-sm">
   <div className="flex justify-between"><div><p className="font-semibold">{labels[x.shift]||x.shift}</p><p className="text-sm text-gray-500 mt-1">{x.scheduledStart?.slice(0,5)} – {x.scheduledEnd?.slice(0,5)}</p></div><span className="h-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{labels[x.status]||x.status}</span></div>
   <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-gray-50 p-3"><LogIn size={16}/><p className="text-gray-500 mt-2">Check-in</p><b>{time(x.checkInAt)}</b></div><div className="rounded-xl bg-gray-50 p-3"><LogOut size={16}/><p className="text-gray-500 mt-2">Check-out</p><b>{time(x.checkOutAt)}</b></div></div>
   <button onClick={()=>setAdjust(x)} className="mt-4 flex items-center gap-2 text-sm text-blue-600"><FilePenLine size={16}/>Đề nghị điều chỉnh</button>
  </section>)}</div>
  {!items.length&&<div className="rounded-2xl border border-dashed bg-white p-12 text-center text-gray-500"><Clock3 className="mx-auto mb-3"/>Hôm nay bạn không có ca làm việc.</div>}
  {adjust&&<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4"><h2 className="text-lg font-bold">Đề nghị điều chỉnh chấm công</h2><div className="grid grid-cols-2 gap-3"><label className="text-sm">Giờ check-in<input name="checkIn" type="datetime-local" className="mt-1 w-full rounded-lg border p-2"/></label><label className="text-sm">Giờ check-out<input name="checkOut" type="datetime-local" className="mt-1 w-full rounded-lg border p-2"/></label></div><label className="text-sm">Lý do<textarea required name="reason" className="mt-1 w-full rounded-lg border p-3" rows="3"/></label><div className="flex justify-end gap-3"><button type="button" onClick={()=>setAdjust(null)}>Hủy</button><button className="rounded-lg bg-slate-900 px-4 py-2 text-white">Gửi đề nghị</button></div></form></div>}
 </div></Layout>;
}

import { useEffect, useState } from 'react';
import { Clock3, MapPin, RefreshCw } from 'lucide-react';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { toast } from 'react-toastify';

const stored = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const label = { BLOCKED:'Chưa đến lượt', WAITING:'Đang chờ', CALLED:'Đã được gọi', IN_PROGRESS:'Đang thực hiện', WAITING_FOR_TEST:'Đang chờ xét nghiệm', TEST_DONE:'Cần quay lại bác sĩ', PENDING:'Đang chờ thực hiện', DONE:'Đã hoàn thành', COMPLETED:'Đã hoàn thành', CANCELLED:'Đã hủy', SKIPPED:'Đã bỏ qua', UNASSIGNED:'Chưa phân luồng' };
const done = new Set(['DONE','COMPLETED']);

export default function WaitingRoomPage() {
    const [journeys,setJourneys]=useState([]), [loading,setLoading]=useState(true);
    const load=async(silent=false)=>{if(!silent)setLoading(true);try{const r=await fetch(`${import.meta.env.VITE_API_URL}/api/patient/my-journeys`,{headers:{Authorization:`Bearer ${stored('token')}`}});const b=await r.json();if(!r.ok)throw new Error(b.message||'Không thể tải hàng chờ');setJourneys(b.data??b)}catch(e){if(!silent)toast.error(e.message)}finally{if(!silent)setLoading(false)}};
    useEffect(()=>{load();const timer=setInterval(()=>load(true),20000);return()=>clearInterval(timer)},[]);
    const current=journeys.find(x=>!['COMPLETED','UNASSIGNED'].includes(x.currentStatus))||journeys[0];
    const activeStep=current?.steps?.find(x=>!['BLOCKED','DONE','COMPLETED','CANCELLED','SKIPPED'].includes(x.status));
    return <CustomerLayout><div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between gap-3"><div><h1 className="text-2xl font-bold text-gray-900">Hành trình của tôi</h1><p className="text-sm text-gray-500 mt-1">Trang tự cập nhật mỗi 20 giây. Vui lòng theo dõi khi số của bạn được gọi.</p></div><button onClick={()=>load()} className="h-10 px-4 border bg-white rounded-xl flex gap-2 items-center text-sm"><RefreshCw size={16}/>Cập nhật</button></div>
        {loading&&<div className="bg-white border rounded-2xl p-12 text-center text-gray-400">Đang tải hàng chờ...</div>}
        {!loading&&!current&&<div className="bg-white border rounded-2xl p-12 text-center text-gray-400">Bạn chưa có lượt khám đã check-in.</div>}
        {!loading&&current&&<>
            <div className="bg-gray-900 text-white rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-5"><div><p className="text-xs text-gray-400">TRẠNG THÁI HIỆN TẠI</p><p className="text-xl font-bold mt-2">{label[current.currentStatus]||current.currentStatus}</p><p className="text-sm text-gray-300 mt-1">{current.currentStep}</p></div><div><p className="text-xs text-gray-400">VỊ TRÍ</p><p className="text-lg font-semibold mt-2 flex gap-2"><MapPin size={20}/>{current.currentRoom}</p></div><div><p className="text-xs text-gray-400">SỐ HÀNG CHỜ</p><p className="text-4xl font-black mt-1">{activeStep?.queueNumber??'-'}</p><p className="text-xs text-gray-400 mt-1">Đã chờ khoảng {current.waitingMinutes} phút</p></div></div>
            {current.currentStatus==='CALLED'&&<div className="border border-amber-300 bg-amber-50 text-amber-800 rounded-xl p-4 font-semibold">Số của bạn đã được gọi. Vui lòng đến {current.currentRoom}.</div>}
            <div className="bg-white border rounded-2xl p-6"><div className="flex justify-between mb-6"><h2 className="font-bold">Các bước trong lượt khám</h2><span className="text-xs text-gray-500">{current.visitCode}</span></div><div>{current.steps.map((step,index)=><div key={step.id} className="flex gap-4"><div className="flex flex-col items-center"><span className={`w-4 h-4 rounded-full border-2 ${done.has(step.status)?'bg-green-500 border-green-500':step.status==='BLOCKED'?'bg-white border-gray-300':'bg-blue-500 border-blue-500'}`}/>{index<current.steps.length-1&&<span className="w-px h-20 bg-gray-200"/>}</div><div className="pb-8 flex-1"><div className="flex justify-between gap-3"><div><p className="font-semibold">{step.serviceName}</p><p className="text-sm text-gray-500">{step.roomName} {step.roomCode?`(${step.roomCode})`:''}</p></div>{step.queueNumber&&<span className="text-sm font-bold">Số {step.queueNumber}</span>}</div><p className="text-xs text-blue-600 mt-1">{label[step.status]||step.status}</p></div></div>)}</div></div>
            <div className="bg-white border rounded-xl p-4 flex gap-3 items-center text-sm text-gray-600"><Clock3 className="text-gray-400"/><span>Bước tiếp theo dự kiến: <b>{current.nextStep||'-'}</b>. Thứ tự có thể được điều chỉnh theo chỉ định chuyên môn.</span></div>
        </>}
    </div></CustomerLayout>;
}

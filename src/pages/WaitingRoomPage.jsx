import React, { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    HelpCircle,
    LogOut,
    Search,
    Bell,
    Plus,
    Mic,
    Printer,
    UserPlus,
    ArrowRight,
    Clock,
    FlaskConical,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

/**
 * HOSPL MEDICAL SYSTEM - DOCTOR'S WAITING ROOM (REACT)
 * Screen: Hospl - Doctor's Waiting Room
 * Role: Doctor / Senior Internist
 */

// --- Mock Data ---
const QUEUE_DATA = [
    { id: 'N-04', name: 'Lê Hoàng Đức', type: 'Emergency', status: 'Waiting', time: '10:42 PM', code: 'BN-26-0012' },
    { id: 'N-05', name: 'Trần Minh Quân', type: 'Normal', status: 'Waiting', time: '10:50 PM', code: 'BN-26-0015' },
    { id: 'N-06', name: 'Phạm Thùy Linh', type: 'Normal', status: 'Processing Lab', time: '11:05 PM', code: 'BN-26-0018' },
    { id: 'N-07', name: 'Nguyễn Anh Tuấn', type: 'Normal', status: 'Waiting', time: '11:15 PM', code: 'BN-26-0021' },
    { id: 'N-08', name: 'Võ Thị Ngọc', type: 'Normal', status: 'Waiting', time: '11:20 PM', code: 'BN-26-0025' },
];

const LAB_COMPLETED = [
    { id: 'N-01', name: 'Nguyễn Văn A', tests: 'X-Quang Phổi • Xét nghiệm máu', status: 'Ready' },
    { id: 'N-03', name: 'Lý Gia Hân', tests: 'Siêu âm bụng tổng quát', status: 'Ready' },
];

// --- Sub-components ---

const SidebarItem = ({ icon: Icon, label, active = false }) => (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${active ? 'bg-[#1ab2a6] text-white' : 'text-slate-500 hover:bg-slate-50'
        }`}>
        <Icon size={20} />
        {label}
    </button>
);

const PatientCard = ({ patient, onCall }) => (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center font-bold text-[#1ab2a6]">
                {patient.id}
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800">{patient.name}</h4>
                    {patient.type === 'Emergency' && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase">Emergency</span>
                    )}
                </div>
                <p className="text-xs text-slate-400 font-medium">
                    {patient.code} • {patient.type === 'Emergency' ? 'Cấp cứu' : 'Khám thường'} • {patient.time}
                </p>
            </div>
        </div>

        {patient.status === 'Processing Lab' ? (
            <div className="px-4 py-2 bg-slate-50 rounded-lg text-slate-400 font-bold text-xs flex flex-col items-center">
                <span>Processing</span>
                <span>Lab</span>
            </div>
        ) : (
            <button
                onClick={onCall}
                className="px-4 py-2 border border-[#1ab2a6] text-[#1ab2a6] rounded-lg font-bold text-xs hover:bg-teal-50 transition-colors"
            >
                Gọi khám
            </button>
        )}
    </div>
);

const LabResultCard = ({ patient }) => (
    <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between border-l-4 border-l-[#1ab2a6]">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h4 className="font-bold text-slate-800">{patient.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{patient.id}</p>
            </div>
            <div className="text-[10px] font-bold text-[#1ab2a6] bg-teal-50 px-2 py-0.5 rounded uppercase">Lab Done</div>
        </div>
        <p className="text-xs text-slate-500 mb-4 line-clamp-1">{patient.tests}</p>
        <button className="flex items-center justify-end gap-1 text-[#1ab2a6] font-bold text-xs hover:underline">
            Xem kết quả <ArrowRight size={14} />
        </button>
    </div>
);

// --- Main Page Component ---

const WaitingRoomPage = () => {
    const [activeTab, setActiveTab] = useState('Waiting');

    return (
        <div className="min-h-screen bg-[#f1f3f6] font-['Plus_Jakarta_Sans',sans-serif] flex">

            {/* Left Sidebar */}
            <aside className="w-64 bg-slate-100 border-r border-slate-200 flex flex-col p-4 fixed h-full z-20">
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="w-8 h-8 bg-[#1ab2a6] rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <Users className="text-white" size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-[#1ab2a6] leading-none">MediFlow</h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">General Clinic P.101</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-3 flex items-center gap-3 mb-8 shadow-sm">
                    <img
                        src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop"
                        className="w-10 h-10 rounded-xl object-cover"
                        alt="Doctor"
                    />
                    <div>
                        <p className="text-xs font-bold text-slate-800">Dr. Julian Vance</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Senior Internist</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem icon={Users} label="Waiting Room" active />
                    <SidebarItem icon={UserPlus} label="Patients" />
                    <SidebarItem icon={FileText} label="Reports" />
                    <SidebarItem icon={Settings} label="Settings" />
                </nav>

                <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
                    <button className="w-full bg-[#1ab2a6] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mb-4 hover:bg-[#169d92] transition-all">
                        <Plus size={18} /> New Examination
                    </button>
                    <SidebarItem icon={HelpCircle} label="Help" />
                    <SidebarItem icon={LogOut} label="Logout" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Search Patients or Records..."
                            className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#1ab2a6]/20 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                            <Bell size={20} />
                        </button>
                    </div>
                </header>

                <div className="p-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-black text-slate-800 mb-1">Phòng Khám Nội Tổng Quát P.101</h1>
                        <p className="text-sm text-slate-400 font-medium">Bác sĩ phụ trách: <span className="font-bold text-slate-600">Dr. Julian Vance</span></p>
                    </div>

                    <div className="flex gap-8 items-start w-full">

                        {/* Left Section: Queue */}
                        <div className="flex-1 space-y-6">

                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Danh sách chuẩn bị kế tiếp</h3>
                                <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                    <button
                                        onClick={() => setActiveTab('Waiting')}
                                        className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'Waiting' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Waiting
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('All')}
                                        className={`px-4 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'All' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        All
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {QUEUE_DATA.map(patient => (
                                    <PatientCard key={patient.id} patient={patient} />
                                ))}
                            </div>
                        </div>

                        {/* Right Section: Active Consultation & Lab Completion */}
                        <div className="flex-1 space-y-8">

                            {/* Active Consultation Box */}
                            <div className="bg-white/60 border border-slate-200 rounded-[32px] p-8 min-h-[350px] relative flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 text-2xl mb-4 border-2 border-slate-200">
                                    0-0
                                </div>
                                <div className="mb-8">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <h3 className="text-xl font-bold text-slate-800">Chưa chọn bệnh nhân</h3>
                                        <span className="text-[10px] font-bold text-white bg-[#1ab2a6] px-3 py-1 rounded-full uppercase">Đang khám</span>
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
                                        Vui lòng gọi bệnh nhân từ danh sách bên trái hoặc nhấn nút bên dưới.
                                    </p>
                                </div>

                                <div className="w-full grid grid-cols-2 gap-8 text-left border-t border-slate-100 pt-8 mt-auto">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Loại khám:</p>
                                        <p className="text-sm font-bold text-slate-700">Chưa xác định</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Thời gian chờ:</p>
                                        <p className="text-sm font-bold text-slate-700">-- : --</p>
                                    </div>
                                </div>

                                <button className="w-full mt-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-300 cursor-not-allowed">
                                    Hoàn thành khám
                                </button>
                            </div>

                            {/* Call Next Action */}
                            <button className="w-full py-8 bg-slate-200 rounded-[32px] flex items-center justify-center gap-4 hover:bg-slate-300 transition-all group">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#1ab2a6] shadow-md group-active:scale-90 transition-transform">
                                    <Mic size={24} />
                                </div>
                                <span className="text-2xl font-black text-slate-800">Mời bệnh nhân kế tiếp</span>
                            </button>

                        </div>




                    </div>
                    {/* Lab Results Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Xét nghiệm hoàn tất – Chờ kết luận</h3>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#1ab2a6] transition-colors"><Printer size={18} /></button>
                                        <button className="p-2 bg-[#1ab2a6] rounded-xl text-white shadow-lg shadow-teal-500/20 active:scale-95 transition-all"><CheckCircle2 size={18} /></button>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    {LAB_COMPLETED.map(patient => (
                                        <LabResultCard key={patient.id} patient={patient} />
                                    ))}
                                </div>
                            </div>
                </div>
            </main>
        </div>
    );
};

export default WaitingRoomPage;

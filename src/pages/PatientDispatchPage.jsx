import React, { useState } from 'react';
import {
    Users,
    Search,
    Bell,
    HelpCircle,
    Settings,
    LogOut,
    LayoutDashboard,
    UserPlus,
    FileText,
    Printer,
    CreditCard,
    MoreVertical,
    Plus,
    ChevronRight,
    Stethoscope,
    Activity,
    Microscope,
    ArrowRightLeft
} from 'lucide-react';

/**
 * HOSPL MEDICAL SYSTEM - PATIENT DISPATCH DASHBOARD (REACT)
 * Screen: Hospl - Patient Dispatch Dashboard
 */

// --- Mock Data ---
const PENDING_PATIENTS = [
    { id: 'BN-25-1102', name: 'Nguyễn Hoàng Long', age: 46, gender: 'Nam', type: 'Tái khám / Bệnh nhân cũ', note: 'Lịch sử: Khám định kỳ Đái tháo đường tuần trước.' },
    { id: 'BN-26-0003', name: 'Phạm Minh Đức', age: 31, gender: 'Nam', type: 'Chờ Cận Lâm Sàng', note: 'Yêu cầu: Siêu âm tim + Điện tâm đồ' }
];

const CLINIC_ROOMS = [
    { id: '101', name: 'Phòng 101 (Tim mạch)', doctor: 'BS. Nguyễn Văn Khải', waiting: 4, type: 'clinical' },
    { id: '102', name: 'Phòng 102 (Nội tiết)', doctor: 'BS. Lê Hoàng Nam', waiting: 1, type: 'clinical' }
];

const LAB_ROOMS = [
    { id: '301', name: 'Phòng 301 (Siêu âm tim)', technician: 'KTV. Hoàng Thu Liên', waiting: 2, type: 'lab' }
];

// --- Sub-components ---

const SidebarItem = ({ icon: Icon, label, active = false }) => (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${active ? 'bg-teal-50 text-[#1ab2a6]' : 'text-slate-500 hover:bg-slate-50'
        }`}>
        <Icon size={20} />
        {label}
    </button>
);

const PatientCard = ({ patient }) => (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex justify-between items-start mb-3">
            <div>
                <span className="text-[10px] font-bold text-[#1ab2a6] bg-teal-50 px-2 py-0.5 rounded uppercase mb-2 inline-block">Mã BN: {patient.id}</span>
                <h4 className="font-black text-slate-800 text-lg leading-tight">{patient.name}</h4>
                <p className="text-xs text-slate-400 font-bold">{patient.age} tuổi | {patient.gender}</p>
            </div>
            <span className={`px-2 py-1 rounded text-[10px] font-bold ${patient.type.includes('Chờ') ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                {patient.type}
            </span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl mb-4">
            <div className="flex gap-2 items-start">
                <Activity size={14} className="text-slate-400 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{patient.note}</p>
            </div>
        </div>
        <button className="w-full py-2.5 bg-[#1ab2a6] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#169d92] transition-all active:scale-95">
            Chọn điều phối
        </button>
    </div>
);

const RoomCard = ({ room }) => (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between hover:border-teal-200 transition-colors shadow-sm">
        <div className="flex justify-between items-start mb-6">
            <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${room.type === 'clinical' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {room.type === 'clinical' ? <Stethoscope size={24} /> : <Microscope size={24} />}
                </div>
                <div>
                    <h4 className="font-black text-slate-800 text-md">{room.name}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{room.doctor || room.technician}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Đang chờ</p>
                <p className="text-2xl font-black text-slate-800 leading-none">{String(room.waiting).padStart(2, '0')}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">người</p>
            </div>
        </div>
        <button className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 text-slate-700 rounded-xl text-xs font-black uppercase hover:bg-teal-50 hover:text-[#1ab2a6] transition-all">
            <ChevronRight size={16} />
            Đẩy vào phòng khám
        </button>
    </div>
);

// --- Main Page Component ---

const DispatchDashboard = () => {
    const [activeTab, setActiveTab] = useState('Bệnh nhân cũ / Chờ CLS (2)');

    return (
        <div className="min-h-screen bg-[#f8f9ff] font-sans flex">

            {/* Sidebar */}
            <aside className="w-56 bg-white border-r border-slate-100 flex flex-col p-4 fixed h-full z-20">
                <div className="flex items-center gap-3 px-2 mb-10">
                    <div className="w-10 h-10 bg-[#1ab2a6] rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <Users className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[#1ab2a6] leading-none">Lễ tân</h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Reception Desk</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Lịch hẹn" />
                    <SidebarItem icon={UserPlus} label="Check-in" active />
                    <SidebarItem icon={FileText} label="Tạo hồ sơ" />
                    <SidebarItem icon={Users} label="Hàng chờ" />
                    <SidebarItem icon={Printer} label="In phiếu" />
                    <SidebarItem icon={CreditCard} label="Thanh toán" />
                </nav>

                <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
                    <SidebarItem icon={Settings} label="Cài đặt" />
                    <SidebarItem icon={LogOut} label="Đăng xuất" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-56 flex-1">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-10">

                    {/* Left */}
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm bệnh nhân hoặc hồ sơ..."
                            className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1ab2a6]/20 transition-all outline-none"
                        />
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-6">
                        <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-800">Lê Văn Reception</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Staff ID: CMS-0021</p>
                            </div>

                            <img
                                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop"
                                className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-50"
                                alt="Profile"
                            />
                        </div>
                    </div>
                </header>

                {/* Content Body */}
                <div className="p-8 max-w-[1600px] mx-auto">

                    {/* Current Dispatch Info Bar */}
                    <div className="bg-slate-900 rounded-[24px] p-4 flex items-center justify-between mb-8 shadow-xl shadow-slate-900/10 text-white">
                        <div className="flex items-center gap-4 px-4">
                            <div className="w-12 h-12 bg-[#1ab2a6] rounded-full flex items-center justify-center">
                                <ArrowRightLeft className="text-white" size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400">Đang chọn điều phối:</p>
                                <h3 className="text-xl font-black">Trần Anh Tuấn <span className="text-sm font-bold text-teal-400 ml-2">(BN-26-0089)</span></h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 px-6 border-l border-white/10">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400">Diện chỉ định:</p>
                                <p className="text-lg font-black text-teal-400">Khám lâm sàng</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-8">

                        {/* Left: Patient List / Lookup */}
                        <section className="col-span-12 xl:col-span-4 space-y-6">
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Tra cứu Bệnh nhân cũ / Tìm kiếm Hồ sơ"
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-[#1ab2a6] focus:bg-white transition-all outline-none"
                                    />
                                </div>

                                <div className="flex p-1 bg-slate-50 rounded-2xl mb-6">
                                    {['Mới tiếp đón (3)', 'Bệnh nhân cũ / Chờ CLS (2)'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${activeTab === tab
                                                    ? 'bg-white text-[#1ab2a6] shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    {PENDING_PATIENTS.map((p, idx) => (
                                        <PatientCard key={idx} patient={p} />
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Right: Room Management */}
                        <section className="col-span-12 xl:col-span-8 space-y-10">

                            {/* Clinical Rooms */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <Stethoscope size={18} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800">Hệ thống phòng khám chuyên khoa lâm sàng</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100">Tự động cập nhật công suất phòng</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {CLINIC_ROOMS.map((room, idx) => (
                                        <RoomCard key={idx} room={room} />
                                    ))}
                                </div>
                            </div>

                            {/* Lab / Diagnostic Rooms */}
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                                        <Microscope size={18} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">Khu chức năng & Cận lâm sàng (Dành cho BN có chỉ định)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {LAB_ROOMS.map((room, idx) => (
                                        <RoomCard key={idx} room={room} />
                                    ))}
                                    {/* <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center p-8 text-slate-300">
                                        <Plus size={32} className="mb-2" />
                                        <p className="text-sm font-bold uppercase tracking-wider">Mở thêm phòng</p>
                                    </div> */}
                                </div>
                            </div>

                        </section>

                    </div>
                </div>
            </main>

            {/* Floating Action Button */}
            {/* <button className="fixed bottom-8 right-8 w-16 h-16 bg-red-500 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-red-500/40 hover:bg-red-600 active:scale-90 transition-all z-50">
                <Plus size={32} />
            </button> */}
        </div>
    );
};

export default DispatchDashboard;

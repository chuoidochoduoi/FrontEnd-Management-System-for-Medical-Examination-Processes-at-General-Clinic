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
    History,
    CheckCircle2,
    Clock,
    User,
    MoreVertical,
    Plus,
    Save,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

/**
 * HOSPL MEDICAL SYSTEM - RECEPTION & PATIENT CHECK-IN (REACT)
 * Screen: Hospl - Reception & Patient Check-in
 */

// --- Mock Data ---
const QUEUE_DATA = [
    { id: 'A001', name: 'Nguyễn Văn A', patientId: 'ID: 240091', room: 'Nội tổng quát', status: 'Waiting', statusLabel: 'Đang chờ', time: '08:30 AM' },
    { id: 'A002', name: 'Trần Văn B', patientId: 'ID: 240092', room: 'Tim mạch', status: 'Processing', statusLabel: 'Đang khám', time: '08:45 AM' },
    { id: 'A003', name: 'Lê Thị C', patientId: 'ID: 240093', room: 'Sản phụ khoa', status: 'Completed', statusLabel: 'Đã khám', time: '09:00 AM' },
    { id: 'A004', name: 'Phạm Văn D', patientId: 'ID: 240094', room: 'Xét nghiệm máu', status: 'Lab', statusLabel: 'Quay lại', time: '09:15 AM' },
    { id: 'A005', name: 'Hoàng Anh E', patientId: 'ID: 240095', room: 'Ngoại khoa', status: 'Waiting', statusLabel: 'Đang chờ', time: '09:30 AM' },
];

// --- Sub-components ---

const SidebarItem = ({ icon: Icon, label, active = false }) => (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${active ? 'bg-teal-50 text-[#1ab2a6]' : 'text-slate-500 hover:bg-slate-50'
        }`}>
        <Icon size={20} />
        {label}
    </button>
);

const StatusBadge = ({ status }) => {
    const styles = {
        Waiting: 'bg-amber-50 text-amber-600 border-amber-100',
        Processing: 'bg-blue-50 text-blue-600 border-blue-100',
        Completed: 'bg-green-50 text-green-600 border-green-100',
        Lab: 'bg-purple-50 text-purple-600 border-purple-100',
    };

    const labels = {
        Waiting: 'Đang chờ',
        Processing: 'Đang khám',
        Completed: 'Đã khám',
        Lab: 'Quay lại',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${styles[status] || styles.Waiting}`}>
            {labels[status] || 'Đang chờ'}
        </span>
    );
};

const InputGroup = ({ label, placeholder, type = "text", className = "" }) => (
    <div className={className}>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">{label}</label>
        <input
            type={type}
            placeholder={placeholder}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1ab2a6]/20 focus:bg-white outline-none transition-all text-slate-700 font-medium"
        />
    </div>
);

// --- Main Page Component ---

const ReceptionPage = () => {
    const [activeTab, setActiveTab] = useState('Chờ khám');

    return (
        <div className="min-h-screen bg-[#f8f9ff] font-sans flex">

            {/* Left Sidebar */}
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
                <div className="p-8 grid grid-cols-12 gap-8 max-w-[1600px] mx-auto">

                    {/* Left: Registration Form */}
                    <section className="col-span-12 xl:col-span-5 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-black text-slate-800">Khởi tạo hồ sơ hành chính</h3>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <InputGroup label="Họ và tên" placeholder="Nhập tên bệnh nhân" />
                                    <InputGroup label="Mã BHYT" placeholder="Nhập số thẻ BHYT" />
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <InputGroup label="Ngày sinh" placeholder="mm/dd/yyyy" type="date" />
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Giới tính</label>
                                        <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1ab2a6]/20">
                                            <option>Nam</option>
                                            <option>Nữ</option>
                                            <option>Khác</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Nhóm máu</label>
                                        <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1ab2a6]/20">
                                            <option>A+</option>
                                            <option>B+</option>
                                            <option>O+</option>
                                            <option>AB+</option>
                                            <option>A-</option>
                                            <option>B-</option>
                                            <option>O-</option>
                                            <option>AB-</option>
                                        </select>
                                    </div>
                                </div>

                                <InputGroup label="Số điện thoại" placeholder="09xx xxx xxx" />
                                <InputGroup label="Địa chỉ" placeholder="Nhập địa chỉ thường trú" />

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Lý do khám / triệu chứng ban đầu</label>
                                    <textarea
                                        placeholder="Mô tả tóm tắt tình trạng bệnh nhân..."
                                        className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-[#1ab2a6]/20 focus:bg-white outline-none transition-all text-slate-700 font-medium resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <InputGroup label="Dị ứng" placeholder="Thực phẩm, thuốc..." />
                                    <InputGroup label="Tiền sử bệnh lý" placeholder="Tiểu đường, tim mạch..." />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Loại khám</label>
                                        <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1ab2a6]/20">
                                            <option>Khám tổng quát</option>
                                            <option>Khám chuyên khoa</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Chuyên khoa đăng ký</label>
                                        <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1ab2a6]/20">
                                            <option>Nội tổng quát</option>
                                            <option>Tim mạch</option>
                                            <option>Nhi khoa</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Phí khám dự kiến:</p>
                                        <p className="text-2xl font-black text-[#1ab2a6]">300,000 VND</p>
                                    </div>
                                    <button className="bg-[#1ab2a6] text-white px-10 py-4 rounded-2xl font-black text-md shadow-lg shadow-teal-500/30 hover:bg-[#169d92] active:scale-95 transition-all flex items-center gap-3">
                                        <Save size={20} />
                                        Lưu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Right: Today's Queue */}
                    <section className="col-span-12 xl:col-span-7 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                <h3 className="text-lg font-black tracking-wider">Danh sách tiếp đón hôm nay</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black">45</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Bệnh nhân</span>
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-2">
                                {['Chờ khám', 'Đang khám', 'Đã khám', 'Tái khám', 'Chuyển phòng', 'Hủy'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === tab
                                            ? 'bg-[#1ab2a6] text-white shadow-md shadow-teal-500/20'
                                            : 'text-slate-500 hover:bg-white hover:shadow-sm'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Queue Table */}
                            <div className="flex-1 overflow-auto p-4">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left border-b border-slate-50">
                                            <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">STT</th>
                                            <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ tên</th>
                                            <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phòng</th>
                                            <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                            <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {QUEUE_DATA.map((item) => (
                                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-6 px-4 font-black text-[#1ab2a6] text-sm">{item.id}</td>
                                                <td className="py-6 px-4">
                                                    <p className="font-black text-slate-700 text-sm leading-tight">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{item.patientId}</p>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <p className="font-bold text-slate-700 text-sm">{item.room}</p>
                                                </td>
                                                <td className="py-6 px-4">
                                                    <StatusBadge status={item.status} />
                                                </td>
                                                <td className="py-6 px-4">
                                                    <div className="flex items-center gap-2">
                                                        {item.status === 'Waiting' ? (
                                                            <>
                                                                <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-semibold hover:bg-blue-100 transition-colors">Điều phối</button>
                                                                <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-semibold hover:bg-red-100 transition-colors">Hủy</button>
                                                            </>
                                                        ) : (
                                                            <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold hover:bg-slate-200 transition-colors">Xem hồ sơ</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer / Pagination */}
                            <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Chờ: 12</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Đang khám: 08</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Đã khám: 25</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        <button className="p-1.5 text-slate-400 hover:text-slate-800 transition-colors"><ChevronLeft size={20} /></button>
                                        <span className="text-xs font-black text-slate-800 px-2">1 / 5</span>
                                        <button className="p-1.5 text-slate-400 hover:text-slate-800 transition-colors"><ChevronRight size={20} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
};

export default ReceptionPage;

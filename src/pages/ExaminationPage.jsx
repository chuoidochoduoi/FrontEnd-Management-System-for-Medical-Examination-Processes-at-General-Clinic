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
    Minus,
    Activity,
    Thermometer,
    Heart,
    AlertCircle,
    Clock,
    FlaskConical,
    Pill,
    CheckCircle2,
    ChevronRight,
    MoreVertical,
    X,
    Stethoscope,
    Printer,
    Save
} from 'lucide-react';

/**
 * HOSPL MEDICAL SYSTEM - DOCTOR'S EXAMINATION SCREEN
 * Screen: Hospl - Doctor's Examination (Production UI)
 */

const COLORS = {
    primary: '#1ab2a6',
    primaryHover: '#169d92',
    surface: '#f8f9ff',
    cardBg: '#ffffff',
    textMain: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
};

// --- Sub-components ---

const SidebarItem = ({ icon: Icon, label, active = false }) => (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${active ? 'bg-[#1ab2a6] text-white' : 'text-slate-500 hover:bg-slate-50'
        }`}>
        <Icon size={20} />
        {label}
    </button>
);

const VitalCard = ({ icon: Icon, label, value, unit, colorClass }) => (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                <Icon className={colorClass.replace('bg-', 'text-')} size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500">{label}</span>
        </div>
        <div className="text-right">
            <span className="text-lg font-black text-slate-800">{value}</span>
            <span className="text-xs font-bold text-slate-400 ml-1">{unit}</span>
        </div>
    </div>
);

const RequestItem = ({ label, onRemove }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <button onClick={onRemove} className="text-slate-300 hover:text-red-500 transition-colors">
            <X size={16} />
        </button>
    </div>
);

const PrescriptionItem = ({ name, type, dosage, qty, onRemove }) => (
    <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-1">
            <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase">{type}</span>
        </div>
        <p className="text-xs text-slate-500 mb-2">{dosage}</p>
        <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Qty: {qty}</p>
            <button onClick={onRemove} className="text-slate-300 hover:text-red-500 transition-colors">
                <X size={16} />
            </button>
        </div>
    </div>
);

// --- Main Page Component ---

const ExaminationPage = () => {
    const [labRequests, setLabRequests] = useState(['Full Blood Count (FBC)', 'Troponin T Test', 'Lipid Profile']);
    const [prescriptions, setPrescriptions] = useState([
        { name: 'Aspirin 81mg', type: 'Oral', dosage: '1 tablet daily after food', qty: 30 },
        { name: 'Atorvastatin 20mg', type: 'Oral', dosage: '1 tablet at bedtime', qty: 30 }
    ]);

    return (
        <div className="min-h-screen bg-[#f1f3f6] font-['Plus_Jakarta_Sans',sans-serif] flex">

            {/* Sidebar Navigation */}
            <aside className="w-64 bg-slate-100 border-r border-slate-200 flex flex-col p-4 fixed h-full z-20">
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="w-8 h-8 bg-[#1ab2a6] rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <Activity className="text-white" size={20} />
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
                        <p className="text-xs font-bold text-slate-800">Dr. Adrian Miller</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Senior Consultant</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem icon={Stethoscope} label="Examination" active />
                    <SidebarItem icon={Users} label="Patients" />
                    <SidebarItem icon={FileText} label="Reports" />
                    <SidebarItem icon={Settings} label="Settings" />
                </nav>

                <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
                    <SidebarItem icon={HelpCircle} label="Help" />
                    <SidebarItem icon={LogOut} label="Logout" />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="ml-64 flex-1">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Search Patient ID, Name, or ICD-10..."
                            className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#1ab2a6]/20 transition-all outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                <div className="p-8 max-w-[1600px] mx-auto">
                    <div className="grid grid-cols-12 gap-6">

                        {/* Left Column: Patient Profile & Vitals */}
                        <div className="col-span-12 xl:col-span-3 space-y-6">
                            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm text-center">
                                <div className="relative inline-block mb-4">
                                    <img
                                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop"
                                        className="w-24 h-24 rounded-3xl object-cover ring-4 ring-slate-50"
                                        alt="Patient"
                                    />
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Emergency</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-1">Nguyen Van An</h3>
                                <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">BN-26-0003</p>

                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    <div className="bg-slate-50 p-3 rounded-2xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Age</p>
                                        <p className="text-sm font-black text-slate-700">33 Years</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Blood</p>
                                        <p className="text-sm font-black text-slate-700">O+</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <VitalCard icon={Heart} label="Heart Rate" value="82" unit="bpm" colorClass="bg-red-500" />
                                    <VitalCard icon={Thermometer} label="Temperature" value="37.5" unit="°C" colorClass="bg-orange-500" />
                                    <VitalCard icon={Activity} label="BP" value="120/80" unit="" colorClass="bg-blue-500" />
                                </div>
                            </div>

                            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Allergies & History</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600">
                                        <AlertCircle size={18} />
                                        <span className="text-xs font-bold">Penicillin Allergy</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600">
                                        <Clock size={18} />
                                        <span className="text-xs font-bold">Hypertension (since 2021)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Column: Examination Entry */}
                        <div className="col-span-12 xl:col-span-6 space-y-6">
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm h-full flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-[#1ab2a6]">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800">Medical Record Entry</h2>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Ref: EXAM-4492-Z • General Session</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-8">
                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText className="text-[#1ab2a6]" size={18} />
                                            <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">1. Subjective Symptoms & Reason for Visit</h4>
                                        </div>
                                        <h6>Subjective Symptoms & Reason for Visit</h6>

                                    </section>

                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Stethoscope className="text-[#1ab2a6]" size={18} />
                                            <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">2. Physical Examination Findings</h4>
                                        </div>
                                        <textarea
                                            placeholder="Respiratory, Cardiovascular, Neurological findings..."
                                            className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1ab2a6]/20 transition-all text-sm resize-none"
                                        />
                                    </section>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">ICD-10 Code</label>
                                            <input type="text" defaultValue="I21.9" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold text-slate-700" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Primary Diagnosis *</label>
                                            <input type="text" defaultValue="Acute myocardial infarction, unspecified" className="w-full p-4 bg-white border border-[#1ab2a6] rounded-2xl outline-none text-sm font-bold text-slate-700" />
                                        </div>
                                    </div>

                                    <section>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 ml-1">Treatment Disposition</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <button className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 hover:border-[#1ab2a6] hover:bg-teal-50 transition-all group">
                                                <HelpCircle className="mb-2 text-slate-300 group-hover:text-[#1ab2a6]" />
                                                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800">Home/Rx</span>
                                            </button>
                                            <button className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 hover:border-[#1ab2a6] hover:bg-teal-50 transition-all group">
                                                <Activity className="mb-2 text-slate-300 group-hover:text-[#1ab2a6]" />
                                                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800">Admit</span>
                                            </button>
                                            <button className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 hover:border-[#1ab2a6] hover:bg-teal-50 transition-all group">
                                                <LogOut className="mb-2 text-slate-300 group-hover:text-[#1ab2a6]" />
                                                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800">Transfer</span>
                                            </button>
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText className="text-[#1ab2a6]" size={18} />
                                            <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">Instructions/Notes</h4>
                                        </div>
                                        <textarea
                                            placeholder="Enter instructions,notes, etc..."
                                            className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#1ab2a6]/20 transition-all text-sm resize-none"
                                        />
                                    </section>
                                </div>

                                <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex gap-3">
                                        <button className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-50 transition-all">Discard</button>
                                        <button className="px-6 py-3 border border-[#1ab2a6] rounded-xl text-sm font-bold text-[#1ab2a6] hover:bg-teal-50 transition-all flex items-center gap-2">
                                            <Printer size={18} /> Save Draft
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <button className="mt-2 ml-2 px-10 py-4 bg-[#1ab2a6] text-white rounded-2xl text-md font-black shadow-lg shadow-teal-500/30 hover:bg-[#169d92] active:scale-95 transition-all flex items-center">
                                            <CheckCircle2 size={20} />
                                            Complete Examination
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Labs & Prescriptions */}
                        <div className="col-span-12 xl:col-span-3 space-y-6">
                            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-[#1ab2a6]">
                                        <FlaskConical size={18} />
                                        <h4 className="text-sm font-black uppercase tracking-tight">Laboratory Request</h4>
                                    </div>
                                    <button className="text-[#1ab2a6] hover:bg-teal-50 p-1 rounded-lg transition-colors">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {labRequests.map((req, idx) => (
                                        <RequestItem key={idx} label={req} onRemove={() => setLabRequests(labRequests.filter((_, i) => i !== idx))} />
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-[32px] p-6 border-2 shadow-sm relative">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <Pill size={18} className="text-blue-500" />
                                        <h4 className="text-sm font-black uppercase tracking-tight">Prescription</h4>
                                    </div>
                                    <button className="text-blue-500 hover:bg-teal-50 p-1 rounded-lg transition-colors">
                                        <Plus size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {prescriptions.map((pill, idx) => (
                                        <PrescriptionItem key={idx} {...pill} onRemove={() => setPrescriptions( prescriptions.filter((_, i) => i !== idx))}/>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default ExaminationPage;

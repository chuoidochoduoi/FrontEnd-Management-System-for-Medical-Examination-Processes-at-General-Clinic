import React from 'react';
import { 
  User, 
  Calendar, 
  FileText, 
  FlaskConical, 
  Pill, 
  CreditCard, 
  LayoutDashboard, 
  Settings, 
  HelpCircle,
  Bell,
  Search,
  Download,
  MoreVertical,
  Plus,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

/**
 * PRODUCTION-READY ARCHITECTURE FOR HOSPL MEDICAL SYSTEM
 * SCREEN: Patient Profile (Desktop)
 */

// --- Constants & Mock Data ---
const COLORS = {
  primary: '#1ab2a6',
  primaryHover: '#169d92',
  surface: '#f8f9ff',
  cardBg: '#ffffff',
  textMain: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
};

const NAVIGATION = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'records', label: 'Medical Records', icon: FileText },
  { id: 'labs', label: 'Laboratory Results', icon: FlaskConical },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'profile', label: 'Profile', icon: User, active: true },
];

const PATIENT_DATA = {
  summary: {
    name: 'Nguyen Van A',
    id: 'HS-2024-001',
    bloodType: 'O+',
    insuranceStatus: 'Active',
    status: 'Active Patient',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1974&auto=format&fit=crop'
  },
  personal: {
    dob: '15 May 1992 (32 Years)',
    gender: 'Male',
    phone: '+84 (0) 90 123 4567',
    email: 'vana.nguyen@email.com',
    address: '123 Le Loi Street, Ben Thanh Ward, District 1, HCMC',
    emergencyContact: 'Le Thi B (Wife) - +84 (0) 91 987 6543'
  },
  medical: {
    height: '178 cm',
    weight: '72 kg',
    bmi: '22.7 (Normal)',
    allergies: ['None reported'],
    chronicDiseases: ['None reported'],
    medications: ['Multivitamins (Daily)']
  },
  appointments: [
    { doctor: 'Dr. Tran Thi C', dept: 'General Medicine', date: 'Oct 12, 2024', status: 'Completed' },
    { doctor: 'Dr. Le Van D', dept: 'Cardiology', date: 'Nov 05, 2024', status: 'Scheduled' }
  ],
  prescriptions: [
    { name: 'Paracetamol 500mg', dosage: '1 tablet, 2x daily after meal', duration: '7 Days', status: 'Active' },
    { name: 'Amoxicillin 250mg', dosage: '1 tablet, 3x daily', duration: 'Completed on Oct 21', status: 'Ended' }
  ],
  labResults: [
    { test: 'Complete Blood Count', date: 'Oct 14, 2024', status: 'Normal' },
    { test: 'Lipid Profile', date: 'Sep 28, 2024', status: 'Attention Required' }
  ]
};

// --- Reusable UI Components ---

const Card = ({ title, children, extra, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          {title}
        </h3>
        {extra}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Badge = ({ children, variant = 'info' }) => {
  const styles = {
    info: 'bg-teal-50 text-teal-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    neutral: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[variant]}`}>
      {children}
    </span>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-semibold text-slate-700">{value}</p>
  </div>
);

// --- Layout Components ---

const Sidebar = () => (
  <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed h-full z-20">
    <div className="p-8 flex items-center gap-3">
      <div className="w-8 h-8 bg-[#1ab2a6] rounded-lg flex items-center justify-center">
        <ShieldCheck className="text-white w-5 h-5" />
      </div>
      <span className="text-xl font-black text-[#1ab2a6] tracking-tight">Hospl</span>
    </div>
    
    <nav className="flex-1 px-4 space-y-1">
      {NAVIGATION.map((item) => (
        <a
          key={item.id}
          href="#"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
            item.active 
              ? 'bg-teal-50 text-[#1ab2a6]' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <item.icon className="w-5 h-5" />
          {item.label}
        </a>
      ))}
    </nav>

    <div className="p-4 border-t border-slate-50 space-y-1">
      <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 font-bold text-sm">
        <Settings className="w-5 h-5" />
        Settings
      </a>
      <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 font-bold text-sm">
        <HelpCircle className="w-5 h-5" />
        Support
      </a>
    </div>
  </aside>
);

const Header = () => (
  <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-10 ml-64">
    <h1 className="text-2xl font-black text-slate-800">Patient Profile</h1>
    
    <div className="flex items-center gap-6">
      <div className="relative group hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1ab2a6]" />
        <input 
          type="text" 
          placeholder="Search for tests, reports..." 
          className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 w-64 text-sm outline-none focus:ring-2 focus:ring-[#1ab2a6]/20 transition-all"
        />
      </div>
      
      <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
        <Bell className="w-5 h-5" />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
      </button>

      <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
        <div className="text-right">
          <p className="text-sm font-bold text-slate-800">Nguyen Van A</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{PATIENT_DATA.summary.id}</p>
        </div>
        <img src={PATIENT_DATA.summary.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm ring-2 ring-slate-50" alt="Avatar" />
      </div>
    </div>
  </header>
);

// --- Main Screen ---

const PatientProfilePage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif]">
      <Sidebar />
      <Header />
      
      <main className="ml-64 p-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-12 gap-8">
          
          {/* Top Banner / Summary */}
          <Card className="col-span-12 !p-0">
            <div className="flex flex-col md:flex-row items-center gap-8 p-8">
              <div className="relative">
                <img 
                  src={PATIENT_DATA.summary.avatar} 
                  className="w-32 h-32 rounded-3xl object-cover ring-4 ring-teal-50 shadow-lg" 
                  alt="Profile" 
                />
                <div className="absolute -bottom-2 -right-2 bg-[#1ab2a6] p-1.5 rounded-lg shadow-lg">
                  <ShieldCheck className="text-white w-4 h-4" />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-3xl font-black text-slate-800">{PATIENT_DATA.summary.name}</h2>
                  <Badge variant="success">{PATIENT_DATA.summary.status}</Badge>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                  <InfoItem label="Patient ID" value={PATIENT_DATA.summary.id} />
                  <InfoItem label="Blood Type" value={PATIENT_DATA.summary.bloodType} />
                  <InfoItem label="Insurance Status" value={PATIENT_DATA.summary.insuranceStatus} />
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-6 py-3 bg-[#1ab2a6] text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 hover:bg-[#169d92] transition-all active:scale-95 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Book Appointment
                </button>
              </div>
            </div>
          </Card>

          {/* Left Column: Personal & Medical */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <Card title="Personal Information" extra={<button className="text-xs font-bold text-[#1ab2a6] hover:underline">Edit Profile</button>}>
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <InfoItem label="Date of Birth" value={PATIENT_DATA.personal.dob} />
                <InfoItem label="Gender" value={PATIENT_DATA.personal.gender} />
                <InfoItem label="Phone Number" value={PATIENT_DATA.personal.phone} />
                <InfoItem label="Email Address" value={PATIENT_DATA.personal.email} />
                <div className="col-span-2">
                  <InfoItem label="Residential Address" value={PATIENT_DATA.personal.address} />
                </div>
                <div className="col-span-2 pt-4 border-t border-slate-50">
                  <InfoItem label="Emergency Contact" value={PATIENT_DATA.personal.emergencyContact} />
                </div>
              </div>
            </Card>

            <Card title="Medical Information">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Height</p>
                  <p className="text-xl font-black text-slate-800">{PATIENT_DATA.medical.height}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Weight</p>
                  <p className="text-xl font-black text-slate-800">{PATIENT_DATA.medical.weight}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">BMI</p>
                  <p className="text-xl font-black text-teal-600">{PATIENT_DATA.medical.bmi}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-bold text-slate-700">Allergies</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PATIENT_DATA.medical.allergies.map(item => <Badge key={item} variant="neutral">{item}</Badge>)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#1ab2a6]" />
                    <h4 className="text-sm font-bold text-slate-700">Active Medications</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PATIENT_DATA.medical.medications.map(item => <Badge key={item} variant="info">{item}</Badge>)}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Recent Appointments" extra={<button className="text-xs font-bold text-slate-400 hover:text-[#1ab2a6]">View All</button>}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="pb-4 font-bold text-xs text-slate-400 uppercase">Doctor Name</th>
                      <th className="pb-4 font-bold text-xs text-slate-400 uppercase">Department</th>
                      <th className="pb-4 font-bold text-xs text-slate-400 uppercase">Date</th>
                      <th className="pb-4 font-bold text-xs text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {PATIENT_DATA.appointments.map((apt, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-4 font-bold text-slate-700">{apt.doctor}</td>
                        <td className="py-4 text-sm text-slate-600">{apt.dept}</td>
                        <td className="py-4 text-sm text-slate-600">{apt.date}</td>
                        <td className="py-4">
                          <Badge variant={apt.status === 'Completed' ? 'success' : 'info'}>{apt.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right Column: Labs & Prescriptions */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <Card title="Recent Lab Results" extra={<FlaskConical className="w-4 h-4 text-slate-300" />}>
              <div className="space-y-4">
                {PATIENT_DATA.labResults.map((result, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-50 hover:border-teal-100 transition-colors bg-slate-50/30">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800 leading-tight">{result.test}</h4>
                      <Badge variant={result.status === 'Normal' ? 'success' : 'warning'}>
                        {result.status === 'Normal' ? 'NORMAL' : 'ATTENTION'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 font-semibold">{result.date}</p>
                    <button className="w-full py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all">
                      <Download className="w-3 h-3" />
                      Download Report
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Recent Prescriptions">
              <div className="space-y-4">
                {PATIENT_DATA.prescriptions.map((pill, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pill.status === 'Active' ? 'bg-teal-50 text-[#1ab2a6]' : 'bg-slate-100 text-slate-400'}`}>
                      <Pill className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-bold text-slate-800">{pill.name}</h4>
                        <span className={`text-[10px] font-black uppercase ${pill.status === 'Active' ? 'text-green-500' : 'text-slate-400'}`}>{pill.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">{pill.dosage}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Duration: {pill.duration}</p>
                    </div>
                  </div>
                ))}
                <button className="w-full py-3 mt-4 text-xs font-bold text-[#1ab2a6] hover:bg-teal-50 rounded-xl transition-all">
                  View Medication History
                </button>
              </div>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
};

export default PatientProfilePage;

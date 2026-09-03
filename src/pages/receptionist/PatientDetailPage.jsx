import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Edit2 } from 'lucide-react';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { ROUTES } from '@/constants/routes';
import PatientUpdateModal from './PatientUpdateModal';
import PatientAllergyBanner from '@/components/clinical/PatientAllergyBanner';

const token = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const value = (data) => data || '-';

export default function PatientDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const headers = { Authorization: `Bearer ${token()}` };
            const [patientRes, visitsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/receptionist/records/customers/${id}`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/receptionist/records/customers/${id}/visits?page=0&size=100&sort=createdAt,desc`, { headers }),
            ]);
            if (!patientRes.ok || !visitsRes.ok) throw new Error('Không thể tải hồ sơ bệnh nhân.');
            const patientData = await patientRes.json();
            const visitData = await visitsRes.json();
            const rows = visitData.items ?? visitData.content ?? (Array.isArray(visitData) ? visitData : []);
            setPatient(patientData);
            setVisits(Array.from(new Map(rows.map(item => [item.visitId || item.id, item])).values()));
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        load();
    }, [id]);

    return <ReceptionistLayout><div className="cares-reception-screen">
        <div className="cares-reception-page-header"><div><h1 className="text-xl font-bold text-gray-900">Chi tiết bệnh nhân</h1><p className="mt-1 text-sm text-gray-400">Thông tin cá nhân và các lượt khám trước đây.</p></div><div className="flex flex-wrap items-center gap-3"><button onClick={() => setShowUpdateModal(true)} className="cares-reception-primary"><Edit2 size={18} />Cập nhật</button><button onClick={() => navigate(ROUTES.RECEPTIONIST_RECORDS)} className="flex min-h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-500"><ArrowLeft size={18}/> Quay lại</button></div></div>
        {loading && <p className="py-16 text-center text-sm text-gray-400">Đang tải...</p>}
        {error && <p className="py-16 text-center text-sm text-red-500">{error}</p>}
        {patient && <>
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="mb-5 text-sm font-bold text-gray-900">Thông tin cá nhân</h2><div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
                {[['Mã bệnh nhân', patient.patientCode], ['Họ và tên', patient.fullName], ['Số điện thoại', patient.phone], ['Email', patient.email], ['Ngày sinh', patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('vi-VN') : '-'], ['Giới tính', patient.gender === 'MALE' ? 'Nam' : patient.gender === 'FEMALE' ? 'Nữ' : '-'], ['Nhóm máu', patient.bloodType], ['Địa chỉ', patient.address]].map(([label, content]) => <div key={label} className="min-w-0"><p className="text-xs text-gray-400">{label}</p><p title={value(content)} className="mt-1 break-words [overflow-wrap:anywhere] text-sm font-medium leading-5 text-gray-800">{value(content)}</p></div>)}
            </div></section>
            <PatientAllergyBanner value={{ status: patient.allergyStatus, items: patient.allergies || [] }} currentLabel/>
            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="border-b border-gray-100 px-6 py-4"><h2 className="text-sm font-bold text-gray-900">Các lượt khám trước đây ({visits.length})</h2></div>
                {visits.length === 0 ? <p className="p-10 text-center text-sm text-gray-400">Chưa có lượt khám hoàn thành.</p> : visits.map(visit => <button key={visit.visitId || visit.id} onClick={() => navigate(ROUTES.RECEPTIONIST_PATIENT_VISIT_DETAIL.replace(':id', id).replace(':visitId', visit.visitId))} className="cares-reception-visit-row grid w-full grid-cols-[170px_140px_1fr_220px_24px] items-center gap-4 border-b border-gray-50 px-6 py-4 text-left hover:bg-gray-50">
                    <span className="text-sm font-semibold text-gray-800">{visit.date ? new Date(visit.date).toLocaleDateString('vi-VN') : '-'}</span><span className="text-sm text-gray-500">{visit.time || '-'}</span><span className="text-sm text-gray-700">{visit.specialty || 'Khám bệnh'}</span><span className="text-sm text-gray-500">{visit.doctor || '-'}</span><ChevronRight size={16} className="text-gray-300"/>
                </button>)}
            </section>
        </>}

        {showUpdateModal && patient && (
            <PatientUpdateModal 
                patient={patient} 
                onClose={() => setShowUpdateModal(false)} 
                onUpdateSuccess={() => {
                    setShowUpdateModal(false);
                    load();
                }} 
            />
        )}
    </div></ReceptionistLayout>;
}

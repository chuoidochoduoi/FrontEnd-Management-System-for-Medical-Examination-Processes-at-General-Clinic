import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import ClinicalDataDisplay from '@/components/clinical/ClinicalDataDisplay';
import PatientAllergyBanner from '@/components/clinical/PatientAllergyBanner';

const value = input => input === null || input === undefined || input === '' ? '-' : input;

export default function RecordDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [record, setRecord] = useState(null);
    const [allergies, setAllergies] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-records/${id}`, { headers }),
            fetch(`${import.meta.env.VITE_API_URL}/api/v1/medical-records/${id}/patient-allergies`, { headers }),
        ]).then(async ([recordResponse, allergyResponse]) => {
            const data = await recordResponse.json().catch(() => ({}));
            if (!recordResponse.ok) throw new Error(data.message || 'Không thể tải chi tiết hồ sơ');
            setRecord(data);
            if (allergyResponse.ok) setAllergies(await allergyResponse.json());
        }).catch(err => setError(err.message));
    }, [id]);

    const fields = record ? [
        ['Mã hồ sơ', record.recordId], ['Trạng thái', record.status],
        ['Bác sĩ phụ trách', record.doctorName],
        ['Ngày tạo', record.createdAt ? new Date(record.createdAt).toLocaleString('vi-VN') : null],
        ['Lý do khám', record.chiefComplaint], ['Kết quả khám', record.clinicalFindings],
        ['Chẩn đoán', record.diagnosis], ['Kết luận', record.conclusion],
        ['Hướng điều trị', record.patientInstruction], ['Ghi chú đơn thuốc', record.prescriptionNote],
    ] : [];

    return <ReceptionistLayout><div className="space-y-5 max-w-7xl mx-auto">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft size={16}/> Quay lại danh sách</button>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h1 className="text-xl font-semibold text-gray-900">Chi tiết hồ sơ bệnh án</h1>
            {error && <p className="mt-5 text-sm text-red-600">{error}</p>}
            {!record && !error && <p className="mt-5 text-sm text-gray-500">Đang tải dữ liệu...</p>}
            {record && <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-6">
                {fields.map(([label, content]) => <div key={label} className="border-b border-gray-100 pb-4"><p className="text-xs text-gray-500 mb-1">{label}</p><p className="text-sm text-gray-900 whitespace-pre-wrap">{value(content)}</p></div>)}
            </div>}
        </div>
        {record && <>
            <PatientAllergyBanner value={allergies} currentLabel/>
            <ClinicalDataDisplay clinicalForm={record.clinicalForm} schema={record.clinicalForm?.schema} values={record.clinicalForm?.values || record.specialtyData || {}}/>
        </>}
    </div></ReceptionistLayout>;
}

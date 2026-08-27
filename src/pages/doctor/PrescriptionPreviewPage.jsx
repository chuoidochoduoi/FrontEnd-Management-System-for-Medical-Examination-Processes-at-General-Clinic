import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import useClinicInformation from '@/hooks/useClinicInformation';

const display = value => value === null || value === undefined || value === '' ? '-' : value;

export default function PrescriptionPreviewPage() {
    const { recordId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { clinicInformation } = useClinicInformation();
    const data = useMemo(() => {
        if (location.state?.record) return location.state;
        try { return JSON.parse(sessionStorage.getItem(`prescription-preview:${recordId}`)); }
        catch { return null; }
    }, [location.state, recordId]);

    if (!data?.record) return (
        <div className="min-h-screen bg-gray-100 p-8 text-center">
            <p className="text-gray-600">Không tìm thấy dữ liệu đơn thuốc để xem trước.</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-primary-600 hover:underline">Quay lại</button>
        </div>
    );

    const { record, patient } = data;
    const medicines = Array.from(record.prescriptionItems ?? []);
    const date = new Date(data.completedAt ?? Date.now());
    const gender = patient?.gender === 'MALE' ? 'Nam' : patient?.gender === 'FEMALE' ? 'Nữ' : '-';

    return (
        <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
            <style>{`@page { size: A4; margin: 12mm; } @media print { .no-print { display: none !important; } .prescription-sheet { box-shadow: none !important; width: 100% !important; min-height: auto !important; margin: 0 !important; } }`}</style>
            <div className="no-print mx-auto mb-4 flex w-[210mm] max-w-[calc(100vw-32px)] items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-gray-700 shadow-sm"><ArrowLeft size={16}/> Quay lại</button>
                <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white"><Printer size={16}/> In đơn thuốc</button>
            </div>

            <main className="prescription-sheet mx-auto min-h-[297mm] w-[210mm] max-w-[calc(100vw-32px)] bg-white px-[14mm] py-[12mm] text-[13px] leading-relaxed text-gray-900 shadow-lg">
                <header className="grid grid-cols-[90px_1fr_90px] items-start border-b-2 border-gray-800 pb-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-600 text-3xl font-bold text-red-600">+</div>
                    <div>
                        <p className="text-lg font-bold uppercase">{clinicInformation.clinicName}</p>
                        <p className="font-semibold">{clinicInformation.legalName}</p>
                        <p className="text-xs text-gray-600">Điện thoại: {clinicInformation.phone} &nbsp; • &nbsp; Địa chỉ: {clinicInformation.address}</p>
                    </div>
                    <div className="text-right text-xs"><p>Mã hồ sơ</p><p className="font-bold">{display(recordId?.slice(0, 8).toUpperCase())}</p></div>
                </header>

                <h1 className="my-5 text-center text-2xl font-bold uppercase">Đơn thuốc</h1>
                <section className="grid grid-cols-2 gap-x-10 gap-y-2 border-b border-gray-400 pb-4">
                    <p><b>Họ và tên:</b> {display(patient?.fullName)}</p>
                    <p><b>Giới tính:</b> {gender}</p>
                    <p><b>Ngày sinh:</b> {display(patient?.dateOfBirth)}</p>
                    <p><b>Số điện thoại:</b> {display(patient?.phone)}</p>
                    <p className="col-span-2"><b>Địa chỉ:</b> {display(patient?.address)}</p>
                    <p className="col-span-2"><b>Chẩn đoán:</b> {display(record.diagnosis)}</p>
                </section>

                <table className="mt-5 w-full border-collapse">
                    <thead><tr className="bg-gray-100">
                        <th className="w-12 border border-gray-700 p-2">STT</th><th className="border border-gray-700 p-2 text-left">Tên thuốc, hoạt chất</th><th className="w-20 border border-gray-700 p-2">ĐVT</th><th className="w-16 border border-gray-700 p-2">SL</th><th className="w-[42%] border border-gray-700 p-2 text-left">Cách dùng</th>
                    </tr></thead>
                    <tbody>{medicines.map((item, index) => <tr key={item.prescriptionItemId ?? index}>
                        <td className="border border-gray-700 p-2 text-center">{index + 1}</td>
                        <td className="border border-gray-700 p-2 font-semibold">{display(item.medicineName)}</td>
                        <td className="border border-gray-700 p-2 text-center">{display(item.unit)}</td>
                        <td className="border border-gray-700 p-2 text-center">{display(item.quantity)}</td>
                        <td className="border border-gray-700 p-2">{display(item.note)}{item.frequencyPerDay ? ` (${item.frequencyPerDay} lần/ngày)` : ''}</td>
                    </tr>)}</tbody>
                </table>

                <section className="mt-5 space-y-2 border-y border-gray-400 py-3">
                    <p><b>Cộng khoản:</b> {medicines.length}</p>
                    <p><b>Lời dặn:</b> {display(record.patientInstruction || record.prescriptionNote)}</p>
                </section>
                <footer className="mt-8 ml-auto w-64 text-center">
                    <p>Ngày {date.getDate()} tháng {date.getMonth() + 1} năm {date.getFullYear()}</p>
                    <p className="mt-1 font-bold uppercase">Bác sĩ điều trị</p>
                    <div className="h-20" />
                    <p className="font-bold">{display(record.doctorConfirmedByName || record.doctorName)}</p>
                </footer>
            </main>
        </div>
    );
}

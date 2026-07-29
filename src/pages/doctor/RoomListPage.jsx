// src/pages/doctor/RoomListPage.jsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Stethoscope, Scan } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAllDepartments } from '@/hooks/useAllDepartments';
import DoctorLayout from '@/components/layout/DoctorLayout';

export default function RoomListPage() {
    const { t } = useTranslation('doctor');
    const navigate = useNavigate();

    // Fetch all departments
    const { examinationRooms, laboratoryRooms, imagingRooms, loading, error } = useAllDepartments();

    return (
        <DoctorLayout>
            <div className="max-w-4xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('sidebar.logo')}</h1>
                <p className="text-sm text-gray-500 mb-6">{t('sidebar.subtitle')}</p>

                {/* Loading state */}
                {loading && <p className="text-sm text-gray-400 mb-4">Đang tải danh sách phòng...</p>}
                {error && <p className="text-sm text-red-500 mb-4">{error.message}</p>}

                {/* Examination Rooms - Phòng khám (khám bệnh) */}
                <p className="text-sm font-semibold text-gray-400 mb-3">{t('doctor:rooms.consultation')}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {examinationRooms.map(room => (
                        <button
                            key={room.departmentId}
                            onClick={() => navigate(`${ROUTES.DOCTOR_DEPARTMENTS.replace(':departmentId', room.departmentId)}`)}
                            className="p-5 border border-gray-200 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                        >
                            <Stethoscope size={24} className="text-primary-500 mb-2" />
                            <p className="text-sm font-semibold text-gray-800">{room.name}</p>
                            <p className="text-xs text-gray-400 mt-1">{room.description || 'Phòng khám'}</p>
                        </button>
                    ))}
                </div>

                {/* Laboratory Rooms - Phòng xét nghiệm */}
                <p className="text-sm font-semibold text-gray-400 mb-3">{t('doctor:rooms.lab')}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {laboratoryRooms.map(room => (
                        <button
                            key={room.departmentId}
                            onClick={() => navigate(`${ROUTES.DOCTOR_LAB.replace(':departmentId', room.departmentId)}`)}
                            className="p-5 border border-gray-200 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                        >
                            <FlaskConical size={24} className="text-primary-500 mb-2" />
                            <p className="text-sm font-semibold text-gray-800">{room.name}</p>
                            <p className="text-xs text-gray-400 mt-1">{room.description || 'Xét nghiệm'}</p>
                        </button>
                    ))}
                </div>

                {/* Imaging Rooms - Chẩn đoán hình ảnh */}
                <p className="text-sm font-semibold text-gray-400 mb-3">{t('doctor:rooms.imaging')}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagingRooms.map(room => (
                        <button
                            key={room.departmentId}
                            onClick={() => navigate(`${ROUTES.DOCTOR_LAB.replace(':departmentId', room.departmentId)}`)}
                            className="p-5 border border-gray-200 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                        >
                            <Scan size={24} className="text-primary-500 mb-2" />
                            <p className="text-sm font-semibold text-gray-800">{room.name}</p>
                            <p className="text-xs text-gray-400 mt-1">{room.description || 'Chẩn đoán hình ảnh'}</p>
                        </button>
                    ))}
                </div>
            </div>
        </DoctorLayout>
    );
}

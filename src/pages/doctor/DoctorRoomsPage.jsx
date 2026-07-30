import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Stethoscope, Scan, AlertCircle } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAllDepartments } from '@/hooks/useAllDepartments';
import { useMyDepartment } from '@/hooks/useMyDepartment';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import { decodeToken } from '@/utils/jwtUtils';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function DoctorRoomsPage() {
    const { t } = useTranslation('doctor');
    const navigate = useNavigate();
    const systemRole = get('systemRole')?.toUpperCase() || '';
    const role = get('role')?.toUpperCase() || '';
    const token = get('token');
    const decoded = decodeToken(token);
    const authorities = decoded?.authorities || [];
    const isDoctor = authorities.includes('ROLE_DOCTOR') || authorities.includes('ROLE_GENERAL_DOCTOR') || authorities.includes('ROLE_SPECIALIST_DOCTOR') || role.includes('DOCTOR') || systemRole.includes('DOCTOR');

    // Fetch all departments (for NURSE)
    const { examinationRooms, laboratoryRooms, imagingRooms, loading: allLoading, error: allError } = useAllDepartments();

    // Fetch my department (for DOCTOR)
    const { myDepartment, loading: myLoading, error: myError } = useMyDepartment();

    useEffect(() => {
        if (isDoctor && myDepartment?.departmentId) {
            navigate(ROUTES.DOCTOR_DEPARTMENTS.replace(':departmentId', myDepartment.departmentId));
        }
    }, [isDoctor, myDepartment, navigate]);

    if (isDoctor) {
        return (
            <MedicalStaffLayout>
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('sidebar.logo')}</h1>
                    <p className="text-sm text-gray-500 mb-6">{t('sidebar.subtitle')}</p>

                    {myLoading ? (
                        <p className="text-sm text-gray-400">Đang kiểm tra phòng được phân công...</p>
                    ) : myError?.message === 'not_assigned' ? (
                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col items-center justify-center text-center">
                            <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Chưa được phân phòng</h2>
                            <p className="text-sm text-gray-600">Bạn chưa được chỉ định phụ trách phòng khám nào. Vui lòng liên hệ Admin/Quản lý để được phân phòng.</p>
                        </div>
                    ) : myError ? (
                        <p className="text-sm text-red-500">Có lỗi xảy ra: {myError.message}</p>
                    ) : (
                        <p className="text-sm text-gray-500">Đang chuyển hướng đến phòng khám...</p>
                    )}
                </div>
            </MedicalStaffLayout>
        );
    }

    return (
        <MedicalStaffLayout>
            <div className="max-w-4xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('sidebar.logo')}</h1>
                <p className="text-sm text-gray-500 mb-6">{t('sidebar.subtitle')}</p>

                {/* Loading state */}
                {allLoading && <p className="text-sm text-gray-400 mb-4">Đang tải danh sách phòng...</p>}
                {allError && <p className="text-sm text-red-500 mb-4">{allError.message}</p>}

                <div className="bg-red-50 p-4 rounded mb-4">
                    <p className="text-red-600 font-bold">DEBUG INFO (Vui lòng chụp cho tôi xem dòng này):</p>
                    <p>role: "{role}" | systemRole: "{systemRole}" | isDoctor: {isDoctor ? 'true' : 'false'}</p>
                </div>

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
        </MedicalStaffLayout>
    );
}
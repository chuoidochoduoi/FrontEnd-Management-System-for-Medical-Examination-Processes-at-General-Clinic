// src/pages/doctor/RoomListPage.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useMyDepartment } from '@/hooks/useMyDepartment';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';

export default function RoomListPage() {
    const navigate = useNavigate();
    const { myDepartment, loading, error } = useMyDepartment();

    useEffect(() => {
        if (myDepartment?.departmentId) {
            const target = myDepartment.departmentType === 'EXAMINATION'
                ? ROUTES.DOCTOR_DEPARTMENTS
                : ROUTES.DOCTOR_LAB;
            navigate(target.replace(':departmentId', myDepartment.departmentId), { replace: true });
        }
    }, [myDepartment, navigate]);

    return (
        <MedicalStaffLayout>
            <div className="max-w-lg mx-auto px-6 py-16 text-center">
                {loading ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                        <p className="text-sm text-gray-500">Đang kiểm tra phòng được phân công...</p>
                    </div>
                ) : error?.message === 'not_assigned' ? (
                    <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col items-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-amber-500" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Chưa được phân phòng</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Bạn chưa được chỉ định phụ trách phòng khám nào. Vui lòng liên hệ Quản lý để được phân phòng.
                        </p>
                    </div>
                ) : error ? (
                    <p className="text-sm text-red-500">Có lỗi xảy ra: {error.message}</p>
                ) : (
                    <p className="text-sm text-gray-400">Đang chuyển hướng đến phòng khám...</p>
                )}
            </div>
        </MedicalStaffLayout>
    );
}

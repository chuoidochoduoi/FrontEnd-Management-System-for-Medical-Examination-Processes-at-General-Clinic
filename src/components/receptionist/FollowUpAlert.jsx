import { useTranslation } from 'react-i18next';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

/**
 * FollowUpAlert — banner cảnh báo bệnh nhân cần khám lại
 *
 * Hiển thị ở trang Check-in của lễ tân khi bệnh nhân có thông tin follow-up
 * từ lần khám trước. Lễ tân có thể nhìn thấy ghi chú của bác sĩ và đặt lịch.
 *
 * @param {object}  props
 * @param {object}  props.followUp     — { note, preferredDate, status }
 * @param {function} props.onSchedule  — callback khi click "Đặt lịch"
 */
export default function FollowUpAlert({ followUp, onSchedule }) {
    const { t } = useTranslation('receptionist');

    if (!followUp) return null;

    const status = followUp.status || 'PENDING';
    const isScheduled = status === 'SCHEDULED';

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl shadow-sm p-4 mb-4">
            <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={12} className="text-amber-600" />
                </div>
                <div className="flex-1">
                    {followUp.patientName && (
                        <p className="mb-1 text-sm font-semibold text-gray-900">{followUp.patientName}</p>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            {t('followUp.badge')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isScheduled
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}>
                            {isScheduled ? t('followUp.statusScheduled') : t('followUp.statusPending')}
                        </span>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">
                        <span className="font-medium">{t('followUp.doctorNote')}:</span>{' '}
                        <span className="italic">
                            {followUp.note || t('followUp.noNote')}
                        </span>
                    </p>
                    {followUp.preferredDate && (
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {t('followUp.preferredDate')}: {new Date(followUp.preferredDate).toLocaleDateString('vi-VN')}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {t('followUp.statusPending')}
                            </span>
                        </div>
                    )}
                </div>
                {!isScheduled && (
                    <button
                        onClick={onSchedule}
                        className="px-4 h-8 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
                    >
                        {t('followUp.scheduleBtn')}
                    </button>
                )}
            </div>
        </div>
    );
}

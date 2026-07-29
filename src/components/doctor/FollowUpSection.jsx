import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Bell } from 'lucide-react';

/**
 * FollowUpSection — phần yêu cầu khám lại của bác sĩ
 *
 * Khi bác sĩ tick chọn "Yêu cầu khám lại", một form ghi chú sẽ hiện ra.
 * Thông tin này sẽ được gửi kèm payload hoàn thành khám để lễ tân biết
 * cần đặt lịch khám lại cho bệnh nhân.
 *
 * @param {object}  props
 * @param {boolean} props.enabled         — trạng thái checkbox (controlled)
 * @param {string}  props.note            — ghi chú hiện tại
 * @param {function} props.onChange       — callback({ enabled, note })
 */
export default function FollowUpSection({ enabled, note, onChange }) {
    const { t } = useTranslation('doctor');

    const handleCheckbox = (e) => {
        onChange({ enabled: e.target.checked, note });
    };

    const handleNoteChange = (e) => {
        onChange({ enabled, note: e.target.value });
    };

    return (
        <div className="bg-white border-2 border-primary-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="flex items-center h-5 mt-0.5">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={handleCheckbox}
                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                    />
                </div>
                <label className="flex-1 cursor-pointer">
                    <span className="text-sm font-semibold text-gray-800">
                        {t('examination.followUp.title')}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {t('examination.followUp.description')}
                    </p>
                </label>
                <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                    <Bell size={12} className="text-primary-500" />
                </div>
            </div>

            {/* Note field — revealed when checkbox is checked */}
            {enabled && (
                <div className="mt-4 pl-7 animate-fadeIn">
                    <div className="border-l-2 border-primary-300 pl-4">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            {t('examination.followUp.noteLabel')}
                        </label>
                        <textarea
                            value={note}
                            onChange={handleNoteChange}
                            placeholder={t('examination.followUp.notePlaceholder')}
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary-500 resize-none bg-primary-50/30"
                        />
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar size={11} />
                                {t('examination.followUp.noteHint')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

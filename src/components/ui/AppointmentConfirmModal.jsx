// components/ui/AppointmentConfirmModal.jsx
import { useTranslation } from 'react-i18next';

export default function AppointmentConfirmModal({ data, onClose, onConfirm }) {
    const { t } = useTranslation('appointment');

    const patientRows = [
        { key: t('confirmModal.fullName'),   val: data.fullName,   bold: true },
        { key: t('confirmModal.phone'),      val: data.phone },
        { key: t('confirmModal.ageGender'),  val: data.ageGender },
        { key: t('confirmModal.email'),      val: data.email },
        { key: t('confirmModal.address'),    val: data.address },
    ];

    const timeRows = [
        { key: t('confirmModal.date'),      val: data.date,     bold: true },
        { key: t('confirmModal.timeSlot'),  val: data.timeSlot },
        { key: t('confirmModal.method'),    val: data.method },
    ];

    return (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl w-full max-w-[560px] overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100 relative">
                    <h2 className="text-[17px] font-medium text-gray-900">{t('confirmModal.title')}</h2>
                    <p className="text-[13px] text-gray-500 mt-1">{t('confirmModal.subtitle')}</p>
                    <button onClick={onClose} className="absolute right-4 top-4 w-7 h-7 border border-gray-200 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="px-6 py-5 grid grid-cols-2 gap-4">

                    {/* Bệnh nhân */}
                    <div>
                        <p className="text-xs text-gray-400 mb-2">{t('confirmModal.patientInfo')}</p>
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                            {patientRows.map((row, i) => (
                                <div key={i} className="flex justify-between items-start px-3 py-2.5 border-b border-gray-100 last:border-0 gap-3">
                                    <span className="text-[13px] text-gray-400 shrink-0">{row.key}</span>
                                    <span className={`text-[13px] text-gray-900 text-right ${row.bold ? 'font-medium' : ''}`}>{row.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Thời gian */}
                    <div>
                        <p className="text-xs text-gray-400 mb-2">{t('confirmModal.timeInfo')}</p>
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                            {timeRows.map((row, i) => (
                                <div key={i} className="flex justify-between items-start px-3 py-2.5 border-b border-gray-100 gap-3">
                                    <span className="text-[13px] text-gray-400 shrink-0">{row.key}</span>
                                    <span className={`text-[13px] text-gray-900 text-right ${row.bold ? 'font-medium' : ''}`}>{row.val}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center px-3 py-2.5">
                                <span className="text-[13px] font-medium text-gray-900">{t('confirmModal.total')}</span>
                                <span className="text-lg font-medium text-gray-900">{data.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Dịch vụ */}
                    <div className="col-span-2">
                        <p className="text-xs text-gray-400 mb-2">{t('confirmModal.services')}</p>
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                            <div className="flex justify-between px-3 py-2.5 border-b border-gray-100">
                                <span className="text-[13px] text-gray-400">{t('confirmModal.serviceList')}</span>
                                <span className="text-[13px] text-gray-400">
                  {t('confirmModal.serviceCount', { count: data.services.length.toString().padStart(2, '0') })}
                </span>
                            </div>
                            {data.services.map((s, i) => (
                                <div key={i} className="flex justify-between items-center px-3 py-2.5 border-b border-gray-100">
                                    <span className="text-[13px] font-medium text-gray-900">• {s.name}</span>
                                    <span className="text-[13px] text-gray-400 shrink-0 ml-4">{s.price}</span>
                                </div>
                            ))}
                            <div className="flex gap-4 px-3 py-2.5">
                                <span className="text-[13px] text-gray-400 shrink-0">{t('confirmModal.reason')}</span>
                                <span className="text-[13px] text-gray-900">{data.reason}</span>
                            </div>
                        </div>
                    </div>

                    {/* Ghi chú */}
                    <div className="col-span-2 bg-gray-50 rounded-lg px-4 py-3 text-[12px] text-gray-400 leading-relaxed">
                        {t('confirmModal.note')}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="flex-1 h-11 border border-gray-200 rounded-lg text-[14px] text-gray-700 hover:bg-gray-50 transition-colors">
                        {t('confirmModal.back')}
                    </button>
                    <button onClick={onConfirm} className="flex-1 h-11 bg-gray-900 rounded-lg text-[14px] font-medium text-white hover:bg-gray-800 transition-colors">
                        {t('confirmModal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}
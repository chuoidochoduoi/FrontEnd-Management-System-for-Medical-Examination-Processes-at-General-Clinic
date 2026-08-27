import { useTranslation } from 'react-i18next';
import {
    CheckCircle2,
    User,
    Clock,
    FileText
} from 'lucide-react';

export default function AppointmentConfirmModal({
                                                    data,
                                                    onClose,
                                                    onConfirm,
                                                    namespace = 'appointment',
                                                    isLoading = false
                                                }) {
    const { t } = useTranslation(namespace);

    const tConfirm = (key, options) =>
        t(`confirmModal.${key}`, options);

    // =========================================================
    // THÔNG TIN BỆNH NHÂN
    // =========================================================
    const patientRows = [
        {
            key: tConfirm('fullName'),
            val: data.fullName,
            bold: true
        }
    ];

    // Có SĐT thì hiện SĐT
    if (data.phone) {
        patientRows.push({
            key: tConfirm('phone'),
            val: data.phone
        });
    }

    // Có Email thì hiện Email
    if (data.email) {
        patientRows.push({
            key: 'EMAIL',
            val: data.email
        });
    }

    patientRows.push({
        key: tConfirm('ageGender'),
        val: data.ageGender
    });

    if (data.address) {
        patientRows.push({
            key: 'ĐỊA CHỈ',
            val: data.address
        });
    }

    if (data.bhyt) {
        patientRows.push({
            key: 'BẢO HIỂM Y TẾ',
            val: data.bhyt,
            bold: true
        });
    }

    // =========================================================
    // THỜI GIAN
    // =========================================================
    const timeRows = [
        {
            key: tConfirm('date'),
            val: data.date,
            bold: true
        },
        {
            key: tConfirm('timeSlot'),
            val: data.timeSlot
        }
    ];

    if (data.method) {
        timeRows.push({
            key: 'HÌNH THỨC',
            val: data.method
        });
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-300">

            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative flex flex-col max-h-[90vh] border border-slate-100">

                {/* =====================================================
                    HEADER
                ===================================================== */}
                <div className="px-8 pt-8 pb-6 border-b border-slate-100 flex items-start justify-between shrink-0 bg-slate-50/50">

                    <div className="flex items-center gap-4">

                        <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100">
                            <CheckCircle2 className="w-6 h-6 text-primary-600" />
                        </div>

                        <div>

                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {tConfirm('title')}
                            </h2>

                            <p className="text-sm text-slate-500 mt-1 font-medium">
                                {tConfirm('subtitle')}
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                        ✕
                    </button>

                </div>

                {/* =====================================================
                    BODY
                ===================================================== */}
                <div className="px-8 py-6 overflow-y-auto custom-scrollbar flex-1">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* =================================================
                            BỆNH NHÂN
                        ================================================= */}
                        <div className="flex flex-col">

                            <div className="flex items-center gap-2 mb-4">

                                <User className="w-4 h-4 text-primary-500" />

                                <p className="text-xs font-bold tracking-widest uppercase text-slate-900">
                                    {tConfirm('patientInfo')}
                                </p>

                            </div>

                            <div className="bg-white rounded-2xl p-5 space-y-4 border border-slate-100 shadow-sm flex-1">

                                {patientRows.map((row, i) => (

                                    <div
                                        key={i}
                                        className="flex flex-col gap-1.5"
                                    >

                                        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                                            {row.key}
                                        </span>

                                        <span
                                            className={`
                                                text-sm
                                                text-slate-800
                                                break-words
                                                ${
                                                row.bold
                                                    ? 'font-bold'
                                                    : 'font-medium'
                                            }
                                            `}
                                        >
                                            {row.val || '---'}
                                        </span>

                                    </div>

                                ))}

                            </div>

                        </div>

                        {/* =================================================
                            THỜI GIAN
                        ================================================= */}
                        <div className="flex flex-col">

                            <div className="flex items-center gap-2 mb-4">

                                <Clock className="w-4 h-4 text-primary-500" />

                                <p className="text-xs font-bold tracking-widest uppercase text-slate-900">
                                    {tConfirm('timeInfo')}
                                </p>

                            </div>

                            <div className="bg-white rounded-2xl p-5 space-y-4 border border-slate-100 shadow-sm flex-1 flex flex-col">

                                {timeRows.map((row, i) => (

                                    <div
                                        key={i}
                                        className="flex flex-col gap-1.5"
                                    >

                                        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                                            {row.key}
                                        </span>

                                        <span
                                            className={`
                                                text-sm
                                                text-slate-800
                                                ${
                                                row.bold
                                                    ? 'font-bold text-primary-700'
                                                    : 'font-medium'
                                            }
                                            `}
                                        >
                                            {row.val || '---'}
                                        </span>

                                    </div>

                                ))}

                                <div className="pt-4 mt-auto border-t border-slate-100 border-dashed">

                                    <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 block mb-1">
                                        {tConfirm('total')}
                                    </span>

                                    <span className="text-2xl font-bold text-primary-600">
                                        {data.total}
                                    </span>

                                </div>

                            </div>

                        </div>

                        {/* =================================================
                            DỊCH VỤ
                        ================================================= */}
                        <div className="col-span-1 md:col-span-2 mt-2">

                            <div className="flex items-center gap-2 mb-4">

                                <FileText className="w-4 h-4 text-primary-500" />

                                <p className="text-xs font-bold tracking-widest uppercase text-slate-900">
                                    {tConfirm('services')}
                                </p>

                            </div>

                            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">

                                <div className="px-5 py-4 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">

                                    <span className="text-xs font-bold tracking-widest uppercase text-slate-600">
                                        {tConfirm('serviceList')}
                                    </span>

                                    <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                                        {tConfirm(
                                            'serviceCount',
                                            {
                                                count:
                                                    data.services?.length || 0
                                            }
                                        )}
                                    </span>

                                </div>

                                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">

                                    {data.services?.map((service, i) => (

                                        <div
                                            key={i}
                                            className="flex justify-between items-center px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                                        >

                                            <span className="text-sm font-medium text-slate-700 truncate pr-4">
                                                • {service.name}
                                            </span>

                                            <span className="text-sm font-bold text-slate-900 shrink-0">
                                                {new Intl.NumberFormat(
                                                    'vi-VN'
                                                ).format(
                                                    service.price || 0
                                                )}{' '}
                                                đ
                                            </span>

                                        </div>

                                    ))}

                                </div>

                                {data.reason && (

                                    <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-1.5">

                                        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                                            {tConfirm('reason')}
                                        </span>

                                        <span className="text-sm font-medium text-slate-700">
                                            {data.reason}
                                        </span>

                                    </div>

                                )}

                            </div>

                        </div>

                        {/* =================================================
                            NOTE
                        ================================================= */}
                        <div className="col-span-1 md:col-span-2 bg-blue-50/50 border border-blue-100 rounded-2xl px-6 py-5 text-sm text-blue-800 flex gap-4 items-start shadow-sm">

                            <span className="text-xl shrink-0 leading-none">
                                💡
                            </span>

                            <span className="leading-relaxed font-medium">
                                {tConfirm('note')}
                            </span>

                        </div>

                    </div>

                </div>

                {/* =====================================================
                    FOOTER
                ===================================================== */}
                <div className="px-8 py-6 border-t border-slate-100 bg-white flex gap-4 shrink-0">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm disabled:opacity-50"
                    >
                        {tConfirm('back')}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 h-14 bg-primary-600 rounded-2xl text-sm font-bold text-white hover:bg-primary-700 transition-all shadow-[0_8px_20px_-6px_rgba(14,165,233,0.5)] disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                    >

                        {isLoading ? (

                            <div className="flex items-center justify-center gap-2">

                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                                <span>
                                    Đang xử lý...
                                </span>

                            </div>

                        ) : (
                            tConfirm('confirm')
                        )}

                    </button>

                </div>

            </div>

        </div>
    );
}
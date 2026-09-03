// components/ui/CreateTicketConfirmModal.jsx
import { useTranslation } from 'react-i18next';

const analyteParentLabel = code => {
    const normalized = String(code || '').toUpperCase();
    if (normalized.startsWith('AN-CBC-')) return 'Công thức máu';
    if (normalized.startsWith('AN-BIO-')) return 'Sinh hóa máu cơ bản';
    if (normalized.startsWith('AN-LIV-')) return 'Chức năng gan';
    if (normalized.startsWith('AN-REN-')) return 'Chức năng thận';
    if (normalized.startsWith('AN-URI-')) return 'Nước tiểu';
    return 'dịch vụ xét nghiệm';
};

const selectionType = service => {
    const code = String(service.code || service.serviceCode || '').toUpperCase();
    if (code.startsWith('AN-')) return `Chỉ số lẻ · Thuộc ${analyteParentLabel(code)}`;
    if ((service.relations || []).some(relation =>
        relation.type === 'INCLUDES' && String(relation.targetServiceCode || '').startsWith('AN-'))) {
        return 'Gói xét nghiệm đầy đủ';
    }
    return service.departmentType === 'EXAMINATION' ? 'Khám bệnh' : 'Cận lâm sàng';
};

export default function CreateTicketConfirmModal({ data, onClose, onConfirm, submitting }) {
    const { t } = useTranslation('createTicketConfirmModal');

    const patientRows = [
        { key: t('fullName'), val: data.fullName, bold: true },
        { key: t('phone'), val: data.phone },
        { key: 'Email', val: data.email },
        { key: t('age'), val: data.age },
        { key: t('gender'), val: data.gender },
        { key: 'Nhóm máu', val: data.bloodType },
        { key: 'Địa chỉ', val: data.address },
        {
            key: 'Dị ứng',
            val: data.allergyStatus === 'UNVERIFIED'
                ? 'Chưa xác minh'
                : data.allergyStatus === 'NONE_REPORTED'
                    ? 'Đã xác nhận không ghi nhận dị ứng'
                    : data.allergies?.join(', '),
        },
    ];

    return (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 px-4 py-6">
            <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-xl bg-white">

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100 relative">
                    <h2 className="text-xl font-semibold text-gray-900">{t('title')}</h2>
                    <p className="mt-1 text-[15px] text-gray-500">{t('subtitle')}</p>
                    <button onClick={onClose} disabled={submitting} className="absolute right-4 top-4 w-7 h-7 border border-gray-200 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50">✕</button>
                </div>

                <div className="space-y-4 overflow-y-auto px-6 py-5">

                    {/* Thông tin bệnh nhân */}
                    <div>
                        <p className="mb-2 text-[15px] font-semibold text-gray-500">{t('patientInfo')}</p>
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                            {patientRows.map((row, i) => (
                                <div key={i} className="flex justify-between items-start px-3 py-2.5 border-b border-gray-100 last:border-0 gap-3">
                                    <span className="shrink-0 text-[15px] text-gray-500">{row.key}</span>
                                    <span className={`text-right text-[15px] text-gray-900 ${row.bold ? 'font-semibold' : ''}`}>{row.val || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dịch vụ */}
                    <div>
                        <p className="mb-2 text-[15px] font-semibold text-gray-500">Thứ tự thực hiện dự kiến</p>
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                            <div className="flex justify-between px-3 py-2.5 border-b border-gray-100">
                                <span className="text-[15px] text-gray-500">{t('serviceList')}</span>
                                <span className="text-[15px] text-gray-500">
                                    {t('serviceCount', { count: data.services.length.toString().padStart(2, '0') })}
                                </span>
                            </div>
                            {data.services.map((s, i) => (
                                <div key={s.id || i} className="flex justify-between items-center px-3 py-2.5 border-b border-gray-100">
                                    <span className="text-[15px] font-medium text-gray-900">
                                        {i + 1}. {s.name}
                                        <small className="ml-2 inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-teal-700">
                                            {selectionType(s)}
                                        </small>
                                    </span>
                                    <span className="ml-4 shrink-0 text-[15px] text-gray-500">{Number(s.price || 0).toLocaleString('vi-VN')} đ</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center px-3 py-2.5">
                                <span className="text-[15px] font-semibold text-gray-900">{t('total')}</span>
                                <span className="text-lg font-medium text-gray-900">{data.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Lý do khám */}
                    {data.reason && (
                        <div>
                            <p className="mb-2 text-[15px] font-semibold text-gray-500">{t('reason')}</p>
                            <p className="text-[15px] text-gray-900">{data.reason}</p>
                        </div>
                    )}

                    {/* Ghi chú */}
                    <div className="rounded-lg bg-gray-50 px-4 py-3 text-[15px] leading-relaxed text-gray-500">
                        {t('note')}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} disabled={submitting} className="h-12 flex-1 rounded-lg border border-gray-200 text-base text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50">
                        {t('back')}
                    </button>
                    <button onClick={onConfirm} disabled={submitting} className="h-12 flex-1 rounded-lg bg-teal-700 text-base font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50">
                        {submitting ? t('submitting') : t('confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}

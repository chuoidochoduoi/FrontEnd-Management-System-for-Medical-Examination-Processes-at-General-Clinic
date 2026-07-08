// src/pages/receptionist/CreateTicketPage.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { useCreateTicket } from '@/hooks/useCreateTicket';
import CreateTicketConfirmModal from '@/components/ui/CreateTicketConfirmModal';

const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '—';

/* ── nhỏ: một dòng service có checkbox ── */
function ServiceRow({ item, checked, onToggle }) {
    return (
        <label className="flex items-start justify-between gap-3 py-2.5 cursor-pointer group">
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onToggle}
                    className="mt-0.5 w-3.5 h-3.5 accent-gray-800 shrink-0"
                />
                <div className="min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{item.name}</p>
                    {item.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                    )}
                </div>
            </div>
            <span className="text-sm text-gray-700 shrink-0">{fmt(item.price)}</span>
        </label>
    );
}

/* ── input helper ── */
const inputCls = 'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 bg-white placeholder:text-gray-300';
const labelCls = 'block text-xs text-gray-500 mb-1.5';

// Helper to convert gender to backend enum
const toGenderEnum = (g) => {
    if (!g) return null;
    if (g === 'male') return 'MALE';
    if (g === 'female') return 'FEMALE';
    if (g === 'other') return 'OTHER';
    return g; // already enum value
};

export default function CreateTicketPage() {
    const { t } = useTranslation(['receptionist', 'createTicketConfirmModal']);
    const { services, loadingSvc, submitting, error: submitError, submit } = useCreateTicket();
    const [validationError, setValidationError] = useState('');

    /* ── service selection ── */
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);

    /* ── confirmation modal ── */
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    /* ── form fields ── */
    const [reason,    setReason]  = useState('');
    const [fullName,  setFullName] = useState('');
    const [phone,     setPhone]    = useState('');
    const [dob,       setDob]      = useState('');
    const [gender,    setGender]   = useState('male');
    const [address,   setAddress]  = useState('');
    const [bhytCode,  setBhytCode] = useState('');
    const [bhytExpiry, setBhytExpiry] = useState('');

    const toggleService = (svc) =>
        setSelectedServiceIds(prev =>
            prev.includes(svc.id)
                ? prev.filter(id => id !== svc.id)
                : [...prev, svc.id]
        );

    const total = selectedServiceIds
        .map(id => services.find(s => s.id === id))
        .filter(Boolean)
        .reduce((sum, s) => sum + (s.price ?? 0), 0);

    const handleReset = () => {
        setSelectedServiceIds([]);
        setReason('');
        setFullName('');
        setPhone('');
        setDob('');
        setGender('male');
        setAddress('');
        setBhytCode('');
        setBhytExpiry('');
    };

    const handleSubmit = () => {
        // Validation check
        if (!fullName.trim()) {
            setValidationError(t('validation.fullNameRequired'));
            return;
        }
        if (!phone.trim()) {
            setValidationError(t('validation.phoneRequired'));
            return;
        }
        if (selectedServiceIds.length === 0) {
            setValidationError(t('validation.serviceRequired'));
            return;
        }

        setShowConfirmModal(true);
    };

    // Helper to get accountId from storage for issuedById
    const getAccountId = () => {
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        return storage.getItem('accountId');
    };

    const handleConfirm = () => {
        submit({
            serviceIds: selectedServiceIds,
            issuedById: getAccountId(),
            reason,
            guestFullName: fullName,
            guestPhone: phone,
            guestAddress: address,
            guestDateOfBirth: dob || null,
            guestGender: toGenderEnum(gender),
        });
        setShowConfirmModal(false);
    };

    return (
        <ReceptionistLayout>
            <div className="flex flex-col min-h-[calc(100vh-3.5rem)] -m-8">

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto p-8 pb-28 space-y-5">

                    {/* ────── Block 1: Chọn dịch vụ ────── */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-gray-900">
                            {t('createTicket.bundle.title')}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5 mb-5">
                            {t('createTicket.bundle.subtitle')}
                        </p>

                        {loadingSvc ? (
                            <p className="text-sm text-gray-400 py-4">{t('createTicket.loading')}</p>
                        ) : services.length > 0 ? (
                            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                                {services.map(svc => (
                                    <ServiceRow
                                        key={svc.id}
                                        item={svc}
                                        checked={selectedServiceIds.includes(svc.id)}
                                        onToggle={() => toggleService(svc)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 py-4">Chưa có dịch vụ nào</p>
                        )}

                        {/* Lý do khám */}
                        <div className="mt-6">
                            <p className={labelCls}>{t('createTicket.bundle.reasonLabel')}</p>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder={t('createTicket.bundle.reasonPlaceholder')}
                                rows={3}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    {/* ────── Block 2: Thông tin bệnh nhân ────── */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h2 className="text-xs font-semibold text-gray-700 tracking-wide mb-5">
                            {t('createTicket.patientInfo.title')}
                        </h2>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="col-span-1">
                                <label className={labelCls}>{t('createTicket.patientInfo.fullName')}</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder={t('createTicket.patientInfo.fullNamePlaceholder')}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>{t('createTicket.patientInfo.phone')}</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder={t('createTicket.patientInfo.phonePlaceholder')}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>{t('createTicket.patientInfo.dob')}</label>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={e => setDob(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {/* Giới tính */}
                            <div>
                                <label className={labelCls}>{t('createTicket.patientInfo.gender')}</label>
                                <div className="flex gap-2">
                                    {[
                                        { val: 'male', label: t('createTicket.patientInfo.male') },
                                        { val: 'female', label: t('createTicket.patientInfo.female') },
                                        { val: 'other', label: t('createTicket.patientInfo.other') },
                                    ].map(({ val, label }) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setGender(val)}
                                            className={`flex-1 h-10 text-sm rounded-lg border transition-colors ${
                                                gender === val
                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Địa chỉ — chiếm 2 cột */}
                            <div className="col-span-2">
                                <label className={labelCls}>{t('createTicket.patientInfo.address')}</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder={t('createTicket.patientInfo.addressPlaceholder')}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Reset link */}
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <RotateCcw size={12} />
                                {t('createTicket.resetForm')}
                            </button>
                        </div>
                    </div>

                    {/* ────── Block 3: BHYT (placeholder) ────── */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h2 className="text-xs font-semibold text-gray-700 tracking-wide mb-5">
                            {t('createTicket.insurance.title')}
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>{t('createTicket.insurance.cardNumber')}</label>
                                <input
                                    type="text"
                                    value={bhytCode}
                                    onChange={e => setBhytCode(e.target.value)}
                                    placeholder={t('createTicket.insurance.cardNumberPlaceholder')}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>{t('createTicket.insurance.expiry')}</label>
                                <input
                                    type="text"
                                    value={bhytExpiry}
                                    onChange={e => setBhytExpiry(e.target.value)}
                                    placeholder={t('createTicket.insurance.expiryPlaceholder')}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    {(validationError || submitError) && <p className="text-red-500 text-sm">{validationError || submitError}</p>}
                </div>

                {/* ── Sticky footer ── */}
                <div className="fixed bottom-0 left-52 right-0 bg-white border-t border-gray-200 px-10 h-16 flex items-center justify-between z-40">
                    <p className="text-sm text-gray-500">
                        {t('createTicket.totalCost')}{' '}
                        <span className="text-xl font-bold text-gray-900">{fmt(total)}</span>
                    </p>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="h-10 px-7 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        {submitting ? t('createTicket.submitting') : t('createTicket.submit')}
                    </button>
                </div>

                {/* Modal xác nhận */}
                {showConfirmModal && (
                    <CreateTicketConfirmModal
                        data={{
                            fullName,
                            phone,
                            age: dob ? new Date().getFullYear() - new Date(dob).getFullYear() : '',
                            gender: gender === 'male' ? t('createTicket.patientInfo.male') : gender === 'female' ? t('createTicket.patientInfo.female') : t('createTicket.patientInfo.other'),
                            address,
                            total: fmt(total),
                            services: selectedServiceIds
                                .map(id => services.find(s => s.id === id))
                                .filter(Boolean),
                            reason,
                        }}
                        onClose={() => {
                            setShowConfirmModal(false);
                            setValidationError('');
                        }}
                        onConfirm={handleConfirm}
                        submitting={submitting}
                    />
                )}

            </div>
        </ReceptionistLayout>
    );
}
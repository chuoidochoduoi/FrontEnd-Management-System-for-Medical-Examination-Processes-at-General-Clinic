// src/pages/receptionist/CreateTicketPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Search } from 'lucide-react';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { useCreateTicket } from '@/hooks/useCreateTicket';
import { useToast } from '@/hooks/useToast';
import CreateTicketConfirmModal from '@/components/ui/CreateTicketConfirmModal';

const fmt = (n) => n != null ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : '—';

const DEPARTMENT_TYPE_LABELS = {
    'EXAMINATION': 'Khám bệnh',
    'PARACLINICAL': 'Cận lâm sàng',
    'OTHER': 'Dịch vụ khác'
};

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
    const { services, insurances, loadingSvc, submitting, error: submitError, submit } = useCreateTicket();
    const toast = useToast();
    const [validationError, setValidationError] = useState('');
    const [searchParams] = useSearchParams();

    /* ── service selection ── */
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentType, setDepartmentType] = useState('');

    /* ── confirmation modal ── */
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    /* ── form fields ── */
    const [customerId, setCustomerId] = useState(null);
    const [reason,    setReason]  = useState('');
    const [fullName,  setFullName] = useState('');
    const [phone,     setPhone]    = useState('');
    const [dob,       setDob]      = useState('');
    const [gender,    setGender]   = useState('male');
    const [address,   setAddress]  = useState('');
    const [insuranceId, setInsuranceId] = useState('');
    const [bhytCode,  setBhytCode] = useState('');

    /* ── autofill from URL ── */
    const checkBhyt = async () => {
        if (!bhytCode || bhytCode.length < 5) {
            toast.error('Vui lòng nhập mã thẻ BHYT hợp lệ');
            return;
        }
        if (!insuranceId) {
            toast.error('Vui lòng chọn Loại bảo hiểm trước khi kiểm tra');
            return;
        }
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bhxh/check?cardNumber=${bhytCode}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            
            if (result.isValid) {
                // Kiểm tra xem thẻ có thuộc hãng bảo hiểm đã chọn không
                if (result.insuranceId !== insuranceId) {
                    toast.error(`Mã thẻ này là của ${result.insuranceName}, không thuộc hãng bảo hiểm bạn đang chọn!`);
                    return;
                }

                toast.success(`Thẻ BHYT hợp lệ: ${result.fullName}`);
                // Tùy chọn điền luôn tên và ngày sinh nếu user chưa nhập
                if (!fullName) setFullName(result.fullName);
                if (!dob && result.dateOfBirth) setDob(result.dateOfBirth);
            } else {
                toast.error(result.message || 'Mã thẻ không hợp lệ!');
            }
        } catch (err) {
            toast.error('Lỗi kết nối khi tra cứu thẻ BHYT');
        }
    };

    useEffect(() => {
        const queryPhone = searchParams.get('phone');
        const queryCustomerId = searchParams.get('customerId');
        if (queryCustomerId) {
            setCustomerId(queryCustomerId);
        }
        if (queryPhone) {
            fetch(`${import.meta.env.VITE_API_URL}/api/receptionist/records/search-by-phone?phone=${encodeURIComponent(queryPhone)}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}` }
            })
            .then(async res => {
                if (!res.ok) throw new Error('Không thể tải hồ sơ bệnh nhân');
                return res.json();
            })
            .then(data => {
                const patients = Array.isArray(data) ? data : (data?.data || data?.content || []);
                if (patients.length > 0) {
                    const patient = patients.find(item => item.customerId === queryCustomerId) || patients[0];
                    // Hồ sơ khách vãng lai từng khám cũng có profileId và phải
                    // được tái sử dụng, chỉ lịch hẹn guest thuần túy mới không có id.
                    if (patient.customerId) {
                        setCustomerId(patient.customerId);
                    }
                    setFullName(patient.fullName || '');
                    setPhone(patient.phone || '');
                    if (patient.dateOfBirth) setDob(patient.dateOfBirth.split('T')[0]);
                    
                    if (patient.gender) {
                        const g = patient.gender.toLowerCase();
                        setGender(g === 'male' || g === 'female' ? g : 'other');
                    }
                    setAddress(patient.address || '');
                } else {
                    toast.error('Không tìm thấy hồ sơ bệnh nhân theo số điện thoại');
                }
            })
            .catch(() => toast.error('Không thể tải thông tin bệnh nhân tái khám'));
        }
    }, [searchParams]);

    const toggleService = (svc) =>
        setSelectedServiceIds(prev =>
            prev.includes(svc.id)
                ? prev.filter(id => id !== svc.id)
                : [...prev, svc.id]
        );

    const getDiscountRule = (service) => {
        if (!insuranceId) return null;
        const ins = insurances?.find(i => i.insuranceId === insuranceId);
        if (!ins) return null;
        const rule = ins.rules?.find(r => r.departmentType === service.departmentType);
        return rule ? rule.discountPercent : 0;
    };

    const calculateItemPrice = (service) => {
        const discountPercent = getDiscountRule(service) || 0;
        const discountAmount = (service.price * discountPercent) / 100;
        return {
            original: service.price,
            discountPercent,
            discountAmount,
            final: service.price - discountAmount
        };
    };

    const selectedItems = selectedServiceIds
        .map(id => services.find(s => s.id === id))
        .filter(Boolean)
        .map(s => ({ service: s, ...calculateItemPrice(s) }));

    const totalOriginal = selectedItems.reduce((sum, item) => sum + item.original, 0);
    const totalDiscount = selectedItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalFinal = selectedItems.reduce((sum, item) => sum + item.final, 0);

    const filteredServices = services.filter(s => {
        const matchSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchDept = departmentType ? s.departmentType === departmentType : true;
        return matchSearch && matchDept;
    });

    const handleReset = () => {
        setSelectedServiceIds([]);
        setReason('');
        setFullName('');
        setPhone('');
        setDob('');
        setGender('male');
        setAddress('');
        setInsuranceId('');
        setBhytCode('');
        setCustomerId(null);
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
        if (!/^(\+84|0)\d{9,10}$/.test(phone.trim())) {
            setValidationError('Số điện thoại Việt Nam không hợp lệ');
            return;
        }
        if (dob && new Date(dob) >= new Date()) {
            setValidationError('Ngày sinh phải là ngày trong quá khứ');
            return;
        }
        if (address.length > 255) {
            setValidationError('Địa chỉ không được vượt quá 255 ký tự');
            return;
        }
        if (insuranceId && (!bhytCode || !bhytChecked)) {
            setValidationError('Vui lòng kiểm tra mã bảo hiểm trước khi tạo phiếu');
            return;
        }
        if (selectedServiceIds.length === 0) {
            setValidationError(t('validation.serviceRequired'));
            return;
        }

        setShowConfirmModal(true);
    };

    // Helper to get accountId/staffId from storage for issuedById
    const getIssuerId = () => {
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        return storage.getItem('staffId') || storage.getItem('accountId');
    };

    const handleConfirm = () => {
        submit({
            customerId,
            serviceIds: selectedServiceIds,
            issuedById: getIssuerId(),
            reason,
            guestFullName: fullName,
            guestPhone: phone,
            guestAddress: address,
            guestDateOfBirth: dob || null,
            guestGender: toGenderEnum(gender),
            insuranceId: insuranceId || null,
        });
        setShowConfirmModal(false);
    };

    return (
        <ReceptionistLayout>
            <div className="flex flex-col min-h-[calc(100vh-3.5rem)] -m-8">

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto p-8 pb-28">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            
                            {/* ────── Cột trái: Thông tin bệnh nhân & BHYT ────── */}
                            <div className="lg:col-span-6 h-full">
                                {/* ────── Block 1: Thông tin khách hàng ────── */}
                                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 h-full flex flex-col">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold shrink-0">1</span>
                                        <h2 className="text-sm font-bold text-gray-900">Thông tin khách hàng</h2>
                                    </div>

                                    <div className="space-y-4 mb-4">
                                        {/* Họ và tên (1 hàng riêng) */}
                                        <div>
                                            <label className={labelCls}>{t('createTicket.patientInfo.fullName')}</label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                placeholder={t('createTicket.patientInfo.fullNamePlaceholder')}
                                                className={inputCls}
                                            />
                                        </div>

                                        {/* SĐT và Ngày sinh (2 cột) */}
                                        <div className="grid grid-cols-2 gap-4">
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

                                        {/* Giới tính và Địa chỉ (2 cột) */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelCls}>{t('createTicket.patientInfo.gender')}</label>
                                                <div className="flex gap-2">
                                                    {[
                                                        { val: 'male', label: t('createTicket.patientInfo.male') },
                                                        { val: 'female', label: t('createTicket.patientInfo.female') },
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
                                            <div>
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
                                        
                                        {/* Loại Bảo hiểm (Chọn trước) */}
                                        <div>
                                            <label className={labelCls}>Bảo hiểm y tế (nếu có)</label>
                                            <select
                                                value={insuranceId}
                                                onChange={e => {
                                                    setInsuranceId(e.target.value);
                                                    setBhytCode(''); // Xóa mã thẻ khi đổi hãng
                                                }}
                                                className={inputCls}
                                            >
                                                <option value="">Không áp dụng</option>
                                                {insurances?.map(ins => (
                                                    <option key={ins.insuranceId} value={ins.insuranceId}>
                                                        {ins.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Mã thẻ BHYT hiện ra nếu có chọn bảo hiểm */}
                                        {insuranceId && (
                                            <div>
                                                <label className={labelCls}>Số thẻ bảo hiểm (để tra cứu & lưu hồ sơ)</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={bhytCode}
                                                        onChange={e => setBhytCode(e.target.value)}
                                                        placeholder="Nhập mã thẻ..."
                                                        className={inputCls}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={checkBhyt}
                                                        className="px-4 py-0 bg-blue-50 text-blue-600 border border-blue-200 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors shrink-0 h-10"
                                                    >
                                                        Kiểm tra
                                                    </button>
                                                </div>
                                                <p className="mt-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                                    Đã áp dụng chính sách giảm giá của <b>{insurances?.find(i => i.insuranceId === insuranceId)?.name}</b>. Xem chi tiết mức giảm trên từng dịch vụ.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reset link */}
                                    <div className="flex justify-end mt-auto pt-5">
                                        <button
                                            onClick={handleReset}
                                            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors"
                                        >
                                            <RotateCcw size={12} />
                                            {t('createTicket.resetForm')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ────── Cột phải: Dịch vụ y tế ────── */}
                            <div className="lg:col-span-6 h-full">
                                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 h-full flex flex-col">
                                    {/* ────── Block 2: Chọn dịch vụ ────── */}
                                    <section className="flex-1 flex flex-col min-h-0">
                                        <div className="flex items-center justify-between gap-4 mb-6 shrink-0">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold shrink-0">2</span>
                                                <h2 className="text-sm font-bold text-gray-900">
                                                    Dịch vụ y tế
                                                </h2>
                                            </div>
                                            <div className="relative max-w-xs w-full">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Tìm kiếm dịch vụ..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-50 focus:border-primary-500 transition-colors outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-h-0">
                                            {loadingSvc ? (
                                                <p className="text-sm text-gray-400 text-center py-4">{t('createTicket.loading')}</p>
                                            ) : filteredServices.length > 0 ? (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                                                    {Object.entries(
                                                        filteredServices.reduce((acc, service) => {
                                                            const type = service.departmentType === 'EXAMINATION' ? 'EXAMINATION' : 'PARACLINICAL';
                                                            if (!acc[type]) acc[type] = [];
                                                            acc[type].push(service);
                                                            return acc;
                                                        }, {})
                                                    ).sort(([a], [b]) => a === 'EXAMINATION' ? -1 : b === 'EXAMINATION' ? 1 : 0).map(([type, servicesGroup]) => (
                                                        <div key={type} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col h-full overflow-hidden">
                                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 shrink-0">
                                                                {DEPARTMENT_TYPE_LABELS[type] || type}
                                                            </h3>
                                                            <div className="divide-y divide-gray-200 flex-1 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
                                                                {servicesGroup.map(svc => {
                                                                    const checked = selectedServiceIds.includes(svc.id);
                                                                    const priceInfo = calculateItemPrice(svc);
                                                                    return (
                                                                        <label
                                                                            key={svc.id}
                                                                            className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-gray-100/50 rounded-lg px-2 -mx-2 transition-colors w-full"
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={checked}
                                                                                onChange={() => toggleService(svc)}
                                                                                className="mt-0.5 w-4 h-4 accent-gray-800 shrink-0 rounded border-gray-300"
                                                                            />
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2">
                                                                                    <p className={`text-sm font-medium break-words ${checked ? 'text-gray-900' : 'text-gray-800'}`}>
                                                                                        {svc.name}
                                                                                    </p>
                                                                                    {priceInfo.discountPercent > 0 && (
                                                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-green-100 text-green-700 shrink-0">
                                                                                            -{priceInfo.discountPercent}%
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {svc.description && (
                                                                                    <p className="text-xs text-gray-400 mt-0.5 truncate">{svc.description}</p>
                                                                                )}
                                                                                {type === 'PARACLINICAL' && svc.capabilityName && <p className="text-xs text-gray-500 mt-0.5">{svc.capabilityName}</p>}
                                                                            </div>
                                                                            <div className="flex flex-col items-end shrink-0 pl-2">
                                                                                {priceInfo.discountPercent > 0 && (
                                                                                    <span className="text-xs text-gray-400 line-through mb-0.5">
                                                                                        {fmt(priceInfo.original)}
                                                                                    </span>
                                                                                )}
                                                                                <span className={`text-sm font-semibold ${priceInfo.discountPercent > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                                                    {fmt(priceInfo.final)}
                                                                                </span>
                                                                            </div>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    Không tìm thấy dịch vụ nào phù hợp
                                                </p>
                                            )}
                                        </div>
                                        
                                        {/* Lý do khám */}
                                        <div className="mt-6 pt-5 border-t border-gray-100 shrink-0">
                                            <p className={labelCls}>{t('createTicket.bundle.reasonLabel')}</p>
                                            <textarea
                                                value={reason}
                                                onChange={e => setReason(e.target.value)}
                                                placeholder={t('createTicket.bundle.reasonPlaceholder')}
                                                rows={2}
                                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none placeholder:text-gray-300"
                                            />
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        {(validationError || submitError) && <p className="text-red-500 text-sm text-center">{validationError || submitError}</p>}
                    </div>
                </div>

                {/* ── Sticky footer ── */}
                <div className="fixed bottom-0 left-52 right-0 bg-white border-t border-gray-200 px-10 h-16 flex items-center justify-between z-40">
                    <div className="flex items-center gap-6">
                        {totalDiscount > 0 && (
                            <div className="flex flex-col text-sm">
                                <span className="text-gray-500">Tiền gốc: <span className="line-through">{fmt(totalOriginal)}</span></span>
                                <span className="text-green-600 font-medium">Giảm BHYT: -{fmt(totalDiscount)}</span>
                            </div>
                        )}
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            {t('createTicket.totalCost')}
                            <span className="text-xl font-bold text-gray-900">{fmt(totalFinal)}</span>
                        </p>
                    </div>
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
                            total: fmt(totalFinal),
                            services: selectedItems.map(item => item.service),
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

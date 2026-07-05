// src/pages/receptionist/AppointmentDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { useAppointmentDetail } from '@/hooks/useAppointmentDetail';
import { ROUTES } from '@/constants/routes';

export default function AppointmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation('receptionist');

    const { appointment, loading, saving, checkingIn, error, save, checkIn } =
        useAppointmentDetail(id);

    const [fullName,  setFullName]  = useState('');
    const [phone,     setPhone]     = useState('');
    const [age,       setAge]       = useState('');
    const [gender,    setGender]    = useState('');
    const [email,     setEmail]     = useState('');
    const [insurance, setInsurance] = useState('');
    const [insuranceExpiry, setInsuranceExpiry] = useState('');
    const [service,   setService]   = useState('');
    const [reason,    setReason]    = useState('');
    const [date,      setDate]      = useState('');
    const [timeSlot,  setTimeSlot]  = useState('morning');

    useEffect(() => {
        if (!appointment) return;
        setFullName(appointment.fullName         ?? '');
        setPhone(appointment.phone               ?? '');
        setAge(appointment.age                   ?? '');
        setGender(appointment.gender             ?? '');
        setEmail(appointment.email               ?? '');
        setInsurance(appointment.insurance       ?? '');
        setInsuranceExpiry(appointment.insuranceExpiry ?? '');
        setService(appointment.service           ?? '');
        setReason(appointment.reason             ?? '');
        setDate(appointment.date                 ?? '');
        setTimeSlot(appointment.timeSlot         ?? 'morning');
    }, [appointment]);

    const formData = {
        fullName, phone, age, gender, email,
        insurance, insuranceExpiry, service, reason, date, timeSlot,
    };

    const genderOptions = [
        { value: 'male',   label: t('appointmentDetail.step1.genderOptions.male') },
        { value: 'female', label: t('appointmentDetail.step1.genderOptions.female') },
        { value: 'other',  label: t('appointmentDetail.step1.genderOptions.other') },
    ];

    const timeSlots = [
        {
            key:      'morning',
            label:    t('appointmentDetail.step3.morning'),
            subLabel: t('appointmentDetail.step3.morningTime'),
        },
        {
            key:      'afternoon',
            label:    t('appointmentDetail.step3.afternoon'),
            subLabel: t('appointmentDetail.step3.afternoonTime'),
        },
    ];

    const inputCls = 'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 bg-white';
    const labelCls = 'block text-xs text-gray-400 mb-1.5';

    if (loading) {
        return (
            <ReceptionistLayout>
                <p className="text-sm text-gray-400 text-center py-20">
                    {t('appointmentDetail.loading')}
                </p>
            </ReceptionistLayout>
        );
    }

    return (
        <ReceptionistLayout>
            <div className="max-w-2xl mx-auto space-y-5">

                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">
                            {t('appointmentDetail.title')}
                        </h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {t('appointmentDetail.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(ROUTES.RECEPTIONIST_CHECKIN)}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-500 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        {t('appointmentDetail.backToList')}
                    </button>
                </div>

                {/* Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 space-y-8">

                    {/* ── Step 1 ── */}
                    <section>
                        <div className="flex items-center gap-2.5 mb-5">
              <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">
                1
              </span>
                            <h2 className="text-sm font-semibold text-gray-900">
                                {t('appointmentDetail.step1.heading')}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>{t('appointmentDetail.step1.fullName')}</label>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>{t('appointmentDetail.step1.phone')}</label>
                                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>{t('appointmentDetail.step1.age')}</label>
                                    <input type="number" value={age} onChange={e => setAge(e.target.value)} className={inputCls} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>{t('appointmentDetail.step1.gender')}</label>
                                    <select value={gender} onChange={e => setGender(e.target.value)} className={inputCls}>
                                        <option value="" />
                                        {genderOptions.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>{t('appointmentDetail.step1.email')}</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder={t('appointmentDetail.step1.emailPlaceholder')}
                                        className={inputCls}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>{t('appointmentDetail.step1.insurance')}</label>
                                    <input type="text" value={insurance} onChange={e => setInsurance(e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>{t('appointmentDetail.step1.insuranceExpiry')}</label>
                                    <input type="text" value={insuranceExpiry} onChange={e => setInsuranceExpiry(e.target.value)} className={inputCls} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* ── Step 2 ── */}
                    <section>
                        <div className="flex items-center gap-2.5 mb-5">
              <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">
                2
              </span>
                            <h2 className="text-sm font-semibold text-gray-900">
                                {t('appointmentDetail.step2.heading')}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>{t('appointmentDetail.step2.service')}</label>
                                <input type="text" value={service} onChange={e => setService(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>{t('appointmentDetail.step2.reason')}</label>
                                <textarea
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* ── Step 3 ── */}
                    <section>
                        <div className="flex items-center gap-2.5 mb-5">
              <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">
                3
              </span>
                            <h2 className="text-sm font-semibold text-gray-900">
                                {t('appointmentDetail.step3.heading')}
                            </h2>
                        </div>

                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className={labelCls}>{t('appointmentDetail.step3.chooseDate')}</label>
                                <input
                                    type="date"
                                    value={date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setDate(e.target.value)}
                                    className={inputCls}
                                />
                            </div>

                            <div className="flex-1">
                                <label className={labelCls}>{t('appointmentDetail.step3.timeSlot')}</label>
                                <div className="flex gap-2">
                                    {timeSlots.map(slot => (
                                        <button
                                            key={slot.key}
                                            type="button"
                                            onClick={() => setTimeSlot(slot.key)}
                                            className={`flex-1 py-2.5 px-3 rounded-lg border text-sm transition-colors text-left ${
                                                timeSlot === slot.key
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            <p className="font-medium">{slot.label}</p>
                                            <p className="text-xs mt-0.5 text-gray-400">{slot.subLabel}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Error */}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                {/* Actions */}
                <div className="flex justify-center gap-3 pb-8">
                    <button
                        onClick={() => save(formData)}
                        disabled={saving || checkingIn}
                        className="px-8 h-11 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        {saving ? t('appointmentDetail.actions.saving') : t('appointmentDetail.actions.save')}
                    </button>
                    <button
                        onClick={() => checkIn(formData)}
                        disabled={saving || checkingIn}
                        className="px-8 h-11 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        {checkingIn ? t('appointmentDetail.actions.checkingIn') : t('appointmentDetail.actions.checkIn')}
                    </button>
                </div>

            </div>
        </ReceptionistLayout>
    );
}

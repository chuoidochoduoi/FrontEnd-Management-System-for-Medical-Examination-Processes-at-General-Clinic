// src/pages/receptionist/CheckInPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Filter } from 'lucide-react';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { useCheckIn } from '@/hooks/useCheckIn';
import { ROUTES } from '@/constants/routes';

const STATUS_STYLE = {
    // Status values are mapped to lowercase in hook
    'pending':       'bg-green-100 text-green-700',
    'confirmed':     'bg-blue-100 text-blue-700',
    'cancelled':     'bg-red-100 text-red-700',
    'completed':     'bg-gray-100 text-gray-500',
};

const STATUS_LABEL = {
    'pending': 'Chờ Check-in',
    'confirmed': 'Đã xác nhận',
    'cancelled': 'Đã hủy',
    'completed': 'Hoàn thành',
};

const SLOT_STYLE = {
    'MORNING':   'text-orange-500 font-semibold',
    'AFTERNOON': 'text-blue-500 font-semibold',
};

const TIME_SLOT_LABEL = {
    MORNING: 'SÁNG',
    AFTERNOON: 'CHIỀU',
};

export default function CheckInPage() {
    const { t } = useTranslation('receptionist');
    const navigate = useNavigate();

    const { appointments, loading, error, fetchAppointments } = useCheckIn();

    const [search,   setSearch]   = useState('');
    const [date,     setDate]     = useState('');
    const [timeSlot, setTimeSlot] = useState('MORNING');

    // Load lần đầu
    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleFilter = () => {
        fetchAppointments({ date });
    };

    return (
        <ReceptionistLayout>
            <div className="space-y-6">

                {/* Title */}
                <h1 className="text-xl font-semibold text-gray-900">
                    {t('checkIn.title')}
                </h1>

                {/* Filter bar */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-end gap-4">

                    {/* Search */}
                    <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1.5">{t('checkIn.search')}</p>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t('checkIn.searchPlaceholder')}
                                className="w-full h-10 pl-9 pr-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div className="w-44">
                        <p className="text-xs text-gray-400 mb-1.5">{t('checkIn.viewDate')}</p>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50"
                        />
                    </div>

                    {/* Time slot filter - sẽ filter ở frontend vì backend chưa hỗ trợ */}
                    <div className="w-36">
                        <p className="text-xs text-gray-400 mb-1.5">{t('checkIn.timeSlot')}</p>
                        <select
                            value={timeSlot}
                            onChange={e => setTimeSlot(e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md outline-none focus:border-primary-500 bg-white"
                        >
                            <option value="">{t('checkIn.all')}</option>
                            <option value="MORNING">{t('checkIn.morning')}</option>
                            <option value="AFTERNOON">{t('checkIn.afternoon')}</option>
                        </select>
                    </div>

                    {/* Buttons */}
                    <button
                        onClick={() => navigate(ROUTES.RECEPTIONIST_CREATE_TICKET)}
                        className="h-10 px-5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                    >
                        {t('checkIn.createTicket')}
                    </button>
                    <button
                        onClick={handleFilter}
                        className="h-10 px-5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <Filter size={14} />
                        {t('checkIn.filter')}
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[80px_140px_180px_1fr_120px_120px_1fr_140px_160px] px-6 py-3 border-b border-gray-100">
                        {[
                            t('checkIn.table.timeSlot'),
                            t('checkIn.table.code'),
                            t('checkIn.table.patient'),
                            t('checkIn.table.phone'),
                            t('checkIn.table.age'),
                            t('checkIn.table.gender'),
                            t('checkIn.table.address'),
                            t('checkIn.table.status'),
                            t('checkIn.table.actions'),
                        ].map(col => (
                            <span key={col} className="text-xs font-medium text-gray-400">{col}</span>
                        ))}
                    </div>

                    {/* Rows */}
                    {loading && (
                        <p className="text-sm text-gray-400 text-center py-10">{t('checkIn.loading')}</p>
                    )}
                    {error && (
                        <p className="text-sm text-red-500 text-center py-10">{error}</p>
                    )}
                    {!loading && !error && Array.isArray(appointments) && appointments.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-10">{t('checkIn.noData')}</p>
                    )}

                    {/* Filter appointments by search, timeSlot on frontend */}
                    {!loading && Array.isArray(appointments) && appointments
                        .filter(appt => {
                            // Search filter
                            if (search && !(appt.patientName?.toLowerCase().includes(search.toLowerCase()) ||
                                           appt.phone?.includes(search) ||
                                           appt.code?.includes(search))) {
                                return false;
                            }
                            // Time slot filter
                            return !timeSlot || appt.timeSlot === timeSlot;
                        })
                        .map((appt, idx) => (
                        <div
                            key={appt.id ?? idx}
                            className="grid grid-cols-[80px_140px_180px_1fr_120px_120px_1fr_140px_160px] px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors items-start"
                        >
                            {/* Khung ca */}
                            <span className={`text-xs ${SLOT_STYLE[appt.timeSlot] ?? 'text-gray-600'}`}>
                                {TIME_SLOT_LABEL[appt.timeSlot] ?? appt.timeSlot}
                            </span>

                            {/* Mã lịch */}
                            <span className="text-sm text-gray-700">{appt.code}</span>

                            {/* Tên bệnh nhân */}
                            <span className="text-sm font-medium text-gray-900">{appt.patientName}</span>

                            {/* So dien thoai */}
                            <span className="text-sm text-gray-700">{appt.phone || '-'}</span>

                            {/* Tuoi */}
                            <span className="text-sm text-gray-700">{appt.age || '-'}</span>

                            {/* Gioi tinh */}
                            <span className="text-sm text-gray-700">{appt.gender || '-'}</span>

                            {/* Dia chi */}
                            <span className="text-sm text-gray-700 truncate">{appt.address || '-'}</span>

                            {/* Trạng thái */}
                            <div>
                                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${STATUS_STYLE[appt.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                    {appt.status === 'pending' && <span>✓</span>}
                                    {STATUS_LABEL[appt.status] ?? appt.status}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-1.5 items-start">
                                <button  onClick={() => navigate(`/receptionist/appointments/${appt.id}`)} className="text-xs text-gray-500 hover:text-primary-500 transition-colors">
                                    {t('checkIn.actions.viewDetail')}
                                </button>
                                {appt.status === 'pending' && (
                                    <button className="text-xs px-2.5 py-1 border border-gray-300 rounded hover:border-primary-400 hover:text-primary-500 transition-colors">
                                        {t('checkIn.actions.printTicket')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </ReceptionistLayout>
    );
}

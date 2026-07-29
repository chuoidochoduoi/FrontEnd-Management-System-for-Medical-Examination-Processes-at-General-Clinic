import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { ROUTES } from '@/constants/routes';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function FollowUpListPage() {
    const { t } = useTranslation('receptionist');
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [selectedItem, setSelectedItem] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('MORNING');
    const [submitting, setSubmitting] = useState(false);

    const fetchFollowUps = async (page = 1) => {
        setLoading(true);
        try {
            const token = get('token');
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiBase}/api/receptionist/follow-ups?page=${page - 1}&size=10&sort=followUpDate,asc`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setFollowUps(data.content);
                setTotalPages(data.totalPages);
                setTotal(data.totalElements);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách tái khám:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFollowUps(page);
    }, [page]);

    // Handle create appointment
    const handleCreateAppointment = (item) => {
        setSelectedItem(item);
        const date = item.followUpDate ? new Date(item.followUpDate) : new Date();
        setAppointmentDate(date.toISOString().split('T')[0]);
        setTimeSlot('MORNING');
    };

    const submitAppointment = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = get('token');
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const payload = {
                customerId: selectedItem.customerId,
                scheduledAt: `${appointmentDate}T00:00:00`,
                timeSlot: timeSlot,
                serviceIds: []
            };
            const res = await fetch(`${apiBase}/api/receptionist/follow-ups/${selectedItem.recordId}/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                toast.success('Tạo lịch hẹn thành công!');
                setSelectedItem(null);
                fetchFollowUps(page); // refresh list
            } else {
                toast.error('Lỗi khi tạo lịch hẹn');
            }
        } catch (err) {
            console.error(err);
            toast.error('Lỗi kết nối');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ReceptionistLayout>
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Danh sách tái khám</h1>
                        <p className="text-sm text-gray-500 mt-1">Các bệnh nhân được bác sĩ yêu cầu tái khám</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-[100px_1fr_120px_150px_120px_1fr_120px] px-6 py-4 bg-gray-50/80 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div>Mã bệnh án</div>
                        <div>Họ tên</div>
                        <div>Điện thoại</div>
                        <div>Bác sĩ yêu cầu</div>
                        <div>Ngày tái khám</div>
                        <div>Ghi chú</div>
                        <div className="text-right">Hành động</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {loading ? (
                            <div className="p-8 text-center text-sm text-gray-500">Đang tải...</div>
                        ) : followUps.length === 0 ? (
                            <div className="p-12 text-center">
                                <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-sm font-medium text-gray-900 mb-1">Không có yêu cầu tái khám</h3>
                                <p className="text-sm text-gray-500">Hiện tại không có bệnh nhân nào cần đặt lịch tái khám.</p>
                            </div>
                        ) : followUps.map((item) => (
                            <div key={item.recordId} className="grid grid-cols-[100px_1fr_120px_150px_120px_1fr_120px] px-6 py-4 items-center hover:bg-gray-50/50 transition-colors">
                                <div className="text-sm font-medium text-gray-900">{item.recordCode || '—'}</div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs">
                                        {item.customerName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{item.customerName}</div>
                                        <div className="text-xs text-gray-500">{item.customerGender} • {item.customerAge} tuổi</div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600">{item.customerPhone}</div>
                                <div className="text-sm text-gray-600">{item.doctorName}</div>
                                
                                <div>
                                    {item.followUpDate ? (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(item.followUpDate).toLocaleDateString('vi-VN')}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-400 italic">Chưa xác định</div>
                                    )}
                                </div>
                                
                                <div className="text-sm text-gray-600 truncate pr-4" title={item.followUpNote}>
                                    {item.followUpNote || '-'}
                                </div>
                                
                                <div className="text-right">
                                    <button
                                        onClick={() => handleCreateAppointment(item)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 hover:text-primary-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <CalendarClock className="w-4 h-4" />
                                        Tạo lịch hẹn
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1 text-gray-500 hover:bg-white rounded-md disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors
                                    ${page === p 
                                        ? 'bg-primary-600 text-white shadow-sm' 
                                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                        
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-1 text-gray-500 hover:bg-white rounded-md disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">Tạo lịch hẹn tái khám</h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={submitAppointment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bệnh nhân</label>
                                <div className="text-sm text-gray-900 font-semibold">{selectedItem.customerName}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hẹn</label>
                                <input 
                                    type="date" 
                                    required
                                    value={appointmentDate} 
                                    onChange={e => setAppointmentDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Buổi khám</label>
                                <select 
                                    value={timeSlot} 
                                    onChange={e => setTimeSlot(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                                >
                                    <option value="MORNING">Sáng (07:30 - 11:30)</option>
                                    <option value="AFTERNOON">Chiều (13:30 - 17:30)</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setSelectedItem(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
                                    Hủy
                                </button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
                                    {submitting ? 'Đang tạo...' : 'Xác nhận'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ReceptionistLayout>
    );
}

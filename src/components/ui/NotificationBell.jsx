import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

export default function NotificationBell() {
    const { t } = useTranslation('common');
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/me/unread-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count || 0);
            }
        } catch (err) {
            console.error('Failed to fetch unread count', err);
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/me?size=5&sort=createdAt,desc`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.content || []);
                fetchUnreadCount();
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id, status) => {
        if (status === 'READ') return; // Already read
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/${id}/mark-read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, status: 'READ' } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open]);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative flex items-center" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors focus:outline-none"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Thông báo</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                {unreadCount} mới
                            </span>
                        )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto overscroll-contain">
                        {loading && notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center">
                                <Bell className="text-gray-300 w-10 h-10 mb-2" />
                                <p className="text-sm text-gray-500">Không có thông báo nào</p>
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.notificationId}
                                        onClick={() => markAsRead(notif.notificationId, notif.status)}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group ${notif.status !== 'READ' ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${notif.status !== 'READ' ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className={`text-xs mt-0.5 line-clamp-2 ${notif.status !== 'READ' ? 'text-gray-600' : 'text-gray-500'}`}>
                                                    {notif.content}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                                                    {dayjs(notif.createdAt || new Date()).fromNow()}
                                                </p>
                                            </div>
                                            {notif.status !== 'READ' && (
                                                <div className="flex-shrink-0 flex items-start">
                                                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

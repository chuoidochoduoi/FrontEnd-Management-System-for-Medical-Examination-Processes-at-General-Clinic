import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MessageCircle, X, Send, User, Bot, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

export default function ChatWidget() {
    const { t } = useTranslation('customer');
    const [isOpen, setIsOpen] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [status, setStatus] = useState(null); // BOT_HANDLING, WAITING_FOR_AGENT, IN_PROGRESS, CLOSED
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [guestProfileId, setGuestProfileId] = useState(null);
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [showGuestForm, setShowGuestForm] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        setIsLoggedIn(!!token);
        
        if (!token) {
            const savedSessionId = sessionStorage.getItem('guestSessionId');
            const savedProfileId = sessionStorage.getItem('guestProfileId');
            if (savedSessionId && savedProfileId) {
                setSessionId(savedSessionId);
                setGuestProfileId(savedProfileId);
                // Cannot fetch status without an endpoint, but fetchMessages will work
            }
        }
    }, []);

    const fetchMessages = async (id) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 'Cache-Control': 'no-cache' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        try {
            const [msgRes, statusRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/${id}/messages`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/${id}/status`, { headers })
            ]);

            if (msgRes.ok) {
                const data = await msgRes.json();
                setMessages(data);
            }
            if (statusRes.ok) {
                const statusData = await statusRes.json();
                setStatus(statusData.status);
            }
        } catch (error) {
            console.error('Failed to fetch chat data:', error);
        }
    };

    const startSession = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/session`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessionId(data.sessionId);
                setStatus(data.status);
                fetchMessages(data.sessionId);
            } else {
                toast.error('Không thể kết nối đến máy chủ hỗ trợ.');
            }
        } catch (error) {
            console.error('Failed to start chat session', error);
            toast.error('Có lỗi xảy ra khi bắt đầu chat.');
        } finally {
            setLoading(false);
        }
    };

    const startGuestSession = async (e) => {
        e.preventDefault();
        if (!guestName.trim() || !guestPhone.trim()) return;

        const phoneRegex = /^(\+84|0)\d{9,10}$/;
        if (!phoneRegex.test(guestPhone)) {
            setPhoneError('Số điện thoại không hợp lệ. Ví dụ: 0912345678');
            return;
        }
        setPhoneError('');
        
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/guest/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: guestName, phone: guestPhone })
            });
            
            if (res.ok) {
                const data = await res.json();
                setSessionId(data.sessionId);
                setStatus(data.status);
                setGuestProfileId(data.guestProfileId);
                setShowGuestForm(false);
                
                sessionStorage.setItem('guestSessionId', data.sessionId);
                sessionStorage.setItem('guestProfileId', data.guestProfileId);
                
                fetchMessages(data.sessionId);
            } else {
                const errText = await res.text();
                try {
                    const errJson = JSON.parse(errText);
                    toast.error(errJson.message || errJson.error || 'Lỗi xử lý từ máy chủ.');
                } catch {
                    toast.error(errText || 'Thông tin không hợp lệ, vui lòng kiểm tra lại định dạng Số điện thoại.');
                }
            }
        } catch (error) {
            console.error('Failed to start guest session', error);
            toast.error('Có lỗi kết nối, vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !sessionId) {
            if (isLoggedIn) {
                startSession();
            } else {
                setShowGuestForm(true);
            }
        } else if (isOpen && sessionId) {
            // Lấy messages mỗi khi mở lại chat
            fetchMessages(sessionId);
        }
    }, [isOpen, sessionId, isLoggedIn]);

    // Lắng nghe realtime
    useWebSocket(sessionId ? `/topic/chat-${sessionId}` : null, null, (msg) => {
        if (msg === 'NEW_MESSAGE') {
            fetchMessages(sessionId);
        } else if (msg === 'SESSION_CLOSED') {
            setStatus('CLOSED');
            fetchMessages(sessionId);
        }
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !sessionId || status === 'CLOSED') return;
        
        const tempMsg = { messageId: Date.now(), senderType: 'CUSTOMER', content: input };
        setMessages(prev => [...prev, tempMsg]);
        const msgToSend = input;
        setInput('');

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        let res;
        if (isLoggedIn) {
            res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/${sessionId}/messages/customer`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ content: msgToSend })
            });
        } else {
            res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/guest/${sessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: msgToSend, guestProfileId })
            });
        }
        
        if (res && res.ok) {
            fetchMessages(sessionId);
        }
    };

    const handleQuickReply = (text) => {
        setInput(text);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col mb-4 h-[500px] transition-all animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-primary-600 p-4 text-white flex justify-between items-center shadow-md z-10 relative">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner">
                                {status === 'IN_PROGRESS' ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm tracking-wide">
                                    {status === 'IN_PROGRESS' ? 'Lễ tân hỗ trợ' : 'Trợ lý ảo Clinic'}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`w-2 h-2 rounded-full ${status === 'CLOSED' ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`}></span>
                                    <p className="text-xs text-primary-100 font-medium">
                                        {status === 'WAITING_FOR_AGENT' ? 'Đang chờ lễ tân...' : (status === 'CLOSED' ? 'Đã kết thúc' : 'Đang hoạt động')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-primary-100 hover:text-white hover:bg-primary-700 p-1.5 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Body */}
                    {!showGuestForm ? (<>
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
                            {loading && <div className="text-center text-xs text-gray-400 mt-4">Đang kết nối...</div>}
                            
                            {messages.length === 0 && !loading && (
                                <div className="text-center text-xs text-gray-500 my-8">
                                    <Bot size={32} className="mx-auto text-gray-300 mb-2" />
                                    Xin chào! Mình có thể giúp gì cho bạn?
                                </div>
                            )}

                            {messages.map((msg, idx) => {
                            const isCustomer = msg.senderType === 'CUSTOMER';
                            return (
                                <div key={msg.messageId || idx} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                        isCustomer 
                                        ? 'bg-primary-600 text-white rounded-br-none' 
                                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                        {/* Quick Replies for Bot */}
                        {status === 'BOT_HANDLING' && (
                            <div className="px-4 pb-2 pt-1 flex gap-2 overflow-x-auto no-scrollbar bg-gray-50/50">
                                {['Giờ làm việc', 'Địa chỉ', 'Bảng giá', 'Gặp lễ tân'].map(text => (
                                    <button 
                                        key={text} 
                                        onClick={() => handleQuickReply(text)}
                                        className="whitespace-nowrap bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 text-xs px-3 py-1.5 rounded-full transition-colors shadow-sm font-medium"
                                    >
                                        {text}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-gray-100 relative">
                            {status === 'CLOSED' ? (
                                <div className="text-center text-xs text-gray-500 py-2 flex items-center justify-center gap-1.5 bg-gray-50 rounded-lg">
                                    <AlertCircle size={14} /> Phiên chat đã kết thúc
                                    <button onClick={() => {
                                        setSessionId(null);
                                        if (!isLoggedIn) sessionStorage.removeItem('guestSessionId');
                                    }} className="text-primary-600 font-semibold ml-1 hover:underline">Tạo phiên mới</button>
                                </div>
                            ) : (
                                <form onSubmit={sendMessage} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={status === 'WAITING_FOR_AGENT' ? 'Đang chờ lễ tân...' : 'Nhập tin nhắn...'} 
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-gray-400"
                                        disabled={status === 'WAITING_FOR_AGENT' || status === 'CLOSED'}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!input.trim() || status === 'WAITING_FOR_AGENT'}
                                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 flex items-center justify-center shadow-md transition-all active:scale-95"
                                    >
                                        <Send size={18} className="ml-1" />
                                    </button>
                                </form>
                            )}
                        </div>
                    </>) : (
                        <div className="flex-1 p-5 flex flex-col bg-white">
                            <h3 className="font-semibold text-gray-800 text-center mb-1">Bắt đầu trò chuyện</h3>
                            <p className="text-xs text-gray-500 text-center mb-6">Vui lòng để lại thông tin để chúng tôi có thể hỗ trợ bạn tốt nhất</p>
                            
                            <form onSubmit={startGuestSession} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Họ và Tên</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={guestName}
                                        onChange={e => setGuestName(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                        placeholder="VD: Nguyễn Văn A"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Số điện thoại</label>
                                    <input 
                                        type="tel" 
                                        required
                                        value={guestPhone}
                                        onChange={e => {
                                            setGuestPhone(e.target.value);
                                            if (phoneError) setPhoneError('');
                                        }}
                                        className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all ${
                                            phoneError 
                                            ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                                            : 'border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                                        }`}
                                        placeholder="VD: 0912345678"
                                    />
                                    {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading || !guestName.trim() || !guestPhone.trim()}
                                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium rounded-lg px-4 py-2.5 shadow-md transition-all active:scale-95 mt-4"
                                >
                                    {loading ? 'Đang kết nối...' : 'Bắt đầu Chat'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-primary-500/30 transition-all hover:-translate-y-1 group"
                >
                    <MessageCircle size={28} className="group-hover:scale-110 transition-transform" />
                </button>
            )}
        </div>
    );
}

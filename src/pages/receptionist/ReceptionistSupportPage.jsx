import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { useTranslation } from 'react-i18next';
import { Send, User, CheckCircle2 } from 'lucide-react';

export default function ReceptionistSupportPage() {
    const { t } = useTranslation('receptionist');
    const [currentTab, setCurrentTab] = useState('active'); // 'active' | 'history'
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const fetchSessions = async (tab = currentTab) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const endpoint = tab === 'active' ? '/api/v1/chat/sessions/active' : '/api/v1/chat/sessions/history';
        const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setSessions(data);
        }
    };

    useEffect(() => {
        fetchSessions(currentTab);
        setActiveSession(null);
    }, [currentTab]);

    const fetchMessages = async (sessionId) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/${sessionId}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setMessages(data);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    // Lắng nghe realtime các phiên mới hoặc tin nhắn mới từ bất kỳ session nào
    useWebSocket('/topic/receptionist-chat', null, (msg) => {
        if (['NEW_MESSAGE', 'NEW_CHAT_REQUEST', 'CHAT_ACCEPTED', 'SESSION_CLOSED'].includes(msg)) {
            fetchSessions();
        }
    });

    // Lắng nghe tin nhắn trong phiên hiện tại
    useWebSocket(activeSession ? `/topic/chat-${activeSession.sessionId}` : null, null, (msg) => {
        if (msg === 'NEW_MESSAGE' || msg === 'SESSION_CLOSED') {
            fetchMessages(activeSession.sessionId);
            if (msg === 'SESSION_CLOSED') fetchSessions();
        }
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSelectSession = (s) => {
        setActiveSession(s);
        fetchMessages(s.sessionId);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !activeSession || activeSession.status === 'CLOSED') return;
        
        const tempMsg = { messageId: Date.now(), senderType: 'RECEPTIONIST', content: input };
        setMessages(prev => [...prev, tempMsg]);
        const msgToSend = input;
        setInput('');

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/${activeSession.sessionId}/messages/receptionist`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ content: msgToSend })
        });
    };

    const closeSession = async () => {
        if (!activeSession) return;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/${activeSession.sessionId}/close`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        setActiveSession(null);
    };

    return (
        <ReceptionistLayout>
            <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Sidebar danh sách chat */}
                <div className="w-80 border-r border-gray-100 bg-gray-50/30 flex flex-col">
                    <div className="px-5 pt-5 pb-3 border-b border-gray-100 bg-white">
                        <h2 className="font-bold text-lg text-gray-900">Inbox Hỗ trợ</h2>
                        <div className="flex gap-2 mt-3">
                            <button 
                                onClick={() => setCurrentTab('active')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${currentTab === 'active' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Đang xử lý
                            </button>
                            <button 
                                onClick={() => setCurrentTab('history')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${currentTab === 'history' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Lịch sử
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {sessions.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-10">
                                {currentTab === 'active' ? 'Không có chat nào đang chờ' : 'Chưa có lịch sử chat'}
                            </p>
                        )}
                        {sessions.map(s => (
                            <button
                                key={s.sessionId}
                                onClick={() => handleSelectSession(s)}
                                className={`w-full text-left p-4 rounded-xl transition-all border ${
                                    activeSession?.sessionId === s.sessionId
                                    ? 'bg-primary-50 border-primary-200 shadow-sm'
                                    : 'bg-white border-gray-100 hover:border-primary-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0">
                                        <User size={18} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="font-semibold text-gray-900 truncate">{s.customerName}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${s.status === 'WAITING_FOR_AGENT' ? 'bg-orange-400 animate-pulse' : s.status === 'IN_PROGRESS' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {s.status === 'WAITING_FOR_AGENT' ? 'Đang chờ lễ tân' : s.status === 'IN_PROGRESS' ? 'Đang xử lý' : 'Đã kết thúc'}
                                                </p>
                                            </div>
                                            {s.updatedAt && <p className="text-[10px] text-gray-400">{new Date(s.updatedAt).toLocaleDateString('vi-VN')}</p>}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Khung chat chính */}
                <div className="flex-1 flex flex-col bg-gray-50/50">
                    {activeSession ? (
                        <>
                            {/* Header */}
                            <div className="bg-white p-5 border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
                                <div>
                                    <h3 className="font-bold text-gray-900">{activeSession.customerName}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Trạng thái: {activeSession.status}</p>
                                </div>
                                {activeSession.status !== 'CLOSED' && (
                                    <button
                                        onClick={closeSession}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <CheckCircle2 size={16} /> Đóng phiên chat
                                    </button>
                                )}
                            </div>

                            {/* Lịch sử */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.senderType === 'RECEPTIONIST';
                                    const isBot = msg.senderType === 'BOT';
                                    return (
                                        <div key={msg.messageId || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                                isMe 
                                                ? 'bg-primary-600 text-white rounded-br-none' 
                                                : isBot
                                                ? 'bg-gray-200 text-gray-700 rounded-bl-none font-medium'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                            }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={sendMessage} className="flex gap-3">
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Nhập tin nhắn để trả lời khách..." 
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-gray-400"
                                        disabled={activeSession.status === 'CLOSED'}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!input.trim() || activeSession.status === 'CLOSED'}
                                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 flex items-center justify-center shadow-md transition-all active:scale-95 font-medium gap-2"
                                    >
                                        Gửi <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <MessageCircle size={48} className="text-gray-200 mb-4" />
                            <p>Chọn một phiên chat để bắt đầu hỗ trợ</p>
                        </div>
                    )}
                </div>
            </div>
        </ReceptionistLayout>
    );
}

import { AlertTriangle } from 'lucide-react';

export default function CancelConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = 'Hủy lịch hẹn', 
    message = 'Bạn có chắc chắn muốn hủy lịch hẹn này không? Hành động này không thể hoàn tác.',
    confirmText = 'Hủy lịch',
    cancelText = 'Đóng',
    isLoading = false 
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative flex flex-col border border-slate-100 animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-red-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center border border-red-200 shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button 
                        onClick={onClose} 
                        disabled={isLoading}
                        className="flex-1 h-12 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={isLoading}
                        className="flex-1 h-12 bg-red-600 rounded-xl text-sm font-bold text-white hover:bg-red-700 transition-all shadow-[0_8px_20px_-6px_rgba(220,38,38,0.5)] disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]">
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Đang xử lý...</span>
                            </div>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

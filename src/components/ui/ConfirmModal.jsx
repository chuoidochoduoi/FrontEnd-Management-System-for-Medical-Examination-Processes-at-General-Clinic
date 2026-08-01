import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác nhận", 
  message = "Bạn có chắc chắn muốn thực hiện hành động này?", 
  confirmText = "Xác nhận", 
  cancelText = "Hủy",
  isDanger = true,
  isLoading = false
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transform transition-all">
        <div className="px-6 py-6 sm:flex sm:items-start">
          <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isDanger ? 'bg-red-100' : 'bg-blue-100'}`}>
            <AlertTriangle className={`h-6 w-6 ${isDanger ? 'text-red-600' : 'text-blue-600'}`} aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {message}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
          <button
            type="button"
            disabled={isLoading}
            className={`inline-flex w-full justify-center rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm sm:w-auto transition-colors disabled:opacity-60 ${
              isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
            }`}
            onClick={onConfirm}
          >
            {isLoading ? 'Đang xử lý...' : confirmText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors disabled:opacity-60"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

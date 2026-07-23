import { useCallback } from 'react';
import { toast } from 'react-toastify';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

// Notification helper using toast
const notify = (message, type = 'error') => {
    if (type === 'error') {
        toast.error(message);
    } else {
        toast.success(message);
    }
};

/**
 * Queue actions hook - calls specific endpoints for queue operations
 * Endpoints:
 *   POST /api/v1/queue-tickets/{id}/call
 *   POST /api/v1/queue-tickets/{id}/start-exam
 *   POST /api/v1/queue-tickets/{id}/complete
 *   POST /api/v1/queue-tickets/{id}/skip
 *   POST /api/v1/queue-tickets/{id}/return
 */
export function useQueueActions() {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const token = get('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const makeRequest = async (url, actionName) => {
        try {
            console.log(`[QueueActions] Calling ${actionName} at:`, url);
            const res = await fetch(url, { method: 'POST', headers });
            console.log('[QueueActions] Response:', res.status);
            if (!res.ok) {
                const errText = await res.text();
                let errorMsg;
                try {
                    const errData = JSON.parse(errText);
                    errorMsg = errData.message || errData.error || `HTTP ${res.status}`;
                } catch {
                    errorMsg = errText || `HTTP ${res.status}`;
                }
                console.error('[QueueActions] Failed:', res.status, errorMsg);
                notify(errorMsg);
                return { success: false, error: errorMsg };
            }
            console.log('[QueueActions] Success:', actionName);
            return { success: true };
        } catch (err) {
            console.error('[QueueActions] Error:', err);
            notify(err.message);
            return { success: false, error: err.message };
        }
    };

    const callPatient = useCallback(async (patientId) => {
        const result = await makeRequest(`${apiBase}/api/v1/queue-tickets/${patientId}/call`, 'gọi bệnh nhân');
        return result;
    }, [apiBase, headers]);

    const startExam = useCallback(async (patientId) => {
        const result = await makeRequest(`${apiBase}/api/v1/queue-tickets/${patientId}/start-exam`, 'bắt đầu khám');
        return result;
    }, [apiBase, headers]);

    const completeExam = useCallback(async (patientId) => {
        const result = await makeRequest(`${apiBase}/api/v1/queue-tickets/${patientId}/complete`, 'hoàn thành');
        return result;
    }, [apiBase, headers]);

    const markAbsent = useCallback(async (patientId) => {
        const result = await makeRequest(`${apiBase}/api/v1/queue-tickets/${patientId}/skip`, 'đánh dấu vắng');
        return result;
    }, [apiBase, headers]);

    const skipPatient = useCallback(async (patientId) => {
        const result = await makeRequest(`${apiBase}/api/v1/queue-tickets/${patientId}/skip`, 'bỏ qua');
        return result;
    }, [apiBase, headers]);

    const returnToQueue = useCallback(async (patientId) => {
        const result = await makeRequest(`${apiBase}/api/v1/queue-tickets/${patientId}/return`, 'quay lại');
        return result;
    }, [apiBase, headers]);

    return { callPatient, startExam, completeExam, markAbsent, skipPatient, returnToQueue };
}

export default useQueueActions;
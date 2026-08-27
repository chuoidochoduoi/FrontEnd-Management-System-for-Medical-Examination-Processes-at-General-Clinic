import { toast } from 'react-toastify';

export function useToast() {
    const success = (message) => toast.success(message);
    const error = (message) => toast.error(message);
    const info = (message) => toast.info(message);
    const warn = (message) => toast.warn(message);

    return { success, error, info, warn };
}
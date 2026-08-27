import { useEffect, useState } from 'react';

const getStored = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export default function useFeedbackCount(enabled = true) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!enabled) return undefined;

        let active = true;

        const load = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/feedbacks/stats/unanswered-count`,
                    { headers: { Authorization: `Bearer ${getStored('token')}` } }
                );

                if (!response.ok) return;

                const data = await response.json();
                if (active) setCount(Number(data.count) || 0);
            } catch {
                // Huy hiệu chỉ là thông tin bổ trợ, không làm gián đoạn sidebar khi mất mạng.
            }
        };

        load();
        const timer = window.setInterval(load, 30000);
        window.addEventListener('feedback-count-changed', load);

        return () => {
            active = false;
            window.clearInterval(timer);
            window.removeEventListener('feedback-count-changed', load);
        };
    }, [enabled]);

    return count;
}

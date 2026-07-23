// src/hooks/useCreateTicket.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { toast } from 'react-toastify';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = () => ({ Authorization: `Bearer ${get('token')}` });

export function useCreateTicket() {
    const [services, setServices] = useState([]);
    const [loadingSvc, setLoadingSvc] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fetch all available services (single API like appointment booking)
    useEffect(() => {
        const fetchServices = async () => {
            setLoadingSvc(true);
            setError('');
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/medical-services/available`,
                    { headers: bearer() }
                );
                if (!res.ok) throw new Error('Không thể tải danh sách dịch vụ.');
                const data = await res.json();
                // Map API response
                const mappedServices = (data.content || []).map(s => ({
                    id: s.serviceId,
                    name: s.name,
                    price: s.price,
                    description: s.description,
                }));
                setServices(mappedServices);
            } catch (err) {
                setError(err.message || 'Có lỗi xảy ra.');
            } finally {
                setLoadingSvc(false);
            }
        };
        fetchServices();
    }, []);

    const submit = async (payload) => {
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/customer-visits`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...bearer() },
                    body: JSON.stringify(payload),
                }
            );
            if (!res.ok) throw new Error('Tạo phiếu thất bại. Vui lòng thử lại.');
            toast.success('Tạo phiếu khám thành công!');
            setTimeout(() => navigate(ROUTES.RECEPTIONIST_CHECKIN), 1500);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra.');
            toast.error(err.message || 'Tạo phiếu thất bại. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return { services, loadingSvc, submitting, error, submit };
}
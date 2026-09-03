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

    // Fetch available medical services for the receptionist ticket form.
    useEffect(() => {
        const fetchData = async () => {
            setLoadingSvc(true);
            setError('');
            try {
                const resSvc = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/v1/medical-services?status=ACTIVE&size=1000`,
                    { headers: bearer() }
                );
                if (!resSvc.ok) throw new Error('Không thể tải danh sách dịch vụ.');
                const dataSvc = await resSvc.json();
                const mappedServices = (dataSvc.content || []).map(s => ({
                    id: s.serviceId,
                    code: s.serviceCode,
                    name: s.name,
                    price: s.price,
                    description: s.description,
                    departmentType: s.departmentType,
                    department: s.departmentName || '',
                    specializationName: s.requiredSpecializationName || '',
                    durationMinutes: s.durationMinutes,
                    workflowPriority: s.workflowPriority ?? 1,
                    capabilityName: s.requiredCapabilityName || '',
                    relations: s.relations || [],
                }));
                setServices(mappedServices);
            } catch (err) {
                setError(err.message || 'Có lỗi xảy ra.');
            } finally {
                setLoadingSvc(false);
            }
        };
        fetchData();
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
            const response = await res.json().catch(() => null);
            if (!res.ok) throw new Error(response?.message || response?.error || 'Tạo phiếu thất bại. Vui lòng thử lại.');
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

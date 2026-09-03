import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const PAGE_SIZE = 7;

export function useAppointments() {
    const { t } = useTranslation('appointments');
    const queryClient = useQueryClient();
    
    const [params, setParams] = useState({
        code: '',
        status: '',
        date: '',
        patientProfileId: '',
        includeFamily: true,
        page: 0
    });

    const queryInfo = useQuery({
        queryKey: ['myAppointments', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams({
                code: params.code,
                status: params.status,
                page: String(params.page),
                size: String(PAGE_SIZE),
                includeFamily: String(params.includeFamily),
            });
            if (params.patientProfileId) queryParams.set('patientProfileId', params.patientProfileId);
            if (params.date) {
                queryParams.set('from', `${params.date}T00:00:00`);
                queryParams.set('to', `${params.date}T23:59:59`);
            }
            const res = await api.get(`/api/v1/appointments/my?${queryParams}`);
            const data = res.data;
            return {
                appointments: data.content ?? data.items ?? data,
                total: data.totalElements ?? data.total ?? data.length
            };
        }
    });

    const fetchAppointments = useCallback((newParams = {}) => {
        setParams(prev => ({ ...prev, ...newParams }));
    }, []);

    const cancelMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.post(`/api/v1/appointments/my/${id}/cancel`);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Hủy lịch hẹn thành công!');
            queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
        },
        onError: (err) => {
            const message = err.response?.data?.message || err.message || t('myAppointments.errors.cancelFailed');
            toast.error(message);
        }
    });

    return { 
        appointments: queryInfo.data?.appointments || [], 
        loading: queryInfo.isFetching, 
        error: queryInfo.error?.message || (queryInfo.isError ? t('myAppointments.errors.loadFailed') : ''), 
        total: queryInfo.data?.total || 0, 
        page: params.page + 1, // Frontend 1-based page
        PAGE_SIZE, 
        fetchAppointments, 
        cancelAppointment: cancelMutation.mutateAsync 
    };
}

export function useAppointmentDetail(appointmentId) {
    const { t } = useTranslation('appointments');
    const queryClient = useQueryClient();

    const queryInfo = useQuery({
        queryKey: ['myAppointmentDetail', appointmentId],
        queryFn: async () => {
            if (!appointmentId) return null;
            const res = await api.get(`/api/v1/appointments/my/${appointmentId}`);
            return res.data;
        },
        enabled: !!appointmentId
    });

    const cancelMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/api/v1/appointments/my/${appointmentId}/cancel`);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Hủy lịch hẹn thành công!');
            queryClient.invalidateQueries({ queryKey: ['myAppointmentDetail', appointmentId] });
            queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
        },
        onError: (err) => {
            const message = err.response?.data?.message || err.message || t('appointmentDetail.errors.cancelFailed');
            toast.error(message);
        }
    });

    return { 
        detail: queryInfo.data, 
        loading: queryInfo.isFetching, 
        cancelling: cancelMutation.isPending, 
        error: queryInfo.error?.message || (queryInfo.isError ? t('appointmentDetail.errors.loadFailed') : ''), 
        fetchDetail: queryInfo.refetch, 
        cancel: cancelMutation.mutateAsync 
    };
}

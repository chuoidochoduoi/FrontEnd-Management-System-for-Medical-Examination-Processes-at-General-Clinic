import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const PAGE_SIZE = 100;

export function useLabQueue(initialDepartmentId = null) {
    const { t } = useTranslation('lab');
    
    // Manage all fetch parameters in state
    const [params, setParams] = useState({
        search: '',
        status: '',
        workDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
        sort: 'newest',
        page: 1,
        departmentId: initialDepartmentId
    });

    const queryInfo = useQuery({
        queryKey: ['labOrders', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (params.search) queryParams.set('search', params.search);
            if (params.status) queryParams.set('status', params.status);
            if (params.workDate) queryParams.set('workDate', params.workDate);
            if (params.departmentId) queryParams.set('departmentId', params.departmentId);
            queryParams.set('page', Math.max(0, params.page - 1));
            queryParams.set('size', PAGE_SIZE);
            queryParams.set('sort', params.sort === 'oldest' ? 'createdAt,asc' : 'createdAt,desc');

            const res = await api.get(`/api/v1/test-requests?${queryParams}`);
            const data = res.data;
            const rawOrders = data.content ?? data.items ?? data;
            
            const mappedOrders = rawOrders.map(order => ({
                ...order,
                status: typeof order.status === 'object' && order.status?.name
                    ? order.status.name
                    : (typeof order.status === 'string' ? order.status : String(order.status || 'PENDING')),
                queueStatus: typeof order.queueStatus === 'object' && order.queueStatus?.name
                    ? order.queueStatus.name
                    : (typeof order.queueStatus === 'string' ? order.queueStatus : null),
            }));

            return {
                orders: mappedOrders,
                total: data.totalElements ?? data.total ?? data.length,
            };
        }
    });

    // Replace the imperative fetchOrders with a state updater
    const fetchOrders = useCallback((newParams = {}) => {
        setParams(prev => ({ ...prev, ...newParams }));
    }, []);

    return {
        orders: queryInfo.data?.orders || [],
        total: queryInfo.data?.total || 0,
        loading: queryInfo.isFetching,
        error: queryInfo.error?.message || (queryInfo.isError ? t('labQueue.errors.loadFailed') : ''),
        page: params.page,
        PAGE_SIZE,
        fetchOrders,
        refetch: queryInfo.refetch
    };
}

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import createLogger from '@/utils/logger';

const PAGE_SIZE = 7;
const logger = createLogger('useLabQueue');

export function useLabQueue(initialDepartmentId = null) {
    const { t } = useTranslation('lab');
    
    // Manage all fetch parameters in state
    const [params, setParams] = useState({
        search: '',
        status: '',
        /*
         * Danh sach yeu cau CLS khong co bo chon ngay, nen khong duoc ngam dinh
         * loc theo ngay cua trinh duyet. Neu server va may nguoi dung khac ngay,
         * TestRequest van ton tai (va chan chi dinh trung) nhung bi hien thanh
         * "khong co yeu cau". Chi man co chon ngay moi cap nhat workDate.
         */
        workDate: '',
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

            // The laboratory worklist is intentionally panel-based.  A
            // purchased CBC analyte is still its own TestRequest for billing
            // and traceability, but it must not appear as a separate work item.
            const requestUrl = `/api/v1/test-requests/panels?${queryParams.toString()}`;
            logger.info('Tải danh sách yêu cầu cận lâm sàng', {
                endpoint: requestUrl,
                filters: { ...params },
            });

            try {
                const res = await api.get(requestUrl);
                const data = res.data;
                const candidateOrders = data?.content ?? data?.items ?? data;
                const rawOrders = Array.isArray(candidateOrders) ? candidateOrders : [];

                logger.debug('Phản hồi API hàng chờ cận lâm sàng', {
                    status: res.status,
                    responseShape: Array.isArray(data) ? 'array' : Object.keys(data || {}),
                    totalFromApi: data?.totalElements ?? data?.total ?? null,
                    receivedCount: rawOrders.length,
                    firstOrder: rawOrders[0]
                        ? {
                            testRequestId: rawOrders[0].representativeId ?? rawOrders[0].testRequestId ?? rawOrders[0].id,
                            queueTicketId: rawOrders[0].queueTicketId ?? null,
                            queueStatus: rawOrders[0].queueStatus ?? null,
                            status: rawOrders[0].status ?? null,
                            performingDepartmentId: rawOrders[0].performingDepartmentId ?? null,
                        }
                        : null,
                });

                if (!Array.isArray(candidateOrders)) {
                    logger.warn('API danh sách cận lâm sàng trả về dữ liệu không phải mảng', {
                        endpoint: requestUrl,
                        responseShape: data && typeof data === 'object' ? Object.keys(data) : typeof data,
                    });
                }

                const mappedOrders = rawOrders.map(order => ({
                    ...order,
                    testRequestId: order.representativeId ?? order.testRequestId ?? order.id,
                    status: typeof order.status === 'object' && order.status?.name
                        ? order.status.name
                        : (typeof order.status === 'string' ? order.status : String(order.status || 'PENDING')),
                    queueStatus: typeof order.queueStatus === 'object' && order.queueStatus?.name
                        ? order.queueStatus.name
                        : (typeof order.queueStatus === 'string' ? order.queueStatus : null),
                }));

                const total = data?.totalElements ?? data?.total ?? rawOrders.length;
                logger.info('Đã chuẩn hóa danh sách cận lâm sàng', {
                    receivedCount: rawOrders.length,
                    mappedCount: mappedOrders.length,
                    total,
                    departmentId: params.departmentId ?? null,
                });

                return { orders: mappedOrders, total };
            } catch (error) {
                logger.error('Không tải được danh sách yêu cầu cận lâm sàng', {
                    endpoint: requestUrl,
                    status: error.response?.status ?? null,
                    statusText: error.response?.statusText ?? null,
                    apiMessage: error.response?.data?.message ?? null,
                    apiPath: error.response?.data?.path ?? null,
                    error: error.message,
                });
                throw error;
            }
        }
    });

    // Replace the imperative fetchOrders with a state updater
    const fetchOrders = useCallback((newParams = {}) => {
        logger.debug('Cập nhật bộ lọc danh sách cận lâm sàng', newParams);
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

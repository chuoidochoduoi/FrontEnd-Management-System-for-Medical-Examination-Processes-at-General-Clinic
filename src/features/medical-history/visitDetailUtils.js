export const formatDateTime = (value) => {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export const formatDate = (value) => {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('vi-VN');
};

export const statusConfig = (status) => {
    switch (status) {
        case 'COMPLETED':
            return { label: 'Đã hoàn thành', cls: 'border-green-200 bg-green-50 text-green-600' };
        case 'PARTIAL':
            return { label: 'Đã bỏ lượt một phần', cls: 'border-amber-200 bg-amber-50 text-amber-800' };
        case 'IN_PROGRESS':
            return { label: 'Đang thực hiện', cls: 'border-blue-200 bg-blue-50 text-blue-600' };
        case 'WAITING_FOR_TEST':
            return { label: 'Chờ kết quả CLS', cls: 'border-purple-200 bg-purple-50 text-purple-600' };
        case 'TEST_DONE':
            return { label: 'Đã có kết quả', cls: 'border-emerald-200 bg-emerald-50 text-emerald-600' };
        case 'CANCELLED':
            return { label: 'Đã hủy', cls: 'border-red-200 bg-red-50 text-red-500' };
        default:
            return { label: status || 'Đang xử lý', cls: 'border-gray-200 bg-gray-50 text-gray-500' };
    }
};

export const testStatusConfig = (test) => {
    if (test?.status === 'COMPLETED' || test?.pdfUrl) {
        return { label: 'Đã có kết quả', cls: 'border-green-200 bg-green-50 text-green-600' };
    }
    if (test?.status === 'IN_PROGRESS') {
        return { label: 'Đang xử lý', cls: 'border-blue-200 bg-blue-50 text-blue-600' };
    }
    if (test?.status === 'BLOCKED') {
        return { label: 'Bước tiếp theo', cls: 'border-gray-200 bg-gray-50 text-gray-500' };
    }
    return { label: 'Đang chờ', cls: 'border-orange-200 bg-orange-50 text-orange-600' };
};

export function groupTestsForPatient(tests) {
    const groups = new Map();

    (tests || []).forEach((test, index) => {
        const panelScope = test.queueTicketId
            || test.sampleId
            || test.orderingRecordId
            || test.createdAt?.slice(0, 16)
            || 'visit';
        const key = test.panelCode
            ? `panel:${test.panelCode}:${panelScope}`
            : `test:${test.id || test.testRequestId || index}`;

        if (!groups.has(key)) {
            groups.set(key, {
                ...test,
                id: key,
                name: test.panelName || test.name,
                isPanelGroup: Boolean(test.panelCode),
                members: [],
                results: [],
                attachments: [],
            });
        }

        const group = groups.get(key);
        group.members.push(test);
        group.hasAbnormal = group.hasAbnormal || Boolean(test.hasAbnormal);
        if (!group.conclusion && test.conclusion) group.conclusion = test.conclusion;
        if (!group.performedBy && test.performedBy) group.performedBy = test.performedBy;
        if (!group.performedAt && test.performedAt) group.performedAt = test.performedAt;
        if (!group.sampleId && test.sampleId) group.sampleId = test.sampleId;

        (test.results || []).forEach((result) => {
            const resultKey = `${result.name || ''}:${result.unit || ''}`;
            if (!group.results.some(item => `${item.name || ''}:${item.unit || ''}` === resultKey)) {
                group.results.push(result);
            }
        });
        (test.attachments || []).forEach((attachment) => {
            const attachmentKey = attachment.attachmentId || attachment.url;
            if (!group.attachments.some(item => (item.attachmentId || item.url) === attachmentKey)) {
                group.attachments.push(attachment);
            }
        });
    });

    return Array.from(groups.values()).map((group) => {
        const fullPanelPurchased = group.members.some(
            item => item.panelCode && item.serviceCode === item.panelCode
        );
        const purchasedCount = fullPanelPurchased
            ? group.panelTotalAnalytes || group.results.length
            : group.members.length;
        const completedCount = group.members.filter(item => item.status === 'COMPLETED').length;
        return {
            ...group,
            purchasedCount,
            status: completedCount === group.members.length ? 'COMPLETED' : group.status,
        };
    });
}

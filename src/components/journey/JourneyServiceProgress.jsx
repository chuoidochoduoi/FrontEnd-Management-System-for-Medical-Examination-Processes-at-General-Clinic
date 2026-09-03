const serviceLabels = {
    PENDING: 'Đang chờ', BLOCKED: 'Chưa đến lượt', IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Đã hoàn thành', DONE: 'Đã hoàn thành', CANCELLED: 'Đã hủy',
};

export default function JourneyServiceProgress({ step }) {
    const services = Array.isArray(step?.services) ? step.services : [];
    const total = Number(step?.totalServices ?? services.length ?? 0);
    if (total <= 1 || services.length <= 1) return null;
    const completed = Number(step?.completedServices ?? services.filter(item =>
        ['COMPLETED', 'DONE'].includes(item.status)).length);
    return <details className="mt-2 rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-left">
        <summary className="cursor-pointer text-[15px] font-semibold text-teal-800">
            Đã hoàn thành {completed}/{total} dịch vụ
        </summary>
        <ul className="mt-2 grid gap-1.5 text-[15px] text-slate-700">
            {services.map((service, index) => <li key={service.serviceId || service.serviceCode || index}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-2.5 py-1.5">
                <span>{service.serviceName || 'Dịch vụ cận lâm sàng'}</span>
                <strong className="text-[14px] text-slate-500">{serviceLabels[service.status] || service.status || 'Đang cập nhật'}</strong>
            </li>)}
        </ul>
    </details>;
}

import { useMemo, useState } from 'react';
import {
    Beaker,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    Search,
} from 'lucide-react';

const money = value => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
const serviceIdOf = service => service?.serviceId || service?.id;
const serviceCodeOf = service => String(service?.serviceCode || service?.code || '').toUpperCase();
const relationsOf = service => Array.isArray(service?.relations) ? service.relations : [];

export const isAnalyteService = service => serviceCodeOf(service).startsWith('AN-');
export const isLaboratoryPanel = service => relationsOf(service).some(relation =>
    relation.type === 'INCLUDES'
    && String(relation.targetServiceCode || '').toUpperCase().startsWith('AN-'));
export const isPackageOrAnalyteService = service => isAnalyteService(service) || isLaboratoryPanel(service);

const panelMeta = service => {
    const capability = service?.requiredCapabilityName || service?.capabilityName || '';
    return [
        capability,
        service?.departmentName,
        service?.requiresSpecimen === false ? null : 'Mẫu bệnh phẩm',
    ].filter(Boolean).join(' · ');
};

export default function LabPackageAnalytePicker({
    services = [],
    selectedIds = [],
    onToggle,
    loading = false,
    disabled = false,
    getServiceState,
    onReset,
    onCustomizePanel,
    title = 'Chọn gói và chỉ số xét nghiệm',
    helper = 'Có thể chọn gói đầy đủ, chỉ số lẻ hoặc kết hợp cả hai.',
    compact = false,
}) {
    const [query, setQuery] = useState('');
    const [view, setView] = useState('ALL');
    const [expanded, setExpanded] = useState({});
    const selectedSet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds]);

    const normalized = useMemo(() => services.filter(Boolean), [services]);
    const serviceByCode = useMemo(() => new Map(normalized.map(service => [serviceCodeOf(service), service])), [normalized]);
    const panels = useMemo(() => normalized.filter(isLaboratoryPanel), [normalized]);

    const groups = useMemo(() => panels.map(panel => {
        const analytes = relationsOf(panel)
            .filter(relation => relation.type === 'INCLUDES'
                && String(relation.targetServiceCode || '').toUpperCase().startsWith('AN-'))
            .map(relation => serviceByCode.get(String(relation.targetServiceCode || '').toUpperCase()))
            .filter(Boolean);
        return { panel, analytes };
    }).filter(group => group.analytes.length > 0), [panels, serviceByCode]);

    const parentCodeByAnalyte = useMemo(() => {
        const result = new Map();
        groups.forEach(group => group.analytes.forEach(analyte => result.set(serviceCodeOf(analyte), serviceCodeOf(group.panel))));
        return result;
    }, [groups]);

    const orphanAnalytes = normalized.filter(service => isAnalyteService(service)
        && !parentCodeByAnalyte.has(serviceCodeOf(service)));
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');
    const matches = service => !normalizedQuery || [service?.name, serviceCodeOf(service), service?.description]
        .some(value => String(value || '').toLocaleLowerCase('vi').includes(normalizedQuery));
    const stateOf = service => getServiceState?.(service) || { disabled: false, label: '' };

    const visibleGroups = groups.filter(({ panel, analytes }) => {
        const selected = selectedSet.has(String(serviceIdOf(panel)))
            || analytes.some(item => selectedSet.has(String(serviceIdOf(item))));
        if (view === 'SELECTED' && !selected) return false;
        if (view === 'PACKAGES' && !matches(panel)) return false;
        if (view === 'ANALYTES' && !analytes.some(matches)) return false;
        return matches(panel) || analytes.some(matches);
    });

    const toggle = service => {
        const state = stateOf(service);
        if (disabled || state.disabled) return;
        onToggle?.(service);
    };

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <header className={`border-b border-gray-200 bg-gray-50 ${compact ? 'p-4' : 'p-5'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                            <Beaker size={19} />
                        </span>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                            <p className="mt-0.5 text-xs leading-5 text-gray-500">{helper}</p>
                        </div>
                    </div>
                    {onReset && (
                        <button type="button" onClick={onReset} disabled={disabled}
                            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-teal-200 bg-white px-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50">
                            <RotateCcw size={15} /> Khôi phục ban đầu
                        </button>
                    )}
                </div>

                <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center">
                    <div className="flex flex-wrap gap-2">
                        {[
                            ['ALL', 'Tất cả'],
                            ['PACKAGES', 'Gói xét nghiệm'],
                            ['ANALYTES', 'Chỉ số lẻ'],
                            ['SELECTED', `Đã chọn (${selectedSet.size})`],
                        ].map(([value, label]) => (
                            <button key={value} type="button" onClick={() => setView(value)}
                                className={`min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${view === value
                                    ? 'border-teal-600 bg-teal-600 text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <label className="relative block min-w-0 flex-1 lg:max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={query} onChange={event => setQuery(event.target.value)}
                            placeholder="Tìm gói, tên hoặc mã chỉ số"
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100" />
                    </label>
                </div>
            </header>

            <div className={`${compact ? 'max-h-[390px] p-3' : 'max-h-[520px] p-4'} space-y-2 overflow-y-auto`}>
                {loading && <p className="py-10 text-center text-[15px] text-slate-500">Đang tải danh mục xét nghiệm...</p>}
                {!loading && visibleGroups.map(({ panel, analytes }) => {
                    const panelId = String(serviceIdOf(panel));
                    const panelSelected = selectedSet.has(panelId);
                    const selectedAnalytes = analytes.filter(item => selectedSet.has(String(serviceIdOf(item))));
                    const panelCode = serviceCodeOf(panel);
                    const isExpanded = view === 'ANALYTES'
                        || (expanded[panelCode] ?? (selectedAnalytes.length > 0 || Boolean(normalizedQuery)));
                    const panelState = stateOf(panel);
                    const retailTotal = analytes.reduce((sum, item) => sum + Number(item.price || 0), 0);

                    return (
                        <article key={panelId} className={`overflow-hidden rounded-xl border ${panelSelected || selectedAnalytes.length
                            ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200 bg-white'}`}>
                            <div className="p-3">
                                <div className="flex flex-col gap-3">
                                    <button type="button" onClick={() => setExpanded(current => ({ ...current, [panelCode]: !isExpanded }))}
                                        className="flex min-w-0 flex-1 items-start gap-3 text-left">
                                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700"><Beaker size={18} /></span>
                                        <span className="min-w-0">
                                            <strong className="block text-sm text-slate-900">{panel.name} <span className="font-medium text-slate-500">({panelCode})</span></strong>
                                            <span className="mt-0.5 block text-xs leading-5 text-slate-500">{analytes.length} chỉ số{panelMeta(panel) ? ` · ${panelMeta(panel)}` : ''}</span>
                                        </span>
                                    </button>

                                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
                                        <span className="rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200">
                                            Giá gói <strong className="ml-1 text-teal-700">{money(panel.price)}</strong>
                                        </span>
                                        {retailTotal > 0 && <span className="text-xs text-slate-500">Đủ giá lẻ {money(retailTotal)}</span>}
                                        <button type="button" disabled={disabled || panelState.disabled}
                                            onClick={() => panelSelected ? toggle(panel) : toggle(panel)}
                                            className={`min-h-9 rounded-lg px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${panelSelected
                                                ? 'border border-teal-300 bg-teal-50 text-teal-800'
                                                : 'bg-teal-600 text-white hover:bg-teal-700'}`}>
                                            {panelSelected ? `Đã chọn gói · ${analytes.length}/${analytes.length}` : 'Chọn cả gói'}
                                        </button>
                                        <button type="button" disabled={disabled || panelState.disabled}
                                            onClick={() => {
                                                setExpanded(current => ({ ...current, [panelCode]: true }));
                                            }}
                                            className="min-h-9 rounded-lg border border-teal-300 bg-white px-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50">
                                            Tùy chỉnh chỉ số
                                        </button>
                                        <button type="button" onClick={() => setExpanded(current => ({ ...current, [panelCode]: !isExpanded }))}
                                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={isExpanded ? 'Thu gọn chỉ số' : 'Mở danh sách chỉ số'}>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                    </div>
                                </div>
                                {panelState.label && <p className="mt-2 text-[14px] font-semibold text-amber-700">{panelState.label}</p>}
                            </div>

                            {isExpanded && (
                                <div className="border-t border-slate-200 bg-white px-4 py-2">
                                    {panelSelected && (
                                        <p className="my-2 rounded-xl bg-teal-50 px-3 py-2 text-[14px] text-teal-800">
                                            Gói đầy đủ đã bao gồm toàn bộ {analytes.length} chỉ số. Chuyển sang tùy chỉnh nếu cần bỏ bớt.
                                        </p>
                                    )}
                                    <div className="divide-y divide-slate-100">
                                        {analytes.filter(matches).map(analyte => {
                                            const id = String(serviceIdOf(analyte));
                                            const checked = panelSelected || selectedSet.has(id);
                                            const itemState = stateOf(analyte);
                                            return (
                                                <label key={id} className={`flex min-h-14 items-center gap-3 rounded-lg px-2 py-2 transition ${disabled || itemState.disabled ? 'cursor-not-allowed opacity-65' : 'cursor-pointer hover:bg-teal-50/60'}`}>
                                                    <input type="checkbox" checked={checked}
                                                        disabled={disabled || itemState.disabled}
                                                        onChange={() => panelSelected && onCustomizePanel
                                                            ? onCustomizePanel(panel, analytes, serviceIdOf(analyte))
                                                            : toggle(analyte)}
                                                        className="h-5 w-5 shrink-0 cursor-pointer accent-teal-600 disabled:cursor-not-allowed" />
                                                    <span className="min-w-0 flex-1">
                                                        <strong className="text-[15px] text-slate-900">{analyte.name}</strong>
                                                        <span className="ml-2 text-[14px] text-slate-500">{serviceCodeOf(analyte)}</span>
                                                        <span className="mt-0.5 block text-[13px] text-slate-500">Thuộc {panel.name}</span>
                                                        {itemState.label && <span className="block text-[13px] font-semibold text-amber-700">{itemState.label}</span>}
                                                    </span>
                                                    <strong className="shrink-0 text-[15px] text-teal-700">{money(analyte.price)}</strong>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </article>
                    );
                })}

                {!loading && orphanAnalytes.length > 0 && (
                    <article className="rounded-2xl border border-slate-200 bg-white p-4">
                        <h3 className="text-base font-bold text-slate-900">Chỉ số xét nghiệm khác</h3>
                        <div className="mt-2 divide-y divide-slate-100">
                            {orphanAnalytes.filter(matches).map(service => {
                                const id = String(serviceIdOf(service));
                                const checked = selectedSet.has(id);
                                const state = stateOf(service);
                                return (
                                    <label key={id} className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-teal-50/60">
                                        <input type="checkbox" checked={checked} disabled={disabled || state.disabled}
                                            onChange={() => toggle(service)} className="h-5 w-5 shrink-0 accent-teal-600 disabled:cursor-not-allowed" />
                                        <span className="min-w-0 flex-1"><strong className="text-[15px]">{service.name}</strong><span className="ml-2 text-[14px] text-slate-500">{serviceCodeOf(service)}</span>{state.label && <span className="block text-[13px] text-amber-700">{state.label}</span>}</span>
                                        <strong className="text-[15px] text-teal-700">{money(service.price)}</strong>
                                    </label>
                                );
                            })}
                        </div>
                    </article>
                )}

                {!loading && visibleGroups.length === 0 && orphanAnalytes.filter(matches).length === 0 && (
                    <p className="py-10 text-center text-[15px] text-slate-500">Không tìm thấy gói hoặc chỉ số phù hợp.</p>
                )}
            </div>
        </section>
    );
}

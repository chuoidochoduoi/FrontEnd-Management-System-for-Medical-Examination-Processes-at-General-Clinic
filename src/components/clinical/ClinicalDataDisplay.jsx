import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

const fieldsFrom = schema => {
    if (Array.isArray(schema?.fields)) return schema.fields;
    if (!Array.isArray(schema?.sections)) return [];
    return schema.sections.flatMap(section => (section.fields || []).map(field => ({
        ...field,
        group: field.group || section.label || section.name,
    })));
};

const groupsFrom = fields => {
    const groups = new Map();
    [...fields].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)).forEach(field => {
        const group = field.group || 'Thông tin chuyên khoa';
        groups.set(group, [...(groups.get(group) || []), field]);
    });
    return [...groups.entries()];
};

const optionLabel = (field, value) => {
    const option = (field.options || []).find(item =>
        String(typeof item === 'string' ? item : item.value) === String(value));
    return typeof option === 'string' ? option : option?.label;
};

const displayValue = (field, raw) => {
    if (raw === null || raw === undefined || raw === '') return 'Chưa ghi nhận';
    if (field.type === 'BOOLEAN') return raw ? 'Có' : 'Không';
    if (field.type === 'SELECT') return optionLabel(field, raw) || String(raw);
    if (field.type === 'DATE') {
        const parsed = new Date(`${raw}T00:00:00`);
        return Number.isNaN(parsed.getTime()) ? String(raw) : parsed.toLocaleDateString('vi-VN');
    }
    if (field.type === 'NUMBER' && Number.isFinite(Number(raw)) && field.precision != null) {
        return Number(raw).toLocaleString('vi-VN', {
            minimumFractionDigits: field.precision,
            maximumFractionDigits: field.precision,
        });
    }
    return String(raw);
};

export default function ClinicalDataDisplay({
    clinicalForm,
    schema = clinicalForm?.schema,
    values = clinicalForm?.values || {},
    title = clinicalForm?.name || 'Thông tin chuyên khoa',
    emptyMessage = 'Hồ sơ này chưa sử dụng biểu mẫu chuyên khoa',
    compact = false,
}) {
    const fields = useMemo(() => fieldsFrom(schema), [schema]);
    const groups = useMemo(() => groupsFrom(fields), [fields]);
    const [openGroups, setOpenGroups] = useState(() => new Set(groups[0] ? [groups[0][0]] : []));
    const flags = values?._meta?.flags || {};

    useEffect(() => {
        if (groups[0]) setOpenGroups(current => current.size ? current : new Set([groups[0][0]]));
    }, [groups]);

    if (!fields.length) {
        return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">{emptyMessage}</div>;
    }

    const toggle = group => setOpenGroups(current => {
        const next = new Set(current);
        next.has(group) ? next.delete(group) : next.add(group);
        return next;
    });

    return <section className={`rounded-2xl border border-slate-200 bg-white ${compact ? 'p-4' : 'p-5'}`}>
        <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            {clinicalForm?.versionNo && <p className="mt-1 text-xs text-slate-400">Phiên bản {clinicalForm.versionNo}</p>}
        </div>
        <div className="space-y-3">
            {groups.map(([group, groupFields]) => {
                const open = openGroups.has(group);
                return <div key={group} className="overflow-hidden rounded-xl border border-slate-100">
                    <button type="button" onClick={() => toggle(group)} className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{group}</span>
                        <ChevronDown size={16} className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`}/>
                    </button>
                    {open && <dl className="grid grid-cols-1 gap-x-6 px-4 py-1 md:grid-cols-2">
                        {groupFields.map(field => {
                            const raw = values?.[field.key];
                            const flag = flags?.[field.key]?.status;
                            const abnormal = ['HIGH', 'LOW', 'ABNORMAL'].includes(flag);
                            return <div key={field.key} className={field.type === 'TEXTAREA' ? 'border-b border-slate-100 py-3 md:col-span-2' : 'border-b border-slate-100 py-3'}>
                                <dt className="text-xs text-slate-400">{field.label || field.key}</dt>
                                <dd className={`mt-1 whitespace-pre-wrap text-sm font-medium ${raw === null || raw === undefined || raw === '' ? 'text-slate-400' : 'text-slate-800'}`}>
                                    {displayValue(field, raw)}{field.unit && raw !== null && raw !== undefined && raw !== '' ? ` ${field.unit}` : ''}
                                </dd>
                                {flag && <span className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${abnormal ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {abnormal ? <AlertCircle size={12}/> : <CheckCircle2 size={12}/>} {flag}
                                </span>}
                            </div>;
                        })}
                    </dl>}
                </div>;
            })}
        </div>
    </section>;
}

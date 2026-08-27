import { useMemo } from 'react';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

const fieldList = (schema) => {
    if (Array.isArray(schema?.fields)) return schema.fields;
    if (Array.isArray(schema?.sections)) {
        return schema.sections.flatMap((section) =>
            (section.fields || []).map((field) => ({ ...field, group: field.group || section.label }))
        );
    }
    return [];
};

const groupsOf = (fields) => {
    const groups = new Map();
    [...fields]
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .forEach((field) => {
            const group = field.group || 'Thông tin chuyên khoa';
            groups.set(group, [...(groups.get(group) || []), field]);
        });
    return [...groups.entries()];
};

const rawValue = (field, value) => value?.[field.key] ?? (field.type === 'BOOLEAN' ? false : '');

const previewCalculations = (values, fields, patientAge, patientGender) => {
    const next = { ...values };
    fields.forEach((field) => {
        const calculator = field.calculatorKey;
        let result = null;
        if (calculator === 'EGFR_CKD_EPI_2021_V1' && patientAge >= 18 && ['MALE', 'FEMALE'].includes(patientGender) && Number(next.creatinine) > 0) {
            const female = patientGender === 'FEMALE';
            const scr = Number(next.creatinine) / 88.4;
            const k = female ? 0.7 : 0.9;
            const alpha = female ? -0.241 : -0.302;
            result = 142 * Math.min(scr / k, 1) ** alpha * Math.max(scr / k, 1) ** -1.2 * 0.9938 ** patientAge * (female ? 1.012 : 1);
        } else if (calculator === 'GA_CRL_ROBINSON_FLEMING_V1' && Number(next.crl) >= 5 && Number(next.crl) <= 85) {
            result = 8.052 * Math.sqrt(Number(next.crl)) + 23.73;
        } else if (calculator === 'GA_HADLOCK_BPD_FL_V1' && !(Number(next.crl) >= 5 && Number(next.crl) <= 85) && Number(next.bpd) > 0 && Number(next.fl) > 0) {
            const days = 7 * (10.5 + 0.00197 * Number(next.bpd) * Number(next.fl) + 0.095 * Number(next.fl) + 0.073 * Number(next.bpd));
            if (days >= 98 && days <= 238) result = days;
        } else if (calculator === 'EFW_HADLOCK_HC_AC_FL_V1' && Number(next.hc) > 0 && Number(next.ac) > 0 && Number(next.fl) > 0) {
            const hc = Number(next.hc) / 10, ac = Number(next.ac) / 10, fl = Number(next.fl) / 10;
            result = 10 ** (1.326 - 0.00326 * ac * fl + 0.0107 * hc + 0.0438 * ac + 0.158 * fl);
        }
        if (result != null && Number.isFinite(result)) next[field.key] = Number(result.toFixed(field.precision ?? (calculator?.startsWith('GA_') ? 0 : 2)));
        else if (calculator) delete next[field.key];
    });
    return next;
};

export default function DynamicClinicalForm({
    schema,
    value = {},
    onChange,
    disabled = false,
    title = 'Biểu mẫu chuyên khoa',
    emptyMessage = 'Chưa cấu hình biểu mẫu chuyên khoa',
    patientAge,
    patientGender,
}) {
    const fields = useMemo(() => fieldList(schema), [schema]);
    const groups = useMemo(() => groupsOf(fields), [fields]);
    const flags = value?._meta?.flags || {};

    if (!fields.length) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                {emptyMessage}
            </div>
        );
    }

    const setField = (field, next) => {
        const clean = { ...(value || {}) };
        delete clean._meta;
        clean[field.key] = field.type === 'NUMBER'
            ? (next === '' ? null : Number(next))
            : field.type === 'BOOLEAN' ? Boolean(next) : next;
        onChange?.(previewCalculations(clean, fields, patientAge, patientGender));
    };

    const applyNormalPreset = () => {
        const next = { ...(value || {}) };
        delete next._meta;
        fields.forEach((field) => {
            if (field.normalValue !== undefined) next[field.key] = field.normalValue;
            else if (field.normalPreset !== undefined) next[field.key] = field.normalPreset;
        });
        onChange?.(next);
    };

    const hasNormalPreset = fields.some((field) =>
        field.normalValue !== undefined || field.normalPreset !== undefined
    );

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-xs text-slate-500">Các trường được cấu hình và kiểm tra bởi hệ thống.</p>
                </div>
                {hasNormalPreset && !disabled && (
                    <button
                        type="button"
                        onClick={applyNormalPreset}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                    >
                        <Sparkles size={15} /> Điền mẫu bình thường
                    </button>
                )}
            </div>

            <div className="space-y-5">
                {groups.map(([group, groupFields]) => (
                    <div key={group}>
                        <p className="mb-3 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            {group}
                        </p>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {groupFields.map((field) => {
                                const flag = flags[field.key]?.status;
                                const current = rawValue(field, value);
                                const common = {
                                    id: `clinical-${field.key}`,
                                    disabled: disabled || Boolean(field.calculatorKey),
                                    required: Boolean(field.required),
                                    className: 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-400 disabled:bg-slate-50 disabled:text-slate-500',
                                };
                                return (
                                    <label key={field.key} className={field.type === 'TEXTAREA' ? 'md:col-span-2' : ''}>
                                        <span className="text-xs font-semibold text-slate-700">
                                            {field.label}{field.required ? ' *' : ''}
                                        </span>
                                        {field.type === 'TEXTAREA' ? (
                                            <textarea {...common} rows={3} value={current} onChange={(e) => setField(field, e.target.value)} />
                                        ) : field.type === 'SELECT' ? (
                                            <select {...common} value={current} onChange={(e) => setField(field, e.target.value)}>
                                                <option value="">-- Chọn --</option>
                                                {(field.options || []).map((option) => {
                                                    const optionValue = typeof option === 'string' ? option : option.value;
                                                    const optionLabel = typeof option === 'string' ? option : option.label;
                                                    return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
                                                })}
                                            </select>
                                        ) : field.type === 'BOOLEAN' ? (
                                            <input type="checkbox" checked={Boolean(current)} onChange={(e) => setField(field, e.target.checked)} disabled={common.disabled} className="mt-3 h-4 w-4 rounded border-slate-300 text-primary-600" />
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    {...common}
                                                    type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                                                    value={current ?? ''}
                                                    min={field.min}
                                                    max={field.max}
                                                    step={field.type === 'NUMBER' ? (field.precision != null ? 10 ** -field.precision : 'any') : undefined}
                                                    onChange={(e) => setField(field, e.target.value)}
                                                />
                                                {field.unit && <span className="mt-1 block text-[11px] text-slate-400">Đơn vị: {field.unit}</span>}
                                            </div>
                                        )}
                                        {flag && (
                                            <span className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${
                                                ['HIGH', 'LOW', 'ABNORMAL'].includes(flag) ? 'text-amber-700' : 'text-emerald-700'
                                            }`}>
                                                {['HIGH', 'LOW', 'ABNORMAL'].includes(flag) ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                                                {flag}
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

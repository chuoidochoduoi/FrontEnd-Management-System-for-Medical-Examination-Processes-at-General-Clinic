import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Sparkles, TriangleAlert } from 'lucide-react';

export const clinicalFieldList = (schema) => {
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
    [...fields].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)).forEach((field) => {
        const group = field.group || 'Kết quả';
        groups.set(group, [...(groups.get(group) || []), field]);
    });
    return [...groups.entries()];
};

const rawValue = (field, value) => value?.[field.key] ?? (field.type === 'BOOLEAN' ? false : '');
const empty = (value) => value === null || value === undefined || value === '';
const omissionReasons = [
    { value: 'INSUFFICIENT_SAMPLE', label: 'Không đủ mẫu' },
    { value: 'UNACCEPTABLE_SAMPLE', label: 'Mẫu không đạt' },
    { value: 'EQUIPMENT_ERROR', label: 'Lỗi thiết bị' },
    { value: 'OTHER', label: 'Lý do khác' },
];

const conditionMatches = (condition, values) => {
    if (!condition) return true;
    const actual = values?.[condition.field];
    if (Object.prototype.hasOwnProperty.call(condition, 'equals')) return actual === condition.equals;
    if (Object.prototype.hasOwnProperty.call(condition, 'notEquals')) return actual !== condition.notEquals;
    if (Array.isArray(condition.in)) return condition.in.includes(actual);
    return !empty(actual);
};

const fieldVisible = (field, values) => conditionMatches(field.visibleWhen, values);

export const validateClinicalForm = (schema, values = {}, requireComplete = true, enabledFieldKeys = null) => {
    const errors = {};
    const fields = clinicalFieldList(schema);
    const omissions = values?._omissions || {};
    fields.forEach((field) => {
        if (enabledFieldKeys && !enabledFieldKeys.includes(field.key)) return;
        if (!fieldVisible(field, values) || field.calculatorKey) return;
        const value = values?.[field.key];
        const omission = omissions[field.key];
        if (omission) {
            if (!omission.reasonCode || (omission.reasonCode === 'OTHER' && !omission.reasonDetail?.trim())) {
                errors[field.key] = `Vui lòng chọn lý do không thực hiện ${field.label}`;
            }
            return;
        }
        const conditionallyRequired = field.requiredWhen && conditionMatches(field.requiredWhen, values);
        if (requireComplete && (field.required || field.requiredOnSign || conditionallyRequired) && empty(value)) {
            errors[field.key] = `Vui lòng nhập ${field.label}`;
            return;
        }
        if (empty(value)) return;
        if (field.type === 'NUMBER') {
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) errors[field.key] = `${field.label} phải là số`;
            else if (field.min != null && numeric < Number(field.min)) errors[field.key] = `${field.label} không được nhỏ hơn ${field.min}`;
            else if (field.max != null && numeric > Number(field.max)) errors[field.key] = `${field.label} không được lớn hơn ${field.max}`;
        } else if (field.pattern) {
            try {
                if (!(new RegExp(field.pattern)).test(String(value))) errors[field.key] = field.patternMessage || `${field.label} không đúng định dạng`;
            } catch {
                errors[field.key] = `${field.label} có cấu hình định dạng không hợp lệ`;
            }
        }
    });
    (schema?.rules || []).forEach((rule) => {
        if (rule.severity !== 'ERROR') return;
        if (rule.onSignOnly && !requireComplete) return;
        if (rule.type === 'LESS_THAN_OR_EQUAL') {
            const left = Number(values?.[rule.left]), right = Number(values?.[rule.right]);
            if (Number.isFinite(left) && Number.isFinite(right) && left > right)
                errors[rule.left] = rule.message || 'Giá trị không hợp lệ';
        } else if (rule.type === 'AT_LEAST_ONE_TRUE') {
            if (!(rule.keys || []).some((key) => values?.[key] === true)) {
                const target = rule.keys?.[0] || '_form';
                errors[target] = rule.message || 'Vui lòng chọn ít nhất một mục';
            }
        } else if (rule.type === 'BOOLEAN_MUST_BE_TRUE_WHEN' && conditionMatches(rule.when, values)) {
            if (values?.[rule.field] !== true) errors[rule.field] = rule.message || 'Giá trị xác nhận chưa hợp lệ';
        } else if (rule.type === 'VALUE_NOT_ALLOWED_WHEN' && conditionMatches(rule.when, values)) {
            if (values?.[rule.field] === rule.value) errors[rule.field] = rule.message || 'Giá trị không được phép khi ký';
        }
    });
    return errors;
};

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
        } else if (calculator === 'NON_HDL_C_V1' && Number.isFinite(Number(next.totalCholesterol)) && Number.isFinite(Number(next.hdlC))) {
            result = Number(next.totalCholesterol) - Number(next.hdlC);
        } else if (calculator === 'INDIRECT_BILIRUBIN_V1' && Number.isFinite(Number(next.bilirubinTotal)) && Number.isFinite(Number(next.bilirubinDirect))) {
            const calculated = Number(next.bilirubinTotal) - Number(next.bilirubinDirect);
            if (calculated >= 0) result = calculated;
        } else if (calculator === 'BUN_FROM_UREA_V1' && Number.isFinite(Number(next.urea))) {
            result = Number(next.urea) * 2.801;
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

const optionLabel = (option) => typeof option === 'string' ? option : option.label;
const optionValue = (option) => typeof option === 'string' ? option : option.value;

const referenceText = (field, flag, values, patientAge, patientGender) => {
    const previewRange = field.referenceRanges?.find((range) => {
        if (range.when && !conditionMatches(range.when, values)) return false;
        if (range.sex && range.sex !== 'ANY' && range.sex !== patientGender) return false;
        if ((range.ageUnit || 'YEARS') !== 'YEARS' || patientAge == null) return true;
        return patientAge >= (range.minAge ?? 0) && patientAge <= (range.maxAge ?? Number.MAX_SAFE_INTEGER);
    });
    const range = flag?.referenceRange || previewRange;
    if (!range) return 'Chưa thiết lập';
    if (Array.isArray(range.normalValues)) return range.normalValues.join(', ');
    if (range.low != null && range.high != null) return `${range.low} – ${range.high}`;
    if (range.low != null) return `≥ ${range.low}`;
    if (range.high != null) return `≤ ${range.high}`;
    return 'Theo nhận định chuyên môn';
};

const statusStyle = (status) => {
    if (['CRITICAL_LOW', 'CRITICAL_HIGH'].includes(status)) return 'bg-red-100 text-red-700';
    if (['HIGH', 'LOW', 'ABNORMAL'].includes(status)) return 'bg-amber-100 text-amber-700';
    if (status === 'NORMAL') return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-500';
};
const statusLabel = (status) => ({
    NORMAL: 'Bình thường', LOW: 'Thấp', HIGH: 'Cao', ABNORMAL: 'Bất thường',
    CRITICAL_LOW: 'Nguy hiểm thấp', CRITICAL_HIGH: 'Nguy hiểm cao',
    NOT_EVALUATED: 'Chưa đánh giá', NOT_CALCULATED: 'Không tính được',
}[status] || status);
const StatusIcon = ({ status }) => ['CRITICAL_LOW', 'CRITICAL_HIGH'].includes(status)
    ? <TriangleAlert size={11} />
    : ['LOW', 'HIGH', 'ABNORMAL'].includes(status) ? <AlertCircle size={11} /> : <CheckCircle2 size={11} />;

const FieldControl = ({ field, current, setField, disabled, error, compact = false }) => {
    const focusNext = (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const controls = [...(event.currentTarget.closest('section')?.querySelectorAll('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)') || [])];
        controls[controls.indexOf(event.currentTarget) + 1]?.focus();
    };
    const common = {
        id: `clinical-${field.key}`,
        disabled: disabled || Boolean(field.calculatorKey),
        'aria-invalid': Boolean(error),
        onKeyDown: focusNext,
        className: `${compact ? 'h-9' : 'mt-1.5 min-h-10'} w-full rounded-lg border px-3 py-2 text-sm outline-none transition disabled:bg-slate-50 disabled:text-slate-500 ${error ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-slate-200 bg-white focus:border-primary-400'}`,
    };
    if (field.type === 'TEXTAREA') return <textarea {...common} onKeyDown={undefined} rows={3} value={current} onChange={(e) => setField(field, e.target.value)} />;
    if (field.type === 'SELECT') return <select {...common} value={current} onChange={(e) => setField(field, e.target.value)}>
        <option value="">-- Chọn --</option>
        {(field.options || []).map((option) => <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(option)}</option>)}
    </select>;
    if (field.type === 'BOOLEAN') return <label className="inline-flex items-center gap-2 py-2 text-sm text-slate-700">
        <input id={common.id} type="checkbox" checked={Boolean(current)} onChange={(e) => setField(field, e.target.checked)} disabled={common.disabled} className="h-4 w-4 rounded border-slate-300 text-primary-600" />
        {current ? 'Có' : 'Không'}
    </label>;
    return <input {...common} type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : field.type === 'TEXT' ? 'text' : 'text'} value={current ?? ''}
        min={field.min} max={field.max} step={field.type === 'NUMBER' ? (field.precision != null ? 10 ** -field.precision : 'any') : undefined}
        onChange={(e) => setField(field, e.target.value)} />;
};

export default function DynamicClinicalForm({
    schema, value = {}, onChange, disabled = false, title = 'Biểu mẫu kết quả',
    emptyMessage = 'Chưa cấu hình biểu mẫu kết quả', patientAge, patientGender, errors = {},
    lockedFieldKeys = [],
}) {
    const fields = useMemo(() => clinicalFieldList(schema), [schema]);
    const visibleFields = useMemo(() => fields.filter((field) => fieldVisible(field, value)), [fields, value]);
    const groups = useMemo(() => groupsOf(visibleFields), [visibleFields]);
    // `groups` is a new array on each value change.  Use a stable list of
    // group names so typing a result does not reset/collapse an open panel.
    const groupNamesKey = useMemo(() => groups.map(([name]) => name).join('|'), [groups]);
    const flags = value?._meta?.flags || {};
    const warnings = value?._meta?.warnings || [];
    const laboratoryTable = schema?.layout === 'LAB_TABLE';
    const [openGroups, setOpenGroups] = useState(() => new Set());
    const [resultFilter, setResultFilter] = useState('ALL');
    const omissions = value?._omissions || {};
    const measurableFields = visibleFields.filter((field) => !field.calculatorKey);
    const purchasedFields = measurableFields.filter((field) => !lockedFieldKeys.includes(field.key));
    const completedCount = purchasedFields.filter((field) => !empty(value?.[field.key]) || omissions[field.key]).length;
    const omittedCount = purchasedFields.filter((field) => omissions[field.key]).length;

    useEffect(() => {
        const names = groups.map(([name]) => name);
        setOpenGroups((current) => {
            if (!current.size) return new Set(laboratoryTable && names[0] ? [names[0]] : names);
            const retained = [...current].filter((name) => names.includes(name));
            return new Set(retained.length ? retained : (laboratoryTable && names[0] ? [names[0]] : names));
        });
    }, [schema, laboratoryTable, groupNamesKey]);

    if (!fields.length) return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">{emptyMessage}</div>;

    const setField = (field, nextValue) => {
        const clean = { ...(value || {}) };
        delete clean._meta;
        const nextOmissions = { ...(clean._omissions || {}) };
        delete nextOmissions[field.key];
        if (Object.keys(nextOmissions).length) clean._omissions = nextOmissions;
        else delete clean._omissions;
        clean[field.key] = field.type === 'NUMBER' ? (nextValue === '' ? null : Number(nextValue)) : field.type === 'BOOLEAN' ? Boolean(nextValue) : nextValue;
        fields.forEach((candidate) => {
            if (!fieldVisible(candidate, clean)) delete clean[candidate.key];
        });
        onChange?.(previewCalculations(clean, fields, patientAge, patientGender));
    };

    const setOmission = (field, reasonCode = 'INSUFFICIENT_SAMPLE', reasonDetail = '') => {
        const clean = { ...(value || {}) };
        delete clean._meta;
        delete clean[field.key];
        clean._omissions = {
            ...(clean._omissions || {}),
            [field.key]: { reasonCode, ...(reasonDetail.trim() ? { reasonDetail: reasonDetail.trim() } : {}) },
        };
        onChange?.(previewCalculations(clean, fields, patientAge, patientGender));
    };

    const restoreField = (field) => {
        const clean = { ...(value || {}) };
        delete clean._meta;
        const nextOmissions = { ...(clean._omissions || {}) };
        delete nextOmissions[field.key];
        if (Object.keys(nextOmissions).length) clean._omissions = nextOmissions;
        else delete clean._omissions;
        onChange?.(previewCalculations(clean, fields, patientAge, patientGender));
    };

    const applyNormalPreset = () => {
        const next = { ...(value || {}) };
        delete next._meta;
        delete next._omissions;
        fields.forEach((field) => {
            if (lockedFieldKeys.includes(field.key)) return;
            if (field.normalValue !== undefined) next[field.key] = field.normalValue;
            else if (field.normalPreset !== undefined) next[field.key] = field.normalPreset;
        });
        onChange?.(previewCalculations(next, fields, patientAge, patientGender));
    };
    const hasNormalPreset = fields.some((field) => field.normalValue !== undefined || field.normalPreset !== undefined);
    const filterFields = (groupFields) => groupFields.filter((field) => {
        if (resultFilter === 'OMITTED') return Boolean(omissions[field.key]);
        if (resultFilter === 'MISSING') return !field.calculatorKey && !omissions[field.key] && empty(value?.[field.key]);
        return true;
    });
    const displayGroups = groups.map(([name, groupFields]) => [name, filterFields(groupFields)])
        .filter(([, groupFields]) => groupFields.length > 0);
    return <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-sm font-bold text-slate-900">{title}</h3><p className="mt-1 text-xs text-slate-500">Các trường được cấu hình, kiểm tra và tính cờ bởi backend.</p></div>
            {hasNormalPreset && !disabled && <button type="button" onClick={applyNormalPreset} className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 text-xs font-semibold text-primary-700 hover:bg-primary-100"><Sparkles size={15} /> Điền mẫu bình thường</button>}
        </div>

        {warnings.length > 0 && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {warnings.map((warning) => <p key={warning} className="flex items-center gap-2"><TriangleAlert size={14} />{warning}</p>)}
        </div>}

        {laboratoryTable && <div className="mb-5 space-y-3 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-bold text-slate-900">Tiến độ kết quả</p><p className="mt-1 text-sm text-slate-600">{completedCount}/{purchasedFields.length} chỉ số đã mua đã xử lý</p></div>
                {omittedCount > 0 && <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-800">{omittedCount} chỉ số không thực hiện</span>}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${purchasedFields.length ? completedCount / purchasedFields.length * 100 : 0}%` }} /></div>
            <div className="flex flex-wrap gap-2">
                {[['ALL', 'Tất cả', measurableFields.length], ['MISSING', 'Chưa nhập', Math.max(0, purchasedFields.length - completedCount)], ['OMITTED', 'Không thực hiện', omittedCount]].map(([key, label, count]) => <button type="button" key={key} onClick={() => setResultFilter(key)} className={`min-h-10 rounded-lg border px-4 text-sm font-bold transition ${resultFilter === key ? 'border-teal-600 bg-white text-teal-700 shadow-sm' : 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white'}`}>{label} <span className="ml-1 text-xs">{count}</span></button>)}
            </div>
        </div>}

        <div className="space-y-5">
            {displayGroups.map(([group, groupFields]) => <details key={group} open={openGroups.has(group)} onToggle={(event) => {
                if (!laboratoryTable) return;
                const isOpen = event.currentTarget.open;
                setOpenGroups((current) => {
                    const next = new Set(current);
                    if (isOpen) next.add(group); else next.delete(group);
                    return next;
                });
            }} className={laboratoryTable ? 'overflow-hidden rounded-xl border border-slate-200' : ''}>
                {laboratoryTable
                    ? <summary className="cursor-pointer select-none bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">{group} · {groupFields.length} chỉ số</summary>
                    : <p className="mb-3 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wide text-slate-600">{group}</p>}
                {laboratoryTable ? <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] table-fixed text-left">
                        <thead className="border-y border-slate-100 bg-white text-sm uppercase text-slate-500"><tr><th className="w-[24%] px-4 py-3">Chỉ số</th><th className="w-[22%] px-3 py-3">Kết quả</th><th className="w-[11%] px-3 py-3">Đơn vị</th><th className="w-[18%] px-3 py-3">Khoảng tham chiếu</th><th className="w-[25%] px-3 py-3">Trạng thái</th></tr></thead>
                        <tbody>{groupFields.map((field) => {
                            const current = rawValue(field, value), flag = flags[field.key], error = errors[field.key], omission = omissions[field.key], locked = lockedFieldKeys.includes(field.key);
                            return <tr key={field.key} className={`border-b border-slate-100 last:border-0 align-top ${locked ? 'bg-slate-50 text-slate-400 opacity-75' : omission ? 'bg-amber-50/60' : ''}`}>
                                <td className="px-4 py-3"><p className="text-base font-semibold text-slate-800">{field.code || field.label}{!locked && (field.required || field.requiredOnSign || field.requiredWhen) ? <span className="text-red-500"> *</span> : ''}</p>{locked && <span className="mt-1 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">Chưa mua · không nhập</span>}{field.code && field.label !== field.code && <p className="mt-1 text-sm text-slate-500">{field.label}</p>}{field.loincCode && <p className="mt-1 text-xs text-slate-400">LOINC {field.loincCode}</p>}</td>
                                <td className="px-3 py-2">{omission ? <div className="min-h-10 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-800">— Không có kết quả</div> : <FieldControl field={field} current={current} setField={setField} disabled={disabled || locked} error={error} compact />}{error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}</td>
                                <td className="px-3 py-3 text-sm text-slate-600">{field.unit || '—'}</td>
                                <td className="px-3 py-3 text-sm text-slate-700">{referenceText(field, flag, value, patientAge, patientGender)}</td>
                                <td className="px-3 py-2">
                                    {locked ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600">🔒 Chưa mua</span> : field.calculatorKey ? (flag?.status && <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold ${statusStyle(flag.status)}`}><StatusIcon status={flag.status} />{statusLabel(flag.status)}</span>) : omission ? <div className="space-y-2">
                                        <select disabled={disabled} value={omission.reasonCode || ''} onChange={(event) => setOmission(field, event.target.value, omission.reasonDetail || '')} className="min-h-10 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-800">
                                            {omissionReasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
                                        </select>
                                        {omission.reasonCode === 'OTHER' && <input disabled={disabled} value={omission.reasonDetail || ''} onChange={(event) => setOmission(field, 'OTHER', event.target.value)} placeholder="Nhập lý do" className="min-h-10 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm" />}
                                        {!disabled && <button type="button" onClick={() => restoreField(field)} className="text-sm font-bold text-teal-700 hover:underline">Chuyển lại sang nhập kết quả</button>}
                                    </div> : <div className="space-y-2">
                                        <div className="flex flex-wrap gap-2">{flag?.status && <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold ${statusStyle(flag.status)}`}><StatusIcon status={flag.status} />{statusLabel(flag.status)}</span>}{!empty(current) && !flag?.status && <span className="rounded-full bg-emerald-100 px-2.5 py-1.5 text-xs font-bold text-emerald-700">Đã nhập</span>}</div>
                                        {!disabled && <button type="button" onClick={() => setOmission(field)} className="text-sm font-bold text-amber-700 hover:underline">Đánh dấu không thực hiện</button>}
                                    </div>}
                                </td>
                            </tr>;
                        })}</tbody>
                    </table>
                </div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{groupFields.map((field) => {
                    const current = rawValue(field, value), flag = flags[field.key]?.status, error = errors[field.key];
                    const abnormal = ['HIGH', 'LOW', 'ABNORMAL', 'CRITICAL_LOW', 'CRITICAL_HIGH'].includes(flag);
                    return <label key={field.key} className={field.type === 'TEXTAREA' ? 'md:col-span-2' : ''}>
                        <span className="text-xs font-semibold text-slate-700">{field.label}{(field.required || field.requiredOnSign) ? ' *' : ''}</span>
                        <FieldControl field={field} current={current} setField={setField} disabled={disabled} error={error} />
                        {field.unit && <span className="mt-1 block text-[11px] text-slate-400">Đơn vị: {field.unit}</span>}
                        {error && <span className="mt-1 block text-[11px] font-medium text-red-600">{error}</span>}
                        {flag && <span className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${abnormal ? 'text-amber-700' : 'text-emerald-700'}`}>{abnormal ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}{flag}</span>}
                    </label>;
                })}</div>}
            </details>)}
        </div>
    </section>;
}

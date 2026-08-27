import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const PARACLINICAL_GROUPS = [
  {
    name: 'Xét nghiệm',
    pattern: /^(LAB-)|xét nghiệm|test nhanh|công thức máu|đường huyết|sinh hóa|chức năng gan|chức năng thận|nước tiểu|crp/i,
  },
  {
    name: 'Chẩn đoán hình ảnh',
    pattern: /^(IMG-)|x-quang|siêu âm|điện tim|ecg|chẩn đoán hình ảnh/i,
  },
];

export const SERVICE_GROUP_ORDER = [
  'Nội khoa',
  'Ngoại khoa',
  'Nhi khoa',
  'Sản phụ khoa',
  'Da liễu',
  'Xét nghiệm',
  'Chẩn đoán hình ảnh',
  'Khám bệnh',
  'Cận lâm sàng',
  'Dịch vụ khác',
];

export const getServiceGroupName = service => {
  if (service.departmentType === 'EXAMINATION') {
    return service.specializationName || service.department || 'Khám bệnh';
  }

  const searchableValue = [
    service.code,
    service.name,
    service.capabilityName,
    service.department,
  ].filter(Boolean).join(' ');

  return PARACLINICAL_GROUPS.find(group => group.pattern.test(searchableValue))?.name
    || service.department
    || 'Cận lâm sàng';
};

export const groupServicesBySpecialty = services => {
  const groups = services.reduce((result, service) => {
    const groupName = getServiceGroupName(service);
    if (!result[groupName]) result[groupName] = [];
    result[groupName].push(service);
    return result;
  }, {});

  return Object.entries(groups).sort(([left], [right]) => {
    const leftIndex = SERVICE_GROUP_ORDER.indexOf(left);
    const rightIndex = SERVICE_GROUP_ORDER.indexOf(right);
    const normalizedLeft = leftIndex === -1 ? SERVICE_GROUP_ORDER.length : leftIndex;
    const normalizedRight = rightIndex === -1 ? SERVICE_GROUP_ORDER.length : rightIndex;
    return normalizedLeft - normalizedRight || left.localeCompare(right, 'vi');
  });
};

const formatVND = amount =>
  new Intl.NumberFormat('vi-VN').format(Number(amount) || 0) + ' đ';

export default function ServiceSelectionCard({
  service,
  selected,
  onToggle,
  eligibility = { eligible: true, reason: '' },
}) {
  const [expanded, setExpanded] = useState(false);
  const disabled = eligibility?.eligible === false;
  const description = service.description?.trim();
  const canExpand = description?.length > 85;

  const handleSelect = () => {
    if (!disabled) onToggle(service);
  };

  return (
    <article
      className={`h-full min-h-[172px] rounded-2xl border p-5 transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
          : selected
            ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 shadow-sm'
            : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'
      }`}
    >
      <div className="flex h-full items-start gap-4">
        <button
          type="button"
          onClick={handleSelect}
          disabled={disabled}
          aria-label={`${selected ? 'Bỏ chọn' : 'Chọn'} dịch vụ ${service.name}`}
          aria-pressed={selected}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
            selected
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-slate-300 bg-white text-transparent'
          }`}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </button>

        <div className="flex min-w-0 flex-1 flex-col self-stretch">
          <button
            type="button"
            onClick={handleSelect}
            disabled={disabled}
            className="w-full text-left"
          >
            <span className="block text-[15px] font-semibold leading-snug text-slate-900">
              {service.name}
            </span>
            {service.capabilityName && (
              <span className="mt-1 block text-xs text-slate-400">
                {service.capabilityName}
              </span>
            )}
          </button>

          {description && (
            <div className="mt-2">
              <p className={`text-xs leading-relaxed text-slate-500 ${expanded ? '' : 'line-clamp-2'}`}>
                {description}
              </p>
              {canExpand && (
                <button
                  type="button"
                  onClick={() => setExpanded(value => !value)}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800"
                  aria-expanded={expanded}
                >
                  {expanded ? 'Thu gọn' : 'Xem thêm'}
                  {expanded
                    ? <ChevronUp className="h-3.5 w-3.5" />
                    : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          )}

          {disabled && eligibility.reason && (
            <p className="mt-2 text-xs text-red-500">{eligibility.reason}</p>
          )}

          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <span className="text-sm font-bold text-primary-700">
              {formatVND(service.price)}
            </span>
            {service.durationMinutes && (
              <span className="text-[11px] text-slate-400">
                {service.durationMinutes} phút
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

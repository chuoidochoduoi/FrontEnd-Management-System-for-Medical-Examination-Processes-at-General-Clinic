export const EXAM_GROUPS = [
    'Nội khoa',
    'Ngoại khoa',
    'Nhi khoa',
    'Sản phụ khoa',
    'Da liễu',
    'Khám bệnh khác',
];

export const PARACLINICAL_GROUPS = [
    'Xét nghiệm',
    'Chẩn đoán hình ảnh',
    'Cận lâm sàng khác',
];

export const BLOOD_TYPES = [
    ['A_POSITIVE', 'A+'], ['A_NEGATIVE', 'A-'],
    ['B_POSITIVE', 'B+'], ['B_NEGATIVE', 'B-'],
    ['AB_POSITIVE', 'AB+'], ['AB_NEGATIVE', 'AB-'],
    ['O_POSITIVE', 'O+'], ['O_NEGATIVE', 'O-'],
];

export const formatCurrency = (value) =>
    value != null
        ? `${new Intl.NumberFormat('vi-VN').format(Number(value))}đ`
        : '—';

export const normalizeText = (value = '') =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const normalizePhone = (value = '') => {
    const digits = value.replace(/\D/g, '');
    return digits.startsWith('84') ? `0${digits.slice(2)}` : digits;
};

export const buildDobIso = (day, month, year) => {
    if (!day || !month || !year || String(year).length !== 4) return '';
    const numericDay = Number(day);
    const numericMonth = Number(month);
    const numericYear = Number(year);
    const value = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));
    if (value.getUTCFullYear() !== numericYear
        || value.getUTCMonth() !== numericMonth - 1
        || value.getUTCDate() !== numericDay) return '';
    return `${String(numericYear).padStart(4, '0')}-${String(numericMonth).padStart(2, '0')}-${String(numericDay).padStart(2, '0')}`;
};

export const serviceGroup = (service) => {
    if (service.departmentType === 'EXAMINATION') {
        const name = normalizeText(service.specializationName || service.department);
        if (name.includes('noi khoa')) return 'Nội khoa';
        if (name.includes('ngoai khoa')) return 'Ngoại khoa';
        if (name.includes('nhi khoa')) return 'Nhi khoa';
        if (name.includes('san') || name.includes('phu khoa')) return 'Sản phụ khoa';
        if (name.includes('da lieu')) return 'Da liễu';
        return 'Khám bệnh khác';
    }
    const detail = normalizeText(`${service.department} ${service.capabilityName} ${service.name}`);
    if (/(x-quang|x quang|sieu am|ecg|dien tim|chan doan hinh anh)/.test(detail)) {
        return 'Chẩn đoán hình ảnh';
    }
    if (/(xet nghiem|huyet hoc|sinh hoa|nuoc tieu|test nhanh|crp)/.test(detail)) {
        return 'Xét nghiệm';
    }
    return 'Cận lâm sàng khác';
};

export const toGenderEnum = (gender) => {
    if (!gender) return null;
    if (gender === 'male') return 'MALE';
    if (gender === 'female') return 'FEMALE';
    if (gender === 'other') return 'OTHER';
    return gender;
};

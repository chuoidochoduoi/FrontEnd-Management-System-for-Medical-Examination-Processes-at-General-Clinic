const codeOf = service => String(service?.code || service?.serviceCode || '').toUpperCase();
const relationsOf = service => Array.isArray(service?.relations) ? service.relations : [];

/**
 * Áp dụng quy tắc quan hệ do backend trả về ngay khi người dùng chọn dịch vụ.
 * Backend vẫn là lớp bảo vệ cuối cùng cho các client cũ.
 */
export function toggleServiceWithPolicy(current, candidate, catalogue = []) {
    const selected = Array.isArray(current) ? current : [];
    if (selected.some(item => item.id === candidate.id)) {
        return { services: selected.filter(item => item.id !== candidate.id), message: '' };
    }

    const candidateCode = codeOf(candidate);
    const allServices = catalogue.length ? catalogue : [...selected, candidate];
    const covering = selected.find(item => relationsOf(item).some(relation =>
        relation.type === 'INCLUDES' && String(relation.targetServiceCode).toUpperCase() === candidateCode));
    if (covering) {
        return {
            services: selected,
            message: `${candidate.name} đã được bao gồm trong ${covering.name}.`,
            blocked: true,
        };
    }

    const candidateRelations = relationsOf(candidate);
    const conflict = candidateRelations.find(relation => relation.type === 'MUTUALLY_EXCLUSIVE'
        && selected.some(item => codeOf(item) === String(relation.targetServiceCode).toUpperCase()));
    if (conflict) {
        return { services: selected, message: conflict.message || 'Hai dịch vụ này không thể chọn cùng nhau.', blocked: true };
    }

    const includedCodes = new Set(candidateRelations
        .filter(relation => relation.type === 'INCLUDES')
        .map(relation => String(relation.targetServiceCode).toUpperCase()));
    const removed = selected.filter(item => includedCodes.has(codeOf(item)));
    let next = [...selected.filter(item => !includedCodes.has(codeOf(item))), candidate];
    const similar = candidateRelations.find(relation => relation.type === 'SIMILAR'
        && selected.some(item => codeOf(item) === String(relation.targetServiceCode).toUpperCase()));
    const removedMessage = removed.length
        ? `${removed.map(item => item.name).join(', ')} đã được bỏ vì đã nằm trong ${candidate.name}.`
        : '';

    // Khi đã chọn đủ các chỉ số lẻ, tự chuyển về gói cố định ngay trên UI.
    // Backend vẫn lặp lại quy tắc này trước khi lập hóa đơn.
    const completedPanel = allServices.find(service => {
        const analyteCodes = relationsOf(service)
            .filter(relation => relation.type === 'INCLUDES'
                && String(relation.targetServiceCode || '').toUpperCase().startsWith('AN-'))
            .map(relation => String(relation.targetServiceCode).toUpperCase());
        return analyteCodes.length > 0
            && analyteCodes.every(code => next.some(item => codeOf(item) === code));
    });
    let packageMessage = '';
    if (completedPanel) {
        const analyteCodes = new Set(relationsOf(completedPanel)
            .filter(relation => relation.type === 'INCLUDES'
                && String(relation.targetServiceCode || '').toUpperCase().startsWith('AN-'))
            .map(relation => String(relation.targetServiceCode).toUpperCase()));
        next = [...next.filter(item => !analyteCodes.has(codeOf(item))), completedPanel];
        packageMessage = `Đã chọn đủ chỉ số nên hệ thống áp dụng giá gói ${completedPanel.name}.`;
    }
    return {
        services: next,
        message: packageMessage || removedMessage || similar?.message || '',
        warning: Boolean(similar),
        catalogue: allServices,
    };
}

export function serviceRelationHint(service) {
    const included = relationsOf(service).filter(relation => relation.type === 'INCLUDES');
    if (!included.length) return '';
    const analytes = included.filter(item => String(item.targetServiceCode || '').toUpperCase().startsWith('AN-'));
    if (analytes.length > 4) return `Gói cố định · bao gồm ${analytes.length} chỉ số`;
    return `Bao gồm ${included.map(item => item.targetServiceName).join(', ')}`;
}

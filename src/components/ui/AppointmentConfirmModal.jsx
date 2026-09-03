import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, User, UsersRound, Clock, FileText, Phone, X, Info, LoaderCircle } from 'lucide-react';
import styles from './AppointmentConfirmModal.module.css';

const money = value => new Intl.NumberFormat('vi-VN').format(value || 0) + ' đ';
const displayValue = value => value === undefined || value === null || String(value).trim() === ''
    ? 'Chưa cung cấp' : value;
const serviceKind = service => {
    const code = String(service.code || service.serviceCode || '').toUpperCase();
    if (code.startsWith('AN-')) return `Chỉ số lẻ · ${code}`;
    if ((service.relations || []).some(relation =>
        relation.type === 'INCLUDES' && String(relation.targetServiceCode || '').startsWith('AN-'))) {
        return `Gói xét nghiệm · ${code}`;
    }
    return service.departmentType === 'EXAMINATION' ? 'Dịch vụ khám' : 'Cận lâm sàng';
};

function Details({ rows }) {
    return <dl className={styles.details}>
        {rows.map(row => <div key={row.label} className={row.wide ? styles.wide : undefined}>
            <dt>{row.label}</dt>
            <dd>{displayValue(row.value)}</dd>
        </div>)}
    </dl>;
}

export default function AppointmentConfirmModal({ data, onClose, onConfirm, namespace = 'appointment', isLoading = false }) {
    const { t } = useTranslation(namespace);
    const titleId = useId();
    const descriptionId = useId();
    const dialogRef = useRef(null);
    const backRef = useRef(null);
    const pendingRef = useRef(false);
    const tConfirm = key => t('confirmModal.' + key);
    const services = data.services || [];
    const groupMembers = data.groupMembers || [];
    const isGroup = groupMembers.length > 0;

    useEffect(() => {
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        backRef.current?.focus();
        return () => {
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus?.();
        };
    }, []);

    const handleKeyDown = event => {
        if (event.key === 'Escape') {
            event.stopPropagation();
            if (!isLoading && !pendingRef.current) onClose();
        }
        if (event.key !== 'Tab') return;
        const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), [tabindex="0"]')];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
            event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
        }
    };

    const confirm = async () => {
        if (isLoading || pendingRef.current) return;
        pendingRef.current = true;
        try { await onConfirm(); } finally { pendingRef.current = false; }
    };

    const patientRows = [
        { label: tConfirm('fullName'), value: data.fullName, wide: true },
        ...(data.patientCode ? [{ label: 'Mã bệnh nhân', value: data.patientCode }] : []),
        ...('dateOfBirth' in data ? [{ label: 'Ngày sinh', value: data.dateOfBirth }] : []),
        { label: tConfirm('ageGender'), value: data.ageGender },
        { label: tConfirm('phone'), value: data.phone },
        { label: 'Email', value: data.email },
        { label: 'Địa chỉ', value: data.address, wide: true },
        ...(data.bhyt ? [{ label: 'Bảo hiểm y tế', value: data.bhyt, wide: true }] : []),
    ];

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.dialog} ref={dialogRef} role="dialog" aria-modal="true"
                aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={isLoading}
                tabIndex={-1} onKeyDown={handleKeyDown}>
                <header className={styles.header}>
                    <CheckCircle2 className={styles.headerIcon} size={32} aria-hidden="true" />
                    <div>
                        <h2 id={titleId}>{data.title || tConfirm('title')}</h2>
                        <p id={descriptionId}>{data.subtitle || tConfirm('subtitle')}</p>
                    </div>
                    <button type="button" className={styles.close} aria-label="Đóng xác nhận"
                        disabled={isLoading} onClick={onClose}><X size={24} /></button>
                </header>

                <div className={styles.body} tabIndex={0} aria-label="Thông tin cần xác nhận">
                    <div className={`${styles.grid} ${isGroup ? styles.groupGrid : ''}`}>
                        {!isGroup && <section className={styles.section}>
                            <h3><User size={22} aria-hidden="true" />{tConfirm('patientInfo')}</h3>
                            <Details rows={patientRows} />
                        </section>}
                        <div className={styles.stack}>
                            <section className={styles.section}>
                                <h3><Clock size={22} aria-hidden="true" />Thông tin lịch khám</h3>
                                <Details rows={[
                                    { label: tConfirm('date'), value: data.date },
                                    { label: 'Ca khám / Khung giờ', value: data.timeSlot },
                                    ...(data.method ? [{ label: 'Hình thức', value: data.method, wide: true }] : []),
                                ]} />
                            </section>
                            {data.contactManager && <section className={styles.section}>
                                <h3><Phone size={22} aria-hidden="true" />Người quản lý / liên hệ</h3>
                                <Details rows={[
                                    { label: 'Họ và tên', value: data.contactManager.name, wide: true },
                                    { label: 'Số điện thoại', value: data.contactManager.phone },
                                    { label: 'Email', value: data.contactManager.email },
                                ]} />
                                <p className={styles.hint}>Thông tin liên hệ của người quản lý, không thay thế hồ sơ người được khám.</p>
                            </section>}
                        </div>
                    </div>

                    {isGroup && <section className={styles.section}>
                        <div className={styles.serviceHeading}>
                            <h3><UsersRound size={22} aria-hidden="true" />Người được khám và dịch vụ riêng</h3>
                            <span className={styles.count}>{groupMembers.length} người · {groupMembers.reduce((sum, member) => sum + member.services.length, 0)} lượt dịch vụ</span>
                        </div>
                        <div className={styles.memberList}>
                            {groupMembers.map((member, memberIndex) => <article className={styles.memberCard} key={member.patientProfileId || memberIndex}>
                                <header className={styles.memberHeader}>
                                    <span className={styles.memberNumber}>{memberIndex + 1}</span>
                                    <div>
                                        <strong>{member.fullName}</strong>
                                        <p>{[member.relationshipName, member.patientCode, member.dateOfBirth, member.ageGender].filter(Boolean).join(' · ')}</p>
                                    </div>
                                    <strong className={styles.memberTotal}>{money(member.total)}</strong>
                                </header>
                                <div className={styles.memberServices}>
                                    {member.services.map((service, serviceIndex) => <div key={service.id || service.serviceId || serviceIndex}>
                                        <span>{serviceIndex + 1}. {service.name}</span>
                                        <strong>{money(service.price)}</strong>
                                    </div>)}
                                </div>
                            </article>)}
                        </div>
                        <div className={styles.total}><span>Tổng chi phí cả nhóm</span><strong>{data.total}</strong></div>
                    </section>}

                    {!isGroup && <section className={styles.section}>
                        <div className={styles.serviceHeading}>
                            <h3><FileText size={22} aria-hidden="true" />{tConfirm('services')}</h3>
                            <span className={styles.count}>{services.length} dịch vụ</span>
                        </div>
                        <div className={styles.serviceLabels}><span>Dịch vụ đã chọn</span><span>Chi phí</span></div>
                        <ul className={styles.services}>
                            {services.map((service, index) => <li key={service.id || service.serviceId || index}>
                                <span className={styles.serviceName}>
                                    <span className={styles.number}>{index + 1}</span>
                                    <span>{service.name}<small className="mt-1 block text-sm font-normal text-slate-500">{serviceKind(service)}</small></span>
                                </span>
                                <strong>{money(service.price)}</strong>
                            </li>)}
                        </ul>
                        {!services.length && <p className={styles.hint}>Chưa chọn dịch vụ.</p>}
                        <div className={styles.total}><span>{tConfirm('total')}</span><strong>{data.total}</strong></div>
                        {data.reason && <div className={styles.reason}><span>{tConfirm('reason')}</span><p>{data.reason}</p></div>}
                    </section>}
                    <p className={styles.note}><Info size={22} aria-hidden="true" /><span>{data.note || tConfirm('note')}</span></p>
                </div>

                <footer className={styles.footer}>
                    <button ref={backRef} type="button" className={styles.back} disabled={isLoading} onClick={onClose}>
                        {tConfirm('back')}
                    </button>
                    <button type="button" className={styles.confirm} disabled={isLoading} onClick={confirm}>
                        {isLoading ? <><LoaderCircle size={20} className={styles.spinner} />Đang xử lý...</> : data.confirmLabel || tConfirm('confirm')}
                    </button>
                </footer>
            </div>
        </div>, document.body
    );
}

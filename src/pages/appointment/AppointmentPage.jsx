import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppointment } from '@/hooks/useAppointment';
import { toggleServiceWithPolicy, serviceRelationHint } from '@/utils/serviceSelectionPolicy';
import { useProfile } from '@/hooks/useProfile';
import AppointmentConfirmModal from '@/components/ui/AppointmentConfirmModal';
import { groupServicesBySpecialty } from '@/components/appointment/ServiceSelectionCard';
import { ArrowRight, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, Clock, Info, Search, ShieldCheck, Stethoscope, User } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import logoUrl from '@/assets/logo.jpg';
import styles from './AppointmentPage.module.css';

const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const toLocalDateInputValue = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getMinimumAppointmentDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 1);
    return toLocalDateInputValue(today);
};

const getMaximumAppointmentDate = () => {
    const maximum = new Date();
    maximum.setHours(0, 0, 0, 0);
    maximum.setFullYear(maximum.getFullYear() + 1);
    return toLocalDateInputValue(maximum);
};

const splitAppointmentDate = value => {
    const [year = '', month = '', day = ''] = (value || '').split('-');
    return { day, month, year };
};

const appointmentDaysInMonth = (year, month) => {
    if (!year || !month) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
};

export default function AppointmentPage() {
    const { t } = useTranslation('appointment');
    const { t: tCommon } = useTranslation('common');

    const { services, loadingServices, book, loading: booking, error, shifts, shiftLoading, fetchShifts } = useAppointment();
    const { profile } = useProfile();

    // Step 1 — Thông tin khách hàng (chỉ dùng khi chưa đăng nhập)
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');

    // Step 2 — Dịch vụ
    const [selectedServices, setSelectedServices] = useState([]);
    const [activeServiceTab, setActiveServiceTab] = useState('EXAMINATION');
    const [serviceSearch, setServiceSearch] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({
        EXAMINATION: null,
        PARACLINICAL: null,
    });

    // Step 3 — Thời gian
    const [date, setDate] = useState('');
    const [dateParts, setDateParts] = useState(splitAppointmentDate(''));
    const [timeSlot, setTimeSlot] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);

    const selectedServiceKey = selectedServices.map(service => service.id).sort().join(',');
    useEffect(() => {
        setTimeSlot('');
        fetchShifts(date, selectedServiceKey ? selectedServiceKey.split(',') : []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, selectedServiceKey]);

    // Quản lý Step hiển thị
    const [currentStep, setCurrentStep] = useState(1);
    const [step1Errors, setStep1Errors] = useState({});

    const minimumDate = getMinimumAppointmentDate();
    const maximumDate = getMaximumAppointmentDate();
    const bookingYears = Array.from(
        { length: Number(maximumDate.slice(0, 4)) - Number(minimumDate.slice(0, 4)) + 1 },
        (_, index) => String(Number(minimumDate.slice(0, 4)) + index)
    );

    const updateAppointmentDate = (part, value) => {
        setDateParts(previous => {
            const next = { ...previous, [part]: value };
            const maximumDay = appointmentDaysInMonth(next.year, next.month);
            if (next.day && Number(next.day) > maximumDay) next.day = '';
            if (!next.year || !next.month || !next.day) {
                setDate('');
                return next;
            }
            const candidate = `${next.year}-${String(next.month).padStart(2, '0')}-${String(next.day).padStart(2, '0')}`;
            setDate(candidate >= minimumDate && candidate <= maximumDate ? candidate : '');
            setTimeSlot('');
            return next;
        });
    };

    // Tự động chuyển sang bước 2 nếu đã đăng nhập (làm tiện hơn)
    useEffect(() => {
        if (profile && currentStep === 1) {
            setCurrentStep(2);
        }
    }, [profile, currentStep]);

    const handleNext = () => {
        if (currentStep === 1 && !profile) {
            const errors = {};
            if (!fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên';
            if (!phone.trim()) {
                errors.phone = 'Vui lòng nhập số điện thoại';
            } else if (!/^[0-9]{10,11}$/.test(phone.trim())) {
                errors.phone = 'Số điện thoại không hợp lệ';
            }
            if (!age || age < 1 || age > 120) errors.age = 'Vui lòng nhập tuổi hợp lệ';
            if (!gender) errors.gender = 'Vui lòng chọn giới tính';
            
            if (Object.keys(errors).length > 0) {
                setStep1Errors(errors);
                return;
            }
            setStep1Errors({});
        }
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, profile ? 2 : 1));

    const toggleService = (service) => {
        setSelectedServices(prev => {
            const resolution = toggleServiceWithPolicy(prev, service, services);
            if (resolution.message) toast.info(resolution.message);
            return resolution.services;
        });
    };

    const totalCost = selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0);
    const examinationCount = selectedServices.filter(
        service => service.departmentType === 'EXAMINATION'
    ).length;
    const paraclinicalCount = selectedServices.length - examinationCount;

    const visibleServiceGroups = useMemo(() => {
        const keyword = serviceSearch.trim().toLocaleLowerCase('vi');
        const filtered = services.filter(service => {
            const correctType = activeServiceTab === 'EXAMINATION'
                ? service.departmentType === 'EXAMINATION'
                : service.departmentType !== 'EXAMINATION';
            if (!correctType) return false;
            if (!keyword) return true;
            return [service.name, service.description, service.specializationName,
                service.department, service.capabilityName]
                .filter(Boolean).join(' ').toLocaleLowerCase('vi').includes(keyword);
        });
        return groupServicesBySpecialty(filtered);
    }, [activeServiceTab, serviceSearch, services]);

    useEffect(() => {
        if (visibleServiceGroups.length === 0 || serviceSearch.trim()) return;
        setExpandedGroups(previous => previous[activeServiceTab]
            ? previous
            : { ...previous, [activeServiceTab]: visibleServiceGroups[0][0] });
    }, [activeServiceTab, serviceSearch, visibleServiceGroups]);

    const handleSubmit = () => {
        if (!date || date < getMinimumAppointmentDate()) {
            toast.warning('Lịch hẹn phải được đặt từ ngày mai trở đi.');
            return;
        }
        // Hiện modal xác nhận thay vì gửi ngay
        setShowConfirmModal(true);
    };

    const handleConfirm = async () => {
        if (booking || bookingComplete) return;
        const computedAge = profile
            ? (profile.age ?? (profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : age))
            : age;
        const patientInfo = profile
            ? {
                customerId: profile.id,
                fullName: profile.fullName,
                phone: profile.phone,
                age: Number(computedAge),
                gender: profile.gender === 'Nam' ? 'male' : profile.gender === 'Nữ' ? 'female' : profile.gender === 'Khác' ? 'other' : profile.gender,
                address: profile.address
            }
            : { fullName, phone, age, gender, address };
        const success = await book({ ...patientInfo, selectedServices, date, shiftId: timeSlot });
        if (success) {
            setBookingComplete(true);
            setShowConfirmModal(false);
        }
    };

    const chosenShift = shifts?.find(shift => shift.id === timeSlot);
    const patientName = profile?.fullName || fullName;
    const stageLabels = ['Thông tin người khám', 'Chọn dịch vụ', 'Chọn ngày và ca'];

    return <div className={styles.site}>
        <header className={styles.nav}>
            <Link to="/" className={styles.brand}><img src={logoUrl} alt="" />CareS</Link>
            <nav aria-label="Điều hướng đặt lịch">
                <Link to="/">Trang chủ</Link>
                <Link to={ROUTES.GUEST_JOURNEY}><Search size={17} /> Tra cứu lượt khám</Link>
                <Link to={profile ? ROUTES.MY_APPOINTMENTS : '/login'}>{profile ? 'Lịch hẹn của tôi' : 'Đăng nhập'}</Link>
            </nav>
        </header>
        <main className={styles.page}>
            <header className={styles.heading}>
                <span className={styles.eyebrow}><CalendarDays size={18} /> Đặt lịch cùng CareS</span>
                <h1>Đặt lịch khám</h1>
                <p>{profile ? 'Chọn dịch vụ và thời gian phù hợp cho lượt khám của bạn.' : 'Bạn có thể đặt lịch trực tiếp tại đây mà không cần tạo tài khoản.'}</p>
            </header>

            <section className={styles.guestAccess} aria-label="Tra cứu dành cho khách">
                <span className={styles.accessIcon}><Search size={25} /></span>
                <div><h2>Đã được lễ tân check-in?</h2><p>Dùng mã lượt khám VIS và số điện thoại trên phiếu để xem phòng, vị trí chờ và hành trình. Không cần đăng nhập.</p></div>
                <Link to={ROUTES.GUEST_JOURNEY} className={styles.secondary}>Tra cứu lượt khám <ArrowRight size={18} /></Link>
            </section>

            {bookingComplete ? <section className={styles.success} role="status">
                <CheckCircle2 size={48} /><h2>Đặt lịch thành công</h2><p>Thông tin lịch khám của {patientName || 'bạn'} đã được gửi đến CareS.</p>
                <p>Khi đến phòng khám, vui lòng gặp lễ tân để check-in. Mã lượt khám VIS dùng để theo dõi hành trình được cấp sau khi check-in, không phải mã lịch hẹn.</p>
                <div><Link to={profile ? ROUTES.MY_APPOINTMENTS : '/'} className={styles.primary}>{profile ? 'Xem lịch hẹn của tôi' : 'Về trang chủ'}</Link>
                    <Link to={ROUTES.GUEST_JOURNEY} className={styles.secondary}>Tra cứu hành trình sau check-in</Link></div>
            </section> : <>
                <ol className={styles.steps} aria-label="Tiến trình đặt lịch">
                    {stageLabels.map((label, index) => <li key={label} className={currentStep === index + 1 ? styles.current : currentStep > index + 1 ? styles.done : ''}
                        aria-current={currentStep === index + 1 ? 'step' : undefined}>
                        <span>{currentStep > index + 1 ? <CheckCircle2 size={22} /> : index + 1}</span><div><strong>{label}</strong>
                            <small>{currentStep > index + 1 ? 'Đã hoàn tất' : currentStep === index + 1 ? 'Đang thực hiện' : 'Bước tiếp theo'}</small></div>
                    </li>)}
                </ol>
                <div className={styles.columns}>
                    <form className={styles.formCard} noValidate onSubmit={event => { event.preventDefault(); if (!booking) { if (currentStep === 3) handleSubmit(); else if (currentStep === 1 || selectedServices.length) handleNext(); } }}>
                        <header className={styles.cardHeading}><span className={styles.eyebrow}>Bước 0{currentStep}</span>
                            <h2>{stageLabels[currentStep - 1]}</h2>
                            <p>{currentStep === 1 ? 'Thông tin này giúp lễ tân chuẩn bị và liên hệ xác nhận lịch.' : currentStep === 2 ? 'Bạn có thể chọn nhiều dịch vụ. Lựa chọn được giữ khi đổi nhóm hoặc tìm kiếm.' : 'Chọn ngày khám trước, sau đó chọn ca còn khả dụng.'}</p>
                        </header>
                        <div className={styles.formBody}>
                            {currentStep === 1 && <div className={styles.fields}>
                                <label className={styles.wide} htmlFor="booking-name">Họ và tên <span className={styles.required}>*</span>
                                    <input id="booking-name" autoComplete="name" maxLength={50} value={fullName} onChange={e => { setFullName(e.target.value); setStep1Errors(prev => ({...prev, fullName: ''})); }}
                                        placeholder="Nhập họ tên người được khám" aria-invalid={!!step1Errors.fullName} aria-describedby={step1Errors.fullName ? 'booking-name-error' : undefined} />
                                    {step1Errors.fullName && <small id="booking-name-error" className={styles.fieldError}>{step1Errors.fullName}</small>}
                                </label>
                                <label htmlFor="booking-phone">Số điện thoại <span className={styles.required}>*</span>
                                    <input id="booking-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={phone} onChange={e => { setPhone(e.target.value); setStep1Errors(prev => ({...prev, phone: ''})); }}
                                        placeholder="Số điện thoại để liên hệ" aria-invalid={!!step1Errors.phone} aria-describedby={step1Errors.phone ? 'booking-phone-error' : undefined} />
                                    {step1Errors.phone && <small id="booking-phone-error" className={styles.fieldError}>{step1Errors.phone}</small>}
                                </label>
                                <div className={styles.ageGender}>
                                    <label htmlFor="booking-age">Tuổi <span className={styles.required}>*</span><input id="booking-age" type="number" min={1} max={120} value={age}
                                        onChange={e => { setAge(e.target.value); setStep1Errors(prev => ({...prev, age: ''})); }} placeholder="Nhập tuổi"
                                        aria-invalid={!!step1Errors.age} aria-describedby={step1Errors.age ? 'booking-age-error' : undefined} />
                                        {step1Errors.age && <small id="booking-age-error" className={styles.fieldError}>{step1Errors.age}</small>}
                                    </label>
                                    <label htmlFor="booking-gender">Giới tính <span className={styles.required}>*</span><select id="booking-gender" value={gender}
                                        onChange={e => { setGender(e.target.value); setStep1Errors(prev => ({...prev, gender: ''})); }}
                                        aria-invalid={!!step1Errors.gender} aria-describedby={step1Errors.gender ? 'booking-gender-error' : undefined}>
                                        <option value="">Chọn giới tính</option><option value="male">Nam</option><option value="female">Nữ</option></select>
                                        {step1Errors.gender && <small id="booking-gender-error" className={styles.fieldError}>{step1Errors.gender}</small>}
                                    </label>
                                </div>
                                <label className={styles.wide} htmlFor="booking-address">Địa chỉ <span className={styles.optional}>(không bắt buộc)</span>
                                    <input id="booking-address" autoComplete="street-address" maxLength={255} value={address} onChange={e => setAddress(e.target.value)} placeholder="Địa chỉ liên hệ" />
                                </label>
                                <p className={styles.note}><ShieldCheck size={20} /> Thông tin được sử dụng để tiếp nhận và phục vụ lượt khám của bạn.</p>
                            </div>}

                            {currentStep === 2 && <>
                                <label className={styles.search}><Search size={19} /><input type="search" aria-label="Tìm dịch vụ" value={serviceSearch}
                                    onChange={event => setServiceSearch(event.target.value)} placeholder="Tìm dịch vụ, chuyên khoa hoặc kỹ thuật…" /></label>
                                <div className={styles.tabs} aria-label="Nhóm dịch vụ">
                                    {[['EXAMINATION', 'Khám bệnh', examinationCount], ['PARACLINICAL', 'Cận lâm sàng', paraclinicalCount]].map(([type, label, count]) =>
                                        <button key={type} type="button" aria-pressed={activeServiceTab === type} onClick={() => { setActiveServiceTab(type); setServiceSearch(''); }}
                                            className={activeServiceTab === type ? styles.selectedTab : ''}>{label}{count > 0 ? ` · ${count} đã chọn` : ''}</button>)}
                                </div>
                                <p className={styles.notice}><Info size={20} />{activeServiceTab === 'EXAMINATION'
                                    ? 'Có thể đặt nhiều dịch vụ khám trong một lịch hẹn. Các dịch vụ được thực hiện lần lượt, mỗi dịch vụ có bệnh án riêng.'
                                    : 'Cận lâm sàng đặt sẵn là bước độc lập; chỉ quay lại bác sĩ khi được bác sĩ chỉ định trong lúc khám.'}</p>
                                {loadingServices ? <p className={styles.empty} role="status">Đang tải dịch vụ…</p> : <div className={styles.serviceList}>
                                    {!visibleServiceGroups.length && <p className={styles.empty}>Không tìm thấy dịch vụ phù hợp.</p>}
                                    {visibleServiceGroups.map(([groupName, groupServices]) => {
                                        const open = !!serviceSearch.trim() || expandedGroups[activeServiceTab] === groupName;
                                        return <section className={styles.serviceGroup} key={groupName}>
                                            <button type="button" aria-expanded={open} className={styles.groupHeading} onClick={() => setExpandedGroups(previous => ({...previous, [activeServiceTab]: open ? null : groupName}))}>
                                                <strong>{groupName}</strong><span>{groupServices.length} dịch vụ <ChevronDown size={18} style={{transform: open ? 'rotate(180deg)' : undefined}} /></span>
                                            </button>
                                            {open && <div>{groupServices.map(service => {
                                                const checked = selectedServices.some(item => item.id === service.id);
                                                return <label className={`${styles.serviceRow} ${checked ? styles.checked : ''}`} key={service.id}>
                                                    <input type="checkbox" checked={checked} onChange={() => toggleService(service)} />
                                                    <span><strong>{service.name}</strong>{service.description && <small>{service.description}</small>}{serviceRelationHint(service) && <small>{serviceRelationHint(service)}</small>}</span>
                                                    <b>{formatVND(service.price ?? 0)}</b>
                                                </label>;
                                            })}</div>}
                                        </section>;
                                    })}
                                </div>}
                            </>}

                            {currentStep === 3 && <div className={styles.timeStep}>
                                <fieldset><legend>Ngày khám</legend><div className={styles.dateFields}>
                                    <label>Ngày<select aria-label="Ngày khám" value={dateParts.day} onChange={event => updateAppointmentDate('day', event.target.value)}>
                                        <option value="">Ngày</option>{Array.from({length: appointmentDaysInMonth(dateParts.year, dateParts.month)}, (_, i) => String(i + 1).padStart(2, '0')).map(day => <option key={day} value={day}>{day}</option>)}</select></label>
                                    <label>Tháng<select aria-label="Tháng khám" value={dateParts.month} onChange={event => updateAppointmentDate('month', event.target.value)}>
                                        <option value="">Tháng</option>{Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(month => <option key={month} value={month}>{month}</option>)}</select></label>
                                    <label>Năm<select aria-label="Năm khám" value={dateParts.year} onChange={event => updateAppointmentDate('year', event.target.value)}>
                                        <option value="">Năm</option>{bookingYears.map(year => <option key={year} value={year}>{year}</option>)}</select></label>
                                </div>
                                <p className={styles.dateHint}>Có thể đặt từ ngày mai đến tối đa 12 tháng tiếp theo.</p>
                                {dateParts.day && dateParts.month && dateParts.year && !date && <p className={styles.fieldError}>Ngày khám phải từ ngày mai đến tối đa 12 tháng tiếp theo.</p>}
                                </fieldset>
                                <fieldset><legend>Ca khám</legend>
                                    {!date ? <p className={styles.empty}>Vui lòng chọn ngày khám hợp lệ để xem ca phù hợp.</p> : shiftLoading ? <p className={styles.empty} role="status">Đang kiểm tra ca khám…</p>
                                        : shifts?.length ? <div className={styles.shifts}>{shifts.map(shift => <button type="button" key={shift.id} disabled={!shift.available}
                                            aria-pressed={timeSlot === shift.id} onClick={() => shift.available && setTimeSlot(shift.id)}
                                            className={timeSlot === shift.id ? styles.selectedShift : ''}>
                                            <Clock size={20} /><strong>{shift.name}</strong><span>{shift.startTime?.slice(0, 5)} – {shift.endTime?.slice(0, 5)}</span>
                                            {!shift.available && <small>Ca chưa có đủ nhân sự</small>}
                                            {shift.timeSource === 'SPECIAL' && <small>Giờ làm việc ngoại lệ</small>}
                                        </button>)}</div> : <p className={styles.empty}>Chưa có ca khám khả dụng cho ngày và dịch vụ đã chọn.</p>}
                                </fieldset>
                            </div>}

                            {error && <div className={styles.error} role="alert">{error}</div>}
                        </div>
                        <footer className={styles.formActions}>
                            {currentStep > (profile ? 2 : 1) && <button className={styles.secondary} type="button" onClick={handleBack} disabled={booking}><ChevronLeft size={18} /> Quay lại</button>}
                            <button className={styles.primary} type="submit" disabled={booking || (currentStep === 2 && !selectedServices.length) || (currentStep === 3 && (!date || !timeSlot || shiftLoading))}>
                                {booking ? tCommon('loading') : currentStep === 3 ? 'Kiểm tra và xác nhận' : 'Tiếp tục'} <ArrowRight size={18} />
                            </button>
                        </footer>
                    </form>

                    <aside className={styles.sidebar} aria-label="Tổng kết lịch khám">
                        <section className={styles.summary}>
                            <h2>Lịch khám của bạn</h2>
                            <dl><div><dt><User size={17} /> Người được khám</dt><dd>{patientName || 'Chưa nhập thông tin'}</dd></div>
                                <div><dt><CalendarDays size={17} /> Ngày và ca khám</dt><dd>{date ? date.split('-').reverse().join('/') : 'Chưa chọn ngày'}{chosenShift ? ` · ${chosenShift.name}` : ''}</dd></div></dl>
                            <div className={styles.summaryServices}><h3><Stethoscope size={18} /> Dịch vụ đã chọn <span>{selectedServices.length}</span></h3>
                                {selectedServices.length ? <ul>{selectedServices.map(service => <li key={service.id}><span>{service.name}</span><strong>{formatVND(service.price ?? 0)}</strong></li>)}</ul> : <p>Chọn dịch vụ ở bước 2 để xem chi phí tạm tính.</p>}
                            </div>
                            <div className={styles.total}><span>Chi phí tạm tính</span><strong>{formatVND(totalCost)}</strong><p>Khám bệnh: {examinationCount} · Cận lâm sàng: {paraclinicalCount}</p></div>
                            <p className={styles.summaryNote}>Đây là chi phí dịch vụ đã chọn, không phải xác nhận đã thanh toán.</p>
                        </section>
                        <section className={styles.help}><Info size={22} /><div><h3>Không cần tài khoản</h3><p>Đặt lịch bằng thông tin người khám. Sau khi đến check-in, dùng mã VIS trên phiếu để theo dõi lượt khám.</p>
                            <Link to={ROUTES.GUEST_JOURNEY}>Mở trang tra cứu Guest <ArrowRight size={16} /></Link></div></section>
                    </aside>
                </div>
            </>}
        </main>
            {/* Modal xác nhận */}
            {showConfirmModal && (
                <AppointmentConfirmModal
                    namespace="appointment"
                    data={{
                        fullName: profile ? profile.fullName : fullName,
                        phone: profile ? profile.phone : phone,
                        ageGender: profile
                            ? `${profile.age ?? calculateAge(profile.dateOfBirth) ?? ''} / ${profile.gender === 'Nam' ? t('step1.genderOptions.male') : profile.gender === 'Nữ' ? t('step1.genderOptions.female') : profile.gender === 'Khác' ? t('step1.genderOptions.other') : profile.gender}`
                            : `${age} / ${gender === 'male' ? t('step1.genderOptions.male') : gender === 'female' ? t('step1.genderOptions.female') : t('step1.genderOptions.other')}`,
                        email: profile?.email,
                        address: profile ? profile.address : address,
                        date,
                        timeSlot: shifts?.find(s => s.id === timeSlot)?.name || '',
                        method: 'Khám trực tiếp tại phòng khám',
                        total: formatVND(totalCost),
                        services: selectedServices,
                        reason: '',
                    }}
                    isLoading={booking}
                    onClose={() => { if (!booking) setShowConfirmModal(false); }}
                    onConfirm={handleConfirm}
                />
            )}

    </div>;
}

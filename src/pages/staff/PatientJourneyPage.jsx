import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Eye, RefreshCw, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import OwnerLayout from '@/components/layout/OwnerLayout';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { createJourneyLoader } from '@/services/patientJourneyService';
import { formatClinicDateTime, formatTodayCheckInDuration, isJourneyCompleted, journeyFilters, journeyStatus, journeyWarnings, sortJourneyPage } from '@/utils/patientJourneyPresentation';
import JourneyServiceProgress from '@/components/journey/JourneyServiceProgress';
import { journeyPhaseLabel } from '@/components/journey/QueuePanel';
import styles from './PatientJourneyPage.module.css';

const stored = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const PAGE_SIZE = 8;

function StatusBadge({ value }) {
    const state = journeyStatus(value);
    return <span className={[styles.badge, styles[state.tone]].join(' ')}>{state.label}</span>;
}

function PriorityBadge({ item }) {
    if (!item?.priorityLabel) return null;
    const tone = { RETURNING_FROM_TEST: 'deepPurple', APPOINTMENT_ON_TIME: 'teal',
        APPOINTMENT_LATE: 'deepOrange', REGULAR: 'gray' }[item.priorityCategory] || 'gray';
    return <span className={[styles.badge, styles[tone], styles.priorityBadge].join(' ')}>{item.priorityLabel}</span>;
}

function Warnings({ item, overdue = false }) {
    return journeyWarnings(item, { overdue }).map(message => <p className={styles.warning} key={message}><AlertTriangle size={16} aria-hidden="true" /><span>{message}</span></p>);
}

function JourneyDetails({ selected, detail, loading, error, refresh, retry, close, overdue }) {
    const dialogRef = useRef(null);
    useEffect(() => {
        const dialog = dialogRef.current;
        dialog.showModal();
        return () => { if (dialog.open) dialog.close(); };
    }, []);
    return createPortal(<dialog ref={dialogRef} className={styles.drawer}
        aria-labelledby="journey-detail-title" onCancel={event => { event.preventDefault(); close(); }}>
        <header className={styles.drawerHeader}>
            <div><h2 id="journey-detail-title">Chi tiết hành trình</h2><p>{selected.patientName || 'Bệnh nhân'} · {selected.visitCode}</p></div>
            <button type="button" autoFocus className={styles.iconButton} onClick={close} aria-label="Đóng chi tiết"><X size={24} /></button>
        </header>
        <div className={styles.drawerBody} aria-busy={loading}>
            <button type="button" className={styles.button} onClick={refresh} disabled={loading}><RefreshCw size={18} />Làm mới danh sách và chi tiết</button>
            {loading ? <p className={styles.message} role="status">Đang tải chi tiết mới nhất...</p>
                : error ? <div className={styles.error} role="alert"><p>{error}</p><button type="button" className={styles.button} onClick={retry}>Thử lại chi tiết</button></div>
                : detail && <>
                    <section className={styles.overview}>
                        <strong>{detail.patientName || '—'}</strong>
                        <p>{detail.guest ? 'Khách vãng lai' : 'Có tài khoản'} · {detail.phone || '—'} · {detail.visitCode}</p>
                        <p>Vị trí: {detail.currentRoom || '—'}</p>
                        {detail.responsibleDoctorName && <p>Bác sĩ phụ trách: {detail.responsibleDoctorName}</p>}
                        {overdue && <p>Check-in: {formatClinicDateTime(detail.checkInTime)}</p>}
                        {detail.queueNumber != null && <p>Số phiếu: {detail.queueNumber}{detail.waitingPosition != null ? ` · Vị trí hiện tại: ${detail.waitingPosition}` : ''}</p>}
                        <StatusBadge value={detail.currentStatus} /><PriorityBadge item={detail} /><Warnings item={detail} overdue={overdue} />
                    </section>
                    {!detail.steps?.length ? <p className={styles.message}>Chưa có bước hành trình.</p> : <ol className={styles.timeline}>
                        {detail.steps.map((step, index) => { const isCurrent = step.id === detail.currentStepId; return <li
                            key={String(step.id || 'step') + '-' + index} aria-current={isCurrent ? 'step' : undefined}
                            className={isCurrent ? styles.currentTimelineStep : undefined}>
                            <span aria-hidden="true" className={[styles.dot, styles[journeyStatus(step.status).tone]].join(' ')} />
                            <div>{journeyPhaseLabel(step) && <span className={styles.phase}>{journeyPhaseLabel(step)}</span>}
                                <h3>{step.serviceName || '—'}</h3><p>{step.roomName || 'Chưa có phòng'}{step.roomCode ? ' (' + step.roomCode + ')' : ''}</p>
                                <StatusBadge value={step.status} />{isCurrent && <strong className={styles.currentFlag}>Bước hiện tại</strong>}
                                <JourneyServiceProgress step={step} /></div>
                        </li>; })}
                    </ol>}
                </>}
        </div>
    </dialog>, document.body);
}

export default function PatientJourneyPage() {
    const { i18n } = useTranslation('operations');
    const Layout = stored('systemRole') === 'CLINIC_MANAGER' ? OwnerLayout : ReceptionistLayout;
    const [listLoader] = useState(() => createJourneyLoader());
    const [detailLoader] = useState(() => createJourneyLoader());
    const [overdueLoader] = useState(() => createJourneyLoader());
    const [query, setQuery] = useState({ search: '', status: '', scope: 'TODAY', page: 0, revision: 0, delay: 0 });
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [overdueTotal, setOverdueTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState('');
    const [sort, setSort] = useState('newest');
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [detailRevision, setDetailRevision] = useState(0);

    const changeQuery = (changes, delay = 0) => {
        listLoader.cancel();
        setLoading(true);
        setQuery(current => ({ ...current, ...changes, delay }));
    };

    useEffect(() => {
        setLoading(true);
        setListError('');
        const timer = window.setTimeout(() => {
            const params = new URLSearchParams({ page: String(query.page), size: String(PAGE_SIZE) });
            params.set('scope', query.scope);
            if (query.search.trim()) params.set('search', query.search.trim());
            if (query.status) params.set('status', query.status);
            listLoader.load('?' + params, {
                success: payload => {
                    const count = payload.totalElements ?? 0;
                    const lastPage = Math.max(0, Math.ceil(count / PAGE_SIZE) - 1);
                    if (query.page > lastPage) {
                        setQuery(current => ({ ...current, page: lastPage, delay: 0 }));
                        return;
                    }
                    setItems(payload.content ?? []);
                    setTotal(count);
                },
                error: failure => { setListError(failure.message); setItems([]); setTotal(0); },
                settled: () => setLoading(false),
            });
        }, query.delay);
        return () => { window.clearTimeout(timer); listLoader.cancel(); };
    }, [query, listLoader]);

    useEffect(() => {
        overdueLoader.load('?scope=OVERDUE&page=0&size=1', {
            success: payload => setOverdueTotal(payload.totalElements ?? 0),
            error: () => setOverdueTotal(0),
            settled: () => {},
        });
        return () => overdueLoader.cancel();
    }, [overdueLoader, query.revision]);

    useEffect(() => {
        if (!selected) return;
        setDetailLoading(true);
        setDetailError('');
        detailLoader.load('/' + encodeURIComponent(selected.visitId), {
            success: setDetail,
            error: failure => { setDetailError(failure.message); setDetail(null); },
            settled: () => setDetailLoading(false),
        });
        return () => detailLoader.cancel();
    }, [selected, detailRevision, detailLoader]);

    const openDetails = item => {
        detailLoader.cancel();
        setDetail(null);
        setDetailError('');
        setDetailLoading(true);
        setSelected({ visitId: item.visitId, patientName: item.patientName, visitCode: item.visitCode });
    };
    const closeDetails = () => { detailLoader.cancel(); setSelected(null); setDetail(null); };
    const retryDetails = () => { detailLoader.cancel(); setDetailLoading(true); setDetailRevision(value => value + 1); };
    const refresh = () => {
        listLoader.cancel();
        setLoading(true);
        setQuery(current => ({ ...current, revision: current.revision + 1, delay: 0 }));
        if (selected) retryDetails();
    };
    const shown = useMemo(() => sortJourneyPage(items, sort, i18n.language), [items, sort, i18n.language]);
    const pageCount = Math.ceil(total / PAGE_SIZE);
    const pages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => Math.max(0, Math.min(query.page - 2, pageCount - 5)) + index);
    const overdue = query.scope === 'OVERDUE';

    return <Layout><div className={'cares-reception-shared-page ' + styles.page}>
        <header className={styles.header}>
            <div><h1>Hành trình bệnh nhân</h1><p>Theo dõi vị trí hiện tại và bước tiếp theo của bệnh nhân. Không thao tác chuyển bước tại màn hình này.</p></div>
            <button type="button" onClick={refresh} className={styles.button} disabled={loading}><RefreshCw size={18} />Làm mới</button>
        </header>
        <nav className={styles.tabs} aria-label="Phạm vi hành trình" role="tablist">
            <button type="button" role="tab" aria-selected={!overdue} className={!overdue ? styles.activeTab : ''}
                onClick={() => { closeDetails(); changeQuery({ scope: 'TODAY', page: 0 }); }}>Hôm nay</button>
            <button type="button" role="tab" aria-selected={overdue} className={overdue ? styles.activeTab : ''}
                onClick={() => { closeDetails(); changeQuery({ scope: 'OVERDUE', page: 0 }); }}>Tồn đọng qua ngày <span>{overdueTotal}</span></button>
        </nav>
        <section className={styles.filters} aria-label="Bộ lọc hành trình">
            <label>Tìm bệnh nhân<div className={styles.search}><Search size={18} aria-hidden="true" /><input value={query.search} onChange={event => changeQuery({ search: event.target.value, page: 0 }, 300)} placeholder="Tên, số điện thoại hoặc mã lượt khám" /></div></label>
            <label>Trạng thái<select value={query.status} onChange={event => changeQuery({ status: event.target.value, page: 0 })}><option value="">Tất cả trạng thái</option>{journeyFilters.map(value => <option key={value} value={value}>{journeyStatus(value).label}{value === 'PENDING' ? ' (yêu cầu CLS)' : ''}</option>)}</select></label>
            <label>Sắp xếp trong trang<select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Check-in mới nhất</option><option value="waiting">{overdue ? 'Tồn đọng lâu nhất' : 'Thời gian từ check-in lâu nhất'}</option><option value="name">Tên A–Z</option></select></label>
        </section>
        <section className={styles.card} aria-label="Danh sách hành trình" aria-busy={loading}>
            <div className={styles.tableScroll}><table className={styles.table}>
                <colgroup><col style={{ width: '20%' }} /><col style={{ width: '14%' }} /><col style={{ width: '13%' }} /><col style={{ width: '17%' }} /><col style={{ width: '10%' }} /><col style={{ width: '14%' }} /><col style={{ width: '12%' }} /></colgroup>
                <thead><tr>{['Bệnh nhân', 'Bước hiện tại', 'Vị trí', 'Trạng thái', overdue ? 'Thời điểm check-in' : 'Từ lúc check-in', 'Bước tiếp theo', 'Thao tác'].map(title => <th scope="col" key={title}>{title}</th>)}</tr></thead>
                <tbody>{!loading && !listError && shown.map(item => <tr key={item.visitId}>
                    <td><strong>{item.patientName || '—'}</strong><p className={styles.metadata}>{item.guest ? 'Khách vãng lai' : 'Có tài khoản'} · {item.phone || '—'}</p><p className={styles.metadata}>{item.visitCode}</p></td>
                    <td>{item.currentStep || '—'}</td><td>{item.currentRoom || '—'}</td>
                    <td><StatusBadge value={item.currentStatus} /><PriorityBadge item={item} /><Warnings item={item} overdue={overdue} />{overdue && item.responsibleDoctorName && <p className={styles.metadata}>Bác sĩ: {item.responsibleDoctorName}</p>}</td>
                    <td>{isJourneyCompleted(item.currentStatus) ? '—' : overdue
                        ? <span className={styles.overdueTime}><strong>Quá ngày</strong><small>{formatClinicDateTime(item.checkInTime)}</small></span>
                        : formatTodayCheckInDuration(item.waitingMinutes)}</td><td>{item.nextStep || '—'}</td>
                    <td><button type="button" onClick={() => openDetails(item)} className={styles.detailButton} aria-label={'Xem chi tiết ' + (item.patientName || item.visitCode)}><Eye size={18} aria-hidden="true" />Xem chi tiết</button></td>
                </tr>)}</tbody>
            </table></div>
            {loading ? <p className={styles.message} role="status">Đang tải hành trình...</p>
                : listError ? <div className={styles.error} role="alert"><p>{listError}</p><button type="button" className={styles.button} onClick={refresh}>Thử lại</button></div>
                : !shown.length && <p className={styles.message}>{overdue ? 'Không có lượt tồn đọng qua ngày.' : 'Hôm nay chưa có bệnh nhân phù hợp.'}</p>}
            {!loading && !listError && total > 0 && <nav className={styles.pagination} aria-label="Phân trang hành trình">
                <span>{query.page * PAGE_SIZE + 1}–{Math.min((query.page + 1) * PAGE_SIZE, total)} / {total}</span>
                <div><button type="button" disabled={query.page === 0} onClick={() => changeQuery({ page: query.page - 1 })} aria-label="Trang trước">‹</button>{pages.map(index => <button type="button" key={index} onClick={() => changeQuery({ page: index })} aria-label={'Trang ' + (index + 1)} aria-current={query.page === index ? 'page' : undefined}>{index + 1}</button>)}<button type="button" disabled={query.page + 1 >= pageCount} onClick={() => changeQuery({ page: query.page + 1 })} aria-label="Trang sau">›</button></div>
            </nav>}
        </section>
        {selected && <JourneyDetails selected={selected} detail={detail} loading={detailLoading} error={detailError} refresh={refresh} retry={retryDetails} close={closeDetails} overdue={overdue} />}
    </div></Layout>;
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, MapPin, RefreshCw, Route } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useProfile } from '@/hooks/useProfile';
import styles from '@/components/journey/journey.module.css';
import QueuePanel, { labels, completedStatuses, journeyPhaseLabel } from '@/components/journey/QueuePanel';
import JourneyServiceProgress from '@/components/journey/JourneyServiceProgress';
import { requestCustomerReturn } from '@/services/queueReturnRequestService';

const stored = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

async function getData(path, signal) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
        signal, headers: { Authorization: `Bearer ${stored('token')}` },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        if (response.status === 403) throw new Error('Bạn không có quyền xem dữ liệu này.');
        throw new Error(body?.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
    return body?.data ?? body;
}


export default function WaitingRoomPage() {
    const navigate = useNavigate();
    const { profile } = useProfile();
    const { members: familyMembers } = useFamilyMembers(false);
    const [patientProfileId, setPatientProfileId] = useState('all');
    const [selectedVisitId, setSelectedVisitId] = useState('');
    const [journeys, setJourneys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const listRequest = useRef(null);
    const [queueState, setQueueState] = useState({ key: '', data: null, loading: true, error: '', updatedAt: '' });
    const [queueRetry, setQueueRetry] = useState(0);
    const [requestingReturn, setRequestingReturn] = useState(false);
    const [returnMessage, setReturnMessage] = useState('');

    const load = useCallback(async (silent = false) => {
        listRequest.current?.abort();
        const controller = new AbortController();
        listRequest.current = controller;
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const params = new URLSearchParams();
            if (patientProfileId === 'all') params.set('includeFamily', 'true');
            else if (patientProfileId !== 'self') params.set('patientProfileId', patientProfileId);
            const items = await getData(`/api/patient/my-journeys?${params}`, controller.signal);
            if (!Array.isArray(items)) throw new Error('Dữ liệu hành trình không hợp lệ.');
            if (controller.signal.aborted) return;
            setJourneys(items);
            setError('');
            setSelectedVisitId((previous) => items.some((item) => String(item.visitId) === previous) ? previous
                : String((items.find((item) => !['COMPLETED', 'CANCELLED', 'UNASSIGNED'].includes(item.currentStatus)) || items[0])?.visitId || ''));
        } catch (failure) {
            if (!controller.signal.aborted) setError(failure.message);
        } finally {
            if (!controller.signal.aborted) { setLoading(false); setRefreshing(false); }
        }
    }, [patientProfileId]);

    useEffect(() => {
        load();
        const refreshVisible = () => { if (!document.hidden) load(true); };
        const timer = setInterval(refreshVisible, 20000);
        document.addEventListener('visibilitychange', refreshVisible);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', refreshVisible);
            listRequest.current?.abort();
        };
    }, [load]);

    const current = journeys.find((journey) => String(journey.visitId) === selectedVisitId) || journeys[0];
    const queueKey = current ? `${current.visitId}:${current.currentStatus}:${current.currentRoom}` : '';
    useEffect(() => {
        if (!current) return;
        const controller = new AbortController();
        setQueueState((previous) => ({ key: queueKey, data: previous.key === queueKey ? previous.data : null,
            updatedAt: previous.key === queueKey ? previous.updatedAt : '', loading: true, error: '' }));
        getData(`/api/patient/my-journeys/${current.visitId}/queue`, controller.signal)
            .then((data) => {
                if (controller.signal.aborted) return;
                if (String(data?.visitId) !== String(current.visitId) || !Array.isArray(data?.waiting) || !Array.isArray(data?.serving)) {
                    throw new Error('Dữ liệu hàng chờ không hợp lệ.');
                }
                setQueueState({ key: queueKey, data, loading: false, error: '',
                    updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
            })
            .catch((failure) => {
                if (!controller.signal.aborted) setQueueState((previous) => ({ ...previous, loading: false, error: failure.message }));
            });
        return () => controller.abort();
    }, [current, queueKey, queueRetry]);

    const queue = queueState.key === queueKey ? queueState.data : null;
    const queueLoading = queueState.key !== queueKey || queueState.loading;
    const queueError = queueState.key === queueKey ? queueState.error : '';
    const status = queue?.currentStatus || current?.currentStatus;
    const visibleSteps = useMemo(() => (current?.steps || []).filter((step) =>
        step.status !== 'CANCELLED' || ['INITIAL_PAYMENT', 'ORDER_PAYMENT'].includes(step.phase)), [current]);
    const progressSteps = visibleSteps.filter((step) => step.status !== 'CANCELLED');
    const endedWithSkipped = queue?.returnRequestStatus === 'EXPIRED'
        || (['COMPLETED', 'CANCELLED'].includes(status) && visibleSteps.some((step) => step.status === 'SKIPPED'));
    const completedCount = progressSteps.filter((step) => completedStatuses.has(step.status)).length;
    const completedClinicalCount = visibleSteps.reduce((total, step) => {
        if (!completedStatuses.has(step.status) || ['INITIAL_PAYMENT', 'ORDER_PAYMENT'].includes(step.phase)) return total;
        return total + (Number(step.completedServiceCount) || Number(step.totalServiceCount) || 1);
    }, 0);
    const skippedClinicalCount = visibleSteps.reduce((total, step) => step.status === 'SKIPPED'
        ? total + (Number(step.totalServiceCount) || (Array.isArray(step.services) ? step.services.length : 1)) : total, 0);
    const progress = progressSteps.length ? Math.round(completedCount / progressSteps.length * 100) : 0;
    const currentStepIndex = current?.currentStepId
        ? visibleSteps.findIndex((step) => step.id === current.currentStepId)
        : visibleSteps.findIndex((step) => step.status === current?.currentStatus
            && !completedStatuses.has(step.status));
    const ownName = current?.patientName || 'Người được khám';
    const positionLabel = queueError || error ? 'Chưa cập nhật' : queue?.waitingPosition ? `Thứ ${queue.waitingPosition}`
        : status === 'CALLED' ? 'Đến phòng ngay' : status === 'IN_PROGRESS' ? 'Đang thực hiện' : '—';
    const handleRequestReturn = async () => {
        if (!current?.visitId || requestingReturn) return;
        setRequestingReturn(true); setReturnMessage('');
        try {
            const result = await requestCustomerReturn(current.visitId);
            setReturnMessage(result?.message || 'Đã báo lễ tân. Vui lòng đến quầy để xác nhận có mặt.');
            await load(true);
            setQueueRetry((value) => value + 1);
        } catch (failure) {
            setReturnMessage(failure.message || 'Không thể gửi yêu cầu quay lại. Vui lòng thử lại.');
        } finally {
            setRequestingReturn(false);
        }
    };

    return <CustomerLayout><div className={styles.page}>
        <header className="cares-customer-page-heading">
            <div><span className="cares-customer-eyebrow"><Route size={17} /> Theo dõi trực tiếp</span>
                <h1>Hành trình của tôi</h1><p>Theo dõi vị trí chờ và từng bước trong lượt khám của bạn.</p></div>
            <button type="button" className="cares-customer-secondary-button" disabled={loading || refreshing || queueLoading && !!current}
                onClick={() => { load(true); setQueueRetry((value) => value + 1); }}>
                <RefreshCw size={18} className={refreshing ? styles.spinning : ''} /> Cập nhật
            </button>
        </header>
        <div className={styles.filters}>
            <label>Người được khám<select value={patientProfileId} onChange={(event) => {
                listRequest.current?.abort(); setJourneys([]); setSelectedVisitId(''); setLoading(true); setError('');
                setPatientProfileId(event.target.value);
            }}>
                <option value="all">Tất cả thành viên</option>
                <option value="self">Tôi · {profile?.fullName || 'Chính chủ'}</option>
                {familyMembers.map((member) => <option key={member.patientProfileId} value={member.patientProfileId}>{member.fullName} · {member.relationshipName}</option>)}
            </select></label>
            {journeys.length > 0 && <label>Lượt khám<select value={current?.visitId || ''} onChange={(event) => setSelectedVisitId(event.target.value)}>
                {journeys.map((journey) => <option key={journey.visitId} value={journey.visitId}>
                    {journey.patientName} · {journey.visitCode} · {labels[journey.currentStatus] || 'Đang cập nhật'}
                </option>)}
            </select></label>}
        </div>
        {error && <div className={styles.error} role="alert"><span>{error} {current ? 'Hành trình bên dưới là dữ liệu lần cập nhật trước.' : ''}</span>
            <button type="button" onClick={() => load(true)} disabled={refreshing}>Thử lại</button></div>}
        {loading && <div className={styles.empty} role="status"><RefreshCw size={28} className={styles.spinning} /><p>Đang tải hành trình…</p></div>}
        {!loading && !current && !error && <div className={styles.empty}><Route size={34} /><h2>Chưa có hành trình</h2><p>Hành trình sẽ xuất hiện sau khi lễ tân check-in cho người được khám.</p></div>}
        {!loading && current && <>
            <section className={styles.overview} aria-label="Thông tin hiện tại">
                <div><span>Việc cần làm</span><strong>{endedWithSkipped ? 'Lượt khám trong ngày đã kết thúc'
                    : status === 'SKIPPED' ? 'Bạn đã vắng khi được gọi' : labels[status] || 'Đang cập nhật'}</strong>
                    <p>{status === 'CALLED' ? 'Vui lòng di chuyển đến phòng được gọi.' : current.currentStep}</p></div>
                <div><span><MapPin size={17} /> Phòng hiện tại</span><strong>{queue?.roomName
                    ? `${queue.roomName}${queue.roomCode ? ` (${queue.roomCode})` : ''}`
                    : status === 'PAYMENT_PENDING' ? 'Quầy thu ngân' : status === 'RESULT_PENDING' ? 'Khu vực chờ kết quả' : current.currentRoom || 'Chưa phân phòng'}</strong></div>
                <div className={styles.yourPosition} aria-live="polite" aria-atomic="true"><span>Vị trí hàng chờ</span><strong>{positionLabel}</strong>
                    <p>{queue?.queueNumber != null ? `Số phiếu ${queue.queueNumber}. ` : ''}{!queueError && !error && queue?.peopleAhead != null ? (queue.peopleAhead === 0 ? 'Bạn đứng đầu danh sách chờ.' : `Còn ${queue.peopleAhead} người chờ trước bạn.`)
                        : queueLoading ? 'Đang cập nhật vị trí…' : 'Vị trí được cập nhật theo phòng hiện tại.'}</p></div>
            </section>
            {endedWithSkipped && (
                <section className="mb-5 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div><h2 className="text-lg font-bold text-amber-950">Tổng kết lượt khám đã kết thúc</h2><p className="mt-1 text-base text-amber-900">Đã hoàn thành {completedClinicalCount} dịch vụ · Đã bỏ lượt {skippedClinicalCount} dịch vụ.</p></div>
                    {completedClinicalCount > 0 && <button type="button" className="cares-customer-secondary-button shrink-0" onClick={() => navigate(`${'/customer/visits'}/${current.visitId}${patientProfileId === 'self' || patientProfileId === 'all' ? '' : `?patientProfileId=${encodeURIComponent(patientProfileId)}`}`)}>Xem lịch sử bệnh án</button>}
                </section>
            )}
            <div className={styles.columns}>
                <QueuePanel queue={queue} loading={queueLoading} error={queueError}
                    updatedAt={queueState.key === queueKey ? queueState.updatedAt : ''} patientName={ownName} status={status}
                    retry={() => setQueueRetry((value) => value + 1)} bookingPath="/customer/appointment" endedWithSkipped={endedWithSkipped}
                    onRequestReturn={handleRequestReturn} requestingReturn={requestingReturn} returnMessage={returnMessage} />
                <section className={styles.card} aria-labelledby="journey-steps-title">
                    <header className={styles.cardHeader}><div><span className={styles.eyebrow}><Route size={18} /> {current.visitCode}</span>
                        <h2 id="journey-steps-title">Hành trình của bạn</h2><p>{ownName}</p></div></header>
                    <div className={styles.progress}><span>{completedCount}/{progressSteps.length} bước hoàn thành</span><span>{progress}%</span>
                        <div role="progressbar" aria-label="Tiến độ lượt khám" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress}%` }} /></div></div>
                    <ol className={styles.timeline}>
                        {visibleSteps.map((step, index) => { const isCurrent = index === currentStepIndex; return <li key={step.id || index}
                            aria-current={isCurrent ? 'step' : undefined}
                            className={completedStatuses.has(step.status) ? styles.done : isCurrent ? styles.active
                                : step.status === 'BLOCKED' ? styles.blocked : step.status === 'SKIPPED' ? styles.skipped
                                    : step.status === 'CANCELLED' ? styles.cancelled : styles.idle}>
                            <span className={styles.marker}>{completedStatuses.has(step.status) ? <CheckCircle2 size={21} /> : index + 1}</span>
                            <div>{journeyPhaseLabel(step) && <span className={styles.phase}>{journeyPhaseLabel(step)}</span>}
                                <h3>{step.serviceName || 'Dịch vụ khám'}</h3>
                                <p>{step.roomName ? `${step.roomName}${step.roomCode ? ` (${step.roomCode})` : ''}` : 'Phòng sẽ được cập nhật'}</p>
                                <span className={styles.stepStatus}>{labels[step.status] || 'Đang cập nhật'}</span>
                                {isCurrent && <strong className={styles.currentFlag}>{step.status === 'SKIPPED'
                                    ? (endedWithSkipped ? 'Lượt trong ngày đã kết thúc' : 'Bạn đã vắng khi được gọi')
                                    : step.status === 'BLOCKED' ? 'Bước tiếp theo đang được chuẩn bị' : 'Bạn đang ở bước này'}</strong>}
                                <JourneyServiceProgress step={step} /></div>
                        </li>; })}
                    </ol>
                    {visibleSteps.length === 0 && <p className={styles.emptyList}>Chưa có bước thực hiện được phân công.</p>}
                </section>
            </div>
        </>}
    </div></CustomerLayout>;
}

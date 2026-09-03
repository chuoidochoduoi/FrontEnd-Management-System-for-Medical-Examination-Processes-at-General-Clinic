import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, Headphones, MapPin, RefreshCw, Route, Search, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import logoUrl from '@/assets/logo.jpg';
import QueuePanel, { labels, completedStatuses, journeyPhaseLabel } from '@/components/journey/QueuePanel';
import JourneyServiceProgress from '@/components/journey/JourneyServiceProgress';
import shared from '@/components/journey/journey.module.css';
import styles from './GuestJourneyPage.module.css';
import { requestGuestReturn } from '@/services/queueReturnRequestService';

async function lookup(path, criteria, signal) {
    const params = new URLSearchParams(criteria);
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/patient-journeys/${path}?${params}`, {
        signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        const error = new Error(response.status === 404 ? 'Không tìm thấy lượt khám phù hợp. Vui lòng kiểm tra mã lượt khám và số điện thoại trên phiếu.'
            : response.status === 429 ? 'Bạn tra cứu quá nhanh. Vui lòng chờ một lát rồi thử lại.'
            : 'Không thể cập nhật hành trình. Vui lòng thử lại hoặc liên hệ lễ tân.');
        error.status = response.status;
        throw error;
    }
    return body?.data ?? body;
}

export default function GuestJourneyPage() {
    const [visitCode, setVisitCode] = useState('');
    const [phone, setPhone] = useState('');
    const [criteria, setCriteria] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fields, setFields] = useState({});
    const [updatedAt, setUpdatedAt] = useState('');
    const [requestingReturn, setRequestingReturn] = useState(false);
    const [returnMessage, setReturnMessage] = useState('');
    const request = useRef(null);
    const codeInput = useRef(null);

    const load = useCallback(async (query, silent = false) => {
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        let timedOut = false;
        const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
        setLoading(true);
        if (!silent) { setCriteria(null); setResult(null); setUpdatedAt(''); }
        setError('');
        try {
            const [journey, queue] = await Promise.all([
                lookup('lookup', query, controller.signal),
                lookup('lookup/queue', query, controller.signal),
            ]);
            if (controller.signal.aborted) return;
            if (!journey?.visitId || queue?.visitId !== journey.visitId || !Array.isArray(journey.steps)
                || !Array.isArray(queue.waiting) || !Array.isArray(queue.serving)) {
                throw new Error('Dữ liệu hành trình chưa đầy đủ. Vui lòng thử lại.');
            }
            setResult({ journey, queue });
            if (!silent) setCriteria(query);
            setUpdatedAt(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch (failure) {
            if (request.current === controller && (!controller.signal.aborted || timedOut)) {
                setError(timedOut ? 'Kết nối quá lâu. Vui lòng thử lại.' : failure instanceof TypeError
                    ? 'Không thể kết nối đến phòng khám. Vui lòng kiểm tra mạng và thử lại.' : failure.message);
                // Do not retain private results after lookup is no longer authorized/matching.
                if ([400, 401, 403, 404].includes(failure.status)) {
                    setResult(null); setCriteria(null); setUpdatedAt('');
                }
                controller.abort();
            }
        } finally {
            clearTimeout(timeout);
            if (request.current === controller) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!criteria) return undefined;
        const refreshVisible = () => { if (!document.hidden) load(criteria, true); };
        const timer = setInterval(refreshVisible, 20000);
        document.addEventListener('visibilitychange', refreshVisible);
        return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refreshVisible); };
    }, [criteria, load]);
    useEffect(() => () => request.current?.abort(), []);

    const discardResult = () => {
        request.current?.abort();
        request.current = null;
        setCriteria(null); setResult(null); setUpdatedAt(''); setLoading(false); setError(''); setFields({}); setReturnMessage('');
    };
    const clear = () => { discardResult(); setVisitCode(''); setPhone(''); codeInput.current?.focus(); };
    const submit = (event) => {
        event.preventDefault();
        if (loading) return;
        const query = { visitCode: visitCode.trim().toUpperCase(), phone: phone.replace(/\s+/g, '') };
        const nextErrors = {};
        if (!/^VIS-[0-9A-F]{8}$/.test(query.visitCode)) nextErrors.visitCode = 'Mã gồm VIS- và 8 ký tự trên phiếu, ví dụ VIS-12AB34CD.';
        if (!query.phone) nextErrors.phone = 'Vui lòng nhập số điện thoại trên phiếu tiếp nhận.';
        setFields(nextErrors);
        if (Object.keys(nextErrors).length) return;
        load(query);
    };

    const journey = result?.journey;
    const queue = result?.queue;
    const status = queue?.currentStatus || journey?.currentStatus;
    const steps = useMemo(() => (journey?.steps || []).filter((step) =>
        step.status !== 'CANCELLED' || ['INITIAL_PAYMENT', 'ORDER_PAYMENT'].includes(step.phase)), [journey]);
    const progressSteps = steps.filter((step) => step.status !== 'CANCELLED');
    const endedWithSkipped = queue?.returnRequestStatus === 'EXPIRED'
        || (['COMPLETED', 'CANCELLED'].includes(status) && steps.some((step) => step.status === 'SKIPPED'));
    const completedCount = progressSteps.filter((step) => completedStatuses.has(step.status)).length;
    const progress = progressSteps.length ? Math.round(completedCount / progressSteps.length * 100) : 0;
    const currentStepIndex = journey?.currentStepId
        ? steps.findIndex((step) => step.id === journey.currentStepId)
        : steps.findIndex((step) => step.status === journey?.currentStatus
            && !completedStatuses.has(step.status));
    const date = journey?.checkInTime ? new Date(journey.checkInTime) : null;
    const visitDate = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('vi-VN') : '';
    const currentRoom = queue?.roomName ? `${queue.roomName}${queue.roomCode ? ` (${queue.roomCode})` : ''}`
        : status === 'PAYMENT_PENDING' ? 'Quầy thu ngân' : status === 'RESULT_PENDING' ? 'Khu vực chờ kết quả' : journey?.currentRoom || 'Chưa phân phòng';
    const handleRequestReturn = async () => {
        if (!criteria || requestingReturn) return;
        setRequestingReturn(true); setReturnMessage('');
        try {
            const response = await requestGuestReturn(criteria);
            setReturnMessage(response?.message || 'Đã báo lễ tân. Vui lòng đến quầy để xác nhận có mặt.');
            await load(criteria, true);
        } catch (failure) {
            setReturnMessage(failure.message || 'Không thể gửi yêu cầu quay lại. Vui lòng thử lại.');
        } finally {
            setRequestingReturn(false);
        }
    };

    return <div className={styles.site}>
        <header className={styles.nav}>
            <Link to="/" className={styles.brand}><img src={logoUrl} alt="" />CareS</Link>
            <nav aria-label="Điều hướng khách"><Link to="/">Trang chủ</Link><Link to="/appointment">Đặt lịch khám</Link><Link to="/login">Đăng nhập</Link></nav>
        </header>
        <main className={`${shared.page} ${styles.page}`}>
            <header className={styles.heading}><div><h1>Tra cứu hành trình khám</h1><p>Theo dõi lượt khám mà không cần đăng nhập.</p></div>
                {(result || visitCode || phone) && <button type="button" className={styles.secondary} onClick={clear}><Trash2 size={18} /> Xóa kết quả</button>}
            </header>
            <form className={styles.searchForm} onSubmit={submit} noValidate autoComplete="off">
                <div className={styles.searchFields}>
                    <label htmlFor="guest-visit-code">Mã lượt khám
                        <input ref={codeInput} id="guest-visit-code" value={visitCode} onChange={(event) => { discardResult(); setVisitCode(event.target.value.toUpperCase()); }}
                            placeholder="Ví dụ: VIS-12AB34CD" maxLength={12} spellCheck={false} required
                            aria-invalid={!!fields.visitCode} aria-describedby={fields.visitCode ? 'guest-code-error' : undefined} />
                        {fields.visitCode && <span id="guest-code-error" className={styles.fieldError}>{fields.visitCode}</span>}
                    </label>
                    <label htmlFor="guest-phone">Số điện thoại
                        <input id="guest-phone" type={result ? 'password' : 'tel'} inputMode="tel" value={phone}
                            onChange={(event) => { discardResult(); setPhone(event.target.value); }}
                            placeholder="Số điện thoại trên phiếu khám" maxLength={30} required
                            aria-invalid={!!fields.phone} aria-describedby={fields.phone ? 'guest-phone-error' : undefined} />
                        {fields.phone && <span id="guest-phone-error" className={styles.fieldError}>{fields.phone}</span>}
                    </label>
                    <button type="submit" className={styles.primary} disabled={loading}>
                        {loading ? <RefreshCw className={shared.spinning} size={19} /> : <Search size={19} />} {loading ? 'Đang tra cứu…' : 'Tra cứu'}
                    </button>
                </div>
                <p className={styles.hint}>Sử dụng mã lượt khám và số điện thoại trên phiếu tiếp nhận.</p>
            </form>

            {error && <div role="alert" className={shared.error}><span>{error}{result ? ' Thông tin bên dưới là lần cập nhật gần nhất.' : ''}</span>
                {criteria && <button type="button" disabled={loading} onClick={() => load(criteria, true)}>Thử lại</button>}</div>}
            {loading && !result && <div className={shared.empty} role="status"><RefreshCw size={30} className={shared.spinning} /><p>Đang tra cứu hành trình và hàng chờ…</p></div>}
            {!result && !loading && !error && <section className={styles.initial}>
                <ShieldCheck size={36} /><h2>Tra cứu bằng thông tin trên phiếu khám</h2>
                <p>Sau khi tra cứu thành công, bạn sẽ thấy phòng cần đến, vị trí chờ và các bước trong lượt khám.</p>
                <span>Chưa có mã lượt khám? Vui lòng liên hệ lễ tân.</span>
            </section>}

            {journey && <>
                <section className={styles.identity} aria-label="Lượt khám được tra cứu">
                    <UserRound size={24} /><strong>{journey.patientName || 'Người được khám'}</strong>
                    <span className={styles.visitCode}>{journey.visitCode}</span>{visitDate && <span>{visitDate}</span>}
                    <button className={styles.secondary} type="button" disabled={loading} onClick={() => load(criteria, true)}>
                        <RefreshCw size={18} className={loading ? shared.spinning : ''} /> Cập nhật
                    </button>
                </section>
                <section className={shared.overview} aria-label="Thông tin hiện tại">
                    <div><span>Việc cần làm</span><strong>{endedWithSkipped ? 'Lượt khám trong ngày đã kết thúc'
                        : status === 'SKIPPED' ? 'Bạn đã vắng khi được gọi' : labels[status] || 'Đang cập nhật'}</strong>
                        <p>{status === 'CALLED' ? 'Vui lòng đến phòng ngay khi được gọi.' : journey.currentStep}</p></div>
                    <div><span><MapPin size={17} /> Phòng hiện tại</span><strong>{currentRoom}</strong></div>
                    <div className={shared.yourPosition} aria-live="polite" aria-atomic="true"><span>Vị trí hàng chờ</span>
                        <strong>{error ? 'Chưa cập nhật' : queue.waitingPosition ? `Thứ ${queue.waitingPosition}` : status === 'CALLED' ? 'Đến phòng ngay' : status === 'IN_PROGRESS' ? 'Đang thực hiện' : '—'}</strong>
                        <p>{queue.queueNumber != null ? `Số phiếu ${queue.queueNumber}. ` : ''}{!error && queue.peopleAhead != null ? queue.peopleAhead === 0 ? 'Bạn đứng đầu danh sách chờ.' : `Còn ${queue.peopleAhead} người chờ trước bạn.` : 'Vị trí được cập nhật theo phòng hiện tại.'}</p>
                    </div>
                </section>
                <div className={shared.columns}>
                    <QueuePanel queue={queue} loading={loading} error="" updatedAt={updatedAt} patientName={journey.patientName || 'Người được khám'}
                        status={status} retry={() => load(criteria, true)} bookingPath="/appointment" endedWithSkipped={endedWithSkipped}
                        onRequestReturn={handleRequestReturn} requestingReturn={requestingReturn} returnMessage={returnMessage} />
                    <section className={shared.card} aria-labelledby="guest-timeline">
                        <header className={shared.cardHeader}><div><span className={shared.eyebrow}><Route size={18} /> Lượt khám {journey.visitCode}</span>
                            <h2 id="guest-timeline">Hành trình của bạn</h2></div></header>
                        <div className={shared.progress}><span>{completedCount}/{progressSteps.length} bước hoàn thành</span><span>{progress}%</span>
                            <div role="progressbar" aria-label="Tiến độ lượt khám" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress}%` }} /></div></div>
                        <ol className={shared.timeline}>
                            {steps.map((step, index) => { const isCurrent = index === currentStepIndex; return <li key={step.id || index}
                                aria-current={isCurrent ? 'step' : undefined}
                                className={completedStatuses.has(step.status) ? shared.done : isCurrent ? shared.active
                                    : step.status === 'BLOCKED' ? shared.blocked : step.status === 'SKIPPED' ? shared.skipped
                                        : step.status === 'CANCELLED' ? shared.cancelled : shared.idle}>
                                <span className={shared.marker}>{completedStatuses.has(step.status) ? <CheckCircle2 size={21} /> : index + 1}</span>
                                <div>{journeyPhaseLabel(step) && <span className={shared.phase}>{journeyPhaseLabel(step)}</span>}
                                    <h3>{step.serviceName || 'Dịch vụ khám'}</h3><p>{step.roomName ? `${step.roomName}${step.roomCode ? ` (${step.roomCode})` : ''}` : 'Phòng sẽ được cập nhật'}</p>
                                    <span className={shared.stepStatus}>{labels[step.status] || 'Đang cập nhật'}</span>
                                    {isCurrent && <strong className={shared.currentFlag}>{step.status === 'SKIPPED'
                                        ? (endedWithSkipped ? 'Lượt trong ngày đã kết thúc' : 'Bạn đã vắng khi được gọi')
                                        : step.status === 'BLOCKED' ? 'Bước tiếp theo đang được chuẩn bị' : 'Bạn đang ở bước này'}</strong>}
                                    <JourneyServiceProgress step={step} /></div>
                            </li>; })}
                        </ol>
                        {!steps.length && <p className={shared.emptyList}>Chưa có bước thực hiện được phân công.</p>}
                        <div className={styles.help}><Headphones size={20} /><p>Cần hỗ trợ? Vui lòng liên hệ lễ tân.</p></div>
                    </section>
                </div>
                <p className={styles.privacy}><ShieldCheck size={18} /> Khi dùng thiết bị chung, hãy nhấn “Xóa kết quả” sau khi xem. Thao tác này không hủy hoặc xóa lượt khám.</p>
            </>}
            <footer className={styles.footer}><Clock3 size={17} /> Dữ liệu được cập nhật từ quá trình tiếp nhận và phục vụ tại phòng khám.</footer>
        </main>
    </div>;
}

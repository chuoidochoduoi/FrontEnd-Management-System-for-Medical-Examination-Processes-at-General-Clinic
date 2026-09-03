import { Activity, Clock3, RefreshCw, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './journey.module.css';

export const labels = {
    PAYMENT_PENDING: 'Chờ thanh toán', WAITING: 'Chờ gọi vào phòng', CALLED: 'Đã được gọi',
    IN_PROGRESS: 'Đang thực hiện', WAITING_FOR_TEST: 'Chờ cận lâm sàng',
    TEST_DONE: 'Chờ quay lại bác sĩ', RESULT_PENDING: 'Đang chờ kết quả',
    BLOCKED: 'Chưa đến bước này', DONE: 'Đã hoàn thành', COMPLETED: 'Đã hoàn thành',
    UNASSIGNED: 'Chưa phân luồng', SKIPPED: 'Đã bỏ lượt', CANCELLED: 'Đã hủy',
};
export const completedStatuses = new Set(['DONE', 'COMPLETED']);
export const phaseLabels = {
    INITIAL_PAYMENT: 'Thanh toán ban đầu',
    INITIAL_EXAMINATION: 'Khám ban đầu',
    ORDER_PAYMENT: 'Thanh toán chỉ định',
    PARACLINICAL: 'Cận lâm sàng',
    RETURN_EXAMINATION: 'Quay lại bác sĩ',
    RESULT: 'Chờ kết quả',
};
export const journeyPhaseLabel = (step) => {
    const base = phaseLabels[step?.phase] || '';
    return base && step?.cycleNumber ? `${base} lần ${step.cycleNumber}` : base;
};
const noQueueMessages = {
    PAYMENT_PENDING: 'Vui lòng đến quầy thu ngân. Vị trí chờ sẽ xuất hiện sau khi thanh toán và được phân phòng.',
    RESULT_PENDING: 'Bạn đang chờ kết quả cận lâm sàng, chưa cần xếp hàng tại phòng khám.',
    WAITING_FOR_TEST: 'Phòng khám đang tạm chờ cận lâm sàng. Hãy theo dõi bước tiếp theo trong hành trình.',
    BLOCKED: 'Bước này chưa được kích hoạt. Hàng chờ sẽ xuất hiện khi đến bước thực hiện.',
    COMPLETED: 'Lượt khám đã hoàn thành. Bạn có thể xem lại các bước trong hành trình.',
    CANCELLED: 'Lượt khám đã hủy, không còn trong hàng chờ.',
    SKIPPED: 'Lượt khám trong ngày đã kết thúc. Các dịch vụ chưa thực hiện được ghi nhận là bỏ lượt.',
};


export default function QueuePanel({ queue, loading, error, updatedAt, patientName, status, retry, bookingPath,
    endedWithSkipped = false, onRequestReturn, requestingReturn = false, returnMessage = '' }) {
    const closedForDay = endedWithSkipped || ['SKIPPED', 'CANCELLED', 'COMPLETED'].includes(queue?.currentStatus || status);
    const skipped = (queue?.currentStatus || status) === 'SKIPPED';
    return <section className={styles.card} aria-labelledby="room-queue-title" aria-busy={loading}>
        <header className={styles.cardHeader}>
            <div><span className={styles.eyebrow}><Users size={18} /> Thứ tự phục vụ</span>
                <h2 id="room-queue-title">{queue?.roomName ? `Hàng chờ tại ${queue.roomName}` : 'Hàng chờ tại phòng'}</h2>
                {queue?.roomName && <p>{queue.roomCode ? `Phòng ${queue.roomCode} · ` : ''}{queue.waiting.length} người đang chờ</p>}
            </div>
            {loading && <RefreshCw size={19} className={styles.spinning} aria-label="Đang cập nhật hàng chờ" />}
        </header>
        {error && <div className={styles.error} role="alert"><span>{error} {queue ? 'Dữ liệu bên dưới chưa được cập nhật.' : ''}</span>
            <button type="button" onClick={retry} disabled={loading}>Thử lại</button></div>}
        {!queue && loading && <div className={styles.skeleton} role="status" aria-label="Đang tải hàng chờ"><div /><div /><div /></div>}
        {!error && !queue?.roomName && (!loading || queue) && <div className={styles.empty}>
            <Clock3 size={32} /><h3>Chưa có vị trí hàng chờ</h3>
            <p>{endedWithSkipped ? 'Lượt khám trong ngày đã kết thúc. Dịch vụ đã làm và dịch vụ bỏ lượt vẫn được giữ trong hành trình bên cạnh.'
                : noQueueMessages[queue?.currentStatus || status] || 'Hàng chờ sẽ hiển thị sau khi phòng được phân công. Vui lòng theo dõi hành trình hoặc liên hệ lễ tân.'}</p>
            {closedForDay && bookingPath && <Link className={styles.bookingLink} to={bookingPath}>Đặt lịch khám mới</Link>}
        </div>}
        {skipped && queue && <div className={`${styles.returnNotice} ${queue.returnRequestStatus === 'EXPIRED' ? styles.expiredReturn : ''}`}>
            <RotateCcw size={25} />
            <div><h3>{queue.returnRequestStatus === 'EXPIRED' ? 'Bạn đã bỏ lượt' : 'Bạn đã được gọi nhưng chưa có mặt'}</h3>
                <p>{queue.returnRequestStatus === 'EXPIRED'
                    ? `Phiếu số ${queue.queueNumber ?? '—'} ngày ${queue.workDate ? new Date(`${queue.workDate}T00:00:00`).toLocaleDateString('vi-VN') : 'trước'} đã kết thúc. Các dịch vụ chưa thực hiện được ghi nhận là bỏ lượt.`
                    : queue.returnRequestStatus === 'PENDING'
                        ? 'Bạn đã báo quay lại. Vui lòng đến quầy lễ tân để xác nhận có mặt trước khi được đưa lại vào hàng chờ.'
                        : 'Nếu bạn đã quay lại phòng khám trong hôm nay, hãy báo cho lễ tân và xác nhận trực tiếp tại quầy.'}</p>
                {returnMessage && <strong className={styles.returnMessage}>{returnMessage}</strong>}
                {queue.returnRequestStatus === 'PENDING' && <span className={styles.pendingReturn}>Đang chờ lễ tân xác nhận</span>}
                {queue.canRequestReturn && onRequestReturn && <button type="button" onClick={onRequestReturn} disabled={requestingReturn}>
                    {requestingReturn ? <RefreshCw size={17} className={styles.spinning} /> : <RotateCcw size={17} />}
                    {requestingReturn ? 'Đang gửi…' : 'Tôi đã quay lại'}
                </button>}
                {queue.returnRequestStatus === 'EXPIRED' && bookingPath && <Link className={styles.bookingLink} to={bookingPath}>Đặt lịch khám mới</Link>}
            </div>
        </div>}
        {queue?.roomName && !skipped && <>
            <div className={styles.ticketSummary}>
                <span><small>Số phiếu</small><strong>{queue.queueNumber ?? '—'}</strong></span>
                <span><small>Vị trí hiện tại</small><strong>{queue.waitingPosition ? `Thứ ${queue.waitingPosition}` : '—'}</strong></span>
                {queue.priorityLabel && <em data-priority={queue.priorityCategory || 'REGULAR'}>{queue.priorityLabel}</em>}
            </div>
            {queue.serving.length > 0 && <div className={styles.serving}>
                <h3><Activity size={18} /> Đang được phục vụ</h3>
                {queue.serving.map((entry, index) => <div className={styles.servingRow} key={index}>
                    <span className={styles.patientIcon}><Activity size={21} /></span>
                    <div><strong>{entry.self ? patientName : 'Bệnh nhân khác'}</strong>
                        <p>{entry.self ? (entry.status === 'CALLED' ? 'Đến phòng ngay khi được gọi.' : 'Bạn đang được phục vụ tại phòng.') : 'Thông tin cá nhân được ẩn'}</p></div>
                    <span className={styles.status}>{labels[entry.status]}</span>
                </div>)}
            </div>}
            <div className={styles.listHeading}><h3>Danh sách đang chờ</h3><span>Người được phục vụ trước ở trên</span></div>
            {queue.waiting.length === 0 ? <p className={styles.emptyList}>Hiện không có người đang chờ tại phòng.</p>
                : <ol className={styles.queueList} aria-label="Danh sách theo thứ tự chờ">
                    {queue.waiting.map((entry) => <li key={entry.position} className={entry.self ? styles.self : ''} aria-current={entry.self ? 'step' : undefined}>
                        <span className={styles.position}>{entry.position}</span>
                        <div className={styles.patient}><strong>{entry.self ? patientName : 'Bệnh nhân khác'}</strong>
                            <p>{entry.self ? 'Bạn đang ở đây' : 'Đang chờ đến lượt'}</p></div>
                        <span className={styles.status}>{entry.self ? (entry.status === 'TEST_DONE' ? 'Chờ quay lại' : 'Đang chờ gọi') : 'Đang chờ'}</span>
                    </li>)}
                </ol>}
            <div className={styles.queueNote}><ShieldCheck size={19} /><p>Danh sách chỉ hiển thị vị trí, không công khai thông tin bệnh nhân khác. Người đang được phục vụ không tính vào số người chờ trước bạn.</p></div>
        </>}
        <footer className={styles.cardFooter}><RefreshCw size={16} /><span>Tự cập nhật mỗi 20 giây{updatedAt ? ` · Cập nhật lúc ${updatedAt}` : ''}</span></footer>
    </section>;
}

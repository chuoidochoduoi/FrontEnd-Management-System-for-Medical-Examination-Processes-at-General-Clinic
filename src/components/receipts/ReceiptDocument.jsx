import { amountInWords, receiptDate, receiptMoney, receiptText } from './receiptModel';

const Amount = ({ value }) => <>{receiptMoney(value)}</>;
const Detail = ({ label, children }) => <p><b>{label}:</b> {children}</p>;

export default function ReceiptDocument({ receipt: r, clinic }) {
    const totals = r.kind === 'services' ? [
        ['Tổng dịch vụ', r.total], ['BHYT chi trả', r.insurance],
        ...(r.adjustment ? [[r.adjustment > 0 ? 'Ưu đãi / giảm khác' : 'Điều chỉnh tăng', Math.abs(r.adjustment)]] : []),
        ...(r.tax ? [['Thuế', r.tax]] : []),
        ['Người bệnh trả sau BHYT', r.patientBeforeMembership],
        ...(r.membershipCard ? [[r.membershipBenefit > 0 ? `Ưu đãi thẻ CareS (${receiptMoney(r.membershipBenefitPercent)}%)` : 'Ưu đãi thẻ CareS', r.membershipBenefit]] : []),
        ['Người bệnh phải trả', r.due, true],
        ...(r.membershipCard ? [['Số tiền trừ thẻ CareS', r.paid]] : [['Đã thanh toán', r.paid]]),
        [r.balance < 0 ? 'Thanh toán dư' : 'Còn lại', r.balance == null ? null : Math.abs(r.balance)],
    ] : [['Số tiền nạp', r.due, true], ['Đã thu', r.paid], ['Số dư sau nạp', r.cardBalance]];

    return <article className="cr-document">
        <header className="cr-header">
            <div><p className="cr-brand">CareS</p><p><b>{receiptText(clinic.clinicName)}</b></p>
                {clinic.legalName && clinic.legalName !== clinic.clinicName && <p>{clinic.legalName}</p>}
                <p className="cr-small">{receiptText(clinic.address)}</p>
                <p className="cr-small">Điện thoại: {receiptText(clinic.phone)}{clinic.taxCode ? ` · MST: ${clinic.taxCode}` : ''}</p>
            </div>
            <div className="cr-reference"><Detail label="Số phiếu"><b>{receiptText(r.code)}</b></Detail>
                {r.invoiceCode && <Detail label="Mã hóa đơn">{r.invoiceCode}</Detail>}
                <Detail label={r.dateLabel}>{receiptDate(r.date, true)}</Detail>
            </div>
        </header>
        <h1 className="cr-title">{r.title}</h1>
        <section className="cr-patient">
            <Detail label={r.kind === 'services' ? 'Người được khám' : 'Chủ thẻ'}>{receiptText(r.name)}</Detail>
            <Detail label={r.kind === 'services' ? 'Mã bệnh nhân' : 'Mã thẻ'}>{receiptText(r.kind === 'services' ? r.patientCode : r.cardCode)}</Detail>
            {r.kind === 'services' && <>
                <Detail label="Ngày sinh">{receiptDate(r.dob)} · <b>Giới tính:</b> {receiptText(r.gender)}</Detail>
                <Detail label="Mã BHYT">{receiptText(r.insuranceCode)}</Detail>
                <p className="cr-address"><b>Địa chỉ:</b> {receiptText(r.address)}</p>
            </>}
        </section>
        <p className="cr-units">Đơn vị tiền: đồng (VND)</p>
        {r.kind === 'services' ? <table className="cr-table">
            <colgroup>{[10, 59, 8, 27, 28, 29, 29].map((width, i) => <col key={i} style={{ width: `${width / 190 * 100}%` }}/>)}</colgroup>
            <thead><tr>{['STT', 'Tên dịch vụ', 'SL', 'Đơn giá', 'Thành tiền', 'BHYT trả', 'Người bệnh trả'].map((name, i) => <th scope="col" key={name} className={i === 1 ? '' : i < 3 ? 'cr-center' : 'cr-number'}>{name}</th>)}</tr></thead>
            <tbody>{r.items.map((item, i) => <tr key={item.id}>
                <td className="cr-center">{i + 1}</td><td>{item.name}
                    {!!item.adjustment && <span className="cr-line-note">{item.adjustment > 0 ? 'Ưu đãi khác' : 'Điều chỉnh tăng'}: <Amount value={Math.abs(item.adjustment)}/></span>}
                </td><td className="cr-center">{receiptText(item.qty)}</td>
                {[item.unitPrice, item.total, item.insurance, item.due].map((value, j) => <td key={j} className="cr-number"><Amount value={value}/></td>)}</tr>)}
                {!r.items.length && <tr><td colSpan={7} className="cr-center">Không có dữ liệu dịch vụ.</td></tr>}
            </tbody>
        </table> : <table className="cr-table cr-topup-table"><thead><tr><th scope="col">Nội dung thu</th><th scope="col" className="cr-number">Số tiền</th></tr></thead><tbody><tr><td>Nạp tiền vào thẻ trả trước CareS · {receiptText(r.cardCode)}</td><td className="cr-number"><Amount value={r.due}/></td></tr></tbody></table>}
        <section className="cr-ending">
            <div className="cr-summary">
                <div className="cr-payment-notes"><Detail label="Bằng chữ">{amountInWords(r.paid)}.</Detail>
                    <Detail label="Phương thức">{r.method}</Detail>
                    {r.membershipCard && <Detail label="Thẻ CareS">{r.membershipCard}</Detail>}
                    {r.membershipCard && <Detail label="Ưu đãi CareS">{r.membershipBenefit > 0 ? `${receiptMoney(r.membershipBenefitPercent)}% · ${receiptMoney(r.membershipBenefit)} đồng` : 'Không áp dụng'}</Detail>}
                    {r.transactionCode && <Detail label="Mã giao dịch">{r.transactionCode}</Detail>}
                    <Detail label="Trạng thái">{r.kind === 'top-up' ? 'Đã thu tiền' : r.balance == null ? 'Theo dữ liệu hóa đơn' : r.balance <= 0 ? 'Đã thanh toán' : 'Còn phải thanh toán'}</Detail>
                    {r.note && <Detail label="Ghi chú">{r.note}</Detail>}
                </div>
                <dl className="cr-totals">{totals.map(([label, value, strong]) => <div key={label} className={strong ? 'cr-total-strong' : ''}><dt>{label}</dt><dd><Amount value={value}/> đ</dd></div>)}</dl>
            </div>
            <div className="cr-signature"><b>Người thu tiền</b><p>(Ký, ghi rõ họ tên)</p><div className="cr-signature-space"/>{r.cashier && r.cashier !== '—' && <p>{r.cashier}</p>}</div>
            <p className="cr-footer">Phiếu thu được lưu trữ điện tử tại {receiptText(clinic.clinicName)}. Không thay thế hóa đơn điện tử.</p>
        </section>
    </article>;
}

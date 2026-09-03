# Phiếu thu CareS A4

## Phạm vi

- Thu ngân: trang in hóa đơn đã thanh toán.
- Customer: chi tiết phiếu thu, bao gồm hồ sơ gia đình đã được backend kiểm tra quyền.
- Nạp thẻ: bản thu sau khi nạp thành công, không thay đổi thao tác xác nhận nạp.

Các trang dùng chung `src/components/receipts/ReceiptDocument.jsx` và stylesheet riêng.
Bản xem trước được cách ly khỏi CSS ứng dụng. Khi in, chỉ bản phiếu ở ngoài các layout
được hiển thị; không dùng absolute positioning cho nội dung nhiều trang.

## Kích thước và phân trang

- A4 dọc; lề trái/phải/trên 10 mm, dưới 13 mm.
- Nội dung 10 pt Arial, chiều cao dòng 12 pt; tiêu đề 16 pt.
- Bảng tự sang trang, lặp `thead`, tránh tách một dòng dịch vụ giữa hai trang.
- Tổng kết và chữ ký duy nhất được giữ cùng nhau ở cuối phiếu.
- Số dòng trên một trang phụ thuộc độ dài tên dịch vụ, địa chỉ, ghi chú và các khoản điều chỉnh;
  không có giới hạn cứng 20/30 dịch vụ và không giảm chữ để nhét một trang.
- Bản xem màn hình là giấy liên tục; hộp thoại in mới hiển thị phân trang thực tế.
- In ở tỷ lệ 100%, khổ A4, tắt đầu/chân trang tự động của trình duyệt.

## Nguồn số tiền

- BHYT lấy trực tiếp từ `bhytAmount` từng dòng; không suy ngược từ tỷ lệ đã làm tròn.
- `patientAmount` là số còn trả ở dòng dịch vụ; thuế/điều chỉnh cấp hóa đơn xuất hiện ở tổng kết.
- Ưu đãi không phải BHYT được ghi riêng, không gộp vào cột BHYT.
- Tổng phải trả và đã trả lấy từ hóa đơn/giao dịch đã lưu.
- Customer nhận thêm `printData` trong response hiện có. Các trường cũ vẫn giữ;
  `patientPayment` được sửa để không trừ BHYT lần hai khỏi `totalAmount` đã giảm.
- Phiếu nạp dùng số dư tại thời điểm giao dịch và tên nhân viên thực hiện giao dịch,
  không dùng tên người đang mở màn hình để thay thế người thu tiền.
- Nếu Customer kết nối backend cũ thiếu `printData`, hiển thị yêu cầu tải lại/cập nhật,
  không tạo phiếu bằng số BHYT ước tính.

## Kiểm tra đã thực hiện

- Phân tích cú pháp JSX/JS các file thay đổi.
- Dựng riêng component bằng dữ liệu giả, không khởi động backend hoặc gọi thanh toán.
- Xuất bản in bằng Chromium/Edge với CSS ứng dụng và dark mode:
  30 dòng ngắn = 1 trang, 45 dòng = 2 trang, 60 dòng có tên dài/ưu đãi = 3 trang,
  phiếu nạp = 1 trang. Đã kiểm tra hình ảnh mọi trang.
- Không có sidebar/header ứng dụng; chỉ một chữ ký; giữ số BHYT có phần thập phân.
- Chưa chạy build/test suite toàn dự án hoặc xác nhận giao dịch thật.

## Kiểm tra khi chạy ứng dụng

1. Khởi động lại backend để nhận dữ liệu phiếu mới; không tạo lại database/migration.
2. Mở một hóa đơn PAID ở Thu ngân; đối chiếu tiền trên chi tiết hóa đơn và phiếu.
3. Mở cùng phiếu ở Customer đúng bệnh nhân/người thân; đối chiếu từng dòng BHYT và tổng.
4. In bằng nút hoặc Ctrl+P, chọn A4/100%; kiểm tra preview không có thanh điều hướng.
5. Kiểm tra hóa đơn có ưu đãi thẻ, BHYT, thuế, tên dịch vụ dài và nhiều dịch vụ.
6. Sau một giao dịch nạp thử được phép, kiểm tra mã phiếu, số dư sau nạp và người thu.
7. Ở màn hình nhỏ, chỉ vùng bản giấy cuộn ngang, không ép bảng xuống chữ nhỏ.

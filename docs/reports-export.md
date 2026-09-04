# Phân trang, in và xuất báo cáo CareS

## Sử dụng

- Dịch vụ và phòng có đúng 10 dòng/trang, không chọn kích thước trang.
- Tìm mã/tên không phân biệt dấu, hoa thường và khoảng trắng đầu/cuối. Tìm kiếm chỉ lọc bảng chi tiết, không thay đổi tổng kết toàn kỳ.
- Đổi tìm kiếm/kỳ hoặc tải lại đưa về trang 1. Hai bảng có tìm kiếm riêng.
- In/Xuất CSV mở hộp chọn sáu loại: Tổng quan, Thanh toán theo thời gian, Phương thức thanh toán, Đối soát hóa đơn, Chi tiết dịch vụ, Hoạt động phòng.
- Mặc định theo tab: Tổng quan, Đối soát hóa đơn hoặc Hoạt động phòng. Xuất toàn bộ kết quả phù hợp, không chỉ trang hiện tại. Dịch vụ/phòng có thể bỏ tìm kiếm trong hộp chọn.
- Không xuất dữ liệu khi đang tải, lỗi hoặc không có dòng phù hợp. Số 0 trong báo cáo tổng hợp vẫn là số liệu hợp lệ.
- Hộp chọn và xem trước được căn giữa màn hình. Loại chưa có dữ liệu trong kỳ được ẩn: thanh toán cần giao dịch, dịch vụ/phòng cần danh sách, đối soát cần dòng dịch vụ hoặc giá trị hóa đơn. Tổng quan vẫn giữ số 0 hợp lệ. Nếu loại mặc định bị ẩn, chọn loại khả dụng đầu tiên; tìm kiếm không làm mất lựa chọn để vẫn có thể bỏ bộ lọc.

## Bản in và dữ liệu

Bản in được xem trước trong một tài liệu riêng, không mang CSS, sidebar hoặc phân trang của ứng dụng. Dịch vụ/phòng dùng A4 ngang; các loại khác A4 dọc. Tiêu đề bảng lặp khi sang trang. Muốn có số trang, bật tùy chọn của trình duyệt khi in.

CSV UTF-8 BOM có một bảng duy nhất. Mỗi dòng kèm kỳ, giờ xuất Việt Nam, bộ lọc và ghi chú phạm vi. Tiền là số thuần, điểm chưa có phản hồi để trống, văn bản được escape và chống công thức Excel. Tên file chứa loại và kỳ báo cáo.

Xem trước, in và CSV dùng cùng tập dữ liệu đầy đủ trước phân trang. Không sửa API, cách tính tổng, quyền hoặc dữ liệu nghiệp vụ. Tiền theo ngày thanh toán và đối soát hóa đơn theo ngày lập vẫn là hai phạm vi khác nhau; dòng dịch vụ chưa phân bổ CareS cấp hóa đơn.

## Kiểm tra

Chạy `node --test tests/reportExport.test.mjs`, lint các file trong `src/features/reports` và `src/pages/owner/ReportPage.jsx`, sau đó `npm run build`.

Kiểm tra trình duyệt với tài khoản Clinic Manager:

1. Bảng 11+ dòng: trang 1 có 10, trang 2 có phần còn lại; tìm không dấu, xóa tìm kiếm, đổi kỳ và tải lại đều về trang 1.
2. Ở trang 2, xuất dịch vụ/phòng và đối chiếu số dòng với tổng kết quả lọc; thử tùy chọn bỏ tìm kiếm.
3. Chọn đủ sáu loại, kiểm tra kỳ, bộ lọc, dữ liệu và ghi chú. Thử tìm kiếm không có kết quả; không cho tải file rỗng.
4. Kiểm tra X/Escape/bấm nền và focus trở lại nút mở hộp chọn.
5. Xem trước bản in nhiều trang: không mất hàng, không có sidebar; kiểm tra desktop, mobile, dark mode và hộp thoại in thực tế.
6. Mở CSV trong Excel, kiểm tra tiếng Việt, số âm, số tiền, dấu phẩy/dấu ngoặc kép và xuống dòng trong tên.

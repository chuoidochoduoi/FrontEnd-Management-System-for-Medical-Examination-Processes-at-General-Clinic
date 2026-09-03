# Quy ước frontend

## Component và state

- Page không chứa thêm logic nghiệp vụ mới nếu logic có thể nằm trong hook/feature.
- Component dùng lại từ hai feature trở lên mới chuyển vào `components`.
- Không dùng `localStorage` làm nguồn chính cho dữ liệu y tế hoặc trạng thái hàng chờ.
- Mọi thao tác ghi cần trạng thái loading, chống gửi lặp và hiển thị lỗi backend.

## CSS

- `index.css` nạp theo thứ tự: Tailwind, token/theme, base, layout, utilities và compatibility.
- Style chỉ dùng một màn ưu tiên CSS Module đặt cạnh page/feature.
- Style dùng chung phải có tên theo ngữ nghĩa CareS, tránh selector phụ thuộc sâu vào DOM.
- CSS in tách khỏi layout ứng dụng và dùng `@media print`.

## i18n và nội dung

- Chỉ sử dụng `src/locales`; không tạo thư mục locale ở root.
- Key theo domain và ý nghĩa, không theo vị trí tạm thời trên màn hình.
- Trạng thái nghiệp vụ phải dùng mapper chung; không rải chuỗi dịch trực tiếp theo enum ở nhiều page.

## Accessibility

- Modal có tiêu đề, mô tả, focus trap và đóng bằng Escape khi an toàn.
- Input luôn có label; lỗi validation liên kết với trường tương ứng.
- Không chỉ dùng màu để thể hiện trạng thái.

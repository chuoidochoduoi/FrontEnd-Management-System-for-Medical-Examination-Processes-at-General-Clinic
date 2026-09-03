# Quản lý tái khám

## Luồng hiện tại

1. Bác sĩ nhập dặn dò, ngày dự kiến và dịch vụ tái khám ngay trên màn khám bệnh.
2. Dữ liệu được lưu cùng bệnh án qua trường `followUp`.
3. Bác sĩ có thể tạo lịch tái khám trực tiếp khi hồ sơ và ngày hẹn hợp lệ.
4. Lễ tân theo dõi các yêu cầu chưa được đặt lịch tại trang **Quản lý tái khám** và tạo lịch cho bệnh nhân.
5. Lịch đã tạo tiếp tục đi qua luồng lịch hẹn và check-in thông thường.

## Giao diện đang sử dụng

- `src/pages/doctor/ExaminationPage.jsx`: nhập yêu cầu và tạo lịch tái khám.
- `src/pages/receptionist/FollowUpListPage.jsx`: danh sách yêu cầu và thao tác đặt lịch.
- `src/pages/receptionist/CheckInPage.jsx`: nhận diện lịch tái khám trong danh sách tiếp đón.
- `src/pages/customer/VisitDetailPage.jsx`: hiển thị dặn dò tái khám trong bệnh án.

Các component thử nghiệm `FollowUpSection` và `FollowUpAlert` đã được thay bằng giao diện tích hợp trực tiếp và không còn được sử dụng.

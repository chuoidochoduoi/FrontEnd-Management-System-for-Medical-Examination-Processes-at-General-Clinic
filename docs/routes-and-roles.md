# Route và vai trò

Nguồn thực thi nằm tại `src/constants/routes.js` và `src/App.jsx`.

| Nhóm route | Vai trò chính | Mục đích |
|---|---|---|
| `/`, `/about`, `/services`, `/doctors`, `/schedule` | Công khai | Website và danh mục công khai |
| `/guest/journey` | Công khai có xác minh | Tra cứu hành trình Guest |
| `/customer/**`, `/my-appointments/**` | CUSTOMER | Đặt lịch, hồ sơ, lịch sử, hành trình, thanh toán |
| `/receptionist/**` | RECEPTIONIST, một phần CLINIC_MANAGER | Tiếp nhận và điều phối |
| `/cashier/**` | CASHIER, CLINIC_MANAGER | Hóa đơn và thẻ CareS |
| `/doctor/**`, `/lab/**` | Nhân sự chuyên môn được cấp | Hàng chờ, khám và CLS |
| `/staff/**` | Nhân viên theo quyền cụ thể | Lịch cá nhân, hồ sơ, hành trình |
| `/admin/**` | ADMIN hoặc CLINIC_MANAGER tùy route | Cấu hình và danh mục |
| `/owner/**`, `/manager/**` | CLINIC_MANAGER hoặc ADMIN tùy route | Quản lý vận hành |
| `/display/**` | Nhân sự được cấp | Màn hình gọi bệnh nhân |

Frontend chỉ là lớp chặn sớm. Backend phải tiếp tục xác thực quyền với mọi endpoint.

# Tính năng Yêu cầu khám lại (Follow-up)

## Mô tả

Tính năng cho phép **bác sĩ** đánh dấu bệnh nhân cần khám lại sau khi hoàn thành khám.
Khi bác sĩ chọn checkbox "Yêu cầu khám lại" và nhập ghi chú, thông tin sẽ được:
1. Gửi kèm payload khi lưu nháp / hoàn thành khám
2. Hiển thị cảnh báo cho **lễ tân** ở trang Check-in để đặt lịch khám lại

## Luồng hoạt động

```
Bác sĩ khám bệnh
    → Tick "Yêu cầu khám lại"
    → Nhập lý do khám lại (ví dụ: "Tái khám sau 2 tuần...")
    → Chọn ngày khám đề xuất (tùy chọn)
    → Lưu nháp hoặc Hoàn thành

Hệ thống gửi followUp { note, preferredDate } trong payload API

Lễ tân mở trang Check-in
    → Thấy banner cảnh báo "CẦN KHÁM LẠI"
    → Xem ghi chú của bác sĩ
    → Click "Đặt lịch ngay" để tạo lịch khám lại
```

## Các file liên quan

### Doctor (Bác sĩ)
| File | Mô tả |
|------|-------|
| `src/components/doctor/FollowUpSection.jsx` | Component checkbox + form ghi chú |
| `src/pages/doctor/ExaminationPage.jsx` | Trang khám - tích hợp FollowUpSection |
| `src/locales/vi/doctor.json` | Bản dịch tiếng Việt |
| `src/locales/en/doctor.json` | Bản dịch tiếng Anh |

### Receptionist (Lễ tân)
| File | Mô tả |
|------|-------|
| `src/components/receptionist/FollowUpAlert.jsx` | Banner cảnh báo follow-up |
| `src/pages/receptionist/CheckInPage.jsx` | Trang check-in - hiển thị cảnh báo + cột ghi chú BS |
| `src/locales/vi/receptionist.json` | Thêm namespace `followUp` |

### Chung
| File | Mô tả |
|------|-------|
| `src/index.css` | CSS animation `animate-fadeIn` |
| `src/i18next.js` | Đăng ký namespace doctor cho tiếng Anh |

## API Payload

### Save Draft / Complete Exam
```json
{
  "followUp": {
    "note": "Tái khám sau 2 tuần, theo dõi huyết áp",
    "preferredDate": "2026-08-15"
  }
}
```

Nếu không yêu cầu khám lại, `followUp` sẽ là `null`.

## Mockup

Xem file `mockup-followup.html` để xem giao diện mẫu.

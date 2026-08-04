# Backend Requirements: PDF Printing Module
> **Scope**: Inpatient clinic workflow covering three printable document types — **xét nghiệm** (lab test results), **đơn thuốc** (prescription), and **khám lâm sàng** (clinical examination record).

---

## 1. Tổng quan luồng in

| Bước | Frontend | Backend API | Ghi chú |
|------|----------|-------------|---------|
| 1 | Bác sĩ hoàn thành khám (`ExaminationPage.completeExam`) | `POST /api/v1/queue-tickets/{ticketId}/complete` | Trả về `recordId` |
| 2 | Lưu `completionData` vào sessionStorage | — | `exam-completion:{recordId}` |
| 3 | Chuyển hướng → `ExamCompletionPage` | — | Trang chọn in |
| 4a | In hồ sơ bệnh án → `MedicalRecordPrintPage` | `GET /api/v1/medical-records/{recordId}` | In khám lâm sàng |
| 4b | In đơn thuốc → `PrescriptionPreviewPage` | `GET /api/v1/medical-records/{recordId}` | In đơn thuốc |
| 4c | In/xem xét nghiệm → `LabDetailPage` | `GET /api/v1/test-requests/{id}` | In kết quả xét nghiệm |

Hiện tại hệ thống dùng **client-side HTML → browser print-to-PDF**. Backend cung cấp dữ liệu qua REST API, frontend render HTML và gọi `window.print()`.

---

## 2. Yêu cầu dữ liệu (Data Models)

### 2.1 MedicalRecord (hồ sơ bệnh án)
**Endpoint**: `GET /api/v1/medical-records/{recordId}`

Trường cần có để in PDF **khám lâm sàng** (MedicalRecordPrintPage) và **đơn thuốc** (PrescriptionPreviewPage):

```
recordId              — string (PK)
visitId               — string (FK, liên kết lịch hẹn)
patient               — object
  .fullName           — string
  .gender             — enum: MALE | FEMALE | OTHER
  .dateOfBirth        — string (ISO date)
  .phone              — string
  .address            — string
vitalSigns            — object
  .heartRate          — integer (bpm)
  .bloodPressure      — string "120/80"
  .temperature        — decimal (°C)
  .height             — decimal (cm)
  .weight             — decimal (kg)
chiefComplaint        — string (lý do khám / triệu chứng)
clinicalFindings      — string (kết quả khám lâm sàng)
diagnosis             — string (chẩn đoán tổng quát, text)
icdSelections[]       — array<ICDSelection> (chẩn đoán ICD-10)
  .code               — string (ví dụ: "R53.83")
  .codeName           — string (tên chẩn đoán)
conclusion            — string (kết luận, hướng điều trị)
prescriptionNote      — string (lời dặn chung)
patientInstruction    — string (hướng dẫn bệnh nhân)
prescriptionItems[]   — array<PrescriptionItem> (đơn thuốc)
  .medicineName       — string
  .quantity           — integer
  .unit               — string (viên, gói, ống, ...)
  .note               — string (cách dùng)
  .frequencyPerDay    — integer (số lần/ngày)
doctorConfirmedByName — string (tên bác sĩ)
doctorName            — string (fallback)
completedAt           — string (ISO datetime)
version               — integer (optimistic locking)
```

### 2.2 TestRequest (xét nghiệm)
**Endpoint**: `GET /api/v1/test-requests/{testRequestId}`

```
testRequestId         — string (PK)
queueTicketId         — string
patientName           — string
patientCode           — string
gender                — enum
age                   — integer
serviceName           — string (tên dịch vụ xét nghiệm)
departmentId          — string
collectionDate        — string (ISO date)
specimenId            — string (mã mẫu vật)
status                — enum: PENDING | IN_PROGRESS | COMPLETED | CANCELLED
resultFileUrl         — string (URL file PDF kết quả)
conclusion            — string (kết luận bác sĩ)
createdAt             — string (ISO datetime)
```

**Endpoint phụ trợ**:
- `GET /api/v1/test-requests/{testRequestId}/result` — chi tiết kết quả (trả về `imageUrl`, `conclusion`, `sampleId`)
- `POST /api/v1/test-requests/{testRequestId}/upload` — upload file PDF kết quả (multipart/form-data, max 10MB, chỉ chấp nhận PDF)
- `POST /api/v1/test-requests/{testRequestId}/result/complete` — hoàn tất kết quả
- `POST /api/v1/test-requests/{testRequestId}/cancel` — hủy xét nghiệm (có cancelReason)

### 2.3 QueueTicket / Appointment (liên kết)
**Endpoint**: `POST /api/v1/queue-tickets/{ticketId}/complete` (payload trả về `recordId`)

Response sau khi hoàn thành khám:
```
recordId              — string
patientName           — string
serviceName           — string
departmentName        — string
completedAt           — string
waitingForTests       — boolean
```

---

## 3. Yêu cầu endpoint sinh PDF

### Tùy chọn A: Server-side PDF generation (đề xuất)
Backend sinh PDF từ dữ liệu bệnh án và trả về file PDF trực tiếp — chất lượng cao, không phụ thuộc trình duyệt.

```
GET /api/v1/medical-records/{recordId}/print
  Query params:
    ?type=clinical     — PDF khám lâm sàng (MedicalRecordPrintPage)
    ?type=prescription — PDF đơn thuốc (PrescriptionPreviewPage)
    ?type=lab          — PDF kết quả xét nghiệm (LabDetailPage)
  Response: application/pdf (inline) hoặc file download
  Headers: Content-Disposition: inline; filename="medical-record-{recordId}.pdf"
```

**Lợi ích**:
- PDF chuẩn, không bị lỗi font do trình duyệt
- Có thể thêm watermark, header/footer chuyên nghiệp
- Header `&lt;title&gt;` PDF có thể tùy chỉnh
- Không cần mở cửa sổ in mới

### Tùy chọn B: Client-side (hiện tại)
Backend chỉ cung cấp JSON, frontend render HTML + `window.print()`.
- **Ưu**: Nhanh, ít thay đổi backend
- **Nhược**: Phụ thuộc trình duyệtr, font có thể lỗi, không kiểm soát được page break

**Khuyến nghị**: Backend nên triển khai **Tùy chọn A** để có PDF chất lượng cao, đặc biệt cho:
- Hóa đơn/xuất PDF kết quả xét nghiệm tải lên (file upload) — cần CDN hoặc static file storage
- In đơn thuốc và hồ sơ bệnh án — nên sinh từ dữ liệu để đảm bảo format chuẩn

---

## 4. Yêu cầu bảo mật & quyền in

| Loại PDF | Vai trò được phép | Ghi chú |
|----------|-------------------|---------|
| Khám lâm sàng | DOCTOR, GENERAL_DOCTOR, SPECIALIST_DOCTOR | Chỉ bác sĩ/phụ trách mới in hồ sơ |
| Đơn thuốc | DOCTOR, GENERAL_DOCTOR, SPECIALIST_DOCTOR | Chỉ bác sĩ kê đơn mới in |
| Xét nghiệm | DOCTOR, NURSE, GENERAL_DOCTOR, SPECIALIST_DOCTOR, CLINIC_MANAGER | Cả y tá và bác sĩ đều được in kết quả |

**Lưu ý**: `ExamCompletionPage` và các trang in đều dùng `ProtectedRoute` với `allowedRoles` — backend phải trùng khớp.

---

## 5. Các endpoint hiện tại đã hoạt động

| Method | Endpoint | Mô tả | Trang dùng |
|--------|----------|-------|------------|
| GET | `/api/v1/medical-records/{recordId}` | Lấy hồ sơ bệnh án | MedicalRecordPrintPage, PrescriptionPreviewPage |
| GET | `/api/v1/test-requests/{id}` | Lấy chi tiết xét nghiệm | LabDetailPage |
| GET | `/api/v1/test-requests/{id}/result` | Lấy kết quả xét nghiệm chi tiết | LabDetailPage |
| POST | `/api/v1/test-requests/{id}/upload` | Upload file PDF kết quả | LabDetailPage |
| POST | `/api/v1/queue-tickets/{ticketId}/complete` | Hoàn thành khám, trả về recordId | ExaminationPage |
| GET | `/api/v1/medical-services/available?size=1000` | Danh sách dịch vụ | LabTestPage, AppointmentPage |

---

## 6. Các vấn đề cần lưu ý

### 6.1 Font và ký tự Unicode
PDF in khám lâm sàng và đơn thuốc chứa tiếng Việt (tiếng Việt có dấu). Nếu backend sinh PDF, cần font hỗ trợ Unicode (ví dụ: DejaVu Sans, Noto Sans).

### 6.2 File lưu trữ kết quả xét nghiệm
- File PDF kết quả xét nghiệm được upload qua `POST /api/v1/test-requests/{id}/upload`
- `resultFileUrl` trả về sau khi upload — cần là URL có thể truy cập trực tiếp (CDN hoặc static storage)
- `handlePrintPdf()` trong LabDetailPage fetch URL với Bearer token — backend cần hỗ trợ xác thực khi serve file PDF

### 6.3 Session storage fallback
`MedicalRecordPrintPage` và `PrescriptionPreviewPage` đọc dữ liệu từ:
1. `location.state.record` (nếu có)
2. `sessionStorage.getItem(‘exam-completion:{recordId}’)` (fallback)

Nếu backend sinh PDF, frontend có thể gọi trực tiếp `GET /api/v1/medical-records/{recordId}/print?type=clinical` mà không cần sessionStorage.

### 6.4 Responsive print CSS
Frontend các trang in (`*.print()` pages) dùng CSS `@media print` để:
- Ẩn nút in, back, header/footer
- Cài đặt `@page { size: A4; margin: Xmm; }`
- Định dạng `record-sheet` / `prescription-sheet` với kích thước cố định 210mm

Nếu chuyển sang server-side PDF, CSS này chuyển thành template backend.

---

*Compiled: 2026-08-04*

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuditLog } from "@/hooks/useAuditLog";

/* ── Pagination ── */
function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page) * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  const pages =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, i) => i)
      : page <= 2
        ? [0, 1, 2, "...", totalPages - 1]
        : page >= totalPages - 3
          ? [0, "...", totalPages - 3, totalPages - 2, totalPages - 1]
          : [0, "...", page - 1, page, page + 1, "...", totalPages - 1];

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 px-5 py-4">
      <p className="text-xs text-gray-500">
        Hiển thị {from}-{to} trên tổng số {total} bản ghi
      </p>
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={i} className="w-8 text-center text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 text-sm rounded transition-colors ${
                p === page
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p + 1}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

const ACTION_LABELS = {
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  LOGIN: "Đăng nhập",
  LOGOUT: "Đăng xuất",
  LOGIN_FAILED: "Đăng nhập thất bại",
  EXPORT: "Xuất dữ liệu",
  IMPORT: "Nhập dữ liệu",
  VIEW: "Xem dữ liệu",
  STATUS_CHANGE: "Đổi trạng thái",
  PAYMENT_CONFIRMED: "Xác nhận thanh toán",
  PATIENT_CALLED: "Gọi bệnh nhân",
  QUEUE_SKIPPED: "Đánh dấu vắng",
  EXAM_STARTED: "Bắt đầu phục vụ",
  DRAFT_SAVED: "Lưu nháp",
  RECORD_COMPLETED: "Hoàn thành hồ sơ",
  RESULT_UPLOADED: "Tải lên kết quả",
  RESULT_SIGNED: "Ký kết quả",
  COMPLETED_RECORD_EDITED: "Sửa hồ sơ đã hoàn thành"
};

const ACTION_COLORS = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-blue-100 text-blue-700",
  LOGOUT: "bg-gray-100 text-gray-700",
  LOGIN_FAILED: "bg-red-100 text-red-700",
  EXPORT: "bg-cyan-100 text-cyan-700",
  IMPORT: "bg-indigo-100 text-indigo-700",
  VIEW: "bg-slate-100 text-slate-700",
  STATUS_CHANGE: "bg-purple-100 text-purple-700",
  PAYMENT_CONFIRMED: "bg-emerald-100 text-emerald-700",
  PATIENT_CALLED: "bg-blue-100 text-blue-700",
  QUEUE_SKIPPED: "bg-orange-100 text-orange-700",
  EXAM_STARTED: "bg-cyan-100 text-cyan-700",
  DRAFT_SAVED: "bg-slate-100 text-slate-700",
  RECORD_COMPLETED: "bg-green-100 text-green-700",
  RESULT_UPLOADED: "bg-sky-100 text-sky-700",
  RESULT_SIGNED: "bg-violet-100 text-violet-700",
  COMPLETED_RECORD_EDITED: "bg-amber-100 text-amber-700"
};

const ENTITY_LABELS = {
  Account: "Tài khoản",
  StaffInfo: "Nhân sự",
  PatientProfile: "Bệnh nhân",
  Department: "Phòng/Khoa",
  ServiceItem: "Dịch vụ y tế",
  Appointment: "Lịch hẹn",
  System: "Hệ thống",
  Attendance: "Điểm danh",
  AuditLog: "Nhật ký hệ thống",
  Auth: "Xác thực tài khoản",
  Bhxh: "Bảo hiểm xã hội",
  Insurance: "Bảo hiểm y tế",
  Chat: "Hỗ trợ trực tuyến",
  ClinicalFormTemplate: "Mẫu phiếu lâm sàng",
  ClinicalFormTemplateBinding: "Cấu hình mẫu phiếu",
  ClinicInformation: "Thông tin phòng khám",
  ClinicSchedule: "Lịch hoạt động phòng khám",
  ClinicScheduleException: "Lịch hoạt động ngoại lệ",
  ContactRequest: "Yêu cầu liên hệ",
  CustomerVisit: "Lượt khám",
  DoctorExamination: "Khám bệnh",
  Icd10Code: "Danh mục ICD-10",
  Invoice: "Hóa đơn",
  Transaction: "Giao dịch thanh toán",
  MedicalRecord: "Hồ sơ khám",
  PatientAllergy: "Dị ứng bệnh nhân",
  Profile: "Hồ sơ cá nhân",
  VitalSigns: "Chỉ số sinh hiệu",
  MedicalService: "Dịch vụ y tế",
  MedicineCatalog: "Danh mục thuốc",
  Notification: "Thông báo",
  PatientJourney: "Hành trình bệnh nhân",
  PayOSWebhook: "Thanh toán trực tuyến",
  PublicAnnouncement: "Thông báo công khai",
  QueueTicket: "Hàng chờ",
  QueueTicketSkip: "Bệnh nhân vắng",
  Report: "Báo cáo",
  ServiceCapability: "Danh mục kỹ thuật",
  ServiceCategory: "Nhóm dịch vụ",
  ShiftConfig: "Cấu hình ca",
  ShiftVersion: "Phiên bản ca",
  Specialization: "Chuyên khoa",
  Staff: "Nhân sự",
  StaffSchedule: "Lịch trực nhân sự",
  ScheduleTemplate: "Mẫu lịch trực",
  StaffScheduleTemplate: "Mẫu lịch trực nhân sự",
  TestRequest: "Yêu cầu cận lâm sàng",
  TestRequestCancel: "Hủy yêu cầu cận lâm sàng",
  TestResult: "Kết quả cận lâm sàng",
  TestResultAttachment: "Tệp kết quả cận lâm sàng",
  TestResultFile: "Tệp kết quả cận lâm sàng",
  TestResultRevision: "Đính chính kết quả"
};

const LEGACY_DESCRIPTIONS = {
  "Hủy yêu cầu liên hệ": "Ghi nhận không thể liên hệ khách hàng",
  "Tao lich tai kham": "Tạo lịch tái khám",
  "Phuc hoi buoc hang cho bi ket": "Khôi phục bước hàng chờ bị kẹt",
  "Hoan thanh thao tac tai phong can lam sang": "Hoàn thành thao tác tại phòng cận lâm sàng",
  "Dua benh nhan vang quay lai hang cho": "Đưa bệnh nhân vắng quay lại hàng chờ"
};

const ROUTE_DESCRIPTIONS = {
  "/api/auth/login": "Đăng nhập vào hệ thống",
  "/api/auth/register": "Đăng ký tài khoản bệnh nhân",
  "/api/auth/send-otp": "Gửi mã xác thực OTP",
  "/api/auth/send-register-otp": "Gửi mã OTP đăng ký",
  "/api/auth/verify-register-otp": "Xác thực mã OTP đăng ký",
  "/api/auth/reset-password": "Đặt lại mật khẩu",
  "/api/auth/refresh": "Làm mới phiên đăng nhập",
  "/api/auth/me/password": "Đổi mật khẩu tài khoản"
};

const getTechnicalRoute = (description) => {
  const match = description?.trim().match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\/api\/[^\s?]+)(?:\?\S*)?$/i);
  return match ? { method: match[1].toUpperCase(), path: match[2] } : null;
};

const getDisplayAction = (log) => {
  const route = getTechnicalRoute(log.description);
  if (route?.path === "/api/auth/login") return "LOGIN";
  return log.action;
};

const translateDescription = (log) => {
  const desc = log.description?.trim();
  if (!desc) return log.newValueJson ? "Cập nhật dữ liệu nghiệp vụ" : "Không có chi tiết";

  if (LEGACY_DESCRIPTIONS[desc]) return LEGACY_DESCRIPTIONS[desc];

  const route = getTechnicalRoute(desc);
  if (route) {
    if (ROUTE_DESCRIPTIONS[route.path]) return ROUTE_DESCRIPTIONS[route.path];
    const action = ACTION_LABELS[getDisplayAction(log)] || "Thao tác";
    const entity = ENTITY_LABELS[log.entityName] || "phân hệ hệ thống";
    return `${action} trong ${entity}`;
  }

  if (desc.startsWith("Auto Log: ")) {
      const match = desc.match(/Auto Log:\s+(\w+)\s+on\s+(\w+)/);
      if (match) {
          const action = ACTION_LABELS[match[1]] || "Thao tác";
          const entity = ENTITY_LABELS[match[2]] || "phân hệ hệ thống";
          return `${action} dữ liệu ${entity}`;
      }
  }
  return desc;
};

export default function AuditLogManagementPage() {
  const { logs, total, page, loading, error, fetchLogs, PAGE_SIZE } = useAuditLog();
  
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = () => {
    fetchLogs({
      action: actionFilter || undefined,
      entityName: entityFilter || undefined,
      from: dateFrom ? `${dateFrom}T00:00:00` : undefined,
      to: dateTo ? `${dateTo}T23:59:59.999999` : undefined,
      page: 0
    });
  };

  const handlePageChange = (newPage) => {
    fetchLogs({
      action: actionFilter || undefined,
      entityName: entityFilter || undefined,
      from: dateFrom ? `${dateFrom}T00:00:00` : undefined,
      to: dateTo ? `${dateTo}T23:59:59.999999` : undefined,
      page: newPage
    });
  };

  const thCls = "text-xs font-medium text-gray-400 text-left py-3 px-4";
  const tdCls = "text-sm text-gray-700 py-4 px-4";

  return (
    <AdminLayout>
      <div className="px-6 py-6 lg:px-8 xl:px-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Nhật ký hệ thống
          </h1>
          <p className="text-xs text-gray-400">
            Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 border-b border-gray-100 px-5 py-4 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(200px,1.1fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_72px]">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg outline-none bg-white"
            >
              <option value="">-- Tất cả hành động --</option>
              {Object.keys(ACTION_LABELS).map(k => (
                <option key={k} value={k}>{ACTION_LABELS[k]}</option>
              ))}
            </select>
            
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg outline-none bg-white"
            >
              <option value="">-- Tất cả phân hệ --</option>
              {Object.entries(ENTITY_LABELS)
                .sort(([, labelA], [, labelB]) => labelA.localeCompare(labelB, "vi"))
                .map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
            </select>
            
            <label className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-gray-500">Từ:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 min-w-0 flex-1 px-3 text-sm border border-gray-200 rounded-lg outline-none"
              />
            </label>
            
            <label className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-gray-500">Đến:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 min-w-0 flex-1 px-3 text-sm border border-gray-200 rounded-lg outline-none"
              />
            </label>

            <button
              onClick={handleSearch}
              className="h-10 w-full rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Lọc
            </button>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-gray-100">
              <tr>
                <th className={thCls}>Thời gian</th>
                <th className={thCls}>Người thực hiện</th>
                <th className={thCls}>Hành động</th>
                <th className={thCls}>Phân hệ</th>
                <th className={thCls}>Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-gray-400">
                    Đang tải...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-gray-400">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
              {!loading && !error && logs.map((log) => {
                const displayAction = getDisplayAction(log);
                const description = translateDescription(log);
                return (
                <tr key={log.auditId} className="hover:bg-gray-50 transition-colors">
                  <td className={tdCls + " text-gray-500 text-xs whitespace-nowrap"}>
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className={tdCls}>
                    <p className="font-semibold text-gray-900">{log.actorName || log.actorAccountId || "Hệ thống"}</p>
                  </td>
                  <td className={tdCls}>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[displayAction] || "bg-gray-100 text-gray-700"}`}>
                      {ACTION_LABELS[displayAction] || "Thao tác khác"}
                    </span>
                  </td>
                  <td className={tdCls + " text-gray-600 font-medium"}>
                    {ENTITY_LABELS[log.entityName] || "Phân hệ khác"}
                  </td>
                  <td className={tdCls + " text-gray-500 text-xs max-w-xs truncate"} title={description}>
                    {description}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          </div>

          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={handlePageChange}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

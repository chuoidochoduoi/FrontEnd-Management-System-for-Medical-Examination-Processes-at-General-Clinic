// src/pages/admin/AccountManagementPage.jsx
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, Eye, EyeOff } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useStaffList, usePatientList } from "@/hooks/useAccountManagement";
import { useSpecializations } from "@/hooks/useSpecializations";

const PAGE_SIZE = 10;

/* ── Pagination ── */
function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // API uses 0-based, UI uses 1-based
  const apiPage = page - 1; // Convert to 0-based for display logic
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : page <= 3
        ? [1, 2, 3, "...", totalPages]
        : page >= totalPages - 2
          ? [1, "...", totalPages - 2, totalPages - 1, totalPages]
          : [1, "...", page - 1, page, page + 1, "...", totalPages];

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        Hiển thị {from}-{to} trên tổng số {total} bệnh nhân
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
              {p}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

/* ── Password cell with show/hide ── */
function PasswordCell() {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm tracking-widest text-gray-400">
        {"•".repeat(8)}
      </span>
      <button
        onClick={() => setShow((v) => !v)}
        className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
      >
        {show ? "Ẩn" : "Hiện"}
      </button>
    </div>
  );
}

/* ── Modal: Thêm nhân sự ── */
function AddStaffModal({ onClose, onSubmit, t }) {
  const { specializations } = useSpecializations();
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    phone: "",
    email: "",
    gender: "",
    address: "",
    departmentId: "",
    systemRole: "",
    specializationId: "",
    highestDegree: "",
    university: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef(null);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full border-0 border-b border-gray-200 outline-none text-sm text-gray-800 py-1.5 focus:border-gray-600 bg-transparent transition-colors";
  const labelCls = "block text-xs text-gray-400 mb-1";

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {t("accountManagement.addStaffModal.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-7 py-6 space-y-7">
          {/* Section 1 - Account Info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-4">
              {t("accountManagement.addStaffModal.section1")}
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {[
                {
                  key: "username",
                  label: t(
                    "accountManagement.addStaffModal.fields.loginAccount",
                  ),
                },
                {
                  key: "password",
                  label: t("accountManagement.addStaffModal.fields.password"),
                  type: "password",
                },
                {
                  key: "systemRole",
                  label: t(
                    "accountManagement.addStaffModal.fields.systemTitle",
                  ),
                  type: "select",
                },
              ].map(({ key, label, type = "text" }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  {type === "select" ? (
                    <select
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      className={inputCls}
                    >
                      <option value="">-- Chọn vai trò --</option>
                      <option value="NURSE">Y tá</option>
                      <option value="GENERAL_DOCTOR">Bác sĩ đa khoa</option>
                      <option value="SPECIALIST_DOCTOR">Bác sĩ chuyên khoa</option>
                      <option value="RECEPTIONIST">Lễ tân</option>
                      <option value="CASHIER">Thu ngân</option>
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      className={inputCls}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section - Specialization (only for specialist doctors) */}
          {form.systemRole === "SPECIALIST_DOCTOR" && (
            <div>
              <label className={labelCls}>Chuyên khoa</label>
              <select
                value={form.specializationId}
                onChange={(e) => set("specializationId", e.target.value)}
                className={inputCls}
              >
                <option value="">-- Chọn chuyên khoa --</option>
                {specializations.map((s) => (
                  <option key={s.specializationId} value={s.specializationId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Section 2 - Personal Info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-4">
              {t("accountManagement.addStaffModal.section2")}
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {[
                {
                  key: "fullName",
                  label: t("accountManagement.addStaffModal.fields.fullName"),
                },
                {
                  key: "phone",
                  label: t("accountManagement.addStaffModal.fields.phone"),
                },
                {
                  key: "email",
                  label: t("accountManagement.addStaffModal.fields.email"),
                },
                {
                  key: "gender",
                  label: t("accountManagement.addStaffModal.fields.gender"),
                  type: "select",
                },
              ].map(({ key, label, type = "text" }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  {type === "select" ? (
                    <select
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      className={inputCls}
                    >
                      <option value="">-- Chọn --</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                    </select>
                  ) : (
                    <input
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      className={inputCls}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 - Address */}
          <div>
            <label className={labelCls}>
              {t("accountManagement.addStaffModal.fields.address")}
            </label>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Section 4 - Education */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-4">
              {t("accountManagement.addStaffModal.section3")}
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {[
                { key: "highestDegree", label: "Học vị" },
                { key: "university", label: "Trường đào tạo" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 5 - Department */}
          <div>
            <label className={labelCls}>
              {t("accountManagement.addStaffModal.fields.department")}
            </label>
            <input
              placeholder="Nhập ID phòng ban"
              value={form.departmentId}
              onChange={(e) => set("departmentId", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs px-7 pb-3">{error}</p>}

        {/* Footer */}
        <div className="flex justify-end gap-3 px-7 py-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 h-9 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {t("accountManagement.addStaffModal.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 h-9 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {submitting
              ? t("accountManagement.addStaffModal.submitting")
              : t("accountManagement.addStaffModal.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal: Cập nhật bệnh nhân ── */
function UpdatePatientModal({ patient, onClose, onSubmit, t }) {
  const [phone, setPhone] = useState(patient?.loginAccount ?? "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(patient.id, {
        loginAccount: phone,
        newPassword: password || undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full border-0 border-b border-gray-200 outline-none text-sm text-gray-800 py-1.5 focus:border-gray-600 bg-transparent";
  const labelCls =
    "block text-xs font-semibold text-gray-500 tracking-wide mb-1.5";

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xs font-bold text-gray-900 tracking-widest">
              {t("accountManagement.updatePatientModal.title")}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {t("accountManagement.updatePatientModal.patientCode")}:{" "}
              {patient?.patientCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-7 py-6">
          <p className="text-xs font-bold text-gray-800 tracking-widest mb-5">
            ■ {t("accountManagement.updatePatientModal.section1")}
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className={labelCls}>
                {t("accountManagement.updatePatientModal.fields.loginAccount")}
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                {t("accountManagement.updatePatientModal.fields.newPassword")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t(
                  "accountManagement.updatePatientModal.fields.newPasswordPlaceholder",
                )}
                className={inputCls + " placeholder:text-gray-300"}
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-7 py-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 h-9 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            {t("accountManagement.updatePatientModal.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 h-9 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {submitting
              ? t("accountManagement.updatePatientModal.submitting")
              : t("accountManagement.updatePatientModal.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function AccountManagementPage() {
  const { t } = useTranslation("admin");
  const staffHook = useStaffList();
  const patientHook = usePatientList();

  const [activeTab, setActiveTab] = useState("staff");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientStatus, setPatientStatus] = useState("");

  useEffect(() => {
    staffHook.fetchStaff();
    patientHook.fetchPatients();
  }, []);

  const handleStaffSearch = (v) => {
    setStaffSearch(v);
    staffHook.fetchStaff({ search: v });
  };
  const handlePatientSearch = (v) => {
    setPatientSearch(v);
    patientHook.fetchPatients({ search: v, status: patientStatus });
  };
  const handlePatientStatus = (v) => {
    setPatientStatus(v);
    patientHook.fetchPatients({ search: patientSearch, status: v });
  };

  const thCls = "text-xs font-medium text-gray-400 text-left py-3 px-4";
  const tdCls = "text-sm text-gray-700 py-4 px-4";

  return (
    <AdminLayout>
      <div className="px-10 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-lg font-semibold text-gray-900">
            {t("accountManagement.pageTitle")}
          </h1>
          <p className="text-xs text-gray-400">
            {t("accountManagement.lastUpdated")}{" "}
            {new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>

        {/* Tabs + Add button */}
        <div className="flex items-end justify-between border-b border-gray-200 mb-6">
          <div className="flex gap-0">
            {[
              {
                key: "staff",
                label: t("accountManagement.tabs.staff"),
                count: staffHook.total,
              },
              {
                key: "patients",
                label: t("accountManagement.tabs.patients"),
                count: patientHook.total,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${activeTab === tab.key ? "text-gray-500" : "text-gray-300"}`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          {activeTab === "staff" && (
            <button
              onClick={() => setShowAddStaff(true)}
              className="mb-3 px-4 h-9 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {t("accountManagement.addStaffBtn")}
            </button>
          )}
        </div>

        {/* ── Staff tab ── */}
        {activeTab === "staff" && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                />
                <input
                  value={staffSearch}
                  onChange={(e) => handleStaffSearch(e.target.value)}
                  placeholder={t("accountManagement.staff.searchPlaceholder")}
                  className="w-full h-10 pl-9 pr-4 text-sm outline-none bg-transparent placeholder:text-gray-300"
                />
              </div>
            </div>

            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  {[
                    t("accountManagement.staff.table.code"),
                    t("accountManagement.staff.table.nameAndDept"),
                    t("accountManagement.staff.table.loginAccount"),
                    t("accountManagement.staff.table.password"),
                    t("accountManagement.staff.table.role"),
                    t("accountManagement.staff.table.actions"),
                  ].map((col) => (
                    <th key={col} className={thCls}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffHook.loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-sm text-gray-400"
                    >
                      Đang tải...
                    </td>
                  </tr>
                )}
                {staffHook.error && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-sm text-red-500"
                    >
                      {staffHook.error}
                    </td>
                  </tr>
                )}
                {!staffHook.loading &&
                  !staffHook.error &&
                  Array.isArray(staffHook.staff) &&
                  staffHook.staff.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-sm text-gray-400"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                {!staffHook.loading &&
                  !staffHook.error &&
                  Array.isArray(staffHook.staff) &&
                  staffHook.staff.map((s) => (
                    <tr
                      key={s.accountId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className={tdCls + " text-gray-400"}>{s.code}</td>
                      <td className={tdCls}>
                        <p className="font-semibold text-gray-900">
                          {s.fullNameOrDepartment}
                        </p>
                      </td>
                      <td className={tdCls}>{s.username}</td>
                      <td className={tdCls}>
                        <PasswordCell />
                      </td>
                      <td className={tdCls + " text-gray-400"}>{s.role}</td>
                      <td className={tdCls}>
                        <div className="flex flex-col gap-0.5">
                          <button className="text-sm font-semibold text-gray-800 hover:text-primary-500 text-left transition-colors">
                            {t("accountManagement.staff.actions.edit")}
                          </button>
                          <button
                            onClick={() => staffHook.lockStaff(s.accountId)}
                            className="text-sm text-gray-400 hover:text-red-500 text-left transition-colors"
                          >
                            {s.isActive
                              ? t("accountManagement.staff.actions.lock")
                              : t("accountManagement.staff.actions.unlock")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <Pagination
              page={staffHook.page + 1}
              total={staffHook.total}
              pageSize={PAGE_SIZE}
              onChange={(p) =>
                staffHook.fetchStaff({ search: staffSearch, page: p - 1 })
              }
            />
          </div>
        )}

        {/* ── Patients tab ── */}
        {activeTab === "patients" && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {/* Search + filter */}
            <div className="px-4 py-3 border-b border-gray-100 flex gap-3">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                />
                <input
                  value={patientSearch}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  placeholder={t(
                    "accountManagement.patients.searchPlaceholder",
                  )}
                  className="w-full h-10 pl-9 pr-4 text-sm outline-none bg-transparent placeholder:text-gray-300"
                />
              </div>
              <select
                value={patientStatus}
                onChange={(e) => handlePatientStatus(e.target.value)}
                className="h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none bg-white"
              >
                <option value="">
                  {t("accountManagement.patients.statusFilter")}
                </option>
                <option value="active">Đang hoạt động</option>
                <option value="locked">Đã khóa</option>
              </select>
            </div>

            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  {[
                    t("accountManagement.patients.table.code"),
                    t("accountManagement.patients.table.nameAndAddress"),
                    t("accountManagement.patients.table.loginAccount"),
                    t("accountManagement.patients.table.password"),
                    t("accountManagement.patients.table.personalInfo"),
                    t("accountManagement.patients.table.actions"),
                  ].map((col) => (
                    <th key={col} className={thCls}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patientHook.loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-sm text-gray-400"
                    >
                      Đang tải...
                    </td>
                  </tr>
                )}
                {patientHook.error && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-sm text-red-500"
                    >
                      {patientHook.error}
                    </td>
                  </tr>
                )}
                {!patientHook.loading &&
                  !patientHook.error &&
                  Array.isArray(patientHook.patients) &&
                  patientHook.patients.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-sm text-gray-400"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                {!patientHook.loading &&
                  !patientHook.error &&
                  Array.isArray(patientHook.patients) &&
                  patientHook.patients.map((p) => (
                    <tr
                      key={p.accountId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className={tdCls + " text-gray-400 font-mono text-xs"}
                      >
                        {p.code}
                      </td>
                      <td className={tdCls}>
                        <p className="font-semibold text-gray-900">
                          {p.fullNameOrDepartment}
                        </p>
                      </td>
                      <td className={tdCls}>{p.username}</td>
                      <td className={tdCls}>
                        <PasswordCell />
                      </td>
                      <td className={tdCls + " text-gray-400"}>{p.role}</td>
                      <td className={tdCls}>
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => setEditPatient(p)}
                            className="text-sm font-semibold text-gray-800 hover:text-primary-500 text-left transition-colors"
                          >
                            {t("accountManagement.patients.actions.lock")}
                          </button>
                          <button
                            onClick={() => patientHook.lockPatient(p.accountId)}
                            className="text-sm text-gray-400 hover:text-red-500 text-left transition-colors"
                          >
                            {p.isActive
                              ? t("accountManagement.patients.actions.lock")
                              : t("accountManagement.patients.actions.unlock")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <Pagination
              page={patientHook.page + 1}
              total={patientHook.total}
              pageSize={PAGE_SIZE}
              onChange={(p) =>
                patientHook.fetchPatients({
                  search: patientSearch,
                  status: patientStatus,
                  page: p - 1,
                })
              }
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddStaff && (
        <AddStaffModal
          t={t}
          onClose={() => setShowAddStaff(false)}
          onSubmit={async (payload) => {
            await staffHook.addStaff(payload);
            staffHook.fetchStaff();
          }}
        />
      )}
      {editPatient && (
        <UpdatePatientModal
          t={t}
          patient={editPatient}
          onClose={() => setEditPatient(null)}
          onSubmit={async (id, payload) => {
            await patientHook.updatePatient(id, payload);
            patientHook.fetchPatients();
          }}
        />
      )}
    </AdminLayout>
  );
}

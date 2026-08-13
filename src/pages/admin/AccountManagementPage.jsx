// src/pages/admin/AccountManagementPage.jsx
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { toast } from "react-toastify";
import AdminLayout from "@/components/layout/AdminLayout";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useStaffList, usePatientList } from "@/hooks/useAccountManagement";
import { useSpecializations } from "@/hooks/useSpecializations";
import { useCapabilities } from "@/hooks/useCapabilities";

const PAGE_SIZE = 7;

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
              {p}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

const systemRoleMap = {
  ADMIN: "Quản trị viên",
  CLINIC_MANAGER: "Quản lý phòng khám",
  NURSE: "Y tá",
  DOCTOR: "Bác sĩ",
  GENERAL_DOCTOR: "Bác sĩ",
  SPECIALIST_DOCTOR: "Bác sĩ",
  RECEPTIONIST: "Lễ tân",
  CASHIER: "Thu ngân",
};

const capitalizeWords = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
};

const DateDropdowns = ({ value, onChange, className }) => {
  const initial = /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-') : ['', '', ''];
  const [year, setYear] = useState(initial[0] || '');
  const [month, setMonth] = useState(initial[1] ? String(parseInt(initial[1], 10)) : '');
  const [day, setDay] = useState(initial[2] ? String(parseInt(initial[2], 10)) : '');

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return;
    const [nextYear, nextMonth, nextDay] = value.split('-');
    setYear(nextYear); setMonth(String(parseInt(nextMonth, 10))); setDay(String(parseInt(nextDay, 10)));
  }, [value]);

  const handleUpdate = (y, m, d) => {
      const py = y || '';
      const pm = m ? m.padStart(2, '0') : '';
      const pd = d ? d.padStart(2, '0') : '';
      setYear(py); setMonth(m || ''); setDay(d || '');
      onChange(py && pm && pd ? `${py}-${pm}-${pd}` : '');
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  let daysInMonth = 31;
  if (month) {
      const m = parseInt(month, 10);
      const y = year ? parseInt(year, 10) : currentYear;
      daysInMonth = new Date(y, m, 0).getDate();
  }
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
      <div className="flex gap-2 w-full">
          <select value={day} onChange={e => handleUpdate(year, month, e.target.value)} className={className}>
              <option value="">Ngày</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={month} onChange={e => handleUpdate(year, e.target.value, day)} className={className}>
              <option value="">Tháng</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={year} onChange={e => handleUpdate(e.target.value, month, day)} className={className}>
              <option value="">Năm</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
      </div>
  );
};

const isValidPastDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1
    && date.getDate() === day && date < new Date();
};

/* ── Modal: Thêm nhân sự ── */
function AddStaffModal({ onClose, onSubmit, t }) {
  const { specializations } = useSpecializations();
  const { capabilities } = useCapabilities();
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    phone: "",
    email: "",
    gender: "",
    address: "",
    systemRole: "",
    specializationId: "",
    dateOfBirth: "",
    highestDegree: "",
    university: "",
    licenseNumber: "",
    nationalId: "",
    capabilityIds: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef(null);
  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError("");
  }, [error]);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.username || !form.password || !form.systemRole || !form.fullName || !form.phone || !form.gender || !form.dateOfBirth) {
      setError("Vui lòng nhập đầy đủ các trường bắt buộc (Tên đăng nhập, Mật khẩu, Vai trò, Họ tên, SĐT, Giới tính, Ngày sinh).");
      return;
    }
    if (/\d/.test(form.fullName)) return setError('Họ tên không được chứa chữ số.');
    if (!/^[a-zA-Z0-9._-]{4,50}$/.test(form.username)) return setError('Tên đăng nhập phải có 4-50 ký tự và không chứa khoảng trắng.');
    if (form.password.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    if (!/^(\+84|0)\d{9,10}$/.test(form.phone)) return setError('Số điện thoại Việt Nam không hợp lệ.');
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Email là bắt buộc và phải đúng định dạng.');
    if (!isValidPastDate(form.dateOfBirth)) return setError('Vui lòng chọn đầy đủ ngày, tháng, năm sinh hợp lệ trong quá khứ.');
    const isDoctor = form.systemRole === "DOCTOR";
    if (isDoctor && !form.specializationId) return setError('Vui lòng chọn chuyên khoa phục vụ của bác sĩ.');
    setSubmitting(true);
    setError("");
    try {
      const created = await onSubmit({
        ...form,
        highestDegree: form.highestDegree?.trim() || null,
        university: form.university?.trim() || null,
        licenseNumber: form.licenseNumber?.trim() || null,
        nationalId: form.nationalId?.trim() || null,
      });
      const createdStaffId = created?.staffId || created?.data?.staffId;
      if (form.systemRole === "DOCTOR" && createdStaffId) {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${createdStaffId}/capabilities`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify((form.capabilityIds || []).map(capabilityId => ({ capabilityId }))),
        });
        if (!response.ok) throw new Error("Tạo nhân sự thành công nhưng không thể cấp danh mục kỹ thuật");
      }
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
                      <option value="ADMIN">Quản trị viên</option>
                      <option value="CLINIC_MANAGER">Quản lý phòng khám</option>
                      <option value="NURSE">Y tá</option>
                      <option value="DOCTOR">Bác sĩ</option>
                      <option value="RECEPTIONIST">Lễ tân</option>
                      <option value="CASHIER">Thu ngân</option>
                    </select>
                  ) : type === "date" ? (
                    <DateDropdowns
                      value={form[key]}
                      onChange={(val) => set(key, val)}
                      className={inputCls + " px-2"}
                    />
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

          {/* Chuyên khoa phục vụ xác định phạm vi khám của bác sĩ. */}
          {form.systemRole === "DOCTOR" && (
            <div className="space-y-4">
              <label className={labelCls}>Chuyên khoa phục vụ *</label>
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
              <p className="text-xs text-gray-400 mt-1">Chọn “Khám tổng quát” cho bác sĩ đa khoa hoặc chuyên khoa cụ thể mà bác sĩ phụ trách.</p>
              <div><label className={labelCls}>Kỹ thuật được cấp phép (không bắt buộc)</label><div className="grid grid-cols-2 gap-2 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">{capabilities.map(capability => <label key={capability.capabilityId} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.capabilityIds.includes(capability.capabilityId)} onChange={event => set("capabilityIds", event.target.checked ? [...form.capabilityIds, capability.capabilityId] : form.capabilityIds.filter(id => id !== capability.capabilityId))}/>{capability.name}</label>)}</div></div>
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
                { key: "email", label: t("accountManagement.addStaffModal.fields.email") },
                { key: "dateOfBirth", label: "Ngày sinh", type: "date" },
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
                  ) : type === "date" ? (
                    <DateDropdowns
                      value={form[key]}
                      onChange={(val) => set(key, val)}
                      className={inputCls + " px-2"}
                    />
                  ) : (
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) => set(key, key === 'fullName' ? e.target.value.replace(/\d/g, '') : e.target.value)}
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
              {t("accountManagement.addStaffModal.section3")} (không bắt buộc)
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {[
                { key: "highestDegree", label: "Học vị (không bắt buộc)" },
                { key: "university", label: "Trường đào tạo (không bắt buộc)" },
                { key: "licenseNumber", label: "Số giấy phép hành nghề (không bắt buộc)" },
                { key: "nationalId", label: "CCCD/CMND (không bắt buộc)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className={inputCls}
                    required={false}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

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

/* ── Modal: Cập nhật nhân sự ── */
function UpdateStaffModal({ account, onClose, onSubmit, staffHook, t }) {
  const { specializations } = useSpecializations();
  const { capabilities } = useCapabilities();
  const [form, setForm] = useState(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef(null);
  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError("");
  }, [error]);

  useEffect(() => {
    staffHook.fetchStaffByAccountId(account.accountId)
      .then(res => {
        setForm({
          staffId: res.staffId,
          username: res.profile?.username || "",
          fullName: res.profile?.fullName || "",
          phone: res.profile?.phone || "",
          email: res.profile?.email || "",
          dateOfBirth: res.profile?.dateOfBirth || "",
          gender: res.profile?.gender || "",
          address: res.profile?.address || "",
          systemRole: res.systemRole || "",
          specializationId: res.specialization?.specializationId || "",
          highestDegree: res.highestDegree || "",
          university: res.university || "",
          licenseNumber: res.licenseNumber || "",
          nationalId: res.nationalId || "",
          capabilityIds: [],
        });
        if (res.systemRole === "DOCTOR") {
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${res.staffId}/capabilities`, { headers: { Authorization: `Bearer ${token}` } })
            .then(response => response.ok ? response.json() : [])
            .then(values => setForm(previous => ({ ...previous, capabilityIds: values.map(value => value.capabilityId) })));
        }
      })
  .catch(err => setError(err.message));
  }, [account.accountId]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.systemRole || !form.fullName || !form.phone || !form.gender || !form.dateOfBirth) {
      setError("Vui lòng nhập đầy đủ các trường bắt buộc (Vai trò, Họ tên, SĐT, Giới tính, Ngày sinh).");
      return;
    }
    if (/\d/.test(form.fullName)) return setError('Họ tên không được chứa chữ số.');
    if (!/^(\+84|0)\d{9,10}$/.test(form.phone)) return setError('Số điện thoại Việt Nam không hợp lệ.');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Email không hợp lệ.');
    if (password && password.length < 6) return setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
    if (!isValidPastDate(form.dateOfBirth)) return setError('Vui lòng chọn đầy đủ ngày, tháng, năm sinh hợp lệ trong quá khứ.');
    const isDoctor = form.systemRole === "DOCTOR";
    if (isDoctor && !form.specializationId) return setError('Vui lòng chọn chuyên khoa phục vụ của bác sĩ.');
    setSubmitting(true);
    setError("");
    try {
      if (password) {
        await staffHook.resetPassword(account.accountId, password);
      }
      await staffHook.updateStaffFull(form.staffId, {
        ...form,
        highestDegree: form.highestDegree?.trim() || null,
        university: form.university?.trim() || null,
        licenseNumber: form.licenseNumber?.trim() || null,
        nationalId: form.nationalId?.trim() || null,
      });
      if (form.systemRole === "DOCTOR") {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const capabilityResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/staff/${form.staffId}/capabilities`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify((form.capabilityIds || []).map(capabilityId => ({ capabilityId }))),
        });
        if (!capabilityResponse.ok) throw new Error("Cập nhật năng lực bác sĩ thất bại");
      }
      toast.success('Cập nhật nhân sự thành công!');
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

  if (!form) {
    return (
      <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-2xl p-8 shadow-xl">Đang tải thông tin...</div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xs font-bold text-gray-900 tracking-widest">
              Cập nhật nhân sự
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-8">
          {/* Section 1 - Account */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-4">
              ■ {t("accountManagement.addStaffModal.section1")}
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <label className={labelCls}>Tài khoản đăng nhập (Không thể sửa)</label>
                <input
                  value={form.username}
                  disabled
                  className={inputCls + " cursor-not-allowed opacity-70"}
                />
              </div>
              <div>
                <label className={labelCls}>Mật khẩu mới (bỏ trống nếu không đổi)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className={inputCls + " placeholder:text-gray-300"}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Vai trò hệ thống</label>
                <select
                  value={form.systemRole}
                  onChange={(e) => set("systemRole", e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Chọn vai trò --</option>
                  <option value="ADMIN">Quản trị viên</option>
                  <option value="CLINIC_MANAGER">Quản lý phòng khám</option>
                  <option value="NURSE">Y tá</option>
                  <option value="DOCTOR">Bác sĩ</option>
                  <option value="RECEPTIONIST">Lễ tân</option>
                  <option value="CASHIER">Thu ngân</option>
                </select>
              </div>
            </div>
          </div>

          {form.systemRole === "DOCTOR" && (
            <div>
              <label className={labelCls}>Chuyên khoa phục vụ *</label>
              <select value={form.specializationId} onChange={(e) => set("specializationId", e.target.value)} className={inputCls}>
                <option value="">-- Chọn chuyên khoa --</option>
                {specializations.map((s) => <option key={s.specializationId} value={s.specializationId}>{s.name}</option>)}
              </select>
              <div>
                <label className={labelCls}>Kỹ thuật được cấp phép (không bắt buộc)</label>
                <div className="grid grid-cols-2 gap-2 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {capabilities.map(capability => <label key={capability.capabilityId} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={(form.capabilityIds || []).includes(capability.capabilityId)} onChange={event => set("capabilityIds", event.target.checked ? [...(form.capabilityIds || []), capability.capabilityId] : (form.capabilityIds || []).filter(id => id !== capability.capabilityId))}/>
                    {capability.name}
                  </label>)}
                </div>
                <p className="text-xs text-gray-400 mt-1">Thông tin chứng chỉ, ngày cấp, hết hạn và đơn vị cấp có thể để trống.</p>
              </div>
            </div>
          )}

          {/* Section 2 - Personal Info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-4">
              ■ {t("accountManagement.addStaffModal.section2")}
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {[
                { key: "fullName", label: t("accountManagement.addStaffModal.fields.fullName") },
                { key: "phone", label: t("accountManagement.addStaffModal.fields.phone") },
                { key: "email", label: t("accountManagement.addStaffModal.fields.email") },
                { key: "dateOfBirth", label: "Ngày sinh", type: "date" },
                { key: "gender", label: t("accountManagement.addStaffModal.fields.gender"), type: "select" },
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
                  ) : type === "date" ? (
                    <DateDropdowns
                      value={form[key]}
                      onChange={(val) => set(key, val)}
                      className={inputCls + " px-2"}
                    />
                  ) : (
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) => set(key, key === 'fullName' ? e.target.value.replace(/\d/g, '') : e.target.value)}
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
              ■ {t("accountManagement.addStaffModal.section3")} (không bắt buộc)
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {[
                { key: "highestDegree", label: "Học vị (không bắt buộc)" },
                { key: "university", label: "Trường đào tạo (không bắt buộc)" },
                { key: "licenseNumber", label: "Số giấy phép hành nghề (không bắt buộc)" },
                { key: "nationalId", label: "CCCD/CMND (không bắt buộc)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className={inputCls}
                    required={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-7 py-5 border-t border-gray-100 flex-shrink-0">
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
            {submitting ? "Đang xử lý..." : "Cập nhật"}
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
  const [editAccount, setEditAccount] = useState(null);
  
  const [confirmLock, setConfirmLock] = useState(null);
  const [isLocking, setIsLocking] = useState(false);

  const handleConfirmLock = async () => {
      if (!confirmLock) return;
      setIsLocking(true);
      try {
          if (confirmLock.type === 'staff') {
              await staffHook.lockStaff(confirmLock.id);
          } else {
              await patientHook.lockPatient(confirmLock.id);
          }
          toast.success(confirmLock.isActive ? 'Khóa tài khoản thành công!' : 'Mở khóa tài khoản thành công!');
      } catch (err) {
          toast.error('Thao tác thất bại!');
      } finally {
          setIsLocking(false);
          setConfirmLock(null);
      }
  };

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

            <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-gray-100">
                <tr>
                  {[
                    "Mã nhân sự",
                    "Họ và tên",
                    "Tên đăng nhập",
                    "Vai trò",
                    "Trạng thái",
                    "Thao tác",
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
                      <td className={tdCls + " text-gray-400"}>
                        {s.systemRole ? systemRoleMap[s.systemRole] || s.systemRole : s.role}
                      </td>
                      <td className={tdCls}>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {s.isActive ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </td>
                      <td className={tdCls}>
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => setEditAccount({ ...s, type: 'staff' })}
                            className="text-sm font-semibold text-gray-800 hover:text-primary-500 text-left transition-colors"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => setConfirmLock({ id: s.accountId, type: 'staff', isActive: s.isActive })}
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
            </div>

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

            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-gray-100">
                <tr>
                  {[
                    "Mã tài khoản",
                    "Khách hàng",
                    "Tên đăng nhập",
                    "Trạng thái",
                    "Thao tác",
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
                      colSpan={5}
                      className="text-center py-12 text-sm text-gray-400"
                    >
                      Đang tải...
                    </td>
                  </tr>
                )}
                {patientHook.error && (
                  <tr>
                    <td
                      colSpan={5}
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
                        colSpan={5}
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {p.isActive ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </td>
                      <td className={tdCls}>
                        <div className="flex items-center">
                          <button
                            onClick={() => setConfirmLock({ id: p.accountId, type: 'patient', isActive: p.isActive })}
                            className="text-sm text-gray-400 hover:text-red-500 text-left transition-colors"
                          >
                            {p.isActive ? "Khóa" : "Mở khóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>

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
            const created = await staffHook.addStaff(payload);
            toast.success('Thêm nhân sự thành công!');
            staffHook.fetchStaff();
            return created;
          }}
        />
      )}
      {editAccount?.type === 'staff' && (
        <UpdateStaffModal
          t={t}
          account={editAccount}
          staffHook={staffHook}
          onClose={() => setEditAccount(null)}
        />
      )}
      
      <ConfirmModal 
          isOpen={!!confirmLock}
          onClose={() => !isLocking && setConfirmLock(null)}
          onConfirm={handleConfirmLock}
          title={confirmLock?.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
          message={confirmLock?.isActive 
            ? "Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập vào hệ thống." 
            : "Bạn có chắc chắn muốn mở khóa tài khoản này? Người dùng sẽ có thể đăng nhập lại."}
          confirmText={confirmLock?.isActive ? "Khóa" : "Mở khóa"}
          isDanger={confirmLock?.isActive}
          isLoading={isLocking}
      />
    </AdminLayout>
  );
}

// src/pages/owner/ManagerStaffPage.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Shield } from "lucide-react";
import OwnerLayout from "@/components/layout/OwnerLayout";
import { useStaffList } from "@/hooks/useAccountManagement";

const PAGE_SIZE = 10;

/* ── Pagination ── */
function Pagination({ page, total, pageSize, onChange, t }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
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

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        {t("staffList.pagination", { from, to, total })}
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
          )
        )}
      </div>
    </div>
  );
}

/* ── Password cell (always hidden) ── */
function PasswordCell() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm tracking-widest text-gray-400">
        {"•".repeat(8)}
      </span>
    </div>
  );
}

export default function ManagerStaffPage() {
  const { t } = useTranslation(["operations", "admin"]);
  const staffHook = useStaffList();
  const [staffSearch, setStaffSearch] = useState("");

  useEffect(() => {
    staffHook.fetchStaff();
  }, []);

  const handleStaffSearch = (v) => {
    setStaffSearch(v);
    staffHook.fetchStaff({ search: v });
  };

  const thCls = "text-xs font-medium text-gray-400 text-left py-3 px-4";
  const tdCls = "text-sm text-gray-700 py-4 px-4";

  return (
    <OwnerLayout>
      <div className="px-10 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {t("staffList.title", { ns: "operations" })}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {t("staffList.subtitle", { ns: "operations" })}
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <Shield size={11} />
            {t("staffList.readOnly", { ns: "operations" })}
          </span>
        </div>

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
                placeholder={t("accountManagement.staff.searchPlaceholder", { ns: "admin" })}
                className="w-full h-10 pl-9 pr-4 text-sm outline-none bg-transparent placeholder:text-gray-300"
              />
            </div>
          </div>

          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                {[
                  t("accountManagement.staff.table.code", { ns: "admin" }),
                  t("accountManagement.staff.table.nameAndDept", { ns: "admin" }),
                  t("accountManagement.staff.table.loginAccount", { ns: "admin" }),
                  t("accountManagement.staff.table.password", { ns: "admin" }),
                  t("accountManagement.staff.table.role", { ns: "admin" }),
                  t("staffList.status", { ns: "operations" }),
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
                  <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                    {t("staffList.loading", { ns: "operations" })}
                  </td>
                </tr>
              )}
              {staffHook.error && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-red-500">
                    {staffHook.error}
                  </td>
                </tr>
              )}
              {!staffHook.loading && !staffHook.error && Array.isArray(staffHook.staff) && staffHook.staff.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                    {t("staffList.empty", { ns: "operations" })}
                  </td>
                </tr>
              )}
              {!staffHook.loading && !staffHook.error && Array.isArray(staffHook.staff) && staffHook.staff.map((s) => (
                <tr key={s.accountId} className="hover:bg-gray-50 transition-colors">
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
                  <td className={tdCls + " text-gray-400"}>
                    {s.systemRole ? t(`staffList.roles.${s.systemRole}`, { ns: "operations", defaultValue: s.systemRole }) : s.role}
                  </td>
                  <td className={tdCls}>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t(s.isActive ? "staffList.active" : "staffList.locked", { ns: "operations" })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            page={staffHook.page + 1}
            total={staffHook.total}
            pageSize={PAGE_SIZE}
            onChange={(p) => staffHook.fetchStaff({ search: staffSearch, page: p - 1 })}
            t={(key, values) => t(key, { ns: "operations", ...values })}
          />
        </div>
      </div>
    </OwnerLayout>
  );
}

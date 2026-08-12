import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuditLog } from "@/hooks/useAuditLog";

const PAGE_SIZE = 7;

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
  STATUS_CHANGE: "Đổi trạng thái"
};

const ACTION_COLORS = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-blue-100 text-blue-700",
  LOGOUT: "bg-gray-100 text-gray-700",
  STATUS_CHANGE: "bg-purple-100 text-purple-700"
};

const ENTITY_LABELS = {
  Account: "Tài khoản",
  StaffInfo: "Nhân sự",
  PatientProfile: "Bệnh nhân",
  Department: "Phòng/Khoa",
  ServiceItem: "Dịch vụ",
  Appointment: "Lịch hẹn",
  System: "Hệ thống"
};

const translateDescription = (desc) => {
  if (!desc) return null;
  if (desc.startsWith("Auto Log: ")) {
      const match = desc.match(/Auto Log:\s+(\w+)\s+on\s+(\w+)/);
      if (match) {
          const action = ACTION_LABELS[match[1]] || match[1];
          const entity = ENTITY_LABELS[match[2]] || match[2];
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
      from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      to: dateTo ? new Date(dateTo).toISOString() : undefined,
      page: 0
    });
  };

  const handlePageChange = (newPage) => {
    fetchLogs({
      action: actionFilter || undefined,
      entityName: entityFilter || undefined,
      from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      to: dateTo ? new Date(dateTo).toISOString() : undefined,
      page: newPage
    });
  };

  const thCls = "text-xs font-medium text-gray-400 text-left py-3 px-4";
  const tdCls = "text-sm text-gray-700 py-4 px-4";

  return (
    <AdminLayout>
      <div className="px-10 py-8">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-lg font-semibold text-gray-900">
            Nhật ký hệ thống
          </h1>
          <p className="text-xs text-gray-400">
            Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {/* Filters */}
          <div className="px-4 py-4 border-b border-gray-100 flex flex-wrap gap-3">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none bg-white"
            >
              <option value="">-- Tất cả hành động --</option>
              {Object.keys(ACTION_LABELS).map(k => (
                <option key={k} value={k}>{ACTION_LABELS[k]}</option>
              ))}
            </select>
            
            <input
              type="text"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              placeholder="Màn thực hiện (VD: Account, Department)"
              className="h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none"
            />
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Từ:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Đến:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none"
              />
            </div>

            <button
              onClick={handleSearch}
              className="px-5 h-10 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Lọc
            </button>
          </div>

          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className={thCls}>Thời gian</th>
                <th className={thCls}>Người thực hiện</th>
                <th className={thCls}>Hành động</th>
                <th className={thCls}>Màn thực hiện</th>
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
              {!loading && !error && logs.map((log) => (
                <tr key={log.auditId} className="hover:bg-gray-50 transition-colors">
                  <td className={tdCls + " text-gray-500 text-xs whitespace-nowrap"}>
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className={tdCls}>
                    <p className="font-semibold text-gray-900">{log.actorName || log.actorAccountId || "Hệ thống"}</p>
                  </td>
                  <td className={tdCls}>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className={tdCls + " text-gray-600 font-medium"}>
                    {ENTITY_LABELS[log.entityName] || log.entityName}
                  </td>
                  <td className={tdCls + " text-gray-500 text-xs max-w-xs truncate"} title={translateDescription(log.description) || log.newValueJson}>
                    {translateDescription(log.description) || (log.newValueJson ? "Cập nhật dữ liệu" : "Không có chi tiết")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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

import React, { useState, useMemo } from "react";
import {
  X,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  Heart,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Filter,
  TrendingUp,
} from "lucide-react";

// ==================== BK REPORT MODAL ====================
// 🧠 Modal khusus untuk preview laporan Guru BK
// Supports: Konseling, Kasus Siswa, Monitoring Perilaku, Bimbingan

const BKReportModal = ({
  isOpen,
  onClose,
  reportData = {},
  reportType,
  onDownload,
  loading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const itemsPerPage = 50;

  // ✅ Destructure report data safely
  const {
    preview = [],
    fullData = [],
    headers = [],
    summary = [],
    reportTitle = "LAPORAN BIMBINGAN KONSELING",
    total = 0,
  } = reportData;

  // ✅ Use preview if fullData is empty (backward compatibility)
  const dataToUse = fullData.length > 0 ? fullData : preview;

  // ✅ Header key mapping
  const headerKeyMap = {
    NIS: ["nis", "student_nis"],
    "Nama Siswa": ["name", "student_name", "full_name"],
    "Nama Lengkap": ["full_name", "name"],
    Kelas: ["class_id", "class"],
    Tingkat: "grade",
    Tanggal: ["date", "counseling_date", "created_at"],
    "Jenis Konseling": ["counseling_type", "type"],
    "Jenis Kasus": ["case_type", "type"],
    Kategori: ["category", "case_category"],
    Prioritas: ["priority", "priority_level"],
    Status: ["status", "case_status"],
    "Status Kasus": ["case_status", "status"],
    Permasalahan: ["problem", "issue", "description"],
    "Tindak Lanjut": ["follow_up", "action_taken"],
    Catatan: ["notes", "remarks"],
    "Konselor BK": ["counselor", "bk_teacher"],
    "Hasil Konseling": ["result", "counseling_result"],
    Progres: ["progress", "progress_status"],
  };

  // ✅ Get report icon based on type
  const getReportIcon = () => {
    switch (reportType) {
      case "bk-counseling":
        return Heart;
      case "bk-cases":
        return AlertTriangle;
      case "bk-monitoring":
        return Users;
      case "bk-recap":
        return CheckCircle;
      default:
        return Heart;
    }
  };

  const ReportIcon = getReportIcon();

  // ✅ Get report color theme
  const getThemeColor = () => {
    switch (reportType) {
      case "bk-counseling":
        return "teal";
      case "bk-cases":
        return "red";
      case "bk-monitoring":
        return "yellow";
      case "bk-recap":
        return "green";
      default:
        return "cyan";
    }
  };

  const themeColor = getThemeColor();

  // ✅ Color classes mapping
  const colorClasses = {
    teal: {
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-600",
      button: "bg-teal-600 hover:bg-teal-700",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-600",
      button: "bg-red-600 hover:bg-red-700",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-600",
      button: "bg-green-600 hover:bg-green-700",
    },
    cyan: {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      text: "text-cyan-600",
      button: "bg-cyan-600 hover:bg-cyan-700",
    },
  };

  const colors = colorClasses[themeColor];

  // ✅ Extract unique values for filtering
  const uniquePriorities = useMemo(() => {
    const priorities = new Set();
    fullData.forEach((row) => {
      if (row.Prioritas) priorities.add(row.Prioritas);
      if (row.priority) priorities.add(row.priority);
      if (row.priority_level) priorities.add(row.priority_level);
    });
    return Array.from(priorities).sort();
  }, [fullData]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    fullData.forEach((row) => {
      if (row.Status) statuses.add(row.Status);
      if (row.status) statuses.add(row.status);
      if (row.case_status) statuses.add(row.case_status);
    });
    return Array.from(statuses).sort();
  }, [fullData]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set();
    fullData.forEach((row) => {
      if (row.Kelas) classes.add(row.Kelas);
      if (row.class_id) classes.add(row.class_id);
    });
    return Array.from(classes).sort();
  }, [fullData]);

  // ✅ Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = fullData;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      );
    }

    // Priority filter
    if (filterPriority) {
      filtered = filtered.filter(
        (row) =>
          row.Prioritas === filterPriority ||
          row.priority === filterPriority ||
          row.priority_level === filterPriority
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(
        (row) =>
          row.Status === filterStatus ||
          row.status === filterStatus ||
          row.case_status === filterStatus
      );
    }

    // Class filter
    if (filterClass) {
      filtered = filtered.filter(
        (row) => row.Kelas === filterClass || row.class_id === filterClass
      );
    }

    return filtered;
  }, [fullData, searchQuery, filterPriority, filterStatus, filterClass]);

  // ✅ Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // ✅ Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPriority, filterStatus, filterClass]);

  // ✅ Render cell with conditional formatting
  const renderCell = (header, value) => {
    // Priority colors
    if (header === "Prioritas" || header === "priority" || header === "priority_level") {
      const priorityColors = {
        Tinggi: "bg-red-100 text-red-800",
        High: "bg-red-100 text-red-800",
        Sedang: "bg-yellow-100 text-yellow-800",
        Medium: "bg-yellow-100 text-yellow-800",
        Rendah: "bg-green-100 text-green-800",
        Low: "bg-green-100 text-green-800",
      };
      const colorClass = priorityColors[value] || "bg-gray-100 text-gray-800";
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {value}
        </span>
      );
    }

    // Status colors
    if (header === "Status" || header === "status" || header === "case_status") {
      const statusColors = {
        Selesai: "bg-green-100 text-green-800",
        Completed: "bg-green-100 text-green-800",
        "Dalam Proses": "bg-blue-100 text-blue-800",
        "In Progress": "bg-blue-100 text-blue-800",
        Proses: "bg-blue-100 text-blue-800",
        Pending: "bg-yellow-100 text-yellow-800",
        Menunggu: "bg-yellow-100 text-yellow-800",
        Ditunda: "bg-orange-100 text-orange-800",
        Batal: "bg-red-100 text-red-800",
        Cancelled: "bg-red-100 text-red-800",
      };
      const colorClass = statusColors[value] || "bg-gray-100 text-gray-800";
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {value}
        </span>
      );
    }

    // Progress colors
    if (header === "Progres" || header === "progress") {
      const progressColors = {
        Baik: "bg-green-100 text-green-800",
        Good: "bg-green-100 text-green-800",
        Cukup: "bg-yellow-100 text-yellow-800",
        Fair: "bg-yellow-100 text-yellow-800",
        Kurang: "bg-red-100 text-red-800",
        Poor: "bg-red-100 text-red-800",
      };
      const colorClass = progressColors[value] || "bg-gray-100 text-gray-800";
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {value}
        </span>
      );
    }

    // Category/Type highlighting
    if (header === "Jenis Konseling" || header === "Jenis Kasus" || header === "Kategori") {
      return (
        <span className="font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded">
          {value}
        </span>
      );
    }

    // Class highlighting
    if (header === "Kelas" || header === "class_id") {
      return (
        <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
          {value}
        </span>
      );
    }

    // Truncate long text
    if (
      (header === "Permasalahan" ||
        header === "Catatan" ||
        header === "Tindak Lanjut") &&
      typeof value === "string" &&
      value.length > 50
    ) {
      return (
        <span className="text-xs" title={value}>
          {value.substring(0, 50)}...
        </span>
      );
    }

    return value !== undefined && value !== null ? value : "-";
  };

  // ✅ Calculate filtered summary
  const filteredSummary = useMemo(() => {
    if (filteredData.length > 0) {
      const priorityCount = {
        Tinggi: 0,
        Sedang: 0,
        Rendah: 0,
      };

      const statusCount = {
        Selesai: 0,
        Proses: 0,
        Pending: 0,
      };

      filteredData.forEach((row) => {
        const priority = row.Prioritas || row.priority || row.priority_level;
        const status = row.Status || row.status || row.case_status;

        if (priority === "Tinggi" || priority === "High") priorityCount.Tinggi++;
        else if (priority === "Sedang" || priority === "Medium") priorityCount.Sedang++;
        else if (priority === "Rendah" || priority === "Low") priorityCount.Rendah++;

        if (status === "Selesai" || status === "Completed") statusCount.Selesai++;
        else if (status === "Proses" || status === "In Progress" || status === "Dalam Proses")
          statusCount.Proses++;
        else if (status === "Pending" || status === "Menunggu") statusCount.Pending++;
      });

      return [
        { label: "Total Kasus", value: filteredData.length },
        { label: "Prioritas Tinggi", value: priorityCount.Tinggi },
        { label: "Dalam Proses", value: statusCount.Proses },
        { label: "Selesai", value: statusCount.Selesai },
      ];
    }

    return summary;
  }, [filteredData, summary]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* ===== HEADER ===== */}
        <div className={`${colors.bg} border-b-2 ${colors.border} p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 ${colors.bg} border-2 ${colors.border} rounded-xl flex items-center justify-center`}>
                <ReportIcon className={`w-7 h-7 ${colors.text}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {reportTitle}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Preview Data BK • {filteredData.length} dari {total} record
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ===== SUMMARY CARDS ===== */}
        {filteredSummary && filteredSummary.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredSummary.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-lg font-bold text-slate-800">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SEARCH & FILTER BAR ===== */}
        <div className="px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama siswa, NIS, kasus, atau catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Priority Filter */}
            {uniquePriorities.length > 0 && (
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-[150px]">
                <option value="">Semua Prioritas</option>
                {uniquePriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            {uniqueStatuses.length > 0 && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-[150px]">
                <option value="">Semua Status</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            )}

            {/* Class Filter */}
            {uniqueClasses.length > 0 && (
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-[130px]">
                <option value="">Semua Kelas</option>
                {uniqueClasses.map((kelas) => (
                  <option key={kelas} value={kelas}>
                    Kelas {kelas}
                  </option>
                ))}
              </select>
            )}

            {(searchQuery || filterPriority || filterStatus || filterClass) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterPriority("");
                  setFilterStatus("");
                  setFilterClass("");
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium whitespace-nowrap">
                Reset Filter
              </button>
            )}
          </div>

          {/* Active Filters Info */}
          {(filterPriority || filterStatus || filterClass) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Filter aktif:</span>
              {filterPriority && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  Prioritas: {filterPriority}
                </span>
              )}
              {filterStatus && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  Status: {filterStatus}
                </span>
              )}
              {filterClass && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                  Kelas {filterClass}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ===== TABLE CONTENT ===== */}
        <div className="flex-1 overflow-auto p-6">
          {currentData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                      No
                    </th>
                    {headers.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {currentData.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600 border-r border-slate-200 font-medium">
                        {startIndex + rowIdx + 1}
                      </td>
                      {headers.map((header, colIdx) => (
                        <td
                          key={colIdx}
                          className="px-4 py-3 text-sm text-slate-700 border-r border-slate-200">
                          {renderCell(header, row[header])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg font-medium">
                Tidak ada data yang sesuai
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Coba ubah filter atau kata kunci pencarian
              </p>
            </div>
          )}
        </div>

        {/* ===== PAGINATION ===== */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Menampilkan {startIndex + 1} -{" "}
                {Math.min(endIndex, filteredData.length)} dari{" "}
                {filteredData.length} data
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? `${colors.button} text-white`
                            : "border border-slate-300 hover:bg-slate-100"
                        }`}>
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== FOOTER ACTIONS ===== */}
        <div className="px-6 py-4 bg-slate-50 border-t-2 border-slate-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              <span className="font-medium">💡 Tips:</span> Filter berdasarkan prioritas untuk menangani kasus mendesak
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors">
                Tutup
              </button>
              <button
                onClick={() => onDownload(reportType, "xlsx")}
                disabled={loading}
                className={`${colors.button} text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2`}>
                <FileSpreadsheet className="w-4 h-4" />
                {loading ? "Exporting..." : "Export ke Excel"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BKReportModal;
import React, { useState, useMemo } from "react";
import {
  X,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  Shield,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Filter,
} from "lucide-react";

// ==================== ADMIN REPORT MODAL ====================
// 💡 Modal khusus untuk preview laporan Admin
// ✅ FIXED: Masalah Alpa kosong

const AdminReportModal = ({
  isOpen,
  onClose,
  reportData = {},
  reportType,
  onDownload,
  loading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const itemsPerPage = 50;

  // ✅ Destructure report data safely dengan fallback yang lebih robust
  const {
    preview = [],
    fullData = [],
    headers = [],
    summary = [],
    reportTitle = "LAPORAN ADMINISTRATOR",
    total = 0,
  } = reportData;

  // ✅ DEBUG: Log data untuk troubleshooting
  React.useEffect(() => {
    if (isOpen && reportType === "admin-attendance") {
      console.log("🔍 ATTENDANCE DATA DEBUG:");
      console.log("Full Data Sample:", fullData.slice(0, 2));
      console.log("Headers:", headers);

      // Debug khusus untuk kolom Alpa
      if (fullData.length > 0) {
        const firstRow = fullData[0];
        console.log("📊 First Row Data:", firstRow);
        console.log("🔍 Mencari kolom Alpa/Absen:");
        Object.keys(firstRow).forEach((key) => {
          if (
            key.toLowerCase().includes("alp") ||
            key.toLowerCase().includes("abs")
          ) {
            console.log(`📍 Key "${key}":`, firstRow[key]);
          }
        });
      }
    }
  }, [isOpen, reportData, headers, preview, fullData, reportType]);

  // ✅ Use preview if fullData is empty (backward compatibility)
  const dataToUse = fullData.length > 0 ? fullData : preview;

  // ✅ FIXED: Header key mapping dengan priority untuk attendance
  const headerKeyMap = {
    // ===== ATTENDANCE PRIORITY MAPPING =====
    Alpa: ["alpa", "alpha", "absen", "absent", "missing", "bolos"],
    Hadir: ["hadir", "present", "attended", "masuk", "h"],
    Sakit: ["sakit", "sick", "ill", "s"],
    Izin: ["izin", "permission", "excused", "i", "permit"],
    Total: ["total", "count", "total_attendance", "jumlah"],
    Persentase: ["percentage", "persentase", "percent", "rate"],

    // ===== USERS TABLE MAPPING =====
    "Kode Guru": ["teacher_id", "kode_guru", "teacher_code", "code"],
    Username: ["username"],
    "Nama Lengkap": ["full_name", "nama_lengkap", "name"],
    "Nama Siswa": [
      "full_name",
      "student_name",
      "nama_siswa",
      "nama_lengkap",
      "name",
    ],
    Role: ["role", "user_role"],
    "Wali Kelas": [
      "homeroom_class_id",
      "wali_kelas",
      "class_teacher",
      "class_id",
    ],
    Status: ["is_active", "status", "active"],
    "Tanggal Bergabung": [
      "created_at",
      "tanggal_bergabung",
      "join_date",
      "registration_date",
    ],

    // ===== STUDENTS DATA =====
    No: ["no", "index", "number"],
    NIS: ["nis", "student_nis", "nisn"],
    NISN: ["nisn", "nis"],
    Kelas: ["class_id", "kelas", "class", "homeroom_class_id"],

    // ===== ACADEMIC DATA =====
    "Tahun Ajaran": ["academic_year", "tahun_ajaran", "year"],
    Semester: ["semester"],
    "Mata Pelajaran": ["subject", "mata_pelajaran", "pelajaran"],
    "Nilai Akhir": [
      "nilai_akhir",
      "final_score",
      "score",
      "nilai",
      "grade_score",
    ],
    Guru: ["teacher_name", "guru", "full_name", "nama_guru", "username"],

    // ===== SYSTEM =====
    Email: ["email"],
    Telepon: ["no_hp", "phone", "telepon"],
    "Jenis Kelamin": ["gender", "jenis_kelamin"],
  };

  // ✅ IMPROVED: Function khusus untuk handle Alpa dan attendance data
  const getCellValue = (row, header) => {
    if (!row || !header) return "-";

    // SPECIAL HANDLING FOR ATTENDANCE DATA
    if (header === "Alpa") {
      // Priority search untuk kolom Alpa
      const alpaKeys = ["alpa", "alpha", "absen", "absent", "missing", "bolos"];

      for (const key of alpaKeys) {
        if (
          row[key] !== undefined &&
          row[key] !== null &&
          row[key] !== "" &&
          row[key] !== "-"
        ) {
          console.log(`✅ Found Alpa data in key "${key}":`, row[key]);
          return row[key];
        }
      }

      // Fallback: calculate from other attendance data jika available
      if (row.hadir !== undefined && row.total !== undefined) {
        const hadir = parseInt(row.hadir) || 0;
        const sakit = parseInt(row.sakit) || 0;
        const izin = parseInt(row.izin) || 0;
        const total = parseInt(row.total) || 0;

        const calculatedAlpa = total - hadir - sakit - izin;
        if (calculatedAlpa >= 0) {
          console.log(
            `🧮 Calculated Alpa: ${calculatedAlpa} (Total: ${total} - Hadir: ${hadir} - Sakit: ${sakit} - Izin: ${izin})`
          );
          return calculatedAlpa;
        }
      }

      console.log("❌ No Alpa data found in row:", row);
      return "0"; // Default ke 0 jika tidak ada data
    }

    // Handle other attendance columns
    if (
      header === "Hadir" ||
      header === "Sakit" ||
      header === "Izin" ||
      header === "Total"
    ) {
      const possibleKeys = headerKeyMap[header];
      if (possibleKeys) {
        for (const key of possibleKeys) {
          if (
            row[key] !== undefined &&
            row[key] !== null &&
            row[key] !== "" &&
            row[key] !== "-"
          ) {
            return row[key];
          }
        }
      }
    }

    // SPECIAL HANDLING FOR OTHER FIELDS
    if (header === "Kode Guru") {
      if (
        row.teacher_id !== undefined &&
        row.teacher_id !== null &&
        row.teacher_id !== ""
      ) {
        return row.teacher_id;
      }
      return "-";
    }

    if (header === "Wali Kelas") {
      if (
        row.homeroom_class_id !== undefined &&
        row.homeroom_class_id !== null &&
        row.homeroom_class_id !== ""
      ) {
        return row.homeroom_class_id;
      }
      return "-";
    }

    if (header === "Status") {
      if (row.is_active !== undefined && row.is_active !== null) {
        return row.is_active ? "Aktif" : "Tidak Aktif";
      }
      if (
        row.status !== undefined &&
        row.status !== null &&
        row.status !== ""
      ) {
        return row.status;
      }
      return "-";
    }

    if (header === "Tanggal Bergabung") {
      if (
        row.created_at !== undefined &&
        row.created_at !== null &&
        row.created_at !== ""
      ) {
        return row.created_at;
      }
      return "-";
    }

    // DEFAULT MAPPING untuk header lainnya
    const possibleKeys = headerKeyMap[header];
    if (possibleKeys) {
      for (const key of possibleKeys) {
        if (
          row[key] !== undefined &&
          row[key] !== null &&
          row[key] !== "" &&
          row[key] !== "-"
        ) {
          return row[key];
        }
      }
    }

    // Fallback: coba akses langsung
    if (
      row[header] !== undefined &&
      row[header] !== null &&
      row[header] !== "" &&
      row[header] !== "-"
    ) {
      return row[header];
    }

    return "-";
  };

  // ✅ Get report icon based on type
  const getReportIcon = () => {
    switch (reportType) {
      case "admin-users":
        return Users;
      case "admin-classes":
        return Settings;
      case "admin-stats":
        return BarChart3;
      case "admin-attendance":
        return Calendar;
      case "admin-students":
        return Users;
      case "admin-teachers":
        return Users;
      case "admin-counseling":
        return Shield;
      case "admin-grades":
        return BarChart3;
      default:
        return Shield;
    }
  };

  const ReportIcon = getReportIcon();

  // ✅ Get report color theme
  const getThemeColor = () => {
    switch (reportType) {
      case "admin-users":
        return "blue";
      case "admin-classes":
        return "indigo";
      case "admin-stats":
        return "purple";
      case "admin-attendance":
        return "green";
      case "admin-students":
        return "blue";
      case "admin-teachers":
        return "indigo";
      case "admin-counseling":
        return "purple";
      case "admin-grades":
        return "green";
      default:
        return "slate";
    }
  };

  const themeColor = getThemeColor();

  // ✅ Color classes mapping
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    indigo: {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-600",
      button: "bg-indigo-600 hover:bg-indigo-700",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-600",
      button: "bg-purple-600 hover:bg-purple-700",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-600",
      button: "bg-green-600 hover:bg-green-700",
    },
    slate: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-600",
      button: "bg-slate-600 hover:bg-slate-700",
    },
  };

  const colors = colorClasses[themeColor];

  // ✅ FIXED: Extract unique classes and statuses for filtering
  const uniqueClasses = useMemo(() => {
    const classes = new Set();
    dataToUse.forEach((row) => {
      const classValue = getCellValue(row, "Kelas");
      if (classValue && classValue !== "-") classes.add(classValue);
    });
    return Array.from(classes).sort();
  }, [dataToUse]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    dataToUse.forEach((row) => {
      const statusValue = getCellValue(row, "Status");
      if (statusValue && statusValue !== "-") statuses.add(statusValue);
    });
    return Array.from(statuses).sort();
  }, [dataToUse]);

  // ✅ FIXED: Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = dataToUse;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      );
    }

    // Class filter
    if (filterClass) {
      filtered = filtered.filter((row) => {
        const classValue = getCellValue(row, "Kelas");
        return String(classValue) === filterClass;
      });
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((row) => {
        const statusValue = getCellValue(row, "Status");
        return statusValue === filterStatus;
      });
    }

    return filtered;
  }, [dataToUse, searchQuery, filterClass, filterStatus]);

  // ✅ Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // ✅ Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterClass, filterStatus]);

  // ✅ FIXED: Render cell dengan handling khusus untuk Alpa
  const renderCell = (header, value, row = {}) => {
    // Gunakan getCellValue yang sudah difix
    const cellValue = getCellValue(row, header);

    // Special styling untuk Alpa
    if (header === "Alpa" && cellValue !== "-" && cellValue !== "0") {
      return (
        <span className="font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
          {cellValue}
        </span>
      );
    }

    // Attendance numbers styling
    if (
      (header === "Hadir" || header === "Sakit" || header === "Izin") &&
      cellValue !== "-"
    ) {
      const bgColor =
        header === "Hadir"
          ? "bg-green-50 text-green-700"
          : header === "Sakit"
          ? "bg-yellow-50 text-yellow-700"
          : "bg-blue-50 text-blue-700";
      return (
        <span className={`font-medium ${bgColor} px-2 py-1 rounded`}>
          {cellValue}
        </span>
      );
    }

    // Status colors
    if (header === "Status") {
      const isActive =
        cellValue === "Aktif" ||
        cellValue === "Active" ||
        cellValue === true ||
        cellValue === 1 ||
        cellValue === "aktif";
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
          {isActive ? "Aktif" : "Tidak Aktif"}
        </span>
      );
    }

    // Role colors
    if (header === "Role") {
      const roleColors = {
        admin: "bg-purple-100 text-purple-800",
        teacher: "bg-blue-100 text-blue-800",
        bk: "bg-teal-100 text-teal-800",
        homeroom: "bg-green-100 text-green-800",
        siswa: "bg-gray-100 text-gray-800",
        student: "bg-gray-100 text-gray-800",
        "guru bk": "bg-teal-100 text-teal-800",
        guru: "bg-blue-100 text-blue-800",
      };
      const colorClass =
        roleColors[String(cellValue).toLowerCase()] ||
        "bg-gray-100 text-gray-800";
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {cellValue}
        </span>
      );
    }

    // Date formatting
    if (
      (header.includes("Tanggal") || header === "Tanggal Bergabung") &&
      cellValue !== "-"
    ) {
      try {
        const date = new Date(cellValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("id-ID");
        }
      } catch (e) {
        // Biarkan value asli jika parsing gagal
      }
    }

    // Percentage with color coding
    if (
      header === "Persentase" &&
      typeof cellValue === "string" &&
      cellValue.includes("%")
    ) {
      const pct = parseFloat(cellValue);
      let colorClass = "text-gray-600";
      if (pct >= 90) colorClass = "text-green-600 font-bold";
      else if (pct >= 75) colorClass = "text-yellow-600 font-bold";
      else colorClass = "text-red-600 font-bold";

      return <span className={colorClass}>{cellValue}</span>;
    }

    // Highlight class columns
    if ((header === "Kelas" || header === "Wali Kelas") && cellValue !== "-") {
      return (
        <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
          {cellValue}
        </span>
      );
    }

    // Handle empty values
    if (
      cellValue === "-" ||
      cellValue === "" ||
      cellValue === null ||
      cellValue === undefined
    ) {
      // Untuk Alpa, tampilkan 0 jika kosong
      if (header === "Alpa") {
        return <span className="text-slate-400">0</span>;
      }
      return <span className="text-slate-400">-</span>;
    }

    return String(cellValue);
  };

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
                  Preview Data Administrator • {filteredData.length} dari{" "}
                  {total || dataToUse.length} record
                  {dataToUse.length === 0 &&
                    " ⚠️ Data kosong - cek struktur data"}
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
        {summary && summary.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-wrap gap-4 justify-start">
              {summary.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg border border-slate-200 p-3 min-w-[120px]">
                  <p className="text-xs text-slate-600 mb-1 truncate">
                    {stat.label}
                  </p>
                  <p className="text-lg font-bold text-slate-800 truncate">
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
                placeholder="Cari nama, NIS, email, atau data lainnya..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Class Filter */}
            {uniqueClasses.length > 0 && (
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[150px]">
                <option value="">Semua Kelas</option>
                {uniqueClasses.map((kelas) => (
                  <option key={kelas} value={kelas}>
                    {String(kelas).startsWith("Kelas")
                      ? kelas
                      : `Kelas ${kelas}`}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            {uniqueStatuses.length > 0 && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[150px]">
                <option value="">Semua Status</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            )}

            {(searchQuery || filterClass || filterStatus) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterClass("");
                  setFilterStatus("");
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium whitespace-nowrap">
                Reset Filter
              </button>
            )}
          </div>

          {/* Active Filters Info */}
          {(filterClass || filterStatus) && (
            <div className="flex items-center gap-2 mt-3">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Filter aktif:</span>
              {filterClass && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                  Kelas {filterClass}
                </span>
              )}
              {filterStatus && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  {filterStatus}
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
                        {/* ✅ FIX: Replace "Absen" with "Alpa" in header display */}
                        {header === "Absen" ? "Alpa" : header}
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
                          {renderCell(header, row[header], row)}
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
                {dataToUse.length === 0
                  ? "Data laporan kosong"
                  : "Tidak ada data yang sesuai"}
              </p>
              <p className="text-slate-400 text-sm mt-2">
                {dataToUse.length === 0
                  ? "Periksa struktur data atau koneksi API"
                  : "Coba ubah filter atau kata kunci pencarian"}
              </p>
              {dataToUse.length === 0 && (
                <button
                  onClick={() =>
                    console.log("Debug Data:", {
                      reportData,
                      headers,
                      dataToUse,
                    })
                  }
                  className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 rounded text-sm">
                  📋 Debug Data di Console
                </button>
              )}
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
              <span className="font-medium">💡 Tips:</span> Gunakan filter untuk
              analisis data yang lebih spesifik
              {dataToUse.length === 0 && (
                <span className="text-red-500 ml-2">
                  ⚠️ Data kosong - periksa console untuk debug
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors">
                Tutup
              </button>
              <button
                onClick={() => onDownload(reportType, "xlsx")}
                disabled={loading || dataToUse.length === 0}
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

export default AdminReportModal;

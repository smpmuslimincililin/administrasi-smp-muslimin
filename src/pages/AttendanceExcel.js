import ExcelJS from "exceljs";
import React, { useState } from "react";
import { supabase } from "../supabaseClient"; // ✅ IMPORT supabase

/**
 * Modal component for month/year selection
 */
const ExportModal = ({ show, onClose, onExport, loading }) => {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Initialize with current month/year when modal opens
  React.useEffect(() => {
    if (show) {
      const now = new Date();
      setSelectedYear(now.getFullYear().toString());
      setSelectedMonth(String(now.getMonth() + 1).padStart(2, "0"));
    }
  }, [show]);

  const handleExport = () => {
    if (!selectedMonth || !selectedYear) return;

    const yearMonth = `${selectedYear}-${selectedMonth}`;
    onExport(yearMonth);
  };

  if (!show) return null;

  // Year options
  const yearOptions = [];
  for (let year = 2025; year <= 2030; year++) {
    yearOptions.push(year);
  }

  // Month names
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header - Blue theme */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Export Excel</h2>
              <p className="text-blue-100 text-sm">
                Pilih periode untuk diunduh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-blue-600 rounded-lg transition disabled:opacity-50">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Month Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Bulan
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="">-- Pilih Bulan --</option>
              {monthNames.map((name, index) => (
                <option key={index} value={String(index + 1).padStart(2, "0")}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Tahun
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="">-- Pilih Tahun --</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm text-blue-700">
                  Data akan diekspor dalam format Excel (.xlsx) untuk periode
                  yang dipilih
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50">
              Batal
            </button>
            <button
              onClick={handleExport}
              disabled={loading || !selectedMonth || !selectedYear}
              className="flex-1 px-4 py-3 bg-blue-500 border border-blue-600 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main export function with modal
 */
export const exportAttendanceToExcel = async (
  students,
  selectedClass,
  selectedSubject,
  date,
  attendanceStatus,
  attendanceNotes,
  onShowToast,
  selectedMonth = null,
  teacherName = null, // ✅ TAMBAHAN: Parameter nama guru
  homeroomClass = null // ✅ TAMBAHAN: Parameter homeroom class untuk cek wali kelas
) => {
  // Create a wrapper component to show the modal
  const showModal = () => {
    return new Promise((resolve) => {
      // Create modal container
      const modalContainer = document.createElement("div");
      modalContainer.id = "export-modal-container";
      document.body.appendChild(modalContainer);

      // Render modal component
      const ModalWrapper = () => {
        const [show, setShow] = useState(true);
        const [loading, setLoading] = useState(false);

        const handleClose = () => {
          setShow(false);
          setTimeout(() => {
            document.body.removeChild(modalContainer);
          }, 300);
          resolve(null); // Resolve with null if cancelled
        };

        const handleExport = async (yearMonth) => {
          setLoading(true);
          try {
            await performExport(yearMonth);
            setShow(false);
            setTimeout(() => {
              document.body.removeChild(modalContainer);
            }, 300);
            resolve(yearMonth);
          } catch (error) {
            console.error("Export error:", error);
            setLoading(false);
          }
        };

        const performExport = async (yearMonth) => {
          try {
            if (!students || students.length === 0) {
              onShowToast?.("Tidak ada data siswa untuk diexport!", "error");
              return;
            }

            // Import supabase client
            const { supabase } = await import("../supabaseClient");

            // ✅ AMBIL NAMA GURU DARI DATABASE
            let fetchedTeacherName = teacherName; // Use provided teacherName as fallback

            if (!fetchedTeacherName) {
              try {
                // Get teacher name from current user session
                const {
                  data: { user: currentUser },
                } = await supabase.auth.getUser();

                if (currentUser) {
                  const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("full_name")
                    .eq("id", currentUser.id)
                    .single();

                  if (!userError && userData) {
                    fetchedTeacherName = userData.full_name;
                  }
                }
              } catch (error) {
                console.warn("Could not fetch teacher name:", error);
              }
            }

            // Calculate start and end date for the month
            const [year, month] = yearMonth.split("-");
            const startDate = `${year}-${month}-01`;
            const lastDay = new Date(
              parseInt(year),
              parseInt(month),
              0
            ).getDate();
            const endDate = `${year}-${month}-${String(lastDay).padStart(
              2,
              "0"
            )}`;

            // Determine subject filter
            let subjectFilter;
            const subjectUpper = selectedSubject.toUpperCase();

            if (
              subjectUpper.includes("PRESENSI HARIAN") ||
              subjectUpper.includes("HARIAN")
            ) {
              subjectFilter = "Harian";
            } else {
              subjectFilter = selectedSubject.split("-")[0].trim();
            }

            console.log("📁 Export Query:", {
              class_id: selectedClass,
              subject: subjectFilter,
              dateRange: `${startDate} to ${endDate}`,
              originalSubject: selectedSubject,
            });

            // Query attendance records for this class, subject, and MONTH ONLY
            const { data: attendanceRecords, error } = await supabase
              .from("attendances")
              .select("student_id, date, status, notes")
              .eq("class_id", selectedClass)
              .eq("subject", subjectFilter)
              .gte("date", startDate)
              .lte("date", endDate)
              .order("date", { ascending: true });

            console.log("📊 Records found:", attendanceRecords?.length || 0);

            if (error) {
              console.error("❌ Query error:", error);
              onShowToast?.(
                "Error mengambil data presensi: " + error.message,
                "error"
              );
              return;
            }

            // Get unique dates and sort them
            const uniqueDates = [
              ...new Set(attendanceRecords?.map((record) => record.date) || []),
            ]
              .sort()
              .map((dateStr) => {
                const [year, month, day] = dateStr.split("-");
                return {
                  original: dateStr,
                  display: `${day}-${month}`,
                };
              });

            if (uniqueDates.length === 0) {
              onShowToast?.(
                "Tidak ada data kehadiran untuk diekspor di bulan ini!",
                "error"
              );
              return;
            }

            // Create student attendance matrix
            const studentMatrix = {};

            students.forEach((student) => {
              studentMatrix[student.id] = {
                nis: student.nis,
                name: student.full_name,
                dates: {},
                summary: { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 },
              };
            });

            // Fill matrix with attendance data
            attendanceRecords?.forEach((record) => {
              if (studentMatrix[record.student_id]) {
                const dateKey = record.date;

                let statusCode = "H";
                if (record.status === "Sakit") statusCode = "S";
                else if (record.status === "Izin") statusCode = "I";
                else if (record.status === "Alpha" || record.status === "Alpa")
                  statusCode = "A";

                studentMatrix[record.student_id].dates[dateKey] = statusCode;

                const status =
                  record.status === "Alpha" || record.status === "Alpa"
                    ? "Alpha"
                    : record.status;
                if (
                  studentMatrix[record.student_id].summary[status] !== undefined
                ) {
                  studentMatrix[record.student_id].summary[status]++;
                }
              }
            });

            // Create workbook and worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Rekap Presensi");

            // Calculate total columns
            const baseCols = 2; // No, Nama Siswa
            const dateCols = uniqueDates.length;
            const summaryCols = 6; // Hadir, Izin, Sakit, Alpha, Total, Persentase
            const totalCols = baseCols + dateCols + summaryCols;

            // Format month name for display
            const monthNames = [
              "Januari",
              "Februari",
              "Maret",
              "April",
              "Mei",
              "Juni",
              "Juli",
              "Agustus",
              "September",
              "Oktober",
              "November",
              "Desember",
            ];
            const monthName = monthNames[parseInt(month) - 1];
            const periodText = `${monthName} ${year}`;

            // Header rows
            const headerData = [
              ["SMP MUSLIMIN CILILIN"],
              [`REKAP PRESENSI KELAS ${selectedClass}`],
              [`MATA PELAJARAN: ${selectedSubject} - ${periodText}`],
              [], // Empty row
              // Table headers
              [
                "No.",
                "Nama Siswa",
                ...uniqueDates.map((d) => d.display),
                "Hadir",
                "Izin",
                "Sakit",
                "Alpha",
                "Total",
                "Persentase",
              ],
            ];

            // Add student data
            const studentData = students.map((student, index) => {
              const studentInfo = studentMatrix[student.id];
              const summary = studentInfo.summary;
              const total =
                summary.Hadir + summary.Izin + summary.Sakit + summary.Alpha;
              const percentage =
                total > 0 ? Math.round((summary.Hadir / total) * 100) : 100;

              return [
                index + 1,
                student.full_name,
                ...uniqueDates.map((d) => studentInfo.dates[d.original] || ""),
                summary.Hadir,
                summary.Izin,
                summary.Sakit,
                summary.Alpha,
                total,
                `${percentage}%`,
              ];
            });

            // Combine all data
            const allData = [...headerData, ...studentData];

            // Add data to worksheet
            allData.forEach((row, rowIndex) => {
              row.forEach((cell, colIndex) => {
                worksheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
              });
            });

            // Style header rows (1-3)
            for (let row = 1; row <= 3; row++) {
              const headerRow = worksheet.getRow(row);
              worksheet.mergeCells(row, 1, row, totalCols);
              const cell = headerRow.getCell(1);
              cell.font = {
                name: "Arial",
                size: row === 1 ? 14 : 12,
                bold: true,
              };
              cell.alignment = { horizontal: "center", vertical: "middle" };
              headerRow.height = 22;
            }

            // Style table headers (row 5)
            const tableHeaderRow = worksheet.getRow(5);
            for (let col = 1; col <= totalCols; col++) {
              const cell = tableHeaderRow.getCell(col);
              cell.font = { name: "Arial", size: 10, bold: true };
              cell.alignment = { horizontal: "center", vertical: "middle" };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE8F4FD" },
              };
              cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
              };
            }
            tableHeaderRow.height = 20;

            // Style data rows
            const dataStartRow = 6;
            for (let i = 0; i < students.length; i++) {
              const currentRow = dataStartRow + i;
              const rowObj = worksheet.getRow(currentRow);

              for (let col = 1; col <= totalCols; col++) {
                const cell = rowObj.getCell(col);
                cell.font = { name: "Arial", size: 9 };
                cell.border = {
                  top: { style: "thin" },
                  left: { style: "thin" },
                  bottom: { style: "thin" },
                  right: { style: "thin" },
                };

                // Alignment
                if (col === 1) {
                  // No
                  cell.alignment = { horizontal: "center", vertical: "middle" };
                } else if (col === 2) {
                  // Name
                  cell.alignment = { horizontal: "left", vertical: "middle" };
                } else if (col >= 3 && col <= 2 + dateCols) {
                  // Date columns
                  cell.alignment = { horizontal: "center", vertical: "middle" };
                  // Color coding for attendance
                  const value = cell.value;
                  if (value === "H") {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFD4F1D4" },
                    };
                  } else if (value === "S") {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFFFF4CD" },
                    };
                  } else if (value === "I") {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFCDE4FF" },
                    };
                  } else if (value === "A") {
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFFFD4D4" },
                    };
                  }
                } else {
                  // Summary columns
                  cell.alignment = { horizontal: "center", vertical: "middle" };
                }
              }
              rowObj.height = 18;
            }

            // Set column widths
            worksheet.getColumn(1).width = 5; // No
            worksheet.getColumn(2).width = 40; // Name

            // Date columns
            for (let i = 0; i < dateCols; i++) {
              worksheet.getColumn(3 + i).width = 6;
            }

            // Summary columns
            const summaryStartCol = 3 + dateCols;
            for (let i = 0; i < summaryCols; i++) {
              worksheet.getColumn(summaryStartCol + i).width = i === 5 ? 12 : 8; // Persentase wider
            }

            // ✅ FOOTER WITH TEACHER NAME - IMPROVED
            const footerStartRow = dataStartRow + students.length + 2;

            // Determine role based on subject type
            const isHomeroomDaily = subjectFilter === "Harian";

            // ✅ CEK APAKAH USER ADALAH WALI KELAS
            const isHomeroom = homeroomClass && homeroomClass === selectedClass;

            // ✅ TENTUKAN ROLE TITLE
            let roleTitle;
            if (isHomeroomDaily) {
              roleTitle = "Wali Kelas";
            } else if (isHomeroom) {
              roleTitle = "Wali Kelas & Guru Mata Pelajaran";
            } else {
              roleTitle = "Guru Mata Pelajaran";
            }

            // Position signature at the right side
            const signatureCol = Math.max(6, totalCols - 3);

            // "Mengetahui" text
            worksheet.getCell(footerStartRow, signatureCol).value =
              "Mengetahui";
            worksheet.getCell(footerStartRow, signatureCol).font = {
              name: "Arial",
              size: 10,
            };
            worksheet.getCell(footerStartRow, signatureCol).alignment = {
              horizontal: "center",
            };

            // Role title
            worksheet.getCell(footerStartRow + 1, signatureCol).value =
              roleTitle;
            worksheet.getCell(footerStartRow + 1, signatureCol).font = {
              name: "Arial",
              size: 10,
            };
            worksheet.getCell(footerStartRow + 1, signatureCol).alignment = {
              horizontal: "center",
            };

            // Empty rows for signature space (3 rows)
            const nameRow = footerStartRow + 5;

            // ✅ TEACHER NAME - USE PROVIDED teacherName OR DEFAULT
            const displayName = teacherName || "(____________________)";
            worksheet.getCell(nameRow, signatureCol).value = displayName;
            worksheet.getCell(nameRow, signatureCol).font = {
              name: "Arial",
              size: 10,
              bold: true,
              underline: true,
            };
            worksheet.getCell(nameRow, signatureCol).alignment = {
              horizontal: "center",
            };

            // Generate and download file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Rekap_Presensi_${selectedClass}_${selectedSubject.replace(
              /[^a-zA-Z0-9]/g,
              "_"
            )}_${periodText.replace(/\s/g, "_")}.xlsx`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            onShowToast?.("File Excel berhasil diunduh!", "success");
          } catch (error) {
            console.error("Error exporting to Excel:", error);
            onShowToast?.(
              "Gagal mengunduh file Excel: " + error.message,
              "error"
            );
            throw error;
          }
        };

        return (
          <ExportModal
            show={show}
            onClose={handleClose}
            onExport={handleExport}
            loading={loading}
          />
        );
      };

      // Render the modal using React DOM
      const { createRoot } = require("react-dom/client");
      const root = createRoot(modalContainer);
      root.render(<ModalWrapper />);
    });
  };

  // Show the modal and wait for user selection
  const selectedPeriod = await showModal();
  return selectedPeriod;
};

/**
 * Legacy function for backward compatibility
 */
export const exportAttendanceFromComponent = async (
  supabase,
  activeClass,
  month,
  year,
  studentsData,
  userData
) => {
  try {
    const students = studentsData[activeClass] || [];

    if (students.length === 0) {
      return {
        success: false,
        message: "Tidak ada data siswa untuk kelas ini",
      };
    }

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = `${year}-${month.padStart(2, "0")}-${lastDayOfMonth
      .toString()
      .padStart(2, "0")}`;

    const { data: attendanceRecords, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("kelas", activeClass)
      .gte("tanggal", startDate)
      .lte("tanggal", endDate)
      .order("tanggal", { ascending: true });

    if (error) {
      throw error;
    }

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return {
        success: false,
        message: "Tidak ada data kehadiran untuk periode yang dipilih",
      };
    }

    const result = await exportMonthlyAttendanceToExcel({
      kelas: activeClass,
      bulan: month,
      tahun: year,
      studentsData: students,
      attendanceRecords: attendanceRecords,
      userData: userData,
      supabase: supabase,
    });

    return result;
  } catch (error) {
    console.error("Error in exportAttendanceFromComponent:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
};

/**
 * Original monthly export function
 */
const exportMonthlyAttendanceToExcel = async ({
  kelas,
  bulan,
  tahun,
  studentsData,
  attendanceRecords,
  namaSekolah = "SMP MUSLIMIN CILILIN",
  userData,
  supabase,
}) => {
  return {
    success: true,
    message: "Monthly export feature - to be implemented",
  };
};

// ====================================================================
// ✅ TAMBAHAN: 2 FUNCTIONS UNTUK SEMESTER EXPORT (DARI FILE Export.js)
// ====================================================================

/**
 * Export semester attendance recap to Excel (SEMESTER) - SMP VERSION
 */
export const exportSemesterRecapToExcel = async ({
  classId,
  semester, // 1 (Ganjil) or 2 (Genap)
  year,
  studentsData,
  attendanceRecords,
  subject,
  namaSekolah = "SMP MUSLIMIN CILILIN",
  namaGuru = "",
  homeroomClass = null,
}) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      `Semester ${semester === 1 ? "Ganjil" : "Genap"} Kelas ${classId}`
    );

    const semesterText =
      semester === 1 ? "Ganjil (Juli-Desember)" : "Genap (Januari-Juni)";

    // Calculate hari efektif
    const uniqueDates = [...new Set(attendanceRecords.map((r) => r.date))];
    const totalHariEfektif = uniqueDates.length;

    // Process student data
    const studentMatrix = {};

    studentsData.forEach((student) => {
      studentMatrix[student.id] = {
        nis: student.nis,
        name: student.full_name,
        summary: { hadir: 0, sakit: 0, izin: 0, alpa: 0 },
      };
    });

    attendanceRecords.forEach((record) => {
      if (studentMatrix[record.student_id]) {
        const summary = studentMatrix[record.student_id].summary;
        const status = record.status?.toLowerCase();

        if (status === "hadir") {
          summary.hadir++;
        } else if (status === "sakit") {
          summary.sakit++;
        } else if (status === "izin") {
          summary.izin++;
        } else if (status === "alpa" || status === "alpha") {
          summary.alpa++;
        }
      }
    });

    // Get category helper
    const getCategory = (percentage) => {
      if (percentage >= 90) return "Sangat Baik";
      if (percentage >= 80) return "Baik";
      if (percentage >= 70) return "Cukup";
      return "Kurang";
    };

    const totalCols = 10;

    // School name header
    worksheet.mergeCells(1, 1, 1, totalCols);
    const schoolCell = worksheet.getCell(1, 1);
    schoolCell.value = namaSekolah;
    schoolCell.font = { name: "Arial", size: 14, bold: true };
    schoolCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 25;

    // Title row
    worksheet.mergeCells(2, 1, 2, totalCols);
    const titleCell = worksheet.getCell(2, 1);
    titleCell.value = `Rekap Presensi Harian - Kelas ${classId}`;
    titleCell.font = { name: "Arial", size: 12, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 20;

    // Subtitle row
    worksheet.mergeCells(3, 1, 3, totalCols);
    const subtitleCell = worksheet.getCell(3, 1);
    subtitleCell.value = `${subject} | Semester ${semesterText} ${year}`;
    subtitleCell.font = { name: "Arial", size: 11 };
    subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(3).height = 20;

    worksheet.getRow(4).height = 15;

    // Header row
    const headerRow = 5;
    const headers = [
      "No",
      "NIS",
      "Nama Siswa",
      "Hadir",
      "Sakit",
      "Izin",
      "Alpa",
      "Total",
      "%",
      "Kategori",
    ];

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(headerRow, index + 1);
      cell.value = header;
      cell.font = {
        name: "Arial",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.getRow(headerRow).height = 25;

    // Data rows
    let rowIndex = headerRow + 1;
    studentsData.forEach((student, index) => {
      const studentData = studentMatrix[student.id];
      const summary = studentData.summary;

      const percentage =
        totalHariEfektif > 0
          ? Math.round((summary.hadir / totalHariEfektif) * 100)
          : 0;
      const category = getCategory(percentage);

      const rowData = [
        index + 1,
        studentData.nis,
        studentData.name,
        summary.hadir,
        summary.sakit,
        summary.izin,
        summary.alpa,
        totalHariEfektif,
        percentage,
        category,
      ];

      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(rowIndex, colIndex + 1);
        cell.value = value;
        cell.font = { name: "Arial", size: 10 };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (colIndex === 0 || colIndex >= 3) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }

        // Category coloring
        if (colIndex === 9) {
          if (category === "Sangat Baik") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFC6EFCE" },
            };
          } else if (category === "Baik") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFF2CC" },
            };
          } else if (category === "Cukup") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFCE4D6" },
            };
          } else {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFC7CE" },
            };
          }
        }
      });

      worksheet.getRow(rowIndex).height = 20;
      rowIndex++;
    });

    // Footer
    rowIndex += 2;

    // Determine role
    const isHomeroomDaily = subject === "Harian";
    const isHomeroom = homeroomClass && homeroomClass === classId;

    let roleTitle;
    if (isHomeroomDaily) {
      roleTitle = "Wali Kelas";
    } else if (isHomeroom) {
      roleTitle = "Wali Kelas & Guru Mata Pelajaran";
    } else {
      roleTitle = "Guru Mata Pelajaran";
    }

    worksheet.getCell(rowIndex, 8).value = "Mengetahui";
    worksheet.getCell(rowIndex, 8).font = { name: "Arial", size: 11 };
    worksheet.getCell(rowIndex, 8).alignment = { horizontal: "left" };

    worksheet.getCell(rowIndex + 1, 8).value = roleTitle;
    worksheet.getCell(rowIndex + 1, 8).font = { name: "Arial", size: 11 };
    worksheet.getCell(rowIndex + 1, 8).alignment = { horizontal: "left" };

    worksheet.getRow(rowIndex + 2).height = 30;

    if (namaGuru) {
      worksheet.getCell(rowIndex + 3, 8).value = namaGuru;
      worksheet.getCell(rowIndex + 3, 8).font = {
        name: "Arial",
        size: 11,
        bold: true,
        underline: true,
      };
      worksheet.getCell(rowIndex + 3, 8).alignment = { horizontal: "left" };
    }

    // Column widths
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 35;
    worksheet.getColumn(4).width = 10;
    worksheet.getColumn(5).width = 10;
    worksheet.getColumn(6).width = 10;
    worksheet.getColumn(7).width = 10;
    worksheet.getColumn(8).width = 10;
    worksheet.getColumn(9).width = 8;
    worksheet.getColumn(10).width = 15;

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Presensi_Semester_${
      semester === 1 ? "Ganjil" : "Genap"
    }_Kelas_${classId}_${year}.xlsx`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: "File Excel semester berhasil di-download!",
    };
  } catch (error) {
    console.error("Error creating semester Excel file:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
};

/**
 * Integration function for semester export - SMP VERSION
 */
export const exportSemesterRecapFromComponent = async (
  classId,
  semester, // 1 or 2
  year,
  studentsData,
  subject,
  type = "mapel",
  currentUser = null,
  homeroomClass = null
) => {
  try {
    const students = studentsData || [];

    if (students.length === 0) {
      return {
        success: false,
        message: "Tidak ada data siswa untuk kelas ini",
      };
    }

    console.log("=== EXPORT SEMESTER DATA (SMP) ===");

    // Convert semester
    const semesterType = semester === 1 ? "Ganjil" : "Genap";
    const academicYear =
      semester === 1 ? `${year}/${year + 1}` : `${year - 1}/${year}`;

    const months = semester === 1 ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];

    console.log({
      classId,
      academicYear,
      semesterType,
      subject,
      type,
      months,
    });

    // Date range
    const [startYear, endYear] = academicYear.split("/").map(Number);
    let startDate, endDate;

    if (semesterType === "Ganjil") {
      startDate = `${startYear}-07-01`;
      endDate = `${startYear}-12-31`;
    } else {
      startDate = `${endYear}-01-01`;
      endDate = `${endYear}-06-30`;
    }

    console.log("📅 Date range:", { startDate, endDate });

    // FETCH WITH PAGINATION
    console.log("🔍 Fetching with pagination...");

    let allRecords = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("attendances")
        .select("student_id, status, date")
        .eq("class_id", classId)
        .eq("subject", subject)
        .eq("type", type)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error("❌ Query error:", error);
        throw error;
      }

      if (data && data.length > 0) {
        allRecords = [...allRecords, ...data];
        console.log(
          `📄 Page ${page + 1}: ${data.length} records (Total: ${
            allRecords.length
          })`
        );

        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    console.log("✅ Total records fetched:", allRecords.length);

    if (allRecords.length === 0) {
      return {
        success: false,
        message: "Tidak ada data kehadiran untuk semester yang dipilih",
      };
    }

    // Filter by month
    const filteredData = allRecords.filter((r) => {
      const parts = r.date.split("-");
      const month = parseInt(parts[1], 10);
      return months.includes(month);
    });

    console.log("Data setelah filter:", filteredData.length);

    if (filteredData.length === 0) {
      return {
        success: false,
        message: "Tidak ada data kehadiran untuk semester yang dipilih",
      };
    }

    // Get teacher name
    let namaGuru = "";
    if (currentUser && currentUser.full_name) {
      namaGuru = currentUser.full_name;
    } else if (currentUser && currentUser.username) {
      namaGuru = currentUser.username;
    }

    // Export
    const result = await exportSemesterRecapToExcel({
      classId: classId,
      semester: semester,
      year: year,
      studentsData: students,
      attendanceRecords: filteredData,
      subject: subject,
      namaSekolah: "SMP MUSLIMIN CILILIN",
      namaGuru: namaGuru,
      homeroomClass: homeroomClass,
    });

    return result;
  } catch (error) {
    console.error("Error in exportSemesterRecapFromComponent:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
};

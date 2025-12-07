// src/attendance-teacher/reports/ExportExcel.js
import React, { useState } from "react";
import { X, Download, FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";

const ExportExcel = ({
  attendances,
  teachers,
  month,
  year,
  monthName,
  onClose,
}) => {
  const [exporting, setExporting] = useState(false);

  // ========================================
  // 🗓️ LIBUR NASIONAL 2025-2026
  // ========================================
  const nationalHolidays = {
    // ===== 2025 =====
    "2025-01-01": "Tahun Baru Masehi",
    "2025-01-25": "Tahun Baru Imlek 2576",
    "2025-03-02": "Isra Miraj Nabi Muhammad SAW",
    "2025-03-12": "Hari Raya Nyepi (Tahun Baru Saka 1947)",
    "2025-03-31": "Idul Fitri 1446 H",
    "2025-04-01": "Idul Fitri 1446 H",
    "2025-04-18": "Wafat Yesus Kristus (Jumat Agung)",
    "2025-05-01": "Hari Buruh Internasional",
    "2025-05-29": "Kenaikan Yesus Kristus",
    "2025-06-07": "Idul Adha 1446 H",
    "2025-06-28": "Tahun Baru Islam 1447 H",
    "2025-08-17": "Hari Kemerdekaan RI",
    "2025-09-05": "Maulid Nabi Muhammad SAW",
    "2025-12-25": "Hari Raya Natal",
    // ===== 2026 =====
    "2026-01-01": "Tahun Baru Masehi",
    "2026-01-16": "Isra Mi'raj Nabi Muhammad SAW",
    "2026-02-17": "Tahun Baru Imlek 2577",
    "2026-03-19": "Hari Suci Nyepi (Tahun Baru Saka 1948)",
    "2026-03-21": "Idul Fitri 1447 H",
    "2026-03-22": "Idul Fitri 1447 H",
    "2026-04-03": "Wafat Yesus Kristus (Jumat Agung)",
    "2026-04-05": "Hari Paskah",
    "2026-05-01": "Hari Buruh Internasional",
    "2026-05-14": "Kenaikan Yesus Kristus",
    "2026-05-27": "Idul Adha 1447 H",
    "2026-05-31": "Hari Raya Waisak 2570 BE",
    "2026-06-01": "Hari Lahir Pancasila",
    "2026-06-16": "Tahun Baru Islam 1448 H",
    "2026-08-17": "Hari Kemerdekaan RI",
    "2026-08-25": "Maulid Nabi Muhammad SAW",
    "2026-12-25": "Hari Raya Natal",
  };

  // Helper: Check if date is national holiday
  const isNationalHoliday = (dateStr) => {
    return nationalHolidays[dateStr] || null;
  };

  // Helper: Check if day is weekend (Saturday = 6, Sunday = 0)
  const isWeekend = (year, month, day) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };

  const getDaysInMonth = () => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getAttendanceForDay = (teacherId, day) => {
    const yearNum = year;
    const monthNum = String(month + 1).padStart(2, "0");
    const dayNum = String(day).padStart(2, "0");
    const dateStr = `${yearNum}-${monthNum}-${dayNum}`;

    return attendances.find(
      (att) => att.teacher_id === teacherId && att.attendance_date === dateStr
    );
  };

  const getStatusLabel = (status) => {
    const labels = {
      Hadir: "H",
      Izin: "I",
      Sakit: "S",
      Alpa: "A",
    };
    return labels[status] || "-";
  };

  const calculateTeacherStats = (teacherId) => {
    const teacherAttendances = attendances.filter(
      (att) => att.teacher_id === teacherId
    );
    const hadir = teacherAttendances.filter((a) => a.status === "Hadir").length;
    const total = teacherAttendances.length;
    const percentage = total > 0 ? ((hadir / total) * 100).toFixed(1) : 0;

    return {
      hadir: hadir,
      izin: teacherAttendances.filter((a) => a.status === "Izin").length,
      sakit: teacherAttendances.filter((a) => a.status === "Sakit").length,
      alpa: teacherAttendances.filter((a) => a.status === "Alpa").length,
      total: total,
      percentage: percentage,
    };
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Presensi ${monthName} ${year}`);

      const daysInMonth = getDaysInMonth();
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      const totalColumns = 2 + daysInMonth + 6;

      // Helper function to get Excel column letter
      const getColumnLetter = (colNumber) => {
        let letter = "";
        while (colNumber > 0) {
          const remainder = (colNumber - 1) % 26;
          letter = String.fromCharCode(65 + remainder) + letter;
          colNumber = Math.floor((colNumber - 1) / 26);
        }
        return letter;
      };

      const lastColumnLetter = getColumnLetter(totalColumns);

      // Header Info - Nama Sekolah
      worksheet.mergeCells(`A1:${lastColumnLetter}1`);
      worksheet.getCell("A1").value =
        "SEKOLAH MENENGAH PERTAMA MUSLIMIN CILILIN";
      worksheet.getCell("A1").font = { bold: true, size: 16 };
      worksheet.getCell("A1").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Header Info - Judul Daftar Hadir
      worksheet.mergeCells(`A2:${lastColumnLetter}2`);
      worksheet.getCell("A2").value = "DAFTAR HADIR GURU/STAFF";
      worksheet.getCell("A2").font = { bold: true, size: 14 };
      worksheet.getCell("A2").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Header Info - Bulan
      worksheet.mergeCells(`A3:${lastColumnLetter}3`);
      worksheet.getCell(
        "A3"
      ).value = `BULAN : ${monthName.toUpperCase()} ${year}`;
      worksheet.getCell("A3").font = { bold: true, size: 12 };
      worksheet.getCell("A3").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Kosong 2 baris
      worksheet.addRow([]);
      worksheet.addRow([]);

      // Table Header
      const headerRow = worksheet.addRow([
        "No",
        "Nama Guru",
        ...days,
        "H",
        "I",
        "S",
        "A",
        "Total",
        "%",
      ]);

      // Style header
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Data Rows
      teachers.forEach((teacher, index) => {
        const stats = calculateTeacherStats(teacher.teacher_id || teacher.id);

        const rowData = [
          index + 1,
          teacher.full_name,
          ...days.map((day) => {
            const attendance = getAttendanceForDay(
              teacher.teacher_id || teacher.id,
              day
            );
            return attendance ? getStatusLabel(attendance.status) : "-";
          }),
          stats.hadir,
          stats.izin,
          stats.sakit,
          stats.alpa,
          stats.total,
          `${stats.percentage}%`,
        ];

        const row = worksheet.addRow(rowData);

        // Style data rows
        row.eachCell((cell, colNumber) => {
          cell.alignment = {
            horizontal: colNumber <= 2 ? "left" : "center",
            vertical: "middle",
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          // Color coding untuk kolom tanggal
          if (colNumber > 2 && colNumber <= 2 + daysInMonth) {
            const day = colNumber - 2;
            const value = cell.value;

            // Format date string untuk check holiday
            const yearNum = year;
            const monthNum = String(month + 1).padStart(2, "0");
            const dayNum = String(day).padStart(2, "0");
            const dateStr = `${yearNum}-${monthNum}-${dayNum}`;

            // Check weekend dan holiday
            const weekend = isWeekend(year, month, day);
            const holiday = isNationalHoliday(dateStr);

            // Jika weekend atau holiday, kasih warna merah muda
            if (weekend || holiday) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFECACA" }, // Merah muda (red-100)
              };
              cell.font = { color: { argb: "FF991B1B" } }; // Text merah gelap

              // Tambah comment/note
              if (holiday) {
                cell.note = `Libur Nasional: ${holiday}`;
              } else {
                cell.note = weekend ? "Weekend (Sabtu/Minggu)" : "";
              }
            }
            // Jika ada data kehadiran (H/I/S/A), kasih warna sesuai status
            else if (value === "H") {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF92D050" }, // Hijau
              };
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            } else if (value === "I") {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF5B9BD5" }, // Biru
              };
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            } else if (value === "S") {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFC000" }, // Kuning
              };
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            } else if (value === "A") {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFF0000" }, // Merah
              };
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            }
            // Jika belum absen (hari kerja biasa), biarkan putih default
          }

          // Bold stats columns (H, I, S, A, Total, %)
          if (colNumber > 2 + daysInMonth) {
            cell.font = { bold: true };
          }
        });
      });

      // Column widths
      worksheet.getColumn(1).width = 5; // No
      worksheet.getColumn(2).width = 30; // Nama Guru

      // Days columns
      for (let i = 3; i <= 2 + daysInMonth; i++) {
        worksheet.getColumn(i).width = 4;
      }

      // Stats columns
      worksheet.getColumn(3 + daysInMonth).width = 5; // H
      worksheet.getColumn(4 + daysInMonth).width = 5; // I
      worksheet.getColumn(5 + daysInMonth).width = 5; // S
      worksheet.getColumn(6 + daysInMonth).width = 5; // A
      worksheet.getColumn(7 + daysInMonth).width = 7; // Total
      worksheet.getColumn(8 + daysInMonth).width = 8; // %

      // Add legend
      const legendStartRow = worksheet.rowCount + 2;
      worksheet.addRow([]);
      worksheet.addRow(["Keterangan:"]);
      worksheet.getCell(`A${legendStartRow + 1}`).font = { bold: true };

      const legends = [
        ["H", "Hadir"],
        ["I", "Izin"],
        ["S", "Sakit"],
        ["A", "Alpha"],
        ["-", "Belum Absen"],
        ["Merah Muda", "Weekend / Libur Nasional"],
      ];

      legends.forEach(([code, label]) => {
        const row = worksheet.addRow([code, label]);
        row.getCell(1).alignment = { horizontal: "center" };
        row.getCell(1).font = { bold: true };

        // Kasih warna merah muda di keterangan juga
        if (code === "Merah Muda") {
          row.getCell(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFECACA" }, // Merah muda
          };
          row.getCell(1).font = { bold: true, color: { argb: "FF991B1B" } };
        }
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Presensi_Guru_${monthName}_${year}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Gagal mengekspor data ke Excel");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-green-600" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Export ke Excel</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 mb-2">
            <strong>File yang akan diexport:</strong>
          </p>
          <p className="text-sm text-blue-700">
            📄 Presensi_Guru_{monthName}_{year}.xlsx
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Data: {teachers.length} guru, {attendances.length} presensi
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all">
            Batal
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download size={20} />
                Export Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportExcel;

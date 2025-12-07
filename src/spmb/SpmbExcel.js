import ExcelJS from "exceljs";

/**
 * 🎓 SPMB Excel Export Utilities
 * Utility functions untuk export data SPMB ke Excel
 */

/**
 * Helper: Format tanggal ke DD-MM-YYYY
 */
const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString || dateString === "-") return "-";

  try {
    if (dateString.includes("-")) {
      const [year, month, day] = dateString.split("-");
      return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
    }
    return dateString;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Helper: Get current academic year
 */
const getCurrentAcademicYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (currentMonth >= 7) {
    return `${currentYear + 1}/${currentYear + 2}`;
  } else {
    return `${currentYear}/${currentYear + 1}`;
  }
};

/**
 * 📊 Export ALL Students (Single Sheet)
 * Export semua data siswa baru ke Excel dengan format lengkap
 */
export const exportAllStudents = async (
  allStudents,
  totalStudents,
  showToast
) => {
  if (!allStudents || allStudents.length === 0) {
    if (showToast) {
      showToast("Tidak ada data untuk di-export", "error");
    }
    return false;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Calon Siswa");

    // Set column widths
    worksheet.columns = [
      { width: 5 }, // No
      { width: 30 }, // Nama
      { width: 15 }, // JK
      { width: 25 }, // Tempat Lahir
      { width: 15 }, // Tanggal Lahir
      { width: 25 }, // Asal SD
      { width: 15 }, // NISN
      { width: 25 }, // Nama Ayah
      { width: 20 }, // Pekerjaan Ayah
      { width: 20 }, // Pendidikan Ayah
      { width: 25 }, // Nama Ibu
      { width: 20 }, // Pekerjaan Ibu
      { width: 20 }, // Pendidikan Ibu
      { width: 18 }, // No HP
      { width: 100 }, // Alamat
    ];

    // Get statistics
    const totalLaki = allStudents.filter((s) => s.jenis_kelamin === "L").length;
    const totalPerempuan = allStudents.filter(
      (s) => s.jenis_kelamin === "P"
    ).length;
    const academicYear = getCurrentAcademicYear();
    const currentDate = new Date().toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Header Sekolah
    worksheet.mergeCells("A1:O1");
    const schoolHeader = worksheet.getCell("A1");
    schoolHeader.value = "SMP MUSLIMIN CILILIN";
    schoolHeader.font = { bold: true, size: 16 };
    schoolHeader.alignment = { horizontal: "center", vertical: "middle" };

    // Header Data
    worksheet.mergeCells("A2:O2");
    const dataHeader = worksheet.getCell("A2");
    dataHeader.value = `DATA CALON SISWA BARU SMP TAHUN AJARAN ${academicYear}`;
    dataHeader.font = { bold: true, size: 14 };
    dataHeader.alignment = { horizontal: "center", vertical: "middle" };

    // Tanggal Export
    const dateCell = worksheet.getCell("A4");
    dateCell.value = `Tanggal Export: ${currentDate}`;
    dateCell.font = { italic: true, size: 11 };

    // Total Data
    const totalCell = worksheet.getCell("A5");
    totalCell.value = `Total Data Siswa Baru : ${totalStudents} siswa`;
    totalCell.font = { bold: true, size: 11 };

    // Siswa Laki-laki
    const lakiCell = worksheet.getCell("A6");
    lakiCell.value = `Siswa Laki-laki: ${totalLaki} siswa`;
    lakiCell.font = { size: 11 };

    // Siswa Perempuan
    const perempuanCell = worksheet.getCell("A7");
    perempuanCell.value = `Siswa Perempuan: ${totalPerempuan} siswa`;
    perempuanCell.font = { size: 11 };

    // Header tabel
    const headers = [
      "No.",
      "Nama Lengkap",
      "Jenis Kelamin",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Asal SD",
      "NISN",
      "Nama Ayah",
      "Pekerjaan Ayah",
      "Pendidikan Ayah",
      "Nama Ibu",
      "Pekerjaan Ibu",
      "Pendidikan Ibu",
      "No. HP Orang Tua",
      "Alamat Lengkap",
    ];

    const headerRow = worksheet.getRow(10);
    headerRow.values = headers;

    // Style header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1e3a8a" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Data rows
    allStudents.forEach((student, index) => {
      const row = worksheet.getRow(11 + index);

      row.values = [
        index + 1,
        student.nama_lengkap || "-",
        student.jenis_kelamin || "-",
        student.tempat_lahir || "-",
        formatDateToDDMMYYYY(student.tanggal_lahir),
        student.asal_sekolah || "-",
        student.nisn && student.nisn !== "-" ? student.nisn : "-",
        student.nama_ayah || "-",
        student.pekerjaan_ayah || "-",
        student.pendidikan_ayah || "-",
        student.nama_ibu || "-",
        student.pekerjaan_ibu || "-",
        student.pendidikan_ibu || "-",
        student.no_hp || "-",
        student.alamat || "-",
      ];

      // Style data rows
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle" };

        if (index % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F8FAFC" },
          };
        }
      });

      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    });

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Download file
    const fileName = `Data_Siswa_SMP_Muslimin_Cililin_${academicYear.replace(
      "/",
      "-"
    )}_${new Date().toISOString().split("T")[0]}.xlsx`;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    if (showToast) {
      showToast(`Data berhasil di-export: ${fileName}`, "success");
    }

    return true;
  } catch (error) {
    console.error("Error exporting all students:", error);
    if (showToast) {
      showToast("Gagal export data. Silakan coba lagi.", "error");
    }
    return false;
  }
};

/**
 * 🎓 Export Class Division (Multi-Sheet)
 * Export pembagian kelas dengan NIS TERISI
 * Format: No | NIS | Nama | Kelas | Jenis Kelamin
 */
export const exportClassDivision = async (classDistribution, showToast) => {
  if (!classDistribution || Object.keys(classDistribution).length === 0) {
    if (showToast) {
      showToast("Tidak ada data pembagian kelas untuk di-export", "error");
    }
    return false;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const academicYear = getCurrentAcademicYear();
    const currentDate = new Date().toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Urutkan kelas berdasarkan nama (7A, 7B, 7C, dst)
    const sortedClasses = Object.keys(classDistribution).sort();

    // Buat sheet untuk setiap kelas
    sortedClasses.forEach((className) => {
      const students = classDistribution[className];
      const worksheet = workbook.addWorksheet(`Kelas ${className}`);

      // Set column widths
      worksheet.columns = [
        { width: 5 }, // No
        { width: 18 }, // NIS 🔥 TERISI
        { width: 35 }, // Nama
        { width: 12 }, // Kelas
        { width: 15 }, // Jenis Kelamin
      ];

      // Calculate statistics
      const totalLaki = students.filter((s) => s.jenis_kelamin === "L").length;
      const totalPerempuan = students.filter(
        (s) => s.jenis_kelamin === "P"
      ).length;

      // Header Sekolah
      worksheet.mergeCells("A1:E1");
      const schoolHeader = worksheet.getCell("A1");
      schoolHeader.value = "SMP MUSLIMIN CILILIN";
      schoolHeader.font = { bold: true, size: 16 };
      schoolHeader.alignment = { horizontal: "center", vertical: "middle" };

      // Header Kelas
      worksheet.mergeCells("A2:E2");
      const classHeader = worksheet.getCell("A2");
      classHeader.value = `DAFTAR SISWA KELAS ${className} - TAHUN AJARAN ${academicYear}`;
      classHeader.font = { bold: true, size: 14 };
      classHeader.alignment = { horizontal: "center", vertical: "middle" };

      // Tanggal Export
      const dateCell = worksheet.getCell("A4");
      dateCell.value = `Tanggal Export: ${currentDate}`;
      dateCell.font = { italic: true, size: 11 };

      // Total Data
      const totalCell = worksheet.getCell("A5");
      totalCell.value = `Total Siswa: ${students.length} siswa`;
      totalCell.font = { bold: true, size: 11 };

      // Siswa Laki-laki
      const lakiCell = worksheet.getCell("A6");
      lakiCell.value = `Laki-laki: ${totalLaki} siswa`;
      lakiCell.font = { size: 11 };

      // Siswa Perempuan
      const perempuanCell = worksheet.getCell("A7");
      perempuanCell.value = `Perempuan: ${totalPerempuan} siswa`;
      perempuanCell.font = { size: 11 };

      // Header tabel
      const headers = ["No.", "NIS", "Nama Lengkap", "Kelas", "Jenis Kelamin"];

      const headerRow = worksheet.getRow(10);
      headerRow.values = headers;

      // Style header
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "7c3aed" }, // Purple untuk pembagian kelas
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Data rows - Sort berdasarkan NIS dulu, kalau sama baru nama
      const sortedStudents = [...students].sort((a, b) => {
        // Sort NIS dulu
        const nisA = a.nis || "";
        const nisB = b.nis || "";

        if (nisA !== nisB) {
          return nisA.localeCompare(nisB, undefined, { numeric: true });
        }

        // Kalau NIS sama, sort berdasarkan nama
        return (a.nama_lengkap || "").localeCompare(b.nama_lengkap || "");
      });

      sortedStudents.forEach((student, index) => {
        const row = worksheet.getRow(11 + index);
        row.values = [
          index + 1,
          student.nis || "-", // 🔥 NIS TERISI DARI DATA SISWA
          student.nama_lengkap || "-",
          className,
          student.jenis_kelamin || "-",
        ];

        // Style data rows
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle" };

          // Zebra striping
          if (index % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F8FAFC" },
            };
          }

          // Center alignment untuk kolom tertentu
          if (
            colNumber === 1 ||
            colNumber === 2 ||
            colNumber === 4 ||
            colNumber === 5
          ) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }
        });

        // 🔥 Format NIS sebagai TEXT (bukan number)
        row.getCell(2).numFmt = "@"; // Format sebagai text
      });

      // Tambahkan baris kosong untuk tanda tangan
      const signatureRow = worksheet.getRow(11 + sortedStudents.length + 3);
      worksheet.mergeCells(`D${signatureRow.number}:E${signatureRow.number}`);
      const signCell = worksheet.getCell(`D${signatureRow.number}`);
      signCell.value = "Wali Kelas";
      signCell.alignment = { horizontal: "center", vertical: "middle" };
      signCell.font = { bold: true, size: 11 };

      const signNameRow = worksheet.getRow(11 + sortedStudents.length + 8);
      worksheet.mergeCells(`D${signNameRow.number}:E${signNameRow.number}`);
      const signNameCell = worksheet.getCell(`D${signNameRow.number}`);
      signNameCell.value = "(............................)";
      signNameCell.alignment = { horizontal: "center", vertical: "middle" };
      signNameCell.font = { size: 11 };
    });

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Download file
    const fileName = `Pembagian_Kelas_7_TA_${academicYear.replace("/", "-")}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    if (showToast) {
      showToast(
        `✅ Berhasil export ${sortedClasses.length} kelas dengan NIS: ${fileName}`,
        "success"
      );
    }

    return true;
  } catch (error) {
    console.error("Error exporting class division:", error);
    if (showToast) {
      showToast("❌ Gagal export pembagian kelas. Silakan coba lagi.", "error");
    }
    return false;
  }
};

// src/pages/GradesExcel.js - Utility Functions for Excel Import/Export
import ExcelJS from "exceljs";
import { supabase } from "../supabaseClient";

// Calculate NA
// Perubahan: uts -> psts, uas -> psas
const calculateNA = (nh1, nh2, nh3, psts, psas) => {
  const nhAvg =
    (parseFloat(nh1 || 0) + parseFloat(nh2 || 0) + parseFloat(nh3 || 0)) / 3;
  // Perubahan: uts -> psts, uas -> psas
  const na =
    nhAvg * 0.4 + parseFloat(psts || 0) * 0.3 + parseFloat(psas || 0) * 0.3;
  return na.toFixed(2);
};

// Export to Excel - REVISI: Mengambil teacherId untuk fetch full_name
export const exportToExcel = async (params) => {
  const {
    students,
    grades,
    selectedSubject,
    selectedClass,
    className,
    academicYear,
    semester,
    teacherId, // Terima teacherId
    isSubjectTeacher = true,
  } = params;

  try {
    // NEW LOGIC: Fetch teacher full name from 'users' table using teacherId
    let teacherFullName = "";
    if (teacherId) {
      const { data: teacherUser, error: teacherError } = await supabase
        .from("users")
        .select("full_name")
        .eq("teacher_id", teacherId)
        .single();

      if (teacherUser) {
        teacherFullName = teacherUser.full_name;
      } else if (teacherError) {
        console.error("Error fetching teacher name for export:", teacherError);
      }
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Nilai Siswa");

    // HEADER: Nama Sekolah
    worksheet.mergeCells("A1:I1");
    const schoolCell = worksheet.getCell("A1");
    schoolCell.value = "SMP MUSLIMIN CILILIN";
    schoolCell.font = { size: 14, bold: true };
    schoolCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 25;

    // HEADER: Judul Daftar Nilai
    worksheet.mergeCells("A2:I2");
    const titleCell = worksheet.getCell("A2");
    titleCell.value = `DAFTAR NILAI MATA PELAJARAN ${selectedSubject.toUpperCase()} ${className}`;
    titleCell.font = { size: 12, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 20;

    // HEADER: Tahun Ajaran & Semester
    worksheet.mergeCells("A3:I3");
    const academicCell = worksheet.getCell("A3");
    academicCell.value = `TAHUN AJARAN ${academicYear} SEMESTER ${semester}`;
    academicCell.font = { size: 11, bold: true };
    academicCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(3).height = 20;

    // SPACING - KOSONG 1 BARIS
    worksheet.getRow(4).height = 20;

    // Headers Tabel - dimulai di row 5
    // Perubahan: UTS -> PSTS, UAS -> PSAS
    const headers = [
      "No",
      "NIS",
      "Nama Siswa",
      "NH1",
      "NH2",
      "NH3",
      "PSTS",
      "PSAS",
      "NA",
    ];
    const headerRow = worksheet.getRow(5);

    // STYLING PER CELL
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "10B981" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    headerRow.height = 25;

    // Column widths
    worksheet.columns = [
      { width: 6 }, // A - No
      { width: 15 }, // B - NIS
      { width: 38 }, // C - Nama Siswa
      { width: 8 }, // D - NH1
      { width: 8 }, // E - NH2
      { width: 8 }, // F - NH3
      { width: 8 }, // G - PSTS
      { width: 8 }, // H - PSAS
      { width: 8 }, // I - NA
    ];

    // Add students data
    students.forEach((student, index) => {
      const studentGrades = grades[student.id] || {};
      const na = studentGrades.na || "0.00";

      const row = worksheet.addRow([
        index + 1,
        student.nis,
        student.full_name,
        studentGrades.NH1?.score || "",
        studentGrades.NH2?.score || "",
        studentGrades.NH3?.score || "",
        studentGrades.PSTS?.score || "",
        studentGrades.PSAS?.score || "",
        na,
      ]);

      // Style rows
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (colNumber <= 3) {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        } else {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }

        // Color coding for NA
        if (colNumber === 9) {
          const naValue = parseFloat(na);
          if (naValue < 70) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FEE2E2" },
            };
            cell.font = { bold: true, color: { argb: "DC2626" } };
          } else if (naValue < 85) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FEF3C7" },
            };
            cell.font = { bold: true, color: { argb: "D97706" } };
          } else {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "D1FAE5" },
            };
            cell.font = { bold: true, color: { argb: "059669" } };
          }
        }
      });
    });

    // FOOTER SECTION - REVISI TINGGI BARIS DAN NAMA GURU
    const lastTableRow = 5 + students.length;

    // 2 BARIS KOSONG SETELAH TABEL
    worksheet.getRow(lastTableRow + 1).height = 20;
    worksheet.getRow(lastTableRow + 2).height = 20;

    // FOOTER - di kolom F
    const footerRow1 = worksheet.getRow(lastTableRow + 3);
    const footerCell1 = footerRow1.getCell(6); // Kolom F
    footerCell1.value = "Mengetahui,";
    footerCell1.font = { bold: true };

    const footerRow2 = worksheet.getRow(lastTableRow + 4);
    const footerCell2 = footerRow2.getCell(6); // Kolom F

    // Pilih antara Guru Mapel atau Wali Kelas
    if (isSubjectTeacher) {
      footerCell2.value = "Guru Mata Pelajaran";
    } else {
      footerCell2.value = "Wali Kelas";
    }
    footerCell2.font = { bold: true };

    // BARIS KOSONG UNTUK TANDA TANGAN
    worksheet.getRow(lastTableRow + 5).height = 20;

    // NAMA GURU/WALI KELAS - MENGGUNAKAN NAMA YANG SUDAH DI-FETCH
    const footerRow3 = worksheet.getRow(lastTableRow + 6);
    const footerCell3 = footerRow3.getCell(6); // Kolom F
    footerCell3.value = `(${teacherFullName})`; // Menggunakan teacherFullName
    footerCell3.font = { bold: true };

    // Generate & download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Nilai_${selectedSubject}_${selectedClass}_${academicYear}_S${semester}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Data nilai berhasil diekspor!" };
  } catch (error) {
    return {
      success: false,
      message: "Gagal mengekspor data: " + error.message,
    };
  }
};

// Import from Excel (tetap sama seperti sebelumnya)
export const importFromExcel = async (file, params) => {
  const {
    students,
    teacherId,
    selectedSubject,
    selectedClass,
    academicYear,
    semester,
  } = params;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error("Sheet tidak ditemukan dalam file Excel");
    }

    // Get teacher UUID
    const { data: teacherUser, error: teacherError } = await supabase
      .from("users")
      .select("id")
      .eq("teacher_id", teacherId)
      .single();

    if (teacherError) throw teacherError;

    // Create NIS to student ID map
    const nisToIdMap = {};
    students.forEach((student) => {
      nisToIdMap[student.nis] = student.id;
    });

    const gradesToInsert = [];
    let processedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process rows (start from row 5, skip headers)
    for (let i = 5; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);

      // Skip empty rows
      const nis = row.getCell(2).value?.toString().trim();
      if (!nis) continue;

      const studentId = nisToIdMap[nis];
      if (!studentId) {
        skippedCount++;
        errors.push(`Baris ${i}: NIS ${nis} tidak ditemukan`);
        continue;
      }

      // Get grades
      const nh1 = parseFloat(row.getCell(4).value) || 0;
      const nh2 = parseFloat(row.getCell(5).value) || 0;
      const nh3 = parseFloat(row.getCell(6).value) || 0;
      const psts = parseFloat(row.getCell(7).value) || 0;
      const psas = parseFloat(row.getCell(8).value) || 0;

      // Validate scores
      const scores = { NH1: nh1, NH2: nh2, NH3: nh3, PSTS: psts, PSAS: psas };
      let hasValidScore = false;

      for (const [type, score] of Object.entries(scores)) {
        if (score > 0) {
          if (score < 0 || score > 100) {
            errors.push(
              `Baris ${i}: ${type} tidak valid (${score}), harus 0-100`
            );
            continue;
          }

          hasValidScore = true;
          gradesToInsert.push({
            student_id: studentId,
            teacher_id: teacherUser.id,
            class_id: selectedClass,
            subject: selectedSubject,
            assignment_type: type,
            score: score,
            semester: semester,
            academic_year: academicYear,
          });
        }
      }

      if (hasValidScore) processedCount++;
    }

    if (gradesToInsert.length === 0) {
      throw new Error(
        "Tidak ada data nilai yang valid untuk diimport. Pastikan format Excel sesuai."
      );
    }

    // Delete existing grades
    await supabase
      .from("grades")
      .delete()
      .eq("teacher_id", teacherUser.id)
      .eq("subject", selectedSubject)
      .eq("class_id", selectedClass)
      .eq("semester", semester)
      .eq("academic_year", academicYear);

    // Insert new grades in batches
    const BATCH_SIZE = 10;
    let successCount = 0;

    for (let i = 0; i < gradesToInsert.length; i += BATCH_SIZE) {
      const batch = gradesToInsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("grades").insert(batch);

      if (error) {
        throw new Error(`Gagal menyimpan batch: ${error.message}`);
      }
      successCount += batch.length;
    }

    let message = `Berhasil mengimport ${successCount} nilai dari ${processedCount} siswa!`;
    if (skippedCount > 0) {
      message += ` (${skippedCount} siswa dilewati)`;
    }

    return { success: true, message, errors };
  } catch (error) {
    return {
      success: false,
      message: "Gagal mengimport data: " + error.message,
    };
  }
};

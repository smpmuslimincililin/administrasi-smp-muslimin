import ExcelJS from "exceljs";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const FULL_DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jum'at"];

/**
 * Export ITM Report to Excel - Single Sheet untuk Print
 * @param {Object} reportData - Data laporan dari ITMReport component
 */
export const exportITMReportToExcel = async (reportData) => {
  try {
    const workbook = new ExcelJS.Workbook();

    // Metadata
    workbook.creator = "SMP Muslimin Cililin";
    workbook.created = new Date();

    // Create 1 sheet untuk semua minggu
    const worksheet = workbook.addWorksheet("Laporan ITM", {
      pageSetup: {
        paperSize: 9, // A4
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3,
        },
      },
    });

    let currentRow = 1;

    // ============ HEADER UTAMA (Hanya 1x di paling atas) ============
    worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = "JUMLAH JAM TATAP MUKA GURU SMP MUSLIMIN CILILIN";
    titleCell.font = { name: "Arial", size: 14, bold: true };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
    const yearCell = worksheet.getCell(`A${currentRow}`);
    yearCell.value = "TAHUN AJARAN 2025/2026";
    yearCell.font = { name: "Arial", size: 11, bold: true };
    yearCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(currentRow).height = 20;
    currentRow++;

    // Empty row
    worksheet.getRow(currentRow).height = 10;
    currentRow++;

    // Info Guru & Bulan (1x aja)
    const guruRow = worksheet.getCell(`A${currentRow}`);
    guruRow.value = `NAMA GURU : ${reportData.teacher.full_name}`;
    guruRow.font = { name: "Arial", size: 10, bold: true };
    worksheet.getRow(currentRow).height = 18;
    currentRow++;

    const bulanRow = worksheet.getCell(`A${currentRow}`);
    bulanRow.value = `BULAN : ${reportData.month} ${reportData.year}`;
    bulanRow.font = { name: "Arial", size: 10, bold: true };
    worksheet.getRow(currentRow).height = 18;
    currentRow++;

    // Empty row
    worksheet.getRow(currentRow).height = 12;
    currentRow++;

    // Hitung total jam per hari
    const calculateJamPerHari = (weekSchedule, dayName) => {
      let total = 0;
      weekSchedule.forEach((jam) => {
        const dayData = jam.days[dayName];
        if (
          dayData &&
          dayData.kelas &&
          dayData.kelas !== "" &&
          dayData.kelas !== "UPACARA"
        ) {
          total++;
        }
      });
      return total;
    };

    // ============ LOOP SETIAP MINGGU ============
    reportData.weeks.forEach((week, weekIdx) => {
      // Label Minggu (tanpa info guru & bulan lagi)
      const mingguLabel = worksheet.getCell(`A${currentRow}`);
      mingguLabel.value = `Minggu ${week.weekNumber}`;
      mingguLabel.font = { name: "Arial", size: 10, bold: true };
      worksheet.getRow(currentRow).height = 18;
      currentRow++;

      // Empty row kecil
      worksheet.getRow(currentRow).height = 5;
      currentRow++;

      // ============ TABLE HEADER ============
      const headerRow = worksheet.getRow(currentRow);
      headerRow.height = 22;

      // Header kolom JAM
      const jamHeader = worksheet.getCell(currentRow, 1);
      jamHeader.value = "JAM";
      jamHeader.font = { name: "Arial", size: 10, bold: true };
      jamHeader.alignment = { vertical: "middle", horizontal: "center" };
      jamHeader.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" },
      };
      jamHeader.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // Header kolom hari
      let colIndex = 2;
      DAYS.forEach((day, idx) => {
        // Kolom KLS
        const klsCell = worksheet.getCell(currentRow, colIndex);
        klsCell.value = "KLS";
        klsCell.font = { name: "Arial", size: 10, bold: true };
        klsCell.alignment = { vertical: "middle", horizontal: "center" };
        klsCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9D9D9" },
        };
        klsCell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Kolom Nama Hari
        const dayCell = worksheet.getCell(currentRow, colIndex + 1);
        dayCell.value = FULL_DAY_NAMES[idx];
        dayCell.font = { name: "Arial", size: 10, bold: true };
        dayCell.alignment = { vertical: "middle", horizontal: "center" };
        dayCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9D9D9" },
        };
        dayCell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        colIndex += 2;
      });

      currentRow++;

      // ============ TABLE BODY ============
      week.schedule.forEach((jamRow) => {
        const row = worksheet.getRow(currentRow);
        row.height = 18;

        // Kolom JAM
        const jamCell = worksheet.getCell(currentRow, 1);
        jamCell.value = jamRow.jamKe;
        jamCell.font = { name: "Arial", size: 9, bold: true };
        jamCell.alignment = { vertical: "middle", horizontal: "center" };
        jamCell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Kolom hari
        let colIdx = 2;
        DAYS.forEach((day) => {
          const dayData = jamRow.days[day];
          const isUpacara = dayData?.kelas === "UPACARA";

          // Kolom KLS
          const klsCell = worksheet.getCell(currentRow, colIdx);
          klsCell.value = dayData?.kelas || "-";
          klsCell.font = { name: "Arial", size: 9 };
          klsCell.alignment = { vertical: "middle", horizontal: "center" };
          klsCell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          // Kolom Kehadiran
          const attendCell = worksheet.getCell(currentRow, colIdx + 1);
          if (isUpacara) {
            attendCell.value = "";
          } else if (dayData?.hadir) {
            attendCell.value = "✓";
            attendCell.font = {
              name: "Arial",
              size: 12,
              bold: true,
              color: { argb: "FF22C55E" },
            };
          } else if (dayData?.status && dayData.status !== "Hadir") {
            // Tampilkan status: Sakit, Izin, Alpa
            attendCell.value = dayData.status;
            attendCell.font = {
              name: "Arial",
              size: 9,
              bold: true,
              color: { argb: "FFDC2626" }, // Merah
            };
          } else if (dayData?.kelas && dayData.kelas !== "") {
            attendCell.value = "☐";
            attendCell.font = { name: "Arial", size: 10 };
          } else {
            attendCell.value = "-";
            attendCell.font = {
              name: "Arial",
              size: 9,
              color: { argb: "FF9CA3AF" },
            };
          }
          attendCell.alignment = { vertical: "middle", horizontal: "center" };
          attendCell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          colIdx += 2;
        });

        currentRow++;
      });

      // ============ ROW JUMLAH ============
      const jumlahRow = worksheet.getRow(currentRow);
      jumlahRow.height = 20;

      // Hitung total minggu
      const totalMinggu = DAYS.reduce(
        (total, day) => total + calculateJamPerHari(week.schedule, day),
        0
      );

      // Kolom JAM (JUMLAH : XX)
      const jumlahCell = worksheet.getCell(currentRow, 1);
      jumlahCell.value = `JUMLAH : ${totalMinggu}`;
      jumlahCell.font = { name: "Arial", size: 9, bold: true };
      jumlahCell.alignment = { vertical: "middle", horizontal: "center" };
      jumlahCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3F4F6" },
      };
      jumlahCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // Kolom jumlah per hari
      let colIdx = 2;
      DAYS.forEach((day) => {
        const jamPerHari = calculateJamPerHari(week.schedule, day);

        // Kolom KLS (jumlah)
        const jumlahDayCell = worksheet.getCell(currentRow, colIdx);
        jumlahDayCell.value = jamPerHari;
        jumlahDayCell.font = { name: "Arial", size: 9, bold: true };
        jumlahDayCell.alignment = { vertical: "middle", horizontal: "center" };
        jumlahDayCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" },
        };
        jumlahDayCell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Kolom paraf (kosong)
        const emptyCell = worksheet.getCell(currentRow, colIdx + 1);
        emptyCell.value = "";
        emptyCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" },
        };
        emptyCell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        colIdx += 2;
      });

      currentRow++;

      // Spacing antar minggu (lebih kecil)
      if (weekIdx < reportData.weeks.length - 1) {
        worksheet.getRow(currentRow).height = 10;
        currentRow++;
      }
    });

    // ============ TOTAL KESELURUHAN ============
    worksheet.getRow(currentRow).height = 12;
    currentRow++;

    // Hitung total
    const calculateOverallTotal = () => {
      let total = 0;
      reportData.weeks.forEach((week) => {
        DAYS.forEach((day) => {
          total += calculateJamPerHari(week.schedule, day);
        });
      });
      return total;
    };

    const calculateTotalHadir = () => {
      let total = 0;
      reportData.weeks.forEach((week) => {
        week.schedule.forEach((jam) => {
          DAYS.forEach((day) => {
            const dayData = jam.days[day];
            if (
              dayData &&
              dayData.hadir &&
              dayData.kelas &&
              dayData.kelas !== "" &&
              dayData.kelas !== "UPACARA"
            ) {
              total++;
            }
          });
        });
      });
      return total;
    };

    const totalTerjadwal = calculateOverallTotal();
    const totalHadir = calculateTotalHadir();
    const totalTidakHadir = totalTerjadwal - totalHadir;
    const persenHadir =
      totalTerjadwal > 0 ? ((totalHadir / totalTerjadwal) * 100).toFixed(1) : 0;
    const persenTidakHadir =
      totalTerjadwal > 0
        ? ((totalTidakHadir / totalTerjadwal) * 100).toFixed(1)
        : 0;

    // Header TOTAL
    worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
    const totalHeader = worksheet.getCell(`A${currentRow}`);
    totalHeader.value = "TOTAL KESELURUHAN";
    totalHeader.font = { name: "Arial", size: 12, bold: true };
    totalHeader.alignment = { vertical: "middle", horizontal: "center" };
    totalHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDBEAFE" },
    };
    totalHeader.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getRow(currentRow).height = 22;
    currentRow++;

    // Data summary (lebih compact)
    const summaryData = [
      ["Jam Terjadwal:", `${totalTerjadwal} Jam`],
      ["Jam Hadir:", `${totalHadir} Jam (${persenHadir}%)`],
      ["Jam Tidak Hadir:", `${totalTidakHadir} Jam (${persenTidakHadir}%)`],
    ];

    summaryData.forEach((row) => {
      worksheet.getCell(currentRow, 1).value = row[0];
      worksheet.getCell(currentRow, 1).font = {
        name: "Arial",
        size: 10,
        bold: true,
      };

      worksheet.mergeCells(`B${currentRow}:K${currentRow}`);
      worksheet.getCell(currentRow, 2).value = row[1];
      worksheet.getCell(currentRow, 2).font = { name: "Arial", size: 10 };

      worksheet.getRow(currentRow).height = 18;
      currentRow++;
    });

    // ============ COLUMN WIDTHS ============
    worksheet.getColumn(1).width = 12; // JAM
    for (let i = 2; i <= 11; i++) {
      worksheet.getColumn(i).width = 8; // KLS & Hari
    }

    // ============ DOWNLOAD FILE ============
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_ITM_${reportData.teacher.full_name.replace(
      /\s+/g,
      "_"
    )}_${reportData.month}_${reportData.year}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};

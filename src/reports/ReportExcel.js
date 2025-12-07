import ExcelJS from 'exceljs';

const exportToExcel = async (data, headers, metadata, options = {}) => {
  const {
    role = 'admin',
    reportType = 'general',
    styling = 'default'
  } = options;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan');

    // Set column widths based on role and report type
    const columnWidths = getColumnWidths(headers);
    worksheet.columns = columnWidths;

    let currentRow = 1;

    // ==================== HEADER SECTION ====================
    await addHeaderSection(worksheet, currentRow, metadata, role);
    currentRow = await getLastRow(worksheet);

    // ==================== SUMMARY SECTION ====================
    if (metadata.summary && metadata.summary.length > 0) {
      currentRow = await addSummarySection(worksheet, currentRow, metadata.summary, role);
    }

    // ==================== TABLE HEADERS ====================
    currentRow = await addTableHeaders(worksheet, currentRow, headers, role, reportType);

    // ==================== DATA ROWS ====================
    currentRow = await addDataRows(worksheet, currentRow, data, headers, role, reportType);

    // ==================== SPECIAL SECTIONS ====================
    if (role === 'bk' && reportType === 'counseling') {
      currentRow = await addBKSpecialSection(worksheet, currentRow, data);
    }

    // ==================== FOOTER ====================
    await addFooter(worksheet, currentRow, role);

    // Auto-fit columns
    await autoFitColumns(worksheet, headers, data, role);

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = generateFilename(metadata, role, reportType);
    link.click();
    URL.revokeObjectURL(link.href);

    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error(`Gagal export ke Excel: ${error.message}`);
  }
};

// ==================== HELPER FUNCTIONS ====================

// ✅ FIXED: Added Class Performance column widths
const getColumnWidths = (headers) => {
  const defaultWidth = 12;
  const headerWidthMap = {
    'Tahun Ajaran': 14,
    'Semester': 10,
    'NIS': 12,
    'Nama Siswa': 20,
    'Nama Lengkap': 20,
    'Kelas': 10,
    'Mata Pelajaran': 18,
    'Jenis': 12,
    'Nilai': 8,
    'Nilai Akhir': 12,
    'Guru': 15,
    'Tanggal': 12,
    'Status': 12,
    'Status Kehadiran': 12,
    'Persentase': 10,
    'Hadir': 8,
    'Sakit': 8,
    'Izin': 8,
    'Absen': 8,
    'Tidak Hadir': 12,
    'Total': 8,
    'Username': 12,
    'Role': 10,
    'Wali Kelas': 12,
    'Tanggal Bergabung': 14,
    'Total Nilai': 12,
    'Rata-rata Nilai': 14,
    'Total Presensi': 12,
    'Tingkat Kehadiran': 14,
    'Jenis Kelamin': 12,
    'Gender': 10,
    'Tingkat': 8,
    'Kode Guru': 10,
    'Teacher ID': 10,
    
    // ✅ ADD: Class Performance columns
    'Jumlah Siswa': 12,
    'Rata-rata': 12,
    'Tertinggi': 10,
    'Terendah': 10,
    'Di Bawah KKM': 14
  };

  return headers.map(header => ({
    width: headerWidthMap[header] || defaultWidth
  }));
};

const addHeaderSection = async (worksheet, startRow, metadata, role) => {
  let currentRow = startRow;

  // Title Row
  const titleRow = worksheet.getRow(currentRow++);
  titleRow.getCell(1).value = metadata.title || 'LAPORAN';
  titleRow.getCell(1).font = { 
    size: 16, 
    bold: true, 
    color: { argb: 'FF1E3A8A' } 
  };
  titleRow.height = 25;
  worksheet.mergeCells(`A${currentRow-1}:M${currentRow-1}`);

  // School Row
  const schoolRow = worksheet.getRow(currentRow++);
  schoolRow.getCell(1).value = 'SMP MUSLIMIN CILILIN';
  schoolRow.getCell(1).font = { size: 12, bold: true };
  worksheet.mergeCells(`A${currentRow-1}:M${currentRow-1}`);

  // Additional metadata
  if (metadata.academicYear) {
    const yearRow = worksheet.getRow(currentRow++);
    yearRow.getCell(1).value = `Tahun Ajaran: ${metadata.academicYear}`;
    yearRow.getCell(1).font = { size: 10 };
    worksheet.mergeCells(`A${currentRow-1}:M${currentRow-1}`);
  }

  if (metadata.semester) {
    const semesterRow = worksheet.getRow(currentRow++);
    semesterRow.getCell(1).value = `Semester: ${metadata.semester}`;
    semesterRow.getCell(1).font = { size: 10 };
    worksheet.mergeCells(`A${currentRow-1}:M${currentRow-1}`);
  }

  // Date Row
  const dateRow = worksheet.getRow(currentRow++);
  dateRow.getCell(1).value = `Dicetak: ${new Date().toLocaleDateString('id-ID', { 
    dateStyle: 'full', 
    timeZone: 'Asia/Jakarta' 
  })}`;
  dateRow.getCell(1).font = { size: 9, italic: true };
  worksheet.mergeCells(`A${currentRow-1}:M${currentRow-1}`);

  // Filter info
  if (metadata.filters) {
    const filterRow = worksheet.getRow(currentRow++);
    filterRow.getCell(1).value = `Filter: ${metadata.filters}`;
    filterRow.getCell(1).font = { size: 9, italic: true, color: { argb: 'FF64748B' } };
    worksheet.mergeCells(`A${currentRow-1}:M${currentRow-1}`);
  }

  currentRow++;
  return currentRow;
};

const addSummarySection = async (worksheet, startRow, summary, role) => {
  let currentRow = startRow;

  const summaryTitleRow = worksheet.getRow(currentRow++);
  summaryTitleRow.getCell(1).value = 'RINGKASAN DATA';
  summaryTitleRow.getCell(1).font = { size: 11, bold: true };
  summaryTitleRow.height = 20;
  worksheet.mergeCells(`A${currentRow-1}:B${currentRow-1}`);

  summary.forEach(stat => {
    const statRow = worksheet.getRow(currentRow++);
    statRow.getCell(1).value = stat.label;
    statRow.getCell(2).value = stat.value;
    statRow.getCell(1).font = { bold: true };
    statRow.getCell(2).font = { bold: true, color: { argb: 'FF4F46E5' } };
  });

  currentRow++;
  return currentRow;
};

const addTableHeaders = async (worksheet, startRow, headers, role, reportType) => {
  const headerRow = worksheet.getRow(startRow);
  
  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header;
    
    const headerStyle = getHeaderStyle(role, reportType);
    cell.fill = headerStyle.fill;
    cell.font = headerStyle.font;
    cell.border = headerStyle.border;
    cell.alignment = headerStyle.alignment;
  });
  
  headerRow.height = 25;
  return startRow + 1;
};

const getHeaderStyle = (role, reportType) => {
  const baseStyle = {
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    },
    font: { 
      bold: true, 
      color: { argb: 'FFFFFFFF' }, 
      size: 11 
    },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    },
    alignment: { vertical: 'middle', horizontal: 'center' }
  };

  if (role === 'bk') {
    baseStyle.fill.fgColor = { argb: 'FF8B5CF6' };
  } else if (role === 'teacher') {
    baseStyle.fill.fgColor = { argb: 'FF10B981' };
  } else if (role === 'homeroom') {
    baseStyle.fill.fgColor = { argb: 'FFF59E0B' };
  }

  return baseStyle;
};

const addDataRows = async (worksheet, startRow, data, headers, role, reportType) => {
  let currentRow = startRow;

  data.forEach((row, rowIdx) => {
    const dataRow = worksheet.getRow(currentRow++);
    
    Object.values(row).forEach((value, colIdx) => {
      const cell = dataRow.getCell(colIdx + 1);
      cell.value = value !== undefined && value !== null ? value : '-';
      
      applyConditionalFormatting(cell, headers[colIdx], value, role, reportType);
      
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });

    if (rowIdx % 2 === 0) {
      dataRow.eachCell(cell => {
        if (!cell.fill || !cell.fill.fgColor || cell.fill.fgColor.argb === 'FFFFFFFF') {
          cell.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: 'FFF8FAFC' } 
          };
        }
      });
    }
  });

  return currentRow;
};

// ✅ FIXED: Support untuk Class Performance columns
const applyConditionalFormatting = (cell, header, value, role, reportType) => {
  // Formatting untuk percentage (Persentase, Tingkat Kehadiran)
  if ((header === 'Persentase' || header === 'Tingkat Kehadiran') && typeof value === 'string' && value.includes('%')) {
    const pct = parseFloat(value);
    if (pct >= 90) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      cell.font = { color: { argb: 'FF065F46' }, bold: true };
    } else if (pct >= 75) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      cell.font = { color: { argb: 'FF92400E' }, bold: true };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
      cell.font = { color: { argb: 'FF991B1B' }, bold: true };
    }
  }

  // ✅ UPDATED: Formatting untuk semua kolom nilai (including class-performance)
  if ((header === 'Nilai' || header === 'Nilai Akhir' || header === 'Rata-rata Nilai' || 
       header === 'Rata-rata' || header === 'Tertinggi' || header === 'Terendah' || 
       header === 'score') && typeof value === 'number') {
    if (value >= 85) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      cell.font = { color: { argb: 'FF065F46' }, bold: true };
    } else if (value >= 70) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      cell.font = { color: { argb: 'FF92400E' }, bold: true };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
      cell.font = { color: { argb: 'FF991B1B' }, bold: true };
    }
  }

  // ✅ ADD: Formatting untuk "Di Bawah KKM"
  if (header === 'Di Bawah KKM' && typeof value === 'number') {
    if (value > 0) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
      cell.font = { color: { argb: 'FF991B1B' }, bold: true };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      cell.font = { color: { argb: 'FF065F46' }, bold: true };
    }
  }

  // BK-specific formatting
  if (role === 'bk' && (header === 'Tingkat Urgensi' || header === 'Urgensi')) {
    if (value === 'Darurat') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
      cell.font = { color: { argb: 'FF991B1B' }, bold: true };
    } else if (value === 'Tinggi') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFED7AA' } };
      cell.font = { color: { argb: 'FF9A3412' }, bold: true };
    } else if (value === 'Sedang') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      cell.font = { color: { argb: 'FF92400E' }, bold: true };
    } else if (value === 'Rendah') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      cell.font = { color: { argb: 'FF065F46' }, bold: true };
    }
  }

  if (role === 'bk' && (header === 'Kategori Masalah' || header === 'Kategori')) {
    const categoryColors = {
      'Akademik': { bg: 'FFDBEAFE', fg: 'FF6B21A8' },
      'Perilaku': { bg: 'FFFECACA', fg: 'FF991B1B' },
      'Sosial-Emosional': { bg: 'FFE9D5FF', fg: 'FF7E22CE' },
      'Pertemanan': { bg: 'FFC7D2FE', fg: 'FF4338CA' },
      'Keluarga': { bg: 'FFFDE68A', fg: 'FF92400E' },
      'Percintaan': { bg: 'FFFBCFE8', fg: 'FF9F1239' },
      'Teknologi/Gadget': { bg: 'FFCFFAFE', fg: 'FF155E75' },
      'Kenakalan': { bg: 'FFE5E7EB', fg: 'FF374151' },
      'Kesehatan Mental': { bg: 'FFDDD6FE', fg: 'FF6D28D9' },
      'Lainnya': { bg: 'FFF3F4F6', fg: 'FF6B7280' }
    };

    const color = categoryColors[value];
    if (color) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.bg } };
      cell.font = { color: { argb: color.fg }, bold: true };
    }
  }

  if (role === 'bk' && (header === 'Status Layanan' || header === 'Status')) {
    if (value === 'Selesai') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      cell.font = { color: { argb: 'FF065F46' }, bold: true };
    } else if (value === 'Dalam Proses') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      cell.font = { color: { argb: 'FF92400E' }, bold: true };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
      cell.font = { color: { argb: 'FF3730A3' }, bold: true };
    }
  }

  if (role === 'bk' && header === 'Follow-up') {
    if (value === 'Ya') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9D5FF' } };
      cell.font = { color: { argb: 'FF7E22CE' }, bold: true };
    } else if (value === 'Tidak') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      cell.font = { color: { argb: 'FF6B7280' } };
    }
  }
};

const addBKSpecialSection = async (worksheet, startRow, data) => {
  let currentRow = startRow;
  
  currentRow++;
  
  const insightRow = worksheet.getRow(currentRow++);
  insightRow.getCell(1).value = 'INSIGHT KONSELING';
  insightRow.getCell(1).font = { size: 11, bold: true, color: { argb: 'FF8B5CF6' } };
  worksheet.mergeCells(`A${currentRow-1}:M${currentRow-1}`);
  
  const urgencyCount = {
    darurat: data.filter(d => d.urgensi === 'Darurat').length,
    tinggi: data.filter(d => d.urgensi === 'Tinggi').length,
    sedang: data.filter(d => d.urgensi === 'Sedang').length,
    rendah: data.filter(d => d.urgensi === 'Rendah').length
  };

  const categoryCount = {};
  data.forEach(d => {
    const cat = d.kategori || 'Lainnya';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
  
  const urgencyRow = worksheet.getRow(currentRow++);
  urgencyRow.getCell(1).value = 'Distribusi Urgensi:';
  urgencyRow.getCell(2).value = `Darurat: ${urgencyCount.darurat} | Tinggi: ${urgencyCount.tinggi} | Sedang: ${urgencyCount.sedang} | Rendah: ${urgencyCount.rendah}`;
  urgencyRow.getCell(1).font = { bold: true };
  worksheet.mergeCells(`B${currentRow-1}:M${currentRow-1}`);

  if (topCategory) {
    const categoryRow = worksheet.getRow(currentRow++);
    categoryRow.getCell(1).value = 'Kategori Tertinggi:';
    categoryRow.getCell(2).value = `${topCategory[0]} (${topCategory[1]} kasus)`;
    categoryRow.getCell(1).font = { bold: true };
    categoryRow.getCell(2).font = { color: { argb: 'FF8B5CF6' }, bold: true };
    worksheet.mergeCells(`B${currentRow-1}:M${currentRow-1}`);
  }

  const followupCount = data.filter(d => d.followup === 'Ya').length;
  if (followupCount > 0) {
    const followupRow = worksheet.getRow(currentRow++);
    followupRow.getCell(1).value = 'Perlu Follow-up:';
    followupRow.getCell(2).value = `${followupCount} siswa memerlukan konseling lanjutan`;
    followupRow.getCell(1).font = { bold: true };
    followupRow.getCell(2).font = { color: { argb: 'FF7E22CE' }, bold: true };
    worksheet.mergeCells(`B${currentRow-1}:M${currentRow-1}`);
  }
  
  return currentRow;
};

const addFooter = async (worksheet, startRow, role) => {
  const footerRow = worksheet.getRow(startRow + 2);
  footerRow.getCell(1).value = `Generated by SMP Muslimin Cililin - ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
  footerRow.getCell(1).font = { size: 8, italic: true, color: { argb: 'FF94A3B8' } };
  worksheet.mergeCells(`A${startRow + 2}:M${startRow + 2}`);
};

const autoFitColumns = async (worksheet, headers, data, role) => {
  const MIN_WIDTH = 6;
  const MAX_WIDTH = 60;
  const PADDING = 2;

  worksheet.columns.forEach((column, idx) => {
    let maxLength = 0;

    if (headers[idx]) {
      maxLength = headers[idx].toString().length;
    }

    if (data && data.length > 0) {
      data.forEach(row => {
        const keys = Object.keys(row);
        if (keys[idx]) {
          const val = row[keys[idx]];
          if (val) {
            const length = val.toString().length;
            maxLength = Math.max(maxLength, length);
          }
        }
      });
    }

    let width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, maxLength + PADDING));
    
    if (headers[idx] && (headers[idx].includes('Permasalahan') || headers[idx].includes('Hasil'))) {
      width = Math.min(35, width);
    }
    
    column.width = width;
  });
};

// ✅ FIXED: Added class-performance filename
const generateFilename = (metadata, role, reportType) => {
  const roleNames = {
    admin: 'Admin',
    bk: 'BK',
    teacher: 'Guru',
    homeroom: 'WaliKelas'
  };
  
  const reportNames = {
    'teachers': 'DataGuru',
    'students': 'DataSiswa', 
    'attendance-recap': 'RekapKehadiran',
    'attendance': 'PresensiHarian',
    'grades': 'DataNilai',
    'teacher-grades': 'NilaiMapel',
    'teacher-attendance': 'PresensiMapel',
    'teacher-recap': 'RekapitulasiKelas',
    'class-performance': 'PerformaPerKelas', // ✅ ADD
    'counseling': 'DataKonseling'
  };
  
  const timestamp = new Date().toISOString().split('T')[0];
  const reportName = reportNames[reportType] || 'Laporan';
  const roleName = roleNames[role] || 'User';
  
  return `${reportName}_${roleName}_${timestamp}.xlsx`;
};

const getLastRow = async (worksheet) => {
  return worksheet.lastRow ? worksheet.lastRow.number + 1 : 1;
};

const exportToCSV = (data, headers, filename) => {
  const csvHeaders = headers;
  const csvData = data.map(item => 
    headers.map(header => {
      const value = item[header] || '';
      return `"${String(value).replace(/"/g, '""')}"`;
    })
  );

  const csvContent = [csvHeaders, ...csvData]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
};

export { exportToExcel, exportToCSV };
export default exportToExcel;
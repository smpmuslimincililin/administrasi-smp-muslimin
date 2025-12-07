// src/pages/DataExcel.js
import ExcelJS from 'exceljs';

export class DataExcel {
  
  // Helper untuk mendapatkan tahun ajaran aktif
  static getTahunAjaranAktif() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (month >= 7) {
      return `${year}/${year + 1}`;
    } else {
      return `${year - 1}/${year}`;
    }
  }

  // Style untuk header (PUTIH POLOS - NO BORDER)
  static getHeaderStyle() {
    return {
      font: { 
        name: 'Arial', 
        size: 16, 
        bold: true,
        color: { argb: 'FF000000' }
      },
      alignment: { 
        vertical: 'middle', 
        horizontal: 'center' 
      }
      // ✅ TIDAK ADA BORDER & BACKGROUND
    };
  }

  // Style untuk subheader (PUTIH POLOS - NO BORDER)
  static getSubHeaderStyle() {
    return {
      font: { 
        name: 'Arial', 
        size: 12, 
        bold: true,
        color: { argb: 'FF000000' }
      },
      alignment: { 
        vertical: 'middle', 
        horizontal: 'center' 
      }
      // ✅ TIDAK ADA BORDER & BACKGROUND
    };
  }

  // Style untuk table header (DENGAN BACKGROUND)
  static getTableHeaderStyle() {
    return {
      font: { 
        name: 'Arial', 
        size: 10, 
        bold: true,
        color: { argb: 'FFFFFFFF' }
      },
      alignment: { 
        vertical: 'middle', 
        horizontal: 'center' 
      },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E86AB' }
      },
      border: {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } }
      }
    };
  }

  // Style untuk data cells (BORDER JELAS)
  static getDataCellStyle() {
    return {
      font: { 
        name: 'Arial', 
        size: 9 
      },
      alignment: { 
        vertical: 'middle' 
      },
      border: {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
    };
  }

  // ==================== FUNGSI EXPORT KELAS ====================

  static async exportClasses(classesData) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data Kelas');

      // ✅ A4 PORTRAIT dengan CENTER HORIZONTAL
      worksheet.pageSetup = {
        paperSize: 9,
        orientation: 'portrait',
        horizontalCentered: true,
        margins: {
          left: 0.7, right: 0.7,
          top: 0.8, bottom: 0.8,
          header: 0.5, footer: 0.5
        }
      };

      // ✅ COLUMN WIDTHS UNTUK PORTRAIT
      worksheet.columns = [
        { width: 6 },   // No.
        { width: 12 },  // Kelas
        { width: 15 },  // Tahun Ajaran
        { width: 25 },  // Wali Kelas
        { width: 12 },  // Jumlah Siswa
        { width: 12 },  // Laki-laki
        { width: 12 }   // Perempuan
      ];

      // HEADER UTAMA - Baris 1
      worksheet.mergeCells('A1:G1');
      const headerCell = worksheet.getCell('A1');
      headerCell.value = 'SMP MUSLIMIN CILILIN';
      headerCell.style = this.getHeaderStyle();
      worksheet.getRow(1).height = 25;

      // SUBHEADER - Baris 2
      worksheet.mergeCells('A2:G2');
      const subHeaderCell = worksheet.getCell('A2');
      subHeaderCell.value = 'DATA KELAS';
      subHeaderCell.style = this.getSubHeaderStyle();
      worksheet.getRow(2).height = 20;

      // TAHUN AJARAN - Baris 3
      worksheet.mergeCells('A3:G3');
      const infoCell = worksheet.getCell('A3');
      infoCell.value = `TAHUN AJARAN ${this.getTahunAjaranAktif()}`;
      infoCell.style = {
        font: { name: 'Arial', size: 10, bold: true },
        alignment: { vertical: 'middle', horizontal: 'center' }
      };
      worksheet.getRow(3).height = 18;

      // ✅ 2 BARIS KOSONG YANG BENER
      worksheet.getRow(4).height = 15;
      worksheet.getRow(5).height = 15;

      // TABLE HEADER - Baris 6
      const tableHeaderRow = worksheet.getRow(6);
      tableHeaderRow.height = 22;
      
      const headers = ['No.', 'Kelas', 'Tahun Ajaran', 'Wali Kelas', 'Jumlah Siswa', 'Laki-laki', 'Perempuan'];
      headers.forEach((header, index) => {
        const cell = tableHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.style = this.getTableHeaderStyle();
      });

      // DATA KELAS - Mulai Baris 7
      classesData.forEach((kelas, index) => {
        const dataRow = worksheet.getRow(7 + index);
        dataRow.height = 18;
        
        const cells = [
          index + 1,
          kelas.Kelas || '-',
          kelas['Tahun Ajaran'] || '-',
          kelas['Wali Kelas'] || 'Belum ditentukan',
          kelas['Jumlah Siswa'] || 0,
          kelas['Laki-laki'] || 0,
          kelas['Perempuan'] || 0
        ];

        cells.forEach((value, cellIndex) => {
          const cell = dataRow.getCell(cellIndex + 1);
          cell.value = value;
          cell.style = this.getDataCellStyle();
          
          // ✅ KELAS: Center semua kolom
          cell.style.alignment = { ...cell.style.alignment, horizontal: 'center' };
        });
      });

      // Simpan file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Data_Kelas_SMP_Muslimin_${this.getTahunAjaranAktif()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting Kelas Excel:', error);
      throw new Error('Gagal mengexport data kelas ke Excel');
    }
  }

  // ==================== FUNGSI EXPORT SISWA ====================

  static async exportAllStudents(studentsData) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data Siswa');

      // ✅ A4 PORTRAIT
      worksheet.pageSetup = {
        paperSize: 9,
        orientation: 'portrait',
        margins: {
          left: 0.7, right: 0.7,
          top: 0.8, bottom: 0.8,
          header: 0.5, footer: 0.5
        }
      };

      // ✅ COLUMN WIDTHS UNTUK PORTRAIT
      worksheet.columns = [
        { width: 6 },   // No.
        { width: 18 },  // NIS
        { width: 40 },  // Nama
        { width: 10 },  // Kelas
        { width: 20 },  // Jenis Kelamin
        { width: 10 }   // Status
      ];

      // HEADER UTAMA - Baris 1
      worksheet.mergeCells('A1:F1');
      const headerCell = worksheet.getCell('A1');
      headerCell.value = 'SMP MUSLIMIN CILILIN';
      headerCell.style = this.getHeaderStyle();
      worksheet.getRow(1).height = 25;

      // SUBHEADER - Baris 2
      worksheet.mergeCells('A2:F2');
      const subHeaderCell = worksheet.getCell('A2');
      subHeaderCell.value = 'DATA SISWA';
      subHeaderCell.style = this.getSubHeaderStyle();
      worksheet.getRow(2).height = 20;

      // TAHUN AJARAN - Baris 3
      worksheet.mergeCells('A3:F3');
      const infoCell = worksheet.getCell('A3');
      infoCell.value = `TAHUN AJARAN ${this.getTahunAjaranAktif()}`;
      infoCell.style = {
        font: { name: 'Arial', size: 10, bold: true },
        alignment: { vertical: 'middle', horizontal: 'center' }
      };
      worksheet.getRow(3).height = 18;

      // ✅ 2 BARIS KOSONG YANG BENER
      worksheet.getRow(4).height = 15;
      worksheet.getRow(5).height = 15;

      // TABLE HEADER - Baris 6
      const tableHeaderRow = worksheet.getRow(6);
      tableHeaderRow.height = 22;
      
      const headers = ['No.', 'NIS', 'Nama', 'Kelas', 'Jenis Kelamin', 'Status'];
      headers.forEach((header, index) => {
        const cell = tableHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.style = this.getTableHeaderStyle();
      });

      // DATA SISWA - Mulai Baris 7
      studentsData.forEach((student, index) => {
        const dataRow = worksheet.getRow(7 + index);
        dataRow.height = 18;
        
        const cells = [
          index + 1,
          student.nis || '-',
          student.full_name || '-',
          student.class_id || '-',
          student.gender === 'L' ? 'Laki-laki' : 'Perempuan',
          student.is_active ? 'Aktif' : 'Non-Aktif'
        ];

        cells.forEach((value, cellIndex) => {
          const cell = dataRow.getCell(cellIndex + 1);
          cell.value = value;
          cell.style = this.getDataCellStyle();
          
          // ✅ SISWA: Center semua kecuali Nama (index 2)
          if (cellIndex !== 2) {
            cell.style.alignment = { ...cell.style.alignment, horizontal: 'center' };
          }
        });
      });

      // Simpan file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Data_Siswa_SMP_Muslimin_${this.getTahunAjaranAktif()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting Excel:', error);
      throw new Error('Gagal mengexport data ke Excel');
    }
  }

  static async exportByJenjang(studentsData, jenjang) {
    const filteredData = studentsData.filter(student => 
      student.class_id?.startsWith(jenjang)
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Kelas ${jenjang}`);

    // ✅ A4 PORTRAIT
    worksheet.pageSetup = {
      paperSize: 9,
      orientation: 'portrait',
      margins: { left: 0.7, right: 0.7, top: 0.8, bottom: 0.8, header: 0.5, footer: 0.5 }
    };

    // ✅ COLUMN WIDTHS UNTUK PORTRAIT
    worksheet.columns = [
      { width: 6 }, { width: 12 }, { width: 28 }, { width: 10 }, { width: 14 }, { width: 10 }
    ];

    // HEADER
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'SMP MUSLIMIN CILILIN';
    worksheet.getCell('A1').style = this.getHeaderStyle();
    worksheet.getRow(1).height = 25;

    // SUBHEADER
    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `DATA SISWA KELAS ${jenjang}`;
    worksheet.getCell('A2').style = this.getSubHeaderStyle();
    worksheet.getRow(2).height = 20;

    // TAHUN AJARAN
    worksheet.mergeCells('A3:F3');
    worksheet.getCell('A3').value = `TAHUN AJARAN ${this.getTahunAjaranAktif()}`;
    worksheet.getCell('A3').style = {
      font: { name: 'Arial', size: 10, bold: true },
      alignment: { vertical: 'middle', horizontal: 'center' }
    };
    worksheet.getRow(3).height = 18;

    // ✅ 2 BARIS KOSONG YANG BENER
    worksheet.getRow(4).height = 15;
    worksheet.getRow(5).height = 15;

    // TABLE HEADER
    const tableHeaderRow = worksheet.getRow(6);
    tableHeaderRow.height = 22;
    const headers = ['No.', 'NIS', 'Nama', 'Kelas', 'Jenis Kelamin', 'Status'];
    headers.forEach((header, index) => {
      const cell = tableHeaderRow.getCell(index + 1);
      cell.value = header;
      cell.style = this.getTableHeaderStyle();
    });

    // DATA
    filteredData.forEach((student, index) => {
      const dataRow = worksheet.getRow(7 + index);
      dataRow.height = 18;
      
      const cells = [
        index + 1,
        student.nis || '-',
        student.full_name || '-',
        student.class_id || '-',
        student.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        student.is_active ? 'Aktif' : 'Non-Aktif'
      ];

      cells.forEach((value, cellIndex) => {
        const cell = dataRow.getCell(cellIndex + 1);
        cell.value = value;
        cell.style = this.getDataCellStyle();
        
        // ✅ SISWA: Center semua kecuali Nama (index 2)
        if (cellIndex !== 2) {
          cell.style.alignment = { ...cell.style.alignment, horizontal: 'center' };
        }
      });
    });

    // Simpan file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Siswa_Kelas_${jenjang}_SMP_Muslimin_${this.getTahunAjaranAktif()}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  static async exportByKelas(studentsData, kelas) {
    const filteredData = studentsData.filter(student => 
      student.class_id === kelas
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(kelas);

    // ✅ A4 PORTRAIT
    worksheet.pageSetup = {
      paperSize: 9,
      orientation: 'portrait',
      margins: { left: 0.7, right: 0.7, top: 0.8, bottom: 0.8, header: 0.5, footer: 0.5 }
    };

    // ✅ COLUMN WIDTHS UNTUK PORTRAIT
    worksheet.columns = [
      { width: 6 }, { width: 12 }, { width: 28 }, { width: 10 }, { width: 14 }, { width: 10 }
    ];

    // HEADER
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'SMP MUSLIMIN CILILIN';
    worksheet.getCell('A1').style = this.getHeaderStyle();
    worksheet.getRow(1).height = 25;

    // SUBHEADER
    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `DATA SISWA KELAS ${kelas}`;
    worksheet.getCell('A2').style = this.getSubHeaderStyle();
    worksheet.getRow(2).height = 20;

    // TAHUN AJARAN
    worksheet.mergeCells('A3:F3');
    worksheet.getCell('A3').value = `TAHUN AJARAN ${this.getTahunAjaranAktif()}`;
    worksheet.getCell('A3').style = {
      font: { name: 'Arial', size: 10, bold: true },
      alignment: { vertical: 'middle', horizontal: 'center' }
    };
    worksheet.getRow(3).height = 18;

    // ✅ 2 BARIS KOSONG YANG BENER
    worksheet.getRow(4).height = 15;
    worksheet.getRow(5).height = 15;

    // TABLE HEADER
    const tableHeaderRow = worksheet.getRow(6);
    tableHeaderRow.height = 22;
    const headers = ['No.', 'NIS', 'Nama', 'Kelas', 'Jenis Kelamin', 'Status'];
    headers.forEach((header, index) => {
      const cell = tableHeaderRow.getCell(index + 1);
      cell.value = header;
      cell.style = this.getTableHeaderStyle();
    });

    // DATA
    filteredData.forEach((student, index) => {
      const dataRow = worksheet.getRow(7 + index);
      dataRow.height = 18;
      
      const cells = [
        index + 1,
        student.nis || '-',
        student.full_name || '-',
        student.class_id || '-',
        student.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        student.is_active ? 'Aktif' : 'Non-Aktif'
      ];

      cells.forEach((value, cellIndex) => {
        const cell = dataRow.getCell(cellIndex + 1);
        cell.value = value;
        cell.style = this.getDataCellStyle();
        
        // ✅ SISWA: Center semua kecuali Nama (index 2)
        if (cellIndex !== 2) {
          cell.style.alignment = { ...cell.style.alignment, horizontal: 'center' };
        }
      });
    });

    // Simpan file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Siswa_${kelas}_SMP_Muslimin_${this.getTahunAjaranAktif()}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  static async exportByFilter(filteredData, selectedKelas, selectedJenjang, selectedGender) {
    let title = 'DATA SISWA';
    
    if (selectedKelas) {
      title = `DATA SISWA KELAS ${selectedKelas}`;
    } else if (selectedJenjang) {
      title = `DATA SISWA KELAS ${selectedJenjang}`;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Siswa');

    // ✅ A4 PORTRAIT
    worksheet.pageSetup = {
      paperSize: 9,
      orientation: 'portrait',
      margins: { left: 0.7, right: 0.7, top: 0.8, bottom: 0.8, header: 0.5, footer: 0.5 }
    };

    // ✅ COLUMN WIDTHS UNTUK PORTRAIT
    worksheet.columns = [
      { width: 6 }, { width: 12 }, { width: 28 }, { width: 10 }, { width: 14 }, { width: 10 }
    ];

    // HEADER
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'SMP MUSLIMIN CILILIN';
    worksheet.getCell('A1').style = this.getHeaderStyle();
    worksheet.getRow(1).height = 25;

    // SUBHEADER
    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = title;
    worksheet.getCell('A2').style = this.getSubHeaderStyle();
    worksheet.getRow(2).height = 20;

    // TAHUN AJARAN
    worksheet.mergeCells('A3:F3');
    worksheet.getCell('A3').value = `TAHUN AJARAN ${this.getTahunAjaranAktif()}`;
    worksheet.getCell('A3').style = {
      font: { name: 'Arial', size: 10, bold: true },
      alignment: { vertical: 'middle', horizontal: 'center' }
    };
    worksheet.getRow(3).height = 18;

    // ✅ 2 BARIS KOSONG YANG BENER
    worksheet.getRow(4).height = 15;
    worksheet.getRow(5).height = 15;

    // TABLE HEADER
    const tableHeaderRow = worksheet.getRow(6);
    tableHeaderRow.height = 22;
    const headers = ['No.', 'NIS', 'Nama', 'Kelas', 'Jenis Kelamin', 'Status'];
    headers.forEach((header, index) => {
      const cell = tableHeaderRow.getCell(index + 1);
      cell.value = header;
      cell.style = this.getTableHeaderStyle();
    });

    // DATA
    filteredData.forEach((student, index) => {
      const dataRow = worksheet.getRow(7 + index);
      dataRow.height = 18;
      
      const cells = [
        index + 1,
        student.nis || '-',
        student.full_name || '-',
        student.class_id || '-',
        student.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        student.is_active ? 'Aktif' : 'Non-Aktif'
      ];

      cells.forEach((value, cellIndex) => {
        const cell = dataRow.getCell(cellIndex + 1);
        cell.value = value;
        cell.style = this.getDataCellStyle();
        
        // ✅ SISWA: Center semua kecuali Nama (index 2)
        if (cellIndex !== 2) {
          cell.style.alignment = { ...cell.style.alignment, horizontal: 'center' };
        }
      });
    });

    // Simpan file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Siswa_Filter_SMP_Muslimin_${this.getTahunAjaranAktif()}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ==================== FUNGSI EXPORT GURU ====================

  static async exportTeachers(teachersData) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data Guru');

      // ✅ A4 PORTRAIT
      worksheet.pageSetup = {
        paperSize: 9,
        orientation: 'portrait',
        margins: {
          left: 0.7, right: 0.7,
          top: 0.8, bottom: 0.8,
          header: 0.5, footer: 0.5
        }
      };

      // ✅ COLUMN WIDTHS UNTUK PORTRAIT
      worksheet.columns = [
        { width: 6 },   // No.
        { width: 13 },  // Kode Guru
        { width: 32 },  // Nama Guru
        { width: 35 },  // Tugas/Mapel
        { width: 13 },  // Wali Kelas
        { width: 10 }   // Status
      ];

      // HEADER UTAMA - Baris 1
      worksheet.mergeCells('A1:F1');
      const headerCell = worksheet.getCell('A1');
      headerCell.value = 'SMP MUSLIMIN CILILIN';
      headerCell.style = this.getHeaderStyle();
      worksheet.getRow(1).height = 25;

      // SUBHEADER - Baris 2
      worksheet.mergeCells('A2:F2');
      const subHeaderCell = worksheet.getCell('A2');
      subHeaderCell.value = 'DATA GURU';
      subHeaderCell.style = this.getSubHeaderStyle();
      worksheet.getRow(2).height = 20;

      // TAHUN AJARAN - Baris 3
      worksheet.mergeCells('A3:F3');
      const infoCell = worksheet.getCell('A3');
      infoCell.value = `TAHUN AJARAN ${this.getTahunAjaranAktif()}`;
      infoCell.style = {
        font: { name: 'Arial', size: 10, bold: true },
        alignment: { vertical: 'middle', horizontal: 'center' }
      };
      worksheet.getRow(3).height = 18;

      // ✅ 2 BARIS KOSONG YANG BENER
      worksheet.getRow(4).height = 15;
      worksheet.getRow(5).height = 15;

      // TABLE HEADER - Baris 6
      const tableHeaderRow = worksheet.getRow(6);
      tableHeaderRow.height = 22;
      
      const headers = ['No.', 'Kode Guru', 'Nama Guru', 'Tugas/Mapel', 'Wali Kelas', 'Status'];
      headers.forEach((header, index) => {
        const cell = tableHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.style = this.getTableHeaderStyle();
      });

      // DATA GURU - Mulai Baris 7
      teachersData.forEach((guru, index) => {
        const dataRow = worksheet.getRow(7 + index);
        dataRow.height = 18;
        
        const cells = [
          index + 1,
          guru.teacher_id || '-',
          guru.full_name || '-',
          guru.mapel?.join(', ') || 'Belum ada tugas',
          guru.walikelas !== '-' ? `KELAS ${guru.walikelas}` : '-',
          guru.is_active ? 'Aktif' : 'Nonaktif'
        ];

        cells.forEach((value, cellIndex) => {
          const cell = dataRow.getCell(cellIndex + 1);
          cell.value = value;
          cell.style = this.getDataCellStyle();
          
          // ✅ GURU: Center untuk No.(0), Kode Guru(1), Wali Kelas(4), Status(5)
          if (cellIndex === 0 || cellIndex === 1 || cellIndex === 4 || cellIndex === 5) {
            cell.style.alignment = { ...cell.style.alignment, horizontal: 'center' };
          }
          // Nama Guru(2) dan Tugas/Mapel(3) tetap LEFT
        });
      });

      // Simpan file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Data_Guru_SMP_Muslimin_${this.getTahunAjaranAktif()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting Guru Excel:', error);
      throw new Error('Gagal mengexport data guru ke Excel');
    }
  }
}
import jsPDF from 'jspdf';

// --- CONFIGURATION ---
const PAGE_WIDTH = 210; // A4 width in mm
const MARGIN_X = 20;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_X;

// Warna Primer (biru profesional)
const PRIMARY_COLOR = [29, 78, 216]; // Blue-700
// Warna Sekunder (abu-abu terang untuk latar belakang section)
const SECONDARY_BG = [241, 245, 249]; // Gray-100
// Warna Teks Abu-abu
const TEXT_GRAY = [75, 85, 99]; // Gray-600

// --- HELPER FUNCTIONS ---

// Menarik garis horizontal
const drawSeparator = (pdf, y, color = [200, 200, 200], thickness = 0.2) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(thickness);
    pdf.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
};

// --- MAIN EXPORT FUNCTION ---
export const exportKonselingPDF = (konselingItem) => {
    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.setFont('helvetica');
        let yPosition = 0;

        // ===== FOOTER FUNCTION (Minimalis) =====
        const renderFooter = (pdfInstance, pageNumber) => {
            const pageHeight = pdfInstance.internal.pageSize.height;
            const footerY = pageHeight - 15;

            // Garis pemisah footer
            drawSeparator(pdfInstance, pageHeight - 20, [200, 200, 200], 0.1);
            
            pdfInstance.setTextColor(...TEXT_GRAY);
            pdfInstance.setFontSize(8);
            pdfInstance.setFont('helvetica', 'normal');
            
            // Kiri: Informasi Cetak
            pdfInstance.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')} | Sistem BK/BP SMP Muslimin Cililin`, MARGIN_X, footerY);
            
            // Kanan: Nomor Halaman
            pdfInstance.text(`Halaman ${pageNumber}`, CONTENT_WIDTH + MARGIN_X, footerY, { align: 'right' });
        };


        // ===== 1. HEADER (Minimalis dan Profesional) =====
        const renderHeader = () => {
            yPosition = 18;
            
            // Judul Utama
            pdf.setTextColor(...PRIMARY_COLOR);
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text('LAPORAN KONSELING', PAGE_WIDTH / 2, yPosition, { align: 'center' });
            
            yPosition += 8;
            
            // Sub Judul
            pdf.setTextColor(...TEXT_GRAY);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Bimbingan dan Konseling - SMP MUSLIMIN CILILIN', PAGE_WIDTH / 2, yPosition, { align: 'center' });

            yPosition += 8;
            drawSeparator(pdf, yPosition, PRIMARY_COLOR, 0.5); // Garis tebal pemisah
            yPosition += 5;
        };
        renderHeader();

        // ===== 2. INFORMASI SISWA (Layout Kolom Bersih) =====
        const renderStudentInfo = () => {
            pdf.setTextColor(...PRIMARY_COLOR);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('INFORMASI SISWA', MARGIN_X, yPosition);
            
            drawSeparator(pdf, yPosition + 2);
            yPosition += 6;
            
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
            
            // Data untuk dua kolom
            const studentInfo = [
                { label: 'Nama Siswa', value: konselingItem.full_name || '-', col: 1 },
                { label: 'NIS', value: konselingItem.nis || '-', col: 2 },
                { label: 'Kelas', value: konselingItem.class_id || '-', col: 1 },
                { label: 'Jenis Kelamin', value: konselingItem.gender === 'L' ? 'Laki-laki' : konselingItem.gender === 'P' ? 'Perempuan' : konselingItem.gender || '-', col: 2 },
                { label: 'Tgl. Konseling', value: new Date(konselingItem.tanggal).toLocaleDateString('id-ID') || '-', col: 1 },
                { label: 'Jenis Layanan', value: konselingItem.jenis_layanan || '-', col: 2 },
                { label: 'Bidang Bimbingan', value: konselingItem.bidang_bimbingan || '-', col: 1 },
                { label: 'Status Layanan', value: konselingItem.status_layanan || '-', col: 2 },
                { label: 'Guru BK', value: konselingItem.guru_bk_name || '-', col: 1 }
            ];
            
            const col1X = MARGIN_X;
            const col2X = PAGE_WIDTH / 2 + 5; 
            const labelWidth = 30; 
            const maxTextWidth = (PAGE_WIDTH / 2) - MARGIN_X - labelWidth - 5;

            // Render informasi dalam dua kolom
            studentInfo.forEach((info, index) => {
                const isNewRow = index % 2 === 0;
                
                if (isNewRow) {
                    yPosition += 6;
                }

                const x = info.col === 1 ? col1X : col2X;
                const valueX = x + labelWidth;

                pdf.setFont('helvetica', 'bold');
                pdf.text(`${info.label}:`, x, yPosition);
                
                pdf.setFont('helvetica', 'normal');
                const lines = pdf.splitTextToSize(info.value, maxTextWidth);

                pdf.text(lines, valueX, yPosition);

                if (lines.length > 1 && !isNewRow) {
                    yPosition += (lines.length - 1) * 4;
                }
            });
            
            yPosition += 10;
        };
        renderStudentInfo();

        // ===== 3. DETAIL KONSELING (Section Box yang Bersih) =====
        const renderSection = (title, content, isRequired = false) => {
            const PADDING = 4;
            const titleHeight = 5;
            const lineSpacing = 4;
            
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const contentLines = pdf.splitTextToSize(content || 'Tidak diisi', CONTENT_WIDTH - 2 * PADDING);
            
            const sectionContentHeight = contentLines.length * lineSpacing;
            let sectionHeight = PADDING + titleHeight + PADDING + sectionContentHeight + PADDING; 
            
            // Cek jika perlu page break
            if (yPosition + sectionHeight > pdf.internal.pageSize.height - 35) {
                pdf.addPage();
                renderHeader(); // Render header di halaman baru
                yPosition = 30; // Mulai konten setelah header baru
            }
            
            // Section Box (dengan background abu-abu terang)
            pdf.setFillColor(...SECONDARY_BG);
            pdf.roundedRect(MARGIN_X, yPosition, CONTENT_WIDTH, sectionHeight, 1, 1, 'F');
            
            // Title
            pdf.setTextColor(...PRIMARY_COLOR);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title + (isRequired ? ' *' : ''), MARGIN_X + PADDING, yPosition + PADDING + 3);
            
            // Garis pemisah title dan content
            drawSeparator(pdf, yPosition + PADDING + titleHeight + 1, [200, 200, 200]);
            
            // Content
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(contentLines, MARGIN_X + PADDING, yPosition + PADDING + titleHeight + PADDING + 2);
            
            yPosition += sectionHeight + 5; // Jarak antar section
        };

        yPosition += 5; // Jarak dari info siswa
        
        pdf.setTextColor(...PRIMARY_COLOR);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DETAIL KONSELING', MARGIN_X, yPosition);
        drawSeparator(pdf, yPosition + 2);
        yPosition += 8;

        renderSection('PERMASALAHAN', konselingItem.permasalahan, true);
        renderSection('KRONOLOGI', konselingItem.kronologi, true);
        renderSection('TINDAKAN LAYANAN', konselingItem.tindakan_layanan);
        renderSection('HASIL LAYANAN', konselingItem.hasil_layanan);
        renderSection('RENCANA TINDAK LANJUT', konselingItem.rencana_tindak_lanjut);

        // ===== 4. TANDA TANGAN (Nama Siswa SEJAJAR dengan Guru BK) =====
        // Cek jika perlu page break
        if (yPosition > pdf.internal.pageSize.height - 70) {
            pdf.addPage();
            renderHeader();
            yPosition = MARGIN_X;
        }
        
        yPosition += 15;
        
        // --- Setting Posisi Tanda Tangan ---
        const signatureY = yPosition;
        const signatureLineY = yPosition + 25;
        const signatureNameY = yPosition + 30;
        
        // KOLOM 1: Guru BK/BP (KIRI)
        const col1SignX = MARGIN_X + 15; 
        
        // KOLOM 2: Siswa (KANAN)
        const col2SignX = PAGE_WIDTH - MARGIN_X - 15;
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        
        // Tempat/Tanggal (Diletakkan di kolom kanan)
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Cililin, ${new Date(konselingItem.tanggal).toLocaleDateString('id-ID')}`, col2SignX, signatureY, { align: 'right' });
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        
        // Teks Jabatan/Keterangan (Siswa dan Guru BK Sejajar)
        pdf.text('Guru BK/BP', col1SignX, signatureY + 6, { align: 'center' });
        pdf.text('Siswa yang Bersangkutan', col2SignX, signatureY + 6, { align: 'right' });
        
        // Garis tanda tangan
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.3);
        
        // Garis Guru BK
        pdf.line(col1SignX - 25, signatureLineY, col1SignX + 25, signatureLineY);
        // Garis Siswa
        pdf.line(col2SignX - 25, signatureLineY, col2SignX + 25, signatureLineY);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        // Nama (Bawah Garis, SEJAJAR)
        // Nama Guru BK
        pdf.text(konselingItem.guru_bk_name || 'Nama Guru BK', col1SignX, signatureNameY, { align: 'center' });
        // Nama Siswa (Sejajar dengan Guru BK)
        pdf.text(konselingItem.full_name || 'Nama Siswa', col2SignX, signatureNameY, { align: 'right' });
        
        // ===== 5. RENDER FOOTER UNTUK SEMUA HALAMAN =====
        const pageCount = pdf.internal.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            renderFooter(pdf, i); 
        }
        
        // ===== SAVE PDF =====
        const fileName = `Laporan_Konseling_${konselingItem.nis}_${(konselingItem.full_name || '').replace(/\s/g, '_')}.pdf`;
        pdf.save(fileName);
        
        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};
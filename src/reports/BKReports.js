import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Filter,
  X,
  Search,
  FileText,
  User,
  AlertTriangle,
  Bell,
  Target,
  Activity,
  TrendingDown,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { exportToExcel, exportToCSV } from './ReportExcel';
import ReportModal from './modals/BKReportModal';

const BKReportsEnhanced = ({ user, onShowToast }) => {
  const [konselingData, setKonselingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);

  // Filters - ✅ UPDATED: Tambah filter baru
  const [filters, setFilters] = useState({
    search: "",
    class: "",
    status: "",
    bidang: "",
    jenisLayanan: "",
    tingkat_urgensi: "", // NEW
    kategori_masalah: "", // NEW
    perlu_followup: "", // NEW
    dateStart: "",
    dateEnd: "",
  });

  // Fetch data from Supabase
  useEffect(() => {
    fetchKonselingData();
    fetchClasses();
  }, []);

  // ✅ UPDATED: Fetch dengan field baru
  const fetchKonselingData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("konseling")
        .select(
          `
          *,
          students:student_id (
            full_name,
            nis,
            gender,
            class_id
          ),
          classes:class_id (
            grade
          )
        `
        )
        .order("tanggal", { ascending: false });

      if (error) throw error;

      // ✅ UPDATED: Process data dengan field baru
      const processedData = data.map((item) => ({
        id: item.id,
        student_id: item.student_id,
        full_name: item.students?.full_name || item.full_name,
        nis: item.students?.nis || item.nis,
        gender: item.students?.gender || item.gender,
        class_id: item.students?.class_id || item.class_id,
        class_name: item.classes?.grade || item.class_id,
        tanggal: item.tanggal,
        jenis_layanan: item.jenis_layanan,
        bidang_bimbingan: item.bidang_bimbingan,
        tingkat_urgensi: item.tingkat_urgensi || 'Sedang', // NEW
        kategori_masalah: item.kategori_masalah || 'Lainnya', // NEW
        permasalahan: item.permasalahan,
        kronologi: item.kronologi,
        tindakan_layanan: item.tindakan_layanan,
        hasil_layanan: item.hasil_layanan,
        rencana_tindak_lanjut: item.rencana_tindak_lanjut,
        perlu_followup: item.perlu_followup || false, // NEW
        tanggal_followup: item.tanggal_followup || null, // NEW
        status_layanan: item.status_layanan,
        guru_bk_name: item.guru_bk_name,
        academic_year: item.academic_year,
        semester: item.semester,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setKonselingData(processedData);
      setFilteredData(processedData);
      onShowToast("Data konseling berhasil dimuat", "success");
    } catch (error) {
      console.error("Error fetching konseling data:", error);
      onShowToast("Gagal memuat data konseling", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("grade");

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // ✅ UPDATED: Calculate statistics dengan field baru
  const stats = {
    total: konselingData.length,
    selesai: konselingData.filter((d) => d.status_layanan === "Selesai").length,
    proses: konselingData.filter((d) => d.status_layanan === "Dalam Proses").length,
    darurat: konselingData.filter((d) => d.tingkat_urgensi === "Darurat").length, // NEW
    tinggi: konselingData.filter((d) => d.tingkat_urgensi === "Tinggi").length, // NEW
    perlu_followup: konselingData.filter((d) => d.perlu_followup === true).length, // NEW
    followup_overdue: konselingData.filter(
      (d) => d.perlu_followup && d.tanggal_followup && new Date(d.tanggal_followup) < new Date()
    ).length, // NEW
    followup_upcoming: konselingData.filter(
      (d) => d.perlu_followup && d.tanggal_followup && 
      new Date(d.tanggal_followup) >= new Date() &&
      new Date(d.tanggal_followup) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length, // NEW
  };

  // Get unique students with repeat consultations
  const studentFrequency = konselingData.reduce((acc, item) => {
    acc[item.student_id] = (acc[item.student_id] || 0) + 1;
    return acc;
  }, {});

  const frequentStudents = Object.entries(studentFrequency)
    .filter(([_, count]) => count > 1)
    .map(([studentId, count]) => {
      const student = konselingData.find((d) => d.student_id === studentId);
      return { ...student, frequency: count };
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  // ✅ NEW: Chart data untuk TINGKAT URGENSI
  const urgencyData = Object.entries(
    konselingData.reduce((acc, item) => {
      acc[item.tingkat_urgensi] = (acc[item.tingkat_urgensi] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ 
    name, 
    value,
    color: name === 'Darurat' ? '#ef4444' : 
           name === 'Tinggi' ? '#f97316' :
           name === 'Sedang' ? '#eab308' : '#22c55e'
  }));

  // ✅ NEW: Chart data untuk KATEGORI MASALAH
  const categoryData = Object.entries(
    konselingData.reduce((acc, item) => {
      acc[item.kategori_masalah] = (acc[item.kategori_masalah] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Chart data - Existing
  const bidangData = Object.entries(
    konselingData.reduce((acc, item) => {
      acc[item.bidang_bimbingan] = (acc[item.bidang_bimbingan] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // ✅ UPDATED: Monthly data dengan breakdown
  const monthlyData = Object.entries(
    konselingData.reduce((acc, item) => {
      const month = new Date(item.tanggal).toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      });
      if (!acc[month]) {
        acc[month] = { month, total: 0, darurat: 0, selesai: 0 };
      }
      acc[month].total++;
      if (item.tingkat_urgensi === 'Darurat') acc[month].darurat++;
      if (item.status_layanan === 'Selesai') acc[month].selesai++;
      return acc;
    }, {})
  ).map(([_, data]) => data);

  const statusData = [
    { name: "Selesai", value: stats.selesai, color: "#10b981" },
    { name: "Dalam Proses", value: stats.proses, color: "#f59e0b" },
  ];

  // ✅ NEW: Success rate per kategori
  const successRateByCategory = categoryData.map(cat => {
    const total = konselingData.filter(d => d.kategori_masalah === cat.name).length;
    const selesai = konselingData.filter(
      d => d.kategori_masalah === cat.name && d.status_layanan === 'Selesai'
    ).length;
    return {
      kategori: cat.name,
      rate: total > 0 ? ((selesai / total) * 100).toFixed(1) : 0
    };
  }).sort((a, b) => b.rate - a.rate).slice(0, 5);

  // ✅ NEW: Follow-up list (upcoming & overdue)
  const followupList = konselingData
    .filter(d => d.perlu_followup && d.tanggal_followup)
    .map(d => ({
      ...d,
      isOverdue: new Date(d.tanggal_followup) < new Date(),
      daysUntil: Math.ceil((new Date(d.tanggal_followup) - new Date()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => new Date(a.tanggal_followup) - new Date(b.tanggal_followup))
    .slice(0, 10);

  // ✅ NEW: Kasus darurat list
  const emergencyCases = konselingData
    .filter(d => d.tingkat_urgensi === 'Darurat' && d.status_layanan !== 'Selesai')
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .slice(0, 5);

  // ✅ UPDATED: Apply filters dengan field baru
  useEffect(() => {
    let result = konselingData;

    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.full_name?.toLowerCase().includes(term) ||
          item.nis?.includes(term) ||
          item.permasalahan?.toLowerCase().includes(term)
      );
    }

    if (filters.class) {
      result = result.filter((item) => item.class_id === filters.class);
    }

    if (filters.status) {
      result = result.filter((item) => item.status_layanan === filters.status);
    }

    if (filters.bidang) {
      result = result.filter((item) => item.bidang_bimbingan === filters.bidang);
    }

    if (filters.jenisLayanan) {
      result = result.filter((item) => item.jenis_layanan === filters.jenisLayanan);
    }

    // NEW FILTERS
    if (filters.tingkat_urgensi) {
      result = result.filter((item) => item.tingkat_urgensi === filters.tingkat_urgensi);
    }

    if (filters.kategori_masalah) {
      result = result.filter((item) => item.kategori_masalah === filters.kategori_masalah);
    }

    if (filters.perlu_followup) {
      const needFollowup = filters.perlu_followup === 'true';
      result = result.filter((item) => item.perlu_followup === needFollowup);
    }

    if (filters.dateStart && filters.dateEnd) {
      result = result.filter((item) => {
        const date = new Date(item.tanggal);
        return (
          date >= new Date(filters.dateStart) &&
          date <= new Date(filters.dateEnd)
        );
      });
    }

    setFilteredData(result);
  }, [filters, konselingData]);

  // ✅ UPDATED: Export dengan field baru
  const exportToCSVHandler = () => {
    const headers = [
      "Nama",
      "NIS",
      "Kelas",
      "Tanggal",
      "Urgensi",
      "Kategori",
      "Jenis Layanan",
      "Bidang",
      "Status",
      "Follow-up",
      "Tanggal Follow-up",
      "Permasalahan",
      "Hasil",
    ];
    
    const csvData = filteredData.map((item) => [
      item.full_name,
      item.nis,
      item.class_name,
      item.tanggal,
      item.tingkat_urgensi,
      item.kategori_masalah,
      item.jenis_layanan,
      item.bidang_bimbingan,
      item.status_layanan,
      item.perlu_followup ? 'Ya' : 'Tidak',
      item.tanggal_followup || '-',
      `"${(item.permasalahan || '').replace(/"/g, '""')}"`,
      `"${(item.hasil_layanan || '').replace(/"/g, '""')}"`,
    ]);

    exportToCSV(csvData, headers, `laporan_konseling_${new Date().toISOString().split("T")[0]}.csv`);
    onShowToast("Data berhasil diexport ke CSV", "success");
  };

  // ✅ UPDATED: Export Excel dengan field baru lengkap
  const exportToExcelHandler = async () => {
    try {
      // Headers dengan urutan yang sesuai kolom ReportExcel.js
      const headers = [
        "Nama",
        "NIS", 
        "Kelas",
        "Tanggal",
        "Tingkat Urgensi",      // NEW
        "Kategori Masalah",     // NEW
        "Jenis Layanan",
        "Bidang Bimbingan",
        "Status Layanan",
        "Follow-up",            // NEW
        "Tanggal Follow-up",    // NEW
        "Permasalahan",
        "Hasil Layanan"
      ];

      // Format data dengan semua field baru
      const formattedData = filteredData.map((item) => ({
        nama: item.full_name,
        nis: item.nis,
        kelas: item.class_name,
        tanggal: new Date(item.tanggal).toLocaleDateString('id-ID'),
        urgensi: item.tingkat_urgensi,                    // NEW - untuk conditional formatting
        kategori: item.kategori_masalah,                   // NEW - untuk conditional formatting
        jenis_layanan: item.jenis_layanan,
        bidang_bimbingan: item.bidang_bimbingan,
        status_layanan: item.status_layanan,
        followup: item.perlu_followup ? 'Ya' : 'Tidak',   // NEW - untuk conditional formatting
        tanggal_followup: item.tanggal_followup            // NEW
          ? new Date(item.tanggal_followup).toLocaleDateString('id-ID') 
          : '-',
        permasalahan: item.permasalahan,
        hasil_layanan: item.hasil_layanan || '-'
      }));

      // Build filter description
      const filterParts = [];
      if (filters.class) filterParts.push(`Kelas ${filters.class}`);
      if (filters.status) filterParts.push(`Status ${filters.status}`);
      if (filters.tingkat_urgensi) filterParts.push(`Urgensi ${filters.tingkat_urgensi}`);
      if (filters.kategori_masalah) filterParts.push(`Kategori ${filters.kategori_masalah}`);
      if (filters.perlu_followup) {
        filterParts.push(`Follow-up ${filters.perlu_followup === 'true' ? 'Ya' : 'Tidak'}`);
      }
      if (filters.dateStart && filters.dateEnd) {
        filterParts.push(`Periode ${new Date(filters.dateStart).toLocaleDateString('id-ID')} - ${new Date(filters.dateEnd).toLocaleDateString('id-ID')}`);
      }
      const filterDescription = filterParts.length > 0 ? filterParts.join(', ') : 'Semua Data';

      // Summary dengan stats lengkap
      const summary = [
        { label: 'Total Konseling', value: filteredData.length },
        { label: 'Kasus Darurat', value: filteredData.filter(d => d.tingkat_urgensi === 'Darurat').length },
        { label: 'Kasus Tinggi', value: filteredData.filter(d => d.tingkat_urgensi === 'Tinggi').length },
        { label: 'Perlu Follow-up', value: filteredData.filter(d => d.perlu_followup).length },
        { label: 'Selesai', value: filteredData.filter(d => d.status_layanan === 'Selesai').length },
        { label: 'Dalam Proses', value: filteredData.filter(d => d.status_layanan === 'Dalam Proses').length }
      ];

      const metadata = {
        title: 'LAPORAN DATA KONSELING BK',
        filters: filterDescription,
        summary: summary,
        academicYear: '2025/2026',
        semester: '1'
      };

      // Call exportToExcel dari ReportExcel.js dengan options BK
      await exportToExcel(formattedData, headers, metadata, {
        role: 'bk',
        reportType: 'counseling'
      });

      onShowToast("Data berhasil diexport ke Excel", "success");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      onShowToast("Gagal export ke Excel", "error");
    }
  };

  const updateKonselingStatus = async (itemId, newStatus) => {
    try {
      const { error } = await supabase
        .from("konseling")
        .update({
          status_layanan: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      if (error) throw error;

      setKonselingData((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status_layanan: newStatus,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );

      onShowToast("Status berhasil diperbarui", "success");
      setShowDetailModal(false);
    } catch (error) {
      console.error("Error updating status:", error);
      onShowToast("Gagal memperbarui status", "error");
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, badge }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${color} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {badge && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`p-3 rounded-lg ${color
            .replace("border-", "bg-")
            .replace("500", "100")}`}>
          <Icon className={`w-6 h-6 ${color.replace("border-", "text-")}`} />
        </div>
      </div>
    </div>
  );

  // ✅ UPDATED: Detail Modal dengan field baru
  const DetailModal = () => {
    if (!showDetailModal || !selectedItem) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Detail Konseling</h2>
              <div className="flex gap-2 mt-2">
                {getUrgencyBadge(selectedItem.tingkat_urgensi)}
                {getCategoryBadge(selectedItem.kategori_masalah)}
              </div>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Student Info */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold text-slate-700 mb-3">Informasi Siswa</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Nama Lengkap</p>
                  <p className="font-medium text-slate-800">{selectedItem.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">NIS</p>
                  <p className="font-medium text-slate-800">{selectedItem.nis}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Kelas</p>
                  <p className="font-medium text-slate-800">{selectedItem.class_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Jenis Kelamin</p>
                  <p className="font-medium text-slate-800">
                    {selectedItem.gender === "L" ? "Laki-laki" : "Perempuan"}
                  </p>
                </div>
              </div>
            </div>

            {/* Konseling Info */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Detail Konseling</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Tanggal</p>
                  <p className="font-medium text-slate-800">
                    {new Date(selectedItem.tanggal).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Jenis Layanan</p>
                    <p className="font-medium text-slate-800">{selectedItem.jenis_layanan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Bidang Bimbingan</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getBidangColor(selectedItem.bidang_bimbingan)}`}>
                      {selectedItem.bidang_bimbingan}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedItem.status_layanan)}`}>
                    {selectedItem.status_layanan}
                  </span>
                </div>
                {/* NEW: Follow-up Info */}
                {selectedItem.perlu_followup && (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-sm font-semibold text-purple-700 mb-1">📅 Follow-up Diperlukan</p>
                    <p className="text-sm text-purple-600">
                      Tanggal: {selectedItem.tanggal_followup ? new Date(selectedItem.tanggal_followup).toLocaleDateString('id-ID') : 'Belum ditentukan'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Problem & Solution */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Permasalahan</p>
                <p className="text-slate-600 bg-red-50 p-3 rounded">{selectedItem.permasalahan}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Kronologi</p>
                <p className="text-slate-600 bg-slate-50 p-3 rounded">{selectedItem.kronologi}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Tindakan Layanan</p>
                <p className="text-slate-600 bg-blue-50 p-3 rounded">{selectedItem.tindakan_layanan}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Hasil Layanan</p>
                <p className="text-slate-600 bg-green-50 p-3 rounded">{selectedItem.hasil_layanan}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Rencana Tindak Lanjut</p>
                <p className="text-slate-600 bg-yellow-50 p-3 rounded">{selectedItem.rencana_tindak_lanjut}</p>
              </div>
            </div>

            {/* BK Info */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-500">Guru BK</p>
              <p className="font-medium text-slate-800">{selectedItem.guru_bk_name}</p>
              <p className="text-xs text-slate-500 mt-1">
                Tahun Ajaran {selectedItem.academic_year} - Semester {selectedItem.semester}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              {selectedItem.status_layanan !== "Selesai" && (
                <button
                  onClick={() => updateKonselingStatus(selectedItem.id, "Selesai")}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Tandai Selesai
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      Selesai: "bg-green-100 text-green-800 border border-green-200",
      "Dalam Proses": "bg-yellow-100 text-yellow-800 border border-yellow-200",
      Menunggu: "bg-blue-100 text-blue-800 border border-blue-200",
      Ditunda: "bg-red-100 text-red-800 border border-red-200",
    };
    return colors[status] || "bg-slate-100 text-slate-800 border border-slate-200";
  };

  const getBidangColor = (bidang) => {
    const colors = {
      Akademik: "bg-purple-100 text-purple-800 border border-purple-200",
      Sosial: "bg-indigo-100 text-indigo-800 border border-indigo-200",
      Karir: "bg-pink-100 text-pink-800 border border-pink-200",
      Pribadi: "bg-orange-100 text-orange-800 border border-orange-200",
    };
    return colors[bidang] || "bg-slate-100 text-slate-800 border border-slate-200";
  };

  // ✅ NEW: Urgency Badge
  const getUrgencyBadge = (urgency) => {
    const config = {
      'Darurat': { color: 'bg-red-100 text-red-800 border-red-300', emoji: '🔴' },
      'Tinggi': { color: 'bg-orange-100 text-orange-800 border-orange-300', emoji: '🟠' },
      'Sedang': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', emoji: '🟡' },
      'Rendah': { color: 'bg-green-100 text-green-800 border-green-300', emoji: '🟢' }
    };
    const c = config[urgency] || config['Sedang'];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${c.color}`}>
        {c.emoji} {urgency}
      </span>
    );
  };

  // ✅ NEW: Category Badge
  const getCategoryBadge = (category) => {
    const config = {
      'Akademik': { color: 'bg-blue-100 text-blue-800', emoji: '📚' },
      'Perilaku': { color: 'bg-red-100 text-red-800', emoji: '⚠️' },
      'Sosial-Emosional': { color: 'bg-purple-100 text-purple-800', emoji: '😔' },
      'Pertemanan': { color: 'bg-indigo-100 text-indigo-800', emoji: '👥' },
      'Keluarga': { color: 'bg-amber-100 text-amber-800', emoji: '🏠' },
      'Percintaan': { color: 'bg-pink-100 text-pink-800', emoji: '💔' },
      'Teknologi/Gadget': { color: 'bg-cyan-100 text-cyan-800', emoji: '📱' },
      'Kenakalan': { color: 'bg-gray-700 text-white', emoji: '🚬' },
      'Kesehatan Mental': { color: 'bg-violet-100 text-violet-800', emoji: '🧠' },
      'Lainnya': { color: 'bg-gray-100 text-gray-800', emoji: '📋' }
    };
    const c = config[category] || config['Lainnya'];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${c.color}`}>
        {c.emoji} {category}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-600 mt-4">Memuat data konseling...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Bimbingan Konseling</h1>
          <p className="text-slate-600 mt-2">Monitoring, analisis, dan pelaporan layanan BK</p>
        </div>

        {/* ✅ NEW: Emergency Alert Banner */}
        {(stats.darurat > 0 || stats.followup_overdue > 0) && (
          <div className="mb-6 space-y-3">
            {stats.darurat > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">🚨 Kasus Darurat Memerlukan Perhatian!</h3>
                  <p className="text-sm text-red-700">
                    Terdapat <strong>{stats.darurat}</strong> kasus dengan tingkat urgensi DARURAT yang perlu ditangani segera.
                  </p>
                  <button
                    onClick={() => setFilters({ ...filters, tingkat_urgensi: 'Darurat', status: '' })}
                    className="mt-2 text-sm bg-red-600 text-white px-4 py-1.5 rounded hover:bg-red-700 transition">
                    Lihat Kasus Darurat
                  </button>
                </div>
              </div>
            )}
            {stats.followup_overdue > 0 && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg flex items-start gap-3">
                <Bell className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">⏰ Follow-up Terlambat!</h3>
                  <p className="text-sm text-orange-700">
                    Ada <strong>{stats.followup_overdue}</strong> siswa yang jadwal follow-up nya sudah terlewat.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveView("dashboard")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeView === "dashboard"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}>
            Dashboard
          </button>
          <button
            onClick={() => setActiveView("table")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeView === "table"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}>
            Data Konseling
          </button>
          <button
            onClick={() => setActiveView("analytics")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeView === "analytics"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}>
            Analytics
          </button>
          <button
            onClick={() => setActiveView("followup")}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeView === "followup"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}>
            Follow-up
            {stats.followup_upcoming > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {stats.followup_upcoming}
              </span>
            )}
          </button>
        </div>

        {/* Dashboard View */}
        {activeView === "dashboard" && (
          <div className="space-y-6">
            {/* ✅ UPDATED: KPI Cards dengan field baru */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Konseling"
                value={stats.total}
                icon={Users}
                color="border-blue-500"
                subtitle="Semester ini"
              />
              <StatCard
                title="Kasus Darurat"
                value={stats.darurat}
                icon={AlertTriangle}
                color="border-red-500"
                subtitle="Prioritas tertinggi"
                badge={stats.darurat > 0 ? "ACTION!" : null}
              />
              <StatCard
                title="Perlu Follow-up"
                value={stats.perlu_followup}
                icon={Calendar}
                color="border-purple-500"
                subtitle={`${stats.followup_upcoming} minggu ini`}
              />
              <StatCard
                title="Selesai"
                value={stats.selesai}
                icon={CheckCircle}
                color="border-green-500"
                subtitle={`${stats.total > 0 ? ((stats.selesai / stats.total) * 100).toFixed(0) : 0}% completion rate`}
              />
            </div>

            {/* ✅ NEW: Charts Row 1 - Urgensi & Kategori */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Urgency Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Distribusi Tingkat Urgensi
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={urgencyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value">
                      {urgencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Top 5 Kategori Masalah
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryData.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 - Bidang & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bidang Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Distribusi Bidang Bimbingan
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={bidangData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value">
                      {bidangData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={["#8b5cf6", "#6366f1", "#ec4899", "#f97316"][index % 4]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Status Layanan
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trend & High Frequency Students */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trend */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Trend Bulanan
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="darurat" stroke="#ef4444" strokeWidth={2} name="Darurat" />
                    <Line type="monotone" dataKey="selesai" stroke="#22c55e" strokeWidth={2} name="Selesai" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Frequent Students */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Siswa dengan Konseling Berulang
                </h3>
                <div className="space-y-3">
                  {frequentStudents.length > 0 ? (
                    frequentStudents.map((student, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedItem(student);
                          setShowDetailModal(true);
                        }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{student.full_name}</p>
                            <p className="text-sm text-slate-500">{student.class_name} • {student.nis}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{student.frequency}</p>
                          <p className="text-xs text-slate-500">konseling</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-500 py-8">Tidak ada data</p>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ NEW: Emergency Cases Quick View */}
            {emergencyCases.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Kasus Darurat yang Belum Selesai
                </h3>
                <div className="space-y-3">
                  {emergencyCases.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowDetailModal(true);
                      }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-red-900">{item.full_name}</p>
                          {getCategoryBadge(item.kategori_masalah)}
                        </div>
                        <p className="text-sm text-red-700 mt-1 line-clamp-1">{item.permasalahan}</p>
                        <p className="text-xs text-red-600 mt-1">
                          {new Date(item.tanggal).toLocaleDateString('id-ID')} • {item.class_name}
                        </p>
                      </div>
                      <button className="text-red-600 hover:text-red-800 px-3 py-1 rounded bg-white hover:bg-red-50">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table View */}
        {activeView === "table" && (
          <div className="space-y-6">
            {/* ✅ UPDATED: Filters dengan field baru */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari nama, NIS, atau masalah..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>

                <select
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.tingkat_urgensi}
                  onChange={(e) => setFilters({ ...filters, tingkat_urgensi: e.target.value })}>
                  <option value="">Semua Urgensi</option>
                  <option value="Darurat">🔴 Darurat</option>
                  <option value="Tinggi">🟠 Tinggi</option>
                  <option value="Sedang">🟡 Sedang</option>
                  <option value="Rendah">🟢 Rendah</option>
                </select>

                <select
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.kategori_masalah}
                  onChange={(e) => setFilters({ ...filters, kategori_masalah: e.target.value })}>
                  <option value="">Semua Kategori</option>
                  <option value="Akademik">📚 Akademik</option>
                  <option value="Perilaku">⚠️ Perilaku</option>
                  <option value="Sosial-Emosional">😔 Sosial-Emosional</option>
                  <option value="Pertemanan">👥 Pertemanan</option>
                  <option value="Keluarga">🏠 Keluarga</option>
                  <option value="Percintaan">💔 Percintaan</option>
                  <option value="Teknologi/Gadget">📱 Teknologi/Gadget</option>
                  <option value="Kenakalan">🚬 Kenakalan</option>
                  <option value="Kesehatan Mental">🧠 Kesehatan Mental</option>
                  <option value="Lainnya">📋 Lainnya</option>
                </select>

                <select
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.class}
                  onChange={(e) => setFilters({ ...filters, class: e.target.value })}>
                  <option value="">Semua Kelas</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      Kelas {classItem.id}
                    </option>
                  ))}
                </select>

                <select
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">Semua Status</option>
                  <option value="Selesai">✅ Selesai</option>
                  <option value="Dalam Proses">⏳ Dalam Proses</option>
                </select>

                <select
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.perlu_followup}
                  onChange={(e) => setFilters({ ...filters, perlu_followup: e.target.value })}>
                  <option value="">Semua Follow-up</option>
                  <option value="true">✅ Perlu Follow-up</option>
                  <option value="false">❌ Tidak Perlu</option>
                </select>

                <input
                  type="date"
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.dateStart}
                  onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                  placeholder="Dari Tanggal"
                />

                <input
                  type="date"
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.dateEnd}
                  onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                  placeholder="Sampai Tanggal"
                />
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Menampilkan <span className="font-semibold">{filteredData.length}</span> dari{" "}
                  <span className="font-semibold">{konselingData.length}</span> data
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={exportToExcelHandler}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Excel
                  </button>
                  <button
                    onClick={exportToCSVHandler}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() =>
                      setFilters({
                        search: "",
                        class: "",
                        status: "",
                        bidang: "",
                        jenisLayanan: "",
                        tingkat_urgensi: "",
                        kategori_masalah: "",
                        perlu_followup: "",
                        dateStart: "",
                        dateEnd: "",
                      })
                    }
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                    <X className="w-4 h-4" />
                    Reset Filter
                  </button>
                </div>
              </div>
            </div>

            {/* ✅ UPDATED: Table dengan kolom baru */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Siswa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Urgensi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Permasalahan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Filter className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="text-slate-600 font-medium">Tidak ada data ditemukan</p>
                            <p className="text-slate-500 text-sm mt-1">Coba ubah filter pencarian</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 flex items-center gap-2">
                                  {item.full_name}
                                  {item.perlu_followup && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs border border-purple-300">
                                      Follow-up
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-slate-500">{item.class_name} • {item.nis}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {new Date(item.tanggal).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getUrgencyBadge(item.tingkat_urgensi)}
                          </td>
                          <td className="px-6 py-4">
                            {getCategoryBadge(item.kategori_masalah)}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-900 line-clamp-2 max-w-xs">
                              {item.permasalahan}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status_layanan)}`}>
                              {item.status_layanan}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setShowDetailModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-2 px-3 py-1 rounded hover:bg-blue-50 transition-colors">
                              <Eye className="w-4 h-4" />
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === "analytics" && (
          <div className="space-y-6">
            {/* ✅ NEW: Success Rate per Category */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Success Rate per Kategori Masalah
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={successRateByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="kategori" />
                  <YAxis label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="rate" fill="#10b981">
                    {successRateByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.rate > 70 ? '#10b981' : entry.rate > 50 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-slate-600 mt-3">
                💡 <strong>Insight:</strong> Kategori dengan success rate tinggi menunjukkan efektivitas penanganan yang baik.
              </p>
            </div>

            {/* Comprehensive Charts */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Analisis Mendalam
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bidang per Status */}
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-3">
                    Bidang Bimbingan per Status
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bidangData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Comparison */}
                <div>
                  <h4 className="text-sm font-medium text-slate-600 mb-3">
                    Perbandingan Bulanan
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} name="Total" />
                      <Line type="monotone" dataKey="darurat" stroke="#ef4444" strokeWidth={2} name="Darurat" />
                      <Line type="monotone" dataKey="selesai" stroke="#22c55e" strokeWidth={2} name="Selesai" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
                <h4 className="text-lg font-semibold mb-2">Kategori Tertinggi</h4>
                <p className="text-3xl font-bold mb-1">
                  {categoryData.length > 0 ? categoryData[0].name : "-"}
                </p>
                <p className="text-sm opacity-90">
                  {categoryData.length > 0 ? categoryData[0].value : 0} kasus
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                <CheckCircle className="w-8 h-8 mb-3 opacity-80" />
                <h4 className="text-lg font-semibold mb-2">Success Rate</h4>
                <p className="text-3xl font-bold mb-1">
                  {stats.total > 0 ? ((stats.selesai / stats.total) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-sm opacity-90">
                  {stats.selesai} dari {stats.total} selesai
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
                <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
                <h4 className="text-lg font-semibold mb-2">Perlu Perhatian</h4>
                <p className="text-3xl font-bold mb-1">
                  {stats.darurat + stats.tinggi}
                </p>
                <p className="text-sm opacity-90">
                  {stats.darurat} darurat + {stats.tinggi} tinggi
                </p>
              </div>
            </div>

            {/* ✅ NEW: Recommendations */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Rekomendasi & Action Items
              </h3>
              <div className="space-y-3">
                {stats.darurat > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-900">
                        {stats.darurat} kasus DARURAT memerlukan penanganan segera
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Prioritaskan kasus dengan tingkat urgensi darurat untuk ditangani hari ini. Koordinasi dengan wali kelas dan orang tua jika diperlukan.
                      </p>
                    </div>
                  </div>
                )}

                {stats.perlu_followup > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <Calendar className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-purple-900">
                        {stats.perlu_followup} siswa memerlukan tindak lanjut
                      </p>
                      <p className="text-sm text-purple-700 mt-1">
                        Jadwalkan sesi konseling lanjutan sesuai tanggal yang ditentukan. {stats.followup_overdue} follow-up sudah terlambat.
                      </p>
                    </div>
                  </div>
                )}

                {frequentStudents.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                    <Users className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-900">
                        {frequentStudents.length} siswa dengan konseling berulang
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Pertimbangkan untuk melakukan home visit, konsultasi dengan orang tua, atau merujuk ke psikolog profesional untuk penanganan lebih mendalam.
                      </p>
                    </div>
                  </div>
                )}

                {stats.proses > stats.selesai && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900">
                        Kasus dalam proses ({stats.proses}) lebih banyak dari yang selesai ({stats.selesai})
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Review dan prioritaskan kasus yang sudah berjalan lama. Evaluasi strategi penanganan untuk meningkatkan efektivitas.
                      </p>
                    </div>
                  </div>
                )}

                {categoryData.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                    <Target className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900">
                        Fokus program preventif: {categoryData[0].name}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Kategori masalah tertinggi adalah {categoryData[0].name}. Buat program bimbingan kelompok atau sosialisasi untuk mencegah masalah serupa di masa depan.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Export Laporan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={exportToExcelHandler}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <Download className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Laporan Excel</p>
                    <p className="text-xs opacity-90">Format XLSX Lengkap</p>
                  </div>
                </button>
                <button
                  onClick={exportToCSVHandler}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  <Download className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Data CSV</p>
                    <p className="text-xs opacity-90">Semua Record</p>
                  </div>
                </button>
                <button className="flex items-center justify-center gap-3 px-6 py-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Laporan Bulanan</p>
                    <p className="text-xs opacity-90">Summary Report</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ NEW: Follow-up View */}
        {activeView === "followup" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Perlu Follow-up</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.perlu_followup}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Terlambat</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.followup_overdue}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Minggu Ini</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.followup_upcoming}</p>
                  </div>
                  <Bell className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Follow-up List */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Jadwal Follow-up
              </h3>
              <div className="space-y-3">
                {followupList.length > 0 ? (
                  followupList.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border-l-4 cursor-pointer transition-colors ${
                        item.isOverdue 
                          ? 'bg-red-50 border-red-500 hover:bg-red-100' 
                          : item.daysUntil <= 3
                          ? 'bg-orange-50 border-orange-500 hover:bg-orange-100'
                          : 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                      }`}
                      onClick={() => {
                        setSelectedItem(item);
                        setShowDetailModal(true);
                      }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className={`font-semibold ${item.isOverdue ? 'text-red-900' : item.daysUntil <= 3 ? 'text-orange-900' : 'text-blue-900'}`}>
                            {item.full_name}
                          </p>
                          {getUrgencyBadge(item.tingkat_urgensi)}
                          {getCategoryBadge(item.kategori_masalah)}
                        </div>
                        <p className={`text-sm line-clamp-1 ${item.isOverdue ? 'text-red-700' : item.daysUntil <= 3 ? 'text-orange-700' : 'text-blue-700'}`}>
                          {item.permasalahan}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className={item.isOverdue ? 'text-red-600' : item.daysUntil <= 3 ? 'text-orange-600' : 'text-blue-600'}>
                            📅 {new Date(item.tanggal_followup).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={item.isOverdue ? 'text-red-600 font-semibold' : item.daysUntil <= 3 ? 'text-orange-600 font-semibold' : 'text-blue-600'}>
                            {item.isOverdue 
                              ? `⏰ Terlambat ${Math.abs(item.daysUntil)} hari` 
                              : item.daysUntil === 0 
                              ? '🔔 Hari ini!'
                              : `⏳ ${item.daysUntil} hari lagi`}
                          </span>
                          <span className="text-slate-500">
                            👤 {item.class_name} • {item.nis}
                          </span>
                        </div>
                      </div>
                      <button className={`p-2 rounded-lg ${item.isOverdue ? 'bg-red-100 text-red-600 hover:bg-red-200' : item.daysUntil <= 3 ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">Tidak ada jadwal follow-up</p>
                    <p className="text-slate-500 text-sm mt-1">Semua konseling sudah ditindaklanjuti</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        <DetailModal />
      </div>
    </div>
  );
};

export default BKReportsEnhanced;
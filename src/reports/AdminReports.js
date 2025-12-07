import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import {
  FileText,
  Users,
  GraduationCap,
  BarChart3,
  Eye,
  Building,
  CheckCircle,
  Filter,
  X,
  ChevronDown,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import { exportToExcel } from "./ReportExcel";
import ReportModal from "./modals/AdminReportModal";

import {
  fetchTeachersData,
  fetchStudentsData,
  fetchAttendanceRecapData,
  fetchGradesData,
  calculateFinalGrades,
  buildFilterDescription,
  TEACHER_ROLES,
  REPORT_HEADERS,
} from "./ReportHelpers";

// ==================== MONITORING HELPERS ====================

const calculateAtRiskStudents = async (classId = null) => {
  try {
    // Ambil attendance recap
    const filters = classId ? { class_id: classId } : {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let attendanceQuery = supabase
      .from("attendances")
      .select("student_id, status, students!inner(nis, full_name, class_id)")
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

    if (classId) {
      attendanceQuery = attendanceQuery.eq("students.class_id", classId);
    }

    const { data: attendanceData } = await attendanceQuery;

    // Calculate attendance percentage per student
    const studentAttendance = {};
    attendanceData?.forEach((record) => {
      const key = record.student_id;
      if (!studentAttendance[key]) {
        studentAttendance[key] = {
          nis: record.students?.nis,
          name: record.students?.full_name,
          class_id: record.students?.class_id,
          total: 0,
          present: 0,
        };
      }
      studentAttendance[key].total++;
      if (record.status?.toLowerCase() === "hadir") {
        studentAttendance[key].present++;
      }
    });

    // Filter students dengan absensi < 75%
    const atRiskAttendance = Object.values(studentAttendance)
      .filter((s) => s.total >= 10 && (s.present / s.total) * 100 < 75)
      .map((s) => ({
        ...s,
        attendanceRate: Math.round((s.present / s.total) * 100),
        riskType: "attendance",
      }))
      .sort((a, b) => a.attendanceRate - b.attendanceRate);

    return atRiskAttendance;
  } catch (err) {
    console.error("Error calculating at-risk students:", err);
    return [];
  }
};

const calculateLowGradeStudents = async (classId = null, threshold = 70) => {
  try {
    let gradesQuery = supabase
      .from("grades")
      .select("*, students!inner(nis, full_name, class_id)");

    if (classId) {
      gradesQuery = gradesQuery.eq("students.class_id", classId);
    }

    const { data: gradesData } = await gradesQuery;

    // Calculate final grades
    const finalGrades = calculateFinalGrades(gradesData || []);

    // Filter students dengan nilai < threshold di multiple subjects
    const studentGrades = {};
    finalGrades.forEach((grade) => {
      const key = grade.student_id;
      if (!studentGrades[key]) {
        studentGrades[key] = {
          nis: grade.nis,
          name: grade.full_name,
          class_id: grade.class_id,
          subjects: [],
          averageGrade: 0,
        };
      }
      studentGrades[key].subjects.push({
        subject: grade.subject,
        score: grade.final_score,
      });
    });

    // Calculate average dan filter
    const atRiskGrades = Object.values(studentGrades)
      .map((s) => ({
        ...s,
        averageGrade:
          Math.round(
            (s.subjects.reduce((sum, subj) => sum + subj.score, 0) /
              s.subjects.length) *
              100
          ) / 100,
        lowSubjects: s.subjects.filter((subj) => subj.score < threshold).length,
      }))
      .filter((s) => s.averageGrade < threshold || s.lowSubjects >= 2)
      .sort((a, b) => a.averageGrade - b.averageGrade);

    return atRiskGrades;
  } catch (err) {
    console.error("Error calculating low grade students:", err);
    return [];
  }
};

const calculateHighRiskStudents = (atRiskAttendance, atRiskGrades) => {
  // Combine both lists: students yang ada di both lists
  const highRisk = [];

  atRiskAttendance.forEach((attStudent) => {
    const gradeStudent = atRiskGrades.find((g) => g.nis === attStudent.nis);
    if (gradeStudent) {
      highRisk.push({
        nis: attStudent.nis,
        name: attStudent.name,
        class_id: attStudent.class_id,
        attendanceRate: attStudent.attendanceRate,
        averageGrade: gradeStudent.averageGrade,
        riskScore: Math.round(
          ((75 - attStudent.attendanceRate) / 25 +
            (70 - gradeStudent.averageGrade) / 70) *
            50
        ), // 0-100
      });
    }
  });

  return highRisk.sort((a, b) => b.riskScore - a.riskScore);
};

// ==================== MONITORING CARDS ====================

const MonitoringCard = ({ title, data, icon: Icon, color, type }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg border-2 ${color} p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5" />
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        <p className="text-sm text-slate-500">
          Tidak ada data yang perlu perhatian
        </p>
      </div>
    );
  }

  const displayData = data.slice(0, 5);

  return (
    <div className={`bg-white rounded-lg border-2 ${color} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" />
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <span className="ml-auto bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
          {data.length} siswa
        </span>
      </div>

      <div className="space-y-2">
        {displayData.map((student, idx) => (
          <div key={idx} className="bg-slate-50 p-2 rounded text-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-slate-800">{student.name}</p>
                <p className="text-slate-600">
                  {student.nis} • Kelas {student.class_id}
                </p>
              </div>
              {type === "attendance" && (
                <span
                  className={`px-2 py-1 rounded font-bold ${
                    student.attendanceRate >= 75
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                  {student.attendanceRate}%
                </span>
              )}
              {type === "grades" && (
                <span
                  className={`px-2 py-1 rounded font-bold ${
                    student.averageGrade >= 70
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                  {student.averageGrade}
                </span>
              )}
              {type === "highRisk" && (
                <span className="px-2 py-1 rounded font-bold bg-red-100 text-red-700">
                  ⚠️ {student.riskScore}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.length > 5 && (
        <p className="text-xs text-slate-500 mt-3 pt-3 border-t">
          +{data.length - 5} siswa lainnya
        </p>
      )}
    </div>
  );
};

// ==================== STAT CARD ====================

const StatCard = ({ icon: Icon, label, value, subtitle, colorClass }) => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-600">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const AdminReports = ({ user, onShowToast }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({});
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    data: null,
    type: null,
  });
  const [classOptions, setClassOptions] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // Monitoring data
  const [atRiskAttendance, setAtRiskAttendance] = useState([]);
  const [atRiskGrades, setAtRiskGrades] = useState([]);
  const [highRiskStudents, setHighRiskStudents] = useState([]);
  const [monitoringLoading, setMonitoringLoading] = useState(false);

  const REPORT_CARDS = [
    {
      id: "teachers",
      icon: Users,
      title: "Data Guru",
      description: "Master data lengkap semua guru",
      stats: `${stats.totalTeachers || 0} guru`,
      colorCard: "bg-blue-50 border-blue-200",
      colorIcon: "bg-blue-100 text-blue-600",
    },
    {
      id: "students",
      icon: GraduationCap,
      title: "Data Siswa",
      description: "Master data semua siswa aktif",
      stats: `${stats.totalStudents || 0} siswa`,
      colorCard: "bg-green-50 border-green-200",
      colorIcon: "bg-green-100 text-green-600",
    },
    {
      id: "attendance-recap",
      icon: CheckCircle,
      title: "Rekapitulasi Kehadiran",
      description: "Statistik kehadiran per siswa",
      stats: `Rata-rata: ${stats.attendanceToday || 0}%`,
      colorCard: "bg-orange-50 border-orange-200",
      colorIcon: "bg-orange-100 text-orange-600",
    },
    {
      id: "grades",
      icon: BarChart3,
      title: "Data Nilai",
      description: "Nilai akademik semua mata pelajaran",
      stats: `Rata-rata Akhir: ${stats.averageGrade || 0}`,
      colorCard: "bg-purple-50 border-purple-200",
      colorIcon: "bg-purple-100 text-purple-600",
    },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchClassOptions(),
        fetchAcademicYears(),
        fetchMonitoringData(),
      ]);
    } catch (err) {
      setError("Gagal memuat data awal");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const currentAcademicYear =
        currentMonth >= 7
          ? `${currentYear}/${currentYear + 1}`
          : `${currentYear - 1}/${currentYear}`;

      const [
        teachersResult,
        studentsResult,
        classesResult,
        attendanceResult,
        gradesResult,
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id", { count: "exact" })
          .in("role", TEACHER_ROLES)
          .neq("username", "adenurmughni")
          .eq("is_active", true),

        supabase
          .from("students")
          .select("id", { count: "exact" })
          .eq("is_active", true),

        supabase.from("classes").select("id", { count: "exact" }),

        supabase.from("attendances").select("status").eq("date", today),

        supabase
          .from("grades")
          .select("*, students(nis, full_name, class_id)")
          .eq("academic_year", currentAcademicYear),
      ]);

      const attendanceData = attendanceResult.data || [];
      const presentCount = attendanceData.filter(
        (a) => a.status?.toLowerCase() === "hadir"
      ).length;
      const attendanceRate =
        attendanceData.length > 0
          ? Math.round((presentCount / attendanceData.length) * 100)
          : 0;

      const finalGrades = calculateFinalGrades(gradesResult.data || []);
      const finalScores = finalGrades
        .map((g) => g.final_score)
        .filter((s) => !isNaN(s));
      const avgGrade =
        finalScores.length > 0
          ? (
              finalScores.reduce((a, b) => a + b, 0) / finalScores.length
            ).toFixed(1)
          : 0;

      setStats({
        totalTeachers: teachersResult.count || 0,
        totalStudents: studentsResult.count || 0,
        totalClasses: classesResult.count || 0,
        activeUsers: (teachersResult.count || 0) + (studentsResult.count || 0),
        attendanceToday: attendanceRate,
        averageGrade: avgGrade,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchMonitoringData = async () => {
    setMonitoringLoading(true);
    try {
      const classId = filters.class_id || null;

      const [attRisk, gradeRisk] = await Promise.all([
        calculateAtRiskStudents(classId),
        calculateLowGradeStudents(classId, 70),
      ]);

      setAtRiskAttendance(attRisk);
      setAtRiskGrades(gradeRisk);
      setHighRiskStudents(calculateHighRiskStudents(attRisk, gradeRisk));
    } catch (err) {
      console.error("Error fetching monitoring data:", err);
    } finally {
      setMonitoringLoading(false);
    }
  };

  const fetchClassOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id")
        .order("id");

      if (error) throw error;
      setClassOptions(data?.map((c) => c.id) || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("academic_year")
        .order("academic_year", { ascending: false });

      if (error) throw error;

      const uniqueYears = [
        ...new Set(data?.map((s) => s.academic_year).filter(Boolean)),
      ];
      setAcademicYears(uniqueYears);
    } catch (err) {
      console.error("Error fetching academic years:", err);
      setAcademicYears(["2025/2026", "2024/2025", "2023/2024"]);
    }
  };

  const fetchReportData = async (reportType) => {
    let reportTitle = "";
    let result = null;

    try {
      switch (reportType) {
        case "teachers":
          reportTitle = "DATA GURU";
          result = await fetchTeachersData(filters);
          break;

        case "students":
          reportTitle = "DATA SISWA";
          result = await fetchStudentsData(filters, true);
          break;

        case "attendance-recap":
          reportTitle = "REKAPITULASI KEHADIRAN";
          result = await fetchAttendanceRecapData(filters);
          break;

        case "grades":
          reportTitle = "DATA NILAI AKADEMIK";
          result = await fetchGradesData(filters, null, true);
          result.headers = REPORT_HEADERS.gradesFinalOnly;
          break;

        default:
          throw new Error("Tipe laporan tidak valid");
      }

      // DEBUG: Log data structure
      console.log(`📊 ${reportType} Data:`, {
        fullData: result.fullData?.length || 0,
        headers: result.headers?.length || 0,
        summary: result.summary,
        reportTitle,
      });

      return {
        ...result,
        reportTitle,
        reportType,
      };
    } catch (err) {
      console.error("Error in fetchReportData:", err);
      throw err;
    }
  };

  const previewReport = async (reportType) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`🔄 Starting preview for: ${reportType}`);

      const data = await fetchReportData(reportType);

      // PASTIKAN data structure benar
      const modalData = {
        ...data,
        fullData: data.fullData || [],
        headers: data.headers || [],
        summary: data.summary || {},
        reportTitle: data.reportTitle || `LAPORAN ${reportType.toUpperCase()}`,
        reportType: data.reportType || reportType,
      };

      console.log("📨 Sending to modal:", modalData);

      setPreviewModal({
        isOpen: true,
        data: modalData,
        type: reportType,
      });

      if (onShowToast) {
        onShowToast("Preview berhasil dimuat", "success");
      } else {
        setSuccess("Preview berhasil dimuat");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("❌ Preview error:", err);
      const errorMsg = `Gagal memuat preview: ${err.message}`;
      if (onShowToast) {
        onShowToast(errorMsg, "error");
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportType, format) => {
    setLoading(true);
    setError(null);
    try {
      // Gunakan data dari modal jika ada, atau fetch baru
      const data = previewModal.data || (await fetchReportData(reportType));

      if (!data.fullData || data.fullData.length === 0) {
        throw new Error("Tidak ada data untuk di-download");
      }

      const filterDescription = buildFilterDescription(filters);

      const metadata = {
        title: data.reportTitle || "LAPORAN",
        academicYear: filters.academic_year || "2025/2026",
        semester: filters.semester ? `Semester ${filters.semester}` : null,
        filters: filterDescription,
        summary: data.summary,
      };

      await exportToExcel(data.fullData, data.headers, metadata, {
        role: "admin",
        reportType: reportType,
      });

      const successMsg = "File Excel berhasil didownload";
      if (onShowToast) {
        onShowToast(successMsg, "success");
      } else {
        setSuccess(successMsg);
        setTimeout(() => setSuccess(null), 3000);
      }

      setPreviewModal({ isOpen: false, data: null, type: null });
    } catch (err) {
      const errorMsg = `Gagal download: ${err.message}`;
      if (onShowToast) {
        onShowToast(errorMsg, "error");
      } else {
        setError(errorMsg);
      }
      console.error("Download error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleApplyFilter = () => {
    fetchMonitoringData();
  };

  // DEBUG: Log modal state changes
  useEffect(() => {
    if (previewModal.isOpen) {
      console.log("🪟 Modal Opened:", {
        isOpen: previewModal.isOpen,
        data: previewModal.data,
        type: previewModal.type,
      });
    }
  }, [previewModal.isOpen]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Laporan Admin
              </h1>
              <p className="text-slate-600">
                SMP Muslimin Cililin - Monitoring & Export Laporan Sekolah
              </p>
            </div>
          </div>
        </div>

        {!onShowToast && success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-600 hover:text-green-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {!onShowToast && error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Guru"
            value={stats.totalTeachers || 0}
            subtitle="Guru aktif"
            colorClass="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={GraduationCap}
            label="Total Siswa"
            value={stats.totalStudents || 0}
            subtitle="Siswa aktif"
            colorClass="bg-green-100 text-green-600"
          />
          <StatCard
            icon={Building}
            label="Total Kelas"
            value={stats.totalClasses || 0}
            subtitle="Semua tingkat"
            colorClass="bg-purple-100 text-purple-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Kehadiran Hari Ini"
            value={`${stats.attendanceToday || 0}%`}
            subtitle={`Rata-rata nilai akhir: ${stats.averageGrade || 0}`}
            colorClass="bg-indigo-100 text-indigo-600"
          />
        </div>

        {/* MONITORING SECTION */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Monitoring Siswa
          </h2>

          <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter Kelas (Opsional)
                </label>
                <select
                  value={filters.class_id || ""}
                  onChange={(e) =>
                    handleFilterChange("class_id", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option value="">Semua Kelas</option>
                  {classOptions.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyFilter}
                  disabled={monitoringLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium">
                  Refresh Data
                </button>
                <button
                  onClick={handleResetFilters}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium">
                  Reset
                </button>
              </div>
            </div>
          </div>

          {monitoringLoading ? (
            <div className="text-center py-8">
              <p className="text-slate-600">Memproses data monitoring...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MonitoringCard
                title="Siswa Absensi Tinggi (< 75%)"
                data={atRiskAttendance}
                icon={TrendingDown}
                color="bg-red-50 border-red-200"
                type="attendance"
              />
              <MonitoringCard
                title="Siswa Nilai Rendah (< 70)"
                data={atRiskGrades}
                icon={AlertCircle}
                color="bg-orange-50 border-orange-200"
                type="grades"
              />
              <MonitoringCard
                title="Siswa High Risk (Both Issues)"
                data={highRiskStudents}
                icon={AlertTriangle}
                color="bg-red-50 border-red-300"
                type="highRisk"
              />
            </div>
          )}
        </div>

        {/* EXPORT REPORTS SECTION */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Export Laporan Lengkap
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {REPORT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`bg-white rounded-lg shadow-sm border-2 ${card.colorCard} p-4 hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl ${card.colorIcon} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-800 mb-1.5">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                  {card.description}
                </p>
                <p className="text-xs text-slate-500 mb-3">{card.stats}</p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => previewReport(card.id)}
                    disabled={loading}
                    className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => downloadReport(card.id, "xlsx")}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-slate-700 font-medium">Memproses laporan...</p>
            </div>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={previewModal.isOpen}
        onClose={() =>
          setPreviewModal({ isOpen: false, data: null, type: null })
        }
        reportData={previewModal.data || {}}
        reportType={previewModal.type}
        role="admin"
        onDownload={downloadReport}
        loading={loading}
      />
    </div>
  );
};

export default AdminReports;

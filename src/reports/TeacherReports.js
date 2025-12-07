import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import {
  FileText,
  BookOpen,
  BarChart3,
  Eye,
  Filter,
  X,
  AlertTriangle,
  ChevronDown,
  FileSpreadsheet,
  Users,
  GraduationCap,
  CheckCircle,
  Calendar,
  TrendingUp,
} from "lucide-react";

import { exportToExcel } from "./ReportExcel";
import ReportModal from "./modals/TeacherReportModal";
import {
  fetchGradesData,
  fetchAttendanceDailyData,
  fetchAttendanceRecapData,
  buildFilterDescription,
  calculateFinalGrades,
  REPORT_HEADERS,
} from "./ReportHelpers";

// ==================== CONSTANTS ====================

// ✅ FIX: Tailwind color classes mapping
const COLOR_CLASSES = {
  indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-600" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
  teal: { bg: "bg-teal-100", text: "text-teal-600" },
};

// ==================== COMPONENTS ====================

// ✅ FIXED: StatCard with proper color classes
const StatCard = ({
  icon: Icon,
  label,
  value,
  color = "indigo",
  alert = false,
}) => {
  const colors = COLOR_CLASSES[color] || COLOR_CLASSES.indigo;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border ${
        alert ? "border-red-300" : "border-slate-200"
      } p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        {alert && <AlertTriangle className="w-5 h-5 text-red-500" />}
      </div>
    </div>
  );
};

const FilterPanel = ({
  filters,
  onFilterChange,
  onReset,
  subjectOptions = [],
  academicYears = [],
  classOptions = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    [
      "academic_year",
      "semester",
      "subject",
      "class_id",
      "start_date",
      "end_date",
    ].forEach((key) => {
      if (filters[key] && filters[key] !== "") count++;
    });
    return count;
  }, [filters]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Filter Laporan</h3>
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount} Filter Aktif
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-600 hover:text-slate-800">
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-3 border-t border-slate-200">
          {subjectOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mata Pelajaran
              </label>
              <select
                value={filters.subject || ""}
                onChange={(e) => onFilterChange("subject", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Semua Mapel</option>
                {subjectOptions.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>
          )}

          {classOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Kelas
              </label>
              <select
                value={filters.class_id || ""}
                onChange={(e) => onFilterChange("class_id", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Semua Kelas</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tahun Ajaran
            </label>
            <select
              value={filters.academic_year || ""}
              onChange={(e) => onFilterChange("academic_year", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Semua Tahun</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Semester
            </label>
            <select
              value={filters.semester || ""}
              onChange={(e) => onFilterChange("semester", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Semua Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={filters.start_date || ""}
              onChange={(e) => onFilterChange("start_date", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filters.end_date || ""}
              onChange={(e) => onFilterChange("end_date", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end md:col-span-3 lg:col-span-4">
            <button
              onClick={onReset}
              className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
              <X className="w-4 h-4" />
              Reset Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const TeacherReports = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [downloadingReportId, setDownloadingReportId] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    subject: "Mata Pelajaran",
    averageGrade: 0,
    totalGrades: 0,
    attendanceRate: 0,
  });
  const [filters, setFilters] = useState({});
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    data: null,
    type: null,
  });
  const [success, setSuccess] = useState(null);
  const [alertStudents, setAlertStudents] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);

  const teacherId = user?.teacher_id;
  const userUUID = user?.id;

  // ✅ FIX: Race condition dengan Promise.all
  useEffect(() => {
    const loadAllData = async () => {
      if (!teacherId || !userUUID) {
        console.error("Teacher ID atau User ID tidak tersedia:", user);
        setError("Data teacher tidak lengkap");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await Promise.all([
          fetchSubjects(),
          fetchAcademicYears(),
          fetchStats(),
        ]);
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Gagal memuat data awal. Silakan refresh halaman.");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [teacherId, userUUID]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("teacher_assignments")
        .select("subject, class_id")
        .eq("teacher_id", teacherId)
        .order("subject");

      if (error) throw error;

      // ✅ FIX: Store assignments for validation
      setTeacherAssignments(data || []);

      const uniqueSubjects = [...new Set(data.map((item) => item.subject))];
      const uniqueClasses = [...new Set(data.map((item) => item.class_id))];

      setSubjectOptions(uniqueSubjects);
      setClassOptions(uniqueClasses);

      if (uniqueSubjects.length > 0) {
        setFilters({ subject: uniqueSubjects[0] });
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setError("Gagal memuat mata pelajaran");
      throw err;
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("teacher_assignments")
        .select("academic_year")
        .eq("teacher_id", teacherId)
        .order("academic_year", { ascending: false });

      if (assignmentError) throw assignmentError;

      let uniqueYears = [];

      if (assignmentData && assignmentData.length > 0) {
        uniqueYears = [
          ...new Set(assignmentData.map((item) => item.academic_year)),
        ].filter(Boolean);
      } else {
        const { data: gradesData, error: gradesError } = await supabase
          .from("grades")
          .select("academic_year")
          .eq("teacher_id", userUUID)
          .order("academic_year", { ascending: false });

        if (gradesError) throw gradesError;

        if (gradesData && gradesData.length > 0) {
          uniqueYears = [
            ...new Set(gradesData.map((item) => item.academic_year)),
          ].filter(Boolean);
        }
      }

      if (uniqueYears.length === 0) {
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("academic_year")
          .order("academic_year", { ascending: false });

        if (!classesError && classesData) {
          uniqueYears = [
            ...new Set(classesData.map((item) => item.academic_year)),
          ].filter(Boolean);
        }
      }

      setAcademicYears(uniqueYears.length > 0 ? uniqueYears : []);
    } catch (err) {
      console.error("Error fetching academic years:", err);
      setAcademicYears([]);
      throw err;
    }
  };

  const fetchStats = async () => {
    if (!teacherId || !userUUID) return;

    try {
      const { data: teacherAssignments, error: assignmentError } =
        await supabase
          .from("teacher_assignments")
          .select("class_id, subject, academic_year")
          .eq("teacher_id", teacherId);

      if (assignmentError) throw assignmentError;

      const classIds =
        teacherAssignments?.map((ta) => ta.class_id).filter(Boolean) || [];
      const firstAssignment = teacherAssignments?.[0];
      const subject = firstAssignment?.subject || "Mata Pelajaran";
      const teacherSubjects = [
        ...new Set(teacherAssignments.map((ta) => ta.subject)),
      ].filter(Boolean);

      let totalStudents = 0;
      if (classIds.length > 0) {
        const { count, error: studentError } = await supabase
          .from("students")
          .select("id", { count: "exact" })
          .in("class_id", classIds)
          .eq("is_active", true);

        if (!studentError) {
          totalStudents = count || 0;
        }
      }

      // ✅ FIX: Alert students logic
      let avgGrade = 0;
      let totalGrades = 0;
      const { data: allGrades, error: gradeError } = await supabase
        .from("grades")
        .select("*, students!inner(nis, full_name, class_id)")
        .eq("teacher_id", userUUID);

      if (!gradeError && allGrades && allGrades.length > 0) {
        const finalGrades = calculateFinalGrades(allGrades);
        totalGrades = finalGrades.length;

        const validScores = finalGrades
          .map((g) => g.final_score)
          .filter((score) => score != null && !isNaN(score));

        if (validScores.length > 0) {
          avgGrade = Math.round(
            validScores.reduce((sum, score) => sum + score, 0) /
              validScores.length
          );
        }

        // ✅ FIXED: Simplified alert students logic
        const alerts = finalGrades
          .filter(
            (g) =>
              g.final_score != null &&
              !isNaN(g.final_score) &&
              g.final_score < 75
          )
          .map((g) => ({
            name: g.full_name,
            nis: g.nis,
            class_id: g.class_id,
            avgScore: Math.round(g.final_score),
            totalGrades: 1,
          }))
          .sort((a, b) => a.avgScore - b.avgScore)
          .slice(0, 5);

        setAlertStudents(alerts);
      }

      // ✅ FIX: Attendance rate filtered by subject
      let attendanceRate = 0;
      if (classIds.length > 0 && teacherSubjects.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: attendanceData } = await supabase
          .from("attendances")
          .select("status")
          .in("class_id", classIds)
          .in("subject", teacherSubjects) // ✅ FIX: Filter by teacher's subjects
          .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

        if (attendanceData && attendanceData.length > 0) {
          const presentCount = attendanceData.filter(
            (a) => a.status?.toLowerCase() === "hadir"
          ).length;
          attendanceRate = Math.round(
            (presentCount / attendanceData.length) * 100
          );
        }
      }

      setStats({
        totalClasses: classIds.length,
        totalStudents: totalStudents,
        subject: subject,
        averageGrade: avgGrade,
        totalGrades: totalGrades,
        attendanceRate: attendanceRate,
      });
    } catch (err) {
      console.error("Error in teacher stats:", err);
      setError("Gagal memuat statistik");
      throw err;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    if (subjectOptions.length > 0) {
      setFilters({ subject: subjectOptions[0] });
    } else {
      setFilters({});
    }
    setError(null);
    setSuccess(null);
  };

  const fetchReportData = async (reportType) => {
    if (!userUUID || !teacherId) {
      throw new Error("User ID atau Teacher ID tidak tersedia");
    }

    // ✅ FIX: Validate assignments
    if (!teacherAssignments || teacherAssignments.length === 0) {
      throw new Error(
        "Tidak ada penugasan kelas. Hubungi admin untuk setup penugasan."
      );
    }

    const classIds = teacherAssignments
      .map((ta) => ta.class_id)
      .filter(Boolean);

    if (classIds.length === 0) {
      throw new Error("Tidak ada kelas yang diajar");
    }

    let reportTitle = "";
    let result = null;

    try {
      switch (reportType) {
        case "grades": {
          reportTitle = `DATA NILAI AKHIR ${
            filters.subject || stats.subject || "MATA PELAJARAN"
          }`;

          // ✅ FIX: Add class_ids to filters
          const gradeFilters = { ...filters, class_ids: classIds };
          result = await fetchGradesData(gradeFilters, userUUID, true);
          result.headers = REPORT_HEADERS.gradesFinalOnly;

          break;
        }

        case "attendance": {
          reportTitle = "PRESENSI MATA PELAJARAN";

          const attendanceFilters = {
            ...filters,
            class_ids: classIds,
            subject: filters.subject || stats.subject, // ✅ Tambahin ini
          };

          result = await fetchAttendanceDailyData(
            attendanceFilters,
            "Mata Pelajaran"
          );

          if (!result.fullData || result.fullData.length === 0) {
            throw new Error(
              "Tidak ada data presensi mata pelajaran untuk kelas yang Anda ajar"
            );
          }

          break;
        }

        case "attendance-recap": {
          reportTitle = "REKAPITULASI KEHADIRAN";

          // ✅ FIX: Let helper handle filtering with class_ids
          const recapFilters = { ...filters, class_ids: classIds };
          result = await fetchAttendanceRecapData(recapFilters);

          if (!result.fullData || result.fullData.length === 0) {
            throw new Error(
              "Tidak ada data rekapitulasi untuk kelas yang Anda ajar"
            );
          }

          const totalHadir = result.fullData.reduce(
            (sum, r) => sum + (r.hadir || r.Hadir || 0),
            0
          );
          const totalPresensi = result.fullData.reduce(
            (sum, r) => sum + (r.total || r.Total || 0),
            0
          );
          const avgAttendance =
            totalPresensi > 0
              ? Math.round((totalHadir / totalPresensi) * 100)
              : 0;

          result.summary = [
            { label: "Siswa Terekap", value: result.fullData.length },
            { label: "Rata-rata Hadir", value: `${avgAttendance}%` },
          ];

          break;
        }

        case "class-performance": {
          reportTitle = `PERFORMA PER KELAS - ${
            filters.subject || stats.subject
          }`;

          const performanceFilters = {
            ...filters,
            class_ids: classIds,
            subject: filters.subject || stats.subject, // ✅ Pass subject here
          };

          // ✅ Use isHomeroom=true to get final grades
          const gradesResult = await fetchGradesData(
            performanceFilters,
            userUUID,
            true
          );
          const finalGradesData =
            gradesResult.rawFinalGrades || gradesResult.fullData || [];

          console.log(
            "✅ Final grades for performance:",
            finalGradesData.length
          );

          if (finalGradesData.length === 0) {
            throw new Error(
              `Tidak ada data nilai akhir. Pastikan ada nilai NH, UTS, dan UAS yang sudah diinput.`
            );
          }

          // Group by class
          const classSummary = {};
          finalGradesData.forEach((row) => {
            const classId = row.class_id;
            if (!classId) return;

            if (!classSummary[classId]) {
              classSummary[classId] = {
                class_id: classId,
                scores: [],
                students: new Set(),
              };
            }

            const finalScore = parseFloat(row.final_score);
            if (!isNaN(finalScore) && finalScore > 0) {
              classSummary[classId].scores.push(finalScore);
              classSummary[classId].students.add(row.nis);
            }
          });

          const classAnalysis = Object.values(classSummary).map((cls) => {
            const validScores = cls.scores;
            const avg =
              validScores.length > 0
                ? Math.round(
                    validScores.reduce((a, b) => a + b, 0) / validScores.length
                  )
                : 0;

            return {
              class_id: cls.class_id,
              total_students: cls.students.size,
              total_grades: cls.scores.length,
              average: avg,
              highest:
                validScores.length > 0
                  ? Math.round(Math.max(...validScores))
                  : 0,
              lowest:
                validScores.length > 0
                  ? Math.round(Math.min(...validScores))
                  : 0,
              below_kkm: validScores.filter((s) => s < 75).length,
            };
          });

          const headers = [
            "Kelas",
            "Jumlah Siswa",
            "Total Nilai",
            "Rata-rata",
            "Tertinggi",
            "Terendah",
            "Di Bawah KKM",
          ];

          const overallAvg =
            classAnalysis.length > 0
              ? Math.round(
                  classAnalysis.reduce((sum, cls) => sum + cls.average, 0) /
                    classAnalysis.length
                )
              : 0;

          const summary = [
            { label: "Total Kelas", value: classAnalysis.length },
            { label: "Rata-rata Keseluruhan", value: overallAvg },
            {
              label: "Kelas Terbaik",
              value:
                classAnalysis.length > 0
                  ? classAnalysis.reduce((best, cls) =>
                      cls.average > best.average ? cls : best
                    ).class_id
                  : "-",
            },
          ];

          result = {
            headers,
            preview: classAnalysis,
            total: classAnalysis.length,
            fullData: classAnalysis,
            summary,
          };
          break;
        }

        default:
          throw new Error("Invalid report type");
      }

      return {
        ...result,
        reportTitle,
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
      const data = await fetchReportData(reportType);

      if (!data || !data.preview || data.preview.length === 0) {
        setError("Tidak ada data yang ditemukan dengan filter yang dipilih");
        return;
      }

      setPreviewModal({ isOpen: true, data, type: reportType });
      setSuccess("✅ Preview berhasil dimuat");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Gagal preview laporan: ${err.message}`);
      console.error("Preview error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportType, format) => {
    setDownloadingReportId(reportType);
    setError(null);

    try {
      let data;

      if (
        previewModal.isOpen &&
        previewModal.type === reportType &&
        previewModal.data?.fullData
      ) {
        data = previewModal.data;
      } else {
        data = await fetchReportData(reportType);
      }

      if (!data || !data.fullData) {
        throw new Error("Data tidak tersedia untuk di-download");
      }

      const filterDescription = buildFilterDescription(filters);

      const metadata = {
        title:
          data.reportTitle || `LAPORAN ${stats.subject || "MATA PELAJARAN"}`,
        academicYear: filters.academic_year,
        semester: filters.semester ? `Semester ${filters.semester}` : null,
        filters: filterDescription,
        summary: data.summary,
      };

      await exportToExcel(data.fullData, data.headers, metadata, {
        role: "teacher",
        reportType: reportType,
      });

      setSuccess("✅ File Excel berhasil didownload!");
      setTimeout(() => setSuccess(null), 5000);
      setPreviewModal({ isOpen: false, data: null, type: null });
    } catch (err) {
      setError(`Gagal download laporan: ${err.message}`);
      console.error("Download error:", err);
    } finally {
      setDownloadingReportId(null);
    }
  };

  const reports = [
    {
      id: "grades",
      icon: BarChart3,
      title: "Laporan Nilai Akhir",
      description: "Export data nilai akhir mata pelajaran",
      stats: `${stats.totalGrades || 0} nilai akhir`,
      color: "purple",
    },
    {
      id: "attendance",
      icon: Calendar,
      title: "Laporan Presensi Harian",
      description: "Data kehadiran siswa per hari",
      stats: "Data presensi kelas Anda",
      color: "yellow",
    },
    {
      id: "attendance-recap",
      icon: CheckCircle,
      title: "Rekapitulasi Kehadiran",
      description: "Ringkasan total kehadiran per siswa",
      stats: "Rekapitulasi dalam periode filter",
      color: "orange",
    },
    {
      id: "class-performance",
      icon: TrendingUp,
      title: "Performa Per Kelas",
      description: "Perbandingan nilai akhir antar kelas",
      stats: `${stats.totalClasses || 0} kelas diampu`,
      color: "blue",
    },
  ];

  // ✅ FIX: Loading state
  if (loading && !stats.totalClasses) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Memuat data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Laporan - Guru Mata Pelajaran
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {user.full_name} - {stats.subject || "Mata Pelajaran"}
              </p>
            </div>
          </div>
          <p className="text-slate-600">
            Kelola laporan nilai akhir dan kehadiran siswa di kelas yang Anda
            ajar
          </p>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </span>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-800 hover:text-green-900 font-bold">
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </span>
              <button
                onClick={() => setError(null)}
                className="text-red-800 hover:text-red-900 font-bold">
                ×
              </button>
            </div>
          </div>
        )}

        {/* ✅ FIX: Empty state for no assignments */}
        {teacherAssignments.length === 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Belum Ada Penugasan Kelas
                </h3>
                <p className="text-sm text-yellow-800">
                  Anda belum memiliki penugasan mata pelajaran. Silakan hubungi
                  admin untuk setup penugasan kelas dan mata pelajaran.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={BookOpen}
            label="Mata Pelajaran"
            value={stats.subject || "Mata Pelajaran"}
            color="indigo"
          />
          <StatCard
            icon={Users}
            label="Kelas Diampu"
            value={stats.totalClasses || 0}
            color="blue"
          />
          <StatCard
            icon={GraduationCap}
            label="Total Siswa"
            value={stats.totalStudents || 0}
            color="green"
          />
          <StatCard
            icon={BarChart3}
            label="Rata-rata Nilai Akhir"
            value={stats.averageGrade > 0 ? stats.averageGrade : "N/A"}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            icon={FileText}
            label="Total Nilai Akhir"
            value={stats.totalGrades || 0}
            color="cyan"
          />
          <StatCard
            icon={CheckCircle}
            label="Tingkat Kehadiran"
            value={`${stats.attendanceRate || 0}%`}
            color="emerald"
          />
        </div>

        {subjectOptions.length > 0 && (
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={resetFilters}
            subjectOptions={subjectOptions}
            academicYears={academicYears}
            classOptions={classOptions}
          />
        )}

        {alertStudents.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-2">
                  🎯 Siswa Perlu Perhatian Khusus
                </h3>
                <p className="text-sm text-orange-800 mb-3">
                  Siswa dengan nilai akhir di bawah KKM (75) - perlu bimbingan
                  tambahan
                </p>
                <div className="space-y-2">
                  {alertStudents.map((student, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {student.name} ({student.nis}) - {student.class_id}
                          </p>
                          <p className="text-xs text-slate-600">
                            Nilai Akhir: {student.avgScore}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-lg font-bold ${
                              student.avgScore < 60
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}>
                            {student.avgScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {reports.map((report) => {
            const Icon = report.icon;
            const isDownloading = downloadingReportId === report.id;
            const colors = COLOR_CLASSES[report.color] || COLOR_CLASSES.indigo;

            return (
              <div
                key={report.id}
                className={`bg-white rounded-lg shadow-sm border-2 border-${report.color}-200 p-4 hover:shadow-md transition-all duration-200`}>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-800 mb-1.5 leading-tight">
                  {report.title}
                </h3>

                <p className="text-xs text-slate-600 mb-2 leading-tight line-clamp-2">
                  {report.description}
                </p>

                <p className="text-xs text-slate-500 mb-3 font-medium">
                  {report.stats}
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => previewReport(report.id)}
                    disabled={loading || downloadingReportId}
                    className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-gray-300 text-slate-700 px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                    {loading ? "Memuat..." : "Preview"}
                  </button>

                  <button
                    onClick={() => downloadReport(report.id, "xlsx")}
                    disabled={
                      loading ||
                      isDownloading ||
                      (downloadingReportId && !isDownloading)
                    }
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {isDownloading ? "Exporting..." : "Export"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            📊 Informasi Laporan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Format File
              </h4>
              <p className="text-sm text-slate-600">
                Laporan tersedia dalam format Excel dengan styling profesional
                dan summary statistik.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Cakupan Data
              </h4>
              <p className="text-sm text-slate-600">
                Laporan mencakup data <strong>nilai akhir</strong> dan kehadiran
                siswa di kelas yang Anda ajar.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview & Filter
              </h4>
              <p className="text-sm text-slate-600">
                Gunakan filter untuk menyaring data. Klik "Preview" untuk
                melihat data sebelum export.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <div className="text-indigo-600 text-xl">💡</div>
            <div>
              <h4 className="font-medium text-indigo-900 mb-1">
                Tips Penggunaan:
              </h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>
                  • <strong>Laporan Nilai Akhir</strong> untuk export data nilai
                  akhir mata pelajaran Anda
                </li>
                <li>
                  • <strong>Presensi Harian</strong> untuk monitoring kehadiran
                  siswa per hari
                </li>
                <li>
                  • <strong>Rekapitulasi Kehadiran</strong> untuk melihat total
                  kehadiran per siswa
                </li>
                <li>
                  • <strong>Performa Per Kelas</strong> untuk membandingkan
                  performa nilai akhir antar kelas
                </li>
                <li>
                  • Gunakan filter tanggal untuk laporan presensi periode
                  tertentu
                </li>
                <li>
                  • Perhatikan siswa dalam daftar "Perlu Perhatian Khusus" untuk
                  intervensi dini!
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={previewModal.isOpen}
        onClose={() =>
          setPreviewModal({ isOpen: false, data: null, type: null })
        }
        reportData={previewModal.data || {}}
        reportType={previewModal.type}
        role="teacher"
        onDownload={downloadReport}
        loading={downloadingReportId !== null}
      />
    </div>
  );
};

export default TeacherReports;

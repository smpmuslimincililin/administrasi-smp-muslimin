// reports/ReportHelpers.js
// ============================================
// 🎯 CENTRALIZED REPORT HELPERS - FIXED
// ============================================

import { supabase } from "../supabaseClient";

// ==================== CONSTANTS ====================

export const TEACHER_ROLES = ["teacher", "guru_bk"];

export const ATTENDANCE_STATUS_MAP = {
  hadir: "Hadir",
  tidak_hadir: "Tidak Hadir",
  alpa: "Alpa",
  sakit: "Sakit",
  izin: "Izin",
};

export const ATTENDANCE_TYPES = {
  HARIAN: "harian",
  MATA_PELAJARAN: "mapel",
};

// ==================== DATE FORMATTERS ====================

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return "-";

  try {
    const defaultOptions = {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...options,
    };

    return new Date(dateString).toLocaleDateString("id-ID", defaultOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "-";

  try {
    return new Date(dateString).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return "-";
  }
};

// ✅ NEW: Month/Year helpers
export const getMonthOptions = () => {
  return [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];
};

export const getYearOptions = () => {
  const years = [];
  for (let i = 2025; i <= 2030; i++) {
    years.push(i.toString());
  }
  return years;
};

export const getMonthDateRange = (month, year) => {
  if (!month || !year) {
    // Default to current month
    const now = new Date();
    month = String(now.getMonth() + 1).padStart(2, "0");
    year = now.getFullYear().toString();
  }

  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

  return { startDate, endDate };
};

// ==================== STATUS FORMATTERS ====================

export const formatRole = (role) => {
  const roleMap = {
    guru_bk: "Guru BK",
    teacher: "Guru",
    homeroom: "Wali Kelas",
    admin: "Admin",
    kepala_sekolah: "Kepala Sekolah",
  };
  return roleMap[role?.toLowerCase()] || role || "-";
};

export const formatGender = (gender) => {
  if (!gender) return "-";
  return gender.toUpperCase() === "L" ? "Laki-laki" : "Perempuan";
};

export const formatActiveStatus = (isActive) => {
  return isActive ? "Aktif" : "Tidak Aktif";
};

export const formatAttendanceStatus = (status) => {
  const lowerStatus = status?.toLowerCase() || "";
  return ATTENDANCE_STATUS_MAP[lowerStatus] || status || "-";
};

// ==================== STANDARDIZED HEADERS ====================

export const REPORT_HEADERS = {
  teachers: [
    "Kode Guru",
    "Username",
    "Nama Lengkap",
    "Role",
    "Wali Kelas",
    "Status",
    "Tanggal Bergabung",
  ],

  students: [
    "NIS",
    "Nama Lengkap",
    "Jenis Kelamin",
    "Kelas",
    "Tingkat",
    "Tahun Ajaran",
  ],

  studentsSimple: [
    "NIS",
    "Nama Lengkap",
    "Jenis Kelamin",
    "Kelas",
    "Tahun Ajaran",
  ],

  attendance: ["Tanggal", "NIS", "Nama Siswa", "Kelas", "Status Kehadiran"],

  attendanceWithSubject: [
    "Tanggal",
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Mata Pelajaran",
    "Status Kehadiran",
  ],

  attendanceRecap: [
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Hadir",
    "Sakit",
    "Izin",
    "Absen",
    "Total",
    "Persentase",
  ],

  grades: [
    "Tahun Ajaran",
    "Semester",
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Mata Pelajaran",
    "Jenis",
    "Nilai",
    "Guru",
  ],

  gradesSimple: [
    "Tahun Ajaran",
    "Semester",
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Mata Pelajaran",
    "Jenis",
    "Nilai",
  ],

  gradesFinalOnly: [
    "Tahun Ajaran",
    "Semester",
    "NIS",
    "Nama Siswa",
    "Kelas",
    "Mata Pelajaran",
    "Nilai Akhir",
    "Guru",
  ],
};

// ==================== ROW FORMATTERS ====================

export const formatTeacherRow = (row) => ({
  teacher_id: row.teacher_id || "-",
  username: row.username || "-",
  full_name: row.full_name || "-",
  role: formatRole(row.role),
  homeroom_class_id: row.homeroom_class_id || "-",
  is_active: formatActiveStatus(row.is_active),
  created_at: formatDate(row.created_at),
});

export const formatStudentRow = (row, includeGrade = true) => {
  const base = {
    nis: row.nis || "-",
    full_name: row.full_name || "-",
    gender: formatGender(row.gender),
    class_id: row.class_id || "-",
  };

  if (includeGrade) {
    base.grade = row.classes?.grade || row.grade || "-";
  }

  base.academic_year = row.academic_year || "-";

  return base;
};

export const formatAttendanceRow = (row, includeSubject = false) => {
  const base = {
    date: formatDate(row.date),
    student_nis: row.students?.nis || row.nis || "-",
    student_name: row.students?.full_name || row.full_name || "-",
    class_id: row.students?.class_id || row.class_id || "-",
  };

  if (includeSubject) {
    base.subject = row.subject || "-";
  }

  base.status = formatAttendanceStatus(row.status);

  return base;
};

export const formatGradeRow = (row, teacherMap = {}) => ({
  academic_year: row.academic_year || "-",
  semester: row.semester || "-",
  nis: row.students?.nis || row.nis || "-",
  full_name: row.students?.full_name || row.full_name || "-",
  class_id: row.students?.class_id || row.class_id || "-",
  subject: row.subject || "-",
  assignment_type: row.assignment_type || "-",
  score: row.score || 0,
  teacher: teacherMap[row.teacher_id] || row.users?.full_name || "-",
});

export const formatFinalGradeRow = (row, teacherMap = {}) => ({
  academic_year: row.academic_year || "-",
  semester: row.semester || "-",
  nis: row.nis || "-",
  full_name: row.full_name || "-",
  class_id: row.class_id || "-",
  subject: row.subject || "-",
  final_score: row.final_score ? Math.round(row.final_score * 100) / 100 : 0,
  teacher: teacherMap[row.teacher_id] || row.teacher_name || "-",
});

// ==================== DATA FETCHERS ====================

export const fetchTeachersData = async (filters = {}) => {
  let query = supabase
    .from("users")
    .select("*")
    .in("role", TEACHER_ROLES)
    .neq("username", "adenurmughni")
    .eq("is_active", true)
    .order("teacher_id");

  const { data, error } = await query;
  if (error) throw error;

  const formattedData = data?.map(formatTeacherRow) || [];

  return {
    headers: REPORT_HEADERS.teachers,
    preview: formattedData.slice(0, 100),
    fullData: formattedData,
    total: formattedData.length,
    summary: calculateTeacherSummary(data || []),
  };
};

export const fetchStudentsData = async (filters = {}, includeGrade = true) => {
  let query = supabase
    .from("students")
    .select("*, classes(grade)")
    .eq("is_active", true);

  if (filters.class_id) query = query.eq("class_id", filters.class_id);
  if (filters.academic_year)
    query = query.eq("academic_year", filters.academic_year);

  query = query.order("class_id").order("full_name");

  const { data, error } = await query;
  if (error) throw error;

  const formattedData =
    data?.map((row) => formatStudentRow(row, includeGrade)) || [];

  return {
    headers: includeGrade
      ? REPORT_HEADERS.students
      : REPORT_HEADERS.studentsSimple,
    preview: formattedData.slice(0, 100),
    fullData: formattedData,
    total: formattedData.length,
    summary: calculateStudentSummary(data || []),
  };
};

export const fetchAttendanceRecapData = async (
  filters = {},
  attendanceType = null
) => {
  // ✅ FIXED: Use month/year if provided, else default
  let startDate, endDate;

  if (filters.month && filters.year) {
    const range = getMonthDateRange(filters.month, filters.year);
    startDate = range.startDate;
    endDate = range.endDate;
  } else {
    startDate =
      filters.start_date ||
      new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
    endDate = filters.end_date || new Date().toISOString().split("T")[0];
  }

  let query = supabase
    .from("attendances")
    .select("*, students!inner(nis, full_name, class_id)")
    .gte("date", startDate)
    .lte("date", endDate);

  if (attendanceType === "Mata Pelajaran") {
    query = query.eq("type", "mapel");
  } else if (attendanceType === "Harian") {
    query = query.eq("type", "harian");
  }

  if (filters.class_ids && filters.class_ids.length > 0) {
    query = query.in("class_id", filters.class_ids);
  } else if (filters.class_id) {
    query = query.eq("class_id", filters.class_id);
  }

  if (filters.subject) {
    query = query.eq("subject", filters.subject);
  }

  const { data: rawAttendance, error } = await query;
  if (error) throw error;

  const recapData = {};
  (rawAttendance || []).forEach((record) => {
    const key = record.student_id;
    if (!recapData[key]) {
      recapData[key] = {
        nis: record.students?.nis || "-",
        name: record.students?.full_name || "-",
        class_id: record.students?.class_id || "-",
        hadir: 0,
        sakit: 0,
        izin: 0,
        tidak_hadir: 0,
        total: 0,
      };
    }

    recapData[key].total++;
    const status = record.status?.toLowerCase() || "";

    if (status === "hadir") recapData[key].hadir++;
    else if (status === "sakit") recapData[key].sakit++;
    else if (status === "izin") recapData[key].izin++;
    else if (status === "alpa" || status === "tidak_hadir")
      recapData[key].tidak_hadir++;
  });

  const finalData = Object.values(recapData)
    .map((r) => ({
      ...r,
      persentase:
        r.total > 0 ? `${Math.round((r.hadir / r.total) * 100)}%` : "0%",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    headers: REPORT_HEADERS.attendanceRecap,
    preview: finalData.slice(0, 100),
    fullData: finalData,
    total: finalData.length,
    summary: calculateAttendanceSummary(finalData),
  };
};

export const fetchGradesData = async (
  filters = {},
  teacherId = null,
  isHomeroom = false
) => {
  let query = supabase
    .from("grades")
    .select(
      "*, students!inner(nis, full_name, class_id), users!inner(full_name)"
    );

  if (teacherId) query = query.eq("teacher_id", teacherId);

  if (filters.class_ids && filters.class_ids.length > 0) {
    query = query.in("students.class_id", filters.class_ids);
  } else if (filters.class_id) {
    query = query.eq("students.class_id", filters.class_id);
  }

  if (filters.academic_year)
    query = query.eq("academic_year", filters.academic_year);
  if (filters.semester) query = query.eq("semester", filters.semester);
  if (filters.subject) query = query.eq("subject", filters.subject);

  query = query.order("academic_year", { ascending: false }).order("semester");

  const { data, error } = await query;
  if (error) throw error;

  console.log("✅ Grades fetched:", data?.length, "records");

  if (isHomeroom) {
    const finalGrades = calculateFinalGrades(data || []);

    const teacherMap = {};
    (data || []).forEach((row) => {
      if (row.teacher_id && row.users?.full_name) {
        teacherMap[row.teacher_id] = row.users.full_name;
      }
    });

    const formattedData = finalGrades.map((row) =>
      formatFinalGradeRow(row, teacherMap)
    );

    return {
      headers: REPORT_HEADERS.gradesFinalOnly,
      preview: formattedData.slice(0, 100),
      fullData: formattedData,
      total: formattedData.length,
      summary: calculateFinalGradeSummary(finalGrades),
      rawFinalGrades: finalGrades,
    };
  }

  const formattedData = data?.map((row) => formatGradeRow(row)) || [];

  return {
    headers: REPORT_HEADERS.grades,
    preview: formattedData.slice(0, 100),
    fullData: formattedData,
    total: formattedData.length,
    summary: calculateGradeSummary(data || []),
  };
};

export const fetchAttendanceDailyData = async (
  filters = {},
  attendanceType = null
) => {
  // ✅ FIXED: Use month/year if provided
  let startDate, endDate;

  if (filters.month && filters.year) {
    const range = getMonthDateRange(filters.month, filters.year);
    startDate = range.startDate;
    endDate = range.endDate;
  } else {
    startDate =
      filters.start_date ||
      (() => {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split("T")[0];
      })();
    endDate = filters.end_date || new Date().toISOString().split("T")[0];
  }

  let query = supabase
    .from("attendances")
    .select(
      "date, student_id, status, subject, type, class_id, students!inner(nis, full_name, class_id)"
    )
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (attendanceType === "Mata Pelajaran") {
    query = query.eq("type", "mapel");
  } else if (attendanceType === "Harian") {
    query = query.eq("type", "harian");
  }

  if (filters.class_ids && filters.class_ids.length > 0) {
    query = query.in("class_id", filters.class_ids);
  } else if (filters.class_id) {
    query = query.eq("class_id", filters.class_id);
  }

  if (filters.subject) {
    query = query.eq("subject", filters.subject);
  }

  const { data, error } = await query;
  if (error) throw error;

  const includeSubject = attendanceType === "Mata Pelajaran";
  const formattedData =
    data?.map((row) => formatAttendanceRow(row, includeSubject)) || [];

  const totalRecords = data?.length || 0;
  const hadirCount =
    data?.filter((d) => d.status?.toLowerCase() === "hadir").length || 0;
  const hadirPercent =
    totalRecords > 0 ? Math.round((hadirCount / totalRecords) * 100) : 0;

  const summary = [
    { label: "Total Records", value: totalRecords },
    { label: "Hadir", value: `${hadirPercent}%` },
    { label: "Tidak Hadir", value: totalRecords - hadirCount },
  ];

  return {
    headers: includeSubject
      ? REPORT_HEADERS.attendanceWithSubject
      : REPORT_HEADERS.attendance,
    preview: formattedData.slice(0, 100),
    fullData: formattedData,
    total: formattedData.length,
    summary,
  };
};

// ==================== SUMMARY CALCULATORS ====================

export const calculateStudentSummary = (data) => {
  const maleCount = data.filter((s) => s.gender === "L").length;
  const femaleCount = data.filter((s) => s.gender === "P").length;
  const classes = [...new Set(data.map((s) => s.class_id))].filter(Boolean);

  return [
    { label: "Total Siswa", value: data.length },
    { label: "Laki-laki", value: maleCount },
    { label: "Perempuan", value: femaleCount },
    { label: "Jumlah Kelas", value: classes.length },
  ];
};

export const calculateTeacherSummary = (data) => {
  const activeCount = data.filter((t) => t.is_active === true).length;
  const homeroomCount = data.filter(
    (t) => t.homeroom_class_id && t.homeroom_class_id !== "-"
  ).length;
  const bkCount = data.filter((t) => t.role === "guru_bk").length;

  return [
    { label: "Total Guru", value: data.length },
    { label: "Guru Aktif", value: activeCount },
    { label: "Wali Kelas", value: homeroomCount },
    { label: "Guru BK", value: bkCount },
  ];
};

export const calculateAttendanceSummary = (data) => {
  const totalHadir = data.reduce((sum, r) => sum + (r.hadir || 0), 0);
  const totalPresensi = data.reduce((sum, r) => sum + (r.total || 0), 0);
  const avgAttendance =
    totalPresensi > 0 ? Math.round((totalHadir / totalPresensi) * 100) : 0;
  const lowAttendance = data.filter((s) => {
    const pct = parseFloat(s.persentase);
    return pct && pct < 75;
  }).length;

  return [
    { label: "Total Siswa", value: data.length },
    { label: "Total Presensi", value: totalPresensi },
    { label: "Rata-rata Kehadiran", value: `${avgAttendance}%` },
    { label: "Siswa <75%", value: lowAttendance },
  ];
};

export const calculateGradeSummary = (data) => {
  const scores = data.map((d) => parseFloat(d.score)).filter((s) => !isNaN(s));
  const avg =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
      : 0;
  const highest = scores.length > 0 ? Math.max(...scores) : 0;
  const lowest = scores.length > 0 ? Math.min(...scores) : 0;
  const subjects = [...new Set(data.map((g) => g.subject))].filter(Boolean);

  return [
    { label: "Total Nilai", value: data.length },
    { label: "Rata-rata", value: avg },
    { label: "Tertinggi", value: highest },
    { label: "Terendah", value: lowest },
    { label: "Mata Pelajaran", value: subjects.length },
  ];
};

export const calculateFinalGradeSummary = (finalGrades) => {
  const scores = finalGrades.map((g) => g.final_score).filter((s) => !isNaN(s));
  const avg =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
      : 0;
  const highest = scores.length > 0 ? Math.max(...scores) : 0;
  const lowest = scores.length > 0 ? Math.min(...scores) : 0;
  const subjects = [...new Set(finalGrades.map((g) => g.subject))].filter(
    Boolean
  );

  return [
    { label: "Total Nilai Akhir", value: finalGrades.length },
    { label: "Rata-rata", value: avg },
    { label: "Tertinggi", value: highest },
    { label: "Terendah", value: lowest },
    { label: "Mata Pelajaran", value: subjects.length },
  ];
};

// ==================== UTILITY FUNCTIONS ====================

export const getDateRange = (filters) => {
  if (filters.month && filters.year) {
    return getMonthDateRange(filters.month, filters.year);
  }

  const startDate =
    filters.start_date ||
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
  const endDate = filters.end_date || new Date().toISOString().split("T")[0];
  return { startDate, endDate };
};

export const buildFilterDescription = (filters) => {
  const parts = [];

  if (filters.month && filters.year) {
    const monthNames = getMonthOptions();
    const monthLabel =
      monthNames.find((m) => m.value === filters.month)?.label || filters.month;
    parts.push(`${monthLabel} ${filters.year}`);
  } else if (filters.start_date && filters.end_date) {
    parts.push(
      `Periode ${formatDate(filters.start_date)} - ${formatDate(
        filters.end_date
      )}`
    );
  }

  if (filters.class_id) parts.push(`Kelas ${filters.class_id}`);
  if (filters.academic_year) parts.push(`TA ${filters.academic_year}`);
  if (filters.semester) parts.push(`Semester ${filters.semester}`);
  if (filters.subject) parts.push(`Mapel ${filters.subject}`);

  return parts.length > 0 ? parts.join(", ") : "Semua Data";
};

export const validateReportData = (data, headers) => {
  if (!data || data.length === 0) {
    return { valid: false, message: "Tidak ada data untuk di-export" };
  }

  if (!headers || headers.length === 0) {
    return { valid: false, message: "Header tidak valid" };
  }

  return { valid: true, message: "Data valid" };
};

// ✅ FIXED: Calculate Final Grades with STRICT validation
export const calculateFinalGrades = (gradesData) => {
  const groupedByStudentSubject = {};

  gradesData.forEach((grade) => {
    const key = `${grade.student_id}_${grade.subject}_${grade.semester}_${grade.academic_year}`;

    if (!groupedByStudentSubject[key]) {
      groupedByStudentSubject[key] = {
        student_id: grade.student_id,
        nis: grade.students?.nis,
        full_name: grade.students?.full_name,
        class_id: grade.students?.class_id || grade.class_id,
        subject: grade.subject,
        teacher_id: grade.teacher_id,
        teacher_name: grade.users?.full_name,
        academic_year: grade.academic_year,
        semester: grade.semester,
        nh: [], // Will store NH1, NH2, NH3
        psts: null,
        psas: null,
      };
    }

    // ✅ FIXED: Exact matching for assignment types
    const type = (grade.assignment_type || "").toUpperCase().trim();
    const score = parseFloat(grade.score);

    if (isNaN(score)) return;

    // Match NH1, NH2, NH3
    if (type === "NH1" || type === "NH2" || type === "NH3") {
      groupedByStudentSubject[key].nh.push(score);
    }
    // Match PSTS
    else if (type === "PSTS") {
      groupedByStudentSubject[key].psts = score;
    }
    // Match PSAS
    else if (type === "PSAS") {
      groupedByStudentSubject[key].psas = score;
    }
  });

  const finalGrades = [];

  Object.values(groupedByStudentSubject).forEach((group) => {
    // ✅ Calculate average NH
    const avgNH =
      group.nh.length > 0
        ? group.nh.reduce((a, b) => a + b, 0) / group.nh.length
        : 0;

    const psts = group.psts || 0;
    const psas = group.psas || 0;

    // ✅ FORMULA: NA = (NH × 40%) + (PSTS × 30%) + (PSAS × 30%)
    const finalScore = 0.4 * avgNH + 0.3 * psts + 0.3 * psas;

    // ✅ STRICT MODE: Only include if ALL required grades exist
    // NH must have at least 1 value, PSTS and PSAS must exist
    if (group.nh.length > 0 && psts > 0 && psas > 0) {
      finalGrades.push({
        ...group,
        final_score: Math.round(finalScore * 100) / 100,
        avg_nh: Math.round(avgNH * 100) / 100,
        nh_count: group.nh.length,
      });
    }
  });

  console.log(
    "✅ Final grades calculated (STRICT mode):",
    finalGrades.length,
    "records"
  );
  console.log("📊 Sample:", finalGrades[0]);

  return finalGrades;
};

export default {
  TEACHER_ROLES,
  ATTENDANCE_STATUS_MAP,
  ATTENDANCE_TYPES,
  REPORT_HEADERS,
  formatDate,
  formatDateTime,
  formatRole,
  formatGender,
  formatActiveStatus,
  formatAttendanceStatus,
  formatTeacherRow,
  formatStudentRow,
  formatAttendanceRow,
  formatGradeRow,
  formatFinalGradeRow,
  fetchTeachersData,
  fetchStudentsData,
  fetchAttendanceRecapData,
  fetchGradesData,
  fetchAttendanceDailyData,
  calculateStudentSummary,
  calculateTeacherSummary,
  calculateAttendanceSummary,
  calculateGradeSummary,
  calculateFinalGradeSummary,
  getDateRange,
  buildFilterDescription,
  validateReportData,
  calculateFinalGrades,
  getMonthOptions,
  getYearOptions,
  getMonthDateRange,
};

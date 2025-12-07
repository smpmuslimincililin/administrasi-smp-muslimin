import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";

// Helper untuk normalize status
const normalizeStatus = (status) => {
  if (!status) return null;
  const normalized = status.toString().toLowerCase().trim();
  if (normalized === "alpha") return "alpa";
  return normalized;
};

// Helper untuk format tanggal
const formatDateHeader = (dateStr) => {
  try {
    const date = new Date(dateStr + "T00:00:00");
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  } catch {
    return dateStr;
  }
};

// Helper untuk status badge
const getStatusBadge = (status) => {
  if (!status) return <span className="text-gray-400">-</span>;

  const normalized = normalizeStatus(status);

  const statusMap = {
    hadir: { text: "H", color: "bg-green-500 text-white" },
    sakit: { text: "S", color: "bg-yellow-500 text-white" },
    izin: { text: "I", color: "bg-blue-500 text-white" },
    alpa: { text: "A", color: "bg-red-500 text-white" },
  };

  const statusInfo = statusMap[normalized] || {
    text: "-",
    color: "bg-gray-200 text-gray-500",
  };

  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-bold ${statusInfo.color}`}>
      {statusInfo.text}
    </span>
  );
};

// Helper untuk kategori kehadiran
const getAttendanceCategory = (percentage) => {
  if (percentage >= 90)
    return { text: "Sangat Baik", color: "bg-green-100 text-green-700" };
  if (percentage >= 80)
    return { text: "Baik", color: "bg-blue-100 text-blue-700" };
  if (percentage >= 70)
    return { text: "Cukup", color: "bg-yellow-100 text-yellow-700" };
  return { text: "Kurang", color: "bg-red-100 text-red-700" };
};

const RecapModal = ({
  showModal,
  onClose,
  attendanceMode,
  selectedClass,
  selectedSubject,
  homeroomClass,
  students,
  onShowToast,
}) => {
  // View mode state
  const [viewMode, setViewMode] = useState("monthly");

  // Monthly state
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear()
  );

  // Semester state
  const [selectedSemester, setSelectedSemester] = useState(() =>
    new Date().getMonth() >= 6 ? "ganjil" : "genap"
  );
  const [semesterYear, setSemesterYear] = useState(() =>
    new Date().getFullYear()
  );

  const [rekapData, setRekapData] = useState([]);
  const [rekapLoading, setRekapLoading] = useState(false);
  const [attendanceDates, setAttendanceDates] = useState([]);

  // Year & month options
  const yearOptions = [2025, 2026, 2027, 2028, 2029, 2030];
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const monthOptions = monthNames.map((name, index) => ({
    value: index + 1,
    label: name,
  }));

  // Reset saat modal dibuka
  useEffect(() => {
    if (showModal) {
      const now = new Date();
      setSelectedMonth(now.getMonth() + 1);
      setSelectedYear(now.getFullYear());
      setSemesterYear(now.getFullYear());
      setSelectedSemester(now.getMonth() >= 6 ? "ganjil" : "genap");
      setViewMode("monthly");
    }
  }, [showModal]);

  // Auto-fetch saat viewMode berubah
  useEffect(() => {
    if (!showModal) return;

    const fetchDataForCurrentView = async () => {
      if (viewMode === "monthly") {
        await handleMonthlyChange(selectedMonth, selectedYear);
      } else if (viewMode === "semester") {
        await handleSemesterChange(selectedSemester, semesterYear);
      }
    };

    fetchDataForCurrentView();
  }, [viewMode, showModal]);

  // Handle monthly change
  const handleMonthlyChange = async (month, year) => {
    if (month !== selectedMonth || year !== selectedYear) {
      setSelectedMonth(month);
      setSelectedYear(year);
    }
    await fetchMonthlyData(month, year);
  };

  // Handle semester change
  const handleSemesterChange = async (semester, year) => {
    if (semester !== selectedSemester || year !== semesterYear) {
      setSelectedSemester(semester);
      setSemesterYear(year);
    }
    await fetchSemesterData(semester, year);
  };

  // Fetch monthly data
  const fetchMonthlyData = async (month, year) => {
    if (
      (attendanceMode === "subject" && (!selectedClass || !selectedSubject)) ||
      (attendanceMode === "daily" && !homeroomClass)
    ) {
      if (onShowToast) {
        onShowToast("Pilih kelas dan mata pelajaran terlebih dahulu!", "error");
      }
      return;
    }

    if (!students || students.length === 0) {
      if (onShowToast) {
        onShowToast("Data siswa tidak tersedia!", "error");
      }
      return;
    }

    setRekapLoading(true);
    try {
      const lastDay = new Date(year, month, 0).getDate();
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(
        lastDay
      ).padStart(2, "0")}`;

      const subjectFilter =
        attendanceMode === "subject" ? selectedSubject : "Harian";
      const classFilter =
        attendanceMode === "subject" ? selectedClass : homeroomClass;
      const typeFilter = attendanceMode === "subject" ? "mapel" : "harian";

      console.log("📅 Fetching monthly data:", {
        startDate,
        endDate,
        subjectFilter,
        classFilter,
        typeFilter,
      });

      const { data: attendanceData, error } = await supabase
        .from("attendances")
        .select("student_id, status, date")
        .eq("subject", subjectFilter)
        .eq("class_id", classFilter)
        .eq("type", typeFilter)
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) throw error;

      console.log("✅ Records fetched:", attendanceData?.length || 0);

      // Get unique dates
      const uniqueDates = [
        ...new Set(attendanceData.map((r) => r.date)),
      ].sort();
      setAttendanceDates(uniqueDates);

      // Process data - FIX: SELALU initialize dailyStatus sebagai object kosong
      const studentSummary = {};
      students.forEach((student, index) => {
        studentSummary[student.id] = {
          no: index + 1,
          studentId: student.id,
          name: student.full_name,
          nis: student.nis,
          dailyStatus: {}, // SELALU di-initialize sebagai object kosong
          hadir: 0,
          sakit: 0,
          izin: 0,
          alpa: 0,
          total: 0,
          percentage: 0,
        };
      });

      // Count attendance
      attendanceData.forEach((record) => {
        if (studentSummary[record.student_id]) {
          const status = normalizeStatus(record.status);

          // dailyStatus sudah selalu di-initialize di atas, jadi tidak perlu check lagi
          studentSummary[record.student_id].dailyStatus[record.date] = status;

          if (status === "hadir") studentSummary[record.student_id].hadir++;
          else if (status === "sakit")
            studentSummary[record.student_id].sakit++;
          else if (status === "izin") studentSummary[record.student_id].izin++;
          else if (status === "alpa") studentSummary[record.student_id].alpa++;
        }
      });

      // Calculate totals
      Object.keys(studentSummary).forEach((studentId) => {
        const student = studentSummary[studentId];
        student.total =
          student.hadir + student.sakit + student.izin + student.alpa;
        student.percentage =
          student.total > 0
            ? Math.round((student.hadir / student.total) * 100)
            : 0;
      });

      setRekapData(Object.values(studentSummary));

      if (onShowToast) {
        onShowToast(`✅ Data rekap berhasil dimuat`, "success");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      if (onShowToast) {
        onShowToast("Gagal memuat data rekap: " + error.message, "error");
      }
      setRekapData([]);
    } finally {
      setRekapLoading(false);
    }
  };

  // Fetch semester data
  const fetchSemesterData = async (semester, year) => {
    if (
      (attendanceMode === "subject" && (!selectedClass || !selectedSubject)) ||
      (attendanceMode === "daily" && !homeroomClass)
    ) {
      if (onShowToast) {
        onShowToast("Pilih kelas dan mata pelajaran terlebih dahulu!", "error");
      }
      return;
    }

    if (!students || students.length === 0) {
      if (onShowToast) {
        onShowToast("Data siswa tidak tersedia!", "error");
      }
      return;
    }

    setRekapLoading(true);
    try {
      const semesterType = semester === "ganjil" ? "Ganjil" : "Genap";
      const academicYear =
        semesterType === "Ganjil"
          ? `${year}/${year + 1}`
          : `${year - 1}/${year}`;

      const months =
        semester === "ganjil" ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];
      const [startYear, endYear] = academicYear.split("/").map(Number);

      let startDate, endDate;
      if (semesterType === "Ganjil") {
        startDate = `${startYear}-07-01`;
        endDate = `${startYear}-12-31`;
      } else {
        startDate = `${endYear}-01-01`;
        endDate = `${endYear}-06-30`;
      }

      const subjectFilter =
        attendanceMode === "subject" ? selectedSubject : "Harian";
      const classFilter =
        attendanceMode === "subject" ? selectedClass : homeroomClass;
      const typeFilter = attendanceMode === "subject" ? "mapel" : "harian";

      console.log("📊 Fetching semester data:", {
        semester: semesterType,
        academicYear,
        startDate,
        endDate,
        subjectFilter,
        classFilter,
      });

      // PAGINATION
      let allRecords = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("attendances")
          .select("student_id, status, date")
          .eq("subject", subjectFilter)
          .eq("class_id", classFilter)
          .eq("type", typeFilter)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allRecords = [...allRecords, ...data];
          console.log(`📄 Page ${page + 1}: ${data.length} records`);

          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      console.log("✅ Total records:", allRecords.length);

      // Filter by month
      const filteredData = allRecords.filter((r) => {
        const parts = r.date.split("-");
        const month = parseInt(parts[1], 10);
        return months.includes(month);
      });

      console.log("Data setelah filter:", filteredData.length);

      // Calculate hari efektif
      const uniqueDates = [...new Set(filteredData.map((r) => r.date))];
      const totalHariEfektif = uniqueDates.length;
      console.log("🎯 HARI EFEKTIF:", totalHariEfektif);

      // Process data
      const studentSummary = {};
      students.forEach((student, index) => {
        studentSummary[student.id] = {
          no: index + 1,
          studentId: student.id,
          name: student.full_name,
          nis: student.nis,
          hadir: 0,
          sakit: 0,
          izin: 0,
          alpa: 0,
          total: totalHariEfektif,
          percentage: 0,
        };
      });

      // Count attendance
      filteredData.forEach((record) => {
        if (studentSummary[record.student_id]) {
          const status = normalizeStatus(record.status);

          if (status === "hadir") studentSummary[record.student_id].hadir++;
          else if (status === "sakit")
            studentSummary[record.student_id].sakit++;
          else if (status === "izin") studentSummary[record.student_id].izin++;
          else if (status === "alpa") studentSummary[record.student_id].alpa++;
        }
      });

      // Calculate percentage
      Object.keys(studentSummary).forEach((studentId) => {
        const student = studentSummary[studentId];
        student.percentage =
          totalHariEfektif > 0
            ? Math.round((student.hadir / totalHariEfektif) * 100)
            : 0;
      });

      setRekapData(Object.values(studentSummary));

      if (onShowToast) {
        onShowToast(`✅ Data semester berhasil dimuat`, "success");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      if (onShowToast) {
        onShowToast("Gagal memuat data semester: " + error.message, "error");
      }
      setRekapData([]);
    } finally {
      setRekapLoading(false);
    }
  };

  // Dynamic subtitle
  const getDynamicSubtitle = () => {
    const classId =
      attendanceMode === "subject" ? selectedClass : homeroomClass;
    const subjectName =
      attendanceMode === "subject" ? selectedSubject : "PRESENSI HARIAN";

    if (viewMode === "monthly") {
      const monthName = monthNames[selectedMonth - 1];
      return `${subjectName} | ${monthName} ${selectedYear}`;
    } else {
      const semesterName =
        selectedSemester === "ganjil"
          ? "Ganjil (Juli-Desember)"
          : "Genap (Januari-Juni)";
      return `${subjectName} | Semester ${semesterName} ${semesterYear}`;
    }
  };

  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-3 sm:p-4 flex justify-between items-center flex-shrink-0 gap-3">
          <h2 className="text-sm sm:text-lg font-bold">📊 Rekap Presensi</h2>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tab Switcher */}
            <div className="flex bg-white/20 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition ${
                  viewMode === "monthly"
                    ? "bg-white text-blue-600 shadow"
                    : "text-white hover:bg-white/10"
                }`}>
                📅 Bulanan
              </button>
              <button
                onClick={() => setViewMode("semester")}
                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition ${
                  viewMode === "semester"
                    ? "bg-white text-blue-600 shadow"
                    : "text-white hover:bg-white/10"
                }`}>
                📊 Semester
              </button>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg p-1 shadow-sm">
              {viewMode === "monthly" ? (
                <>
                  <select
                    value={selectedMonth}
                    onChange={(e) =>
                      handleMonthlyChange(
                        parseInt(e.target.value),
                        selectedYear
                      )
                    }
                    className="bg-transparent text-gray-700 text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 border-r border-gray-200 min-w-[80px]"
                    disabled={rekapLoading}>
                    {monthOptions.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) =>
                      handleMonthlyChange(
                        selectedMonth,
                        parseInt(e.target.value)
                      )
                    }
                    className="bg-transparent text-gray-700 text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 min-w-[70px]"
                    disabled={rekapLoading}>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <select
                    value={selectedSemester}
                    onChange={(e) =>
                      handleSemesterChange(e.target.value, semesterYear)
                    }
                    className="bg-transparent text-gray-700 text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 border-r border-gray-200 min-w-[80px]"
                    disabled={rekapLoading}>
                    <option value="ganjil">Ganjil</option>
                    <option value="genap">Genap</option>
                  </select>
                  <select
                    value={semesterYear}
                    onChange={(e) =>
                      handleSemesterChange(
                        selectedSemester,
                        parseInt(e.target.value)
                      )
                    }
                    className="bg-transparent text-gray-700 text-sm font-medium focus:outline-none cursor-pointer py-1 px-2 min-w-[70px]"
                    disabled={rekapLoading}>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center">
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="mb-2 text-center border border-gray-200 rounded-lg p-2 bg-white flex-shrink-0 sticky top-0 z-30 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-gray-800">
              SMP MUSLIMIN CILILIN - KELAS{" "}
              {attendanceMode === "subject" ? selectedClass : homeroomClass}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {getDynamicSubtitle()}
            </p>
          </div>

          {/* Loading */}
          {rekapLoading ? (
            <div className="flex items-center justify-center p-8 flex-1">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
              <span className="text-gray-600">Memuat data...</span>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex-1 flex flex-col">
              {viewMode === "monthly" ? (
                /* MONTHLY VIEW */
                <>
                  {attendanceDates.length > 0 && (
                    <div className="bg-blue-50 p-2 text-center text-xs text-blue-700 sm:hidden border-b border-blue-200">
                      👉 Geser untuk melihat semua hari
                    </div>
                  )}

                  <div className="overflow-auto flex-1">
                    <table className="w-full text-xs sm:text-sm border-collapse">
                      <thead className="bg-gray-100 sticky top-0 z-20">
                        <tr className="border-b-2 border-gray-400">
                          <th className="p-2 text-center font-bold text-gray-800 border-r-2 border-gray-300 sticky left-0 bg-gray-100 z-30 min-w-[40px]">
                            No.
                          </th>
                          <th className="p-2 text-left font-bold text-gray-800 border-r-2 border-gray-300 sticky left-[40px] bg-gray-100 z-30 min-w-[140px]">
                            Nama Siswa
                          </th>

                          {attendanceDates.map((date, index) => (
                            <th
                              key={date}
                              className={`p-2 text-center font-bold text-gray-800 min-w-[45px] ${
                                index < attendanceDates.length - 1
                                  ? "border-r border-gray-300"
                                  : "border-r-2 border-gray-400"
                              }`}>
                              {formatDateHeader(date)}
                            </th>
                          ))}

                          <th className="p-2 text-center font-bold text-green-700 border-r border-gray-300 min-w-[40px] bg-green-50">
                            Hadir
                          </th>
                          <th className="p-2 text-center font-bold text-blue-700 border-r border-gray-300 min-w-[40px] bg-blue-50">
                            Izin
                          </th>
                          <th className="p-2 text-center font-bold text-yellow-700 border-r border-gray-300 min-w-[40px] bg-yellow-50">
                            Sakit
                          </th>
                          <th className="p-2 text-center font-bold text-red-700 border-r-2 border-gray-400 min-w-[40px] bg-red-50">
                            Alpa
                          </th>
                          <th className="p-2 text-center font-bold text-gray-800 border-r border-gray-300 min-w-[45px]">
                            Total
                          </th>
                          <th className="p-2 text-center font-bold text-gray-800 min-w-[50px]">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rekapData.length > 0 ? (
                          rekapData.map((student) => (
                            <tr
                              key={student.studentId}
                              className="border-b border-gray-200 hover:bg-blue-50 transition">
                              <td className="p-2 text-center border-r-2 border-gray-300 sticky left-0 bg-white z-10">
                                {student.no}
                              </td>
                              <td className="p-2 font-medium border-r-2 border-gray-300 sticky left-[40px] bg-white z-10">
                                {student.name}
                              </td>

                              {attendanceDates.map((date, index) => (
                                <td
                                  key={date}
                                  className={`p-2 text-center ${
                                    index < attendanceDates.length - 1
                                      ? "border-r border-gray-200"
                                      : "border-r-2 border-gray-400"
                                  }`}>
                                  {/* FIX: Gunakan optional chaining untuk safety */}
                                  {getStatusBadge(student.dailyStatus?.[date])}
                                </td>
                              ))}

                              <td className="p-2 text-center text-green-700 font-bold border-r border-gray-200 bg-green-50/50">
                                {student.hadir}
                              </td>
                              <td className="p-2 text-center text-blue-700 font-bold border-r border-gray-200 bg-blue-50/50">
                                {student.izin}
                              </td>
                              <td className="p-2 text-center text-yellow-700 font-bold border-r border-gray-200 bg-yellow-50/50">
                                {student.sakit}
                              </td>
                              <td className="p-2 text-center text-red-700 font-bold border-r-2 border-gray-400 bg-red-50/50">
                                {student.alpa}
                              </td>
                              <td className="p-2 text-center font-bold border-r border-gray-200">
                                {student.total}
                              </td>
                              <td className="p-2 text-center font-bold">
                                {student.percentage}%
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={attendanceDates.length + 8}
                              className="p-8 text-center text-gray-500">
                              <div className="text-3xl mb-3">📅</div>
                              <h4 className="font-semibold mb-2">
                                Belum Ada Data
                              </h4>
                              <p className="text-sm">
                                Belum ada data presensi untuk bulan ini
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* SEMESTER VIEW */
                <div className="overflow-auto flex-1">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-20">
                      <tr className="border-b-2 border-gray-400">
                        <th className="p-2 text-center font-bold text-gray-800 border-r border-gray-300 min-w-[40px]">
                          No
                        </th>
                        <th className="p-2 text-center font-bold text-gray-800 border-r border-gray-300 min-w-[120px]">
                          NIS
                        </th>
                        <th className="p-2 text-left font-bold text-gray-800 border-r border-gray-300 min-w-[180px]">
                          Nama Siswa
                        </th>
                        <th className="p-2 text-center font-bold text-green-700 border-r border-gray-300 min-w-[60px] bg-green-50">
                          Hadir
                        </th>
                        <th className="p-2 text-center font-bold text-yellow-700 border-r border-gray-300 min-w-[60px] bg-yellow-50">
                          Sakit
                        </th>
                        <th className="p-2 text-center font-bold text-blue-700 border-r border-gray-300 min-w-[60px] bg-blue-50">
                          Izin
                        </th>
                        <th className="p-2 text-center font-bold text-red-700 border-r border-gray-300 min-w-[60px] bg-red-50">
                          Alpa
                        </th>
                        <th className="p-2 text-center font-bold text-gray-800 border-r border-gray-300 min-w-[60px]">
                          Total
                        </th>
                        <th className="p-2 text-center font-bold text-gray-800 border-r border-gray-300 min-w-[70px]">
                          %
                        </th>
                        <th className="p-2 text-center font-bold text-gray-800 min-w-[100px]">
                          Kategori
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rekapData.length > 0 ? (
                        rekapData.map((student) => {
                          const category = getAttendanceCategory(
                            student.percentage
                          );
                          return (
                            <tr
                              key={student.studentId}
                              className="border-b border-gray-200 hover:bg-blue-50 transition">
                              <td className="p-2 text-center border-r border-gray-200 font-medium">
                                {student.no}
                              </td>
                              <td className="p-2 text-center border-r border-gray-200 font-mono text-xs">
                                {student.nis}
                              </td>
                              <td className="p-2 border-r border-gray-200 font-medium">
                                {student.name}
                              </td>
                              <td className="p-2 text-center text-green-700 font-bold border-r border-gray-200 bg-green-50/30">
                                {student.hadir}
                              </td>
                              <td className="p-2 text-center text-yellow-700 font-bold border-r border-gray-200 bg-yellow-50/30">
                                {student.sakit}
                              </td>
                              <td className="p-2 text-center text-blue-700 font-bold border-r border-gray-200 bg-blue-50/30">
                                {student.izin}
                              </td>
                              <td className="p-2 text-center text-red-700 font-bold border-r border-gray-200 bg-red-50/30">
                                {student.alpa}
                              </td>
                              <td className="p-2 text-center font-bold text-gray-800 border-r border-gray-200">
                                {student.total}
                              </td>
                              <td className="p-2 text-center font-bold border-r border-gray-200">
                                <span
                                  className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold ${
                                    student.percentage >= 90
                                      ? "bg-green-100 text-green-700"
                                      : student.percentage >= 80
                                      ? "bg-blue-100 text-blue-700"
                                      : student.percentage >= 70
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  }`}>
                                  {student.percentage}%
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <span
                                  className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${category.color}`}>
                                  {category.text}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={10}
                            className="p-8 text-center text-gray-500">
                            <div className="text-3xl mb-3">📊</div>
                            <h4 className="font-semibold mb-2">
                              Belum Ada Data
                            </h4>
                            <p className="text-sm">
                              Belum ada data presensi untuk semester ini
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-3 sm:p-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-600">
            {rekapData.length > 0 && (
              <span>
                Total {rekapData.length} siswa
                {viewMode === "monthly" &&
                  ` • ${attendanceDates.length} hari aktif`}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm sm:text-base font-medium">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecapModal;

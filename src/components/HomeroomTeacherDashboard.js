//[file name]: HomeroomTeacherDashboard.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AnnouncementPopup from "./AnnouncementPopup";

const HomeroomTeacherDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  const [stats, setStats] = useState({
    totalStudents: 0,
    maleStudents: 0,
    femaleStudents: 0,
    presentToday: 0,
    absentToday: 0,
    sakitToday: 0,
    izinToday: 0,
    alpaToday: 0,
    className: "",
    grade: "",
  });
  const [teachingData, setTeachingData] = useState({
    subjects: [],
    classesTaught: [],
    totalClassesTaught: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract user data untuk prevent unnecessary re-renders
  const username = user?.username;
  const fullName = user?.full_name;
  const homeroomClassId = user?.homeroom_class_id;
  const teacherId = user?.teacher_id; // "G-12" untuk teacher_assignments
  const userId = user?.id; // UUID untuk teacher_schedules
  const userRole = user?.role;

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Fungsi untuk mendapatkan nama hari dalam Bahasa Indonesia
  const getDayName = (dayIndex) => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    return days[dayIndex];
  };

  // Fungsi untuk format waktu
  const formatTime = (time) => {
    if (!time) return "-";
    return time.substring(0, 5); // Format HH:MM
  };

  // Fungsi untuk menggabungkan jadwal berurutan
  const mergeConsecutiveSchedules = (schedules) => {
    if (!schedules || schedules.length === 0) return [];

    const merged = [];
    let currentBlock = null;

    schedules.forEach((schedule, index) => {
      if (!currentBlock) {
        // Mulai blok baru
        currentBlock = {
          ...schedule,
          sessionCount: 1,
          sessionNumbers: [index + 1],
        };
      } else {
        // Cek apakah bisa digabung dengan blok sebelumnya
        const canMerge =
          currentBlock.class_id === schedule.class_id &&
          currentBlock.subject === schedule.subject &&
          currentBlock.end_time === schedule.start_time;

        if (canMerge) {
          // Gabungkan dengan blok sebelumnya
          currentBlock.end_time = schedule.end_time;
          currentBlock.sessionCount += 1;
          currentBlock.sessionNumbers.push(index + 1);
        } else {
          // Simpan blok sebelumnya dan mulai blok baru
          merged.push(currentBlock);
          currentBlock = {
            ...schedule,
            sessionCount: 1,
            sessionNumbers: [index + 1],
          };
        }
      }
    });

    // Jangan lupa push blok terakhir
    if (currentBlock) {
      merged.push(currentBlock);
    }

    return merged;
  };

  // Debug log - HANYA sekali saat mount atau username berubah
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🏠 HomeroomTeacherDashboard mounted with user:", username);
    }
  }, [username]);

  // Fetch jadwal hari ini
  const fetchTodaySchedule = useCallback(async () => {
    if (!userId) return;

    try {
      const today = new Date();
      const dayName = getDayName(today.getDay());

      const { data: schedules, error: scheduleError } = await supabase
        .from("teacher_schedules")
        .select(
          `
          *,
          classes:class_id (
            id,
            grade
          )
        `
        )
        .eq("teacher_id", userId)
        .eq("day", dayName)
        .order("start_time", { ascending: true });

      if (scheduleError) throw scheduleError;

      // Get subject info from teacher_assignments
      const scheduleIds = schedules?.map((s) => s.class_id) || [];
      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("class_id, subject")
        .eq("teacher_id", teacherId)
        .in("class_id", scheduleIds);

      // Merge schedule with subject data
      const enrichedSchedules =
        schedules?.map((schedule) => {
          const assignment = assignments?.find(
            (a) => a.class_id === schedule.class_id
          );
          return {
            ...schedule,
            subject: assignment?.subject || "N/A",
          };
        }) || [];

      // Gabungkan jadwal berurutan
      const mergedSchedules = mergeConsecutiveSchedules(enrichedSchedules);

      setTodaySchedule(mergedSchedules);
    } catch (err) {
      console.error("❌ Error fetching today's schedule:", err);
    }
  }, [userId, teacherId]);

  // Memoize fetchHomeroomDashboardData untuk prevent re-creation
  const fetchHomeroomDashboardData = useCallback(async () => {
    if (!homeroomClassId) {
      setError(
        `Guru ${
          fullName || username || "ini"
        } bukan wali kelas. Dashboard ini khusus untuk wali kelas.`
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      if (process.env.NODE_ENV === "development") {
        console.log("📊 Fetching data for homeroom class:", homeroomClassId);
      }

      // Get class info
      const { data: classInfo, error: classError } = await supabase
        .from("classes")
        .select("id, grade, academic_year")
        .eq("id", homeroomClassId)
        .single();

      if (process.env.NODE_ENV === "development") {
        console.log("🏫 Class info result:", { classInfo, classError });
      }

      if (classError || !classInfo) {
        throw new Error(
          "Kelas homeroom tidak ditemukan: " +
            (classError?.message || "No data")
        );
      }

      // Get current academic year
      const currentYear = classInfo.academic_year;

      // Get today's date
      const today = new Date().toISOString().split("T")[0];
      if (process.env.NODE_ENV === "development") {
        console.log("📅 Today:", today);
        console.log("🏫 Homeroom class ID:", homeroomClassId);
      }

      // Parallel fetch data
      const [
        studentsResult,
        attendanceResult,
        announcementsResult,
        teachingResult,
      ] = await Promise.all([
        // Students in homeroom class
        supabase
          .from("students")
          .select("id, full_name, gender")
          .eq("class_id", homeroomClassId)
          .eq("academic_year", classInfo.academic_year)
          .eq("is_active", true),

        // Today's attendance for this class
        supabase
          .from("attendances")
          .select("id, student_id, date, status, type, class_id")
          .eq("date", today)
          .eq("class_id", homeroomClassId),

        // Recent Announcements
        supabase
          .from("announcement")
          .select("id, title, content, created_at")
          .order("created_at", { ascending: false })
          .limit(5),

        // Teacher assignments (all classes taught by this teacher)
        supabase
          .from("teacher_assignments")
          .select(
            `
              id,
              class_id,
              subject,
              academic_year,
              classes!inner (
                id,
                grade,
                academic_year
              )
            `
          )
          .eq("teacher_id", teacherId)
          .eq("academic_year", currentYear),
      ]);

      if (process.env.NODE_ENV === "development") {
        console.log("📊 Query results:", {
          students: studentsResult.data?.length,
          attendances: attendanceResult.data?.length,
          announcements: announcementsResult.data?.length,
          teaching: teachingResult.data?.length,
        });
        console.log("📋 Attendance data:", attendanceResult.data);
        console.log("❌ Attendance error:", attendanceResult.error);
      }

      const students = studentsResult.data || [];
      const attendances = attendanceResult.data || [];
      const assignments = teachingResult.data || [];

      // Calculate gender stats
      const maleCount = students.filter((s) => s.gender === "L").length;
      const femaleCount = students.filter((s) => s.gender === "P").length;

      // Calculate attendance stats - based on status column (note: "Hadir" with capital H)
      const uniqueStudentsPresent = new Set();
      const uniqueStudentsAbsent = new Set();
      const sakitCount = new Set();
      const izinCount = new Set();
      const alpaCount = new Set();

      attendances.forEach((att) => {
        const status = att.status; // Keep original case

        // Check if student is present (note: "Hadir" starts with capital H)
        if (status === "Hadir") {
          uniqueStudentsPresent.add(att.student_id);
        }
        // Check if student is absent (Izin, Sakit, Alpa)
        else if (status === "Sakit") {
          uniqueStudentsAbsent.add(att.student_id);
          sakitCount.add(att.student_id);
        } else if (status === "Izin") {
          uniqueStudentsAbsent.add(att.student_id);
          izinCount.add(att.student_id);
        } else if (status === "Alpa") {
          uniqueStudentsAbsent.add(att.student_id);
          alpaCount.add(att.student_id);
        }
      });

      if (process.env.NODE_ENV === "development") {
        console.log("✅ Students present:", uniqueStudentsPresent.size);
        console.log("❌ Students absent:", uniqueStudentsAbsent.size);
        console.log("🏥 Sakit:", sakitCount.size);
        console.log("📋 Izin:", izinCount.size);
        console.log("✖ Alpa:", alpaCount.size);
        console.log("📊 Total attendance records:", attendances.length);
        console.log("📊 Unique status values:", [
          ...new Set(attendances.map((a) => a.status)),
        ]);
      }

      // Process teaching data
      const subjects = [...new Set(assignments.map((a) => a.subject))];
      const classesTaught = assignments.map((a) => ({
        id: a.class_id,
        className: a.classes.id,
        grade: a.classes.grade,
        subject: a.subject,
      }));

      setStats({
        totalStudents: students.length,
        maleStudents: maleCount,
        femaleStudents: femaleCount,
        presentToday: uniqueStudentsPresent.size,
        absentToday: uniqueStudentsAbsent.size,
        sakitToday: sakitCount.size,
        izinToday: izinCount.size,
        alpaToday: alpaCount.size,
        className: homeroomClassId,
        grade: classInfo.grade,
      });

      setTeachingData({
        subjects,
        classesTaught,
        totalClassesTaught: assignments.length,
      });

      setAnnouncements(announcementsResult.data || []);
      setError(null);

      // Fetch today's schedule
      await fetchTodaySchedule();
    } catch (err) {
      console.error("❌ Error fetching homeroom dashboard data:", err);
      setError("Gagal memuat data dashboard homeroom: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [
    homeroomClassId,
    teacherId,
    userId,
    fullName,
    username,
    fetchTodaySchedule,
  ]);

  // Fetch data - HANYA ketika dependency berubah
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🏠 User has homeroom_class_id:", homeroomClassId);
    }
    fetchHomeroomDashboardData();
  }, [fetchHomeroomDashboardData]);

  const handleRetry = () => {
    fetchHomeroomDashboardData();
  };

  // Navigation handlers - Memoized untuk prevent re-creation
  const handleTeacherAttendance = useCallback(() => {
    navigate("/attendance-teacher");
  }, [navigate]);

  const handleStudentAttendance = useCallback(() => {
    navigate("/attendance");
  }, [navigate]);

  const handleGrades = useCallback(() => {
    navigate("/grades");
  }, [navigate]);

  const handleStudents = useCallback(() => {
    navigate("/students");
  }, [navigate]);

  const handleReports = useCallback(() => {
    navigate("/reports");
  }, [navigate]);

  const handleDataGuru = useCallback(() => {
    navigate("/teachers");
  }, [navigate]);

  const handleDataKelas = useCallback(() => {
    navigate("/classes");
  }, [navigate]);

  const handleDataSiswa = useCallback(() => {
    navigate("/students");
  }, [navigate]);

  const handleCatatanSiswa = useCallback(() => {
    navigate("/student-notes");
  }, [navigate]);

  const handleJadwalSaya = useCallback(() => {
    navigate("/my-schedule");
  }, [navigate]);

  // Memoize subject breakdown calculation
  const subjectBreakdown = useMemo(() => {
    const breakdown = {};
    teachingData.classesTaught.forEach((cls) => {
      if (!breakdown[cls.subject]) {
        breakdown[cls.subject] = [];
      }
      breakdown[cls.subject].push(cls.className);
    });
    return breakdown;
  }, [teachingData.classesTaught]);

  // Memoize primary subject calculation
  const primarySubject = useMemo(() => {
    if (Object.keys(subjectBreakdown).length === 0) return "";
    return Object.keys(subjectBreakdown).reduce(
      (a, b) =>
        subjectBreakdown[a].length > subjectBreakdown[b].length ? a : b,
      teachingData.subjects[0] || ""
    );
  }, [subjectBreakdown, teachingData.subjects]);

  // Get current day name
  const currentDay = useMemo(() => {
    const today = new Date();
    return getDayName(today.getDay());
  }, []);

  // Quick Actions Component untuk Mobile
  const QuickActionsMobile = () => (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Aksi Cepat</h2>

      {/* Baris 1 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={handleTeacherAttendance}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">👨‍🏫</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Presensi Guru
          </span>
        </button>

        <button
          onClick={handleStudentAttendance}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">👨‍🎓</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Presensi Siswa
          </span>
        </button>

        <button
          onClick={handleGrades}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📊</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Nilai Siswa
          </span>
        </button>
      </div>

      {/* Baris 2 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={handleDataGuru}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">👥</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Data Guru
          </span>
        </button>

        <button
          onClick={handleDataKelas}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">🏫</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Data Kelas
          </span>
        </button>

        <button
          onClick={handleDataSiswa}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">👤</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Data Siswa
          </span>
        </button>
      </div>

      {/* Baris 3 */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleCatatanSiswa}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📝</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Catatan Siswa
          </span>
        </button>

        <button
          onClick={handleJadwalSaya}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📅</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Jadwal Saya
          </span>
        </button>

        <button
          onClick={handleReports}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📄</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Laporan
          </span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-slate-600">
              Memuat dashboard homeroom...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 sm:p-8 text-center">
            <div className="text-amber-500 text-4xl sm:text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Info</h3>
            <p className="text-amber-600 mb-4 text-sm sm:text-base">{error}</p>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              Username: {username}
              <br />
              Role: {userRole}
              <br />
              Homeroom Class: {homeroomClassId || "Tidak ada"}
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* 🆕 Pop-up Pengumuman */}
        <AnnouncementPopup userId={user?.id} userRole="walikelas" />

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-3 sm:mb-2">
                Selamat Datang, {fullName || username}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Wali Kelas {stats.className}
                </span>
                {primarySubject && (
                  <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Guru {primarySubject}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AKSI CEPAT MOBILE - Muncul hanya di HP */}
        {isMobile && <QuickActionsMobile />}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {/* Total Siswa Kelas */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">
                  Siswa Kelas {stats.className}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center ml-2 shadow-lg">
                <span className="text-white text-lg sm:text-2xl">👨‍🎓</span>
              </div>
            </div>
          </div>

          {/* Gender Ratio */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mb-2 sm:mb-3">
                L / P
              </p>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-blue-700">
                    {stats.maleStudents}
                  </p>
                  <p className="text-xs text-slate-500">L</p>
                </div>
                <div className="text-slate-400">/</div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-pink-600">
                    {stats.femaleStudents}
                  </p>
                  <p className="text-xs text-slate-500">P</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hadir Hari Ini */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">
                  Hadir Hari Ini
                </p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-700">
                  {stats.presentToday}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center ml-2 shadow-lg">
                <span className="text-white text-lg sm:text-2xl">✅</span>
              </div>
            </div>
          </div>

          {/* Tidak Hadir */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1">
                  Tidak Hadir
                </p>
                <p className="text-xl sm:text-2xl font-bold text-red-700 mb-2">
                  {stats.absentToday}
                </p>
                {stats.absentToday > 0 && (
                  <div className="space-y-0.5 text-xs text-slate-600">
                    {stats.sakitToday > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-orange-500">🏥</span>
                        <span>Sakit: {stats.sakitToday}</span>
                      </div>
                    )}
                    {stats.izinToday > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-blue-500">📋</span>
                        <span>Izin: {stats.izinToday}</span>
                      </div>
                    )}
                    {stats.alpaToday > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-red-500">✖</span>
                        <span>Alpa: {stats.alpaToday}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center ml-2 shadow-lg">
                <span className="text-white text-lg sm:text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Desktop - Muncul hanya di Desktop/Tablet */}
        {!isMobile && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 sm:mb-4">
              Aksi Cepat
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Presensi Guru */}
              <button
                onClick={handleTeacherAttendance}
                className="group bg-white border border-slate-200 rounded-lg p-4 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <span className="text-white text-lg">👨‍🏫</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-slate-800 text-sm">
                      Presensi Guru
                    </h4>
                    <p className="text-xs text-slate-600">Presensi Sendiri</p>
                  </div>
                </div>
              </button>

              {/* Presensi Siswa */}
              <button
                onClick={handleStudentAttendance}
                className="group bg-white border border-slate-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <span className="text-white text-lg">📋</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-slate-800 text-sm">
                      Presensi Siswa
                    </h4>
                    <p className="text-xs text-slate-600">
                      Kelas {stats.className}
                    </p>
                  </div>
                </div>
              </button>

              {/* Input Nilai */}
              {primarySubject && (
                <button
                  onClick={handleGrades}
                  className="group bg-white border border-slate-200 rounded-lg p-4 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <span className="text-white text-lg">📝</span>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-800 text-sm">
                        Input Nilai
                      </h4>
                      <p className="text-xs text-slate-600">{primarySubject}</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Laporan */}
              <button
                onClick={handleReports}
                className="group bg-white border border-slate-200 rounded-lg p-4 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <span className="text-white text-lg">📊</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-slate-800 text-sm">
                      Laporan
                    </h4>
                    <p className="text-xs text-slate-600">
                      Kelas {stats.className}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Mata Pelajaran & Kelas */}
          {teachingData.subjects.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <span className="mr-2">📖</span>
                Mata Pelajaran & Kelas
              </h3>

              <div className="space-y-4">
                {Object.entries(subjectBreakdown).map(([subject, classes]) => {
                  // Group classes by grade
                  const classByGrade = {};
                  classes.forEach((className) => {
                    const grade = className.charAt(0);
                    if (!classByGrade[grade]) {
                      classByGrade[grade] = [];
                    }
                    classByGrade[grade].push(className);
                  });

                  return (
                    <div
                      key={subject}
                      className="border border-slate-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-800 text-sm sm:text-base">
                          {subject}
                        </h4>
                        <span className="text-xs sm:text-sm text-slate-500">
                          {classes.length} kelas
                        </span>
                      </div>

                      <div className="space-y-2">
                        {Object.entries(classByGrade)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([grade, gradeClasses]) => (
                            <div key={grade} className="flex flex-wrap gap-2">
                              {gradeClasses.sort().map((className, index) => (
                                <span
                                  key={index}
                                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                                    className === stats.className
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}>
                                  {className}
                                  {className === stats.className && (
                                    <span className="ml-1 text-green-600">
                                      👑
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Jadwal Hari Ini */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <span className="mr-2">🗓️</span>
              Jadwal Hari Ini - {currentDay}
            </h3>

            {todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-center min-w-[70px]">
                          <div className="text-xs font-medium text-slate-500 mb-1">
                            {schedule.sessionCount}JP (
                            {schedule.sessionNumbers.join("-")})
                          </div>
                          <div className="font-semibold text-blue-700 text-xs sm:text-sm">
                            {formatTime(schedule.start_time)}
                          </div>
                          <div className="text-xs text-slate-400">-</div>
                          <div className="font-semibold text-blue-700 text-xs sm:text-sm">
                            {formatTime(schedule.end_time)}
                          </div>
                        </div>
                        <div className="h-auto min-h-[60px] w-px bg-slate-200"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 text-sm sm:text-base mb-1">
                            {schedule.subject}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <span>🏫</span>
                              <span>
                                Kelas{" "}
                                {schedule.classes?.id || schedule.class_id}
                              </span>
                            </span>
                            {schedule.room_number && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="flex items-center gap-1">
                                  <span>📍</span>
                                  <span>R.{schedule.room_number}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {schedule.class_id === stats.className && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
                          <span className="mr-1">👑</span>
                          Wali
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📅</div>
                <h4 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">
                  Tidak Ada Jadwal
                </h4>
                <p className="text-xs sm:text-sm text-slate-600">
                  Anda Tidak Memiliki Jadwal Mengajar Hari Ini
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Selamat Menikmati Hari Libur ! 🎉
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pengumuman Terkini */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <span className="mr-2">📢</span>
            Pengumuman Terkini
          </h3>
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-3 rounded-r-lg">
                  <h4 className="font-semibold text-slate-800 text-sm sm:text-base">
                    {announcement.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(announcement.created_at).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <div className="text-3xl sm:text-4xl mb-3">📢</div>
              <h4 className="font-medium text-slate-800 mb-1 text-sm sm:text-base">
                Belum Ada Pengumuman
              </h4>
              <p className="text-xs sm:text-sm text-slate-600">
                Pengumuman terbaru akan ditampilkan di sini
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeroomTeacherDashboard;

// src/attendance-teacher/TeacherAttendance.js
import React, { useState, useEffect } from "react";
import { Clock, Bell, X } from "lucide-react";
import { supabase } from "../supabaseClient";

// Teacher Components
import AttendanceTabs from "./AttendanceTabs";
import MyAttendanceStatus from "./MyAttendanceStatus";
import MyMonthlyHistory from "./MyMonthlyHistory";
import TodaySchedule from "./TodaySchedule";

// Admin Component
import AdminAttendanceView from "./AdminAttendanceView";

const TeacherAttendance = ({ user }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState("presensi");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReminder, setShowReminder] = useState(false);
  const [hasScheduleToday, setHasScheduleToday] = useState(false);

  useEffect(() => {
    // Use user from props (from App.js) or fallback to localStorage
    const userData =
      user ||
      JSON.parse(
        localStorage.getItem("user") || sessionStorage.getItem("user")
      );
    setCurrentUser(userData);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      checkAttendanceReminder();
    }
  }, [currentUser, refreshTrigger]);

  const checkAttendanceReminder = async () => {
    try {
      // ✅ FIX: Gunakan timezone Indonesia (WIB/GMT+7)
      const nowIndonesia = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Jakarta",
      });
      const indonesiaDate = new Date(nowIndonesia);

      const currentHour = indonesiaDate.getHours();
      const currentMinute = indonesiaDate.getMinutes();

      // Get today's date in Indonesia timezone
      const year = indonesiaDate.getFullYear();
      const month = String(indonesiaDate.getMonth() + 1).padStart(2, "0");
      const day = String(indonesiaDate.getDate()).padStart(2, "0");
      const todayLocal = `${year}-${month}-${day}`;

      console.log(
        `🕐 Indonesia Time: ${currentHour}:${String(currentMinute).padStart(
          2,
          "0"
        )}`
      );
      console.log(`📅 Today: ${todayLocal}`);

      // ⏰ Reminder only shows between 07:00 - 14:00
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const reminderStartTime = 7 * 60; // 07:00
      const reminderEndTime = 14 * 60; // 14:00

      if (
        currentTimeInMinutes < reminderStartTime ||
        currentTimeInMinutes >= reminderEndTime
      ) {
        console.log(`⏰ Outside reminder window`);
        setShowReminder(false);
        return;
      }

      console.log(`🔔 Within reminder window`);

      // ✅ STEP 1: Check if user has schedule today
      const dayName = indonesiaDate.toLocaleDateString("id-ID", {
        weekday: "long",
        timeZone: "Asia/Jakarta",
      });

      console.log(`📆 Day: ${dayName}`);
      console.log(`🔍 User ID: ${currentUser.id}`);
      console.log(`🔍 Teacher Code: ${currentUser.teacher_id}`);

      // ✅ Query schedule pakai user.id (UUID)
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("teacher_schedules")
        .select("*")
        .eq("teacher_id", currentUser.id) // Pakai UUID
        .eq("day", dayName);

      if (scheduleError) throw scheduleError;

      const hasSchedule = scheduleData && scheduleData.length > 0;
      setHasScheduleToday(hasSchedule);

      console.log(`📋 Has schedule? ${hasSchedule}`);

      if (!hasSchedule) {
        console.log("⏭️ No schedule today, no reminder");
        setShowReminder(false);
        return;
      }

      // ✅ STEP 2: Check if already attended today in DATABASE
      // Query attendance pakai teacher_id code (G-XX)
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("teacher_attendance")
        .select("*")
        .eq("teacher_id", currentUser.teacher_id) // Pakai kode guru (G-XX)
        .eq("attendance_date", todayLocal);

      if (attendanceError) throw attendanceError;

      const hasAttended = attendanceData && attendanceData.length > 0;

      console.log(`✅ Already attended? ${hasAttended}`);

      // 🎯 SIMPLE LOGIC: Database = Source of Truth
      // - Belum presensi → SHOW REMINDER
      // - Sudah presensi → HIDE REMINDER
      if (!hasAttended) {
        console.log("🔔 SHOWING REMINDER - Not attended yet!");
        setShowReminder(true);
      } else {
        console.log("✅ Already attended - No reminder");
        setShowReminder(false);
      }
    } catch (error) {
      console.error("❌ Error checking reminder:", error);
      setShowReminder(false);
    }
  };

  const handleDismissReminder = () => {
    // ✅ Simple: Just hide, will show again on refresh if not attended
    setShowReminder(false);
  };

  const handleGoToAttendance = () => {
    setShowReminder(false);
    setActiveView("presensi");
    // Scroll to attendance tabs
    setTimeout(() => {
      const element = document.getElementById("attendance-tabs");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleAttendanceSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setShowReminder(false); // Hide reminder after successful attendance
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Sesi login tidak ditemukan</p>
          <p className="text-gray-600 mt-2">Silakan login kembali</p>
        </div>
      </div>
    );
  }

  // ✅ ROLE-BASED RENDERING
  const isAdmin = currentUser.role === "admin";

  // ========== ADMIN VIEW ==========
  if (isAdmin) {
    return <AdminAttendanceView currentUser={currentUser} />;
  }

  // ========== TEACHER VIEW ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Reminder Pop-up */}
      {showReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-bounce-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-t-2xl p-6 relative">
              <button
                onClick={handleDismissReminder}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all">
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <Bell className="text-white" size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    ⚠️ Reminder Presensi
                  </h3>
                  <p className="text-white text-sm opacity-90">
                    Jangan lupa presensi hari ini!
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 text-center text-lg font-medium mb-6">
                Anda Belum Melakukan Presensi Hari Ini. Silakan Lakukan Presensi
                Sekarang.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>📋 Info:</strong> Anda memiliki jadwal mengajar hari
                  ini. Silakan lakukan presensi untuk mencatat kehadiran Anda.
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>⏰ Batas Waktu:</strong> Input manual presensi
                  tersedia sampai jam 14:00. Pastikan Anda presensi sebelum
                  batas waktu!
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDismissReminder}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all border border-gray-300">
                  Nanti
                </button>
                <button
                  onClick={handleGoToAttendance}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-lg">
                  Presensi Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-3 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
                <Clock className="text-blue-600" size={20} />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">
                  Presensi Guru
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Sistem presensi guru menggunakan QR Code atau input manual
                </p>
              </div>
            </div>

            {/* User Info - Responsive */}
            <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">
                  {currentUser.full_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentUser.role === "guru_bk" ? "Guru BK" : "Guru"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Badge - Fixed position */}
      {showReminder && (
        <div className="fixed top-20 right-4 z-40 animate-pulse">
          <button
            onClick={() => setShowReminder(true)}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
            <Bell size={16} />
            <span className="text-sm font-semibold">Belum Presensi!</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* View Tabs */}
        <div className="mb-4 sm:mb-6 flex gap-2">
          <button
            onClick={() => setActiveView("presensi")}
            className={`
              flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold 
              transition-all text-sm sm:text-base
              ${
                activeView === "presensi"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }
            `}>
            Presensi
          </button>
          <button
            onClick={() => setActiveView("history")}
            className={`
              flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold 
              transition-all text-sm sm:text-base
              ${
                activeView === "history"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }
            `}>
            Riwayat Saya
          </button>
        </div>

        {/* Content */}
        {activeView === "presensi" ? (
          <div className="space-y-4 sm:space-y-6">
            {/* 1️⃣ Status Presensi Anda - TETAP DI ATAS! */}
            <MyAttendanceStatus
              currentUser={currentUser}
              refreshTrigger={refreshTrigger}
            />

            {/* 2️⃣ Attendance Tabs (QR Scanner / Manual Input) - NAIK KE ATAS! */}
            <div id="attendance-tabs">
              <AttendanceTabs
                currentUser={currentUser}
                onSuccess={handleAttendanceSuccess}
              />
            </div>

            {/* 3️⃣ Jadwal Mengajar Hari Ini - TURUN KE BAWAH! */}
            <TodaySchedule
              currentUser={currentUser}
              refreshTrigger={refreshTrigger}
            />
          </div>
        ) : (
          /* Monthly History */
          <MyMonthlyHistory currentUser={currentUser} />
        )}
      </div>

      {/* CSS for animation */}
      <style>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TeacherAttendance;

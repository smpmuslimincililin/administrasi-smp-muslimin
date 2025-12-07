// src/attendance-teacher/MyMonthlyHistory.js
import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  List,
  Grid3x3,
  Clock,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const MyMonthlyHistory = ({ currentUser }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // list | calendar

  const months = [
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

  // ========================================
  // 🗓️ LIBUR NASIONAL 2025
  // ========================================
  const nationalHolidays2025 = {
    "2025-01-01": "Tahun Baru Masehi",
    "2025-01-25": "Tahun Baru Imlek 2576",
    "2025-03-02": "Isra Miraj Nabi Muhammad SAW",
    "2025-03-12": "Hari Raya Nyepi (Tahun Baru Saka 1947)",
    "2025-03-31": "Idul Fitri 1446 H",
    "2025-04-01": "Idul Fitri 1446 H",
    "2025-04-18": "Wafat Yesus Kristus (Jumat Agung)",
    "2025-05-01": "Hari Buruh Internasional",
    "2025-05-29": "Kenaikan Yesus Kristus",
    "2025-06-07": "Idul Adha 1446 H",
    "2025-06-28": "Tahun Baru Islam 1447 H",
    "2025-08-17": "Hari Kemerdekaan RI",
    "2025-09-05": "Maulid Nabi Muhammad SAW",
    "2025-12-25": "Hari Raya Natal",
  };

  // ========================================
  // 🔧 HELPER FUNCTIONS
  // ========================================

  // Format metode check-in jadi lebih readable
  const formatCheckInMethod = (method) => {
    const methodMap = {
      qr_scan: "Scan QR",
      qr: "Scan QR",
      manual: "Manual",
      nfc: "NFC",
    };
    return methodMap[method] || method || "-";
  };

  // Helper: Check if date is national holiday
  const isNationalHoliday = (dateStr) => {
    return nationalHolidays2025[dateStr] || null;
  };

  // Helper: Check if day is weekend (Saturday = 6, Sunday = 0)
  const isWeekend = (year, month, day) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  useEffect(() => {
    if (currentUser?.teacher_id) {
      fetchMyMonthlyData();
    }
  }, [selectedMonth, selectedYear, currentUser]);

  const fetchMyMonthlyData = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(
        2,
        "0"
      )}-01`;
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth + 1).padStart(
        2,
        "0"
      )}-${lastDay}`;

      const { data, error } = await supabase
        .from("teacher_attendance")
        .select("*")
        .eq("teacher_id", currentUser.teacher_id)
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate)
        .order("attendance_date", { ascending: false });

      if (error) throw error;

      setAttendances(data || []);
    } catch (error) {
      console.error("Error fetching my monthly data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(selectedYear, selectedMonth, 1).getDay();
  };

  const getAttendanceForDate = (day) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    return attendances.find((att) => att.attendance_date === dateStr);
  };

  const calculateStats = () => {
    return {
      hadir: attendances.filter((a) => a.status === "Hadir").length,
      izin: attendances.filter((a) => a.status === "Izin").length,
      sakit: attendances.filter((a) => a.status === "Sakit").length,
      alpa: attendances.filter((a) => a.status === "Alpa").length,
      total: attendances.length,
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      Hadir: "bg-green-500 text-white",
      Izin: "bg-blue-500 text-white",
      Sakit: "bg-yellow-500 text-white",
      Alpa: "bg-red-500 text-white",
    };
    return colors[status] || "bg-gray-200 text-gray-600";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Hadir":
        return <CheckCircle size={16} />;
      case "Izin":
        return <AlertCircle size={16} />;
      case "Sakit":
        return <AlertCircle size={16} />;
      case "Alpa":
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    if (
      typeof timeString === "string" &&
      timeString.match(/^\d{2}:\d{2}:\d{2}$/)
    ) {
      return timeString.substring(0, 5);
    }
    return timeString;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const stats = calculateStats();
  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const attendanceRate =
    daysInMonth > 0 ? ((stats.hadir / daysInMonth) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Riwayat Saya</h2>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="text-green-600" size={16} />
              <p className="text-xs text-green-700 font-medium">Hadir</p>
            </div>
            <p className="text-xl font-bold text-green-600">{stats.hadir}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="text-blue-600" size={16} />
              <p className="text-xs text-blue-700 font-medium">Izin</p>
            </div>
            <p className="text-xl font-bold text-blue-600">{stats.izin}</p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="text-yellow-600" size={16} />
              <p className="text-xs text-yellow-700 font-medium">Sakit</p>
            </div>
            <p className="text-xl font-bold text-yellow-600">{stats.sakit}</p>
          </div>

          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="text-red-600" size={16} />
              <p className="text-xs text-red-700 font-medium">Alpha</p>
            </div>
            <p className="text-xl font-bold text-red-600">{stats.alpa}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="text-blue-600" size={16} />
              <p className="text-xs text-blue-700 font-medium">Rate</p>
            </div>
            <p className="text-xl font-bold text-blue-600">{attendanceRate}%</p>
          </div>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex gap-2 px-1">
        <button
          onClick={() => setViewMode("list")}
          className={`flex-1 sm:flex-none sm:px-6 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
            viewMode === "list"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}>
          <List size={18} />
          <span className="hidden sm:inline">List</span>
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`flex-1 sm:flex-none sm:px-6 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
            viewMode === "calendar"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}>
          <Grid3x3 size={18} />
          <span className="hidden sm:inline">Calendar</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-lg p-4 md:p-6 border border-blue-100">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Memuat data...</p>
          </div>
        ) : viewMode === "list" ? (
          /* List View */
          <div className="space-y-2">
            {attendances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Belum ada data presensi bulan ini
              </div>
            ) : (
              attendances.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-all border border-gray-100">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">
                      {formatDate(att.attendance_date)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={14} className="text-gray-500" />
                      <p className="text-xs text-gray-600">
                        {formatTime(att.clock_in)}
                      </p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-600">
                        {formatCheckInMethod(att.check_in_method)}
                      </p>
                    </div>
                    {att.notes && (
                      <p className="text-xs text-gray-500 italic mt-1">
                        {att.notes}
                      </p>
                    )}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm ${getStatusColor(
                      att.status
                    )}`}>
                    {getStatusIcon(att.status)}
                    <span className="text-sm">{att.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Calendar View */
          <>
            <div className="max-w-md mx-auto bg-white rounded-xl p-4 shadow-md border border-gray-200">
              {/* Month & Year Selector */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                  <ChevronLeft size={20} className="text-gray-700" />
                </button>
                <span className="px-4 py-2 font-bold text-gray-800 text-lg">
                  {months[selectedMonth]} {selectedYear}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                  <ChevronRight size={20} className="text-gray-700" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                  (day, idx) => (
                    <div
                      key={idx}
                      className="text-center font-bold text-gray-700 text-xs py-2 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      {day}
                    </div>
                  )
                )}

                {/* Empty cells */}
                {Array.from({ length: firstDay }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square"></div>
                ))}

                {/* Date cells */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const attendance = getAttendanceForDate(day);
                  const dateStr = `${selectedYear}-${String(
                    selectedMonth + 1
                  ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                  const now = new Date();
                  const isToday =
                    day === now.getDate() &&
                    selectedMonth === now.getMonth() &&
                    selectedYear === now.getFullYear();

                  const weekend = isWeekend(selectedYear, selectedMonth, day);
                  const holiday = isNationalHoliday(dateStr);

                  return (
                    <div
                      key={day}
                      className={`
                        relative aspect-square rounded-lg flex items-center justify-center
                        transition-all cursor-pointer hover:scale-110 hover:shadow-lg
                        ${
                          attendance
                            ? getStatusColor(attendance.status) + " shadow-md"
                            : isToday
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-2 border-blue-300"
                            : holiday
                            ? "bg-gradient-to-br from-red-100 to-pink-100 border-2 border-red-300"
                            : weekend
                            ? "bg-gradient-to-br from-gray-200 to-gray-300 border border-gray-400"
                            : "bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200"
                        }
                      `}
                      title={
                        attendance
                          ? `${attendance.status} - ${formatTime(
                              attendance.clock_in
                            )}`
                          : holiday
                          ? `🎉 ${holiday}`
                          : weekend
                          ? "🏠 Weekend (Libur)"
                          : isToday
                          ? "Hari ini"
                          : ""
                      }>
                      <span
                        className={`text-sm font-bold ${
                          attendance || isToday
                            ? "text-white"
                            : holiday
                            ? "text-red-700"
                            : weekend
                            ? "text-gray-600"
                            : "text-gray-700"
                        }`}>
                        {day}
                      </span>

                      {attendance && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-current shadow-sm"></div>
                      )}

                      {isToday && !attendance && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}

                      {holiday && !attendance && (
                        <div className="absolute -top-1 -right-1 text-xs">
                          🎉
                        </div>
                      )}

                      {weekend && !holiday && !attendance && (
                        <div className="absolute -top-1 -right-1 text-xs">
                          🏠
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                {/* Status Legend */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 w-8 h-8 rounded-lg shadow-md flex items-center justify-center">
                      <CheckCircle size={14} className="text-white" />
                    </div>
                    <span className="text-gray-700 text-xs font-medium">
                      Hadir
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-8 h-8 rounded-lg shadow-md flex items-center justify-center">
                      <AlertCircle size={14} className="text-white" />
                    </div>
                    <span className="text-gray-700 text-xs font-medium">
                      Izin
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 w-8 h-8 rounded-lg shadow-md flex items-center justify-center">
                      <AlertCircle size={14} className="text-white" />
                    </div>
                    <span className="text-gray-700 text-xs font-medium">
                      Sakit
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-gradient-to-br from-red-500 to-red-600 w-8 h-8 rounded-lg shadow-md flex items-center justify-center">
                      <XCircle size={14} className="text-white" />
                    </div>
                    <span className="text-gray-700 text-xs font-medium">
                      Alpha
                    </span>
                  </div>
                </div>

                {/* Non-Working Days Legend */}
                <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-gray-200 to-gray-300 w-6 h-6 rounded border border-gray-400 flex items-center justify-center">
                      <span className="text-xs">🏠</span>
                    </div>
                    <span className="text-gray-600 text-xs font-medium">
                      Weekend
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-red-100 to-pink-100 w-6 h-6 rounded border-2 border-red-300 flex items-center justify-center">
                      <span className="text-xs">🎉</span>
                    </div>
                    <span className="text-gray-600 text-xs font-medium">
                      Libur Nasional
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyMonthlyHistory;

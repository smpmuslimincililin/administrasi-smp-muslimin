// src/attendance-teacher/reports/DailySummary.js
import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const DailySummary = ({ refreshTrigger }) => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpa: 0,
    belumAbsen: 0,
    attendanceRate: 0,
  });
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailySummary();
  }, [refreshTrigger]);

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      // ✅ FIX: Get today's date in local timezone (Indonesia/WIB)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      // Get total active teachers
      const { count: totalTeachers, error: teacherError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .in("role", ["teacher", "guru_bk", "homeroom_teacher"])
        .eq("is_active", true);

      if (teacherError) throw teacherError;

      // Get today's attendances
      const { data: attendances, error: attendanceError } = await supabase
        .from("teacher_attendance")
        .select("status")
        .eq("attendance_date", today);

      if (attendanceError) throw attendanceError;

      // Calculate stats - CASE SENSITIVE!
      const hadir = attendances.filter((a) => a.status === "Hadir").length;
      const izin = attendances.filter((a) => a.status === "Izin").length;
      const sakit = attendances.filter((a) => a.status === "Sakit").length;
      const alpa = attendances.filter((a) => a.status === "Alpa").length;
      const belumAbsen = (totalTeachers || 0) - attendances.length;
      const attendanceRate =
        totalTeachers > 0 ? ((hadir / totalTeachers) * 100).toFixed(1) : 0;

      setStats({
        totalTeachers: totalTeachers || 0,
        hadir,
        izin,
        sakit,
        alpa,
        belumAbsen,
        attendanceRate,
      });

      // Fetch attendance list with teacher info
      const { data: attendanceListData, error: listError } = await supabase
        .from("teacher_attendance")
        .select(
          `
          *,
          users!teacher_id (
            full_name
          )
        `
        )
        .eq("attendance_date", today)
        .order("clock_in", { ascending: true });

      if (listError) {
        console.error("Error fetching attendance list:", listError);
      }

      // Format attendance list
      const formattedList = (attendanceListData || []).map((att, index) => ({
        no: index + 1,
        name: att.users?.full_name || "Unknown",
        time: att.clock_in ? formatTime(att.clock_in) : "-",
        status: att.status,
      }));

      setAttendanceList(formattedList);
    } catch (error) {
      console.error("Error fetching daily summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";

    try {
      // If format is HH:MM:SS (time only), convert to HH:MM
      if (
        typeof timeString === "string" &&
        timeString.match(/^\d{2}:\d{2}:\d{2}$/)
      ) {
        return timeString.substring(0, 5); // Return HH:MM
      }

      // If it's a full timestamp
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      // Fallback
      return timeString;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "-";
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Hadir: "bg-green-100 text-green-700 border-green-200",
      Izin: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Sakit: "bg-orange-100 text-orange-700 border-orange-200",
      Alpa: "bg-red-100 text-red-700 border-red-200",
    };
    return badges[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 🔥 LOADING: 2 kolom di mobile, 4 di desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-pulse">
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-3 sm:mb-4"></div>
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Guru",
      value: stats.totalTeachers,
      icon: Users,
      gradient: "from-blue-50 to-indigo-50",
      iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    {
      title: "Hadir",
      value: stats.hadir,
      icon: CheckCircle,
      gradient: "from-green-50 to-emerald-50",
      iconBg: "bg-gradient-to-br from-green-400 to-emerald-600",
      textColor: "text-green-700",
      borderColor: "border-green-200",
      subtitle: `${stats.attendanceRate}% kehadiran`,
    },
    {
      title: "Izin / Sakit",
      value: `${stats.izin} / ${stats.sakit}`,
      icon: AlertCircle,
      gradient: "from-yellow-50 to-amber-50",
      iconBg: "bg-gradient-to-br from-yellow-400 to-amber-500",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
    },
    {
      title: "Alpha / Belum Absen",
      value: `${stats.alpa} / ${stats.belumAbsen}`,
      icon: XCircle,
      gradient: "from-red-50 to-rose-50",
      iconBg: "bg-gradient-to-br from-red-400 to-rose-600",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 🔥 STATS CARDS: 2 kolom di mobile, 4 di desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${card.gradient} rounded-xl shadow-lg border ${card.borderColor} p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* 🔥 Text size responsive */}
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 truncate">
                    {card.title}
                  </p>
                  <h3
                    className={`text-2xl sm:text-3xl font-bold ${card.textColor} mb-1`}>
                    {card.value}
                  </h3>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <TrendingUp size={10} className="sm:w-3 sm:h-3" />
                      <span className="truncate">{card.subtitle}</span>
                    </p>
                  )}
                </div>
                {/* 🔥 Icon dengan gradient background */}
                <div
                  className={`${card.iconBg} p-2 sm:p-3 rounded-lg flex-shrink-0 shadow-md`}>
                  <Icon className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔥 ATTENDANCE TABLE: Responsive dengan scroll horizontal di mobile */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Users size={18} className="sm:w-5 sm:h-5" />
            Daftar Guru yang Sudah Presensi Hari Ini
          </h3>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            Total: {attendanceList.length} guru
          </p>
        </div>

        {attendanceList.length > 0 ? (
          /* 🔥 Scroll horizontal di mobile */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    No.
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Nama Guru
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Clock size={14} />
                      Jam Presensi
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendanceList.map((item) => (
                  <tr
                    key={item.no}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {item.no}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
                      {item.name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock
                          size={14}
                          className="text-gray-400 flex-shrink-0"
                        />
                        {item.time}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
                          item.status
                        )}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
            <Users
              size={40}
              className="sm:w-12 sm:h-12 mx-auto text-gray-300 mb-3 sm:mb-4"
            />
            <p className="text-sm sm:text-base text-gray-500 font-medium">
              Belum ada guru yang presensi hari ini
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Data akan muncul setelah ada guru yang melakukan presensi
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailySummary;

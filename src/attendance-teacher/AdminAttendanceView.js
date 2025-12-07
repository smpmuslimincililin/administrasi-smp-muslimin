// src/attendance-teacher/AdminAttendanceView.js
import React, { useState } from "react";
import {
  Users,
  FileText,
  RefreshCw,
  Settings,
  Calendar,
  Clock,
} from "lucide-react";
import DailySummary from "./reports/DailySummary";
import MonthlyView from "./reports/MonthlyView";
import ITMReport from "./reports/ITMReport";
import AttendanceTabs from "./AttendanceTabs";

const AdminAttendanceView = ({ currentUser }) => {
  const [activeView, setActiveView] = useState("today");
  const [reportType, setReportType] = useState("monthly"); // 'monthly' atau 'itm'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAttendanceSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-blue-600" size={28} />
                Manajemen Presensi Guru
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Monitoring dan laporan presensi seluruh guru
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">
                  {currentUser.full_name}
                </p>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                  Administrator
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {/* View Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveView("today")}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
              activeView === "today"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}>
            <Users size={18} />
            <span>Hari Ini</span>
          </button>

          <button
            onClick={() => setActiveView("manage")}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
              activeView === "manage"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}>
            <Settings size={18} />
            <span>Kelola</span>
          </button>

          <button
            onClick={() => setActiveView("monthly")}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
              activeView === "monthly"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}>
            <FileText size={18} />
            <span>Laporan</span>
          </button>
        </div>

        {/* Content */}
        <div>
          {activeView === "today" ? (
            <>
              {/* Daily Summary Stats */}
              <DailySummary refreshTrigger={refreshTrigger} />

              {/* Info Card */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Statistik Presensi Hari Ini
                    </h3>
                    <p className="text-sm text-gray-600">
                      Data presensi seluruh guru pada hari ini. Untuk melihat
                      detail per guru, silakan pilih tab "Laporan".
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : activeView === "monthly" ? (
            /* Reports Section */
            <div>
              {/* Reports Header */}
              <div className="mb-6 bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Laporan Presensi
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Pilih jenis laporan yang ingin dilihat
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRefresh}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center gap-2">
                      <RefreshCw size={16} />
                      Refresh Data
                    </button>
                  </div>
                </div>

                {/* Report Type Selector */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setReportType("monthly")}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                      reportType === "monthly"
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}>
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        reportType === "monthly" ? "bg-blue-100" : "bg-gray-100"
                      }`}>
                      <Calendar
                        className={
                          reportType === "monthly"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }
                        size={24}
                      />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-800">
                        Laporan Bulanan
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Rekap Presensi Semua Guru Per Bulan Dengan Persentase
                        Kehadiran
                      </p>
                    </div>
                    {reportType === "monthly" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>

                  <button
                    onClick={() => setReportType("itm")}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                      reportType === "itm"
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}>
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        reportType === "itm" ? "bg-blue-100" : "bg-gray-100"
                      }`}>
                      <Clock
                        className={
                          reportType === "itm"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }
                        size={24}
                      />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-800">
                        Laporan Tatap Muka
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Rekap Jam Tatap Muka Per Guru, Detail Kehadiran Per
                        Minggu
                      </p>
                    </div>
                    {reportType === "itm" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                </div>

                {/* Report Type Description */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {reportType === "monthly"
                      ? "📊 Menampilkan rekap presensi bulanan semua guru dengan filter berdasarkan bulan dan tahun."
                      : "⏰ Menampilkan detail jam tatap muka per guru, termasuk kehadiran per jam pelajaran sesuai jadwal mengajar."}
                  </p>
                </div>
              </div>

              {/* Report Content */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {reportType === "monthly" ? (
                  <MonthlyView currentUser={currentUser} />
                ) : (
                  <ITMReport />
                )}
              </div>
            </div>
          ) : (
            /* Manage Tab - NEW! */
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Settings className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Kelola Presensi Guru
                    </h3>
                    <p className="text-sm text-gray-600">
                      Generate QR Code untuk presensi hari ini, atau input
                      presensi guru secara manual.
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendance Tabs (Scan QR / Manual / Generate QR) */}
              <AttendanceTabs
                currentUser={currentUser}
                onSuccess={handleAttendanceSuccess}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttendanceView;

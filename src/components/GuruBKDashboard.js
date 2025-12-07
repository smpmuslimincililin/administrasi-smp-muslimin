import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AnnouncementPopup from "./AnnouncementPopup";

const GuruBKDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  const [stats, setStats] = useState({
    totalKonseling: 0,
    dalamProses: 0,
    selesai: 0,
    perluTindakLanjut: 0,
    konselingByGrade: [],
    recentKonseling: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current academic year
      const { data: activeYear, error: yearError } = await supabase
        .from("classes")
        .select("academic_year")
        .order("academic_year", { ascending: false })
        .limit(1)
        .single();

      if (yearError && yearError.code !== "PGRST116") {
        console.warn("Error fetching academic year:", yearError.message);
      }

      const currentYear = activeYear?.academic_year || "2025/2026";

      // Fetch konseling data untuk guru BK ini
      const { data: konselingData, error: konselingError } = await supabase
        .from("konseling")
        .select("*")
        .eq("academic_year", currentYear)
        .order("tanggal", { ascending: false });

      if (konselingError) {
        console.error("Error fetching konseling:", konselingError);
        throw konselingError;
      }

      // Calculate statistics
      const total = konselingData?.length || 0;
      const dalamProses =
        konselingData?.filter((k) => k.status_layanan === "Dalam Proses")
          .length || 0;
      const selesai =
        konselingData?.filter((k) => k.status_layanan === "Selesai").length ||
        0;
      const perluTindakLanjut =
        konselingData?.filter((k) => k.status_layanan === "Perlu Tindak Lanjut")
          .length || 0;

      // Group by grade (extract from class_id format like "7A", "8B", etc)
      const gradeStats = {};
      konselingData?.forEach((k) => {
        if (k.class_id) {
          const grade = k.class_id.charAt(0); // Extract first character (7, 8, or 9)
          gradeStats[grade] = (gradeStats[grade] || 0) + 1;
        }
      });

      const konselingByGrade = Object.entries(gradeStats)
        .map(([grade, count]) => ({ grade: parseInt(grade), count }))
        .sort((a, b) => a.grade - b.grade);

      // Recent konseling (last 5)
      const recentKonseling = konselingData?.slice(0, 5) || [];

      setStats({
        totalKonseling: total,
        dalamProses,
        selesai,
        perluTindakLanjut,
        konselingByGrade,
        recentKonseling,
      });
    } catch (err) {
      console.error("Error fetching Guru BK dashboard data:", err);
      setError("Gagal memuat data dashboard. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToKonseling = () => {
    navigate("/konseling");
  };

  const handleNavigateToPresensi = () => {
    navigate("/attendance-teacher");
  };

  const handleNavigateToStudents = () => {
    navigate("/students");
  };

  const handleNavigateToReports = () => {
    navigate("/reports");
  };

  const handleNavigateToNotes = () => {
    navigate("/student-notes");
  };

  const handleNavigateToSchedule = () => {
    navigate("/my-schedule");
  };

  const handleRetry = () => {
    setError(null);
    fetchDashboardData();
  };

  // Quick Actions Component untuk Mobile
  const QuickActionsMobile = () => (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Aksi Cepat</h2>

      {/* Baris 1 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={handleNavigateToPresensi}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">👨‍🏫</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Presensi Guru
          </span>
        </button>

        <button
          onClick={handleNavigateToKonseling}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📋</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Konseling
          </span>
        </button>

        <button
          onClick={handleNavigateToStudents}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">👤</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Data Siswa
          </span>
        </button>
      </div>

      {/* Baris 2 */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleNavigateToNotes}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📝</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Catatan Siswa
          </span>
        </button>

        <button
          onClick={handleNavigateToSchedule}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📅</span>
          </div>
          <span className="text-xs font-medium text-slate-800 text-center">
            Jadwal
          </span>
        </button>

        <button
          onClick={handleNavigateToReports}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <span className="text-white text-lg">📊</span>
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat dashboard BK/BP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {/* 🆕 Pop-up Pengumuman */}
      <AnnouncementPopup userId={user?.id} userRole="guru_bk" />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <span className="font-medium">Error: </span>
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-800 hover:text-red-900 font-bold text-xl self-end sm:self-auto">
            ×
          </button>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-3 sm:mb-2">
              Selamat Datang, {user?.full_name || user?.username}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                🧑‍⚕️ Guru BK/BP
              </span>
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Bimbingan & Konseling
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AKSI CEPAT MOBILE - Muncul hanya di HP */}
      {isMobile && <QuickActionsMobile />}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {/* Total Konseling */}
        <div className="group bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl shadow-lg hover:shadow-xl border border-blue-100 hover:border-blue-200 p-3 sm:p-4 lg:p-6 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-blue-600 mb-1 font-medium">
                Total Konseling
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                {stats.totalKonseling}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-white text-sm sm:text-lg lg:text-2xl">
                📋
              </span>
            </div>
          </div>
        </div>

        {/* Dalam Proses */}
        <div className="group bg-gradient-to-br from-yellow-50 via-white to-amber-50 rounded-xl shadow-lg hover:shadow-xl border border-yellow-100 hover:border-yellow-200 p-3 sm:p-4 lg:p-6 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-yellow-600 mb-1 font-medium">
                Dalam Proses
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 group-hover:text-yellow-700 transition-colors">
                {stats.dalamProses}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-white text-sm sm:text-lg lg:text-2xl">
                ⏳
              </span>
            </div>
          </div>
        </div>

        {/* Selesai */}
        <div className="group bg-gradient-to-br from-green-50 via-white to-emerald-50 rounded-xl shadow-lg hover:shadow-xl border border-green-100 hover:border-green-200 p-3 sm:p-4 lg:p-6 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-green-600 mb-1 font-medium">
                Selesai
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 group-hover:text-green-700 transition-colors">
                {stats.selesai}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-white text-sm sm:text-lg lg:text-2xl">
                ✅
              </span>
            </div>
          </div>
        </div>

        {/* Perlu Tindak Lanjut */}
        <div className="group bg-gradient-to-br from-red-50 via-white to-rose-50 rounded-xl shadow-lg hover:shadow-xl border border-red-100 hover:border-red-200 p-3 sm:p-4 lg:p-6 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-red-600 mb-1 font-medium">
                Tindak Lanjut
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 group-hover:text-red-700 transition-colors">
                {stats.perluTindakLanjut}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-white text-sm sm:text-lg lg:text-2xl">
                🔔
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Aksi Actions Desktop - Muncul hanya di Desktop/Tablet */}
      {!isMobile && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 sm:mb-4">
            Aksi Cepat
          </h2>
          {/* Mobile: 2x2 Grid, Laptop: 1x4 Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Presensi Guru - PALING AWAL */}
            <button
              onClick={handleNavigateToPresensi}
              className="group bg-gradient-to-br from-purple-50 via-white to-violet-50 hover:from-purple-100 hover:to-violet-100 text-slate-800 p-3 sm:p-4 rounded-xl text-left h-auto transition-all duration-300 border border-purple-100 hover:border-purple-200 shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <span className="text-white text-sm sm:text-lg">📝</span>
              </div>
              <div className="font-semibold text-sm sm:text-base group-hover:text-purple-700 transition-colors">
                Presensi Guru
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1 group-hover:text-purple-600 transition-colors">
                Absen kehadiran guru
              </div>
            </button>

            {/* 2. Tambah Konseling */}
            <button
              onClick={handleNavigateToKonseling}
              className="group bg-gradient-to-br from-blue-50 via-white to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-slate-800 p-3 sm:p-4 rounded-xl text-left h-auto transition-all duration-300 border border-blue-100 hover:border-blue-200 shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <span className="text-white text-sm sm:text-lg">📝</span>
              </div>
              <div className="font-semibold text-sm sm:text-base group-hover:text-blue-700 transition-colors">
                Tambah Konseling
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1 group-hover:text-blue-600 transition-colors">
                Input data konseling baru
              </div>
            </button>

            {/* 3. Lihat Data Konseling */}
            <button
              onClick={handleNavigateToKonseling}
              className="group bg-gradient-to-br from-green-50 via-white to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-slate-800 p-3 sm:p-4 rounded-xl text-left h-auto transition-all duration-300 border border-green-100 hover:border-green-200 shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <span className="text-white text-sm sm:text-lg">📊</span>
              </div>
              <div className="font-semibold text-sm sm:text-base group-hover:text-green-700 transition-colors">
                Lihat Data Konseling
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1 group-hover:text-green-600 transition-colors">
                Kelola semua data konseling
              </div>
            </button>

            {/* 4. Refresh Data */}
            <button
              onClick={handleRetry}
              className="group bg-gradient-to-br from-orange-50 via-white to-amber-50 hover:from-orange-100 hover:to-amber-100 text-slate-800 p-3 sm:p-4 rounded-xl text-left h-auto transition-all duration-300 border border-orange-100 hover:border-orange-200 shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-180 transition-all duration-500 shadow-lg">
                <span className="text-white text-sm sm:text-lg">🔄</span>
              </div>
              <div className="font-semibold text-sm sm:text-base group-hover:text-orange-700 transition-colors">
                Refresh Data
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1 group-hover:text-orange-600 transition-colors">
                Muat ulang dashboard
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Recent Konseling */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-xl shadow-xl border border-blue-100 p-4 sm:p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
            <span className="mr-2 text-blue-600">📋</span>
            Konseling Terbaru
          </h3>
          <button
            onClick={handleNavigateToKonseling}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105">
            <span className="mr-1">👁️</span> Lihat Semua
          </button>
        </div>

        {/* Recent Konseling List */}
        <div>
          {stats.recentKonseling.length > 0 ? (
            <div className="space-y-3">
              {stats.recentKonseling.map((konseling) => (
                <div
                  key={konseling.id}
                  className="group border-l-4 border-blue-500 pl-4 py-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 rounded-r-xl hover:from-blue-100/80 hover:to-indigo-100/50 transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                        {konseling.full_name || "Siswa"}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        {konseling.class_id || "-"} •{" "}
                        {konseling.bidang_bimbingan || "Tidak ada bidang"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        🕒{" "}
                        {konseling.tanggal
                          ? new Date(konseling.tanggal).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        konseling.status_layanan === "Selesai"
                          ? "bg-green-100 text-green-700"
                          : konseling.status_layanan === "Dalam Proses"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                      {konseling.status_layanan || "Tidak ada status"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border-2 border-dashed border-blue-200">
              <div className="text-2xl sm:text-4xl mb-4 animate-bounce">📋</div>
              <h4 className="font-medium text-slate-800 mb-2 text-sm sm:text-base">
                Belum Ada Data Konseling
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Klik tombol "📝 Tambah Konseling" untuk mulai input data
              </p>
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <span className="mr-1">💡</span>
                Tip: Data konseling akan tampil di sini
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuruBKDashboard;

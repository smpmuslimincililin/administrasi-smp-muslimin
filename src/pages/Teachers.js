import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { DataExcel } from "./DataExcel"; // ✅ IMPORT DATAEXCEL

export const Teachers = () => {
  const [guruData, setGuruData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false); // ✅ STATE LOADING EXPORT

  useEffect(() => {
    fetchDataGuru();
  }, []);

  const fetchDataGuru = async () => {
    try {
      setIsLoading(true);

      // ✅ UPDATE: Include both teacher AND guru_bk roles
      const { data: guruData, error: guruError } = await supabase
        .from("users")
        .select("id, teacher_id, full_name, is_active, homeroom_class_id, role")
        .in("role", ["teacher", "guru_bk"]); // ✅ Include guru_bk

      if (guruError) throw guruError;

      // Sort berdasarkan kode guru secara numerik (ekstrak angka dari teacher_id)
      const sortedGuruData = guruData.sort((a, b) => {
        const numA = parseInt(a.teacher_id?.replace(/\D/g, "") || "0");
        const numB = parseInt(b.teacher_id?.replace(/\D/g, "") || "0");
        return numA - numB;
      });

      // Ambil data mapel dari teacher_assignments
      const { data: mapelData, error: mapelError } = await supabase
        .from("teacher_assignments")
        .select("teacher_id, subject")
        .order("subject", { ascending: true });

      if (mapelError) throw mapelError;

      // Gabungkan data
      const guruWithMapel = sortedGuruData.map((guru) => {
        // ✅ Tentukan tugas/mapel berdasarkan role dan teacher_id
        let tugasMapel = [];

        if (guru.teacher_id === "G-01") {
          // Kepala Sekolah
          tugasMapel = ["Kepala Sekolah"];
        } else if (guru.role === "guru_bk") {
          // GURU BK/BP
          tugasMapel = ["GURU BK/BP"];
        } else {
          // Guru biasa - ambil dari teacher_assignments
          const mapelGuru = mapelData
            .filter((item) => item.teacher_id === guru.teacher_id)
            .map((item) => item.subject);
          tugasMapel = [...new Set(mapelGuru)];
        }

        // Gabung semua mapel dengan tanda "dan"
        const combinedMapel = tugasMapel.join(" dan ");

        return {
          ...guru,
          mapel: combinedMapel ? [combinedMapel] : [],
          walikelas: guru.homeroom_class_id || "-",
        };
      });

      // ✅ TAMBAHKAN DATA KEPALA SEKOLAH (HARDCODED)
      const kepalaSekolah = {
        id: "kepala-sekolah-001",
        teacher_id: "G-01",
        full_name: "ADE NURMUGHNI",
        is_active: true,
        homeroom_class_id: null,
        role: "teacher",
        mapel: ["KEPALA SEKOLAH"],
        walikelas: "-",
      };

      // Gabungkan kepala sekolah di urutan pertama
      const finalGuruData = [kepalaSekolah, ...guruWithMapel];

      setGuruData(finalGuruData);
    } catch (error) {
      console.error("Error fetching guru data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FUNCTION EXPORT GURU
  const handleExportGuru = async () => {
    setExportLoading(true);
    try {
      await DataExcel.exportTeachers(guruData);
    } catch (error) {
      console.error("Error exporting guru data:", error);
      alert("Gagal mengexport data guru");
    } finally {
      setExportLoading(false);
    }
  };

  // Loading Component
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 to-white min-h-screen">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Data Guru
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Memuat data guru...
          </p>
        </div>
        <div className="text-center py-8 sm:py-12">
          <div className="inline-block w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-sm sm:text-base text-slate-500">
            Sedang memuat data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-2xl font-bold text-slate-900 mb-2">
              Data Guru
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Manajemen Data Guru SMP Muslimin Cililin
            </p>
          </div>

          {/* ✅ TOMBOL EXPORT GURU */}
          <div className="flex-shrink-0">
            <button
              onClick={handleExportGuru}
              disabled={exportLoading || guruData.length === 0}
              className={`px-4 sm:px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 min-w-[140px] ${
                exportLoading || guruData.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
              }`}>
              {exportLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Export...</span>
                </>
              ) : (
                <>
                  <span>📊</span>
                  <span>Export Excel</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container - Menggunakan 2 Layout: Card (Default/HP) dan Table (sm: ke atas) */}

      {/* ---------------------------------------------------- */}
      {/* 🚀 LAYOUT MOBILE-FIRST (Card View) - Default/HP/Kecil */}
      {/* ---------------------------------------------------- */}
      <div className="sm:hidden space-y-3">
        {guruData.length > 0 ? (
          guruData.map((guru, index) => (
            <div
              key={guru.id}
              className="bg-white rounded-xl shadow-lg shadow-blue-100/50 p-4 border border-blue-100 hover:shadow-xl transition-shadow duration-300">
              {/* Header Card */}
              <div className="flex justify-between items-start border-b border-blue-100/70 pb-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    No. {index + 1} | Kode:{" "}
                    <span className="text-blue-600 font-bold">
                      {guru.teacher_id || "-"}
                    </span>
                  </p>
                  <p className="text-base font-bold text-slate-900 truncate">
                    {guru.full_name}
                  </p>
                </div>
                {/* Status */}
                <div className="flex-shrink-0 ml-3">
                  {guru.is_active ? (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                      Nonaktif
                    </span>
                  )}
                </div>
              </div>

              {/* Body Card */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 font-medium w-2/5">
                    Tugas/Mapel:
                  </span>
                  <div className="text-right flex-1 text-slate-900 font-semibold">
                    {guru.mapel?.length > 0 ? (
                      guru.mapel.join(", ")
                    ) : (
                      <span className="text-slate-400 italic">
                        Belum ada tugas
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-50/50">
                  <span className="text-slate-500 font-medium w-2/5">
                    Wali Kelas:
                  </span>
                  <div className="text-right flex-1 text-slate-900 font-semibold">
                    {guru.walikelas !== "-" ? (
                      `KELAS ${guru.walikelas}`
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Empty State untuk Mobile */
          <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-blue-100">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-base font-semibold text-slate-700 mb-2">
              Belum ada data guru
            </h3>
            <p className="text-sm text-slate-500">
              Silakan tambahkan data guru terlebih dahulu
            </p>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 💻 LAYOUT TABLE - Tablet (sm: ke atas) & Laptop */}
      {/* ---------------------------------------------------- */}
      <div className="hidden sm:block bg-white rounded-xl shadow-lg shadow-blue-100/50 overflow-hidden border border-blue-100">
        {/* Table Wrapper - Responsive Scroll (hanya jika memang tidak muat) */}
        <div className="overflow-x-auto">
          {guruData.length > 0 ? (
            <table className="w-full">
              {" "}
              {/* Hapus min-w supaya lebih fleksibel */}
              {/* Table Header */}
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                <tr>
                  <th className="w-12 sm:w-16 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider text-center">
                    No.
                  </th>
                  <th className="w-24 sm:w-32 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider text-center">
                    Kode Guru
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Nama Guru
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/3">
                    {" "}
                    {/* Lebih fleksibel */}
                    Tugas/Mapel
                  </th>
                  <th className="w-28 sm:w-32 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider text-center">
                    Wali Kelas
                  </th>
                  <th className="w-20 sm:w-24 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-white uppercase tracking-wider text-center">
                    Status
                  </th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody className="bg-white divide-y divide-blue-100">
                {guruData.map((guru, index) => (
                  <tr
                    key={guru.id}
                    className="hover:bg-blue-50/50 transition-colors duration-150">
                    {/* Nomor */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500 text-center font-medium">
                      {index + 1}
                    </td>

                    {/* Kode Guru */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      <div className="text-xs sm:text-sm font-bold text-blue-600">
                        {guru.teacher_id || "-"}
                      </div>
                    </td>

                    {/* Nama Guru */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-semibold text-slate-900">
                        {guru.full_name}
                      </div>
                    </td>

                    {/* Tugas/Mapel */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {guru.mapel?.length > 0 ? (
                        <div className="text-xs sm:text-sm text-slate-900 font-medium">
                          {guru.mapel.join(", ")}
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-slate-400 italic">
                          Belum ada tugas
                        </span>
                      )}
                    </td>

                    {/* Wali Kelas */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      {guru.walikelas !== "-" ? (
                        <div className="text-xs sm:text-sm text-slate-900 font-medium">
                          KELAS {guru.walikelas}
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-slate-400 italic">
                          -
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      {guru.is_active ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Nonaktif
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Empty State untuk Tablet/Laptop */
            <div className="text-center py-12 sm:py-16 bg-slate-50">
              <div className="text-4xl sm:text-6xl mb-4">👨‍🏫</div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-2">
                Belum ada data guru
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Silakan tambahkan data guru terlebih dahulu
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Footer (Optional) */}
      {guruData.length > 0 && (
        <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-md shadow-blue-100/50 border border-blue-100 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-slate-600 space-y-2 sm:space-y-0">
            <span>Total: {guruData.length} guru</span>
            <span>
              Aktif: {guruData.filter((g) => g.is_active).length} | Non-aktif:{" "}
              {guruData.filter((g) => !g.is_active).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;

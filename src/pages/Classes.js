// components/Classes.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { DataExcel } from "../pages/DataExcel";

export const Classes = ({ user, onShowToast }) => {
  const [kelasData, setKelasData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDataKelas();
  }, []);

  const fetchDataKelas = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // QUERY untuk data kelas
      const { data: kelasDataFromDB, error: kelasError } = await supabase
        .from("classes")
        .select("id, grade, academic_year")
        .order("grade", { ascending: true })
        .order("id", { ascending: true });

      if (kelasError) throw kelasError;

      // Ambil data wali kelas
      const { data: waliKelasData, error: waliError } = await supabase
        .from("users")
        .select("id, full_name, homeroom_class_id")
        .not("homeroom_class_id", "is", null);

      if (waliError) throw waliError;

      // Ambil data jumlah siswa per kelas
      const { data: siswaData, error: siswaError } = await supabase
        .from("students")
        .select("class_id, gender, is_active")
        .eq("is_active", true);

      if (siswaError) throw siswaError;

      // Hitung statistik siswa per kelas
      const statsPerKelas = {};
      siswaData.forEach((siswa) => {
        const classId = siswa.class_id;

        if (!statsPerKelas[classId]) {
          statsPerKelas[classId] = { total: 0, laki: 0, perempuan: 0 };
        }
        statsPerKelas[classId].total++;
        if (siswa.gender === "L") statsPerKelas[classId].laki++;
        if (siswa.gender === "P") statsPerKelas[classId].perempuan++;
      });

      // Gabungkan semua data
      const dataGabungan = kelasDataFromDB.map((kelas) => {
        const waliKelas = waliKelasData.find(
          (w) => w.homeroom_class_id === kelas.id
        );
        const stats = statsPerKelas[kelas.id] || {
          total: 0,
          laki: 0,
          perempuan: 0,
        };

        return {
          ...kelas,
          wali_kelas: waliKelas ? { full_name: waliKelas.full_name } : null,
          jumlah_siswa: stats.total,
          laki_laki: stats.laki,
          perempuan: stats.perempuan,
        };
      });

      setKelasData(dataGabungan);
    } catch (error) {
      console.error("Error fetching kelas data:", error);
      setError("Gagal memuat data kelas. Silakan coba lagi.");
      onShowToast("Gagal memuat data kelas", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Hitung total
  const totalSiswa = kelasData.reduce(
    (sum, kelas) => sum + kelas.jumlah_siswa,
    0
  );
  const totalLaki = kelasData.reduce((sum, kelas) => sum + kelas.laki_laki, 0);
  const totalPerempuan = kelasData.reduce(
    (sum, kelas) => sum + kelas.perempuan,
    0
  );

  // Data untuk export Excel
  const excelData = kelasData.map((kelas) => ({
    Kelas: kelas.id,
    "Tahun Ajaran": kelas.academic_year,
    "Wali Kelas": kelas.wali_kelas
      ? kelas.wali_kelas.full_name
      : "Belum ditentukan",
    "Jumlah Siswa": kelas.jumlah_siswa,
    "Laki-laki": kelas.laki_laki,
    Perempuan: kelas.perempuan,
  }));

  const handleExportExcel = async () => {
    try {
      await DataExcel.exportClasses(excelData);
      onShowToast("Data kelas berhasil diexport", "success");
    } catch (error) {
      console.error("Error exporting kelas:", error);
      onShowToast("Gagal mengexport data kelas", "error");
    }
  };

  if (isLoading) {
    // Styling Loading diubah agar lebih Mobile-First
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Data Kelas
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Memuat data kelas...
            </p>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    // Styling Error diubah agar lebih Mobile-First
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Data Kelas
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manajemen Data Kelas SMP Muslimin Cililin
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Terjadi Kesalahan
              </h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchDataKelas}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm">
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Padding menyesuaikan untuk Mobile-First
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header dengan tombol Export */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Data Kelas
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manajemen Data Kelas SMP Muslimin Cililin
            </p>
          </div>

          {/* Tombol Export Excel */}
          {kelasData.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export Excel
            </button>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* 🚀 LAYOUT MOBILE-FIRST (Card View) - Default/HP/Kecil */}
        {/* ---------------------------------------------------- */}
        <div className="sm:hidden space-y-4">
          {kelasData.length > 0 ? (
            kelasData.map((kelas, index) => (
              <div
                key={kelas.id}
                className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                {/* Header Card: Kelas & Tahun Ajaran */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      No. {index + 1}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {kelas.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {kelas.academic_year}
                    </p>
                  </div>
                  {/* Wali Kelas */}
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500">
                      Wali Kelas
                    </p>
                    {kelas.wali_kelas ? (
                      <span className="text-sm font-semibold text-gray-900">
                        {kelas.wali_kelas.full_name}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-400 italic">
                        Belum ditentukan
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Card: Statistik Siswa */}
                <div className="flex justify-between items-center text-center">
                  <div className="flex-1 border-r border-gray-100 pr-2">
                    <p className="text-xs text-gray-500">Total Siswa</p>
                    <p className="text-xl font-bold text-gray-800">
                      {kelas.jumlah_siswa}
                    </p>
                  </div>
                  <div className="flex-1 border-r border-gray-100 px-2">
                    <p className="text-xs text-gray-500">Laki-laki</p>
                    <p className="text-lg font-bold text-blue-600">
                      {kelas.laki_laki}
                    </p>
                  </div>
                  <div className="flex-1 pl-2">
                    <p className="text-xs text-gray-500">Perempuan</p>
                    <p className="text-lg font-bold text-pink-500">
                      {kelas.perempuan}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="py-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Tidak ada data kelas
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tidak ada data kelas yang tersedia saat ini.
                </p>
              </div>
            </div>
          )}

          {/* Card Total untuk Mobile */}
          {kelasData.length > 0 && (
            <div className="bg-blue-600 text-white rounded-xl shadow-xl p-4 mt-4">
              <h4 className="text-base font-bold mb-3 border-b border-blue-400 pb-2">
                TOTAL KESELURUHAN
              </h4>
              <div className="flex justify-between items-center text-center">
                <div className="flex-1 border-r border-blue-400 pr-2">
                  <p className="text-xs font-medium">Siswa Total</p>
                  <p className="text-2xl font-extrabold">{totalSiswa}</p>
                </div>
                <div className="flex-1 border-r border-blue-400 px-2">
                  <p className="text-xs font-medium">Laki-laki</p>
                  <p className="text-xl font-bold">{totalLaki}</p>
                </div>
                <div className="flex-1 pl-2">
                  <p className="text-xs font-medium">Perempuan</p>
                  <p className="text-xl font-bold">{totalPerempuan}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* 💻 LAYOUT TABLE - Tablet (sm: ke atas) & Laptop */}
        {/* ---------------------------------------------------- */}
        <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Table Data Kelas */}
          <div className="overflow-x-auto">
            {kelasData.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider w-12">
                      No.
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider w-1/5">
                      Kelas
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider w-1/4">
                      Wali Kelas
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Jumlah Siswa
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Laki-laki
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Perempuan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {kelasData.map((kelas, index) => (
                    <tr
                      key={kelas.id}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-left">
                        {index + 1}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-left">
                        <div className="font-semibold text-gray-900">
                          {kelas.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {kelas.academic_year}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-left">
                        {kelas.wali_kelas ? (
                          <span className="text-gray-900 text-sm">
                            {kelas.wali_kelas.full_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            Belum ditentukan
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-left font-semibold text-gray-900 text-sm">
                        {kelas.jumlah_siswa}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700 text-left text-sm">
                        {kelas.laki_laki}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700 text-left text-sm">
                        {kelas.perempuan}
                      </td>
                    </tr>
                  ))}

                  {/* Baris Total */}
                  <tr className="bg-blue-50 font-semibold border-t-2 border-blue-200">
                    <td
                      className="px-4 sm:px-6 py-4 text-left text-sm"
                      colSpan="3">
                      TOTAL
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-left text-blue-700 text-sm">
                      {totalSiswa}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-left text-blue-700 text-sm">
                      {totalLaki}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-left text-blue-700 text-sm">
                      {totalPerempuan}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              /* Empty State untuk Tablet/Laptop */
              <div className="py-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Tidak ada data kelas
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tidak ada data kelas yang tersedia saat ini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classes;

// pages/DataSiswa.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { DataExcel } from "./DataExcel";

export const Students = () => {
  const [siswaData, setSiswaData] = useState([]);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJenjang, setSelectedJenjang] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedGender, setSelectedGender] = useState("");

  // ✅ STATE MODAL EXPORT
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchKelasOptions();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("students")
        .select("*")
        .eq("is_active", true)
        .order("full_name", { ascending: true })
        .order("class_id", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      setSiswaData(data || []);
    } catch (error) {
      console.error("Error fetching siswa data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKelasOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id")
        .order("id", { ascending: true });

      if (error) throw error;
      setKelasOptions(data.map((item) => item.id) || []);
    } catch (error) {
      console.error("Error fetching kelas options:", error);
    }
  };

  // ✅ FUNGSI EXPORT DENGAN LOADING
  const handleExportAll = async () => {
    setExportLoading(true);
    try {
      await DataExcel.exportAllStudents(siswaData);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const handleExportByJenjang = async (jenjang) => {
    setExportLoading(true);
    try {
      await DataExcel.exportByJenjang(siswaData, jenjang);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const handleExportByKelas = async (kelas) => {
    setExportLoading(true);
    try {
      await DataExcel.exportByKelas(siswaData, kelas);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const handleExportByFilter = async () => {
    setExportLoading(true);
    try {
      await DataExcel.exportByFilter(
        filteredData,
        selectedKelas,
        selectedJenjang,
        selectedGender
      );
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  // Filter data
  const filteredKelasOptions = selectedJenjang
    ? kelasOptions.filter((kelas) => kelas.startsWith(selectedJenjang))
    : [];

  const filteredData = siswaData.filter((siswa) => {
    const matchesSearch =
      siswa.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      siswa.nis?.toString().includes(searchTerm);
    const matchesJenjang = selectedJenjang
      ? siswa.class_id?.startsWith(selectedJenjang)
      : true;
    const matchesKelas = selectedKelas
      ? siswa.class_id === selectedKelas
      : true;
    const matchesGender = selectedGender
      ? siswa.gender === selectedGender
      : true;

    return matchesSearch && matchesJenjang && matchesKelas && matchesGender;
  });

  const handleJenjangChange = (e) => {
    setSelectedJenjang(e.target.value);
    setSelectedKelas("");
  };

  // ✅ MODAL COMPONENT
  const ExportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 sm:p-6 rounded-t-xl">
          <h2 className="text-xl font-bold text-white text-center">
            📊 Export Data Siswa
          </h2>
          <p className="text-blue-100 text-center text-sm mt-1">
            Pilih jenis export yang diinginkan
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Export Semua Data */}
          <button
            onClick={handleExportAll}
            disabled={exportLoading || siswaData.length === 0}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
              exportLoading || siswaData.length === 0
                ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
            }`}>
            <div className="text-left">
              <div className="font-semibold">Export Semua Data</div>
              <div className="text-sm opacity-75">{siswaData.length} siswa</div>
            </div>
            <div className="text-2xl">📋</div>
          </button>

          {/* Export Berdasarkan Filter */}
          <button
            onClick={handleExportByFilter}
            disabled={exportLoading || filteredData.length === 0}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
              exportLoading || filteredData.length === 0
                ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
            }`}>
            <div className="text-left">
              <div className="font-semibold">Export Hasil Filter</div>
              <div className="text-sm opacity-75">
                {filteredData.length} siswa
                {(selectedJenjang || selectedKelas || selectedGender) &&
                  ` • ${selectedJenjang ? `Kelas ${selectedJenjang}` : ""} ${
                    selectedKelas ? selectedKelas : ""
                  } ${
                    selectedGender
                      ? `• ${
                          selectedGender === "L" ? "Laki-laki" : "Perempuan"
                        }`
                      : ""
                  }`}
              </div>
            </div>
            <div className="text-2xl">🎯</div>
          </button>

          {/* Export Per Jenjang */}
          <div className="space-y-2">
            <div className="font-semibold text-gray-700 text-sm">
              Export Per Jenjang:
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["7", "8", "9"].map((jenjang) => {
                const count = siswaData.filter((s) =>
                  s.class_id?.startsWith(jenjang)
                ).length;
                return (
                  <button
                    key={jenjang}
                    onClick={() => handleExportByJenjang(jenjang)}
                    disabled={exportLoading || count === 0}
                    className={`p-3 rounded-lg border transition-all ${
                      exportLoading || count === 0
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300"
                    }`}>
                    <div className="font-semibold">Kelas {jenjang}</div>
                    <div className="text-xs opacity-75">{count} siswa</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Per Kelas */}
          <div className="space-y-2">
            <div className="font-semibold text-gray-700 text-sm">
              Export Per Kelas:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {" "}
              {/* Grid responsif untuk kelas */}
              {kelasOptions.map((kelas) => {
                const count = siswaData.filter(
                  (s) => s.class_id === kelas
                ).length;
                return (
                  <button
                    key={kelas}
                    onClick={() => handleExportByKelas(kelas)}
                    disabled={exportLoading || count === 0}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      exportLoading || count === 0
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300"
                    }`}>
                    <div className="font-semibold">{kelas}</div>
                    <div className="text-xs opacity-75">{count} siswa</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={() => setShowExportModal(false)}
            disabled={exportLoading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50">
            {exportLoading ? "Mengexport..." : "Tutup"}
          </button>
        </div>

        {/* Loading Overlay */}
        {exportLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
              <div className="text-sm text-gray-600">
                Sedang mengexport data...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    // Revisi: Padding loading responsif
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Data Siswa
          </h1>
          <p className="text-sm text-gray-600">Memuat data siswa...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    // Revisi: Padding container utama responsif
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50">
      {/* ✅ MODAL RENDER */}
      {showExportModal && <ExportModal />}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Data Siswa
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Manajemen Data Siswa SMP Muslimin Cililin
        </p>
      </div>

      {/* ✅ STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Kelas */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="text-blue-600 text-xs font-semibold mb-1">
            Total Kelas
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {kelasOptions.length}
          </div>
        </div>

        {/* Total Siswa */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
          <div className="text-purple-600 text-xs font-semibold mb-1">
            Total Siswa
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {siswaData.length}
          </div>
        </div>

        {/* Kelas 7 */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
          <div className="text-green-600 text-xs font-semibold mb-1">
            Kelas 7
          </div>
          <div className="text-2xl font-bold text-green-700">
            {siswaData.filter((s) => s.class_id?.startsWith("7")).length}
          </div>
        </div>

        {/* Kelas 8 */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200 shadow-sm">
          <div className="text-yellow-600 text-xs font-semibold mb-1">
            Kelas 8
          </div>
          <div className="text-2xl font-bold text-yellow-700">
            {siswaData.filter((s) => s.class_id?.startsWith("8")).length}
          </div>
        </div>

        {/* Kelas 9 */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200 shadow-sm">
          <div className="text-pink-600 text-xs font-semibold mb-1">
            Kelas 9
          </div>
          <div className="text-2xl font-bold text-pink-700">
            {siswaData.filter((s) => s.class_id?.startsWith("9")).length}
          </div>
        </div>
      </div>

      {/* Filter Section (Revisi: Penyesuaian padding) */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
          {" "}
          {/* Gap responsif */}
          {/* Search Input */}
          <div className="flex-1 md:flex-[2] w-full">
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
            />
          </div>
          {/* Dropdown Jenjang */}
          <div className="flex-1 w-full">
            <select
              value={selectedJenjang}
              onChange={handleJenjangChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer transition text-sm sm:text-base">
              <option value="">Semua Jenjang</option>
              <option value="7">Kelas 7</option>
              <option value="8">Kelas 8</option>
              <option value="9">Kelas 9</option>
            </select>
          </div>
          {/* Dropdown Kelas */}
          <div className="flex-1 w-full">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              disabled={!selectedJenjang}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base ${
                !selectedJenjang
                  ? "bg-gray-100 cursor-not-allowed opacity-70"
                  : "bg-white cursor-pointer"
              }`}>
              <option value="">Semua Kelas</option>
              {filteredKelasOptions.map((kelas) => (
                <option key={kelas} value={kelas}>
                  {kelas}
                </option>
              ))}
            </select>
          </div>
          {/* Dropdown Jenis Kelamin */}
          <div className="flex-1 w-full">
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer transition text-sm sm:text-base">
              <option value="">Semua Jenis Kelamin</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          {/* ✅ TOMBOL EXPORT MODAL */}
          <div className="flex-1 w-full">
            <button
              onClick={() => setShowExportModal(true)}
              disabled={siswaData.length === 0}
              className={`w-full p-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm sm:text-base ${
                siswaData.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
              }`}>
              <span>📊</span>
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Filter (Revisi: Text size responsif) */}
      {(selectedJenjang || selectedKelas || searchTerm || selectedGender) && (
        <div className="mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100 text-xs sm:text-sm inline-block">
          Menampilkan <strong>{filteredData.length} Siswa</strong>
          {searchTerm && ` dengan kata kunci "${searchTerm}"`}
          {selectedKelas && ` Di Kelas ${selectedKelas}`}
          {selectedGender &&
            ` ${selectedGender === "L" ? "Laki-laki" : "Perempuan"}`}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 🚀 LAYOUT MOBILE-FIRST (Card View) - Default/HP/Kecil */}
      {/* ---------------------------------------------------- */}
      {/* ✅ PERUBAHAN UTAMA: Ganti sm:hidden menjadi md:hidden */}
      <div className="md:hidden space-y-3">
        {filteredData.length > 0 ? (
          filteredData.map((siswa, index) => (
            <div
              key={siswa.id}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              {/* Header: Nama & Kelas */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    No. {index + 1} | Kelas:{" "}
                    <span className="font-bold text-blue-600">
                      {siswa.class_id}
                    </span>
                  </p>
                  <p className="text-base font-bold text-gray-900 truncate">
                    {siswa.full_name}
                  </p>
                </div>
                {/* Status */}
                <div className="flex-shrink-0 ml-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      siswa.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                    {siswa.is_active ? "Aktif" : "Non-Aktif"}
                  </span>
                </div>
              </div>

              {/* Body Card: Detail */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">NIS:</span>
                  <span className="font-mono text-gray-900">{siswa.nis}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">
                    Jenis Kelamin:
                  </span>
                  <span className="text-gray-900">
                    {siswa.gender === "L" ? "Laki-laki" : "Perempuan"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Empty State untuk Mobile */
          <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm">
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
            <p className="mt-2 text-sm font-medium text-gray-900">
              Tidak ada data siswa
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedJenjang || selectedKelas || selectedGender
                ? "Siswa tidak ditemukan sesuai filter."
                : "Belum ada data siswa di sistem."}
            </p>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 💻 LAYOUT TABLE - Tablet (md: ke atas) & Laptop */}
      {/* ---------------------------------------------------- */}
      {/* ✅ PERUBAHAN UTAMA: Ganti hidden sm:block menjadi hidden md:block */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Table Data Siswa */}
        <div className="overflow-x-auto">
          {filteredData.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  {/* Revisi: Menyesuaikan padding dan width untuk tampilan Tablet/Laptop */}
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left w-1/12 text-xs uppercase tracking-wider text-center">
                    No.
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left w-2/12 text-xs uppercase tracking-wider">
                    NIS
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left w-4/12 text-xs uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left w-2/12 text-xs uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left w-2/12 text-xs uppercase tracking-wider">
                    Jenis Kelamin
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left w-1/12 text-xs uppercase tracking-wider text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((siswa, index) => (
                  <tr
                    key={siswa.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    {/* Revisi: Menyesuaikan padding dan text size untuk tampilan Tablet/Laptop */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-sm">
                      {index + 1}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-sm">
                      {siswa.nis}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-sm">
                      {siswa.full_name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-sm">
                      {siswa.class_id}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm">
                      {siswa.gender === "L" ? "Laki-laki" : "Perempuan"}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          siswa.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                        {siswa.is_active ? "Aktif" : "Non-Aktif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Empty State untuk Tablet/Laptop */
            <div className="p-12 text-center text-gray-500">
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
              <p className="mt-2 text-sm font-medium text-gray-900">
                Tidak ada data siswa
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ||
                selectedJenjang ||
                selectedKelas ||
                selectedGender
                  ? "Siswa tidak ditemukan sesuai filter."
                  : "Belum ada data siswa di sistem."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Students;

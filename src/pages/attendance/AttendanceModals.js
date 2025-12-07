import React, { useState, useEffect } from "react";

const AttendanceModals = ({
  // Modal visibility states
  showRekapModal,
  setShowRekapModal,
  showConfirmModal,
  setShowConfirmModal,
  showExportMonthlyModal,
  setShowExportMonthlyModal,
  showExportSemesterModal,
  setShowExportSemesterModal,
  exportLoading,

  // Data props
  selectedClass,
  selectedSubject,
  homeroomClass,
  students,
  onShowToast,
  isHomeroomDaily,
  existingAttendanceData,
  pendingAttendanceData,
  loading,
  date,

  // Handler functions
  handleOverwriteConfirmation,
  handleCancelOverwrite,
  processMonthlyExport,
  processSemesterExport,
}) => {
  // ========== EXPORT MONTHLY MODAL ==========
  const ExportMonthlyModal = () => {
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");

    useEffect(() => {
      if (showExportMonthlyModal) {
        const now = new Date();
        setSelectedYear(now.getFullYear().toString());
        setSelectedMonth(String(now.getMonth() + 1).padStart(2, "0"));
      }
    }, [showExportMonthlyModal]);

    const handleExport = () => {
      if (!selectedMonth || !selectedYear) return;
      const yearMonth = `${selectedYear}-${selectedMonth}`;
      processMonthlyExport(yearMonth);
      setShowExportMonthlyModal(false);
    };

    if (!showExportMonthlyModal) return null;

    const yearOptions = [];
    for (let year = 2024; year <= 2030; year++) {
      yearOptions.push(year);
    }

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

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          {/* Header - Blue theme */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Export Bulanan</h2>
                <p className="text-blue-100 text-sm">
                  Pilih periode bulan untuk diunduh
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowExportMonthlyModal(false)}
              className="p-2 hover:bg-blue-600 rounded-lg transition">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Month Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                <option value="">-- Pilih Bulan --</option>
                {monthNames.map((name, index) => (
                  <option
                    key={index}
                    value={String(index + 1).padStart(2, "0")}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Tahun
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                <option value="">-- Pilih Tahun --</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportMonthlyModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                Batal
              </button>
              <button
                onClick={handleExport}
                disabled={!selectedMonth || !selectedYear}
                className="flex-1 px-4 py-3 bg-blue-500 border border-blue-600 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========== EXPORT SEMESTER MODAL ==========
  const ExportSemesterModal = () => {
    const [selectedSemester, setSelectedSemester] = useState("ganjil");
    const [selectedYear, setSelectedYear] = useState("");

    useEffect(() => {
      if (showExportSemesterModal) {
        const now = new Date();
        setSelectedYear(now.getFullYear().toString());
      }
    }, [showExportSemesterModal]);

    const handleExport = () => {
      if (!selectedYear) return;
      processSemesterExport(selectedSemester, parseInt(selectedYear));
    };

    if (!showExportSemesterModal) return null;

    const yearOptions = [];
    for (let year = 2024; year <= 2030; year++) {
      yearOptions.push(year);
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          {/* Header - Indigo theme */}
          <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Export Semester</h2>
                <p className="text-indigo-100 text-sm">
                  Pilih semester untuk diunduh
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowExportSemesterModal(false)}
              className="p-2 hover:bg-indigo-600 rounded-lg transition">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Semester Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
                <option value="ganjil">Semester Ganjil (Juli-Desember)</option>
                <option value="genap">Semester Genap (Januari-Juni)</option>
              </select>
            </div>

            {/* Year Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Tahun
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
                <option value="">-- Pilih Tahun --</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Info Box */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-indigo-700">
                    Data akan diekspor dalam format Excel (.xlsx) untuk semester
                    yang dipilih
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportSemesterModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                Batal
              </button>
              <button
                onClick={handleExport}
                disabled={!selectedYear || exportLoading}
                className="flex-1 px-4 py-3 bg-indigo-500 border border-indigo-600 text-white rounded-lg hover:bg-indigo-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {exportLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Mengekspor...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========== CONFIRM OVERWRITE MODAL ==========
  const ConfirmOverwriteModal = () => {
    if (!showConfirmModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6 border-b border-slate-200 sticky top-0 bg-white">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800">
              ⚠️ Data Presensi Sudah Ada
            </h3>
          </div>

          <div className="p-4 sm:p-6">
            <p className="text-sm sm:text-base text-slate-700 mb-4">
              Presensi untuk <strong>{selectedSubject}</strong> pada tanggal{" "}
              <strong>{date}</strong> sudah tersimpan sebelumnya.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Data yang sudah ada:</strong>{" "}
                {existingAttendanceData?.length} siswa
              </p>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Apakah Anda ingin <strong>menimpa data lama</strong> dengan data
              yang baru?
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancelOverwrite}
                disabled={loading}
                className="w-full sm:flex-1 px-4 py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition font-medium text-sm sm:text-base touch-manipulation disabled:opacity-50"
                style={{ minHeight: "44px" }}>
                Batal
              </button>
              <button
                onClick={handleOverwriteConfirmation}
                disabled={loading}
                className="w-full sm:flex-1 px-4 py-3 bg-red-500 border border-red-600 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition font-medium text-sm sm:text-base disabled:opacity-50 touch-manipulation"
                style={{ minHeight: "44px" }}>
                {loading ? "Menimpa..." : "Ya, Timpa Data"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========== MAIN RENDER ==========
  return (
    <>
      <ExportMonthlyModal />
      <ExportSemesterModal />
      <ConfirmOverwriteModal />
    </>
  );
};

export default AttendanceModals;

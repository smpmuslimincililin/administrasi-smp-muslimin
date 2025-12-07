import React, { useState } from "react";
import {
  Zap,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Users,
  UserPlus,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  School,
  Hash,
  TrendingUp,
  PieChart,
} from "lucide-react";

// ========================================
// 🔧 PROCESSING LOGIC - REUSABLE FUNCTION
// ========================================

/**
 * Process simulation data dari preview
 * @param {Object} preview - Data dari yearTransition.preview
 * @param {Object} schoolStats - Stats sekolah saat ini
 * @param {Object} config - Konfigurasi sekolah (grades, classes, dll)
 * @returns {Object} Simulation data lengkap
 */
export const processSimulation = (preview, schoolStats, config) => {
  if (!preview) return null;

  const SCHOOL_CONFIG = {
    capacityRange: {
      minimum: 20,
      comfortable: 30,
      optimal: 35,
      high: 40,
      maximum: 45,
    },
  };

  try {
    // 1️⃣ ANALISA SISWA BARU (DARI PREVIEW!)
    const newStudentDistribution = preview.newStudentDistribution || {};
    const newStudents = preview.newStudents || [];

    // Hitung total per kelas 7
    const grade7Classes = Object.keys(newStudentDistribution);
    const grade7Total = Object.values(newStudentDistribution).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    // 2️⃣ ANALISA PROMOTIONS (SISWA NAIK KELAS)
    const promotions = preview.promotions || {};

    // Group by grade
    const grade8Classes = {};
    const grade9Classes = {};

    Object.entries(promotions).forEach(([classId, students]) => {
      const grade = classId.charAt(0);

      if (grade === "8") {
        grade8Classes[classId] = students.length;
      } else if (grade === "9") {
        grade9Classes[classId] = students.length;
      }
    });

    // Hitung total
    const grade8Total = Object.values(grade8Classes).reduce((a, b) => a + b, 0);
    const grade9Total = Object.values(grade9Classes).reduce((a, b) => a + b, 0);

    const grade8ClassCount = Object.keys(grade8Classes).length;
    const grade9ClassCount = Object.keys(grade9Classes).length;

    // 3️⃣ BUAT DISTRIBUSI FINAL
    const finalClassDistribution = [];
    const warnings = [];
    const insights = [];

    // ---- KELAS 7 (SISWA BARU) ----
    Object.entries(newStudentDistribution).forEach(([classId, students]) => {
      const studentCount = students.length;

      finalClassDistribution.push({
        class: classId,
        grade: "7",
        totalStudents: studentCount,
        newStudents: studentCount,
        existingStudents: 0,
        status:
          studentCount === 0
            ? "empty"
            : studentCount < SCHOOL_CONFIG.capacityRange.minimum
            ? "low"
            : studentCount > SCHOOL_CONFIG.capacityRange.maximum
            ? "high"
            : studentCount > SCHOOL_CONFIG.capacityRange.high
            ? "full"
            : "optimal",
      });

      // Warnings
      if (studentCount === 0) {
        warnings.push({
          type: "empty_class",
          message: `⚠️ ${classId} akan KOSONG (0 siswa)`,
          severity: "high",
        });
      } else if (studentCount < SCHOOL_CONFIG.capacityRange.minimum) {
        insights.push({
          type: "low_capacity",
          message: `ℹ️ ${classId}: ${studentCount} siswa (kurang dari minimal ${SCHOOL_CONFIG.capacityRange.minimum})`,
          severity: "low",
        });
      } else if (studentCount > SCHOOL_CONFIG.capacityRange.maximum) {
        warnings.push({
          type: "high_capacity",
          message: `⚠️ ${classId}: ${studentCount} siswa (melebihi kapasitas ${SCHOOL_CONFIG.capacityRange.maximum})`,
          severity: "medium",
        });
      }
    });

    // ---- KELAS 8 (DARI PROMOTIONS) ----
    Object.entries(grade8Classes).forEach(([classId, studentCount]) => {
      finalClassDistribution.push({
        class: classId,
        grade: "8",
        totalStudents: studentCount,
        newStudents: 0,
        existingStudents: studentCount,
        status:
          studentCount === 0
            ? "empty"
            : studentCount > SCHOOL_CONFIG.capacityRange.maximum
            ? "high"
            : studentCount > SCHOOL_CONFIG.capacityRange.high
            ? "full"
            : "optimal",
      });

      if (studentCount > SCHOOL_CONFIG.capacityRange.maximum) {
        warnings.push({
          type: "over_capacity",
          message: `📈 ${classId}: ${studentCount} siswa (padat)`,
          severity: "medium",
        });
      }
    });

    // ---- KELAS 9 (DARI PROMOTIONS) ----
    Object.entries(grade9Classes).forEach(([classId, studentCount]) => {
      finalClassDistribution.push({
        class: classId,
        grade: "9",
        totalStudents: studentCount,
        newStudents: 0,
        existingStudents: studentCount,
        status:
          studentCount === 0
            ? "empty"
            : studentCount > SCHOOL_CONFIG.capacityRange.maximum
            ? "high"
            : studentCount > SCHOOL_CONFIG.capacityRange.high
            ? "full"
            : "optimal",
      });
    });

    // 4️⃣ HITUNG STATISTIK
    const totalPromoted = grade8Total + grade9Total;
    const totalNewStudents = grade7Total;
    const totalGraduated = preview.graduating?.length || 0;
    const totalActiveAfter = totalPromoted + totalNewStudents;

    // Rata-rata per kelas
    const avgGrade7 =
      grade7Classes.length > 0
        ? Math.round(grade7Total / grade7Classes.length)
        : 0;
    const avgGrade8 =
      grade8ClassCount > 0 ? Math.round(grade8Total / grade8ClassCount) : 0;
    const avgGrade9 =
      grade9ClassCount > 0 ? Math.round(grade9Total / grade9ClassCount) : 0;

    // 5️⃣ REKOMENDASI
    const recommendations = [];

    recommendations.push(`🏫 **Struktur Kelas untuk ${preview.newYear}:**`);
    recommendations.push(
      `• Kelas 7: ${grade7Classes.length} paralel (${grade7Total} siswa, rata² ${avgGrade7}/kelas)`
    );
    recommendations.push(
      `• Kelas 8: ${grade8ClassCount} paralel (${grade8Total} siswa, rata² ${avgGrade8}/kelas)`
    );
    recommendations.push(
      `• Kelas 9: ${grade9ClassCount} paralel (${grade9Total} siswa, rata² ${avgGrade9}/kelas)`
    );
    recommendations.push(
      `• **Total:** ${
        grade7Classes.length + grade8ClassCount + grade9ClassCount
      } kelas aktif`
    );

    // Analisis kapasitas
    if (avgGrade8 > SCHOOL_CONFIG.capacityRange.high) {
      recommendations.push(
        `📊 **Catatan:** Kelas 8 rata² ${avgGrade8} Siswa/Kelas (Cukup Padat)`
      );
    }

    if (grade7Total < 100) {
      recommendations.push(
        `💡 **Saran:** Jumlah Siswa Baru (${grade7Total}) Dibawah Ekspektasi Normal`
      );
    }

    // 6️⃣ HASIL SIMULASI
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalPromoted,
        totalNewStudents,
        totalGraduated,
        totalActiveBefore: schoolStats?.total_students || 0,
        totalActiveAfter,
        netChange: totalActiveAfter - (schoolStats?.total_students || 0),
      },
      classStructure: {
        grade7: {
          classes: grade7Classes.length,
          students: grade7Total,
          avgPerClass: avgGrade7,
          status:
            avgGrade7 < SCHOOL_CONFIG.capacityRange.minimum
              ? "low"
              : avgGrade7 > SCHOOL_CONFIG.capacityRange.maximum
              ? "high"
              : "optimal",
        },
        grade8: {
          classes: grade8ClassCount,
          students: grade8Total,
          avgPerClass: avgGrade8,
          status:
            avgGrade8 > SCHOOL_CONFIG.capacityRange.maximum
              ? "high"
              : avgGrade8 > SCHOOL_CONFIG.capacityRange.high
              ? "full"
              : "optimal",
        },
        grade9: {
          classes: grade9ClassCount,
          students: grade9Total,
          avgPerClass: avgGrade9,
          status:
            avgGrade9 > SCHOOL_CONFIG.capacityRange.maximum
              ? "high"
              : avgGrade9 > SCHOOL_CONFIG.capacityRange.high
              ? "full"
              : "optimal",
        },
      },
      classDistribution: finalClassDistribution.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
        return a.class.localeCompare(b.class);
      }),
      warnings,
      insights,
      recommendations,
      isValid: warnings.filter((w) => w.severity === "high").length === 0,
      academicYearChange: {
        from: preview.currentYear,
        to: preview.newYear,
      },
    };
  } catch (error) {
    console.error("Error processing simulation:", error);
    return null;
  }
};

// ========================================
// 🎨 PRESENTATION COMPONENT - REUSABLE UI
// ========================================

/**
 * SimulationResults - Component untuk display hasil simulasi
 * @param {Object} data - Hasil dari processSimulation()
 * @param {boolean} showRecommendations - Show/hide recommendations
 * @param {function} onClose - Callback untuk close
 */
export const SimulationResults = ({
  data,
  showRecommendations = true,
  onClose,
}) => {
  const [showDetails, setShowDetails] = useState({});

  if (!data) return null;

  const {
    summary,
    classStructure = {},
    classDistribution,
    warnings,
    insights,
    recommendations,
    isValid,
  } = data;

  return (
    <div className="mt-6 bg-white border-2 border-blue-300 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              🧮 Hasil Analisis Simulasi
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(data.timestamp).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div
          className={`px-3 py-1 rounded-full ${
            isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          } font-medium`}>
          {isValid ? "✅ VALID" : "⚠️ PERHATIAN"}
        </div>
      </div>

      {/* STATISTIK UTAMA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-blue-600" />
            <p className="text-xs font-medium text-blue-700">Naik Kelas</p>
          </div>
          <p className="text-2xl font-bold text-blue-800">
            {summary.totalPromoted}
          </p>
          <p className="text-xs text-blue-600 mt-1">Siswa 7→8, 8→9</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={16} className="text-green-600" />
            <p className="text-xs font-medium text-green-700">Siswa Baru</p>
          </div>
          <p className="text-2xl font-bold text-green-800">
            {summary.totalNewStudents}
          </p>
          <p className="text-xs text-green-600 mt-1">Masuk kelas 7</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <School size={16} className="text-purple-600" />
            <p className="text-xs font-medium text-purple-700">Siswa Lulus</p>
          </div>
          <p className="text-2xl font-bold text-purple-800">
            {summary.totalGraduated}
          </p>
          <p className="text-xs text-purple-600 mt-1">Kelas 9</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-orange-600" />
            <p className="text-xs font-medium text-orange-700">Total Aktif</p>
          </div>
          <p className="text-2xl font-bold text-orange-800">
            {summary.totalActiveAfter}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            {summary.netChange > 0 ? "+" : ""}
            {summary.netChange} dari sebelumnya
          </p>
        </div>
      </div>

      {/* STRUKTUR KELAS */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <School className="text-blue-600" size={18} />
          Struktur Kelas untuk {data.academicYearChange.to}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["grade7", "grade8", "grade9"].map((gradeKey) => {
            const grade = gradeKey.replace("grade", "");
            const gradeData = classStructure[gradeKey] || {};

            if (Object.keys(gradeData).length === 0) {
              return null;
            }

            const statusColors = {
              low: "bg-yellow-100 text-yellow-800",
              optimal: "bg-green-100 text-green-800",
              full: "bg-blue-100 text-blue-800",
              high: "bg-orange-100 text-orange-800",
            };

            return (
              <div
                key={grade}
                className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-800">Kelas {grade}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      statusColors[gradeData.status] || "bg-gray-100"
                    }`}>
                    {gradeData.classes} Paralel
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Siswa</span>
                    <span className="font-semibold">{gradeData.students}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Rata² per Kelas
                    </span>
                    <span className="font-semibold">
                      {gradeData.avgPerClass} siswa
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span
                      className={`text-xs font-medium ${
                        gradeData.status === "high"
                          ? "text-orange-600"
                          : gradeData.status === "low"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}>
                      {gradeData.status === "high"
                        ? "Padat"
                        : gradeData.status === "low"
                        ? "Sedikit"
                        : gradeData.status === "full"
                        ? "Penuh"
                        : "Optimal"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DISTRIBUSI DETAIL */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <PieChart className="text-purple-600" size={18} />
            Distribusi Per Kelas
          </h4>
          <button
            onClick={() =>
              setShowDetails((prev) => ({ ...prev, classes: !prev.classes }))
            }
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
            {showDetails.classes ? "Sembunyikan" : "Tampilkan"} Detail
            {showDetails.classes ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>

        {showDetails.classes ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {classDistribution.map((cls) => {
              const statusColors = {
                empty: "bg-red-50 border-red-200",
                low: "bg-yellow-50 border-yellow-200",
                optimal: "bg-green-50 border-green-200",
                full: "bg-blue-50 border-blue-200",
                high: "bg-orange-50 border-orange-200",
              };

              const statusText = {
                empty: "Kosong",
                low: "Sedikit",
                optimal: "Optimal",
                full: "Penuh",
                high: "Padat",
              };

              return (
                <div
                  key={cls.class}
                  className={`p-3 rounded-lg border ${
                    statusColors[cls.status] || "bg-gray-50"
                  }`}>
                  <div className="text-center">
                    <p className="font-bold text-gray-800">{cls.class}</p>
                    <p className="text-2xl font-bold mt-1">
                      {cls.totalStudents}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {cls.existingStudents} Ada + {cls.newStudents} Baru
                    </p>
                    <div
                      className={`mt-2 text-xs px-2 py-1 rounded-full ${
                        cls.status === "high"
                          ? "bg-orange-100 text-orange-800"
                          : cls.status === "low"
                          ? "bg-yellow-100 text-yellow-800"
                          : cls.status === "empty"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                      {statusText[cls.status]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              {classDistribution.length} Kelas Trdeteksi. Klik "Tampilkan
              Detail" Untuk Melihat Distribusi Lengkap.
            </p>
          </div>
        )}
      </div>

      {/* INSIGHTS & REKOMENDASI */}
      {showRecommendations && recommendations && recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Hash className="text-blue-600" size={18} />
            Rekomendasi Sistem
          </h4>
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <p className="text-sm text-blue-800">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WARNING & INSIGHTS */}
      {(warnings.length > 0 || insights.length > 0) && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="text-yellow-600" size={18} />
            Analisis Sistem
          </h4>
          <div className="space-y-3">
            {/* WARNINGS */}
            {warnings.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-800 mb-2">
                  ⚠️ Perhatian Khusus
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  {warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{warning.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* INSIGHTS */}
            {insights.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-medium text-yellow-800 mb-2">💡 Insight</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{insight.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATUS VALIDASI */}
      <div
        className={`p-4 rounded-lg ${
          isValid
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}>
        <div className="flex items-center gap-3">
          {isValid ? (
            <CheckCircle className="text-green-600" size={24} />
          ) : (
            <AlertTriangle className="text-red-600" size={24} />
          )}
          <div>
            <p
              className={`font-semibold ${
                isValid ? "text-green-800" : "text-red-800"
              }`}>
              {isValid
                ? "✅ SIMULASI VALID - Sistem Siap Untuk Transisi"
                : "⚠️ PERHATIAN - Ada Masalah Yang Perlu Ditinjau Sebelum Eexecute"}
            </p>
            <p
              className={`text-sm mt-1 ${
                isValid ? "text-green-700" : "text-red-700"
              }`}>
              {isValid
                ? "Semua Analisis Menunjukkan Sistem Dapat Melanjutkan Transisi Tahun Ajaran."
                : "Tinjau Rekomendasi Dan Analisis Di Atas Sebelum Melanjutkan."}
            </p>
          </div>
        </div>
      </div>

      {/* TOMBOL CLOSE (optional) */}
      {onClose && (
        <div className="flex gap-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition">
            Tutup
          </button>
        </div>
      )}
    </div>
  );
};

// ========================================
// 🎯 MAIN SIMULATOR COMPONENT
// ========================================

/**
 * Simulator - Main component dengan 2 modes
 * @param {string} mode - "preview" (auto-show) atau "analysis" (manual trigger)
 * @param {Object} preview - Data preview dari yearTransition
 * @param {Object} schoolStats - Stats sekolah
 * @param {Object} config - Konfigurasi sekolah
 * @param {boolean} loading - Loading state
 * @param {function} onSimulate - Callback setelah simulasi
 */
const Simulator = ({
  mode = "analysis",
  preview,
  schoolStats,
  config,
  loading,
  onSimulate,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  // Mode "preview" = auto-process & display
  if (mode === "preview" && preview) {
    const result = processSimulation(preview, schoolStats, config);
    return (
      <SimulationResults
        data={result}
        showRecommendations={false}
        onClose={null}
      />
    );
  }

  // Mode "analysis" = manual trigger dengan button
  const handleSimulate = async () => {
    if (!preview) {
      alert("Generate preview transisi terlebih dahulu!");
      return;
    }

    setIsSimulating(true);

    try {
      const result = processSimulation(preview, schoolStats, config);
      setSimulationResult(result);

      if (onSimulate) {
        onSimulate(result);
      }
    } catch (error) {
      console.error("Error in simulation:", error);
      alert("Error saat simulasi: " + error.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Jika belum ada preview
  if (!preview) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-yellow-600" size={20} />
          <div>
            <p className="font-medium text-yellow-800">
              Belum ada preview transisi
            </p>
            <p className="text-sm text-yellow-700">
              Klik "Preview Naik Kelas" terlebih dahulu
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* TOMBOL SIMULASI */}
      {!simulationResult && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <Zap className="text-blue-700" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 text-lg">
                  🧮 SIMULATOR TRANSIKSI DINAMIS
                </h3>
                <p className="text-blue-700 text-sm">
                  Analisis kebutuhan kelas dan distribusi siswa secara otomatis
                </p>
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isSimulating || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md">
              {isSimulating ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Menganalisa...
                </>
              ) : (
                <>
                  <BarChart3 size={18} />
                  🧠 Jalankan Analisis
                </>
              )}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Analisis kapasitas kelas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Deteksi masalah distribusi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Rekomendasi sistem</span>
            </div>
          </div>
        </div>
      )}

      {/* STATUS PREVIEW */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="text-gray-600" size={18} />
          <div>
            <p className="font-medium text-gray-800">Preview Transisi</p>
            <p className="text-sm text-gray-600">
              {preview.currentYear} → {preview.newYear}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded border">
            <p className="text-xs text-gray-500">Siswa Baru (Kelas 7)</p>
            <p className="font-bold text-gray-800">
              {preview.newStudents?.length || 0}
            </p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="text-xs text-gray-500">Naik Kelas</p>
            <p className="font-bold text-gray-800">
              {Object.keys(preview.promotions || {}).length > 0
                ? Object.values(preview.promotions || {}).reduce(
                    (total, arr) => total + arr.length,
                    0
                  )
                : 0}
            </p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="text-xs text-gray-500">Lulus</p>
            <p className="font-bold text-gray-800">
              {preview.graduating?.length || 0}
            </p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="text-xs text-gray-500">Status</p>
            <p className="font-medium text-green-600">Preview Siap</p>
          </div>
        </div>
      </div>

      {/* HASIL SIMULASI */}
      {simulationResult && (
        <SimulationResults
          data={simulationResult}
          showRecommendations={true}
          onClose={() => setSimulationResult(null)}
        />
      )}

      {/* LOADING STATE */}
      {(isSimulating || loading) && !simulationResult && (
        <div className="border-2 border-blue-300 border-dashed rounded-lg p-8 text-center">
          <RefreshCw className="animate-spin mx-auto text-blue-500" size={32} />
          <p className="mt-3 font-medium text-blue-700">
            Menganalisis data transisi...
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Menghitung distribusi, kapasitas, dan rekomendasi sistem
          </p>
        </div>
      )}

      {/* EMPTY STATE - No preview */}
      {!preview && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-8 text-center">
          <BarChart3 className="mx-auto text-gray-400" size={48} />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            Simulator Siap
          </h3>
          <p className="text-gray-600 mt-2">
            Hasil analisis akan muncul di sini setelah menjalankan simulasi.
          </p>
          <button
            onClick={handleSimulate}
            disabled={true}
            className="mt-4 px-5 py-2 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed">
            Butuh Preview Transisi
          </button>
        </div>
      )}
    </div>
  );
};

export default Simulator;

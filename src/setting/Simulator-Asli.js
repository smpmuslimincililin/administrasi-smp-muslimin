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

const Simulator = ({
  schoolStats,
  studentsByClass,
  yearTransition,
  config,
  loading,
  onSimulate,
  simulationResult,
  onCloseSimulation,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [showDetails, setShowDetails] = useState({});

  // KONFIGURASI DINAMIS - FLEKSIBEL SESUAI KEBUTUHAN
  const SCHOOL_CONFIG = {
    // RENTANG IDEAL SISWA PER KELAS (BUKAN FIXED!)
    capacityRange: {
      minimum: 20, // Minimal agar kelas feasible
      comfortable: 30, // Jumlah nyaman untuk belajar
      optimal: 35, // Optimal untuk pembelajaran
      high: 40, // Tinggi tapi masih manageable
      maximum: 45, // Maksimal sebelum terlalu padat
    },
    // PARALEL KELAS YANG TERSEDIA (DINAMIS)
    availableClassLetters: [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
    ],
    maxParallelClasses: 12, // Maksimal paralel yang bisa dibuat
  };

  // HITUNG BERAPA KELAS DIBUTUHKAN BERDASARKAN JUMLAH SISWA
  const calculateRequiredClasses = (totalStudents, grade) => {
    const { minimum, comfortable, optimal } = SCHOOL_CONFIG.capacityRange;

    let targetPerClass;

    // STRATEGI BERBEDA PER GRADE
    switch (grade) {
      case "7": // Kelas baru, prioritaskan kenyamanan
        targetPerClass = comfortable; // 30 siswa/kelas
        break;
      case "8": // Kelas menengah, bisa lebih padat
        targetPerClass = optimal; // 35 siswa/kelas
        break;
      case "9": // Kelas akhir, optimal
        targetPerClass = optimal; // 35 siswa/kelas
        break;
      default:
        targetPerClass = optimal;
    }

    // HITUNG KELAS DIBUTUHKAN
    const classesNeeded = Math.ceil(totalStudents / targetPerClass);

    // PASTI MINIMAL 1 KELAS
    const minClasses = Math.max(1, classesNeeded);

    // JANGAN LEBIH DARI MAKSIMAL PARALEL
    return Math.min(minClasses, SCHOOL_CONFIG.maxParallelClasses);
  };

  // DISTRIBUSI SISWA KE KELAS SECARA MERATA
  const distributeStudentsEvenly = (students, grade, classCount) => {
    const distribution = {};
    const classLetters = SCHOOL_CONFIG.availableClassLetters.slice(
      0,
      classCount
    );

    // INISIALISASI KELAS
    classLetters.forEach((letter) => {
      distribution[`${grade}${letter}`] = [];
    });

    if (students.length === 0) return distribution;

    // DISTRIBUSI ROUND-ROBIN
    students.forEach((student, index) => {
      const classIndex = index % classCount;
      const classLetter = classLetters[classIndex];
      distribution[`${grade}${classLetter}`].push(student);
    });

    return distribution;
  };

  // ANALISA KELAS EXISTING (UNTUK KELAS 8 & 9)
  const analyzeExistingClassStructure = () => {
    const classStructure = {};

    Object.entries(studentsByClass).forEach(([classId, classData]) => {
      const grade = String(classData.grade);
      if (!classStructure[grade]) {
        classStructure[grade] = {};
      }

      // SIMPAN STRUKTUR KELAS EXISTING
      classStructure[grade][classId] = {
        studentCount: classData.students.length,
        students: classData.students,
      };
    });

    return classStructure;
  };

  // SIMULASI TRANSIKSI DINAMIS
  const handleSimulate = async () => {
    if (!yearTransition?.preview) {
      alert("Generate preview transisi terlebih dahulu!");
      return;
    }

    setIsSimulating(true);

    try {
      const { preview } = yearTransition;

      // ✅ 1️⃣ ANALISA SISWA BARU (DARI PREVIEW!)
      const newStudentDistribution = preview.newStudentDistribution || {};
      const newStudents = preview.newStudents || [];

      // Hitung total per kelas 7
      const grade7Classes = Object.keys(newStudentDistribution);
      const grade7Total = Object.values(newStudentDistribution).reduce(
        (sum, arr) => sum + arr.length,
        0
      );

      // ✅ 2️⃣ ANALISA PROMOTIONS (SISWA NAIK KELAS)
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
      const grade8Total = Object.values(grade8Classes).reduce(
        (a, b) => a + b,
        0
      );
      const grade9Total = Object.values(grade9Classes).reduce(
        (a, b) => a + b,
        0
      );

      const grade8ClassCount = Object.keys(grade8Classes).length;
      const grade9ClassCount = Object.keys(grade9Classes).length;

      // ✅ 3️⃣ BUAT DISTRIBUSI FINAL
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

      // ✅ 4️⃣ HITUNG STATISTIK
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

      // ✅ 5️⃣ REKOMENDASI
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

      // ✅ 6️⃣ HASIL SIMULASI
      const simulationData = {
        timestamp: new Date().toISOString(),
        summary: {
          totalPromoted,
          totalNewStudents,
          totalGraduated,
          totalActiveBefore: schoolStats.total_students,
          totalActiveAfter,
          netChange: totalActiveAfter - schoolStats.total_students,
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

      if (onSimulate) {
        onSimulate(simulationData);
      }
    } catch (error) {
      console.error("Error in simulation:", error);
      alert("Error saat simulasi: " + error.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // RENDER HASIL SIMULASI
  const renderSimulationResult = () => {
    if (!simulationResult) return null;

    // REVISI 1: Beri nilai default objek kosong untuk classStructure
    const {
      summary,
      classStructure = {}, // <-- REVISI DITAMBAHKAN DI SINI
      classDistribution,
      warnings,
      insights,
      recommendations,
      isValid,
    } = simulationResult;

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
                {new Date(simulationResult.timestamp).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full ${
              isValid
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
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
            Struktur Kelas untuk {simulationResult.academicYearChange.to}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["grade7", "grade8", "grade9"].map((gradeKey, index) => {
              const grade = gradeKey.replace("grade", "");
              // REVISI 2: Beri nilai default objek kosong jika properti tidak ada
              const data = classStructure[gradeKey] || {}; // <-- REVISI DITAMBAHKAN DI SINI

              // Tambahan Defensive Check: Jika 'data' kosong, skip render.
              if (Object.keys(data).length === 0) {
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
                    <span className="font-bold text-gray-800">
                      Kelas {grade}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        statusColors[data.status] || "bg-gray-100"
                      }`}>
                      {data.classes} Paralel
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Siswa</span>
                      <span className="font-semibold">{data.students}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Rata² per Kelas
                      </span>
                      <span className="font-semibold">
                        {data.avgPerClass} siswa
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span
                        className={`text-xs font-medium ${
                          data.status === "high"
                            ? "text-orange-600"
                            : data.status === "low"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}>
                        {data.status === "high"
                          ? "Padat"
                          : data.status === "low"
                          ? "Sedikit"
                          : data.status === "full"
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
              Distribusi per Kelas
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
                        {cls.existingStudents} ada + {cls.newStudents} baru
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
                {classDistribution.length} kelas terdeteksi. Klik "Tampilkan
                Detail" untuk melihat distribusi lengkap.
              </p>
            </div>
          )}
        </div>

        {/* INSIGHTS & REKOMENDASI */}
        {recommendations && recommendations.length > 0 && (
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
                  ? "✅ SIMULASI VALID - Sistem siap untuk transisi"
                  : "⚠️ PERHATIAN - Ada masalah yang perlu ditinjau sebelum execute"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  isValid ? "text-green-700" : "text-red-700"
                }`}>
                {isValid
                  ? "Semua analisis menunjukkan sistem dapat melanjutkan transisi tahun ajaran."
                  : "Tinjau rekomendasi dan analisis di atas sebelum melanjutkan."}
              </p>
            </div>
          </div>
        </div>

        {/* TOMBOL AKSI */}
        <div className="flex gap-3 mt-6 pt-6 border-t">
          <button
            onClick={() => onCloseSimulation && onCloseSimulation()}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition">
            Tutup Simulasi
          </button>
        </div>
      </div>
    );
  };

  // JIKA BELUM ADA PREVIEW
  if (!yearTransition?.preview) {
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

        <div className="mt-3 bg-blue-200 rounded p-3">
          <p className="text-sm text-blue-900 font-medium">
            💡 <strong>Fitur Analisis Dinamis:</strong>
          </p>
          <ul className="text-xs text-blue-800 mt-1 space-y-1">
            <li>
              • <strong>Otomatis hitung kebutuhan paralel kelas</strong>{" "}
              berdasarkan jumlah siswa
            </li>
            <li>
              • <strong>Distribusi merata</strong> dengan round-robin algorithm
            </li>
            <li>
              • <strong>Analisis kapasitas fleksibel</strong> (tidak pakai
              aturan kaku)
            </li>
            <li>
              • <strong>Rekomendasi cerdas</strong> berdasarkan pola data aktual
            </li>
            <li>
              • <strong>100% aman</strong> - tidak mengubah database
            </li>
          </ul>
        </div>
      </div>

      {/* HASIL SIMULASI */}
      {renderSimulationResult()}
    </div>
  );
};

export default Simulator;

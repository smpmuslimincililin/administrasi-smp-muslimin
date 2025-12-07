import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Calendar,
  Eye,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  UserPlus,
  Users,
  Clock,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import Simulator from "./Simulator"; // Import simulator saja

const AcademicYearTab = ({
  user,
  loading,
  setLoading,
  showToast,
  schoolConfig,
}) => {
  const [schoolStats, setSchoolStats] = useState({
    academic_year: "2025/2026",
    total_students: 0,
  });
  const [studentsByClass, setStudentsByClass] = useState({});
  const [yearTransition, setYearTransition] = useState({
    preview: null,
    newYear: "",
    inProgress: false,
  });

  // ✅ State untuk semester
  const [semesters, setSemesters] = useState([]);
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [newSemester, setNewSemester] = useState({
    year: "",
    semester: 1,
    start_date: "",
    end_date: "",
  });

  // Default config jika schoolConfig belum loaded
  const config = {
    schoolName: schoolConfig?.schoolName || "SMP Muslimin Cililin",
    schoolLevel: schoolConfig?.schoolLevel || "SMP",
    grades: ["7", "8", "9"],
    classesPerGrade: schoolConfig?.classesPerGrade || [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ],
  };

  const graduatingGrade = config.grades[config.grades.length - 1];

  useEffect(() => {
    loadSchoolData();
    loadSemesters(); // ✅ Load semester data
  }, []);

  // ✅ Load semesters from database
  const loadSemesters = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("year", { ascending: false })
        .order("semester", { ascending: false });

      if (error) throw error;
      setSemesters(data || []);
    } catch (error) {
      console.error("Error loading semesters:", error);
      showToast("Gagal memuat data semester: " + error.message, "error");
    }
  };

  const loadSchoolData = async () => {
    try {
      setLoading(true);

      const { data: settingsData, error: settingsError } = await supabase
        .from("school_settings")
        .select("setting_key, setting_value")
        .eq("setting_key", "academic_year");

      if (settingsError) throw settingsError;

      const academicYear = settingsData?.[0]?.setting_value || "2025/2026";

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(
          `
        id, 
        nis, 
        full_name, 
        gender, 
        class_id, 
        is_active,
        academic_year,
        classes (
          id,
          grade,
          academic_year
        )
      `
        )
        .eq("is_active", true)
        .eq("academic_year", academicYear)
        .order("full_name");

      if (studentsError) throw studentsError;

      const studentsByClass = {};

      studentsData?.forEach((student) => {
        const classId = student.class_id;
        const grade = student.classes?.grade;

        if (classId && grade !== null && grade !== undefined) {
          if (!studentsByClass[classId]) {
            studentsByClass[classId] = {
              grade: grade,
              students: [],
            };
          }
          studentsByClass[classId].students.push(student);
        }
      });

      setStudentsByClass(studentsByClass);
      setSchoolStats({
        academic_year: academicYear,
        total_students: studentsData?.length || 0,
      });
    } catch (error) {
      console.error("Error loading school data:", error);
      showToast("Gagal memuat data sekolah: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add new semester
  const handleAddSemester = async () => {
    if (!newSemester.year || !newSemester.start_date || !newSemester.end_date) {
      showToast("Semua field harus diisi!", "error");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("academic_years")
        .insert([
          {
            year: newSemester.year,
            semester: parseInt(newSemester.semester),
            start_date: newSemester.start_date,
            end_date: newSemester.end_date,
            is_active: false, // Default nonaktif dulu
          },
        ])
        .select();

      if (error) throw error;

      showToast("✅ Semester berhasil ditambahkan!", "success");
      setShowAddSemester(false);
      setNewSemester({
        year: "",
        semester: 1,
        start_date: "",
        end_date: "",
      });
      loadSemesters();
    } catch (error) {
      console.error("Error adding semester:", error);
      showToast("Gagal menambahkan semester: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Activate semester (nonaktifkan yang lain)
  const handleActivateSemester = async (semesterId) => {
    const confirmed = window.confirm(
      "Aktifkan semester ini?\n\nSemester yang sedang aktif akan dinonaktifkan."
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      // 1. Nonaktifkan semua semester
      const { error: deactivateError } = await supabase
        .from("academic_years")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all

      if (deactivateError) throw deactivateError;

      // 2. Aktifkan semester yang dipilih
      const { error: activateError } = await supabase
        .from("academic_years")
        .update({ is_active: true })
        .eq("id", semesterId);

      if (activateError) throw activateError;

      showToast("✅ Semester berhasil diaktifkan!", "success");
      loadSemesters();
    } catch (error) {
      console.error("Error activating semester:", error);
      showToast("Gagal mengaktifkan semester: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete semester
  const handleDeleteSemester = async (semesterId, isActive) => {
    if (isActive) {
      showToast("❌ Tidak bisa menghapus semester yang sedang aktif!", "error");
      return;
    }

    const confirmed = window.confirm(
      "Hapus semester ini?\n\nTindakan ini tidak dapat dibatalkan."
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("academic_years")
        .delete()
        .eq("id", semesterId);

      if (error) throw error;

      showToast("✅ Semester berhasil dihapus!", "success");
      loadSemesters();
    } catch (error) {
      console.error("Error deleting semester:", error);
      showToast("Gagal menghapus semester: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getStudentsByGrade = () => {
    const byGrade = { 7: 0, 8: 0, 9: 0 };

    Object.entries(studentsByClass).forEach(([classId, classData]) => {
      const grade = String(classData.grade);

      if (grade === "7" || grade === "8" || grade === "9") {
        byGrade[grade] += classData.students.length;
      }
    });

    return byGrade;
  };

  const generateYearTransitionPreview = async () => {
    try {
      setLoading(true);

      const currentYear = schoolStats.academic_year;
      const [startYear] = currentYear.split("/");
      const newYear = `${parseInt(startYear) + 1}/${parseInt(startYear) + 2}`;

      const promotionPlan = {};
      const graduatingStudents = [];

      Object.entries(studentsByClass).forEach(([classId, classData]) => {
        const { grade, students } = classData;

        if (grade == graduatingGrade) {
          graduatingStudents.push(...students);
        } else {
          const currentIndex = config.grades.indexOf(grade.toString());
          if (currentIndex < config.grades.length - 1) {
            const nextGrade = config.grades[currentIndex + 1];
            const classLetter = classId.replace(/[0-9]/g, "");
            const newClassId = `${nextGrade}${classLetter}`;

            if (!promotionPlan[newClassId]) {
              promotionPlan[newClassId] = [];
            }
            promotionPlan[newClassId].push(...students);
          }
        }
      });

      // ✅ Ambil target year dari SPMB settings
      const { data: spmb_settings } = await supabase
        .from("spmb_settings")
        .select("target_academic_year")
        .eq("is_active", true)
        .single();

      const targetYear = spmb_settings?.target_academic_year || newYear;

      console.log("🔍 Looking for siswa baru with academic_year:", targetYear);

      const { data: siswaBaruData, error: siswaBaruError } = await supabase
        .from("siswa_baru")
        .select("*")
        .eq("is_transferred", false)
        .eq("academic_year", targetYear) // ✅ Pakai targetYear dari SPMB settings
        .not("kelas", "is", null);

      if (siswaBaruError) {
        console.warn("Error loading siswa baru:", siswaBaruError);
      }

      console.log("📊 Siswa baru ditemukan:", siswaBaruData?.length || 0);

      const { data: existingStudents } = await supabase
        .from("students")
        .select("nis");

      const existingNIS = new Set(existingStudents?.map((s) => s.nis) || []);

      const validNewStudents = [];
      const conflictedNIS = [];

      siswaBaruData?.forEach((siswa) => {
        if (siswa.nisn && existingNIS.has(siswa.nisn)) {
          conflictedNIS.push({
            nama: siswa.nama_lengkap,
            nisn: siswa.nisn,
          });
        } else {
          validNewStudents.push(siswa);
        }
      });

      const newStudentDistribution = {};
      const firstGrade = config.grades[0];
      const classLetters = config.classesPerGrade || [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
      ];

      classLetters.forEach((letter) => {
        newStudentDistribution[`${firstGrade}${letter}`] = [];
      });

      validNewStudents.forEach((siswa) => {
        const kelasAsli = siswa.kelas;
        if (kelasAsli && kelasAsli.startsWith("7")) {
          if (!newStudentDistribution[kelasAsli]) {
            newStudentDistribution[kelasAsli] = [];
          }
          newStudentDistribution[kelasAsli].push(siswa);
        }
      });

      setYearTransition({
        preview: {
          currentYear,
          newYear,
          promotions: promotionPlan,
          graduating: graduatingStudents,
          newStudents: validNewStudents,
          newStudentDistribution: newStudentDistribution,
          conflictedNIS: conflictedNIS,
        },
        newYear,
        inProgress: false,
      });

      if (conflictedNIS.length > 0) {
        showToast(
          `⚠️ ${conflictedNIS.length} siswa baru memiliki NIS yang sudah terdaftar!`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      showToast("Error generating preview: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const createNewClasses = async (newYear) => {
    const classesToCreate = [];
    const classLetters = config.classesPerGrade || [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ];

    for (const grade of config.grades) {
      for (const letter of classLetters) {
        classesToCreate.push({
          id: `${grade}${letter}`,
          grade: parseInt(grade),
          academic_year: newYear,
        });
      }
    }

    const { data, error } = await supabase
      .from("classes")
      .insert(classesToCreate)
      .select();

    if (error) throw error;
    return data;
  };

  // ============================================
  // REVISED executeYearTransition Function
  // Replace your existing function (line ~415-600)
  // ============================================

  const executeYearTransition = async () => {
    // ✅ NEW: VALIDATION - Check if target year exists
    const { data: targetYearData, error: checkError } = await supabase
      .from("academic_years")
      .select("id, year, semester")
      .eq("year", yearTransition.newYear)
      .eq("semester", 1)
      .single();

    if (checkError || !targetYearData) {
      showToast(
        `❌ VALIDASI GAGAL!\n\n` +
          `Tahun ajaran ${yearTransition.newYear} Semester 1 belum dibuat!\n\n` +
          `Silakan buat semester terlebih dahulu di bagian "Manajemen Semester".\n\n` +
          `Langkah:\n` +
          `1. Klik "Tambah Semester"\n` +
          `2. Input: ${yearTransition.newYear}, Semester 1\n` +
          `3. Tanggal: Juli - Desember ${
            yearTransition.newYear.split("/")[0]
          }\n` +
          `4. Ulangi untuk Semester 2 (Januari - Juni ${
            yearTransition.newYear.split("/")[1]
          })`,
        "error"
      );
      return;
    }

    console.log("✅ Validation passed: Target year exists", targetYearData);

    const { preview } = yearTransition;

    // ✅ RE-FETCH data terbaru untuk summary akurat
    const { data: latestSiswaBaruData } = await supabase
      .from("siswa_baru")
      .select("id", { count: "exact" })
      .eq("is_transferred", false)
      .eq("academic_year", yearTransition.newYear)
      .not("kelas", "is", null);

    const latestSiswaBaruCount = latestSiswaBaruData?.length || 0;
    const previewSiswaBaruCount = preview.newStudents.length;

    const totalPromotions = Object.values(preview.promotions).flat().length;

    // ✅ Warning kalo data berubah
    let warningMessage = "";
    if (latestSiswaBaruCount !== previewSiswaBaruCount) {
      warningMessage = `\n⚠️ PERHATIAN: Data siswa baru berubah!\n   Preview: ${previewSiswaBaruCount} siswa → Sekarang: ${latestSiswaBaruCount} siswa\n`;
    }

    const confirmed = window.confirm(
      `PERINGATAN: Tindakan ini akan:\n\n` +
        `1. Membuat 18 kelas baru untuk tahun ajaran ${yearTransition.newYear}\n` +
        `2. Menaikkan ${totalPromotions} siswa ke kelas berikutnya\n` +
        `3. Memasukkan ${latestSiswaBaruCount} siswa baru ke grade 7\n` +
        `4. Meluluskan ${preview.graduating.length} siswa grade ${graduatingGrade}\n` +
        `5. Mereset assignment guru\n` +
        `6. Mengubah tahun ajaran menjadi ${yearTransition.newYear}\n` +
        warningMessage +
        `\nTindakan ini TIDAK DAPAT DIBATALKAN. Apakah Anda yakin?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setYearTransition((prev) => ({ ...prev, inProgress: true }));

      showToast("Membuat 18 kelas baru...", "info");
      const newClasses = await createNewClasses(yearTransition.newYear);

      if (preview.graduating.length > 0) {
        showToast(`Meluluskan ${preview.graduating.length} siswa...`, "info");
        const graduatingIds = preview.graduating.map((s) => s.id);

        const { error: graduateError } = await supabase
          .from("students")
          .update({ is_active: false })
          .in("id", graduatingIds);

        if (graduateError) throw graduateError;
      }

      for (const [newClassId, students] of Object.entries(preview.promotions)) {
        showToast(
          `Menaikkan ${students.length} siswa ke kelas ${newClassId}...`,
          "info"
        );

        const studentIds = students.map((s) => s.id);

        const { error: promoteError } = await supabase
          .from("students")
          .update({
            class_id: newClassId,
            academic_year: yearTransition.newYear,
          })
          .in("id", studentIds);

        if (promoteError) throw promoteError;
      }

      if (preview.newStudents.length > 0) {
        // ✅ RE-FETCH data terbaru dari database (bukan pakai preview lama)
        const { data: latestSiswaBaruData, error: fetchError } = await supabase
          .from("siswa_baru")
          .select("*")
          .eq("is_transferred", false)
          .eq("academic_year", yearTransition.newYear)
          .not("kelas", "is", null);

        if (fetchError) throw fetchError;

        const totalLatest = latestSiswaBaruData?.length || 0;
        const totalPreview = preview.newStudents.length;

        // ✅ Warning kalo data berubah, tapi tetep lanjut
        if (totalLatest !== totalPreview) {
          console.warn(
            `⚠️ Data siswa baru berubah: Preview ${totalPreview} → Sekarang ${totalLatest}`
          );
          showToast(
            `ℹ️ Data siswa baru diupdate: ${totalLatest} siswa akan dimasukkan`,
            "info"
          );
        }

        if (latestSiswaBaruData && latestSiswaBaruData.length > 0) {
          showToast(
            `Memasukkan ${latestSiswaBaruData.length} siswa baru...`,
            "info"
          );

          // ✅ Group by kelas (sesuai assignment di SPMB)
          const distributionByClass = {};

          latestSiswaBaruData.forEach((siswa) => {
            const kelas = siswa.kelas;
            if (!distributionByClass[kelas]) {
              distributionByClass[kelas] = [];
            }
            distributionByClass[kelas].push(siswa);
          });

          // ✅ Insert per kelas
          for (const [classId, siswaList] of Object.entries(
            distributionByClass
          )) {
            if (siswaList.length === 0) continue;

            const newStudentsData = siswaList.map((siswa) => ({
              nis: siswa.nisn || null,
              full_name: siswa.nama_lengkap,
              gender: siswa.jenis_kelamin,
              class_id: classId,
              academic_year: yearTransition.newYear,
              is_active: true,
            }));

            const { error: insertError } = await supabase
              .from("students")
              .insert(newStudentsData);

            if (insertError) throw insertError;
          }

          // ✅ Update status di siswa_baru
          const siswaBaruIds = latestSiswaBaruData.map((s) => s.id);

          const { error: updateSiswaBaruError } = await supabase
            .from("siswa_baru")
            .update({
              is_transferred: true,
              transferred_at: new Date().toISOString(),
              transferred_by: user?.id || null,
            })
            .in("id", siswaBaruIds);

          if (updateSiswaBaruError) throw updateSiswaBaruError;
        }
      }

      showToast("Mereset assignment guru...", "info");
      const { error: teacherResetError } = await supabase
        .from("teacher_assignments")
        .delete()
        .eq("academic_year", schoolStats.academic_year);

      if (teacherResetError) throw teacherResetError;

      // ✅ NEW: SYNC academic_years.is_active
      showToast("Mengupdate status semester...", "info");

      // 1. Deactivate all semesters with old year
      const { error: deactivateError } = await supabase
        .from("academic_years")
        .update({ is_active: false })
        .eq("year", schoolStats.academic_year);

      if (deactivateError) {
        console.error("Error deactivating old year:", deactivateError);
        // Continue anyway (non-critical)
      }

      // 2. Activate new year Semester 1
      const { error: activateError } = await supabase
        .from("academic_years")
        .update({ is_active: true })
        .eq("id", targetYearData.id);

      if (activateError) {
        console.error("Error activating new year:", activateError);
        // Continue anyway (non-critical)
      }

      console.log("✅ Semester sync completed");

      // ✅ EXISTING: Update school_settings
      const { error: settingError } = await supabase
        .from("school_settings")
        .update({ setting_value: yearTransition.newYear })
        .eq("setting_key", "academic_year");

      if (settingError) throw settingError;

      setSchoolStats((prev) => ({
        ...prev,
        academic_year: yearTransition.newYear,
      }));

      showToast(
        `✅ Tahun ajaran ${yearTransition.newYear} berhasil dimulai!\n\n` +
          `📊 ${latestSiswaBaruCount} siswa baru masuk grade 7\n` +
          `⬆️ ${totalPromotions} siswa naik kelas\n` +
          `🎓 ${preview.graduating.length} siswa lulus\n` +
          `👨‍🏫 Silakan assign guru ke kelas baru`,
        "success"
      );

      await loadSchoolData();
      await loadSemesters(); // ✅ NEW: Reload semester list to show updated status
      setYearTransition({ preview: null, newYear: "", inProgress: false });
    } catch (error) {
      console.error("Error executing year transition:", error);
      showToast("Error memulai tahun ajaran baru: " + error.message, "error");
    } finally {
      setLoading(false);
      setYearTransition((prev) => ({ ...prev, inProgress: false }));
    }
  };

  const studentsByGrade = getStudentsByGrade();
  const activeSemester = semesters.find((s) => s.is_active);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Manajemen Tahun Ajaran
            </h2>
            <p className="text-gray-600 text-sm">
              {config.schoolName} - {config.schoolLevel}
            </p>
          </div>
        </div>
      </div>

      {/* Current Academic Year */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg mb-8 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-blue-600" size={20} />
              <h3 className="text-sm font-medium text-blue-800">
                Tahun Ajaran Aktif
              </h3>
            </div>
            <p className="text-3xl font-bold text-blue-900 mb-1">
              {schoolStats.academic_year}
            </p>
            <p className="text-blue-700 text-sm">
              <span className="font-semibold">
                {schoolStats.total_students}
              </span>{" "}
              siswa aktif dalam{" "}
              <span className="font-semibold">
                {Object.keys(studentsByClass).length}
              </span>{" "}
              kelas
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Total Kelas</p>
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(studentsByClass).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Semester Management Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="text-purple-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">
                Manajemen Semester
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Kelola semester dalam tahun ajaran aktif
            </p>
          </div>

          <button
            onClick={() => setShowAddSemester(!showAddSemester)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            <Plus size={16} />
            Tambah Semester
          </button>
        </div>

        {/* Active Semester Highlight */}
        {activeSemester && (
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg mb-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <PlayCircle className="text-purple-600" size={24} />
              <div>
                <p className="text-sm text-purple-700 font-medium">
                  Semester Aktif Sekarang
                </p>
                <p className="text-lg font-bold text-purple-900">
                  {activeSemester.year} - Semester {activeSemester.semester}
                </p>
                <p className="text-xs text-purple-600">
                  {new Date(activeSemester.start_date).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}{" "}
                  s/d{" "}
                  {new Date(activeSemester.end_date).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Semester Form */}
        {showAddSemester && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">
              Tambah Semester Baru
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  placeholder="2025/2026"
                  value={newSemester.year}
                  onChange={(e) =>
                    setNewSemester({ ...newSemester, year: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  value={newSemester.semester}
                  onChange={(e) =>
                    setNewSemester({
                      ...newSemester,
                      semester: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={newSemester.start_date}
                  onChange={(e) =>
                    setNewSemester({
                      ...newSemester,
                      start_date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={newSemester.end_date}
                  onChange={(e) =>
                    setNewSemester({ ...newSemester, end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddSemester}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium transition">
                Simpan Semester
              </button>
              <button
                onClick={() => {
                  setShowAddSemester(false);
                  setNewSemester({
                    year: "",
                    semester: 1,
                    start_date: "",
                    end_date: "",
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition">
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Semester List */}
        <div className="space-y-3">
          {semesters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock size={48} className="mx-auto mb-3 opacity-50" />
              <p>Belum ada data semester</p>
              <p className="text-sm">Klik "Tambah Semester" untuk memulai</p>
            </div>
          ) : (
            semesters.map((semester) => (
              <div
                key={semester.id}
                className={`p-4 rounded-lg border-2 transition ${
                  semester.is_active
                    ? "bg-purple-50 border-purple-300"
                    : "bg-white border-gray-200"
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {semester.is_active ? (
                      <PlayCircle className="text-purple-600" size={20} />
                    ) : (
                      <PauseCircle className="text-gray-400" size={20} />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">
                          {semester.year} - Semester {semester.semester}
                        </span>
                        {semester.is_active && (
                          <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-medium">
                            AKTIF
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(semester.start_date).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}{" "}
                        -{" "}
                        {new Date(semester.end_date).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!semester.is_active && (
                      <button
                        onClick={() => handleActivateSemester(semester.id)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 transition">
                        Aktifkan
                      </button>
                    )}
                    {!semester.is_active && (
                      <button
                        onClick={() =>
                          handleDeleteSemester(semester.id, semester.is_active)
                        }
                        disabled={loading}
                        className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 disabled:opacity-50 transition">
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Students by Grade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {["7", "8", "9"].map((grade) => {
          const totalStudents = studentsByGrade[grade] || 0;

          return (
            <div
              key={grade}
              className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">Kelas {grade}</h4>
                <span className="text-2xl font-bold text-blue-600">
                  {totalStudents}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {totalStudents === 0
                  ? "Belum ada siswa"
                  : `${totalStudents} siswa aktif`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Year Transition */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Transisi Tahun Ajaran
            </h3>
            <p className="text-gray-600 text-sm">
              Kelola Perpindahan Ke Tahun Ajaran Berikutnya (Termasuk Siswa Baru
              Dari SPMB)
            </p>
          </div>

          {!yearTransition.preview && (
            <div className="flex gap-3">
              <button
                onClick={generateYearTransitionPreview}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                <Eye size={16} />
                Preview Naik Kelas
              </button>
            </div>
          )}
        </div>

        {/* 🟢🟢🟢 SIMULATOR PREVIEW OTOMATIS 🟢🟢🟢 */}
        {yearTransition.preview && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <h4 className="font-semibold text-gray-800 text-lg">
                  Preview Transisi Tahun Ajaran
                </h4>
                <p className="text-sm text-gray-600">
                  {yearTransition.preview.currentYear} →{" "}
                  {yearTransition.preview.newYear}
                </p>
              </div>
            </div>

            {/* NIS CONFLICT WARNING */}
            {yearTransition.preview.conflictedNIS?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className="text-red-600 flex-shrink-0 mt-0.5"
                    size={16}
                  />
                  <div className="flex-1">
                    <p className="text-red-800 font-medium mb-2">
                      ⚠️ Konflik NIS Terdeteksi!
                    </p>
                    <p className="text-red-700 text-sm mb-2">
                      {yearTransition.preview.conflictedNIS.length} siswa baru
                      memiliki NIS yang sudah terdaftar:
                    </p>
                    <ul className="text-red-700 text-sm space-y-1 list-disc list-inside max-h-32 overflow-y-auto">
                      {yearTransition.preview.conflictedNIS.map((item, idx) => (
                        <li key={idx}>
                          {item.nama} (NIS: {item.nisn})
                        </li>
                      ))}
                    </ul>
                    <p className="text-red-600 text-xs mt-2 font-medium">
                      Siswa ini TIDAK akan dimasukkan ke sistem. Perbaiki NIS di
                      SPMB terlebih dahulu!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATOR PREVIEW AUTO-SHOW */}
            <Simulator
              mode="preview" // ✅ MODE PREVIEW = AUTO SHOW HASIL
              preview={yearTransition.preview}
              schoolStats={schoolStats}
              config={config}
              loading={loading}
              onSimulate={() => {}} // Kosong karena mode preview tidak perlu callback
            />

            {/* Execute Button */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="text-yellow-600 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="flex-1">
                  <p className="text-yellow-900 font-semibold mb-2">
                    ⚠️ Peringatan: Tindakan Permanen
                  </p>
                  <ul className="text-yellow-800 text-sm space-y-1 mb-4 list-disc list-inside">
                    <li>18 kelas baru akan dibuat (7A-7F, 8A-8F, 9A-9F)</li>
                    <li>Semua siswa akan naik kelas (7→8, 8→9)</li>
                    <li>
                      {yearTransition.preview.newStudents?.length || 0} siswa
                      baru masuk kelas 7 (sesuai pembagian di SPMB)
                    </li>
                    <li>Siswa kelas {graduatingGrade} akan diluluskan</li>
                    <li>Assignment guru akan direset</li>
                    <li>
                      Tahun ajaran berubah ke {yearTransition.preview.newYear}
                    </li>
                  </ul>

                  <div className="flex gap-3">
                    <button
                      onClick={executeYearTransition}
                      disabled={loading || yearTransition.inProgress}
                      className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold transition">
                      {yearTransition.inProgress ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Mulai Tahun Ajaran Baru
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setYearTransition({
                          preview: null,
                          newYear: "",
                          inProgress: false,
                        });
                      }}
                      disabled={yearTransition.inProgress}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 font-medium transition">
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicYearTab;

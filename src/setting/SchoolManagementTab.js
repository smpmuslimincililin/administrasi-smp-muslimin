// SchoolManagementTab.js - REVISI LENGKAP ✅
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  Plus,
  Users,
  UserCheck,
  BookOpen,
  Edit3,
  Trash2,
  CheckSquare,
  X,
  Search,
  Filter,
  Eye, // ✅ TAMBAH UNTUK TOGGLE PASSWORD
  EyeOff, // ✅ TAMBAH UNTUK TOGGLE PASSWORD
} from "lucide-react";

// ✅ FUNGSI GENERATE TEACHER_ID SEQUENTIAL
const generateNextTeacherId = async () => {
  try {
    // Ambil semua teacher_id yang ada
    const { data: users, error } = await supabase
      .from("users")
      .select("teacher_id")
      .not("teacher_id", "is", null)
      .like("teacher_id", "G-%");

    if (error) throw error;

    // Extract angka dari teacher_id (G-17 → 17)
    const teacherNumbers = users
      .map((user) => {
        const match = user.teacher_id?.match(/G-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => !isNaN(num) && num > 0);

    // Cari angka tertinggi
    const maxNumber =
      teacherNumbers.length > 0 ? Math.max(...teacherNumbers) : 0;

    // Generate berikutnya
    const nextNumber = maxNumber + 1;
    return `G-${nextNumber.toString().padStart(2, "0")}`;
  } catch (error) {
    console.error("❌ Error generating teacher_id:", error);
    const timestamp = Date.now().toString().slice(-4);
    return `G-${timestamp}`;
  }
};

// ✅ OPTIMIZED MODAL COMPONENTS dengan React.memo
const TeacherModal = React.memo(
  ({
    modal,
    setModal,
    form,
    setForm,
    loading,
    availableClasses,
    onSubmit,
    onCancel,
  }) => {
    const firstInputRef = React.useRef(null);
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
      if (modal.show && firstInputRef.current) {
        setTimeout(() => {
          firstInputRef.current?.focus();
        }, 100);
      }
    }, [modal.show]);

    const handleFullNameChange = useCallback(
      (e) => {
        setForm((prev) => ({ ...prev, full_name: e.target.value }));
      },
      [setForm]
    );

    const handleUsernameChange = useCallback(
      (e) => {
        setForm((prev) => ({ ...prev, username: e.target.value }));
      },
      [setForm]
    );

    const handlePasswordChange = useCallback(
      (e) => {
        setForm((prev) => ({ ...prev, password: e.target.value }));
      },
      [setForm]
    );

    const handleRoleChange = useCallback(
      (e) => {
        setForm((prev) => ({ ...prev, role: e.target.value }));
      },
      [setForm]
    );

    const handleKelasChange = useCallback(
      (e) => {
        setForm((prev) => ({ ...prev, kelas: e.target.value }));
      },
      [setForm]
    );

    const togglePasswordVisibility = useCallback(() => {
      setShowPassword((prev) => !prev);
    }, []);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <UserCheck size={24} />
              <div>
                <h2 className="text-xl font-bold">
                  {modal.mode === "add" ? "Tambah Guru" : "Edit Guru"}
                </h2>
                <p className="text-blue-100 text-sm">SMP Muslimin Cililin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 hover:bg-blue-600 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap *
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={form.full_name}
                onChange={handleFullNameChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={form.username}
                onChange={handleUsernameChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                placeholder="Masukkan username"
                required
              />
            </div>

            {modal.mode === "add" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    title={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={form.role}
                onChange={handleRoleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                required>
                <option value="teacher">Guru Mata Pelajaran</option>
                <option value="guru_bk">Guru BK</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelas Diampu (Wali Kelas)
              </label>
              <select
                value={form.kelas}
                onChange={handleKelasChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors">
                <option value="">Pilih Kelas (Opsional)</option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Kelas {cls.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onSubmit}
                disabled={
                  loading ||
                  !form.full_name ||
                  !form.username ||
                  (modal.mode === "add" && !form.password)
                }
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors">
                {loading
                  ? "Menyimpan..."
                  : modal.mode === "add"
                  ? "Tambah Guru"
                  : "Update Guru"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors">
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

const StudentModal = React.memo(
  ({
    modal,
    setModal,
    form,
    setForm,
    loading,
    availableClasses,
    onSubmit,
    onCancel,
  }) => {
    const firstInputRef = React.useRef(null);

    React.useEffect(() => {
      if (modal.show && firstInputRef.current) {
        setTimeout(() => {
          firstInputRef.current?.focus();
        }, 100);
      }
    }, [modal.show]);

    const handleNisChange = useCallback(
      (e) => {
        setForm((prev) => ({ ...prev, nis: e.target.value }));
      },
      [setForm]
    );

    const handleFullNameChange = useCallback(
      (e) => {
        setForm((prev) => ({ ...prev, full_name: e.target.value }));
      },
      [setForm]
    );

    const handleGenderChange = useCallback(
      (e) => {
        setForm((prev) => ({ ...prev, gender: e.target.value }));
      },
      [setForm]
    );

    const handleClassChange = useCallback(
      (e) => {
        setForm((prev) => ({ ...prev, class_id: e.target.value }));
      },
      [setForm]
    );

    const handleActiveChange = useCallback(
      (e) => {
        setForm((prev) => ({ ...prev, is_active: e.target.checked }));
      },
      [setForm]
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users size={24} />
              <div>
                <h2 className="text-xl font-bold">
                  {modal.mode === "add" ? "Tambah Siswa" : "Edit Siswa"}
                </h2>
                <p className="text-green-100 text-sm">SMP Muslimin Cililin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 hover:bg-green-600 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIS *
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={form.nis}
                onChange={handleNisChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                placeholder="Masukkan NIS siswa"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Siswa *
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={handleFullNameChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                placeholder="Masukkan nama lengkap siswa"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kelamin *
              </label>
              <select
                value={form.gender}
                onChange={handleGenderChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                required>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelas *
              </label>
              <select
                value={form.class_id}
                onChange={handleClassChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                required>
                <option value="">Pilih Kelas</option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Kelas {cls.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={handleActiveChange}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500 transition-colors"
                />
                <span className="text-sm font-medium text-gray-700">
                  Siswa Aktif
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onSubmit}
                disabled={
                  loading || !form.nis || !form.full_name || !form.class_id
                }
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors">
                {loading
                  ? "Menyimpan..."
                  : modal.mode === "add"
                  ? "Tambah Siswa"
                  : "Update Siswa"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors">
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

const DeleteConfirmModal = React.memo(
  ({ confirm, onConfirm, onCancel, loading }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-red-50 border-b border-red-200 p-6 rounded-t-xl">
          <div className="flex items-center gap-3">
            <X className="text-red-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-red-800">
                Konfirmasi Hapus
              </h2>
              <p className="text-red-600 text-sm">
                {confirm.type === "teacher" ? "Data guru" : "Data siswa"} akan
                dihapus permanen
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin menghapus{" "}
            {confirm.type === "teacher" ? "guru" : "siswa"}{" "}
            <strong>{confirm.data?.full_name}</strong>?
          </p>
          <p className="text-sm text-red-600 mb-6">
            Tindakan ini tidak dapat dibatalkan!
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">
              {loading ? "Menghapus..." : "Ya, Hapus"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50">
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
);

// ✅ MAIN COMPONENT dengan optimasi performance
const SchoolManagementTab = ({ user, loading, setLoading, showToast }) => {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsByClass, setStudentsByClass] = useState({});
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [schoolStats, setSchoolStats] = useState({
    total_students: 0,
    total_teachers: 0,
    active_siswa_baru: 0,
    siswa_baru_year: null,
  });

  const SMP_CONFIG = {
    schoolName: "SMP Muslimin Cililin",
    schoolLevel: "SMP",
    grades: ["7", "8", "9"],
    teacherRoles: ["teacher", "guru_bk", "admin"],
  };

  const [studentFilters, setStudentFilters] = useState({
    kelas: "",
    search: "",
  });

  const [teacherModal, setTeacherModal] = useState({
    show: false,
    mode: "add",
    data: null,
  });

  const [studentModal, setStudentModal] = useState({
    show: false,
    mode: "add",
    data: null,
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    type: "",
    data: null,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [teacherForm, setTeacherForm] = useState({
    username: "",
    full_name: "",
    role: "teacher", // ✅ Ganti dari "guru_mapel" jadi "teacher"
    kelas: "",
    password: "",
  });

  const [studentForm, setStudentForm] = useState({
    nis: "",
    full_name: "",
    gender: "L",
    class_id: "",
    is_active: true,
  });

  const [availableClasses, setAvailableClasses] = useState([]);

  const fetchActiveAcademicYear = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("year")
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching active academic year:", error);
        return null;
      }

      return data?.year || null;
    } catch (err) {
      console.error("Error in fetchActiveAcademicYear:", err);
      return null;
    }
  }, []);

  const loadAvailableClasses = useCallback(
    async (academicYear) => {
      try {
        const { data: classesData, error } = await supabase
          .from("classes")
          .select("id, grade, academic_year")
          .eq("academic_year", academicYear)
          .order("grade")
          .order("id");

        if (error) throw error;
        setAvailableClasses(classesData || []);
      } catch (error) {
        console.error("Error loading classes:", error);
        showToast("Error loading classes: " + error.message, "error");
      }
    },
    [showToast]
  );

  const loadSchoolData = useCallback(async () => {
    try {
      setLoading(true);

      const activeYear = await fetchActiveAcademicYear();

      if (!activeYear) {
        showToast("Tidak ada tahun ajaran aktif!", "error");
        setLoading(false);
        return;
      }

      setActiveAcademicYear(activeYear);
      await loadAvailableClasses(activeYear);

      const { data: teachersData, error: teachersError } = await supabase
        .from("users")
        .select(
          "id, username, full_name, role, homeroom_class_id, is_active, teacher_id"
        )
        .in("role", SMP_CONFIG.teacherRoles)
        .neq("teacher_id", "G-01")
        .order("full_name");

      if (teachersError) throw teachersError;

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(
          "id, nis, full_name, gender, class_id, is_active, academic_year"
        )
        .eq("is_active", true)
        .eq("academic_year", activeYear)
        .order("full_name");

      if (studentsError) throw studentsError;

      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id, grade, academic_year")
        .eq("academic_year", activeYear)
        .order("grade")
        .order("id");

      if (classesError) throw classesError;

      const teachersWithClass = (teachersData || []).map((teacher) => {
        const teacherClass = classesData.find(
          (c) => c.id === teacher.homeroom_class_id
        );
        return {
          ...teacher,
          classes: teacherClass
            ? { name: teacherClass.id, grade: teacherClass.grade }
            : null,
        };
      });

      const studentsWithClass = (studentsData || []).map((student) => {
        const studentClass = classesData.find((c) => c.id === student.class_id);
        return {
          ...student,
          classes: studentClass
            ? { name: studentClass.id, grade: studentClass.grade }
            : null,
        };
      });

      const nextYear = activeYear
        ? `${parseInt(activeYear.split("/")[0]) + 1}/${
            parseInt(activeYear.split("/")[1]) + 1
          }`
        : null;

      const { data: siswaBaru } = await supabase
        .from("siswa_baru")
        .select("id, nama_lengkap, academic_year, status")
        .eq("status", "diterima")
        .eq("academic_year", nextYear);

      const studentsByClass = {};
      studentsWithClass.forEach((student) => {
        const className = student.classes?.name || "Belum Ada Kelas";
        if (!studentsByClass[className]) {
          studentsByClass[className] = [];
        }
        studentsByClass[className].push(student);
      });

      setTeachers(teachersWithClass);
      setStudents(studentsWithClass);
      setStudentsByClass(studentsByClass);
      setSchoolStats({
        total_students: studentsWithClass.length,
        total_teachers: teachersWithClass.filter((t) => t.is_active).length,
        active_siswa_baru: siswaBaru?.length || 0,
        siswa_baru_year: nextYear,
      });
    } catch (error) {
      console.error("Error loading school data:", error);
      showToast("Error loading school data: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [fetchActiveAcademicYear, loadAvailableClasses, setLoading, showToast]);

  useEffect(() => {
    loadSchoolData();
  }, [loadSchoolData]);

  const filteredStudents = useCallback(() => {
    return students.filter((student) => {
      const matchesKelas =
        !studentFilters.kelas || student.classes?.name === studentFilters.kelas;
      const matchesSearch =
        !studentFilters.search ||
        student.full_name
          .toLowerCase()
          .includes(studentFilters.search.toLowerCase()) ||
        student.nis.toLowerCase().includes(studentFilters.search.toLowerCase());
      return matchesKelas && matchesSearch;
    });
  }, [students, studentFilters.kelas, studentFilters.search]);

  const resetFilters = useCallback(() => {
    setStudentFilters({ kelas: "", search: "" });
  }, []);

  const toggleTeacherStatus = useCallback(
    async (teacherId, currentStatus) => {
      try {
        setLoading(true);
        const newStatus = !currentStatus;
        const { error } = await supabase
          .from("users")
          .update({ is_active: newStatus })
          .eq("id", teacherId);

        if (error) throw error;
        showToast(
          `Guru ${newStatus ? "diaktifkan" : "dinonaktifkan"} berhasil!`,
          "success"
        );
        await loadSchoolData();
      } catch (error) {
        console.error("Error updating teacher status:", error);
        showToast("Error mengupdate status guru", "error");
      } finally {
        setLoading(false);
      }
    },
    [setLoading, showToast, loadSchoolData]
  );

  const updateTeacherClass = useCallback(
    async (teacherId, newClassId) => {
      try {
        setLoading(true);

        // ✅ CEK: Apakah kelas sudah punya wali kelas?
        if (newClassId) {
          const { data: existingWaliKelas, error: checkError } = await supabase
            .from("users")
            .select("id, full_name")
            .eq("homeroom_class_id", newClassId)
            .neq("id", teacherId) // Exclude guru yang sedang di-update
            .maybeSingle();

          if (checkError) throw checkError;

          // Kalau sudah ada wali kelas lain
          if (existingWaliKelas) {
            const confirm = window.confirm(
              `Kelas ${newClassId} sudah memiliki wali kelas: ${existingWaliKelas.full_name}.\n\n` +
                `Apakah Anda yakin ingin mengganti wali kelas ini?\n` +
                `(Wali kelas lama akan otomatis dilepas dari kelas ${newClassId})`
            );

            if (!confirm) {
              setLoading(false);
              return; // User cancel
            }

            // ✅ LEPAS wali kelas lama
            const { error: removeError } = await supabase
              .from("users")
              .update({ homeroom_class_id: null })
              .eq("id", existingWaliKelas.id);

            if (removeError) throw removeError;
          }
        }

        // ✅ ASSIGN wali kelas baru
        const { error } = await supabase
          .from("users")
          .update({ homeroom_class_id: newClassId || null })
          .eq("id", teacherId);

        if (error) throw error;

        showToast("Penugasan kelas guru berhasil diupdate!", "success");
        await loadSchoolData();
      } catch (error) {
        console.error("Error updating teacher class:", error);
        showToast("Error mengupdate kelas guru", "error");
      } finally {
        setLoading(false);
      }
    },
    [setLoading, showToast, loadSchoolData]
  );

  const updateStudentClass = useCallback(
    async (studentId, newClassId) => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from("students")
          .update({ class_id: newClassId || null })
          .eq("id", studentId);

        if (error) throw error;
        showToast("Kelas siswa berhasil diupdate!", "success");
        await loadSchoolData();
      } catch (error) {
        console.error("Error updating student class:", error);
        showToast("Error mengupdate kelas siswa", "error");
      } finally {
        setLoading(false);
      }
    },
    [setLoading, showToast, loadSchoolData]
  );

  const openTeacherModal = useCallback((mode = "add", teacherData = null) => {
    if (mode === "edit" && teacherData) {
      setTeacherForm({
        username: teacherData.username || "",
        full_name: teacherData.full_name || "",
        role: teacherData.role || "teacher",
        kelas: teacherData.homeroom_class_id || "",
        password: "",
      });
    } else {
      setTeacherForm({
        username: "",
        full_name: "",
        role: "teacher",
        kelas: "",
        password: "",
      });
    }

    setTeacherModal({ show: true, mode, data: teacherData });
  }, []);

  // ✅ REVISI: handleAddTeacher dengan teacher_id sequential dan field lengkap
  const handleAddTeacher = useCallback(async () => {
    if (
      !teacherForm.username ||
      !teacherForm.full_name ||
      !teacherForm.password
    ) {
      showToast("Username, nama lengkap, dan password harus diisi!", "error");
      return;
    }

    try {
      setLoading(true);

      const teacher_id = await generateNextTeacherId();
      console.log("🔢 Generated teacher_id:", teacher_id);

      // Di SchoolManagementTab.js, sekitar line 255
      const teacherData = {
        username: teacherForm.username,
        password: teacherForm.password,
        full_name: teacherForm.full_name.toUpperCase(),
        role: "teacher",
        teacher_id: teacher_id,
        homeroom_class_id: teacherForm.kelas || null,
        no_hp: "",
        is_active: true,
      };

      console.log("📤 Inserting teacher data:", teacherData);

      const { data, error } = await supabase
        .from("users")
        .insert([teacherData])
        .select();

      if (error) {
        console.error("❌ Supabase error details:", error);

        if (error.code === "23505" && error.message.includes("username")) {
          showToast("Username sudah digunakan! Coba username lain.", "error");
          return;
        }

        if (error.code === "23505" && error.message.includes("teacher_id")) {
          const fallbackId = `G-${Math.floor(Math.random() * 900 + 100)}`;
          teacherData.teacher_id = fallbackId;

          const { error: retryError } = await supabase
            .from("users")
            .insert([teacherData]);

          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      console.log("✅ Teacher added successfully:", data);

      showToast(
        `Guru berhasil ditambahkan dengan ID: ${teacher_id}`,
        "success"
      );
      setTeacherModal({ show: false, mode: "add", data: null });
      setTeacherForm({
        username: "",
        full_name: "",
        role: "teacher", // ✅ Ganti dari "guru_mapel" jadi "teacher"
        kelas: "",
        password: "",
      });
      await loadSchoolData();
    } catch (error) {
      console.error("❌ Error adding teacher:", error);

      if (error.code) {
        showToast(`Error ${error.code}: ${error.message}`, "error");
      } else if (error.details) {
        showToast(`Error: ${error.details}`, "error");
      } else {
        showToast("Error menambah guru: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [teacherForm, setLoading, showToast, loadSchoolData]);

  // ✅ REVISI: handleEditTeacher dengan data lengkap
  const handleEditTeacher = useCallback(async () => {
    if (!teacherForm.username || !teacherForm.full_name) {
      showToast("Username dan nama lengkap harus diisi!", "error");
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        username: teacherForm.username.trim(),
        full_name: teacherForm.full_name.trim(),
        role: teacherForm.role,
        homeroom_class_id: teacherForm.kelas || null,
        no_hp: "",
      };

      if (teacherForm.password && teacherForm.password.trim()) {
        updateData.password = teacherForm.password.trim();
      }

      console.log("📤 Updating teacher data:", updateData);

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", teacherModal.data.id);

      if (error) throw error;

      showToast("Guru berhasil diupdate!", "success");
      setTeacherModal({ show: false, mode: "add", data: null });
      setTeacherForm({
        username: "",
        full_name: "",
        role: "teacher",
        kelas: "",
        password: "",
      });
      await loadSchoolData();
    } catch (error) {
      console.error("❌ Error updating teacher:", error);
      showToast("Error mengupdate guru: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [teacherForm, teacherModal.data, setLoading, showToast, loadSchoolData]);

  const handleDeleteTeacher = useCallback(
    async (teacherId) => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from("users")
          .delete()
          .eq("id", teacherId);

        if (error) throw error;

        showToast("Guru berhasil dihapus!", "success");
        setDeleteConfirm({ show: false, type: "", data: null });
        await loadSchoolData();
      } catch (error) {
        console.error("Error deleting teacher:", error);
        showToast("Error menghapus guru: " + error.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [setLoading, showToast, loadSchoolData]
  );

  const openStudentModal = useCallback((mode = "add", studentData = null) => {
    if (mode === "edit" && studentData) {
      setStudentForm({
        nis: studentData.nis,
        full_name: studentData.full_name,
        gender: studentData.gender,
        class_id: studentData.class_id || "",
        is_active: studentData.is_active,
      });
    } else {
      setStudentForm({
        nis: "",
        full_name: "",
        gender: "L",
        class_id: "",
        is_active: true,
      });
    }

    setStudentModal({ show: true, mode, data: studentData });
  }, []);

  const handleAddStudent = useCallback(async () => {
    try {
      setLoading(true);

      if (!activeAcademicYear) {
        showToast("Tahun ajaran aktif tidak ditemukan!", "error");
        return;
      }

      const { error } = await supabase.from("students").insert([
        {
          nis: studentForm.nis,
          full_name: studentForm.full_name,
          gender: studentForm.gender,
          class_id: studentForm.class_id || null,
          is_active: studentForm.is_active,
          academic_year: activeAcademicYear,
        },
      ]);

      if (error) throw error;

      showToast("Siswa berhasil ditambahkan!", "success");
      setStudentModal({ show: false, mode: "add", data: null });
      setStudentForm({
        nis: "",
        full_name: "",
        gender: "L",
        class_id: "",
        is_active: true,
      });
      await loadSchoolData();
    } catch (error) {
      console.error("Error adding student:", error);
      showToast("Error menambah siswa: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [studentForm, activeAcademicYear, setLoading, showToast, loadSchoolData]);

  const handleEditStudent = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("students")
        .update({
          nis: studentForm.nis,
          full_name: studentForm.full_name,
          gender: studentForm.gender,
          class_id: studentForm.class_id || null,
          is_active: studentForm.is_active,
        })
        .eq("id", studentModal.data.id);

      if (error) throw error;

      showToast("Siswa berhasil diupdate!", "success");
      setStudentModal({ show: false, mode: "add", data: null });
      setStudentForm({
        nis: "",
        full_name: "",
        gender: "L",
        class_id: "",
        is_active: true,
      });
      await loadSchoolData();
    } catch (error) {
      console.error("Error updating student:", error);
      showToast("Error mengupdate siswa: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [studentForm, studentModal.data, setLoading, showToast, loadSchoolData]);

  const handleDeleteStudent = useCallback(
    async (studentId) => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from("students")
          .delete()
          .eq("id", studentId);

        if (error) throw error;

        showToast("Siswa berhasil dihapus!", "success");
        setDeleteConfirm({ show: false, type: "", data: null });
        await loadSchoolData();
      } catch (error) {
        console.error("Error deleting student:", error);
        showToast("Error menghapus siswa: " + error.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [setLoading, showToast, loadSchoolData]
  );

  const uniqueClassNames = [
    ...new Set(availableClasses.map((c) => c.id)),
  ].sort();

  if (loading && !activeAcademicYear) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data sekolah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Manajemen Sekolah
            </h2>
            <p className="text-gray-600 text-sm">
              {SMP_CONFIG.schoolName} - {SMP_CONFIG.schoolLevel}
              {activeAcademicYear && (
                <span className="ml-2 text-blue-600 font-medium">
                  ({activeAcademicYear})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg bg-gray-100">
            <Plus
              size={20}
              className={`transform transition-transform ${
                mobileMenuOpen ? "rotate-45" : ""
              }`}
            />
          </button>
        </div>

        <div
          className={`flex flex-col sm:flex-row gap-2 ${
            mobileMenuOpen ? "flex" : "hidden"
          } sm:flex`}>
          <button
            onClick={() => openTeacherModal("add")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Plus size={16} />
            Tambah Guru
          </button>
          <button
            onClick={() => openStudentModal("add")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
            <Plus size={16} />
            Tambah Siswa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <div className="bg-blue-50 p-3 lg:p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-blue-600" size={18} />
            <span className="text-blue-900 font-medium text-sm lg:text-base">
              Total Siswa
            </span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-blue-600">
            {schoolStats.total_students}
          </p>
        </div>

        <div className="bg-green-50 p-3 lg:p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="text-green-600" size={18} />
            <span className="text-green-900 font-medium text-sm lg:text-base">
              Total Guru
            </span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-green-600">
            {schoolStats.total_teachers}
          </p>
        </div>

        <div className="bg-purple-50 p-3 lg:p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="text-purple-600" size={18} />
            <span className="text-purple-900 font-medium text-sm lg:text-base">
              Kelas
            </span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-purple-600">
            {Object.keys(studentsByClass).length}
          </p>
        </div>

        <div className="bg-orange-50 p-3 lg:p-4 rounded-lg relative group cursor-help">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="text-orange-600" size={18} />
            <span className="text-orange-900 font-medium text-sm lg:text-base">
              Siswa Baru
            </span>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-orange-600">
            {schoolStats.active_siswa_baru}
          </p>

          {schoolStats.siswa_baru_year && schoolStats.active_siswa_baru > 0 && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 hidden group-hover:block z-50">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg px-4 py-3 shadow-2xl whitespace-nowrap">
                <div className="font-bold text-center text-sm">
                  {schoolStats.active_siswa_baru} siswa diterima
                </div>
                <div className="text-blue-50 text-xs text-center mt-1">
                  Untuk Tahun Ajaran {schoolStats.siswa_baru_year}
                </div>
              </div>
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-green-600 mx-auto"></div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 lg:mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Management Guru
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  Nama Guru
                </th>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  Username
                </th>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  Role
                </th>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  Wali Kelas
                </th>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  Status
                </th>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  className={`hover:bg-gray-50 ${
                    !teacher.is_active ? "opacity-50 bg-gray-100" : ""
                  }`}>
                  <td className="px-3 py-2 lg:px-4 lg:py-3 text-xs lg:text-sm font-medium text-gray-800">
                    {teacher.full_name}
                  </td>
                  <td className="px-3 py-2 lg:px-4 lg:py-3 text-xs lg:text-sm text-gray-600">
                    @{teacher.username}
                  </td>
                  <td className="px-3 py-2 lg:px-4 lg:py-3">
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded capitalize">
                      {teacher.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 lg:px-4 lg:py-3 text-xs lg:text-sm text-gray-600">
                    <select
                      value={teacher.homeroom_class_id || ""}
                      onChange={(e) =>
                        updateTeacherClass(teacher.id, e.target.value || null)
                      }
                      disabled={loading || !teacher.is_active}
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                      <option value="">Pilih Kelas</option>
                      {availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          Kelas {cls.id}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 lg:px-4 lg:py-3">
                    <button
                      onClick={() =>
                        toggleTeacherStatus(teacher.id, teacher.is_active)
                      }
                      disabled={loading}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        teacher.is_active
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}>
                      {teacher.is_active ? (
                        <CheckSquare size={12} />
                      ) : (
                        <X size={12} />
                      )}
                      <span className="hidden sm:inline">
                        {teacher.is_active ? "Active" : "Inactive"}
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-2 lg:px-4 lg:py-3">
                    <div className="flex gap-1 lg:gap-2">
                      <button
                        onClick={() => openTeacherModal("edit", teacher)}
                        disabled={loading}
                        className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        title="Edit Guru">
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            show: true,
                            type: "teacher",
                            data: teacher,
                          })
                        }
                        disabled={loading}
                        className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                        title="Hapus Guru">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6 lg:mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Management Siswa
        </h3>

        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari Siswa
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentFilters.search}
                  onChange={(e) =>
                    setStudentFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Cari berdasarkan nama atau NIS..."
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Kelas
              </label>
              <select
                value={studentFilters.kelas}
                onChange={(e) =>
                  setStudentFilters((prev) => ({
                    ...prev,
                    kelas: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors">
                <option value="">Semua Kelas</option>
                {uniqueClassNames.map((className) => (
                  <option key={className} value={className}>
                    Kelas {className}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full lg:w-auto">
              <button
                onClick={resetFilters}
                className="w-full lg:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm">
                Reset Filter
              </button>
            </div>
          </div>

          {(studentFilters.kelas || studentFilters.search) && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Menampilkan {filteredStudents().length} siswa
                {studentFilters.kelas && ` dari Kelas ${studentFilters.kelas}`}
                {studentFilters.search &&
                  ` dengan pencarian "${studentFilters.search}"`}
              </p>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  NIS
                </th>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  Nama Siswa
                </th>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  Jenis Kelamin
                </th>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  Kelas
                </th>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  Status
                </th>
                <th className="px-3 py-2 lg:px-4 lg:py-3 text-left text-xs lg:text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents().length > 0 ? (
                filteredStudents().map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 lg:px-4 lg:py-3 text-xs lg:text-sm font-medium text-gray-800">
                      {student.nis}
                    </td>
                    <td className="px-3 py-2 lg:px-4 lg:py-3 text-xs lg:text-sm text-gray-800">
                      {student.full_name}
                    </td>
                    <td className="px-3 py-2 lg:px-4 lg:py-3 text-xs lg:text-sm text-gray-600">
                      {student.gender === "L" ? "Laki-laki" : "Perempuan"}
                    </td>
                    <td className="px-3 py-2 lg:px-4 lg:py-3 text-xs lg:text-sm text-gray-600">
                      <select
                        value={student.class_id || ""}
                        onChange={(e) =>
                          updateStudentClass(student.id, e.target.value || null)
                        }
                        disabled={loading}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 disabled:opacity-50">
                        <option value="">Pilih Kelas</option>
                        {availableClasses.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            Kelas {cls.id}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 lg:px-4 lg:py-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          student.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {student.is_active ? "Aktif" : "Tidak Aktif"}
                      </span>
                    </td>
                    <td className="px-3 py-2 lg:px-4 lg:py-3">
                      <div className="flex gap-1 lg:gap-2">
                        <button
                          onClick={() => openStudentModal("edit", student)}
                          disabled={loading}
                          className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          title="Edit Siswa">
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              show: true,
                              type: "student",
                              data: student,
                            })
                          }
                          disabled={loading}
                          className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Hapus Siswa">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-gray-500">
                    {students.length === 0
                      ? "Tidak ada data siswa"
                      : "Tidak ditemukan siswa yang sesuai dengan filter"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Distribusi Siswa per Kelas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
          {Object.entries(studentsByClass)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([className, students]) => (
              <div
                key={className}
                className="border border-gray-200 rounded-lg p-3 lg:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 text-sm lg:text-base">
                    Kelas {className}
                  </h4>
                  <span className="text-xs lg:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                    {students.length} siswa
                  </span>
                </div>
                <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                  {students
                    .slice(0, 5)
                    .map((s) => s.full_name)
                    .join(", ")}
                  {students.length > 5 && ` +${students.length - 5} lainnya`}
                </div>
              </div>
            ))}
        </div>
      </div>

      {teacherModal.show && (
        <TeacherModal
          modal={teacherModal}
          setModal={setTeacherModal}
          form={teacherForm}
          setForm={setTeacherForm}
          loading={loading}
          availableClasses={availableClasses}
          onSubmit={
            teacherModal.mode === "add" ? handleAddTeacher : handleEditTeacher
          }
          onCancel={() => {
            setTeacherModal({ show: false, mode: "add", data: null });
            setTeacherForm({
              username: "",
              full_name: "",
              role: "teacher", // ✅ Ganti dari "guru_mapel" jadi "teacher"
              kelas: "",
              password: "",
            });
          }}
        />
      )}

      {studentModal.show && (
        <StudentModal
          modal={studentModal}
          setModal={setStudentModal}
          form={studentForm}
          setForm={setStudentForm}
          loading={loading}
          availableClasses={availableClasses}
          onSubmit={
            studentModal.mode === "add" ? handleAddStudent : handleEditStudent
          }
          onCancel={() => {
            setStudentModal({ show: false, mode: "add", data: null });
            setStudentForm({
              nis: "",
              full_name: "",
              gender: "L",
              class_id: "",
              is_active: true,
            });
          }}
        />
      )}

      {deleteConfirm.show && (
        <DeleteConfirmModal
          confirm={deleteConfirm}
          loading={loading}
          onConfirm={() => {
            if (deleteConfirm.type === "teacher") {
              handleDeleteTeacher(deleteConfirm.data.id);
            } else {
              handleDeleteStudent(deleteConfirm.data.id);
            }
          }}
          onCancel={() =>
            setDeleteConfirm({ show: false, type: "", data: null })
          }
        />
      )}
    </div>
  );
};

export default SchoolManagementTab;

//[file name]: AdminDashboard.js - UPDATED VERSION
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalClasses: 0,
    totalStudents: 0,
    studentsByGrade: [],
  });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 🆕 UPDATED: Form data dengan field baru
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    effective_from: "",
    effective_until: "",
    target_role: "semua",
    is_active: true,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

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

      const [
        teachersResult,
        classesResult,
        studentsResult,
        gradesResult,
        announcementsResult,
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .in("role", ["teacher", "guru_bk"])
          .eq("is_active", true)
          .neq("username", "adenurmughni"),
        supabase
          .from("classes")
          .select("id", { count: "exact", head: true })
          .eq("academic_year", currentYear),
        supabase
          .from("students")
          .select("id, class_id", { count: "exact" })
          .eq("academic_year", currentYear)
          .eq("is_active", true),
        supabase
          .from("classes")
          .select("id, grade")
          .eq("academic_year", currentYear),
        // 🆕 UPDATED: Query announcements dengan field baru
        supabase
          .from("announcement")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const hasErrors = [
        teachersResult,
        classesResult,
        studentsResult,
        gradesResult,
        announcementsResult,
      ].some((result) => result.error);

      if (hasErrors) {
        console.error("Some queries failed:", {
          teachers: teachersResult.error,
          classes: classesResult.error,
          students: studentsResult.error,
          grades: gradesResult.error,
          announcements: announcementsResult.error,
        });
      }

      const gradeStats = {};
      if (studentsResult.data && gradesResult.data) {
        studentsResult.data.forEach((student) => {
          if (student?.class_id) {
            const classData = gradesResult.data.find(
              (c) => c?.id === student.class_id
            );
            if (classData?.grade) {
              const grade = classData.grade;
              gradeStats[grade] = (gradeStats[grade] || 0) + 1;
            }
          }
        });
      }

      const studentsByGrade = Object.entries(gradeStats)
        .map(([grade, count]) => ({ grade: parseInt(grade), count }))
        .sort((a, b) => a.grade - b.grade);

      setStats({
        totalTeachers: teachersResult.count || 0,
        totalClasses: classesResult.count || 0,
        totalStudents: studentsResult.count || 0,
        studentsByGrade,
      });

      setAnnouncements(announcementsResult.data || []);
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
      setError("Gagal memuat data dashboard. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 UPDATED: Create dengan field baru
  const createAnnouncement = async (data) => {
    try {
      if (!data.title?.trim() || !data.content?.trim()) {
        throw new Error("Judul dan konten tidak boleh kosong");
      }

      if (!data.effective_from || !data.effective_until) {
        throw new Error("Tanggal efektif harus diisi");
      }

      const { data: newData, error } = await supabase
        .from("announcement")
        .insert([
          {
            title: data.title.trim(),
            content: data.content.trim(),
            effective_from: data.effective_from,
            effective_until: data.effective_until,
            target_role: data.target_role,
            is_active: data.is_active,
          },
        ])
        .select("*");

      if (error) {
        console.error("Create error details:", error);
        throw new Error(`Gagal membuat pengumuman: ${error.message}`);
      }

      if (!newData || newData.length === 0) {
        throw new Error("Gagal membuat pengumuman");
      }

      const newRecord = newData[0];
      setAnnouncements((prev) => [newRecord, ...prev]);

      console.log("Create successful:", newRecord);
      return { data: newRecord, error: null };
    } catch (error) {
      console.error("Error creating announcement:", error);
      return { data: null, error };
    }
  };

  // 🆕 UPDATED: Update dengan field baru
  const updateAnnouncement = async (id, updates) => {
    try {
      if (!id) throw new Error("ID pengumuman tidak valid");
      if (!updates.title?.trim() || !updates.content?.trim()) {
        throw new Error("Judul dan konten tidak boleh kosong");
      }
      if (!updates.effective_from || !updates.effective_until) {
        throw new Error("Tanggal efektif harus diisi");
      }

      const { data, error } = await supabase
        .from("announcement")
        .update({
          title: updates.title.trim(),
          content: updates.content.trim(),
          effective_from: updates.effective_from,
          effective_until: updates.effective_until,
          target_role: updates.target_role,
          is_active: updates.is_active,
        })
        .eq("id", id)
        .select("*");

      if (error) {
        console.error("Update error details:", error);
        throw new Error(`Gagal mengupdate: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error("Pengumuman tidak ditemukan");
      }

      const updatedRecord = data[0];
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === id ? updatedRecord : item))
      );

      console.log("Update successful:", updatedRecord);
      return { data: updatedRecord, error: null };
    } catch (error) {
      console.error("Error updating announcement:", error);
      return { data: null, error };
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      if (!id) {
        throw new Error("ID pengumuman tidak valid");
      }

      if (
        !window.confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")
      ) {
        return { error: null };
      }

      const { error } = await supabase
        .from("announcement")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAnnouncements((prev) => prev.filter((item) => item?.id !== id));
      return { error: null };
    } catch (error) {
      console.error("Error deleting announcement:", error);
      throw error;
    }
  };

  // 🆕 UPDATED: Toggle active status
  const toggleActiveStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from("announcement")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_active: !currentStatus } : item
        )
      );
    } catch (error) {
      console.error("Error toggling active status:", error);
      setError("Gagal mengubah status pengumuman");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      if (editData?.id) {
        const result = await updateAnnouncement(editData.id, formData);
        if (result.data) {
          setShowAddForm(false);
          setEditData(null);
          setFormData({
            title: "",
            content: "",
            effective_from: "",
            effective_until: "",
            target_role: "semua",
            is_active: true,
          });
        } else {
          setError(result.error?.message || "Gagal mengupdate pengumuman");
        }
      } else {
        const result = await createAnnouncement(formData);
        if (result.data) {
          setShowAddForm(false);
          setFormData({
            title: "",
            content: "",
            effective_from: "",
            effective_until: "",
            target_role: "semua",
            is_active: true,
          });
        } else {
          setError(result.error?.message || "Gagal membuat pengumuman");
        }
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menyimpan pengumuman");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (announcement) => {
    if (!announcement?.id) {
      setError("Data pengumuman tidak valid");
      return;
    }

    setEditData(announcement);
    setFormData({
      title: announcement.title || "",
      content: announcement.content || "",
      effective_from: announcement.effective_from || "",
      effective_until: announcement.effective_until || "",
      target_role: announcement.target_role || "semua",
      is_active: announcement.is_active ?? true,
    });
    setShowAddForm(true);
    setError(null);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditData(null);
    setFormData({
      title: "",
      content: "",
      effective_from: "",
      effective_until: "",
      target_role: "semua",
      is_active: true,
    });
    setError(null);
  };

  const handleDeleteClick = async (id) => {
    try {
      await deleteAnnouncement(id);
    } catch (err) {
      setError(err.message || "Gagal menghapus pengumuman");
    }
  };

  const handleTeacherAttendance = () => {
    navigate("/attendance-teacher");
  };

  const handleManageTeachers = () => {
    navigate("/teachers");
  };

  const handleManageClasses = () => {
    navigate("/classes");
  };

  const handleManageStudents = () => {
    navigate("/students");
  };

  // 🆕 Helper: Format tanggal untuk input datetime-local
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 🆕 Helper: Cek apakah pengumuman masih aktif (dalam rentang tanggal)
  const isAnnouncementActive = (announcement) => {
    const now = new Date();
    const effectiveFrom = new Date(announcement.effective_from);
    const effectiveUntil = new Date(announcement.effective_until);
    return now >= effectiveFrom && now <= effectiveUntil;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat dashboard admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
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

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-3 sm:mb-2">
              Selamat Datang, {user?.full_name || user?.username}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
                Administrator
              </span>
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Kelola Seluruh Data Sekolah
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {/* Total Guru */}
        <div className="group bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl shadow-lg hover:shadow-xl border border-blue-100 hover:border-blue-200 p-3 sm:p-4 lg:p-6 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-blue-600 mb-1 font-medium">
                Total Guru
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                {stats.totalTeachers}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-white text-sm sm:text-lg lg:text-2xl">
                👩‍🏫
              </span>
            </div>
          </div>
        </div>

        {/* Total Kelas */}
        <div className="group bg-gradient-to-br from-emerald-50 via-white to-green-50 rounded-xl shadow-lg hover:shadow-xl border border-emerald-100 hover:border-emerald-200 p-3 sm:p-4 lg:p-6 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-emerald-600 mb-1 font-medium">
                Total Kelas
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                {stats.totalClasses}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-white text-sm sm:text-lg lg:text-2xl">
                🏫
              </span>
            </div>
          </div>
        </div>

        {/* Total Siswa */}
        <div className="group bg-gradient-to-br from-purple-50 via-white to-violet-50 rounded-xl shadow-lg hover:shadow-xl border border-purple-100 hover:border-purple-200 p-3 sm:p-4 lg:p-6 transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-purple-600 mb-1 font-medium">
                Total Siswa
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                {stats.totalStudents}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-white text-sm sm:text-lg lg:text-2xl">
                👨‍🎓
              </span>
            </div>
          </div>
        </div>

        {/* Siswa per Jenjang */}
        <div className="group bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-xl shadow-lg hover:shadow-xl border border-orange-100 hover:border-orange-200 p-3 sm:p-4 lg:p-6 col-span-2 lg:col-span-1 transform hover:-translate-y-1 transition-all duration-300">
          <div>
            <p className="text-xs sm:text-sm text-orange-600 mb-2 sm:mb-3 font-medium">
              Siswa per Jenjang
            </p>
            <div className="space-y-1.5 sm:space-y-2">
              {stats.studentsByGrade.length > 0 ? (
                stats.studentsByGrade.map(({ grade, count }) => (
                  <div
                    key={grade}
                    className="flex justify-between items-center group/item hover:bg-orange-50 px-2 py-1 rounded-lg transition-colors">
                    <span className="text-xs sm:text-sm font-medium text-slate-700 group-hover/item:text-orange-700 transition-colors">
                      Kelas {grade}
                    </span>
                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200 group-hover/item:scale-105 transition-transform">
                      {count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs sm:text-sm text-slate-500 text-center">
                  Tidak ada data
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3 sm:mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={handleTeacherAttendance}
            className="group bg-gradient-to-br from-indigo-50 via-white to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-slate-800 p-3 sm:p-4 rounded-xl text-left h-auto transition-all duration-300 border border-indigo-100 hover:border-indigo-200 shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
              <span className="text-white text-sm sm:text-lg">👨‍🏫</span>
            </div>
            <div className="font-semibold text-sm sm:text-base group-hover:text-indigo-700 transition-colors">
              Presensi Guru
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1 group-hover:text-indigo-600 transition-colors">
              Lihat absensi guru
            </div>
          </button>

          <button
            onClick={handleManageTeachers}
            className="group bg-gradient-to-br from-blue-50 via-white to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-slate-800 p-3 sm:p-4 rounded-xl text-left h-auto transition-all duration-300 border border-blue-100 hover:border-blue-200 shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
              <span className="text-white text-sm sm:text-lg">👩‍🏫</span>
            </div>
            <div className="font-semibold text-sm sm:text-base group-hover:text-blue-700 transition-colors">
              Kelola Data Guru
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1 group-hover:text-blue-600 transition-colors">
              Tambah, edit, hapus guru
            </div>
          </button>

          <button
            onClick={handleManageClasses}
            className="group bg-gradient-to-br from-emerald-50 via-white to-green-50 hover:from-emerald-100 hover:to-green-100 text-slate-800 p-3 sm:p-4 rounded-xl text-left h-auto transition-all duration-300 border border-emerald-100 hover:border-emerald-200 shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
              <span className="text-white text-sm sm:text-lg">🏫</span>
            </div>
            <div className="font-semibold text-sm sm:text-base group-hover:text-emerald-700 transition-colors">
              Kelola Kelas
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1 group-hover:text-emerald-600 transition-colors">
              Atur kelas & tahun ajaran
            </div>
          </button>

          <button
            onClick={handleManageStudents}
            className="group bg-gradient-to-br from-purple-50 via-white to-violet-50 hover:from-purple-100 hover:to-violet-100 text-slate-800 p-3 sm:p-4 rounded-xl text-left h-auto transition-all duration-300 border border-purple-100 hover:border-purple-200 shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
              <span className="text-white text-sm sm:text-lg">👨‍🎓</span>
            </div>
            <div className="font-semibold text-sm sm:text-base group-hover:text-purple-700 transition-colors">
              Kelola Siswa
            </div>
            <div className="text-xs sm:text-sm text-slate-600 mt-1 group-hover:text-purple-600 transition-colors">
              Data siswa & enrollment
            </div>
          </button>
        </div>
      </div>

      {/* 🆕 UPDATED: Pengumuman Section dengan field baru */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-xl shadow-xl border border-blue-100 p-4 sm:p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
            <span className="mr-2 text-blue-600">📢</span>
            Kelola Pengumuman
          </h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105"
            disabled={submitting}>
            <span className="mr-1">✨</span> Tambah Pengumuman
          </button>
        </div>

        {/* 🆕 Form dengan field lengkap */}
        {showAddForm && (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 rounded-xl mb-4 border-2 border-blue-200 shadow-inner backdrop-blur-sm">
            <h4 className="font-semibold mb-3 text-slate-800 text-sm sm:text-base flex items-center">
              <span className="mr-2">{editData ? "✏️" : "➕"}</span>
              {editData ? "Edit Pengumuman" : "Tambah Pengumuman Baru"}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Judul */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                  disabled={submitting}
                  placeholder="Contoh: Jadwal Pembagian Raport"
                />
              </div>

              {/* Konten */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Isi Pengumuman *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                  disabled={submitting}
                  placeholder="Masukkan detail pengumuman..."
                />
              </div>

              {/* Tanggal Efektif */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mulai Tayang *
                  </label>
                  <input
                    type="datetime-local"
                    value={formatDateForInput(formData.effective_from)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        effective_from: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Berakhir *
                  </label>
                  <input
                    type="datetime-local"
                    value={formatDateForInput(formData.effective_until)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        effective_until: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Target Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Target Penerima *
                  </label>
                  <select
                    value={formData.target_role}
                    onChange={(e) =>
                      setFormData({ ...formData, target_role: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={submitting}>
                    <option value="semua">Semua Guru</option>
                    <option value="teacher">Guru Mapel</option>
                    <option value="walikelas">Wali Kelas</option>
                    <option value="guru_bk">Guru BK</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center h-10">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_active: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                        disabled={submitting}
                      />
                      <div className="relative w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-slate-700">
                        {formData.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Tombol Action */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none">
                  <span className="mr-1">
                    {submitting ? "⏳" : editData ? "💾" : "✨"}
                  </span>
                  {submitting ? "Menyimpan..." : editData ? "Update" : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 disabled:from-slate-300 disabled:to-slate-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none">
                  <span className="mr-1">✕</span>
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 🆕 Daftar Pengumuman dengan info lengkap */}
        <div>
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => {
                const isActive = isAnnouncementActive(announcement);
                const statusColor = announcement.is_active
                  ? isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                  : "bg-slate-100 text-slate-600";

                return (
                  <div
                    key={announcement.id}
                    className="group border-l-4 border-blue-500 pl-4 py-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 rounded-r-xl hover:from-blue-100/80 hover:to-indigo-100/50 transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg">
                    <div className="flex flex-col gap-3">
                      {/* Header: Title + Status Badge */}
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-slate-800 text-sm sm:text-base group-hover:text-blue-700 transition-colors flex items-start flex-1">
                          <span className="mr-2 mt-0.5">📋</span>
                          {announcement.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                            {announcement.is_active
                              ? isActive
                                ? "🟢 Tayang"
                                : "🟡 Dijadwalkan"
                              : "⚫ Nonaktif"}
                          </span>
                          <button
                            onClick={() =>
                              toggleActiveStatus(
                                announcement.id,
                                announcement.is_active
                              )
                            }
                            className="text-slate-500 hover:text-blue-600 transition-colors"
                            title={
                              announcement.is_active
                                ? "Nonaktifkan"
                                : "Aktifkan"
                            }>
                            {announcement.is_active ? "👁️" : "🚫"}
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-slate-600 ml-6 group-hover:text-slate-700 transition-colors">
                        {announcement.content}
                      </p>

                      {/* Meta Info */}
                      <div className="ml-6 space-y-1">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <span>👥</span>
                            <span className="font-medium">
                              {announcement.target_role === "semua"
                                ? "Semua Guru"
                                : announcement.target_role === "teacher"
                                ? "Guru Mapel"
                                : announcement.target_role === "walikelas"
                                ? "Wali Kelas"
                                : announcement.target_role === "guru_bk"
                                ? "Guru BK"
                                : "Admin"}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            <span>
                              {new Date(
                                announcement.effective_from
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              -{" "}
                              {new Date(
                                announcement.effective_until
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span>🕐</span>
                            <span>
                              {new Date(
                                announcement.created_at
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-6">
                        <button
                          onClick={() => handleEdit(announcement)}
                          disabled={submitting}
                          className="text-blue-600 hover:text-blue-800 disabled:text-blue-400 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all duration-200 transform hover:scale-105 shadow-sm">
                          <span className="mr-1">✏️</span>Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(announcement.id)}
                          disabled={submitting}
                          className="text-red-600 hover:text-red-800 disabled:text-red-400 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all duration-200 transform hover:scale-105 shadow-sm">
                          <span className="mr-1">🗑️</span>Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border-2 border-dashed border-blue-200">
              <div className="text-2xl sm:text-4xl mb-4 animate-bounce">📢</div>
              <h4 className="font-medium text-slate-800 mb-2 text-sm sm:text-base">
                Belum Ada Pengumuman
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Klik tombol "✨ Tambah Pengumuman" untuk membuat pengumuman
                pertama
              </p>
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <span className="mr-1">💡</span>
                Tip: Pengumuman akan tampil otomatis di dashboard guru
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

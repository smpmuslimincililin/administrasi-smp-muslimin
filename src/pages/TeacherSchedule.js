import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Upload,
  LayoutGrid,
  List,
} from "lucide-react";
import TeacherScheduleExcel from "./TeacherScheduleExcel";

const JAM_SCHEDULE = {
  Senin: {
    1: { start: "07:00", end: "08:00" },
    2: { start: "08:00", end: "08:40" },
    3: { start: "08:40", end: "09:20" },
    4: { start: "09:20", end: "10:00" },
    5: { start: "10:30", end: "11:05" },
    6: { start: "11:05", end: "11:40" },
    7: { start: "11:40", end: "12:15" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Selasa: {
    1: { start: "07:00", end: "07:40" },
    2: { start: "07:40", end: "08:20" },
    3: { start: "08:20", end: "09:00" },
    4: { start: "09:00", end: "09:40" },
    5: { start: "10:10", end: "10:50" },
    6: { start: "10:50", end: "11:30" },
    7: { start: "11:30", end: "12:10" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Rabu: {
    1: { start: "07:00", end: "07:40" },
    2: { start: "07:40", end: "08:20" },
    3: { start: "08:20", end: "09:00" },
    4: { start: "09:00", end: "09:40" },
    5: { start: "10:10", end: "10:50" },
    6: { start: "10:50", end: "11:30" },
    7: { start: "11:30", end: "12:10" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Kamis: {
    1: { start: "07:00", end: "07:40" },
    2: { start: "07:40", end: "08:20" },
    3: { start: "08:20", end: "09:00" },
    4: { start: "09:00", end: "09:40" },
    5: { start: "10:10", end: "10:50" },
    6: { start: "10:50", end: "11:30" },
    7: { start: "11:30", end: "12:10" },
    8: { start: "13:00", end: "13:35" },
    9: { start: "13:35", end: "14:10" },
  },
  Jumat: {
    1: { start: "07:00", end: "07:30" },
    2: { start: "07:30", end: "08:00" },
    3: { start: "08:00", end: "08:30" },
    4: { start: "08:30", end: "09:00" },
    5: { start: "09:30", end: "10:00" },
    6: { start: "10:00", end: "10:30" },
  },
};

const TeacherSchedule = ({ user }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [viewMode, setViewMode] = useState("grid");

  const [formData, setFormData] = useState({
    day: "Senin",
    start_period: "1",
    end_period: "1",
    class_id: "",
  });

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  useEffect(() => {
    if (user && user.id) {
      fetchSchedules();
      fetchClasses();
    }
  }, [user]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("teacher_schedules")
        .select("*")
        .eq("teacher_id", user.id)
        .order("day")
        .order("start_time");

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      setError("Gagal memuat jadwal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH CLASSES - HANYA KELAS YANG DIAMPU GURU INI (FIXED: use teacher_id)
  const fetchClasses = async () => {
    try {
      // CRITICAL FIX: Pastikan user punya teacher_id
      if (!user.teacher_id) {
        console.error("❌ User tidak memiliki teacher_id!");
        // Fallback ke semua kelas
        const { data: allClasses } = await supabase
          .from("classes")
          .select("id, grade")
          .eq("is_active", true)
          .order("id");
        setClasses(allClasses || []);
        return;
      }

      console.log("🔑 Using teacher_id:", user.teacher_id);

      // Step 1: Ambil kelas yang diampu guru dari teacher_assignments
      const { data: assignments, error: assignError } = await supabase
        .from("teacher_assignments")
        .select("class_id")
        .eq("teacher_id", user.teacher_id); // ← FIX: Pakai user.teacher_id bukan user.id

      if (assignError) {
        console.error("❌ Error fetching assignments:", assignError);
        throw assignError;
      }

      console.log("📋 Teacher assignments:", assignments);

      // Step 2: Jika tidak ada assignment, fallback ke semua kelas
      if (!assignments || assignments.length === 0) {
        console.warn(
          "⚠️ Guru belum memiliki penugasan kelas, menampilkan semua kelas"
        );

        // FALLBACK: Tampilkan semua kelas
        const { data: allClasses, error: allClassError } = await supabase
          .from("classes")
          .select("id, grade")
          .eq("is_active", true)
          .order("id");

        if (allClassError) throw allClassError;

        setClasses(allClasses || []);
        console.log(
          `🔄 FALLBACK: Menampilkan ${allClasses?.length || 0} kelas`
        );
        return;
      }

      // Step 3: Extract class_id yang diampu
      const assignedClassIds = assignments.map((a) => a.class_id);
      console.log("🎯 Assigned class IDs:", assignedClassIds);

      // Step 4: Ambil detail kelas dari tabel classes
      const { data: classesData, error: classError } = await supabase
        .from("classes")
        .select("id, grade")
        .in("id", assignedClassIds)
        .eq("is_active", true)
        .order("id");

      if (classError) throw classError;

      setClasses(classesData || []);
      console.log(
        `✅ Guru mengampu ${classesData?.length || 0} kelas:`,
        classesData
      );
    } catch (err) {
      console.error("❌ Error fetching classes:", err);
      // ULTIMATE FALLBACK: Load semua kelas kalau ada error
      try {
        const { data: allClasses } = await supabase
          .from("classes")
          .select("id, grade")
          .eq("is_active", true)
          .order("id");
        setClasses(allClasses || []);
        console.log("🆘 EMERGENCY FALLBACK: Loaded all classes");
      } catch (fallbackErr) {
        console.error("💀 Complete failure:", fallbackErr);
        setClasses([]);
      }
    }
  };

  // ✅ FUNGSI BARU UNTUK SIMPAN DATA IMPORT
  const saveImportedSchedules = async (importedSchedules) => {
    try {
      // Hapus jadwal lama dulu
      const { error: deleteError } = await supabase
        .from("teacher_schedules")
        .delete()
        .eq("teacher_id", user.id);

      if (deleteError) throw deleteError;

      // Insert jadwal baru
      const { error: insertError } = await supabase
        .from("teacher_schedules")
        .insert(importedSchedules);

      if (insertError) throw insertError;

      return {
        success: true,
        message: `Berhasil menyimpan ${importedSchedules.length} jadwal`,
      };
    } catch (error) {
      throw new Error("Gagal menyimpan jadwal import: " + error.message);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const result = await TeacherScheduleExcel.exportToExcel(
        schedules,
        user,
        days
      );

      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Gagal export ke Excel: " + err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleImportFromExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      // ✅ FIX: Kirim user.id yang benar
      const result = await TeacherScheduleExcel.importFromExcel(file, user.id);

      if (result.success) {
        // ✅ SIMPAN KE DATABASE JIKA ADA DATA
        if (result.schedules && result.schedules.length > 0) {
          const saveResult = await saveImportedSchedules(result.schedules);
          if (saveResult.success) {
            setSuccess(`${result.message} ${saveResult.message}`);
          } else {
            setError(saveResult.message);
          }
        } else {
          setSuccess(result.message);
        }

        // ✅ SET TIMEOUT UNTUK SEMUA KASUS
        setTimeout(() => {
          setSuccess(null);
          setError(null);
        }, 4000);

        fetchSchedules(); // Refresh data
      } else {
        setError(result.message);
        setTimeout(() => setError(null), 4000);
      }
    } catch (err) {
      setError("Gagal import dari Excel: " + err.message);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // ✅ FIX: Kirim user object, bukan kosong
      const result = await TeacherScheduleExcel.downloadTemplate(user);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Gagal download template: " + err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const generateScheduleGrid = () => {
    const grid = {};

    days.forEach((day) => {
      grid[day] = {};

      const daySchedule = JAM_SCHEDULE[day];
      if (daySchedule) {
        Object.keys(daySchedule).forEach((period) => {
          grid[day][period] = null;
        });
      }

      schedules
        .filter((schedule) => schedule.day === day)
        .forEach((schedule) => {
          const periods = findPeriodsByTimeRange(
            day,
            schedule.start_time,
            schedule.end_time
          );
          periods.forEach((period) => {
            grid[day][period] = schedule;
          });
        });
    });

    return grid;
  };

  const findPeriodsByTimeRange = (day, startTime, endTime) => {
    const daySchedule = JAM_SCHEDULE[day];
    if (!daySchedule) return [];

    const periods = [];
    const targetStart = timeToMinutes(startTime);
    const targetEnd = timeToMinutes(endTime);

    for (const [period, timeRange] of Object.entries(daySchedule)) {
      const periodStart = timeToMinutes(timeRange.start);
      const periodEnd = timeToMinutes(timeRange.end);

      if (periodStart >= targetStart && periodEnd <= targetEnd) {
        periods.push(period);
      }
    }

    return periods;
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const getPeriodFromTime = (day, startTime, endTime) => {
    const periods = findPeriodsByTimeRange(day, startTime, endTime);
    return {
      startPeriod: periods[0] || "1",
      endPeriod: periods[periods.length - 1] || "1",
    };
  };

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setEditingId(schedule.id);
      const { startPeriod, endPeriod } = getPeriodFromTime(
        schedule.day,
        schedule.start_time,
        schedule.end_time
      );
      setFormData({
        day: schedule.day,
        start_period: startPeriod,
        end_period: endPeriod,
        class_id: schedule.class_id,
      });
    } else {
      setEditingId(null);
      setFormData({
        day: "Senin",
        start_period: "1",
        end_period: "1",
        class_id: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.class_id) {
      setError("Kelas harus dipilih");
      return;
    }

    if (parseInt(formData.start_period) > parseInt(formData.end_period)) {
      setError("Jam mulai harus lebih awal dari jam selesai");
      return;
    }

    setLoading(true);

    try {
      const daySchedule = JAM_SCHEDULE[formData.day];
      const startTime = daySchedule[formData.start_period].start;
      const endTime = daySchedule[formData.end_period].end;

      const scheduleData = {
        day: formData.day,
        start_time: startTime,
        end_time: endTime,
        class_id: formData.class_id,
        teacher_id: user.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("teacher_schedules")
          .update(scheduleData)
          .eq("id", editingId);
        if (error) throw error;
        setSuccess("Jadwal berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("teacher_schedules")
          .insert(scheduleData);
        if (error) throw error;
        setSuccess("Jadwal berhasil ditambahkan");
      }

      handleCloseModal();
      fetchSchedules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Gagal menyimpan jadwal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus jadwal ini?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("teacher_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setSuccess("Jadwal berhasil dihapus");
      fetchSchedules();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Gagal menghapus jadwal");
    } finally {
      setLoading(false);
    }
  };

  const getTodaySchedules = () => {
    const today = days[new Date().getDay() - 1] || "Senin";
    return schedules.filter((s) => s.day === today);
  };

  // ✅ FUNCTION GROUP YANG BENER
  // ✅ FUNCTION GROUP YANG FIX - TOLERANCE ISTIRAHAT
  const getGroupedTodaySchedules = () => {
    const todaySchedules = getTodaySchedules();
    if (todaySchedules.length === 0) return [];

    // Urutkan berdasarkan waktu mulai
    const sorted = [...todaySchedules].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );

    const groups = [];
    let currentGroup = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = currentGroup[currentGroup.length - 1];

      // Cek apakah kelas sama dan waktu berurutan (dengan tolerance istirahat)
      const isSameClass = current.class_id === last.class_id;

      // Convert waktu ke minutes untuk cek berurutan
      const lastEndMinutes = timeToMinutes(last.end_time);
      const currentStartMinutes = timeToMinutes(current.start_time);
      const isConsecutive =
        Math.abs(currentStartMinutes - lastEndMinutes) <= 30; // ✅ Tolerance 30 menit untuk istirahat

      if (isSameClass && isConsecutive) {
        currentGroup.push(current);
      } else {
        groups.push(currentGroup);
        currentGroup = [current];
      }
    }

    // Push group terakhir
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const getAvailablePeriods = () => {
    return Object.keys(JAM_SCHEDULE[formData.day] || {});
  };

  const scheduleGrid = generateScheduleGrid();

  return (
    // PADDING DIBUAT SEDIKIT LEBIH KECIL DI LAYAR SANGAT KECIL
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ✅ CARD 1: Header Info */}
        <div className="mb-4 bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                JADWAL MENGAJAR
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-semibold">
                TAHUN AJARAN 2025/2026 SEMESTER GANJIL
              </p>
            </div>
          </div>
        </div>

        {/* ✅ CARD 2: Action Buttons - Menggunakan flex-wrap untuk responsif */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex gap-3 justify-center flex-wrap">
            {/* Semua tombol menggunakan flex-1 min-w untuk wrapping yang baik */}
            {/* Tampilan Grid - TOMBOL TERPISAH */}
            <button
              onClick={() => setViewMode("grid")}
              className={`flex-1 min-w-[140px] px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border transition-all ${
                viewMode === "grid"
                  ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}>
              <LayoutGrid className="w-5 h-5" />
              Tampilan Grid
            </button>

            {/* Tampilan List - TOMBOL TERPISAH */}
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 min-w-[140px] px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border transition-all ${
                viewMode === "list"
                  ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
              }`}>
              <List className="w-5 h-5" />
              Tampilan List
            </button>

            {/* Tambah Jadwal */}
            <button
              onClick={() => handleOpenModal()}
              className="flex-1 min-w-[140px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border border-slate-300 transition-all">
              <Plus className="w-5 h-5" />
              Tambah Jadwal
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportToExcel}
              disabled={schedules.length === 0}
              className="flex-1 min-w-[140px] bg-slate-100 hover:bg-slate-200 disabled:bg-gray-100 disabled:text-gray-400 text-slate-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border border-slate-300 transition-all">
              <Download className="w-5 h-5" />
              Export Jadwal
            </button>

            {/* Download Template */}
            <button
              onClick={handleDownloadTemplate}
              className="flex-1 min-w-[140px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border border-slate-300 transition-all">
              <Download className="w-5 h-5" />
              Template Excel
            </button>

            {/* Import Excel */}
            <label className="flex-1 min-w-[140px] bg-slate-100 hover:bg-slate-200 cursor-pointer text-slate-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium flex items-center gap-2 justify-center border border-slate-300 transition-all">
              <Upload className="w-5 h-5" />
              Import Jadwal
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFromExcel}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Today's Schedule - COMPACT VERSION */}
        {getGroupedTodaySchedules().length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border-2 border-indigo-200 p-4 mb-8">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Jadwal Hari Ini ({days[new Date().getDay() - 1] || "Senin"})
            </h2>

            {/* GRID DINAMIS BERDASARKAN JUMLAH CARD - Tetap responsif */}
            <div
              className={`
      grid gap-2
      ${
        getGroupedTodaySchedules().length <= 4
          ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
          : ""
      }
      ${
        getGroupedTodaySchedules().length > 4 &&
        getGroupedTodaySchedules().length <= 6
          ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-3"
          : ""
      }
      ${
        getGroupedTodaySchedules().length > 6
          ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          : ""
      }
    `}>
              {getGroupedTodaySchedules().map((group, idx) => {
                const first = group[0];
                const last = group[group.length - 1];
                const totalJP = group.length;

                return (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-3 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-indigo-600 mb-1 truncate">
                          {first.start_time} - {last.end_time}
                        </p>
                        <p className="font-semibold text-slate-800 text-sm mb-1 truncate">
                          Kelas {first.class_id}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {totalJP}JP
                          {group.length > 1 &&
                            ` (${
                              findPeriodsByTimeRange(
                                first.day,
                                first.start_time,
                                first.end_time
                              )[0]
                            }-${findPeriodsByTimeRange(
                              last.day,
                              last.start_time,
                              last.end_time
                            ).pop()})`}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 gap-1 ml-2">
                        <button
                          onClick={() => handleOpenModal(first)}
                          className="text-blue-600 hover:text-blue-700 p-0.5"
                          title="Edit">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Hapus sesi Kelas ${first.class_id}?`
                              )
                            ) {
                              group.forEach((schedule) =>
                                handleDelete(schedule.id)
                              );
                            }
                          }}
                          className="text-red-600 hover:text-red-700 p-0.5"
                          title="Hapus Sesi">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Schedule View */}
        {viewMode === "grid" ? (
          // GRID VIEW - Menggunakan overflow-x-auto untuk responsif pada tabel
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                Jadwal Mengajar Mingguan (Tampilan Grid)
              </h2>
            </div>

            {loading && schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                Memuat jadwal...
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="mb-2">Belum ada jadwal</p>
                <p className="text-sm">Klik "Tambah Jadwal" untuk memulai</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-max">
                  <thead>
                    <tr className="bg-blue-800 text-white text-xs sm:text-sm">
                      <th className="p-3 border border-slate-600 text-center font-semibold">
                        JAM KE
                      </th>
                      <th className="p-3 border border-slate-600 text-center font-semibold">
                        WAKTU*
                      </th>
                      {days.map((day) => (
                        <th
                          key={day}
                          className="p-3 border border-slate-600 text-center font-semibold">
                          {day.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(JAM_SCHEDULE.Selasa || {}).map(
                      ([period, time]) => (
                        <React.Fragment key={period}>
                          <tr className="hover:bg-slate-50 text-sm">
                            <td className="p-2 border border-slate-300 text-center font-semibold bg-slate-100">
                              {period}
                            </td>
                            <td
                              className={`p-2 border border-slate-300 text-center text-xs ${
                                period === "1"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-slate-100"
                              }`}>
                              {time.start} - {time.end}
                              {period === "1" && (
                                <div className="text-[10px] mt-1 text-yellow-600">
                                  Senin: 07:00-08:00
                                </div>
                              )}
                            </td>
                            {days.map((day) => (
                              <td
                                key={day}
                                className="p-2 border border-slate-300 text-center">
                                {day === "Jumat" ? (
                                  <div className="flex flex-col items-center">
                                    {scheduleGrid[day] &&
                                    scheduleGrid[day][period] ? (
                                      <>
                                        <span className="font-bold text-slate-800 text-sm sm:text-lg">
                                          {scheduleGrid[day][period].class_id}
                                        </span>
                                        <div className="text-[10px] mt-1 text-blue-600 font-medium">
                                          {JAM_SCHEDULE.Jumat[period]?.start}-
                                          {JAM_SCHEDULE.Jumat[period]?.end}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-slate-400 text-sm sm:text-lg">
                                          -
                                        </span>
                                        <div className="text-[10px] mt-1 text-blue-600 font-medium">
                                          {JAM_SCHEDULE.Jumat[period]?.start}-
                                          {JAM_SCHEDULE.Jumat[period]?.end}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ) : scheduleGrid[day] &&
                                  scheduleGrid[day][period] ? (
                                  <span className="font-bold text-slate-800 text-sm sm:text-lg">
                                    {scheduleGrid[day][period].class_id}
                                  </span>
                                ) : day === "Senin" && period === "1" ? (
                                  <span className="font-bold text-slate-800 text-sm sm:text-lg">
                                    UPACARA
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-sm sm:text-lg">
                                    -
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>

                          {/* ISTIRAHAT PAGI SETELAH JP 4 */}
                          {period === "4" && (
                            <tr>
                              <td
                                colSpan={7}
                                className="p-2 bg-orange-50 border border-orange-200 text-center text-orange-800 font-semibold text-xs sm:text-sm">
                                🕛 ISTIRAHAT {time.end} - 10:10 (30 menit)
                              </td>
                            </tr>
                          )}

                          {/* ISTIRAHAT SIANG SETELAH JP 7 (HANYA SENIN-KAMIS) */}
                          {period === "7" && (
                            <tr>
                              <td
                                colSpan={7}
                                className="p-2 bg-orange-50 border border-orange-200 text-center text-orange-800 font-semibold text-xs sm:text-sm">
                                🕛 ISTIRAHAT 12:10 - 13:00 (50 menit)
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    )}
                  </tbody>
                </table>
                <div className="p-3 bg-slate-50 border-t border-slate-200">
                  <p className="text-xs md:text-sm text-slate-600 text-center font-bold italic">
                    *Waktu Mengikuti Jadwal Masing-Masing Hari. Senin & Jumat
                    Memiliki Waktu Khusus.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // LIST VIEW - Menggunakan overflow-x-auto untuk responsif pada tabel
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                Jadwal Mengajar Mingguan (Tampilan List)
              </h2>
            </div>

            {loading && schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                Memuat jadwal...
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="mb-2">Belum ada jadwal</p>
                <p className="text-sm">Klik "Tambah Jadwal" untuk memulai</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-blue-800 text-white text-xs sm:text-sm">
                    <tr>
                      <th className="px-3 py-3 sm:px-6 text-left font-semibold">
                        Hari
                      </th>
                      <th className="px-3 py-3 sm:px-6 text-left font-semibold">
                        Jam Ke
                      </th>
                      <th className="px-3 py-3 sm:px-6 text-left font-semibold">
                        Waktu
                      </th>
                      <th className="px-3 py-3 sm:px-6 text-left font-semibold">
                        Kelas
                      </th>
                      <th className="px-3 py-3 sm:px-6 text-left font-semibold">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => {
                      const daySchedules = schedules.filter(
                        (s) => s.day === day
                      );
                      return daySchedules.map((schedule, idx) => {
                        const periods = findPeriodsByTimeRange(
                          day,
                          schedule.start_time,
                          schedule.end_time
                        );
                        const jamKe =
                          periods.length > 0
                            ? `${periods[0]}${
                                periods.length > 1
                                  ? `-${periods[periods.length - 1]}`
                                  : ""
                              }`
                            : "?";

                        return (
                          <tr
                            key={schedule.id}
                            className="border-b border-slate-200 hover:bg-slate-50 text-sm">
                            {idx === 0 && (
                              <td
                                className="px-3 py-3 sm:px-6 font-semibold text-slate-800"
                                rowSpan={daySchedules.length}>
                                {day}
                              </td>
                            )}
                            <td className="px-3 py-3 sm:px-6 text-slate-700 font-medium">
                              JP {jamKe}
                            </td>
                            <td className="px-3 py-3 sm:px-6 text-slate-700">
                              {schedule.start_time} - {schedule.end_time}
                            </td>
                            <td className="px-3 py-3 sm:px-6 font-semibold text-slate-800">
                              Kelas {schedule.class_id}
                            </td>
                            <td className="px-3 py-3 sm:px-6">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenModal(schedule)}
                                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs sm:text-sm">
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(schedule.id)}
                                  className="text-red-600 hover:text-red-700 flex items-center gap-1 text-xs sm:text-sm">
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL - **FIXED DIMENSION DENGAN RESPONSIVE MAX-WIDTH** */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* CRITICAL FIX: Mengubah w-[500px] h-[500px] menjadi w-full max-w-lg dan max-h-full */}
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Jadwal" : "Tambah Jadwal"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* FORM - FLEXIBLE HEIGHT */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col min-h-0">
              {/* Tambahkan overflow-y-auto di sini jika form bisa sangat panjang */}
              <div className="space-y-4 flex-1 overflow-y-auto pr-1 pb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hari
                  </label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Dari Jam Ke
                    </label>
                    <select
                      name="start_period"
                      value={formData.start_period}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                      {getAvailablePeriods().map((jam) => (
                        <option key={jam} value={jam}>
                          Jam {jam}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sampai Jam Ke
                    </label>
                    <select
                      name="end_period"
                      value={formData.end_period}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                      {getAvailablePeriods().map((jam) => (
                        <option
                          key={jam}
                          value={jam}
                          disabled={
                            parseInt(jam) < parseInt(formData.start_period)
                          }>
                          Jam {jam}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kelas
                  </label>
                  <select
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="">Pilih Kelas</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Kelas {cls.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BUTTONS - DI BAWAH */}
              <div className="flex gap-3 pt-4 sm:pt-6 mt-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-indigo-400">
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;

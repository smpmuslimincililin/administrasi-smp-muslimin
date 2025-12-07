import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Table,
  FileText,
  Database,
  Monitor,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SystemTab = ({ user, loading, setLoading, showToast }) => {
  const [schoolSettings, setSchoolSettings] = useState({
    academic_year: "2025/2026",
    school_name: "SMP Muslimin Cililin",
  });
  const [schoolStats, setSchoolStats] = useState({
    total_students: 0,
    total_teachers: 0,
  });
  const [restoreFile, setRestoreFile] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);
  const [exportProgress, setExportProgress] = useState("");
  const navigate = useNavigate();

  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (currentMonth >= 7) {
      return `${currentYear + 1}/${currentYear + 2}`;
    } else {
      return `${currentYear}/${currentYear + 1}`;
    }
  };

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    try {
      setLoading(true);

      const { data: settingsData, error: settingsError } = await supabase
        .from("school_settings")
        .select("setting_key, setting_value");

      if (settingsError) throw settingsError;

      if (settingsData && settingsData.length > 0) {
        const settings = {};
        settingsData.forEach((item) => {
          settings[item.setting_key] = item.setting_value;
        });
        setSchoolSettings((prev) => ({
          ...prev,
          academic_year: settings.academic_year || getCurrentAcademicYear(),
          school_name: settings.school_name || prev.school_name,
        }));
      } else {
        setSchoolSettings((prev) => ({
          ...prev,
          academic_year: getCurrentAcademicYear(),
        }));
      }

      const [teachersRes, studentsRes] = await Promise.all([
        supabase
          .from("users")
          .select("id")
          .in("role", ["admin", "guru_mapel", "guru_walikelas"]),
        supabase.from("students").select("id").eq("is_active", true),
      ]);

      if (teachersRes.error) throw teachersRes.error;
      if (studentsRes.error) throw studentsRes.error;

      setSchoolStats({
        total_students: studentsRes.data?.length || 0,
        total_teachers: teachersRes.data?.length || 0,
      });
    } catch (error) {
      console.error("Error loading school data:", error);
      showToast("Error memuat data sekolah", "error");
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return "";
    }

    const validData = data.filter(
      (item) => item !== null && typeof item === "object"
    );
    if (validData.length === 0) return "";

    const headers = Object.keys(validData[0]);
    const csvHeaders = headers.join(",");

    const csvRows = validData.map((row) => {
      return headers
        .map((header) => {
          let value = row[header];
          if (value === null || value === undefined) {
            value = "";
          }
          value = String(value);
          if (
            value.includes(",") ||
            value.includes('"') ||
            value.includes("\n")
          ) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
    });

    return [csvHeaders, ...csvRows].join("\n");
  };

  const exportTableToCSV = async (tableName, displayName) => {
    try {
      setLoading(true);
      setExportProgress(`Mengambil data ${displayName}...`);

      const { data, error } = await supabase.from(tableName).select("*");

      if (error) throw error;

      if (!data || data.length === 0) {
        showToast(`Tidak ada data di tabel ${displayName}`, "warning");
        return;
      }

      setExportProgress(`Mengkonversi ${data.length} records...`);
      const csvContent = convertToCSV(data);

      if (!csvContent) {
        showToast(`Data ${displayName} tidak valid untuk di-export`, "error");
        return;
      }

      setExportProgress("Membuat file...");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      const schoolName = (
        schoolSettings.school_name || "SMP_Muslimin_Cililin"
      ).replace(/\s+/g, "_");
      const academicYear = (
        schoolSettings.academic_year || getCurrentAcademicYear()
      ).replace("/", "_");
      const date = new Date().toISOString().split("T")[0];

      a.href = url;
      a.download = `${schoolName}_${tableName}_${academicYear}_${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(
        `${displayName} berhasil di-export! (${data.length} records)`,
        "success"
      );
    } catch (error) {
      console.error(`Error exporting ${tableName}:`, error);
      showToast(`Error exporting ${displayName}: ${error.message}`, "error");
    } finally {
      setLoading(false);
      setExportProgress("");
    }
  };

  const exportAllTablesToCSV = async () => {
    try {
      setLoading(true);

      const tables = [
        { name: "academic_years", display: "Tahun Ajaran" },
        { name: "users", display: "Pengguna" },
        { name: "teacher_assignments", display: "Penugasan Guru" },
        { name: "classes", display: "Kelas" },
        { name: "students", display: "Siswa" },
        { name: "attendances", display: "Kehadiran" },
        { name: "grades", display: "Nilai" },
        { name: "konseling", display: "Konseling" },
        { name: "siswa_baru", display: "Siswa Baru" },
        { name: "school_settings", display: "Pengaturan Sekolah" },
        { name: "announcement", display: "Pengumuman" },
        { name: "teacher_schedules", display: "Jadwal Guru" },
        {
          name: "student_development_notes",
          display: "Catatan Perkembangan Siswa",
        },
        { name: "system_health_logs", display: "System Health Logs" },
        { name: "cleanup_history", display: "Riwayat Cleanup" },
        { name: "spmb_settings", display: "Pengaturan SPMB" },
      ];

      let exportedCount = 0;
      const schoolName = (
        schoolSettings.school_name || "SMP_Muslimin_Cililin"
      ).replace(/\s+/g, "_");
      const academicYear = (
        schoolSettings.academic_year || getCurrentAcademicYear()
      ).replace("/", "_");
      const date = new Date().toISOString().split("T")[0];

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];

        try {
          setExportProgress(
            `Exporting ${table.display} (${i + 1}/${tables.length})...`
          );

          const { data, error } = await supabase.from(table.name).select("*");

          if (error) {
            console.error(`Error fetching ${table.name}:`, error);
            continue;
          }

          if (data && data.length > 0) {
            const csvContent = convertToCSV(data);
            if (csvContent) {
              const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${schoolName}_${table.name}_${academicYear}_${date}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              exportedCount++;

              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }
        } catch (tableError) {
          console.error(`Error exporting ${table.name}:`, tableError);
        }
      }

      if (exportedCount > 0) {
        showToast(
          `✅ ${exportedCount} tabel berhasil di-export ke CSV!`,
          "success"
        );
      } else {
        showToast("Tidak ada data untuk di-export", "warning");
      }
    } catch (error) {
      console.error("Error exporting all tables:", error);
      showToast("Error exporting data", "error");
    } finally {
      setLoading(false);
      setExportProgress("");
    }
  };

  const exportDatabaseBackup = async () => {
    try {
      setLoading(true);
      setExportProgress("Mengambil data dari database...");

      const [
        academicYearsRes,
        usersRes,
        teacherAssignmentsRes,
        classesRes,
        studentsRes,
        attendancesRes,
        gradesRes,
        konselingRes,
        siswaBaruRes,
        schoolSettingsRes,
        announcementRes,
        teacherSchedulesRes,
        studentDevelopmentNotesRes,
        systemHealthLogsRes,
        cleanupHistoryRes,
        spmbSettingsRes,
      ] = await Promise.all([
        supabase.from("academic_years").select("*"),
        supabase.from("users").select("*"),
        supabase.from("teacher_assignments").select("*"),
        supabase.from("classes").select("*"),
        supabase.from("students").select("*"),
        supabase.from("attendances").select("*"),
        supabase.from("grades").select("*"),
        supabase.from("konseling").select("*"),
        supabase.from("siswa_baru").select("*"),
        supabase.from("school_settings").select("*"),
        supabase.from("announcement").select("*"),
        supabase.from("teacher_schedules").select("*"),
        supabase.from("student_development_notes").select("*"),
        supabase.from("system_health_logs").select("*"),
        supabase.from("cleanup_history").select("*"),
        supabase.from("spmb_settings").select("*"),
      ]);

      const errors = [
        academicYearsRes.error,
        usersRes.error,
        teacherAssignmentsRes.error,
        classesRes.error,
        studentsRes.error,
        attendancesRes.error,
        gradesRes.error,
        konselingRes.error,
        siswaBaruRes.error,
        schoolSettingsRes.error,
        announcementRes.error,
        teacherSchedulesRes.error,
        studentDevelopmentNotesRes.error,
        systemHealthLogsRes.error,
        cleanupHistoryRes.error,
        spmbSettingsRes.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error(
          `Failed to fetch some tables: ${errors
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      setExportProgress("Membuat file backup...");

      const backupData = {
        timestamp: new Date().toISOString(),
        academic_year: schoolSettings.academic_year || getCurrentAcademicYear(),
        school_info: schoolSettings,
        data: {
          academic_years: academicYearsRes.data,
          users: usersRes.data,
          teacher_assignments: teacherAssignmentsRes.data,
          classes: classesRes.data,
          students: studentsRes.data,
          attendances: attendancesRes.data,
          grades: gradesRes.data,
          konseling: konselingRes.data,
          siswa_baru: siswaBaruRes.data,
          school_settings: schoolSettingsRes.data,
          announcement: announcementRes.data,
          teacher_schedules: teacherSchedulesRes.data,
          student_development_notes: studentDevelopmentNotesRes.data,
          system_health_logs: systemHealthLogsRes.data,
          cleanup_history: cleanupHistoryRes.data,
          spmb_settings: spmbSettingsRes.data,
        },
        stats: {
          total_academic_years: academicYearsRes.data?.length || 0,
          total_users: usersRes.data?.length || 0,
          total_teacher_assignments: teacherAssignmentsRes.data?.length || 0,
          total_classes: classesRes.data?.length || 0,
          total_students: studentsRes.data?.length || 0,
          total_attendance_records: attendancesRes.data?.length || 0,
          total_grades_records: gradesRes.data?.length || 0,
          total_konseling_records: konselingRes.data?.length || 0,
          total_siswa_baru: siswaBaruRes.data?.length || 0,
          total_announcements: announcementRes.data?.length || 0,
          total_teacher_schedules: teacherSchedulesRes.data?.length || 0,
          total_development_notes: studentDevelopmentNotesRes.data?.length || 0,
          total_system_health_logs: systemHealthLogsRes.data?.length || 0,
          total_cleanup_history: cleanupHistoryRes.data?.length || 0,
          total_spmb_settings: spmbSettingsRes.data?.length || 0,
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      const schoolName = (
        schoolSettings.school_name || "SMP_Muslimin_Cililin"
      ).replace(/\s+/g, "_");
      const academicYear = (
        schoolSettings.academic_year || getCurrentAcademicYear()
      ).replace("/", "_");
      const date = new Date().toISOString().split("T")[0];

      a.href = url;
      a.download = `${schoolName}_backup_${academicYear}_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("✅ Database backup berhasil didownload!", "success");
    } catch (error) {
      console.error("Error creating backup:", error);
      showToast("❌ Error membuat database backup: " + error.message, "error");
    } finally {
      setLoading(false);
      setExportProgress("");
    }
  };

  const handleRestoreFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      setRestoreFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result);

          if (!backupData.data || !backupData.stats) {
            throw new Error("Format backup tidak valid");
          }

          setRestorePreview({
            timestamp: backupData.timestamp,
            academic_year: backupData.academic_year,
            school_info: backupData.school_info,
            stats: backupData.stats,
          });
        } catch (error) {
          showToast(
            "Format file backup tidak valid: " + error.message,
            "error"
          );
          setRestoreFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const executeRestore = async () => {
    if (!restoreFile) return;

    const confirmed = window.confirm(
      `PERINGATAN: Restore akan menimpa semua data yang ada!\n\n` +
        `Backup dari: ${new Date(restorePreview.timestamp).toLocaleString(
          "id-ID"
        )}\n` +
        `Tahun Ajaran: ${restorePreview.academic_year}\n` +
        `Sekolah: ${restorePreview.school_info?.school_name}\n\n` +
        `Data yang akan di-restore:\n` +
        `- ${restorePreview.stats?.total_academic_years || 0} tahun ajaran\n` +
        `- ${restorePreview.stats?.total_users || 0} pengguna\n` +
        `- ${
          restorePreview.stats?.total_teacher_assignments || 0
        } penugasan guru\n` +
        `- ${restorePreview.stats?.total_classes || 0} kelas\n` +
        `- ${restorePreview.stats?.total_students || 0} siswa\n` +
        `- ${restorePreview.stats?.total_attendance_records || 0} kehadiran\n` +
        `- ${restorePreview.stats?.total_grades_records || 0} nilai\n` +
        `- ${restorePreview.stats?.total_konseling_records || 0} konseling\n` +
        `- ${
          restorePreview.stats?.total_teacher_schedules || 0
        } jadwal guru\n` +
        `- ${
          restorePreview.stats?.total_development_notes || 0
        } catatan perkembangan\n` +
        `- ${
          restorePreview.stats?.total_system_health_logs || 0
        } system health logs\n` +
        `- ${
          restorePreview.stats?.total_cleanup_history || 0
        } riwayat cleanup\n` +
        `- ${
          restorePreview.stats?.total_spmb_settings || 0
        } pengaturan SPMB\n\n` +
        `Tindakan ini TIDAK DAPAT DIBATALKAN. Apakah Anda yakin?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setExportProgress("Membaca file backup...");

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);

          setExportProgress("Menghapus data lama (1/3)...");

          await supabase
            .from("attendances")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("grades")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("konseling")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("teacher_assignments")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("teacher_schedules")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("student_development_notes")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("system_health_logs")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("cleanup_history")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

          setExportProgress("Menghapus data lama (2/3)...");

          await supabase
            .from("siswa_baru")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("students")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

          setExportProgress("Menghapus data lama (3/3)...");

          await supabase
            .from("users")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("classes")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("announcement")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("school_settings")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("academic_years")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase
            .from("spmb_settings")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

          let insertedTables = 0;
          const totalTables = 16;

          if (backupData.data.academic_years?.length > 0) {
            setExportProgress(
              `Restore academic years (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("academic_years")
              .insert(backupData.data.academic_years);
            if (error) console.error("Error inserting academic_years:", error);
          }

          if (backupData.data.school_settings?.length > 0) {
            setExportProgress(
              `Restore settings (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("school_settings")
              .insert(backupData.data.school_settings);
            if (error) console.error("Error inserting school_settings:", error);
          }

          if (backupData.data.classes?.length > 0) {
            setExportProgress(
              `Restore classes (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("classes")
              .insert(backupData.data.classes);
            if (error) console.error("Error inserting classes:", error);
          }

          if (backupData.data.users?.length > 0) {
            setExportProgress(
              `Restore users (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("users")
              .insert(backupData.data.users);
            if (error) console.error("Error inserting users:", error);
          }

          if (backupData.data.students?.length > 0) {
            setExportProgress(
              `Restore students (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("students")
              .insert(backupData.data.students);
            if (error) console.error("Error inserting students:", error);
          }

          if (backupData.data.siswa_baru?.length > 0) {
            setExportProgress(
              `Restore siswa baru (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("siswa_baru")
              .insert(backupData.data.siswa_baru);
            if (error) console.error("Error inserting siswa_baru:", error);
          }

          if (backupData.data.attendances?.length > 0) {
            setExportProgress(
              `Restore attendances (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("attendances")
              .insert(backupData.data.attendances);
            if (error) console.error("Error inserting attendances:", error);
          }

          if (backupData.data.grades?.length > 0) {
            setExportProgress(
              `Restore grades (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("grades")
              .insert(backupData.data.grades);
            if (error) console.error("Error inserting grades:", error);
          }

          if (backupData.data.konseling?.length > 0) {
            setExportProgress(
              `Restore konseling (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("konseling")
              .insert(backupData.data.konseling);
            if (error) console.error("Error inserting konseling:", error);
          }

          if (backupData.data.teacher_assignments?.length > 0) {
            setExportProgress(
              `Restore teacher assignments (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("teacher_assignments")
              .insert(backupData.data.teacher_assignments);
            if (error)
              console.error("Error inserting teacher_assignments:", error);
          }

          if (backupData.data.announcement?.length > 0) {
            setExportProgress(
              `Restore announcements (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("announcement")
              .insert(backupData.data.announcement);
            if (error) console.error("Error inserting announcement:", error);
          }

          if (backupData.data.teacher_schedules?.length > 0) {
            setExportProgress(
              `Restore teacher schedules (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("teacher_schedules")
              .insert(backupData.data.teacher_schedules);
            if (error)
              console.error("Error inserting teacher_schedules:", error);
          }

          if (backupData.data.student_development_notes?.length > 0) {
            setExportProgress(
              `Restore development notes (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("student_development_notes")
              .insert(backupData.data.student_development_notes);
            if (error)
              console.error(
                "Error inserting student_development_notes:",
                error
              );
          }

          if (backupData.data.system_health_logs?.length > 0) {
            setExportProgress(
              `Restore system health logs (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("system_health_logs")
              .insert(backupData.data.system_health_logs);
            if (error)
              console.error("Error inserting system_health_logs:", error);
          }

          if (backupData.data.cleanup_history?.length > 0) {
            setExportProgress(
              `Restore cleanup history (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("cleanup_history")
              .insert(backupData.data.cleanup_history);
            if (error) console.error("Error inserting cleanup_history:", error);
          }

          if (backupData.data.spmb_settings?.length > 0) {
            setExportProgress(
              `Restore SPMB settings (${++insertedTables}/${totalTables})...`
            );
            const { error } = await supabase
              .from("spmb_settings")
              .insert(backupData.data.spmb_settings);
            if (error) console.error("Error inserting spmb_settings:", error);
          }

          showToast("✅ Database berhasil di-restore!", "success");
          setRestoreFile(null);
          setRestorePreview(null);

          setExportProgress("Memuat ulang data...");
          await loadSchoolData();
        } catch (error) {
          console.error("Error restoring backup:", error);
          showToast("❌ Error restoring database: " + error.message, "error");
        } finally {
          setLoading(false);
          setExportProgress("");
        }
      };

      reader.readAsText(restoreFile);
    } catch (error) {
      console.error("Error reading restore file:", error);
      showToast("Error membaca file backup", "error");
      setLoading(false);
      setExportProgress("");
    }
  };

  const navigateToSystemMonitor = () => {
    navigate("/monitor-sistem");
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          System Management
        </h2>
        <p className="text-gray-600 text-sm">
          SMP Muslimin Cililin - Backup & Restore Database
        </p>

        {exportProgress && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="animate-spin text-blue-600" size={16} />
              <span className="text-sm text-blue-800 font-medium">
                {exportProgress}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* System Health Monitor Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">System Health Monitor</h3>
            <p className="text-blue-100 mb-4">
              Pantau kesehatan sistem, cek performa database, dan validasi
              integritas data
            </p>
            <button
              onClick={navigateToSystemMonitor}
              className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition-colors">
              <Monitor size={18} />
              Buka System Health Monitor
            </button>
          </div>
          <div className="text-right">
            <Monitor size={48} className="text-blue-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Export Individual Tables to CSV */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Export Data ke CSV
        </h3>
        <p className="text-gray-600 mb-4">
          Export data per tabel ke format CSV untuk analisis atau backup
          selektif.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* Baris 1 */}
          <button
            onClick={() => exportTableToCSV("academic_years", "Tahun Ajaran")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Tahun Ajaran
          </button>

          <button
            onClick={() => exportTableToCSV("users", "Data Pengguna")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Users
          </button>

          <button
            onClick={() =>
              exportTableToCSV("teacher_assignments", "Penugasan Guru")
            }
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Penugasan Guru
          </button>

          {/* Baris 2 */}
          <button
            onClick={() => exportTableToCSV("classes", "Data Kelas")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Kelas
          </button>

          <button
            onClick={() => exportTableToCSV("students", "Data Siswa")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Students
          </button>

          <button
            onClick={() => exportTableToCSV("attendances", "Data Kehadiran")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Attendance
          </button>

          {/* Baris 3 */}
          <button
            onClick={() => exportTableToCSV("grades", "Data Nilai")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Nilai
          </button>

          <button
            onClick={() => exportTableToCSV("konseling", "Data Konseling")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Konseling
          </button>

          <button
            onClick={() => exportTableToCSV("siswa_baru", "Data Siswa Baru")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Siswa Baru
          </button>

          {/* Baris 4 */}
          <button
            onClick={() =>
              exportTableToCSV("school_settings", "Pengaturan Sekolah")
            }
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Settings
          </button>

          <button
            onClick={() => exportTableToCSV("announcement", "Pengumuman")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Pengumuman
          </button>

          <button
            onClick={() => exportTableToCSV("teacher_schedules", "Jadwal Guru")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-lime-100 text-lime-700 rounded-lg hover:bg-lime-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Jadwal Guru
          </button>

          {/* Baris 5 */}
          <button
            onClick={() =>
              exportTableToCSV(
                "student_development_notes",
                "Catatan Perkembangan"
              )
            }
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Catatan Perkembangan
          </button>

          <button
            onClick={() =>
              exportTableToCSV("system_health_logs", "System Health Logs")
            }
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export System Logs
          </button>

          <button
            onClick={() =>
              exportTableToCSV("cleanup_history", "Riwayat Cleanup")
            }
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Riwayat Cleanup
          </button>

          {/* Baris 6 */}
          <button
            onClick={() => exportTableToCSV("spmb_settings", "Pengaturan SPMB")}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50 font-medium transition-colors">
            <Table size={16} />
            Export Pengaturan SPMB
          </button>

          <div className="md:col-span-2">
            <button
              onClick={exportAllTablesToCSV}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors w-full justify-center">
              <FileText size={18} />
              {loading ? "Exporting..." : "Export Semua Tabel"}
            </button>
          </div>
        </div>
      </div>

      {/* Database Backup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Database Backup (JSON)
        </h3>
        <p className="text-gray-600 mb-4">
          Download backup lengkap database untuk keperluan keamanan dan migrasi
          data.
        </p>

        <button
          onClick={exportDatabaseBackup}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors">
          <Download size={18} />
          {loading ? "Membuat Backup..." : "Download Backup Database (JSON)"}
        </button>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">
            ℹ️ Backup akan berisi:
          </p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-xs text-blue-700">
            <li>Data tahun ajaran (academic_years table)</li>
            <li>Data pengguna (users table)</li>
            <li>Penugasan guru (teacher_assignments table)</li>
            <li>Data kelas (classes table)</li>
            <li>Data siswa aktif (students table)</li>
            <li>
              <strong>Semua data kehadiran</strong> (attendances table - no
              limit)
            </li>
            <li>
              <strong>Semua data nilai</strong> (grades table - no limit)
            </li>
            <li>
              <strong>Semua data konseling</strong> (konseling table - no limit)
            </li>
            <li>Data siswa baru (siswa_baru table)</li>
            <li>Pengaturan sekolah (school_settings table)</li>
            <li>Pengumuman (announcement table)</li>
            <li>
              <strong>Jadwal guru</strong> (teacher_schedules table)
            </li>
            <li>
              <strong>Catatan perkembangan siswa</strong>{" "}
              (student_development_notes table)
            </li>
            <li>
              <strong>System health logs</strong> (system_health_logs table)
            </li>
            <li>
              <strong>Riwayat cleanup</strong> (cleanup_history table)
            </li>
            <li>
              <strong>Pengaturan SPMB</strong> (spmb_settings table)
            </li>
          </ul>
        </div>
      </div>

      {/* Database Restore */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Database Restore
        </h3>
        <p className="text-gray-600 mb-4">
          Upload dan restore backup database.{" "}
          <span className="text-red-600 font-medium">
            PERHATIAN: Ini akan menimpa semua data yang ada!
          </span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Backup File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          {restorePreview && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle
                  className="text-yellow-600 flex-shrink-0 mt-0.5"
                  size={16}
                />
                <div>
                  <h4 className="font-medium text-yellow-800">
                    Backup File Preview
                  </h4>
                  <div className="text-sm text-yellow-700 mt-2 space-y-1">
                    <p>
                      <strong>Tanggal Backup:</strong>{" "}
                      {new Date(restorePreview.timestamp).toLocaleString(
                        "id-ID"
                      )}
                    </p>
                    <p>
                      <strong>Tahun Ajaran:</strong>{" "}
                      {restorePreview.academic_year}
                    </p>
                    <p>
                      <strong>Sekolah:</strong>{" "}
                      {restorePreview.school_info?.school_name}
                    </p>
                    <p>
                      <strong>Data Records:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4">
                      <li>
                        {restorePreview.stats?.total_academic_years || 0} tahun
                        ajaran
                      </li>
                      <li>{restorePreview.stats?.total_users || 0} pengguna</li>
                      <li>
                        {restorePreview.stats?.total_teacher_assignments || 0}{" "}
                        penugasan guru
                      </li>
                      <li>{restorePreview.stats?.total_classes || 0} kelas</li>
                      <li>{restorePreview.stats?.total_students || 0} siswa</li>
                      <li>
                        {restorePreview.stats?.total_attendance_records || 0}{" "}
                        data kehadiran
                      </li>
                      <li>
                        {restorePreview.stats?.total_grades_records || 0} data
                        nilai
                      </li>
                      <li>
                        {restorePreview.stats?.total_konseling_records || 0}{" "}
                        data konseling
                      </li>
                      <li>
                        {restorePreview.stats?.total_siswa_baru || 0} siswa baru
                      </li>
                      <li>
                        {restorePreview.stats?.total_announcements || 0}{" "}
                        pengumuman
                      </li>
                      <li>
                        {restorePreview.stats?.total_teacher_schedules || 0}{" "}
                        jadwal guru
                      </li>
                      <li>
                        {restorePreview.stats?.total_development_notes || 0}{" "}
                        catatan perkembangan
                      </li>
                      <li>
                        {restorePreview.stats?.total_system_health_logs || 0}{" "}
                        system health logs
                      </li>
                      <li>
                        {restorePreview.stats?.total_cleanup_history || 0}{" "}
                        riwayat cleanup
                      </li>
                      <li>
                        {restorePreview.stats?.total_spmb_settings || 0}{" "}
                        pengaturan SPMB
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={executeRestore}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors">
                  {loading ? (
                    <>
                      <RefreshCw
                        className="animate-spin inline mr-2"
                        size={16}
                      />
                      Restoring...
                    </>
                  ) : (
                    "Execute Restore"
                  )}
                </button>

                <button
                  onClick={() => {
                    setRestoreFile(null);
                    setRestorePreview(null);
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Database size={20} className="text-blue-600" />
          Informasi Sistem
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Database
            </label>
            <p className="text-sm text-gray-600">Supabase PostgreSQL</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Records
            </label>
            <p className="text-sm text-gray-600">
              {schoolStats.total_students + schoolStats.total_teachers} pengguna
              total
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tahun Ajaran
            </label>
            <p className="text-sm text-gray-600">
              {schoolSettings.academic_year}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Sekolah
            </label>
            <p className="text-sm text-gray-600">
              {schoolSettings.school_name}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detail Records
            </label>
            <div className="flex gap-4 text-xs text-gray-600">
              <span>👨‍🏫 {schoolStats.total_teachers} guru</span>
              <span>👨‍🎓 {schoolStats.total_students} siswa</span>
              <span>🏫 SMP Muslimin Cililin</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Improvement Notes */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-green-800 mb-2">
          ✅ Improvements Applied
        </h4>
        <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
          <li>
            <strong>Added all missing tables:</strong> cleanup_history &
            spmb_settings
          </li>
          <li>
            <strong>Total 16 tables</strong> now supported for complete backup
          </li>
          <li>New export buttons for Cleanup History and SPMB Settings</li>
          <li>Updated backup process to include new tables</li>
          <li>Enhanced restore process for all 16 tables</li>
          <li>Updated backup preview with complete statistics</li>
          <li>Improved UI organization with additional table buttons</li>
        </ul>
      </div>
    </div>
  );
};

export default SystemTab;

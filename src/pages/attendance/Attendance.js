import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import AttendanceRecapModal from "../AttendanceRecapModal";
import AttendanceFilters from "./AttendanceFilters";
import AttendanceStats from "./AttendanceStats";
import AttendanceTable from "./AttendanceTable";
import AttendanceModals from "./AttendanceModals";
import {
  exportAttendanceToExcel,
  exportSemesterRecapFromComponent,
} from "../AttendanceExcel";

// Utility function outside component
const getDefaultDate = () => {
  const options = {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  return new Intl.DateTimeFormat("en-CA", options).format(new Date());
};

const Attendance = ({ user, onShowToast }) => {
  // ========== STATE MANAGEMENT ==========
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [date, setDate] = useState(getDefaultDate());
  const [students, setStudents] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [attendanceNotes, setAttendanceNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [teacherId, setTeacherId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHomeroomTeacher, setIsHomeroomTeacher] = useState(false);
  const [homeroomClass, setHomeroomClass] = useState(null);
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [existingAttendanceData, setExistingAttendanceData] = useState(null);
  const [pendingAttendanceData, setPendingAttendanceData] = useState(null);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMonthlyModal, setShowExportMonthlyModal] = useState(false);
  const [showExportSemesterModal, setShowExportSemesterModal] = useState(false);

  // ========== UTILITY FUNCTIONS ==========
  const isHomeroomDaily = useCallback(() => {
    return selectedSubject && selectedSubject.includes("PRESENSI HARIAN");
  }, [selectedSubject]);

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ========== CORE HANDLERS ==========
  const setAllHadir = () => {
    if (students.length === 0) {
      if (onShowToast) {
        onShowToast("Tidak ada siswa untuk diset hadir", "error");
      }
      return;
    }

    const newStatus = {};
    students.forEach((student) => {
      newStatus[student.id] = "Hadir";
    });
    setAttendanceStatus(newStatus);

    if (onShowToast) {
      onShowToast(
        `Berhasil mengubah status ${students.length} siswa menjadi HADIR`,
        "success"
      );
    }
  };

  const handleExportMonthly = () => {
    if (students.length === 0) {
      if (onShowToast) {
        onShowToast("Tidak ada data siswa untuk diekspor", "error");
      }
      return;
    }
    setShowExportMonthlyModal(true);
  };

  const handleExportSemester = () => {
    if (!selectedClass || !selectedSubject || students.length === 0) {
      if (onShowToast) {
        onShowToast(
          "Pilih mata pelajaran dan kelas terlebih dahulu untuk export semester",
          "error"
        );
      }
      return;
    }
    setShowExportSemesterModal(true);
  };

  const processMonthlyExport = async (yearMonth) => {
    if (!yearMonth) return;

    try {
      await exportAttendanceToExcel(
        students,
        selectedClass,
        selectedSubject,
        date,
        attendanceStatus,
        attendanceNotes,
        (message) => {
          if (onShowToast) {
            onShowToast(`Ekspor Excel berhasil: ${message}`, "success");
          }
        },
        null,
        user?.full_name || user?.username,
        homeroomClass
      );
    } catch (error) {
      if (onShowToast) {
        onShowToast(
          "Gagal mengekspor data ke Excel: " + error.message,
          "error"
        );
      }
    }
  };

  const processSemesterExport = async (semester, year) => {
    setExportLoading(true);
    try {
      const classId = selectedClass;
      const subject = isHomeroomDaily() ? "Harian" : selectedSubject;
      const type = isHomeroomDaily() ? "harian" : "mapel";
      const semesterNum = semester === "ganjil" ? 1 : 2;

      const result = await exportSemesterRecapFromComponent(
        classId,
        semesterNum,
        year,
        students,
        subject,
        type,
        user,
        homeroomClass
      );

      if (result.success) {
        if (onShowToast) {
          onShowToast(result.message, "success");
        }
      } else {
        if (onShowToast) {
          onShowToast(result.message, "error");
        }
      }
    } catch (error) {
      console.error("Error exporting semester data:", error);
      if (onShowToast) {
        onShowToast(
          "Gagal mengekspor data semester: " + error.message,
          "error"
        );
      }
    } finally {
      setExportLoading(false);
      setShowExportSemesterModal(false);
    }
  };

  const handleShowRekap = () => {
    if (!selectedClass || !selectedSubject || students.length === 0) {
      if (onShowToast) {
        onShowToast(
          "Pilih mata pelajaran dan kelas terlebih dahulu untuk melihat rekap",
          "error"
        );
      }
      return;
    }
    setShowRekapModal(true);
  };

  // ========== DATA FETCHING EFFECTS ==========
  useEffect(() => {
    if (user?.role === "admin" || !teacherId) return;

    const channel = supabase
      .channel(`attendance-${teacherId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendances",
        },
        () => {
          if (onShowToast) {
            onShowToast("Presensi Baru Ditambahkan", "info");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId, user, onShowToast]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (user) {
          if (user.role === "admin") {
            console.log("✅ Admin access granted to Attendance page");
            setAuthLoading(false);
            return;
          }

          const { data: teacherData, error: teacherError } = await supabase
            .from("users")
            .select("teacher_id, homeroom_class_id")
            .eq("username", user.username)
            .single();

          if (teacherError) {
            console.error("Error fetching teacher data:", teacherError);
            setMessage("Error: Data guru tidak ditemukan");
          } else if (teacherData) {
            setTeacherId(teacherData.teacher_id);
            if (teacherData.homeroom_class_id) {
              setIsHomeroomTeacher(true);
              setHomeroomClass(teacherData.homeroom_class_id);
            }
          }
        } else {
          setMessage("Silakan login terlebih dahulu");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setMessage("Error: Terjadi kesalahan sistem");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [user]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (user?.role === "admin") {
        console.log("ℹ️ Admin mode: Subjects not loaded");
        return;
      }

      if (!teacherId) return;

      try {
        const { data, error } = await supabase
          .from("teacher_assignments")
          .select("subject")
          .eq("teacher_id", teacherId);

        if (error) {
          console.error("Error fetching subjects:", error);
          setMessage("Error: Gagal mengambil mata pelajaran");
          return;
        }

        const uniqueSubjects = [...new Set(data.map((item) => item.subject))];

        if (isHomeroomTeacher && homeroomClass) {
          uniqueSubjects.push(`PRESENSI HARIAN KELAS ${homeroomClass}`);
        }

        setSubjects(uniqueSubjects);
      } catch (error) {
        console.error("Error in fetchSubjects:", error);
        setMessage("Error: Terjadi kesalahan sistem");
      }
    };

    fetchSubjects();
  }, [teacherId, isHomeroomTeacher, homeroomClass, user]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (user?.role === "admin") {
        console.log("ℹ️ Admin mode: Classes not loaded");
        return;
      }

      if (!selectedSubject || !teacherId) {
        setClasses([]);
        return;
      }

      setMessage("");

      try {
        const isDailyMode = selectedSubject.includes("PRESENSI HARIAN");

        if (isDailyMode) {
          if (!homeroomClass) return;

          const formattedClasses = [
            {
              id: homeroomClass,
              grade: homeroomClass.charAt(0),
              displayName: `Kelas ${homeroomClass}`,
            },
          ];

          setClasses(formattedClasses);
          setSelectedClass(homeroomClass);

          setLoading(true);
          const { data: studentsData, error: studentsError } = await supabase
            .from("students")
            .select("id, full_name, nis")
            .eq("class_id", homeroomClass)
            .eq("is_active", true)
            .order("full_name");

          if (studentsError) {
            setMessage(
              "Error: Gagal mengambil data siswa - " + studentsError.message
            );
          } else {
            setStudents(studentsData || []);
            setStudentsLoaded(true);

            const newStatus = {};
            studentsData?.forEach((student) => {
              newStatus[student.id] = "Hadir";
            });
            setAttendanceStatus(newStatus);
          }
          setLoading(false);
          return;
        }

        const { data: activeYear } = await supabase
          .from("academic_years")
          .select("year, semester")
          .eq("is_active", true)
          .single();

        const { data: assignmentData, error: assignmentError } = await supabase
          .from("teacher_assignments")
          .select("class_id")
          .eq("teacher_id", teacherId)
          .eq("subject", selectedSubject)
          .eq("academic_year", activeYear?.year)
          .eq("semester", activeYear?.semester);

        if (assignmentError) throw assignmentError;
        if (!assignmentData?.length) {
          setClasses([]);
          setMessage("Tidak ada kelas untuk mata pelajaran ini");
          return;
        }

        const classIds = assignmentData.map((item) => item.class_id);
        const { data: classData, error: classError } = await supabase
          .from("classes")
          .select("id, grade")
          .in("id", classIds);

        if (classError) throw classError;

        const formattedClasses = classData.map((cls) => ({
          id: cls.id,
          grade: cls.grade,
          displayName: `Kelas ${cls.id}`,
        }));

        setClasses(formattedClasses);
        setSelectedClass("");
        setStudents([]);
        setStudentsLoaded(false);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setMessage("Error: Gagal mengambil data kelas - " + error.message);
      }
    };

    fetchClasses();
  }, [selectedSubject, teacherId, isHomeroomTeacher, homeroomClass, user]);

  useEffect(() => {
    if (selectedClass && !isHomeroomDaily()) {
      fetchStudentsForClass(selectedClass);
    }
  }, [selectedClass]);

  const fetchStudentsForClass = async (classId) => {
    if (!classId) {
      setStudents([]);
      return;
    }

    try {
      setLoading(true);
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, full_name, nis")
        .eq("class_id", classId)
        .eq("is_active", true)
        .order("full_name");

      if (studentsError) throw studentsError;

      setStudents(studentsData || []);
      setStudentsLoaded(true);

      const newStatus = {};
      studentsData.forEach((student) => {
        newStatus[student.id] = "Hadir";
      });
      setAttendanceStatus(newStatus);
    } catch (error) {
      console.error("Error fetching students:", error);
      setMessage("Error: Gagal mengambil data siswa - " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== ATTENDANCE PROCESSING ==========
  const handleStatusChange = (studentId, status) => {
    setAttendanceStatus((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleNotesChange = (studentId, notes) => {
    setAttendanceNotes((prev) => ({ ...prev, [studentId]: notes }));
  };

  const checkExistingAttendance = async (teacherUUID, typeValue) => {
    try {
      const { data: existingData, error } = await supabase
        .from("attendances")
        .select("id, student_id, status, notes")
        .eq("teacher_id", teacherUUID)
        .eq("date", date)
        .eq("type", typeValue)
        .eq("class_id", selectedClass)
        .in(
          "student_id",
          students.map((s) => s.id)
        );

      if (error) {
        console.error("Error checking existing attendance:", error);
        return null;
      }

      return existingData || [];
    } catch (error) {
      console.error("Error in checkExistingAttendance:", error);
      return null;
    }
  };

  const prepareAttendanceData = (teacherUUID) => {
    const subjectValue = isHomeroomDaily() ? "Harian" : selectedSubject;
    const typeValue = isHomeroomDaily() ? "harian" : "mapel";

    return students.map((student) => ({
      student_id: student.id,
      teacher_id: teacherUUID,
      date: date,
      subject: subjectValue,
      class_id: selectedClass,
      type: typeValue,
      status: attendanceStatus[student.id] || "Hadir",
      notes: attendanceNotes[student.id] || null,
    }));
  };

  const deleteExistingAttendance = async (teacherUUID, typeValue) => {
    try {
      const { error } = await supabase
        .from("attendances")
        .delete()
        .eq("teacher_id", teacherUUID)
        .eq("date", date)
        .eq("type", typeValue)
        .eq("class_id", selectedClass);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting existing attendance:", error);
      throw error;
    }
  };

  const saveAttendanceData = async (attendanceData) => {
    const BATCH_SIZE = 5;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < attendanceData.length; i += BATCH_SIZE) {
      const batch = attendanceData.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("attendances").insert(batch);

      if (error) {
        console.error(
          `Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
          error
        );
        errorCount += batch.length;
      } else {
        successCount += batch.length;
      }
    }

    return { successCount, errorCount };
  };

  const processAttendanceSubmission = async () => {
    if (!teacherId || !selectedSubject || !selectedClass) {
      if (onShowToast) {
        onShowToast("Pilih mata pelajaran dan kelas terlebih dahulu!", "error");
      }
      return;
    }

    if (students.length === 0) {
      if (onShowToast) {
        onShowToast("Tidak ada siswa untuk diabsen!", "error");
      }
      return;
    }

    setLoading(true);

    try {
      const { data: teacherUser, error: teacherError } = await supabase
        .from("users")
        .select("id")
        .eq("teacher_id", teacherId)
        .single();

      if (teacherError)
        throw new Error("Gagal mengambil data guru: " + teacherError.message);
      if (!teacherUser) throw new Error("Data guru tidak ditemukan di sistem");

      const teacherUUID = teacherUser.id;
      const typeValue = isHomeroomDaily() ? "harian" : "mapel";

      const existingData = await checkExistingAttendance(
        teacherUUID,
        typeValue
      );

      if (existingData && existingData.length > 0) {
        const attendanceData = prepareAttendanceData(teacherUUID);
        setPendingAttendanceData(attendanceData);
        setExistingAttendanceData(existingData);
        setShowConfirmModal(true);
        setLoading(false);
        return;
      }

      const attendanceData = prepareAttendanceData(teacherUUID);
      const { successCount, errorCount } = await saveAttendanceData(
        attendanceData
      );

      if (errorCount > 0) {
        throw new Error(
          `Berhasil menyimpan ${successCount} data, gagal ${errorCount} data.`
        );
      }

      handleSaveSuccess(successCount);
    } catch (error) {
      console.error("Error saving attendance:", error);
      if (onShowToast) {
        onShowToast("Gagal menyimpan presensi: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOverwriteConfirmation = async () => {
    setLoading(true);
    setShowConfirmModal(false);

    try {
      const { data: teacherUser, error: teacherError } = await supabase
        .from("users")
        .select("id")
        .eq("teacher_id", teacherId)
        .single();

      if (teacherError)
        throw new Error("Gagal mengambil data guru: " + teacherError.message);
      if (!teacherUser) throw new Error("Data guru tidak ditemukan di sistem");

      const teacherUUID = teacherUser.id;
      const typeValue = isHomeroomDaily() ? "harian" : "mapel";

      await deleteExistingAttendance(teacherUUID, typeValue);
      const { successCount, errorCount } = await saveAttendanceData(
        pendingAttendanceData
      );

      if (errorCount > 0) {
        throw new Error(
          `Berhasil menyimpan ${successCount} data, gagal ${errorCount} data.`
        );
      }

      handleSaveSuccess(successCount);
    } catch (error) {
      console.error("Error overwriting attendance:", error);
      if (onShowToast) {
        onShowToast("Gagal menimpa presensi: " + error.message, "error");
      }
    } finally {
      setLoading(false);
      setPendingAttendanceData(null);
      setExistingAttendanceData(null);
    }
  };

  const handleCancelOverwrite = () => {
    setShowConfirmModal(false);
    setPendingAttendanceData(null);
    setExistingAttendanceData(null);

    if (onShowToast) {
      onShowToast("Penyimpanan dibatalkan", "info");
    }
  };

  const handleSaveSuccess = (successCount) => {
    if (onShowToast) {
      onShowToast(
        `Presensi berhasil disimpan untuk ${successCount} siswa pada ${
          isHomeroomDaily() ? "presensi harian" : selectedSubject
        } tanggal ${date}`,
        "success"
      );
    }

    const newStatus = {};
    students.forEach((student) => {
      newStatus[student.id] = "Hadir";
    });
    setAttendanceStatus(newStatus);
    setAttendanceNotes({});
  };

  // ========== RENDER LOGIC ==========
  if (authLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-blue-500 text-lg">Memeriksa autentikasi...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 text-lg">
            Anda harus login untuk mengakses halaman ini
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-2">
                Input Presensi
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Kelola Kehadiran Siswa Untuk Mata Pelajaran Dan Kelas
              </p>
            </div>
            <div className="sm:text-right">
              <div className="text-slate-800 font-medium text-sm sm:text-base">
                {user?.full_name || user?.username}
              </div>
              <div className="flex gap-2 mt-2">
                {isHomeroomTeacher && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Wali Kelas {homeroomClass}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Component */}
      <AttendanceFilters
        subjects={subjects}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        classes={classes}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        date={date}
        setDate={setDate}
        loading={loading}
        teacherId={teacherId}
        isHomeroomDaily={isHomeroomDaily}
        setStudents={setStudents}
        setStudentsLoaded={setStudentsLoaded}
      />

      {/* Conditional Rendering */}
      {students.length > 0 && (
        <>
          {/* Stats Component */}
          <AttendanceStats
            attendanceStatus={attendanceStatus}
            students={students}
          />

          {/* Action Buttons & Table */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="relative flex-grow min-w-full sm:min-w-[250px]">
              <input
                type="text"
                placeholder="Cari siswa (nama/NIS)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-full"
              />
              <span className="absolute right-3 top-2.5 sm:top-2 text-slate-400 text-lg">
                🔍
              </span>
            </div>

            <button
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              onClick={setAllHadir}
              disabled={loading}
              style={{ minHeight: "44px" }}>
              ✅ Hadir Semua
            </button>

            <button
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium touch-manipulation"
              onClick={processAttendanceSubmission}
              disabled={
                loading ||
                !selectedSubject ||
                !selectedClass ||
                students.length === 0
              }
              style={{ minHeight: "44px" }}>
              {loading ? "Menyimpan..." : "💾 Simpan Presensi"}
            </button>

            <button
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              onClick={handleShowRekap}
              disabled={
                !selectedClass || !selectedSubject || students.length === 0
              }
              style={{ minHeight: "44px" }}>
              📊 Lihat Rekap
            </button>

            <button
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-orange-50 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              onClick={handleExportMonthly}
              disabled={students.length === 0}
              style={{ minHeight: "44px" }}>
              📅 Export Bulanan
            </button>

            <button
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              onClick={handleExportSemester}
              disabled={
                !selectedClass || !selectedSubject || students.length === 0
              }
              style={{ minHeight: "44px" }}>
              📚 Export Semester
            </button>
          </div>

          {/* Table Component */}
          <AttendanceTable
            filteredStudents={filteredStudents}
            classes={classes}
            selectedClass={selectedClass}
            searchTerm={searchTerm}
            attendanceStatus={attendanceStatus}
            attendanceNotes={attendanceNotes}
            loading={loading}
            handleStatusChange={handleStatusChange}
            handleNotesChange={handleNotesChange}
          />
        </>
      )}

      {/* Empty States */}
      {selectedClass && students.length === 0 && !loading && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center text-slate-500">
          <p>Tidak ada siswa aktif di kelas ini</p>
        </div>
      )}

      {!selectedClass &&
        selectedSubject &&
        classes.length === 0 &&
        !isHomeroomDaily() && (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center text-slate-500">
            <p>Tidak ada kelas untuk mata pelajaran ini</p>
          </div>
        )}

      {!selectedSubject && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center text-slate-500">
          <p>Pilih mata pelajaran untuk memulai</p>
        </div>
      )}

      {/* Modals Component */}
      <AttendanceModals
        showRekapModal={showRekapModal}
        setShowRekapModal={setShowRekapModal}
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        showExportMonthlyModal={showExportMonthlyModal}
        setShowExportMonthlyModal={setShowExportMonthlyModal}
        showExportSemesterModal={showExportSemesterModal}
        setShowExportSemesterModal={setShowExportSemesterModal}
        exportLoading={exportLoading}
        selectedClass={selectedClass}
        selectedSubject={selectedSubject}
        homeroomClass={homeroomClass}
        students={students}
        onShowToast={onShowToast}
        isHomeroomDaily={isHomeroomDaily}
        existingAttendanceData={existingAttendanceData}
        pendingAttendanceData={pendingAttendanceData}
        loading={loading}
        date={date}
        handleOverwriteConfirmation={handleOverwriteConfirmation}
        handleCancelOverwrite={handleCancelOverwrite}
        processMonthlyExport={processMonthlyExport}
        processSemesterExport={processSemesterExport}
      />

      {/* External Recap Modal */}
      <AttendanceRecapModal
        showModal={showRekapModal}
        onClose={() => setShowRekapModal(false)}
        attendanceMode={isHomeroomDaily() ? "daily" : "subject"}
        selectedClass={selectedClass}
        selectedSubject={selectedSubject}
        homeroomClass={homeroomClass}
        students={students}
        onShowToast={onShowToast}
      />
    </div>
  );
};

export default Attendance;

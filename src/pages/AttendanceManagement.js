import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AttendanceManagement = ({ user, onShowToast }) => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attendanceDates, setAttendanceDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isHomeroomTeacher, setIsHomeroomTeacher] = useState(false);
  const [homeroomClass, setHomeroomClass] = useState(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangeDateModal, setShowChangeDateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState(null);
  const [studentsAttendance, setStudentsAttendance] = useState([]);
  const [editedStatus, setEditedStatus] = useState({});
  const [editedNotes, setEditedNotes] = useState({});
  const [newDate, setNewDate] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalDates, setTotalDates] = useState(0);

  // Filter states
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const months = [
    { value: "", label: "Semua Bulan" },
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const isHomeroomDaily = () => {
    return selectedSubject && selectedSubject.includes("PRESENSI HARIAN");
  };

  // Format date to Indonesian format
  const formatDateToIndonesian = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return dateString; // Already in YYYY-MM-DD format
  };

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (user) {
          const { data: teacherData, error: teacherError } = await supabase
            .from("users")
            .select("teacher_id, homeroom_class_id")
            .eq("username", user.username)
            .single();

          if (teacherError) {
            console.error("Error fetching teacher data:", teacherError);
          } else if (teacherData) {
            setTeacherId(teacherData.teacher_id);
            if (teacherData.homeroom_class_id) {
              setIsHomeroomTeacher(true);
              setHomeroomClass(teacherData.homeroom_class_id);
            }
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [user]);

  // Fetch academic years and semesters
  useEffect(() => {
    const fetchAcademicData = async () => {
      try {
        const { data: academicData, error } = await supabase
          .from("academic_years")
          .select("year, semester")
          .order("year", { ascending: false })
          .order("semester", { ascending: false });

        if (error) throw error;

        if (academicData && academicData.length > 0) {
          const uniqueSemesters = academicData.map((item) => ({
            value: `${item.year}-${item.semester}`,
            label: `Tahun Ajaran ${item.year} - Semester ${item.semester}`,
          }));

          setSemesters(uniqueSemesters);

          // Set default to current active semester
          const { data: activeYear } = await supabase
            .from("academic_years")
            .select("year, semester")
            .eq("is_active", true)
            .single();

          if (activeYear) {
            const activeSemester = `${activeYear.year}-${activeYear.semester}`;
            setSelectedSemester(activeSemester);
            setAcademicYear(activeYear.year);
          }
        }
      } catch (error) {
        console.error("Error fetching academic data:", error);
      }
    };

    fetchAcademicData();
  }, []);

  // Fetch subjects based on semester
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!teacherId || !selectedSemester) return;

      try {
        const [year, semester] = selectedSemester.split("-");

        const { data, error } = await supabase
          .from("teacher_assignments")
          .select("subject")
          .eq("teacher_id", teacherId)
          .eq("academic_year", year)
          .eq("semester", semester);

        if (error) {
          console.error("Error fetching subjects:", error);
          return;
        }

        const uniqueSubjects = [...new Set(data.map((item) => item.subject))];

        if (isHomeroomTeacher && homeroomClass) {
          uniqueSubjects.push(`PRESENSI HARIAN KELAS ${homeroomClass}`);
        }

        setSubjects(uniqueSubjects);
      } catch (error) {
        console.error("Error in fetchSubjects:", error);
      }
    };

    fetchSubjects();
  }, [teacherId, isHomeroomTeacher, homeroomClass, selectedSemester]);

  // Fetch classes based on semester
  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedSubject || !teacherId || !selectedSemester) {
        setClasses([]);
        return;
      }

      try {
        const isDailyMode = selectedSubject.includes("PRESENSI HARIAN");
        const [year, semester] = selectedSemester.split("-");

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
          return;
        }

        const { data: assignmentData, error: assignmentError } = await supabase
          .from("teacher_assignments")
          .select("class_id")
          .eq("teacher_id", teacherId)
          .eq("subject", selectedSubject)
          .eq("academic_year", year)
          .eq("semester", semester);

        if (assignmentError) throw assignmentError;
        if (!assignmentData?.length) {
          setClasses([]);
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
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();
  }, [
    selectedSubject,
    teacherId,
    isHomeroomTeacher,
    homeroomClass,
    selectedSemester,
  ]);

  // Fetch ALL unique dates without pagination first
  const fetchAllUniqueDates = async () => {
    if (!selectedClass || !selectedSubject || !teacherId || !selectedSemester) {
      return [];
    }

    try {
      const [year, semester] = selectedSemester.split("-");
      const { data: teacherUser, error: teacherError } = await supabase
        .from("users")
        .select("id")
        .eq("teacher_id", teacherId)
        .single();

      if (teacherError) throw teacherError;

      const subjectValue = isHomeroomDaily() ? "Harian" : selectedSubject;
      const typeValue = isHomeroomDaily() ? "harian" : "mapel";

      console.log("🔍 Fetching all unique dates with params:", {
        teacher_id: teacherUser.id,
        class_id: selectedClass,
        subject: subjectValue,
        type: typeValue,
        academic_year: year,
        semester: semester,
      });

      // 🔥 PERBAIKAN: Gunakan approach yang lebih reliable untuk mengambil semua data
      let allDates = [];
      let page = 0;
      const pageSize = 1000; // Ambil banyak data sekaligus
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: datesData, error: datesError } = await supabase
          .from("attendances")
          .select("date", { count: "exact" })
          .eq("teacher_id", teacherUser.id)
          .eq("class_id", selectedClass)
          .eq("subject", subjectValue)
          .eq("type", typeValue)
          .order("date", { ascending: false })
          .range(from, to);

        if (datesError) {
          console.error("Error fetching dates batch:", datesError);
          throw datesError;
        }

        if (!datesData || datesData.length === 0) {
          hasMore = false;
        } else {
          allDates = [...allDates, ...datesData];
          page++;

          // Jika jumlah data kurang dari pageSize, berarti sudah habis
          if (datesData.length < pageSize) {
            hasMore = false;
          }
        }
      }

      // Extract unique dates
      const uniqueDates = [...new Set(allDates.map((item) => item.date))];

      // Apply month filter if selected
      let filteredDates = uniqueDates;
      if (selectedMonth) {
        filteredDates = uniqueDates.filter((date) => {
          const dateMonth = date.split("-")[1]; // Extract month from YYYY-MM-DD
          return dateMonth === selectedMonth;
        });
      }

      // Sort dates in descending order (newest first)
      filteredDates.sort((a, b) => new Date(b) - new Date(a));

      console.log("📊 Raw dates data count:", allDates.length);
      console.log("📅 Unique dates found:", uniqueDates.length);
      console.log("📅 Filtered dates:", filteredDates.length);
      console.log("📅 Sample dates:", filteredDates.slice(0, 5));

      return filteredDates;
    } catch (error) {
      console.error("Error fetching all unique dates:", error);
      throw error;
    }
  };

  // Fetch attendance dates with pagination
  useEffect(() => {
    const fetchAttendanceDates = async () => {
      if (
        !selectedClass ||
        !selectedSubject ||
        !teacherId ||
        !selectedSemester
      ) {
        setAttendanceDates([]);
        setTotalDates(0);
        return;
      }

      setLoading(true);
      try {
        // First, get ALL unique dates
        const allUniqueDates = await fetchAllUniqueDates();
        setTotalDates(allUniqueDates.length);

        if (allUniqueDates.length === 0) {
          setAttendanceDates([]);
          setLoading(false);
          return;
        }

        // Apply pagination to the unique dates
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedDates = allUniqueDates.slice(startIndex, endIndex);

        console.log(
          "📅 Paginated dates:",
          paginatedDates.length,
          "out of",
          allUniqueDates.length
        );

        // Now fetch stats for paginated dates
        const [year, semester] = selectedSemester.split("-");
        const { data: teacherUser } = await supabase
          .from("users")
          .select("id")
          .eq("teacher_id", teacherId)
          .single();

        const subjectValue = isHomeroomDaily() ? "Harian" : selectedSubject;
        const typeValue = isHomeroomDaily() ? "harian" : "mapel";

        const dateStats = await Promise.all(
          paginatedDates.map(async (date) => {
            const { data: records, error: recordsError } = await supabase
              .from("attendances")
              .select("status")
              .eq("teacher_id", teacherUser.id)
              .eq("class_id", selectedClass)
              .eq("date", date)
              .eq("subject", subjectValue)
              .eq("type", typeValue);

            if (recordsError) {
              console.error(
                `Error fetching records for date ${date}:`,
                recordsError
              );
              return {
                date,
                hadir: 0,
                sakit: 0,
                izin: 0,
                alpa: 0,
                total: 0,
                error: true,
              };
            }

            const stats = {
              date,
              hadir: 0,
              sakit: 0,
              izin: 0,
              alpa: 0,
              total: records?.length || 0,
            };

            records?.forEach((r) => {
              const status = r.status?.toLowerCase();
              if (status === "hadir") stats.hadir++;
              else if (status === "sakit") stats.sakit++;
              else if (status === "izin") stats.izin++;
              else if (status === "alpa") stats.alpa++;
            });

            return stats;
          })
        );

        // Filter out any errored results
        const validStats = dateStats.filter((stat) => !stat.error);
        setAttendanceDates(validStats);
      } catch (error) {
        console.error("Error fetching attendance dates:", error);
        if (onShowToast) {
          onShowToast("Gagal memuat data presensi: " + error.message, "error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceDates();
  }, [
    selectedClass,
    selectedSubject,
    teacherId,
    currentPage,
    itemsPerPage,
    selectedSemester,
    selectedMonth,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedSubject, selectedSemester, selectedMonth]);

  // Pagination functions
  const totalPages = Math.ceil(totalDates / itemsPerPage);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Refresh data function
  const refreshData = async () => {
    if (!selectedClass || !selectedSubject || !teacherId || !selectedSemester)
      return;

    setLoading(true);
    try {
      const allUniqueDates = await fetchAllUniqueDates();
      setTotalDates(allUniqueDates.length);

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedDates = allUniqueDates.slice(startIndex, endIndex);

      const [year, semester] = selectedSemester.split("-");
      const { data: teacherUser } = await supabase
        .from("users")
        .select("id")
        .eq("teacher_id", teacherId)
        .single();

      const subjectValue = isHomeroomDaily() ? "Harian" : selectedSubject;
      const typeValue = isHomeroomDaily() ? "harian" : "mapel";

      const dateStats = await Promise.all(
        paginatedDates.map(async (date) => {
          const { data: records } = await supabase
            .from("attendances")
            .select("status")
            .eq("teacher_id", teacherUser.id)
            .eq("class_id", selectedClass)
            .eq("date", date)
            .eq("subject", subjectValue)
            .eq("type", typeValue);

          const stats = {
            date,
            hadir: 0,
            sakit: 0,
            izin: 0,
            alpa: 0,
            total: records?.length || 0,
          };

          records?.forEach((r) => {
            const status = r.status?.toLowerCase();
            if (status === "hadir") stats.hadir++;
            else if (status === "sakit") stats.sakit++;
            else if (status === "izin") stats.izin++;
            else if (status === "alpa") stats.alpa++;
          });

          return stats;
        })
      );

      setAttendanceDates(dateStats);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit
  const handleEdit = async (dateData) => {
    setLoading(true);
    try {
      const [year, semester] = selectedSemester.split("-");
      const { data: teacherUser } = await supabase
        .from("users")
        .select("id")
        .eq("teacher_id", teacherId)
        .single();

      const subjectValue = isHomeroomDaily() ? "Harian" : selectedSubject;
      const typeValue = isHomeroomDaily() ? "harian" : "mapel";

      // Fetch attendance records with student info
      const { data: attendanceRecords, error } = await supabase
        .from("attendances")
        .select(
          `
          id,
          student_id,
          status,
          notes,
          students (
            id,
            full_name,
            nis
          )
        `
        )
        .eq("teacher_id", teacherUser.id)
        .eq("class_id", selectedClass)
        .eq("date", dateData.date)
        .eq("subject", subjectValue)
        .eq("type", typeValue)
        .order("students(full_name)");

      if (error) throw error;

      setStudentsAttendance(attendanceRecords);

      // Initialize edited states
      const statusMap = {};
      const notesMap = {};
      attendanceRecords.forEach((record) => {
        statusMap[record.id] = record.status;
        notesMap[record.id] = record.notes || "";
      });
      setEditedStatus(statusMap);
      setEditedNotes(notesMap);

      setSelectedDateData(dateData);
      setShowEditModal(true);
    } catch (error) {
      console.error("Error loading attendance for edit:", error);
      if (onShowToast) {
        onShowToast("Gagal memuat data untuk edit: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Edit
  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      // Update each record
      const updates = studentsAttendance.map((record) => {
        return supabase
          .from("attendances")
          .update({
            status: editedStatus[record.id],
            notes: editedNotes[record.id] || null,
          })
          .eq("id", record.id);
      });

      await Promise.all(updates);

      if (onShowToast) {
        onShowToast("Presensi berhasil diupdate!", "success");
      }

      setShowEditModal(false);
      // Refresh data
      await refreshData();
    } catch (error) {
      console.error("Error saving edit:", error);
      if (onShowToast) {
        onShowToast("Gagal menyimpan perubahan: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Change Date
  const handleChangeDate = (dateData) => {
    setSelectedDateData(dateData);
    setNewDate(dateData.date);
    setShowChangeDateModal(true);
  };

  // Handle Save Change Date
  const handleSaveChangeDate = async () => {
    if (!newDate) {
      if (onShowToast) {
        onShowToast("Pilih tanggal baru terlebih dahulu!", "error");
      }
      return;
    }

    if (newDate === selectedDateData.date) {
      if (onShowToast) {
        onShowToast("Tanggal baru sama dengan tanggal lama!", "error");
      }
      return;
    }

    setLoading(true);
    try {
      const [year, semester] = selectedSemester.split("-");
      const { data: teacherUser } = await supabase
        .from("users")
        .select("id")
        .eq("teacher_id", teacherId)
        .single();

      const subjectValue = isHomeroomDaily() ? "Harian" : selectedSubject;
      const typeValue = isHomeroomDaily() ? "harian" : "mapel";

      // Check if attendance exists on new date
      const { data: existingData } = await supabase
        .from("attendances")
        .select("id")
        .eq("teacher_id", teacherUser.id)
        .eq("class_id", selectedClass)
        .eq("date", newDate)
        .eq("subject", subjectValue)
        .eq("type", typeValue)
        .limit(1);

      if (existingData && existingData.length > 0) {
        if (onShowToast) {
          onShowToast(
            `Presensi sudah ada pada tanggal ${newDate}! Hapus dulu atau pilih tanggal lain.`,
            "error"
          );
        }
        setLoading(false);
        return;
      }

      // Update all records
      const { error } = await supabase
        .from("attendances")
        .update({ date: newDate })
        .eq("teacher_id", teacherUser.id)
        .eq("class_id", selectedClass)
        .eq("date", selectedDateData.date)
        .eq("subject", subjectValue)
        .eq("type", typeValue);

      if (error) throw error;

      if (onShowToast) {
        onShowToast(
          `Tanggal berhasil diubah dari ${selectedDateData.date} ke ${newDate}`,
          "success"
        );
      }

      setShowChangeDateModal(false);
      await refreshData();
    } catch (error) {
      console.error("Error changing date:", error);
      if (onShowToast) {
        onShowToast("Gagal mengubah tanggal: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = (dateData) => {
    setSelectedDateData(dateData);
    setShowDeleteModal(true);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      const [year, semester] = selectedSemester.split("-");
      const { data: teacherUser } = await supabase
        .from("users")
        .select("id")
        .eq("teacher_id", teacherId)
        .single();

      const subjectValue = isHomeroomDaily() ? "Harian" : selectedSubject;
      const typeValue = isHomeroomDaily() ? "harian" : "mapel";

      const { error } = await supabase
        .from("attendances")
        .delete()
        .eq("teacher_id", teacherUser.id)
        .eq("class_id", selectedClass)
        .eq("date", selectedDateData.date)
        .eq("subject", subjectValue)
        .eq("type", typeValue);

      if (error) throw error;

      if (onShowToast) {
        onShowToast(
          `Presensi tanggal ${selectedDateData.date} berhasil dihapus!`,
          "success"
        );
      }

      setShowDeleteModal(false);
      await refreshData();
    } catch (error) {
      console.error("Error deleting attendance:", error);
      if (onShowToast) {
        onShowToast("Gagal menghapus presensi: " + error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit Modal
  const EditModal = () => {
    if (!showEditModal) return null;

    const getAttendanceStats = () => {
      const stats = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
      Object.values(editedStatus).forEach((status) => {
        if (stats[status] !== undefined) stats[status]++;
      });
      return stats;
    };

    const stats = getAttendanceStats();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Edit Presensi</h2>
              <p className="text-blue-100 text-sm">
                Tanggal: {formatDateToIndonesian(selectedDateData?.date)} |{" "}
                {selectedSubject}
              </p>
            </div>
            <button
              onClick={() => setShowEditModal(false)}
              className="p-2 hover:bg-blue-600 rounded-lg transition">
              <svg
                className="w-6 h-6"
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

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 p-4 bg-slate-50">
            <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-green-500">
              <div className="text-2xl font-bold text-slate-800">
                {stats.Hadir}
              </div>
              <div className="text-xs text-slate-600">Hadir</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-yellow-500">
              <div className="text-2xl font-bold text-slate-800">
                {stats.Sakit}
              </div>
              <div className="text-xs text-slate-600">Sakit</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
              <div className="text-2xl font-bold text-slate-800">
                {stats.Izin}
              </div>
              <div className="text-xs text-slate-600">Izin</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-red-500">
              <div className="text-2xl font-bold text-slate-800">
                {stats.Alpa}
              </div>
              <div className="text-xs text-slate-600">Alpa</div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {studentsAttendance.map((record, index) => (
                <div
                  key={record.id}
                  className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-slate-900">
                        {index + 1}. {record.students?.full_name}
                      </div>
                      <div className="text-sm text-slate-600">
                        NIS: {record.students?.nis}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-2 block">
                        Status Kehadiran
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {["Hadir", "Sakit", "Izin", "Alpa"].map((status) => (
                          <button
                            key={status}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                              editedStatus[record.id] === status
                                ? status === "Hadir"
                                  ? "bg-green-500 text-white"
                                  : status === "Sakit"
                                  ? "bg-yellow-500 text-white"
                                  : status === "Izin"
                                  ? "bg-blue-500 text-white"
                                  : "bg-red-500 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                            onClick={() =>
                              setEditedStatus((prev) => ({
                                ...prev,
                                [record.id]: status,
                              }))
                            }>
                            {status === "Hadir"
                              ? "✓"
                              : status === "Sakit"
                              ? "🏥"
                              : status === "Izin"
                              ? "📋"
                              : "✖"}{" "}
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-700 mb-2 block">
                        Keterangan
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tambahkan keterangan..."
                        value={editedNotes[record.id] || ""}
                        onChange={(e) =>
                          setEditedNotes((prev) => ({
                            ...prev,
                            [record.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4 bg-slate-50 flex gap-3">
            <button
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
              Batal
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-500 border border-blue-600 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Menyimpan..." : "💾 Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Change Date Modal
  const ChangeDateModal = () => {
    if (!showChangeDateModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Ganti Tanggal</h2>
              <p className="text-orange-100 text-sm">
                Ubah tanggal presensi secara batch
              </p>
            </div>
            <button
              onClick={() => setShowChangeDateModal(false)}
              className="p-2 hover:bg-orange-600 rounded-lg transition">
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

          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Lama
              </label>
              <input
                type="text"
                value={formatDateToIndonesian(selectedDateData?.date)}
                disabled
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Baru
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-orange-700">
                    Semua data presensi ({selectedDateData?.total} siswa) akan
                    dipindahkan ke tanggal baru.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowChangeDateModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                Batal
              </button>
              <button
                onClick={handleSaveChangeDate}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-orange-500 border border-orange-600 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Mengubah..." : "📅 Ganti Tanggal"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Delete Modal
  const DeleteModal = () => {
    if (!showDeleteModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-xl flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Hapus Presensi</h2>
              <p className="text-red-100 text-sm">
                Konfirmasi penghapusan data
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="p-2 hover:bg-red-600 rounded-lg transition">
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

          <div className="p-6">
            <div className="mb-6">
              <p className="text-slate-700 mb-4">
                Apakah Anda yakin ingin menghapus semua data presensi pada:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600">Tanggal:</span>
                    <div className="font-semibold text-slate-900">
                      {formatDateToIndonesian(selectedDateData?.date)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600">Total Siswa:</span>
                    <div className="font-semibold text-slate-900">
                      {selectedDateData?.total} siswa
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">
                    Perhatian!
                  </p>
                  <p className="text-sm text-red-700">
                    Data yang dihapus tidak dapat dikembalikan. Pastikan Anda
                    sudah yakin sebelum melanjutkan.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-500 border border-red-600 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Menghapus..." : "🗑️ Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Pagination Component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border border-slate-200">
        <div className="text-sm text-slate-600">
          Menampilkan {attendanceDates.length} dari {totalDates} tanggal
          (Halaman {currentPage} dari {totalPages})
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
            ← Sebelumnya
          </button>

          <div className="flex gap-1">
            {startPage > 1 && (
              <>
                <button
                  onClick={() => goToPage(1)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                  1
                </button>
                {startPage > 2 && <span className="px-2 py-2">...</span>}
              </>
            )}

            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-2 text-sm border rounded-lg transition ${
                  currentPage === page
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-slate-300 hover:bg-slate-50"
                }`}>
                {page}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="px-2 py-2">...</span>
                )}
                <button
                  onClick={() => goToPage(totalPages)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
            Selanjutnya →
          </button>
        </div>
      </div>
    );
  };

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
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-2">
                Management Presensi
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Edit, Ubah Tanggal, atau Hapus Data Presensi yang Sudah
                Tersimpan
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

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-4 sm:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedSubject("");
                setSelectedClass("");
                setAttendanceDates([]);
                setCurrentPage(1);
              }}
              disabled={loading || !teacherId}
              className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="">Pilih Semester</option>
              {semesters.map((semester, index) => (
                <option key={index} value={semester.value}>
                  {semester.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedClass("");
                setAttendanceDates([]);
                setCurrentPage(1);
              }}
              disabled={loading || !teacherId || !selectedSemester}
              className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="">Pilih Mata Pelajaran</option>
              {subjects.map((subject, index) => (
                <option key={index} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              disabled={!selectedSubject || loading || isHomeroomDaily()}
              className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-slate-50">
              <option value="">Pilih Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.displayName}
                </option>
              ))}
            </select>
            {isHomeroomDaily() && (
              <p className="text-xs text-blue-600 mt-1">
                Kelas otomatis dipilih untuk presensi harian
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Filter Bulan
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              disabled={!selectedClass}
              className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      {loading && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat data presensi...</p>
        </div>
      )}

      {!loading &&
        selectedClass &&
        selectedSubject &&
        selectedSemester &&
        attendanceDates.length === 0 && (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center text-slate-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">Belum ada data presensi</p>
            <p className="text-sm mt-2">
              Tidak ada presensi yang tersimpan untuk filter yang dipilih
            </p>
          </div>
        )}

      {!loading && attendanceDates.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                  Daftar Tanggal Presensi - {selectedSubject}
                  <span className="text-sm text-slate-600 ml-2">
                    ({totalDates} tanggal total)
                  </span>
                </h3>
                {selectedMonth && (
                  <p className="text-sm text-slate-600 mt-1">
                    Filter:{" "}
                    {months.find((m) => m.value === selectedMonth)?.label}
                  </p>
                )}
              </div>
              <div className="text-sm text-slate-600">
                Halaman {currentPage} dari {totalPages}
              </div>
            </div>

            {/* Mobile View */}
            <div className="block sm:hidden">
              {attendanceDates.map((dateData) => (
                <div
                  key={dateData.date}
                  className="border-b border-slate-100 p-4">
                  <div className="mb-3">
                    <div className="font-semibold text-slate-900 mb-2">
                      📅 {formatDateToIndonesian(dateData.date)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span>Hadir: {dateData.hadir}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                        <span>Sakit: {dateData.sakit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span>Izin: {dateData.izin}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        <span>Alpa: {dateData.alpa}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEdit(dateData)}
                      className="w-full px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleChangeDate(dateData)}
                      className="w-full px-4 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 transition text-sm font-medium">
                      📅 Ganti Tanggal
                    </button>
                    <button
                      onClick={() => handleDelete(dateData)}
                      className="w-full px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium">
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                      Hadir
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                      Sakit
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                      Izin
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                      Alpa
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceDates.map((dateData) => (
                    <tr
                      key={dateData.date}
                      className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        📅 {formatDateToIndonesian(dateData.date)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                          {dateData.hadir}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                          {dateData.sakit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                          {dateData.izin}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                          {dateData.alpa}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                        {dateData.total}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(dateData)}
                            className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition text-xs font-medium"
                            title="Edit">
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleChangeDate(dateData)}
                            className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-100 transition text-xs font-medium"
                            title="Ganti Tanggal">
                            📅
                          </button>
                          <button
                            onClick={() => handleDelete(dateData)}
                            className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition text-xs font-medium"
                            title="Hapus">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <Pagination />
        </>
      )}

      {!selectedSemester && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center text-slate-500">
          <p>Pilih semester untuk memulai</p>
        </div>
      )}

      {selectedSemester && !selectedSubject && (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center text-slate-500">
          <p>Pilih mata pelajaran untuk melanjutkan</p>
        </div>
      )}

      {/* Modals */}
      <EditModal />
      <ChangeDateModal />
      <DeleteModal />
    </div>
  );
};

export default AttendanceManagement;

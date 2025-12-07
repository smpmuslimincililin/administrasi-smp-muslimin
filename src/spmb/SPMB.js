import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import StudentForm from "./StudentForm";
import StudentList from "./StudentList";
import Statistics from "./Statistics";
import ClassDivision from "./ClassDivision";

// Custom hook untuk toast notifications
const useToast = () => {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const showToast = useCallback((message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "info" });
    }, 3000);
  }, []);

  return { toast, showToast };
};

// Custom hook untuk SPMB target academic year
const useSPMBTargetYear = () => {
  const [targetYear, setTargetYear] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTargetYear = async () => {
      try {
        const { data, error } = await supabase
          .from("spmb_settings")
          .select("target_academic_year")
          .eq("is_active", true)
          .single();

        if (error) throw error;

        if (data) {
          setTargetYear(data.target_academic_year);
        }
      } catch (error) {
        console.error("Error fetching SPMB target year:", error);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        if (currentMonth >= 7) {
          setTargetYear(`${currentYear + 1}/${currentYear + 2}`);
        } else {
          setTargetYear(`${currentYear}/${currentYear + 1}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTargetYear();
  }, []);

  return { targetYear, isLoading };
};

// Custom hook untuk academic year
const useAcademicYear = () => {
  const getCurrentAcademicYear = useCallback(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (currentMonth >= 7) {
      return `${currentYear}/${currentYear + 1}`;
    } else {
      return `${currentYear - 1}/${currentYear}`;
    }
  }, []);

  return { getCurrentAcademicYear };
};

// Custom hook untuk date conversion
const useDateFormatter = () => {
  const convertDateFormat = useCallback((dateString) => {
    if (!dateString) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateString)) {
      const parts = dateString.split(/[-/]/);
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split("T")[0];
    } catch (e) {
      console.warn("Cannot parse date:", dateString);
      return null;
    }
  }, []);

  return { convertDateFormat };
};

// Custom hook untuk students data management
const useStudentsData = (userData, showToast, targetYear) => {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { convertDateFormat } = useDateFormatter();

  // Load students data
  const loadStudents = useCallback(
    async (page = 1, search = "") => {
      setIsLoading(true);
      try {
        const rowsPerPage = 20;
        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage - 1;

        // Load semua students untuk statistik & pembagian kelas
        const { data: allData } = await supabase
          .from("siswa_baru")
          .select("*")
          .order("created_at", { ascending: false });

        setAllStudents(allData || []);

        let query = supabase
          .from("siswa_baru")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);

        const searchString = String(search || "").trim();

        if (searchString) {
          query = query.or(
            `nama_lengkap.ilike.%${searchString}%,asal_sekolah.ilike.%${searchString}%,nama_ayah.ilike.%${searchString}%,nama_ibu.ilike.%${searchString}%,no_pendaftaran.ilike.%${searchString}%`
          );
        }

        const { data, count, error } = await query;

        if (error) {
          console.error("Query error:", error);
          throw error;
        }

        const calculatedTotalPages = Math.ceil((count || 0) / rowsPerPage);

        setTotalStudents(count || 0);
        setStudents(data || []);

        return {
          data: data || [],
          totalPages: calculatedTotalPages,
          totalStudents: count || 0,
        };
      } catch (error) {
        console.error("Error loading students:", error);
        showToast("Gagal memuat data siswa", "error");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  // Save student
  const saveStudent = useCallback(
    async ({ studentData, parentData, isEdit, editingStudent }) => {
      setIsLoading(true);
      try {
        if (!targetYear) {
          throw new Error("Target academic year belum dimuat");
        }

        const combinedData = {
          ...(isEdit &&
            editingStudent && {
              no_pendaftaran: editingStudent.no_pendaftaran,
            }),
          nama_lengkap: studentData.nama_lengkap,
          nisn: studentData.nisn,
          jenis_kelamin: studentData.jenis_kelamin,
          tempat_lahir: studentData.tempat_lahir,
          tanggal_lahir: convertDateFormat(studentData.tanggal_lahir),
          asal_sekolah: studentData.asal_sekolah,
          nama_ayah: parentData.nama_ayah,
          pekerjaan_ayah: parentData.pekerjaan_ayah,
          pendidikan_ayah: parentData.pendidikan_ayah,
          nama_ibu: parentData.nama_ibu,
          pekerjaan_ibu: parentData.pekerjaan_ibu,
          pendidikan_ibu: parentData.pendidikan_ibu,
          no_hp: parentData.no_hp,
          alamat: parentData.alamat,
          academic_year: targetYear,
          status: "diterima",
          is_transferred: false,
          tanggal_daftar: new Date().toISOString(),
        };

        let result;
        if (isEdit && editingStudent) {
          result = await supabase
            .from("siswa_baru")
            .update(combinedData)
            .eq("id", editingStudent.id);
        } else {
          result = await supabase
            .from("siswa_baru")
            .insert([combinedData])
            .select();
        }

        if (result.error) throw result.error;

        const savedNoPendaftaran = isEdit
          ? editingStudent.no_pendaftaran
          : result.data[0]?.no_pendaftaran || "N/A";

        showToast(
          `Data siswa berhasil ${
            isEdit ? "diupdate" : "didaftarkan"
          }! No. Pendaftaran: ${savedNoPendaftaran}`,
          "success"
        );

        return true;
      } catch (error) {
        console.error("Error saving student:", error);
        showToast(
          `Gagal ${isEdit ? "mengupdate" : "menyimpan"} data: ${error.message}`,
          "error"
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [convertDateFormat, targetYear, showToast]
  );

  // Delete student
  const deleteStudent = useCallback(
    async (id) => {
      if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
        return false;
      }

      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("siswa_baru")
          .delete()
          .eq("id", id);

        if (error) throw error;

        showToast("Data siswa berhasil dihapus!", "success");
        return true;
      } catch (error) {
        console.error("Error deleting student:", error);
        showToast("Gagal menghapus data: " + error.message, "error");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  return {
    students,
    allStudents,
    totalStudents,
    isLoading,
    loadStudents,
    saveStudent,
    deleteStudent,
    setIsLoading,
  };
};

// Main SPMB Component
const SPMB = ({ user, onShowToast }) => {
  const [activeTab, setActiveTab] = useState("form");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);

  const { toast, showToast } = useToast();
  const { getCurrentAcademicYear } = useAcademicYear();
  const { targetYear, isLoading: isLoadingTargetYear } = useSPMBTargetYear();

  const {
    students,
    allStudents,
    totalStudents,
    isLoading,
    loadStudents,
    saveStudent,
    deleteStudent,
  } = useStudentsData(user, onShowToast || showToast, targetYear);

  // Handle search input - LANGSUNG UPDATE (SMOOTH!)
  const handleSearchInput = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value);
  }, []);

  // Initial load students
  useEffect(() => {
    const initializeData = async () => {
      const result = await loadStudents(1, "");
      if (result && result.totalPages) {
        setTotalPages(result.totalPages);
      }
    };

    initializeData();
  }, [loadStudents]);

  // Debounce search input -> searchTerm (300ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Filter students berdasarkan searchTerm - CLIENT SIDE (SMOOTH!)
  const { filteredStudents, filteredTotal, filteredTotalPages } =
    useMemo(() => {
      const rowsPerPage = 20;

      if (!searchTerm.trim()) {
        // Kalau kosong, pake data dari database
        return {
          filteredStudents: students,
          filteredTotal: totalStudents,
          filteredTotalPages: totalPages,
        };
      }

      // Kalau ada search, filter client-side
      const search = searchTerm.toLowerCase();
      const filtered = allStudents.filter(
        (s) =>
          s.nama_lengkap?.toLowerCase().includes(search) ||
          s.asal_sekolah?.toLowerCase().includes(search) ||
          s.nama_ayah?.toLowerCase().includes(search) ||
          s.nama_ibu?.toLowerCase().includes(search) ||
          s.no_pendaftaran?.toLowerCase().includes(search)
      );

      const from = (currentPage - 1) * rowsPerPage;
      const to = from + rowsPerPage;

      return {
        filteredStudents: filtered.slice(from, to),
        filteredTotal: filtered.length,
        filteredTotalPages: Math.ceil(filtered.length / rowsPerPage),
      };
    }, [
      searchTerm,
      students,
      allStudents,
      totalStudents,
      totalPages,
      currentPage,
    ]);

  // Reset page saat search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle page change
  const handlePageChange = useCallback(
    async (page) => {
      setCurrentPage(page);

      if (!searchTerm.trim()) {
        // Kalau tidak ada search, load dari database
        const result = await loadStudents(page, "");
        if (result && result.totalPages) {
          setTotalPages(result.totalPages);
        }
      }
      // Kalau ada search, pagination otomatis handle di useMemo
    },
    [searchTerm, loadStudents]
  );

  // Handle edit student
  const handleEditStudent = useCallback((student) => {
    setEditingStudent(student);
    setActiveTab("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Handle form submission
  const handleSaveStudent = useCallback(
    async (formData) => {
      const success = await saveStudent({
        ...formData,
        editingStudent,
      });

      if (success) {
        setEditingStudent(null);
        const result = await loadStudents(1, "");
        if (result && result.totalPages) {
          setTotalPages(result.totalPages);
          setCurrentPage(1);
        }
      }

      return success;
    },
    [saveStudent, editingStudent, loadStudents]
  );

  // Handle delete student
  const handleDeleteStudent = useCallback(
    async (id) => {
      const success = await deleteStudent(id);
      if (success) {
        const result = await loadStudents(1, "");
        if (result && result.totalPages) {
          setTotalPages(result.totalPages);
          setCurrentPage(1);
        }
      }
    },
    [deleteStudent, loadStudents]
  );

  // Handle refresh data
  const handleRefreshData = useCallback(async () => {
    const result = await loadStudents(1, "");
    if (result && result.totalPages) {
      setTotalPages(result.totalPages);
      setCurrentPage(1);
    }
  }, [loadStudents]);

  // Calculate statistics
  const maleStudents = allStudents.filter(
    (s) => s.jenis_kelamin === "L"
  ).length;
  const femaleStudents = allStudents.filter(
    (s) => s.jenis_kelamin === "P"
  ).length;

  const navItems = [
    {
      key: "form",
      icon: "UserPlus",
      label: "Form",
      fullLabel: "Form Pendaftaran",
    },
    { key: "list", icon: "Users", label: "Data", fullLabel: "Data Siswa" },
    { key: "stats", icon: "BarChart3", label: "Stats", fullLabel: "Statistik" },
    {
      key: "division",
      icon: "Shuffle",
      label: "Kelas",
      fullLabel: "Pembagian Kelas",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-24 sm:pb-6">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Toast Notification */}
        {toast.show && (
          <div
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-4 rounded-lg shadow-xl border-l-4 animate-slide-down max-w-sm ${
              toast.type === "success"
                ? "bg-green-50 border-green-500 text-green-800"
                : toast.type === "error"
                ? "bg-red-50 border-red-500 text-red-800"
                : "bg-blue-50 border-blue-500 text-blue-800"
            }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {toast.type === "success"
                  ? "✓"
                  : toast.type === "error"
                  ? "✕"
                  : "ℹ"}
              </span>
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Loading Target Year */}
        {isLoadingTargetYear && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-800">
                Memuat data tahun ajaran target...
              </span>
            </div>
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600 rounded-xl p-8 sm:p-10 shadow-lg">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-lg text-blue-200 font-semibold uppercase tracking-widest">
              Sekolah Menengah Pertama Muslimin Cililin
            </h2>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Sistem Penerimaan Murid Baru (SPMB)
            </h1>
            {targetYear && (
              <p className="text-blue-100 text-lg sm:text-xl font-medium pt-1">
                Penerimaan Tahun Ajaran {targetYear}
              </p>
            )}
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex-1 p-4 font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === item.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-blue-50"
                }`}>
                <span>{item.fullLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {/* Loading State untuk form tab */}
          {(isLoading || isLoadingTargetYear) &&
            activeTab !== "form" &&
            activeTab !== "list" && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gray-200 h-20 rounded-lg"
                  />
                ))}
              </div>
            )}

          {/* Content */}
          {!isLoadingTargetYear && (
            <>
              {activeTab === "form" && (
                <StudentForm
                  editingStudent={editingStudent}
                  setEditingStudent={setEditingStudent}
                  students={allStudents}
                  onSaveStudent={handleSaveStudent}
                  isLoading={isLoading}
                />
              )}

              {activeTab === "list" && (
                <>
                  {filteredStudents.length === 0 && !searchInput ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">🔭</div>
                      <p className="text-gray-500 text-lg font-medium">
                        Belum ada data siswa
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Mulai dengan mendaftarkan siswa baru
                      </p>
                    </div>
                  ) : filteredStudents.length === 0 && searchInput ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">🔍</div>
                      <p className="text-gray-500 text-lg font-medium">
                        Tidak ada hasil
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Coba kata kunci lain
                      </p>
                    </div>
                  ) : (
                    <StudentList
                      students={filteredStudents}
                      allStudents={allStudents}
                      totalStudents={filteredTotal}
                      currentPageNum={currentPage}
                      totalPages={filteredTotalPages}
                      searchTerm={searchInput}
                      onSearch={handleSearchInput}
                      onEditStudent={handleEditStudent}
                      onDeleteStudent={handleDeleteStudent}
                      onLoadStudents={handleRefreshData}
                      onPageChange={handlePageChange}
                      isLoading={isLoading}
                      rowsPerPage={20}
                      showToast={showToast}
                    />
                  )}
                </>
              )}

              {activeTab === "stats" && (
                <Statistics
                  students={allStudents}
                  totalStudents={totalStudents}
                  maleStudents={maleStudents}
                  femaleStudents={femaleStudents}
                  getCurrentAcademicYear={() =>
                    targetYear || getCurrentAcademicYear()
                  }
                />
              )}

              {activeTab === "division" && (
                <ClassDivision
                  allStudents={allStudents}
                  showToast={showToast}
                  isLoading={isLoading}
                  onRefreshData={handleRefreshData}
                  supabase={supabase}
                  getCurrentAcademicYear={() =>
                    targetYear || getCurrentAcademicYear()
                  }
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-40 shadow-lg">
        <div className="flex">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex-1 p-3 font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                activeTab === item.key
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600"
              }`}>
              <span className="text-lg">
                {item.key === "form"
                  ? "📝"
                  : item.key === "list"
                  ? "👥"
                  : item.key === "stats"
                  ? "📊"
                  : "🔀"}
              </span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SPMB;

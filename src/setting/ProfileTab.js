import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";
import ChangePasswordSection from "./ChangePasswordSection"; // Asumsi ChangePasswordSection ada
import {
  User,
  Mail,
  Shield,
  BookOpen,
  School,
  Calendar,
  History,
  ChevronDown,
  ChevronUp,
  Award,
  Clock,
  Users,
  Search,
  Eye,
  Edit2,
  Trash2,
  Plus,
  X,
  Save,
  AlertCircle,
  Phone,
  List,
} from "lucide-react";

const ProfileTab = ({ userId, user, showToast, loading, setLoading }) => {
  const [profileData, setProfileData] = useState(null);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [targetUserId, setTargetUserId] = useState(userId);

  // User Management States
  const [showUserList, setShowUserList] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // CRUD States
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    password: "",
    role: "teacher",
    teacher_id: "",
    no_hp: "",
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newGeneratedPassword, setNewGeneratedPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const isInitialLoad = useRef(true);

  // LOGIC: Fetch Active Academic Year
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

  // LOGIC: Search Users (Admin)
  const searchUsers = useCallback(
    async (query) => {
      try {
        setSearching(true);

        let queryBuilder = supabase
          .from("users")
          .select(
            "id, username, full_name, role, teacher_id, is_active, created_at, no_hp"
          )
          .neq("role", "admin")
          .order("teacher_id", { ascending: true, nullsFirst: false })
          .order("full_name", { ascending: true });

        if (query.trim()) {
          queryBuilder = queryBuilder.or(
            `full_name.ilike.%${query}%,username.ilike.%${query}%,teacher_id.ilike.%${query}%`
          );
        }

        queryBuilder = queryBuilder.limit(100);

        const { data, error } = await queryBuilder;

        if (error) {
          console.error("Error searching users:", error);
          showToast("Gagal memuat daftar pengguna", "error");
          return;
        }

        setUserSearchResults(data || []);
      } catch (err) {
        console.error("Error in searchUsers:", err);
        showToast("Terjadi kesalahan saat memuat pengguna", "error");
      } finally {
        setSearching(false);
      }
    },
    [showToast]
  );

  // LOGIC: Load User Profile
  const loadUserProfile = useCallback(
    async (uid) => {
      try {
        console.log("Loading profile for user:", uid);
        setLoading(true);

        if (!uid) {
          console.error("User ID is missing");
          showToast("ID pengguna tidak ditemukan", "error");
          setLoading(false);
          return;
        }

        const activeYear = await fetchActiveAcademicYear();
        setActiveAcademicYear(activeYear);

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select(
            "id, username, full_name, role, teacher_id, homeroom_class_id, is_active, created_at, no_hp"
          )
          .eq("id", uid)
          .maybeSingle();

        if (userError) {
          console.error("Error loading user profile:", userError);
          const errorMsg =
            userError.code === "PGRST116"
              ? "Pengguna tidak ditemukan"
              : `Gagal memuat profil: ${userError.message}`;
          showToast(errorMsg, "error");
          setLoading(false);
          return;
        }

        if (!userData) {
          showToast("Data pengguna tidak ditemukan", "error");
          setLoading(false);
          return;
        }

        console.log("User profile loaded:", userData);
        setProfileData(userData);

        if (userData.homeroom_class_id) {
          const { data: classData, error: classError } = await supabase
            .from("classes")
            .select("id, grade, academic_year, is_active")
            .eq("id", userData.homeroom_class_id)
            .maybeSingle();

          if (classError) {
            console.error("Error loading homeroom class:", classError);
          } else if (classData) {
            console.log("Homeroom class loaded:", classData);
            setProfileData((prev) => ({
              ...prev,
              homeroom_class: classData,
            }));
          }
        }

        if (userData.teacher_id && activeYear) {
          await loadTeachingAssignments(userData.teacher_id, activeYear, false);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading profile:", err);
        showToast("Terjadi kesalahan saat memuat profil", "error");
        setLoading(false);
      }
    },
    [fetchActiveAcademicYear, setLoading, showToast]
  );

  // LOGIC: Load Teaching Assignments
  const loadTeachingAssignments = useCallback(
    async (teacherId, activeYear, includeHistory = false) => {
      try {
        if (includeHistory) {
          setLoadingHistory(true);
        }

        console.log("🔍 Loading assignments for:", {
          teacherId,
          activeYear,
          includeHistory,
        });

        if (includeHistory) {
          const { data: allAssignments, error: assignError } = await supabase
            .from("teacher_assignments")
            .select(
              `
            id, 
            subject, 
            class_id,
            academic_year, 
            semester,
            classes:class_id (
              id,
              grade,
              academic_year,
              is_active
            )
          `
            )
            .eq("teacher_id", teacherId)
            .order("academic_year", { ascending: false })
            .order("semester", { ascending: false });

          console.log("📊 All assignments:", allAssignments);
          console.log("❌ Error:", assignError);

          if (assignError) {
            console.error("Error loading teaching assignments:", assignError);
            setLoadingHistory(false);
            return;
          }

          if (allAssignments) {
            const filteredAssignments = allAssignments.filter((a) => {
              if (a.academic_year === activeYear) {
                return a.classes !== null;
              }
              return true;
            });

            console.log(
              "✅ Filtered assignments (with history):",
              filteredAssignments
            );

            setProfileData((prev) => ({
              ...prev,
              teaching_assignments: filteredAssignments,
            }));
          }
        } else {
          const { data: currentAssignments, error: assignError } =
            await supabase
              .from("teacher_assignments")
              .select(
                `
            id, 
            subject, 
            class_id,
            academic_year, 
            semester,
            classes:class_id (
              id,
              grade,
              academic_year,
              is_active
            )
          `
              )
              .eq("teacher_id", teacherId)
              .eq("academic_year", activeYear)
              .order("semester", { ascending: false });

          console.log("📊 Current assignments:", currentAssignments);
          console.log("❌ Error:", assignError);

          if (assignError) {
            console.error("Error loading teaching assignments:", assignError);
            return;
          }

          if (currentAssignments) {
            const filteredAssignments = currentAssignments.filter(
              (a) => a.classes !== null
            );

            console.log(
              "✅ Filtered current assignments:",
              filteredAssignments
            );

            setProfileData((prev) => ({
              ...prev,
              teaching_assignments: filteredAssignments,
            }));
          }
        }

        setLoadingHistory(false);
      } catch (err) {
        console.error("Error loading teaching assignments:", err);
        setLoadingHistory(false);
      }
    },
    []
  );

  // LOGIC: Auto-expand list on search
  useEffect(() => {
    if (searchQuery.trim() && !showUserList) {
      setShowUserList(true);
    }
  }, [searchQuery, showUserList]);

  // LOGIC: Filter users based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = userSearchResults.filter(
        (u) =>
          u.full_name.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          u.teacher_id?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(userSearchResults);
    }
  }, [searchQuery, userSearchResults]);

  // LOGIC: Load users on mount (only for admin)
  useEffect(() => {
    if (user?.role === "admin" && userSearchResults.length === 0) {
      searchUsers("");
    }
  }, [user?.role, userSearchResults.length, searchUsers]);

  // LOGIC: Effects for initial load and target user change
  useEffect(() => {
    if (targetUserId && isInitialLoad.current) {
      isInitialLoad.current = false;
      loadUserProfile(targetUserId);
    }
  }, [targetUserId, loadUserProfile]);

  useEffect(() => {
    if (!isInitialLoad.current && targetUserId) {
      loadUserProfile(targetUserId);
    }
  }, [targetUserId]);

  // LOGIC: Effects for loading assignments
  useEffect(() => {
    if (
      !isInitialLoad.current &&
      profileData?.teacher_id &&
      activeAcademicYear
    ) {
      loadTeachingAssignments(
        profileData.teacher_id,
        activeAcademicYear,
        showHistory
      );
    }
  }, [
    showHistory,
    profileData?.teacher_id,
    activeAcademicYear,
    loadTeachingAssignments,
  ]);

  // LOGIC: Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === "admin") {
        searchUsers(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers, user?.role]);

  // HANDLER: View Profile
  const handleViewProfile = (selectedUser) => {
    setTargetUserId(selectedUser.id);
    setShowUserList(false);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // HANDLER: Open Add Modal
  const openAddModal = () => {
    setModalMode("add");
    setEditingUser(null);
    setFormData({
      username: "",
      full_name: "",
      password: "",
      role: "teacher",
      teacher_id: "",
      no_hp: "",
      is_active: true,
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  // HANDLER: Open Edit Modal
  const openEditModal = (user) => {
    setModalMode("edit");
    setEditingUser(user);
    setFormData({
      username: user.username,
      full_name: user.full_name,
      password: "",
      role: user.role,
      teacher_id: user.teacher_id || "",
      no_hp: user.no_hp || "",
      is_active: user.is_active,
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  // LOGIC: Form Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = "Username wajib diisi";
    }

    if (!formData.full_name.trim()) {
      errors.full_name = "Nama lengkap wajib diisi";
    }

    if (modalMode === "add" && !formData.password) {
      errors.password = "Password wajib diisi";
    }

    if (
      modalMode === "add" &&
      formData.password &&
      formData.password.length < 6
    ) {
      errors.password = "Password minimal 6 karakter";
    }

    if (formData.role === "teacher" && !formData.teacher_id.trim()) {
      errors.teacher_id = "ID Guru wajib diisi untuk role teacher";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // HANDLER: Form Submit (Add/Edit)
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast("Mohon lengkapi semua field yang wajib diisi", "error");
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === "add") {
        // INSERT LANGSUNG KE DATABASE (PLAIN TEXT PASSWORD)
        const { error: insertError } = await supabase.from("users").insert([
          {
            username: formData.username,
            password: formData.password, // ✅ PASSWORD DI-INSERT!
            full_name: formData.full_name,
            role: formData.role,
            teacher_id:
              formData.role === "teacher" ? formData.teacher_id : null,
            no_hp: formData.no_hp || null, // ✅ NO_HP DI-INSERT!
            is_active: formData.is_active,
          },
        ]);

        if (insertError) {
          showToast(
            `Gagal menyimpan data user: ${insertError.message}`,
            "error"
          );
          setSubmitting(false);
          return;
        }

        showToast("User berhasil ditambahkan!", "success");
        searchUsers("");
        setShowUserModal(false);
      } else if (modalMode === "edit") {
        const updateData = {
          username: formData.username,
          full_name: formData.full_name,
          role: formData.role,
          teacher_id: formData.role === "teacher" ? formData.teacher_id : null,
          no_hp: formData.no_hp || null, // ✅ NO_HP DI-UPDATE!
          is_active: formData.is_active,
        };

        // Update password only if provided
        if (formData.password) {
          updateData.password = formData.password; // ✅ PASSWORD DI-UPDATE KALAU ADA!
        }

        const { error: updateError } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", editingUser.id);

        if (updateError) {
          showToast(`Gagal mengupdate user: ${updateError.message}`, "error");
          setSubmitting(false);
          return;
        }

        showToast("User berhasil diupdate!", "success");
        searchUsers("");

        if (targetUserId === editingUser.id) {
          loadUserProfile(targetUserId);
        }

        setShowUserModal(false);
      }

      setSubmitting(false);
    } catch (err) {
      console.error("Error submitting form:", err);
      showToast("Terjadi kesalahan saat menyimpan data", "error");
      setSubmitting(false);
    }
  };

  // HANDLER: Delete User
  const handleDelete = async (deleteUser) => {
    if (deleteUser.id === userId) {
      showToast("Anda tidak bisa menghapus akun sendiri!", "error");
      return;
    }
    if (
      !window.confirm(
        `Yakin ingin menghapus user "${deleteUser.full_name}"? Tindakan ini tidak bisa dibatalkan!`
      )
    ) {
      return;
    }
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", deleteUser.id);
      if (deleteError) {
        showToast(`Gagal menghapus user: ${deleteError.message}`, "error");
        setLoading(false);
        return;
      }
      showToast("User berhasil dihapus!", "success");
      searchUsers("");
      if (targetUserId === deleteUser.id) {
        setTargetUserId(userId);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast("Terjadi kesalahan saat menghapus user", "error");
      setLoading(false);
    }
  };

  // ========== FUNGSI BARU UNTUK RESET PASSWORD ==========
  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const openResetPasswordModal = (user) => {
    setResetPasswordUser(user);
    const generatedPass = generateRandomPassword();
    setNewGeneratedPassword(generatedPass);
    setPasswordCopied(false);
    setShowResetPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newGeneratedPassword) return;

    try {
      setResetting(true);

      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: newGeneratedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resetPasswordUser.id);

      if (updateError) {
        showToast(`Gagal mereset password: ${updateError.message}`, "error");
        setResetting(false);
        return;
      }

      showToast(
        `Password berhasil direset untuk ${resetPasswordUser.full_name}!`,
        "success"
      );
      setResetting(false);
      // Optional: close modal after successful reset
      setTimeout(() => setShowResetPasswordModal(false), 1500);
    } catch (err) {
      console.error("Error resetting password:", err);
      showToast("Terjadi kesalahan saat mereset password", "error");
      setResetting(false);
    }
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(newGeneratedPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false);
    setResetPasswordUser(null);
    setNewGeneratedPassword("");
    setPasswordCopied(false);
  };
  // =====================================================

  const isViewingOtherProfile = targetUserId !== userId;
  const isAdmin = user?.role === "admin";

  const getClassName = (assignment) => {
    if (assignment.classes?.id) {
      return `Kelas ${assignment.classes.id}`;
    }
    if (assignment.classes?.grade) {
      return `Kelas ${assignment.classes.grade}`;
    }
    return `Kelas ${assignment.class_id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Data Profil Hilang
          </h2>
          <p className="text-gray-600">
            Terjadi kesalahan saat memuat data profil. Silakan coba *logout*
            lalu *login* kembali.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  const { teaching_assignments: assignments = [] } = profileData;

  // Filter current assignments
  const currentAssignments = assignments.filter(
    (a) => a.academic_year === activeAcademicYear
  );

  // Calculate stats for current year
  const totalSubjects = currentAssignments.length || 0;
  const uniqueSubjects = [...new Set(currentAssignments?.map((a) => a.subject))]
    .length;
  const totalClasses = [...new Set(currentAssignments?.map((a) => a.class_id))]
    .length;

  // Group history by year and semester
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const year = assignment.academic_year;
    const semester = assignment.semester;
    if (!acc[year]) {
      acc[year] = {
        year,
        semesters: {},
      };
    }
    if (!acc[year].semesters[semester]) {
      acc[year].semesters[semester] = [];
    }
    acc[year].semesters[semester].push(assignment);
    return acc;
  }, {});

  const historyYears = Object.values(groupedAssignments).sort((a, b) =>
    b.year > a.year ? 1 : b.year < a.year ? -1 : 0
  );

  // =======================================================================
  // ========================== RENDER START ===============================
  // =======================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      {" "}
      {/* ✅ p-4 sm:p-6 md:p-8 for better mobile padding */}
      <div className="max-w-7xl mx-auto">
        {/* User Search & Management (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={24} className="text-blue-600" />
              Manajemen Pengguna
            </h2>

            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Cari pengguna (Nama, Username, ID Guru)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex-shrink-0">
                <Plus size={18} />
                Tambah User
              </button>
            </div>

            {/* List Toggle */}
            <div
              onClick={() => setShowUserList(!showUserList)}
              className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-lg transition border border-gray-200 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    showUserList ? "bg-blue-600" : "bg-gray-100"
                  }`}>
                  <List
                    size={18}
                    className={showUserList ? "text-white" : "text-gray-600"}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Semua Pengguna</h3>
                  <p className="text-sm text-gray-600">
                    {filteredUsers.length}{" "}
                    {searchQuery ? "hasil" : "pengguna terdaftar"}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserList(!showUserList);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium">
                {showUserList ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
                {showUserList ? "Tutup" : "Lihat Semua"}
              </button>
            </div>

            {showUserList && (
              <div className="border-t border-gray-200">
                <div className="max-h-[500px] overflow-y-auto p-4">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users size={48} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        {searchQuery
                          ? "Tidak ada pengguna yang ditemukan"
                          : "Belum ada pengguna"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredUsers.map((listUser) => (
                        <div
                          key={listUser.id}
                          className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition border border-gray-200 shadow-sm" // ✅ Added flex-col sm:flex-row for responsiveness
                        >
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                              {listUser.full_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {listUser.full_name}
                              </p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                                {" "}
                                {/* ✅ Added flex-wrap */}
                                {listUser.teacher_id && (
                                  <span className="font-mono">
                                    ID: {listUser.teacher_id}
                                  </span>
                                )}
                                <span>@{listUser.username}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3 sm:mt-0 flex-shrink-0 items-center">
                            {" "}
                            {/* ✅ Added flex-wrap and mt-3 sm:mt-0 */}
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                listUser.role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                              <Shield size={12} />
                              {listUser.role === "admin" ? "Admin" : "Guru"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                listUser.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  listUser.is_active
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}></span>
                              {listUser.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProfile(listUser);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                title="Lihat Profil">
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(listUser);
                                }}
                                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                                title="Edit User">
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openResetPasswordModal(listUser);
                                }}
                                className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition"
                                title="Reset Password">
                                <Shield size={18} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(listUser);
                                }}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                                title="Hapus User">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            {" "}
            {/* ✅ Added flex-col md:flex-row for stacking on mobile */}
            {/* Left Side - Profile Picture & Main Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-1 min-w-0 text-center sm:text-left">
              {" "}
              {/* ✅ Added flex-col sm:flex-row and text alignment fixes */}
              {/* Avatar Placeholder */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-3xl flex-shrink-0">
                {profileData.full_name[0]}
              </div>
              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {profileData.full_name}
                </h1>
                <p className="text-gray-600 mb-2">@{profileData.username}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                  {" "}
                  {/* ✅ Added justify-center sm:justify-start */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${
                      profileData.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                    <Shield size={14} />
                    {profileData.role === "admin" ? "Administrator" : "Guru"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        profileData.is_active ? "bg-green-500" : "bg-gray-400"
                      }`}></span>
                    {profileData.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 justify-center sm:justify-start">
                  {" "}
                  {/* ✅ Added justify-center sm:justify-start */}
                  {profileData.teacher_id && (
                    <div className="flex items-center gap-1.5">
                      <User size={14} />
                      <span className="font-mono font-medium">
                        {profileData.teacher_id}
                      </span>
                    </div>
                  )}
                  {profileData.no_hp && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} />
                      <span>{profileData.no_hp}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Right Side - Academic Info */}
            <div className="flex flex-col gap-3 flex-shrink-0 mt-4 md:mt-0 w-full sm:w-auto">
              {" "}
              {/* ✅ Added mt-4 md:mt-0 and w-full sm:w-auto */}
              {activeAcademicYear && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} className="text-blue-500" />
                    <span className="font-medium">Tahun Ajaran:</span>
                    <span className="font-bold text-gray-900">
                      {activeAcademicYear}
                    </span>
                  </div>
                </div>
              )}
              {profileData.homeroom_class && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <School size={16} />
                    <span className="font-medium">Wali Kelas:</span>
                    <span className="font-bold text-blue-900">
                      {profileData.homeroom_class.id}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* End Header Section */}

          {/* Role Description */}
          <div className="mt-6 border-t pt-6 border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Shield size={18} className="text-purple-600" />
              Role:{" "}
              <span
                className={`text-xl font-bold ${
                  profileData.role === "admin"
                    ? "text-purple-700"
                    : "text-blue-700"
                }`}>
                {profileData.role === "admin" ? "Administrator" : "Guru"}
              </span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {profileData.role === "teacher"
                ? "Bertanggung Jawab Atas Pengajaran Mata Pelajaran, Penilaian, Dan Presensi Siswa Di Kelas Yang Ditugaskan."
                : "Memiliki Hak Penuh Untuk Mengelola Semua Data Dan Pengguna Dalam Sistem"}
            </p>
            {/* Admin Privilege Details */}
            {profileData.role === "admin" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2 text-sm">
                    Hak Akses:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Kelola semua user & role</li>
                    <li>• Akses data lengkap sistem</li>
                    <li>• Konfigurasi akademik</li>
                    <li>• Monitoring aktivitas</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2 text-sm">
                    Fitur Khusus:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Lihat profil semua user</li>
                    <li>• Edit & hapus user</li>
                    <li>• Generate laporan</li>
                    <li>• Backup & restore data</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Grid (Assignments, Password, etc) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Password / Admin Management */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail size={18} className="text-red-500" />
                Ubah Password
              </h3>
              {/* ✅ FIXED: Pass user object instead of userId */}
              <ChangePasswordSection user={user} />
            </div>
            {/* Admin Actions (Jika Admin dan Melihat Profil Sendiri) */}
            {isAdmin && !isViewingOtherProfile && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  Aksi Admin
                </h3>
                <button
                  onClick={openAddModal}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-md">
                  <Plus size={18} />
                  Tambah User Baru
                </button>
                <button
                  onClick={() => setShowUserList(true)}
                  className="w-full flex items-center justify-center gap-2 mt-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition shadow-sm">
                  <List size={18} />
                  Lihat Semua User
                </button>
              </div>
            )}
          </div>

          {/* Column 2/3: Teaching Assignments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen size={18} className="text-orange-600" />
                  Penugasan Mengajar
                </span>
                {profileData.teacher_id && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    disabled={loadingHistory}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition disabled:opacity-50">
                    {loadingHistory ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-blue-600"></div>
                    ) : showHistory ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                    {showHistory ? "Sembunyikan Riwayat" : "Tampilkan Riwayat"}
                  </button>
                )}
              </h3>

              {/* Stats Bar - Current Year */}
              {!showHistory && (
                <>
                  <p className="text-sm text-gray-500 mb-4 border-b pb-3">
                    Statistik Penugasan Tahun Ajaran Aktif (
                    {activeAcademicYear || "N/A"})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {" "}
                    {/* ✅ Changed grid-cols-1 md:grid-cols-4 to grid-cols-2 md:grid-cols-4 */}
                    {/* Stat Card: Total Mengajar */}
                    <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-orange-50 rounded-lg p-2">
                          <BookOpen size={18} className="text-orange-600" />
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {totalSubjects}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">
                        Total Sesi
                      </p>
                    </div>
                    {/* Stat Card: Mata Pelajaran */}
                    <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-50 rounded-lg p-2">
                          <Award size={18} className="text-purple-600" />
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {uniqueSubjects}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">
                        Mata Pelajaran
                      </p>
                    </div>
                    {/* Stat Card: Kelas Berbeda */}
                    <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <Users size={18} className="text-blue-600" />
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {totalClasses}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">
                        Kelas Diajar
                      </p>
                    </div>
                    {/* Stat Card: Homeroom Class */}
                    <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-50 rounded-lg p-2">
                          <History size={18} className="text-green-600" />
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {profileData.homeroom_class?.id || "-"}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">
                        Wali Kelas
                      </p>
                    </div>
                  </div>

                  {/* Current Assignments List */}
                  {currentAssignments.length > 0 ? (
                    <div className="space-y-4">
                      {currentAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            {" "}
                            {/* ✅ Added flex-col sm:flex-row for stacking on mobile */}
                            <div>
                              <p className="text-base font-bold text-gray-900">
                                {assignment.subject}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                <School size={14} />
                                <span>{getClassName(assignment)}</span>
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs font-medium mt-2 sm:mt-0">
                              {" "}
                              {/* ✅ Added flex-wrap */}
                              <span className="bg-white border border-gray-300 text-gray-600 px-2.5 py-1 rounded font-medium">
                                Semester {assignment.semester}
                              </span>
                              <span className="bg-gray-200 text-gray-600 px-2.5 py-1 rounded font-medium flex items-center gap-1">
                                <Clock size={12} />
                                {assignment.academic_year}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                      <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
                        <BookOpen size={40} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Belum Ada Tugas Mengajar
                      </h3>
                      <p className="text-gray-500">
                        {isViewingOtherProfile ? "User ini" : "Anda"} belum
                        memiliki mata pelajaran untuk tahun ajaran ini.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* History Assignments List */}
              {showHistory && (
                <div className="mt-6 border-t pt-4 border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-4">
                    Riwayat Penugasan Mengajar
                  </p>
                  <div className="space-y-6">
                    {historyYears.map((yearGroup) => (
                      <div key={yearGroup.year}>
                        <h4 className="text-base font-bold text-gray-800 mb-3 border-l-4 border-orange-400 pl-3">
                          Tahun Ajaran {yearGroup.year}
                        </h4>
                        <div className="space-y-4 ml-2">
                          {Object.entries(yearGroup.semesters).map(
                            ([semester, assignments]) => (
                              <div key={semester} className="space-y-2">
                                <p className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                                  <Calendar
                                    size={14}
                                    className="text-blue-500"
                                  />
                                  Semester {semester}
                                </p>
                                <div className="space-y-3 pl-4 border-l border-gray-200">
                                  {assignments.map((assignment) => (
                                    <div
                                      key={assignment.id}
                                      className="bg-white rounded-lg p-3 border border-gray-200 hover:bg-gray-50 transition-all">
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                        {" "}
                                        {/* ✅ Added flex-col sm:flex-row */}
                                        <div>
                                          <p className="text-sm font-bold text-gray-900">
                                            {assignment.subject}
                                          </p>
                                          <p className="text-xs text-gray-600 mt-0.5">
                                            {getClassName(assignment)}
                                          </p>
                                        </div>
                                        <span className="bg-gray-200 text-gray-600 px-2.5 py-1 rounded font-medium text-xs">
                                          {assignment.academic_year}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* =================================================================== */}
      {/* ======================= MODAL: ADD/EDIT USER ====================== */}
      {/* =================================================================== */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6">
          {" "}
          {/* ✅ Added p-4 sm:p-6 */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full transform transition-all my-8">
            {" "}
            {/* ✅ max-w-lg w-full for better mobile display */}
            <div className="sticky top-0 bg-white rounded-t-xl z-10 border-b border-gray-200">
              <div className="flex items-center justify-between p-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  {modalMode === "add" ? (
                    <Plus size={24} className="text-green-600" />
                  ) : (
                    <Edit2 size={24} className="text-indigo-600" />
                  )}
                  {modalMode === "add" ? "Tambah User Baru" : "Edit User"}
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Form Fields */}
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.username ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Masukkan username"
                  disabled={modalMode === "edit"}
                />
                {formErrors.username && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {formErrors.username}
                  </p>
                )}
              </div>
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.full_name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Masukkan nama lengkap"
                />
                {formErrors.full_name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {formErrors.full_name}
                  </p>
                )}
              </div>
              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      role: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="teacher">Guru</option>
                  <option value="guru_bk">Guru BK</option>
                  <option value="admin" className="text-red-600 font-semibold">
                    ⚠️ Administrator (Hati-hati!)
                  </option>
                </select>
                {formData.role === "admin" && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    ⚠️ <span className="font-semibold">PERINGATAN:</span> Role
                    admin memiliki akses penuh ke semua data dan fitur sistem.
                    Hanya berikan ke pengguna yang benar-benar dipercaya.
                  </p>
                )}
              </div>
              {/* Password */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password{" "}
                  {modalMode === "add" && (
                    <span className="text-red-500">*</span>
                  )}
                  {modalMode === "edit" && (
                    <span className="text-gray-500 text-xs font-normal ml-2">
                      (Kosongkan jika tidak diubah)
                    </span>
                  )}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={
                    modalMode === "add"
                      ? "Masukkan password awal"
                      : "Password baru (opsional)"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[50%] p-1 text-gray-500 hover:text-gray-700 transition">
                  <Eye size={20} />
                </button>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {formErrors.password}
                  </p>
                )}
              </div>
              {/* Teacher ID (If role is teacher) */}
              {formData.role === "teacher" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Guru <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.teacher_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        teacher_id: e.target.value,
                      }))
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.teacher_id
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Contoh: G-01, G-12, G-BK01"
                  />
                  {formErrors.teacher_id && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} /> {formErrors.teacher_id}
                    </p>
                  )}
                </div>
              )}
              {/* Nomor HP */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor HP
                </label>
                <input
                  type="text"
                  value={formData.no_hp}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, no_hp: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan nomor HP (opsional)"
                />
              </div>
              {/* Is Active */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Akun Aktif
                  </span>
                </label>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="p-6 pt-4 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
                  disabled={submitting}>
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Simpan User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* =================================================================== */}
      {/* ===================== MODAL: RESET PASSWORD ======================= */}
      {/* =================================================================== */}
      {showResetPasswordModal && resetPasswordUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6">
          {" "}
          {/* ✅ Added p-4 sm:p-6 */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all p-6 sm:p-8 my-8">
            {" "}
            {/* ✅ max-w-md w-full for better mobile display */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Shield size={24} className="text-orange-600" />
                Reset Password
              </h3>
              <button
                onClick={closeResetPasswordModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="text-center mb-6">
              <p className="text-gray-700 mb-3">
                Anda yakin ingin mereset password untuk user:
              </p>
              <p className="text-xl font-bold text-blue-700">
                {resetPasswordUser.full_name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ({resetPasswordUser.teacher_id || resetPasswordUser.username})
              </p>
            </div>
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">
                Password Baru yang akan Digunakan:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {" "}
                {/* ✅ Added flex-col sm:flex-row for responsiveness */}
                <code className="text-xl sm:text-2xl font-mono font-bold text-gray-900 tracking-wider break-all text-center sm:text-left">
                  {newGeneratedPassword}
                </code>
                <button
                  onClick={copyPasswordToClipboard}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 mt-2 sm:mt-0 ${
                    // ✅ Added mt-2 sm:mt-0
                    passwordCopied
                      ? "bg-green-100 text-green-700 border-2 border-green-500"
                      : "bg-blue-100 text-blue-700 border-2 border-blue-500 hover:bg-blue-200"
                  }`}>
                  {passwordCopied ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Salin
                    </>
                  )}
                </button>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={closeResetPasswordModal}
                className="flex-1 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
                disabled={resetting}>
                Batal
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting}
                className="flex-1 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {resetting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Mereset...
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    Reset Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;

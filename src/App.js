import React, { useState, useCallback, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";

// Import pages
import Teachers from "./pages/Teachers";
import Classes from "./pages/Classes";
import Students from "./pages/Students";
import Attendance from "./pages/attendance/Attendance";
import AttendanceManagement from "./pages/AttendanceManagement";
import Grades from "./pages/Grades";
import TeacherSchedule from "./pages/TeacherSchedule";
import CatatanSiswa from "./pages/CatatanSiswa";
import Setting from "./setting/Setting";

// Import modules
import Konseling from "./konseling/Konseling";
import Reports from "./reports/Reports";
import SPMB from "./spmb/SPMB";
import MonitorSistem from "./system/MonitorSistem";

// Import components
import MaintenancePage from "./setting/MaintenancePage";
import AdminPanel from "./setting/AdminPanel";

// ✅ IMPORT BARU: Presensi Guru
import TeacherAttendance from "./attendance-teacher/TeacherAttendance";

function App() {
  // ========== STATE ==========
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [showToast, setShowToast] = useState(false);

  // ========== MAINTENANCE MODE STATE ==========
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [whitelistUsers, setWhitelistUsers] = useState([]); // ✅ TAMBAH STATE WHITELIST

  // ========== 1. CHECK MAINTENANCE STATUS ==========
  useEffect(() => {
    checkMaintenanceStatus();

    // ✅ Subscribe to real-time changes (TAMBAH maintenance_whitelist)
    const subscription = supabase
      .channel("maintenance-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "school_settings",
          filter:
            "setting_key=in.(maintenance_mode,maintenance_message,maintenance_whitelist)", // ✅ TAMBAH whitelist
        },
        (payload) => {
          console.log("🔔 Maintenance settings changed:", payload);
          loadMaintenanceSettings();
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      await loadMaintenanceSettings();
    } catch (error) {
      console.error("❌ Error checking maintenance:", error);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // ✅ UPDATE: Load whitelist juga
  const loadMaintenanceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("school_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "maintenance_mode",
          "maintenance_message",
          "maintenance_whitelist", // ✅ TAMBAH whitelist
        ]);

      if (error) throw error;

      const settings = {};
      data?.forEach((item) => {
        settings[item.setting_key] = item.setting_value;
      });

      const isMaintenance =
        settings.maintenance_mode === "true" ||
        settings.maintenance_mode === true;

      setIsMaintenanceMode(isMaintenance);
      setMaintenanceMessage(
        settings.maintenance_message ||
          "Aplikasi sedang dalam maintenance. Kami akan kembali segera!"
      );

      // ✅ Parse whitelist dari database
      if (settings.maintenance_whitelist) {
        try {
          const parsed = JSON.parse(settings.maintenance_whitelist);
          setWhitelistUsers(Array.isArray(parsed) ? parsed : []);
          console.log("✅ Whitelist loaded:", parsed);
        } catch (e) {
          console.error("❌ Error parsing whitelist:", e);
          setWhitelistUsers([]);
        }
      } else {
        setWhitelistUsers([]);
      }
    } catch (error) {
      console.error("❌ Error loading maintenance settings:", error);
    }
  };

  // ========== 2. CHECK SESSION DARI localStorage ==========
  useEffect(() => {
    const checkSession = () => {
      try {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
          setLoading(false);
          return;
        }

        const userData = JSON.parse(storedUser);

        // Check expiry time
        if (userData.expiryTime) {
          const currentTime = Date.now();
          if (currentTime > userData.expiryTime) {
            console.log("⏰ Session expired");
            localStorage.removeItem("user");
            localStorage.removeItem("rememberMe");
            setUser(null);
            handleShowToast(
              "Sesi Anda telah berakhir. Silakan login kembali.",
              "warning"
            );
            setLoading(false);
            return;
          }
        }

        setUser(userData);
      } catch (err) {
        console.error("❌ Error parsing stored user:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("rememberMe");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // ========== 3. AUTO HIDE TOAST ==========
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
        setToastMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // ========== 4. KEYBOARD SHORTCUT: Ctrl + Shift + M (ADMIN PANEL) ==========
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "M") {
        e.preventDefault();
        window.location.href = "/secret-admin-panel-2024";
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // ========== 5. HANDLERS ==========
  const handleLogin = useCallback((userData, rememberMe = false) => {
    const loginTime = Date.now();
    const expiryTime = rememberMe
      ? loginTime + 30 * 24 * 60 * 60 * 1000 // 30 hari
      : loginTime + 24 * 60 * 60 * 1000; // 24 jam

    const sessionData = {
      ...userData,
      loginTime: loginTime,
      expiryTime: expiryTime,
    };

    setUser(sessionData);
    localStorage.setItem("user", JSON.stringify(sessionData));

    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
      console.log("✅ Remember Me enabled - session valid for 30 days");
    } else {
      localStorage.setItem("rememberMe", "false");
      console.log("✅ Session valid for 24 hours");
    }

    handleShowToast(`Selamat datang, ${userData.full_name}! 👋`, "success");
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
    handleShowToast("Logout berhasil! 👋", "info");
  }, []);

  const handleShowToast = useCallback((message, type = "info") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);

  const getToastStyle = () => {
    const baseStyle =
      "fixed top-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform";

    switch (toastType) {
      case "success":
        return `${baseStyle} bg-green-500`;
      case "error":
        return `${baseStyle} bg-red-500`;
      case "warning":
        return `${baseStyle} bg-yellow-500`;
      default:
        return `${baseStyle} bg-blue-500`;
    }
  };

  // ✅ HELPER FUNCTION: Cek apakah user ada di whitelist
  const isUserWhitelisted = useCallback(
    (userId) => {
      return whitelistUsers.some((u) => u.id === userId);
    },
    [whitelistUsers]
  );

  // ========== 6. PROTECTED ROUTE COMPONENT (UPDATED) ==========
  const ProtectedRoute = useCallback(
    ({ children, allowedRoles = [] }) => {
      if (loading || maintenanceLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Checking session...</p>
            </div>
          </div>
        );
      }

      if (!user) {
        return <Navigate to="/" />;
      }

      // ✅ CEK ROLE-BASED ACCESS
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        console.log(
          `🔴 User ${user.username} tidak memiliki akses ke halaman ini`
        );
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-9a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Akses Ditolak
              </h2>
              <p className="text-gray-600 mb-4">
                Anda tidak memiliki izin untuk mengakses halaman ini.
              </p>
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        );
      }

      // ✅ CEK MAINTENANCE dengan WHITELIST
      // User bisa akses jika:
      // 1. Bukan maintenance mode, ATAU
      // 2. User adalah admin, ATAU
      // 3. User ada di whitelist
      const canAccess =
        !isMaintenanceMode ||
        user.role === "admin" ||
        isUserWhitelisted(user.id);

      if (!canAccess) {
        console.log(`🔴 User ${user.username} blocked by maintenance mode`);
        return <MaintenancePage message={maintenanceMessage} />;
      }

      // ✅ Debug log untuk user yang bisa akses saat maintenance
      if (isMaintenanceMode && canAccess) {
        if (user.role === "admin") {
          console.log(`✅ Admin ${user.username} bypassed maintenance`);
        } else if (isUserWhitelisted(user.id)) {
          console.log(
            `✅ Whitelisted user ${user.username} bypassed maintenance`
          );
        }
      }

      return children;
    },
    [
      user,
      loading,
      maintenanceLoading,
      isMaintenanceMode,
      maintenanceMessage,
      isUserWhitelisted,
    ]
  );

  // ========== 7. LAYOUT WRAPPER ==========
  const LayoutWrapper = useCallback(
    ({ children }) => (
      <Layout user={user} onLogout={handleLogout}>
        {children}
      </Layout>
    ),
    [user, handleLogout]
  );

  // ========== 8. RENDER ADMIN PANEL (SPECIAL ROUTE - BYPASS MAINTENANCE) ==========
  const currentPath = window.location.pathname;
  if (currentPath === "/secret-admin-panel-2024") {
    return (
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}>
        <Routes>
          <Route path="/secret-admin-panel-2024" element={<AdminPanel />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // ========== 9. RENDER MAIN APP ==========
  if (loading || maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
      {/* Toast Notification */}
      {showToast && !isMaintenanceMode && (
        <div className={getToastStyle()}>
          <div className="flex items-center gap-2">
            {toastType === "success" && <span className="text-lg">✅</span>}
            {toastType === "error" && <span className="text-lg">❌</span>}
            {toastType === "warning" && <span className="text-lg">⚠️</span>}
            {toastType === "info" && <span className="text-lg">ℹ️</span>}
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} onShowToast={handleShowToast} />
            )
          }
        />

        {/* ========== PROTECTED ROUTES ========== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <Dashboard user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <Teachers user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/classes"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <Classes user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <Students user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <Attendance user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        {/* ✅ ROUTE BARU: PRESENSI GURU - HANYA UNTUK GURU & ADMIN */}
        <Route
          path="/attendance-teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher", "guru_bk", "admin"]}>
              <LayoutWrapper>
                <TeacherAttendance user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        {/* 👇 ROUTE ATTENDANCE-MANAGEMENT HANYA UNTUK ADMIN */}
        <Route
          path="/attendance-management"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <LayoutWrapper>
                <AttendanceManagement
                  user={user}
                  onShowToast={handleShowToast}
                />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/grades"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <Grades user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/jadwal-saya"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <TeacherSchedule user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/catatan-siswa"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <CatatanSiswa user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/konseling"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <Konseling user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <Reports user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/spmb"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <SPMB user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <Setting user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitor-sistem"
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <MonitorSistem user={user} onShowToast={handleShowToast} />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />

        {/* ========== CATCH-ALL ROUTE ========== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

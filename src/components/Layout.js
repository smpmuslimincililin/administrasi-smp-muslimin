import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, Clock, Settings, LogOut, Menu, X, User } from "lucide-react";
import Sidebar from "./Sidebar";

const Layout = ({ user, onLogout, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isLaptop, setIsLaptop] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const timerRef = useRef(null);
  const navigationTimeoutRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Cek apakah user memiliki akses ke halaman saat ini
  const hasAccessToCurrentPage = useCallback(() => {
    // Jika tidak ada user data, return false
    if (!user) return false;

    // Jika path adalah /attendance-management, hanya admin yang boleh akses
    if (location.pathname === "/attendance-management") {
      return user.role === "admin";
    }

    // Untuk halaman lainnya, semua role boleh akses
    return true;
  }, [user, location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      const isLaptopSize = window.innerWidth >= 1024;
      setIsLaptop(isLaptopSize);

      if (isLaptopSize) {
        setIsSidebarOpen(true);
        setMobileMenuOpen(false);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(updateTime, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isNavigating) {
      setIsNavigating(false);
    }
    setMobileMenuOpen(false);
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, [location.pathname]);

  const formatDate = (date) => {
    const options = {
      weekday: "short",
      day: "numeric",
      month: "short",
    };
    return date.toLocaleDateString("id-ID", options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "dashboard";
    if (path === "/teachers") return "teachers";
    if (path === "/students") return "students";
    if (path === "/classes") return "classes";
    if (path === "/attendance") return "attendance";
    if (path === "/attendance-management") return "attendance-management";
    if (path === "/attendance-teacher") return "attendance-teacher";
    if (path === "/grades") return "grades";
    if (path === "/jadwal-saya") return "jadwal-saya";
    if (path === "/catatan-siswa") return "catatan-siswa";
    if (path === "/konseling") return "konseling";
    if (path === "/reports") return "reports";
    if (path === "/spmb") return "spmb";
    if (path === "/settings") return "settings";
    if (path === "/monitor-sistem") return "monitor-sistem";
    return "dashboard";
  };

  const getCurrentPageName = () => {
    const pathMap = {
      "/dashboard": "Dashboard",
      "/students": "Data Siswa",
      "/teachers": "Data Guru",
      "/classes": "Data Kelas",
      "/attendance": "Kehadiran",
      "/attendance-management": "Management Presensi",
      "/attendance-teacher": "Presensi Guru",
      "/grades": "Nilai Akademik",
      "/jadwal-saya": "Jadwal Saya",
      "/catatan-siswa": "Catatan Siswa",
      "/konseling": "Konseling",
      "/reports": "Laporan",
      "/spmb": "SPMB",
      "/settings": "Pengaturan",
      "/monitor-sistem": "Monitor Sistem",
    };
    return pathMap[location.pathname] || "Dashboard";
  };

  const getPageSubtitle = () => {
    if (!user) return "SMP Muslimin";

    const { role, homeroom_class_id } = user;
    const currentPage = getCurrentPageName();

    const subtitles = {
      admin: {
        Dashboard: "Kelola Semua Data Sekolah",
        "Data Siswa": "Kelola Data Siswa Sekolah",
        "Data Guru": "Kelola Data Guru Sekolah",
        "Data Kelas": "Kelola Data Kelas Sekolah",
        Kehadiran: "Kelola Kehadiran Siswa",
        "Management Presensi": "Edit, Ubah Tanggal, atau Hapus Data Presensi",
        "Presensi Guru": "Kelola Presensi dan Absensi Guru",
        "Nilai Akademik": "Kelola Nilai Akademik Siswa",
        "Jadwal Saya": "Lihat Jadwal Mengajar",
        "Catatan Siswa": "Kelola Catatan Perkembangan Siswa",
        Konseling: "Kelola Data Konseling BK/BP",
        Laporan: "Generate dan Kelola Laporan",
        SPMB: "Seleksi Penerimaan Murid Baru",
        Pengaturan: "Pengaturan Sistem Sekolah",
        "Monitor Sistem": "Pemeriksaan Kesehatan Sistem dan Integritas Data",
      },
      guru_bk: {
        Dashboard: "Dashboard Bimbingan Konseling",
        "Data Siswa": "Lihat Data Siswa Sekolah",
        "Data Guru": "Lihat Data Guru Sekolah",
        "Jadwal Saya": "Lihat Jadwal Mengajar",
        "Presensi Guru": "Lihat Presensi Guru Sekolah",
        Laporan: "Laporan BK/BP",
        Konseling: "Kelola Data Konseling Siswa",
      },
      teacher: homeroom_class_id
        ? {
            Dashboard: `Kelola Data Kelas ${homeroom_class_id}`,
            "Data Siswa": `Kelola Data Siswa Kelas`,
            "Data Guru": "Kelola Data Guru Sekolah",
            "Data Kelas": `Informasi Kelas`,
            Kehadiran: `Input kehadiran Kelas`,
            "Management Presensi": "Kelola Data Presensi yang Sudah Diinput",
            "Presensi Guru": "Input Presensi dan Absensi Guru",
            "Nilai Akademik": `Input Nilai Kelas`,
            "Catatan Siswa": `Monitor Perkembangan Siswa Kelas ${homeroom_class_id}`,
            "Jadwal Saya": "Lihat Jadwal Mengajar Kelas",
            Laporan: `Laporan Kelas`,
            Pengaturan: "Pengaturan Akun",
          }
        : {
            Dashboard: "Monitor semua kelas yang diampu",
            "Data Siswa": "Lihat data siswa semua kelas",
            "Data Guru": "Lihat data guru sekolah",
            "Data Kelas": "Lihat informasi kelas",
            Kehadiran: "Input kehadiran mata pelajaran",
            "Management Presensi": "Kelola Data Presensi Mata Pelajaran",
            "Presensi Guru": "Input Presensi dan Absensi Guru",
            "Nilai Akademik": "Input nilai mata pelajaran",
            "Jadwal Saya": "Lihat Jadwal Mengajar",
            Laporan: "Laporan mata pelajaran",
            Pengaturan: "Pengaturan akun",
          },
    };

    return subtitles[role]?.[currentPage] || "SMP Muslimin";
  };

  const handleNavigate = useCallback(
    (page) => {
      if (isNavigating) return;

      const routes = {
        dashboard: "/dashboard",
        teachers: "/teachers",
        students: "/students",
        classes: "/classes",
        attendance: "/attendance",
        "attendance-management": "/attendance-management",
        "attendance-teacher": "/attendance-teacher",
        grades: "/grades",
        "jadwal-saya": "/jadwal-saya",
        "catatan-siswa": "/catatan-siswa",
        konseling: "/konseling",
        reports: "/reports",
        spmb: "/spmb",
        settings: "/settings",
        "monitor-sistem": "/monitor-sistem",
      };

      const path = routes[page];
      if (!path) return;

      // Cek akses sebelum navigasi
      if (path === "/attendance-management" && user?.role !== "admin") {
        // Redirect ke dashboard jika bukan admin
        navigate("/dashboard");
        return;
      }

      if (location.pathname === path) return;

      setIsNavigating(true);

      try {
        navigate(path);

        navigationTimeoutRef.current = setTimeout(() => {
          setIsNavigating(false);
        }, 2000);
      } catch (error) {
        console.error("Navigation error:", error);
        setIsNavigating(false);
      }
    },
    [isNavigating, location.pathname, navigate, user]
  );

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleLogoutClick = () => {
    setProfileDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const getUserRoleDisplay = () => {
    if (!user) return "User";
    const { role, homeroom_class_id } = user;

    if (role === "admin") return "Admin";
    if (role === "guru_bk") return "Guru BK/BP";
    if (role === "teacher" && homeroom_class_id)
      return `Wali ${homeroom_class_id}`;
    if (role === "teacher") return "Guru";
    return "User";
  };

  const currentPageName = getCurrentPageName();

  // Render halaman "Akses Ditolak" jika user tidak memiliki akses
  const renderContent = () => {
    if (!hasAccessToCurrentPage()) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-blue-100 p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
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
          <p className="text-gray-600 text-center mb-4">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Kembali ke Dashboard
          </button>
        </div>
      );
    }

    return isNavigating ? (
      <div className="flex items-center justify-center h-32 sm:h-48">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-blue-600 font-medium text-sm">Loading...</p>
        </div>
      </div>
    ) : (
      children
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 ${
          isSidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 hidden lg:block`}>
        <Sidebar
          currentPage={getCurrentPage()}
          onNavigate={handleNavigate}
          isOpen={isSidebarOpen}
          userRole={user?.role}
          isWaliKelas={!!user?.homeroom_class_id}
          userData={{
            full_name: user?.full_name || user?.username || "User",
            homeroom_class_name: user?.homeroom_class_id || "",
          }}
        />
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:hidden`}>
        <Sidebar
          currentPage={getCurrentPage()}
          onNavigate={handleNavigate}
          isOpen={true}
          userRole={user?.role}
          isWaliKelas={!!user?.homeroom_class_id}
          userData={{
            full_name: user?.full_name || user?.username || "User",
            homeroom_class_name: user?.homeroom_class_id || "",
          }}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>

      <main
        className={`flex-1 min-h-screen transition-all duration-300 ${
          isSidebarOpen && isLaptop ? "lg:ml-64" : "ml-0"
        }`}>
        <header className="bg-white shadow-md shadow-blue-100/50 border-b border-blue-100 sticky top-0 z-30">
          <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                <button
                  onClick={
                    isLaptop
                      ? () => setIsSidebarOpen(!isSidebarOpen)
                      : toggleMobileMenu
                  }
                  className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors touch-manipulation"
                  style={{ minWidth: "44px", minHeight: "44px" }}>
                  {isSidebarOpen && isLaptop ? (
                    <X size={20} />
                  ) : (
                    <Menu size={20} />
                  )}
                </button>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                      {currentPageName}
                    </h1>
                    {isNavigating && (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-blue-600 font-medium truncate lg:block">
                    {getPageSubtitle()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
                <div className="lg:hidden flex flex-col items-center min-w-[60px]">
                  <div className="flex items-center gap-1 text-blue-600">
                    <Clock size={14} className="text-blue-500 flex-shrink-0" />
                    <span className="font-mono text-xs font-semibold text-gray-900">
                      {formatTime(currentTime)}
                    </span>
                  </div>
                  <span className="text-xs text-blue-500 font-medium">
                    {formatDate(currentTime)}
                  </span>
                </div>

                <div className="hidden lg:flex bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl px-4 py-3 min-w-[280px] shadow-sm">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-1">
                      <Calendar
                        size={16}
                        className="text-blue-500 flex-shrink-0"
                      />
                      <span>
                        {currentTime.toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock
                        size={16}
                        className="text-blue-500 flex-shrink-0"
                      />
                      <span className="font-mono font-semibold text-gray-900 text-base tracking-wide">
                        {currentTime.toLocaleTimeString("id-ID")}
                      </span>
                      <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded ml-1">
                        WIB
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={toggleProfileDropdown}
                    className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 bg-blue-600 flex items-center gap-1 sm:gap-2 touch-manipulation"
                    style={{ minWidth: "44px", minHeight: "44px" }}>
                    <User size={16} className="text-white flex-shrink-0" />
                    <span className="hidden sm:block text-sm font-medium text-white">
                      Profile
                    </span>
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white border border-blue-100 rounded-xl shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {user?.full_name || user?.username || "User"}
                        </p>
                        <p className="text-xs text-blue-600 capitalize font-medium">
                          {user?.role === "admin"
                            ? "Administrator"
                            : user?.role === "guru_bk"
                            ? "Guru BK/BP"
                            : user?.role === "teacher" &&
                              user?.homeroom_class_id
                            ? `Wali Kelas ${user.homeroom_class_id}`
                            : user?.role === "teacher"
                            ? "Guru Mata Pelajaran"
                            : "User"}
                        </p>
                        {user?.teacher_id && (
                          <p className="text-xs text-gray-500 font-medium">
                            ID: {user.teacher_id}
                          </p>
                        )}
                      </div>

                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate("/settings?tab=profile");
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 touch-manipulation">
                          <User size={16} className="flex-shrink-0" />
                          <span className="font-medium">Profile</span>
                        </button>

                        {user?.role === "admin" && (
                          <button
                            onClick={() => {
                              handleNavigate("settings");
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 touch-manipulation">
                            <Settings size={16} className="flex-shrink-0" />
                            <span className="font-medium">Pengaturan</span>
                          </button>
                        )}

                        <button
                          onClick={handleLogoutClick}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 touch-manipulation">
                          <LogOut size={16} className="flex-shrink-0" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen p-3 sm:p-4 lg:p-6">
          {renderContent()}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <LogOut className="w-8 h-8 text-blue-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Keluar dari Sistem?
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Anda harus login kembali untuk mengakses sistem
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  Batal
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg shadow-blue-600/30">
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

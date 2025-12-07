import React from "react";

const Sidebar = ({
  currentPage,
  onNavigate,
  isOpen,
  userRole,
  isWaliKelas,
  userData = {},
}) => {
  const isGuruBK = userRole === "guru_bk";
  const isAdmin = userRole === "admin";
  const isTeacher = userRole === "teacher";

  // Ambil data user
  const fullName = userData.full_name || "User";
  const roleName =
    userRole === "admin"
      ? "Administrator"
      : userRole === "guru_bk"
      ? "Guru BK"
      : isWaliKelas
      ? `Wali Kelas ${userData.homeroom_class_name || ""}`
      : userRole === "teacher"
      ? "Guru"
      : "Pengguna";

  // Generate initial dari nama depan dan belakang
  const getInitials = (name) => {
    const words = name
      .trim()
      .split(" ")
      .filter((word) => word.length > 0);
    if (words.length === 0) return "U";
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    // Ambil huruf pertama dari kata pertama dan kata terakhir
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(fullName);

  return (
    <div
      className={`
      h-screen w-64
      bg-blue-900 text-white border-r border-blue-800
      overflow-y-auto transition-all duration-300 flex flex-col
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `}>
      {/* Header */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center gap-3">
          {/* Logo Sekolah */}
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-lg">
            <img
              src="/logo_sekolah.PNG"
              alt="Logo SMP Muslimin Cililin"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-lg font-bold text-white leading-tight">
              SMP MUSLIMIN
            </div>
            <div className="text-lg font-bold text-white leading-tight mt-1">
              CILILIN
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="py-4 flex-1">
        {/* Menu Utama */}
        <div className="mb-5">
          <div className="px-6 pb-2 text-xs uppercase font-semibold text-blue-300 tracking-wider">
            Menu Utama
          </div>
          <a
            href="#dashboard"
            className={`
              flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
              ${
                currentPage === "dashboard"
                  ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                  : "hover:text-blue-100"
              }
            `}
            onClick={(e) => {
              e.preventDefault();
              onNavigate("dashboard");
            }}>
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m7 7 5-5 5 5"
              />
            </svg>
            <span className="flex-1 text-sm">Dashboard</span>
          </a>
        </div>

        {/* Master Data - Untuk semua role */}
        <div className="mb-5">
          <div className="px-6 pb-2 text-xs uppercase font-semibold text-blue-300 tracking-wider">
            Master Data
          </div>

          {/* Data Guru - Untuk semua role */}
          <a
            href="#teachers"
            className={`
              flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
              ${
                currentPage === "teachers"
                  ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                  : "hover:text-blue-100"
              }
            `}
            onClick={(e) => {
              e.preventDefault();
              onNavigate("teachers");
            }}>
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="flex-1 text-sm">Data Guru</span>
          </a>

          {/* Data Kelas - Untuk semua role */}
          <a
            href="#classes"
            className={`
              flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
              ${
                currentPage === "classes"
                  ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                  : "hover:text-blue-100"
              }
            `}
            onClick={(e) => {
              e.preventDefault();
              onNavigate("classes");
            }}>
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="flex-1 text-sm">Data Kelas</span>
          </a>

          {/* Data Siswa - Untuk semua role */}
          <a
            href="#students"
            className={`
              flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
              ${
                currentPage === "students"
                  ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                  : "hover:text-blue-100"
              }
            `}
            onClick={(e) => {
              e.preventDefault();
              onNavigate("students");
            }}>
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v1M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="flex-1 text-sm">Data Siswa</span>
          </a>
        </div>

        {/* Akademik */}
        <div className="mb-5">
          <div className="px-6 pb-2 text-xs uppercase font-semibold text-blue-300 tracking-wider">
            Akademik
          </div>

          {/* ✅ PRESENSI GURU - Untuk Admin, Teacher, dan Guru BK */}
          {(isAdmin || isTeacher || isGuruBK) && (
            <a
              href="#attendance-teacher"
              className={`
                flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
                ${
                  currentPage === "attendance-teacher"
                    ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                    : "hover:text-blue-100"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("attendance-teacher");
              }}>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="flex-1 text-sm">Presensi Guru</span>
            </a>
          )}

          {/* Presensi Siswa - Untuk Admin dan non-Guru BK */}
          {(isAdmin || !isGuruBK) && (
            <a
              href="#attendance"
              className={`
                flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
                ${
                  currentPage === "attendance"
                    ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                    : "hover:text-blue-100"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("attendance");
              }}>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span className="flex-1 text-sm">Presensi Siswa</span>
            </a>
          )}

          {/* Management Presensi - HANYA UNTUK ADMIN */}
          {false && isAdmin && (
            <a
              href="#attendance-management"
              className={`
                flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
                ${
                  currentPage === "attendance-management"
                    ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                    : "hover:text-blue-100"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("attendance-management");
              }}>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="flex-1 text-sm">Management Presensi</span>
            </a>
          )}

          {/* Nilai - Untuk Admin dan non-Guru BK */}
          {(isAdmin || !isGuruBK) && (
            <a
              href="#grades"
              className={`
                flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
                ${
                  currentPage === "grades"
                    ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                    : "hover:text-blue-100"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("grades");
              }}>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="flex-1 text-sm">Nilai Siswa</span>
            </a>
          )}

          {/* CATATAN SISWA - Untuk Admin dan Wali Kelas */}
          {(isAdmin || (isWaliKelas && !isGuruBK)) && (
            <a
              href="#catatan-siswa"
              className={`
                flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
                ${
                  currentPage === "catatan-siswa"
                    ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                    : "hover:text-blue-100"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("catatan-siswa");
              }}>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="flex-1 text-sm">Catatan Siswa</span>
            </a>
          )}

          {/* Jadwal Saya - Untuk Admin, Guru & Wali Kelas (bukan Guru BK) */}
          {(isAdmin ||
            (!isGuruBK &&
              (userRole === "teacher" || userRole === "homeroom"))) && (
            <a
              href="#jadwal-saya"
              className={`
                flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
                ${
                  currentPage === "jadwal-saya"
                    ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                    : "hover:text-blue-100"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("jadwal-saya");
              }}>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="flex-1 text-sm">Jadwal Saya</span>
            </a>
          )}

          {/* Konseling - Untuk Admin & Guru BK */}
          {(isAdmin || isGuruBK) && (
            <a
              href="#konseling"
              className={`
                flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
                ${
                  currentPage === "konseling"
                    ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                    : "hover:text-blue-100"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("konseling");
              }}>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="flex-1 text-sm">Konseling</span>
            </a>
          )}

          {/* Laporan - Untuk Admin, Guru & Guru BK */}
          {(isAdmin || isGuruBK || userRole === "teacher") && (
            <a
              href="#reports"
              className={`
                flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
                ${
                  currentPage === "reports"
                    ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                    : "hover:text-blue-100"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("reports");
              }}>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="flex-1 text-sm">Laporan</span>
            </a>
          )}
        </div>

        {/* Admin Settings */}
        {userRole === "admin" && (
          <div className="mb-4">
            <div className="px-6 pb-2 text-xs uppercase font-semibold text-blue-300 tracking-wider">
              Sistem
            </div>

            {/* SPMB */}
            <a
              href="#spmb"
              className={`
                flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
                ${
                  currentPage === "spmb"
                    ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                    : "hover:text-blue-100"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("spmb");
              }}>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="flex-1 text-sm">SPMB</span>
            </a>

            {/* Pengaturan */}
            <a
              href="#settings"
              className={`
                flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
                ${
                  currentPage === "settings"
                    ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                    : "hover:text-blue-100"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("settings");
              }}>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="flex-1 text-sm">Pengaturan</span>
            </a>

            {/* Monitor Sistem */}
            <a
              href="#monitor-sistem"
              className={`
                flex items-center gap-3 px-6 py-2.5 text-white font-medium transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:pl-8 rounded-r-full mr-4
                ${
                  currentPage === "monitor-sistem"
                    ? "bg-blue-800 border-r-4 border-blue-400 font-semibold text-blue-100 pl-8"
                    : "hover:text-blue-100"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                onNavigate("monitor-sistem");
              }}>
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <span className="flex-1 text-sm">Monitor Sistem</span>
            </a>
          </div>
        )}
      </nav>

      {/* User Profile Section - DI BAWAH PALING BAWAH */}
      <div className="mt-auto border-t border-blue-700 p-4 bg-blue-800">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white font-bold text-sm">{initials}</span>
          </div>
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">
              {fullName}
            </div>
            <div className="text-xs text-blue-200 truncate">{roleName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

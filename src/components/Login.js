// components/Login.js
import React, { useState, useEffect, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../supabaseClient";
import Logo from "./Logo";
import backgroundImage from "../assets/Background.JPG";

export const Login = ({ onLogin, onShowToast }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [errors, setErrors] = useState({});
  const [stats, setStats] = useState({
    activeTeachers: 0,
    activeStudents: 0,
    grades: 0,
    classes: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStatsData = async () => {
    try {
      setStatsLoading(true);

      const [teachersResult, studentsResult, gradesResult, classesResult] =
        await Promise.all([
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true)
            .in("role", ["teacher", "guru_bk"])
            .neq("username", "adenurmughni"),

          supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),

          supabase
            .from("classes")
            .select("grade")
            .eq("is_active", true)
            .in("grade", [7, 8, 9]),

          supabase
            .from("classes")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
        ]);

      const teacherCount = teachersResult.count || 0;
      const studentCount = studentsResult.count || 0;
      const classesCount = classesResult.count || 0;

      const uniqueGrades = new Set(
        (gradesResult.data || []).map((item) => item.grade)
      );
      const gradesCount = uniqueGrades.size;

      setStats({
        activeTeachers: teacherCount,
        activeStudents: studentCount,
        grades: gradesCount,
        classes: classesCount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const memoizedStats = useMemo(() => stats, [stats]);

  useEffect(() => {
    fetchStatsData();

    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => {
      setTimeout(() => setImageLoaded(true), 100);
    };
    img.onerror = () => {
      console.error("Failed to load background image");
      setImageLoaded(true);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!username) {
      setErrors({ username: "Username harus diisi" });
      setIsLoading(false);
      return;
    }
    if (!password) {
      setErrors({ password: "Password harus diisi" });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Username tidak ditemukan");
        }
        throw new Error("Terjadi kesalahan sistem: " + error.message);
      }

      if (!data) {
        throw new Error("Username tidak ditemukan");
      }

      // Tambahkan console.log untuk debug
      console.log("===== DEBUG PASSWORD =====");
      console.log("Input password:", `"${password}"`);
      console.log("Input length:", password.length);
      console.log("DB password:", `"${data.password}"`);
      console.log("DB length:", data.password.length);
      console.log("Match:", data.password === password);
      console.log("========================");

      if (data.password !== password) {
        throw new Error("Password salah");
      }

      const userData = {
        id: data.id,
        username: data.username,
        role: data.role,
        nama: data.full_name,
        full_name: data.full_name,
        teacher_id: data.teacher_id,
        homeroom_class_id: data.homeroom_class_id,
        email: data.email || `${data.username}@smp.edu`,
        is_active: data.is_active,
        created_at: data.created_at,
      };

      onLogin(userData, rememberMe);

      if (onShowToast) {
        onShowToast(`Selamat datang, ${userData.full_name}! 👋`, "success");
      }
    } catch (error) {
      setErrors({ general: error.message });

      if (onShowToast) {
        onShowToast(error.message, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
        /* Fix browser autofill kuning */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.1) inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <div className="flex-1 flex flex-col lg:flex-row relative z-10">
        {/* PHOTO SECTION - Enhanced with overlays */}
        <div
          className={`relative overflow-hidden flex-shrink-0 h-[35vh] lg:h-auto lg:flex-[7] transition-all duration-1000 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: imageLoaded ? `url(${backgroundImage})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
            backgroundRepeat: "no-repeat",
          }}>
          {/* Loading State */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                <div
                  className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-purple-400/50 rounded-full animate-spin"
                  style={{ animationDuration: "1.5s" }}></div>
              </div>
            </div>
          )}

          {/* Multi-layer gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-pink-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]"></div>

          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 animate-shimmer opacity-20"></div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping"
              style={{ animationDuration: "3s" }}></div>
            <div
              className="absolute top-3/4 right-1/3 w-2 h-2 bg-blue-300/30 rounded-full animate-ping"
              style={{ animationDuration: "4s", animationDelay: "1s" }}></div>
            <div
              className="absolute top-1/2 right-1/4 w-2 h-2 bg-purple-300/30 rounded-full animate-ping"
              style={{ animationDuration: "5s", animationDelay: "2s" }}></div>
          </div>
        </div>

        {/* FORM SECTION - Premium glassmorphism */}
        <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden flex-1 lg:flex-[2] bg-gradient-to-br from-slate-900/50 to-blue-900/50 backdrop-blur-xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}></div>

          <form
            className={`relative w-full max-w-md lg:max-w-sm transition-all duration-700 delay-500 ${
              imageLoaded
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-12"
            }`}
            onSubmit={handleSubmit}>
            {/* Glass card with enhanced effects */}
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl relative overflow-hidden group hover:bg-white/[0.12] transition-all duration-500 hover:scale-[1.02] hover:shadow-blue-500/20">
              {/* Gradient border effect on hover */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20 transition-all duration-500 -z-10"></div>

              {/* Header with logo */}
              <div className="text-center mb-8 relative">
                <div className="mb-4 flex justify-center">
                  <div className="relative group/logo">
                    <Logo
                      size="medium"
                      className="opacity-90 drop-shadow-2xl transition-transform duration-300 group-hover/logo:scale-110"
                    />
                    <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full scale-150 group-hover/logo:bg-blue-400/30 transition-all duration-300"></div>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                  Selamat Datang
                </h2>
                <p className="text-blue-200/80 text-sm sm:text-base">
                  Silakan Masuk Ke Akun Anda
                </p>
                <div className="mt-3 w-16 h-1 mx-auto bg-gradient-to-r from-transparent via-blue-400/50 to-transparent rounded-full"></div>
              </div>

              {/* Username Field - Enhanced */}
              <div className="mb-5 relative group/input">
                <label className="block font-semibold text-white/90 mb-2 text-sm tracking-wide">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    className={`w-full px-4 py-3.5 bg-white/10 backdrop-blur-sm border-2 rounded-xl text-white placeholder-white/40 transition-all duration-300 autofill:bg-white/10 autofill:text-white ${
                      errors.username
                        ? "border-red-400/50 shadow-lg shadow-red-500/20"
                        : "border-white/20 focus:border-blue-400/50 focus:shadow-lg focus:shadow-blue-500/20"
                    } focus:outline-none hover:border-white/30`}
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover/input:from-blue-500/5 group-hover/input:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
                {errors.username && (
                  <div className="text-red-300 text-sm mt-2 flex items-center font-medium animate-pulse">
                    <span className="mr-2">⚠️</span>
                    {errors.username}
                  </div>
                )}
              </div>

              {/* Password Field - Enhanced */}
              <div className="mb-5 relative group/input">
                <label className="block font-semibold text-white/90 mb-2 text-sm tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className={`w-full px-4 py-3.5 pr-12 bg-white/10 backdrop-blur-sm border-2 rounded-xl text-white placeholder-white/40 transition-all duration-300 autofill:bg-white/10 autofill:text-white ${
                      errors.password
                        ? "border-red-400/50 shadow-lg shadow-red-500/20"
                        : "border-white/20 focus:border-purple-400/50 focus:shadow-lg focus:shadow-purple-500/20"
                    } focus:outline-none hover:border-white/30`}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-all duration-300 p-2 hover:bg-white/10 rounded-lg"
                    onClick={togglePasswordVisibility}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover/input:from-purple-500/5 group-hover/input:to-pink-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
                {errors.password && (
                  <div className="text-red-300 text-sm mt-2 flex items-center font-medium animate-pulse">
                    <span className="mr-2">⚠️</span>
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Error Message - Enhanced */}
              {errors.general && (
                <div className="mb-5 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 rounded-xl text-sm font-medium shadow-lg shadow-red-500/10 animate-pulse">
                  ⚠️ {errors.general}
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex justify-between items-center mb-6">
                <label className="flex items-center gap-2 cursor-pointer group/check">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-white/10 border-2 border-white/30 checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all cursor-pointer"
                  />
                  <span className="text-sm text-white/80 group-hover/check:text-white transition-colors select-none">
                    Ingat saya
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm text-blue-300 hover:text-blue-200 transition-colors font-medium hover:underline">
                  Lupa password?
                </a>
              </div>

              {/* Submit Button - Navy Classic */}
              <button
                type="submit"
                className="relative w-full py-4 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 hover:from-blue-800 hover:via-blue-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all duration-500 flex items-center justify-center shadow-xl shadow-blue-900/40 hover:shadow-2xl hover:shadow-blue-800/60 hover:scale-[1.02] active:scale-[0.98] group/btn overflow-hidden"
                disabled={isLoading}>
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>

                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span className="relative z-10">Login</span>
                )}
              </button>

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-xs text-white/60 mb-1">
                  © 2025 SMP MUSLIMIN CILILIN
                </p>
                <p className="text-xs text-white/40">
                  Sistem Administrasi Sekolah • v1.0.0
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

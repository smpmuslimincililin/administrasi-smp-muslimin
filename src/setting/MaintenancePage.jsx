import React from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

const MaintenancePage = ({ message }) => {
  const navigate = useNavigate();

  // ✅ Handle Refresh - Clear session & redirect to login
  const handleRefresh = () => {
    try {
      // Clear all session data
      localStorage.removeItem("user");
      localStorage.removeItem("userSession");
      localStorage.removeItem("rememberMe");

      console.log("🔄 Refreshing... Redirecting to login");

      // Redirect to login
      navigate("/", { replace: true });

      // Force reload untuk clear state
      window.location.reload();
    } catch (error) {
      console.error("❌ Refresh error:", error);
      // Force redirect anyway
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl max-w-xl w-full text-center">
        {/* Icon Animasi */}
        <div className="text-6xl sm:text-8xl mb-6 animate-bounce">🔧</div>

        {/* Judul */}
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-4">
          Sedang Maintenance
        </h1>

        {/* Pesan */}
        <p className="text-gray-600 text-sm sm:text-lg mb-8 leading-relaxed">
          {message ||
            "Aplikasi sedang dalam maintenance. Kami akan kembali segera!"}
        </p>

        {/* Refresh Button - Single & Clean */}
        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
          <RefreshCw size={20} />
          <span>Refresh Halaman</span>
        </button>

        {/* Footer */}
        <p className="text-gray-500 text-sm mt-8">
          Mohon maaf atas ketidaknyamanannya 🙏
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;

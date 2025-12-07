import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

// ✅ Halaman Maintenance
const MaintenancePage = ({ message }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-xl text-center">
        <div className="text-8xl mb-6 animate-bounce">🔧</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Sedang Maintenance
        </h1>
        <p className="text-gray-600 text-lg mb-6 leading-relaxed">
          {message ||
            "Aplikasi sedang dalam maintenance. Kami akan kembali segera!"}
        </p>
        <p className="text-gray-500 text-sm mt-6">
          Mohon maaf atas ketidaknyamanannya 🙏
        </p>
      </div>
    </div>
  );
};

// ✅ Protected Route Component
const ProtectedRoute = ({ children, user, isLoading }) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Check maintenance mode dari Supabase
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { data, error } = await supabase
          .from("school_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["maintenance_mode", "maintenance_message"]);

        if (error) throw error;

        const settings = {};
        data?.forEach((item) => {
          settings[item.setting_key] = item.setting_value;
        });

        setMaintenanceMode(
          settings.maintenance_mode === "true" ||
            settings.maintenance_mode === true
        );
        setMaintenanceMessage(
          settings.maintenance_message ||
            "Aplikasi sedang dalam maintenance. Kami akan kembali segera!"
        );
      } catch (error) {
        console.error("Error checking maintenance mode:", error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();

    // ✅ Cek setiap 5 detik (realtime check)
    const interval = setInterval(checkMaintenance, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ Jika maintenance ON dan user bukan admin, tampilkan maintenance page
  if (maintenanceMode && user?.role !== "admin") {
    return <MaintenancePage message={maintenanceMessage} />;
  }

  // ✅ Tampilkan halaman normal
  return children;
};

export default ProtectedRoute;

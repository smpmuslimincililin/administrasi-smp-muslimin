import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AdminPanel = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from("app_config")
      .select("*")
      .eq("id", 1)
      .single();

    if (data) {
      setIsMaintenanceMode(data.is_maintenance);
      setMessage(data.maintenance_message);
    }
    setIsLoading(false);
  };

  const toggleMaintenance = async () => {
    const newStatus = !isMaintenanceMode;

    const { error } = await supabase
      .from("app_config")
      .update({
        is_maintenance: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (!error) {
      setIsMaintenanceMode(newStatus);
      alert(newStatus ? "🔧 MAINTENANCE MODE ON!" : "✅ MAINTENANCE MODE OFF!");
    }
  };

  const updateMessage = async () => {
    const { error } = await supabase
      .from("app_config")
      .update({
        maintenance_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (!error) {
      alert("✅ Pesan berhasil diupdate!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8">🎛️ Admin Control Panel</h1>

        {/* STATUS */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Status Aplikasi:</p>
          <p
            className={`text-2xl font-bold ${
              isMaintenanceMode ? "text-red-500" : "text-green-500"
            }`}>
            {isMaintenanceMode ? "🔴 MAINTENANCE MODE" : "🟢 ONLINE"}
          </p>
        </div>

        {/* TOMBOL TOGGLE */}
        <button
          onClick={toggleMaintenance}
          className={`w-full py-4 px-6 rounded-lg font-bold text-xl transition-all transform hover:scale-105 ${
            isMaintenanceMode
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}>
          {isMaintenanceMode
            ? "✅ AKTIFKAN APLIKASI"
            : "🔧 MATIKAN APLIKASI (MAINTENANCE)"}
        </button>

        {/* EDIT MESSAGE */}
        <div className="mt-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pesan Maintenance:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg mb-4"
            rows="4"
          />
          <button
            onClick={updateMessage}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold">
            💾 Update Pesan
          </button>
        </div>

        {/* INFO */}
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Perhatian:</strong> Perubahan akan langsung terlihat oleh
            semua user secara real-time!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

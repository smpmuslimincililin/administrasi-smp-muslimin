import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Trash2,
  Database,
  Calendar,
  Play,
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

const DatabaseCleanupMonitor = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [cleanupHistory, setCleanupHistory] = useState([]);
  const [autoCleanup, setAutoCleanup] = useState({
    enabled: true,
    healthLogsRetention: 7,
    attendanceRetention: 730,
  });

  // Fetch database statistics
  const fetchStats = async () => {
    try {
      const tables = [
        "students",
        "attendances",
        "grades",
        "student_development_notes",
        "siswa_baru",
        "konseling",
        "users",
        "system_health_logs",
        "teacher_schedules",
      ];

      const tableStats = {};

      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });

        if (!error) {
          tableStats[table] = count || 0;
        }
      }

      const totalRecords = Object.values(tableStats).reduce(
        (sum, count) => sum + count,
        0
      );
      const estimatedSizeMB = (totalRecords / 1000) * 0.1;

      setStats({
        tables: tableStats,
        totalRecords,
        estimatedSizeMB: estimatedSizeMB.toFixed(2),
        percentUsed: ((estimatedSizeMB / 500) * 100).toFixed(1),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Cleanup health logs
  const cleanupHealthLogs = async (retentionDays) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await supabase
        .from("system_health_logs")
        .delete()
        .lt("created_at", cutoffDate.toISOString())
        .select("id");

      if (error) throw error;

      return {
        success: true,
        deletedCount: data?.length || 0,
        table: "system_health_logs",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        table: "system_health_logs",
      };
    }
  };

  // Cleanup old attendances
  const cleanupOldAttendances = async (retentionDays) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await supabase
        .from("attendances")
        .delete()
        .lt("date", cutoffDate.toISOString().split("T")[0])
        .select("id");

      if (error) throw error;

      return {
        success: true,
        deletedCount: data?.length || 0,
        table: "attendances",
      };
    } catch (error) {
      return { success: false, error: error.message, table: "attendances" };
    }
  };

  // Run manual cleanup
  const runManualCleanup = async () => {
    if (
      !window.confirm(
        "Yakin mau jalankan cleanup? Data lama akan dihapus permanent!"
      )
    ) {
      return;
    }

    setLoading(true);
    const results = [];

    try {
      // Cleanup health logs
      const healthResult = await cleanupHealthLogs(
        autoCleanup.healthLogsRetention
      );
      results.push(healthResult);

      // Cleanup attendances
      const attendanceResult = await cleanupOldAttendances(
        autoCleanup.attendanceRetention
      );
      results.push(attendanceResult);

      // Save to history
      await supabase.from("cleanup_history").insert({
        results: results,
        triggered_by: "manual",
        timestamp: new Date().toISOString(),
      });

      // Refresh stats
      await fetchStats();
      await fetchCleanupHistory();

      alert("✅ Cleanup berhasil dijalankan!");
    } catch (error) {
      console.error("Cleanup error:", error);
      alert("❌ Cleanup gagal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cleanup history
  const fetchCleanupHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("cleanup_history")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(10);

      if (!error && data) {
        setCleanupHistory(data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCleanupHistory();
  }, []);

  const getStatusColor = (percent) => {
    if (percent < 50) return "text-green-600 bg-green-50";
    if (percent < 80) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  // Helper function to safely parse results
  const parseResults = (results) => {
    if (!results) return [];
    if (Array.isArray(results)) return results;

    // If it's a string, try to parse it
    if (typeof results === "string") {
      try {
        const parsed = JSON.parse(results);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    // If it's an object with tables_cleaned property
    if (results.tables_cleaned && Array.isArray(results.tables_cleaned)) {
      return results.tables_cleaned;
    }

    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Database className="w-7 h-7" />
            Database Cleanup Manager
          </h2>
          <p className="text-gray-600 mt-1">
            Monitor dan kelola penggunaan database
          </p>
        </div>
        <button
          onClick={runManualCleanup}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
          <Play className="w-5 h-5" />
          {loading ? "Running..." : "Run Cleanup"}
        </button>
      </div>

      {/* Database Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Records</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats.totalRecords?.toLocaleString() || 0}
              </p>
            </div>
            <Database className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Estimated Size</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats.estimatedSizeMB || 0} MB
              </p>
            </div>
            <Info className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Storage Used</p>
              <p
                className={`text-3xl font-bold mt-1 ${
                  getStatusColor(stats.percentUsed).split(" ")[0]
                }`}>
                {stats.percentUsed || 0}%
              </p>
            </div>
            {parseFloat(stats.percentUsed) < 50 ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-yellow-500" />
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Free Tier Limit</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">500 MB</p>
            </div>
            <Database className="w-10 h-10 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Storage Progress Bar */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Database Storage
          </span>
          <span className="text-sm font-medium text-gray-700">
            {stats.estimatedSizeMB || 0} / 500 MB
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${
              parseFloat(stats.percentUsed) < 50
                ? "bg-green-500"
                : parseFloat(stats.percentUsed) < 80
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{
              width: `${Math.min(stats.percentUsed || 0, 100)}%`,
            }}></div>
        </div>
      </div>

      {/* Table Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Records Per Table
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats.tables || {}).map(([table, count]) => (
            <div
              key={table}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{table}</span>
              <span className="text-sm font-bold text-gray-900">
                {count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cleanup Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Cleanup Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Health Logs Retention (days)
            </label>
            <input
              type="number"
              value={autoCleanup.healthLogsRetention}
              onChange={(e) =>
                setAutoCleanup({
                  ...autoCleanup,
                  healthLogsRetention: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              max="90"
            />
            <p className="text-xs text-gray-500 mt-1">
              Hapus logs lebih dari N hari
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendance Retention (days)
            </label>
            <input
              type="number"
              value={autoCleanup.attendanceRetention}
              onChange={(e) =>
                setAutoCleanup({
                  ...autoCleanup,
                  attendanceRetention: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="365"
              max="3650"
            />
            <p className="text-xs text-gray-500 mt-1">
              Hapus presensi lebih dari N hari (~
              {Math.floor(autoCleanup.attendanceRetention / 365)} tahun)
            </p>
          </div>
        </div>
      </div>

      {/* Cleanup History */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Cleanup History
        </h3>
        {cleanupHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Belum ada history cleanup
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                    Timestamp
                  </th>
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                    Triggered By
                  </th>
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">
                    Results
                  </th>
                </tr>
              </thead>
              <tbody>
                {cleanupHistory.map((item, idx) => {
                  const results = parseResults(item.results);

                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 text-sm text-gray-600">
                        {new Date(item.timestamp).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-600 capitalize">
                        {item.triggered_by}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-600">
                        {results.length === 0 ? (
                          <span className="text-gray-400">No results</span>
                        ) : (
                          results.map((r, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 mb-1">
                              {r.success ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                              <span>
                                {r.table}: {r.deletedCount || 0} deleted
                              </span>
                            </div>
                          ))
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">
              Recommendations:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>
                Jalankan cleanup manual setiap minggu atau setup auto-cleanup
              </li>
              <li>Keep health logs max 7-14 hari (cukup untuk debugging)</li>
              <li>Keep attendances 2-3 tahun (untuk keperluan historis)</li>
              <li>Backup data ke Excel sebelum cleanup permanent</li>
              {parseFloat(stats.percentUsed) > 60 && (
                <li className="text-red-600 font-semibold">
                  ⚠️ Storage usage tinggi! Consider upgrade atau aggressive
                  cleanup
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseCleanupMonitor;

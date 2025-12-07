import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function ChangePasswordSection({ user }) {
  // 🔍 DEBUG: Log user props
  console.log("🔍 DEBUG USER PROPS:", user);
  console.log("🔍 USER ID:", user?.id);
  console.log("🔍 USER KEYS:", user ? Object.keys(user) : "user is null");

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear message saat user mulai ngetik lagi
    if (message.text) setMessage({ type: "", text: "" });
  };

  const toggleShowPassword = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  const validateForm = () => {
    // Cek semua field terisi
    if (
      !formData.currentPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      setMessage({ type: "error", text: "Semua field harus diisi!" });
      return false;
    }

    // Cek panjang password baru minimal 6 karakter
    if (formData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password baru minimal 6 karakter!" });
      return false;
    }

    // Cek password baru dan konfirmasi sama
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: "error",
        text: "Password baru dan konfirmasi tidak sama!",
      });
      return false;
    }

    // Cek password baru tidak sama dengan password lama
    if (formData.currentPassword === formData.newPassword) {
      setMessage({
        type: "error",
        text: "Password baru harus berbeda dengan password lama!",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // 🔍 DEBUG: Log user object
      console.log("📝 Starting password change for user:", user);

      // Verifikasi user tersedia
      if (!user) {
        console.error("❌ User object is null/undefined");
        throw new Error("User tidak ditemukan. Silakan login ulang.");
      }

      // Support both user.id and user.userId (dari localStorage)
      const userId = user.id || user.userId;

      if (!userId) {
        console.error("❌ USER STRUCTURE:", user);
        throw new Error("User ID tidak ditemukan. Silakan login ulang.");
      }

      console.log("✅ Using user ID:", userId);

      // Verifikasi password lama dari tabel users
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("password")
        .eq("id", userId)
        .single();

      console.log("📊 Query result:", { userData, fetchError });

      if (fetchError) {
        console.error("❌ Error fetching user:", fetchError);
        throw new Error("Gagal memverifikasi password lama");
      }

      if (!userData) {
        console.error("❌ User data not found for ID:", userId);
        throw new Error("Data user tidak ditemukan");
      }

      // Cek apakah password lama cocok
      if (userData.password !== formData.currentPassword) {
        console.log("❌ Password lama tidak cocok");
        setMessage({ type: "error", text: "Password lama salah!" });
        setLoading(false);
        return;
      }

      console.log("✅ Password lama cocok, updating...");

      // Update password baru ke database
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: formData.newPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("❌ Error updating password:", updateError);
        throw new Error("Gagal mengubah password");
      }

      console.log("✅ Password berhasil diubah!");

      // Berhasil
      setMessage({ type: "success", text: "Password berhasil diubah!" });

      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("❌ Error changing password:", error);
      setMessage({
        type: "error",
        text: error.message || "Terjadi kesalahan saat mengubah password",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Tampilkan error jika user tidak ada
  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">
            ⚠️ User Tidak Ditemukan
          </h3>
          <p className="text-red-700 text-sm mb-3">
            Terjadi kesalahan dalam memuat data user. Silakan logout dan login
            kembali.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm">
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Ubah Password
      </h2>

      {/* Info User */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Username:</span> {user.username}
        </p>
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Nama:</span> {user.full_name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {/* Password Lama */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password Lama
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? "text" : "password"}
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => toggleShowPassword("current")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              {showPasswords.current ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Password Baru */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password Baru
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => toggleShowPassword("new")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              {showPasswords.new ? "🙈" : "👁️"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
        </div>

        {/* Konfirmasi Password Baru */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => toggleShowPassword("confirm")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              {showPasswords.confirm ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`p-3 rounded-md text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
          {loading ? "Mengubah Password..." : "Ubah Password"}
        </button>
      </form>
    </div>
  );
}

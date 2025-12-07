// src/attendance-teacher/ManualCheckIn.js
import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Save,
  CheckCircle,
  XCircle,
  MapPin,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { validateAttendance } from "./LocationValidator"; // 🎯 MASTER VALIDATOR

const ManualCheckIn = ({ currentUser, onSuccess }) => {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().split(" ")[0].slice(0, 5); // HH:MM

  const [formData, setFormData] = useState({
    date: today,
    status: "Hadir",
    clockIn: now,
    notes: "",
    teacherId: null, // Untuk admin bisa pilih guru lain
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teachersList, setTeachersList] = useState([]);

  const statusOptions = [
    { value: "Hadir", label: "Hadir", color: "bg-green-500" },
    { value: "Izin", label: "Izin", color: "bg-blue-500" },
    { value: "Sakit", label: "Sakit", color: "bg-yellow-500" },
    { value: "Alpa", label: "Alpa", color: "bg-red-500" },
  ];

  // Check if user is admin
  useEffect(() => {
    checkAdminStatus();
  }, [currentUser]);

  // Load teachers list for admin
  useEffect(() => {
    if (isAdmin) {
      loadTeachers();
    }
  }, [isAdmin]);

  // Pre-check location saat component mount (untuk status "Hadir" only)
  useEffect(() => {
    if (formData.status === "Hadir" && !isAdmin) {
      checkLocation();
    } else {
      setLocationStatus(null);
    }
  }, [formData.status, isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      if (error) throw error;
      setIsAdmin(data.role === "admin");
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("teacher_id, full_name, username")
        .eq("role", "teacher")
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      setTeachersList(data || []);
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const checkLocation = async () => {
    setCheckingLocation(true);

    // 🎯 PANGGIL MASTER VALIDATOR
    const validation = await validateAttendance({
      method: "manual",
      userId: currentUser.id,
    });

    setLocationStatus(validation);
    setCheckingLocation(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // ========================================
      // 🎯 VALIDASI MENGGUNAKAN MASTER VALIDATOR
      // ========================================

      // Admin bypass validasi
      if (!isAdmin) {
        // Status "Hadir" perlu validasi lengkap
        if (formData.status === "Hadir") {
          const validation = await validateAttendance({
            method: "manual",
            userId: currentUser.id,
          });

          setLocationStatus(validation);

          // ❌ Kalau ada error yang blocking
          if (!validation.isValid) {
            const errorMessages = validation.errors
              .map((err) => `• ${err.message}`)
              .join("\n");

            // Cek apakah ada help text untuk GPS error
            const gpsError = validation.errors.find((err) => err.help);
            const helpText = gpsError?.help
              ? `\n\n📱 Panduan:\n${gpsError.help}`
              : "";

            setMessage({
              type: "error",
              text: `❌ Presensi tidak dapat dilakukan:\n\n${errorMessages}${helpText}\n\n💡 Jika ada kendala, hubungi Admin untuk bantuan.`,
            });
            setLoading(false);
            return;
          }

          // ⚠️ Tampilkan warning jika ada (jadwal)
          if (validation.data.warnings && validation.data.warnings.length > 0) {
            const warningMessages = validation.data.warnings
              .map((warn) => warn.message)
              .join("\n\n");

            const confirmMessage = `⚠️ Perhatian!\n\n${warningMessages}\n\nTetap lanjutkan presensi?`;
            const confirmed = window.confirm(confirmMessage);

            if (!confirmed) {
              setLoading(false);
              return;
            }
          }
        }
        // Status selain "Hadir" (Izin/Sakit/Alpa) - cuma cek waktu operational
        else {
          const validation = await validateAttendance({
            method: "manual",
            userId: currentUser.id,
          });

          // Cek error waktu saja
          const timeError = validation.errors.find(
            (err) => err.code === "TIME_NOT_ALLOWED"
          );
          if (timeError) {
            const currentTime = new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Jakarta",
              hour12: false,
            });

            setMessage({
              type: "error",
              text: `⏰ Presensi Hanya Dapat Dilakukan Pada Jam 07:00 - 14:00 WIB.\nWaktu saat ini: ${currentTime} WIB\n\n💡 Jika Lupa Input Presensi, Harap Hubungi Admin Untuk Bantuan.`,
            });
            setLoading(false);
            return;
          }
        }
      }

      // ========================================
      // PROSES SUBMIT ATTENDANCE
      // ========================================

      // Get teacher_id
      let targetTeacherId;
      let targetTeacherName;

      if (isAdmin && formData.teacherId) {
        // Admin input untuk guru lain
        targetTeacherId = formData.teacherId;
        const teacher = teachersList.find(
          (t) => t.teacher_id === formData.teacherId
        );
        targetTeacherName = teacher?.full_name || "Unknown";
      } else {
        // Guru input sendiri atau admin input untuk diri sendiri
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("teacher_id, full_name")
          .eq("id", currentUser.id)
          .single();

        if (userError) throw userError;

        if (!userData.teacher_id) {
          throw new Error("Teacher ID tidak ditemukan");
        }

        targetTeacherId = userData.teacher_id;
        targetTeacherName = userData.full_name;
      }

      // Cek apakah sudah ada presensi di tanggal yang dipilih
      const { data: existingAttendance, error: checkError } = await supabase
        .from("teacher_attendance")
        .select("*")
        .eq("teacher_id", targetTeacherId)
        .eq("attendance_date", formData.date)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      // Prepare attendance metadata (untuk audit trail)
      const attendanceMetadata = {
        check_in_method: isAdmin ? "admin_manual" : "manual",
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      };

      // Tambahkan info admin jika di-input oleh admin
      if (isAdmin) {
        const { data: adminData } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", currentUser.id)
          .single();

        attendanceMetadata.admin_info = JSON.stringify({
          admin_id: currentUser.id,
          admin_name: adminData?.full_name || "Admin",
          input_time: new Date().toISOString(),
          reason: formData.notes || "Input manual oleh admin",
        });
      }

      // Tambahkan GPS metadata dari validation result
      if (!isAdmin && formData.status === "Hadir" && locationStatus?.isValid) {
        const locationData = locationStatus.data.location;

        if (locationData.allowed && locationData.coords) {
          attendanceMetadata.gps_location = JSON.stringify({
            lat: locationData.coords.lat,
            lng: locationData.coords.lng,
            distance: locationData.distance,
            accuracy: locationData.accuracy,
            timestamp: new Date().toISOString(),
          });
        }
      } else if (
        !isAdmin &&
        formData.status === "Hadir" &&
        !locationStatus?.isValid
      ) {
        // GPS error tapi diizinkan submit
        const locationError = locationStatus?.errors?.find(
          (err) => err.code.includes("GPS") || err.code.includes("LOCATION")
        );

        attendanceMetadata.gps_location = JSON.stringify({
          error: locationError?.code || "GPS_UNAVAILABLE",
          message: locationError?.message || "Lokasi tidak tersedia",
          timestamp: new Date().toISOString(),
        });
      }

      // Jika sudah ada, update. Jika belum, insert
      if (existingAttendance) {
        // UPDATE existing attendance
        const { error: updateError } = await supabase
          .from("teacher_attendance")
          .update({
            status: formData.status,
            clock_in: formData.clockIn + ":00", // Format TIME: HH:MM:SS
            ...attendanceMetadata,
          })
          .eq("id", existingAttendance.id);

        if (updateError) throw updateError;

        setMessage({
          type: "success",
          text: isAdmin
            ? `✅ Presensi ${targetTeacherName} tanggal ${formData.date} berhasil diupdate!`
            : `✅ Presensi tanggal ${formData.date} berhasil diupdate!`,
        });
      } else {
        // INSERT new attendance
        const { error: insertError } = await supabase
          .from("teacher_attendance")
          .insert({
            teacher_id: targetTeacherId,
            attendance_date: formData.date,
            status: formData.status,
            clock_in: formData.clockIn + ":00", // Format TIME: HH:MM:SS
            ...attendanceMetadata,
          });

        if (insertError) throw insertError;

        setMessage({
          type: "success",
          text: isAdmin
            ? `✅ Presensi ${targetTeacherName} tanggal ${formData.date} berhasil disimpan!`
            : `✅ Presensi tanggal ${formData.date} berhasil disimpan!`,
        });
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);

      // Trigger refresh di parent
      if (onSuccess) onSuccess();

      // Reset form
      setFormData({
        date: today,
        status: "Hadir",
        clockIn: now,
        notes: "",
        teacherId: null,
      });

      // Re-check location after reset (hanya untuk non-admin)
      if (!isAdmin) {
        setTimeout(() => {
          checkLocation();
        }, 500);
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      setMessage({
        type: "error",
        text: "Gagal menyimpan presensi: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2">
          {isAdmin && <Shield className="text-blue-600" size={20} />}
          Input Presensi Manual
          {isAdmin && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              ADMIN MODE
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-600">
          {isAdmin
            ? "Mode Admin: Dapat input presensi kapan saja untuk semua guru"
            : "Isi form di bawah untuk mencatat presensi"}
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 transition-all duration-500 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 animate-fade-in"
              : "bg-red-50 border border-red-200 animate-fade-in"
          }`}>
          {message.type === "success" ? (
            <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
          ) : (
            <XCircle className="text-red-600 flex-shrink-0" size={24} />
          )}
          <p
            className={`text-sm font-medium whitespace-pre-line ${
              message.type === "success" ? "text-green-800" : "text-red-800"
            }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pilih Guru (Hanya untuk Admin) */}
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Shield size={18} className="text-blue-600" />
              Pilih Guru (Opsional)
            </label>
            <select
              value={formData.teacherId || ""}
              onChange={(e) =>
                handleChange("teacherId", e.target.value || null)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih Guru --</option>
              {teachersList.map((teacher) => (
                <option key={teacher.teacher_id} value={teacher.teacher_id}>
                  {teacher.full_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              * Pilih Guru Yang Akan Diinputkan Presensinya
            </p>
          </div>
        )}

        {/* Tanggal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Calendar size={18} />
            Tanggal Presensi
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            max={isAdmin ? undefined : today}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? "* Admin dapat memilih tanggal kapan saja"
              : "* Bisa pilih tanggal mundur untuk input presensi yang terlupa"}
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Kehadiran
          </label>
          <div className="grid grid-cols-2 gap-3">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange("status", option.value)}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.status === option.value
                    ? `${option.color} text-white shadow-lg scale-105`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                {option.label}
              </button>
            ))}
          </div>
          {formData.status !== "Hadir" && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <AlertTriangle size={14} />
              Status selain "Hadir" hanya memerlukan validasi waktu operational
            </p>
          )}
        </div>

        {/* Jam Masuk */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Clock size={18} />
            Jam Masuk
          </label>
          <input
            type="time"
            value={formData.clockIn}
            onChange={(e) => handleChange("clockIn", e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan (Opsional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
            placeholder="Contoh: Sakit demam, Ada keperluan keluarga, dll..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 ${
            isAdmin
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-green-600 hover:bg-green-700"
          } disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg`}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={20} />
              {isAdmin ? "Simpan Presensi (Admin)" : "Simpan Presensi"}
            </>
          )}
        </button>
      </form>

      {/* Info */}
      <div
        className={`${
          isAdmin
            ? "bg-blue-50 border-blue-200"
            : "bg-green-50 border-green-200"
        } border rounded-lg p-4`}>
        <p className="text-sm text-gray-800">
          <strong>ℹ️ Info:</strong>{" "}
          {isAdmin
            ? "Sebagai Admin, Anda dapat input presensi kapan saja tanpa batasan waktu. Pastikan mengisi catatan untuk audit trail."
            : "Input manual presensi hanya tersedia pada jam 07:00 - 14:00. Jika lupa input, hubungi Admin untuk bantuan."}
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ManualCheckIn;

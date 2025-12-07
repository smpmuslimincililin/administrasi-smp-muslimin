// attendance-teacher/LocationValidator.js
// MASTER VALIDATOR - Single Source of Truth untuk semua validasi presensi

import { supabase } from "../supabaseClient";

// ========================================
// 🔧 KONFIGURASI - DISESUAIKAN DENGAN SEKOLAH 🔧
// ========================================

const SCHOOL_COORDS = {
  lat: -6.954475, // Koordinat sekolah
  lng: 107.416448,
};

const SCHOOL_RADIUS = 100; // 200 meter radius
// Quality Excellent - bisa pakai radius 150-200m

// Debug mode - set true untuk lihat detail GPS di console
const DEBUG_MODE = true;

// ========================================
// ⏰ TIME WINDOW untuk Input Presensi (Manual & QR)
// ========================================
const OPERATIONAL_HOURS = {
  startHour: 7,
  startMinute: 0,
  endHour: 14,
  endMinute: 0,
};

// ========================================
// 🎯 MASTER VALIDATOR - PANGGIL INI DARI MANUAL & QR
// ========================================

/**
 * FUNGSI UTAMA - Validasi lengkap untuk presensi (Manual & QR)
 *
 * @param {Object} options - { method: 'manual' | 'qr', userId: string }
 * @returns {Promise<Object>} - { isValid, errors: [], data: {}, message }
 *
 * Usage:
 * - Manual: validateAttendance({ method: 'manual', userId })
 * - QR: validateAttendance({ method: 'qr', userId })
 */
export const validateAttendance = async (options = {}) => {
  const { method = "manual", userId } = options;

  const errors = [];
  const validationData = {
    method,
    timestamp: new Date().toISOString(),
  };

  // ========================================
  // STEP 1: Validasi Waktu Operational (07:00-14:00)
  // ========================================
  const timeValidation = validateOperationalTime();
  validationData.time = timeValidation;

  if (!timeValidation.allowed) {
    errors.push({
      code: "TIME_NOT_ALLOWED",
      message: timeValidation.message,
    });
  }

  // ========================================
  // STEP 2: Validasi Lokasi GPS (Semua Method)
  // ========================================
  const locationValidation = await validateLocation();
  validationData.location = locationValidation;

  if (!locationValidation.allowed) {
    errors.push({
      code: locationValidation.error || "LOCATION_NOT_ALLOWED",
      message: locationValidation.message,
      help: locationValidation.help,
    });
  }

  // ========================================
  // STEP 3: Validasi Jadwal Guru (Optional Warning)
  // ========================================
  if (userId) {
    const scheduleValidation = await validateTeacherSchedule(userId);
    validationData.schedule = scheduleValidation;

    // Ini cuma warning, bukan blocking
    if (scheduleValidation.suspicious) {
      validationData.warnings = validationData.warnings || [];
      validationData.warnings.push({
        code: scheduleValidation.reason,
        message: scheduleValidation.message,
      });
    }
  }

  // ========================================
  // RESULT
  // ========================================
  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    data: validationData,
    message: isValid
      ? `✅ Validasi berhasil - Jarak ${validationData.location.distance}m dari sekolah`
      : `❌ ${errors.map((e) => e.message).join(". ")}`,
  };
};

// ========================================
// 📍 VALIDASI LOKASI GPS
// ========================================

/**
 * Hitung jarak antara 2 koordinat menggunakan Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check browser support & permission status
 */
const checkGeolocationSupport = async () => {
  if (!navigator.geolocation) {
    return {
      supported: false,
      message:
        "Browser Anda tidak mendukung GPS. Gunakan Chrome atau Firefox terbaru.",
    };
  }

  if (navigator.permissions) {
    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        return {
          supported: true,
          permissionDenied: true,
          message:
            "Akses lokasi diblokir. Buka pengaturan browser → Site Settings → Location → Izinkan",
        };
      }

      return { supported: true, permissionState: permission.state };
    } catch (error) {
      console.log("Permission API not supported, continuing...");
    }
  }

  return { supported: true };
};

/**
 * Validasi lokasi GPS (dipakai oleh master validator)
 */
const validateLocation = async () => {
  const supportCheck = await checkGeolocationSupport();

  if (!supportCheck.supported) {
    return {
      allowed: false,
      error: "GEOLOCATION_NOT_SUPPORTED",
      message: supportCheck.message,
    };
  }

  if (supportCheck.permissionDenied) {
    return {
      allowed: false,
      error: "GPS_PERMISSION_DENIED",
      message: supportCheck.message,
      help: getPermissionHelp(),
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          SCHOOL_COORDS.lat,
          SCHOOL_COORDS.lng
        );

        const isWithinRadius = distance <= SCHOOL_RADIUS;

        const result = {
          allowed: isWithinRadius,
          distance: Math.round(distance),
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          accuracy: Math.round(position.coords.accuracy),
          timestamp: position.timestamp,
          message: isWithinRadius
            ? `Anda berada ${Math.round(distance)}m dari sekolah`
            : `Anda berada ${Math.round(
                distance
              )}m dari sekolah. Presensi hanya bisa dilakukan dalam radius ${SCHOOL_RADIUS}m`,
        };

        if (DEBUG_MODE) {
          console.log("📍 GPS DEBUG INFO:");
          console.log("📍 Lokasi Anda:", {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: `±${Math.round(position.coords.accuracy)}m`,
          });
          console.log("🏫 Lokasi Sekolah:", SCHOOL_COORDS);
          console.log("📏 Jarak:", `${Math.round(distance)}m`);
          console.log("✅ Radius Max:", `${SCHOOL_RADIUS}m`);
          console.log("🎯 Status:", isWithinRadius ? "✅ VALID" : "❌ INVALID");
          console.log(
            "🗺️ Lihat di Maps:",
            `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
          );
        }

        resolve(result);
      },
      (error) => {
        let errorMessage = "Tidak dapat mengakses lokasi";
        let errorCode = "GPS_ERROR";
        let help = null;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Akses lokasi ditolak";
            errorCode = "GPS_PERMISSION_DENIED";
            help = getPermissionHelp();
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Lokasi tidak tersedia. Pastikan GPS HP aktif dan Anda berada di luar ruangan";
            errorCode = "GPS_UNAVAILABLE";
            break;
          case error.TIMEOUT:
            errorMessage =
              "Waktu habis saat mencari lokasi. Pastikan GPS aktif dan coba lagi";
            errorCode = "GPS_TIMEOUT";
            break;
        }

        console.error("❌ GPS Error:", errorCode, error);

        resolve({
          allowed: false,
          error: errorCode,
          message: errorMessage,
          help: help,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Get help text based on user device
 */
const getPermissionHelp = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("android")) {
    if (userAgent.includes("chrome")) {
      return "📱 Cara Mengizinkan di Android Chrome:\n1. Tap ikon 🔒 di address bar\n2. Tap 'Permissions'\n3. Izinkan 'Location'\n4. Refresh halaman ini";
    }
    return "📱 Cara Mengizinkan di Android:\n1. Buka Settings HP\n2. Apps → Browser → Permissions\n3. Aktifkan Location\n4. Refresh halaman ini";
  }

  if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
    if (userAgent.includes("safari")) {
      return "📱 Cara Mengizinkan di iPhone Safari:\n1. Buka Settings iPhone\n2. Safari → Location\n3. Pilih 'Ask' atau 'Allow'\n4. Refresh halaman ini";
    }
    if (userAgent.includes("crios")) {
      return "📱 Cara Mengizinkan di iPhone Chrome:\n1. Buka Settings iPhone\n2. Chrome → Location\n3. Pilih 'While Using'\n4. Refresh halaman ini";
    }
  }

  return "📱 Cara Mengizinkan:\n1. Buka pengaturan browser\n2. Cari 'Site Settings' atau 'Permissions'\n3. Izinkan akses lokasi untuk situs ini\n4. Refresh halaman";
};

// ========================================
// ⏰ VALIDASI WAKTU OPERATIONAL
// ========================================

/**
 * Validasi waktu operational sekolah (07:00-14:00)
 */
const validateOperationalTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const currentMinutes = hour * 60 + minute;
  const startMinutes =
    OPERATIONAL_HOURS.startHour * 60 + OPERATIONAL_HOURS.startMinute;
  const endMinutes =
    OPERATIONAL_HOURS.endHour * 60 + OPERATIONAL_HOURS.endMinute;

  const isWithinWindow =
    currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  if (!isWithinWindow) {
    return {
      allowed: false,
      currentTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(
        2,
        "0"
      )}`,
      message: `Presensi hanya bisa dilakukan jam ${
        OPERATIONAL_HOURS.startHour
      }:${OPERATIONAL_HOURS.startMinute.toString().padStart(2, "0")} - ${
        OPERATIONAL_HOURS.endHour
      }:${OPERATIONAL_HOURS.endMinute
        .toString()
        .padStart(2, "0")} (jam operational sekolah)`,
    };
  }

  return {
    allowed: true,
    currentTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}`,
    message: "Waktu presensi valid",
  };
};

// ========================================
// 📅 VALIDASI JADWAL GURU
// ========================================

/**
 * Check apakah guru punya jadwal hari ini
 */
export const validateTeacherSchedule = async (userId) => {
  try {
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const today = dayNames[new Date().getDay()];

    console.log("📅 Checking schedule for user:", userId, "Day:", today);

    const { data: schedules, error } = await supabase
      .from("teacher_schedules")
      .select("*")
      .eq("teacher_id", userId)
      .eq("day", today)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching schedule:", error);
      return {
        hasSchedule: null,
        suspicious: false,
        error: "SCHEDULE_CHECK_FAILED",
        message: "Tidak dapat memvalidasi jadwal",
      };
    }

    console.log("📅 Schedules found:", schedules?.length || 0);

    if (!schedules || schedules.length === 0) {
      return {
        hasSchedule: false,
        suspicious: true,
        reason: "NO_SCHEDULE_TODAY",
        message: `Anda tidak memiliki jadwal mengajar hari ini (${today})`,
      };
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}:00`;

    const firstClass = schedules[0];

    if (currentTime > firstClass.start_time) {
      return {
        hasSchedule: true,
        suspicious: true,
        reason: "LATE_CHECKIN",
        schedules: schedules,
        message: `Kelas pertama Anda dimulai pukul ${firstClass.start_time.slice(
          0,
          5
        )} (Kelas ${firstClass.class_id})`,
      };
    }

    return {
      hasSchedule: true,
      suspicious: false,
      schedules: schedules,
      totalClasses: schedules.length,
      message: `Hari ini Anda mengajar ${schedules.length} kelas`,
    };
  } catch (error) {
    console.error("Error validating schedule:", error);
    return {
      hasSchedule: null,
      suspicious: false,
      error: "SCHEDULE_CHECK_FAILED",
      message: "Tidak dapat memvalidasi jadwal",
    };
  }
};

// ========================================
// 🔄 BACKWARD COMPATIBILITY (Optional - bisa dihapus nanti)
// ========================================

/**
 * @deprecated Use validateAttendance() instead
 * Legacy function - kept for backward compatibility
 */
export const validateAttendanceLocation = validateLocation;

/**
 * @deprecated Use validateAttendance() instead
 * Legacy function - kept for backward compatibility
 */
export const validateManualInputTime = validateOperationalTime;

// ========================================
// 📤 EXPORTS
// ========================================

export default {
  // 🎯 MASTER VALIDATOR - USE THIS
  validateAttendance,

  // Individual validators (jika perlu dipakai terpisah)
  validateTeacherSchedule,

  // Config
  SCHOOL_COORDS,
  SCHOOL_RADIUS,
  OPERATIONAL_HOURS,

  // Legacy (backward compatibility)
  validateAttendanceLocation,
  validateManualInputTime,
};

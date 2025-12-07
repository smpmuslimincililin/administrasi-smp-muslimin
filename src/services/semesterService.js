// src/services/semesterService.js - FOR SMP
import { supabase } from "../supabaseClient";

/**
 * GET SEMESTER DATA (Summary View) - SMP VERSION
 * For: Semester tab - aggregated data tanpa detail harian
 */
export const getSemesterData = async (
  semester,
  academicYear,
  classId,
  subject,
  type = "mapel"
) => {
  try {
    console.log("=== FETCH SEMESTER DATA (SMP) ===");
    console.log({
      classId,
      academicYear,
      semester,
      subject,
      type,
    });

    // Determine months based on semester
    let months =
      semester === "Ganjil" ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];

    // FETCH ALL DATA dengan PAGINATION
    console.log("🔍 Fetching with pagination...");

    let allRecords = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("attendances")
        .select(
          `
          *,
          students!inner(id, full_name, nis)
        `
        )
        .eq("class_id", classId)
        .eq("subject", subject)
        .eq("type", type)
        .order("date", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error("❌ Query error on page", page + 1, ":", error);
        throw error;
      }

      if (data && data.length > 0) {
        allRecords = [...allRecords, ...data];
        console.log(
          `📄 Page ${page + 1}: ${data.length} records (Total: ${
            allRecords.length
          })`
        );

        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    console.log("✅ Total attendance records fetched:", allRecords.length);

    if (allRecords.length === 0) return [];

    // Filter by month
    const filteredData = allRecords.filter((r) => {
      const parts = r.date.split("-");
      const month = parseInt(parts[1], 10);
      return months.includes(month);
    });

    console.log("Data setelah filter bulan:", filteredData.length);

    if (filteredData.length === 0) return [];

    // Calculate unique dates (hari efektif)
    const uniqueDates = [...new Set(filteredData.map((r) => r.date))];
    const totalHariEfektif = uniqueDates.length;

    console.log("🎯 HARI EFEKTIF:", totalHariEfektif);

    // Get unique students
    const uniqueStudents = {};
    filteredData.forEach((r) => {
      if (!uniqueStudents[r.student_id]) {
        uniqueStudents[r.student_id] = {
          student_id: r.student_id,
          full_name: r.students?.full_name || "Unknown",
          nis: r.students?.nis || "-",
        };
      }
    });

    // Aggregate per siswa
    const studentMap = {};
    Object.values(uniqueStudents).forEach((student) => {
      studentMap[student.student_id] = {
        student_id: student.student_id,
        full_name: student.full_name,
        nis: student.nis,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
      };
    });

    // Count attendance by status
    filteredData.forEach((r) => {
      if (studentMap[r.student_id]) {
        const status = r.status?.toLowerCase();
        if (status === "hadir") studentMap[r.student_id].hadir++;
        else if (status === "sakit") studentMap[r.student_id].sakit++;
        else if (status === "izin") studentMap[r.student_id].izin++;
        else if (status === "alpa" || status === "alpha")
          studentMap[r.student_id].alpa++;
      }
    });

    // Return dengan percentage
    return Object.values(studentMap).map((st) => {
      const totalRecords = st.hadir + st.sakit + st.izin + st.alpa;
      const percentage =
        totalHariEfektif > 0
          ? Math.round((st.hadir / totalHariEfektif) * 100)
          : 0;

      return {
        ...st,
        total: totalHariEfektif,
        totalRecords: totalRecords,
        percentage,
      };
    });
  } catch (error) {
    console.error("Error getSemesterData:", error);
    return [];
  }
};

/**
 * GET MONTHLY DETAIL DATA (Daily Status View) - SMP VERSION
 * For: Monthly tab - dengan detail harian per tanggal
 */
export const getMonthlyDetailData = async (
  month,
  year,
  classId,
  subject,
  type = "mapel"
) => {
  try {
    console.log("=== FETCH MONTHLY DETAIL DATA (SMP) ===");
    console.log({
      month,
      year,
      classId,
      subject,
      type,
    });

    // Calculate date range
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(
      lastDay
    ).padStart(2, "0")}`;

    console.log("📅 Date range:", { startDate, endDate });

    // FETCH DATA dengan PAGINATION
    let allRecords = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("attendances")
        .select(
          `
          *,
          students!inner(id, full_name, nis)
        `
        )
        .eq("class_id", classId)
        .eq("subject", subject)
        .eq("type", type)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error("❌ Query error:", error);
        throw error;
      }

      if (data && data.length > 0) {
        allRecords = [...allRecords, ...data];
        console.log(`📄 Page ${page + 1}: ${data.length} records`);

        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    console.log("✅ Total records:", allRecords.length);

    if (allRecords.length === 0) return [];

    // Calculate unique dates
    const uniqueDates = [...new Set(allRecords.map((r) => r.date))];
    const totalHariEfektif = uniqueDates.length;

    console.log("🎯 HARI EFEKTIF:", totalHariEfektif);

    // Get unique students
    const uniqueStudents = {};
    allRecords.forEach((r) => {
      if (!uniqueStudents[r.student_id]) {
        uniqueStudents[r.student_id] = {
          student_id: r.student_id,
          full_name: r.students?.full_name || "Unknown",
          nis: r.students?.nis || "-",
        };
      }
    });

    // Build student map dengan dailyStatus
    const studentMap = {};
    Object.values(uniqueStudents).forEach((student) => {
      studentMap[student.student_id] = {
        student_id: student.student_id,
        full_name: student.full_name,
        nis: student.nis,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        dailyStatus: {},
      };
    });

    // Process records
    allRecords.forEach((r) => {
      if (studentMap[r.student_id]) {
        const status = r.status?.toLowerCase();

        // Store daily status
        studentMap[r.student_id].dailyStatus[r.date] = status;

        // Count totals
        if (status === "hadir") studentMap[r.student_id].hadir++;
        else if (status === "sakit") studentMap[r.student_id].sakit++;
        else if (status === "izin") studentMap[r.student_id].izin++;
        else if (status === "alpa" || status === "alpha")
          studentMap[r.student_id].alpa++;
      }
    });

    // Return dengan percentage dan dailyStatus
    return Object.values(studentMap).map((st) => {
      const total = st.hadir + st.sakit + st.izin + st.alpa;
      const percentage =
        totalHariEfektif > 0
          ? Math.round((st.hadir / totalHariEfektif) * 100)
          : 0;

      return {
        student_id: st.student_id,
        name: st.full_name,
        nis: st.nis,
        hadir: st.hadir,
        sakit: st.sakit,
        izin: st.izin,
        alpa: st.alpa,
        total,
        percentage,
        dailyStatus: st.dailyStatus,
      };
    });
  } catch (error) {
    console.error("Error getMonthlyDetailData:", error);
    return [];
  }
};

/**
 * HELPER: Generate Academic Year String
 */
export const getAcademicYear = (month, year) => {
  const semester = month >= 7 ? "Ganjil" : "Genap";
  return semester === "Ganjil" ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

/**
 * HELPER: Get Semester Type from Month
 */
export const getSemesterType = (month) => {
  return month >= 7 ? "Ganjil" : "Genap";
};

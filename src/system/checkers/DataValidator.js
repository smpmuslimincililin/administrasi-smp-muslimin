// src/system/checkers/DataValidator.js
import { supabase } from "../../supabaseClient";

/**
 * DataValidator - Comprehensive data validation checking
 * Checks: Data Integrity, Invalid Dates, Missing Required Data, Invalid References
 */

export const checkDataValidation = async () => {
  console.log("🔍 DataValidator: Starting comprehensive validation...");

  const issues = [];
  const startTime = Date.now();

  try {
    // 1. Validate Student Data
    console.log("👨‍🎓 Validating student data...");
    const studentIssues = await validateStudents();
    issues.push(...studentIssues);

    // 2. Validate User Data
    console.log("👤 Validating user data...");
    const userIssues = await validateUsers();
    issues.push(...userIssues);

    // 3. Validate Attendance Data
    console.log("📅 Validating attendance data...");
    const attendanceIssues = await validateAttendances();
    issues.push(...attendanceIssues);

    // 4. Validate Grade Data
    console.log("📊 Validating grade data...");
    const gradeIssues = await validateGrades();
    issues.push(...gradeIssues);

    // 5. Validate Academic Year Data
    console.log("📚 Validating academic year data...");
    const academicYearIssues = await validateAcademicYears();
    issues.push(...academicYearIssues);

    // 6. Validate Teacher Assignments
    console.log("👨‍🏫 Validating teacher assignments...");
    const assignmentIssues = await validateTeacherAssignments();
    issues.push(...assignmentIssues);

    // 7. Validate Konseling Data
    console.log("💬 Validating konseling data...");
    const konselingIssues = await validateKonseling();
    issues.push(...konselingIssues);

    // 8. Validate Siswa Baru Data
    console.log("🆕 Validating siswa baru data...");
    const siswaBaruIssues = await validateSiswaBaru();
    issues.push(...siswaBaruIssues);

    const executionTime = Date.now() - startTime;
    console.log(`✅ DataValidator completed in ${executionTime}ms`);
    console.log(`📊 Found ${issues.length} validation issues:`);
    issues.forEach((issue, index) => {
      console.log(
        `   ${index + 1}. ${issue.severity === "critical" ? "🚨" : "⚠️"} ${
          issue.message
        }`
      );
      console.log(`      📝 ${issue.details}`);
    });

    return {
      success: true,
      issues,
      executionTime,
    };
  } catch (error) {
    console.error("❌ DataValidator error:", error);
    return {
      success: false,
      issues: [
        {
          category: "data",
          severity: "critical",
          message: "Data validator failed",
          details: error.message,
          table: "system",
        },
      ],
      executionTime: Date.now() - startTime,
    };
  }
};

/**
 * Validate Students Data
 */
const validateStudents = async () => {
  const issues = [];

  try {
    // 1. Students with invalid gender
    const { data: invalidGender } = await supabase
      .from("students")
      .select("id, full_name, gender")
      .not("gender", "in", '("L","P")')
      .limit(20);

    if (invalidGender && invalidGender.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Students with invalid gender values",
        details: `Found ${
          invalidGender.length
        } students with gender not 'L' or 'P': ${invalidGender
          .map((s) => `${s.full_name} (${s.gender})`)
          .slice(0, 5)
          .join(", ")}`,
        table: "students",
      });
    }

    // 2. Students without class (active students)
    const { data: noClass } = await supabase
      .from("students")
      .select("id, full_name, is_active")
      .eq("is_active", true)
      .is("class_id", null)
      .limit(20);

    if (noClass && noClass.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Active students without class assignment",
        details: `Found ${noClass.length} active students not assigned to any class`,
        table: "students",
      });
    }

    // 3. Students with duplicate NIS in same academic year
    const { data: students } = await supabase
      .from("students")
      .select("nis, academic_year, full_name")
      .not("nis", "is", null)
      .neq("nis", "")
      .order("academic_year", { ascending: false })
      .limit(500);

    if (students) {
      const nisMap = new Map();
      students.forEach((student) => {
        const key = `${student.nis}-${student.academic_year}`;
        if (nisMap.has(key)) {
          nisMap.get(key).push(student.full_name);
        } else {
          nisMap.set(key, [student.full_name]);
        }
      });

      const duplicates = Array.from(nisMap.entries()).filter(
        ([_, names]) => names.length > 1
      );

      if (duplicates.length > 0) {
        issues.push({
          category: "data",
          severity: "critical",
          message: "Duplicate NIS in same academic year",
          details: `Found ${
            duplicates.length
          } NIS duplicates. Examples: ${duplicates
            .slice(0, 3)
            .map(([key, names]) => `${key.split("-")[0]} (${names.join(", ")})`)
            .join("; ")}`,
          table: "students",
        });
      }
    }

    // 4. Students with very short names (likely data entry error)
    const { data: shortNames } = await supabase
      .from("students")
      .select("id, full_name")
      .not("full_name", "is", null)
      .limit(1000);

    if (shortNames) {
      const tooShort = shortNames.filter(
        (s) => s.full_name && s.full_name.trim().length < 3
      );
      if (tooShort.length > 0) {
        issues.push({
          category: "data",
          severity: "info",
          message: "Students with suspiciously short names",
          details: `Found ${tooShort.length} students with names shorter than 3 characters`,
          table: "students",
        });
      }
    }

    // 5. Inactive students in current academic year
    const { data: activeYear } = await supabase
      .from("academic_years")
      .select("year, semester")
      .eq("is_active", true)
      .single();

    if (activeYear) {
      const { data: inactiveInCurrent } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("academic_year", activeYear.year)
        .eq("is_active", false)
        .limit(50);

      if (inactiveInCurrent && inactiveInCurrent.length > 10) {
        issues.push({
          category: "data",
          severity: "info",
          message: "Many inactive students in current academic year",
          details: `Found ${inactiveInCurrent.length} inactive students in current year ${activeYear.year}`,
          table: "students",
        });
      }
    }
  } catch (error) {
    console.error("Error validating students:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete student validation",
      details: error.message,
      table: "students",
    });
  }

  return issues;
};

/**
 * Validate Users Data
 */
const validateUsers = async () => {
  const issues = [];

  try {
    // 1. Users with invalid roles
    const validRoles = [
      "admin",
      "teacher",
      "wali_kelas",
      "guru_bk",
      "kepala_sekolah",
    ];
    const { data: invalidRoles } = await supabase
      .from("users")
      .select("id, username, role, full_name")
      .not("role", "in", `(${validRoles.map((r) => `"${r}"`).join(",")})`)
      .limit(20);

    if (invalidRoles && invalidRoles.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Users with invalid role values",
        details: `Found ${
          invalidRoles.length
        } users with invalid roles: ${invalidRoles
          .map((u) => `${u.username} (${u.role})`)
          .slice(0, 5)
          .join(", ")}`,
        table: "users",
      });
    }

    // 2. Users without password (security risk)
    const { data: noPassword } = await supabase
      .from("users")
      .select("id, username, role")
      .or('password.is.null,password.eq.""')
      .limit(20);

    if (noPassword && noPassword.length > 0) {
      issues.push({
        category: "data",
        severity: "critical",
        message: "Users without password",
        details: `Found ${noPassword.length} users without password - SECURITY RISK!`,
        table: "users",
      });
    }

    // 3. Active users without valid teacher_id (for teacher roles)
    const teacherRoles = ["guru", "wali_kelas", "guru_bk"];
    const { data: teachersNoId } = await supabase
      .from("users")
      .select("id, username, role")
      .in("role", teacherRoles)
      .eq("is_active", true)
      .is("teacher_id", null)
      .limit(20);

    if (teachersNoId && teachersNoId.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Teacher users without teacher_id",
        details: `Found ${teachersNoId.length} teacher accounts without teacher_id`,
        table: "users",
      });
    }

    // 4. Users with invalid phone numbers
    const { data: users } = await supabase
      .from("users")
      .select("id, username, no_hp")
      .not("no_hp", "is", null)
      .neq("no_hp", "")
      .limit(500);

    if (users) {
      const invalidPhones = users.filter((u) => {
        const phone = u.no_hp.replace(/[^0-9]/g, "");
        return phone.length < 10 || phone.length > 15;
      });

      if (invalidPhones.length > 0) {
        issues.push({
          category: "data",
          severity: "info",
          message: "Users with invalid phone number format",
          details: `Found ${invalidPhones.length} users with potentially invalid phone numbers`,
          table: "users",
        });
      }
    }

    // 5. Wali kelas without homeroom class
    const { data: waliNoClass } = await supabase
      .from("users")
      .select("id, username, full_name")
      .eq("role", "wali_kelas")
      .eq("is_active", true)
      .is("homeroom_class_id", null)
      .limit(20);

    if (waliNoClass && waliNoClass.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Homeroom teachers without class assignment",
        details: `Found ${waliNoClass.length} active wali kelas without homeroom_class_id`,
        table: "users",
      });
    }
  } catch (error) {
    console.error("Error validating users:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete user validation",
      details: error.message,
      table: "users",
    });
  }

  return issues;
};

/**
 * Validate Attendances Data
 */
const validateAttendances = async () => {
  const issues = [];

  try {
    // 1. Attendances with future dates
    const today = new Date().toISOString().split("T")[0];
    const { data: futureDates } = await supabase
      .from("attendances")
      .select("id, date, student_id")
      .gt("date", today)
      .limit(50);

    if (futureDates && futureDates.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Attendance records with future dates",
        details: `Found ${futureDates.length} attendance records dated in the future`,
        table: "attendances",
      });
    }

    // 2. Attendances with invalid status
    const validStatuses = ["Hadir", "Sakit", "Izin", "Alpa"];
    const { data: invalidStatus } = await supabase
      .from("attendances")
      .select("id, status, date")
      .not("status", "in", `(${validStatuses.map((s) => `"${s}"`).join(",")})`)
      .limit(50);

    if (invalidStatus && invalidStatus.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Attendances with invalid status",
        details: `Found ${invalidStatus.length} attendance records with invalid status values`,
        table: "attendances",
      });
    }

    // 3. Attendances very old (more than 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const twoYearsAgoStr = twoYearsAgo.toISOString().split("T")[0];

    const { data: veryOld, count: oldCount } = await supabase
      .from("attendances")
      .select("id", { count: "exact", head: true })
      .lt("date", twoYearsAgoStr);

    if (oldCount && oldCount > 1000) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Large number of old attendance records",
        details: `Found ${oldCount} attendance records older than 2 years - consider archiving`,
        table: "attendances",
      });
    }

    // 4. Duplicate attendances (same student, date, subject)
    const { data: recentAttendances } = await supabase
      .from("attendances")
      .select("student_id, date, subject")
      .gte("date", twoYearsAgoStr)
      .limit(1000);

    if (recentAttendances) {
      const attendanceKeys = new Map();
      recentAttendances.forEach((att) => {
        const key = `${att.student_id}-${att.date}-${att.subject}`;
        attendanceKeys.set(key, (attendanceKeys.get(key) || 0) + 1);
      });

      const duplicates = Array.from(attendanceKeys.values()).filter(
        (count) => count > 1
      );
      if (duplicates.length > 0) {
        issues.push({
          category: "data",
          severity: "warning",
          message: "Duplicate attendance records detected",
          details: `Found ${duplicates.length} cases of duplicate attendance (same student, date, subject)`,
          table: "attendances",
        });
      }
    }
  } catch (error) {
    console.error("Error validating attendances:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete attendance validation",
      details: error.message,
      table: "attendances",
    });
  }

  return issues;
};

/**
 * Validate Grades Data
 */
const validateGrades = async () => {
  const issues = [];

  try {
    // 1. Grades with invalid scores
    const { data: invalidScores } = await supabase
      .from("grades")
      .select("id, student_id, score, subject")
      .or("score.lt.0,score.gt.100,score.is.null")
      .limit(50);

    if (invalidScores && invalidScores.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Grades with invalid score values",
        details: `Found ${invalidScores.length} grades with scores outside 0-100 range or null`,
        table: "grades",
      });
    }

    // 2. Grades with invalid assignment_type
    const validTypes = ["NH1", "NH2", "NH3", "UTS", "UAS"];
    const { data: invalidTypes } = await supabase
      .from("grades")
      .select("id, assignment_type, subject")
      .not(
        "assignment_type",
        "in",
        `(${validTypes.map((t) => `"${t}"`).join(",")})`
      )
      .limit(50);

    if (invalidTypes && invalidTypes.length > 0) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Grades with non-standard assignment types",
        details: `Found ${invalidTypes.length} grades with unexpected assignment_type values`,
        table: "grades",
      });
    }

    // 3. Grades without semester info
    const { data: noSemester } = await supabase
      .from("grades")
      .select("id, student_id")
      .is("semester", null)
      .limit(50);

    if (noSemester && noSemester.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Grades without semester information",
        details: `Found ${noSemester.length} grade records without semester`,
        table: "grades",
      });
    }

    // 4. Grades for inactive students
    const { data: gradesWithStudent } = await supabase
      .from("grades")
      .select(
        `
        id,
        student_id,
        students!inner(is_active, full_name)
      `
      )
      .eq("students.is_active", false)
      .limit(100);

    if (gradesWithStudent && gradesWithStudent.length > 20) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Grades for inactive students",
        details: `Found ${gradesWithStudent.length} grade records for inactive students`,
        table: "grades",
      });
    }
  } catch (error) {
    console.error("Error validating grades:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete grade validation",
      details: error.message,
      table: "grades",
    });
  }

  return issues;
};

/**
 * Validate Academic Years Data
 */
const validateAcademicYears = async () => {
  const issues = [];

  try {
    // 1. Academic years with invalid date ranges
    const { data: years } = await supabase
      .from("academic_years")
      .select("id, year, semester, start_date, end_date")
      .limit(50);

    if (years) {
      const invalidDates = years.filter((year) => {
        if (!year.start_date || !year.end_date) return false;
        return new Date(year.start_date) >= new Date(year.end_date);
      });

      if (invalidDates.length > 0) {
        issues.push({
          category: "data",
          severity: "warning",
          message: "Academic years with invalid date ranges",
          details: `Found ${invalidDates.length} academic years where start_date >= end_date`,
          table: "academic_years",
        });
      }
    }

    // 2. No active academic year
    const { data: activeYears } = await supabase
      .from("academic_years")
      .select("id, year, semester")
      .eq("is_active", true);

    if (!activeYears || activeYears.length === 0) {
      issues.push({
        category: "data",
        severity: "critical",
        message: "No active academic year",
        details: "System requires at least one active academic year",
        table: "academic_years",
      });
    }

    // 3. Academic years missing dates
    const { data: missingDates } = await supabase
      .from("academic_years")
      .select("id, year, semester")
      .or("start_date.is.null,end_date.is.null")
      .limit(20);

    if (missingDates && missingDates.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Academic years with missing dates",
        details: `Found ${missingDates.length} academic years without complete date information`,
        table: "academic_years",
      });
    }
  } catch (error) {
    console.error("Error validating academic years:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete academic year validation",
      details: error.message,
      table: "academic_years",
    });
  }

  return issues;
};

/**
 * Validate Teacher Assignments
 */
const validateTeacherAssignments = async () => {
  const issues = [];

  try {
    // 1. Assignments without subject
    const { data: noSubject } = await supabase
      .from("teacher_assignments")
      .select("id, teacher_id")
      .or('subject.is.null,subject.eq.""')
      .limit(20);

    if (noSubject && noSubject.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Teacher assignments without subject",
        details: `Found ${noSubject.length} assignments without subject information`,
        table: "teacher_assignments",
      });
    }

    // 2. Assignments for non-existent academic year
    const { data: validYears } = await supabase
      .from("academic_years")
      .select("year");

    if (validYears) {
      const validYearSet = new Set(validYears.map((y) => y.year));
      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("id, academic_year")
        .limit(200);

      if (assignments) {
        const invalidYears = assignments.filter(
          (a) => !validYearSet.has(a.academic_year)
        );
        if (invalidYears.length > 0) {
          issues.push({
            category: "data",
            severity: "warning",
            message: "Teacher assignments for non-existent academic years",
            details: `Found ${invalidYears.length} assignments referencing invalid academic years`,
            table: "teacher_assignments",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error validating teacher assignments:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete teacher assignment validation",
      details: error.message,
      table: "teacher_assignments",
    });
  }

  return issues;
};

/**
 * Validate Konseling Data
 */
const validateKonseling = async () => {
  const issues = [];

  try {
    // 1. Konseling with future dates
    const today = new Date().toISOString().split("T")[0];
    const { data: futureDates } = await supabase
      .from("konseling")
      .select("id, tanggal, full_name")
      .gt("tanggal", today)
      .limit(20);

    if (futureDates && futureDates.length > 0) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Konseling records with future dates",
        details: `Found ${futureDates.length} konseling records scheduled in the future`,
        table: "konseling",
      });
    }

    // 2. Konseling with mismatched student data
    const { data: konseling } = await supabase
      .from("konseling")
      .select("id, student_id, nis, full_name")
      .not("student_id", "is", null)
      .limit(100);

    if (konseling) {
      let mismatchCount = 0;
      for (const record of konseling.slice(0, 50)) {
        const { data: student } = await supabase
          .from("students")
          .select("nis, full_name")
          .eq("id", record.student_id)
          .single();

        if (
          student &&
          (student.nis !== record.nis || student.full_name !== record.full_name)
        ) {
          mismatchCount++;
        }
      }

      if (mismatchCount > 0) {
        issues.push({
          category: "data",
          severity: "warning",
          message: "Konseling records with mismatched student data",
          details: `Found at least ${mismatchCount} konseling records where NIS/name doesn't match student table`,
          table: "konseling",
        });
      }
    }

    // 3. Konseling without guru_bk_id
    const { data: noGuru } = await supabase
      .from("konseling")
      .select("id, full_name")
      .is("guru_bk_id", null)
      .limit(20);

    if (noGuru && noGuru.length > 0) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Konseling records without counselor assignment",
        details: `Found ${noGuru.length} konseling records without guru_bk_id`,
        table: "konseling",
      });
    }
  } catch (error) {
    console.error("Error validating konseling:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete konseling validation",
      details: error.message,
      table: "konseling",
    });
  }

  return issues;
};

/**
 * Validate Siswa Baru Data
 */
const validateSiswaBaru = async () => {
  const issues = [];

  try {
    // 1. Siswa baru with invalid gender
    const { data: invalidGender } = await supabase
      .from("siswa_baru")
      .select("id, nama_lengkap, jenis_kelamin")
      .not("jenis_kelamin", "in", '("L","P")')
      .limit(20);

    if (invalidGender && invalidGender.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Siswa baru with invalid gender",
        details: `Found ${invalidGender.length} new student registrations with invalid gender values`,
        table: "siswa_baru",
      });
    }

    // 2. Siswa baru with future birth dates
    const today = new Date().toISOString().split("T")[0];
    const { data: futureBirth } = await supabase
      .from("siswa_baru")
      .select("id, nama_lengkap, tanggal_lahir")
      .gt("tanggal_lahir", today)
      .limit(20);

    if (futureBirth && futureBirth.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Siswa baru with future birth dates",
        details: `Found ${futureBirth.length} new students with birth dates in the future`,
        table: "siswa_baru",
      });
    }

    // 3. Siswa baru too old (> 25 years)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 25);
    const maxDateStr = maxDate.toISOString().split("T")[0];

    const { data: tooOld } = await supabase
      .from("siswa_baru")
      .select("id, nama_lengkap, tanggal_lahir")
      .lt("tanggal_lahir", maxDateStr)
      .limit(20);

    if (tooOld && tooOld.length > 0) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Siswa baru with unusually old age",
        details: `Found ${tooOld.length} registrations with birth dates older than 25 years`,
        table: "siswa_baru",
      });
    }

    // 4. Transferred siswa baru without transferred_at date
    const { data: noTransferDate } = await supabase
      .from("siswa_baru")
      .select("id, nama_lengkap")
      .eq("is_transferred", true)
      .is("transferred_at", null)
      .limit(20);

    if (noTransferDate && noTransferDate.length > 0) {
      issues.push({
        category: "data",
        severity: "info",
        message: "Transferred siswa baru without transfer date",
        details: `Found ${noTransferDate.length} transferred registrations without transferred_at timestamp`,
        table: "siswa_baru",
      });
    }

    // 5. Siswa baru without parent information
    const { data: noParents } = await supabase
      .from("siswa_baru")
      .select("id, nama_lengkap")
      .or('nama_ayah.is.null,nama_ibu.is.null,nama_ayah.eq."",nama_ibu.eq.""')
      .limit(20);

    if (noParents && noParents.length > 0) {
      issues.push({
        category: "data",
        severity: "warning",
        message: "Siswa baru with incomplete parent information",
        details: `Found ${noParents.length} registrations without complete parent names`,
        table: "siswa_baru",
      });
    }
  } catch (error) {
    console.error("Error validating siswa baru:", error);
    issues.push({
      category: "data",
      severity: "info",
      message: "Could not complete siswa baru validation",
      details: error.message,
      table: "siswa_baru",
    });
  }

  return issues;
};

export default checkDataValidation;

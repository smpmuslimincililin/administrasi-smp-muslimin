// src/system/checkers/AppHealthChecker.js
import { supabase } from "../../supabaseClient";

/**
 * AppHealthChecker - Application health and system monitoring
 * Checks: Inactive Records, Recent Activity, System Settings, User Accounts, Data Growth
 */

export const checkAppHealth = async () => {
  console.log("🔍 AppHealthChecker: Starting comprehensive check...");

  const issues = [];
  const startTime = Date.now();

  try {
    // 1. Check Inactive Records (Zombie Data)
    console.log("👻 Checking inactive/zombie records...");
    const inactiveIssues = await checkInactiveRecords();
    issues.push(...inactiveIssues);

    // 2. Check Recent Activity
    console.log("📈 Checking recent activity patterns...");
    const activityIssues = await checkRecentActivity();
    issues.push(...activityIssues);

    // 3. Check System Settings
    console.log("⚙️ Checking system settings completeness...");
    const settingsIssues = await checkSystemSettings();
    issues.push(...settingsIssues);

    // 4. Check User Account Health
    console.log("👥 Checking user account status...");
    const userIssues = await checkUserAccounts();
    issues.push(...userIssues);

    // 5. Check Data Growth & Volume
    console.log("📊 Checking data volume and growth...");
    const volumeIssues = await checkDataVolume();
    issues.push(...volumeIssues);

    // 6. Check System Performance Indicators
    console.log("⚡ Checking system performance indicators...");
    const performanceIssues = await checkPerformanceIndicators();
    issues.push(...performanceIssues);

    // 7. Check Data Freshness
    console.log("🕐 Checking data freshness...");
    const freshnessIssues = await checkDataFreshness();
    issues.push(...freshnessIssues);

    const executionTime = Date.now() - startTime;
    console.log(`✅ AppHealthChecker completed in ${executionTime}ms`);
    console.log(`📊 Found ${issues.length} app health issues`);

    return {
      success: true,
      issues,
      executionTime,
    };
  } catch (error) {
    console.error("❌ AppHealthChecker error:", error);
    return {
      success: false,
      issues: [
        {
          category: "app_health",
          severity: "critical",
          message: "App health checker failed",
          details: error.message,
          table: "system",
        },
      ],
      executionTime: Date.now() - startTime,
    };
  }
};

/**
 * Check Inactive Records (Zombie Data)
 */
const checkInactiveRecords = async () => {
  const issues = [];

  try {
    // 1. Count inactive students
    const { count: inactiveStudents } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("is_active", false);

    const { count: totalStudents } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true });

    if (totalStudents > 0 && inactiveStudents > 0) {
      const inactivePercentage = (inactiveStudents / totalStudents) * 100;

      // CRITICAL: > 70% inactive
      if (inactivePercentage > 70) {
        issues.push({
          category: "app_health",
          severity: "critical",
          message: "Very high percentage of inactive students",
          details: `${inactivePercentage.toFixed(
            1
          )}% of students (${inactiveStudents}/${totalStudents}) are marked inactive - urgent data cleanup needed`,
          table: "students",
        });
      }
      // WARNING: > 30% inactive
      else if (inactivePercentage > 30) {
        issues.push({
          category: "app_health",
          severity: "warning",
          message: "High percentage of inactive students",
          details: `${inactivePercentage.toFixed(
            1
          )}% of students (${inactiveStudents}/${totalStudents}) are marked inactive - consider archiving old data`,
          table: "students",
        });
      }
      // INFO: Any inactive students
      else if (inactiveStudents >= 5) {
        issues.push({
          category: "app_health",
          severity: "info",
          message: "Inactive students detected",
          details: `Found ${inactiveStudents} inactive students (${inactivePercentage.toFixed(
            1
          )}% of ${totalStudents} total) - normal for end of academic year`,
          table: "students",
        });
      }
    }

    // 2. Count inactive users
    const { count: inactiveUsers } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_active", false);

    const { count: totalUsers } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    if (totalUsers > 0 && inactiveUsers > 0) {
      const inactiveUserPercentage = (inactiveUsers / totalUsers) * 100;

      // WARNING: > 50% inactive
      if (inactiveUserPercentage > 50) {
        issues.push({
          category: "app_health",
          severity: "warning",
          message: "Many inactive user accounts",
          details: `${inactiveUserPercentage.toFixed(
            1
          )}% of user accounts (${inactiveUsers}/${totalUsers}) are inactive - review user management`,
          table: "users",
        });
      }
      // INFO: > 20% inactive
      else if (inactiveUserPercentage > 20) {
        issues.push({
          category: "app_health",
          severity: "info",
          message: "Some inactive user accounts",
          details: `${inactiveUserPercentage.toFixed(
            1
          )}% of user accounts (${inactiveUsers}/${totalUsers}) are inactive`,
          table: "users",
        });
      }
    }

    // 3. Count inactive classes
    const { count: inactiveClasses } = await supabase
      .from("classes")
      .select("id", { count: "exact", head: true })
      .eq("is_active", false);

    if (inactiveClasses > 0) {
      if (inactiveClasses > 50) {
        issues.push({
          category: "app_health",
          severity: "warning",
          message: "Many inactive classes in database",
          details: `Found ${inactiveClasses} inactive classes - consider archiving old academic year data`,
          table: "classes",
        });
      } else if (inactiveClasses > 10) {
        issues.push({
          category: "app_health",
          severity: "info",
          message: "Inactive classes detected",
          details: `Found ${inactiveClasses} inactive classes - normal for multi-year data`,
          table: "classes",
        });
      }
    }

    // 4. Inactive academic years
    const { count: inactiveYears } = await supabase
      .from("academic_years")
      .select("id", { count: "exact", head: true })
      .eq("is_active", false);

    if (inactiveYears > 0) {
      if (inactiveYears > 10) {
        issues.push({
          category: "app_health",
          severity: "info",
          message: "Multiple inactive academic years",
          details: `Database contains ${inactiveYears} inactive academic years. Consider data archival policy.`,
          table: "academic_years",
        });
      } else if (inactiveYears >= 3) {
        issues.push({
          category: "app_health",
          severity: "info",
          message: "Historical academic years present",
          details: `Database contains ${inactiveYears} inactive academic years - tracking historical data`,
          table: "academic_years",
        });
      }
    }
  } catch (error) {
    console.error("Error checking inactive records:", error);
    issues.push({
      category: "app_health",
      severity: "warning",
      message: "Could not complete inactive records check",
      details: error.message,
      table: "system",
    });
  }

  return issues;
};

/**
 * Check Recent Activity
 */
const checkRecentActivity = async () => {
  const issues = [];

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // 1. Check recent attendance records
    const { count: recentAttendance } = await supabase
      .from("attendances")
      .select("id", { count: "exact", head: true })
      .gte("date", sevenDaysAgo);

    if (recentAttendance === 0) {
      // Check if there's ANY attendance data
      const { count: totalAttendance } = await supabase
        .from("attendances")
        .select("id", { count: "exact", head: true });

      if (totalAttendance === 0) {
        issues.push({
          category: "app_health",
          severity: "info",
          message: "No attendance data in system",
          details:
            "System has no attendance records yet - normal for new installations",
          table: "attendances",
        });
      } else {
        issues.push({
          category: "app_health",
          severity: "warning",
          message: "No recent attendance records",
          details:
            "No attendance recorded in the past 7 days - school may be on holiday or data entry is paused",
          table: "attendances",
        });
      }
    }

    // 2. Check recent grade entries
    const { count: recentGrades } = await supabase
      .from("grades")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    const { count: totalGrades } = await supabase
      .from("grades")
      .select("id", { count: "exact", head: true });

    if (recentGrades === 0 && totalGrades > 0) {
      issues.push({
        category: "app_health",
        severity: "info",
        message: "No recent grade entries",
        details:
          "No new grades recorded in the past 30 days - normal between assessment periods",
        table: "grades",
      });
    }

    // 3. Check recent konseling activity
    const { count: recentKonseling } = await supabase
      .from("konseling")
      .select("id", { count: "exact", head: true })
      .gte("tanggal", thirtyDaysAgo);

    const { count: totalKonseling } = await supabase
      .from("konseling")
      .select("id", { count: "exact", head: true });

    if (recentKonseling === 0 && totalKonseling > 0) {
      issues.push({
        category: "app_health",
        severity: "info",
        message: "No recent counseling sessions",
        details: "No counseling sessions recorded in the past 30 days",
        table: "konseling",
      });
    }

    // 4. Check system health log activity
    const { count: recentHealthChecks } = await supabase
      .from("system_health_logs")
      .select("id", { count: "exact", head: true })
      .gte("checked_at", sevenDaysAgo);

    if (recentHealthChecks <= 1) {
      issues.push({
        category: "app_health",
        severity: "info",
        message: "Infrequent health monitoring",
        details:
          "System health checks are not being run regularly - consider scheduling periodic checks",
        table: "system_health_logs",
      });
    }
  } catch (error) {
    console.error("Error checking recent activity:", error);
    issues.push({
      category: "app_health",
      severity: "warning",
      message: "Could not complete recent activity check",
      details: error.message,
      table: "system",
    });
  }

  return issues;
};

/**
 * Check System Settings
 */
const checkSystemSettings = async () => {
  const issues = [];

  try {
    const { data: settings, error } = await supabase
      .from("school_settings")
      .select("setting_key, setting_value");

    if (error) {
      issues.push({
        category: "app_health",
        severity: "critical",
        message: "Cannot access system settings",
        details: `Error reading school_settings table: ${error.message}`,
        table: "school_settings",
      });
      return issues;
    }

    // Check if settings exist
    if (!settings || settings.length === 0) {
      issues.push({
        category: "app_health",
        severity: "warning",
        message: "No system settings configured",
        details:
          "School settings table is empty - system may not be properly configured",
        table: "school_settings",
      });
      return issues;
    }

    // Define critical settings that should exist
    const criticalSettings = ["school_name", "school_address"];

    const settingKeys = new Set(settings.map((s) => s.setting_key));
    const missingSettings = criticalSettings.filter(
      (key) => !settingKeys.has(key)
    );

    if (missingSettings.length > 0) {
      issues.push({
        category: "app_health",
        severity: "warning",
        message: "Critical system settings missing",
        details: `Missing critical settings: ${missingSettings.join(", ")}`,
        table: "school_settings",
      });
    }

    // Check for empty values in critical settings
    const emptySettings = settings.filter(
      (s) =>
        criticalSettings.includes(s.setting_key) &&
        (!s.setting_value || s.setting_value.trim() === "")
    );

    if (emptySettings.length > 0) {
      issues.push({
        category: "app_health",
        severity: "warning",
        message: "Critical system settings empty",
        details: `Settings with no value: ${emptySettings
          .map((s) => s.setting_key)
          .join(", ")}`,
        table: "school_settings",
      });
    }

    // Report current settings status
    issues.push({
      category: "app_health",
      severity: "info",
      message: "System settings configured",
      details: `Found ${settings.length} system settings in database`,
      table: "school_settings",
    });
  } catch (error) {
    console.error("Error checking system settings:", error);
    issues.push({
      category: "app_health",
      severity: "critical",
      message: "Could not complete system settings check",
      details: error.message,
      table: "school_settings",
    });
  }

  return issues;
};

/**
 * Check User Accounts Health
 */
const checkUserAccounts = async () => {
  const issues = [];

  try {
    // 1. Count users by role
    const { data: users } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("is_active", true);

    if (!users || users.length === 0) {
      issues.push({
        category: "app_health",
        severity: "critical",
        message: "No active users in system",
        details: "System has no active user accounts - this is critical!",
        table: "users",
      });
      return issues;
    }

    // Check for admin users
    const adminCount = users.filter((u) => u.role === "admin").length;
    if (adminCount === 0) {
      issues.push({
        category: "app_health",
        severity: "critical",
        message: "No active admin users",
        details:
          "System has no active admin accounts - system management may be impossible",
        table: "users",
      });
    } else if (adminCount > 5) {
      issues.push({
        category: "app_health",
        severity: "warning",
        message: "Many admin accounts detected",
        details: `Found ${adminCount} active admin accounts - ensure this is intentional for security`,
        table: "users",
      });
    }

    // Check for teachers
    const teacherCount = users.filter((u) =>
      ["guru", "wali_kelas", "guru_bk"].includes(u.role)
    ).length;
    if (teacherCount === 0) {
      issues.push({
        category: "app_health",
        severity: "warning",
        message: "No active teacher accounts",
        details: "System has no active teacher accounts",
        table: "users",
      });
    }

    // 2. Check total active users
    const { count: totalActiveUsers } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    // Report user status
    issues.push({
      category: "app_health",
      severity: "info",
      message: "Active user accounts",
      details: `System has ${totalActiveUsers} active users (${adminCount} admin, ${teacherCount} teachers)`,
      table: "users",
    });

    if (totalActiveUsers > 100) {
      issues.push({
        category: "app_health",
        severity: "info",
        message: "Large number of active user accounts",
        details: `System has ${totalActiveUsers} active users - ensure all are still needed`,
        table: "users",
      });
    }
  } catch (error) {
    console.error("Error checking user accounts:", error);
    issues.push({
      category: "app_health",
      severity: "warning",
      message: "Could not complete user accounts check",
      details: error.message,
      table: "users",
    });
  }

  return issues;
};

/**
 * Check Data Volume
 */
const checkDataVolume = async () => {
  const issues = [];

  try {
    // Check major table sizes
    const tables = [
      { name: "students", info: 100, warning: 2000, critical: 5000 },
      { name: "attendances", info: 1000, warning: 20000, critical: 50000 },
      { name: "grades", info: 500, warning: 10000, critical: 30000 },
      { name: "konseling", info: 100, warning: 2000, critical: 5000 },
    ];

    for (const table of tables) {
      const { count } = await supabase
        .from(table.name)
        .select("id", { count: "exact", head: true });

      if (count >= table.critical) {
        issues.push({
          category: "app_health",
          severity: "warning",
          message: `Large data volume in ${table.name}`,
          details: `Table ${
            table.name
          } has ${count.toLocaleString()} records - implement data archival strategy`,
          table: table.name,
        });
      } else if (count >= table.warning) {
        issues.push({
          category: "app_health",
          severity: "info",
          message: `Growing data volume in ${table.name}`,
          details: `Table ${
            table.name
          } has ${count.toLocaleString()} records - monitor growth`,
          table: table.name,
        });
      } else if (count >= table.info) {
        issues.push({
          category: "app_health",
          severity: "info",
          message: `Active data in ${table.name}`,
          details: `Table ${table.name} has ${count.toLocaleString()} records`,
          table: table.name,
        });
      }
    }
  } catch (error) {
    console.error("Error checking data volume:", error);
    issues.push({
      category: "app_health",
      severity: "warning",
      message: "Could not complete data volume check",
      details: error.message,
      table: "system",
    });
  }

  return issues;
};

/**
 * Check Performance Indicators
 */
const checkPerformanceIndicators = async () => {
  const issues = [];

  try {
    // 1. Check for tables that might need indexing
    const { count: attendanceCount } = await supabase
      .from("attendances")
      .select("id", { count: "exact", head: true });

    if (attendanceCount > 10000) {
      issues.push({
        category: "app_health",
        severity: "info",
        message: "High volume table detected",
        details: `Attendances table has ${attendanceCount.toLocaleString()} records - ensure proper database indexing for performance`,
        table: "attendances",
      });
    }

    // 2. Check announcement count
    const { count: announcementCount } = await supabase
      .from("announcement")
      .select("id", { count: "exact", head: true });

    if (announcementCount > 500) {
      issues.push({
        category: "app_health",
        severity: "info",
        message: "Many announcements in system",
        details: `Found ${announcementCount} announcements - consider cleanup of old announcements`,
        table: "announcement",
      });
    }

    // 3. Check health logs accumulation
    const { count: healthLogCount } = await supabase
      .from("system_health_logs")
      .select("id", { count: "exact", head: true });

    if (healthLogCount > 500) {
      issues.push({
        category: "app_health",
        severity: "info",
        message: "Health logs accumulating",
        details: `System has ${healthLogCount} health check logs - consider implementing log rotation`,
        table: "system_health_logs",
      });
    } else if (healthLogCount > 0) {
      issues.push({
        category: "app_health",
        severity: "info",
        message: "System monitoring active",
        details: `System has ${healthLogCount} health check logs recorded`,
        table: "system_health_logs",
      });
    }
  } catch (error) {
    console.error("Error checking performance indicators:", error);
    issues.push({
      category: "app_health",
      severity: "warning",
      message: "Could not complete performance indicators check",
      details: error.message,
      table: "system",
    });
  }

  return issues;
};

/**
 * Check Data Freshness
 */
const checkDataFreshness = async () => {
  const issues = [];

  try {
    const sixtyDaysAgo = new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000
    ).toISOString();
    const ninetyDaysAgo = new Date(
      Date.now() - 90 * 24 * 60 * 60 * 1000
    ).toISOString();

    // 1. Check when was the last student record updated
    const { data: latestStudent } = await supabase
      .from("students")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (latestStudent && latestStudent.updated_at) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(latestStudent.updated_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate > 180) {
        issues.push({
          category: "app_health",
          severity: "warning",
          message: "Student records very outdated",
          details: `Last student record update was ${daysSinceUpdate} days ago - system may be inactive`,
          table: "students",
        });
      } else if (daysSinceUpdate > 90) {
        issues.push({
          category: "app_health",
          severity: "info",
          message: "Student records not recently updated",
          details: `Last student record update was ${daysSinceUpdate} days ago`,
          table: "students",
        });
      }
    }

    // 2. Check for very old pending siswa_baru
    const { count: oldPending } = await supabase
      .from("siswa_baru")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("tanggal_daftar", sixtyDaysAgo);

    if (oldPending > 0) {
      issues.push({
        category: "app_health",
        severity: "warning",
        message: "Old pending student registrations",
        details: `Found ${oldPending} student registrations pending for more than 60 days - review and process`,
        table: "siswa_baru",
      });
    }

    // 3. Check announcement freshness
    const { data: latestAnnouncement } = await supabase
      .from("announcement")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latestAnnouncement && latestAnnouncement.created_at) {
      const daysSinceAnnouncement = Math.floor(
        (Date.now() - new Date(latestAnnouncement.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysSinceAnnouncement > 60) {
        issues.push({
          category: "app_health",
          severity: "info",
          message: "No recent announcements",
          details: `Last announcement was posted ${daysSinceAnnouncement} days ago`,
          table: "announcement",
        });
      }
    }
  } catch (error) {
    console.error("Error checking data freshness:", error);
    issues.push({
      category: "app_health",
      severity: "warning",
      message: "Could not complete data freshness check",
      details: error.message,
      table: "system",
    });
  }

  return issues;
};

export default checkAppHealth;

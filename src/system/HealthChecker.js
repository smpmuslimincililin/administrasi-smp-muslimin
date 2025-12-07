import { supabase } from "../supabaseClient";
import { checkDatabase } from "./checkers/DatabaseChecker";
import { checkDataValidation } from "./checkers/DataValidator";
import { checkBusinessLogic } from "./checkers/BusinessLogicChecker";
import { checkAppHealth } from "./checkers/AppHealthChecker";

class HealthChecker {
  constructor() {
    this.results = {
      database: null,
      validation: null,
      businessLogic: null,
      appHealth: null,
    };
    this.startTime = null;
    this.errors = [];
  }

  async runFullCheck(userId) {
    this.startTime = Date.now();
    this.errors = [];

    try {
      const [database, validation, businessLogic, appHealth] =
        await Promise.allSettled([
          this.runDatabaseCheck(),
          this.runDataValidationCheck(),
          this.runBusinessLogicCheck(),
          this.runAppHealthCheck(),
        ]);

      this.results.database = this.processCheckResult(
        database,
        "Database Check"
      );
      this.results.validation = this.processCheckResult(
        validation,
        "Data Validation"
      );
      this.results.businessLogic = this.processCheckResult(
        businessLogic,
        "Business Logic"
      );
      this.results.appHealth = this.processCheckResult(appHealth, "App Health");

      const executionTime = Date.now() - this.startTime;
      const summary = this.calculateSummary();

      // ❌ DISABLED: Save is now handled by MonitorDashboard to prevent duplicates
      // await this.saveResults(userId, summary, executionTime);
      console.log(
        "ℹ️ Note: Save to database is handled by MonitorDashboard component"
      );

      return {
        success: true,
        summary,
        results: this.results,
        executionTime,
        errors: this.errors,
      };
    } catch (error) {
      console.error("❌ Health check failed:", error);
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - this.startTime,
      };
    }
  }

  async runDatabaseCheck() {
    console.log("🔍 Running database checks...");
    try {
      const result = await checkDatabase();
      console.log("✅ Database check completed:", result);
      return this.transformResult(result, "database");
    } catch (error) {
      console.error("❌ Database check failed:", error);
      this.errors.push({ checker: "database", error: error.message });
      return {
        status: "critical",
        error: error.message,
        checks: [],
        issues: [],
      };
    }
  }

  async runDataValidationCheck() {
    console.log("🔍 Running data validation checks...");
    try {
      const result = await checkDataValidation();
      console.log("✅ Data validation check completed:", result);
      return this.transformResult(result, "validation");
    } catch (error) {
      console.error("❌ Data validation check failed:", error);
      this.errors.push({ checker: "validation", error: error.message });
      return {
        status: "warning",
        error: error.message,
        checks: [],
        issues: [],
      };
    }
  }

  async runBusinessLogicCheck() {
    console.log("🔍 Running business logic checks...");
    try {
      const result = await checkBusinessLogic();
      console.log("✅ Business logic check completed:", result);
      return this.transformResult(result, "businessLogic");
    } catch (error) {
      console.error("❌ Business logic check failed:", error);
      this.errors.push({ checker: "businessLogic", error: error.message });
      return {
        status: "warning",
        error: error.message,
        checks: [],
        issues: [],
      };
    }
  }

  async runAppHealthCheck() {
    console.log("🔍 Running app health checks...");
    try {
      const result = await checkAppHealth();
      console.log("✅ App health check completed:", result);
      return this.transformResult(result, "appHealth");
    } catch (error) {
      console.error("❌ App health check failed:", error);
      this.errors.push({ checker: "appHealth", error: error.message });
      return {
        status: "info",
        error: error.message,
        checks: [],
        issues: [],
      };
    }
  }

  transformResult(result, checkerType) {
    if (!result || !result.success) {
      return {
        status: "critical",
        error: result?.error || "Check failed",
        checks: [],
        issues: [],
      };
    }

    const issues = result.issues || [];
    const checks = issues;

    let status = "healthy";
    let hasCritical = false;
    let hasWarning = false;

    issues.forEach((issue) => {
      if (issue.severity === "critical") {
        hasCritical = true;
      } else if (issue.severity === "warning") {
        hasWarning = true;
      }
    });

    if (hasCritical) {
      status = "critical";
    } else if (hasWarning) {
      status = "warning";
    } else if (issues.length > 0) {
      status = "info";
    }

    return {
      status,
      checks,
      issues,
      executionTime: result.executionTime,
    };
  }

  processCheckResult(result, checkName) {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      console.error(`${checkName} rejected:`, result.reason);
      this.errors.push({
        checker: checkName,
        error: result.reason?.message || "Unknown error",
      });
      return {
        status: "critical",
        error: result.reason?.message || "Check failed",
        checks: [],
        issues: [],
      };
    }
  }

  calculateSummary() {
    let totalIssues = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let overallStatus = "healthy";

    const countIssues = (result) => {
      if (!result) return;

      // Try both 'issues' and 'checks' (they should be the same)
      const issuesList = result.issues || result.checks || [];

      if (!Array.isArray(issuesList)) return;

      issuesList.forEach((issue) => {
        totalIssues++;
        if (issue.severity === "critical") {
          criticalCount++;
        } else if (issue.severity === "warning") {
          warningCount++;
        } else if (issue.severity === "info") {
          infoCount++;
        }
      });
    };

    // Count from all checkers
    countIssues(this.results.database);
    countIssues(this.results.validation);
    countIssues(this.results.businessLogic);
    countIssues(this.results.appHealth);

    // Determine overall status
    // Note: Database constraint only allows 'healthy', 'warning', 'critical'
    // So we map 'info' to 'healthy' for database compatibility
    if (criticalCount > 0) {
      overallStatus = "critical";
    } else if (warningCount > 0) {
      overallStatus = "warning";
    } else {
      // Even if there are info issues, map to 'healthy' for database constraint
      overallStatus = "healthy";
    }

    console.log("📊 Summary calculated:", {
      totalIssues,
      criticalCount,
      warningCount,
      infoCount,
      overallStatus,
    });

    return {
      totalIssues,
      criticalCount,
      warningCount,
      infoCount,
      status: overallStatus,
    };
  }

  // ⚠️ This method is kept for backward compatibility but not used anymore
  // Save is now handled by MonitorDashboard component to prevent duplicate inserts
  async saveResults(userId, summary, executionTime) {
    console.warn(
      "⚠️ saveResults() is deprecated. Save is handled by MonitorDashboard."
    );
    try {
      const { data, error } = await supabase
        .from("system_health_logs")
        .insert({
          checked_at: new Date().toISOString(),
          checked_by: userId,
          total_issues: summary.totalIssues,
          critical_count: summary.criticalCount,
          warning_count: summary.warningCount,
          info_count: summary.infoCount,
          issues_detail: this.results,
          execution_time: executionTime,
          status: summary.status,
        })
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Results saved:", data.id);
      return data;
    } catch (error) {
      console.error("❌ Error saving results:", error);
      throw error;
    }
  }

  getSeverityIcon(status) {
    const icons = {
      healthy: "✅",
      warning: "⚠️",
      critical: "🔴",
      info: "ℹ️",
      ok: "✅",
      error: "❌",
    };
    return icons[status] || "❓";
  }

  getSeverityColor(status) {
    const colors = {
      healthy: "green",
      warning: "yellow",
      critical: "red",
      info: "blue",
      ok: "green",
      error: "red",
    };
    return colors[status] || "gray";
  }
}

export default HealthChecker;

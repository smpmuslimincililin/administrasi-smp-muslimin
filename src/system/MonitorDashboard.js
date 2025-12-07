import React, { useState, useEffect, useRef } from "react";
import HealthChecker from "./HealthChecker";
import { supabase } from "../supabaseClient";

const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = parseInt(value) || 0;

    if (end === 0) {
      setCount(0);
      return;
    }

    let start = 0;
    const increment = Math.ceil(end / 20);
    const stepTime = duration / 20;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

const CheckerProgressBar = ({ checker, isActive, isDone }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 100);
      return () => clearInterval(interval);
    } else if (isDone) {
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [isActive, isDone]);

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all duration-300 ${
        isActive
          ? "border-blue-400 bg-blue-50 shadow-lg scale-105"
          : isDone
          ? "border-green-400 bg-green-50"
          : "border-gray-200 bg-gray-50"
      }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {isActive ? "🔄" : isDone ? "✅" : "⏳"}
          </span>
          <span
            className={`font-semibold text-sm ${
              isActive
                ? "text-blue-700"
                : isDone
                ? "text-green-700"
                : "text-gray-500"
            }`}>
            {checker.name}
          </span>
        </div>
        {isDone && checker.time && (
          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
            {checker.time}ms
          </span>
        )}
      </div>

      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${
            isActive
              ? "bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse"
              : isDone
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : "bg-gray-300"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isActive && (
        <div className="text-xs text-blue-600 font-semibold mt-1 text-right">
          {Math.round(progress)}%
        </div>
      )}
      {isDone && (
        <div className="text-xs text-green-600 font-semibold mt-1 text-right">
          ✓ Complete
        </div>
      )}
    </div>
  );
};

const OverallProgressBar = ({ progress, elapsedTime, currentPhase }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="animate-pulse">🔍</span>
            System Health Check in Progress
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {currentPhase || "Initializing system scan..."}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {(elapsedTime / 1000).toFixed(1)}s
          </div>
          <div className="text-xs text-gray-500">Elapsed Time</div>
        </div>
      </div>

      <div className="relative">
        <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
          <span>Overall Progress</span>
          <span className="text-blue-600">{Math.round(progress)}%</span>
        </div>
        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {progress > 5 && `${Math.round(progress)}%`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {[
          { stage: 1, label: "Database" },
          { stage: 2, label: "Validation" },
          { stage: 3, label: "Logic" },
          { stage: 4, label: "Health" },
        ].map((item) => {
          const stageProgress = ((progress - (item.stage - 1) * 25) / 25) * 100;
          const isComplete = progress >= item.stage * 25;
          const isActive =
            progress >= (item.stage - 1) * 25 && progress < item.stage * 25;

          return (
            <div
              key={item.stage}
              className={`text-center p-2 rounded-lg transition-all ${
                isComplete
                  ? "bg-green-50 border border-green-300"
                  : isActive
                  ? "bg-blue-50 border border-blue-300"
                  : "bg-gray-50 border border-gray-200"
              }`}>
              <div
                className={`text-xs font-semibold ${
                  isComplete
                    ? "text-green-700"
                    : isActive
                    ? "text-blue-700"
                    : "text-gray-500"
                }`}>
                {item.label}
              </div>
              <div className="text-lg">
                {isComplete ? "✅" : isActive ? "🔄" : "⏳"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatsCard = ({
  icon,
  title,
  value,
  subtitle,
  color = "blue",
  isAnimating,
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    red: "bg-red-50 text-red-600 border-red-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div
      className={`rounded-lg shadow-md p-6 border-2 transition-all duration-300 ${
        isAnimating ? "scale-105" : ""
      } ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold">
            {typeof value === "number" && isAnimating ? (
              <AnimatedCounter value={value} />
            ) : (
              value
            )}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );
};

const MonitorDashboard = ({ user }) => {
  const userId = user?.id;
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPhase, setCurrentPhase] = useState("");
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [checkers, setCheckers] = useState([
    { id: "database", name: "Database Check", status: "pending", time: null },
    {
      id: "validation",
      name: "Data Validation",
      status: "pending",
      time: null,
    },
    {
      id: "businessLogic",
      name: "Business Logic",
      status: "pending",
      time: null,
    },
    { id: "appHealth", name: "App Health", status: "pending", time: null },
  ]);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const isMountedRef = useRef(true);
  const healthCheckerRef = useRef(null);
  const isSavingRef = useRef(false); // Flag to prevent duplicate saves

  useEffect(() => {
    healthCheckerRef.current = new HealthChecker();
    isMountedRef.current = true;

    loadHistoryFromDatabase();

    const style = document.createElement("style");
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .animate-shimmer {
        animation: shimmer 2s infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const saveResultsToDatabase = async (finalResults) => {
    // Log stack trace to see who's calling this
    console.log("🔍 STACK TRACE:", new Error().stack);
    console.log("🔍 isSavingRef.current:", isSavingRef.current);

    // Prevent duplicate saves
    if (isSavingRef.current) {
      console.log("⚠️ Save already in progress, skipping...");
      return;
    }

    try {
      isSavingRef.current = true;
      console.log("🔒 Locking save operation at:", new Date().toISOString());

      // Map status to valid database values (healthy, warning, critical ONLY)
      let dbStatus = String(
        finalResults.summary?.status || "healthy"
      ).toLowerCase();

      // Database constraint: CHECK (status = ANY (ARRAY['healthy', 'warning', 'critical']))
      const validStatuses = ["healthy", "warning", "critical"];

      if (!validStatuses.includes(dbStatus)) {
        console.log(
          `ℹ️ Mapping invalid status "${dbStatus}" to "healthy" for database constraint`
        );
        dbStatus = "healthy"; // Default to 'healthy' for 'info', 'unknown', etc.
      }

      const logEntry = {
        checked_by: user?.id || null,
        checked_at: new Date().toISOString(),
        status: dbStatus, // Use validated status
        total_issues: parseInt(finalResults.summary?.totalIssues) || 0,
        critical_count: parseInt(finalResults.summary?.criticalCount) || 0,
        warning_count: parseInt(finalResults.summary?.warningCount) || 0,
        info_count: parseInt(finalResults.summary?.infoCount) || 0,
        issues_detail: {
          database: finalResults.results?.database || {},
          validation: finalResults.results?.validation || {},
          businessLogic: finalResults.results?.businessLogic || {},
          appHealth: finalResults.results?.appHealth || {},
        },
        execution_time: parseInt(finalResults.executionTime) || null,
      };

      console.log(
        "📤 Saving to database at:",
        new Date().toISOString(),
        logEntry
      );

      const { data, error } = await supabase
        .from("system_health_logs")
        .insert([logEntry])
        .select();

      if (error) {
        console.error("❌ Database error:", error);
        throw error;
      }

      console.log(
        "✅ Saved to database successfully at:",
        new Date().toISOString(),
        data
      );
    } catch (error) {
      console.error("💥 Error saving to database:", error);
    } finally {
      // Reset flag after a delay to prevent immediate re-saves
      setTimeout(() => {
        isSavingRef.current = false;
        console.log(
          "🔓 Unlocking save operation at:",
          new Date().toISOString()
        );
      }, 2000);
    }
  };

  const loadHistoryFromDatabase = async () => {
    try {
      setIsLoadingHistory(true);

      const { data, error } = await supabase
        .from("system_health_logs")
        .select("*")
        .order("checked_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const transformedHistory = data.map((record) => ({
        timestamp: record.checked_at,
        summary: {
          totalIssues: record.total_issues,
          criticalCount: record.critical_count,
          warningCount: record.warning_count,
          infoCount: record.info_count,
          status: record.status,
        },
        results: record.issues_detail,
        executionTime: record.execution_time,
        errors: [],
        id: record.id,
      }));

      if (isMountedRef.current) {
        setHistory(transformedHistory);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingHistory(false);
      }
    }
  };

  const runHealthCheck = async () => {
    if (isChecking) return;

    setIsChecking(true);
    setProgress(0);
    setElapsedTime(0);
    setResults(null);
    setError(null);
    startTimeRef.current = Date.now();
    isSavingRef.current = false; // Reset save flag when starting new check

    if (timerRef.current) clearInterval(timerRef.current);

    const initialCheckers = [
      { id: "database", name: "Database Check", status: "pending", time: null },
      {
        id: "validation",
        name: "Data Validation",
        status: "pending",
        time: null,
      },
      {
        id: "businessLogic",
        name: "Business Logic",
        status: "pending",
        time: null,
      },
      { id: "appHealth", name: "App Health", status: "pending", time: null },
    ];
    setCheckers(initialCheckers);

    timerRef.current = setInterval(() => {
      if (isMountedRef.current) {
        setElapsedTime(Date.now() - startTimeRef.current);
      }
    }, 100);

    try {
      const checker = healthCheckerRef.current;

      // Simulate progress for each phase
      const phases = [
        {
          progress: 25,
          phase: "🗄️ Checking database connections and integrity...",
        },
        {
          progress: 50,
          phase: "✅ Validating data consistency and structure...",
        },
        { progress: 75, phase: "🧠 Verifying business rules and logic..." },
        { progress: 100, phase: "📱 Analyzing application health metrics..." },
      ];

      let phaseIndex = 0;
      const progressInterval = setInterval(() => {
        if (phaseIndex < phases.length && isMountedRef.current) {
          setProgress(phases[phaseIndex].progress);
          setCurrentPhase(phases[phaseIndex].phase);
          phaseIndex++;
        } else {
          clearInterval(progressInterval);
        }
      }, 3000);

      // Run full check (calls all checkers internally)
      const checkResult = await checker.runFullCheck(userId);

      clearInterval(progressInterval);

      if (!checkResult.success) {
        throw new Error(checkResult.error || "Health check failed");
      }

      // Update checker status with execution times
      const updatedCheckers = [
        {
          id: "database",
          name: "Database Check",
          status: "done",
          time: checkResult.results?.database?.executionTime || 0,
        },
        {
          id: "validation",
          name: "Data Validation",
          status: "done",
          time: checkResult.results?.validation?.executionTime || 0,
        },
        {
          id: "businessLogic",
          name: "Business Logic",
          status: "done",
          time: checkResult.results?.businessLogic?.executionTime || 0,
        },
        {
          id: "appHealth",
          name: "App Health",
          status: "done",
          time: checkResult.results?.appHealth?.executionTime || 0,
        },
      ];

      const finalResults = {
        timestamp: new Date().toISOString(),
        summary: checkResult.summary,
        results: checkResult.results,
        executionTime: checkResult.executionTime,
        errors: checkResult.errors,
      };

      console.log("✅ Final Results:", finalResults);
      console.log("✅ Summary:", finalResults.summary);

      // Save to database (with duplicate prevention)
      console.log("📝 Calling saveResultsToDatabase...");
      await saveResultsToDatabase(finalResults);
      console.log("📝 saveResultsToDatabase completed");

      if (isMountedRef.current) {
        setProgress(100);
        setCheckers(updatedCheckers);
        setResults(finalResults);
        setCurrentPhase("");
        await loadHistoryFromDatabase();
      }
    } catch (err) {
      console.error("Health check error:", err);
      if (isMountedRef.current) {
        setError(err.message || "Health check failed");
      }
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  };

  const formatTime = (ms) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      healthy: "green",
      warning: "yellow",
      critical: "red",
      info: "blue",
    };
    return colors[status] || "gray";
  };

  const getStatusIcon = (status) => {
    const icons = {
      healthy: "✅",
      warning: "⚠️",
      critical: "🔴",
      info: "ℹ️",
    };
    return icons[status] || "❓";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              System Health Monitor
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time system monitoring dashboard
            </p>
          </div>
          <div className="flex gap-3">
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium shadow-lg transition-all transform hover:scale-105 flex items-center gap-2">
                <span>📊</span>
                History ({history.length})
              </button>
            )}
            <button
              onClick={runHealthCheck}
              disabled={isChecking}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium shadow-lg transition-all transform hover:scale-105 flex items-center gap-2">
              {isChecking ? (
                <>
                  <span className="animate-spin">🔄</span>
                  Checking...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Run System Check
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <h3 className="font-semibold text-red-800">Check Failed</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Check History
                {isLoadingHistory && (
                  <span className="text-sm text-gray-500 ml-2">Loading...</span>
                )}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={loadHistoryFromDatabase}
                  disabled={isLoadingHistory}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400">
                  🔄 Refresh
                </button>
                <button
                  onClick={async () => {
                    if (
                      window.confirm(
                        "Clear all history from database? This cannot be undone."
                      )
                    ) {
                      try {
                        const { error } = await supabase
                          .from("system_health_logs")
                          .delete()
                          .neq("id", "00000000-0000-0000-0000-000000000000");

                        if (error) throw error;

                        setHistory([]);
                        alert("History cleared successfully!");
                      } catch (err) {
                        alert("Error clearing history: " + err.message);
                      }
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium">
                  Clear All
                </button>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin text-4xl mb-2">🔄</div>
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔭</div>
                No history available
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => {
                      setResults(item);
                      setShowHistory(false);
                    }}>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">
                        {getStatusIcon(item.summary.status)}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {formatTimestamp(item.timestamp)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.summary.totalIssues} issues •{" "}
                          {formatTime(item.executionTime)}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.summary.status === "healthy"
                          ? "bg-green-100 text-green-700"
                          : item.summary.status === "warning"
                          ? "bg-yellow-100 text-yellow-700"
                          : item.summary.status === "critical"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                      {item.summary.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progress Section */}
        {isChecking && (
          <>
            <OverallProgressBar
              progress={progress}
              elapsedTime={elapsedTime}
              currentPhase={currentPhase}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {checkers.map((checker) => {
                const isActive =
                  progress >= checkers.indexOf(checker) * 25 &&
                  progress < (checkers.indexOf(checker) + 1) * 25;
                const isDone = checker.status === "done";

                return (
                  <CheckerProgressBar
                    key={checker.id}
                    checker={checker}
                    isActive={isActive}
                    isDone={isDone}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Results Section */}
        {!isChecking && results && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                icon={getStatusIcon(results.summary?.status || "healthy")}
                title="Overall Status"
                value={(results.summary?.status || "unknown").toUpperCase()}
                color={getStatusColor(results.summary?.status || "gray")}
                isAnimating={true}
              />
              <StatsCard
                icon="📊"
                title="Total Issues"
                value={Number(results.summary?.totalIssues) || 0}
                subtitle={`${
                  Number(results.summary?.criticalCount) || 0
                } critical, ${
                  Number(results.summary?.warningCount) || 0
                } warning, ${Number(results.summary?.infoCount) || 0} info`}
                color={
                  (Number(results.summary?.totalIssues) || 0) === 0
                    ? "green"
                    : (Number(results.summary?.criticalCount) || 0) > 0
                    ? "red"
                    : "yellow"
                }
                isAnimating={true}
              />
              <StatsCard
                icon="⚡"
                title="Execution Time"
                value={formatTime(results.executionTime || 0)}
                subtitle="Total scan duration"
                color="blue"
                isAnimating={false}
              />
              <StatsCard
                icon="🔧"
                title="Checks Run"
                value={4}
                subtitle="Database, Validation, Logic, Health"
                color="gray"
                isAnimating={true}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Checker Results */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Checker Results
                </h3>
                <div className="space-y-3">
                  {checkers
                    .filter((c) => c.status === "done")
                    .map((checker) => {
                      const resultKey = checker.id;
                      const value = results.results?.[resultKey];

                      // Safely get issue count
                      let issueCount = 0;
                      if (value?.issues && Array.isArray(value.issues)) {
                        issueCount = value.issues.length;
                      } else if (value?.checks && Array.isArray(value.checks)) {
                        issueCount = value.checks.length;
                      }

                      const status =
                        value?.status ||
                        (issueCount === 0 ? "healthy" : "info");

                      return (
                        <div
                          key={checker.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {getStatusIcon(status)}
                            </span>
                            <div>
                              <div className="font-medium text-gray-800">
                                {checker.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {issueCount} issue{issueCount !== 1 ? "s" : ""}{" "}
                                found • {checker.time || 0}ms
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              status === "healthy"
                                ? "bg-green-100 text-green-700"
                                : status === "warning"
                                ? "bg-yellow-100 text-yellow-700"
                                : status === "critical"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                            {String(status)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Performance Metrics
                </h3>
                <div className="space-y-4">
                  {checkers
                    .filter((c) => c.status === "done")
                    .map((checker) => (
                      <div key={checker.id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {checker.name}
                          </span>
                          <span className="text-sm text-gray-600">
                            {checker.time}ms
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000"
                            style={{
                              width: `${Math.min(
                                (checker.time / 5000) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-900">
                      Total Execution
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatTime(results.executionTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Issues Detail */}
            {results.summary.totalIssues > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <span>🔍</span>
                  Issues Found ({results.summary.totalIssues})
                </h3>
                <div className="space-y-3">
                  {(() => {
                    console.log(
                      "🔍 DEBUG - Results structure:",
                      results.results
                    );

                    const allIssues = [];

                    Object.entries(results.results || {}).forEach(
                      ([checkerName, checkerResult]) => {
                        const issues =
                          checkerResult?.issues || checkerResult?.checks || [];

                        if (!Array.isArray(issues) || issues.length === 0)
                          return;

                        console.log(
                          `🔍 DEBUG - ${checkerName} issues:`,
                          issues
                        );

                        issues.forEach((issue, idx) => {
                          console.log(
                            `🔍 DEBUG - Issue ${idx}:`,
                            issue,
                            "Type:",
                            typeof issue
                          );

                          // Handle different issue formats - ensure everything is a string or null
                          let issueMessage = "Unknown issue";
                          let issueDetails = null;
                          let issueSeverity = "info";
                          let issueTable = null;
                          let issueCount = null;
                          let issueCategory = null;

                          if (typeof issue === "string") {
                            issueMessage = issue;
                          } else if (
                            typeof issue === "object" &&
                            issue !== null
                          ) {
                            // Safely extract message
                            if (issue.message) {
                              issueMessage = String(issue.message);
                            } else if (issue.description) {
                              issueMessage = String(issue.description);
                            }

                            // Safely extract other fields
                            if (
                              issue.details &&
                              typeof issue.details === "string"
                            ) {
                              issueDetails = issue.details;
                            } else if (
                              issue.details &&
                              typeof issue.details === "object"
                            ) {
                              issueDetails = JSON.stringify(issue.details);
                            }

                            if (issue.severity)
                              issueSeverity = String(issue.severity);
                            if (issue.table) issueTable = String(issue.table);
                            if (issue.count) issueCount = Number(issue.count);

                            // Handle category - could be string or object
                            if (issue.category) {
                              if (typeof issue.category === "string") {
                                issueCategory = issue.category;
                              } else if (typeof issue.category === "object") {
                                issueCategory = JSON.stringify(issue.category);
                              }
                            }
                          }

                          const displayName =
                            checkerName === "validation"
                              ? "Data Validation"
                              : checkerName === "businessLogic"
                              ? "Business Logic"
                              : checkerName === "appHealth"
                              ? "App Health"
                              : checkerName === "database"
                              ? "Database Check"
                              : String(checkerName);

                          allIssues.push({
                            key: `${checkerName}-${idx}`,
                            message: issueMessage,
                            details: issueDetails,
                            severity: issueSeverity,
                            table: issueTable,
                            count: issueCount,
                            category: issueCategory,
                            source: displayName,
                          });
                        });
                      }
                    );

                    return allIssues.map((issue) => (
                      <div
                        key={issue.key}
                        className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
                          issue.severity === "critical"
                            ? "border-red-500 bg-red-50"
                            : issue.severity === "warning"
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-blue-500 bg-blue-50"
                        }`}>
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0">
                            {issue.severity === "critical"
                              ? "🔴"
                              : issue.severity === "warning"
                              ? "⚠️"
                              : "ℹ️"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 mb-1">
                              {issue.message}
                            </div>
                            {issue.details && (
                              <div className="text-sm text-gray-700">
                                {issue.details}
                              </div>
                            )}
                            {issue.table && (
                              <div className="mt-2 text-xs text-gray-500">
                                <span className="font-semibold">Table:</span>{" "}
                                {issue.table}
                                {issue.count && (
                                  <span className="ml-2">
                                    • {issue.count} affected
                                  </span>
                                )}
                              </div>
                            )}
                            {issue.category && (
                              <div className="mt-1 text-xs text-gray-500">
                                <span className="inline-block bg-white px-2 py-1 rounded border border-gray-300">
                                  {issue.category}
                                </span>
                              </div>
                            )}
                            <div className="mt-1 text-xs text-gray-400">
                              From: {issue.source}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                              issue.severity === "critical"
                                ? "bg-red-100 text-red-700"
                                : issue.severity === "warning"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                            {issue.severity}
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isChecking && !results && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Ready to Check System Health
            </h3>
            <p className="text-gray-600 mb-6">
              Click "Run System Check" to start monitoring your system
            </p>
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span>Fast Execution</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span>Accurate Results</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span>Detailed Reports</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitorDashboard;

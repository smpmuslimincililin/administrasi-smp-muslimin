import React, { useState } from "react";

function MonitorResults({ results, isChecking }) {
  console.log("🐛 RESULTS PROPS:", results); // Cek ini di console

  // ⚡ TEMPORARY: PAKSA PAKE DATA TEST
  const testData = {
    summary: {
      totalIssues: 5,
      criticalCount: 2,
      warningCount: 2,
      infoCount: 1,
      status: "critical",
      totalChecksRun: 4,
    },
    results: {
      database: { status: "healthy", checks: [] },
      validation: { status: "healthy", checks: [] },
      businessLogic: { status: "healthy", checks: [] },
      appHealth: {
        status: "critical",
        checks: [
          { title: "TEST Critical", message: "Ini test", severity: "critical" },
          { title: "TEST Warning", message: "Ini test", severity: "warning" },
        ],
      },
    },
    executionTime: 2600,
  };

  // ⚡ PAKSA PAKE testData, JANGAN results
  const displayData = testData; // Ganti jadi 'results' kalo mau balik normal

  const [expandedSections, setExpandedSections] = useState({});

  if (isChecking) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin text-4xl mb-4">🔄</div>
        <p className="text-gray-600 font-medium">
          Memeriksa kesehatan sistem...
        </p>
        <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
        <div className="mt-4 flex justify-center gap-2">
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">🔧</div>
        <p className="text-gray-600 mb-2 font-medium text-lg">
          Belum ada pemeriksaan
        </p>
        <p className="text-sm text-gray-500">
          Klik tombol "Run System Check" untuk memulai pemeriksaan kesehatan
          sistem
        </p>
      </div>
    );
  }

  const { summary, results: checkResults, executionTime, errors } = results;

  // Helper function to get status color
  const getStatusColor = (status) => {
    const colors = {
      healthy: "green",
      warning: "yellow",
      critical: "red",
      info: "blue",
    };
    return colors[status] || "gray";
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    const icons = {
      healthy: "✅",
      warning: "⚠️",
      critical: "🔴",
      info: "ℹ️",
    };
    return icons[status] || "❓";
  };

  // Helper to get badge classes
  const getBadgeClass = (severity) => {
    const classes = {
      critical: "bg-red-100 text-red-700 border-red-300",
      warning: "bg-yellow-100 text-yellow-700 border-yellow-300",
      info: "bg-blue-100 text-blue-700 border-blue-300",
      healthy: "bg-green-100 text-green-700 border-green-300",
    };
    return classes[severity] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  // Helper to render check items
  const renderCheckItem = (check, index) => {
    return (
      <div
        key={index}
        className="py-4 first:pt-3 border-b last:border-b-0 border-gray-100">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5 flex-shrink-0">
            {getStatusIcon(check.severity)}
          </span>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 mb-1">
              {check.title || check.message}
            </h4>

            {check.message && check.title && check.title !== check.message && (
              <p className="text-sm text-gray-600 mb-2">{check.message}</p>
            )}

            {check.details && (
              <div className="mt-2 space-y-1">
                {check.details.description && (
                  <p className="text-sm text-gray-600">
                    {check.details.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {check.details.table && (
                    <div className="flex items-center gap-1.5">
                      <span>📋</span>
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {check.details.table}
                      </span>
                    </div>
                  )}

                  {(check.details.affectedRecords !== undefined ||
                    check.details.count !== undefined) && (
                    <div className="flex items-center gap-1.5">
                      <span>📊</span>
                      <span className="font-medium text-blue-600">
                        {check.details.affectedRecords || check.details.count}{" "}
                        record(s)
                      </span>
                    </div>
                  )}

                  {check.details.recommendation && (
                    <div className="w-full mt-1 text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      💡 {check.details.recommendation}
                    </div>
                  )}

                  {check.details.value && (
                    <div className="flex items-center gap-1.5">
                      <span>📌</span>
                      <span>{check.details.value}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${getBadgeClass(
              check.severity
            )}`}>
            {check.severity.toUpperCase()}
          </span>
        </div>
      </div>
    );
  };

  // Helper to render category section
  const renderCategorySection = (categoryKey, categoryData, icon, title) => {
    if (!categoryData || !categoryData.checks) return null;

    const isExpanded = expandedSections[categoryKey];
    const hasIssues = categoryData.checks.length > 0;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection(categoryKey)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">
                {categoryData.checks.length} issue(s) ditemukan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeClass(
                categoryData.status
              )}`}>
              {categoryData.status.toUpperCase()}
            </span>
            <span
              className={`transform transition-transform text-gray-400 ${
                isExpanded ? "rotate-180" : ""
              }`}>
              ▼
            </span>
          </div>
        </button>

        {isExpanded && (
          <div className="px-5 pb-2 border-t border-gray-100 bg-gray-50">
            {hasIssues ? (
              <div className="divide-y divide-gray-100">
                {categoryData.checks.map((check, idx) =>
                  renderCheckItem(check, idx)
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <span className="text-3xl block mb-2">✅</span>
                <p className="text-sm">Tidak ada masalah ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <div
        className={`rounded-lg p-6 border-2 ${
          summary.status === "healthy"
            ? "bg-green-50 border-green-200"
            : summary.status === "warning"
            ? "bg-yellow-50 border-yellow-200"
            : "bg-red-50 border-red-200"
        }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">
              {getStatusIcon(summary.status)} Status Keseluruhan
            </h3>
            <p
              className={`text-sm font-medium ${
                summary.status === "healthy"
                  ? "text-green-700"
                  : summary.status === "warning"
                  ? "text-yellow-700"
                  : "text-red-700"
              }`}>
              {summary.status === "healthy"
                ? "Sistem Sehat"
                : summary.status === "warning"
                ? "Perlu Perhatian"
                : "Critical - Perlu Tindakan Segera"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">5</p>
            <p className="text-sm text-gray-600">Total Issues</p>
          </div>
        </div>

        <div className="mt-4 flex gap-4 text-sm flex-wrap">
          {summary.criticalCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-red-600 font-semibold">
                🔴 {summary.criticalCount}
              </span>
              <span className="text-gray-600">Critical</span>
            </div>
          )}
          {summary.warningCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-600 font-semibold">
                ⚠️ {summary.warningCount}
              </span>
              <span className="text-gray-600">Warning</span>
            </div>
          )}
          {summary.infoCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-blue-600 font-semibold">
                ℹ️ {summary.infoCount}
              </span>
              <span className="text-gray-600">Info</span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-gray-500">⏱️</span>
            <span className="text-gray-600">
              {(executionTime / 1000).toFixed(2)}s
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Card */}
        <div
          className={`bg-white rounded-lg shadow p-5 border-l-4 ${
            checkResults.database?.status === "healthy"
              ? "border-green-500"
              : checkResults.database?.status === "warning"
              ? "border-yellow-500"
              : "border-red-500"
          }`}>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">
            Database Integrity
          </h4>
          <div className="flex items-center justify-between">
            <p className="text-3xl">
              {getStatusIcon(checkResults.database?.status || "info")}
            </p>
            <div className="text-right">
              <p
                className={`text-lg font-bold ${
                  checkResults.database?.status === "healthy"
                    ? "text-green-600"
                    : checkResults.database?.status === "warning"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}>
                {checkResults.database?.checks?.length || 0}
              </p>
              <p className="text-xs text-gray-500">checks</p>
            </div>
          </div>
          {checkResults.database?.error && (
            <p className="text-xs text-red-600 mt-2">
              Error: {checkResults.database.error}
            </p>
          )}
        </div>

        {/* Data Validation Card */}
        <div
          className={`bg-white rounded-lg shadow p-5 border-l-4 ${
            checkResults.validation?.status === "healthy"
              ? "border-green-500"
              : checkResults.validation?.status === "warning"
              ? "border-yellow-500"
              : "border-red-500"
          }`}>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">
            Data Validation
          </h4>
          <div className="flex items-center justify-between">
            <p className="text-3xl">
              {getStatusIcon(checkResults.validation?.status || "info")}
            </p>
            <div className="text-right">
              <p
                className={`text-lg font-bold ${
                  checkResults.validation?.status === "healthy"
                    ? "text-green-600"
                    : checkResults.validation?.status === "warning"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}>
                {checkResults.validation?.checks?.length || 0}
              </p>
              <p className="text-xs text-gray-500">checks</p>
            </div>
          </div>
          {checkResults.validation?.error && (
            <p className="text-xs text-red-600 mt-2">
              Error: {checkResults.validation.error}
            </p>
          )}
        </div>

        {/* Business Logic Card */}
        <div
          className={`bg-white rounded-lg shadow p-5 border-l-4 ${
            checkResults.businessLogic?.status === "healthy"
              ? "border-green-500"
              : checkResults.businessLogic?.status === "warning"
              ? "border-yellow-500"
              : "border-red-500"
          }`}>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">
            Business Logic
          </h4>
          <div className="flex items-center justify-between">
            <p className="text-3xl">
              {getStatusIcon(checkResults.businessLogic?.status || "info")}
            </p>
            <div className="text-right">
              <p
                className={`text-lg font-bold ${
                  checkResults.businessLogic?.status === "healthy"
                    ? "text-green-600"
                    : checkResults.businessLogic?.status === "warning"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}>
                {checkResults.businessLogic?.checks?.length || 0}
              </p>
              <p className="text-xs text-gray-500">checks</p>
            </div>
          </div>
          {checkResults.businessLogic?.error && (
            <p className="text-xs text-red-600 mt-2">
              Error: {checkResults.businessLogic.error}
            </p>
          )}
        </div>

        {/* App Health Card */}
        <div
          className={`bg-white rounded-lg shadow p-5 border-l-4 ${
            checkResults.appHealth?.status === "healthy"
              ? "border-green-500"
              : checkResults.appHealth?.status === "warning"
              ? "border-yellow-500"
              : "border-red-500"
          }`}>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">
            App Health
          </h4>
          <div className="flex items-center justify-between">
            <p className="text-3xl">
              {getStatusIcon(checkResults.appHealth?.status || "info")}
            </p>
            <div className="text-right">
              <p
                className={`text-lg font-bold ${
                  checkResults.appHealth?.status === "healthy"
                    ? "text-green-600"
                    : checkResults.appHealth?.status === "warning"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}>
                {checkResults.appHealth?.checks?.length || 0}
              </p>
              <p className="text-xs text-gray-500">metrics</p>
            </div>
          </div>
          {checkResults.appHealth?.error && (
            <p className="text-xs text-red-600 mt-2">
              Error: {checkResults.appHealth.error}
            </p>
          )}
        </div>
      </div>

      {/* Errors Section */}
      {errors && errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="font-semibold text-red-800 mb-2 flex items-center gap-2">
            <span>⚠️</span>
            Errors During Check:
          </p>
          <ul className="space-y-1 text-sm text-red-700">
            {errors.map((err, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>
                  <strong>{err.checker}:</strong> {err.error}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Results - Expandable Sections */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>📋</span>
          Detail Hasil Pemeriksaan
        </h3>

        {renderCategorySection(
          "validation",
          checkResults.validation,
          "✅",
          "Data Validation"
        )}
        {renderCategorySection(
          "database",
          checkResults.database,
          "🗄️",
          "Database Integrity"
        )}
        {renderCategorySection(
          "businessLogic",
          checkResults.businessLogic,
          "💼",
          "Business Logic"
        )}
        {renderCategorySection(
          "appHealth",
          checkResults.appHealth,
          "💊",
          "App Health"
        )}
      </div>
    </div>
  );
}

export default MonitorResults;

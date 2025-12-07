import React, { useState } from "react";
import MonitorDashboard from "./MonitorDashboard";
import DatabaseCleanupMonitor from "./DatabaseCleanupMonitor";
import PerformanceMonitor from "./PerformanceMonitor";
import { Activity, Database, Gauge } from "lucide-react";

function MonitorSistem({ user, onShowToast }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    {
      id: "dashboard",
      label: "System Health",
      icon: Activity,
      component: MonitorDashboard,
    },
    {
      id: "performance",
      label: "Performance",
      icon: Gauge,
      component: PerformanceMonitor,
    },
    {
      id: "cleanup",
      label: "Database Cleanup",
      icon: Database,
      component: DatabaseCleanupMonitor,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Monitor Sistem</h1>
        <p className="text-gray-600 mt-1">
          Pemeriksaan kesehatan sistem dan integritas data
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 font-medium text-sm
                  border-b-2 transition-all duration-200
                  ${
                    isActive
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }
                `}>
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === "dashboard" && (
          <MonitorDashboard user={user} onShowToast={onShowToast} />
        )}
        {activeTab === "performance" && (
          <PerformanceMonitor user={user} onShowToast={onShowToast} />
        )}
        {activeTab === "cleanup" && (
          <DatabaseCleanupMonitor user={user} onShowToast={onShowToast} />
        )}
      </div>
    </div>
  );
}

export default MonitorSistem;

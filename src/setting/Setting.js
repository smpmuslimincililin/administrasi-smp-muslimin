import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  SettingsIcon,
  User,
  School,
  Calendar,
  Building2,
  Database,
  Home,
  ChevronRight,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import ProfileTab from "./ProfileTab";
import SchoolManagementTab from "./SchoolManagementTab";
import AcademicYearTab from "./AcademicYearTab";
import SchoolSettingsTab from "./SchoolSettingsTab";
import SystemTab from "./SystemTab";
import MaintenanceModeTab from "./MaintenanceModeTab";

const Setting = ({ user, onShowToast }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get tab from URL query parameter, default to 'profile'
  const tabFromURL = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromURL || "profile");

  const [loading, setLoading] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState(null);

  // ✅ Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // ✅ Handle URL parameter changes & smooth scroll
  useEffect(() => {
    if (tabFromURL && tabFromURL !== activeTab) {
      setActiveTab(tabFromURL);

      // Smooth scroll to tab content with delay
      setTimeout(() => {
        const element = document.getElementById(`${tabFromURL}-tab-content`);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }, 150);
    }
  }, [tabFromURL]);

  useEffect(() => {
    if (user) {
      loadSchoolConfig();
    }
  }, [user]);

  // ✅ Close mobile menu when tab changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [activeTab]);

  // ✅ Load school config dari Supabase
  const loadSchoolConfig = async () => {
    try {
      setLoading(true);
      const { data: settings, error } = await supabase
        .from("school_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["school_name", "school_level"]); // 🔧 Hapus "grades"

      if (error) throw error;

      const config = {};
      settings?.forEach((item) => {
        config[item.setting_key] = item.setting_value;
      });

      // 🔧 Generate grades otomatis berdasarkan school_level
      const schoolLevel = config.school_level || "SMP";
      let grades = ["7", "8", "9"]; // Default SMP

      if (schoolLevel === "SMP" || schoolLevel === "MTs") {
        grades = ["7", "8", "9"];
      } else if (
        schoolLevel === "SMA" ||
        schoolLevel === "SMK" ||
        schoolLevel === "MA"
      ) {
        grades = ["10", "11", "12"];
      } else if (schoolLevel === "SD" || schoolLevel === "MI") {
        grades = ["1", "2", "3", "4", "5", "6"];
      }

      setSchoolConfig({
        schoolName: config.school_name || "SMP Muslimin Cililin",
        schoolLevel: schoolLevel,
        grades: grades,
      });
    } catch (error) {
      console.error("Error loading school config:", error);
      if (onShowToast) {
        onShowToast("Gagal memuat konfigurasi sekolah", "error");
      }
      setSchoolConfig({
        schoolName: "SMP Muslimin Cililin",
        schoolLevel: "SMP",
        grades: ["7", "8", "9"],
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Tabs - hanya admin yang bisa akses Maintenance Mode
  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    ...(user?.role === "admin"
      ? [
          { id: "school", label: "Manajemen Sekolah", icon: School },
          { id: "academic", label: "Tahun Ajaran", icon: Calendar },
          { id: "settings", label: "Pengaturan Sekolah", icon: Building2 },
          { id: "system", label: "System", icon: Database },
          { id: "maintenance", label: "Maintenance", icon: AlertCircle },
        ]
      : []),
  ];

  // ✅ Get current tab label for breadcrumb
  const getCurrentTabLabel = () => {
    const currentTab = tabs.find((tab) => tab.id === activeTab);
    return currentTab ? currentTab.label : "Profile";
  };

  // ✅ Render Active Tab
  const renderActiveTab = () => {
    const commonProps = {
      userId: user?.id,
      user,
      loading,
      setLoading,
      showToast: onShowToast,
      schoolConfig,
      refreshSchoolConfig: loadSchoolConfig,
    };

    switch (activeTab) {
      case "profile":
        return <ProfileTab {...commonProps} />;
      case "school":
        return <SchoolManagementTab {...commonProps} />;
      case "academic":
        return <AcademicYearTab {...commonProps} />;
      case "settings":
        return <SchoolSettingsTab {...commonProps} />;
      case "maintenance":
        return <MaintenanceModeTab {...commonProps} />;
      case "system":
        return <SystemTab {...commonProps} />;
      default:
        return <ProfileTab {...commonProps} />;
    }
  };

  // ✅ Loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ✅ BREADCRUMB - Responsive */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 overflow-x-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0">
            <Home size={14} className="sm:w-4 sm:h-4" />
            <span>Dashboard</span>
          </button>
          <ChevronRight
            size={14}
            className="text-gray-400 flex-shrink-0 sm:w-4 sm:h-4"
          />
          <span className="text-blue-600 font-medium whitespace-nowrap">
            Pengaturan
          </span>
          {activeTab !== "profile" && (
            <>
              <ChevronRight
                size={14}
                className="text-gray-400 flex-shrink-0 sm:w-4 sm:h-4"
              />
              <span className="text-blue-600 font-medium whitespace-nowrap truncate">
                {getCurrentTabLabel()}
              </span>
            </>
          )}
        </div>

        {/* ✅ Header - Responsive */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <SettingsIcon className="text-blue-600 w-6 h-6 sm:w-7 sm:h-7" />
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800">
                Pengaturan Sistem
              </h1>
              {schoolConfig && (
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                  {schoolConfig.schoolName} - {schoolConfig.schoolLevel}
                </p>
              )}
            </div>
          </div>

          {/* ✅ Mobile Menu Toggle - Only on mobile */}
          {tabs.length > 1 && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              {showMobileMenu ? (
                <X size={24} className="text-gray-600" />
              ) : (
                <Menu size={24} className="text-gray-600" />
              )}
            </button>
          )}
        </div>

        {/* ✅ Desktop Tab Navigation - Hidden on mobile */}
        <div className="hidden lg:flex overflow-x-auto border-b border-gray-200 mb-6">
          <div className="flex min-w-max space-x-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 scale-105"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab(tab.id)}>
                  <IconComponent
                    size={16}
                    className={isActive ? "animate-pulse" : ""}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ✅ Mobile/Tablet Tab Navigation - Dropdown style */}
        {showMobileMenu && (
          <div className="lg:hidden mb-4 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-in slide-in-from-top duration-200">
            <div className="p-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? "text-blue-600 bg-blue-50 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setActiveTab(tab.id)}>
                    <IconComponent
                      size={18}
                      className={isActive ? "text-blue-600" : "text-gray-500"}
                    />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {isActive && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ✅ Tablet Horizontal Scroll Tabs - Only on tablet */}
        <div className="lg:hidden block mb-4 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max space-x-2 pb-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 whitespace-nowrap py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                    isActive
                      ? "text-blue-600 bg-blue-50 border-2 border-blue-600 shadow-sm"
                      : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab(tab.id)}>
                  <IconComponent
                    size={16}
                    className={isActive ? "animate-pulse" : ""}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ✅ Tab Content - Responsive padding */}
        <div
          id={`${activeTab}-tab-content`}
          className="bg-white rounded-lg shadow-sm transition-all duration-300 overflow-hidden">
          {renderActiveTab()}
        </div>
      </div>

      {/* ✅ Overlay for mobile menu */}
      {showMobileMenu && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setShowMobileMenu(false)}></div>
      )}
    </div>
  );
};

export default Setting;

import React from "react";

const AttendanceStats = ({ attendanceStatus, students }) => {
  const getAttendanceStats = () => {
    const stats = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
    Object.values(attendanceStatus).forEach((status) => {
      if (stats[status] !== undefined) stats[status]++;
    });
    return stats;
  };

  const stats = getAttendanceStats();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {/* Hadir Card */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-green-500">
        <div className="flex items-center">
          <div className="text-green-600 text-lg sm:text-xl mr-2 sm:mr-3">
            ✓
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800">
              {stats.Hadir}
            </div>
            <div className="text-xs sm:text-sm text-slate-600">Hadir</div>
          </div>
        </div>
      </div>

      {/* Sakit Card */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
        <div className="flex items-center">
          <div className="text-yellow-600 text-lg sm:text-xl mr-2 sm:mr-3">
            🏥
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800">
              {stats.Sakit}
            </div>
            <div className="text-xs sm:text-sm text-slate-600">Sakit</div>
          </div>
        </div>
      </div>

      {/* Izin Card */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
        <div className="flex items-center">
          <div className="text-blue-600 text-lg sm:text-xl mr-2 sm:mr-3">
            📋
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800">
              {stats.Izin}
            </div>
            <div className="text-xs sm:text-sm text-slate-600">Izin</div>
          </div>
        </div>
      </div>

      {/* Alpa Card */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-red-500">
        <div className="flex items-center">
          <div className="text-red-600 text-lg sm:text-xl mr-2 sm:mr-3">✖</div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800">
              {stats.Alpa}
            </div>
            <div className="text-xs sm:text-sm text-slate-600">Alpa</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceStats;

import React, { useMemo } from "react";

const Statistics = ({
  students,
  totalStudents,
  maleStudents,
  femaleStudents,
  getCurrentAcademicYear,
}) => {
  // Get top schools stats untuk bar chart (top 8)
  const getSchoolStats = useMemo(() => {
    if (!students || students.length === 0) return [];

    const schoolCounts = {};
    students.forEach((student) => {
      const school = (student.asal_sekolah || "Tidak Diketahui").trim();
      schoolCounts[school] = (schoolCounts[school] || 0) + 1;
    });

    return Object.entries(schoolCounts)
      .map(([school, count]) => ({ school, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [students]);

  // Get ALL schools dengan breakdown gender (untuk tabel)
  const getSchoolRankings = useMemo(() => {
    if (!students || students.length === 0) return [];

    const schoolData = {};

    students.forEach((student) => {
      const school = (student.asal_sekolah || "Tidak Diketahui").trim();
      const gender = student.jenis_kelamin;

      if (!schoolData[school]) {
        schoolData[school] = {
          school,
          total: 0,
          male: 0,
          female: 0,
        };
      }

      schoolData[school].total += 1;
      if (gender === "L") schoolData[school].male += 1;
      if (gender === "P") schoolData[school].female += 1;
    });

    return Object.values(schoolData).sort((a, b) => b.total - a.total);
  }, [students]);

  const malePercentage =
    totalStudents > 0 ? (maleStudents / totalStudents) * 100 : 0;
  const femalePercentage =
    totalStudents > 0 ? (femaleStudents / totalStudents) * 100 : 0;

  const maxSchoolCount =
    getSchoolStats.length > 0
      ? Math.max(...getSchoolStats.map((s) => s.count))
      : 0;

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Dashboard Statistik
          </h1>
          <p className="text-gray-600">
            SMP Muslimin Cililin - Tahun Ajaran {getCurrentAcademicYear()}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm border border-purple-100">
            <div className="text-sm text-purple-600 font-semibold mb-2">
              Total Pendaftar
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-purple-700">
              {totalStudents}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="text-sm text-blue-600 font-semibold mb-2">
              Siswa Laki-laki
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-blue-700">
              {maleStudents}
            </div>
            <div className="text-sm text-blue-600 font-medium mt-1">
              {malePercentage.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 shadow-sm border border-rose-100">
            <div className="text-sm text-rose-600 font-semibold mb-2">
              Siswa Perempuan
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-rose-700">
              {femaleStudents}
            </div>
            <div className="text-sm text-rose-600 font-medium mt-1">
              {femalePercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
          {/* Pie Chart - Gender Distribution */}
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 sm:mb-8">
              Distribusi Gender
            </h2>

            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <svg
                width="240"
                height="240"
                viewBox="0 0 280 280"
                className="transform -rotate-90 w-full max-w-[240px]">
                {/* Background circle */}
                <circle
                  cx="140"
                  cy="140"
                  r="100"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="40"
                />
                {/* Male segment */}
                <circle
                  cx="140"
                  cy="140"
                  r="100"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="40"
                  strokeDasharray={`${(malePercentage / 100) * 628} 628`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                {/* Female segment */}
                <circle
                  cx="140"
                  cy="140"
                  r="100"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="40"
                  strokeDasharray={`${(femalePercentage / 100) * 628} 628`}
                  strokeDashoffset={`-${(malePercentage / 100) * 628}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                {/* Center text */}
                <text
                  x="140"
                  y="140"
                  textAnchor="middle"
                  dy="0.3em"
                  className="text-3xl sm:text-4xl font-bold fill-gray-900 transform rotate-90"
                  style={{ transformOrigin: "140px 140px" }}>
                  {totalStudents}
                </text>
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-blue-600"></div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Laki-laki
                  </div>
                  <div className="text-base sm:text-lg font-semibold text-gray-900">
                    {maleStudents} ({malePercentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-rose-600"></div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Perempuan
                  </div>
                  <div className="text-base sm:text-lg font-semibold text-gray-900">
                    {femaleStudents} ({femalePercentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart - Top Schools */}
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 sm:mb-8">
              Asal Sekolah (Top 8)
            </h2>

            <div className="space-y-4">
              {getSchoolStats.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  Belum ada data
                </div>
              ) : (
                getSchoolStats.map((stat, index) => {
                  const barWidth =
                    maxSchoolCount > 0
                      ? (stat.count / maxSchoolCount) * 100
                      : 0;
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="text-xs sm:text-sm text-gray-700 truncate flex-1 mr-4"
                          title={stat.school}>
                          {stat.school}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 tabular-nums">
                          {stat.count}
                        </div>
                      </div>
                      <div className="h-7 sm:h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg transition-all duration-1000 flex items-center px-2 sm:px-3"
                          style={{ width: `${barWidth}%` }}>
                          {barWidth > 15 && (
                            <span className="text-xs font-medium text-white">
                              {((stat.count / totalStudents) * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* School Rankings Table - NEW */}
        <div className="bg-white rounded-xl p-4 sm:p-8 shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            Pendaftar Berdasarkan Asal Sekolah
          </h2>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">
                      No
                    </th>
                    <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">
                      Asal Sekolah
                    </th>
                    <th className="text-center py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">
                      Total
                    </th>
                    <th className="text-center py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">
                      <span className="hidden sm:inline">Laki-laki</span>
                      <span className="sm:hidden">L</span>
                    </th>
                    <th className="text-center py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">
                      <span className="hidden sm:inline">Perempuan</span>
                      <span className="sm:hidden">P</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!students || students.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-12 text-gray-400">
                        Belum ada pendaftar
                      </td>
                    </tr>
                  ) : (
                    getSchoolRankings.map((school, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-gray-600 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-medium text-gray-900">
                          <div
                            className="max-w-xs truncate"
                            title={school.school}>
                            {school.school}
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold rounded-lg">
                            {school.total}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 sm:px-3 py-1 bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold rounded-lg">
                            {school.male}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 sm:px-3 py-1 bg-rose-50 text-rose-700 text-xs sm:text-sm font-semibold rounded-lg">
                            {school.female}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Footer */}
          {getSchoolRankings.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-gray-600">
                <div>
                  Total{" "}
                  <span className="font-semibold text-gray-900">
                    {getSchoolRankings.length}
                  </span>{" "}
                  sekolah asal
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-600"></div>
                    <span>
                      <span className="font-semibold text-gray-900">
                        {maleStudents}
                      </span>{" "}
                      Laki-laki
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-rose-600"></div>
                    <span>
                      <span className="font-semibold text-gray-900">
                        {femaleStudents}
                      </span>{" "}
                      Perempuan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;

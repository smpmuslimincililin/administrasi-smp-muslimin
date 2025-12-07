import React from "react";

const AttendanceFilters = ({
  subjects,
  selectedSubject,
  setSelectedSubject,
  classes,
  selectedClass,
  setSelectedClass,
  date,
  setDate,
  loading,
  teacherId,
  isHomeroomDaily,
  setStudents,
  setStudentsLoaded,
}) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-4 sm:mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Mata Pelajaran Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Mata Pelajaran
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedClass("");
              setStudents([]);
              setStudentsLoaded(false);
            }}
            disabled={loading || !teacherId}
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
            <option value="">Pilih Mata Pelajaran</option>
            {subjects.map((subject, index) => (
              <option key={index} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {/* Kelas Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Kelas
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={!selectedSubject || loading || isHomeroomDaily()}
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-slate-50">
            <option value="">Pilih Kelas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.displayName}
              </option>
            ))}
          </select>
          {isHomeroomDaily() && (
            <p className="text-xs text-blue-600 mt-1">
              Kelas otomatis dipilih untuk presensi harian
            </p>
          )}
        </div>

        {/* Tanggal Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Tanggal
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
            min="2024-01-01"
            max="2026-12-31"
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          <p className="text-xs text-slate-500 mt-1">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceFilters;

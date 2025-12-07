import React from "react";

const AttendanceTable = ({
  filteredStudents,
  classes,
  selectedClass,
  searchTerm,
  attendanceStatus,
  attendanceNotes,
  loading,
  handleStatusChange,
  handleNotesChange,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">
          Daftar Siswa -{" "}
          {classes.find((c) => c.id === selectedClass)?.displayName}
          {searchTerm && (
            <span className="text-sm text-slate-600 ml-2">
              ({filteredStudents.length} siswa)
            </span>
          )}
        </h3>
      </div>

      {/* Mobile View */}
      <div className="block sm:hidden">
        {filteredStudents.map((student, index) => (
          <div key={student.id} className="border-b border-slate-100 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-medium text-slate-900 mb-1">
                  {index + 1}. {student.full_name}
                </div>
                <div className="text-sm text-slate-600">NIS: {student.nis}</div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Status Kehadiran */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-2 block">
                  Status Kehadiran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition touch-manipulation ${
                      attendanceStatus[student.id] === "Hadir"
                        ? "bg-green-500 text-white"
                        : "bg-slate-100 text-slate-700 active:bg-slate-200"
                    }`}
                    onClick={() => handleStatusChange(student.id, "Hadir")}
                    disabled={loading}
                    style={{ minHeight: "44px" }}>
                    ✓ Hadir
                  </button>
                  <button
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition touch-manipulation ${
                      attendanceStatus[student.id] === "Sakit"
                        ? "bg-yellow-500 text-white"
                        : "bg-slate-100 text-slate-700 active:bg-slate-200"
                    }`}
                    onClick={() => handleStatusChange(student.id, "Sakit")}
                    disabled={loading}
                    style={{ minHeight: "44px" }}>
                    🏥 Sakit
                  </button>
                  <button
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition touch-manipulation ${
                      attendanceStatus[student.id] === "Izin"
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 text-slate-700 active:bg-slate-200"
                    }`}
                    onClick={() => handleStatusChange(student.id, "Izin")}
                    disabled={loading}
                    style={{ minHeight: "44px" }}>
                    📋 Izin
                  </button>
                  <button
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition touch-manipulation ${
                      attendanceStatus[student.id] === "Alpa"
                        ? "bg-red-500 text-white"
                        : "bg-slate-100 text-slate-700 active:bg-slate-200"
                    }`}
                    onClick={() => handleStatusChange(student.id, "Alpa")}
                    disabled={loading}
                    style={{ minHeight: "44px" }}>
                    ✖ Alpa
                  </button>
                </div>
              </div>

              {/* Keterangan Input */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-2 block">
                  Keterangan
                </label>
                <input
                  type="text"
                  className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Tambahkan keterangan jika diperlukan..."
                  value={attendanceNotes[student.id] || ""}
                  onChange={(e) =>
                    handleNotesChange(student.id, e.target.value)
                  }
                  disabled={loading}
                  style={{ minHeight: "44px" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-slate-700 whitespace-nowrap"
                style={{ width: "60px" }}>
                No
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-slate-700 whitespace-nowrap"
                style={{ width: "120px" }}>
                NIS
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-slate-700"
                style={{ minWidth: "200px" }}>
                Nama Siswa
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-slate-700"
                style={{ minWidth: "280px" }}>
                Status Kehadiran
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-slate-700"
                style={{ minWidth: "250px" }}>
                Keterangan
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr
                key={student.id}
                className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">
                  {index + 1}
                </td>
                <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                  {student.nis}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {student.full_name}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        attendanceStatus[student.id] === "Hadir"
                          ? "bg-green-500 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      onClick={() => handleStatusChange(student.id, "Hadir")}
                      disabled={loading}>
                      ✓ Hadir
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        attendanceStatus[student.id] === "Sakit"
                          ? "bg-yellow-500 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      onClick={() => handleStatusChange(student.id, "Sakit")}
                      disabled={loading}>
                      🏥 Sakit
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        attendanceStatus[student.id] === "Izin"
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      onClick={() => handleStatusChange(student.id, "Izin")}
                      disabled={loading}>
                      📋 Izin
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        attendanceStatus[student.id] === "Alpa"
                          ? "bg-red-500 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      onClick={() => handleStatusChange(student.id, "Alpa")}
                      disabled={loading}>
                      ✖ Alpa
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Tambahkan keterangan..."
                    value={attendanceNotes[student.id] || ""}
                    onChange={(e) =>
                      handleNotesChange(student.id, e.target.value)
                    }
                    disabled={loading}
                    style={{ minWidth: "220px" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;

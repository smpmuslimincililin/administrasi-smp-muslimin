import React, { useState, useEffect } from "react";
import { FileDown, Printer, RefreshCw, Filter } from "lucide-react";
import { supabase } from "../../supabaseClient";

const AcademicGradesView = ({ classId, className }) => {
  const [gradesData, setGradesData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState("1");
  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [academicYears, setAcademicYears] = useState([]);

  // Fetch data tahun ajaran
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Fetch grades data
  useEffect(() => {
    if (classId) {
      fetchGradesData();
    }
  }, [classId, semester, academicYear]);

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("year")
        .order("year", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setAcademicYears(data.map((item) => item.year));
        setAcademicYear(data[0].year);
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      setAcademicYears(["2024/2025", "2023/2024"]);
    }
  };

  const fetchGradesData = async () => {
    setLoading(true);
    try {
      // 1. Fetch semua siswa di kelas ini
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, name, nis")
        .eq("class_id", classId)
        .order("name");

      if (studentsError) throw studentsError;

      // 2. Fetch semua mata pelajaran
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name");

      if (subjectsError) throw subjectsError;

      setSubjects(subjectsData || []);

      // 3. Fetch semua nilai untuk siswa-siswa ini
      const studentIds = students.map((s) => s.id);

      const { data: grades, error: gradesError } = await supabase
        .from("grades")
        .select(
          `
          id,
          student_id,
          subject_id,
          grade,
          semester,
          academic_year
        `
        )
        .in("student_id", studentIds)
        .eq("semester", semester)
        .eq("academic_year", academicYear);

      if (gradesError) throw gradesError;

      // 4. Format data untuk ditampilkan di tabel
      const formattedData = students.map((student, index) => {
        const studentGrades = {};
        let totalGrades = 0;
        let gradeCount = 0;

        subjectsData.forEach((subject) => {
          const gradeRecord = grades?.find(
            (g) => g.student_id === student.id && g.subject_id === subject.id
          );

          if (gradeRecord && gradeRecord.grade !== null) {
            studentGrades[subject.id] = gradeRecord.grade;
            totalGrades += parseFloat(gradeRecord.grade);
            gradeCount++;
          } else {
            studentGrades[subject.id] = "-";
          }
        });

        const average =
          gradeCount > 0 ? (totalGrades / gradeCount).toFixed(2) : "-";
        const total = gradeCount > 0 ? totalGrades.toFixed(0) : "-";

        return {
          no: index + 1,
          studentId: student.id,
          nis: student.nis,
          name: student.name,
          grades: studentGrades,
          total: total,
          average: average,
        };
      });

      setGradesData(formattedData);
    } catch (error) {
      console.error("Error fetching grades data:", error);
      alert("Gagal memuat data nilai. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      // Import dinamis untuk ExcelJS (kalau diperlukan)
      alert("Fitur export Excel akan segera hadir!");
      // TODO: Implementasi export ke Excel
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Gagal export data");
    }
  };

  const handleRefresh = () => {
    fetchGradesData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data nilai...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header Section */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Nilai Akademik</h2>
            <p className="text-gray-600 mt-1">
              Kelas: <span className="font-semibold">{className}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 print:hidden">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
              <RefreshCw size={18} />
              Refresh
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition">
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              <FileDown size={18} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex gap-4 print:hidden">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tahun Ajaran
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="p-6 overflow-x-auto">
        {gradesData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Tidak ada data nilai</p>
            <p className="text-gray-400 text-sm mt-2">
              Silakan input nilai terlebih dahulu
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-16">
                  No
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 min-w-[200px]">
                  Nama Siswa
                </th>

                {/* Kolom Mata Pelajaran (Dinamis) */}
                {subjects.map((subject) => (
                  <th
                    key={subject.id}
                    className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 min-w-[100px]">
                    {subject.name}
                  </th>
                ))}

                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-24">
                  Jumlah
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-28">
                  Rata-rata
                </th>
              </tr>
            </thead>

            <tbody>
              {gradesData.map((student) => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                    {student.no}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-800">
                    {student.name}
                  </td>

                  {/* Nilai per Mata Pelajaran */}
                  {subjects.map((subject) => (
                    <td
                      key={subject.id}
                      className="border border-gray-300 px-4 py-3 text-center text-gray-700">
                      {student.grades[subject.id] === "-" ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        <span
                          className={
                            student.grades[subject.id] >= 75
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }>
                          {student.grades[subject.id]}
                        </span>
                      )}
                    </td>
                  ))}

                  <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                    {student.total}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-600">
                    {student.average}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer dengan Rata-rata Kelas */}
            <tfoot>
              <tr className="bg-blue-50">
                <td
                  colSpan={2}
                  className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">
                  Rata-rata Kelas
                </td>

                {subjects.map((subject) => {
                  const subjectGrades = gradesData
                    .map((s) => s.grades[subject.id])
                    .filter((g) => g !== "-")
                    .map((g) => parseFloat(g));

                  const avg =
                    subjectGrades.length > 0
                      ? (
                          subjectGrades.reduce((a, b) => a + b, 0) /
                          subjectGrades.length
                        ).toFixed(2)
                      : "-";

                  return (
                    <td
                      key={subject.id}
                      className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-600">
                      {avg}
                    </td>
                  );
                })}

                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">
                  -
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-600">
                  {gradesData.length > 0
                    ? (
                        gradesData
                          .map((s) => parseFloat(s.average))
                          .filter((a) => !isNaN(a))
                          .reduce((a, b) => a + b, 0) /
                        gradesData.filter((s) => s.average !== "-").length
                      ).toFixed(2)
                    : "-"}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          table,
          table * {
            visibility: visible;
          }
          table {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default AcademicGradesView;

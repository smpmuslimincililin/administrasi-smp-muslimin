import React, { useState, useEffect } from "react";
import { Users, XCircle, AlertTriangle, Calendar } from "lucide-react";

const KonselingModal = ({
  show,
  mode,
  formData,
  students,
  classes,
  onClose,
  onSubmit,
  onFormChange,
}) => {
  const [studentFilters, setStudentFilters] = useState({
    jenjang: "",
    kelas: "",
  });
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [availableKelas, setAvailableKelas] = useState([]);

  useEffect(() => {
    if (show) {
      setStudentFilters({ jenjang: "", kelas: "" });
      setFilteredStudents([]);
      setAvailableKelas([]);
    }
  }, [show]);

  const updateAvailableKelas = (jenjang) => {
    if (jenjang) {
      const jenjangAngka = jenjang.replace("Kelas ", "");
      const kelasList = classes
        .filter((c) => c.grade.toString() === jenjangAngka)
        .map((c) => c.id)
        .sort();
      setAvailableKelas(kelasList);
    } else {
      setAvailableKelas([]);
    }
  };

  const updateFilteredStudents = (kelas) => {
    if (kelas) {
      const filtered = students.filter((s) => s.class_id === kelas);
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  };

  const handleStudentSelect = (studentId) => {
    const selectedStudent = students.find((s) => s.id === studentId);
    if (selectedStudent) {
      onFormChange({
        student_id: studentId,
        nis: selectedStudent.nis,
        full_name: selectedStudent.full_name,
        gender: selectedStudent.gender,
        class_id: selectedStudent.class_id,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const handleInputChange = (field, value) => {
    onFormChange({ [field]: value });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <Users size={24} />
            <div>
              <h2 className="text-xl font-bold">
                {mode === "add"
                  ? "Tambah Data Konseling"
                  : mode === "edit"
                  ? "Edit Data Konseling"
                  : "Detail Konseling"}
              </h2>
              <p className="text-blue-100 text-sm">SMP Muslimin Cililin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-600 rounded-lg transition">
            <XCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ✅ STUDENT SELECTION - 1 BARIS COMPACT! */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              👤 Pilih Siswa *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Jenjang */}
              <select
                value={studentFilters.jenjang}
                onChange={(e) => {
                  const jenjang = e.target.value;
                  setStudentFilters({ jenjang: jenjang, kelas: "" });
                  updateAvailableKelas(jenjang);
                  onFormChange({
                    student_id: "",
                    nis: "",
                    full_name: "",
                    gender: "",
                    class_id: "",
                  });
                }}
                disabled={mode === "view"}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                required>
                <option value="">-- Pilih Jenjang --</option>
                <option value="Kelas 7">Kelas 7</option>
                <option value="Kelas 8">Kelas 8</option>
                <option value="Kelas 9">Kelas 9</option>
              </select>

              {/* Kelas */}
              <select
                value={studentFilters.kelas}
                onChange={(e) => {
                  const kelas = e.target.value;
                  setStudentFilters((prev) => ({ ...prev, kelas }));
                  updateFilteredStudents(kelas);
                  onFormChange({
                    student_id: "",
                    nis: "",
                    full_name: "",
                    gender: "",
                    class_id: "",
                  });
                }}
                disabled={!studentFilters.jenjang || mode === "view"}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                required>
                <option value="">-- Pilih Kelas --</option>
                {availableKelas.map((kelas) => (
                  <option key={kelas} value={kelas}>
                    {kelas}
                  </option>
                ))}
              </select>

              {/* ✅ NAMA SISWA - TANPA NIS! */}
              <select
                value={formData.student_id}
                onChange={(e) => handleStudentSelect(e.target.value)}
                disabled={!studentFilters.kelas || mode === "view"}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                required>
                <option value="">-- Pilih Nama Siswa --</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                  </option>
                ))}
              </select>
            </div>
            {filteredStudents.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                ✅ {filteredStudents.length} siswa tersedia
              </p>
            )}
          </div>

          {/* Student Info (auto-filled) - COMPACT */}
          {formData.student_id && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg text-sm">
              <div>
                <span className="text-gray-500 text-xs">NIS:</span>
                <p className="font-semibold text-gray-800">{formData.nis}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Nama:</span>
                <p className="font-semibold text-gray-800">
                  {formData.full_name}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Kelas:</span>
                <p className="font-semibold text-gray-800">
                  {formData.class_id}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Kelamin:</span>
                <p className="font-semibold text-gray-800">
                  {formData.gender === "L"
                    ? "Laki-laki"
                    : formData.gender === "P"
                    ? "Perempuan"
                    : formData.gender}
                </p>
              </div>
            </div>
          )}

          {/* Date & Layanan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Konseling *
              </label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => handleInputChange("tanggal", e.target.value)}
                disabled={mode === "view"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Layanan *
              </label>
              <select
                value={formData.jenis_layanan}
                onChange={(e) =>
                  handleInputChange("jenis_layanan", e.target.value)
                }
                disabled={mode === "view"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required>
                <option value="">Pilih Jenis Layanan</option>
                <option value="Pribadi">Pribadi</option>
                <option value="Sosial">Sosial</option>
                <option value="Belajar">Belajar</option>
                <option value="Karier">Karier</option>
                <option value="Keluarga">Keluarga</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bidang Bimbingan *
              </label>
              <select
                value={formData.bidang_bimbingan}
                onChange={(e) =>
                  handleInputChange("bidang_bimbingan", e.target.value)
                }
                disabled={mode === "view"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required>
                <option value="">Pilih Bidang Bimbingan</option>
                <option value="Pribadi dan Sosial">Pribadi dan Sosial</option>
                <option value="Akademik">Akademik</option>
                <option value="Karier dan Pekerjaan">
                  Karier dan Pekerjaan
                </option>
                <option value="Keluarga">Keluarga</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Tingkat Urgensi & Kategori Masalah */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-orange-600" size={20} />
              <h3 className="font-semibold text-gray-800">
                Klasifikasi Masalah
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat Urgensi *
                </label>
                <select
                  value={formData.tingkat_urgensi}
                  onChange={(e) =>
                    handleInputChange("tingkat_urgensi", e.target.value)
                  }
                  disabled={mode === "view"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                  required>
                  <option value="">Pilih Tingkat Urgensi</option>
                  <option value="Rendah">🟢 Rendah - Konsultasi ringan</option>
                  <option value="Sedang">🟡 Sedang - Perlu perhatian</option>
                  <option value="Tinggi">🟠 Tinggi - Segera ditangani</option>
                  <option value="Darurat">🔴 Darurat - Prioritas utama</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori Masalah *
                </label>
                <select
                  value={formData.kategori_masalah}
                  onChange={(e) =>
                    handleInputChange("kategori_masalah", e.target.value)
                  }
                  disabled={mode === "view"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                  required>
                  <option value="">Pilih Kategori Masalah</option>
                  <option value="Akademik">📚 Akademik</option>
                  <option value="Perilaku">⚠️ Perilaku</option>
                  <option value="Sosial-Emosional">😔 Sosial-Emosional</option>
                  <option value="Pertemanan">👥 Pertemanan</option>
                  <option value="Keluarga">🏠 Keluarga</option>
                  <option value="Percintaan">💔 Percintaan</option>
                  <option value="Teknologi/Gadget">📱 Teknologi/Gadget</option>
                  <option value="Kenakalan">🚬 Kenakalan</option>
                  <option value="Kesehatan Mental">🧠 Kesehatan Mental</option>
                  <option value="Lainnya">📋 Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Text Areas */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permasalahan *
              </label>
              <textarea
                value={formData.permasalahan}
                onChange={(e) =>
                  handleInputChange("permasalahan", e.target.value)
                }
                disabled={mode === "view"}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Jelaskan permasalahan yang dihadapi siswa secara detail..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kronologi *
              </label>
              <textarea
                value={formData.kronologi}
                onChange={(e) => handleInputChange("kronologi", e.target.value)}
                disabled={mode === "view"}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Jelaskan kronologi kejadian secara runtut..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tindakan Layanan
                </label>
                <textarea
                  value={formData.tindakan_layanan}
                  onChange={(e) =>
                    handleInputChange("tindakan_layanan", e.target.value)
                  }
                  disabled={mode === "view"}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Jelaskan tindakan yang dilakukan..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasil Layanan
                </label>
                <textarea
                  value={formData.hasil_layanan}
                  onChange={(e) =>
                    handleInputChange("hasil_layanan", e.target.value)
                  }
                  disabled={mode === "view"}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Jelaskan hasil dari layanan yang diberikan..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rencana Tindak Lanjut
              </label>
              <textarea
                value={formData.rencana_tindak_lanjut}
                onChange={(e) =>
                  handleInputChange("rencana_tindak_lanjut", e.target.value)
                }
                disabled={mode === "view"}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Jelaskan rencana tindak lanjut..."
              />
            </div>
          </div>

          {/* Follow-up */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="text-purple-600" size={20} />
              <h3 className="font-semibold text-gray-800">Follow-up</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="perlu_followup"
                  checked={formData.perlu_followup}
                  onChange={(e) => {
                    handleInputChange("perlu_followup", e.target.checked);
                    if (!e.target.checked) {
                      handleInputChange("tanggal_followup", "");
                    }
                  }}
                  disabled={mode === "view"}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <label
                  htmlFor="perlu_followup"
                  className="text-sm font-medium text-gray-700 cursor-pointer">
                  Perlu Follow-up / Konseling Lanjutan
                </label>
              </div>

              {formData.perlu_followup && (
                <div className="ml-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Follow-up *
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_followup}
                    onChange={(e) =>
                      handleInputChange("tanggal_followup", e.target.value)
                    }
                    disabled={mode === "view"}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full md:w-64 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                    required={formData.perlu_followup}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Layanan
              </label>
              <select
                value={formData.status_layanan}
                onChange={(e) =>
                  handleInputChange("status_layanan", e.target.value)
                }
                disabled={mode === "view"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                <option value="Dalam Proses">⏳ Dalam Proses</option>
                <option value="Selesai">✅ Selesai</option>
                <option value="Dibatalkan">❌ Dibatalkan</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          {mode !== "view" && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg transition shadow-lg hover:shadow-xl">
                {mode === "add"
                  ? "✅ Tambah Data Konseling"
                  : "💾 Update Data Konseling"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition">
                Batal
              </button>
            </div>
          )}

          {mode === "view" && (
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition">
                Tutup
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default KonselingModal;

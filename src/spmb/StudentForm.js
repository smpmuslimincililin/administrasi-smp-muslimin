import React, { useState, useRef, useEffect, useCallback } from "react";

const StudentForm = ({
  editingStudent,
  setEditingStudent,
  students,
  onSaveStudent,
  isLoading,
}) => {
  const [formSuccess, setFormSuccess] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [pendingDuplicateCallback, setPendingDuplicateCallback] =
    useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPekerjaanAyahLainnya, setShowPekerjaanAyahLainnya] =
    useState(false);
  const [showPekerjaanIbuLainnya, setShowPekerjaanIbuLainnya] = useState(false);

  const [formData, setFormData] = useState({
    nama_lengkap: "",
    jenis_kelamin: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    asal_sekolah: "",
    nisn: "",
    nama_ayah: "",
    pekerjaan_ayah: "",
    pekerjaan_ayah_lainnya: "",
    pendidikan_ayah: "",
    nama_ibu: "",
    pekerjaan_ibu: "",
    pekerjaan_ibu_lainnya: "",
    pendidikan_ibu: "",
    no_hp: "",
    alamat: "",
  });

  const refs = {
    nama_lengkap: useRef(),
    jenis_kelamin: useRef(),
    tempat_lahir: useRef(),
    tanggal_lahir: useRef(),
    nama_ayah: useRef(),
    nama_ibu: useRef(),
    no_hp: useRef(),
    alamat: useRef(),
    asal_sekolah: useRef(),
    nisn: useRef(),
  };

  const convertDateToISO = useCallback((dateString) => {
    if (!dateString) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const parts = dateString.split("-");
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return null;
  }, []);

  const convertDateToDisplay = useCallback((isoDateString) => {
    if (!isoDateString) return "";
    if (/^\d{2}-\d{2}-\d{4}$/.test(isoDateString)) return isoDateString;
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDateString)) {
      const parts = isoDateString.split("-");
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoDateString;
  }, []);

  // Daftar pekerjaan standar
  const pekerjaanListAyah = [
    "PNS/TNI/Polri",
    "Karyawan Swasta",
    "Wiraswasta/Pedagang",
    "Petani",
    "Buruh",
    "Guru/Dosen",
    "Dokter/Tenaga Kesehatan",
    "Sopir/Driver",
    "Pensiunan",
    "Tidak Bekerja",
    "Lainnya",
  ];

  const pekerjaanListIbu = [
    "Ibu Rumah Tangga",
    "PNS/TNI/Polri",
    "Karyawan Swasta",
    "Wiraswasta/Pedagang",
    "Petani",
    "Buruh",
    "Guru/Dosen",
    "Dokter/Tenaga Kesehatan",
    "Pensiunan",
    "Tidak Bekerja",
    "Lainnya",
  ];

  useEffect(() => {
    if (editingStudent) {
      const pekerjaanAyah = editingStudent.pekerjaan_ayah || "";
      const pekerjaanIbu = editingStudent.pekerjaan_ibu || "";

      // Cek apakah pekerjaan ada di list standar
      const isAyahStandard = pekerjaanListAyah.includes(pekerjaanAyah);
      const isIbuStandard = pekerjaanListIbu.includes(pekerjaanIbu);

      setFormData({
        nama_lengkap: editingStudent.nama_lengkap || "",
        jenis_kelamin: editingStudent.jenis_kelamin || "",
        tempat_lahir: editingStudent.tempat_lahir || "",
        tanggal_lahir: convertDateToDisplay(editingStudent.tanggal_lahir) || "",
        asal_sekolah: editingStudent.asal_sekolah || "",
        nisn: editingStudent.nisn === "-" ? "" : editingStudent.nisn || "",
        nama_ayah: editingStudent.nama_ayah || "",
        pekerjaan_ayah: isAyahStandard ? pekerjaanAyah : "Lainnya",
        pekerjaan_ayah_lainnya: isAyahStandard ? "" : pekerjaanAyah,
        pendidikan_ayah: editingStudent.pendidikan_ayah || "",
        nama_ibu: editingStudent.nama_ibu || "",
        pekerjaan_ibu: isIbuStandard ? pekerjaanIbu : "Lainnya",
        pekerjaan_ibu_lainnya: isIbuStandard ? "" : pekerjaanIbu,
        pendidikan_ibu: editingStudent.pendidikan_ibu || "",
        no_hp: editingStudent.no_hp || "",
        alamat: editingStudent.alamat || "",
      });

      setShowPekerjaanAyahLainnya(!isAyahStandard && pekerjaanAyah !== "");
      setShowPekerjaanIbuLainnya(!isIbuStandard && pekerjaanIbu !== "");
      setCurrentStep(1);
    } else {
      setFormData({
        nama_lengkap: "",
        jenis_kelamin: "",
        tempat_lahir: "",
        tanggal_lahir: "",
        asal_sekolah: "",
        nisn: "",
        nama_ayah: "",
        pekerjaan_ayah: "",
        pekerjaan_ayah_lainnya: "",
        pendidikan_ayah: "",
        nama_ibu: "",
        pekerjaan_ibu: "",
        pekerjaan_ibu_lainnya: "",
        pendidikan_ibu: "",
        no_hp: "",
        alamat: "",
      });
      setShowPekerjaanAyahLainnya(false);
      setShowPekerjaanIbuLainnya(false);
      setCurrentStep(1);
    }
  }, [editingStudent, convertDateToDisplay]);

  const validateDateFormat = useCallback(
    (dateString) => /^\d{2}-\d{2}-\d{4}$/.test(dateString),
    []
  );

  const validateStudentInput = useCallback((student) => {
    const errors = [];
    const nameWords = student.nama_lengkap
      .trim()
      .split(" ")
      .filter((word) => word.length > 0);
    if (nameWords.length < 2)
      errors.push("Nama harus terdiri dari minimal 2 kata");
    if (!/^[a-zA-Z\s]+$/.test(student.nama_lengkap))
      errors.push("Nama hanya boleh mengandung huruf dan spasi");
    if (!/^(\+62|62|0)[0-9]{9,13}$/.test(student.no_hp.replace(/\s+/g, ""))) {
      errors.push("Format nomor HP tidak valid");
    }
    if (
      student.nisn &&
      student.nisn !== "-" &&
      !/^\d{10}$/.test(student.nisn)
    ) {
      errors.push("NISN harus berisi tepat 10 digit angka");
    }
    return errors;
  }, []);

  const formatDateInput = useCallback((input) => {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 2 && value.length <= 4) {
      value = value.substring(0, 2) + "-" + value.substring(2);
    } else if (value.length > 4) {
      value =
        value.substring(0, 2) +
        "-" +
        value.substring(2, 4) +
        "-" +
        value.substring(4, 8);
    }
    input.value = value;
    setFormData((prev) => ({ ...prev, tanggal_lahir: value }));
  }, []);

  const checkForDuplicates = useCallback(
    (newName, existingStudents, excludeId = null) => {
      const calculateSimilarity = (str1, str2) => {
        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();
        if (s1 === s2) return 1.0;
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        if (longer.length === 0) return 1.0;
        let matches = 0;
        for (let i = 0; i < Math.min(longer.length, shorter.length); i++) {
          if (longer[i] === shorter[i]) matches++;
        }
        return matches / longer.length;
      };
      return existingStudents
        .filter((student) => student.id !== excludeId)
        .map((student) => ({
          student,
          similarity: calculateSimilarity(newName, student.nama_lengkap || ""),
        }))
        .filter((item) => item.similarity >= 0.8)
        .sort((a, b) => b.similarity - a.similarity);
    },
    []
  );

  const downloadWordTemplate = useCallback(() => {
    const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Formulir Pendaftaran SMP Muslimin Cililin</title>
<style>
  @page {
    size: A4;
    margin: 1.5cm;
  }
  body {
    font-family: 'Arial', sans-serif;
    font-size: 11pt;
  }
  .header {
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 3px double #000;
    padding-bottom: 10px;
  }
  .header h1 {
    font-size: 16pt;
    font-weight: bold;
    margin: 3px 0;
  }
  .header h2 {
    font-size: 13pt;
    font-weight: bold;
    margin: 3px 0;
  }
  .header h3 {
    font-size: 11pt;
    margin: 3px 0;
  }
  .section-title {
    background-color: #e8f4f8;
    padding: 5px 8px;
    font-weight: bold;
    border: 1px solid #000;
    margin: 15px 0 10px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 5px 0;
  }
  td {
    padding: 5px 2px;
    vertical-align: top;
  }
  .label-col {
    width: 280px;
  }
  .colon-col {
    width: 15px;
    text-align: center;
  }
  .value-col {
    border-bottom: 1px dotted #000;
  }
  .checkbox {
    display: inline-block;
    border: 1px solid #000;
    width: 15px;
    height: 15px;
    margin: 0 3px 0 0;
    vertical-align: middle;
  }
  .alamat-box {
    border: 1px solid #000;
    min-height: 60px;
    padding: 5px;
  }
  .signature-table {
    margin-top: 30px;
  }
  .signature-table td {
    text-align: center;
    padding: 10px;
  }
  .ttd-line {
    border-bottom: 1px solid #000;
    width: 200px;
    margin: 60px auto 5px auto;
  }
</style>
</head>
<body>

<div class="header">
  <h1>SMP MUSLIMIN CILILIN</h1>
  <h2>FORMULIR PENDAFTARAN CALON SISWA BARU</h2>
  <h3>TAHUN AJARAN 2026/2027</h3>
</div>

<div class="section-title">BAGIAN A: DATA CALON SISWA</div>

<table>
  <tr>
    <td class="label-col">1. Nama Lengkap <strong>(*)</strong></td>
    <td class="colon-col">:</td>
    <td class="value-col">&nbsp;</td>
  </tr>
  <tr>
    <td class="label-col">2. Jenis Kelamin <strong>(*)</strong></td>
    <td class="colon-col">:</td>
    <td>
      <span class="checkbox"></span> Laki-laki &nbsp;&nbsp;&nbsp;&nbsp;
      <span class="checkbox"></span> Perempuan
    </td>
  </tr>
  <tr>
    <td class="label-col">3. Tempat Lahir <strong>(*)</strong></td>
    <td class="colon-col">:</td>
    <td class="value-col">&nbsp;</td>
  </tr>
  <tr>
    <td class="label-col">4. Tanggal Lahir <strong>(*)</strong></td>
    <td class="colon-col">:</td>
    <td class="value-col">&nbsp;</td>
  </tr>
  <tr>
    <td class="label-col">5. Asal Sekolah Dasar</td>
    <td class="colon-col">:</td>
    <td class="value-col">&nbsp;</td>
  </tr>
  <tr>
    <td class="label-col">6. NISN</td>
    <td class="colon-col">:</td>
    <td class="value-col">&nbsp;</td>
  </tr>
</table>

<div class="section-title">BAGIAN B: DATA ORANG TUA / WALI</div>

<p style="margin: 10px 0 5px 0;"><strong>DATA AYAH</strong></p>

<table>
  <tr>
    <td class="label-col">7. Nama Lengkap Ayah</td>
    <td class="colon-col">:</td>
    <td class="value-col">&nbsp;</td>
  </tr>
  <tr>
    <td class="label-col">8. Pekerjaan Ayah</td>
    <td class="colon-col">:</td>
    <td class="value-col">&nbsp;</td>
  </tr>
  <tr>
    <td class="label-col">9. Pendidikan Terakhir Ayah</td>
    <td class="colon-col">:</td>
    <td>
      <span class="checkbox"></span> SD &nbsp;
      <span class="checkbox"></span> SMP &nbsp;
      <span class="checkbox"></span> SMA &nbsp;
      <span class="checkbox"></span> D3 &nbsp;
      <span class="checkbox"></span> S1 &nbsp;
      <span class="checkbox"></span> S2
    </td>
  </tr>
</table>

<p style="margin: 10px 0 5px 0;"><strong>DATA IBU</strong></p>

<table>
  <tr>
    <td class="label-col">10. Nama Lengkap Ibu</td>
    <td class="colon-col">:</td>
    <td class="value-col">&nbsp;</td>
  </tr>
  <tr>
    <td class="label-col">11. Pekerjaan Ibu</td>
    <td class="colon-col">:</td>
    <td class="value-col">&nbsp;</td>
  </tr>
  <tr>
    <td class="label-col">12. Pendidikan Terakhir Ibu</td>
    <td class="colon-col">:</td>
    <td>
      <span class="checkbox"></span> SD &nbsp;
      <span class="checkbox"></span> SMP &nbsp;
      <span class="checkbox"></span> SMA &nbsp;
      <span class="checkbox"></span> D3 &nbsp;
      <span class="checkbox"></span> S1 &nbsp;
      <span class="checkbox"></span> S2
    </td>
  </tr>
</table>

<p style="margin: 10px 0 5px 0;"><strong>DATA KONTAK</strong></p>

<table>
  <tr>
    <td class="label-col">13. No. HP Orang Tua <strong>(*)</strong></td>
    <td class="colon-col">:</td>
    <td class="value-col">&nbsp;</td>
  </tr>
  <tr>
    <td class="label-col" style="vertical-align: top;">14. Alamat Lengkap <strong>(*)</strong></td>
    <td class="colon-col" style="vertical-align: top;">:</td>
    <td>
      <div class="alamat-box"></div>
    </td>
  </tr>
</table>

<table class="signature-table">
  <tr>
    <td style="width: 40%;"></td>
    <td style="text-align: left;">
      Cililin, .................................
    </td>
  </tr>
  <tr>
    <td>
      <strong>Orang Tua/Wali</strong>
      <div class="ttd-line"></div>
      ( ................................. )
    </td>
    <td>
      <strong>Calon Siswa</strong>
      <div class="ttd-line"></div>
      ( ................................. )
    </td>
  </tr>
</table>

</body>
</html>`;

    const blob = new Blob(["\ufeff", htmlContent], {
      type: "application/msword;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Formulir_Pendaftaran_SMP_Muslimin_Cililin.doc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Tentukan pekerjaan final
    const finalPekerjaanAyah =
      formData.pekerjaan_ayah === "Lainnya"
        ? formData.pekerjaan_ayah_lainnya
        : formData.pekerjaan_ayah;

    const finalPekerjaanIbu =
      formData.pekerjaan_ibu === "Lainnya"
        ? formData.pekerjaan_ibu_lainnya
        : formData.pekerjaan_ibu;

    const studentData = {
      nama_lengkap: formData.nama_lengkap,
      jenis_kelamin: formData.jenis_kelamin,
      tempat_lahir: formData.tempat_lahir,
      tanggal_lahir: convertDateToISO(formData.tanggal_lahir),
      asal_sekolah: formData.asal_sekolah,
      nisn: formData.nisn || "-",
      tanggal_daftar: editingStudent
        ? convertDateToISO(editingStudent.tanggal_daftar)
        : new Date().toISOString().split("T")[0],
    };

    const parentData = {
      nama_ayah: formData.nama_ayah,
      pekerjaan_ayah: finalPekerjaanAyah,
      pendidikan_ayah: formData.pendidikan_ayah,
      nama_ibu: formData.nama_ibu,
      pekerjaan_ibu: finalPekerjaanIbu,
      pendidikan_ibu: formData.pendidikan_ibu,
      no_hp: formData.no_hp,
      alamat: formData.alamat,
    };

    const studentForValidation = {
      ...studentData,
      no_hp: parentData.no_hp,
      tanggal_lahir: formData.tanggal_lahir,
    };

    const errors = validateStudentInput(studentForValidation);
    if (errors.length > 0) {
      alert("Error: " + errors[0]);
      return;
    }

    if (!validateDateFormat(formData.tanggal_lahir)) {
      alert("Format tanggal lahir harus DD-MM-YYYY!");
      return;
    }

    const duplicates = checkForDuplicates(
      studentData.nama_lengkap,
      students,
      editingStudent?.id || null
    );
    if (duplicates.length > 0 && !pendingDuplicateCallback) {
      setDuplicateInfo(duplicates[0]);
      setShowDuplicateWarning(true);
      setPendingDuplicateCallback(
        () => () => proceedWithSave({ studentData, parentData })
      );
      return;
    }

    proceedWithSave({ studentData, parentData });
  };

  const proceedWithSave = async ({ studentData, parentData }) => {
    const success = await onSaveStudent({
      studentData,
      parentData,
      isEdit: !!editingStudent,
    });

    if (success) {
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);

      if (editingStudent) {
        setEditingStudent(null);
      }
      resetForm();
    }

    setShowDuplicateWarning(false);
    setPendingDuplicateCallback(null);
  };

  const resetForm = useCallback(() => {
    setFormData({
      nama_lengkap: "",
      jenis_kelamin: "",
      tempat_lahir: "",
      tanggal_lahir: "",
      asal_sekolah: "",
      nisn: "",
      nama_ayah: "",
      pekerjaan_ayah: "",
      pekerjaan_ayah_lainnya: "",
      pendidikan_ayah: "",
      nama_ibu: "",
      pekerjaan_ibu: "",
      pekerjaan_ibu_lainnya: "",
      pendidikan_ibu: "",
      no_hp: "",
      alamat: "",
    });
    setEditingStudent(null);
    setShowDuplicateWarning(false);
    setPendingDuplicateCallback(null);
    setShowPekerjaanAyahLainnya(false);
    setShowPekerjaanIbuLainnya(false);
    setCurrentStep(1);
  }, [setEditingStudent]);

  const updateFormData = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Handle show/hide input lainnya
    if (field === "pekerjaan_ayah") {
      setShowPekerjaanAyahLainnya(value === "Lainnya");
      if (value !== "Lainnya") {
        setFormData((prev) => ({ ...prev, pekerjaan_ayah_lainnya: "" }));
      }
    }

    if (field === "pekerjaan_ibu") {
      setShowPekerjaanIbuLainnya(value === "Lainnya");
      if (value !== "Lainnya") {
        setFormData((prev) => ({ ...prev, pekerjaan_ibu_lainnya: "" }));
      }
    }
  }, []);

  const viewDuplicate = useCallback(() => {
    if (duplicateInfo) {
      const studentName =
        duplicateInfo.student.nama_lengkap || "Tidak diketahui";
      const studentSchool =
        duplicateInfo.student.asal_sekolah || "Tidak diketahui";
      alert(`Data ditemukan: ${studentName} dari ${studentSchool}`);
      setShowDuplicateWarning(false);
    }
  }, [duplicateInfo]);

  const continueAnyway = useCallback(() => {
    if (pendingDuplicateCallback) pendingDuplicateCallback();
  }, [pendingDuplicateCallback]);

  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      if (!formData.nama_lengkap.trim()) {
        alert("Nama lengkap harus diisi!");
        return;
      }
      if (!formData.jenis_kelamin) {
        alert("Jenis kelamin harus dipilih!");
        return;
      }
      if (!formData.tempat_lahir.trim()) {
        alert("Tempat lahir harus diisi!");
        return;
      }
      if (!validateDateFormat(formData.tanggal_lahir)) {
        alert("Format tanggal lahir harus DD-MM-YYYY!");
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  }, [currentStep, formData, validateDateFormat]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  const steps = [
    { number: 1, title: "Data Siswa", icon: "fa-user" },
    { number: 2, title: "Data Orang Tua", icon: "fa-users" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
        <i className="fas fa-file-alt text-blue-600"></i>
        Form Pendaftaran SMP Muslimin Cililin
      </h2>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-blue-800">
          <i className="fas fa-shield-alt"></i> Sistem Terhubung Ke Database -
          Data Aman
        </span>
      </div>

      {formSuccess && (
        <div className="bg-gradient-to-r from-green-100 to-green-50 text-green-800 p-4 rounded-xl border-l-4 border-green-500 mb-6 animate-slide-down">
          <i className="fas fa-check-circle"></i> Data berhasil disimpan dan
          siswa diterima!
        </div>
      )}

      {showDuplicateWarning && duplicateInfo && (
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-xl p-4 mb-6 flex items-center gap-3 animate-slide-down">
          <i className="fas fa-exclamation-triangle text-yellow-600"></i>
          <span className="text-yellow-800 flex-1">
            Nama serupa "{duplicateInfo.student.nama_lengkap}" sudah terdaftar!
            ({Math.round(duplicateInfo.similarity * 100)}% kemiripan)
          </span>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            onClick={viewDuplicate}>
            Lihat Data
          </button>
          <button
            className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors ml-2"
            onClick={continueAnyway}>
            Tetap Simpan
          </button>
        </div>
      )}

      <div
        className={`text-center font-bold mb-4 p-2 rounded-lg ${
          editingStudent
            ? "bg-orange-100 text-orange-800"
            : "bg-blue-100 text-blue-800"
        }`}>
        <i className={`fas ${editingStudent ? "fa-edit" : "fa-plus"}`}></i>
        Mode:{" "}
        {editingStudent
          ? `Edit Data - ${editingStudent.nama_lengkap}`
          : "Tambah Data Baru"}
      </div>

      <div className="sm:hidden bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= step.number
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}>
                {currentStep > step.number ? (
                  <i className="fas fa-check text-xs"></i>
                ) : (
                  step.number
                )}
              </div>
              <span className="text-xs mt-1 text-gray-600">{step.title}</span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {(currentStep === 1 || window.innerWidth >= 640) && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <i className="fas fa-user"></i>
              Data Calon Siswa SMP
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama_lengkap}
                  onChange={(e) =>
                    updateFormData("nama_lengkap", e.target.value)
                  }
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1"
                  placeholder="Masukkan nama lengkap sesuai akta kelahiran"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Jenis Kelamin <span className="text-red-500">*</span>
                    <small className="block text-gray-500 font-normal">
                      Pilih jenis kelamin siswa
                    </small>
                  </label>
                  <select
                    value={formData.jenis_kelamin}
                    onChange={(e) =>
                      updateFormData("jenis_kelamin", e.target.value)
                    }
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1"
                    required>
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    NISN (Opsional)
                    <small className="block text-gray-500 font-normal">
                      Kosongkan jika belum memiliki NISN
                    </small>
                  </label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => updateFormData("nisn", e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1"
                    placeholder="10 digit NISN"
                    maxLength="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Tempat Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tempat_lahir}
                    onChange={(e) =>
                      updateFormData("tempat_lahir", e.target.value)
                    }
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1"
                    placeholder="Kota kelahiran"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tanggal_lahir}
                    onChange={(e) =>
                      updateFormData("tanggal_lahir", e.target.value)
                    }
                    onInput={(e) => formatDateInput(e.target)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1"
                    placeholder="DD-MM-YYYY"
                    maxLength="10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Asal Sekolah Dasar (SD)
                  <small className="block text-gray-500 font-normal">
                    Nama SD asal calon siswa
                  </small>
                </label>
                <input
                  type="text"
                  value={formData.asal_sekolah}
                  onChange={(e) =>
                    updateFormData("asal_sekolah", e.target.value)
                  }
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1"
                  placeholder="Nama SD asal"
                />
              </div>
            </div>
          </div>
        )}

        {(currentStep === 2 || window.innerWidth >= 640) && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <i className="fas fa-users"></i>
              Data Orang Tua/Wali
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Nama Ayah
                  </label>
                  <input
                    type="text"
                    value={formData.nama_ayah}
                    onChange={(e) =>
                      updateFormData("nama_ayah", e.target.value)
                    }
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1"
                    placeholder="Nama lengkap ayah"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Nama Ibu
                  </label>
                  <input
                    type="text"
                    value={formData.nama_ibu}
                    onChange={(e) => updateFormData("nama_ibu", e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1"
                    placeholder="Nama lengkap ibu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Pekerjaan Ayah
                  </label>
                  <select
                    value={formData.pekerjaan_ayah}
                    onChange={(e) =>
                      updateFormData("pekerjaan_ayah", e.target.value)
                    }
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1">
                    <option value="">Pilih Pekerjaan</option>
                    {pekerjaanListAyah.map((pekerjaan) => (
                      <option key={pekerjaan} value={pekerjaan}>
                        {pekerjaan}
                      </option>
                    ))}
                  </select>

                  {showPekerjaanAyahLainnya && (
                    <input
                      type="text"
                      value={formData.pekerjaan_ayah_lainnya}
                      onChange={(e) =>
                        updateFormData("pekerjaan_ayah_lainnya", e.target.value)
                      }
                      className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1 mt-2"
                      placeholder="Sebutkan pekerjaan lainnya"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Pekerjaan Ibu
                  </label>
                  <select
                    value={formData.pekerjaan_ibu}
                    onChange={(e) =>
                      updateFormData("pekerjaan_ibu", e.target.value)
                    }
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1">
                    <option value="">Pilih Pekerjaan</option>
                    {pekerjaanListIbu.map((pekerjaan) => (
                      <option key={pekerjaan} value={pekerjaan}>
                        {pekerjaan}
                      </option>
                    ))}
                  </select>

                  {showPekerjaanIbuLainnya && (
                    <input
                      type="text"
                      value={formData.pekerjaan_ibu_lainnya}
                      onChange={(e) =>
                        updateFormData("pekerjaan_ibu_lainnya", e.target.value)
                      }
                      className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1 mt-2"
                      placeholder="Sebutkan pekerjaan lainnya"
                      required
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Pendidikan Ayah
                  </label>
                  <select
                    value={formData.pendidikan_ayah}
                    onChange={(e) =>
                      updateFormData("pendidikan_ayah", e.target.value)
                    }
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1">
                    <option value="">Pilih Pendidikan</option>
                    <option value="SD/Sederajat">SD/Sederajat</option>
                    <option value="SMP/Sederajat">SMP/Sederajat</option>
                    <option value="SMA/Sederajat">SMA/Sederajat</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Pendidikan Ibu
                  </label>
                  <select
                    value={formData.pendidikan_ibu}
                    onChange={(e) =>
                      updateFormData("pendidikan_ibu", e.target.value)
                    }
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1">
                    <option value="">Pilih Pendidikan</option>
                    <option value="SD/Sederajat">SD/Sederajat</option>
                    <option value="SMP/Sederajat">SMP/Sederajat</option>
                    <option value="SMA/Sederajat">SMA/Sederajat</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  No. HP Orang Tua <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.no_hp}
                  onChange={(e) => updateFormData("no_hp", e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1"
                  placeholder="Contoh: 081234567890"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => updateFormData("alamat", e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-base transition-all duration-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none focus:-translate-y-1"
                  rows="3"
                  placeholder="Alamat lengkap tempat tinggal"
                  required
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          {window.innerWidth < 640 && currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-400 text-white p-4 rounded-xl font-semibold text-base transition-all duration-400 hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-3">
              <i className="fas fa-arrow-left"></i>
              Kembali
            </button>
          )}

          {window.innerWidth < 640 && currentStep < 2 && (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-400 text-white p-4 rounded-xl font-semibold text-base transition-all duration-400 hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-3">
              Lanjut
              <i className="fas fa-arrow-right"></i>
            </button>
          )}

          {(window.innerWidth >= 640 || currentStep === 2) && (
            <>
              <button
                type="button"
                onClick={downloadWordTemplate}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-400 text-white p-4 rounded-xl font-semibold text-base transition-all duration-400 hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-3">
                <i className="fas fa-file-download"></i>
                Download Form
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-400 text-white p-4 rounded-xl font-semibold text-base transition-all duration-400 hover:-translate-y-1 hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    {editingStudent ? "Update Data" : "Simpan Data"}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-300 text-white p-4 rounded-xl font-semibold text-base transition-all duration-400 hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-3">
                <i className="fas fa-undo"></i>
                Reset Form
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default StudentForm;

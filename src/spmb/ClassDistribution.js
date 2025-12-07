// ClassDistribution.js - OPTIMIZED VERSION untuk distribusi asal SD lebih proporsional

// Fungsi untuk format tampilan tahun ajaran (26.27 -> 2026/2027)
export const formatTahunAjaran = (tahunAjaran) => {
  const [tahun1, tahun2] = tahunAjaran.split(".");
  return `20${tahun1}/20${tahun2}`;
};

export const getTahunAjaran = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let baseYear;
  if (month >= 1 && month <= 7) {
    baseYear = year;
  } else {
    baseYear = year + 1;
  }
  const tahun1 = baseYear.toString().slice(-2);
  const tahun1Int = parseInt(tahun1);
  const tahun2 = (tahun1Int + 1).toString().padStart(2, "0");
  const result = `${tahun1}.${tahun2}`;

  console.log("🔥 getTahunAjaran() HASIL:", result); // ← TAMBAH INI

  return result;
};

// Fungsi untuk generate NIS dengan format: 26.27.07.001
export const generateNIS = (tahunAjaran, grade, nomorUrut) => {
  console.log("🔥 generateNIS INPUT:", { tahunAjaran, grade, nomorUrut }); // ← TAMBAH INI

  const gradeStr = grade.toString().padStart(2, "0");
  const nomorStr = nomorUrut.toString().padStart(3, "0");
  const result = `${tahunAjaran}.${gradeStr}.${nomorStr}`;

  console.log("🔥 generateNIS HASIL:", result); // ← TAMBAH INI

  return result;
};

// Helper function to sanitize school name
const sanitizeSchoolName = (schoolName) => {
  if (!schoolName || schoolName === "Unknown") return "Unknown";
  return schoolName.trim().replace(/\s+/g, " ");
};

// Algoritma Pembagian Kelas OPTIMAL - Maximum Balance & School Distribution
export const generateClassDistribution = (
  unassignedStudents,
  numClasses,
  setIsLoading,
  setClassDistribution,
  setShowPreview,
  setShowSavedClasses,
  setEditMode,
  setHistory,
  setHistoryIndex,
  showToast
) => {
  if (unassignedStudents.length === 0) {
    showToast("Tidak ada siswa yang perlu dibagi kelas", "error");
    return;
  }

  setIsLoading(true);

  try {
    const tahunAjaran = getTahunAjaran(); // AUTO-DETECT TAHUN AJARAN

    // STEP 0: SANITIZE ALL STUDENT DATA
    const sanitizedStudents = unassignedStudents.map((student) => ({
      ...student,
      asal_sekolah: sanitizeSchoolName(student.asal_sekolah),
    }));

    console.log("🧹 Data sanitized - school names normalized");

    // STEP 1: MAXIMUM DISTRIBUTION - Strict Round-Robin by School
    const distributeBySchool = (students) => {
      const bySchool = {};
      students.forEach((s) => {
        const school = sanitizeSchoolName(s.asal_sekolah);
        if (!bySchool[school]) bySchool[school] = [];
        bySchool[school].push(s);
      });

      // Shuffle tiap sekolah untuk randomness
      const shuffle = (arr) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      Object.keys(bySchool).forEach((school) => {
        bySchool[school] = shuffle(bySchool[school]);
      });

      // ULTRA STRICT Round-Robin
      const result = [];
      const schools = Object.keys(bySchool).sort();
      const maxLength = Math.max(
        ...Object.values(bySchool).map((arr) => arr.length)
      );

      for (let i = 0; i < maxLength; i++) {
        schools.forEach((school) => {
          if (bySchool[school][i]) {
            result.push(bySchool[school][i]);
          }
        });
      }

      return result;
    };

    // Distribute L dan P secara terpisah by school
    const males = sanitizedStudents.filter((s) => s.jenis_kelamin === "L");
    const females = sanitizedStudents.filter((s) => s.jenis_kelamin === "P");

    const distributedMales = distributeBySchool(males);
    const distributedFemales = distributeBySchool(females);

    // Setup kelas
    const classNames = Array.from(
      { length: numClasses },
      (_, i) => `7${String.fromCharCode(65 + i)}`
    );

    const distribution = {};
    classNames.forEach((className) => {
      distribution[className] = [];
    });

    // STEP 2: Distribute Males - Round Robin
    let maleIndex = 0;
    classNames.forEach((className, classIdx) => {
      const targetMales =
        Math.floor(males.length / numClasses) +
        (classIdx < males.length % numClasses ? 1 : 0);

      for (
        let i = 0;
        i < targetMales && maleIndex < distributedMales.length;
        i++
      ) {
        distribution[className].push(distributedMales[maleIndex]);
        maleIndex++;
      }
    });

    // STEP 3: Distribute Females - Round Robin
    let femaleIndex = 0;
    classNames.forEach((className, classIdx) => {
      const targetFemales =
        Math.floor(females.length / numClasses) +
        (classIdx < females.length % numClasses ? 1 : 0);

      for (
        let i = 0;
        i < targetFemales && femaleIndex < distributedFemales.length;
        i++
      ) {
        distribution[className].push(distributedFemales[femaleIndex]);
        femaleIndex++;
      }
    });

    // STEP 4: Track School Distribution
    const schoolCountPerClass = {};
    classNames.forEach((className) => {
      schoolCountPerClass[className] = {};
      distribution[className].forEach((student) => {
        const school = sanitizeSchoolName(student.asal_sekolah);
        if (!schoolCountPerClass[className][school]) {
          schoolCountPerClass[className][school] = 0;
        }
        schoolCountPerClass[className][school]++;
      });
    });

    // STEP 5: ENHANCED MULTI-PHASE REBALANCING
    const studentsWithSchool = sanitizedStudents.filter(
      (s) => s.asal_sekolah && s.asal_sekolah !== "Unknown"
    );
    const uniqueSchools = [
      ...new Set(
        studentsWithSchool.map((s) => sanitizeSchoolName(s.asal_sekolah))
      ),
    ];

    console.log("🔍 Rebalancing Stats:");
    console.log(`Total Schools: ${uniqueSchools.length}`);
    console.log(`Total Students with School: ${studentsWithSchool.length}`);

    // ⭐ OPTIMIZED THRESHOLDS - Lebih ketat!
    const avgSchoolsFromSameSchool =
      studentsWithSchool.length / uniqueSchools.length / numClasses;

    // Threshold lebih ketat: maksimal hanya boleh 1 siswa lebih dari rata-rata
    const maxSchoolPerClass = Math.ceil(avgSchoolsFromSameSchool);
    const minSchoolPerClass = Math.floor(avgSchoolsFromSameSchool);

    console.log(
      `Target students per school per class: ${avgSchoolsFromSameSchool.toFixed(
        2
      )}`
    );
    console.log(`Max allowed: ${maxSchoolPerClass}`);
    console.log(`Min target: ${minSchoolPerClass}`);

    // PHASE 1: Reduce overloaded schools (ENHANCED - lebih banyak iterasi)
    let phase1Swaps = 0;
    for (let iteration = 0; iteration < 200; iteration++) {
      let swapped = false;

      for (const className of classNames) {
        for (const school in schoolCountPerClass[className]) {
          if (school === "Unknown") continue;

          if (schoolCountPerClass[className][school] > maxSchoolPerClass) {
            for (const targetClass of classNames) {
              if (targetClass === className) continue;

              const targetCount = schoolCountPerClass[targetClass][school] || 0;

              if (targetCount < maxSchoolPerClass) {
                const sourceStudentIdx = distribution[className].findIndex(
                  (s) => sanitizeSchoolName(s.asal_sekolah) === school
                );

                if (sourceStudentIdx !== -1) {
                  const sourceStudent =
                    distribution[className][sourceStudentIdx];

                  const targetStudentIdx = distribution[targetClass].findIndex(
                    (s) =>
                      s.jenis_kelamin === sourceStudent.jenis_kelamin &&
                      sanitizeSchoolName(s.asal_sekolah) !== school
                  );

                  if (targetStudentIdx !== -1) {
                    const targetStudent =
                      distribution[targetClass][targetStudentIdx];
                    const targetSchool = sanitizeSchoolName(
                      targetStudent.asal_sekolah
                    );

                    // Perform swap
                    distribution[className][sourceStudentIdx] = targetStudent;
                    distribution[targetClass][targetStudentIdx] = sourceStudent;

                    // Update tracking
                    schoolCountPerClass[className][school]--;
                    schoolCountPerClass[targetClass][school] =
                      (schoolCountPerClass[targetClass][school] || 0) + 1;

                    if (!schoolCountPerClass[className][targetSchool])
                      schoolCountPerClass[className][targetSchool] = 0;
                    schoolCountPerClass[className][targetSchool]++;

                    if (!schoolCountPerClass[targetClass][targetSchool])
                      schoolCountPerClass[targetClass][targetSchool] = 0;
                    schoolCountPerClass[targetClass][targetSchool]--;

                    phase1Swaps++;
                    swapped = true;
                    break;
                  }
                }
              }
            }
            if (swapped) break;
          }
        }
        if (swapped) break;
      }

      if (!swapped) break;
    }

    // PHASE 2: Increase school diversity (ENHANCED - target 80-90% coverage)
    let phase2Swaps = 0;
    const targetDiversityRatio = 0.85;

    for (let iteration = 0; iteration < 200; iteration++) {
      let swapped = false;

      let minDiversityClass = null;
      let minDiversity = Infinity;

      for (const className of classNames) {
        const schoolsInClass = Object.keys(
          schoolCountPerClass[className]
        ).filter(
          (s) => s !== "Unknown" && schoolCountPerClass[className][s] > 0
        );
        if (schoolsInClass.length < minDiversity) {
          minDiversity = schoolsInClass.length;
          minDiversityClass = className;
        }
      }

      if (
        !minDiversityClass ||
        minDiversity >= Math.floor(uniqueSchools.length * targetDiversityRatio)
      ) {
        break;
      }

      const schoolsInMinClass = Object.keys(
        schoolCountPerClass[minDiversityClass]
      ).filter(
        (s) => s !== "Unknown" && schoolCountPerClass[minDiversityClass][s] > 0
      );
      const missingSchools = uniqueSchools.filter(
        (s) => !schoolsInMinClass.includes(s)
      );

      for (const missingSchool of missingSchools) {
        for (const sourceClass of classNames) {
          if (sourceClass === minDiversityClass) continue;

          const sourceCount =
            schoolCountPerClass[sourceClass][missingSchool] || 0;
          if (sourceCount > minSchoolPerClass) {
            const sourceStudentIdx = distribution[sourceClass].findIndex(
              (s) => sanitizeSchoolName(s.asal_sekolah) === missingSchool
            );

            if (sourceStudentIdx !== -1) {
              const sourceStudent = distribution[sourceClass][sourceStudentIdx];

              const targetStudentIdx = distribution[
                minDiversityClass
              ].findIndex(
                (s) => s.jenis_kelamin === sourceStudent.jenis_kelamin
              );

              if (targetStudentIdx !== -1) {
                const targetStudent =
                  distribution[minDiversityClass][targetStudentIdx];
                const targetSchool = sanitizeSchoolName(
                  targetStudent.asal_sekolah
                );

                // Swap
                distribution[sourceClass][sourceStudentIdx] = targetStudent;
                distribution[minDiversityClass][targetStudentIdx] =
                  sourceStudent;

                // Update tracking
                schoolCountPerClass[sourceClass][missingSchool]--;
                if (!schoolCountPerClass[minDiversityClass][missingSchool])
                  schoolCountPerClass[minDiversityClass][missingSchool] = 0;
                schoolCountPerClass[minDiversityClass][missingSchool]++;

                if (!schoolCountPerClass[sourceClass][targetSchool])
                  schoolCountPerClass[sourceClass][targetSchool] = 0;
                schoolCountPerClass[sourceClass][targetSchool]++;

                if (!schoolCountPerClass[minDiversityClass][targetSchool])
                  schoolCountPerClass[minDiversityClass][targetSchool] = 0;
                schoolCountPerClass[minDiversityClass][targetSchool]--;

                phase2Swaps++;
                swapped = true;
                break;
              }
            }
          }
        }
        if (swapped) break;
      }

      if (!swapped) break;
    }

    // ⭐ PHASE 3: BALANCE FINAL PASS - Ratakan variance asal SD antar kelas
    let phase3Swaps = 0;
    for (let iteration = 0; iteration < 100; iteration++) {
      let swapped = false;

      // Hitung variance jumlah asal SD per kelas
      const schoolCounts = classNames.map((className) => {
        return Object.keys(schoolCountPerClass[className]).filter(
          (s) => s !== "Unknown" && schoolCountPerClass[className][s] > 0
        ).length;
      });

      const avgSchoolCount =
        schoolCounts.reduce((a, b) => a + b, 0) / schoolCounts.length;
      const variance =
        schoolCounts.reduce(
          (sum, count) => sum + Math.pow(count - avgSchoolCount, 2),
          0
        ) / schoolCounts.length;

      // Kalau variance sudah cukup kecil, stop
      if (variance < 0.5) break;

      // Cari kelas dengan diversity tertinggi dan terendah
      const maxDiversityClass =
        classNames[schoolCounts.indexOf(Math.max(...schoolCounts))];
      const minDiversityClass =
        classNames[schoolCounts.indexOf(Math.min(...schoolCounts))];

      if (maxDiversityClass === minDiversityClass) break;

      // Cari school yang ada di maxClass tapi tidak di minClass
      const schoolsInMax = Object.keys(
        schoolCountPerClass[maxDiversityClass]
      ).filter(
        (s) => s !== "Unknown" && schoolCountPerClass[maxDiversityClass][s] > 0
      );
      const schoolsInMin = Object.keys(
        schoolCountPerClass[minDiversityClass]
      ).filter(
        (s) => s !== "Unknown" && schoolCountPerClass[minDiversityClass][s] > 0
      );
      const uniqueToMax = schoolsInMax.filter((s) => !schoolsInMin.includes(s));

      for (const school of uniqueToMax) {
        const sourceStudentIdx = distribution[maxDiversityClass].findIndex(
          (s) => sanitizeSchoolName(s.asal_sekolah) === school
        );

        if (sourceStudentIdx !== -1) {
          const sourceStudent =
            distribution[maxDiversityClass][sourceStudentIdx];

          const targetStudentIdx = distribution[minDiversityClass].findIndex(
            (s) => s.jenis_kelamin === sourceStudent.jenis_kelamin
          );

          if (targetStudentIdx !== -1) {
            const targetStudent =
              distribution[minDiversityClass][targetStudentIdx];
            const targetSchool = sanitizeSchoolName(targetStudent.asal_sekolah);

            // Swap
            distribution[maxDiversityClass][sourceStudentIdx] = targetStudent;
            distribution[minDiversityClass][targetStudentIdx] = sourceStudent;

            // Update tracking
            schoolCountPerClass[maxDiversityClass][school]--;
            if (schoolCountPerClass[maxDiversityClass][school] === 0) {
              delete schoolCountPerClass[maxDiversityClass][school];
            }

            if (!schoolCountPerClass[minDiversityClass][school])
              schoolCountPerClass[minDiversityClass][school] = 0;
            schoolCountPerClass[minDiversityClass][school]++;

            if (!schoolCountPerClass[maxDiversityClass][targetSchool])
              schoolCountPerClass[maxDiversityClass][targetSchool] = 0;
            schoolCountPerClass[maxDiversityClass][targetSchool]++;

            if (!schoolCountPerClass[minDiversityClass][targetSchool])
              schoolCountPerClass[minDiversityClass][targetSchool] = 0;
            schoolCountPerClass[minDiversityClass][targetSchool]--;
            if (schoolCountPerClass[minDiversityClass][targetSchool] === 0) {
              delete schoolCountPerClass[minDiversityClass][targetSchool];
            }

            phase3Swaps++;
            swapped = true;
            break;
          }
        }
      }

      if (!swapped) break;
    }

    console.log(`✅ Phase 1 (Reduce overload): ${phase1Swaps} swaps`);
    console.log(`✅ Phase 2 (Increase diversity): ${phase2Swaps} swaps`);
    console.log(`✅ Phase 3 (Balance variance): ${phase3Swaps} swaps`);

    // ⭐ PHASE 4: FORCE SPREAD DOMINANT SCHOOLS
    let phase4Swaps = 0;
    for (let iteration = 0; iteration < 100; iteration++) {
      let swapped = false;

      // Find schools with very uneven distribution
      for (const school of uniqueSchools) {
        const schoolDistribution = classNames.map(
          (className) => schoolCountPerClass[className][school] || 0
        );

        const maxInClass = Math.max(...schoolDistribution);
        const minInClass = Math.min(...schoolDistribution);

        // If difference is more than 3, try to balance
        if (maxInClass - minInClass > 3) {
          const maxClassIdx = schoolDistribution.indexOf(maxInClass);
          const minClassIdx = schoolDistribution.indexOf(minInClass);
          const maxClassName = classNames[maxClassIdx];
          const minClassName = classNames[minClassIdx];

          // Find student from overloaded school in max class
          const sourceStudentIdx = distribution[maxClassName].findIndex(
            (s) => sanitizeSchoolName(s.asal_sekolah) === school
          );

          if (sourceStudentIdx !== -1) {
            const sourceStudent = distribution[maxClassName][sourceStudentIdx];

            // Find swap candidate in min class (same gender, different school)
            const targetStudentIdx = distribution[minClassName].findIndex(
              (s) =>
                s.jenis_kelamin === sourceStudent.jenis_kelamin &&
                sanitizeSchoolName(s.asal_sekolah) !== school
            );

            if (targetStudentIdx !== -1) {
              const targetStudent =
                distribution[minClassName][targetStudentIdx];
              const targetSchool = sanitizeSchoolName(
                targetStudent.asal_sekolah
              );

              // Check if swap won't create new imbalance
              const targetSchoolInMax =
                schoolCountPerClass[maxClassName][targetSchool] || 0;
              const targetSchoolInMin =
                schoolCountPerClass[minClassName][targetSchool] || 0;

              // Only swap if it improves balance
              if (targetSchoolInMax - targetSchoolInMin < 3) {
                // Perform swap
                distribution[maxClassName][sourceStudentIdx] = targetStudent;
                distribution[minClassName][targetStudentIdx] = sourceStudent;

                // Update tracking
                schoolCountPerClass[maxClassName][school]--;
                schoolCountPerClass[minClassName][school] =
                  (schoolCountPerClass[minClassName][school] || 0) + 1;

                if (!schoolCountPerClass[maxClassName][targetSchool])
                  schoolCountPerClass[maxClassName][targetSchool] = 0;
                schoolCountPerClass[maxClassName][targetSchool]++;

                if (!schoolCountPerClass[minClassName][targetSchool])
                  schoolCountPerClass[minClassName][targetSchool] = 0;
                schoolCountPerClass[minClassName][targetSchool]--;

                phase4Swaps++;
                swapped = true;
                break;
              }
            }
          }
        }
      }

      if (!swapped) break;
    }

    console.log(`✅ Phase 4 (Force spread dominant): ${phase4Swaps} swaps`);

    // STEP 6: SORT setiap kelas by NAMA (A-Z)
    Object.keys(distribution).forEach((className) => {
      distribution[className].sort((a, b) =>
        (a.nama_lengkap || "").localeCompare(b.nama_lengkap || "")
      );
    });

    // STEP 7: ASSIGN NIS berurutan per kelas
    let nisCounter = 1;
    classNames.forEach((className) => {
      distribution[className] = distribution[className].map((student) => {
        const nis = generateNIS(tahunAjaran, 7, nisCounter);
        nisCounter++;
        return { ...student, nis };
      });
    });

    // Log final distribution dengan detail
    console.log("\n📊 Final Distribution:");
    classNames.forEach((className) => {
      const schools = Object.keys(schoolCountPerClass[className]).filter(
        (s) => s !== "Unknown" && schoolCountPerClass[className][s] > 0
      );
      const schoolDetails = schools
        .map((s) => `${s}:${schoolCountPerClass[className][s]}`)
        .join(", ");
      console.log(
        `${className}: ${schools.length} schools (${schoolDetails}) - ${distribution[className].length} students`
      );
    });

    // Log school distribution summary
    const schoolSummary = {};
    uniqueSchools.forEach((school) => {
      schoolSummary[school] = sanitizedStudents.filter(
        (s) => sanitizeSchoolName(s.asal_sekolah) === school
      ).length;
    });
    console.log("\n📚 School Distribution Summary:", schoolSummary);

    setClassDistribution(distribution);
    setShowPreview(true);
    setShowSavedClasses(false);
    setEditMode(false);

    setHistory([JSON.parse(JSON.stringify(distribution))]);
    setHistoryIndex(0);

    const totalSwaps = phase1Swaps + phase2Swaps + phase3Swaps;
    showToast(
      `✅ Generate ${numClasses} kelas seimbang (${sanitizedStudents.length} siswa, ${totalSwaps} optimizations)!`,
      "success"
    );
  } catch (error) {
    console.error("Error generating distribution:", error);
    showToast("Gagal generate pembagian kelas", "error");
  } finally {
    setIsLoading(false);
  }
};

// Check balance gender per kelas
export const checkClassBalance = (classDistribution) => {
  const unbalanced = [];
  const avgStudentsPerClass =
    Object.values(classDistribution).reduce(
      (sum, students) => sum + students.length,
      0
    ) / Object.keys(classDistribution).length;

  Object.entries(classDistribution).forEach(([className, students]) => {
    const males = students.filter((s) => s.jenis_kelamin === "L").length;
    const females = students.filter((s) => s.jenis_kelamin === "P").length;
    const total = students.length;

    const genderRatio = males / (females || 1);
    const isGenderUnbalanced = genderRatio > 2 || genderRatio < 0.5;
    const isSizeUnbalanced = Math.abs(total - avgStudentsPerClass) > 3;

    if (isGenderUnbalanced || isSizeUnbalanced) {
      unbalanced.push({
        className,
        reason: isGenderUnbalanced ? "gender" : "size",
        males,
        females,
        total,
      });
    }
  });

  return unbalanced;
};

// Hitung statistik per kelas
export const getClassStats = (students) => {
  const males = students.filter((s) => s.jenis_kelamin === "L").length;
  const females = students.filter((s) => s.jenis_kelamin === "P").length;
  const schools = [
    ...new Set(
      students.map((s) => s.asal_sekolah).filter((s) => s && s !== "Unknown")
    ),
  ];

  return {
    total: students.length,
    males,
    females,
    schoolCount: schools.length,
    schools,
  };
};

// Save to history untuk Undo/Redo
export const saveToHistory = (
  newDistribution,
  history,
  historyIndex,
  setHistory,
  setHistoryIndex
) => {
  setHistory((prev) => {
    const newHistory = prev.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newDistribution)));
    return newHistory;
  });
  setHistoryIndex((prev) => prev + 1);
};

// Undo
export const handleUndo = (
  historyIndex,
  history,
  setHistoryIndex,
  setClassDistribution,
  showToast
) => {
  if (historyIndex > 0) {
    setHistoryIndex((prev) => prev - 1);
    setClassDistribution(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    showToast("↩️ Undo berhasil", "info");
  }
};

// Redo
export const handleRedo = (
  historyIndex,
  history,
  setHistoryIndex,
  setClassDistribution,
  showToast
) => {
  if (historyIndex < history.length - 1) {
    setHistoryIndex((prev) => prev + 1);
    setClassDistribution(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    showToast("↪️ Redo berhasil", "info");
  }
};

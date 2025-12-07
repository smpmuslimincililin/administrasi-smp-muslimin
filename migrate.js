// Migration Script: Old DB Structure → New DB Structure
// Jalankan dengan: node migrate.js

import { createClient } from "@supabase/supabase-js";

// ========== CONFIGURATION ==========
const OLD_DB = {
  url: "https://enzohhulskcwniosqtnt.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuem9oaHVsc2tjd25pb3NxdG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNjY4OTgsImV4cCI6MjA3Mzg0Mjg5OH0.32dpWJR55BA_ROrGAd9KxE22X4wVGLRWQ2VGUFG0NKQ",
};

const NEW_DB = {
  url: "https://onekgoiqgdnwjjvchqgv.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZWtnb2lxZ2Rud2pqdmNocWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTg0NzYsImV4cCI6MjA3MTA3NDQ3Nn0.u69DGjg5G6V1jr-NGo_ErvKW9ab2srzr0QD59K7FkLE",
};

const oldSupabase = createClient(OLD_DB.url, OLD_DB.key);
const newSupabase = createClient(NEW_DB.url, NEW_DB.key);

// ========== HELPER FUNCTIONS ==========
const log = (msg, type = "info") => {
  const prefix = {
    info: "📘",
    success: "✅",
    error: "❌",
    warn: "⚠️",
  }[type];
  console.log(`${prefix} ${msg}`);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ========== MIGRATION FUNCTIONS ==========

// 1. Migrate Academic Years (No changes)
async function migrateAcademicYears() {
  log("Migrating academic_years...");
  const { data, error } = await oldSupabase.from("academic_years").select("*");

  if (error) {
    log(`Error fetching academic_years: ${error.message}`, "error");
    return;
  }

  for (const record of data) {
    const { error: insertError } = await newSupabase
      .from("academic_years")
      .insert(record);

    if (insertError)
      log(
        `Error inserting academic_year ${record.id}: ${insertError.message}`,
        "error"
      );
  }

  log(`Migrated ${data.length} academic years`, "success");
}

// 2. Migrate Announcements (with new columns)
async function migrateAnnouncements() {
  log("Migrating announcements...");
  const { data, error } = await oldSupabase.from("announcement").select("*");

  if (error) {
    log(`Error fetching announcements: ${error.message}`, "error");
    return;
  }

  // Get active academic year for default value
  const { data: activeYear } = await newSupabase
    .from("academic_years")
    .select("id")
    .eq("is_active", true)
    .single();

  for (const record of data) {
    const transformed = {
      id: record.id,
      title: record.title,
      content: record.content,
      academic_year_id: activeYear?.id || null, // Default to active year
      effective_from: record.created_at, // Use created_at as default
      effective_until: null, // No expiry by default
      target_role: "all", // Default to all roles
      is_active: true,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };

    const { error: insertError } = await newSupabase
      .from("announcement")
      .insert(transformed);

    if (insertError)
      log(
        `Error inserting announcement ${record.id}: ${insertError.message}`,
        "error"
      );
  }

  log(`Migrated ${data.length} announcements`, "success");
}

// 3. Migrate Classes
async function migrateClasses() {
  log("Migrating classes...");
  const { data, error } = await oldSupabase.from("classes").select("*");

  if (error) {
    log(`Error fetching classes: ${error.message}`, "error");
    return;
  }

  // Create mapping: old academic_year (string) → new academic_year_id
  const { data: academicYears } = await newSupabase
    .from("academic_years")
    .select("id, year, semester");

  for (const record of data) {
    // Find matching academic year
    const matchingYear = academicYears?.find(
      (ay) => ay.year === record.academic_year?.split(" - ")[0]
    );

    const transformed = {
      id: record.id,
      grade: record.grade,
      academic_year_id: matchingYear?.id || null,
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };

    const { error: insertError } = await newSupabase
      .from("classes")
      .insert(transformed);

    if (insertError)
      log(
        `Error inserting class ${record.id}: ${insertError.message}`,
        "error"
      );
  }

  log(`Migrated ${data.length} classes`, "success");
}

// 4. Migrate Students
async function migrateStudents() {
  log("Migrating students...");
  const { data, error } = await oldSupabase.from("students").select("*");

  if (error) {
    log(`Error fetching students: ${error.message}`, "error");
    return;
  }

  for (const record of data) {
    const transformed = {
      id: record.id,
      nis: record.nis,
      full_name: record.full_name,
      gender: record.gender,
      class_id: record.class_id,
      status: "active", // Default status
      graduation_year: null, // Will be set later
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };

    const { error: insertError } = await newSupabase
      .from("students")
      .insert(transformed);

    if (insertError)
      log(
        `Error inserting student ${record.id}: ${insertError.message}`,
        "error"
      );
  }

  log(`Migrated ${data.length} students`, "success");
}

// 5. Migrate Attendances
async function migrateAttendances() {
  log("Migrating attendances...");
  const { data, error } = await oldSupabase.from("attendances").select("*");

  if (error) {
    log(`Error fetching attendances: ${error.message}`, "error");
    return;
  }

  // Get academic years for mapping
  const { data: academicYears } = await newSupabase
    .from("academic_years")
    .select("id, year, semester, start_date, end_date");

  for (const record of data) {
    // Find matching academic year based on date
    const matchingYear = academicYears?.find((ay) => {
      const attDate = new Date(record.date);
      const start = new Date(ay.start_date);
      const end = new Date(ay.end_date);
      return attDate >= start && attDate <= end;
    });

    const transformed = {
      id: record.id,
      student_id: record.student_id,
      teacher_id: record.teacher_id,
      class_id: record.class_id,
      academic_year_id: matchingYear?.id || null,
      date: record.date,
      subject: record.subject,
      status: record.status,
      type: record.type,
      notes: record.notes,
      created_at: record.created_at,
    };

    const { error: insertError } = await newSupabase
      .from("attendances")
      .insert(transformed);

    if (insertError && !insertError.message.includes("duplicate")) {
      log(
        `Error inserting attendance ${record.id}: ${insertError.message}`,
        "error"
      );
    }
  }

  log(`Migrated ${data.length} attendances`, "success");
}

// 6. Migrate Grades
async function migrateGrades() {
  log("Migrating grades...");
  const { data, error } = await oldSupabase.from("grades").select("*");

  if (error) {
    log(`Error fetching grades: ${error.message}`, "error");
    return;
  }

  const { data: academicYears } = await newSupabase
    .from("academic_years")
    .select("id, year, semester");

  for (const record of data) {
    const matchingYear = academicYears?.find(
      (ay) =>
        ay.year === record.academic_year?.split(" - ")[0] &&
        ay.semester === record.semester
    );

    const transformed = {
      id: record.id,
      student_id: record.student_id,
      teacher_id: record.teacher_id,
      class_id: record.class_id,
      academic_year_id: matchingYear?.id || null,
      subject: record.subject,
      assignment_type: record.assignment_type,
      score: record.score,
      semester: record.semester,
      created_at: record.created_at,
    };

    const { error: insertError } = await newSupabase
      .from("grades")
      .insert(transformed);

    if (insertError)
      log(
        `Error inserting grade ${record.id}: ${insertError.message}`,
        "error"
      );
  }

  log(`Migrated ${data.length} grades`, "success");
}

// 7. Migrate Konseling
async function migrateKonseling() {
  log("Migrating konseling...");
  const { data, error } = await oldSupabase.from("konseling").select("*");

  if (error) {
    log(`Error fetching konseling: ${error.message}`, "error");
    return;
  }

  const { data: academicYears } = await newSupabase
    .from("academic_years")
    .select("id, year, semester");

  for (const record of data) {
    const matchingYear = academicYears?.find(
      (ay) => ay.year === record.academic_year?.split(" - ")[0]
    );

    const transformed = {
      id: record.id,
      student_id: record.student_id,
      class_id: record.class_id,
      guru_bk_id: record.guru_bk_id,
      academic_year_id: matchingYear?.id || null,
      tanggal: record.tanggal,
      jenis_layanan: record.jenis_layanan,
      bidang_bimbingan: record.bidang_bimbingan,
      permasalahan: record.permasalahan,
      kronologi: record.kronologi,
      tindakan_layanan: record.tindakan_layanan,
      hasil_layanan: record.hasil_layanan,
      rencana_tindak_lanjut: record.rencana_tindak_lanjut,
      status_layanan: record.status_layanan,
      tingkat_urgensi: record.tingkat_urgensi,
      kategori_masalah: record.kategori_masalah,
      perlu_followup: record.perlu_followup,
      tanggal_followup: record.tanggal_followup,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };

    const { error: insertError } = await newSupabase
      .from("konseling")
      .insert(transformed);

    if (insertError)
      log(
        `Error inserting konseling ${record.id}: ${insertError.message}`,
        "error"
      );
  }

  log(`Migrated ${data.length} konseling records`, "success");
}

// 8. Migrate Teacher Assignments
async function migrateTeacherAssignments() {
  log("Migrating teacher_assignments...");
  const { data, error } = await oldSupabase
    .from("teacher_assignments")
    .select("*");

  if (error) {
    log(`Error fetching teacher_assignments: ${error.message}`, "error");
    return;
  }

  const { data: academicYears } = await newSupabase
    .from("academic_years")
    .select("id, year, semester");

  for (const record of data) {
    const matchingYear = academicYears?.find(
      (ay) =>
        ay.year === record.academic_year?.split(" - ")[0] &&
        ay.semester === record.semester
    );

    const transformed = {
      id: record.id,
      teacher_id: record.teacher_id,
      class_id: record.class_id,
      academic_year_id: matchingYear?.id || null,
      subject: record.subject,
      semester: record.semester,
      created_at: record.created_at,
    };

    const { error: insertError } = await newSupabase
      .from("teacher_assignments")
      .insert(transformed);

    if (insertError)
      log(
        `Error inserting teacher_assignment ${record.id}: ${insertError.message}`,
        "error"
      );
  }

  log(`Migrated ${data.length} teacher assignments`, "success");
}

// 9. Migrate Teacher Attendance
async function migrateTeacherAttendance() {
  log("Migrating teacher_attendance...");
  const { data, error } = await oldSupabase
    .from("teacher_attendance")
    .select("*");

  if (error) {
    log(`Error fetching teacher_attendance: ${error.message}`, "error");
    return;
  }

  const { data: academicYears } = await newSupabase
    .from("academic_years")
    .select("id, start_date, end_date");

  for (const record of data) {
    const matchingYear = academicYears?.find((ay) => {
      const attDate = new Date(record.attendance_date);
      const start = new Date(ay.start_date);
      const end = new Date(ay.end_date);
      return attDate >= start && attDate <= end;
    });

    const transformed = {
      id: record.id,
      teacher_id: record.teacher_id,
      academic_year_id: matchingYear?.id || null,
      attendance_date: record.attendance_date,
      status: record.status,
      clock_in: record.clock_in,
      check_in_method: record.check_in_method,
      gps_location: record.gps_location,
      notes: record.notes,
      full_name: record.full_name,
      admin_info: null, // New field, no data from old
      created_at: record.created_at,
      updated_at: record.updated_at,
    };

    const { error: insertError } = await newSupabase
      .from("teacher_attendance")
      .insert(transformed);

    if (insertError)
      log(
        `Error inserting teacher_attendance ${record.id}: ${insertError.message}`,
        "error"
      );
  }

  log(`Migrated ${data.length} teacher attendance records`, "success");
}

// 10. Migrate Teacher Schedules
async function migrateTeacherSchedules() {
  log("Migrating teacher_schedules...");
  const { data, error } = await oldSupabase
    .from("teacher_schedules")
    .select("*");

  if (error) {
    log(`Error fetching teacher_schedules: ${error.message}`, "error");
    return;
  }

  // Get active academic year as default
  const { data: activeYear } = await newSupabase
    .from("academic_years")
    .select("id")
    .eq("is_active", true)
    .single();

  for (const record of data) {
    const transformed = {
      id: record.id,
      teacher_id: record.teacher_id,
      class_id: record.class_id,
      academic_year_id: activeYear?.id || null,
      day: record.day,
      start_time: record.start_time,
      end_time: record.end_time,
      room_number: record.room_number,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };

    const { error: insertError } = await newSupabase
      .from("teacher_schedules")
      .insert(transformed);

    if (insertError)
      log(
        `Error inserting teacher_schedule ${record.id}: ${insertError.message}`,
        "error"
      );
  }

  log(`Migrated ${data.length} teacher schedules`, "success");
}

// 11. Migrate Student Development Notes
async function migrateStudentDevelopmentNotes() {
  log("Migrating student_development_notes...");
  const { data, error } = await oldSupabase
    .from("student_development_notes")
    .select("*");

  if (error) {
    log(`Error fetching student_development_notes: ${error.message}`, "error");
    return;
  }

  const { data: academicYears } = await newSupabase
    .from("academic_years")
    .select("id, year");

  for (const record of data) {
    const matchingYear = academicYears?.find(
      (ay) => ay.year === record.academic_year?.split(" - ")[0]
    );

    const transformed = {
      id: record.id,
      student_id: record.student_id,
      teacher_id: record.teacher_id,
      class_id: record.class_id,
      academic_year_id: matchingYear?.id || null,
      category: record.category,
      label: record.label,
      note_content: record.note_content,
      action_taken: record.action_taken,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };

    const { error: insertError } = await newSupabase
      .from("student_development_notes")
      .insert(transformed);

    if (insertError)
      log(
        `Error inserting student_development_note ${record.id}: ${insertError.message}`,
        "error"
      );
  }

  log(`Migrated ${data.length} student development notes`, "success");
}

// 12. Migrate Users
async function migrateUsers() {
  log("Migrating users...");
  const { data, error } = await oldSupabase.from("users").select("*");

  if (error) {
    log(`Error fetching users: ${error.message}`, "error");
    return;
  }

  for (const record of data) {
    const transformed = {
      id: record.id,
      username: record.username,
      password: record.password,
      full_name: record.full_name,
      teacher_id: record.teacher_id,
      role: record.role,
      homeroom_class_id: record.homeroom_class_id,
      no_hp: record.no_hp,
      status: "active", // Default status
      is_active: record.is_active,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };

    const { error: insertError } = await newSupabase
      .from("users")
      .insert(transformed);

    if (insertError)
      log(`Error inserting user ${record.id}: ${insertError.message}`, "error");
  }

  log(`Migrated ${data.length} users`, "success");
}

// 13-16. Copy tables without changes
async function copyTableDirectly(tableName) {
  log(`Copying ${tableName}...`);
  const { data, error } = await oldSupabase.from(tableName).select("*");

  if (error) {
    log(`Error fetching ${tableName}: ${error.message}`, "error");
    return;
  }

  if (!data || data.length === 0) {
    log(`No data in ${tableName}`, "warn");
    return;
  }

  for (const record of data) {
    const { error: insertError } = await newSupabase
      .from(tableName)
      .insert(record);

    if (insertError)
      log(
        `Error inserting ${tableName} ${record.id}: ${insertError.message}`,
        "error"
      );
  }

  log(`Copied ${data.length} records from ${tableName}`, "success");
}

// ========== MAIN EXECUTION ==========
async function runMigration() {
  console.log("\n🚀 Starting Database Migration...\n");

  try {
    // Step 1: Migrate base tables first
    await migrateAcademicYears();
    await sleep(1000);

    // Step 2: Migrate classes (depends on academic_years)
    await migrateClasses();
    await sleep(1000);

    // Step 3: Migrate students
    await migrateStudents();
    await sleep(1000);

    // Step 4: Migrate users
    await migrateUsers();
    await sleep(1000);

    // Step 5: Migrate relational data
    await migrateAnnouncements();
    await sleep(1000);

    await migrateAttendances();
    await sleep(1000);

    await migrateGrades();
    await sleep(1000);

    await migrateKonseling();
    await sleep(1000);

    await migrateTeacherAssignments();
    await sleep(1000);

    await migrateTeacherAttendance();
    await sleep(1000);

    await migrateTeacherSchedules();
    await sleep(1000);

    await migrateStudentDevelopmentNotes();
    await sleep(1000);

    // Step 6: Copy tables without structural changes
    await copyTableDirectly("app_config");
    await sleep(500);

    await copyTableDirectly("cleanup_history");
    await sleep(500);

    await copyTableDirectly("school_settings");
    await sleep(500);

    await copyTableDirectly("siswa_baru");
    await sleep(500);

    await copyTableDirectly("spmb_settings");
    await sleep(500);

    await copyTableDirectly("system_health_logs");

    console.log("\n✨ Migration completed!\n");
  } catch (err) {
    log(`Fatal error during migration: ${err.message}`, "error");
    console.error(err);
  }
}

// Run migration
runMigration();

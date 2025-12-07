// Fix Teacher Assignments - Final Correct Version
// Jalankan dengan: node fix-teacher-assignments.js

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

// ========== MAIN FIX ==========
async function fixTeacherAssignments() {
  console.log("\n🔧 Fixing teacher_assignments...\n");

  try {
    // Step 1: Get all teacher assignments from OLD DB
    const { data: oldAssignments, error: fetchError } = await oldSupabase
      .from("teacher_assignments")
      .select("*");

    if (fetchError) {
      console.error("❌ Error fetching old assignments:", fetchError.message);
      return;
    }

    console.log(
      `📊 Found ${oldAssignments.length} teacher assignments to migrate\n`
    );

    // Step 2: Get all classes from NEW DB
    const { data: newClasses, error: classError } = await newSupabase
      .from("classes")
      .select("id, grade, academic_year_id");

    if (classError) {
      console.error("❌ Error fetching new classes:", classError.message);
      return;
    }

    console.log(`📚 Found ${newClasses.length} classes in new DB\n`);

    // Step 3: Get academic years for mapping
    const { data: academicYears, error: ayError } = await newSupabase
      .from("academic_years")
      .select("id, year, semester");

    if (ayError) {
      console.error("❌ Error fetching academic years:", ayError.message);
      return;
    }

    // Step 4: Get all users (to map teacher_id "G-02" -> UUID)
    const { data: users, error: usersError } = await newSupabase
      .from("users")
      .select("id, teacher_id");

    if (usersError) {
      console.error("❌ Error fetching users:", usersError.message);
      return;
    }

    console.log(`👥 Found ${users.length} users for teacher mapping\n`);

    // Create mapping: teacher_id ("G-02") -> user UUID
    const teacherMap = {};
    users.forEach((user) => {
      if (user.teacher_id) {
        teacherMap[user.teacher_id] = user.id;
      }
    });

    console.log(
      `🗺️  Created mapping for ${Object.keys(teacherMap).length} teachers\n`
    );

    // Step 5: Process each assignment
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let notFoundTeachers = new Set();

    for (const assignment of oldAssignments) {
      try {
        // Map teacher_id "G-02" -> UUID
        const teacherUUID = teacherMap[assignment.teacher_id];

        if (!teacherUUID) {
          if (!notFoundTeachers.has(assignment.teacher_id)) {
            console.log(`⚠️  Teacher not found: ${assignment.teacher_id}`);
            notFoundTeachers.add(assignment.teacher_id);
          }
          errorCount++;
          continue;
        }

        // Find matching academic year (prioritize same semester, fallback to same year)
        let matchingYear = academicYears.find(
          (ay) =>
            ay.year === assignment.academic_year?.split(" - ")[0] &&
            ay.semester === assignment.semester
        );

        // If no match with semester, try just the year
        if (!matchingYear) {
          matchingYear = academicYears.find(
            (ay) => ay.year === assignment.academic_year?.split(" - ")[0]
          );
        }

        if (!matchingYear) {
          console.log(
            `⚠️  No matching academic year for assignment ${assignment.id}`
          );
          skippedCount++;
          continue;
        }

        // Find matching class
        const matchingClass = newClasses.find(
          (c) =>
            c.id === assignment.class_id &&
            c.academic_year_id === matchingYear.id
        );

        if (!matchingClass) {
          console.log(
            `⚠️  No matching class for id "${assignment.class_id}" in academic year ${matchingYear.year}`
          );
          errorCount++;
          continue;
        }

        // Insert with correct UUID teacher_id
        const transformed = {
          id: assignment.id,
          teacher_id: teacherUUID, // ← INI YANG PENTING! UUID bukan "G-02"
          class_id: matchingClass.id,
          academic_year_id: matchingYear.id,
          subject: assignment.subject,
          semester: assignment.semester,
          created_at: assignment.created_at,
        };

        const { error: insertError } = await newSupabase
          .from("teacher_assignments")
          .insert(transformed);

        if (insertError) {
          // Skip duplicate errors
          if (
            insertError.message.includes("duplicate") ||
            insertError.message.includes("unique")
          ) {
            skippedCount++;
          } else {
            console.log(
              `❌ Error inserting assignment ${assignment.id}: ${insertError.message}`
            );
            errorCount++;
          }
        } else {
          successCount++;
          if (successCount % 20 === 0) {
            console.log(
              `✅ Progress: ${successCount}/${oldAssignments.length}`
            );
          }
        }
      } catch (err) {
        console.log(
          `❌ Unexpected error for assignment ${assignment.id}:`,
          err.message
        );
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(50));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount}`);
    console.log(`❌ Failed to migrate: ${errorCount}`);
    console.log(`📝 Total processed: ${oldAssignments.length}`);

    if (notFoundTeachers.size > 0) {
      console.log(`\n⚠️  Teachers not found in new DB:`);
      notFoundTeachers.forEach((t) => console.log(`   - ${t}`));
    }

    console.log("=".repeat(50) + "\n");

    if (successCount > 0) {
      console.log("✨ Teacher assignments fixed successfully!\n");
    }
  } catch (err) {
    console.error("❌ Fatal error:", err.message);
  }
}

// Run the fix
fixTeacherAssignments();

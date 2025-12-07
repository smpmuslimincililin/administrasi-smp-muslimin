import { createClient } from "@supabase/supabase-js";

// Pakai environment variables (BUKAN hardcode)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Log untuk debug
console.log("🔗 APLIKASI KONEK KE:");
console.log("URL:", supabaseUrl);
console.log("Project ID:", supabaseUrl?.split("//")[1]?.split(".")[0]);
console.log("Key exists:", !!supabaseAnonKey);

// Validasi
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase credentials!");
  throw new Error("Supabase environment variables are required");
}

// Create client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function
export const getUserByUsername = async (username) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .maybeSingle();

  return { data, error };
};

export default supabase;

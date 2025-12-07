import React, { useState, useEffect } from "react";
import { X, Bell, Calendar } from "lucide-react";
import { supabase } from "../supabaseClient";

const AnnouncementPopup = ({ userId, userRole }) => {
  const [announcement, setAnnouncement] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (userId && userRole) {
      checkForNewAnnouncement();
    }
  }, [userId, userRole]);

  const checkForNewAnnouncement = async () => {
    try {
      const now = new Date().toISOString();
      const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD (2025-12-06)

      // 1. Ambil pengumuman terbaru yang aktif
      const { data: announcements, error: fetchError } = await supabase
        .from("announcement")
        .select("*")
        .eq("is_active", true)
        .lte("effective_from", now)
        .gte("effective_until", now)
        .or(`target_role.eq.${userRole},target_role.eq.semua`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Error fetching announcements:", fetchError);
        return;
      }

      if (!announcements || announcements.length === 0) {
        return;
      }

      const latestAnnouncement = announcements[0];

      // 2. 🆕 Cek apakah user sudah baca pengumuman ini HARI INI
      // Pop-up akan muncul lagi besok meskipun udah dibaca hari ini
      const { data: readStatus, error: readError } = await supabase
        .from("announcement_reads")
        .select("*")
        .eq("announcement_id", latestAnnouncement.id)
        .eq("user_id", userId)
        .gte("read_at", today + "T00:00:00") // 👈 CEK HANYA HARI INI
        .maybeSingle();

      if (readError) {
        console.error("Error checking read status:", readError);
        return;
      }

      // 3. Tampilkan popup jika belum dibaca hari ini
      if (!readStatus) {
        setAnnouncement(latestAnnouncement);
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error checking announcement:", error);
    }
  };

  const handleClose = async () => {
    if (!announcement || !userId) return;

    try {
      const { error } = await supabase.from("announcement_reads").insert({
        announcement_id: announcement.id,
        user_id: userId,
        read_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error marking announcement as read:", error);
      }
    } catch (error) {
      console.error("Error in handleClose:", error);
    } finally {
      setShowPopup(false);
      setAnnouncement(null);
    }
  };

  if (!showPopup || !announcement) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 animate-pulse" />
            <h2 className="text-xl font-bold">📢 Pengumuman</h2>
          </div>
          <button
            onClick={handleClose}
            className="hover:bg-blue-700 rounded-full p-1 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">
            {announcement.title}
          </h3>

          <div className="prose max-w-none">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {announcement.content}
            </p>
          </div>

          {/* Timestamp */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(announcement.created_at).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 flex justify-end border-t border-slate-200">
          <button
            onClick={handleClose}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;

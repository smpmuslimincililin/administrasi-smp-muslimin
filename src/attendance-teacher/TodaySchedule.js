// src/attendance-teacher/TodaySchedule.js
// Widget menampilkan jadwal mengajar hari ini

import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react";
import { supabase } from "../supabaseClient";

const TodaySchedule = ({ currentUser }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get day name in Indonesian
  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  const today = dayNames[new Date().getDay()];

  useEffect(() => {
    if (currentUser?.id) {
      fetchTodaySchedule();
    }

    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const fetchTodaySchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("teacher_schedules")
        .select("*")
        .eq("teacher_id", currentUser.id)
        .eq("day", today)
        .order("start_time", { ascending: true });

      if (error) throw error;

      setSchedules(data || []);
    } catch (error) {
      console.error("Error fetching today schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    return timeStr.slice(0, 5); // "07:00:00" -> "07:00"
  };

  const getClassStatus = (startTime, endTime) => {
    const now = currentTime;
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}:00`;

    if (currentTimeStr < startTime) {
      return "upcoming"; // Belum mulai
    } else if (currentTimeStr >= startTime && currentTimeStr <= endTime) {
      return "ongoing"; // Sedang berlangsung
    } else {
      return "finished"; // Sudah selesai
    }
  };

  const getNextClass = () => {
    const now = currentTime;
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}:00`;

    return schedules.find((s) => s.start_time > currentTimeStr);
  };

  const getTimeUntilNext = (startTime) => {
    const now = currentTime;
    const [hours, minutes] = startTime.split(":").map(Number);
    const classTime = new Date();
    classTime.setHours(hours, minutes, 0);

    const diff = classTime - now;
    const minutesUntil = Math.floor(diff / 60000);

    if (minutesUntil < 0) return null;
    if (minutesUntil < 60) return `${minutesUntil} menit lagi`;

    const hoursUntil = Math.floor(minutesUntil / 60);
    const remainingMinutes = minutesUntil % 60;
    return `${hoursUntil} jam ${remainingMinutes} menit lagi`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const nextClass = getNextClass();

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-lg p-6 border border-blue-100">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="text-blue-600" size={24} />
        <h3 className="text-lg font-bold text-gray-800">
          Jadwal Mengajar Hari Ini
        </h3>
      </div>

      {/* Day Info */}
      <div className="bg-blue-100 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800 font-medium">
          📅 {today},{" "}
          {currentTime.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {schedules.length === 0 ? (
        /* No Schedule Today */
        <div className="text-center py-8">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Calendar className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-600 font-medium mb-1">
            Tidak ada jadwal mengajar hari ini
          </p>
          <p className="text-sm text-gray-500">
            Anda libur atau tidak ada kelas terjadwal
          </p>
        </div>
      ) : (
        <>
          {/* Next Class Alert */}
          {nextClass && (
            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-l-4 border-orange-500 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Clock
                  className="text-orange-600 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div>
                  <p className="text-orange-900 font-bold text-sm mb-1">
                    🔔 Kelas Berikutnya:{" "}
                    {getTimeUntilNext(nextClass.start_time)}
                  </p>
                  <p className="text-orange-800 text-sm">
                    <strong>Kelas {nextClass.class_id}</strong> •{" "}
                    {formatTime(nextClass.start_time)} -{" "}
                    {formatTime(nextClass.end_time)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {schedules.length}
              </p>
              <p className="text-xs text-gray-600">Total Kelas</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
              <p className="text-2xl font-bold text-green-600">
                {
                  schedules.filter(
                    (s) =>
                      getClassStatus(s.start_time, s.end_time) === "finished"
                  ).length
                }
              </p>
              <p className="text-xs text-gray-600">Selesai</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {
                  schedules.filter(
                    (s) =>
                      getClassStatus(s.start_time, s.end_time) !== "finished"
                  ).length
                }
              </p>
              <p className="text-xs text-gray-600">Tersisa</p>
            </div>
          </div>

          {/* Schedule List - COMPACT VERSION */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Detail Jadwal:
            </p>

            {/* Group by class untuk compact display */}
            {(() => {
              // Group schedules by class_id
              const groupedSchedules = schedules.reduce((acc, schedule) => {
                const classId = schedule.class_id;
                if (!acc[classId]) {
                  acc[classId] = [];
                }
                acc[classId].push(schedule);
                return acc;
              }, {});

              return Object.entries(groupedSchedules).map(
                ([classId, classSchedules]) => {
                  // Get overall status for this class group
                  const allFinished = classSchedules.every(
                    (s) =>
                      getClassStatus(s.start_time, s.end_time) === "finished"
                  );
                  const anyOngoing = classSchedules.some(
                    (s) =>
                      getClassStatus(s.start_time, s.end_time) === "ongoing"
                  );

                  const groupStatus = anyOngoing
                    ? "ongoing"
                    : allFinished
                    ? "finished"
                    : "upcoming";

                  // Get time range
                  const firstTime = classSchedules[0].start_time;
                  const lastTime =
                    classSchedules[classSchedules.length - 1].end_time;
                  const jpCount = classSchedules.length;

                  return (
                    <div
                      key={classId}
                      className={`
                      p-3 rounded-lg border-l-4 transition-all
                      ${
                        groupStatus === "ongoing"
                          ? "bg-green-50 border-green-500 shadow-md"
                          : groupStatus === "upcoming"
                          ? "bg-blue-50 border-blue-500"
                          : "bg-gray-50 border-gray-300 opacity-60"
                      }
                    `}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={`
                          w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-white font-bold text-sm
                          ${
                            groupStatus === "ongoing"
                              ? "bg-green-500"
                              : groupStatus === "upcoming"
                              ? "bg-blue-500"
                              : "bg-gray-400"
                          }
                        `}>
                            {jpCount}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-bold text-sm ${
                                groupStatus === "ongoing"
                                  ? "text-green-900"
                                  : groupStatus === "upcoming"
                                  ? "text-blue-900"
                                  : "text-gray-600"
                              }`}>
                              Kelas {classId}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock
                                size={11}
                                className={
                                  groupStatus === "ongoing"
                                    ? "text-green-600"
                                    : groupStatus === "upcoming"
                                    ? "text-blue-600"
                                    : "text-gray-500"
                                }
                              />
                              <p
                                className={`text-xs ${
                                  groupStatus === "ongoing"
                                    ? "text-green-700"
                                    : groupStatus === "upcoming"
                                    ? "text-blue-700"
                                    : "text-gray-500"
                                }`}>
                                {formatTime(firstTime)} - {formatTime(lastTime)}{" "}
                                • {jpCount} JP
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {groupStatus === "ongoing" && (
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                              BERLANGSUNG
                            </span>
                          )}
                          {groupStatus === "upcoming" && (
                            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                              AKAN DATANG
                            </span>
                          )}
                          {groupStatus === "finished" && (
                            <span className="bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded">
                              SELESAI
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
};

export default TodaySchedule;

import React from "react";
import { Users, Clock, CheckCircle } from "lucide-react";

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: "Total Konseling",
      value: stats.total,
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
      subText: stats.darurat > 0 ? `🚨 ${stats.darurat} Kasus Darurat` : null,
    },
    {
      title: "Dalam Proses",
      value: stats.dalam_proses,
      icon: Clock,
      color: "yellow",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      borderColor: "border-yellow-200",
      subText:
        stats.perlu_followup > 0
          ? `📅 ${stats.perlu_followup} Perlu Follow-up`
          : null,
    },
    {
      title: "Selesai",
      value: stats.selesai,
      icon: CheckCircle,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
      subText: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} border-2 ${card.borderColor} rounded-lg p-5 transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <p className={`text-3xl font-bold ${card.iconColor} mb-1`}>
                  {card.value}
                </p>
                {card.subText && (
                  <p className="text-xs font-medium text-gray-600">
                    {card.subText}
                  </p>
                )}
              </div>
              <div className={`${card.iconColor} opacity-20`}>
                <Icon size={48} strokeWidth={1.5} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;

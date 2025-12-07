import React from 'react';
import { Edit3, Trash2, Eye, FileText, AlertTriangle, Calendar } from 'lucide-react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const KonselingTable = ({ 
  data, 
  loading, 
  onView, 
  onEdit, 
  onDelete, 
  onExportPDF 
}) => {
  // Status Badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Dalam Proses': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Dalam Proses' },
      'Selesai': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Selesai' },
      'Dibatalkan': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Dibatalkan' }
    };

    const config = statusConfig[status] || statusConfig['Dalam Proses'];
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent size={12} />
        {config.label}
      </span>
    );
  };

  // ✅ NEW: Urgency Badge
  const getUrgencyBadge = (urgency) => {
    const urgencyConfig = {
      'Darurat': { color: 'bg-red-100 text-red-800 border border-red-300', emoji: '🔴', label: 'Darurat' },
      'Tinggi': { color: 'bg-orange-100 text-orange-800 border border-orange-300', emoji: '🟠', label: 'Tinggi' },
      'Sedang': { color: 'bg-yellow-100 text-yellow-800 border border-yellow-300', emoji: '🟡', label: 'Sedang' },
      'Rendah': { color: 'bg-green-100 text-green-800 border border-green-300', emoji: '🟢', label: 'Rendah' }
    };

    const config = urgencyConfig[urgency] || urgencyConfig['Sedang'];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${config.color}`}>
        <span>{config.emoji}</span>
        {config.label}
      </span>
    );
  };

  // ✅ NEW: Category Badge
  const getCategoryBadge = (category) => {
    const categoryConfig = {
      'Akademik': { color: 'bg-blue-100 text-blue-800', emoji: '📚' },
      'Perilaku': { color: 'bg-red-100 text-red-800', emoji: '⚠️' },
      'Sosial-Emosional': { color: 'bg-purple-100 text-purple-800', emoji: '😔' },
      'Pertemanan': { color: 'bg-indigo-100 text-indigo-800', emoji: '👥' },
      'Keluarga': { color: 'bg-amber-100 text-amber-800', emoji: '🏠' },
      'Percintaan': { color: 'bg-pink-100 text-pink-800', emoji: '💔' },
      'Teknologi/Gadget': { color: 'bg-cyan-100 text-cyan-800', emoji: '📱' },
      'Kenakalan': { color: 'bg-gray-700 text-white', emoji: '🚬' },
      'Kesehatan Mental': { color: 'bg-violet-100 text-violet-800', emoji: '🧠' },
      'Lainnya': { color: 'bg-gray-100 text-gray-800', emoji: '📋' }
    };

    const config = categoryConfig[category] || categoryConfig['Lainnya'];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
        <span>{config.emoji}</span>
        {category}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-8 text-center">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 mt-2">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-8 text-center text-gray-500">
          Tidak ada data konseling yang ditemukan
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Siswa
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Urgensi
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Layanan
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Guru BK
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      {item.full_name}
                      {/* ✅ NEW: Follow-up Badge */}
                      {item.perlu_followup && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium border border-purple-300" title="Perlu Follow-up">
                          <Calendar size={10} />
                          Follow-up
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      NIS: {item.nis} | Kelas: {item.class_id}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                  {item.perlu_followup && item.tanggal_followup && (
                    <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(item.tanggal_followup).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getUrgencyBadge(item.tingkat_urgensi)}
                </td>
                <td className="px-4 py-4">
                  {getCategoryBadge(item.kategori_masalah)}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">{item.jenis_layanan}</div>
                  <div className="text-xs text-gray-500">{item.bidang_bimbingan}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getStatusBadge(item.status_layanan)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {item.guru_bk_name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onView(item)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => onExportPDF(item)}
                      className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                      title="Export PDF"
                    >
                      <FileText size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id, item.full_name)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total: <strong>{data.length}</strong> data konseling</span>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              🔴 Darurat: <strong>{data.filter(d => d.tingkat_urgensi === 'Darurat').length}</strong>
            </span>
            <span className="flex items-center gap-1">
              📅 Follow-up: <strong>{data.filter(d => d.perlu_followup).length}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KonselingTable;
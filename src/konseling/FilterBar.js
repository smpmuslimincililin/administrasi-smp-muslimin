import React, { useState } from "react";
import { Search, Plus, Filter, X, ChevronDown, ChevronUp } from "lucide-react";

const FilterBar = ({
  filters,
  onFilterChange,
  onResetFilters,
  onOpenAddModal,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveAdvancedFilters =
    filters.tingkat_urgensi ||
    filters.kategori_masalah ||
    filters.perlu_followup ||
    filters.tanggalAwal ||
    filters.tanggalAkhir;

  const activeFilterCount = [
    filters.tingkat_urgensi,
    filters.kategori_masalah,
    filters.perlu_followup,
    filters.tanggalAwal,
    filters.tanggalAkhir,
  ].filter(Boolean).length;

  const clearFilter = (field) => {
    onFilterChange(field, "");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
      {/* Main Filter Bar - SINGLE ROW */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search - Flexible Width */}
          <div className="flex-1 relative min-w-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari nama siswa atau NIS..."
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Quick Filter: Status */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm min-w-[140px]">
            <option value="">Semua Status</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Selesai">Selesai</option>
          </select>

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm min-w-[140px] justify-center ${
              showAdvanced || hasActiveAdvancedFilters
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
            <Filter size={16} />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Tambah Data Button */}
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm hover:shadow min-w-[140px] justify-center">
            <Plus size={18} />
            <span>Tambah Data</span>
          </button>
        </div>

        {/* Active Filters Chips - Compact */}
        {(filters.search || filters.status) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                <Search size={12} />
                {filters.search}
                <button
                  onClick={() => clearFilter("search")}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                Status: {filters.status}
                <button
                  onClick={() => clearFilter("status")}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters - Collapsible */}
      {showAdvanced && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Tingkat Urgensi */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Tingkat Urgensi
              </label>
              <select
                value={filters.tingkat_urgensi}
                onChange={(e) =>
                  onFilterChange("tingkat_urgensi", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Semua Urgensi</option>
                <option value="Rendah">🟢 Rendah</option>
                <option value="Sedang">🟡 Sedang</option>
                <option value="Tinggi">🟠 Tinggi</option>
                <option value="Darurat">🔴 Darurat</option>
              </select>
            </div>

            {/* Kategori Masalah */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Kategori Masalah
              </label>
              <select
                value={filters.kategori_masalah}
                onChange={(e) =>
                  onFilterChange("kategori_masalah", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Semua Kategori</option>
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

            {/* Perlu Follow-up */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Follow-up
              </label>
              <select
                value={filters.perlu_followup}
                onChange={(e) =>
                  onFilterChange("perlu_followup", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Semua</option>
                <option value="true">✅ Perlu Follow-up</option>
                <option value="false">❌ Tidak Perlu</option>
              </select>
            </div>

            {/* Date Range - Combined */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Periode Tanggal
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.tanggalAwal}
                  onChange={(e) =>
                    onFilterChange("tanggalAwal", e.target.value)
                  }
                  className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                  placeholder="Dari"
                />
                <input
                  type="date"
                  value={filters.tanggalAkhir}
                  onChange={(e) =>
                    onFilterChange("tanggalAkhir", e.target.value)
                  }
                  className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                  placeholder="Sampai"
                />
              </div>
            </div>
          </div>

          {/* Advanced Filters Chips */}
          {hasActiveAdvancedFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
              {filters.tingkat_urgensi && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
                  Urgensi: {filters.tingkat_urgensi}
                  <button
                    onClick={() => clearFilter("tingkat_urgensi")}
                    className="ml-1 hover:bg-orange-200 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.kategori_masalah && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                  Kategori: {filters.kategori_masalah}
                  <button
                    onClick={() => clearFilter("kategori_masalah")}
                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.perlu_followup && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium">
                  Follow-up:{" "}
                  {filters.perlu_followup === "true" ? "Ya" : "Tidak"}
                  <button
                    onClick={() => clearFilter("perlu_followup")}
                    className="ml-1 hover:bg-indigo-200 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              )}
              {(filters.tanggalAwal || filters.tanggalAkhir) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-200 text-gray-700 rounded-md text-xs font-medium">
                  📅 {filters.tanggalAwal || "..."} -{" "}
                  {filters.tanggalAkhir || "..."}
                  <button
                    onClick={() => {
                      clearFilter("tanggalAwal");
                      clearFilter("tanggalAkhir");
                    }}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200">
                <X size={12} />
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;

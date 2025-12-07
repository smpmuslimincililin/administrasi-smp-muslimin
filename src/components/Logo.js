// src/components/Logo.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Logo = ({ 
  size = 'medium', 
  showFallback = true,
  className = '',
  onLogoLoad = () => {},
  variant = 'default' // tambahan prop untuk variant
}) => {
  const [logoData, setLogoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20', 
    large: 'w-28 h-28',
    xlarge: 'w-32 h-32'
  };

  // Style untuk variant white (logo jadi putih)
  const getVariantStyle = () => {
    if (variant === 'white') {
      return {
        filter: 'brightness(0) invert(1) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
      };
    }
    return {};
  };

  useEffect(() => {
    fetchLogoFromDatabase();
  }, []);

  const fetchLogoFromDatabase = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ GANTI .single() JADI .maybeSingle() untuk menghindari error 406
      const { data, error: dbError } = await supabase
        .from('school_settings')
        .select('setting_value')
        .eq('setting_key', 'school_logo')
        .maybeSingle(); // ✅ PERUBAHAN DI SINI!

      if (dbError) {
        console.log('Error fetching logo from database:', dbError);
        console.log('Menggunakan logo lokal sebagai fallback');
        setUseLocalFallback(true);
        onLogoLoad(true);
        return;
      }

      // ✅ AMBIL setting_value BUKAN school_logo
      if (data && data.setting_value) {
        console.log('✅ Logo berhasil dimuat dari database');
        setLogoData(data.setting_value);
        onLogoLoad(true);
      } else {
        console.log('Logo tidak ditemukan di database, menggunakan logo lokal');
        setUseLocalFallback(true);
        onLogoLoad(true);
      }
    } catch (err) {
      console.error('Error in fetchLogoFromDatabase:', err);
      console.log('Menggunakan logo lokal sebagai fallback');
      setUseLocalFallback(true);
      onLogoLoad(true);
    } finally {
      setLoading(false);
    }
  };

  // Tampilkan loading state
  if (loading) {
    return (
      <div 
        className={`${sizeClasses[size]} ${className} bg-gray-200 rounded-lg animate-pulse flex items-center justify-center`}
      >
        <div className="text-gray-400 text-xs">Loading...</div>
      </div>
    );
  }

  // Tampilkan logo dari file lokal jika diminta
  if (useLocalFallback) {
    return (
      <img 
        src="/logo_sekolah.png"
        alt="Logo Sekolah"
        className={`${sizeClasses[size]} ${className} object-contain rounded-lg`}
        style={getVariantStyle()}
        onError={(e) => {
          console.error('Error loading local logo, menggunakan emoji fallback');
          e.target.style.display = 'none';
          setError('Gagal memuat logo');
          setUseLocalFallback(false);
        }}
      />
    );
  }

  // Tampilkan logo dari database jika ada
  if (logoData && !error) {
    return (
      <img 
        src={logoData}
        alt="Logo Sekolah"
        className={`${sizeClasses[size]} ${className} object-contain rounded-lg`}
        style={getVariantStyle()}
        onError={(e) => {
          console.error('Error loading database logo, trying local fallback');
          setUseLocalFallback(true);
          e.target.style.display = 'none';
        }}
      />
    );
  }

  // Fallback terakhir: emoji school jika semua gagal
  if (showFallback) {
    return (
      <div 
        className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-white/30`}
      >
        <span className="text-4xl">🏫</span>
      </div>
    );
  }

  return null;
};

export default Logo;
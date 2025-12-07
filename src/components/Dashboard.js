import React, { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, User, School, Home } from 'lucide-react'
import AdminDashboard from './AdminDashboard'
import HomeroomTeacherDashboard from './HomeroomTeacherDashboard'
import TeacherDashboard from './TeacherDashboard'
import GuruBKDashboard from './GuruBKDashboard' 

const Dashboard = ({ user }) => {
  const [isLoading, setIsLoading] = useState(true)

  // Memoize user data untuk prevent unnecessary re-renders
  const memoizedUser = useMemo(() => {
    if (!user) return null
    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      teacher_id: user.teacher_id,
      homeroom_class_id: user.homeroom_class_id,
      email: user.email,
      is_active: user.is_active
    }
  }, [user?.id, user?.username, user?.role, user?.teacher_id, user?.homeroom_class_id])

  // Optimized loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Debug info - only in development
  useEffect(() => {
    if (memoizedUser && process.env.NODE_ENV === 'development') {
      console.log('🚀 Dashboard initialized:', memoizedUser)
    }
  }, [memoizedUser])

  // ✅ FIX: Role mapping yang sesuai dengan database SMP Muslimin Cililin
  const DashboardComponent = useMemo(() => {
    if (!memoizedUser) return null

    const userRole = memoizedUser.role?.toLowerCase()

    // ✅ ROLE MAPPING SESUAI DATABASE
    
    // 1. ADMIN
    if (userRole === 'admin') {
      return <AdminDashboard user={memoizedUser} />
    }

    // 2. GURU BK/BP - ✅ BARU DITAMBAHKAN
    if (userRole === 'guru_bk') {
      return <GuruBKDashboard user={memoizedUser} />
    }

    // 3. GURU WALI KELAS - Teacher dengan homeroom_class_id
    if (userRole === 'teacher' && memoizedUser.homeroom_class_id) {
      return <HomeroomTeacherDashboard user={memoizedUser} />
    }

    // 4. GURU BIASA - Teacher tanpa homeroom_class_id
    if (userRole === 'teacher') {
      return <TeacherDashboard user={memoizedUser} />
    }

    // Unknown role
    return <UnknownRoleView user={memoizedUser} />
  }, [memoizedUser])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-blue-600 font-medium">Menyiapkan Dashboard...</p>
        </div>
      </div>
    )
  }

  // No user
  if (!memoizedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-700 mb-2">Akses Ditolak</h2>
          <p className="text-red-600">Silakan login terlebih dahulu</p>
        </div>
      </div>
    )
  }

  return DashboardComponent
}

// Component untuk unknown role
const UnknownRoleView = ({ user }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 p-6 text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-700 mb-2">
            Role Tidak Dikenali
          </h3>
          <p className="text-red-600">
            Role "{user?.role}" tidak memiliki dashboard yang sesuai
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <User size={20} className="text-blue-600" />
                <span className="font-medium text-blue-800">User Info</span>
              </div>
              <div className="space-y-1 text-sm text-blue-700">
                <p><span className="font-medium">Username:</span> {user?.username}</p>
                <p><span className="font-medium">Nama:</span> {user?.full_name}</p>
                <p><span className="font-medium">ID:</span> {user?.id}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <School size={20} className="text-gray-600" />
                <span className="font-medium text-gray-800">Role Info</span>
              </div>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">Role:</span> {user?.role}</p>
                <p><span className="font-medium">Teacher ID:</span> {user?.teacher_id || '-'}</p>
                <p><span className="font-medium">Status:</span> {user?.is_active ? 'Aktif' : 'Non-aktif'}</p>
              </div>
            </div>
          </div>

          {/* Class Info jika ada */}
          {user?.homeroom_class_id && (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Home size={20} className="text-emerald-600" />
                <span className="font-medium text-emerald-800">Class Assignment</span>
              </div>
              <p className="text-sm text-emerald-700">
                <span className="font-medium">Homeroom Class ID:</span> {user.homeroom_class_id}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Refresh Dashboard
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem('user')
                window.location.href = '/login'
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Hubungi administrator sistem untuk menyesuaikan role dashboard
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Role yang didukung: admin, teacher, guru_bk
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default Dashboard
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppDispatch } from './store/hooks'
import { initializeAuth } from './store/slices/authSlice'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import { AdminLayout } from './components/admin/AdminLayout'
import { Dashboard } from './components/admin/Dashboard'
import AcademicYearsPage from './components/admin/pages/AcademicYearsPage'
import TermsPage from './components/admin/pages/TermsPage'
import ClassesPage from './components/admin/pages/ClassesPage'
import GradesPage from './components/admin/pages/GradesPage'
import { StudentsPage } from './components/admin/pages/StudentsPage'
import TariffsPage from './components/admin/pages/TariffsPage'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from 'react-hot-toast'

function App() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Initialize auth state from localStorage on app start
    dispatch(initializeAuth())
  }, [dispatch])

  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Academic Management */}
          <Route path="students" element={<StudentsPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="academic-years" element={<AcademicYearsPage />} />
          <Route path="terms" element={<TermsPage />} />
          
          {/* Financial Management */}
          <Route path="tariffs" element={<TariffsPage />} />
          <Route path="billing" element={<div className="p-6"><h1 className="text-2xl font-bold">Billing Management</h1><p className="text-muted-foreground">Generate and manage student bills and invoices.</p></div>} />
          <Route path="payments" element={<div className="p-6"><h1 className="text-2xl font-bold">Payments</h1><p className="text-muted-foreground">Track and process student payments.</p></div>} />
          <Route path="financial-reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Financial Reports</h1><p className="text-muted-foreground">View detailed financial reports and analytics.</p></div>} />
          
          {/* Administration */}
          <Route path="users" element={<div className="p-6"><h1 className="text-2xl font-bold">User Management</h1><p className="text-muted-foreground">Manage system users and permissions.</p></div>} />
          <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold">System Settings</h1><p className="text-muted-foreground">Configure system settings and preferences.</p></div>} />
          <Route path="notifications" element={<div className="p-6"><h1 className="text-2xl font-bold">Notifications</h1><p className="text-muted-foreground">Manage system notifications and alerts.</p></div>} />
          
          {/* Help & Support */}
          <Route path="support" element={<div className="p-6"><h1 className="text-2xl font-bold">Support</h1><p className="text-muted-foreground">Get help and support for the system.</p></div>} />
          <Route path="privacy" element={<div className="p-6"><h1 className="text-2xl font-bold">Privacy & Security</h1><p className="text-muted-foreground">Privacy settings and security configurations.</p></div>} />
          
          {/* User Profile */}
          <Route path="profile" element={<div className="p-6"><h1 className="text-2xl font-bold">User Profile</h1><p className="text-muted-foreground">Manage your profile and account settings.</p></div>} />
        </Route>
        
        {/* Legacy dashboard route - redirect to admin */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App

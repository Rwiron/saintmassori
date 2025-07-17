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
import BillingPage from './components/admin/pages/BillingPage'
import PaymentsPage from './components/admin/pages/PaymentsPage'
import ClassTariffReportsPage from './components/admin/pages/ClassTariffReportsPage'
import UserManagementPage from './components/admin/pages/UserManagementPage'
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
          <Route path="billing" element={<BillingPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          
          {/* Reports */}
          <Route path="reports/class-tariff" element={<ClassTariffReportsPage />} />
          <Route path="reports/financial" element={<div className="p-6"><h1 className="text-2xl font-bold">Financial Reports</h1><p className="text-muted-foreground">View detailed financial reports and analytics.</p></div>} />
          
          {/* Administration */}
          <Route path="users" element={<UserManagementPage />} />
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

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PrivacyProvider } from './contexts/PrivacyContext'
import { ToastProvider } from './components/ui/Toast'
import { Navbar } from './components/Navbar'
import { LandingPage } from './pages/LandingPage'
import { SignupPage } from './pages/SignupPage'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { UploadPage } from './pages/UploadPage'
import { FileDetailPage } from './pages/FileDetailPage'
import { ShareSettingsPage } from './pages/ShareSettingsPage'
import { ShareAccessPage } from './pages/ShareAccessPage'
import ShareTracePage from './pages/ShareTracePage'
import { InboxPage } from './pages/InboxPage'
import { SecureNotePage } from './pages/SecureNotePage'
import { SettingsPage } from './pages/SettingsPage'
import { DeviceManagementPage } from './pages/DeviceManagementPage'
import { HelpCenterPage } from './pages/HelpCenterPage'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}

const PublicRoute = ({ children, allowReturnUrl = false }) => {
  const { isAuthenticated } = useAuth()

  // If there's a returnUrl in localStorage, allow access even if authenticated
  // This handles the case where a logged-in user accesses a restricted share link
  if (allowReturnUrl && localStorage.getItem('returnUrl')) {
    return children
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />
}

function AppContent() {
  const { isAuthenticated } = useAuth()

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute allowReturnUrl={true}>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        } />
        <Route path="/files/:id" element={
          <ProtectedRoute>
            <FileDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/share/:id" element={
          <ProtectedRoute>
            <ShareSettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/share-link/:linkId/trace" element={
          <ProtectedRoute>
            <ShareTracePage />
          </ProtectedRoute>
        } />
        <Route path="/inbox" element={
          <ProtectedRoute>
            <InboxPage />
          </ProtectedRoute>
        } />
        <Route path="/secure-note" element={
          <ProtectedRoute>
            <SecureNotePage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/devices" element={
          <ProtectedRoute>
            <DeviceManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/help" element={<HelpCenterPage />} />
        {/* Public share access page - accessible without login for public links */}
        <Route path="/share/public/:token" element={<ShareAccessPage />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PrivacyProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </PrivacyProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App

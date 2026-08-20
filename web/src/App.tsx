import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { AuthProvider } from "@/providers/AuthProvider"
import { ProfileProvider } from "@/providers/ProfileProvider"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

const Login = lazy(() => import("@/pages/Login"))
const Register = lazy(() => import("@/pages/Register"))
const Dashboard = lazy(() => import("@/pages/Dashboard"))
const Transactions = lazy(() => import("@/pages/Transactions"))
const Recurring = lazy(() => import("@/pages/Recurring"))
const Settings = lazy(() => import("@/pages/Settings"))
const Categories = lazy(() => import("@/pages/Categories"))
const Wallets = lazy(() => import("@/pages/Wallets"))
const Budgets = lazy(() => import("@/pages/Budgets"))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <ProfileProvider>
                    <div className="min-h-screen bg-background">
                      <Sidebar />
                      <main id="main-content" tabIndex={-1} className="lg:pl-[240px]">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/transactions" element={<Transactions />} />
                          <Route path="/recurring" element={<Recurring />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/settings/categories" element={<Categories />} />
                          <Route path="/settings/wallets" element={<Wallets />} />
                          <Route path="/settings/budgets" element={<Budgets />} />
                        </Routes>
                      </main>
                      <BottomNav />
                    </div>
                  </ProfileProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}

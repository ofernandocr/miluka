import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import Dashboard from "@/pages/Dashboard"
import Transactions from "@/pages/Transactions"
import Categories from "@/pages/Categories"
import Wallets from "@/pages/Wallets"
import Budgets from "@/pages/Budgets"
import Recurring from "@/pages/Recurring"
import Settings from "@/pages/Settings"

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background">
                <Sidebar />
                <main id="main-content" tabIndex={-1} className="lg:pl-[240px]">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/wallets" element={<Wallets />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/recurring" element={<Recurring />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </main>
                <BottomNav />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

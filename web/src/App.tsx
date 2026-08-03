import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { Navbar } from "@/components/layout/Navbar"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import Dashboard from "@/pages/Dashboard"
import Transactions from "@/pages/Transactions"
import Categories from "@/pages/Categories"
import Wallets from "@/pages/Wallets"
import Budgets from "@/pages/Budgets"
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
                <Navbar />
                <main id="main-content" tabIndex={-1}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/wallets" element={<Wallets />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

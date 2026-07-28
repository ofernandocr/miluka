export const mockCategories = [
  { id: "1", user_id: "user-1", name: "Food", icon: "🍔", color: "#ef4444", type: "expense", created_at: "2026-01-01T00:00:00Z" },
  { id: "2", user_id: "user-1", name: "Transport", icon: "🚗", color: "#f97316", type: "expense", created_at: "2026-01-01T00:00:00Z" },
  { id: "3", user_id: "user-1", name: "Salary", icon: "💰", color: "#22c55e", type: "income", created_at: "2026-01-01T00:00:00Z" },
]

export const mockTransactions = [
  { id: "t1", user_id: "user-1", category_id: "1", amount: 450.50, description: "Supermarket", date: "2026-07-26", type: "expense", created_at: "2026-07-26T00:00:00Z", updated_at: "2026-07-26T00:00:00Z" },
  { id: "t2", user_id: "user-1", category_id: "3", amount: 5000, description: "Monthly salary", date: "2026-07-01", type: "income", created_at: "2026-07-01T00:00:00Z", updated_at: "2026-07-01T00:00:00Z" },
]

export const mockUser = { id: "user-1", email: "test@example.com" }

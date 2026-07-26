export type TransactionType = "expense" | "income"

export interface Profile {
  id: string
  name: string | null
  currency: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  type: TransactionType
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string
  amount: number
  description: string | null
  date: string
  type: TransactionType
  created_at: string
  updated_at: string
  category?: Category
}

export type NewTransaction = Pick<Transaction, "amount" | "description" | "date" | "type" | "category_id">

export type NewCategory = Pick<Category, "name" | "icon" | "color" | "type">

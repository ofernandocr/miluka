export type TransactionType = "expense" | "income"

export interface Profile {
  id: string
  name: string | null
  currency: string
  created_at: string
}

export interface Wallet {
  id: string
  user_id: string
  name: string
  currency: string
  icon: string
  color: string
  created_at: string
}

export type NewWallet = Pick<Wallet, "name" | "currency" | "icon" | "color">

export interface Category {
  id: string
  user_id: string | null
  name: string
  icon: string
  color: string
  type: TransactionType
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  wallet_id: string | null
  category_id: string
  amount: number
  description: string | null
  date: string
  type: TransactionType
  created_at: string
  updated_at: string
  category?: Category
  wallet?: Wallet
}

export type NewTransaction = Pick<Transaction, "amount" | "description" | "date" | "type" | "category_id" | "wallet_id">

export type NewCategory = Pick<Category, "name" | "icon" | "color" | "type">

export interface Budget {
  id: string
  user_id: string
  amount: number
  category_id: string | null
  wallet_id: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  category?: Category
  wallet?: Wallet
}

export type NewBudget = Pick<Budget, "amount" | "category_id" | "wallet_id" | "start_date" | "end_date">

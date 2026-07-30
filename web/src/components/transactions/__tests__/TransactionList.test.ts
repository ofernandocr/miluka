import { describe, it, expect } from "vitest"
import type { Transaction, Wallet } from "@/lib/types"

interface WalletGroup {
  wallet: Wallet | null
  transactions: Transaction[]
  totalExpense: number
  totalIncome: number
}

function groupByWallet(
  transactions: Transaction[],
  wallets: Wallet[]
): WalletGroup[] {
  const walletMap = new Map(wallets.map((w) => [w.id, w]))
  const groups = new Map<string, Transaction[]>()

  for (const tx of transactions) {
    const key = tx.wallet_id ?? "__none__"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  }

  const result: WalletGroup[] = []
  for (const [key, txs] of groups) {
    const wallet = key === "__none__" ? null : (walletMap.get(key) ?? null)
    const totalExpense = txs
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const totalIncome = txs
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)
    result.push({ wallet, transactions: txs, totalExpense, totalIncome })
  }

  result.sort((a, b) => {
    if (!a.wallet) return 1
    if (!b.wallet) return -1
    return a.wallet.name.localeCompare(b.wallet.name)
  })

  return result
}

const mockWallets: Wallet[] = [
  { id: "w1", user_id: "user-1", name: "General", currency: "MXN", icon: "💼", color: "#6b7280", created_at: "2026-01-01T00:00:00Z" },
  { id: "w2", user_id: "user-1", name: "Savings", currency: "USD", icon: "🏦", color: "#3b82f6", created_at: "2026-01-01T00:00:00Z" },
]

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: "t-" + Math.random(),
    user_id: "user-1",
    category_id: "1",
    wallet_id: "w1",
    amount: 100,
    description: "Test",
    date: "2026-07-26",
    type: "expense",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("groupByWallet", () => {
  it("groups transactions by wallet", () => {
    const transactions = [
      makeTx({ wallet_id: "w1" }),
      makeTx({ wallet_id: "w1" }),
      makeTx({ wallet_id: "w2" }),
    ]
    const result = groupByWallet(transactions, mockWallets)
    expect(result).toHaveLength(2)
    const general = result.find((g) => g.wallet?.name === "General")!
    expect(general.transactions).toHaveLength(2)
    const savings = result.find((g) => g.wallet?.name === "Savings")!
    expect(savings.transactions).toHaveLength(1)
  })

  it("handles transactions without wallet_id", () => {
    const transactions = [
      makeTx({ wallet_id: null }),
      makeTx({ wallet_id: "w1" }),
    ]
    const result = groupByWallet(transactions, mockWallets)
    expect(result).toHaveLength(2)
    const noWalletGroup = result.find((g) => g.wallet === null)
    expect(noWalletGroup).toBeDefined()
    expect(noWalletGroup!.transactions).toHaveLength(1)
  })

  it("sorts wallets alphabetically, no-wallet group last", () => {
    const transactions = [
      makeTx({ wallet_id: "w2" }),
      makeTx({ wallet_id: null }),
      makeTx({ wallet_id: "w1" }),
    ]
    const result = groupByWallet(transactions, mockWallets)
    expect(result[0]!.wallet?.name).toBe("General")
    expect(result[1]!.wallet?.name).toBe("Savings")
    expect(result[2]!.wallet).toBeNull()
  })

  it("calculates total expense and income per wallet", () => {
    const transactions = [
      makeTx({ wallet_id: "w1", type: "expense", amount: 100 }),
      makeTx({ wallet_id: "w1", type: "expense", amount: 200 }),
      makeTx({ wallet_id: "w1", type: "income", amount: 500 }),
      makeTx({ wallet_id: "w2", type: "expense", amount: 50 }),
    ]
    const result = groupByWallet(transactions, mockWallets)
    const general = result.find((g) => g.wallet?.name === "General")!
    expect(general.totalExpense).toBe(300)
    expect(general.totalIncome).toBe(500)

    const savings = result.find((g) => g.wallet?.name === "Savings")!
    expect(savings.totalExpense).toBe(50)
    expect(savings.totalIncome).toBe(0)
  })

  it("returns empty array for no transactions", () => {
    expect(groupByWallet([], mockWallets)).toHaveLength(0)
  })
})

import {
  formatCurrency,
  formatDate,
  getCurrencySymbol,
  formatAmountCompact,
  cn,
  CURRENCIES,
} from "@/lib/utils"

describe("formatCurrency", () => {
  it("formats MXN currency by default", () => {
    expect(formatCurrency(1234.56)).toBe("MX$1,234.56")
  })

  it("formats USD currency", () => {
    expect(formatCurrency(99.9, "USD")).toBe("$99.90")
  })

  it("formats EUR currency", () => {
    expect(formatCurrency(50, "EUR")).toBe("€50.00")
  })

  it("formats zero", () => {
    expect(formatCurrency(0, "MXN")).toBe("MX$0.00")
  })

  it("formats negative amounts", () => {
    expect(formatCurrency(-100, "USD")).toBe("-$100.00")
  })
})

describe("formatDate", () => {
  it("formats a valid date string", () => {
    const result = formatDate("2026-07-15T12:00:00")
    expect(result).toContain("Jul")
    expect(result).toContain("2026")
  })

  it("handles date strings consistently", () => {
    const result = formatDate("2026-01-01T12:00:00")
    expect(result).toContain("Jan")
    expect(result).toContain("2026")
  })
})

describe("getCurrencySymbol", () => {
  it("returns correct symbol for MXN", () => {
    expect(getCurrencySymbol("MXN")).toBe("MX$")
  })

  it("returns correct symbol for USD", () => {
    expect(getCurrencySymbol("USD")).toBe("$")
  })

  it("returns correct symbol for EUR", () => {
    expect(getCurrencySymbol("EUR")).toBe("€")
  })

  it("returns the code itself for unknown currency", () => {
    expect(getCurrencySymbol("XYZ")).toBe("XYZ")
  })

  it("returns correct symbol for GBP", () => {
    expect(getCurrencySymbol("GBP")).toBe("£")
  })
})

describe("formatAmountCompact", () => {
  it("returns compact millions", () => {
    expect(formatAmountCompact(1_500_000)).toBe("1.5M")
    expect(formatAmountCompact(2_000_000)).toBe("2.0M")
  })

  it("returns compact thousands", () => {
    expect(formatAmountCompact(3_400)).toBe("3.4k")
    expect(formatAmountCompact(10_000)).toBe("10.0k")
    expect(formatAmountCompact(1_000)).toBe("1.0k")
  })

  it("returns full format for small amounts", () => {
    expect(formatAmountCompact(500)).toBe("500.00")
    expect(formatAmountCompact(0)).toBe("0.00")
  })
})

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500")
    expect(result).toBe("text-blue-500")
  })

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra")
    expect(result).toContain("base")
    expect(result).toContain("extra")
    expect(result).not.toContain("hidden")
  })
})

describe("CURRENCIES", () => {
  it("contains 9 currencies", () => {
    expect(CURRENCIES).toHaveLength(9)
  })

  it("has MXN as first currency", () => {
    expect(CURRENCIES[0].code).toBe("MXN")
  })

  it("all currencies have code, symbol, and name", () => {
    for (const c of CURRENCIES) {
      expect(c.code).toBeTruthy()
      expect(c.symbol).toBeTruthy()
      expect(c.name).toBeTruthy()
    }
  })
})

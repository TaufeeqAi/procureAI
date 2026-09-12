import type { LandedCostBreakdown } from "@/types/quote";
import type { CurrencyCode, Money } from "@/types/common";

/**
 * The one place landed cost is computed anywhere in this codebase. Every
 * screen that shows a total (Quote Comparison, Purchase Order) calls this
 * rather than re-deriving the arithmetic inline — the GST-total bug caught
 * earlier in this project's history happened precisely because a display
 * value was hand-typed instead of computed. In Phase 3+ this same function
 * (or its direct backend port) is what the truth engine calls; nothing
 * about the formula should change when it moves server-side.
 */
export function computeLandedCost(
  quantity: number,
  unitPrice: number,
  freight: number,
  taxRatePercent: number,
  currency: CurrencyCode = "INR",
): LandedCostBreakdown {
  const subtotalAmount = quantity * unitPrice;
  const taxableAmount = subtotalAmount + freight;
  const taxAmount = Math.round(taxableAmount * (taxRatePercent / 100));
  const totalAmount = taxableAmount + taxAmount;

  const money = (amount: number): Money => ({ currency, amount });

  return {
    subtotal: money(subtotalAmount),
    freight: money(freight),
    taxAmount: money(taxAmount),
    taxRatePercent,
    total: money(totalAmount),
  };
}

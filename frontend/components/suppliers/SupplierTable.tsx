import Link from "next/link";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { RiskBadge } from "@/components/procurement/badges";
import { routes } from "@/lib/constants/routes";
import type { SupplierListItem } from "@/types/supplier";

export function SupplierTable({ suppliers }: { suppliers: SupplierListItem[] }) {
  return (
    <Table>
      <TableHead>
        <tr>
          <TableHeaderCell>Supplier</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell className="text-right">Quality</TableHeaderCell>
          <TableHeaderCell className="text-right">OTD</TableHeaderCell>
          <TableHeaderCell className="text-right">Purchases</TableHeaderCell>
          <TableHeaderCell>Risk</TableHeaderCell>
        </tr>
      </TableHead>
      <TableBody>
        {suppliers.map((supplier) => (
          <TableRow key={supplier.id} clickable>
            <TableCell>
              <Link href={routes.supplier(supplier.code)} className="font-medium text-ink-primary hover:text-brand">
                {supplier.name}
              </Link>
              <p className="text-xs text-ink-tertiary">{supplier.categories.join(", ")}</p>
            </TableCell>
            <TableCell>
              <Badge tone={supplier.approvalStatus === "APPROVED" ? "success" : "warning"}>
                {supplier.approvalStatus.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums text-ink-secondary">
              {(supplier.performance.qualityAcceptanceRate * 100).toFixed(1)}%
            </TableCell>
            <TableCell className="text-right tabular-nums text-ink-secondary">
              {(supplier.performance.onTimeDeliveryRate * 100).toFixed(0)}%
            </TableCell>
            <TableCell className="text-right tabular-nums text-ink-secondary">{supplier.performance.totalPurchases}</TableCell>
            <TableCell>
              <RiskBadge level={supplier.riskLevel} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import Link from "next/link";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { PRStatusBadge } from "@/components/procurement/badges";
import { formatDate, formatMoneyCompact } from "@/lib/utils/format";
import { routes } from "@/lib/constants/routes";
import type { PurchaseRequisition } from "@/types/procurement";

export function PRTable({ requisitions }: { requisitions: PurchaseRequisition[] }) {
  return (
    <Table>
      <TableHead>
        <tr>
          <TableHeaderCell>PR number</TableHeaderCell>
          <TableHeaderCell>Material</TableHeaderCell>
          <TableHeaderCell className="text-right">Qty</TableHeaderCell>
          <TableHeaderCell>Required</TableHeaderCell>
          <TableHeaderCell className="text-right">Value</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </tr>
      </TableHead>
      <TableBody>
        {requisitions.map((pr) => (
          <TableRow key={pr.id} clickable>
            <TableCell>
              <Link href={routes.requisition(pr.prNumber)} className="entity-code font-medium text-ink-primary hover:text-brand">
                {pr.prNumber}
              </Link>
            </TableCell>
            <TableCell>
              <span className="text-ink-primary">{pr.material.materialName}</span>
              {pr.material.partCode && <span className="ml-1.5 text-xs text-ink-tertiary">{pr.material.partCode}</span>}
            </TableCell>
            <TableCell className="text-right tabular-nums text-ink-secondary">{pr.material.quantity}</TableCell>
            <TableCell className="text-ink-secondary">{formatDate(pr.requiredDate)}</TableCell>
            <TableCell className="text-right tabular-nums text-ink-secondary">
              {pr.estimatedValue ? formatMoneyCompact(pr.estimatedValue) : "—"}
            </TableCell>
            <TableCell>
              <PRStatusBadge status={pr.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

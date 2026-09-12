import { PRWorkspaceTabs } from "@/components/layout/PRWorkspaceTabs";

export default async function RequisitionWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ prNumber: string }>;
}) {
  const { prNumber } = await params;
  return (
    <div>
      <PRWorkspaceTabs prNumber={prNumber} />
      {children}
    </div>
  );
}
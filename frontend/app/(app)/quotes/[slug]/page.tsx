import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuoteExtraction } from "@/components/quotes/QuoteExtraction";
import { getQuoteDetail } from "@/lib/api/queries";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug };
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const quote = await getQuoteDetail(slug);
  if (!quote) notFound();

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Quotes", href: routes.quotes() }, { label: slug }]}
        title={`${quote.supplierName} — ${slug}`}
      />
      <div className="max-w-xl">
        <QuoteExtraction quote={quote} />
      </div>
    </div>
  );
}


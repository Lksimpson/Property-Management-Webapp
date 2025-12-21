import Link from 'next/link';
import TransactionImportClient from '@/src/components/TransactionImportClient';

export default async function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: propertyId } = await params;
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 pb-12 pt-10 lg:px-10">
        {/* Header */}
        <header className="mb-8">
          <Link
            href={`/properties/${propertyId}`}
            className="mb-6 inline-flex items-center text-sm text-slate-400 hover:text-slate-200 transition"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to property
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Import transactions
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Upload CSV or XLSX files. We'll validate and preview before inserting.
          </p>
        </header>

        {/* Import Form */}
        <TransactionImportClient propertyId={propertyId} />
      </div>
    </div>
  );
}

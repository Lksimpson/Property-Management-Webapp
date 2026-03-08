"use client";

import Link from "next/link";

type Tab = {
  key: string;
  label: string;
};

const TABS: Tab[] = [
  { key: "overview", label: "Overview" },
  { key: "transactions", label: "Transactions" },
  { key: "budgets", label: "Budgets" },
  { key: "tenants", label: "Tenants" },
];

type Props = {
  propertyId: string;
  activeTab: string;
};

export default function PropertyTabNav({ propertyId, activeTab }: Props) {
  return (
    <nav className="sticky top-0 z-10 mb-8 -mx-6 px-6 backdrop-blur-sm border-b border-slate-800/80 bg-slate-950/80 lg:-mx-10 lg:px-10">
      <div className="flex gap-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/properties/${propertyId}?tab=${tab.key}`}
              className={`px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                isActive
                  ? "border-emerald-400 text-slate-50"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

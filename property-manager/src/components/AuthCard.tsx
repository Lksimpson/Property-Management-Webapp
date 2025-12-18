"use client";

import React from "react";

export default function AuthCard({
  title,
  children,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <main className="auth-card">
        {title && (
          <h1 className="mb-6 text-2xl font-semibold text-gray-900">
            {title}
          </h1>
        )}
        {children}
      </main>
    </div>
  );
}

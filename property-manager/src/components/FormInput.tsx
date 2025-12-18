"use client";

import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function FormInput({ label, className = "", ...props }: Props) {
  return (
    <div className="flex w-full flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input {...props} className={`form-input ${className}`} />
    </div>
  );
}

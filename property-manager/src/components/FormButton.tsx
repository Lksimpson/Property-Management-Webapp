"use client";

import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function FormButton({ children, className = "", ...props }: Props) {
  return (
    <button {...props} className={`form-btn ${className}`} type="submit">
      {children}
    </button>
  );
}

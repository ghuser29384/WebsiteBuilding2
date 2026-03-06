import React from "react";

type PrimaryButtonProps = {
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  href?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function PrimaryButton({
  children,
  ariaLabel,
  className = "",
  href,
  ...props
}: PrimaryButtonProps) {
  const baseClass =
    "inline-flex min-h-11 items-center justify-center rounded-full border border-transparent bg-cta px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2";

  if (href) {
    return (
      <a
        href={href}
        aria-label={ariaLabel}
        className={`${baseClass} ${className}`.trim()}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      {...props}
      aria-label={ariaLabel}
      className={`${baseClass} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

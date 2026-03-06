import React from "react";

type SecondaryButtonProps = {
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  href?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function SecondaryButton({
  children,
  ariaLabel,
  className = "",
  href,
  ...props
}: SecondaryButtonProps) {
  const baseClass =
    "inline-flex min-h-11 items-center justify-center rounded-full border border-accent-2/30 bg-surface px-5 py-3 text-sm font-semibold text-text-default transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2";

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

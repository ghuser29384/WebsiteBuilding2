import React from "react";

type SiteNavItem = {
  href: string;
  label: string;
};

type SiteNavProps = {
  brand?: string;
  items: SiteNavItem[];
};

export function SiteNav({ brand = "Normativity", items }: SiteNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-accent-2/15 bg-surface/90 backdrop-blur">
      <nav
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3"
        aria-label="Primary navigation"
      >
        <a
          href="/"
          className="text-lg font-semibold text-text-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
        >
          {brand}
        </a>

        <ul className="flex flex-wrap items-center gap-2">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-text-default transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

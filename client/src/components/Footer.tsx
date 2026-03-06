import React from "react";

type FooterLink = {
  href: string;
  label: string;
};

type FooterProps = {
  note?: string;
  links?: FooterLink[];
};

export function Footer({
  note = "Openly examine beliefs, understand others, and act on considered judgment.",
  links = [],
}: FooterProps) {
  return (
    <footer className="mt-16 border-t border-accent-2/15 bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-text">{note}</p>

        <ul className="flex flex-wrap gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-text-default hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

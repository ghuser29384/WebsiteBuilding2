import React from "react";

type CardProps = {
  title: string;
  children: React.ReactNode;
  href?: string;
};

export function Card({ title, children, href }: CardProps) {
  const card = (
    <article className="rounded-lg border border-accent-2/15 bg-surface p-6 text-text-surface shadow-sm transition-shadow hover:shadow-md">
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-2 text-text-default/85">{children}</div>
    </article>
  );

  if (!href) {
    return card;
  }

  return (
    <a
      href={href}
      className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-2"
    >
      {card}
    </a>
  );
}

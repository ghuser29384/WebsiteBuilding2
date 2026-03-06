import React from "react";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

type HeroProps = {
  kicker?: string;
  title: string;
  subtitle: string;
  primaryText?: string;
  secondaryText?: string;
  primaryHref?: string;
  secondaryHref?: string;
  visual?: React.ReactNode;
};

export function Hero({
  kicker = "Normativity",
  title,
  subtitle,
  primaryText = "Get Started",
  secondaryText = "Learn More",
  primaryHref = "#get-started",
  secondaryHref = "#learn-more",
  visual,
}: HeroProps) {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 py-14 md:py-16"
      aria-labelledby="hero-title"
    >
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-text">{kicker}</p>
          <h1
            id="hero-title"
            className="mt-2 text-4xl font-bold leading-tight text-text-default md:text-5xl"
          >
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-text md:text-lg">{subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton href={primaryHref} ariaLabel={primaryText}>
              {primaryText}
            </PrimaryButton>
            <SecondaryButton href={secondaryHref} ariaLabel={secondaryText}>
              {secondaryText}
            </SecondaryButton>
          </div>
        </div>

        <div
          className="rounded-lg border border-accent-2/15 bg-surface p-6 shadow-sm"
          role="img"
          aria-label="Hero visual placeholder"
        >
          {visual}
        </div>
      </div>
    </section>
  );
}

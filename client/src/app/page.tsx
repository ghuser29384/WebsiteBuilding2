import React from "react";
import { Card } from "../components/Card";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { SiteNav } from "../components/SiteNav";

export default function Page() {
  return (
    <div className="min-h-screen bg-bg text-text-default">
      <SiteNav
        items={[
          { href: "#market", label: "Market" },
          { href: "#publications", label: "Publications" },
          { href: "#wre", label: "WRE Assistant" },
        ]}
      />

      <Hero
        kicker="Normativity Platform"
        title="Deliberation without contempt"
        subtitle="Track confidence, test principles, and act on considered beliefs."
        primaryText="Get Started"
        secondaryText="Learn Methodology"
        primaryHref="#market"
        secondaryHref="#wre"
        visual={
          <div>
            <p className="text-lg font-semibold text-text-surface">Reflective Equilibrium Workspace</p>
            <p className="mt-2 text-sm text-muted-text">
              Placeholder panel for chart/illustration. Keep existing logos and media assets unchanged.
            </p>
          </div>
        }
      />

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Moral Credence Market" href="#market">
          Allocate weekly credence tokens across normative propositions and inspect trend lines.
        </Card>

        <Card title="Publication + Annotation" href="#publications">
          Publish arguments, mention users, and discuss highlighted passages with contextual replies.
        </Card>

        <Card title="WRE Assistant" href="#wre">
          Iterate considered judgments, principles, and background theories toward better coherence.
        </Card>
      </main>

      <Footer
        links={[
          { href: "/normative-issues.html", label: "Normativity Guide" },
          { href: "/profile.html", label: "Profile" },
        ]}
      />
    </div>
  );
}

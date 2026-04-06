import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { getDashboardMetrics, getSources } from "@/lib/queries";

const steps = [
  {
    number: "01",
    label: "Ingest",
    title: "Watch every feed that matters",
    body: "Track OpenAI, Anthropic, and YouTube sources in one unified pipeline instead of juggling browser tabs and half-broken alerts."
  },
  {
    number: "02",
    label: "Distill",
    title: "Turn raw noise into crisp signal",
    body: "GPT-generated digests condense every article into a readable briefing so the reading load stays bounded."
  },
  {
    number: "03",
    label: "Deliver",
    title: "Send a personal issue, not a blast",
    body: "Each signed-in user owns a profile, ranking preferences, and a delivery inbox, so the briefing feels personal by default."
  }
] as const;

const trustBadges = [
  "Clerk-authenticated profiles",
  "Vercel-native cron",
  "Per-user email delivery",
  "GPT-4 powered ranking"
] as const;

const checklistItems = [
  "Clerk account creates a dedicated profile row",
  "Interests and delivery email stay scoped per user",
  "Manual runs are attributed to the signed-in account",
  "Email previews and sends stay tied to that person"
] as const;

const journeyCards = [
  {
    step: "01",
    route: "/sign-up",
    title: "Create your account",
    body: "Register once so the app can give you a personal workspace, delivery identity, and saved briefing context."
  },
  {
    step: "02",
    route: "/profile",
    title: "Set your briefing profile",
    body: "Add interests, expertise level, and delivery preferences so ranking and email output match what matters to you."
  },
  {
    step: "03",
    route: "/sources",
    title: "Choose the sources to watch",
    body: "Turn feeds on or off to shape the signal that enters your desk instead of consuming one generic stream."
  },
  {
    step: "04",
    route: "/pipeline",
    title: "Run the pipeline",
    body: "Use the Pipeline page as the control room for ingestion, digest generation, and delivery prep."
  }
] as const;

const pipelineLanes = [
  {
    label: "Ingest",
    title: "Pull fresh stories and transcripts",
    body: "Collects the latest AI updates from the sources you activated."
  },
  {
    label: "Digest",
    title: "Condense the reading load",
    body: "Turns long posts and videos into concise summaries you can scan quickly."
  },
  {
    label: "Deliver",
    title: "Prepare your personal issue",
    body: "Ranks the strongest items for the signed-in user and builds an email-ready briefing."
  }
] as const;

export default async function LandingPage() {
  const { userId } = await auth();
  const [metrics, sources] = await Promise.all([getDashboardMetrics(), getSources()]);

  return (
    <div className="lp-shell">
      <div className="lp-bg-mesh" aria-hidden="true" />

      <header className="lp-nav-wrap">
        <nav className="lp-nav">
          <Link href="/" className="lp-wordmark">
            AI News Desk
          </Link>
          <div className="lp-nav-actions">
            <Link href={userId ? "/dashboard" : "/sign-in"} className="lp-nav-link">
              {userId ? "Dashboard" : "Sign in"}
            </Link>
            <Link href={userId ? "/profile" : "/sign-up"} className="lp-btn lp-btn--solid">
              {userId ? "Edit profile" : "Create account"}
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-container lp-hero-inner">
            <div className="lp-hero-copy">
              <div className="lp-live-badge" aria-label="Live source monitoring">
                <span className="lp-pulse-dot" aria-hidden="true" />
                Live · 3 sources active
              </div>

              <h1 className="lp-headline">
                Your AI news,
                <br />
                <span className="lp-headline-accent">distilled daily.</span>
              </h1>

              <p className="lp-subheadline">
                AI News Desk scrapes Anthropic, OpenAI, and YouTube, generates concise GPT digests, then delivers a
                ranked, personalized issue directly to the signed-in user.
              </p>

              <div className="lp-hero-actions">
                <Link href={userId ? "/dashboard" : "/sign-up"} className="lp-btn lp-btn--primary">
                  {userId ? "Go to dashboard" : "Start free"}
                </Link>
                <Link href={userId ? "/pipeline" : "/sign-in"} className="lp-btn lp-btn--ghost">
                  {userId ? "Run the pipeline" : "See the app"}
                </Link>
              </div>

              <div className="lp-trust-badges">
                {trustBadges.map((badge) => (
                  <span key={badge} className="lp-badge-chip">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <aside className="lp-dashboard-card">
              <div className="lp-card-header">
                <span className="lp-card-label">Live operating view</span>
                <span className="lp-card-status">{userId ? "Signed in" : "Public preview"}</span>
              </div>

              <div className="lp-metrics-grid">
                <div className="lp-metric-tile">
                  <strong className="lp-metric-value">{metrics.totalSources}</strong>
                  <span className="lp-metric-label">Active sources</span>
                </div>
                <div className="lp-metric-tile">
                  <strong className="lp-metric-value">{metrics.articlesLast24h}</strong>
                  <span className="lp-metric-label">Stories / 24h</span>
                </div>
                <div className="lp-metric-tile">
                  <strong className="lp-metric-value">{metrics.digestsReady}</strong>
                  <span className="lp-metric-label">Digests ready</span>
                </div>
              </div>

              <div className="lp-source-list">
                <p className="lp-source-list-heading">Source pipeline</p>
                {sources.slice(0, 4).map((source) => (
                  <div key={source.slug} className="lp-source-row">
                    <span
                      className={`lp-source-dot${source.isActive ? " lp-source-dot--active" : ""}`}
                      aria-hidden="true"
                    />
                    <div className="lp-source-info">
                      <strong>{source.label}</strong>
                      <span>{source.kind === "youtube" ? "Video source" : "Editorial feed"}</span>
                    </div>
                    <span className={`lp-source-status${source.isActive ? " lp-source-status--active" : ""}`}>
                      {source.isActive ? "Online" : "Paused"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="lp-scanline" aria-hidden="true" />
            </aside>
          </div>
        </section>

        <section className="lp-steps">
          <div className="lp-container">
            <div className="lp-section-label">How it works</div>
            <div className="lp-steps-grid">
              {steps.map((step) => (
                <article key={step.number} className="lp-step-card">
                  <div className="lp-step-top-accent" aria-hidden="true" />
                  <span className="lp-step-number">{step.number}</span>
                  <span className="lp-step-label-pill">{step.label}</span>
                  <h2 className="lp-step-title">{step.title}</h2>
                  <p className="lp-step-body">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-onboard">
          <div className="lp-container">
            <div className="lp-section-label">How to use the app</div>
            <div className="lp-onboard-grid">
              <article className="lp-onboard-panel lp-onboard-panel--journey">
                <div className="lp-onboard-head">
                  <div>
                    <p className="lp-feature-eyebrow">New user flow</p>
                    <h2 className="lp-feature-title">The product teaches you the workflow.</h2>
                  </div>
                  <p className="lp-onboard-copy">
                    The old command list is now translated into the actual product journey. A new user signs in, tunes
                    a profile, selects sources, then runs the desk from Pipeline.
                  </p>
                </div>

                <div className="lp-journey-stack">
                  {journeyCards.map((card) => (
                    <article key={card.step} className="lp-journey-card">
                      <div className="lp-journey-index">
                        <span className="lp-journey-step">{card.step}</span>
                        <span className="lp-journey-line" aria-hidden="true" />
                      </div>
                      <div className="lp-journey-body">
                        <span className="lp-route-pill">{card.route}</span>
                        <h3>{card.title}</h3>
                        <p>{card.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </article>

              <article className="lp-onboard-panel lp-onboard-panel--ops">
                <div className="lp-onboard-head">
                  <div>
                    <p className="lp-feature-eyebrow lp-feature-eyebrow--amber">Pipeline control room</p>
                    <h2 className="lp-feature-title">Pipeline is the main operating surface.</h2>
                  </div>
                  <p className="lp-onboard-copy">
                    Once setup is complete, users do the important work in one place. The system flows from ingest to
                    digest to delivery without exposing terminal commands.
                  </p>
                </div>

                <div className="lp-ops-board">
                  {pipelineLanes.map((lane) => (
                    <div key={lane.label} className="lp-ops-lane">
                      <div className="lp-ops-label-row">
                        <span className="lp-ops-chip">{lane.label}</span>
                        <span className="lp-ops-status">Run from /pipeline</span>
                      </div>
                      <h3>{lane.title}</h3>
                      <p>{lane.body}</p>
                    </div>
                  ))}

                  <div className="lp-ops-footer">
                    <div className="lp-ops-outcome">
                      <span className="lp-ops-outcome-label">Outcome</span>
                      <strong>Personalized AI briefing, ready for the inbox</strong>
                      <p>Curated for the signed-in user, previewed inside the app, then prepared for email delivery.</p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="lp-feature-grid">
          <div className="lp-container lp-feature-grid-inner">
            <article className="lp-feature-panel lp-feature-panel--left">
              <p className="lp-feature-eyebrow">Why this feels different</p>
              <h2 className="lp-feature-title">Built like a product, not a script with a frontend taped on.</h2>
              <p className="lp-feature-body">
                The stack is fully Vercel-native. Auth, cron execution, route handlers, ranking, and email generation
                all live in one app surface with no split deployment and no separate worker host.
              </p>
              <div className="lp-feature-stat-row">
                <div className="lp-feature-stat">
                  <strong>3</strong>
                  <span>content sources</span>
                </div>
                <div className="lp-feature-stat">
                  <strong>GPT-4</strong>
                  <span>ranking model</span>
                </div>
                <div className="lp-feature-stat">
                  <strong>1 app</strong>
                  <span>deployment surface</span>
                </div>
              </div>
            </article>

            <article className="lp-feature-panel lp-feature-panel--right">
              <p className="lp-feature-eyebrow lp-feature-eyebrow--amber">For each user</p>
              <h2 className="lp-feature-title">Personal profile in, personal issue out.</h2>
              <ul className="lp-checklist">
                {checklistItems.map((item) => (
                  <li key={item} className="lp-checklist-item">
                    <span className="lp-check-icon" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-container">
            <div className="lp-cta-inner">
              <div className="lp-cta-grid-bg" aria-hidden="true" />
              <p className="lp-cta-kicker">Ready to ship</p>
              <h2 className="lp-cta-title">Launch the briefing engine and let each user own their signal.</h2>
              <p className="lp-cta-body">
                Deploy on Vercel, let users sign in with Clerk, and deliver ranked AI briefings that reflect each
                person instead of sending the same issue to everyone.
              </p>
              <div className="lp-cta-actions">
                <Link href={userId ? "/dashboard" : "/sign-up"} className="lp-btn lp-btn--primary">
                  {userId ? "Enter dashboard" : "Create your account"}
                </Link>
                <Link href={userId ? "/profile" : "/sign-in"} className="lp-btn lp-btn--ghost">
                  {userId ? "Tune your profile" : "Sign in"}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <span className="lp-footer-brand">AI News Desk</span>
        <span className="lp-footer-copy">Built on Vercel · Powered by OpenAI · Auth by Clerk</span>
      </footer>
    </div>
  );
}

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { toggleSourceAction } from "@/app/actions";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";

export default async function SourcesPage() {
  const user = await requireAuthenticatedUser();
  const data = await getDashboardData(user);

  return (
    <AppShell currentPath="/sources" userLabel={user.email || user.name}>
      <section className="page-header">
        <div>
          <p className="eyebrow">Coverage</p>
          <h2>Source management</h2>
        </div>
        <p className="muted">Enable, pause, or inspect the feeds driving the desk.</p>
      </section>

      <section className="source-list">
        {data.sources.map((source) => (
          <article key={source.slug} className="panel source-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">{source.kind}</p>
                <h3>{source.label}</h3>
              </div>
              <StatusPill tone={source.isActive ? "success" : "neutral"}>
                {source.isActive ? "active" : "paused"}
              </StatusPill>
            </div>
            <p>{source.description}</p>
            <a className="inline-link" href={source.url} target="_blank" rel="noreferrer">
              {source.url}
            </a>
            <form action={toggleSourceAction} className="inline-form">
              <input type="hidden" name="slug" value={source.slug} />
              <input type="hidden" name="nextState" value={String(!source.isActive)} />
              <button className="button button-secondary" type="submit">
                {source.isActive ? "Pause source" : "Reactivate source"}
              </button>
            </form>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

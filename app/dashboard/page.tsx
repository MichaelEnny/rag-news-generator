import { AppShell } from "@/components/app-shell";
import { DigestCard } from "@/components/digest-card";
import { MetricCard } from "@/components/metric-card";
import { StatusPill } from "@/components/status-pill";
import { requireAuthenticatedUser } from "@/lib/auth";
import { formatTimestamp } from "@/lib/format";
import { getDashboardData } from "@/lib/queries";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const data = await getDashboardData(user);
  const lastJob = data.recentJobs[0];

  return (
    <AppShell currentPath="/dashboard" userLabel={user.email || user.name}>
      <section className="hero-grid">
        <MetricCard
          label="Sources online"
          value={data.metrics.totalSources}
          detail="Active feeds available to the pipeline."
          accent={<StatusPill tone="success">Healthy</StatusPill>}
        />
        <MetricCard
          label="Articles in 24h"
          value={data.metrics.articlesLast24h}
          detail="New candidate items pulled into the desk."
        />
        <MetricCard
          label="Digests ready"
          value={data.metrics.digestsReady}
          detail="Summaries prepared for ranking and delivery."
        />
      </section>

      <section className="dashboard-grid">
        <div className="stack">
          <article className="panel lead-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Run Pulse</p>
                <h2>Latest system activity</h2>
              </div>
              <StatusPill
                tone={
                  data.metrics.lastRunStatus === "success"
                    ? "success"
                    : data.metrics.lastRunStatus === "failed"
                      ? "error"
                      : "warning"
                }
              >
                {data.metrics.lastRunStatus}
              </StatusPill>
            </div>
            <p className="lead-copy">
              {lastJob
                ? `Last ${lastJob.stage} run started ${formatTimestamp(lastJob.startedAt)} and finished ${formatTimestamp(
                    lastJob.finishedAt
                  )}.`
                : "No persisted run has been recorded yet."}
            </p>
            <div className="job-list compact">
              {data.recentJobs.map((job) => (
                <div key={job.id} className="job-row">
                  <div>
                    <strong>{job.stage}</strong>
                    <p className="muted">{formatTimestamp(job.startedAt)}</p>
                  </div>
                  <StatusPill
                    tone={job.status === "success" ? "success" : job.status === "failed" ? "error" : "warning"}
                  >
                    {job.status}
                  </StatusPill>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Delivery preview</p>
                <h2>Latest email issue</h2>
              </div>
            </div>
            {data.emailPreview ? (
              <>
                <p className="muted">{data.emailPreview.subject}</p>
                <p className="lead-copy">{data.emailPreview.introduction}</p>
                <div className="preview-box">
                  <p>{data.emailPreview.greeting}</p>
                </div>
              </>
            ) : (
              <p className="lead-copy">No email preview exists yet. Run the pipeline to generate the first issue.</p>
            )}
          </article>
        </div>

        <article className="panel digest-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Top signal</p>
              <h2>Ranked digests</h2>
            </div>
            <p className="muted">{data.databaseConfigured ? "Live database mode" : "Sample mode until DATABASE_URL is set"}</p>
          </div>
          <div className="digest-grid">
            {data.digests.map((digest) => (
              <DigestCard key={digest.id} digest={digest} />
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}

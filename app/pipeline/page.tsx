import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { runPipelineAction } from "@/app/actions";
import { requireAuthenticatedUser } from "@/lib/auth";
import { formatTimestamp } from "@/lib/format";
import { getDashboardData } from "@/lib/queries";

const stages = [
  { value: "full", label: "Run full pipeline", detail: "Ingest, digest, curate, and prepare delivery." },
  { value: "ingest", label: "Run ingestion only", detail: "Refresh feeds and transcripts." },
  { value: "digest", label: "Generate digests", detail: "Summarize new articles that are ready." },
  { value: "email", label: "Prepare delivery", detail: "Rank digests and create the email issue." }
] as const;

export default async function PipelinePage() {
  const user = await requireAuthenticatedUser();
  const data = await getDashboardData(user);

  return (
    <AppShell currentPath="/pipeline" userLabel={user.email || user.name}>
      <section className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Pipeline studio</h2>
        </div>
        <p className="muted">Manual control surface for the Vercel-native jobs.</p>
      </section>

      <section className="pipeline-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Run controls</p>
              <h3>Trigger stages</h3>
            </div>
          </div>
          <div className="stage-list">
            {stages.map((stage) => (
              <form key={stage.value} action={runPipelineAction} className="stage-row">
                <input type="hidden" name="stage" value={stage.value} />
                <div>
                  <strong>{stage.label}</strong>
                  <p className="muted">{stage.detail}</p>
                </div>
                <button className="button" type="submit">
                  Run
                </button>
              </form>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h3>Job history</h3>
            </div>
          </div>
          <div className="job-list">
            {data.recentJobs.map((job) => (
              <div key={job.id} className="job-row expanded">
                <div>
                  <p className="eyebrow">{job.trigger}</p>
                  <strong>{job.stage}</strong>
                  <p className="muted">
                    {formatTimestamp(job.startedAt)}
                    {job.finishedAt ? ` -> ${formatTimestamp(job.finishedAt)}` : ""}
                  </p>
                </div>
                <div className="job-side">
                  <StatusPill tone={job.status === "success" ? "success" : job.status === "failed" ? "error" : "warning"}>
                    {job.status}
                  </StatusPill>
                  <code>{JSON.stringify(job.summary)}</code>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}

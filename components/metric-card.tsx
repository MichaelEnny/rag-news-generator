import { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
  accent?: ReactNode;
};

export function MetricCard({ label, value, detail, accent }: MetricCardProps) {
  return (
    <article className="panel metric-card">
      <p className="eyebrow">{label}</p>
      <div className="metric-row">
        <strong>{value}</strong>
        {accent}
      </div>
      <p className="muted">{detail}</p>
    </article>
  );
}

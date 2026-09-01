import { flags, projects } from "../api/mockData";
import { useRole } from "../auth/roleContext";
import { FlagCard } from "../components/FlagCard";
import { DeadlineForecastBadge } from "../components/DeadlineForecastBadge";
import { AuditTrailViewer } from "../components/AuditTrailViewer";
export function Dashboard({title}: {title: string}) {
  const {user} = useRole(); const key = user.role === "mp" ? "constituency_code" : user.role === "state_nodal" ? "state" : "district";
  const visible = user.role === "ministry" ? projects : projects.filter(p => (p as Record<string, unknown>)[key] === (user as Record<string, unknown>)[key]);
  const visibleFlags = flags.filter(f => visible.some(p => p.id === f.project_id));
  return <main><h1>{title}</h1><p className="notice">Synthetic demo data. Flags are explainable review signals, not accusations.</p><div className="stats"><b>{visible.length} projects</b><b>{visibleFlags.length} review flags</b></div><h2>Projects</h2><table><thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Deadline</th></tr></thead><tbody>{visible.map(p => <tr key={p.id}><td>{p.title}</td><td>{p.status}</td><td>{p.physical_progress_percent}%</td><td><DeadlineForecastBadge hasRisk={p.status === "delayed" || (p.physical_progress_percent < 25 && p.utilized_amount / p.sanctioned_amount > .7)} /></td></tr>)}</tbody></table><h2>Review flags</h2>{visibleFlags.map(flag => <FlagCard key={flag.id} flag={flag}/>) }{user.role === "ministry" && <AuditTrailViewer />}</main>;
}

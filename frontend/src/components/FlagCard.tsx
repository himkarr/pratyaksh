import type { Flag } from "../api/mockData";
export function FlagCard({flag}: {flag: Flag}) { return <article className={`flag ${flag.severity}`}><b>{flag.severity.toUpperCase()} · {flag.origin}</b><p>{flag.reason}</p><small>Confidence: {Math.round(flag.confidence * 100)}% · Human review required</small></article>; }

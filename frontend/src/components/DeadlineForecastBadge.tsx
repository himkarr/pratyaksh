export function DeadlineForecastBadge({hasRisk}: {hasRisk: boolean}) { return <span className={hasRisk ? "badge risk" : "badge"}>{hasRisk ? "Deadline risk: review" : "No forecast risk"}</span>; }

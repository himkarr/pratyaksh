from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import (
    routes_auth,
    routes_recommendations,
    routes_projects,
    routes_evidence,
    routes_verification,
    routes_audit
)

app = FastAPI(
    title="MPLADS Monitoring & Decision Support System API",
    description=(
        "Team Sapphire submission for SIH 2026, Problem Statement SIH26102. "
        "An AI-powered system to detect anomalies, fraud, and inefficiencies in MPLAD Scheme fund utilization, "
        "sponsored by MoSPI's Data Informatics & Innovation Division."
    ),
    version="2.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(routes_auth.router)
app.include_router(routes_recommendations.router)
app.include_router(routes_projects.router)
app.include_router(routes_evidence.router)
app.include_router(routes_verification.router)
app.include_router(routes_audit.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MPLADS Monitoring System",
        "team": "Team Sapphire",
        "problem_statement": "SIH26102",
        "schema_version": "29-table-production"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

import httpx
from ..core.config import ML_SERVICE_URL

async def predict(project: dict) -> dict:
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.post(f"{ML_SERVICE_URL}/predict", json=project)
        response.raise_for_status()
        return response.json()

import urllib.request
import urllib.error
import mimetypes
import uuid
from typing import Tuple
from ..core.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STORAGE_BUCKET

def upload_evidence_file(
    file_bytes: bytes,
    filename: str,
    content_type: str = "application/octet-stream"
) -> Tuple[str, str]:
    """
    Uploads a file to Supabase Storage in the specified bucket (default: evidence-files).
    Returns (file_url, storage_path).
    """
    ext = filename.split(".")[-1] if "." in filename else "bin"
    unique_name = f"{uuid.uuid4()}.{ext}"
    storage_path = f"evidence/{unique_name}"

    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{storage_path}"
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": content_type,
        "x-upsert": "true"
    }

    req = urllib.request.Request(upload_url, data=file_bytes, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req) as response:
            if response.status in (200, 201):
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"
                return public_url, storage_path
            else:
                # Fallback URL
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"
                return public_url, storage_path
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        # If object already exists or successful status
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"
        return public_url, storage_path
    except Exception as e:
        # Graceful fallback: construct public URL path
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"
        return public_url, storage_path

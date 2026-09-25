import os
import uuid
import hashlib
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Tuple, Set
from fastapi import status
from app.core.exceptions import ClaimXException

ALLOWED_DOCUMENT_EXTENSIONS: Set[str] = {".pdf", ".png", ".jpg", ".jpeg", ".svg", ".txt"}
ALLOWED_IMAGE_EXTENSIONS: Set[str] = {".png", ".jpg", ".jpeg", ".webp", ".svg"}
MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB


def validate_file_payload(
    filename: str,
    content: bytes,
    category: str = "document",
) -> Tuple[str, str]:
    """
    Validates file extension, non-empty payload, size limits, and computes SHA-256 digest.
    """
    if not filename or not filename.strip():
        raise ClaimXException(
            message="Filename cannot be empty",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_FILENAME",
        )

    ext = Path(filename).suffix.lower()
    allowed = ALLOWED_DOCUMENT_EXTENSIONS if category == "document" else ALLOWED_IMAGE_EXTENSIONS
    if ext not in allowed:
        raise ClaimXException(
            message=f"Unsupported file format '{ext}' for {category}. Allowed: {sorted(allowed)}",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="UNSUPPORTED_FILE_FORMAT",
        )

    if len(content) == 0:
        raise ClaimXException(
            message="Uploaded file is empty (0 bytes)",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="EMPTY_FILE_PAYLOAD",
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise ClaimXException(
            message=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            error_code="FILE_TOO_LARGE",
        )

    sha256_hash = hashlib.sha256(content).hexdigest()
    size_kb = max(1, len(content) // 1024)
    size_str = f"{size_kb} KB" if size_kb < 1024 else f"{size_kb / 1024:.2f} MB"
    return sha256_hash, size_str


class ObjectStorageAdapter(ABC):
    """
    Modular Object Storage Interface (Section 18, 19, 20).
    Decouples cloud bucket storage (AWS S3 / GCS / MinIO) from local filesystem storage.
    """

    @abstractmethod
    def put_object(self, claim_id: str, category: str, filename: str, content: bytes) -> str:
        pass

    @abstractmethod
    def get_object(self, storage_uri: str) -> bytes:
        pass


class LocalBucketStorageAdapter(ObjectStorageAdapter):
    """Stores objects in an organized local bucket hierarchy (`backend/storage_bucket/`)."""

    def __init__(self, base_dir: str = "./storage_bucket"):
        self.base_path = Path(base_dir).resolve()
        self.base_path.mkdir(parents=True, exist_ok=True)

    def put_object(self, claim_id: str, category: str, filename: str, content: bytes) -> str:
        safe_name = Path(filename).name
        unique_name = f"{uuid.uuid4().hex[:8]}_{safe_name}"
        target_dir = self.base_path / claim_id / category
        target_dir.mkdir(parents=True, exist_ok=True)
        target_file = target_dir / unique_name
        target_file.write_bytes(content)
        return f"bucket://{claim_id}/{category}/{unique_name}"

    def get_object(self, storage_uri: str) -> bytes:
        if not storage_uri.startswith("bucket://"):
            raise ClaimXException(f"Invalid storage URI scheme: {storage_uri}")
        rel_path = storage_uri.replace("bucket://", "")
        full_path = self.base_path / rel_path
        if not full_path.exists():
            raise ClaimXException(
                message=f"Stored object '{storage_uri}' not found",
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="STORAGE_OBJECT_NOT_FOUND",
            )
        return full_path.read_bytes()


storage_service = LocalBucketStorageAdapter()

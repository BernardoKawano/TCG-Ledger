"""Scanner API schemas."""
from uuid import UUID

from pydantic import BaseModel


class ScanCandidate(BaseModel):
    card_variant_id: UUID
    confidence: float
    card: dict  # {name, set, image_url}


class ScanResponse(BaseModel):
    scan_id: str
    candidates: list[ScanCandidate]

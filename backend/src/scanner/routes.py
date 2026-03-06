"""Scanner API routes."""
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.scanner.vision import get_vision_client
from src.scanner.matcher import match_ocr_to_catalog
from src.scanner.storage import upload_scan
from src.scanner.schemas import ScanResponse, ScanCandidate

router = APIRouter(prefix="/scan", tags=["scan"])


@router.post("", response_model=ScanResponse)
async def scan_card(
    image: UploadFile = File(...),
    tcg_id: UUID | None = Form(None),
    session_id: str | None = Form(None),
    db: Session = Depends(get_db),
):
    """
    Upload card image, run OCR, match against catalog.
    Returns candidate cards sorted by confidence.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Expected image file")

    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="Image too large")

    try:
        vision = get_vision_client()
        ocr_text = vision.extract_text(contents)
    except RuntimeError as e:
        # Fallback: use empty text and return no candidates (manual search)
        ocr_text = ""
        # In production, log the error

    # Store image (optional)
    upload_scan(contents, image.content_type or "image/jpeg")

    candidates = match_ocr_to_catalog(db, ocr_text, tcg_id=tcg_id, limit=10)

    return ScanResponse(
        scan_id=str(uuid4()),
        candidates=[
            ScanCandidate(
                card_variant_id=v.id,
                confidence=round(conf, 2),
                card={
                    "name": v.card.name,
                    "set": v.card.card_set.name if v.card.card_set else "",
                    "image_url": v.card.image_url,
                },
            )
            for v, conf in candidates
        ],
    )

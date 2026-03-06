"""Exports API routes."""
import json
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
import io

from src.core.database import get_db
from src.auth.dependencies import get_current_user
from src.models.user import User
from src.models.export import ExportJob
from src.exports.service import ExportService

router = APIRouter(prefix="/exports", tags=["exports"])


@router.post("")
def request_export(
    format: str = Query("json"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Request collection export. Returns export data directly for MVP.
    In production would enqueue job and return job_id for polling.
    """
    if format not in ("json", "csv"):
        raise HTTPException(status_code=400, detail="Format must be json or csv")

    job = ExportJob(user_id=current_user.id, format_=format, status="processing")
    db.add(job)
    db.commit()

    try:
        if format == "json":
            content = ExportService.generate_json(db, current_user.id)
            job.status = "done"
            db.commit()
            return JSONResponse(content=json.loads(content))
        else:
            content = ExportService.generate_csv(db, current_user.id)
            job.status = "done"
            db.commit()
            return StreamingResponse(
                io.BytesIO(content.encode("utf-8")),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=collection.csv"},
            )
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{export_id}")
def get_export_status(
    export_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get export job status (and download URL when done)."""
    job = db.query(ExportJob).filter(
        ExportJob.id == export_id,
        ExportJob.user_id == current_user.id,
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Export not found")
    return {
        "id": str(job.id),
        "status": job.status,
        "format": job.format_,
        "file_url": job.file_url,
        "error_message": job.error_message,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }

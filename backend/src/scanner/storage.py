"""S3-compatible storage for scan images."""
from uuid import uuid4
from typing import BinaryIO

from src.core.config import settings


def upload_scan(image_bytes: bytes, content_type: str = "image/jpeg") -> str:
    """
    Upload scan image to S3. Returns object key.
    Falls back to no-op (returns fake key) if S3 not configured.
    """
    if not settings.aws_access_key_id and not settings.s3_endpoint_url:
        return f"scans/local/{uuid4()}.jpg"  # Local dev fallback

    import boto3
    from botocore.config import Config

    client = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        region_name=settings.s3_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        config=Config(signature_version="s3v4"),
    )
    key = f"scans/{uuid4()}.jpg"
    client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=image_bytes,
        ContentType=content_type,
    )
    return key


def get_presigned_url(key: str, expires_in: int = 3600) -> str | None:
    """Get presigned URL for scan image."""
    if not settings.aws_access_key_id and not settings.s3_endpoint_url:
        return None

    import boto3

    client = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        region_name=settings.s3_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=expires_in,
    )

"""Vision API integration - Google Vision or AWS Rekognition."""
from typing import Protocol
import io

from src.core.config import settings


class VisionClient(Protocol):
    """Protocol for vision OCR clients."""

    def extract_text(self, image_bytes: bytes) -> str:
        """Extract text from image using OCR."""
        ...


class GoogleVisionClient:
    """Google Cloud Vision OCR."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from google.cloud import vision
            self._client = vision.ImageAnnotatorClient()
        return self._client

    def extract_text(self, image_bytes: bytes) -> str:
        from google.cloud import vision
        client = self._get_client()
        image = vision.Image(content=image_bytes)
        response = client.text_detection(image=image)
        if response.error.message:
            raise RuntimeError(f"Vision API error: {response.error.message}")
        texts = response.text_annotations
        if not texts:
            return ""
        return texts[0].description.strip()


class MockVisionClient:
    """Mock client when no Vision API configured - returns empty for dev."""

    def extract_text(self, image_bytes: bytes) -> str:
        return ""


def get_vision_client() -> VisionClient:
    """Return configured vision client."""
    if settings.use_aws_rekognition:
        try:
            return AWSRekognitionClient()
        except Exception:
            return MockVisionClient()
    try:
        return GoogleVisionClient()
    except Exception:
        return MockVisionClient()


class AWSRekognitionClient:
    """AWS Rekognition OCR fallback."""

    def __init__(self):
        import boto3
        self._client = boto3.client("rekognition")

    def extract_text(self, image_bytes: bytes) -> str:
        response = self._client.detect_text(Image={"Bytes": image_bytes})
        texts = [d["DetectedText"] for d in response.get("TextDetections", []) if d["Type"] == "LINE"]
        return "\n".join(texts) if texts else ""

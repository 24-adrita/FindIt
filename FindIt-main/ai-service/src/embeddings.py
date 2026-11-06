import os
import hashlib
import logging
from pathlib import Path
from typing import Optional, Union, Dict, Any, List
import numpy as np

try:
    import torch
    _TORCH_AVAILABLE = True
except ImportError:
    torch = None  # type: ignore
    _TORCH_AVAILABLE = False

try:
    from PIL import Image
except ImportError:
    Image = None  # type: ignore

from .config import UPLOADS_DIR
from .models_loader import get_model_manager

logger = logging.getLogger("findit.embeddings")

# In-memory LRU/Hash caches for embeddings
# Keyed by SHA-256 of contents to automatically invalidate when content changes
_IMAGE_CACHE: Dict[str, np.ndarray] = {}
_TEXT_CACHE: Dict[str, np.ndarray] = {}
MAX_CACHE_ENTRIES = 2000

def _prune_cache_if_needed(cache_dict: dict):
    if len(cache_dict) > MAX_CACHE_ENTRIES:
        # Simple FIFO removal of oldest 20%
        keys_to_remove = list(cache_dict.keys())[: int(MAX_CACHE_ENTRIES * 0.2)]
        for k in keys_to_remove:
            cache_dict.pop(k, None)

def resolve_safe_image_path(image_identifier: str) -> Optional[Path]:
    """
    Safely resolves an image path or URL path to a local file in UPLOADS_DIR,
    preventing path traversal attacks.
    """
    if not image_identifier:
        return None

    # Strip URL prefix if an HTTP URL was passed (e.g. http://localhost:5000/uploads/item-123.jpg)
    if "uploads/" in image_identifier:
        filename = image_identifier.split("uploads/")[-1].strip("/")
    else:
        filename = Path(image_identifier).name

    # Check for path traversal attempts
    target_path = (UPLOADS_DIR / filename).resolve()
    try:
        # Verify target is strictly inside UPLOADS_DIR
        target_path.relative_to(UPLOADS_DIR.resolve())
    except ValueError:
        logger.warning(f"Path traversal attempt rejected: {image_identifier}")
        return None

    if target_path.is_file():
        return target_path
    return None

def generate_image_embedding(image_source: Union[str, Path, "Image.Image"]) -> Optional[np.ndarray]:
    """
    Generates a 512-dimensional L2-normalized OpenCLIP visual embedding vector.
    Returns None if image is missing, corrupt, or model is not loaded.
    """
    if Image is None:
        logger.warning("Pillow not installed; cannot process images.")
        return None

    mgr = get_model_manager()
    if not mgr.clip_ready:
        mgr.load_clip()
        if not mgr.clip_ready:
            logger.warning("OpenCLIP model not ready; cannot generate image embedding.")
            return None

    pil_image = None
    cache_key = None

    if isinstance(image_source, Image.Image):
        pil_image = image_source.convert("RGB")
        cache_key = hashlib.sha256(pil_image.tobytes()[:2048]).hexdigest()
    else:
        resolved_path = resolve_safe_image_path(str(image_source))
        if not resolved_path:
            return None

        try:
            with open(resolved_path, "rb") as f:
                content_bytes = f.read()
            cache_key = hashlib.sha256(content_bytes).hexdigest()

            if cache_key in _IMAGE_CACHE:
                return _IMAGE_CACHE[cache_key]

            pil_image = Image.open(resolved_path).convert("RGB")
        except Exception as e:
            logger.warning(f"Could not load image file {resolved_path}: {e}")
            return None

    if cache_key and cache_key in _IMAGE_CACHE:
        return _IMAGE_CACHE[cache_key]

    try:
        # OpenCLIP vision inference
        if not _TORCH_AVAILABLE or torch is None:
            logger.warning("torch not available; cannot run CLIP inference.")
            return None

        image_tensor = mgr.clip_preprocess(pil_image).unsqueeze(0).to(mgr.device)

        with torch.no_grad():
            features = mgr.clip_model.encode_image(image_tensor)
            # L2 normalize vector for cosine similarity
            features /= features.norm(dim=-1, keepdim=True)
            vector = features.cpu().numpy().flatten().astype(np.float32)

        if cache_key:
            _prune_cache_if_needed(_IMAGE_CACHE)
            _IMAGE_CACHE[cache_key] = vector

        return vector
    except Exception as e:
        logger.error(f"Error encoding image with OpenCLIP: {e}")
        return None

def build_report_text(report: Dict[str, Any]) -> str:
    """
    Combines report text fields into a consistent natural language description
    for Sentence Transformers semantic representation.
    Note: secretVerificationDetail is strictly excluded!
    """
    parts = []
    title = (report.get("title") or "").strip()
    if title:
        parts.append(title)

    category = (report.get("category") or "").strip()
    if category:
        parts.append(f"Category: {category}")

    brand = (report.get("brand") or "").strip()
    if brand:
        parts.append(f"Brand: {brand}")

    primary_color = (report.get("primaryColor") or "").strip()
    secondary_color = (report.get("secondaryColor") or "").strip()
    if primary_color and primary_color != "None":
        color_str = primary_color
        if secondary_color and secondary_color != "None":
            color_str += f" and {secondary_color}"
        parts.append(f"Colors: {color_str}")

    desc = (report.get("description") or "").strip()
    if desc:
        parts.append(f"Description: {desc}")

    unique_marks = (report.get("uniqueMarks") or "").strip()
    if unique_marks:
        parts.append(f"Distinctive features: {unique_marks}")

    return ". ".join(parts) if parts else "Unknown lost or found campus item"

def generate_text_embedding(text_or_report: Union[str, Dict[str, Any]]) -> Optional[np.ndarray]:
    """
    Generates a 384-dimensional L2-normalized Sentence Transformers embedding vector.
    """
    mgr = get_model_manager()
    if not mgr.sbert_ready:
        mgr.load_sbert()
        if not mgr.sbert_ready:
            logger.warning("Sentence Transformers model not ready; cannot generate text embedding.")
            return None

    if isinstance(text_or_report, dict):
        text = build_report_text(text_or_report)
    else:
        text = str(text_or_report).strip()

    if not text:
        text = "Empty item report description"

    cache_key = hashlib.sha256(text.encode("utf-8")).hexdigest()
    if cache_key in _TEXT_CACHE:
        return _TEXT_CACHE[cache_key]

    try:
        # S-BERT encode with automatic L2 normalization
        vector = mgr.sbert_model.encode(
            text,
            normalize_embeddings=True,
            show_progress_bar=False,
            convert_to_numpy=True,
        ).flatten().astype(np.float32)

        _prune_cache_if_needed(_TEXT_CACHE)
        _TEXT_CACHE[cache_key] = vector
        return vector
    except Exception as e:
        logger.error(f"Error encoding text with Sentence Transformers: {e}")
        return None

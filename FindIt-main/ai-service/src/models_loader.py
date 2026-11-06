import logging
from typing import Optional, Tuple, Any

try:
    import torch
    _TORCH_AVAILABLE = True
except ImportError:
    torch = None  # type: ignore
    _TORCH_AVAILABLE = False

try:
    import open_clip
except ImportError:
    open_clip = None

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

from .config import CLIP_MODEL_NAME, CLIP_PRETRAINED, SBERT_MODEL_NAME

logger = logging.getLogger("findit.models")

class ModelManager:
    """
    Singleton manager for loading and holding OpenCLIP and Sentence Transformers models in memory.
    Ensures models are loaded once and reused across all incoming requests.
    """
    _instance: Optional["ModelManager"] = None

    def __init__(self):
        self.device = "cuda" if (_TORCH_AVAILABLE and torch.cuda.is_available()) else "cpu"
        self.clip_model = None
        self.clip_preprocess = None
        self.clip_tokenizer = None
        self.sbert_model = None

        self.clip_ready = False
        self.sbert_ready = False
        self.clip_error: Optional[str] = None
        self.sbert_error: Optional[str] = None

    @classmethod
    def get_instance(cls) -> "ModelManager":
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def load_clip(self) -> bool:
        """Load OpenCLIP visual model and transform pipeline once."""
        if self.clip_ready:
            return True
        if not _TORCH_AVAILABLE:
            self.clip_error = "torch is not installed in the environment."
            logger.error(self.clip_error)
            return False
        if open_clip is None:
            self.clip_error = "open_clip_torch is not installed in the environment."
            logger.error(self.clip_error)
            return False

        try:
            logger.info(f"Loading OpenCLIP model ({CLIP_MODEL_NAME}, pretrained={CLIP_PRETRAINED}) on {self.device}...")
            model, _, preprocess = open_clip.create_model_and_transforms(
                CLIP_MODEL_NAME, pretrained=CLIP_PRETRAINED
            )
            model.to(self.device)
            model.eval()

            self.clip_model = model
            self.clip_preprocess = preprocess
            self.clip_tokenizer = open_clip.get_tokenizer(CLIP_MODEL_NAME)
            self.clip_ready = True
            logger.info("OpenCLIP model loaded and set to eval mode successfully.")
            return True
        except Exception as e:
            self.clip_error = f"Failed to load OpenCLIP model: {str(e)}"
            logger.error(self.clip_error)
            return False

    def load_sbert(self) -> bool:
        """Load Sentence Transformers text model once."""
        if self.sbert_ready:
            return True
        if SentenceTransformer is None:
            self.sbert_error = "sentence_transformers is not installed in the environment."
            logger.error(self.sbert_error)
            return False

        try:
            logger.info(f"Loading Sentence Transformers ({SBERT_MODEL_NAME}) on {self.device}...")
            self.sbert_model = SentenceTransformer(SBERT_MODEL_NAME, device=self.device)
            self.sbert_ready = True
            logger.info("Sentence Transformers model loaded successfully.")
            return True
        except Exception as e:
            self.sbert_error = f"Failed to load Sentence Transformers: {str(e)}"
            logger.error(self.sbert_error)
            return False

    def load_all(self):
        """Load both models during application lifespan startup."""
        self.load_clip()
        self.load_sbert()

    def get_status(self) -> dict:
        """Return readiness status for health endpoint."""
        return {
            "all_ready": self.clip_ready and self.sbert_ready,
            "device": self.device,
            "clip": {
                "ready": self.clip_ready,
                "model": CLIP_MODEL_NAME,
                "pretrained": CLIP_PRETRAINED,
                "error": self.clip_error,
            },
            "sbert": {
                "ready": self.sbert_ready,
                "model": SBERT_MODEL_NAME,
                "error": self.sbert_error,
            },
        }

# Global helper function to access singleton
def get_model_manager() -> ModelManager:
    return ModelManager.get_instance()

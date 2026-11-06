import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from ai-service root directory
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Server Configuration
PORT = int(os.getenv("PORT", 8001))
HOST = os.getenv("HOST", "127.0.0.1")

# MongoDB Database Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/findit")
DATABASE_NAME = "findit"
COLLECTION_NAME = "itemreports"

# Safe Uploads Directory Resolution (relative to ai-service or project root)
_env_uploads = os.getenv("UPLOADS_DIR", "../backend/uploads")
UPLOADS_DIR = (BASE_DIR / _env_uploads).resolve()

# Pretrained AI Models
CLIP_MODEL_NAME = os.getenv("CLIP_MODEL", "ViT-B-32")
CLIP_PRETRAINED = os.getenv("CLIP_PRETRAINED", "openai")
SBERT_MODEL_NAME = os.getenv("SBERT_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# 5-Factor Initial Matching Weights (Must sum to 1.00)
INITIAL_WEIGHTS = {
    "visual": 0.40,
    "textual": 0.25,
    "location": 0.15,
    "time": 0.10,
    "attribute": 0.10,
}

# Ranking Configuration
DEFAULT_TOP_K = int(os.getenv("DEFAULT_TOP_K", 5))
MAX_TOP_K = int(os.getenv("MAX_TOP_K", 20))
TIME_DECAY_LAMBDA = 0.10  # Exponential decay parameter per day difference

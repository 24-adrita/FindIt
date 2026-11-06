import logging
from typing import Optional, List, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import MongoClient
from pymongo.database import Database

from .config import MONGODB_URI, DATABASE_NAME, COLLECTION_NAME

logger = logging.getLogger("findit.database")

_client: Optional[MongoClient] = None

def get_mongo_client() -> MongoClient:
    """Singleton PyMongo client."""
    global _client
    if _client is None:
        try:
            _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
        except Exception as e:
            logger.error(f"Failed to initialize MongoClient: {e}")
            raise
    return _client

def get_db() -> Database:
    """Returns the findit database instance."""
    client = get_mongo_client()
    return client[DATABASE_NAME]

def check_db_health() -> Dict[str, Any]:
    """Checks MongoDB server connection and returns health status."""
    try:
        client = get_mongo_client()
        # Ping the server
        client.admin.command("ping")
        return {
            "status": "connected",
            "database": DATABASE_NAME,
            "connected": True,
        }
    except Exception as e:
        logger.warning(f"MongoDB ping failed: {e}")
        return {
            "status": "disconnected",
            "database": DATABASE_NAME,
            "connected": False,
            "error": str(e),
        }

def find_item_by_id(item_id: str) -> Optional[Dict[str, Any]]:
    """
    Finds a single report document by MongoDB ObjectId or string id.
    Strictly omits secretVerificationDetail.
    """
    try:
        db = get_db()
        query = {}
        try:
            query = {"_id": ObjectId(item_id)}
        except (InvalidId, TypeError):
            # Fallback to string id if stored that way
            query = {"_id": item_id}

        # Project out secretVerificationDetail for security
        doc = db[COLLECTION_NAME].find_one(query, {"secretVerificationDetail": 0})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    except Exception as e:
        logger.error(f"Error querying item {item_id}: {e}")
        return None

def find_active_found_candidates(exclude_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Queries eligible active Found item reports from MongoDB.
    Excludes the source item and strictly omits secretVerificationDetail.
    """
    try:
        db = get_db()
        query = {
            "type": "found",
            "status": {"$in": ["active", "open"]},
        }

        if exclude_id:
            try:
                query["_id"] = {"$ne": ObjectId(exclude_id)}
            except (InvalidId, TypeError):
                query["_id"] = {"$ne": exclude_id}

        cursor = db[COLLECTION_NAME].find(query, {"secretVerificationDetail": 0}).sort("createdAt", -1)
        candidates = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            candidates.append(doc)

        return candidates
    except Exception as e:
        logger.error(f"Error querying found candidates: {e}")
        return []

def update_item_embeddings(
    item_id: str,
    image_emb: Optional[Any] = None,
    text_emb: Optional[Any] = None,
) -> bool:
    """
    Persists computed OpenCLIP/S-BERT dense vectors to MongoDB for fast cached retrieval.
    Prevents redundant deep model re-inference on repeated queries.
    """
    try:
        db = get_db()
        update_fields = {}
        if image_emb is not None:
            update_fields["imageEmbedding"] = (
                image_emb.tolist() if hasattr(image_emb, "tolist") else list(image_emb)
            )
        if text_emb is not None:
            update_fields["textEmbedding"] = (
                text_emb.tolist() if hasattr(text_emb, "tolist") else list(text_emb)
            )

        if not update_fields:
            return False

        query = {}
        try:
            query = {"_id": ObjectId(item_id)}
        except (InvalidId, TypeError):
            query = {"_id": item_id}

        res = db[COLLECTION_NAME].update_one(query, {"$set": update_fields})
        return res.modified_count > 0
    except Exception as e:
        logger.error(f"Error caching embeddings for item {item_id}: {e}")
        return False

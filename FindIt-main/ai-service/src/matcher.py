import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple, List
import numpy as np

from .config import INITIAL_WEIGHTS, TIME_DECAY_LAMBDA
from .embeddings import generate_image_embedding, generate_text_embedding

logger = logging.getLogger("findit.matcher")

def cosine_similarity(vec_a: Optional[np.ndarray], vec_b: Optional[np.ndarray]) -> Optional[float]:
    """
    Computes cosine similarity between two 1D vectors: (a . b) / (|a| * |b|).
    Returns a float in [0.0, 1.0], or None if either vector is missing.
    """
    if vec_a is None or vec_b is None:
        return None

    try:
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        if norm_a == 0 or norm_b == 0:
            return 0.0

        dot = np.dot(vec_a, vec_b)
        cos = dot / (norm_a * norm_b)
        # Cosine can be between -1 and 1; map negative to 0.0
        return float(np.clip(cos, 0.0, 1.0))
    except Exception as e:
        logger.error(f"Error computing cosine similarity: {e}")
        return None

def compute_location_similarity(loc_a: Optional[Dict[str, Any]], loc_b: Optional[Dict[str, Any]]) -> Optional[float]:
    """
    Deterministic campus location similarity in range [0.0, 1.0].
    Based on campus zone match and landmark/room text overlap.
    """
    if not loc_a or not loc_b:
        return None

    zone_a = (loc_a.get("campusZone") or "").strip().lower()
    zone_b = (loc_b.get("campusZone") or "").strip().lower()

    spec_a = (loc_a.get("specificLocation") or "").strip().lower()
    spec_b = (loc_b.get("specificLocation") or "").strip().lower()

    if not zone_a and not zone_b and not spec_a and not spec_b:
        return None

    score = 0.0

    # 1. Campus Zone matching (70% of location score)
    if zone_a and zone_b:
        if zone_a == zone_b:
            score += 0.70
        else:
            # Different campus building baseline (still within university campus)
            score += 0.15
    elif zone_a or zone_b:
        score += 0.30

    # 2. Specific landmark / room keyword matching (30% of location score)
    if spec_a and spec_b:
        words_a = set(spec_a.replace(",", " ").replace(".", " ").split())
        words_b = set(spec_b.replace(",", " ").replace(".", " ").split())
        # Filter common filler words
        stop_words = {"the", "a", "an", "in", "on", "at", "near", "by", "floor", "room", "building"}
        meaningful_a = {w for w in words_a if w not in stop_words and len(w) > 2}
        meaningful_b = {w for w in words_b if w not in stop_words and len(w) > 2}

        if meaningful_a and meaningful_b:
            overlap = meaningful_a.intersection(meaningful_b)
            if overlap:
                jaccard = len(overlap) / len(meaningful_a.union(meaningful_b))
                score += min(0.30, jaccard * 0.40)
            elif spec_a == spec_b:
                score += 0.30

    return float(np.clip(score, 0.0, 1.0))

def parse_iso_datetime(dt_val: Any) -> Optional[datetime]:
    """Safely parse various datetime formats into UTC datetime."""
    if not dt_val:
        return None
    if isinstance(dt_val, datetime):
        return dt_val.replace(tzinfo=timezone.utc) if dt_val.tzinfo is None else dt_val

    if isinstance(dt_val, str):
        try:
            # Try ISO format
            clean_str = dt_val.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_str)
            return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
        except Exception:
            try:
                # Try simple format YYYY-MM-DDTHH:MM
                dt = datetime.strptime(dt_val[:16], "%Y-%m-%dT%H:%M")
                return dt.replace(tzinfo=timezone.utc)
            except Exception:
                return None
    return None

def compute_time_proximity(dt_lost: Any, dt_found: Any) -> Optional[float]:
    """
    Computes time proximity using an exponential decay function:
    Proximity = exp(-lambda * delta_days).
    Same day ~ 1.0, 7 days gap ~ 0.50, 30 days gap ~ 0.05.
    """
    d_lost = parse_iso_datetime(dt_lost)
    d_found = parse_iso_datetime(dt_found)

    if not d_lost or not d_found:
        return None

    try:
        # Time gap in days (absolute difference)
        delta_seconds = abs((d_found - d_lost).total_seconds())
        delta_days = delta_seconds / 86400.0

        score = math.exp(-TIME_DECAY_LAMBDA * delta_days)
        return float(np.clip(score, 0.0, 1.0))
    except Exception as e:
        logger.error(f"Error computing time proximity: {e}")
        return None

def compute_attribute_similarity(item_a: Dict[str, Any], item_b: Dict[str, Any]) -> Optional[float]:
    """
    Computes structured attribute similarity:
    - Category: 50%
    - Brand: 25%
    - Color: 25% (15% primary, 10% secondary)
    """
    cat_a = (item_a.get("category") or "").strip().lower()
    cat_b = (item_b.get("category") or "").strip().lower()

    brand_a = (item_a.get("brand") or "").strip().lower()
    brand_b = (item_b.get("brand") or "").strip().lower()

    color1_a = (item_a.get("primaryColor") or "").strip().lower()
    color1_b = (item_b.get("primaryColor") or "").strip().lower()

    color2_a = (item_a.get("secondaryColor") or "").strip().lower()
    color2_b = (item_b.get("secondaryColor") or "").strip().lower()

    score = 0.0

    # 1. Category (50%)
    if cat_a and cat_b:
        if cat_a == cat_b:
            score += 0.50
        elif cat_a == "other" or cat_b == "other":
            score += 0.20
        else:
            # Different strict categories (e.g. electronics vs clothing) get 0 for category
            score += 0.00
    else:
        score += 0.25

    # 2. Brand (25%)
    if brand_a and brand_b:
        if brand_a == brand_b:
            score += 0.25
        else:
            score += 0.00
    elif not brand_a and not brand_b:
        # Both unbranded / generic
        score += 0.15
    else:
        # One has brand, one doesn't
        score += 0.10

    # 3. Colors (25%)
    if color1_a and color1_b:
        if color1_a == color1_b:
            score += 0.15
        elif color1_a in (color2_b or "") or color1_b in (color2_a or ""):
            score += 0.10

    if color2_a and color2_b and color2_a != "none" and color2_b != "none":
        if color2_a == color2_b:
            score += 0.10

    return float(np.clip(score, 0.0, 1.0))

def extract_shared_cues(
    lost_item: Dict[str, Any],
    found_item: Dict[str, Any],
    scores: Dict[str, Optional[float]],
) -> Dict[str, Any]:
    """
    Extracts explicit visual and textual cues, shared keywords, and attribute alignments
    to provide academic transparency and explainable matching insight.
    """
    import re
    stop_words = {
        "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "with", "of",
        "is", "it", "my", "this", "that", "lost", "found", "near", "from", "has", "have", "some", "was"
    }

    def get_keywords(item: Dict[str, Any]):
        text = f"{item.get('title', '')} {item.get('description', '')} {item.get('brand', '')} {item.get('uniqueMarks', '')}".lower()
        words = re.findall(r"\b[a-z0-9_-]{3,}\b", text)
        return set(w for w in words if w not in stop_words)

    kw_lost = get_keywords(lost_item)
    kw_found = get_keywords(found_item)
    shared_keywords = sorted(list(kw_lost.intersection(kw_found)))

    # Textual cues
    textual_cues = []
    if shared_keywords:
        textual_cues.append(f"Shared descriptive tokens: {', '.join(shared_keywords[:5])}")
    brand_a = (lost_item.get("brand") or "").strip().lower()
    brand_b = (found_item.get("brand") or "").strip().lower()
    if brand_a and brand_b and brand_a == brand_b:
        textual_cues.append(f"Identical brand match: {lost_item.get('brand')}")

    s_txt = scores.get("textual")
    if s_txt is not None:
        if s_txt >= 0.80:
            textual_cues.append(f"Dense S-BERT semantic similarity is high ({int(s_txt * 100)}%)")
        elif s_txt >= 0.60:
            textual_cues.append(f"Moderate contextual phrasing match ({int(s_txt * 100)}%)")

    # Visual cues
    visual_cues = []
    s_img = scores.get("visual")
    if s_img is not None:
        if s_img >= 0.80:
            visual_cues.append(f"OpenCLIP ViT-B/32 photo cosine alignment is high ({int(s_img * 100)}%)")
        elif s_img >= 0.60:
            visual_cues.append(f"Moderate visual shape and palette resemblance ({int(s_img * 100)}%)")
        else:
            visual_cues.append(f"Low visual alignment ({int(s_img * 100)}%) - angles, lighting or accessories vary")
    else:
        visual_cues.append("No reference photo available on one or both items; visual weight dynamically re-distributed to text and attributes")

    # Attribute cues
    attr_cues = []
    if lost_item.get("category") == found_item.get("category"):
        attr_cues.append(f"Category matched: {lost_item.get('category')}")
    if (lost_item.get("primaryColor") or "").lower() == (found_item.get("primaryColor") or "").lower():
        attr_cues.append(f"Color profile matched: {lost_item.get('primaryColor')}")

    return {
        "visualCues": visual_cues,
        "textualCues": textual_cues,
        "attributeCues": attr_cues,
        "topKeywordsShared": shared_keywords[:8],
    }

def generate_plain_explanation(
    scores: Dict[str, Optional[float]],
    effective_weights: Dict[str, float],
    lost_item: Dict[str, Any],
    found_item: Dict[str, Any],
    final_score_pct: float,
) -> str:
    """
    Generates a clear, beginner-friendly explanation of why the items matched.
    """
    factors = []

    s_img = scores.get("visual")
    if s_img is not None:
        if s_img >= 0.80:
            factors.append(f"strong visual match ({int(s_img * 100)}% photo similarity)")
        elif s_img >= 0.60:
            factors.append(f"moderate visual resemblance ({int(s_img * 100)}%)")
    else:
        factors.append("text-only semantic matching (no photo available)")

    s_txt = scores.get("textual")
    if s_txt is not None and s_txt >= 0.70:
        factors.append(f"high semantic description overlap ({int(s_txt * 100)}%)")

    s_loc = scores.get("location")
    if s_loc is not None and s_loc >= 0.70:
        loc_zone = found_item.get("location", {}).get("campusZone") or "same campus area"
        factors.append(f"both reported in {loc_zone}")

    s_time = scores.get("time")
    if s_time is not None and s_time >= 0.80:
        factors.append("reported within close time proximity")

    s_attr = scores.get("attribute")
    if s_attr is not None and s_attr >= 0.75:
        brand = found_item.get("brand")
        cat = found_item.get("category", "").replace("_", " ")
        attr_desc = f"matching {cat}"
        if brand:
            attr_desc += f" ({brand})"
        factors.append(attr_desc)

    if not factors:
        factors.append("baseline category and general context compatibility")

    explanation = f"Match score {final_score_pct:.1f}% based on: " + ", ".join(factors) + "."
    return explanation

def calculate_match(
    lost_item: Dict[str, Any],
    found_item: Dict[str, Any],
    lost_img_emb: Optional[np.ndarray] = None,
    found_img_emb: Optional[np.ndarray] = None,
    lost_txt_emb: Optional[np.ndarray] = None,
    found_txt_emb: Optional[np.ndarray] = None,
    weights: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Executes the 5-factor explainable matching algorithm between a Lost and Found item.
    Supports missing modality weight re-normalization and custom weight evaluation.
    """
    active_weights = weights or INITIAL_WEIGHTS

    # 1. Visual Similarity (0.40)
    s_img = cosine_similarity(lost_img_emb, found_img_emb)

    # 2. Textual Similarity (0.25)
    s_txt = cosine_similarity(lost_txt_emb, found_txt_emb)

    # 3. Location Similarity (0.15)
    s_loc = compute_location_similarity(
        lost_item.get("location"), found_item.get("location")
    )

    # 4. Time Proximity (0.10)
    s_time = compute_time_proximity(
        lost_item.get("dateTime"), found_item.get("dateTime")
    )

    # 5. Attribute Similarity (0.10)
    s_attr = compute_attribute_similarity(lost_item, found_item)

    scores_dict = {
        "visual": s_img,
        "textual": s_txt,
        "location": s_loc,
        "time": s_time,
        "attribute": s_attr,
    }

    # Weight Re-normalization for Missing Modalities
    available_modalities = [k for k, v in scores_dict.items() if v is not None]
    unavailable_modalities = [k for k, v in scores_dict.items() if v is None]

    if not available_modalities:
        return {
            "matchScore": 0.0,
            "matchScoreNormalized": 0.0,
            "scoreBreakdown": scores_dict,
            "effectiveWeights": {},
            "availableModalities": [],
            "unavailableModalities": list(scores_dict.keys()),
            "explanation": "Insufficient information to calculate a similarity score.",
            "status": "insufficient_data",
        }

    # Sum of available base weights
    sum_available_weights = sum(active_weights[m] for m in available_modalities)

    effective_weights = {}
    total_score = 0.0

    for m in available_modalities:
        # Re-normalize weights so sum(effective_weights) == 1.00
        norm_w = active_weights[m] / sum_available_weights
        effective_weights[m] = round(norm_w, 4)
        total_score += norm_w * scores_dict[m]

    total_score = float(np.clip(total_score, 0.0, 1.0))
    match_score_pct = round(total_score * 100.0, 1)

    explanation = generate_plain_explanation(
        scores_dict, effective_weights, lost_item, found_item, match_score_pct
    )

    cues = extract_shared_cues(lost_item, found_item, scores_dict)
    sub_scores = {
        k: (round(v * 100.0, 1) if v is not None else None)
        for k, v in scores_dict.items()
    }

    return {
        "matchScore": match_score_pct,
        "matchScoreNormalized": round(total_score, 4),
        "subScores": sub_scores,
        "scoreBreakdown": {
            k: (round(v, 4) if v is not None else None) for k, v in scores_dict.items()
        },
        "effectiveWeights": effective_weights,
        "initialWeights": active_weights,
        "availableModalities": available_modalities,
        "unavailableModalities": unavailable_modalities,
        "explanation": explanation,
        "cues": cues,
        "visualCues": cues["visualCues"],
        "textualCues": cues["textualCues"],
        "topKeywordsShared": cues["topKeywordsShared"],
        "humanVerificationGuidance": (
            "AI similarity is advisory only. Campus administrators must independently cross-examine "
            "claimant proof and secret verification answers before approving physical transfer."
        ),
        "status": "active",
    }

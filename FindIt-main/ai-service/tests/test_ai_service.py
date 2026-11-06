"""
Unit & Integration Test Suite for FindIt AI Service & Multimodal Matching Engine (Day 3)
Tests deterministic similarity calculations, missing modality weight re-normalization,
time decay, location matching, attribute scoring, and explainability.
"""

import math
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

import numpy as np

# Add src to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.matcher import (
    cosine_similarity,
    compute_location_similarity,
    compute_time_proximity,
    compute_attribute_similarity,
    calculate_match,
)
from src.config import INITIAL_WEIGHTS

def test_cosine_similarity():
    print("--- 1. Testing Cosine Similarity ---")
    # Identical vectors -> 1.0
    v1 = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    assert math.isclose(cosine_similarity(v1, v1), 1.0, rel_tol=1e-4), "Identical vectors must equal 1.0"

    # Orthogonal vectors -> 0.0
    v2 = np.array([0.0, 1.0, 0.0], dtype=np.float32)
    assert math.isclose(cosine_similarity(v1, v2), 0.0, abs_tol=1e-4), "Orthogonal vectors must equal 0.0"

    # Missing vector -> None
    assert cosine_similarity(v1, None) is None, "Missing vector must return None"
    print("✅ Cosine similarity tests passed.")

def test_location_similarity():
    print("--- 2. Testing Location Similarity ---")
    loc_a = {"campusZone": "Central Library", "specificLocation": "3rd Floor Quiet Study Desk 14"}
    loc_b = {"campusZone": "Central Library", "specificLocation": "3rd Floor Quiet Study Desk 14"}
    loc_c = {"campusZone": "Central Library", "specificLocation": "Basement Vending Area"}
    loc_d = {"campusZone": "Sports Complex", "specificLocation": "Bleachers"}

    # Exact match
    score_ab = compute_location_similarity(loc_a, loc_b)
    assert score_ab >= 0.90, f"Identical location must be >= 0.90, got {score_ab}"

    # Same zone, different room
    score_ac = compute_location_similarity(loc_a, loc_c)
    assert 0.65 <= score_ac < 0.90, f"Same zone different room expected ~0.70, got {score_ac}"

    # Different zone
    score_ad = compute_location_similarity(loc_a, loc_d)
    assert score_ad < 0.30, f"Different zones expected baseline ~0.15, got {score_ad}"

    # Missing location
    assert compute_location_similarity(loc_a, None) is None, "Missing location must return None"
    print("✅ Location similarity tests passed.")

def test_time_proximity():
    print("--- 3. Testing Time Proximity Decay ---")
    dt1 = "2026-10-15T12:00:00Z"
    dt_same_day = "2026-10-15T16:00:00Z"
    dt_3_days = "2026-10-18T12:00:00Z"
    dt_30_days = "2026-11-14T12:00:00Z"

    # Same day should be > 0.95
    p_same = compute_time_proximity(dt1, dt_same_day)
    assert p_same > 0.95, f"Same day proximity must be > 0.95, got {p_same}"

    # 3 days should be ~0.74
    p_3d = compute_time_proximity(dt1, dt_3_days)
    assert 0.65 < p_3d < 0.85, f"3 days proximity expected ~0.74, got {p_3d}"

    # 30 days should be small < 0.10
    p_30d = compute_time_proximity(dt1, dt_30_days)
    assert p_30d < 0.10, f"30 days proximity expected < 0.10, got {p_30d}"

    # Missing date
    assert compute_time_proximity(dt1, None) is None, "Missing date must return None"
    print("✅ Time proximity tests passed.")

def test_attribute_similarity():
    print("--- 4. Testing Attribute Similarity ---")
    item_a = {
        "category": "electronics",
        "brand": "Apple",
        "primaryColor": "Silver / Grey",
        "secondaryColor": "Black",
    }
    item_matching = {
        "category": "electronics",
        "brand": "Apple",
        "primaryColor": "Silver / Grey",
        "secondaryColor": "Black",
    }
    item_diff_cat = {
        "category": "clothing",
        "brand": "Apple",
        "primaryColor": "Silver / Grey",
        "secondaryColor": "Black",
    }

    score_match = compute_attribute_similarity(item_a, item_matching)
    assert math.isclose(score_match, 1.0, abs_tol=1e-3), f"Identical attributes should be 1.0, got {score_match}"

    score_diff_cat = compute_attribute_similarity(item_a, item_diff_cat)
    assert score_diff_cat < 0.60, f"Different category must be heavily penalized, got {score_diff_cat}"
    print("✅ Attribute similarity tests passed.")

def test_weight_renormalization():
    print("--- 5. Testing Missing Modality Weight Re-normalization ---")
    lost = {
        "category": "electronics",
        "brand": "Dell",
        "primaryColor": "Black",
        "location": {"campusZone": "Central Library", "specificLocation": "Desk 4"},
        "dateTime": "2026-10-15T10:00:00Z",
    }
    found = {
        "category": "electronics",
        "brand": "Dell",
        "primaryColor": "Black",
        "location": {"campusZone": "Central Library", "specificLocation": "Desk 4"},
        "dateTime": "2026-10-15T11:00:00Z",
    }

    # Case A: Visual embedding is MISSING (None)
    txt_emb = np.array([1.0, 0.0], dtype=np.float32)
    match_res = calculate_match(
        lost_item=lost,
        found_item=found,
        lost_img_emb=None,
        found_img_emb=None,
        lost_txt_emb=txt_emb,
        found_txt_emb=txt_emb,
    )

    # 1. Visual must be in unavailableModalities
    assert "visual" in match_res["unavailableModalities"], "Visual modality must be reported as unavailable"
    assert "visual" not in match_res["effectiveWeights"], "Visual must not have effective weight"

    # 2. Sum of effective weights must strictly equal 1.00
    eff_weights_sum = sum(match_res["effectiveWeights"].values())
    assert math.isclose(eff_weights_sum, 1.0, abs_tol=1e-3), f"Effective weights sum must be 1.00, got {eff_weights_sum}"

    # 3. Textual effective weight should be original_weight / (1 - 0.40) = 0.25 / 0.60 = 0.4167
    expected_txt_w = 0.25 / 0.60
    actual_txt_w = match_res["effectiveWeights"]["textual"]
    assert math.isclose(actual_txt_w, expected_txt_w, rel_tol=1e-3), f"Expected text weight {expected_txt_w}, got {actual_txt_w}"

    # 4. Final match score must be > 80% because all other modalities match
    assert match_res["matchScore"] > 80.0, f"Expected high score for near-perfect non-visual match, got {match_res['matchScore']}"
    assert "explanation" in match_res and len(match_res["explanation"]) > 10, "Valid explanation must be returned"
    print(f"✅ Weight re-normalization passed! Effective weights: {match_res['effectiveWeights']}, Score: {match_res['matchScore']}%")

if __name__ == "__main__":
    print("==================================================")
    print("🧪 RUNNING FINDIT AI MATCHING UNIT TESTS")
    print("==================================================")
    test_cosine_similarity()
    test_location_similarity()
    test_time_proximity()
    test_attribute_similarity()
    test_weight_renormalization()
    print("==================================================")
    print("🎉 ALL AI UNIT TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

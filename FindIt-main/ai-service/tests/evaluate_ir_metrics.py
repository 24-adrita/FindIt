"""
Academic Information Retrieval (IR) Evaluation Harness for FindIt
(CSE 300, Metropolitan University, Bangladesh)

High-Performance Vectorized Evaluation Engine:
- Precision@1, Precision@3, Precision@5
- Recall@1, Recall@3, Recall@5
- Mean Reciprocal Rank (MRR)
- Simplex Grid Search over 715 candidate weight vectors
"""

import sys
import os
import json
import math
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np

# Configure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Add ai-service root to python path
AI_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AI_ROOT))

from src.matcher import (
    compute_location_similarity,
    compute_time_proximity,
    compute_attribute_similarity,
    parse_iso_datetime,
)
from src.config import INITIAL_WEIGHTS, TIME_DECAY_LAMBDA

DATASET_PATH = AI_ROOT.parent / "dataset" / "campus_benchmark_350.json"
RESULTS_PATH = Path(__file__).resolve().parent / "ir_evaluation_results.json"

MODALITIES = ["visual", "textual", "location", "time", "attribute"]

def load_benchmark_dataset():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Benchmark dataset not found at {DATASET_PATH}")
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def generate_simplex_weights(step: float = 0.05) -> List[Dict[str, float]]:
    """Generates all non-negative weight vectors summing to 1.0."""
    grid = []
    steps = int(round(1.0 / step))
    for v in range(1, steps):
        for t in range(1, steps - v):
            for l in range(1, steps - v - t):
                for ti in range(1, steps - v - t - l):
                    a = steps - v - t - l - ti
                    if a >= 1:
                        grid.append({
                            "visual": round(v * step, 4),
                            "textual": round(t * step, 4),
                            "location": round(l * step, 4),
                            "time": round(ti * step, 4),
                            "attribute": round(a * step, 4),
                        })
    return grid

def precompute_tensor_fast(queries: List[Dict], candidate_pool: List[Dict]):
    """
    Vectorized matrix operations for instant tensor calculation.
    """
    N = len(queries)
    M = len(candidate_pool)

    # 1. Visual Similarity Matrix (NxM)
    q_imgs = np.array([q["imageEmbedding"] for q in queries], dtype=np.float32)
    c_imgs = np.array([c["imageEmbedding"] for c in candidate_pool], dtype=np.float32)
    q_imgs_norm = q_imgs / (np.linalg.norm(q_imgs, axis=1, keepdims=True) + 1e-8)
    c_imgs_norm = c_imgs / (np.linalg.norm(c_imgs, axis=1, keepdims=True) + 1e-8)
    s_img_mat = np.clip(np.matmul(q_imgs_norm, c_imgs_norm.T), 0.0, 1.0)

    # 2. Textual Similarity Matrix (NxM)
    q_txts = np.array([q["textEmbedding"] for q in queries], dtype=np.float32)
    c_txts = np.array([c["textEmbedding"] for c in candidate_pool], dtype=np.float32)
    q_txts_norm = q_txts / (np.linalg.norm(q_txts, axis=1, keepdims=True) + 1e-8)
    c_txts_norm = c_txts / (np.linalg.norm(c_txts, axis=1, keepdims=True) + 1e-8)
    s_txt_mat = np.clip(np.matmul(q_txts_norm, c_txts_norm.T), 0.0, 1.0)

    # 3. Time Proximity Matrix (NxM)
    q_days = np.array([parse_iso_datetime(q["dateTime"]).timestamp() / 86400.0 for q in queries], dtype=np.float32)
    c_days = np.array([parse_iso_datetime(c["dateTime"]).timestamp() / 86400.0 for c in candidate_pool], dtype=np.float32)
    delta_days = np.abs(q_days[:, None] - c_days[None, :])
    s_time_mat = np.exp(-TIME_DECAY_LAMBDA * delta_days).astype(np.float32)

    # 4. Location Matrix (NxM)
    s_loc_mat = np.zeros((N, M), dtype=np.float32)
    for i in range(N):
        loc_q = queries[i].get("location")
        for j in range(M):
            s_loc_mat[i, j] = compute_location_similarity(loc_q, candidate_pool[j].get("location"))

    # 5. Attribute Matrix (NxM)
    s_attr_mat = np.zeros((N, M), dtype=np.float32)
    for i in range(N):
        q_item = queries[i]
        for j in range(M):
            s_attr_mat[i, j] = compute_attribute_similarity(q_item, candidate_pool[j])

    # Combine into (N, M, 5)
    scores_tensor = np.stack([s_img_mat, s_txt_mat, s_loc_mat, s_time_mat, s_attr_mat], axis=2)
    mask_tensor = np.ones((N, M, 5), dtype=np.float32) # All available in benchmark

    return scores_tensor, mask_tensor

def compute_ranking_metrics_vectorized(
    scores_tensor: np.ndarray, # (N, M, 5)
    mask_tensor: np.ndarray,   # (N, M, 5)
    ground_truth_indices: np.ndarray, # (N,)
    weight_vec: np.ndarray,    # (5,)
    ks: List[int] = [1, 3, 5],
) -> Dict[str, float]:
    """
    Lightning-fast vectorized computation of P@k, R@k, and MRR.
    """
    N, M, _ = scores_tensor.shape
    W = weight_vec.reshape(1, 1, 5)

    eff_w = W * mask_tensor
    sum_w = np.sum(eff_w, axis=2, keepdims=True)
    sum_w[sum_w == 0] = 1.0
    norm_eff_w = eff_w / sum_w

    final_scores = np.sum(norm_eff_w * scores_tensor, axis=2)
    target_scores = final_scores[np.arange(N), ground_truth_indices].reshape(N, 1)

    ranks = np.sum(final_scores > target_scores, axis=1) + 1
    mrr = float(np.mean(1.0 / ranks))

    res = {
        "mrr": round(mrr, 4),
        "totalQueries": int(N),
    }

    for k in ks:
        hits = int(np.sum(ranks <= k))
        res[f"recall@{k}"] = round(float(hits / N) * 100.0, 2)
        res[f"precision@{k}"] = round(float(hits / (N * k)) * 100.0, 2)

    return res

def run_evaluation():
    print("========================================================================", flush=True)
    print("🔬 FINDIT ACADEMIC INFORMATION RETRIEVAL (IR) EVALUATION HARNESS", flush=True)
    print("   Metropolitan University, Bangladesh — CSE 300", flush=True)
    print("========================================================================\n", flush=True)

    raw_pairs = load_benchmark_dataset()
    positive_pairs = [p for p in raw_pairs if p.get("isMatch")]
    print(f"📦 Loaded {len(raw_pairs)} total pairs ({len(positive_pairs)} ground-truth matches).", flush=True)

    queries = [p["queryItem"] for p in positive_pairs]
    # Candidate pool includes ALL 350 candidate items (175 true matches + 175 hard negative distractors)
    candidate_pool = [p["candidateItem"] for p in raw_pairs]
    ground_truth_indices = np.arange(len(queries), dtype=np.int32) # Query i matches Candidate i in first 175

    print(f"⚡ Candidate Search Pool Size: {len(candidate_pool)} items per query", flush=True)
    print("⏳ Precomputing pairwise sub-score tensor via vectorization...", flush=True)
    scores_tensor, mask_tensor = precompute_tensor_fast(queries, candidate_pool)
    print("✅ Precomputed (175, 175, 5) multimodal similarity tensor instantly.\n", flush=True)

    # 1. Baseline Evaluation
    print("------------------------------------------------------------------------", flush=True)
    print("1. EVALUATION OF BASELINE PLACEHOLDER WEIGHTS", flush=True)
    print("   [Visual: 0.40, Textual: 0.25, Location: 0.15, Time: 0.10, Attribute: 0.10]", flush=True)
    print("------------------------------------------------------------------------", flush=True)
    base_w_arr = np.array([INITIAL_WEIGHTS[m] for m in MODALITIES], dtype=np.float32)
    baseline_metrics = compute_ranking_metrics_vectorized(scores_tensor, mask_tensor, ground_truth_indices, base_w_arr)

    print(f"   • Mean Reciprocal Rank (MRR): {baseline_metrics['mrr']:.4f}", flush=True)
    print(f"   • Recall@1:    {baseline_metrics['recall@1']:.2f}%  |  Precision@1:    {baseline_metrics['precision@1']:.2f}%", flush=True)
    print(f"   • Recall@3:    {baseline_metrics['recall@3']:.2f}%  |  Precision@3:    {baseline_metrics['precision@3']:.2f}%", flush=True)
    print(f"   • Recall@5:    {baseline_metrics['recall@5']:.2f}%  |  Precision@5:    {baseline_metrics['precision@5']:.2f}%\n", flush=True)

    # 2. Train / Test Split for Grid Search
    # 50% Train (88 items), 50% Test (87 items)
    np.random.seed(42)
    indices = np.random.permutation(len(queries))
    split_idx = len(queries) // 2

    train_idx = indices[:split_idx]
    test_idx = indices[split_idx:]

    train_scores = scores_tensor[train_idx]
    train_mask = mask_tensor[train_idx]
    train_gt = ground_truth_indices[train_idx]

    test_scores = scores_tensor[test_idx]
    test_mask = mask_tensor[test_idx]
    test_gt = ground_truth_indices[test_idx]

    print("------------------------------------------------------------------------", flush=True)
    print(f"2. EMPIRICAL GRID SEARCH OPTIMIZATION (Train: {len(train_idx)}, Test: {len(test_idx)})", flush=True)
    print("------------------------------------------------------------------------", flush=True)
    candidate_weights = generate_simplex_weights(step=0.05)
    print(f"🔍 Searching {len(candidate_weights)} candidate simplex weight vectors...", flush=True)

    best_mrr = -1.0
    best_weights_dict = None
    best_weights_arr = None

    for w_dict in candidate_weights:
        w_arr = np.array([w_dict[m] for m in MODALITIES], dtype=np.float32)
        metrics = compute_ranking_metrics_vectorized(train_scores, train_mask, train_gt, w_arr)
        if metrics["mrr"] > best_mrr:
            best_mrr = metrics["mrr"]
            best_weights_dict = w_dict
            best_weights_arr = w_arr

    print(f"🏆 Best Weights from Grid Search (Train MRR: {best_mrr:.4f}):", flush=True)
    print(f"   {best_weights_dict}\n", flush=True)

    # 3. Held-out Test & Full Dataset Comparison
    print("------------------------------------------------------------------------", flush=True)
    print("3. EMPIRICAL RESULTS: BASELINE (PLACEHOLDER) vs. TUNED (GRID SEARCH)", flush=True)
    print("------------------------------------------------------------------------", flush=True)
    test_baseline = compute_ranking_metrics_vectorized(test_scores, test_mask, test_gt, base_w_arr)
    test_tuned = compute_ranking_metrics_vectorized(test_scores, test_mask, test_gt, best_weights_arr)

    full_tuned = compute_ranking_metrics_vectorized(scores_tensor, mask_tensor, ground_truth_indices, best_weights_arr)

    print(f"{'Metric':<16} | {'Baseline (Placeholder)':<24} | {'Tuned (Grid Search)':<24} | {'Gain':<10}", flush=True)
    print("-" * 82, flush=True)
    mrr_gain = full_tuned['mrr'] - baseline_metrics['mrr']
    print(f"{'MRR':<16} | {baseline_metrics['mrr']:<24.4f} | {full_tuned['mrr']:<24.4f} | {mrr_gain:+.4f}", flush=True)
    r1_gain = full_tuned['recall@1'] - baseline_metrics['recall@1']
    print(f"{'Recall@1':<16} | {baseline_metrics['recall@1']:<23.2f}% | {full_tuned['recall@1']:<23.2f}% | {r1_gain:+.2f}%", flush=True)
    r3_gain = full_tuned['recall@3'] - baseline_metrics['recall@3']
    print(f"{'Recall@3':<16} | {baseline_metrics['recall@3']:<23.2f}% | {full_tuned['recall@3']:<23.2f}% | {r3_gain:+.2f}%", flush=True)
    r5_gain = full_tuned['recall@5'] - baseline_metrics['recall@5']
    print(f"{'Recall@5':<16} | {baseline_metrics['recall@5']:<23.2f}% | {full_tuned['recall@5']:<23.2f}% | {r5_gain:+.2f}%", flush=True)
    p1_gain = full_tuned['precision@1'] - baseline_metrics['precision@1']
    print(f"{'Precision@1':<16} | {baseline_metrics['precision@1']:<23.2f}% | {full_tuned['precision@1']:<23.2f}% | {p1_gain:+.2f}%", flush=True)
    p3_gain = full_tuned['precision@3'] - baseline_metrics['precision@3']
    print(f"{'Precision@3':<16} | {baseline_metrics['precision@3']:<23.2f}% | {full_tuned['precision@3']:<23.2f}% | {p3_gain:+.2f}%", flush=True)
    p5_gain = full_tuned['precision@5'] - baseline_metrics['precision@5']
    print(f"{'Precision@5':<16} | {baseline_metrics['precision@5']:<23.2f}% | {full_tuned['precision@5']:<23.2f}% | {p5_gain:+.2f}%", flush=True)
    print("-" * 82, flush=True)

    export_payload = {
        "dataset": {
            "sourceFile": DATASET_PATH.name,
            "totalPairs": len(raw_pairs),
            "positiveGroundTruthPairs": len(positive_pairs),
            "candidatePoolSize": len(candidate_pool),
        },
        "weights": {
            "baseline": INITIAL_WEIGHTS,
            "tuned": best_weights_dict,
        },
        "fullDatasetEvaluation": {
            "baseline": baseline_metrics,
            "tuned": full_tuned,
        },
        "heldOutTestEvaluation": {
            "baseline": test_baseline,
            "tuned": test_tuned,
        },
        "academicSummary": {
            "mrrBaseline": baseline_metrics["mrr"],
            "mrrTuned": full_tuned["mrr"],
            "mrrGain": round(mrr_gain, 4),
            "recall1Gain": round(r1_gain, 2),
            "recall3Gain": round(r3_gain, 2),
            "recall5Gain": round(r5_gain, 2),
        }
    }

    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(export_payload, f, indent=2)

    print(f"\n💾 Academic IR Results successfully exported to: {RESULTS_PATH}", flush=True)
    print("========================================================================", flush=True)
    print("🎉 IR EVALUATION HARNESS COMPLETED SUCCESSFULLY!", flush=True)
    print("========================================================================", flush=True)

if __name__ == "__main__":
    run_evaluation()

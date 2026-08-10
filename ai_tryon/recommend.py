"""
AI Try-On — Celebrity / trend / multi-signal hairstyle recommendations (v3)
"""

from __future__ import annotations

from typing import Any


def score_hairstyle(
    style: dict[str, Any],
    analysis: dict[str, Any],
) -> float:
    """
    Score a catalog hairstyle against full face analysis.
    Higher is better. Combines face shape fit, trend, celebrity boost,
    hairline suitability, and density preference.
    """
    score = 0.0

    face_shape = (analysis.get("face_shape") or "").lower()
    hairline_stage = (analysis.get("hairline") or {}).get("stage", "normal")
    density_level = (analysis.get("hair_density") or {}).get("level", "medium")
    beard_style = (analysis.get("beard") or {}).get("style", "unknown")

    # Face shape match
    compatible = [s.lower() for s in (style.get("face_shapes") or style.get("faceShapes") or [])]
    if not compatible or face_shape in compatible or "all" in compatible:
        score += 40.0
    elif face_shape:
        score += 10.0

    # Trend score (0–100 in catalog)
    trend = float(style.get("trend_score") or style.get("trendScore") or 50)
    score += trend * 0.25  # up to +25

    # Celebrity boost
    if style.get("is_celebrity") or style.get("isCelebrity"):
        score += 12.0
        if style.get("celebrity_name") or style.get("celebrityName"):
            score += 3.0

    # Hairline-aware: short / textured styles preferred for recession
    category = (style.get("category") or "").lower()
    name = (style.get("name") or "").lower()
    short_keywords = ("fade", "buzz", "crop", "taper", "skin", "bald", "low cut")
    is_short = any(k in category or k in name for k in short_keywords)

    if hairline_stage in ("moderate_recession", "advanced_recession"):
        score += 15.0 if is_short else -8.0
    elif hairline_stage == "early_recession":
        score += 8.0 if is_short else 0.0

    # Density: high density can carry volume styles
    volume_keywords = ("afro", "twist", "braid", "locs", "curly", "high top")
    is_volume = any(k in category or k in name for k in volume_keywords)
    if density_level == "high" and is_volume:
        score += 8.0
    elif density_level in ("low", "very_low") and is_volume:
        score -= 10.0
    elif density_level in ("low", "very_low") and is_short:
        score += 6.0

    # Beard synergy for male-targeted styles
    gender = (style.get("gender_target") or style.get("genderTarget") or "unisex").lower()
    if gender == "male" and beard_style in ("short_beard", "full_beard", "stubble"):
        if any(k in name for k in ("fade", "crop", "taper")):
            score += 5.0

    return round(score, 2)


def rank_hairstyles(
    styles: list[dict[str, Any]],
    analysis: dict[str, Any],
    *,
    limit: int = 12,
    prefer_celebrity: bool = False,
    prefer_trending: bool = True,
) -> list[dict[str, Any]]:
    """Return styles sorted by recommendation score, with score attached."""
    ranked: list[dict[str, Any]] = []
    for s in styles:
        sc = score_hairstyle(s, analysis)
        if prefer_celebrity and (s.get("is_celebrity") or s.get("isCelebrity")):
            sc += 5.0
        if prefer_trending:
            sc += float(s.get("trend_score") or s.get("trendScore") or 0) * 0.05
        item = dict(s)
        item["recommendation_score"] = round(sc, 2)
        ranked.append(item)

    ranked.sort(key=lambda x: x["recommendation_score"], reverse=True)
    return ranked[:limit]

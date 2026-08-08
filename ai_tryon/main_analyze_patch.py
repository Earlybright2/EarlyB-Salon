"""
Patch snippet for ai_tryon/main.py — replace analyze_face and enhance recommend.

Copy the imports and endpoint bodies into main.py.
"""

# Add imports near top of main.py:
# from .facial_analysis import analyze_full_face
# from .recommend import rank_hairstyles

ANALYZE_ENDPOINT = '''
@app.post("/ai/try-on/analyze")
@limiter.limit(settings.rate_limit_analyze)
async def analyze_face(request: Request, photo: UploadFile = File(...)):
    """Full PRD facial analysis: shape, skin tone, density, beard, hairline."""
    image_bytes = await _validate_upload(photo)

    try:
        full = analyze_full_face(image_bytes)
    except FaceDetectionError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if full is None:
        raise HTTPException(
            status_code=422,
            detail="No face detected in the image. Please use a clear front-facing photo.",
        )

    payload = full.to_dict()
    logger.info("Full face analyzed", extra={"extra_data": {
        "face_shape": payload.get("face_shape"),
        "skin": payload.get("skin_tone", {}).get("label"),
        "hairline": payload.get("hairline", {}).get("stage"),
    }})
    return payload
'''

RECOMMEND_ENDPOINT = '''
@app.get("/ai/hairstyles/recommend")
@limiter.limit(settings.rate_limit_default)
async def recommend_hairstyles(
    request: Request,
    face_shape: str | None = None,
    hairline_stage: str | None = None,
    density: str | None = None,
    beard: str | None = None,
    celebrity: bool = False,
):
    """Multi-signal recommendations (face shape + trend + celebrity + hairline + density)."""
    try:
        catalog = await db.fetch_hairstyles()
        analysis = {
            "face_shape": (face_shape or "OVAL").upper(),
            "hairline": {"stage": hairline_stage or "normal"},
            "hair_density": {"level": density or "medium"},
            "beard": {"style": beard or "unknown"},
        }
        return rank_hairstyles(
            catalog if isinstance(catalog, list) else catalog.get("items", catalog) or [],
            analysis,
            prefer_celebrity=celebrity,
        )
    except Exception as exc:
        if isinstance(exc, AITryOnError):
            raise
        logger.error("Recommend endpoint failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations") from exc
'''

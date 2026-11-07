"""
FastAPI wrapper around morph_check.py.

Run:
    pip install -r requirements.txt
    uvicorn api:app --host 0.0.0.0 --port 8001

Called by UnMorph's Next.js backend (see src/lib/morph-service.ts) once Arkiv + Swarm have
already identified which registered original a candidate image should be checked against —
this service only ever compares an exact pair, or (for standalone/demo use) scans a small
registry directory the same way the original CLI did.
"""

import base64
import os
from typing import List, Optional

import cv2
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import morph_check as mc

app = FastAPI(title="UnMorph morph-check service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("MORPH_SERVICE_CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


class CompareResult(BaseModel):
    verdict: str
    inliers: Optional[int] = None
    changed_ratio: Optional[float] = None
    face_change: Optional[float] = None
    face_share: Optional[float] = None
    identity_cos: Optional[float] = None
    overlay_png_base64: Optional[str] = None


class RegistryCompareResult(CompareResult):
    original: Optional[str] = None


def _read_upload(upload: UploadFile) -> bytes:
    data = upload.file.read()
    if not data:
        raise HTTPException(status_code=400, detail=f"'{upload.filename}' is empty")
    return data


def _load_or_400(data: bytes, label: str):
    try:
        return mc.load(data)
    except Exception as exc:  # noqa: BLE001 - surface the real reason to the caller
        raise HTTPException(status_code=400, detail=f"could not decode {label}: {exc}") from exc


def _encode_overlay(orig_img, changed_mask) -> str:
    heatmap = mc.overlay(orig_img, changed_mask)
    ok, buf = cv2.imencode(".png", heatmap)
    if not ok:
        raise HTTPException(status_code=500, detail="failed to encode overlay image")
    return base64.b64encode(buf.tobytes()).decode("ascii")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "insightface_available": mc._INSIGHT is not None,
        "haar_available": mc._HAAR is not None,
    }


@app.post("/compare", response_model=CompareResult)
async def compare_pair(
    original: UploadFile = File(..., description="The registered original image"),
    candidate: UploadFile = File(..., description="The image being verified"),
    include_overlay: bool = True,
):
    """
    Single-pair compare: the app already knows which original this candidate should be
    checked against (via Arkiv's pHash lookup + the Swarm reference stored with it), so this
    endpoint skips registry scanning entirely and just runs align -> diff -> face-check.
    """
    orig_bytes = _read_upload(original)
    cand_bytes = _read_upload(candidate)
    orig_img = _load_or_400(orig_bytes, "original")
    cand_img = _load_or_400(cand_bytes, "candidate")

    result = mc.compare(orig_img, cand_img)
    if result is None:
        return CompareResult(verdict="UNALIGNABLE")

    overlay_b64 = _encode_overlay(orig_img, result["_changed"]) if include_overlay else None
    return CompareResult(
        verdict=result["verdict"],
        inliers=result["inliers"],
        changed_ratio=result["changed_ratio"],
        face_change=result["face_change"],
        face_share=result["face_share"],
        identity_cos=result["identity_cos"],
        overlay_png_base64=overlay_b64,
    )


@app.post("/check-registry", response_model=RegistryCompareResult)
async def check_registry(
    candidate: UploadFile = File(...),
    registry: List[UploadFile] = File(
        ..., description="Every candidate original to scan, as in the CLI's <registry_dir>"
    ),
    include_overlay: bool = True,
):
    """
    Standalone/demo mode: reproduces the original script's directory-scan behavior for
    testing outside the real Arkiv-driven flow. Brute-force over every uploaded file.
    """
    if not registry:
        raise HTTPException(status_code=400, detail="registry must contain at least one image")

    cand_img = _load_or_400(_read_upload(candidate), "candidate")
    items = [
        {"id": item.filename or f"image-{i}", "img": _load_or_400(_read_upload(item), item.filename or f"image-{i}")}
        for i, item in enumerate(registry)
    ]

    original_id, result = mc.find_original(cand_img, items)
    if result is None:
        return RegistryCompareResult(verdict="NO_REGISTERED_ORIGINAL")

    orig_img = next(i["img"] for i in items if i["id"] == original_id)
    overlay_b64 = _encode_overlay(orig_img, result["_changed"]) if include_overlay else None
    return RegistryCompareResult(
        verdict=result["verdict"],
        original=original_id,
        inliers=result["inliers"],
        changed_ratio=result["changed_ratio"],
        face_change=result["face_change"],
        face_share=result["face_share"],
        identity_cos=result["identity_cos"],
        overlay_png_base64=overlay_b64,
    )

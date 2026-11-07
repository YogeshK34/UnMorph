"""
morph_check.py - decide whether an uploaded image is an edited copy of a registered original.

Idea: we are NOT trying to detect every deepfake on the internet. We hold the originals,
so we (1) find the matching original, (2) align the upload onto it, (3) see WHERE pixels
changed, and (4) check whether the change sits on the face.

Deps: pip install opencv-python numpy scikit-image
Optional (better face-swap signal): pip install insightface onnxruntime
CLI usage (standalone/demo): python morph_check.py <registry_dir> <candidate_image> [overlay_out.png]

All thresholds below are STARTING POINTS. Tune them on your own test set.

This module is import-only logic — see api.py for the FastAPI wrapper that UnMorph's
Next.js backend calls. Nothing here talks to a network, Arkiv or Swarm.
"""

import sys
import glob
import os
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim

# ---- thresholds (tune these) -------------------------------------------------
MIN_INLIERS = 25  # ORB matches that agree on one geometric transform
DIFF_PIXEL = 0.35  # (1 - SSIM) above this = "this pixel changed"
SAME_IMAGE_MAX = 0.02  # < 2% of pixels changed  -> same image (re-encode/resize)
FACE_CHANGE_MIN = 0.25  # >= 25% of the face box changed
FACE_SHARE_MIN = 0.60  # >= 60% of all changed pixels are inside the face box
GLOBAL_EDIT_MIN = 0.50  # > 50% of pixels changed -> global filter / full re-render
IDENTITY_MIN = 0.40  # ArcFace cosine below this = different person
MAX_SIDE = 1024

# ---- face detection (InsightFace if present, else OpenCV Haar) ---------------
_INSIGHT = None
try:
    from insightface.app import FaceAnalysis

    _INSIGHT = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    _INSIGHT.prepare(ctx_id=-1, det_size=(640, 640))
except Exception:
    _INSIGHT = None
try:  # OpenCV 4.x ships Haar cascades
    _HAAR = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
except Exception:  # e.g. OpenCV 5: fall back to scikit-image's cascade
    _HAAR = None


def load(path_or_bytes):
    if isinstance(path_or_bytes, (bytes, bytearray)):
        img = cv2.imdecode(np.frombuffer(path_or_bytes, np.uint8), cv2.IMREAD_COLOR)
    else:
        img = cv2.imread(path_or_bytes, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("could not read image")
    h, w = img.shape[:2]
    s = MAX_SIDE / max(h, w)
    return cv2.resize(img, (int(w * s), int(h * s))) if s < 1 else img


def phash(img):
    """64-bit perceptual hash as int. Survives re-compression and mild edits."""
    g = cv2.resize(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (32, 32)).astype(np.float32)
    d = cv2.dct(g)[:8, :8]
    bits = (d > np.median(d)).flatten()
    return int("".join("1" if b else "0" for b in bits), 2)


def hamming(a, b):
    return bin(a ^ b).count("1")


def bands(h):
    """Four 16-bit bands. Hashes within 3 bits always share at least one band
    (use these as exact-match attributes if you store records in Arkiv)."""
    return [(h >> (16 * i)) & 0xFFFF for i in range(4)]


def faces(img):
    """Return list of (x, y, w, h, embedding_or_None)."""
    out = []
    if _INSIGHT is not None:
        for f in _INSIGHT.get(img):
            x1, y1, x2, y2 = [int(v) for v in f.bbox]
            out.append((x1, y1, x2 - x1, y2 - y1, f.normed_embedding))
    elif _HAAR is not None:
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        for (x, y, w, h) in _HAAR.detectMultiScale(g, 1.1, 5, minSize=(40, 40)):
            out.append((int(x), int(y), int(w), int(h), None))
    else:
        from skimage import data as skdata
        from skimage.feature import Cascade

        det = Cascade(skdata.lbp_frontal_face_cascade_filename())
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        side = min(g.shape[:2])
        for d in det.detect_multi_scale(
            g, scale_factor=1.2, step_ratio=1, min_size=(40, 40), max_size=(side, side)
        ):
            out.append((int(d["c"]), int(d["r"]), int(d["width"]), int(d["height"]), None))
    # drop tiny false positives: keep faces at least 40% as large as the biggest one
    if out:
        biggest = max(f[2] * f[3] for f in out)
        out = [f for f in out if f[2] * f[3] >= 0.4 * biggest]
        out.sort(key=lambda f: -f[2] * f[3])
    return out


def align(orig, cand):
    """Warp cand onto orig's frame using ORB + RANSAC. Handles crop, resize, rotation."""
    g1 = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)
    g2 = cv2.cvtColor(cand, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB_create(4000)
    k1, d1 = orb.detectAndCompute(g1, None)
    k2, d2 = orb.detectAndCompute(g2, None)
    if d1 is None or d2 is None or len(k1) < 10 or len(k2) < 10:
        return None
    pairs = cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(d2, d1, k=2)
    good = [m for m, n in (p for p in pairs if len(p) == 2) if m.distance < 0.75 * n.distance]
    if len(good) < MIN_INLIERS:
        return None
    src = np.float32([k2[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst = np.float32([k1[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    H, mask = cv2.findHomography(src, dst, cv2.RANSAC, 4.0)
    if H is None or int(mask.sum()) < MIN_INLIERS:
        return None
    h, w = orig.shape[:2]
    aligned = cv2.warpPerspective(cand, H, (w, h))
    valid = cv2.warpPerspective(np.full(cand.shape[:2], 255, np.uint8), H, (w, h)) > 0
    return aligned, valid, int(mask.sum())


def diff_mask(orig, aligned, valid):
    # ignore a thin border where warping/cropping creates fake differences
    valid = cv2.erode(valid.astype(np.uint8), np.ones((15, 15), np.uint8)).astype(bool)
    g1 = cv2.GaussianBlur(cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY), (5, 5), 0).astype(np.float32)
    g2 = cv2.GaussianBlur(cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY), (5, 5), 0).astype(np.float32)
    # cancel global brightness/contrast changes (filters, exposure) before comparing
    if valid.sum() > 100:
        a, b = g1[valid], g2[valid]
        g2 = (g2 - b.mean()) * (a.std() / max(b.std(), 1e-6)) + a.mean()
    g1 = np.clip(g1, 0, 255).astype(np.uint8)
    g2 = np.clip(g2, 0, 255).astype(np.uint8)
    _, smap = ssim(g1, g2, full=True, data_range=255)
    changed = ((1.0 - smap) > DIFF_PIXEL) & valid
    k = np.ones((5, 5), np.uint8)
    changed = cv2.morphologyEx(changed.astype(np.uint8), cv2.MORPH_OPEN, k)
    changed = cv2.morphologyEx(changed, cv2.MORPH_CLOSE, k)
    return changed.astype(bool), valid


def compare(orig, cand):
    """Compare one candidate with one original. Returns a verdict dict or None if unrelated."""
    res = align(orig, cand)
    if res is None:
        return None
    aligned, valid, inliers = res
    changed, valid = diff_mask(orig, aligned, valid)
    n_valid = max(int(valid.sum()), 1)
    changed_ratio = float(changed.sum()) / n_valid
    info = {
        "inliers": inliers,
        "changed_ratio": round(changed_ratio, 4),
        "face_change": None,
        "face_share": None,
        "identity_cos": None,
    }

    face_boxes = faces(orig)
    total_changed = max(int(changed.sum()), 1)
    best_face_change, in_face = 0.0, 0
    for (x, y, w, h, emb) in face_boxes:
        px, py = int(w * 0.15), int(h * 0.15)  # expand box a little
        x0, y0 = max(x - px, 0), max(y - py, 0)
        x1, y1 = min(x + w + px, orig.shape[1]), min(y + h + py, orig.shape[0])
        box = changed[y0:y1, x0:x1]
        best_face_change = max(best_face_change, float(box.sum()) / max(box.size, 1))
        in_face += int(box.sum())
    if face_boxes:
        info["face_change"] = round(best_face_change, 4)
        info["face_share"] = round(in_face / total_changed, 4)

    # Optional identity check (only when InsightFace is installed)
    if _INSIGHT is not None and face_boxes and face_boxes[0][4] is not None:
        cand_faces = faces(aligned)
        if cand_faces:
            ox, oy, ow, oh, oemb = face_boxes[0]
            cx = lambda f: (f[0] + f[2] / 2, f[1] + f[3] / 2)
            near = min(
                cand_faces,
                key=lambda f: (cx(f)[0] - (ox + ow / 2)) ** 2 + (cx(f)[1] - (oy + oh / 2)) ** 2,
            )
            info["identity_cos"] = round(float(np.dot(oemb, near[4])), 3)

    face_hit = (info["face_change"] or 0) >= FACE_CHANGE_MIN and (
        info["face_share"] or 0
    ) >= FACE_SHARE_MIN
    if changed_ratio < SAME_IMAGE_MAX and not face_hit:
        verdict = "SAME_IMAGE"  # re-encoded / resized / cropped / re-toned, nothing edited
    elif changed_ratio > GLOBAL_EDIT_MIN:
        verdict = "GLOBAL_EDIT"  # filter, colour grade or full re-render
    elif (
        info["identity_cos"] is not None
        and info["identity_cos"] < IDENTITY_MIN
        and (info["face_change"] or 0) >= FACE_CHANGE_MIN
    ):
        verdict = "FACE_SWAPPED"  # same scene, different person's face
    elif face_hit:
        verdict = "FACE_EDITED"  # change concentrated on the face (possible swap)
    else:
        verdict = "EDITED_OUTSIDE_FACE"  # object / background edit
    info["verdict"] = verdict
    info["_aligned"], info["_changed"] = aligned, changed
    return info


def overlay(orig, changed):
    """Red heatmap on the original so judges can SEE what changed."""
    out = orig.copy()
    red = np.zeros_like(out)
    red[:, :, 2] = 255
    m = changed[:, :, None]
    return np.where(m, (0.5 * out + 0.5 * red).astype(np.uint8), out)


def find_original(cand, registry):
    """registry: list of {"id": str, "img": BGR array}. Brute force is fine for a hackathon
    (tens of images). For more, pre-filter with phash()/bands() first."""
    best, best_id = None, None
    for item in registry:
        r = compare(item["img"], cand)
        if r is not None and (best is None or r["inliers"] > best["inliers"]):
            best, best_id = r, item["id"]
    return best_id, best


def check(cand, registry):
    """Public entry point for the registry-scan flow. Returns a JSON-friendly verdict."""
    oid, r = find_original(cand, registry)
    if r is None:
        return {"verdict": "NO_REGISTERED_ORIGINAL", "original": None}
    out = {k: v for k, v in r.items() if not k.startswith("_")}
    out["original"] = oid
    return out


if __name__ == "__main__":
    reg_dir, cand_path = sys.argv[1], sys.argv[2]
    reg = [
        {"id": os.path.basename(p), "img": load(p)}
        for p in sorted(glob.glob(os.path.join(reg_dir, "*")))
        if p.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    ]
    cand = load(cand_path)
    oid, r = find_original(cand, reg)
    if r is None:
        print({"verdict": "NO_REGISTERED_ORIGINAL"})
    else:
        print({k: v for k, v in r.items() if not k.startswith("_")}, "original:", oid)
        if len(sys.argv) > 3:
            orig_img = next(i["img"] for i in reg if i["id"] == oid)
            cv2.imwrite(sys.argv[3], overlay(orig_img, r["_changed"]))

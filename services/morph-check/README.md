# morph-check service

Standalone Python microservice wrapping `morph_check.py`'s alignment/diff/face-region analysis
as an HTTP API. Called by UnMorph's Next.js backend (`src/lib/morph-service.ts`) from
[`/api/check`](../../src/app/api/check/route.ts) once Arkiv + Swarm have already identified
the matching registered original — this service never touches Arkiv, Swarm, or the network
itself; it only ever receives two image buffers and returns a verdict.

## Run it

```bash
cd services/morph-check
python -m venv .venv
. .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --host 0.0.0.0 --port 8001
```

Then point the Next.js app at it:

```env
# .env
MORPH_SERVICE_URL=http://localhost:8001
```

If `MORPH_SERVICE_URL` is unset or the service is unreachable, `/api/check` degrades
gracefully — it just omits the `morphAnalysis` field from its response rather than failing
the whole request (the existing pHash/Arkiv verdict still works on its own).

## Endpoints

- `GET /health` — `{ status, insightface_available, haar_available }`. Useful to confirm
  whether the optional InsightFace identity model loaded.
- `POST /compare` — multipart form: `original` (file), `candidate` (file), optional
  `include_overlay` (bool, default `true`). The real integration path: one known original vs.
  one candidate.
- `POST /check-registry` — multipart form: `candidate` (file), `registry` (multiple files),
  optional `include_overlay`. Reproduces the original CLI's "scan a whole directory" mode, for
  standalone testing outside the Arkiv-driven flow.

## Verdicts

| Verdict               | Meaning                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `SAME_IMAGE`            | Re-encoded / resized / cropped / re-toned — nothing meaningfully edited. |
| `GLOBAL_EDIT`           | A filter, color grade, or full re-render changed most of the frame.      |
| `FACE_SWAPPED`          | Same scene, but the face region's identity embedding doesn't match (requires InsightFace). |
| `FACE_EDITED`           | Change is concentrated on the face region (possible swap, identity check unavailable or inconclusive). |
| `EDITED_OUTSIDE_FACE`   | A localized object/background edit outside any detected face.           |
| `UNALIGNABLE`           | `/compare` only — too few ORB feature matches to align the pair at all (very different images, or one is unreadable/corrupt). |
| `NO_REGISTERED_ORIGINAL` | `/check-registry` only — no image in the registry aligned well enough to compare. |

All thresholds (`MIN_INLIERS`, `DIFF_PIXEL`, `FACE_CHANGE_MIN`, …) live at the top of
`morph_check.py` and are **starting points** — tune them against your own test set.

## Optional: better face-swap identity signal

```bash
pip install insightface onnxruntime
```

Without these, face-region change is still detected (via OpenCV Haar cascades, bundled with
`opencv-python-headless`), but `identity_cos` stays `null` and `FACE_SWAPPED` can never be
returned — only the less specific `FACE_EDITED`.

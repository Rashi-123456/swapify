# Swapify Backend — Frontend Integration Guide

**For:** Rashi (frontend) · **From:** Dhruv (backend) · **Updated:** 2026-07-14

Base URL: **`https://swapify-3.onrender.com`**

Everything below is verified working. Where a response shape is quirky, it is called out
under [Gotchas](#gotchas) — please read that section before wiring anything up, it will
save you an afternoon.

> ### ⚠️ Read this first — production is running stale code
>
> As of this writing the live Render service is **an older build**. The scan-logging
> endpoints in [§5](#5-scan-logging-real-world-testing) — the ones this doc is mainly
> about — **return 404 in production right now.** The barcode fixes in [§2](#2-scanning-a-product)
> are also not live yet.
>
> **Do not start integration against the live URL until the current `main` is deployed.**
> Ping me and I'll confirm. Once deployed, `GET /health` will report
> `"products_loaded": 102` and include an `uptime_seconds` field — if you see a bare
> `{"status":"ok"}`, you are still hitting the old build.

---

## 1. Authentication

Register, then log in to get a JWT. Send it as `Authorization: Bearer <token>`.

```http
POST /register
Content-Type: application/json

{ "email": "you@example.com", "password": "Test1234!", "username": "rashi" }
```

```http
POST /login
{ "email": "you@example.com", "password": "Test1234!" }
→ 200 { "access_token": "eyJ..." }
```

**`username` is required on register** — omitting it returns `422`, not a helpful error.

| Endpoint | Auth |
| --- | --- |
| `/product/{barcode}`, `/search`, `/validate-barcode/{barcode}` | optional (better response when authed) |
| `/history`, `/favorites`, `/preferences` | **required** — JWT only |
| `POST /experiment/log-scan` | optional |
| `GET /experiment/logs`, `/experiment/analytics` | **admin only** |

Passing `device_id` does **not** authenticate you. `/history` and `/favorites` will
return `401` without a Bearer token — that's expected, not a bug.

---

## 2. Scanning a product

```http
GET /product/{barcode}?device_id=<optional-device-id>
```

Send the barcode **exactly as the scanner library gives it to you** — bare digits, no
spaces. Don't try to clean or "fix" it client-side; the backend handles that.

Returns the product with its health `score` (0–10) and `grade` (A–F).

### `barcode_matched_on` — expect this field

Part of the catalogue was transcribed by hand from the physical packs, and **46 products
have a barcode whose GS1 check digit doesn't match its payload**. A scanner can never
emit such a code (it validates the check digit before it hands you anything), so those
products used to be unreachable — a guaranteed 404 in the field.

The backend now falls back to matching on the **GS1 payload** (everything except the
check digit), which identifies the product on its own. Your scan resolves correctly, and
the response tells you it took the fallback path:

```json
{
  "product_name": "Kitkat",
  "brand": "Nestle",
  "grade": "F",
  "score": 1.0,
  "barcode_matched_on": {
    "scanned": "8901058570014",
    "stored": "8901058570017",
    "reason": "check_digit_mismatch",
    "detail": "The stored barcode's check digit does not match its GS1 payload; matched on the payload. The stored value needs re-verifying against the physical pack."
  }
}
```

**You can ignore this field for normal display** — the product data is correct. It exists
so bad catalogue rows stay visible instead of silently passing. If you can surface it in
a debug view during field testing, that helps us find the packs Chandrika needs to
re-check.

### Not-found behaviour

If the barcode isn't in our catalogue, the backend tries **Open Food Facts** and returns
that product with `"source": "openfoodfacts"`. So a `200` does **not** guarantee the
product came from us. Check `source` if that distinction matters to your UI. A true miss
returns `404`.

---

## 3. Search

```http
GET /search?q=chocolate&limit=10&offset=0
```

Optional filters: `brand`, `category`, `grade`, `min_score`, `max_score`,
`sort` (`score_desc` default).

⚠️ **Returns a bare JSON array, not an object** — and each item uses **`name`**, not
`product_name`:

```json
[ { "barcode": "8906068720018", "name": "Max chocolate protein bar",
    "brand": "Max protein bar", "category": "bar",
    "score": 5.0, "grade": "C", "image_url": "/product-images/_placeholder.svg" } ]
```

There is also `GET /search/autocomplete?q=cho` for type-ahead.

---

## 4. History & Favorites

Both require a Bearer token.

```http
GET    /history                      → products the user has scanned, newest first
GET    /favorites                    → the user's saved products
POST   /favorites                    { "barcode": "8901058570017" }
DELETE /favorites/{barcode}
```

History is written automatically when `/product/{barcode}` is called with a `device_id`
or a Bearer token — you don't post to it.

---

## 5. Scan logging (real-world testing)

This is the pair to instrument the field test with.

### Write a scan — open, no auth needed

```http
POST /experiment/log-scan
Content-Type: application/json

{
  "barcode": "8901058570014",
  "device_type": "mobile",
  "device_info": { "os": "iOS 17.4", "browser": "Safari" },
  "device_id": "rashi-phone-01",
  "notes": "in-store scan, KitKat shelf"
}
```

**`barcode` is the only required field.** Everything else is optional and auto-derived:

- `device_type` — inferred from the `User-Agent` if omitted. One of `mobile`, `tablet`,
  `desktop`, `scanner`, `unknown`. An unrecognised value is stored as `unknown` rather
  than rejected, so a typo never costs you a data point.
- `device_id` — if omitted, a stable fingerprint is derived from `User-Agent` +
  `device_info`, so "unique devices" still means something. **Prefer sending your own**
  stable id so the counts are exact.
- `timestamp` — ISO-8601. Defaults to server time (a phone with a wrong clock can't skew
  the experiment window).
- If a Bearer token is present the scan is attributed to that user; otherwise anonymous.

```json
→ 200 { "message": "Scan logged",
        "log": { "id": 75, "barcode": "8901058570014", "device_type": "mobile",
                 "device_id": "rashi-phone-01", "user_id": 74,
                 "timestamp": "2026-07-14T10:37:30Z" } }
```

Log **every** scan attempt, including ones that 404 — a barcode we don't have is exactly
the data point worth capturing.

### Read the logs — admin only

```http
GET /experiment/logs?limit=100&offset=0
X-Admin-Token: <ask me for this>
```

Filters: `start_date`, `end_date` (inclusive `YYYY-MM-DD`), `device_type`, `barcode`.

```json
{
  "filters":    { "start_date": null, "end_date": null, "device_type": null, "barcode": null },
  "pagination": { "limit": 100, "offset": 0, "returned": 14, "matched": 14, "has_more": false },
  "analytics":  { "total_scans": 14, "unique_devices": 6, "unique_barcodes": 4,
                  "scans_by_device_type": { "mobile": 8, "desktop": 3, "tablet": 2, "unknown": 1 },
                  "top_barcodes": [ { "barcode": "8901491101837", "scans": 7 } ] },
  "logs":       [ ... ]
}
```

`GET /experiment/analytics` takes the same filters and returns just the counts — use it
for a dashboard that doesn't want to pull every row to render three numbers.

Without the token these return **403**. This is deliberate: writes are open because test
phones have no account, but the log is a device-level record, so reads are gated.
**The admin token is a shared secret — ask me directly, don't commit it.**

---

## 6. Useful extras

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Liveness. Reports `uptime_seconds`, `products_loaded`, `database`. |
| `GET /validate-barcode/{barcode}` | Check a barcode's format/check digit; returns a `suggestion` when it can derive one. Handy for a manual-entry field. |
| `GET /score/{barcode}` · `GET /v2/score/{barcode}` | Health score on its own. |
| `GET /similar/{barcode}` | Healthier swaps for a product. |
| `GET /compare/{a}/{b}` | Side-by-side comparison. |
| `POST /report-missing` | User reports a product we don't stock. |

Full reference: `API_DOCS.md` in the repo.

---

## Gotchas

Things that will cost you time if you don't know them:

1. **The live service is stale.** `/experiment/*` 404s in production until the current
   build is deployed. Check `GET /health` for `products_loaded` before you start.
2. **`/search` returns `name`; `/product/{barcode}` returns `product_name`.** Same
   concept, different key. Don't share a parser between them.
3. **`/search` returns a bare array**, not `{ "results": [...] }`.
4. **`/register` requires `username`** or you get a bare `422`.
5. **`device_id` is not auth.** `/history` and `/favorites` need a real JWT.
6. **A `200` from `/product/` may be an Open Food Facts result**, not our catalogue —
   check `"source"`.
7. **Render free tier cold-starts.** The first request after idle can take ~30–50s. A
   cron job pings `/health` every 5 minutes to keep it warm, but don't set an aggressive
   client timeout — give the first call a generous one.

Anything unclear or not behaving as documented, message me — don't work around it, it's
probably a bug worth fixing.

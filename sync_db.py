"""Automatic CSV -> database sync (Task 5).

Reads ``products.csv`` and reconciles it into the live ``products`` table so the
database is always the up-to-date source of truth the API reads from. Safe to run
repeatedly (idempotent) — it is the ops tool you point at the live database after
editing the CSV, and the same logic the app uses to seed a brand-new DB.

What it handles
---------------
* **New products**      — a barcode in the CSV but not in the DB is INSERTed.
* **Updates**           — an existing barcode whose nutrition/identity fields
                          changed is UPDATEd (only the CSV-owned columns; the
                          crowdsourced ``image_url`` and ``ingredients_text`` are
                          preserved, never clobbered with blanks).
* **Duplicates**        — the same barcode appearing twice in the CSV is
                          de-duplicated (last row wins) and counted once, so a
                          duplicate never creates two rows or double-counts.
* **Unchanged**         — a row identical to the DB is left untouched.

Usage
-----
    python sync_db.py                 # sync CSV -> DB
    python sync_db.py --dry-run       # show what would change, write nothing
    python sync_db.py --csv other.csv --db /data/swapify.db

Environment
-----------
    SWAPIFY_DB_PATH / DATABASE_PATH   override the database location (same var the
                                      app uses, so ``sync_db.py`` targets exactly
                                      the DB the live server reads).
    SWAPIFY_CSV_PATH                  override the CSV location.
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sqlite3
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB = (
    os.environ.get("SWAPIFY_DB_PATH")
    or os.environ.get("DATABASE_PATH")
    or os.path.join(BASE_DIR, "swapify.db")
)
DEFAULT_CSV = os.environ.get("SWAPIFY_CSV_PATH") or os.path.join(BASE_DIR, "products.csv")

# Columns the CSV is authoritative for — compared and overwritten on every sync.
SYNC_COLUMNS = (
    "product_name", "brand", "serving_size_g",
    "sugar_g_per_serving", "saturated_fat_g_per_serving", "sodium_mg_per_serving",
    "protein_g_per_serving", "fiber_g_per_serving", "calories_kcal_per_serving",
)

# Curated columns set only when a product is first INSERTed and then PRESERVED on
# update — they may be hand-tuned after import (see fix_data.py, which recategorises
# Snickers/Cadbury and adds ingredient lists) or populated by other flows
# (crowdsourced image uploads, Open Food Facts enrichment). A CSV sync must never
# clobber them. ``category`` is only *derived* from the CSV name, so it belongs here.
INSERT_ONLY_COLUMNS = ("category", "ingredients_text", "image_url")

_CATEGORY_KEYWORDS = (
    "bar", "yogurt", "chips", "milkshake", "cereals", "museli", "noodles",
    "chocolate", "drink", "biscuits", "cookie", "mixture", "pie",
)


def normalize_barcode(barcode) -> str:
    """Strip the separators a barcode is never stored with (spaces, hyphens).

    A scanner emits bare digits, so a stored barcode carrying a space can never be
    matched by a scan — the CSV's Red Bull row ('0000 901626026') was exactly this.
    """
    return re.sub(r"[\s\-]", "", ("" if barcode is None else str(barcode)).strip())


def parse_num(value: str) -> float:
    """Parse a nutrient cell like '24. 5 mg' / 'not listed' into a float."""
    text = (value or "").lower().strip()
    if not text or "not listed" in text:
        return 0.0
    match = re.search(r"[\d.]+", text.replace(" ", ""))
    try:
        return float(match.group()) if match else 0.0
    except ValueError:
        return 0.0


def guess_category(name: str) -> str:
    name = (name or "").lower()
    for cat in _CATEGORY_KEYWORDS:
        if cat in name:
            return cat
    return "other"


def ensure_products_table(conn: sqlite3.Connection) -> None:
    """Create the products table if it does not exist (so a fresh DB syncs too)."""
    conn.execute('''
        CREATE TABLE IF NOT EXISTS products (
            barcode TEXT PRIMARY KEY,
            product_name TEXT,
            brand TEXT,
            category TEXT,
            serving_size_g REAL,
            sugar_g_per_serving REAL,
            saturated_fat_g_per_serving REAL,
            sodium_mg_per_serving REAL,
            protein_g_per_serving REAL,
            fiber_g_per_serving REAL,
            calories_kcal_per_serving REAL,
            ingredients_text TEXT,
            image_url TEXT
        )
    ''')
    conn.execute("CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_products_product_name ON products(product_name)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)")
    conn.commit()


def read_csv_rows(csv_path: str) -> "dict[str, dict]":
    """Read the CSV into a ``{barcode: row_values}`` map, de-duplicating barcodes.

    Later rows overwrite earlier ones for the same barcode (last-wins), so a
    duplicate barcode yields exactly one record.
    """
    records: "dict[str, dict]" = {}
    duplicates = 0
    with open(csv_path, mode="r", encoding="utf-8") as fh:
        reader = csv.reader(fh)
        next(reader, None)  # header
        for row in reader:
            if not row or len(row) < 11:
                continue
            barcode = normalize_barcode(row[1])
            if not barcode:
                continue

            product_name = row[2].strip()
            values = {
                "product_name": product_name,
                "brand": row[3].strip(),
                "category": guess_category(product_name),
                "serving_size_g": parse_num(row[4]),
                "sugar_g_per_serving": parse_num(row[5]),
                "saturated_fat_g_per_serving": parse_num(row[6]),
                "sodium_mg_per_serving": parse_num(row[7]),
                "protein_g_per_serving": parse_num(row[8]),
                "fiber_g_per_serving": parse_num(row[9]),
                "calories_kcal_per_serving": parse_num(row[10]),
                "ingredients_text": None, "image_url": None,
            }

            if barcode in records:
                duplicates += 1
            records[barcode] = values
    return records, duplicates


def _row_differs(existing: sqlite3.Row, values: dict) -> bool:
    """True when any CSV-owned column differs from the stored row."""
    for col in SYNC_COLUMNS:
        old = existing[col]
        new = values[col]
        if isinstance(new, float) or isinstance(old, float):
            # tolerate float representation noise
            try:
                if round(float(old or 0), 4) != round(float(new or 0), 4):
                    return True
            except (TypeError, ValueError):
                if old != new:
                    return True
        elif (old or "") != (new or ""):
            return True
    return False


def repair_stored_barcodes(conn: sqlite3.Connection, dry_run: bool = False) -> list:
    """Rewrite any stored barcode that carries a space/hyphen to its bare-digit form.

    Such a row predates ``normalize_barcode`` and is unreachable by a scan, which only
    ever emits bare digits. Renaming the key in place preserves the row's curated
    columns (image, ingredients). A row whose normalised form would collide with an
    existing barcode is left alone and reported — that is a genuine duplicate for a
    human to resolve, not something to silently merge.
    """
    repaired = []
    cur = conn.cursor()
    for row in cur.execute("SELECT barcode FROM products").fetchall():
        old = row["barcode"]
        new_code = normalize_barcode(old)
        if new_code == old or not new_code:
            continue
        clash = cur.execute(
            "SELECT 1 FROM products WHERE barcode = ?", (new_code,)
        ).fetchone()
        if clash:
            repaired.append((old, new_code, "SKIPPED (would collide)"))
            continue
        if not dry_run:
            cur.execute(
                "UPDATE products SET barcode = ? WHERE barcode = ?", (new_code, old)
            )
        repaired.append((old, new_code, "renamed"))
    if not dry_run:
        conn.commit()
    return repaired


def sync(csv_path: str, db_path: str, dry_run: bool = False) -> dict:
    """Reconcile the CSV into the DB. Returns a summary of the changes."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    records, duplicates = read_csv_rows(csv_path)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    ensure_products_table(conn)
    cur = conn.cursor()

    # Normalise legacy keys first, so a row stored as '0000 901626026' is recognised
    # as the CSV's '0000901626026' below and updated, not inserted a second time.
    repaired = repair_stored_barcodes(conn, dry_run=dry_run)

    new = updated = unchanged = 0
    changed_examples = []

    for barcode, values in records.items():
        cur.execute("SELECT * FROM products WHERE barcode = ?", (barcode,))
        existing = cur.fetchone()

        if existing is None:
            new += 1
            if not dry_run:
                insert_cols = ("barcode",) + SYNC_COLUMNS + INSERT_ONLY_COLUMNS
                cols = ", ".join(insert_cols)
                placeholders = ", ".join(["?"] * len(insert_cols))
                cur.execute(
                    f"INSERT INTO products ({cols}) VALUES ({placeholders})",
                    (barcode,
                     *(values[c] for c in SYNC_COLUMNS),
                     *(values[c] for c in INSERT_ONLY_COLUMNS)),
                )
            if len(changed_examples) < 10:
                changed_examples.append(("NEW", barcode, values["product_name"]))
        elif _row_differs(existing, values):
            updated += 1
            if not dry_run:
                assignments = ", ".join(f"{c} = ?" for c in SYNC_COLUMNS)
                cur.execute(
                    f"UPDATE products SET {assignments} WHERE barcode = ?",
                    (*(values[c] for c in SYNC_COLUMNS), barcode),
                )
            if len(changed_examples) < 10:
                changed_examples.append(("UPDATED", barcode, values["product_name"]))
        else:
            unchanged += 1

    if not dry_run:
        conn.commit()
    cur.execute("SELECT COUNT(*) FROM products")
    total_after = cur.fetchone()[0]
    conn.close()

    return {
        "csv_rows": len(records) + duplicates,
        "unique_barcodes": len(records),
        "duplicates_collapsed": duplicates,
        "new": new,
        "updated": updated,
        "unchanged": unchanged,
        "total_in_db": total_after,
        "dry_run": dry_run,
        "examples": changed_examples,
        "repaired_barcodes": repaired,
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Sync products.csv into the Swapify database.")
    parser.add_argument("--csv", default=DEFAULT_CSV, help="Path to the products CSV.")
    parser.add_argument("--db", default=DEFAULT_DB, help="Path to the SQLite database.")
    parser.add_argument("--dry-run", action="store_true",
                        help="Report what would change without writing.")
    args = parser.parse_args(argv)

    print(f"CSV : {args.csv}")
    print(f"DB  : {args.db}")
    print("Mode: DRY-RUN (no writes)" if args.dry_run else "Mode: WRITE")
    print("-" * 60)

    try:
        summary = sync(args.csv, args.db, dry_run=args.dry_run)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}")
        return 1

    if summary["repaired_barcodes"]:
        print("Malformed barcodes normalised:")
        for old, new_code, action in summary["repaired_barcodes"]:
            print(f"  {old!r} -> {new_code!r}  [{action}]")
        print("-" * 60)

    print(f"CSV rows read          : {summary['csv_rows']}")
    print(f"Unique barcodes        : {summary['unique_barcodes']}")
    print(f"Duplicates collapsed   : {summary['duplicates_collapsed']}")
    print(f"New products inserted   : {summary['new']}")
    print(f"Products updated        : {summary['updated']}")
    print(f"Unchanged               : {summary['unchanged']}")
    print(f"Total products in DB    : {summary['total_in_db']}")
    if summary["examples"]:
        print("-" * 60)
        print("Sample changes:")
        for action, barcode, name in summary["examples"]:
            print(f"  [{action:<7}] {barcode}  {name}")
    print("-" * 60)
    print("Dry run complete — no changes written." if summary["dry_run"] else "Sync complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Split db/seed-tool-posts.sql into ~80 KB pasteable parts for the Neon
SQL Editor. Splits only on statement boundaries (lines starting with
INSERT INTO), keeps the file header in part 1, and verifies that the
parts reassemble byte-for-byte to the original file.
Usage: python3 split-seed.py [seed.sql] [outdir]"""
import os
import re
import shutil
import sys
import zipfile

SEED = sys.argv[1] if len(sys.argv) > 1 else "db/seed-tool-posts.sql"
OUTDIR = sys.argv[2] if len(sys.argv) > 2 else "/tmp/neon-seed-chunks"
TARGET = 80_000  # bytes per part, approx.

with open(SEED, "rb") as f:
    data = f.read()

text = data.decode("utf-8")
# Header = everything before the first INSERT; statements = each INSERT block.
m = re.search(r"(?m)^INSERT INTO ", text)
assert m, "no INSERT statements found"
header, rest = text[: m.start()], text[m.start() :]
starts = [s.start() for s in re.finditer(r"(?m)^INSERT INTO ", rest)]
statements = [rest[a:b] for a, b in zip(starts, starts[1:] + [len(rest)])]
print(f"{len(statements)} statements, {len(data)} bytes total")

parts: list[str] = []
current = header
for stmt in statements:
    if len(current.encode("utf-8")) + len(stmt.encode("utf-8")) > TARGET and current != header:
        parts.append(current)
        current = stmt
    else:
        current += stmt
if current:
    parts.append(current)

os.makedirs(OUTDIR, exist_ok=True)
for name in os.listdir(OUTDIR):
    os.remove(os.path.join(OUTDIR, name))

published = len(statements)
readme = f"""CalcHub blog seed — pasteable parts for the Neon SQL editor
===========================================================

The full seed file (db/seed-tool-posts.sql) is too big to paste into the
Neon SQL Editor in one go, so it is split here into {len(parts)} parts of
about 80 KB each. Nothing inside any post was changed by the split.

How to use
----------
1. Run db/schema.sql FIRST (or the schema SQL from the earlier message)
   so the blog_posts table exists.
2. Unzip this file. Open seed-part-01.sql, select all, copy, paste into
   the Neon SQL Editor, Run, and wait for it to finish.
3. Repeat for parts 02-{len(parts):02d}, IN ORDER.
4. Verify by pasting this into the editor and running it:

     SELECT count(*) AS total_posts,
            count(*) FILTER (WHERE status = 'published') AS published
     FROM blog_posts;

   Expect total_posts = {published} and published = {published}. If the count is lower,
   re-run just the part that failed.

Safe to re-run
--------------
The seed uses ON CONFLICT (slug) DO UPDATE: running a part again
REFRESHES the posts it contains (title, excerpt, content, category,
tags, status, updated_at) instead of skipping them or duplicating them.
The original created_at (publish date) is kept. So if you already loaded
the OLD seed, running these parts replaces the old posts with the new
ones — no need to delete anything first.

Paste only SQL into the editor — never a psql command line.
"""
with open(os.path.join(OUTDIR, "README.txt"), "w") as f:
    f.write(readme)

for i, part in enumerate(parts, 1):
    with open(os.path.join(OUTDIR, f"seed-part-{i:02d}.sql"), "w") as f:
        f.write(part)

# Verify: parts must reassemble to the original file byte-for-byte.
reassembled = "".join(parts).encode("utf-8")
assert reassembled == data, "reassembly mismatch — split is not lossless"
print(f"Wrote {len(parts)} parts to {OUTDIR}; reassembly verified byte-identical.")
for i, part in enumerate(parts, 1):
    print(f"  seed-part-{i:02d}.sql  {len(part.encode('utf-8'))} bytes")

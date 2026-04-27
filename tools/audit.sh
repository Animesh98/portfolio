#!/usr/bin/env bash
# Portfolio audit — Lighthouse + Playwright responsive screenshots.
# Run on the gaming PC WSL (where headless Chromium works).
#
# Usage:   ./tools/audit.sh [URL]
# Default URL: https://animesh98.github.io/portfolio/
#
# Output: ~/portfolio-audit-YYYYMMDD-HHMM/
#   ├── lighthouse.html   <-- open this in a browser for the perf report
#   ├── lighthouse.json
#   ├── desktop.png       (1440 × 900)
#   ├── tablet.png        (768  × 1024)
#   ├── mobile.png        (375  × 812)
#   ├── console.log       (browser console + JS errors)
#   └── summary.txt       (LCP, CLS, TBT, scores at a glance)

set -euo pipefail

URL="${1:-https://animesh98.github.io/portfolio/}"
STAMP="$(date +%Y%m%d-%H%M)"
OUT="$HOME/portfolio-audit-$STAMP"
mkdir -p "$OUT"

echo "=== Portfolio audit ==="
echo "URL:    $URL"
echo "Output: $OUT"
echo

# --- Sanity checks -----------------------------------------------------------
if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: npx not found. Install Node.js 20+ first (curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install nodejs)." >&2
  exit 1
fi

# --- Lighthouse --------------------------------------------------------------
echo "[1/3] Lighthouse (this takes ~30s)..."
npx --yes lighthouse "$URL" \
    --quiet \
    --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage" \
    --output=html --output=json \
    --output-path="$OUT/lighthouse" \
    --preset=desktop \
    --only-categories=performance,accessibility,best-practices,seo \
    || { echo "Lighthouse failed. Continuing with screenshots."; }

# --- Playwright screenshots + console capture --------------------------------
echo "[2/3] Playwright screenshots..."
TMP_PROJECT="$(mktemp -d)"
pushd "$TMP_PROJECT" >/dev/null
npm init -y >/dev/null 2>&1
npm install --silent playwright@latest >/dev/null 2>&1
npx --yes playwright install --with-deps chromium >/dev/null 2>&1 || \
    npx --yes playwright install chromium >/dev/null 2>&1

cat > shoot.mjs <<'JS'
import { chromium } from 'playwright';

const url = process.env.URL;
const out = process.env.OUT;
const log = [];

const sizes = [
  { name: 'desktop', w: 1440, h: 900,  device: false },
  { name: 'tablet',  w: 768,  h: 1024, device: false },
  { name: 'mobile',  w: 375,  h: 812,  device: true  },
];

const browser = await chromium.launch({ args: ['--no-sandbox'] });
for (const s of sizes) {
  const ctx = await browser.newContext({
    viewport: { width: s.w, height: s.h },
    isMobile: s.device,
    deviceScaleFactor: s.device ? 2 : 1,
  });
  const page = await ctx.newPage();
  page.on('console', msg => log.push(`[${s.name}] [${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => log.push(`[${s.name}] [pageerror] ${err.message}`));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);  // let reveal animations settle
  await page.screenshot({ path: `${out}/${s.name}.png`, fullPage: true });
  console.log(`  ${s.name}: ${s.w}x${s.h} -> ${s.name}.png`);
  await ctx.close();
}
await browser.close();

import { writeFileSync } from 'fs';
writeFileSync(`${out}/console.log`, log.join('\n') + '\n');
JS

URL="$URL" OUT="$OUT" node shoot.mjs
popd >/dev/null
rm -rf "$TMP_PROJECT"

# --- Summary -----------------------------------------------------------------
echo "[3/3] Writing summary..."
if [ -f "$OUT/lighthouse.report.json" ]; then mv "$OUT/lighthouse.report.json" "$OUT/lighthouse.json"; fi
if [ -f "$OUT/lighthouse.report.html" ]; then mv "$OUT/lighthouse.report.html" "$OUT/lighthouse.html"; fi

if [ -f "$OUT/lighthouse.json" ]; then
  python3 - "$OUT/lighthouse.json" "$OUT/summary.txt" <<'PY'
import json, sys
p, o = sys.argv[1], sys.argv[2]
d = json.load(open(p))
cats = d.get('categories', {})
a = d.get('audits', {})
def pct(c): return f"{int(round(cats[c]['score']*100))}/100" if c in cats and cats[c].get('score') is not None else 'n/a'
def metric(k):
    v = a.get(k, {})
    return v.get('displayValue', 'n/a')
lines = [
  f"URL:               {d.get('finalDisplayedUrl','?')}",
  f"Fetched:           {d.get('fetchTime','?')}",
  "",
  "Scores:",
  f"  Performance:     {pct('performance')}",
  f"  Accessibility:   {pct('accessibility')}",
  f"  Best Practices:  {pct('best-practices')}",
  f"  SEO:             {pct('seo')}",
  "",
  "Core Web Vitals:",
  f"  LCP (Largest Contentful Paint):  {metric('largest-contentful-paint')}",
  f"  CLS (Cumulative Layout Shift):   {metric('cumulative-layout-shift')}",
  f"  TBT (Total Blocking Time):       {metric('total-blocking-time')}",
  f"  FCP (First Contentful Paint):    {metric('first-contentful-paint')}",
  f"  Speed Index:                     {metric('speed-index')}",
]
open(o, 'w').write('\n'.join(lines) + '\n')
print(open(o).read())
PY
else
  echo "(Lighthouse output missing — only screenshots produced)" > "$OUT/summary.txt"
fi

echo
echo "=== Done ==="
echo "Open $OUT/lighthouse.html in a browser for the full report."
echo "Screenshots: $OUT/{desktop,tablet,mobile}.png"
echo "Summary:     $OUT/summary.txt"

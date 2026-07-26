/**
 * Download public-domain images from the National Diet Library (NDL) via its
 * official IIIF APIs — the sanctioned route, not HTML scraping.
 *
 * IIIF is only offered for items NDL publishes as インターネット公開（保護期間満了）,
 * i.e. out of copyright. Anything still restricted has no IIIF manifest and
 * simply 404s here; always confirm an item's rights statement yourself before
 * reusing a scan for anything beyond private study.
 *
 * Usage:
 *   node scripts/ndl-download.mjs <PID...> [options]
 *   node scripts/ndl-download.mjs --file pids.txt
 *
 * A PID is the numeric part of a 次世代デジタルライブラリー / デジタルコレクション
 * URL, e.g. https://dl.ndl.go.jp/pid/1287221 -> 1287221
 *
 * Options:
 *   --file <path>     Read PIDs from a file (one per line; # comments allowed)
 *   --out <dir>       Output directory (default: ./outputs/ndl)
 *   --max-pages <n>   Stop after n images per item (default: all)
 *   --delay <ms>      Pause between image requests (default: 1500)
 *   --overwrite       Re-download files that already exist (default: skip)
 *   --dry-run         Resolve manifests and print the plan, download nothing
 *
 * Politeness: requests run strictly one at a time with a delay in between and
 * back off on 429/5xx. Please leave the delay generous — this is a public
 * library's infrastructure, not a CDN.
 */
import fs from "fs";
import path from "path";

const IIIF_MANIFEST = (pid) => `https://www.dl.ndl.go.jp/api/iiif/${pid}/manifest.json`;

const USER_AGENT =
  "japandi-poster-studio/ndl-download (public-domain IIIF archival; contact: repository owner)";

function parseArgs(argv) {
  const opts = {
    pids: [],
    out: "./outputs/ndl",
    maxPages: Infinity,
    delay: 1500,
    overwrite: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--file": {
        const file = argv[++i];
        if (!file) fail("--file needs a path");
        if (!fs.existsSync(file)) fail(`No such file: ${file}`);
        for (const line of fs.readFileSync(file, "utf8").split("\n")) {
          const pid = line.replace(/#.*$/, "").trim();
          if (pid) opts.pids.push(pid);
        }
        break;
      }
      case "--out":
        opts.out = argv[++i] ?? fail("--out needs a path");
        break;
      case "--max-pages": {
        const n = Number(argv[++i]);
        if (!Number.isFinite(n) || n < 1) fail("--max-pages needs a positive number");
        opts.maxPages = n;
        break;
      }
      case "--delay": {
        const n = Number(argv[++i]);
        if (!Number.isFinite(n) || n < 0) fail("--delay needs a non-negative number");
        opts.delay = n;
        break;
      }
      case "--overwrite":
        opts.overwrite = true;
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      default:
        if (arg.startsWith("-")) fail(`Unknown option: ${arg}`);
        opts.pids.push(arg);
    }
  }
  return opts;
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET with retries. Backs off on 429/5xx and honours Retry-After. */
async function fetchWithRetry(url, { attempts = 4, accept } = {}) {
  let wait = 2000;
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, ...(accept ? { Accept: accept } : {}) },
      });
    } catch (err) {
      if (attempt >= attempts) throw err;
      console.warn(`  network error (${err.message}); retrying in ${wait}ms`);
      await sleep(wait);
      wait *= 2;
      continue;
    }

    if (res.ok) return res;

    // 404 on a manifest means "not published as public domain" — not transient.
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= attempts) {
      const err = new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
      err.status = res.status;
      throw err;
    }

    const retryAfter = Number(res.headers.get("retry-after"));
    const pause = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : wait;
    console.warn(`  HTTP ${res.status}; retrying in ${pause}ms`);
    await sleep(pause);
    wait *= 2;
  }
}

/** IIIF labels are a bare string in Presentation 2.x, a language map in 3.x. */
function readLabel(label) {
  if (!label) return "";
  if (typeof label === "string") return label;
  if (Array.isArray(label)) return readLabel(label[0]);
  if (typeof label === "object") {
    if (typeof label["@value"] === "string") return label["@value"];
    const first = Object.values(label)[0];
    return Array.isArray(first) ? String(first[0] ?? "") : String(first ?? "");
  }
  return String(label);
}

/**
 * Pull the Image API service base URI out of every canvas, handling both
 * Presentation API 2.x (sequences/canvases/images/resource.service) and
 * 3.x (items/AnnotationPage/items/body.service).
 */
function extractCanvases(manifest) {
  const out = [];

  const pushService = (service, label, width, height) => {
    const list = Array.isArray(service) ? service : service ? [service] : [];
    for (const svc of list) {
      const id = svc?.["@id"] ?? svc?.id;
      if (typeof id === "string" && id) {
        out.push({ serviceId: id.replace(/\/$/, ""), label, width, height, service: svc });
        return;
      }
    }
  };

  // Presentation 2.x
  for (const sequence of manifest.sequences ?? []) {
    for (const canvas of sequence.canvases ?? []) {
      const label = readLabel(canvas.label);
      for (const image of canvas.images ?? []) {
        pushService(image?.resource?.service, label, canvas.width, canvas.height);
      }
    }
  }

  // Presentation 3.x
  for (const canvas of manifest.items ?? []) {
    const label = readLabel(canvas.label);
    for (const page of canvas.items ?? []) {
      for (const anno of page.items ?? []) {
        pushService(anno?.body?.service, label, canvas.width, canvas.height);
      }
    }
  }

  return out;
}

/**
 * Full-size Image API candidates. "full" is the Image API 2.x spelling and
 * "max" the 3.x one; an explicit pixel width works on both when the manifest
 * reported it. Try in order so one server quirk doesn't lose the page.
 */
function imageUrlCandidates({ serviceId, width, service }) {
  const isV3 = String(service?.type ?? service?.["@type"] ?? "").includes("3");
  const sizes = isV3 ? ["max", "full"] : ["full", "max"];
  if (Number.isFinite(width) && width > 0) sizes.push(`${width},`);
  return sizes.map((size) => `${serviceId}/full/${size}/0/default.jpg`);
}

function sanitize(name) {
  return name.replace(/[^\p{L}\p{N}._-]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 60);
}

async function downloadItem(pid, opts, stats) {
  console.log(`\n[${pid}] manifest`);
  let manifest;
  try {
    const res = await fetchWithRetry(IIIF_MANIFEST(pid), { accept: "application/json" });
    manifest = await res.json();
  } catch (err) {
    if (err.status === 404) {
      console.warn(`  no IIIF manifest (not published as インターネット公開 / 保護期間満了?) — skipped`);
    } else {
      console.error(`  failed: ${err.message}`);
    }
    stats.itemsFailed++;
    return;
  }

  const title = readLabel(manifest.label) || pid;
  const canvases = extractCanvases(manifest);
  console.log(`  "${title}" — ${canvases.length} image(s)`);
  if (canvases.length === 0) {
    console.warn("  manifest had no Image API service; skipped");
    stats.itemsFailed++;
    return;
  }

  const itemDir = path.join(opts.out, sanitize(pid));
  const planned = canvases.slice(0, opts.maxPages);

  if (opts.dryRun) {
    for (const [i, canvas] of planned.entries()) {
      console.log(`  [dry-run] ${String(i + 1).padStart(4, "0")} <- ${imageUrlCandidates(canvas)[0]}`);
    }
    stats.itemsOk++;
    return;
  }

  fs.mkdirSync(itemDir, { recursive: true });
  fs.writeFileSync(path.join(itemDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(
    path.join(itemDir, "metadata.json"),
    JSON.stringify(
      {
        pid,
        title,
        source: `https://dl.ndl.go.jp/pid/${pid}`,
        manifest: IIIF_MANIFEST(pid),
        attribution: readLabel(manifest.attribution) || readLabel(manifest.requiredStatement?.value),
        license: manifest.license ?? manifest.rights ?? "",
        metadata: manifest.metadata ?? [],
        imageCount: canvases.length,
        downloadedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  for (const [i, canvas] of planned.entries()) {
    const index = String(i + 1).padStart(4, "0");
    const suffix = canvas.label ? `-${sanitize(canvas.label)}` : "";
    const outPath = path.join(itemDir, `${index}${suffix}.jpg`);

    if (!opts.overwrite && fs.existsSync(outPath)) {
      stats.skipped++;
      continue;
    }

    let saved = false;
    for (const url of imageUrlCandidates(canvas)) {
      try {
        const res = await fetchWithRetry(url, { accept: "image/jpeg,image/*" });
        const buf = Buffer.from(await res.arrayBuffer());
        // Write via a temp file so an interrupted run can't leave a truncated
        // image that the next run's skip-if-exists check would trust.
        const tmp = `${outPath}.part`;
        fs.writeFileSync(tmp, buf);
        fs.renameSync(tmp, outPath);
        console.log(`  ${index} ${(buf.length / 1024).toFixed(0)}KB ${path.basename(outPath)}`);
        stats.downloaded++;
        saved = true;
        break;
      } catch (err) {
        console.warn(`  ${index} ${err.message}`);
      }
    }
    if (!saved) stats.failed++;

    await sleep(opts.delay);
  }

  stats.itemsOk++;
}

const opts = parseArgs(process.argv.slice(2));

if (opts.pids.length === 0) {
  console.error("Usage: node scripts/ndl-download.mjs <PID...> [--file pids.txt] [--out dir]");
  console.error("       PID = numeric part of https://dl.ndl.go.jp/pid/<PID>");
  console.error("Run with --dry-run first to see what would be downloaded.");
  process.exit(1);
}

const stats = { itemsOk: 0, itemsFailed: 0, downloaded: 0, skipped: 0, failed: 0 };

console.log(
  `NDL IIIF download — ${opts.pids.length} item(s), delay ${opts.delay}ms, out ${opts.out}` +
    (opts.dryRun ? " (dry run)" : "")
);

for (const pid of opts.pids) {
  await downloadItem(pid, opts, stats);
}

console.log(
  `\nDone. items ok ${stats.itemsOk}, items failed ${stats.itemsFailed}, ` +
    `images ${stats.downloaded} downloaded / ${stats.skipped} skipped / ${stats.failed} failed`
);
if (stats.itemsFailed > 0 || stats.failed > 0) process.exit(1);

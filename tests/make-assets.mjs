// Generates the social preview (1280 x 640), the favicons and the PWA icons
// from the app screenshot, using a headless Chromium browser. No dependency.
//
// Usage:
//   node tests/make-assets.mjs --screenshot docs/images/interface-francaise.png
//
// It writes wasm-app/og-image.png, icon-192.png, icon-512.png, favicon-32.png
// and apple-touch-icon.png. The platform-specific social preview itself must be
// uploaded by hand in GitHub: Settings > General > Social preview.

import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const BROWSER =
  arg("browser") ||
  process.env.MIRAGE_BROWSER ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = Number(arg("port", "9224"));
const SHOT = arg("screenshot");
if (!SHOT) {
  console.error("Missing --screenshot <path>");
  process.exit(2);
}
const shotPath = resolve(SHOT);
const repo = resolve(dirname(process.argv[1]), "..");
const tmp = resolve(process.env.TEMP || ".", `mirage-assets-${Date.now()}`);
await mkdir(tmp, { recursive: true });

const iconPage = (size) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:transparent}
img{display:block;width:${size}px;height:${size}px}
</style></head><body><img src="file:///${resolve(repo, "wasm-app/favicon.svg").replace(/\\/g, "/")}"></body></html>`;

const cardPage = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;width:1280px;height:640px;overflow:hidden}
  body{
    font-family:"Segoe UI",system-ui,sans-serif;
    color:#e8ecf4;
    background:
      radial-gradient(900px 480px at 12% -10%, #1c2a4a 0%, #0b0e14 60%),
      #0b0e14;
    display:flex;
  }
  .left{width:610px;padding:54px 24px 40px 64px;display:flex;flex-direction:column}
  .brand{font-size:58px;font-weight:800;letter-spacing:-.03em;line-height:1}
  .brand span{color:#6ea8fe}
  .badge{
    align-self:flex-start;margin-top:18px;padding:6px 14px;border-radius:999px;
    border:1px solid #3a4670;background:#131b31;color:#cfd6e6;font-size:15px;
    font-weight:600;letter-spacing:.02em
  }
  h1{font-size:31px;line-height:1.22;font-weight:750;margin:22px 0 12px;letter-spacing:-.01em}
  p{font-size:17px;line-height:1.45;color:#cfd6e6;margin:0}
  ul{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 0;padding:0}
  li{font-size:14px;padding:6px 12px;border-radius:8px;background:#131b31;border:1px solid #262e44;color:#cfd6e6}
  .credit{margin-top:auto;font-size:13px;color:#8b93a9}
  .right{flex:1;display:flex;align-items:center;justify-content:center;padding:30px 42px 30px 4px}
  .frame{width:100%;aspect-ratio:1440/1000;height:auto;border-radius:16px;overflow:hidden;border:1px solid #2b3350;
    box-shadow:0 24px 60px rgba(0,0,0,.55);background:#000}
  .frame img{display:block;width:100%;height:100%;object-fit:contain;background:#05070c}
</style></head><body>
  <div class="left">
    <div class="brand">Mirage <span>wasm</span></div>
    <div class="badge">Version française</div>
    <h1>OCR et vision locale<br>dans le navigateur</h1>
    <p>Détection d’objets, segmentation, textes et export JSON. L’image reste dans le navigateur.</p>
    <ul><li>OCR local</li><li>Détection d’objets</li><li>Segmentation</li><li>Export JSON</li></ul>
    <div class="credit">Mirage et Cactus : Cactus Compute · adaptation française : Adam AI / Next Gen AI</div>
  </div>
  <div class="right"><div class="frame"><img src="file:///${shotPath.replace(/\\/g, "/")}"></div></div>
</body></html>`;

const files = {
  "card.html": cardPage,
  "icon-32.html": iconPage(32),
  "icon-180.html": iconPage(180),
  "icon-192.html": iconPage(192),
  "icon-512.html": iconPage(512),
};
for (const [name, content] of Object.entries(files)) {
  await writeFile(resolve(tmp, name), content, "utf8");
}

const browser = spawn(
  BROWSER,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tmp}\\profile`,
    "--no-first-run",
    "--disable-extensions",
    "--allow-file-access-from-files",
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdio: "ignore" },
);

let ws;
let nextId = 1;
const pending = new Map();

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((res, rej) => {
    pending.set(id, { res, rej, method });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function shot(name, width, height, outPath) {
  const target = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {
      method: "PUT",
    })
  ).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
    }
  });
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", {
    url: `file:///${resolve(tmp, name).replace(/\\/g, "/")}`,
  });
  await sleep(700);
  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, Buffer.from(data, "base64"));
  console.log(`${outPath} (${width}x${height})`);
  ws.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`).catch(
    () => { },
  );
}

try {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) break;
    } catch { }
    await sleep(250);
  }
  await shot("card.html", 1280, 640, resolve(repo, "wasm-app/og-image.png"));
  await shot("icon-32.html", 32, 32, resolve(repo, "wasm-app/favicon-32.png"));
  await shot(
    "icon-180.html",
    180,
    180,
    resolve(repo, "wasm-app/apple-touch-icon.png"),
  );
  await shot("icon-192.html", 192, 192, resolve(repo, "wasm-app/icon-192.png"));
  await shot("icon-512.html", 512, 512, resolve(repo, "wasm-app/icon-512.png"));
} catch (err) {
  console.error(`ASSETS FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  browser.kill();
  await sleep(500);
  await rm(tmp, { recursive: true, force: true }).catch(() => { });
}

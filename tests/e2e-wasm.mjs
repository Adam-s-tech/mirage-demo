// End-to-end check of the WebAssembly demo, driven through the Chrome DevTools
// Protocol. No dependency: Node 24 ships fetch and WebSocket.
//
// Usage (from the repository root, with `bun run start:wasm` already running):
//   node tests/e2e-wasm.mjs --image "exemples/images/01-cafe-deux-tasses.png" \
//     --json "exemples/resultats/01-cafe-deux-tasses.json" \
//     --shot "tests/output/01-cafe.png"
//
// It loads the page in a headless Chromium browser, sets the file input the same
// way a user picking a file does, clicks "Analyser l'image", waits for the real
// WebAssembly inference, then writes the untouched Mirage JSON and a screenshot.
// Every network request and console message is recorded so an unexpected upload
// or a silent error is visible in the report.

import { mkdir, writeFile, readdir, rm } from "node:fs/promises";
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
const URL_BASE = arg("url", "http://127.0.0.1:3001/");
const IMAGE = arg("image");
const JSON_OUT = arg("json");
const SHOT = arg("shot");
const PORT = Number(arg("port", "9223"));
const TIMEOUT_MS = Number(arg("timeout", "240000"));
const KEEP_BROWSER = process.argv.includes("--keep-browser");

if (!IMAGE) {
  console.error("Missing --image <path>");
  process.exit(2);
}

const profileDir = resolve(
  process.env.TEMP || ".",
  `mirage-e2e-profile-${Date.now()}`,
);
await mkdir(profileDir, { recursive: true });

const browser = spawn(
  BROWSER,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-component-update",
    "--window-size=1440,1000",
    "about:blank",
  ],
  { stdio: "ignore" },
);

let ws = null;
let nextId = 1;
const pending = new Map();
const listeners = new Map();
const requests = [];
const consoleMessages = [];
let targetId = null;

function on(method, fn) {
  if (!listeners.has(method)) listeners.set(method, []);
  listeners.get(method).push(fn);
}

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((res, rej) => {
    pending.set(id, { res, rej, method });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function connect() {
  let version = null;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) {
        version = await r.json();
        break;
      }
    } catch { }
    await sleep(250);
  }
  if (!version) throw new Error("CDP endpoint did not start");
  const r = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {
    method: "PUT",
  });
  const target = await r.json();
  targetId = target.id;
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
      if (msg.error) p.rej(new Error(`${p.method}: ${msg.error.message}`));
      else p.res(msg.result);
      return;
    }
    if (msg.method) {
      for (const fn of listeners.get(msg.method) || []) fn(msg.params);
    }
  });
}

async function evaluate(expression, { awaitPromise = true } = {}) {
  const r = await send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  });
  if (r.exceptionDetails) {
    throw new Error(
      r.exceptionDetails.exception?.description ||
      r.exceptionDetails.text ||
      "evaluation failed",
    );
  }
  return r.result?.value;
}

async function waitFor(label, fn, timeout = TIMEOUT_MS) {
  const start = Date.now();
  for (; ;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - start > timeout) throw new Error(`timeout: ${label}`);
    await sleep(300);
  }
}

try {
  await connect();
  on("Network.requestWillBeSent", (p) => requests.push(p.request.url));
  on("Runtime.consoleAPICalled", (p) => {
    consoleMessages.push({
      type: p.type,
      text: p.args
        .map((a) => a.value ?? a.description ?? a.type ?? "")
        .join(" "),
    });
  });
  on("Runtime.exceptionThrown", (p) => {
    consoleMessages.push({
      type: "exception",
      text:
        p.exceptionDetails?.exception?.description ||
        p.exceptionDetails?.text ||
        "exception",
    });
  });
  on("Log.entryAdded", (p) => {
    if (p.entry.level === "error" || p.entry.level === "warning") {
      consoleMessages.push({ type: `log-${p.entry.level}`, text: p.entry.text });
    }
  });

  for (const domain of ["Page", "Runtime", "Network", "DOM", "Log"]) {
    await send(`${domain}.enable`);
  }
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Clipboard + downloads so the copy and download buttons can be verified.
  let clipboardOk = false;
  try {
    await send("Browser.grantPermissions", {
      origin: new URL(URL_BASE).origin,
      permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
    });
    clipboardOk = true;
  } catch { }
  const downloadDir = resolve(process.env.TEMP || ".", `mirage-dl-${Date.now()}`);
  await mkdir(downloadDir, { recursive: true });
  await send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadDir,
  }).catch(() => { });

  await send("Page.navigate", { url: URL_BASE });
  await waitFor("document ready", async () =>
    evaluate("document.readyState === 'complete'", { awaitPromise: false }),
  );
  await send("Page.bringToFront").catch(() => { });
  await send("Emulation.setFocusEmulationEnabled", { enabled: true }).catch(
    () => { },
  );

  const pageInfo = await evaluate(
    `({ title: document.title, lang: document.documentElement.lang,
        h1: [...document.querySelectorAll('h1')].map(e => e.textContent.trim()) })`,
  );

  const { root } = await send("DOM.getDocument");
  const { nodeId } = await send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: "#file",
  });
  if (!nodeId) throw new Error("file input not found");
  await send("DOM.setFileInputFiles", {
    nodeId,
    files: [resolve(IMAGE)],
  });

  await waitFor("file selected", async () =>
    evaluate("!document.getElementById('go').disabled", {
      awaitPromise: false,
    }),
  );

  const t0 = Date.now();
  await evaluate("document.getElementById('go').click()", {
    awaitPromise: false,
  });

  const resultText = await waitFor(
    "inference finished",
    async () => {
      const state = await evaluate(
        `({ txt: document.getElementById('out').textContent,
            status: document.getElementById('status').textContent,
            busy: document.getElementById('go').disabled })`,
      );
      if (state.txt.startsWith("ERROR")) {
        throw new Error(`app error: ${state.status}`);
      }
      if (state.txt.trim().startsWith("{") && !state.busy) return state.txt;
      return "";
    },
    TIMEOUT_MS,
  );
  const elapsedMs = Date.now() - t0;
  const result = JSON.parse(resultText);

  const summary = await evaluate(
    `({
      status: document.getElementById('status').textContent,
      timing: document.getElementById('timing').textContent,
      meta: document.getElementById('meta').textContent,
      objects: document.getElementById('objCount').textContent,
      texts: document.getElementById('textCount').textContent,
      sceneVisible: !document.getElementById('sceneWrap').hidden,
      descVisible: !document.getElementById('descWrap').hidden,
      copyLabel: document.getElementById('copyJson').textContent.trim(),
      downloadLabel: document.getElementById('downloadJson')?.textContent?.trim() || null
    })`,
  );

  if (JSON_OUT) {
    await mkdir(dirname(resolve(JSON_OUT)), { recursive: true });
    await writeFile(resolve(JSON_OUT), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }

  // Optional warm run: same image, same tab, engine and weights already loaded.
  let warm = null;
  if (process.argv.includes("--runs") && process.argv[process.argv.indexOf("--runs") + 1] === "2") {
    await evaluate("document.getElementById('clear').click()", {
      awaitPromise: false,
    });
    await send("DOM.setFileInputFiles", {
      nodeId,
      files: [resolve(IMAGE)],
    });
    await waitFor("file reselected", async () =>
      evaluate("!document.getElementById('go').disabled", {
        awaitPromise: false,
      }),
    );
    const w0 = Date.now();
    await evaluate("document.getElementById('go').click()", {
      awaitPromise: false,
    });
    await waitFor(
      "warm inference finished",
      async () => {
        const state = await evaluate(
          `({ txt: document.getElementById('out').textContent,
              busy: document.getElementById('go').disabled })`,
        );
        if (state.txt.startsWith("ERROR")) throw new Error("warm run failed");
        return state.txt.trim().startsWith("{") && !state.busy;
      },
      TIMEOUT_MS,
    );
    const warmMs = Date.now() - w0;
    const warmTiming = await evaluate(
      "document.getElementById('timing').textContent",
    );
    warm = { elapsedMs: warmMs, timing: warmTiming };
  }

  if (SHOT) {
    await mkdir(dirname(resolve(SHOT)), { recursive: true });
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(resolve(SHOT), Buffer.from(shot.data, "base64"));
  }

  const ANNOTATED = arg("annotated");
  if (ANNOTATED) {
    const box = await evaluate(
      `(() => { const r = document.getElementById('canvas').getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`,
    );
    if (box.width > 0 && box.height > 0) {
      const shot = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
        clip: {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
          scale: 1,
        },
      });
      await mkdir(dirname(resolve(ANNOTATED)), { recursive: true });
      await writeFile(resolve(ANNOTATED), Buffer.from(shot.data, "base64"));
    }
  }

  // Toggle check: unchecking boxes must change the rendered canvas.
  const canvasHash = () =>
    evaluate(
      `(async () => {
         const c = document.getElementById('canvas');
         const b = c.toDataURL('image/png');
         const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(b));
         return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2,'0')).join('');
       })()`,
    );
  const beforeHash = await canvasHash();
  await evaluate(
    `(() => { const c = document.getElementById('toggleBoxes');
      c.checked = false; c.dispatchEvent(new Event('change')); })()`,
  );
  await sleep(400);
  const afterHash = await canvasHash();
  await evaluate(
    `(() => { const c = document.getElementById('toggleBoxes');
      c.checked = true; c.dispatchEvent(new Event('change')); })()`,
  );

  // Confidence filter check.
  const filter = await evaluate(
    `(() => {
       const r = document.getElementById('confRange');
       const before = document.getElementById('objCount').textContent;
       r.value = '80';
       r.dispatchEvent(new Event('input'));
       const after = document.getElementById('objCount').textContent;
       r.value = '0';
       r.dispatchEvent(new Event('input'));
       return { before, after, value: document.getElementById('confVal').textContent };
     })()`,
  );

  // Copy check. Headless clips board access, so the exact payload handed to the
  // clipboard API is captured with a test-only wrapper, then readText is tried.
  let clipboard = null;
  let clipboardError = null;
  let clipboardApiPayload = null;
  const clipboardHooked = await evaluate(
    `(() => {
       window.__mirageCopied = null;
       if (!navigator.clipboard || !navigator.clipboard.writeText) return false;
       const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
       navigator.clipboard.writeText = async (t) => {
         window.__mirageCopied = t;
         try { return await orig(t); } catch { return undefined; }
       };
       return true;
     })()`,
  );
  await evaluate("document.getElementById('copyJson').click()", {
    awaitPromise: false,
  });
  await sleep(600);
  if (clipboardHooked) {
    clipboardApiPayload = await evaluate("window.__mirageCopied");
    try {
      clipboard = await evaluate("navigator.clipboard.readText()");
    } catch (err) {
      clipboardError = err.message;
    }
  }

  // Download check.
  let download = { file: null, ok: false, parsed: null };
  const dlBtn = await evaluate(
    "!!document.getElementById('downloadJson')",
    { awaitPromise: false },
  );
  if (dlBtn) {
    await evaluate("document.getElementById('downloadJson').click()", {
      awaitPromise: false,
    });
    const files = await waitFor(
      "download file",
      async () => {
        const names = await readdir(downloadDir).catch(() => []);
        return names.filter((n) => n.endsWith(".json")).length ? names : null;
      },
      15000,
    );
    const name = files[0];
    const { readFile } = await import("node:fs/promises");
    const text = await readFile(resolve(downloadDir, name), "utf8");
    let parsed = null;
    let ok = false;
    try {
      parsed = JSON.parse(text);
      ok = true;
    } catch { }
    download = { file: name, ok, parsed };
  }

  // Reset check.
  const reset = await evaluate(
    `(() => {
       document.getElementById('clear').click();
       return {
         goDisabled: document.getElementById('go').disabled,
         out: document.getElementById('out').textContent.trim(),
         status: document.getElementById('status').textContent,
         conf: document.getElementById('confVal').textContent
       };
     })()`,
    { awaitPromise: false },
  );
  await sleep(200);

  // Glisser-déposer réel, format refusé et affichage mobile.
  const servedParts = IMAGE.replace(/\\/g, "/").split("/");
  const exIdx = servedParts.indexOf("exemples");
  const servedPath =
    exIdx >= 0 ? `/${servedParts.slice(exIdx).join("/")}` : null;
  let dragDrop = null;
  if (servedPath) {
    await evaluate(
      `(async () => {
         const res = await fetch(${JSON.stringify(servedPath)});
         const buf = await res.arrayBuffer();
         const f = new File([buf], "test-drop.png", { type: "image/png" });
         const dt = new DataTransfer();
         dt.items.add(f);
         document.getElementById("drop").dispatchEvent(
           new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }),
         );
         return true;
       })()`,
    );
    await waitFor(
      "drop accepted",
      async () =>
        evaluate("!document.getElementById('go').disabled", {
          awaitPromise: false,
        }),
      10000,
    ).catch(() => { });
    dragDrop = await evaluate(
      `({ name: document.getElementById('fname').textContent,
          enabled: !document.getElementById('go').disabled,
          status: document.getElementById('status').textContent })`,
    );
  }
  await evaluate("document.getElementById('clear').click()", {
    awaitPromise: false,
  });
  await sleep(150);
  const refusedFormat = await evaluate(
    `(() => {
       const f = new File(["pas une image"], "note.txt", { type: "text/plain" });
       const dt = new DataTransfer();
       dt.items.add(f);
       document.getElementById("drop").dispatchEvent(
         new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }),
       );
       return { status: document.getElementById("status").textContent,
                goDisabled: document.getElementById('go').disabled };
     })()`,
    { awaitPromise: false },
  );
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  }).catch(() => { });
  await sleep(400);
  const mobile = await evaluate(
    `({ innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        noHorizontalScroll:
          document.documentElement.scrollWidth <= window.innerWidth + 1 })`,
  );

  const report = {
    image: IMAGE,
    page: pageInfo,
    elapsedMs,
    warm,
    summary,
    counts: {
      objects: (result.objects || []).length,
      texts: (result.text || []).length,
      sceneKeys: Object.keys(result.scene || {}),
      topLevelKeys: Object.keys(result),
    },
    checks: {
      toggleChangesCanvas: beforeHash !== afterHash,
      confidenceFilter: filter,
      clipboardPermissionGranted: clipboardOk,
      copyMatchesRawJson: clipboard === resultText,
      clipboardApiPayloadMatches: clipboardApiPayload === resultText,
      clipboardApiCaptured: clipboardApiPayload !== null,
      clipboardReadError: clipboardError,
      download,
      reset,
      dragDrop,
      refusedFormat,
      mobile,
    },
    network: {
      total: requests.length,
      unique: [...new Set(requests)],
      nonLocal: [...new Set(requests)].filter(
        (u) => !u.startsWith(URL_BASE) && !u.startsWith("blob:") && !u.startsWith("data:"),
      ),
    },
    console: consoleMessages,
  };

  console.log(JSON.stringify(report, null, 2));

  if (JSON_OUT) {
    await writeFile(
      resolve(JSON_OUT).replace(/\.json$/, ".report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
  }
} catch (err) {
  console.error(`E2E FAILED: ${err.message}`);
  if (consoleMessages.length) {
    console.error(JSON.stringify(consoleMessages.slice(-20), null, 2));
  }
  process.exitCode = 1;
} finally {
  try {
    ws?.close();
  } catch { }
  if (targetId) {
    await fetch(`http://127.0.0.1:${PORT}/json/close/${targetId}`).catch(() => { });
  }
  if (!KEEP_BROWSER) {
    browser.kill();
    await rm(profileDir, { recursive: true, force: true }).catch(() => { });
  }
}

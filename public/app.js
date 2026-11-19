// Mirage describe : version française de la démonstration serveur.
// L’interface est identique à la version WebAssembly ; l’inférence est déléguée
// à la CLI Cactus via POST /api/describe (index.ts). Le JSON renvoyé par Mirage
// reste la source affichée : l’interface ne le réécrit pas.

const APP_VERSION = "1.0.1";

const drop = document.getElementById("drop");
const fileInput = document.getElementById("file");
const goBtn = document.getElementById("go");
const clearBtn = document.getElementById("clear");
const statusEl = document.getElementById("status");
const outEl = document.getElementById("out");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const previewEl = document.getElementById("preview");
const fnameEl = document.getElementById("fname");
const fsizeEl = document.getElementById("fsize");
const timingEl = document.getElementById("timing");
const metaEl = document.getElementById("meta");
const toggleBoxes = document.getElementById("toggleBoxes");
const toggleMasks = document.getElementById("toggleMasks");
const toggleLabels = document.getElementById("toggleLabels");
const toggleText = document.getElementById("toggleText");
const toggleSpotlight = document.getElementById("toggleSpotlight");
const objListWrap = document.getElementById("objListWrap");
const objList = document.getElementById("objList");
const objCount = document.getElementById("objCount");
const sceneWrap = document.getElementById("sceneWrap");
const scenePills = document.getElementById("scenePills");
const textWrap = document.getElementById("textWrap");
const textList = document.getElementById("textList");
const textCount = document.getElementById("textCount");
const relWrap = document.getElementById("relWrap");
const relList = document.getElementById("relList");
const relCount = document.getElementById("relCount");
const inspectorEmpty = document.getElementById("inspectorEmpty");
const confRow = document.getElementById("confRow");
const confRange = document.getElementById("confRange");
const confVal = document.getElementById("confVal");
const copyJsonBtn = document.getElementById("copyJson");
const downloadJsonBtn = document.getElementById("downloadJson");
const thumbWrap = document.getElementById("thumbWrap");
const thumb = document.getElementById("thumb");
const descWrap = document.getElementById("descWrap");
const descBody = document.getElementById("descBody");
const descLang = document.getElementById("descLang");

const OK_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const OK_EXT = /\.(jpe?g|png|webp)$/i;

const SCENE_LABELS = {
  setting: "cadre",
  lighting: "éclairage",
  weather: "météo",
  time_of_day: "moment de la journée",
  surface: "surface",
  style: "style",
  background: "fond",
  colors: "couleurs",
};

const PREDICATES = {
  in: "dans",
  inside: "à l’intérieur de",
  on: "sur",
  under: "sous",
  above: "au-dessus de",
  below: "en dessous de",
  next_to: "à côté de",
  near: "près de",
  left_of: "à gauche de",
  right_of: "à droite de",
  behind: "derrière",
  in_front_of: "devant",
  holding: "tient",
  contains: "contient",
  part_of: "partie de",
  touching: "touche",
  attached_to: "attaché à",
  with: "avec",
};

let minScore = 0;
// Les éléments sans score numérique passent toujours : rien n’est masqué à tort.
function passesScore(item) {
  return !item || typeof item.score !== "number" || item.score >= minScore;
}
for (const [headId, wrapId] of [
  ["sceneHead", "sceneWrap"],
  ["objHead", "objListWrap"],
  ["textHead", "textWrap"],
  ["relHead", "relWrap"],
]) {
  const head = document.getElementById(headId);
  const wrap = document.getElementById(wrapId);
  head.addEventListener("click", () => {
    const collapsed = wrap.classList.toggle("collapsed");
    head.setAttribute("aria-expanded", String(!collapsed));
  });
}

function renderDescription() {
  // Chaîne « reasoning » séparée par des barres verticales : un paragraphe par
  // segment. Un premier segment « lang: xx » devient une pastille d’en-tête.
  const reasoning =
    lastResult && typeof lastResult.reasoning === "string"
      ? lastResult.reasoning
      : "";
  const segments = reasoning
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!segments.length) {
    descWrap.hidden = true;
    return;
  }
  const lang = segments[0].match(/^lang:\s*(\w+)$/i);
  const prose = lang ? segments.slice(1) : segments;
  descLang.hidden = !lang;
  if (lang) {
    descLang.textContent = /^en$/i.test(lang[1])
      ? "modèle : anglais"
      : `langue : ${lang[1]}`;
    descLang.title = /^en$/i.test(lang[1])
      ? "L’interprétation est rédigée par le modèle en anglais ; l’interface reste en français."
      : "";
  }
  descBody.innerHTML = "";
  prose.forEach((text, i) => {
    const p = document.createElement("p");
    // Le dernier segment est souvent une réserve (« cannot know… ») : on l’atténue.
    if (i === prose.length - 1 && /^(cannot|can't|unable|unknown)/i.test(text))
      p.className = "dim";
    p.textContent = text;
    descBody.appendChild(p);
  });
  if (lang && /^en$/i.test(lang[1])) {
    const note = document.createElement("p");
    note.className = "dim";
    note.textContent = "Texte produit par le modèle en anglais, affiché sans traduction.";
    descBody.appendChild(note);
  }
  descWrap.hidden = !prose.length;
}
const SCENE_KEYS = ["setting", "lighting", "weather", "time_of_day"];

let file = null;
let objectUrl = null;
let loadedImage = null; // HTMLImageElement à sa résolution naturelle
let lastResult = null; // JSON Mirage
let lastRawJson = ""; // texte exact affiché, utilisé pour la copie
let lastAnalysis = null; // métadonnées de la dernière analyse
let hoveredIndex = -1;
let selectedIndex = -1;
let hoveredTextIndex = -1;

const PALETTE = [
  "#6ea8fe",
  "#3dd68c",
  "#ffb224",
  "#ff6369",
  "#c792ea",
  "#22d3ee",
  "#f472b6",
  "#a3e635",
  "#fb923c",
  "#e879f9",
];

function setStatus(msg, kind = "") {
  statusEl.className = `status ${kind}`;
  statusEl.innerHTML = msg;
}

function colorFor(i) {
  return PALETTE[i % PALETTE.length];
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Les bbox Mirage sont en 0 à 1000 ; le canevas est à la taille naturelle.
function toPixels(bbox, w, h) {
  const [x1, y1, x2, y2] = bbox;
  return [(x1 / 1000) * w, (y1 / 1000) * h, (x2 / 1000) * w, (y2 / 1000) * h];
}

// Chemin pixel d’un objet : polygone du masque si présent, sinon rectangle bbox.
function objectPath(obj, w, h) {
  if (!obj) return null;
  if (Array.isArray(obj.mask) && obj.mask.length >= 6) {
    const p = new Path2D();
    for (let k = 0; k + 1 < obj.mask.length; k += 2) {
      const px = (obj.mask[k] / 1000) * w;
      const py = (obj.mask[k + 1] / 1000) * h;
      if (k === 0) p.moveTo(px, py);
      else p.lineTo(px, py);
    }
    p.closePath();
    return p;
  }
  if (Array.isArray(obj.bbox) && obj.bbox.length === 4) {
    const [px1, py1, px2, py2] = toPixels(obj.bbox, w, h);
    const p = new Path2D();
    p.rect(px1, py1, px2 - px1, py2 - py1);
    return p;
  }
  return null;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("impossible de décoder l’image"));
    img.src = url;
  });
}

function syncActiveList() {
  const active = hoveredIndex >= 0 ? hoveredIndex : selectedIndex;
  objList.querySelectorAll(".obj-item").forEach((li) => {
    li.classList.toggle("active", Number(li.dataset.index) === active);
  });
}

function setHovered(i) {
  if (i === hoveredIndex) return;
  hoveredIndex = i;
  syncActiveList();
  redraw();
}

function describeBits(obj) {
  const bits = [];
  if (obj.position) bits.push(obj.position);
  if (obj.description && typeof obj.description === "object") {
    ["color", "shape", "state", "material"].forEach((k) => {
      if (obj.description[k]) bits.push(obj.description[k]);
    });
  }
  return bits.join(" · ");
}

function renderScene() {
  const scene = lastResult?.scene || null;
  scenePills.innerHTML = "";
  if (!scene) {
    sceneWrap.hidden = true;
    return;
  }
  const ordered = [
    ...SCENE_KEYS.filter((k) => scene[k]),
    ...Object.keys(scene).filter((k) => !SCENE_KEYS.includes(k) && scene[k]),
  ];
  const pills = ordered.map((k) => {
    const pill = document.createElement("span");
    pill.className = "scene-pill";
    const key = document.createElement("span");
    key.className = "k";
    key.textContent = SCENE_LABELS[k] || k.replace(/_/g, " ");
    key.title = k;
    const val = document.createElement("span");
    val.className = "v";
    val.textContent =
      typeof scene[k] === "object"
        ? JSON.stringify(scene[k])
        : String(scene[k]);
    pill.append(key, val);
    return pill;
  });
  if (!pills.length) {
    sceneWrap.hidden = true;
    return;
  }
  scenePills.append(...pills);
  sceneWrap.hidden = false;
}

function renderObjList() {
  const objects = lastResult?.objects || [];
  objList.innerHTML = "";
  if (!objects.length) {
    objListWrap.hidden = true;
    return;
  }
  objListWrap.hidden = false;
  let shown = 0;
  objects.forEach((obj, i) => {
    if (!passesScore(obj)) return;
    shown++;
    const li = document.createElement("li");
    li.className = "obj-item";
    li.dataset.index = String(i);
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    const color = colorFor(i);
    const score = typeof obj.score === "number" ? obj.score.toFixed(2) : "n/d";
    const bits = describeBits(obj);
    li.innerHTML = `<span class="dot"></span><span class="name"></span><span class="meta"></span>`;
    li.querySelector(".dot").style.background = color;
    const name = obj.name || "objet";
    li.querySelector(".name").textContent = name;
    li.querySelector(".meta").textContent = score + (bits ? ` · ${bits}` : "");
    li.title = bits || name;
    li.setAttribute(
      "aria-label",
      `${name}, confiance ${score}${bits ? `, ${bits}` : ""}. Activer pour mettre en évidence.`,
    );
    li.addEventListener("mouseenter", () => setHovered(i));
    li.addEventListener("mouseleave", () => setHovered(-1));
    li.addEventListener("click", () => {
      selectedIndex = selectedIndex === i ? -1 : i;
      syncActiveList();
      redraw();
    });
    li.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        li.click();
      }
    });
    objList.appendChild(li);
  });
  objCount.textContent =
    shown < objects.length
      ? `${shown} sur ${objects.length} objets`
      : `${objects.length} ${objects.length === 1 ? "objet" : "objets"}`;
  syncActiveList();
}

async function copyString(s) {
  try {
    await navigator.clipboard.writeText(s);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = s;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch { }
    ta.remove();
    return ok;
  }
}

function flashButton(btn, text) {
  const orig = btn.dataset.label || btn.textContent;
  btn.dataset.label = orig;
  btn.textContent = text;
  setTimeout(() => {
    btn.textContent = orig;
  }, 1400);
}

function setHoveredText(i) {
  if (i === hoveredTextIndex) return;
  hoveredTextIndex = i;
  textList.querySelectorAll(".obj-item").forEach((li) => {
    li.classList.toggle("active", Number(li.dataset.index) === i);
  });
  redraw();
}

function renderTextList() {
  const texts = lastResult?.text || [];
  textList.innerHTML = "";
  hoveredTextIndex = -1;
  if (!texts.length) {
    textWrap.hidden = true;
    syncInspector();
    return;
  }
  textWrap.hidden = false;
  let shownText = 0;
  texts.forEach((t, i) => {
    if (!passesScore(t)) return;
    shownText++;
    const li = document.createElement("li");
    li.className = "obj-item text-item";
    li.dataset.index = String(i);
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.title =
      (t.string || "") + (t.string ? " · cliquez pour copier" : "Cliquez pour copier");
    li.innerHTML = `<span class="quote">&ldquo;</span><span class="name"></span><span class="quote">&rdquo;</span><span class="meta"></span>`;
    li.querySelector(".name").textContent = t.string || "(illisible)";
    li.querySelector(".meta").textContent =
      typeof t.score === "number"
        ? `${t.score.toFixed(2)} · cliquer pour copier`
        : "cliquer pour copier";
    li.addEventListener("mouseenter", () => setHoveredText(i));
    li.addEventListener("mouseleave", () => setHoveredText(-1));
    li.addEventListener("click", async () => {
      if (!t.string) return;
      const ok = await copyString(t.string);
      const meta = li.querySelector(".meta");
      const orig = meta.textContent;
      meta.textContent = ok ? "copié ✓" : "échec de la copie";
      setTimeout(() => {
        meta.textContent = orig;
      }, 1200);
    });
    li.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        li.click();
      }
    });
    textList.appendChild(li);
  });
  textCount.textContent =
    shownText < texts.length
      ? `${shownText} sur ${texts.length} textes`
      : `${texts.length} ${texts.length === 1 ? "texte" : "textes"}`;
  syncInspector();
}

function renderRelations() {
  const relations = lastResult?.relations || [];
  const objects = lastResult?.objects || [];
  relList.innerHTML = "";
  if (!relations.length) {
    relWrap.hidden = true;
    return;
  }
  relWrap.hidden = false;
  const nameOf = (id) => {
    const o = objects.find((x) => x && x.id === id);
    return o?.name ? o.name : `objet ${id}`;
  };
  for (const rel of relations) {
    if (!rel || typeof rel !== "object") continue;
    const li = document.createElement("li");
    li.className = "obj-item rel-item";
    li.innerHTML = `<span class="name"></span><span class="meta"></span>`;
    const predicate = PREDICATES[rel.predicate] || rel.predicate || "lié à";
    li.querySelector(".name").textContent =
      `${nameOf(rel.subject)} ${predicate} ${nameOf(rel.object)}`;
    li.querySelector(".meta").textContent =
      `objets ${rel.subject} → ${rel.object} · prédicat « ${rel.predicate} »`;
    relList.appendChild(li);
  }
  relCount.textContent = `${relations.length} ${relations.length === 1 ? "relation" : "relations"}`;
}

function syncInspector() {
  // renderTextList passe en dernier : un seul point de synchronisation suffit.
  inspectorEmpty.style.display =
    sceneWrap.hidden && objListWrap.hidden && textWrap.hidden && relWrap.hidden
      ? ""
      : "none";
  confRow.hidden = !lastResult;
}

function pickObjectAt(nx, ny) {
  const objects = lastResult?.objects || [];
  let best = -1;
  let bestArea = Infinity;
  objects.forEach((obj, i) => {
    if (!obj || !Array.isArray(obj.bbox) || obj.bbox.length !== 4) return;
    if (!passesScore(obj)) return;
    const [x1, y1, x2, y2] = obj.bbox;
    if (nx < x1 || nx > x2 || ny < y1 || ny > y2) return;
    const area = (x2 - x1) * (y2 - y1);
    if (area < bestArea) {
      bestArea = area;
      best = i;
    }
  });
  return best;
}

canvas.addEventListener("mousemove", (e) => {
  if (!loadedImage || !lastResult) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const nx = ((e.clientX - rect.left) / rect.width) * 1000;
  const ny = ((e.clientY - rect.top) / rect.height) * 1000;
  setHovered(pickObjectAt(nx, ny));
  canvas.style.cursor = hoveredIndex >= 0 ? "pointer" : "default";
});
canvas.addEventListener("mouseleave", () => setHovered(-1));
canvas.addEventListener("click", () => {
  selectedIndex =
    hoveredIndex >= 0 && selectedIndex !== hoveredIndex ? hoveredIndex : -1;
  syncActiveList();
  redraw();
});

async function redraw() {
  if (!loadedImage) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const w = loadedImage.naturalWidth;
  const h = loadedImage.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(loadedImage, 0, 0, w, h);

  // Mise en évidence : on assombrit tout sauf le masque de l’objet sélectionné.
  if (lastResult && toggleSpotlight.checked && selectedIndex >= 0) {
    const sel = lastResult.objects[selectedIndex];
    const cutout = passesScore(sel) ? objectPath(sel, w, h) : null;
    if (cutout) {
      const dim = document.createElement("canvas");
      dim.width = w;
      dim.height = h;
      const dctx = dim.getContext("2d");
      dctx.fillStyle = "rgba(4,7,14,0.62)";
      dctx.fillRect(0, 0, w, h);
      dctx.globalCompositeOperation = "destination-out";
      dctx.fill(cutout);
      ctx.drawImage(dim, 0, 0);
      ctx.save();
      ctx.strokeStyle = colorFor(selectedIndex);
      ctx.lineWidth = Math.max(2, Math.round(w / 200));
      ctx.stroke(cutout);
      ctx.restore();
    }
  }

  if (!lastResult) return;
  const showBoxes = toggleBoxes.checked;
  const showMasks = toggleMasks.checked;
  const showLabels = toggleLabels.checked;
  const showText = toggleText.checked;
  if (!showBoxes && !showMasks && !showText && !showLabels) return;
  const fontSize = Math.max(12, Math.round(w / 42));
  ctx.font = `600 ${fontSize}px -apple-system, Inter, Segoe UI, sans-serif`;
  ctx.textBaseline = "top";

  const objects = lastResult.objects || [];
  const activeIndex = hoveredIndex >= 0 ? hoveredIndex : selectedIndex;
  if (showMasks) {
    objects.forEach((obj, i) => {
      if (!obj || !Array.isArray(obj.mask) || obj.mask.length < 6) return;
      if (!passesScore(obj)) return;
      const color = colorFor(i);
      const isActive = i === activeIndex;
      ctx.save();
      if (activeIndex >= 0 && !isActive) ctx.globalAlpha = 0.25;
      ctx.beginPath();
      for (let k = 0; k + 1 < obj.mask.length; k += 2) {
        const px = (obj.mask[k] / 1000) * w;
        const py = (obj.mask[k + 1] / 1000) * h;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = hexToRgba(color, isActive ? 0.5 : 0.28);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(color, 0.9);
      ctx.lineWidth = isActive
        ? Math.max(3, Math.round(w / 160))
        : Math.max(1.5, Math.round(w / 320));
      ctx.stroke();
      ctx.restore();
    });
  }
  objects.forEach((obj, i) => {
    if (!obj || !Array.isArray(obj.bbox) || obj.bbox.length !== 4) return;
    if (!passesScore(obj)) return;
    if (!showBoxes && !showLabels) return;
    const [px1, py1, px2, py2] = toPixels(obj.bbox, w, h);
    const color = colorFor(i);
    const isActive = i === activeIndex;
    ctx.save();
    if (activeIndex >= 0 && !isActive) ctx.globalAlpha = 0.3;
    if (showBoxes) {
      ctx.strokeStyle = color;
      ctx.lineWidth = isActive
        ? Math.max(4, Math.round(w / 140))
        : Math.max(2, Math.round(w / 220));
      ctx.strokeRect(px1, py1, px2 - px1, py2 - py1);
    }

    if (showLabels || isActive) {
      const label = `${obj.name || "objet"}${typeof obj.score === "number" ? ` ${obj.score.toFixed(2)}` : ""}`;
      const pad = 5;
      const textW = ctx.measureText(label).width;
      const boxH = fontSize + pad * 2;
      let by = py1 - boxH - 3;
      if (by < 0) by = py1 + 3;
      ctx.fillStyle = color;
      ctx.fillRect(px1, by, textW + pad * 2, boxH);
      ctx.fillStyle = "#081226";
      ctx.fillText(label, px1 + pad, by + pad);
    }
    ctx.restore();
  });

  if (showText) {
    const texts = lastResult.text || [];
    ctx.setLineDash([6, 4]);
    texts.forEach((t, ti) => {
      if (!t || !Array.isArray(t.bbox) || t.bbox.length !== 4) return;
      if (!passesScore(t)) return;
      const [px1, py1, px2, py2] = toPixels(t.bbox, w, h);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth =
        ti === hoveredTextIndex
          ? Math.max(3, Math.round(w / 140))
          : Math.max(1.5, Math.round(w / 320));
      ctx.strokeRect(px1, py1, px2 - px1, py2 - py1);
      if (showLabels && t.string) {
        const label = `“${t.string}”${typeof t.score === "number" ? ` ${t.score.toFixed(2)}` : ""}`;
        const pad = 4;
        const textW = ctx.measureText(label).width;
        const boxH = fontSize + pad * 2;
        let by = py2 + 3;
        if (by + boxH > h) by = py1 - boxH - 3;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(px1, by, textW + pad * 2, boxH);
        ctx.fillStyle = "#111";
        ctx.fillText(label, px1 + pad, by + pad);
      }
    });
    ctx.setLineDash([]);
  }
}

function isSupportedImage(f) {
  if (OK_TYPES.has(f.type)) return true;
  return !f.type && OK_EXT.test(f.name);
}

async function selectFile(f) {
  if (!f) return;
  if (!isSupportedImage(f)) {
    fileInput.value = "";
    setStatus(
      "Format non accepté. Choisissez une image JPG, PNG ou WebP.",
      "err",
    );
    return;
  }
  file = f;
  lastResult = null;
  lastRawJson = "";
  lastAnalysis = null;
  hoveredIndex = -1;
  selectedIndex = -1;
  renderObjList();
  renderScene();
  renderTextList();
  renderRelations();
  renderDescription();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(f);
  thumb.src = objectUrl;
  thumbWrap.hidden = false;
  try {
    loadedImage = await loadImage(objectUrl);
    await redraw();
  } catch (err) {
    setStatus(`Erreur : ${err.message}`, "err");
    return;
  }
  previewEl.classList.add("show");
  fnameEl.textContent = f.name;
  fsizeEl.textContent = `${(f.size / 1024).toFixed(1)} Ko`;
  goBtn.disabled = false;
  setStatus("Prêt. Cliquez sur « Analyser l’image ».", "ok");
}

const browseBtn = document.getElementById("browse");
browseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  fileInput.click();
});
drop.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => selectFile(e.target.files[0]));
["dragover", "dragenter"].forEach((ev) => {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add("drag");
  });
});
["dragleave", "drop"].forEach((ev) => {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove("drag");
  });
});
drop.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files?.[0];
  selectFile(f);
});

[toggleBoxes, toggleMasks, toggleLabels, toggleText, toggleSpotlight].forEach(
  (el) => {
    el.addEventListener("change", redraw);
  },
);

confRange.addEventListener("input", () => {
  minScore = confRange.value / 100;
  confVal.textContent = minScore.toFixed(2);
  const objs = lastResult?.objects || [];
  const texts = lastResult?.text || [];
  if (hoveredIndex >= 0 && !passesScore(objs[hoveredIndex])) hoveredIndex = -1;
  if (selectedIndex >= 0 && !passesScore(objs[selectedIndex]))
    selectedIndex = -1;
  if (hoveredTextIndex >= 0 && !passesScore(texts[hoveredTextIndex]))
    hoveredTextIndex = -1;
  renderObjList();
  renderTextList();
  redraw();
});

copyJsonBtn.addEventListener("click", async () => {
  if (!lastResult || !lastRawJson) {
    flashButton(copyJsonBtn, "Rien à copier");
    return;
  }
  const ok = await copyString(lastRawJson);
  flashButton(copyJsonBtn, ok ? "Copié ✓" : "Échec de la copie");
});

function pad2(n) {
  return String(n).padStart(2, "0");
}

function localIso(d) {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` +
    `T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}` +
    `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`
  );
}

function safeFileStem(name) {
  const base = (name || "image").replace(/\.[^.]+$/, "");
  const ascii = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || "image";
}

function buildExportPayload() {
  return {
    // Sortie du modèle strictement inchangée.
    mirage_output: lastResult,
    analysis_metadata: {
      file_name: file?.name || null,
      file_size_bytes: file?.size || null,
      image_width: loadedImage?.naturalWidth || null,
      image_height: loadedImage?.naturalHeight || null,
      input_width: lastAnalysis?.inputW || null,
      input_height: lastAnalysis?.inputH || null,
      inference_ms: lastAnalysis?.inferenceMs ?? null,
      server_ms: lastAnalysis?.serverMs ?? null,
      engine: "cactus mirage describe (CLI locale)",
      model: "Cactus-Compute/mirage (mirage.cact)",
      app_version: APP_VERSION,
      locale: "fr",
      exported_at_local: localIso(new Date()),
    },
  };
}

downloadJsonBtn.addEventListener("click", () => {
  if (!lastResult) {
    flashButton(downloadJsonBtn, "Rien à télécharger");
    return;
  }
  const payload = buildExportPayload();
  const now = new Date();
  const stamp =
    `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}` +
    `-${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
  const name = `${safeFileStem(file?.name)}-mirage-${stamp}.json`;
  const text = `${JSON.stringify(payload, null, 2)}\n`;
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  flashButton(downloadJsonBtn, "Téléchargé ✓");
});

clearBtn.addEventListener("click", () => {
  file = null;
  fileInput.value = "";
  lastResult = null;
  lastRawJson = "";
  lastAnalysis = null;
  hoveredIndex = -1;
  selectedIndex = -1;
  renderObjList();
  renderScene();
  renderTextList();
  renderRelations();
  renderDescription();
  loadedImage = null;
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
  thumb.removeAttribute("src");
  thumbWrap.hidden = true;
  minScore = 0;
  confRange.value = "0";
  confVal.textContent = "0.00";
  goBtn.disabled = true;
  previewEl.classList.remove("show");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.removeAttribute("width");
  outEl.innerHTML =
    '<span class="empty">// Réinitialisé. Choisissez une autre image.</span>';
  timingEl.textContent = "…";
  metaEl.textContent = "";
  setStatus("Aucune image sélectionnée.");
});

goBtn.addEventListener("click", async () => {
  if (!file) return;
  goBtn.disabled = true;
  const t0 = performance.now();
  setStatus(
    '<span class="spinner"></span>Analyse en cours avec la CLI Cactus…',
    "loading",
  );
  outEl.textContent = "…";
  try {
    const fd = new FormData();
    fd.append("image", file, file.name);
    const res = await fetch("/api/describe", { method: "POST", body: fd });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text.slice(0, 500) || `HTTP ${res.status}`);
    }
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const serverMs = typeof data.serverMs === "number" ? data.serverMs : null;
    const inferenceMs = Math.round(performance.now() - t0);
    lastResult = data.result;
    lastAnalysis = {
      inputW: loadedImage?.naturalWidth || null,
      inputH: loadedImage?.naturalHeight || null,
      inferenceMs,
      serverMs,
    };
    hoveredIndex = -1;
    selectedIndex = -1;
    renderObjList();
    renderScene();
    renderDescription();
    renderTextList();
    renderRelations();
    syncInspector();
    await redraw();
    lastRawJson = JSON.stringify(data.result, null, 2);
    outEl.textContent = lastRawJson;
    const dt = (inferenceMs / 1000).toFixed(2);
    timingEl.textContent = `${dt} s`;
    const n = (data.result.objects || []).length;
    metaEl.textContent =
      `${data.filename} → ${n} objet(s)` +
      (serverMs !== null ? `, serveur ${(serverMs / 1000).toFixed(2)} s` : "") +
      ` · total ${dt} s`;
    setStatus(
      `Analyse terminée en ${dt} s : ${n} objet(s) encadré(s) sur l’image.`,
      "ok",
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    setStatus(
      `Erreur pendant l’analyse : ${detail}. Vérifiez que la CLI Cactus est installée, puis réessayez.`,
      "err",
    );
    outEl.textContent = `ERREUR\n\n${detail}`;
  } finally {
    goBtn.disabled = !file;
  }
});

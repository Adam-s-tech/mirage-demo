// Vérifie les fichiers et métadonnées de la version publiée sur GitHub Pages.
// Aucune dépendance. Utilisation : bun run check:site
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const site = path.join(root, "wasm-app");
const errors = [];
const info = [];

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function exists(p) {
  return fs.existsSync(p);
}

function check(condition, message) {
  if (!condition) errors.push(message);
}

const required = [
  "index.html",
  "documentation.html",
  "styles.css",
  "app.js",
  "favicon.svg",
  "favicon-32.png",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "og-image.png",
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "vendor/cactus.js",
  "vendor/cactus.wasm",
];
for (const f of required) {
  check(exists(path.join(site, f)), `fichier manquant : wasm-app/${f}`);
}

const index = read(path.join(site, "index.html"));
const doc = read(path.join(site, "documentation.html"));
const robots = read(path.join(site, "robots.txt"));
const sitemap = read(path.join(site, "sitemap.xml"));
const manifest = JSON.parse(read(path.join(site, "manifest.webmanifest")));

const canonical = "https://adam-s-tech.github.io/mirage-demo/";

for (const [name, html] of [
  ["index.html", index],
  ["documentation.html", doc],
]) {
  check(/<html lang="fr"/.test(html), `${name} : attribut lang="fr" absent`);
  check(/<title>[^<]{10,}<\/title>/.test(html), `${name} : titre absent ou trop court`);
  check(
    /<meta name="description"[\s\S]{0,40}?content="[^"]{50,}"/.test(html),
    `${name} : meta description absente ou trop courte`,
  );
  check(/rel="canonical"/.test(html), `${name} : URL canonique absente`);
  check(/property="og:title"/.test(html), `${name} : Open Graph title absent`);
  check(/property="og:image"/.test(html), `${name} : Open Graph image absente`);
  check(/name="twitter:card"/.test(html), `${name} : Twitter Card absente`);
  check(/rel="manifest"/.test(html), `${name} : manifeste non lié`);
  check(
    (html.match(/<h1[\s>]/g) || []).length === 1,
    `${name} : il faut exactement un H1`,
  );
  check(!/[\u2014\u2013]/.test(html), `${name} : tiret cadratin ou demi-cadratin présent`);
}

check(
  index.includes(`<link rel="canonical" href="${canonical}"`),
  "index.html : URL canonique différente de l’URL prévisionnelle",
);
check(
  doc.includes(
    '<link rel="canonical" href="https://adam-s-tech.github.io/mirage-demo/documentation.html"',
  ),
  "documentation.html : URL canonique incorrecte",
);
check(
  index.includes('"@type": "SoftwareApplication"'),
  "index.html : données structurées SoftwareApplication absentes",
);
check(
  index.includes('"@type": "WebSite"'),
  "index.html : données structurées WebSite absentes",
);
check(
  doc.includes('"@type": "BreadcrumbList"'),
  "documentation.html : fil d’Ariane structuré absent",
);

// Liens et ressources locales.
function localTargets(html) {
  const out = [];
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(https?:|mailto:|data:|blob:|#)/.test(raw)) continue;
    const clean = raw.split("#")[0].split("?")[0];
    if (!clean) continue;
    out.push(clean);
  }
  return out;
}

function resolveTarget(page, target) {
  if (target.startsWith("/")) return path.join(site, target.slice(1));
  if (target.startsWith("./exemples/")) {
    return path.join(root, target.slice(2));
  }
  return path.resolve(path.dirname(path.join(site, page)), target);
}

for (const [page, html] of [
  ["index.html", index],
  ["documentation.html", doc],
]) {
  for (const target of localTargets(html)) {
    const resolved = resolveTarget(page, target);
    if (target === "./" || target === ".") continue;
    check(
      exists(resolved),
      `${page} : ressource locale introuvable ${target}`,
    );
  }
}

check(
  /Sitemap: https:\/\/adam-s-tech\.github\.io\/mirage-demo\/sitemap\.xml/.test(robots),
  "robots.txt : référence de sitemap absente",
);

const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check(locs.length === 2, "sitemap.xml : deux URL publiques attendues");
check(
  locs.includes(canonical),
  "sitemap.xml : URL d’accueil absente",
);
check(
  locs.includes(`${canonical}documentation.html`),
  "sitemap.xml : URL de documentation absente",
);
check(
  !/\.(json|wasm|cact|js|css)</.test(sitemap),
  "sitemap.xml : ne doit pas lister de ressource technique",
);

check(manifest.lang === "fr", "manifeste : langue non définie sur fr");
check(
  Array.isArray(manifest.icons) && manifest.icons.length >= 3,
  "manifeste : icônes insuffisantes",
);
for (const icon of manifest.icons || []) {
  const p = path.join(site, icon.src.replace(/^\.\//, ""));
  check(exists(p), `manifeste : icône introuvable ${icon.src}`);
}

// Dimensions de l’image sociale.
const png = fs.readFileSync(path.join(site, "og-image.png"));
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
check(width === 1280 && height === 640, `og-image.png : ${width}×${height} au lieu de 1280×640`);
info.push(`image sociale : ${width}×${height}`);

// Résultats de référence.
for (const f of fs.readdirSync(path.join(root, "exemples/resultats"))) {
  if (!f.endsWith(".json") || f.includes(".report.")) continue;
  const p = path.join(root, "exemples/resultats", f);
  let data;
  try {
    data = JSON.parse(read(p));
  } catch {
    errors.push(`JSON invalide : exemples/resultats/${f}`);
    continue;
  }
  for (const key of ["scene", "objects", "text", "relations", "reasoning"]) {
    check(key in data, `exemples/resultats/${f} : clé ${key} absente`);
  }
}

// Aucun marqueur de travail inachevé dans les pages publiées.
for (const [name, html] of [
  ["index.html", index],
  ["documentation.html", doc],
]) {
  check(!/\bTODO\b|\bFIXME\b|lorem ipsum/i.test(html), `${name} : marqueur inachevé`);
}

for (const line of info) console.log(`i ${line}`);

if (errors.length) {
  console.error(`\n${errors.length} problème(s) :`);
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}
console.log("check:site OK");

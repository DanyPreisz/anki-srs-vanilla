const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const SEED = path.join(ROOT, "data", "db.json");
const DB = process.env.DB_PATH || path.join("/tmp", "anki-db.json");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function load() {
  try {
    if (fs.existsSync(DB)) return JSON.parse(fs.readFileSync(DB, "utf8"));
  } catch {}
  return JSON.parse(fs.readFileSync(SEED, "utf8"));
}

let store = load();

function read() {
  return store;
}

function write(db) {
  store = db;
  try {
    fs.writeFileSync(DB, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("persist skipped", err.message);
  }
}

function send(res, status, body, type = TYPES[".json"]) {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function body(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function file(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "No encontrado", "text/plain; charset=utf-8");
    send(res, 200, data, TYPES[path.extname(filePath)] || "application/octet-stream");
  });
}

function dueCards() {
  const now = Date.now();
  return read().cards.filter((c) => c.due <= now);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/healthz")) {
    return send(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/due") {
    return send(res, 200, dueCards());
  }

  if (req.method === "POST" && url.pathname === "/api/cards") {
    const data = await body(req);
    const front = String(data.front || "").trim();
    const back = String(data.back || "").trim();
    if (!front || !back) return send(res, 400, { error: "vacío" });
    const db = read();
    const card = { id: "c" + Date.now(), front, back, due: 0, ivl: 0, ease: 2.5 };
    db.cards.push(card);
    write(db);
    return send(res, 201, card);
  }

  if (req.method === "POST" && url.pathname === "/api/review") {
    const data = await body(req);
    const db = read();
    const card = db.cards.find((c) => c.id === data.id);
    if (!card) return send(res, 404, { error: "no" });
    const grade = String(data.grade || "good");
    if (grade === "again") {
      card.ivl = 0;
      card.due = Date.now() + 60 * 1000;
    } else if (grade === "hard") {
      card.ivl = Math.max(1, Math.round(card.ivl * 1.2) || 1);
      card.due = Date.now() + card.ivl * 24 * 60 * 60 * 1000;
    } else {
      card.ivl = card.ivl === 0 ? 1 : Math.round(card.ivl * card.ease);
      card.ease = Math.min(3.3, card.ease + 0.1);
      card.due = Date.now() + card.ivl * 24 * 60 * 60 * 1000;
    }
    write(db);
    return send(res, 200, card);
  }

  const rel = url.pathname === "/" ? "/index.html" : url.pathname;
  const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, "");
  file(res, path.join(PUBLIC, safe));
});

server.listen(PORT, HOST, () => {
  console.log(`listening on http://${HOST}:${PORT}`);
});

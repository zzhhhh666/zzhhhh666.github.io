import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const contentDir = path.join(root, "content");
const blogDir = path.join(root, "content", "blog");
const port = Number(process.env.PORT || 4321);
const clients = new Set();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".tex": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function parseFrontmatter(source) {
  if (!source.startsWith("---")) return {};
  const end = source.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = source.slice(3, end).trim();
  return Object.fromEntries(
    block
      .split(/\r?\n/)
      .map((line) => line.match(/^([^:]+):\s*(.*)$/))
      .filter(Boolean)
      .map((match) => [match[1].trim(), match[2].trim().replace(/^["']|["']$/g, "")])
  );
}

async function getPosts() {
  const files = (await readdir(blogDir)).filter((file) => file.endsWith(".md"));
  const posts = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(blogDir, file);
      const [source, info] = await Promise.all([readFile(fullPath, "utf8"), stat(fullPath)]);
      const meta = parseFrontmatter(source);
      return {
        slug: file.replace(/\.md$/, ""),
        file,
        title: meta.title || file.replace(/\.md$/, ""),
        date: meta.date || info.mtime.toISOString().slice(0, 10),
        tags: (meta.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        summary: meta.summary || "",
        draft: meta.draft === "true"
      };
    })
  );

  return posts
    .filter((post) => !post.draft)
    .sort((a, b) => `${b.date}-${b.slug}`.localeCompare(`${a.date}-${a.slug}`));
}

async function serveFile(res, requestPath) {
  if (requestPath === "/") {
    return serveFile(res, "/index.html");
  }

  const safePath = path
    .normalize(decodeURIComponent(requestPath))
    .replace(/^[/\\]+/, "")
    .replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath);
  if (!filePath.startsWith(root)) return send(res, 403, "Forbidden");

  try {
    const body = await readFile(filePath);
    send(res, 200, body, mimeTypes[path.extname(filePath)] || "application/octet-stream");
  } catch {
    send(res, 404, "Not found");
  }
}

function broadcastReload() {
  for (const res of clients) {
    res.write(`data: ${Date.now()}\n\n`);
  }
}

watch(contentDir, { recursive: true }, () => broadcastReload());

createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${port}`);

  if (url.pathname === "/api/posts") {
    return send(res, 200, JSON.stringify(await getPosts()), "application/json; charset=utf-8");
  }

  if (url.pathname === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive"
    });
    res.write("data: ready\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  serveFile(res, url.pathname);
}).listen(port, () => {
  console.log(`Paper + Code homepage running at http://localhost:${port}`);
  console.log(`Edit Markdown files in ${blogDir}`);
});

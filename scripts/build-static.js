import { mkdir, readdir, readFile, rm, writeFile, copyFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "dist");
const blogDir = path.join(root, "content", "blog");
const pdfManifestPath = path.join(root, "content", "pdfs.json");

function parseFrontmatter(source) {
  if (!source.startsWith("---")) return {};
  const end = source.indexOf("\n---", 3);
  if (end === -1) return {};
  return Object.fromEntries(
    source
      .slice(3, end)
      .trim()
      .split(/\r?\n/)
      .map((line) => line.match(/^([^:]+):\s*(.*)$/))
      .filter(Boolean)
      .map((match) => [match[1].trim(), match[2].trim().replace(/^["']|["']$/g, "")])
  );
}

function parseTags(value = "") {
  return String(value)
    .split(/[,，;；]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function copyTree(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) await copyTree(source, target);
    else await copyFile(source, target);
  }
}

async function getPosts() {
  const files = (await readdir(blogDir)).filter((file) => file.endsWith(".md"));
  const markdownPosts = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(blogDir, file);
      const [source, info] = await Promise.all([readFile(fullPath, "utf8"), stat(fullPath)]);
      const meta = parseFrontmatter(source);
      return {
        type: "markdown",
        slug: file.replace(/\.md$/, ""),
        file,
        title: meta.title || file.replace(/\.md$/, ""),
        date: meta.date || info.mtime.toISOString().slice(0, 10),
        tags: parseTags(meta.tags),
        summary: meta.summary || "",
        draft: meta.draft === "true"
      };
    })
  );

  let pdfPosts = [];
  try {
    pdfPosts = JSON.parse(await readFile(pdfManifestPath, "utf8")).map((item) => ({
      type: "pdf",
      slug: item.slug || path.basename(item.file || "", path.extname(item.file || "")),
      file: item.file,
      title: item.title,
      date: item.date || "",
      tags: Array.isArray(item.tags) ? item.tags : parseTags(item.tags),
      summary: item.summary || "",
      draft: item.draft === true
    }));
  } catch {
    pdfPosts = [];
  }

  return [...markdownPosts, ...pdfPosts]
    .filter((post) => !post.draft)
    .filter((post) => post.title && post.slug && post.tags?.length)
    .sort((a, b) => `${b.date}-${b.slug}`.localeCompare(`${a.date}-${a.slug}`));
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await Promise.all([
  copyFile(path.join(root, "index.html"), path.join(outDir, "index.html")),
  copyFile(path.join(root, "styles.css"), path.join(outDir, "styles.css")),
  copyFile(path.join(root, "app.js"), path.join(outDir, "app.js")),
  copyTree(path.join(root, "content"), path.join(outDir, "content"))
]);
await writeFile(path.join(outDir, ".nojekyll"), "", "utf8");
await mkdir(path.join(outDir, "api"), { recursive: true });
const postsJson = JSON.stringify(await getPosts());
await writeFile(path.join(outDir, "api", "posts"), postsJson, "utf8");
await mkdir(path.join(root, "api"), { recursive: true });
await writeFile(path.join(root, "api", "posts"), postsJson, "utf8");

console.log(`Built static site to ${outDir}`);

import { mkdir, readdir, readFile, rm, writeFile, copyFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "dist");
const blogDir = path.join(root, "content", "blog");

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
        tags: (meta.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
        summary: meta.summary || "",
        draft: meta.draft === "true"
      };
    })
  );
  return posts.filter((post) => !post.draft).sort((a, b) => b.date.localeCompare(a.date));
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

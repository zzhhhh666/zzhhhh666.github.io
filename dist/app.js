const postList = document.querySelector("#post-list");
const postView = document.querySelector("#post-view");
const liveStatus = document.querySelector("#live-status");
const projectList = document.querySelector("#project-list");
const paperList = document.querySelector("#paper-list");
const contactLine = document.querySelector("#contact-line");
let currentSlug = "";
let currentType = "";

if (window.marked) {
  marked.setOptions({
    gfm: true,
    breaks: true
  });
}

function stripFrontmatter(source) {
  return source.replace(/^---[\s\S]*?\n---\s*/, "");
}

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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMarkdown(source) {
  if (window.marked) return marked.parse(source);
  return `<pre>${escapeHtml(source)}</pre>`;
}

function renderTags(tags = []) {
  if (!tags.length) return "";
  return `<div class="tag-row">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function prepareFootnotes(markdown) {
  const lines = markdown.split(/\r?\n/);
  const notes = [];
  const bodyLines = [];
  let activeNote = null;

  for (const line of lines) {
    const definition = line.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (definition) {
      activeNote = { id: definition[1], body: [definition[2]] };
      notes.push(activeNote);
      continue;
    }

    if (activeNote && /^( {2,}|\t)/.test(line)) {
      activeNote.body.push(line.trim());
      continue;
    }

    activeNote = null;
    bodyLines.push(line);
  }

  const noteNumbers = new Map(notes.map((note, index) => [note.id, index + 1]));
  const withRefs = bodyLines.join("\n").replace(/\[\^([^\]]+)\]/g, (match, id) => {
    const number = noteNumbers.get(id);
    if (!number) return match;
    return `<sup class="footnote-ref" id="fnref-${escapeHtml(id)}"><a href="#fn-${escapeHtml(id)}">${number}</a></sup>`;
  });

  if (!notes.length) return withRefs;

  const renderedNotes = notes
    .map((note, index) => {
      const html = renderMarkdown(note.body.join("\n")).trim();
      return `<li id="fn-${escapeHtml(note.id)}">${html}<a class="footnote-backref" href="#fnref-${escapeHtml(note.id)}">↩</a></li>`;
    })
    .join("");

  return `${withRefs}\n\n<section class="footnotes"><h2>Notes</h2><ol>${renderedNotes}</ol></section>`;
}

function renderMath() {
  if (!window.MathJax?.typesetPromise) return;
  window.MathJax.typesetPromise([postView]).catch(() => {});
}

async function loadJson(path) {
  const response = await fetch(`${path}?ts=${Date.now()}`);
  if (!response.ok) throw new Error(`Cannot load ${path}`);
  return response.json();
}

async function loadProfile() {
  try {
    const profile = await loadJson("/content/profile.json");

    document.querySelectorAll('[data-profile="name"]').forEach((node) => {
      node.textContent = profile.name || "Zihan Zhang";
    });
    document.querySelectorAll('[data-profile="title"]').forEach((node) => {
      node.textContent = profile.title || "";
    });
    document.querySelectorAll('[data-profile="headline"]').forEach((node) => {
      node.textContent = profile.headline || "";
    });
    document.querySelectorAll('[data-profile="bio"]').forEach((node) => {
      node.textContent = profile.bio || "";
    });
    document.querySelectorAll('[data-profile="focus"]').forEach((node) => {
      node.textContent = (profile.focus || []).join(" · ");
    });
    document.querySelectorAll('[data-profile="location"]').forEach((node) => {
      node.textContent = profile.location || "";
    });
    document.querySelectorAll('[data-profile="metaWritingLabel"]').forEach((node) => {
      node.textContent = profile.meta?.writingLabel || "Writing";
    });
    document.querySelectorAll('[data-profile="metaWritingValue"]').forEach((node) => {
      node.textContent = profile.meta?.writingValue || "Markdown + LaTeX";
    });
    document.querySelectorAll('[data-profile="metaLocationLabel"]').forEach((node) => {
      node.textContent = profile.meta?.locationLabel || "Location";
    });
    document.querySelectorAll('[data-profile="researchTitle"]').forEach((node) => {
      node.textContent = profile.sections?.researchTitle || "Research";
    });
    document.querySelectorAll('[data-profile="researchDescription"]').forEach((node) => {
      node.textContent = profile.sections?.researchDescription || "";
    });
    document.querySelectorAll('[data-profile="blogTitle"]').forEach((node) => {
      node.textContent = profile.sections?.blogTitle || "Blog";
    });
    document.querySelectorAll('[data-profile="projectsTitle"]').forEach((node) => {
      node.textContent = profile.sections?.projectsTitle || "Projects";
    });
    document.querySelectorAll("[data-profile-code]").forEach((node) => {
      const code = profile.heroCode || "";
      if (!code.trim()) {
        node.style.display = "none";
        return;
      }
      node.style.display = "";
      node.querySelector("code").textContent = code;
    });
    document.querySelectorAll("[data-profile-photo]").forEach((node) => {
      if (!profile.photo) {
        node.closest(".profile-photo")?.classList.remove("is-visible");
        return;
      }
      node.src = `${profile.photo}?ts=${Date.now()}`;
      node.alt = `${profile.name || "Profile"} photo`;
      node.onload = () => node.closest(".profile-photo")?.classList.add("is-visible");
      node.onerror = () => node.closest(".profile-photo")?.classList.remove("is-visible");
    });

    document.title = `${profile.name || "Zihan Zhang"} | Academic Homepage`;

    const links = (profile.links || [])
      .filter((link) => link.url && link.url !== "#")
      .map((link) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`)
      .join(" · ");
    const email = profile.email ? `<a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a>` : "";
    contactLine.innerHTML = [email, links].filter(Boolean).join(" · ");
  } catch {
    contactLine.textContent = "";
  }
}

async function loadProjects() {
  try {
    const projects = await loadJson("/content/projects.json");
    if (!projects.length) {
      projectList.innerHTML = '<p class="empty-note">No public projects listed yet.</p>';
      return;
    }

    projectList.innerHTML = projects
      .map(
        (project) => `
          <article class="project-card">
            <span>${escapeHtml(project.index || "")}</span>
            <h3>${escapeHtml(project.title || "")}</h3>
            <p>${escapeHtml(project.description || "")}</p>
            ${project.url && project.url !== "#" ? `<a href="${escapeHtml(project.url)}">View project</a>` : ""}
          </article>
        `
      )
      .join("");
  } catch {
    projectList.innerHTML = '<p class="empty-note">No public projects listed yet.</p>';
  }
}

async function loadPapers() {
  try {
    const papers = await loadJson("/content/papers.json");
    if (!papers.length) {
      paperList.innerHTML = '<p class="empty-note">No papers listed yet.</p>';
      return;
    }

    paperList.innerHTML = papers
      .map(
        (paper) => `
          <article class="paper-item">
            <h3>${escapeHtml(paper.title || "")}</h3>
            <p>${escapeHtml([paper.venue, paper.year].filter(Boolean).join(" · "))}</p>
            <p>${escapeHtml(paper.description || "")}</p>
            ${paper.url && paper.url !== "#" ? `<a href="${escapeHtml(paper.url)}">Read</a>` : ""}
          </article>
        `
      )
      .join("");
  } catch {
    paperList.innerHTML = '<p class="empty-note">No papers listed yet.</p>';
  }
}

async function loadPosts(selectSlug = currentSlug, selectType = currentType) {
  try {
    const posts = await fetch(`/api/posts?ts=${Date.now()}`).then((response) => {
      if (!response.ok) throw new Error("Cannot load post manifest");
      return response.json();
    });

    postList.innerHTML = "";

    if (!posts.length) {
      postList.innerHTML = '<div class="post-button"><strong>No posts yet</strong><span>Add Markdown files in content/blog.</span></div>';
      postView.innerHTML = "<h1>No posts yet</h1><p>Add a Markdown file in <code>content/blog</code>, then rebuild and publish.</p>";
      liveStatus.textContent = "Ready";
      return;
    }

    const selected = posts.find((post) => post.slug === selectSlug && (!selectType || post.type === selectType)) || posts[0];
    currentSlug = selected.slug;
    currentType = selected.type;

    for (const post of posts) {
      const button = document.createElement("button");
      button.className = `post-button${post.slug === currentSlug && post.type === currentType ? " active" : ""}`;
      button.type = "button";
      button.dataset.slug = post.slug;
      button.dataset.type = post.type;
      button.innerHTML = `
        <strong>${escapeHtml(post.title)}</strong>
        <span>${escapeHtml(post.date)} · ${post.type === "pdf" ? "PDF" : "Markdown"}</span>
        ${renderTags(post.tags)}
        ${post.summary ? `<em>${escapeHtml(post.summary)}</em>` : ""}
      `;
      button.addEventListener("click", () => loadPost(post));
      postList.append(button);
    }

    await loadPost(selected, false);
    liveStatus.textContent = ["localhost", "127.0.0.1"].includes(window.location.hostname)
      ? "Watching"
      : "Published";
  } catch (error) {
    postList.innerHTML = '<div class="post-button"><strong>Blog failed to load</strong><span>Check api/posts and content/blog.</span></div>';
    postView.innerHTML = `<h1>Blog failed to load</h1><p>${escapeHtml(error.message)}</p>`;
    liveStatus.textContent = "Error";
  }
}

async function loadPost(post, refreshList = true) {
  currentSlug = post.slug;
  currentType = post.type;
  if (refreshList) {
    for (const button of postList.querySelectorAll(".post-button")) {
      button.classList.toggle("active", button.dataset.slug === post.slug && button.dataset.type === post.type);
    }
  }

  if (post.type === "pdf") {
    postView.innerHTML = `
      <header class="document-header">
        <p class="document-type">PDF</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="document-date">${escapeHtml(post.date || "")}</p>
        ${renderTags(post.tags)}
        ${post.summary ? `<p>${escapeHtml(post.summary)}</p>` : ""}
        <a class="button ghost" href="${escapeHtml(post.file)}" target="_blank" rel="noreferrer">Open PDF</a>
      </header>
      <iframe class="pdf-frame" src="${escapeHtml(post.file)}" title="${escapeHtml(post.title)}"></iframe>
    `;
    return;
  }

  const response = await fetch(`/content/blog/${post.slug}.md?ts=${Date.now()}`);
  if (!response.ok) throw new Error(`Cannot load post: ${post.slug}`);
  const source = await response.text();
  const meta = parseFrontmatter(source);
  const title = meta.title || post.title;
  const bodyWithoutRepeatedTitle = stripFrontmatter(source).replace(new RegExp(`^#\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n+`), "");
  const body = prepareFootnotes(bodyWithoutRepeatedTitle);
  postView.innerHTML = `
    <header class="document-header">
      <p class="document-type">Markdown</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="document-date">${escapeHtml(meta.date || post.date || "")}</p>
      ${renderTags(post.tags)}
      ${meta.summary ? `<p>${escapeHtml(meta.summary)}</p>` : ""}
    </header>
    ${renderMarkdown(body)}
  `;
  renderMath();
}

if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
  new EventSource("/events").addEventListener("message", async () => {
    liveStatus.textContent = "Updated";
    await loadProfile();
    await loadProjects();
    await loadPapers();
    await loadPosts(currentSlug, currentType);
  });
}

loadProfile();
loadProjects();
loadPapers();
loadPosts();

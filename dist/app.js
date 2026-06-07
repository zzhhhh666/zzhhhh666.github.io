const postList = document.querySelector("#post-list");
const postView = document.querySelector("#post-view");
const liveStatus = document.querySelector("#live-status");
const projectList = document.querySelector("#project-list");
const paperList = document.querySelector("#paper-list");
const contactLine = document.querySelector("#contact-line");
let currentSlug = "";

if (window.marked) {
  marked.setOptions({
    gfm: true,
    breaks: true
  });
}

function stripFrontmatter(source) {
  return source.replace(/^---[\s\S]*?\n---\s*/, "");
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
    document.querySelectorAll('[data-profile="bio"]').forEach((node) => {
      node.textContent = profile.bio || "";
    });
    document.querySelectorAll('[data-profile="focus"]').forEach((node) => {
      node.textContent = (profile.focus || []).join(" · ");
    });
    document.querySelectorAll('[data-profile="location"]').forEach((node) => {
      node.textContent = profile.location || "";
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

async function loadPosts(selectSlug = currentSlug) {
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

    const selected = posts.find((post) => post.slug === selectSlug) || posts[0];
    currentSlug = selected.slug;

    for (const post of posts) {
      const button = document.createElement("button");
      button.className = `post-button${post.slug === currentSlug ? " active" : ""}`;
      button.type = "button";
      button.dataset.slug = post.slug;
      button.innerHTML = `
        <strong>${escapeHtml(post.title)}</strong>
        <span>${escapeHtml(post.date)}${post.summary ? ` · ${escapeHtml(post.summary)}` : ""}</span>
      `;
      button.addEventListener("click", () => loadPost(post.slug));
      postList.append(button);
    }

    await loadPost(currentSlug, false);
    liveStatus.textContent = ["localhost", "127.0.0.1"].includes(window.location.hostname)
      ? "Watching"
      : "Published";
  } catch (error) {
    postList.innerHTML = '<div class="post-button"><strong>Blog failed to load</strong><span>Check api/posts and content/blog.</span></div>';
    postView.innerHTML = `<h1>Blog failed to load</h1><p>${escapeHtml(error.message)}</p>`;
    liveStatus.textContent = "Error";
  }
}

async function loadPost(slug, refreshList = true) {
  currentSlug = slug;
  if (refreshList) {
    for (const button of postList.querySelectorAll(".post-button")) {
      button.classList.toggle("active", button.dataset.slug === slug);
    }
  }

  const response = await fetch(`/content/blog/${slug}.md?ts=${Date.now()}`);
  if (!response.ok) throw new Error(`Cannot load post: ${slug}`);
  const source = await response.text();
  postView.innerHTML = renderMarkdown(stripFrontmatter(source));
  renderMath();
}

if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
  new EventSource("/events").addEventListener("message", async () => {
    liveStatus.textContent = "Updated";
    await loadProfile();
    await loadProjects();
    await loadPapers();
    await loadPosts(currentSlug);
  });
}

loadProfile();
loadProjects();
loadPapers();
loadPosts();

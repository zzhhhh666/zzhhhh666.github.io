const postList = document.querySelector("#post-list");
const postView = document.querySelector("#post-view");
const liveStatus = document.querySelector("#live-status");
const projectList = document.querySelector("#project-list");
const paperList = document.querySelector("#paper-list");
const contactLine = document.querySelector("#contact-line");
let currentSlug = "";

marked.setOptions({
  gfm: true,
  breaks: true
});

function stripFrontmatter(source) {
  return source.replace(/^---[\s\S]*?\n---\s*/, "");
}

function renderMath() {
  if (!window.MathJax?.typesetPromise) return;
  window.MathJax.typesetPromise([postView]).catch(() => {});
}

async function loadPosts(selectSlug = currentSlug) {
  const posts = await fetch("/api/posts").then((response) => response.json());
  postList.innerHTML = "";

  if (!posts.length) {
    postList.innerHTML = '<div class="post-button"><strong>暂无文章</strong><span>在 content/blog 添加 .md 文件。</span></div>';
    postView.innerHTML = "<h1>暂无文章</h1><p>新建 Markdown 文件后，这里会自动更新。</p>";
    return;
  }

  const selected = posts.find((post) => post.slug === selectSlug) || posts[0];
  currentSlug = selected.slug;

  for (const post of posts) {
    const button = document.createElement("button");
    button.className = `post-button${post.slug === currentSlug ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <strong>${post.title}</strong>
      <span>${post.date}${post.summary ? ` · ${post.summary}` : ""}</span>
    `;
    button.addEventListener("click", () => loadPost(post.slug));
    postList.append(button);
  }

  await loadPost(currentSlug, false);
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
      node.textContent = profile.name;
    });
    document.querySelectorAll('[data-profile="bio"]').forEach((node) => {
      node.textContent = profile.bio;
    });
    document.querySelectorAll('[data-profile="focus"]').forEach((node) => {
      node.textContent = (profile.focus || []).join(" · ");
    });
    document.title = `${profile.name} | 学术主页`;

    const links = (profile.links || [])
      .filter((link) => link.url)
      .map((link) => `<a href="${link.url}">${link.label}</a>`)
      .join(" · ");
    contactLine.innerHTML = `${profile.email || ""}${links ? ` · ${links}` : ""}`;
  } catch {
    contactLine.textContent = "编辑 content/profile.json 来填写你的联系方式。";
  }
}

async function loadProjects() {
  try {
    const projects = await loadJson("/content/projects.json");
    projectList.innerHTML = projects
      .map(
        (project) => `
          <article class="project-card">
            <span>${project.index || ""}</span>
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            ${project.url && project.url !== "#" ? `<a href="${project.url}">查看项目</a>` : ""}
          </article>
        `
      )
      .join("");
  } catch {
    projectList.innerHTML = "";
  }
}

async function loadPapers() {
  try {
    const papers = await loadJson("/content/papers.json");
    paperList.innerHTML = papers
      .map(
        (paper) => `
          <article class="paper-item">
            <h3>${paper.title}</h3>
            <p>${paper.venue || ""}${paper.year ? ` · ${paper.year}` : ""}</p>
            <p>${paper.description || ""}</p>
            ${paper.url && paper.url !== "#" ? `<a href="${paper.url}">阅读</a>` : ""}
          </article>
        `
      )
      .join("");
  } catch {
    paperList.innerHTML = "";
  }
}

async function loadPost(slug, refreshList = true) {
  currentSlug = slug;
  if (refreshList) {
    for (const button of postList.querySelectorAll(".post-button")) {
      button.classList.remove("active");
    }
  }

  const source = await fetch(`/content/blog/${slug}.md?ts=${Date.now()}`).then((response) =>
    response.text()
  );
  postView.innerHTML = marked.parse(stripFrontmatter(source));
  renderMath();
}

if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
  new EventSource("/events").addEventListener("message", async () => {
    liveStatus.textContent = "已更新";
    await loadProfile();
    await loadProjects();
    await loadPapers();
    await loadPosts(currentSlug);
    window.setTimeout(() => {
      liveStatus.textContent = "监听中";
    }, 900);
  });
} else {
  liveStatus.textContent = "静态发布";
}

loadProfile();
loadProjects();
loadPapers();
loadPosts();

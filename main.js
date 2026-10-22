(function () {
  "use strict";
  const D = window.PORTFOLIO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ⟪…⟫ 는 아직 채우지 않은 자리 → 형광펜으로 표시 */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (s) => esc(s).replace(/⟪(.*?)⟫/g, (_, t) => `<mark class="todo">${t || "채울 내용"}</mark>`);
  const plain = (s) => String(s ?? "").replace(/[⟪⟫]/g, "");
  const tags = (arr) => (arr || []).map((t) => `<span class="tag">${fmt(t)}</span>`).join("");

  /* ---------- 미디어 (영상 / 이미지 / 슬라이드 / 자리표시) ---------- */
  const mediaIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => setPlaying(e.target, e.isIntersecting && e.intersectionRatio >= 0.35));
  }, { threshold: [0, 0.35, 0.7] });

  function makeMedia(m, label) {
    const box = document.createElement("div");
    box.className = "media";
    if (!m || !m.src || (Array.isArray(m.src) && !m.src.length)) {
      box.classList.add("ph", "paused");
      box.innerHTML = `<span>${esc(label || "영상 · 이미지 자리")}</span>`;
    } else if (m.type === "video") {
      const v = document.createElement("video");
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
      v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
      if (m.poster) v.poster = m.poster;
      v.dataset.src = m.src;
      box.appendChild(v);
    } else if (m.type === "images") {
      box.classList.add("slides");
      box.innerHTML = m.src.map((s, i) => `<img src="${esc(s)}" alt="" loading="lazy" class="${i ? "" : "on"}">`).join("");
    } else {
      box.innerHTML = `<img src="${esc(m.src)}" alt="" loading="lazy">`;
    }
    mediaIO.observe(box);
    return box;
  }

  function setPlaying(box, on) {
    if (reduceMotion) on = false;
    const holder = box.closest(".card-media");
    if (box.classList.contains("ph")) {
      box.classList.toggle("paused", !on);
      return;
    }
    const v = $("video", box);
    if (v) {
      if (on) {
        if (!v.src) v.src = v.dataset.src;
        v.play().then(() => holder && holder.classList.add("playing")).catch(() => {});
      } else {
        v.pause();
        holder && holder.classList.remove("playing");
      }
      return;
    }
    if (box.classList.contains("slides")) {
      clearInterval(box._t);
      if (on) {
        box._t = setInterval(() => {
          const imgs = $$("img", box), i = imgs.findIndex((x) => x.classList.contains("on"));
          imgs[i].classList.remove("on");
          imgs[(i + 1) % imgs.length].classList.add("on");
        }, 2200);
      }
    }
  }

  /* ---------- 기본 텍스트 ---------- */
  $$("[data-bind]").forEach((el) => { el.innerHTML = fmt(D.meta[el.dataset.bind]); });
  document.title = `${plain(D.meta.name)} — ${plain(D.meta.role)} Portfolio`;
  $("#headline").innerHTML = D.meta.headline.map((l, i) =>
    `<span class="line"><span style="animation-delay:${0.1 + i * 0.12}s">${fmt(l).replace(/\*(.+?)\*/g, "<em>$1</em>")}</span></span>`).join("");
  $("#keywords").innerHTML = D.meta.keywords.map((k) => `<li>${fmt(k)}</li>`).join("");
  $("#footLinks").innerHTML = D.meta.links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${fmt(l.label)} ↗</a></li>`).join("");

  /* ---------- 한눈에 ---------- */
  $("#glanceGrid").innerHTML = D.glance.map((g) => `
    <div class="glance-item reveal">
      <div class="glance-num" data-count="${esc(g.value)}">${fmt(g.value)}<small>${fmt(g.unit)}</small></div>
      <p class="glance-label">${fmt(g.label)}</p>
      <p class="glance-sub">${fmt(g.sub)}</p>
    </div>`).join("");

  /* ---------- Selected Works ---------- */
  const featured = D.works.filter((w) => w.featured);
  $("#worksList").innerHTML = featured.map((w, i) => `
    <li class="work-row reveal">
      <button type="button" data-id="${esc(w.id)}">
        <span class="w-no mono">${String(i + 1).padStart(2, "0")}</span>
        <span class="w-thumb" data-media></span>
        <span class="w-title">${fmt(w.title)}<span class="w-genre">${fmt(w.genre)}</span></span>
        <span class="w-role">${fmt(w.role)}<span class="w-tags">${tags(w.tags)}</span></span>
        <span class="w-meta mono">${fmt(w.period)}<span class="w-arrow">↗</span></span>
      </button>
    </li>`).join("");
  $$("#worksList [data-media]").forEach((slot, i) => slot.appendChild(makeMedia(featured[i].media, plain(featured[i].title))));

  // 커서를 따라다니는 미리보기
  const pv = $("#worksPreview");
  let px = 0, py = 0, tx = 0, ty = 0, raf = 0;
  const loop = () => {
    px += (tx - px) * 0.18; py += (ty - py) * 0.18;
    pv.style.left = px + "px"; pv.style.top = py + "px";
    raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.5 ? requestAnimationFrame(loop) : 0;
  };
  $$("#worksList button").forEach((btn) => {
    const w = D.works.find((x) => x.id === btn.dataset.id);
    btn.addEventListener("mouseenter", (e) => {
      pv.replaceChildren(makeMedia(w.media, plain(w.title)));
      px = tx = e.clientX + 200; py = ty = e.clientY;
      pv.classList.add("show");
    });
    btn.addEventListener("mousemove", (e) => {
      tx = e.clientX + 200; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    btn.addEventListener("mouseleave", () => pv.classList.remove("show"));
    btn.addEventListener("click", () => openWork(w));
  });

  /* ---------- 포트폴리오 파일 ---------- */
  const fileKinds = [["summary", "요약 포트폴리오", "SUMMARY"], ["detail", "상세 포트폴리오", "DETAIL"]];
  $("#filesStack").innerHTML = fileKinds.map(([k, name, en]) => {
    const f = D.files[k];
    const sheet = f.cover
      ? `<span class="file-sheet"><img src="${esc(f.cover)}" alt=""></span>`
      : `<span class="file-sheet"><i class="l big"></i><i class="l w80"></i><i class="l w60"></i><i class="blk"></i><i class="l w40"></i></span>`;
    return `
      <div class="file is-${k} reveal">
        <span class="file-tab mono">${en} · ${fmt(f.pages)}p</span>
        <a class="file-pdf mono" href="${esc(f.pdf)}" target="_blank" rel="noopener">PDF ↓</a>
        <a class="file-body" href="${esc(f.url)}" target="_blank" rel="noopener">
          <span class="file-hook">${fmt(f.hook)}</span>
          <span class="file-sheets"><span class="file-sheet"></span><span class="file-sheet"></span>${sheet}</span>
          <span class="file-info">
            <h3>${name} <span class="mono">${fmt(f.readTime)} ↗</span></h3>
            <p>${fmt(f.teaser)}</p>
          </span>
        </a>
      </div>`;
  }).join("");

  $("#dockTray").innerHTML = fileKinds.map(([k, name]) => {
    const f = D.files[k];
    return `<a class="tray-item is-${k}" href="${esc(f.url)}" target="_blank" rel="noopener">
      <span class="tray-ico">${fmt(f.pages)}p</span>
      <span><b>${name}</b><small>${fmt(f.teaser)}</small><small class="mono">읽는 시간 ${fmt(f.readTime)}</small></span>
      <span class="go">↗</span></a>`;
  }).join("") + `<div class="tray-foot mono"><span>PDF</span><span><a href="${esc(D.files.summary.pdf)}">요약본</a> · <a href="${esc(D.files.detail.pdf)}">상세본</a></span></div>`;

  /* ---------- 프로젝트 카드 ---------- */
  $("#projectCards").innerHTML = D.works.map((w) => `
    <button type="button" class="card reveal" data-id="${esc(w.id)}">
      <div class="card-media"><span class="card-status">${fmt(w.status)}</span><span class="card-play mono">PLAYING</span></div>
      <div class="card-body">
        <div class="card-top mono"><span>${fmt(w.period)}</span><span>${fmt(w.team)}</span></div>
        <h3>${fmt(w.title)}</h3>
        <p class="one">${fmt(w.oneLine)}</p>
        <div class="tags">${tags(w.tags)}</div>
        <span class="card-more">자세히 보기 →</span>
      </div>
    </button>`).join("");
  $$("#projectCards .card").forEach((c) => {
    const w = D.works.find((x) => x.id === c.dataset.id);
    $(".card-media", c).prepend(makeMedia(w.media, plain(w.title)));
    c.addEventListener("click", () => openWork(w));
  });

  /* ---------- 게임 로그 ---------- */
  $("#logCards").innerHTML = D.gameLogs.map((g) => `
    <article class="card reveal" data-genre="${esc(plain(g.genre))}">
      <div class="card-media"><span class="card-status">${fmt(g.platform)}</span><span class="card-play mono">PLAYING</span></div>
      <div class="card-body">
        <div class="card-top mono"><span>${fmt(g.genre)}</span><span>${fmt(g.period)}</span></div>
        <h3>${fmt(g.title)}</h3>
        <dl class="log-stats">${(g.stats || []).slice(0, 2).map((s) => `<div><dt>${fmt(s.label)}</dt><dd>${fmt(s.value)}</dd></div>`).join("")}</dl>
        <p class="log-insight">${fmt(g.insight)}</p>
        <div class="tags">${tags(g.tags)}</div>
      </div>
    </article>`).join("");
  $$("#logCards .card").forEach((c, i) => $(".card-media", c).prepend(makeMedia(D.gameLogs[i].media, plain(D.gameLogs[i].title))));

  const genres = ["전체", ...new Set(D.gameLogs.map((g) => plain(g.genre)))];
  $("#logFilter").innerHTML = genres.map((g, i) => `<button type="button" aria-pressed="${i === 0}">${esc(g)}</button>`).join("");
  $("#logFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#logFilter button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    $$("#logCards .card").forEach((c) => c.classList.toggle("hide", b.textContent !== "전체" && c.dataset.genre !== b.textContent));
  });

  /* ---------- 이력 ---------- */
  $("#resumeList").innerHTML = D.resume.map((g) => `
    <div class="resume-group reveal">
      <h3>${fmt(g.group)}</h3>
      <ol>${g.items.map((it) => `
        <li class="resume-item">
          <span class="mono">${fmt(it.period)}</span>
          <div><b>${fmt(it.title)}</b>${it.badge ? `<span class="badge">${fmt(it.badge)}</span>` : ""}<p>${fmt(it.desc)}</p></div>
        </li>`).join("")}</ol>
    </div>`).join("");

  /* ---------- 상세 모달 ---------- */
  const modal = $("#modal");
  function openWork(w) {
    const facts = [["역할", w.role], ["기간", w.period], ["구성", w.team], ["상태", w.status]];
    $("#modalBody").innerHTML = `
      <div class="modal-media"></div>
      <div class="modal-text">
        <div><p class="mono" style="color:var(--ink-3)">${fmt(w.genre)}</p><h2 id="modalTitle">${fmt(w.title)}</h2></div>
        <dl class="modal-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${fmt(v)}</dd></div>`).join("")}</dl>
        <dl class="modal-steps">
          <div><dt>PROBLEM</dt><dd>${fmt(w.problem)}</dd></div>
          <div><dt>APPROACH</dt><dd>${fmt(w.approach)}</dd></div>
          <div><dt>RESULT</dt><dd>${fmt(w.result)}</dd></div>
        </dl>
        <div><h4>주요 업무</h4><ul class="tasks">${(w.tasks || []).map((t) => `<li>${fmt(t)}</li>`).join("")}</ul></div>
        ${w.links && w.links.length ? `<div class="modal-links">${w.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${fmt(l.label)} ↗</a>`).join("")}</div>` : ""}
      </div>`;
    $(".modal-media", modal).appendChild(makeMedia(w.media, plain(w.title)));
    modal.showModal();
    modal.scrollTop = 0;
    $(".modal-close").focus({ preventScroll: true });
  }
  $(".modal-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  modal.addEventListener("close", () => $$("video", modal).forEach((v) => v.pause()));

  /* ---------- 떠다니는 파일 버튼 ---------- */
  const dock = $("#dock"), dockBtn = $(".dock-btn");
  const setDock = (open) => { dock.classList.toggle("open", open); dockBtn.setAttribute("aria-expanded", open); };
  dockBtn.addEventListener("click", (e) => { e.stopPropagation(); setDock(!dock.classList.contains("open")); });
  document.addEventListener("click", (e) => { if (!dock.contains(e.target)) setDock(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setDock(false); });

  let filesVisible = false;
  new IntersectionObserver(([e]) => { filesVisible = e.isIntersecting; onScroll(); }, { threshold: 0.25 }).observe($("#files"));
  function onScroll() {
    const past = window.scrollY > window.innerHeight * 0.6;
    dock.classList.toggle("on", past && !filesVisible);
    if (!dock.classList.contains("on")) setDock(false);
    $(".top").classList.toggle("scrolled", window.scrollY > 10);
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 등장 애니메이션 / 숫자 카운트 / 메뉴 활성화 ---------- */
  const revIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    revIO.unobserve(e.target);
    const n = $("[data-count]", e.target);
    if (n) countUp(n);
  }), { threshold: 0.15 });
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; revIO.observe(el); });

  function countUp(el) {
    const raw = el.dataset.count, m = raw.match(/^([^\d]*)([\d,.]+)$/);
    if (!m || reduceMotion) return;
    const target = parseFloat(m[2].replace(/,/g, "")), dec = (m[2].split(".")[1] || "").length;
    const unit = el.querySelector("small").outerHTML, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1200), v = target * (1 - Math.pow(1 - p, 3));
      el.innerHTML = esc(m[1]) + v.toLocaleString("ko-KR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + unit;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const navLinks = $$(".top-nav a");
  const secIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => secIO.observe(s));

  /* ---------- 테마 ---------- */
  const root = document.documentElement;
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const label = () => { $(".theme-label").textContent = isDark() ? "DARK" : "LIGHT"; };
  $(".theme-btn").addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    label();
  });
  label();

  /* ---------- 이메일 복사 ---------- */
  const toast = $("#toast");
  $(".copy-mail").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(plain(D.meta.email)); toast.textContent = "이메일을 복사했어요"; }
    catch (e) { toast.textContent = plain(D.meta.email); }
    toast.classList.add("on");
    setTimeout(() => toast.classList.remove("on"), 1800);
  });
})();

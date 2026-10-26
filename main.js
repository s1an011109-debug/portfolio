(function () {
  "use strict";
  const D = window.PORTFOLIO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 편집 모드(editor.js)와 공유하는 객체 */
  const PF = window.PF = { editing: false, blobs: {}, onRender: null };

  /* ⟪…⟫ 는 아직 채우지 않은 자리 → 형광펜으로 표시 */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (s) => esc(s).replace(/⟪(.*?)⟫/g, (_, t) => `<mark class="todo">${t || "채울 내용"}</mark>`);
  const plain = (s) => String(s ?? "").replace(/[⟪⟫]/g, "");
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), D);
  const show = (path) => fmt(get(path));
  const E = (path) => `data-path="${path}"`;
  const tags = (path) => `<span class="tags-wrap" data-list="${path}">${(get(path) || []).map((t, i) => `<span class="tag" ${E(`${path}.${i}`)}>${fmt(t)}</span>`).join("")}</span>`;
  const href = (path) => `href="${esc(PF.blobs[get(path)] || get(path) || "#")}" data-href="${path}"`;
  Object.assign(PF, { get, fmt, plain, esc });

  /* ---------- 미디어 (영상 / 이미지 / 슬라이드 / 자리표시) ---------- */
  const mediaIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => setPlaying(e.target, e.isIntersecting && e.intersectionRatio >= 0.35));
  }, { threshold: [0, 0.35, 0.7] });
  const src = (s) => esc(PF.blobs[s] || s);

  function makeMedia(m, label, path) {
    const box = document.createElement("div");
    box.className = "media";
    if (path) box.dataset.mediaPath = path;
    if (!m || !m.src || (Array.isArray(m.src) && !m.src.length)) {
      box.classList.add("ph", "paused");
      box.innerHTML = `<span>${esc(label || "영상 · 이미지 자리")}</span>`;
    } else if (m.type === "video") {
      const v = document.createElement("video");
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
      v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
      if (m.poster) v.poster = PF.blobs[m.poster] || m.poster;
      v.dataset.src = PF.blobs[m.src] || m.src;
      box.appendChild(v);
    } else if (m.type === "images") {
      box.classList.add("slides");
      box.innerHTML = m.src.map((s, i) => `<img src="${src(s)}" alt="" loading="lazy" class="${i ? "" : "on"}">`).join("");
    } else {
      box.innerHTML = `<img src="${src(m.src)}" alt="" loading="lazy">`;
    }
    mediaIO.observe(box);
    return box;
  }
  PF.makeMedia = makeMedia;

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

  /* 글 · 그림 블록 (프로젝트 상세, 자유 섹션) */
  function blocks(path) {
    const list = get(path) || [];
    return `<div class="blocks" data-list="${path}">${list.map((b, i) => {
      const p = `${path}.${i}`;
      if (b.type === "h") return `<div class="b-txt" data-item="${p}"><h3 class="b-h" ${E(p + ".text")}>${fmt(b.text)}</h3></div>`;
      if (b.type === "p") return `<div class="b-txt" data-item="${p}"><p class="b-p" ${E(p + ".text")}>${fmt(b.text)}</p></div>`;
      return `<figure class="b-fig ${b.wide ? "wide" : ""}" data-item="${p}"><div class="b-media" data-slot="${p}.media"></div>
        ${b.caption || PF.editing ? `<figcaption ${E(p + ".caption")}>${fmt(b.caption)}</figcaption>` : ""}</figure>`;
    }).join("")}</div>`;
  }
  const fillSlots = (root) => $$("[data-slot]", root).forEach((s) => s.appendChild(makeMedia(get(s.dataset.slot), "그림 · 영상 자리", s.dataset.slot)));

  /* ---------- 화면 그리기 (편집 후 다시 호출됨) ---------- */
  function render() {
    $$("[data-bind]").forEach((el) => { el.dataset.path = "meta." + el.dataset.bind; el.innerHTML = show(el.dataset.path); });
    document.title = `${plain(D.meta.name)} — ${plain(D.meta.role)} Portfolio`;
    const art = $("#heroArt");
    art.dataset.cover = "meta.heroImage";
    art.innerHTML = D.meta.heroImage ? `<img src="${src(D.meta.heroImage)}" alt="" fetchpriority="high" decoding="async">` : "";
    document.body.classList.toggle("has-art", !!D.meta.heroImage);
    applyLayout();
    $("#headline").dataset.list = "meta.headline";
    $("#headline").innerHTML = D.meta.headline.map((l, i) =>
      `<span class="line"><span style="animation-delay:${0.1 + i * 0.12}s" ${E("meta.headline." + i)} data-em>${fmt(l).replace(/\*(.+?)\*/g, "<em>$1</em>")}</span></span>`).join("");
    $("#keywords").dataset.list = "meta.keywords";
    $("#keywords").innerHTML = D.meta.keywords.map((k, i) => `<li ${E("meta.keywords." + i)}>${fmt(k)}</li>`).join("");
    $("#footLinks").dataset.list = "meta.links";
    $("#footLinks").innerHTML = D.meta.links.map((l, i) => `<li data-item="meta.links.${i}"><a ${href(`meta.links.${i}.url`)} target="_blank" rel="noopener"><span ${E(`meta.links.${i}.label`)}>${fmt(l.label)}</span> ↗</a></li>`).join("");

    /* ★ 켠 프로젝트 = 첫 화면 슬라이드 */
    const featured = D.works.map((w, j) => [w, j]).filter(([w]) => w.featured);

    /* 첫 화면 대표 프로젝트 슬라이드 (★ 대표작이 순서대로) */
    const sc = $("#showcase");
    if (scIndex >= featured.length) scIndex = 0;
    sc.innerHTML = featured.length ? `
      <div class="sc-stage">${featured.map(([w, j], i) => `
        <div class="sc-slide ${i === scIndex ? "on" : ""}" role="link" tabindex="${i === scIndex ? 0 : -1}" aria-label="${esc(plain(w.title))} 자세히 보기" data-work="${j}" data-slot="works.${j}.media"></div>`).join("")}
        <span class="sc-go mono">자세히 보기 ↗</span>
      </div>
      <div class="sc-cap">
        ${featured.map(([w, j], i) => `
          <div class="sc-text ${i === scIndex ? "on" : ""}" data-work="${j}">
            <p class="sc-meta mono"><span ${E(`works.${j}.period`)}>${fmt(w.period)}</span> · <span ${E(`works.${j}.role`)}>${fmt(w.role)}</span></p>
            <h2 class="sc-title" ${E(`works.${j}.title`)}>${fmt(w.title)}</h2>
            <p class="sc-one" ${E(`works.${j}.oneLine`)}>${fmt(w.oneLine)}</p>
          </div>`).join("")}
        <div class="sc-dots" role="tablist">${featured.map(([w], i) => `<button type="button" role="tab" aria-selected="${i === scIndex}" aria-label="${i + 1}번째: ${esc(plain(w.title))}" data-sc="${i}"><i></i></button>`).join("")}</div>
      </div>` : `<div class="sc-empty">프로젝트 카드의 ★을 켜면 여기에 슬라이드로 나옵니다.</div>`;
    $$(".sc-slide", sc).forEach((s) => s.appendChild(makeMedia(get(s.dataset.slot), plain(D.works[+s.dataset.work].title), s.dataset.slot)));
    restartSlides();

    /* 포트폴리오 파일 */
    $("#filesStack").innerHTML = fileKinds.map(([k, name, en]) => {
      const f = D.files[k], p = `files.${k}`;
      const sheet = f.cover
        ? `<span class="file-sheet" data-cover="${p}.cover"><img src="${src(f.cover)}" alt=""></span>`
        : `<span class="file-sheet" data-cover="${p}.cover"><i class="l big"></i><i class="l w80"></i><i class="l w60"></i><i class="blk"></i><i class="l w40"></i></span>`;
      return `
        <div class="file is-${k} reveal">
          <span class="file-tab mono">${en} · <span ${E(p + ".pages")}>${fmt(f.pages)}</span>p</span>
          <a class="file-pdf mono" ${href(p + ".pdf")} target="_blank" rel="noopener">PDF ↓</a>
          <a class="file-body" ${href(p + ".url")} target="_blank" rel="noopener">
            <span class="file-hook" ${E(p + ".hook")}>${fmt(f.hook)}</span>
            <span class="file-sheets"><span class="file-sheet"></span><span class="file-sheet"></span>${sheet}</span>
            <span class="file-info">
              <h3>${name} <span class="mono"><span ${E(p + ".readTime")}>${fmt(f.readTime)}</span> ↗</span></h3>
              <p ${E(p + ".teaser")}>${fmt(f.teaser)}</p>
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

    /* 프로젝트 카드 */
    $("#projectCards").dataset.list = "works";
    $("#projectCards").innerHTML = D.works.map((w, j) => `
      <div class="card reveal" role="button" tabindex="0" data-work="${j}" data-item="works.${j}">
        <div class="card-media" data-slot="works.${j}.media"><span class="card-status" ${E(`works.${j}.status`)}>${fmt(w.status)}</span><span class="card-play mono">PLAYING</span></div>
        <div class="card-body">
          <div class="card-top mono"><span ${E(`works.${j}.period`)}>${fmt(w.period)}</span><span ${E(`works.${j}.team`)}>${fmt(w.team)}</span></div>
          <h3 ${E(`works.${j}.title`)}>${fmt(w.title)}</h3>
          <p class="one" ${E(`works.${j}.oneLine`)}>${fmt(w.oneLine)}</p>
          <div class="tags">${tags(`works.${j}.tags`)}</div>
          <span class="card-more">자세히 보기 →</span>
        </div>
      </div>`).join("");
    $$("#projectCards .card").forEach((c) => {
      const j = +c.dataset.work;
      $(".card-media", c).prepend(makeMedia(D.works[j].media, plain(D.works[j].title), `works.${j}.media`));
    });

    /* 게임 로그 */
    $("#logCards").dataset.list = "gameLogs";
    $("#logCards").innerHTML = D.gameLogs.map((g, i) => `
      <article class="card reveal" data-genre="${esc(plain(g.genre))}" data-item="gameLogs.${i}">
        <div class="card-media" data-slot="gameLogs.${i}.media"><span class="card-status" ${E(`gameLogs.${i}.platform`)}>${fmt(g.platform)}</span><span class="card-play mono">PLAYING</span></div>
        <div class="card-body">
          <div class="card-top mono"><span ${E(`gameLogs.${i}.genre`)}>${fmt(g.genre)}</span><span ${E(`gameLogs.${i}.period`)}>${fmt(g.period)}</span></div>
          <h3 ${E(`gameLogs.${i}.title`)}>${fmt(g.title)}</h3>
          <dl class="log-stats">${(g.stats || []).slice(0, 2).map((s, k) => `<div><dt ${E(`gameLogs.${i}.stats.${k}.label`)}>${fmt(s.label)}</dt><dd ${E(`gameLogs.${i}.stats.${k}.value`)}>${fmt(s.value)}</dd></div>`).join("")}</dl>
          <p class="log-insight" ${E(`gameLogs.${i}.insight`)}>${fmt(g.insight)}</p>
          <div class="tags">${tags(`gameLogs.${i}.tags`)}</div>
        </div>
      </article>`).join("");
    $$("#logCards .card").forEach((c, i) => $(".card-media", c).prepend(makeMedia(D.gameLogs[i].media, plain(D.gameLogs[i].title), `gameLogs.${i}.media`)));

    const genres = ["전체", ...new Set(D.gameLogs.map((g) => plain(g.genre)))];
    $("#logFilter").innerHTML = genres.map((g, i) => `<button type="button" aria-pressed="${i === 0}">${esc(g)}</button>`).join("");

    /* 자유 섹션 */
    D.sections = D.sections || [];
    $("#customSections").dataset.list = "sections";
    $("#customSections").innerHTML = D.sections.map((s, i) => `
      <section class="sec shell" id="sec-${i}" data-item="sections.${i}">
        <div class="sec-head reveal">
          <span class="sec-idx mono" ${E(`sections.${i}.idx`)}>${fmt(s.idx)}</span>
          <h2 ${E(`sections.${i}.title`)}>${fmt(s.title)}</h2>
          ${s.sub || PF.editing ? `<p class="sec-sub" ${E(`sections.${i}.sub`)}>${fmt(s.sub)}</p>` : ""}
        </div>
        ${blocks(`sections.${i}.blocks`)}
      </section>`).join("");
    fillSlots($("#customSections"));

    /* 이력 */
    $("#resumeList").dataset.list = "resume";
    $("#resumeList").innerHTML = D.resume.map((g, gi) => `
      <div class="resume-group reveal" data-item="resume.${gi}">
        <h3 ${E(`resume.${gi}.group`)}>${fmt(g.group)}</h3>
        <ol data-list="resume.${gi}.items">${g.items.map((it, i) => { const p = `resume.${gi}.items.${i}`; return `
          <li class="resume-item" data-item="${p}">
            <span class="mono" ${E(p + ".period")}>${fmt(it.period)}</span>
            <div><b ${E(p + ".title")}>${fmt(it.title)}</b>${it.badge || PF.editing ? `<span class="badge" ${E(p + ".badge")}>${fmt(it.badge)}</span>` : ""}<p ${E(p + ".desc")}>${fmt(it.desc)}</p></div>
          </li>`; }).join("")}</ol>
      </div>`).join("");

    observeReveals();
    if (modal.open && current != null) openWork(current, true);
    else if (PF.onRender) PF.onRender();
  }
  PF.render = render;

  const fileKinds = [["summary", "요약 포트폴리오", "SUMMARY"], ["detail", "상세 포트폴리오", "DETAIL"]];

  /* 첫 화면 배치 (편집 모드에서 끌어서 정한 위치 · 크기). PC 화면(1025px 이상)에만 적용 */
  const MOVABLE = { name: ".hero-name", showcase: "#showcase", note: ".hero-note", art: "#heroArt" };
  function applyLayout() {
    const L = D.layout || {};
    for (const [key, sel] of Object.entries(MOVABLE)) {
      const el = $(sel), v = L[key] || {};
      if (!el) continue;
      el.dataset.move = key;
      const css = key === "art"
        ? { "--ax": v.x ? v.x + "%" : "", "--ay": v.y ? v.y + "%" : "", "--az": v.z || "" }
        : { "--dx": v.x ? v.x + "vw" : "", "--dy": v.y ? v.y + "vw" : "", "--w": v.w ? v.w + "%" : "", "--s": v.s || "" };
      for (const [k, val] of Object.entries(css)) val === "" ? el.style.removeProperty(k) : el.style.setProperty(k, val);
    }
  }
  PF.applyLayout = applyLayout;

  /* 슬라이드 넘기기: meta.slideSeconds 초마다, 마우스를 올리면 멈춤 */
  let scIndex = 0, scTimer = 0, scHold = false;
  function goSlide(i) {
    const sc = $("#showcase"), slides = $$(".sc-slide", sc), texts = $$(".sc-text", sc), dots = $$(".sc-dots button", sc);
    if (!slides.length) return;
    scIndex = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle("on", k === scIndex); s.tabIndex = k === scIndex ? 0 : -1; });
    texts.forEach((t, k) => t.classList.toggle("on", k === scIndex));
    dots.forEach((d, k) => d.setAttribute("aria-selected", k === scIndex));
  }
  function restartSlides() {
    clearInterval(scTimer);
    const sec = Math.max(2, +D.meta.slideSeconds || 5);
    $("#showcase").style.setProperty("--sc-sec", sec + "s");
    if (reduceMotion || $$(".sc-slide").length < 2) return;
    scTimer = setInterval(() => { if (!scHold && !PF.editing && !document.hidden) goSlide(scIndex + 1); }, sec * 1000);
  }
  const scEl = $("#showcase");
  scEl.addEventListener("mouseenter", () => { scHold = true; scEl.classList.add("hold"); });
  scEl.addEventListener("mouseleave", () => { scHold = false; scEl.classList.remove("hold"); });
  scEl.addEventListener("focusin", () => { scHold = true; scEl.classList.add("hold"); });
  scEl.addEventListener("focusout", () => { scHold = false; scEl.classList.remove("hold"); });
  scEl.addEventListener("click", (e) => {
    const d = e.target.closest("[data-sc]");
    if (d) { e.stopPropagation(); goSlide(+d.dataset.sc); restartSlides(); }
  });
  let tx0 = null;
  scEl.addEventListener("touchstart", (e) => { tx0 = e.touches[0].clientX; }, { passive: true });
  scEl.addEventListener("touchend", (e) => {
    if (tx0 == null) return;
    const dx = e.changedTouches[0].clientX - tx0; tx0 = null;
    if (Math.abs(dx) > 40) { goSlide(scIndex + (dx < 0 ? 1 : -1)); restartSlides(); }
  });

  /* 대표작 · 카드 클릭 → 상세 */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-work]");
    if (t) openWork(+t.dataset.work);
  });
  document.addEventListener("keydown", (e) => {
    const t = e.target.closest && e.target.closest("[data-work]");
    if (t && e.target === t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openWork(+t.dataset.work); }
  });

  $("#logFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#logFilter button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    $$("#logCards .card").forEach((c) => c.classList.toggle("hide", b.textContent !== "전체" && c.dataset.genre !== b.textContent));
  });

  /* ---------- 상세 모달 ---------- */
  const modal = $("#modal");
  let current = null;
  function openWork(j, keepScroll) {
    const w = D.works[j], p = `works.${j}`;
    if (!w) return modal.close();
    current = j;
    w.blocks = w.blocks || [];
    const st = modal.scrollTop;
    const facts = [["역할", "role"], ["기간", "period"], ["구성", "team"], ["상태", "status"]];
    $("#modalBody").innerHTML = `
      <div class="modal-media" data-slot="${p}.media"></div>
      <div class="modal-text">
        <div><p class="mono" style="color:var(--ink-3)" ${E(p + ".genre")}>${fmt(w.genre)}</p><h2 id="modalTitle" ${E(p + ".title")}>${fmt(w.title)}</h2></div>
        <dl class="modal-facts">${facts.map(([k, f]) => `<div><dt>${k}</dt><dd ${E(`${p}.${f}`)}>${fmt(w[f])}</dd></div>`).join("")}</dl>
        <dl class="modal-steps">
          <div><dt>PROBLEM</dt><dd ${E(p + ".problem")}>${fmt(w.problem)}</dd></div>
          <div><dt>APPROACH</dt><dd ${E(p + ".approach")}>${fmt(w.approach)}</dd></div>
          <div><dt>RESULT</dt><dd ${E(p + ".result")}>${fmt(w.result)}</dd></div>
        </dl>
        <div><h4>주요 업무</h4><ul class="tasks" data-list="${p}.tasks">${(w.tasks || []).map((t, i) => `<li ${E(`${p}.tasks.${i}`)}>${fmt(t)}</li>`).join("")}</ul></div>
        ${w.blocks.length || PF.editing ? `<div class="modal-blocks"><h4>자세한 이야기</h4>${blocks(p + ".blocks")}</div>` : ""}
        ${(w.links && w.links.length) || PF.editing ? `<div class="modal-links" data-list="${p}.links">${(w.links || []).map((l, i) => `<a data-item="${p}.links.${i}" ${href(`${p}.links.${i}.url`)} target="_blank" rel="noopener"><span ${E(`${p}.links.${i}.label`)}>${fmt(l.label)}</span> ↗</a>`).join("")}</div>` : ""}
      </div>`;
    fillSlots(modal);
    if (!modal.open) modal.showModal();
    modal.scrollTop = keepScroll ? st : 0;
    if (!keepScroll) $(".modal-close").focus({ preventScroll: true });
    if (PF.onRender) PF.onRender();
  }
  PF.openWork = openWork;
  $(".modal-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  modal.addEventListener("close", () => { current = null; $$("video", modal).forEach((v) => v.pause()); });

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
    dock.classList.toggle("on", past && !filesVisible && !PF.editing);
    if (!dock.classList.contains("on")) setDock(false);
    $(".top").classList.toggle("scrolled", window.scrollY > 10);
    // 월페이퍼: 스크롤하면 살짝 느리게 따라옴
    const art = $("#heroArt");
    if (!reduceMotion && art && window.scrollY < window.innerHeight * 1.2) art.style.setProperty("--py", `${window.scrollY * 0.12}px`);
  }
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------- 등장 애니메이션 / 숫자 카운트 / 메뉴 활성화 ---------- */
  const revIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    revIO.unobserve(e.target);
    const n = $("[data-count]", e.target);
    if (n) countUp(n);
  }), { threshold: 0.15 });
  function observeReveals() {
    $$(".reveal:not(.in)").forEach((el, i) => {
      if (PF.editing) return el.classList.add("in");
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      revIO.observe(el);
    });
  }

  function countUp(el) {
    const m = el.textContent.match(/^([^\d]*)([\d,.]+)$/);
    if (!m || reduceMotion || PF.editing) return;
    const target = parseFloat(m[2].replace(/,/g, "")), dec = (m[2].split(".")[1] || "").length, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1200), v = target * (1 - Math.pow(1 - p, 3));
      if (document.activeElement !== el) el.textContent = m[1] + v.toLocaleString("ko-KR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
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
  PF.toast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("on"), 2200);
  };
  $(".copy-mail").addEventListener("click", async () => {
    if (PF.editing) return;
    try { await navigator.clipboard.writeText(plain(D.meta.email)); PF.toast("이메일을 복사했어요"); }
    catch (e) { PF.toast(plain(D.meta.email)); }
  });

  render();
  onScroll();
})();

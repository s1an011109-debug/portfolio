/* ==========================================================================
   편집 모드
   - 글자를 눌러 바로 고치고, 그림·영상은 자리에 끌어다 놓습니다.
   - [저장]을 누르면 content.js 와 assets/ 폴더에 바로 써집니다 (Chrome · Edge).
   ========================================================================== */
(function () {
  "use strict";
  const PF = window.PF, D = window.PORTFOLIO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const keys = (p) => p.split(".");
  const parentPath = (p) => keys(p).slice(0, -1).join(".");
  const lastKey = (p) => keys(p).slice(-1)[0];
  const set = (path, v) => { PF.get(parentPath(path))[lastKey(path)] = v; };
  const isIndex = (k) => /^\d+$/.test(k);

  /* 공개 사이트(사용자.github.io/저장소)에서 열었으면 그 저장소에 바로 저장 */
  const IS_LOCAL = location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const GH = (() => {
    const m = location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
    if (!m) return null;
    const repo = location.pathname.split("/").filter(Boolean)[0];
    return { owner: m[1], repo: repo && !/\.html?$/.test(repo) ? repo : `${m[1]}.github.io`, branch: "main" };
  })();
  const ghToken = () => { try { return localStorage.getItem("pf-gh-token") || ""; } catch (e) { return ""; } };

  /* ---------- 작은 IndexedDB 저장소 (폴더 권한 · 저장 전 그림) ---------- */
  const idb = (store, mode, fn) => new Promise((ok, no) => {
    const req = indexedDB.open("pf-editor", 1);
    req.onupgradeneeded = () => { req.result.createObjectStore("files"); req.result.createObjectStore("handles"); };
    req.onerror = () => no(req.error);
    req.onsuccess = () => {
      const tx = req.result.transaction(store, mode), r = fn(tx.objectStore(store));
      tx.oncomplete = () => ok(r && r.result); tx.onerror = () => no(tx.error);
    };
  });
  const idbGet = (s, k) => idb(s, "readonly", (o) => o.get(k)).catch(() => null);
  const idbPut = (s, k, v) => idb(s, "readwrite", (o) => o.put(v, k)).catch(() => {});
  const idbClear = (s) => idb(s, "readwrite", (o) => o.clear()).catch(() => {});
  const idbAll = (s) => new Promise((ok) => {
    const out = [];
    idb(s, "readonly", (o) => { const c = o.openCursor(); c.onsuccess = () => { const x = c.result; if (x) { out.push([x.key, x.value]); x.continue(); } }; return null; })
      .then(() => ok(out)).catch(() => ok(out));
  });

  /* ---------- 상태 ---------- */
  const pending = new Map();          // "assets/xxx.jpg" → File (아직 폴더에 안 쓴 그림)
  const history = [];
  let dirty = false;
  const snapshot = () => { history.push(JSON.stringify(D)); if (history.length > 80) history.shift(); };
  const replaceData = (obj) => { Object.keys(D).forEach((k) => delete D[k]); Object.assign(D, obj); };
  let draftT;
  function changed() {
    dirty = true;
    updateBar();
    clearTimeout(draftT);
    draftT = setTimeout(() => { try { localStorage.setItem("pf-draft", JSON.stringify({ at: Date.now(), data: D })); } catch (e) {} }, 300);
  }
  addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- 도구 막대 ---------- */
  const bar = document.createElement("div");
  bar.className = "ed-bar";
  bar.innerHTML = `
    <button type="button" class="ed-toggle" data-act="toggle"><span class="ed-dot"></span><b>편집</b></button>
    <span class="ed-tools">
      <button type="button" data-act="undo" title="되돌리기 (Ctrl+Z)">↶</button>
      <button type="button" data-act="save" class="ed-save">저장</button>
      <button type="button" data-act="gh" class="ed-gh-btn" title="GitHub 연결" hidden>GitHub</button>
      <button type="button" data-act="help" title="사용법">?</button>
    </span>
    <span class="ed-status mono"></span>
    <div class="ed-help" hidden>
      <b>이렇게 쓰세요</b>
      <ul>
        <li><b>글자</b>: 아무 글자나 눌러서 고치기. Enter로 끝내기, Shift+Enter로 줄바꿈</li>
        <li><b>강조</b>: 메인 문구에서 <code>*단어*</code>처럼 별표로 감싸면 주황색</li>
        <li><b>그림·영상</b>: 사진·mp4를 자리 위로 끌어다 놓기 (또는 자리를 클릭해 고르기, 복사한 그림은 자리에 마우스를 올리고 Ctrl+V)</li>
        <li><b>여러 장</b>을 한 번에 놓으면 자동 슬라이드</li>
        <li><b>추가 · 삭제 · 순서</b>: 항목 위에 마우스를 올리면 ↑ ↓ ✕, 목록 끝의 + 버튼</li>
        <li><b>★</b>: 프로젝트 카드의 별을 켜면 첫 화면 슬라이드에 나옴</li>
        <li><b>첫 화면 배치</b> (PC 화면): 파란 ✥를 끌어 옮기기, ◢를 끌어 크기 조절, 일러스트는 그림을 끌어 옮기고 오른쪽 위 '크기'로 확대. ✥를 두 번 누르면 처음 자리로</li>
        <li><b>상세 내용</b>: 프로젝트 카드의 '자세히 보기' → '+ 블록 추가'로 큰 제목 · 소제목 · 글 · 라벨 글 · 목록 · 그림(여러 장=갤러리) · YouTube · 표 · 접기 · 강조 상자 · 링크 버튼 · 구분선</li>
        <li><b>글 꾸미기</b>: <code>**굵게**</code>, <code>&#96;코드&#96;</code>, <code>[글자](주소)</code></li>
        <li><b>상세 표 · PROBLEM 같은 라벨</b>: 라벨 글자도 눌러서 바꾸고, + 추가로 늘리기</li>
        <li><b>유튜브</b>: 그림 자리의 ▶ YouTube 버튼에 주소 붙여 넣기</li>
        <li><b>링크</b>: 🔗 버튼으로 주소 입력, PDF는 링크 위로 끌어다 놓기</li>
        <li><b>저장</b>: 공개 링크(…github.io/portfolio/?edit)에서는 GitHub에 바로 올라가고 1~2분 뒤 반영 (처음 한 번 토큰 연결). 내 컴퓨터(편집하기.cmd)에서는 portfolio 폴더에 저장</li>
      </ul>
    </div>`;
  document.body.appendChild(bar);
  const status = $(".ed-status", bar);
  function updateBar() {
    bar.classList.toggle("on", PF.editing);
    $(".ed-toggle b", bar).textContent = PF.editing ? "편집 중" : "편집";
    $(".ed-save", bar).classList.toggle("dirty", dirty);
    status.textContent = dirty ? `저장 안 됨${pending.size ? ` · 그림 ${pending.size}개` : ""}` : (PF.editing ? "저장됨" : "");
    const ghb = $(".ed-gh-btn", bar);
    ghb.hidden = !GH;
    ghb.classList.toggle("linked", !!ghToken());
    ghb.textContent = ghToken() ? "GitHub ✓" : "GitHub 연결";
  }

  const fileInput = document.createElement("input");
  fileInput.type = "file"; fileInput.accept = "image/*,video/*"; fileInput.multiple = true; fileInput.hidden = true;
  document.body.appendChild(fileInput);
  let pickTarget = null;
  fileInput.addEventListener("change", () => { if (pickTarget) applyFiles(pickTarget, [...fileInput.files]); fileInput.value = ""; });

  function setEditing(on) {
    PF.editing = on;
    document.body.classList.toggle("editing", on);
    try { sessionStorage.setItem("pf-editing", on ? "1" : ""); } catch (e) {}
    if (!on) $$("[data-path]").forEach((el) => { el.removeAttribute("contenteditable"); });
    PF.render();
    updateBar();
    dispatchEvent(new Event("scroll"));
  }

  /* ---------- 렌더 후 편집 장치 붙이기 ---------- */
  const LABEL = { title: "제목", genre: "장르", role: "역할", period: "기간", team: "구성", status: "상태", oneLine: "한 줄 소개", problem: "문제", approach: "접근", result: "결과", insight: "인사이트 한 줄", platform: "플랫폼", label: "이름", value: "값", unit: "단위", sub: "설명", badge: "배지", desc: "설명", group: "그룹 이름", text: "글을 입력하세요", caption: "그림 설명 (비우면 숨김)", idx: "섹션 라벨", hook: "한마디", teaser: "설명", readTime: "읽는 시간", pages: "쪽수" };
  const ph = (path) => LABEL[lastKey(path)] || "입력";
  Object.assign(LABEL, { lead: "리드 문장 (제목 아래 한두 줄)", kind: "종류 (예: 프로젝트)", summary: "접기 제목", tasksTitle: "목록 제목", blocksTitle: "블록 제목" });
  const BLOCK_KINDS = [["h2", "큰 제목"], ["h", "소제목"], ["p", "글"], ["lp", "라벨 글 (문제: …)"], ["ul", "목록"], ["img", "그림 · 영상 (여러 장=갤러리)"], ["yt", "YouTube"], ["table", "표"], ["fold", "접기 (코드 보기 등)"], ["quote", "강조 상자"], ["btn", "링크 버튼"], ["hr", "구분선"]];

  function decorate() {
    if (!PF.editing) return;
    decorateLayout();
    $$("[data-path]").forEach((el) => {
      if (el.isContentEditable) return;
      try { el.contentEditable = "plaintext-only"; } catch (e) { el.contentEditable = "true"; }
      el.spellcheck = false;
      if (!el.dataset.ph) el.dataset.ph = ph(el.dataset.path);
    });
    $$("[data-item]").forEach((el) => {
      if (el.querySelector(":scope > .ed-ctl")) return;
      const p = el.dataset.item, c = document.createElement("span");
      c.className = "ed-ctl";
      c.contentEditable = "false";
      const isWork = /^works\.\d+$/.test(p), it = PF.get(p) || {}, isFig = el.classList.contains("b-fig") && it.type !== "yt";
      const extra =
        (it.type === "table" ? `<button type="button" data-ed="row+" data-p="${p}" title="줄 추가">+줄</button><button type="button" data-ed="col+" data-p="${p}" title="칸 추가">+칸</button><button type="button" data-ed="row-" data-p="${p}" title="마지막 줄 삭제">−줄</button><button type="button" data-ed="col-" data-p="${p}" title="마지막 칸 삭제">−칸</button><button type="button" data-ed="head" data-p="${p}" title="첫 줄을 제목 줄로">${it.head ? "제목줄✓" : "제목줄"}</button>` : "") +
        (it.type === "fold" ? `<button type="button" data-ed="code" data-p="${p}" title="코드 모양으로">${it.code ? "&lt;/&gt;✓" : "&lt;/&gt;"}</button>` : "");
      c.innerHTML = extra +
        (isWork ? `<button type="button" data-ed="star" data-p="${p}" class="${PF.get(p).featured ? "on" : ""}" title="첫 화면 슬라이드에 넣기">★</button>` : "") +
        (isFig ? `<button type="button" data-ed="wide" data-p="${p}" title="넓게 / 반쪽">${PF.get(p).wide ? "▭" : "◫"}</button>` : "") +
        `<button type="button" data-ed="up" data-p="${p}" title="앞으로">↑</button><button type="button" data-ed="down" data-p="${p}" title="뒤로">↓</button><button type="button" data-ed="del" data-p="${p}" title="삭제">✕</button>`;
      el.appendChild(c);
    });
    $$("[data-list]").forEach((el) => {
      if (el.querySelector(":scope > .ed-add-wrap")) return;
      const p = el.dataset.list;
      if (p === "meta.headline") return; // 메인 문구는 Enter로 줄 추가
      const add = (kind, text) => `<button type="button" class="ed-add" contenteditable="false" data-ed="add" data-p="${p}" data-kind="${kind}">${text}</button>`;
      let html;
      if (/\.blocks$/.test(p)) html = `<button type="button" class="ed-add ed-add-menu" data-ed="menu">+ 블록 추가</button><span class="ed-kinds">${BLOCK_KINDS.map(([k, n]) => add(k, n)).join("")}</span>`;
      else if (p === "sections") html = add("", "+ 새 섹션 추가 (글 · 그림 자유롭게)");
      else if (isStrList(p)) html = add("", "+");
      else html = add("", "+ 추가");
      const wrap = document.createElement(el.tagName === "OL" || el.tagName === "UL" ? "li" : "span");
      wrap.className = "ed-add-wrap";
      wrap.contentEditable = "false";
      wrap.innerHTML = html;
      el.appendChild(wrap);
    });
    $$("[data-media-path], [data-cover]").forEach((el) => {
      const slot = el.closest("[data-slot]") || el;
      if (slot.querySelector(":scope > .ed-drop")) return;
      const p = el.dataset.mediaPath || el.dataset.cover, has = !!PF.get(p);
      const o = document.createElement("span");
      o.className = "ed-drop";
      o.dataset.drop = p;
      o.innerHTML = `<span>${has ? "끌어다 놓아 바꾸기" : "사진 · 영상을 끌어다 놓기<br><small>또는 클릭해서 고르기</small>"}</span>${has ? `<button type="button" data-ed="clear" data-p="${p}" title="그림 빼기">✕</button>` : ""}${/cover|heroImage/.test(p) ? "" : `<button type="button" class="ed-yt-btn" data-ed="ytmedia" data-p="${p}" title="유튜브 영상으로">▶ YouTube</button>`}`;
      slot.appendChild(o);
    });
    $$("[data-href]").forEach((el) => {
      if (el.querySelector(":scope > .ed-link")) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "ed-link"; b.contentEditable = "false";
      b.dataset.ed = "link"; b.dataset.p = el.dataset.href; b.title = "링크 주소 바꾸기";
      b.textContent = "🔗";
      el.appendChild(b);
    });
  }
  /* ---------- 첫 화면 배치: 끌어서 옮기기 · 크기 조절 ---------- */
  function decorateLayout() {
    $$(".hero-in [data-move]").forEach((el) => {
      if (el.querySelector(":scope > .ed-grip")) return;
      el.insertAdjacentHTML("beforeend",
        `<button type="button" class="ed-grip" data-grip="move" contenteditable="false" title="끌어서 옮기기 · 방향키로 미세 조정 · 두 번 누르면 처음 자리로">✥</button>` +
        `<span class="ed-resize" data-grip="size" contenteditable="false" title="끌어서 크기 조절"></span>`);
    });
    const art = $("#heroArt");
    if (art && !art.querySelector(".ed-art-tools")) {
      const z = Math.round(((D.layout || {}).art || {}).z * 100 || 100);
      art.insertAdjacentHTML("beforeend", `
        <span class="ed-art-tools" contenteditable="false">
          <span class="mono">일러스트</span>
          <label title="일러스트 크기">크기 <input type="range" min="40" max="300" step="5" value="${z}" data-art-zoom><b class="mono">${z}%</b></label>
          <button type="button" data-art-reset title="일러스트 위치 · 크기 처음으로">↺</button>
          <button type="button" data-layout-reset title="첫 화면 배치 전부 처음으로">배치 초기화</button>
          <small>그림을 끌어서 옮기기</small>
        </span>`);
    }
  }
  const round = (n) => Math.round(n * 100) / 100;
  const layoutOf = (key) => { D.layout = D.layout || {}; return (D.layout[key] = D.layout[key] || {}); };
  let drag = null;
  document.addEventListener("pointerdown", (e) => {
    if (!PF.editing || e.button !== 0 || innerWidth <= 1024) return;
    const g = e.target.closest("[data-grip]");
    const onArt = !g && e.target.closest("#heroArt") && !e.target.closest(".ed-drop, .ed-art-tools");
    if (!g && !onArt) return;
    const el = g ? g.closest("[data-move]") : $("#heroArt");
    const key = el.dataset.move;
    e.preventDefault();
    drag = { el, key, kind: g ? g.dataset.grip : "pan", x0: e.clientX, y0: e.clientY, v0: { ...layoutOf(key) }, rect: el.getBoundingClientRect(), moved: false, handle: g || el };
    try { drag.handle.setPointerCapture(e.pointerId); } catch (er) {}
    document.body.classList.add("ed-dragging");
  });
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0, { v0, rect, kind } = drag;
    if (!drag.moved) { if (Math.abs(dx) + Math.abs(dy) < 3) return; drag.moved = true; snapshot(); }
    const v = layoutOf(drag.key);
    if (kind === "move") {
      v.x = round((v0.x || 0) + dx / innerWidth * 100);
      v.y = round((v0.y || 0) + dy / innerWidth * 100);
    } else if (kind === "size" && drag.key === "name") {
      v.s = round(Math.min(3, Math.max(0.5, (v0.s || 1) * (rect.width + dx) / rect.width)));
    } else if (kind === "size") {
      const full = rect.width / ((v0.w || 100) / 100);           // 원래 칸 너비
      v.w = round(Math.min(220, Math.max(30, (rect.width + dx) / full * 100)));
    } else if (kind === "pan") {
      v.x = round((v0.x || 0) + dx / rect.width * 100);
      v.y = round((v0.y || 0) + dy / rect.height * 100);
    }
    PF.applyLayout();
  });
  const endDrag = () => {
    if (!drag) return;
    if (drag.moved) changed();
    drag = null;
    document.body.classList.remove("ed-dragging");
  };
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);
  document.addEventListener("dblclick", (e) => {
    const g = PF.editing && e.target.closest('[data-grip="move"]');
    if (!g) return;
    const key = g.closest("[data-move]").dataset.move;
    snapshot(); delete (D.layout || {})[key]; PF.applyLayout(); changed();
    PF.toast("처음 자리로 돌렸어요");
  });
  document.addEventListener("keydown", (e) => {
    const g = PF.editing && e.target.closest && e.target.closest('[data-grip="move"]');
    if (!g || !/^Arrow/.test(e.key)) return;
    e.preventDefault();
    const step = e.shiftKey ? 2 : 0.25, v = layoutOf(g.closest("[data-move]").dataset.move);
    snapshot();
    if (e.key === "ArrowLeft") v.x = round((v.x || 0) - step);
    if (e.key === "ArrowRight") v.x = round((v.x || 0) + step);
    if (e.key === "ArrowUp") v.y = round((v.y || 0) - step);
    if (e.key === "ArrowDown") v.y = round((v.y || 0) + step);
    PF.applyLayout(); changed();
  });
  let zoomSnap = false;
  document.addEventListener("input", (e) => {
    const r = e.target.closest && e.target.closest("[data-art-zoom]");
    if (!r) return;
    if (!zoomSnap) { snapshot(); zoomSnap = true; }
    layoutOf("art").z = +r.value / 100;
    r.nextElementSibling.textContent = r.value + "%";
    PF.applyLayout();
  });
  document.addEventListener("change", (e) => {
    if (e.target.closest && e.target.closest("[data-art-zoom]")) { zoomSnap = false; changed(); }
  });
  addEventListener("click", (e) => {
    if (!PF.editing) return;
    if (e.target.closest("[data-art-reset]")) {
      e.stopPropagation(); snapshot(); delete (D.layout || {}).art; changed(); PF.render();
    } else if (e.target.closest("[data-layout-reset]")) {
      e.stopPropagation();
      if (!confirm("첫 화면의 이름 · 카드 · 일러스트 배치를 모두 처음으로 돌릴까요?")) return;
      snapshot(); D.layout = {}; changed(); PF.render();
    }
  }, true);

  const isStrList = (p) => { const v = PF.get(p); return Array.isArray(v) && /(tags|keywords|headline|tasks|lines)$/.test(p); };

  /* ---------- 글자 편집 ---------- */
  const display = (el, v) => {
    const h = PF.fmt(v);
    return el.hasAttribute("data-em") ? h.replace(/\*(.+?)\*/g, "<em>$1</em>") : h;
  };
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest && e.target.closest("[data-path]");
    if (!PF.editing || !el || el._open) return;
    const s = String(PF.get(el.dataset.path) ?? "");
    const hintOnly = /^⟪[^⟫]*⟫$/.test(s);
    el._open = true;
    el._orig = s;
    el._shown = hintOnly ? "" : s.replace(/[⟪⟫]/g, "");
    if (hintOnly) el.dataset.ph = s.slice(1, -1) || ph(el.dataset.path);
    el.textContent = el._shown;
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  });
  document.addEventListener("focusout", (e) => {
    const el = e.target.closest && e.target.closest("[data-path]");
    if (!el || !el._open) return;
    el._open = false;
    commit(el);
  });
  function commit(el, txtOverride) {
    const path = el.dataset.path;
    const txt = txtOverride ?? el.innerText.replace(/ /g, " ").replace(/\n+$/, "").trim();
    const emptyListItem = txt === "" && isIndex(lastKey(path)) && isStrList(parentPath(path));
    if (txt === el._shown && !emptyListItem) { el.innerHTML = display(el, el._orig); return false; }
    snapshot();
    if (emptyListItem) {
      PF.get(parentPath(path)).splice(+lastKey(path), 1);
      changed();
      PF.render();
      return true;
    }
    set(path, txt);
    el.innerHTML = display(el, txt);
    changed();
    setTimeout(() => { const a = document.activeElement; if (!(a && a.closest && a.closest("[data-path]"))) PF.render(); }, 0);
    return true;
  }
  document.addEventListener("keydown", (e) => {
    const el = e.target.closest && e.target.closest("[data-path]");
    if (PF.editing && el && el._open) {
      if (e.key === "Escape") { el.textContent = el._shown; el.blur(); return; }
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        const path = el.dataset.path, list = parentPath(path);
        if (isIndex(lastKey(path)) && isStrList(list)) {
          const i = +lastKey(path);
          el._open = false;
          const txt = el.innerText.trim();
          snapshot();
          set(path, txt);
          PF.get(list).splice(i + 1, 0, "");
          changed();
          PF.render();
          focusPath(`${list}.${i + 1}`);
        } else el.blur();
      }
      e.stopPropagation();
      return;
    }
    if (PF.editing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !(document.activeElement && document.activeElement.isContentEditable)) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && PF.editing) { e.preventDefault(); save(); }
  }, true);
  document.addEventListener("paste", (e) => {
    const el = e.target.closest && e.target.closest("[data-path]");
    const files = [...(e.clipboardData && e.clipboardData.files || [])].filter(okFile);
    if (PF.editing && files.length && hovered) { e.preventDefault(); applyFiles(hovered, files); return; }
    if (el && !el.isContentEditable) return;
    if (el && e.clipboardData && el.contentEditable === "true") {
      e.preventDefault();
      document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
    }
  });
  function focusPath(p) {
    requestAnimationFrame(() => { const t = $(`[data-path="${p}"]`); if (t) { t.scrollIntoView({ block: "nearest" }); t.focus(); } });
  }

  /* ---------- 버튼 동작 ---------- */
  const BLOCK_TPL = {
    h2: () => ({ type: "h2", text: "" }),
    h: () => ({ type: "h", text: "" }),
    p: () => ({ type: "p", text: "" }),
    lp: () => ({ type: "lp", label: "문제", text: "" }),
    ul: () => ({ type: "ul", lines: [""] }),
    img: () => ({ type: "img", media: null, caption: "", wide: false }),
    yt: () => ({ type: "yt", url: "", caption: "" }),
    table: () => ({ type: "table", head: true, rows: [["항목", "내용"], ["", ""]] }),
    fold: () => ({ type: "fold", summary: "자세히 보기", text: "", code: false }),
    quote: () => ({ type: "quote", text: "" }),
    btn: () => ({ type: "btn", label: "링크", url: "#" }),
    hr: () => ({ type: "hr" })
  };
  const TPL = (p, kind) => {
    if (/\.blocks$/.test(p)) return (BLOCK_TPL[kind] || BLOCK_TPL.p)();
    if (/steps$/.test(p)) return { label: "POINT", text: "" };
    if (p === "glance") return { value: "0", unit: "", label: "새 성과", sub: "" };
    if (p === "works") return { id: "w" + Date.now().toString(36), featured: false, kind: "프로젝트", title: "새 프로젝트", genre: "", lead: "", role: "", period: "", team: "", status: "", tags: [], oneLine: "", media: null, facts: [], steps: [{ label: "PROBLEM", text: "" }, { label: "APPROACH", text: "" }, { label: "RESULT", text: "" }], tasks: [], links: [], blocks: [] };
    if (p === "gameLogs") return { title: "새 게임", genre: "", platform: "", period: "", stats: [{ label: "기록", value: "" }, { label: "기록", value: "" }], insight: "", tags: [], media: null };
    if (p === "resume") return { group: "새 그룹", items: [] };
    if (/^resume\.\d+\.items$/.test(p)) return { period: "", title: "새 항목", desc: "", badge: "" };
    if (p === "sections") return { idx: "Notes", title: "새 섹션", sub: "", blocks: [{ type: "p", text: "" }] };
    if (/links$/.test(p)) return { label: "링크", url: "#" };
    if (/facts$/.test(p)) return { label: "항목", value: "" };
    return "";
  };
  addEventListener("click", (e) => {
    const tb = e.target.closest(".ed-bar [data-act]");
    if (tb) return barAction(tb.dataset.act);
    if (!PF.editing) return;
    const ctl = e.target.closest("[data-ed]");
    if (ctl) { e.preventDefault(); e.stopPropagation(); return act(ctl); }
    if (e.target.closest("[data-path]")) { e.preventDefault(); e.stopPropagation(); return; }
    const drop = e.target.closest(".ed-drop");
    if (drop) { e.preventDefault(); e.stopPropagation(); pickTarget = drop.dataset.drop; fileInput.click(); return; }
    if (e.target.closest("a[href]") && !e.target.closest(".ed-bar")) e.preventDefault();
  }, true);

  function act(ctl) {
    const p = ctl.dataset.p, kind = ctl.dataset.ed;
    if (kind === "add") {
      const list = PF.get(p);
      snapshot();
      list.push(TPL(p, ctl.dataset.kind));
      changed();
      PF.render();
      const np = `${p}.${list.length - 1}`;
      if (ctl.dataset.kind === "img") { pickTarget = np + ".media"; fileInput.click(); return; }
      if (ctl.dataset.kind === "yt") {
        const v = prompt("유튜브 주소를 붙여 넣어 주세요", "");
        if (v) { set(np + ".url", v.trim()); changed(); PF.render(); }
        return;
      }
      requestAnimationFrame(() => {
        const t = isStrList(p) ? $(`[data-path="${np}"]`) : $(`[data-item="${np}"] [data-path]`) || $(`[data-path^="${np}."]`);
        if (t) { t.scrollIntoView({ block: "center" }); t.focus(); }
      });
      return;
    }
    if (kind === "link") {
      const cur = PF.get(p) || "";
      const v = prompt("링크 주소 (https://… 또는 assets/파일이름)", cur === "#" ? "https://" : cur);
      if (v == null) return;
      snapshot(); set(p, v.trim() || "#"); changed(); PF.render();
      return;
    }
    if (kind === "clear") { snapshot(); set(p, null); changed(); PF.render(); return; }
    if (kind === "menu") { ctl.parentElement.classList.toggle("open"); return; }
    if (kind === "ytmedia") {
      const cur = (PF.get(p) || {}).type === "youtube" ? PF.get(p).src : "";
      const v = prompt("유튜브 주소를 붙여 넣어 주세요 (youtu.be/… 또는 youtube.com/watch?v=…)", cur);
      if (!v) return;
      snapshot(); set(p, { type: "youtube", src: v.trim() }); changed(); PF.render();
      return;
    }
    if (/^(row|col)[+-]$|^head$|^code$/.test(kind)) {
      const b = PF.get(p);
      snapshot();
      if (kind === "row+") b.rows.push(b.rows[0] ? b.rows[0].map(() => "") : [""]);
      if (kind === "row-" && b.rows.length > 1) b.rows.pop();
      if (kind === "col+") b.rows.forEach((r) => r.push(""));
      if (kind === "col-" && b.rows[0] && b.rows[0].length > 1) b.rows.forEach((r) => r.pop());
      if (kind === "head") b.head = !b.head;
      if (kind === "code") b.code = !b.code;
      changed(); PF.render();
      return;
    }
    const list = PF.get(parentPath(p)), i = +lastKey(p), item = list[i];
    if (kind === "star") { snapshot(); item.featured = !item.featured; changed(); PF.render(); return; }
    if (kind === "wide") { snapshot(); item.wide = !item.wide; changed(); PF.render(); return; }
    if (kind === "up" || kind === "down") {
      const j = kind === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= list.length) return;
      snapshot(); [list[i], list[j]] = [list[j], list[i]]; changed(); PF.render();
      return;
    }
    if (kind === "del") {
      const big = typeof item === "object" && item && (item.title || item.group || item.blocks);
      if (big && !confirm(`"${PF.plain(item.title || item.group || "이 항목")}"을(를) 삭제할까요?\n(되돌리기 ↶ 로 복구할 수 있어요)`)) return;
      snapshot(); list.splice(i, 1); changed();
      if (/^works\.\d+$/.test(p) && $("#modal").open) $("#modal").close();
      PF.render();
    }
  }

  function undo() {
    if (!history.length) return PF.toast("더 되돌릴 게 없어요");
    replaceData(JSON.parse(history.pop()));
    changed();
    PF.render();
    PF.toast("되돌렸어요");
  }

  function barAction(a) {
    if (a === "toggle") return setEditing(!PF.editing);
    if (a === "undo") return undo();
    if (a === "save") return save();
    if (a === "help") { const h = $(".ed-help", bar); h.hidden = !h.hidden; }
    if (a === "gh") showTokenPanel(false);
  }

  /* ---------- 그림 · 영상 넣기 ---------- */
  const okFile = (f) => /^(image|video)\//.test(f.type);
  const safeName = (f) => {
    const ext = (f.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "") || (f.type.split("/")[1] || "bin");
    const base = f.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || (f.type.startsWith("video") ? "video" : "img");
    return `assets/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}-${base}.${ext}`;
  };
  function addFile(f) {
    const p = safeName(f);
    pending.set(p, f);
    PF.blobs[p] = URL.createObjectURL(f);
    idbPut("files", p, f);
    if (f.size > 8 * 1024 * 1024) PF.toast(`${f.name}: ${(f.size / 1048576).toFixed(1)}MB예요. 4MB 이하가 사이트가 빨라요`);
    return p;
  }
  function applyFiles(target, files) {
    files = files.filter((f) => okFile(f) || f.type === "application/pdf");
    if (!files.length) return PF.toast("사진(jpg · png · gif · webp)이나 영상(mp4 · webm)을 넣어 주세요");
    snapshot();
    if (/\.blocks$/.test(target)) {
      files.filter(okFile).forEach((f) => PF.get(target).push({ type: "img", media: mediaOf([f]), caption: "", wide: false }));
    } else if (/\.(cover|heroImage)$/.test(target)) {
      set(target, addFile(files.find(okFile) || files[0]));
    } else if (/(url|pdf)$/.test(target)) {
      set(target, addFile(files[0]));
    } else {
      set(target, mediaOf(files.filter(okFile)));
    }
    changed();
    PF.render();
    updateBar();
  }
  function mediaOf(files) {
    const vid = files.find((f) => f.type.startsWith("video/"));
    if (vid) return { type: "video", src: addFile(vid) };
    if (files.length > 1) return { type: "images", src: files.map(addFile) };
    return { type: "image", src: addFile(files[0]) };
  }

  let hovered = null;
  const dropTarget = (el) => {
    if (!el.closest) return null;
    const d = el.closest("[data-slot], [data-media-path], [data-cover]");
    if (d) return d.dataset.slot || d.dataset.mediaPath || d.dataset.cover;
    const h = el.closest("[data-href]");
    if (h) return h.dataset.href;
    const b = el.closest('[data-list$=".blocks"]');
    return b ? b.dataset.list : null;
  };
  document.addEventListener("mouseover", (e) => { if (PF.editing) hovered = dropTarget(e.target); });
  let overEl = null;
  document.addEventListener("dragover", (e) => {
    if (!PF.editing || !e.dataTransfer.types.includes("Files")) return;
    const t = dropTarget(e.target);
    e.preventDefault();
    e.dataTransfer.dropEffect = t ? "copy" : "none";
    const el = t && e.target.closest("[data-slot], [data-media-path], [data-cover], [data-href], [data-list]");
    if (el !== overEl) { overEl && overEl.classList.remove("ed-over"); overEl = el; el && el.classList.add("ed-over"); }
  });
  document.addEventListener("dragleave", (e) => { if (!e.relatedTarget && overEl) { overEl.classList.remove("ed-over"); overEl = null; } });
  document.addEventListener("drop", (e) => {
    if (!PF.editing) return;
    e.preventDefault();
    overEl && overEl.classList.remove("ed-over"); overEl = null;
    const t = dropTarget(e.target);
    if (t) applyFiles(t, [...e.dataTransfer.files]);
    else PF.toast("그림 자리(점선 상자) 위에 놓아 주세요");
  });

  /* ---------- 저장 ---------- */
  const HEADER = `/* ==========================================================================
   포트폴리오 내용 — 편집 모드(주소 끝에 ?edit)에서 고치고 [저장]하면 이 파일이 다시 써집니다.
   직접 고쳐도 됩니다. ⟪ ⟫ 표시는 아직 채우지 않은 자리입니다.
   media: { type: "video" | "image" | "images", src: "assets/…" }
   ========================================================================== */

`;
  const serialize = () => HEADER + "window.PORTFOLIO = " + JSON.stringify(D, null, 2) + ";\n";

  async function writeFile(dir, name, data) {
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(data);
    await w.close();
  }
  /* 1순위: 편집하기.cmd(serve.py)가 띄운 서버에 보내서 저장 → 폴더 고를 필요 없음 */
  const toB64 = (f) => new Promise((ok, no) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] || "");
    r.onerror = () => no(r.error);
    r.readAsDataURL(f);
  });
  async function saveViaServer() {
    if (!/^https?:$/.test(location.protocol)) return null;
    try {
      const ping = await fetch("/__ping", { cache: "no-store" });
      if (!ping.ok) return null;
    } catch (e) { return null; }
    const files = {};
    for (const [p, f] of pending) files[p] = await toB64(f);
    const res = await fetch("/__save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: serialize(), files }) });
    const out = await res.json().catch(() => ({ ok: false, error: `서버 응답 ${res.status}` }));
    if (!out.ok) throw new Error(out.error || "서버가 저장하지 못했어요");
    return out.folder;
  }

  /* 2순위: 브라우저에서 폴더를 골라 직접 쓰기 (Chrome · Edge) */
  async function saveViaPicker() {
    let dir = await idbGet("handles", "dir");
    if (dir && (await dir.queryPermission({ mode: "readwrite" })) !== "granted" && (await dir.requestPermission({ mode: "readwrite" })) !== "granted") dir = null;
    if (!dir) {
      dir = await showDirectoryPicker({ id: "portfolio", mode: "readwrite" });
      try { await dir.getFileHandle("content.js"); }
      catch (e) { throw new Error(`고른 폴더(${dir.name})에 content.js가 없어요. portfolio 폴더를 골라 주세요`); }
      if ((await dir.requestPermission({ mode: "readwrite" })) !== "granted") throw new Error("폴더에 쓰기 허락을 받지 못했어요 (권한 창에서 '수정 허용'을 눌러 주세요)");
      await idbPut("handles", "dir", dir);
    }
    if (pending.size) {
      const assets = await dir.getDirectoryHandle("assets", { create: true });
      for (const [p, f] of pending) await writeFile(assets, p.slice("assets/".length), f);
    }
    await writeFile(dir, "content.js", serialize());
    return dir.name;
  }

  /* 3순위: 파일로 내려받기 */
  function download(name, blob) {
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: name }).click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  function saveViaDownload() {
    download("content.js", new Blob([serialize()], { type: "text/javascript" }));
    for (const [p, f] of pending) download(p.slice("assets/".length), f);
  }

  /* 공개 사이트에서: GitHub API로 content.js + 새 그림을 커밋 하나로 올리기 */
  async function ghApi(path, opts = {}) {
    const res = await fetch(`https://api.github.com/repos/${GH.owner}/${GH.repo}${path}`, {
      method: opts.method || "GET",
      headers: { Authorization: `Bearer ${opts.token || ghToken()}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(opts.body ? { "Content-Type": "application/json" } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).catch(() => { throw new Error("GitHub에 연결하지 못했어요 (인터넷 연결 확인)"); });
    const out = await res.json().catch(() => ({}));
    if (res.ok) return out;
    if (res.status === 401) throw Object.assign(new Error("토큰이 틀렸거나 만료됐어요. [GitHub 연결]에서 토큰을 다시 넣어 주세요"), { badToken: true });
    if (res.status === 403 || res.status === 404) throw Object.assign(new Error(`이 토큰으로는 ${GH.owner}/${GH.repo} 저장소에 쓸 수 없어요. 토큰의 저장소 선택과 'Contents: Read and write' 권한을 확인해 주세요`), { badToken: true });
    if (res.status === 409 || res.status === 422) throw new Error("그사이 GitHub 쪽 내용이 바뀌었어요. 다시 저장해 주세요");
    throw new Error(out.message || `GitHub 오류 ${res.status}`);
  }
  async function saveViaGitHub() {
    const ref = await ghApi(`/git/ref/heads/${GH.branch}`);
    const head = await ghApi(`/git/commits/${ref.object.sha}`);
    const tree = [];
    for (const [p, f] of pending) {
      const blob = await ghApi("/git/blobs", { method: "POST", body: { content: await toB64(f), encoding: "base64" } });
      tree.push({ path: p, mode: "100644", type: "blob", sha: blob.sha });
    }
    tree.push({ path: "content.js", mode: "100644", type: "blob", content: serialize() });
    const newTree = await ghApi("/git/trees", { method: "POST", body: { base_tree: head.tree.sha, tree } });
    const when = new Date().toLocaleString("ko-KR");
    const commit = await ghApi("/git/commits", { method: "POST", body: { message: `사이트에서 편집 (${when})${pending.size ? ` · 그림 ${pending.size}개` : ""}`, tree: newTree.sha, parents: [ref.object.sha] } });
    await ghApi(`/git/refs/heads/${GH.branch}`, { method: "PATCH", body: { sha: commit.sha } });
    try { localStorage.setItem("pf-published", JSON.stringify({ at: Date.now(), sha: commit.sha, data: D })); } catch (e) {}
    return commit.sha.slice(0, 7);
  }

  function showTokenPanel(thenSave) {
    $$(".ed-gh").forEach((b) => b.remove());
    const box = document.createElement("div");
    box.className = "ed-gh";
    const has = !!ghToken();
    const newUrl = `https://github.com/settings/personal-access-tokens/new?name=${encodeURIComponent("portfolio 편집")}&description=${encodeURIComponent("포트폴리오 사이트 편집 모드에서 저장")}&target_name=${GH.owner}&expires_in=365&contents=write`;
    box.innerHTML = `
      <b>GitHub에 바로 저장하기</b>
      <p>저장을 누르면 <span class="mono">${GH.owner}/${GH.repo}</span>에 올라가고, 1~2분 뒤 사이트에 반영돼요. 처음 한 번만 토큰을 넣어 주세요.</p>
      <ol>
        <li><a href="${newUrl}" target="_blank" rel="noopener">토큰 만들기 페이지 열기 ↗</a></li>
        <li><b>Repository access</b> → <b>Only select repositories</b> → <span class="mono">${GH.repo}</span></li>
        <li><b>Permissions</b> → <b>Contents</b>: <b>Read and write</b></li>
        <li><b>Generate token</b> → 나온 <span class="mono">github_pat_…</span>를 복사해 아래에 붙여 넣기</li>
      </ol>
      <input type="password" placeholder="${has ? "연결됨 · 바꾸려면 새 토큰 붙여 넣기" : "github_pat_…"}" autocomplete="off" spellcheck="false">
      <small>토큰은 이 브라우저에만 저장돼요. 공용 컴퓨터라면 다 쓴 뒤 [연결 끊기]를 눌러 주세요.</small>
      <div>
        <button type="button" data-g="ok">${thenSave ? "연결하고 저장" : "연결"}</button>
        ${has ? `<button type="button" data-g="forget">연결 끊기</button>` : ""}
        <button type="button" data-g="close">닫기</button>
      </div>
      <p class="ed-gh-msg" hidden></p>`;
    document.body.appendChild(box);
    const input = $("input", box), msg = $(".ed-gh-msg", box);
    const say = (t) => { msg.hidden = false; msg.textContent = t; };
    input.focus();
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") $('[data-g="ok"]', box).click(); e.stopPropagation(); });
    box.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-g]"); if (!b) return;
      const k = b.dataset.g;
      if (k === "close") return box.remove();
      if (k === "forget") {
        try { localStorage.removeItem("pf-gh-token"); } catch (er) {}
        updateBar(); box.remove(); return PF.toast("GitHub 연결을 끊었어요");
      }
      const t = input.value.trim();
      if (!t && has) { box.remove(); return thenSave && save(); }
      if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(t)) return say("github_pat_ 로 시작하는 토큰을 붙여 넣어 주세요");
      b.disabled = true; say("확인하는 중…");
      try {
        await ghApi("", { token: t });
        await ghApi(`/git/ref/heads/${GH.branch}`, { token: t });
        try { localStorage.setItem("pf-gh-token", t); } catch (er) {}
        updateBar();
        box.remove();
        PF.toast("GitHub에 연결했어요");
        if (thenSave) save();
      } catch (er) { say(er.message); b.disabled = false; }
    });
  }

  async function finishSave(where, keepFiles) {
    pending.clear();
    if (!keepFiles) await idbClear("files");
    try { localStorage.removeItem("pf-draft"); } catch (e) {}
    dirty = false;
    updateBar();
    closeSaveError();
    PF.toast(`저장했어요 · ${where}`);
  }

  function closeSaveError() { const b = $(".ed-error"); if (b) b.remove(); }
  function showSaveError(msg) {
    closeSaveError();
    const box = document.createElement("div");
    box.className = "ed-error";
    box.innerHTML = `
      <b>저장하지 못했어요</b>
      <p class="mono">${PF.esc(msg)}</p>
      <ul>
        <li>portfolio 폴더의 <b>편집하기.cmd</b>를 더블클릭해서 열면, 폴더를 고르지 않아도 바로 저장돼요.</li>
        <li>index.html을 직접 열었거나 검은 창을 닫았다면 저장 서버가 없는 상태예요.</li>
        <li>급하면 [내려받기]를 누르고, 받은 content.js는 portfolio 폴더에, 그림 파일은 portfolio/assets 폴더에 넣어 주세요.</li>
      </ul>
      <div><button type="button" data-e="retry">다시 시도</button><button type="button" data-e="pick">폴더 직접 고르기</button><button type="button" data-e="dl">내려받기</button><button type="button" data-e="close">닫기</button></div>`;
    document.body.appendChild(box);
    box.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-e]"); if (!b) return;
      const k = b.dataset.e;
      if (k === "close") return closeSaveError();
      if (k === "retry") return save();
      if (k === "dl") { saveViaDownload(); return finishSave("내려받기 폴더 (portfolio로 옮겨 주세요)"); }
      if (k === "pick") {
        if (!window.showDirectoryPicker) return PF.toast("이 브라우저는 폴더 고르기를 지원하지 않아요. Chrome이나 Edge로 열어 주세요");
        await idbPut("handles", "dir", null);
        try { finishSave(await saveViaPicker()); }
        catch (er) { if (er.name !== "AbortError") showSaveError(er.message); }
      }
    });
  }

  let saving = false;
  async function save() {
    if (saving) return;
    const a = document.activeElement;
    if (a && a.closest && a.closest("[data-path]")) a.blur();
    saving = true;
    $(".ed-save", bar).textContent = "저장 중…";
    try {
      if (GH && !IS_LOCAL) {
        if (!ghToken()) return showTokenPanel(true);
        const sha = await saveViaGitHub();
        return await finishSave(`GitHub ${sha} · 1~2분 뒤 사이트에 반영돼요`, true);
      }
      const folder = await saveViaServer();
      if (folder) return await finishSave(folder.split(/[\\/]/).pop() + " 폴더");
      if (window.showDirectoryPicker) return await finishSave(await saveViaPicker());
      showSaveError("저장 서버가 꺼져 있고, 이 브라우저는 폴더에 바로 쓸 수 없어요.");
    } catch (e) {
      if (e.name === "AbortError") PF.toast("저장을 취소했어요");
      else if (GH && !IS_LOCAL) {
        console.error(e);
        if (!e.badToken) return PF.toast("저장하지 못했어요: " + e.message);
        showTokenPanel(true);
        const m = $(".ed-gh .ed-gh-msg"); m.hidden = false; m.textContent = e.message;
      }
      else { console.error(e); showSaveError(e.message || String(e)); }
    } finally {
      saving = false;
      $(".ed-save", bar).textContent = "저장";
    }
  }

  /* ---------- 저장 안 한 수정 이어서 하기 ---------- */
  /* GitHub에 막 저장했는데 사이트가 아직 옛 내용이면, 저장한 내용으로 보여 주기 */
  async function applyPublished() {
    let pub = null;
    try { pub = JSON.parse(localStorage.getItem("pf-published") || "null"); } catch (e) {}
    if (!pub) return false;
    const same = JSON.stringify(pub.data) === JSON.stringify(D);
    if (same || Date.now() - pub.at > 20 * 60 * 1000) {
      try { localStorage.removeItem("pf-published"); } catch (e) {}
      if (same) idbClear("files");
      return false;
    }
    replaceData(pub.data);
    for (const [p, f] of await idbAll("files")) PF.blobs[p] = URL.createObjectURL(f);
    PF.render();
    PF.toast("방금 저장한 내용이 사이트에 반영되는 중이에요 (보통 1~2분)");
    return true;
  }

  async function offerDraft() {
    if (GH && !IS_LOCAL && await applyPublished()) return;
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem("pf-draft") || "null"); } catch (e) {}
    if (!draft || JSON.stringify(draft.data) === JSON.stringify(D)) return;
    const box = document.createElement("div");
    box.className = "ed-draft";
    box.innerHTML = `<span>저장하지 않은 수정 내용이 있어요 <small class="mono">${new Date(draft.at).toLocaleString("ko-KR")}</small></span>
      <button type="button" data-d="load">이어서 하기</button><button type="button" data-d="drop">버리기</button>`;
    document.body.appendChild(box);
    box.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-d]"); if (!b) return;
      if (b.dataset.d === "load") {
        snapshot();
        replaceData(draft.data);
        for (const [p, f] of await idbAll("files")) { pending.set(p, f); PF.blobs[p] = URL.createObjectURL(f); }
        dirty = true;
        if (!PF.editing) setEditing(true); else PF.render();
        updateBar();
      } else {
        try { localStorage.removeItem("pf-draft"); } catch (er) {}
        idbClear("files");
      }
      box.remove();
    });
  }

  PF.onRender = decorate;
  let startOn = /[?&]edit\b/.test(location.search);
  try { startOn = startOn || sessionStorage.getItem("pf-editing") === "1"; } catch (e) {}
  if (startOn) setEditing(true); else updateBar();
  offerDraft();
})();

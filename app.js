// app.js
// Full working app logic for Fragrance Finder (manual 3 links in CSV)

document.addEventListener("DOMContentLoaded", async () => {
  const SECTIONS = window.SECTIONS || [];
  const CFG = window.FF_CONFIG || { USD_TO_CAD: 1.35, PAGE_SIZE: 24 };

  const USD_TO_CAD = Number(CFG.USD_TO_CAD) || 1.35;
  const PAGE_SIZE = Number(CFG.PAGE_SIZE) || 24;

  // Elements
  const tabsEl = document.getElementById("tabs");
  const gridEl = document.getElementById("grid");
  const sectionTitleEl = document.getElementById("sectionTitle");
  const sectionDescEl = document.getElementById("sectionDesc");
  const countNumEl = document.getElementById("countNum");

  const searchEl = document.getElementById("search");
  const sortEl = document.getElementById("sort");
  const currencyEl = document.getElementById("currency");
  const budgetEl = document.getElementById("budget");
  const strongOnlyEl = document.getElementById("strongOnly");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  if (!tabsEl || !gridEl || !sectionTitleEl || !countNumEl) {
    console.error("Missing required HTML elements. Check index.html IDs.");
    return;
  }

  // Load data
  try {
    if (typeof window.loadFragranceData !== "function") {
      throw new Error("loadFragranceData() not found. Make sure data.js loads before app.js.");
    }
    await window.loadFragranceData();
  } catch (e) {
    sectionTitleEl.textContent = "❌ Data load error";
    if (sectionDescEl) sectionDescEl.textContent = String(e.message || e);
    countNumEl.textContent = "0";
    console.error(e);
    return;
  }

  const FRAGRANCES = Array.isArray(window.FRAGRANCES) ? window.FRAGRANCES : [];
  let activeTab = SECTIONS[0]?.key || "popular";
  let limit = PAGE_SIZE;

  // Favorites
  function getFavs() {
    try { return new Set(JSON.parse(localStorage.getItem("ff_favs") || "[]")); }
    catch { return new Set(); }
  }
  function setFavs(set) {
    localStorage.setItem("ff_favs", JSON.stringify([...set]));
  }
  function toggleFav(id) {
    const favs = getFavs();
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    setFavs(favs);
    return favs.has(id);
  }

  // Helpers
  function starBar(n) {
    if (!n || !Number.isFinite(n)) return "";
    n = Math.max(0, Math.min(5, Math.floor(n)));
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function money(item) {
    const cur = currencyEl?.value || "CAD";
    const usd = item.priceUSD;
    if (!usd || !Number.isFinite(usd)) return "Price: —";
    if (cur === "USD") return `$${usd.toFixed(0)} USD`;
    return `$${(usd * USD_TO_CAD).toFixed(0)} CAD`;
  }

  function withinBudget(item) {
    const raw = budgetEl?.value || "";
    const cap = raw ? Number(raw) : null;
    if (!cap) return true;

    const usd = item.priceUSD;
    if (!usd || !Number.isFinite(usd)) return false;

    const cur = currencyEl?.value || "CAD";
    const price = (cur === "USD") ? usd : (usd * USD_TO_CAD);
    return price <= cap;
  }

  function matchesSearch(item, q) {
    if (!q) return true;
    const hay = [
      item.brand,
      item.name,
      item.description,
      item.why,
      ...(item.tags || [])
    ].join(" ").toLowerCase();
    return hay.includes(q);
  }

  function scorePopular(item) {
    return (item.longevity || 0) * 10 + (item.tags?.length || 0);
  }

  // Tabs
  function renderTabs() {
    tabsEl.innerHTML = "";
    for (const s of SECTIONS) {
      const btn = document.createElement("div");
      btn.className = "tab" + (s.key === activeTab ? " active" : "");
      btn.textContent = s.title;
      btn.addEventListener("click", () => {
        activeTab = s.key;
        limit = PAGE_SIZE;
        renderTabs();
        render();
      });
      tabsEl.appendChild(btn);
    }
  }

  // Card
  function buildCard(item) {
    const el = document.createElement("article");
    el.className = "product";

    const img = item.image ? item.image : "assets/placeholder.jpg";
    const tags = (item.tags || []).slice(0, 6).map(t => `<span class="pill">${t}</span>`).join("");

    // ✅ Manual 3 links from CSV
    const links = (item.links || []).slice(0, 3);
    const linkButtons = links
      .map(l => `<a class="dealBtn" href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`)
      .join("");

    const stars = item.longevity ? starBar(item.longevity) : "";
    const favs = getFavs();
    const isFav = favs.has(item.id);

    el.innerHTML = `
      <div class="productMedia">
        <img src="${img}" alt="${item.brand} ${item.name}" loading="lazy">
        <button class="favBtn" type="button" title="Save">${isFav ? "♥" : "♡"}</button>
      </div>

      <div class="productBody">
        <div class="prodTop">
          <div>
            <div class="prodBrand">${item.brand || ""}</div>
            <div class="prodName">${item.name || ""}</div>
          </div>

          <div class="prodMeta">
            <div class="prodPrice">${money(item)}</div>
            <div class="prodStars">${stars ? `Longevity ${stars}` : ""}</div>
          </div>
        </div>

        <div class="prodDesc">${item.description || "No description yet."}</div>
        ${item.why ? `<div class="prodWhy">⭐ ${item.why}</div>` : ""}

        <div class="pillRow">${tags}</div>

        <div class="prodActions">
          <button class="primaryBtn viewDeals" type="button">View deals</button>
          <button class="ghostBtn copyLink" type="button">Copy</button>
        </div>

        <div class="deals" hidden>
          <div class="dealsTitle">Buy links</div>
          <div class="dealsRow">
            ${linkButtons || `<span class="muted">No links found</span>`}
          </div>
          <div class="tiny muted">These open store pages for the fragrance.</div>
        </div>
      </div>
    `;

    const favBtn = el.querySelector(".favBtn");
    const dealsBtn = el.querySelector(".viewDeals");
    const copyBtn = el.querySelector(".copyLink");
    const deals = el.querySelector(".deals");

    favBtn.addEventListener("click", () => {
      const nowFav = toggleFav(item.id);
      favBtn.textContent = nowFav ? "♥" : "♡";
    });

    dealsBtn.addEventListener("click", () => {
      deals.hidden = !deals.hidden;
      dealsBtn.textContent = deals.hidden ? "View deals" : "Hide deals";
    });

    copyBtn.addEventListener("click", async () => {
      const url = `${location.origin}${location.pathname}#${encodeURIComponent(item.id)}`;
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy"), 900);
      } catch {
        alert("Copy failed (browser blocked it).");
      }
    });

    return el;
  }

  // Render
  function render() {
    const meta = SECTIONS.find(s => s.key === activeTab);
    sectionTitleEl.textContent = meta?.title || "Fragrances";
    if (sectionDescEl) sectionDescEl.textContent = meta?.desc || "";

    const q = (searchEl?.value || "").toLowerCase().trim();
    const strongOnly = !!strongOnlyEl?.checked;

    let items = FRAGRANCES
      .filter(x => (x.section || "popular") === activeTab)
      .filter(x => matchesSearch(x, q))
      .filter(x => withinBudget(x))
      .filter(x => !strongOnly || (x.longevity && x.longevity >= 4));

    const sort = sortEl?.value || "popular";
    if (sort === "cheap") items.sort((a, b) => (a.priceUSD || 999999) - (b.priceUSD || 999999));
    else if (sort === "az") items.sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`));
    else items.sort((a, b) => scorePopular(b) - scorePopular(a));

    countNumEl.textContent = String(items.length);

    gridEl.innerHTML = "";
    const slice = items.slice(0, limit);
    for (const item of slice) gridEl.appendChild(buildCard(item));

    if (loadMoreBtn) loadMoreBtn.style.display = (items.length > limit) ? "inline-flex" : "none";

    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "product";
      empty.innerHTML = `
        <div class="productBody">
          <div class="prodName">No results</div>
          <div class="muted">Try removing filters or searching vanilla oud iris fresh.</div>
        </div>
      `;
      gridEl.appendChild(empty);
    }
  }

  // Events
  function hook(el) {
    if (!el) return;
    el.addEventListener("input", () => { limit = PAGE_SIZE; render(); });
    el.addEventListener("change", () => { limit = PAGE_SIZE; render(); });
  }

  hook(searchEl);
  hook(sortEl);
  hook(currencyEl);
  hook(budgetEl);
  hook(strongOnlyEl);

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      limit += PAGE_SIZE;
      render();
    });
  }

  // Start
  renderTabs();
  render();
});

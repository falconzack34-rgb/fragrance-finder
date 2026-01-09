// data.js
// Full config + sections + CSV loader + auto 3 links per fragrance

// ---------- SITE CONFIG ----------
window.FF_CONFIG = {
  USD_TO_CAD: 1.35,  // change anytime
  PAGE_SIZE: 24      // how many items show before "Load more"
};

// ---------- SECTIONS (TABS) ----------
window.SECTIONS = [
  { key: "popular", title: "🔥 Popular", desc: "Most well-known & loved." },
  { key: "summer", title: "🌞 Summer", desc: "Fresh, citrus, aquatic." },
  { key: "winter", title: "❄️ Winter", desc: "Warm, spicy, amber, vanilla." },
  { key: "date", title: "🌙 Date Night", desc: "Compliment-heavy, cozy, sexy." },
  { key: "office", title: "🏢 Office / Clean", desc: "Safe, clean, professional." },
  { key: "sweet", title: "🍦 Sweet / Vanilla", desc: "Gourmand, vanilla, sweet." },
  { key: "blue", title: "💙 Blue Scents", desc: "Modern fresh-woody crowd pleasers." },
  { key: "niche", title: "💎 Niche", desc: "Higher-end niche fragrances." },
  { key: "clone", title: "🧪 Clones", desc: "Smells expensive for less." },
  { key: "cheap", title: "💸 Cheap", desc: "Budget-friendly bangers." },
  { key: "hidden", title: "🕵️ Hidden Gems", desc: "Gatekept value picks." }
];

// ---------- CSV FORMAT (REQUIRED) ----------
// Put this file in the same folder as index.html:
// fragrance-finder/fragrances.csv
//
// Each row must have 9 columns:
//
// brand,name,section,usd,longevity,tags,image,description,why
//
// Notes:
// - tags use | like: fresh|sweet|vanilla
// - image can be blank. If blank the site can show a placeholder.
// - Do NOT put commas in description/why unless you wrap that field in quotes.

// ---------- DATA LOADER ----------
async function loadCSV() {
  const res = await fetch("fragrances.csv");
  if (!res.ok) {
    throw new Error(
      "fragrances.csv not found. Make sure it is in the SAME folder as index.html and you are running Live Server."
    );
  }

  const text = await res.text();
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const out = [];
  let idx = 1;

  // Always generate 3 buy links for each fragrance
  function autoLinks(brand, name) {
    const q = encodeURIComponent(`${brand} ${name}`);
    return [
      { label: "Amazon", url: `https://www.amazon.ca/s?k=${q}` },
      { label: "FragranceNet", url: `https://www.fragrancenet.com/search?query=${q}` },
      { label: "FragranceX", url: `https://www.fragrancex.com/search/search?query=${q}` }
    ];
  }

  for (const line of lines) {
    // allow comment lines
    if (line.startsWith("#")) continue;

    // Split by comma
    const parts = line.split(",").map(x => x.trim());

    // required 9 columns
    const brand = parts[0] || "";
    const name = parts[1] || "";
    const section = parts[2] || "popular";
    const usd = parts[3] ? Number(parts[3]) : null;
    const longevity = parts[4] ? Number(parts[4]) : null;
    const tags = parts[5]
      ? parts[5].split("|").map(t => t.trim()).filter(Boolean)
      : [];
    const image = parts[6] || "";
    const description = parts[7] || "";
    const why = parts[8] || "";

    // Skip totally broken rows (must have brand + name)
    if (!brand || !name) continue;

    out.push({
      id: `f${idx++}`,
      brand,
      name,
      section,
      priceUSD: Number.isFinite(usd) ? usd : null,
      longevity: Number.isFinite(longevity) ? longevity : null,
      tags,
      image,
      description,
      why,
      links: autoLinks(brand, name) // ✅ always 3 links
    });
  }

  window.FRAGRANCES = out;
}

// Expose loader for app.js to call
window.loadFragranceData = loadCSV;

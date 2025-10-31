(async () => {
  console.log("⚙️ Auto Tag Filler – 2 Step Smart Mode");
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const progressBox = document.createElement("div");
  progressBox.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: #222; color: #fff; padding: 10px 14px;
    font-family: sans-serif; font-size: 13px;
    border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    z-index: 999999; width: 260px; line-height: 1.5;
  `;
  document.body.appendChild(progressBox);
  const log = (msg) => { console.log(msg); progressBox.innerText = msg; };

  // STEP 1 – Scroll & Add All
  log("🔄 Step 1: Scrolling to load & Add all tags...");
  let lastY = -1;
  while (window.scrollY !== lastY) {
    lastY = window.scrollY;
    window.scrollBy(0, 600);
    const buttons = document.querySelectorAll(".addToTag_AT1GT");
    buttons.forEach(btn => { if (!btn.dataset.clicked) { btn.click(); btn.dataset.clicked = "true"; } });
    await delay(200);
  }
  log("✅ Step 1 complete: All tags loaded & added.");
  await delay(2000);

  // STEP 2 – Analyze Cards
  window.scrollTo({ top: 0, behavior: "smooth" });
  await delay(1500);

  const cards = document.querySelectorAll(".card_8BZOE");
  if (!cards.length) return log("❌ Tidak ada card ditemukan.");

  const getTags = (card) =>
    Array.from(card.querySelectorAll("ul li"))
      .filter(li => !li.classList.contains("addNew_okcFC"));
  const trimTo10 = async (card) => {
    while (getTags(card).length > 10) {
      const last = getTags(card).at(-1);
      const btn = last?.querySelector("a svg");
      if (btn) btn.parentElement.click();
      await delay(80);
    }
  };
  const addSuggested = async (card) => {
    const sug = card.querySelectorAll(".suggestedTags_bXHhf ul li");
    for (const s of sug) {
      if (getTags(card).length >= 10) break;
      const addBtn = s.querySelector("span svg");
      if (addBtn) s.click();
      await delay(100);
    }
  };

  let processed = 0, fixed = 0;
  for (const card of cards) {
    processed++;
    const titleInput = card.querySelector('input[name^="title-"]');
    const title = titleInput?.value.trim() || titleInput?.placeholder || "";
    let tags = getTags(card);

    if (tags.length === 10) {
      log(`✅ [${processed}/${cards.length}] OK`);
      continue;
    }

    // Lebih dari 10 → trim
    if (tags.length > 10) {
      await trimTo10(card);
      log(`✂️ [${processed}/${cards.length}] Trimmed to 10`);
      fixed++;
      continue;
    }

    // Kurang dari 10 → coba dari suggested
    await addSuggested(card);
    tags = getTags(card);

    // Kalau masih kurang → ambil dari title
    if (tags.length < 10 && title) {
      const words = title.replace(/[^a-zA-Z0-9\\s]/g, "").split(/\\s+/);
      for (const w of words) {
        if (!w.trim()) continue;
        if (getTags(card).length >= 10) break;
        const input = card.querySelector(".addNew_okcFC input");
        if (input) {
          input.value = w.toLowerCase();
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
          await delay(150);
        }
      }
      fixed++;
    }

    log(`🧩 [${processed}/${cards.length}] Fixed (${getTags(card).length}/10)`);
  }

  log(`🎉 Selesai! ${cards.length} ikon diproses, ${fixed} diperbaiki.`);
  progressBox.style.background = "#28a745";
  progressBox.innerText = `✅ ${cards.length} icons processed\n🛠️ ${fixed} fixed`;
})();
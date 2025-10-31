//////////////////////////////////////////////////////
// content.js (FINAL 2 STEP VERSION)
//////////////////////////////////////////////////////

(async () => {
  //////////////////////////////////////////////////////
  // Helpers
  //////////////////////////////////////////////////////
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // floating status box
  const progressBox = document.createElement("div");
  progressBox.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #222;
    color: #fff;
    padding: 10px 14px;
    font-family: sans-serif;
    font-size: 13px;
    border-radius: 8px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    z-index: 999999;
    width: 260px;
    line-height: 1.5;
    white-space: pre-line;
  `;
  document.body.appendChild(progressBox);
  const log = (msg) => {
    console.log(msg);
    progressBox.innerText = msg;
  };

  //////////////////////////////////////////////////////
  // STEP 0: wait page ready & cards rendered
  //////////////////////////////////////////////////////
  log("🕘 Menunggu halaman selesai loading...");

  // wait until IconScout cards exist
  let tries = 0;
  while (document.querySelectorAll(".card_8BZOE").length === 0 && tries < 40) {
    await delay(250);
    tries++;
  }

  const allCardsEarly = Array.from(document.querySelectorAll(".card_8BZOE"));
  log(`✅ Halaman loaded! Ditemukan ${allCardsEarly.length} cards awal.`);

  //////////////////////////////////////////////////////
  // STEP 1: Scroll full page + click ALL 'Add all to Tags'
  //////////////////////////////////////////////////////
  log("⬇️ Step 1: Scrolling to load & Add all tags...");

  let lastY = -1;
  let scrollStepCount = 0;
  // smooth scroll down until can't scroll more
  while (window.scrollY !== lastY) {
    lastY = window.scrollY;
    window.scrollBy(0, 600);

    // for every visible card, click its "Add all to Tags" button if not already clicked
    const addAllBtns = document.querySelectorAll(".addToTag_AT1GT");
    addAllBtns.forEach(btn => {
      if (!btn.dataset.clicked) {
        btn.click();
        btn.dataset.clicked = "true";
      }
    });

    scrollStepCount++;
    log(`🌀 Scrolling... step ${scrollStepCount}`);
    await delay(200);
  }

  log("🟢 Auto scroll selesai. Menunggu DOM settle 2 detik...");
  await delay(2000);

  // after scroll, click ALL add all again just to be sure
  const allAddAllBtnsAfter = document.querySelectorAll(".addToTag_AT1GT");
  let bulkClicks = 0;
  allAddAllBtnsAfter.forEach(btn => {
    btn.click();
    bulkClicks++;
  });
  log(`⚡ Mengklik ulang 'Add all to Tags' di ${bulkClicks} tombol (final sweep).`);

  log("✅ Step 1 complete! Bulk tagging done.");

  //////////////////////////////////////////////////////
  // STEP 2: Go card by card like the stable early logic
  //////////////////////////////////////////////////////
  log("🔁 Step 2: Mulai analisis card satu per satu...");

  // scroll to top so first cards are in viewport (helps lazy stuff on top refresh)
  window.scrollTo({ top: 0, behavior: "auto" });
  await delay(1000);

  // re-scan cards AFTER bulk pass (some cards may have been lazy-loaded later)
  const cards = Array.from(document.querySelectorAll(".card_8BZOE"));
  log(`📦 Total cards untuk dianalisis di Step 2: ${cards.length}`);

  // helper functions that operate per-card
  const getCurrentTags = (card) =>
    Array.from(card.querySelectorAll("ul li"))
      .filter(li => !li.classList.contains("addNew_okcFC"));

  const getSuggestedTagsCount = (card) =>
    card.querySelectorAll(".suggestedTags_bXHhf ul li").length;

  const getAddAllBtn = (card) =>
    card.querySelector(".addToTag_AT1GT");

  const trimTo10 = async (card) => {
    let tagsArr = getCurrentTags(card);
    while (tagsArr.length > 10) {
      const last = tagsArr[tagsArr.length - 1];
      const removeBtn = last.querySelector("a svg");
      if (removeBtn) {
        removeBtn.parentElement.click();
      }
      await delay(100);
      tagsArr = getCurrentTags(card);
    }
  };

  const tryAddAllForCard = async (card) => {
    const btn = getAddAllBtn(card);
    if (!btn) return;
    btn.click();
    await delay(800); // let IconScout inject tags
  };

  const fillFromTitleFallback = async (card, titleText) => {
    const cleanWords = titleText
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/);

    for (const word of cleanWords) {
      if (!word.trim()) continue;
      if (getCurrentTags(card).length >= 10) break;
      const input = card.querySelector(".addNew_okcFC input");
      if (input) {
        input.value = word.toLowerCase();
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        await delay(200);
      }
    }
  };

  let processed = 0;
  let fixedCount = 0;

  for (const card of cards) {
    processed++;

    // keep viewport moving to help any remaining lazy behavior
    card.scrollIntoView({ behavior: "auto", block: "start" });
    await delay(150);

    const titleInput = card.querySelector('input[name^="title-"]');
    const titleText = titleInput
      ? (titleInput.value || titleInput.placeholder || "").trim()
      : "";

    // measure initial count
    let beforeTags = getCurrentTags(card).length;

    // CASE A: already 10/10
    if (beforeTags === 10) {
      log(`✅ [${processed}/${cards.length}] OK (10/10)`);
      continue;
    }

    // CASE B: >10, trim down
    if (beforeTags > 10) {
      await trimTo10(card);
      fixedCount++;
      log(`✂️ [${processed}/${cards.length}] Trimmed to 10`);
      continue;
    }

    // CASE C: <10
    // Step C1: Try Add All (local to this card)
    if (beforeTags < 10 && getSuggestedTagsCount(card) > 0) {
      await tryAddAllForCard(card);
    }

    // re-check
    let afterAddAll = getCurrentTags(card).length;

    // Step C2: Retry Add All once if still <10 and suggested still exists
    if (afterAddAll < 10 && getSuggestedTagsCount(card) > 0) {
      await tryAddAllForCard(card);
      afterAddAll = getCurrentTags(card).length;
    }

    // Step C3: If STILL <10 → fallback from title words
    if (afterAddAll < 10 && titleText) {
      await fillFromTitleFallback(card, titleText);
    }

    // Final trim to ensure <=10
    await trimTo10(card);

    fixedCount++;
    log(`🧩 [${processed}/${cards.length}] Final ${getCurrentTags(card).length}/10`);
    await delay(150);
  }

  //////////////////////////////////////////////////////
  // DONE
  //////////////////////////////////////////////////////
  log(`🎉 Selesai!\nCards diproses: ${cards.length}\nCards diperbaiki: ${fixedCount}`);

  progressBox.style.background = "#28a745";
  progressBox.innerText =
    `✅ Selesai!\nTotal cards: ${cards.length}\nDiperbaiki: ${fixedCount}`;
})();
//////////////////////////////////////////////////////
// END content.js
//////////////////////////////////////////////////////
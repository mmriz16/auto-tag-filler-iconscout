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

  log("🕓 Step 1 done. Menunggu DOM stabilize (3s)...");
  await delay(3000);
  window.scrollTo({ top: 0, behavior: "auto" });
  await delay(1500);
  window.scrollBy(0, 400);
  await delay(1000);
  log("🔁 Step 2: Mulai analisis card satu per satu...");

  //////////////////////////////////////////////////////
  // STEP 2: Go card by card like the stable early logic
  //////////////////////////////////////////////////////

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

  log("🔄 Memastikan semua card ter-render sebelum analisis...");
  for (const card of cards) {
    card.scrollIntoView({ behavior: "auto", block: "center" });
    await delay(120);
  }
  log("✅ Semua card siap dianalisis, mulai Step 2 loop...");

  // Process cards in batches of 4 (parallel processing)
  for (let i = 0; i < cards.length; i += 4) {
    const batch = cards.slice(i, i + 4);
    log(`🔄 Processing batch ${Math.floor(i/4) + 1}/${Math.ceil(cards.length/4)} (${batch.length} cards)`);
    
    // Step 1: Scroll each card in batch to trigger lazy loading
    for (const card of batch) {
      card.scrollIntoView({ behavior: "auto", block: "center" });
      await delay(400);
    }
    
    // Step 2: Process all cards in batch concurrently
    const batchPromises = batch.map(async (card, batchIndex) => {
      const cardIndex = i + batchIndex + 1;
      try {
        const titleInput = card.querySelector('input[name^="title-"]');
        const titleText = titleInput
          ? (titleInput.value || titleInput.placeholder || "").trim()
          : "";

        const getTags = () =>
          Array.from(card.querySelectorAll("ul li"))
            .filter(li => !li.classList.contains("addNew_okcFC"));

        const getAddAllBtn = () => card.querySelector(".addToTag_AT1GT");

        let currentCount = getTags().length;

        // CASE A: Sudah 10/10
        if (currentCount === 10) {
          log(`✅ [${cardIndex}/${cards.length}] Sudah 10/10`);
          return;
        }

        // CASE B: Lebih dari 10 → trim
        if (currentCount > 10) {
          await trimTo10(card);
          log(`✂️ [${cardIndex}/${cards.length}] Trimmed ke 10`);
          return;
        }

        // CASE C: Kurang dari 10
        const btn = getAddAllBtn();
        if (btn) {
          btn.click();
          await delay(500);
        }

        let after = getTags().length;

        // Retry sekali jika masih kurang
        if (after < 10 && btn) {
          btn.click();
          await delay(600);
          after = getTags().length;
        }

        // Fallback dari judul kalau masih kurang
        if (after < 10 && titleText) {
          await fillFromTitleFallback(card, titleText);
        }

        // Trim akhir ke 10
        await trimTo10(card);

        fixedCount++;
        log(`🧩 [${cardIndex}/${cards.length}] Final ${getTags().length}/10`);

      } catch (err) {
        console.warn(`⚠️ Card error, skip ${cardIndex}:`, err);
      }
    });
    
    // Wait for all cards in batch to complete
    await Promise.all(batchPromises);
    processed += batch.length;
    
    // Delay between batches to prevent rate limiting
    if (i + 4 < cards.length) {
      await delay(500);
    }
  }

  log(`🎯 Step 2 complete! ${fixedCount} cards diperbaiki.`);

  //////////////////////////////////////////////////////
  // DONE
  //////////////////////////////////////////////////////
  progressBox.style.background = "#28a745";
  progressBox.innerText =
    `✅ Selesai!\nTotal cards: ${cards.length}\nDiperbaiki: ${fixedCount}`;
})();
//////////////////////////////////////////////////////
// END content.js
//////////////////////////////////////////////////////
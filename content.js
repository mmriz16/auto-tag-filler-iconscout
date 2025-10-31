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

  // Wait for page to fully load
  const waitForPageLoad = async () => {
    log("⏳ Menunggu halaman selesai loading...");
    
    // Wait for document ready state
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        const checkReady = () => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }
    
    // Wait for images and resources to load
    await delay(1000);
    
    // Wait for initial cards to appear
    let attempts = 0;
    while (attempts < 30) { // Max 15 seconds
      const cards = document.querySelectorAll(".card_8BZOE");
      if (cards.length > 0) {
        log(`✅ Halaman loaded! Ditemukan ${cards.length} cards awal.`);
        break;
      }
      await delay(500);
      attempts++;
    }
    
    // Additional delay to ensure dynamic content is loaded
    await delay(2000);
  };

  await waitForPageLoad();

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
  
  log("📋 Auto scroll selesai. Menunggu 5 detik...");
  await delay(5000);
  
  log("🎯 Mengklik 'Add All to Tags' di semua cards...");
  const allAddButtons = document.querySelectorAll(".addToTag_AT1GT");
  let clickedCount = 0;
  for (const btn of allAddButtons) {
    if (!btn.dataset.finalClicked) {
      btn.click();
      btn.dataset.finalClicked = "true";
      clickedCount++;
      await delay(50); // Small delay between clicks
    }
  }
  log(`✅ Diklik ${clickedCount} tombol 'Add All to Tags'.`);
  
  log("✅ Step 1 complete: All tags loaded & added.");
  await delay(3000);

  // STEP 2 – Analyze Cards
  log("🎯 Step 2: Memulai analisis cards...");
  log("📍 Scrolling ke atas untuk memulai analisis...");
  window.scrollTo({ top: 0, behavior: "smooth" });
  await delay(2500);

  log("🔍 Mencari cards untuk dianalisis...");
  let cards = document.querySelectorAll(".card_8BZOE");
  log(`📊 Status cards: ${cards.length} cards ditemukan`);
  
  if (!cards.length) {
    log("❌ Tidak ada card ditemukan. Mencoba lagi...");
    await delay(2000);
    cards = document.querySelectorAll(".card_8BZOE");
    if (!cards.length) return log("❌ Gagal menemukan cards setelah retry.");
    log(`✅ Ditemukan ${cards.length} cards setelah retry.`);
  } else {
    log(`✅ Ditemukan ${cards.length} cards untuk dianalisis.`);
  }

  const getTags = (card) =>
    Array.from(card.querySelectorAll("ul li"))
      .filter(li => !li.classList.contains("addNew_okcFC"));
  const trimTo10 = async (card) => {
    while (getTags(card).length > 10) {
      const last = getTags(card).at(-1);
      const btn = last?.querySelector("a svg");
      if (btn) btn.parentElement.click();
      await delay(30); // Reduced delay
    }
  };
  
  const addSuggested = async (card) => {
    const sug = card.querySelectorAll(".suggestedTags_bXHhf ul li");
    for (const s of sug) {
      if (getTags(card).length >= 10) break;
      const addBtn = s.querySelector("span svg");
      if (addBtn) s.click();
      await delay(40); // Reduced delay
    }
  };

  let processed = 0, fixed = 0;
  log(`🚀 Memulai pemrosesan ${cards.length} cards...`);
  
  for (const card of cards) {
    processed++;
    
    let tags = getTags(card);
    const tagCount = tags.length;

    // Skip jika sudah 10
    if (tagCount === 10) {
      if (processed % 10 === 0) log(`✅ [${processed}/${cards.length}] Batch OK`);
      continue;
    }

    // Trim jika lebih dari 10
    if (tagCount > 10) {
      await trimTo10(card);
      fixed++;
      if (processed % 5 === 0) log(`✂️ [${processed}/${cards.length}] Trimmed batch`);
      continue;
    }

    // Add jika kurang dari 10
    if (tagCount < 10) {
      // Coba dari suggested tags dulu
      await addSuggested(card);
      
      // Jika masih kurang, ambil dari title
      if (getTags(card).length < 10) {
        const titleInput = card.querySelector('input[name^="title-"]');
        const title = titleInput?.value.trim() || titleInput?.placeholder || "";
        
        if (title) {
          const words = title.replace(/[^a-zA-Z0-9\\s]/g, "").split(/\\s+/);
          for (const w of words) {
            if (!w.trim() || getTags(card).length >= 10) break;
            const input = card.querySelector(".addNew_okcFC input");
            if (input) {
              input.value = w.toLowerCase();
              input.dispatchEvent(new Event("input", { bubbles: true }));
              input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
              await delay(50); // Reduced delay
            }
          }
        }
      }
      fixed++;
      if (processed % 5 === 0) log(`🧩 [${processed}/${cards.length}] Added batch`);
    }
  }

  log(`🎉 Selesai! ${cards.length} ikon diproses, ${fixed} diperbaiki.`);
  progressBox.style.background = "#28a745";
  progressBox.innerText = `✅ ${cards.length} icons processed\n🛠️ ${fixed} fixed`;
})();
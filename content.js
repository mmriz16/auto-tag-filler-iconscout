(async function() {
  console.log("⚙️ Auto Tag Filler – Instant Add All + Final Trim Mode");

  const delay = (ms) => new Promise(res => setTimeout(res, ms));
  
  // Floating progress box
  const progressBox = document.createElement("div");
  progressBox.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: #222; color: #fff; padding: 10px 14px;
    font-family: sans-serif; font-size: 13px;
    border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    z-index: 999999; width: 260px; line-height: 1.5;
  `;
  document.body.appendChild(progressBox);

  const log = (msg) => { 
    console.log(msg); 
    progressBox.innerHTML = `🪄 ${msg}`;
  };

  // Wait for page to be fully loaded
  const waitForPageLoad = async () => {
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', resolve, { once: true });
        }
      });
    }
    await delay(2000);
  };

  // Wait for page to be fully loaded first
  log("⏳ Waiting for page to load completely...");
  await waitForPageLoad();

  // Wait for Iconscout elements to appear
  log("⏳ Waiting for Iconscout interface elements...");
  const waitForIconscoutElements = async () => {
    for (let i = 0; i < 20; i++) {
      const hasIconscoutElements = document.querySelector('[class*="draft"]') ||
                                   document.querySelector('[class*="icon"]') ||
                                   document.querySelector('[class*="contributor"]') ||
                                   document.querySelector('input[name*="title"]') ||
                                   document.querySelector('[id*="tags"]');
      
      if (hasIconscoutElements) {
        log("✅ Iconscout elements detected");
        break;
      }
      
      if (i % 5 === 0 && i > 0) {
        log(`⏳ Waiting for Iconscout elements... (${i}/20)`);
      }
      
      await delay(1000);
    }
  };
  
  await waitForIconscoutElements();

  // 1️⃣ PRE-SCROLL to load all Suggested Tags
  log("🔄 Scrolling page to load all Suggested Tags...");
  let lastScrollTop = -1;
  let scrollStep = 0;
  
  while (true) {
    window.scrollBy(0, 600);
    await delay(150);
    const st = window.scrollY;
    scrollStep++;
    
    if (scrollStep % 15 === 0) {
      log(`🔄 Scrolling... step ${scrollStep} (position: ${Math.round(st)}px)`);
    }
    
    if (Math.abs(st - lastScrollTop) < 10) break; // reached bottom
    lastScrollTop = st;
  }
  
  log("✅ All Suggested Tags loaded.");
  await delay(500);

  // 2️⃣ INSTANT GLOBAL ADD-ALL (No delays!)
  const addAllButtons = Array.from(document.querySelectorAll(".addToTag_AT1GT"));
  if (addAllButtons.length === 0) {
    log("❌ No Add All buttons found.");
    return;
  }
  
  log(`⚡ Clicking ${addAllButtons.length} 'Add all to Tags' buttons instantly...`);

  // Click all buttons as fast as possible with no delays
  for (const btn of addAllButtons) {
    btn.click();
  }

  log("✅ All Add-All clicks done. Waiting for DOM updates...");
  await delay(2000);

  // 3️⃣ SIMPLE FINAL VERIFY + AUTO-FILL + TRIM (Stable Selector Version)
  log("🕐 Starting final tag verification...");

  // Wait until cards are rendered
  let tries = 0;
  while (document.querySelectorAll(".card_8BZOE").length === 0 && tries < 20) {
    log(`⏳ Waiting for cards to render... (${tries + 1})`);
    await new Promise(r => setTimeout(r, 500));
    tries++;
  }

  const cards = document.querySelectorAll(".card_8BZOE");
  if (!cards.length) {
    log("❌ No cards found — exiting verification.");
    return;
  }

  log(`🔍 Found ${cards.length} cards. Starting verification...`);

  const getCurrentTags = (card) =>
    Array.from(card.querySelectorAll("ul li"))
      .filter(li => !li.classList.contains("addNew_okcFC"));

  const trimTo10 = async (card) => {
    let tags = getCurrentTags(card);
    while (tags.length > 10) {
      const last = tags[tags.length - 1];
      const removeBtn = last.querySelector("a svg");
      if (removeBtn) removeBtn.parentElement.click();
      await delay(100);
      tags = getCurrentTags(card);
    }
  };

  let changed = 0;
  let processed = 0;

  for (const card of cards) {
    processed++;
    try {
      const titleInput = card.querySelector('input[name^="title-"]');
      if (!titleInput) continue;

      const title = titleInput.value.trim() || titleInput.placeholder || "";
      let tags = getCurrentTags(card);

      // If less than 10, fill from title
      if (tags.length < 10) {
        const cleanWords = title.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/);
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
        changed++;
      }

      // If more than 10, trim extras
      await trimTo10(card);

      log(`✅ [${processed}/${cards.length}] Done (${getCurrentTags(card).length}/10)`);

    } catch (err) {
      console.error(`❌ [${processed}] Error:`, err);
    }

    await delay(100);
  }

  log(`🎉 Verification finished for ${cards.length} icons! Changed: ${changed}`);
  progressBox.style.background = "#28a745";
  progressBox.textContent = `✅ Verified ${cards.length} icons | ${changed} updated`;
  await delay(4000);
  progressBox.remove();

})();
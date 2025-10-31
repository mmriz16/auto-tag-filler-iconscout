//////////////////////////////////////////////////////
// IconScout Auto-Tagger Extension - Complete Rewrite
// Version: Sequential Processing with Lazy Load Scroll
//////////////////////////////////////////////////////

// Auto-run only on IconScout contributor draft pages
if (window.location.href.includes("contributor.iconscout.com/icon/draft/")) {
  (async () => {
    //////////////////////////////////////////////////////
    // HELPER FUNCTIONS
    //////////////////////////////////////////////////////
    
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const log = (message) => {
      console.log(`[IconScout Auto-Tagger] ${message}`);
      if (window.progressBox) {
        window.progressBox.innerText = message;
      }
    };
    
    // Helper: Trim tags to exactly 10
    const trimTo10 = async (card) => {
      const getTags = () =>
        Array.from(card.querySelectorAll("ul li"))
          .filter(li => !li.classList.contains("addNew_okcFC"));

      let tags = getTags();

      while (tags.length > 10) {
        const last = tags[tags.length - 1];
        const removeAnchor = last.querySelector("a");
        if (removeAnchor) {
          removeAnchor.click();
          await delay(150); // give DOM time to update
        }
        tags = getTags();
      }

      // safety check: sometimes IconScout doesn't update instantly
      if (tags.length > 10) {
        console.warn("⚠️ trimTo10 recheck: still over 10 tags, forcing one-by-one retry");
        for (let i = tags.length - 1; i >= 10; i--) {
          const a = tags[i]?.querySelector("a");
          if (a) {
            a.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            await delay(150);
          }
        }
      }
    };
    
    // Helper: Fill missing tags from title words
    const fillFromTitleFallback = async (card, titleText) => {
      if (!titleText) return;
      
      const tagsList = card.querySelector(".inputTags_YjWW8 ul");
      const addNewInput = card.querySelector(".addNew_okcFC input");
      
      if (!tagsList || !addNewInput) return;
      
      // Get current tag count
      const getCurrentTagCount = () => 
        Array.from(tagsList.querySelectorAll("li")).filter(
          li => !li.classList.contains("addNew_okcFC")
        ).length;
      
      // Split title into clean words
      const words = titleText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(word => word.length > 2)
        .slice(0, 5); // Max 5 words from title
      
      // Add words as tags until we reach 10
      for (const word of words) {
        if (getCurrentTagCount() >= 10) break;
        
        addNewInput.value = word;
        addNewInput.dispatchEvent(new Event("input", { bubbles: true }));
        await delay(100);
        
        // Simulate Enter key
        addNewInput.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          bubbles: true
        }));
        await delay(200);
      }
    };
    
    //////////////////////////////////////////////////////
    // PROGRESS BOX SETUP
    //////////////////////////////////////////////////////
    
    const progressBox = document.createElement("div");
    progressBox.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-width: 300px;
      white-space: pre-line;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    progressBox.innerText = "🚀 IconScout Auto-Tagger Starting...";
    document.body.appendChild(progressBox);
    window.progressBox = progressBox;
    
    await delay(1000);
    
    //////////////////////////////////////////////////////
    // STEP 1: LAZY LOAD SCROLL
    //////////////////////////////////////////////////////
    
    log("🌀 Step 1: Starting lazy load scroll...");
    
    // Scroll to top first
    window.scrollTo({ top: 0, behavior: "smooth" });
    await delay(500);
    
    // Scroll down in 600px increments every 200ms
    let currentScroll = 0;
    let step = 1;
    const scrollIncrement = 600;
    const scrollDelay = 200;
    
    while (currentScroll < document.body.scrollHeight - window.innerHeight) {
      currentScroll += scrollIncrement;
      window.scrollTo({ top: currentScroll, behavior: "smooth" });
      log(`🌀 Scrolling... step ${step}`);
      step++;
      await delay(scrollDelay);
    }
    
    // Ensure we're at the bottom
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    log("🌀 Reached bottom, waiting 2 seconds...");
    await delay(2000);
    
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: "smooth" });
    await delay(1000);
    
    log("✅ Step 1 done. Starting per-card tagging...");
    
    //////////////////////////////////////////////////////
    // STEP 2: PER-CARD PROCESSING
    //////////////////////////////////////////////////////
    
    try {
      // Find all cards
      const cards = Array.from(document.querySelectorAll(".card_8BZOE"));
      
      if (cards.length === 0) {
        log("❌ No cards found! Make sure you're on the draft page.");
        progressBox.style.background = "#dc3545";
        return;
      }
      
      log(`🎯 Found ${cards.length} cards. Processing sequentially...`);
      
      let processed = 0;
      let fixedCount = 0;
    
    // Process each card one by one
    for (const card of cards) {
      processed++;
      
      try {
        log(`🔄 [${processed}/${cards.length}] Processing card...`);
        
        // 1. Scroll card into view
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        await delay(300);
        
        // 2. Get current tag count and title
        const tagsList = card.querySelector(".inputTags_YjWW8 ul");
        const titleInput = card.querySelector('input[name^="title-"]');
        
        if (!tagsList) {
          log(`⚠️ [${processed}/${cards.length}] No tags container found, skipping`);
          continue;
        }
        
        log(`🔍 [${processed}/${cards.length}] Found tags container, checking count...`);
        
        const getCurrentTagCount = () => 
          Array.from(tagsList.querySelectorAll("li")).filter(
            li => !li.classList.contains("addNew_okcFC")
          ).length;
        
        const titleText = titleInput 
          ? (titleInput.value || titleInput.placeholder || "").trim()
          : "";
        
        let currentCount = getCurrentTagCount();
        log(`📊 [${processed}/${cards.length}] Current tag count: ${currentCount}`);
        
        // 3. Apply logic based on tag count
        if (currentCount === 10) {
          // Case A: Already has 10 tags
          log(`✅ [${processed}/${cards.length}] OK (10/10)`);
          continue;
        }
        
        if (currentCount > 10) {
          // Case B: More than 10 tags - trim to 10
          log(`✂️ [${processed}/${cards.length}] Trimming from ${currentCount} to 10...`);
          await trimTo10(card);
          log(`✂️ [${processed}/${cards.length}] Trimmed → 10`);
          fixedCount++;
          continue;
        }
        
        // Case C: Less than 10 tags - try to add more
        log(`➕ [${processed}/${cards.length}] Need more tags (${currentCount}/10), looking for Add All button...`);
        const addAllBtn = card.querySelector(".addToTag_AT1GT");
        
        if (addAllBtn) {
          // First attempt: Click "Add all to Tags"
          log(`🔘 [${processed}/${cards.length}] Clicking Add All button (attempt 1)...`);
          addAllBtn.click();
          await delay(800);
          
          currentCount = getCurrentTagCount();
          log(`📊 [${processed}/${cards.length}] After attempt 1: ${currentCount} tags`);
          
          // Second attempt if still < 10
          if (currentCount < 10 && addAllBtn) {
            log(`🔘 [${processed}/${cards.length}] Still need more, clicking Add All button (attempt 2)...`);
            addAllBtn.click();
            await delay(800);
            currentCount = getCurrentTagCount();
            log(`📊 [${processed}/${cards.length}] After attempt 2: ${currentCount} tags`);
          }
        } else {
          log(`❌ [${processed}/${cards.length}] No Add All button found`);
        }
        
        // Fallback: Add from title if still < 10
        if (currentCount < 10 && titleText) {
          log(`📝 [${processed}/${cards.length}] Using title fallback: "${titleText}"`);
          await fillFromTitleFallback(card, titleText);
          currentCount = getCurrentTagCount();
          log(`📊 [${processed}/${cards.length}] After title fallback: ${currentCount} tags`);
        }
        
        // Final trim to ensure exactly 10
        log(`🔧 [${processed}/${cards.length}] Final trim to ensure exactly 10...`);
        await trimTo10(card);
        
        const finalCount = getCurrentTagCount();
        log(`🧩 [${processed}/${cards.length}] Final result → ${finalCount}/10`);
        fixedCount++;
        
      } catch (err) {
        console.error(`❌ Error processing card ${processed}:`, err);
        log(`⚠️ [${processed}/${cards.length}] Error: ${err.message}, skipping`);
      }
      
      // Delay before next card
      await delay(250);
    }
    
    //////////////////////////////////////////////////////
    // COMPLETION
    //////////////////////////////////////////////////////
    
    log(`🎯 Done. Fixed ${fixedCount} cards.`);
    
    progressBox.style.background = "#28a745";
    progressBox.innerText = 
      `✅ Auto-Tagging Complete!\nTotal cards: ${cards.length}\nFixed: ${fixedCount}`;
      
    } catch (stepError) {
      console.error("❌ Critical error in Step 2:", stepError);
      log(`❌ Critical error in Step 2: ${stepError.message}`);
      progressBox.style.background = "#dc3545";
      progressBox.innerText = `❌ Error: ${stepError.message}`;
    }
    
  })();
}

//////////////////////////////////////////////////////
// END content.js
//////////////////////////////////////////////////////
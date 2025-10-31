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
      const tagsList = card.querySelector(".inputTags_YjWW8 ul");
      if (!tagsList) return;
      
      const tags = Array.from(tagsList.querySelectorAll("li")).filter(
        li => !li.classList.contains("addNew_okcFC")
      );
      
      // Remove excess tags from the end
      while (tags.length > 10) {
        const lastTag = tags.pop();
        if (lastTag) {
          lastTag.remove();
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
        
        const getCurrentTagCount = () => 
          Array.from(tagsList.querySelectorAll("li")).filter(
            li => !li.classList.contains("addNew_okcFC")
          ).length;
        
        const titleText = titleInput 
          ? (titleInput.value || titleInput.placeholder || "").trim()
          : "";
        
        let currentCount = getCurrentTagCount();
        
        // 3. Apply logic based on tag count
        if (currentCount === 10) {
          // Case A: Already has 10 tags
          log(`✅ [${processed}/${cards.length}] OK (10/10)`);
          continue;
        }
        
        if (currentCount > 10) {
          // Case B: More than 10 tags - trim to 10
          await trimTo10(card);
          log(`✂️ [${processed}/${cards.length}] Trimmed → 10`);
          fixedCount++;
          continue;
        }
        
        // Case C: Less than 10 tags - try to add more
        const addAllBtn = card.querySelector(".addToTag_AT1GT");
        
        if (addAllBtn) {
          // First attempt: Click "Add all to Tags"
          addAllBtn.click();
          await delay(800);
          
          currentCount = getCurrentTagCount();
          
          // Second attempt if still < 10
          if (currentCount < 10 && addAllBtn) {
            addAllBtn.click();
            await delay(800);
            currentCount = getCurrentTagCount();
          }
        }
        
        // Fallback: Add from title if still < 10
        if (currentCount < 10 && titleText) {
          await fillFromTitleFallback(card, titleText);
          currentCount = getCurrentTagCount();
        }
        
        // Final trim to ensure exactly 10
        await trimTo10(card);
        
        const finalCount = getCurrentTagCount();
        log(`🧩 [${processed}/${cards.length}] Added → ${finalCount}/10`);
        fixedCount++;
        
      } catch (err) {
        console.warn(`⚠️ Error processing card ${processed}:`, err);
        log(`⚠️ [${processed}/${cards.length}] Error, skipping`);
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
    
  })();
}

//////////////////////////////////////////////////////
// END content.js
//////////////////////////////////////////////////////
/**
 * ============================================================================
 * AUTOCOOKIE v5 - THE INTELLIGENT ASSISTANT
 * ============================================================================
 * * DESCRIPTION:
 * This script plays Cookie Clicker for you using a mathematical "Return On Investment" (ROI) 
 * algorithm. It doesn't just buy the cheapest thing; it buys the *most efficient* thing.
 * * FEATURES:
 * 1. AUTO-CLICKER: Clicks the Big Cookie ~30 times/second (Safe limit).
 * 2. GOLDEN COOKIES: Instantly clicks Golden Cookies, Reindeer, and Wrath Cookies.
 * 3. SMART PURCHASING: 
 * - Compares Buildings vs. Upgrades.
 * - Prioritizes "Kitten" upgrades (highest tier multipliers).
 * - Prioritizes "Clicking" upgrades (since the bot is clicking for you).
 * 4. COMBO ENGINE (Grimoire): 
 * - Detects when you have a "Frenzy" (x7 Production).
 * - Casts "Force the Hand of Fate" to try and stack a "Click Frenzy" (x777).
 * 5. WRINKLER MANAGER: 
 * - Tracks how many cookies Wrinklers have eaten.
 * - Pops them AUTOMATICALLY if their stored cookies are enough to buy the next target.
 * 6. SEASONAL: Auto-upgrades Santa and clicks the News Ticker for achievements.
 * * COMPATIBILITY:
 * - Works standalone.
 * - Works alongside "Game Compressor/Legacy Mod" (will simply buy faster).
 * * ============================================================================
 */

var AutoCookie = (function() {
    
    // --- CONFIGURATION ---
    var config = {
        clickSpeed: 33,        // ms between clicks (~30 clicks/sec)
        buyInterval: 500,      // ms between checking the store
        shimmerInterval: 500,  // ms between checking for Golden Cookies
        minigameInterval: 1000,// ms between checking Grimoire/Santa
        
        // HEURISTICS: How much we value specific types of upgrades
        // (1.0 = standard value. Higher = Bot wants it more.)
        weights: {
            kitten: 200.0,     // Kittens are exponential; BUY THEM IMMEDIATELY
            click: 50.0,       // Mouse upgrades are critical for auto-clicking
            building: 1.0,     // Standard buildings
            baseUpgrade: 1.5   // Standard upgrades are slightly better than buildings
        }
    };

    var intervals = {};
    
    // --- UI CREATION ---
    var hud = document.createElement('div');
    hud.id = "autocookie-hud-v5";
    hud.style.cssText = "position: fixed; top: 0; left: 0; z-index: 999999; background: rgba(10, 10, 10, 0.9); color: #ccc; padding: 10px; font-family: monospace; font-size: 11px; border-bottom-right-radius: 8px; border-right: 2px solid #666; border-bottom: 2px solid #666; pointer-events: none; min-width: 220px; box-shadow: 2px 2px 10px rgba(0,0,0,0.5);";
    document.body.appendChild(hud);

    function updateHUD(status, targetName, eta, wrinklerValue, comboStatus) {
        var bank = Game.cookies;
        var totalPotential = bank + wrinklerValue;
        
        hud.innerHTML = `
            <div style="border-bottom: 1px solid #444; margin-bottom: 5px; padding-bottom: 3px;">
                <b style="color:#fff;">AUTOCOOKIE v5</b> <span style="font-size:9px; color:#6f6;">[RUNNING]</span>
            </div>
            
            <div style="margin-bottom: 2px;">
                <span style="color:#aaa;">Target:</span> <b style="color:#ffcc00;">${targetName}</b>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color:#aaa;">Status:</span> ${status} 
                <span style="float:right; color:#fff;">${eta}</span>
            </div>

            <div style="border-top: 1px solid #333; margin-top: 5px; padding-top: 3px;">
                <div style="font-size: 10px;">
                    <span style="color:#aaa;">Wrinkler Bank:</span> 
                    <span style="color:${wrinklerValue > 0 ? '#ff6666' : '#666'};">${Beautify(wrinklerValue)}</span>
                </div>
                <div style="font-size: 10px;">
                    <span style="color:#aaa;">Grimoire:</span> 
                    <span style="color:${comboStatus.includes('Ready') ? '#66ff66' : '#888'};">${comboStatus}</span>
                </div>
            </div>
        `;
    }

    // --- 1. CLICKING ENGINE ---
    function startClicker() {
        intervals.clicker = setInterval(function() {
            try {
                // Big Cookie
                Game.ClickCookie();
                
                // News Ticker (Small chance to click for achievement)
                if (Game.Ticker && Math.random() < 0.05) Game.Ticker.click();
                
                // Sugar Lumps (Harvest if ripe)
                if (Game.time % 30 === 0) { // Check once a second
                    var age = Date.now() - Game.lumpT;
                    if (age > Game.lumpMature && Game.lumpCurrentType == 0) Game.clickLump();
                    else if (age > Game.lumpOverripe) Game.clickLump();
                }

            } catch (e) {}
        }, config.clickSpeed);
    }

    // --- 2. SHIMMER ENGINE (Golden Cookies) ---
    function startShimmer() {
        intervals.shimmer = setInterval(function() {
            try {
                if (Game.shimmers.length > 0) {
                    Game.shimmers.forEach(function(s) {
                        s.pop();
                    });
                }
            } catch (e) {}
        }, config.shimmerInterval);
    }

    // --- 3. LOGIC & BUYING ENGINE ---
    function startBuyer() {
        intervals.buyer = setInterval(function() {
            try {
                var bank = Game.cookies;
                var cps = Game.cookiesPs;
                var mouseCps = Game.computedMouseCps;
                
                // 30 clicks/sec adds massive production. We must account for this.
                var effectiveCps = cps + (mouseCps * (1000 / config.clickSpeed)); 
                if (effectiveCps === 0) effectiveCps = 0.1; // Prevent div by zero

                // --- WRINKLER CALCULATION ---
                var wrinklerTotal = 0;
                if (Game.wrinklers) {
                    Game.wrinklers.forEach(function(w) { 
                        if (w.close == 1) wrinklerTotal += w.sucked * 1.1; // 1.1x reward
                    });
                }

                // --- IDENTIFY BEST PURCHASE ---
                var bestItem = null;
                var bestPayback = Infinity; // Lower is better
                var itemType = "";

                // A. Check Buildings
                for (var i in Game.Objects) {
                    var obj = Game.Objects[i];
                    if (!obj.locked) {
                        var cost = obj.price;
                        var gain = (obj.storedCps > 0) ? obj.storedCps : 0.1;
                        
                        // Payback = Cost / Gain
                        // We divide payback by 'weight' to bias the bot towards preferred items
                        var payback = (cost / gain) / config.weights.building;
                        
                        if (payback < bestPayback) {
                            bestPayback = payback;
                            bestItem = obj;
                            itemType = "Building";
                        }
                    }
                }

                // B. Check Upgrades
                var upgrades = Game.UpgradesInStore;
                for (var i = 0; i < upgrades.length; i++) {
                    var u = upgrades[i];
                    
                    // Skip Grandmapocalypse trigger if you want a peaceful game? 
                    // Nah, let's optimize. Only skip if you hate it.
                    // if (u.name === "Communal brainsweep") continue;

                    var cost = u.getPrice();
                    var desc = u.desc.toLowerCase();
                    var name = u.name.toLowerCase();
                    
                    // Estimate Gain
                    var estimatedGain = effectiveCps * 0.1; // Default: 10% boost
                    var weight = config.weights.baseUpgrade;

                    if (name.includes("kitten")) {
                        // Kittens are massive. Assume 50% boost + High Weight
                        estimatedGain = effectiveCps * 0.5;
                        weight = config.weights.kitten;
                    } else if (desc.includes("clicking") || desc.includes("mouse") || name.includes("mouse")) {
                        // Click upgrades scale with our auto-clicker
                        estimatedGain = effectiveCps * 0.2;
                        weight = config.weights.click;
                    }

                    var payback = (cost / estimatedGain) / weight;

                    if (payback < bestPayback) {
                        bestPayback = payback;
                        bestItem = u;
                        itemType = "Upgrade";
                    }
                }

                // --- EXECUTE ---
                if (bestItem) {
                    var price = (itemType === "Building") ? bestItem.price : bestItem.getPrice();
                    var canAffordDirectly = bank >= price;
                    var canAffordWithWrinklers = (bank + wrinklerTotal) >= price;
                    
                    if (canAffordDirectly) {
                        // 1. Buy Normally
                        updateHUD("BUYING", bestItem.name, "Now", wrinklerTotal, getComboStatus());
                        bestItem.buy(1);
                    } 
                    else if (canAffordWithWrinklers) {
                        // 2. Cash out Wrinklers to buy NOW
                        updateHUD("POPPING WRINKLERS", bestItem.name, "Cashing Out", wrinklerTotal, getComboStatus());
                        Game.wrinklers.forEach(function(w) { if (w.close == 1) w.hp = 0; }); // Instant pop
                    } 
                    else {
                        // 3. Save
                        var needed = price - bank;
                        var timeToReady = Math.ceil(needed / effectiveCps);
                        var timeStr = timeToReady > 3600 ? "> 1h" : timeToReady + "s";
                        updateHUD("SAVING", bestItem.name, timeStr, wrinklerTotal, getComboStatus());
                    }
                }

            } catch (e) { console.error(e); }
        }, config.buyInterval);
    }

    // --- 4. MINIGAMES (The Combo Engine) ---
    function getComboStatus() {
        var wizard = Game.Objects['Wizard tower'];
        if (!wizard.minigameLoaded) return "Locked";
        var M = wizard.minigame;
        return (M.magic >= M.getSpellCost(M.spells['hand of fate'])) ? "Ready" : "Recharging (" + Math.floor(M.magic) + "/" + Math.floor(M.maxMagic) + ")";
    }

    function startMinigames() {
        intervals.minigame = setInterval(function() {
            try {
                // A. SANTA Auto-Upgrade
                if (Game.santa && Game.santa.level < 14) {
                    Game.specialTab('santa');
                    // Simple hack to trigger the upgrade slot if visible
                    var upgradeSlot = document.getElementById('santaDraft');
                    if (upgradeSlot) upgradeSlot.click();
                }

                // B. WIZARD TOWER (Frenzy Stacker)
                var wizard = Game.Objects['Wizard tower'];
                if (wizard.minigameLoaded) {
                    var M = wizard.minigame;
                    var cost = M.getSpellCost(M.spells['hand of fate']);
                    
                    if (M.magic >= cost) {
                        // Check for Frenzy Buff
                        var hasFrenzy = false;
                        for (var i in Game.buffs) {
                            if (Game.buffs[i].name == "Frenzy") hasFrenzy = true;
                        }

                        // If Frenzy is active, Cast "Hand of Fate" to try for Click Frenzy
                        if (hasFrenzy) {
                            M.castSpell(M.spells['hand of fate']);
                            console.log("AutoCookie: Cast Hand of Fate!");
                        }
                    }
                }

            } catch (e) {}
        }, config.minigameInterval);
    }

    // --- CONTROL ---
    function init() {
        console.log("--- AutoCookie v5 Initiated ---");
        startClicker();
        startShimmer();
        startBuyer();
        startMinigames();
    }

    function stop() {
        for (var i in intervals) clearInterval(intervals[i]);
        if(document.getElementById('autocookie-hud-v5')) {
            document.getElementById('autocookie-hud-v5').remove();
        }
        console.log("--- AutoCookie Stopped ---");
    }

    return {
        start: init,
        stop: stop
    };
})();

// AUTO-START
AutoCookie.start();

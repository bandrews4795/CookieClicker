/**
 * ============================================================================
 * AUTOCOOKIE v6 - ACTIVE MODE
 * ============================================================================
 * * UPDATES:
 * - Added 'maxWaitTime': Bot will NOT save for items that take too long.
 * - Added 'impulseBuy': Buying items is favored if they are cheap relative to bank.
 * * ============================================================================
 */

var AutoCookie = (function() {
    
    // --- CONFIGURATION ---
    var config = {
        clickSpeed: 50,        // Faster clicking (~20/sec to be safe)
        buyInterval: 500,      // Check store every 0.5s
        shimmerInterval: 500,  // Check Golden Cookies every 0.5s
        minigameInterval: 1000,
        
        // --- PATIENCE SETTINGS (The Fix) ---
        // The bot will ignore items that take longer than this to save for.
        // Set to 60 seconds to keep it buying frequently.
        maxWaitTime: 45, 

        // HEURISTICS
        weights: {
            kitten: 200.0,     // Always wait for Kittens
            click: 50.0,       // Mouse upgrades
            building: 1.0,     
            baseUpgrade: 2.0   // Prefer upgrades slightly more
        }
    };

    var intervals = {};
    
    // --- UI CREATION ---
    var hud = document.createElement('div');
    hud.id = "autocookie-hud-v6";
    hud.style.cssText = "position: fixed; top: 0; left: 0; z-index: 999999; background: rgba(10, 10, 10, 0.9); color: #ccc; padding: 10px; font-family: monospace; font-size: 11px; border-bottom-right-radius: 8px; border-right: 2px solid #444; border-bottom: 2px solid #444; pointer-events: none; min-width: 220px; box-shadow: 2px 2px 10px rgba(0,0,0,0.5);";
    document.body.appendChild(hud);

    function updateHUD(status, targetName, eta, wrinklerValue) {
        hud.innerHTML = `
            <div style="border-bottom: 1px solid #444; margin-bottom: 5px; padding-bottom: 3px;">
                <b style="color:#66ccff;">AUTOCOOKIE v6</b> <span style="font-size:9px; color:#6f6;">[ACTIVE]</span>
            </div>
            <div style="margin-bottom: 2px;">
                <span style="color:#aaa;">Target:</span> <b style="color:#ffcc00;">${targetName}</b>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color:#aaa;">Status:</span> ${status} 
                <span style="float:right; color:#fff;">${eta}</span>
            </div>
            <div style="font-size: 10px; border-top: 1px solid #333; padding-top:3px;">
                 Wrinklers: <span style="color:${wrinklerValue > 0 ? '#ff6666' : '#666'};">${Beautify(wrinklerValue)}</span>
            </div>
        `;
    }

    // --- 1. CLICKER ---
    function startClicker() {
        intervals.clicker = setInterval(function() {
            try {
                Game.ClickCookie();
                if (Game.Ticker && Math.random() < 0.05) Game.Ticker.click();
                
                if (Game.time % 30 === 0) { 
                    var age = Date.now() - Game.lumpT;
                    if (age > Game.lumpMature && Game.lumpCurrentType == 0) Game.clickLump();
                    else if (age > Game.lumpOverripe) Game.clickLump();
                }
            } catch (e) {}
        }, config.clickSpeed);
    }

    // --- 2. SHIMMERS ---
    function startShimmer() {
        intervals.shimmer = setInterval(function() {
            try {
                if (Game.shimmers.length > 0) Game.shimmers.forEach(s => s.pop());
            } catch (e) {}
        }, config.shimmerInterval);
    }

    // --- 3. ACTIVE BUYER ENGINE ---
    function startBuyer() {
        intervals.buyer = setInterval(function() {
            try {
                var bank = Game.cookies;
                var cps = Game.cookiesPs;
                var mouseCps = Game.computedMouseCps; 
                var effectiveCps = cps + (mouseCps * (1000 / config.clickSpeed)); 
                if (effectiveCps === 0) effectiveCps = 0.1;

                var wrinklerTotal = 0;
                if (Game.wrinklers) {
                    Game.wrinklers.forEach(function(w) { if (w.close == 1) wrinklerTotal += w.sucked * 1.1; });
                }

                var bestItem = null;
                var bestPayback = Infinity;
                var itemType = "";

                // --- EVALUATE BUILDINGS ---
                for (var i in Game.Objects) {
                    var obj = Game.Objects[i];
                    if (!obj.locked) {
                        var cost = obj.price;
                        
                        // TIMING CHECK (The Fix)
                        var timeToAfford = 0;
                        if (cost > (bank + wrinklerTotal)) {
                            timeToAfford = (cost - (bank + wrinklerTotal)) / effectiveCps;
                        }
                        
                        // If it takes too long, SKIP IT (unless it's ridiculously efficient)
                        if (timeToAfford > config.maxWaitTime) continue;

                        var gain = (obj.storedCps > 0) ? obj.storedCps : 0.1;
                        var payback = (cost / gain) / config.weights.building;
                        
                        if (payback < bestPayback) {
                            bestPayback = payback;
                            bestItem = obj;
                            itemType = "Building";
                        }
                    }
                }

                // --- EVALUATE UPGRADES ---
                var upgrades = Game.UpgradesInStore;
                for (var i = 0; i < upgrades.length; i++) {
                    var u = upgrades[i];
                    var cost = u.getPrice();
                    var name = u.name.toLowerCase();
                    var desc = u.desc.toLowerCase();

                    // TIMING CHECK
                    var timeToAfford = 0;
                    if (cost > (bank + wrinklerTotal)) {
                        timeToAfford = (cost - (bank + wrinklerTotal)) / effectiveCps;
                    }

                    // KITTEN EXCEPTION: We always wait for kittens.
                    var isKitten = name.includes("kitten");
                    
                    if (!isKitten && timeToAfford > config.maxWaitTime) continue;

                    var estimatedGain = effectiveCps * 0.1; 
                    var weight = config.weights.baseUpgrade;

                    if (isKitten) {
                        estimatedGain = effectiveCps * 0.5;
                        weight = config.weights.kitten;
                    } else if (desc.includes("clicking") || desc.includes("mouse") || name.includes("mouse")) {
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
                    
                    if (bank >= price) {
                        updateHUD("BUYING", bestItem.name, "Instant", wrinklerTotal);
                        bestItem.buy(1);
                    } 
                    else if ((bank + wrinklerTotal) >= price) {
                        updateHUD("POPPING", bestItem.name, "Wrinklers", wrinklerTotal);
                        Game.wrinklers.forEach(w => { if (w.close == 1) w.hp = 0; });
                    } 
                    else {
                        var needed = price - bank;
                        var timeToReady = Math.ceil(needed / effectiveCps);
                        updateHUD("SAVING", bestItem.name, timeToReady + "s", wrinklerTotal);
                    }
                } else {
                    updateHUD("IDLE", "None", "-", wrinklerTotal);
                }

            } catch (e) { console.error(e); }
        }, config.buyInterval);
    }

    // --- 4. MINIGAMES ---
    function startMinigames() {
        intervals.minigame = setInterval(function() {
            try {
                if (Game.santa && Game.santa.level < 14) {
                    Game.specialTab('santa');
                    var upgradeSlot = document.getElementById('santaDraft');
                    if (upgradeSlot) upgradeSlot.click();
                }
                var wizard = Game.Objects['Wizard tower'];
                if (wizard.minigameLoaded) {
                    var M = wizard.minigame;
                    if (M.magic >= M.getSpellCost(M.spells['hand of fate'])) {
                         var hasFrenzy = false;
                         for (var i in Game.buffs) if (Game.buffs[i].name == "Frenzy") hasFrenzy = true;
                         if (hasFrenzy) M.castSpell(M.spells['hand of fate']);
                    }
                }
            } catch (e) {}
        }, config.minigameInterval);
    }

    function init() {
        console.log("--- AutoCookie v6 (Active) Initiated ---");
        startClicker();
        startShimmer();
        startBuyer();
        startMinigames();
    }

    function stop() {
        for (var i in intervals) clearInterval(intervals[i]);
        if(document.getElementById('autocookie-hud-v6')) document.getElementById('autocookie-hud-v6').remove();
    }

    return { start: init, stop: stop };
})();

AutoCookie.start();

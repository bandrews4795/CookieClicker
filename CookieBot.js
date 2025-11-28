/**
 * ============================================================================
 * AUTOCOOKIE v6.4 - ANALYTICS EDITION
 * ============================================================================
 * * UPDATES:
 * - Added ROI Display: Shows seconds until the item pays for itself.
 * - Added Gain Display: Shows projected CpS increase (Flat number and %).
 * - Maintained Ascension Guard and Patience settings.
 * * ============================================================================
 */

var AutoCookie = (function() {
    
    // --- CONFIGURATION ---
    var config = {
        clickSpeed: 50,        // Faster clicking (~20/sec to be safe)
        buyInterval: 500,      // Check store every 0.5s
        shimmerInterval: 500,  // Check Golden Cookies every 0.5s
        minigameInterval: 1000,
        
        // --- PATIENCE SETTINGS ---
        maxWaitTime: 45,       // Regular items: 45s max wait
        kittenWaitTime: 300,   // Kittens: 5m max wait

        // HEURISTICS
        weights: {
            kitten: 200.0,
            click: 50.0,
            building: 1.0,     
            baseUpgrade: 2.0
        }
    };

    var intervals = {};
    
    // --- UI CREATION ---
    if (document.getElementById('autocookie-hud-v6')) {
        document.getElementById('autocookie-hud-v6').remove();
    }

    var hud = document.createElement('div');
    hud.id = "autocookie-hud-v6";
    hud.style.cssText = "position: fixed; top: 0; left: 0; z-index: 999999; background: rgba(10, 10, 10, 0.9); color: #ccc; padding: 10px; font-family: monospace; font-size: 11px; border-bottom-right-radius: 8px; border-right: 2px solid #444; border-bottom: 2px solid #444; pointer-events: none; min-width: 220px; box-shadow: 2px 2px 10px rgba(0,0,0,0.5);";
    document.body.appendChild(hud);

    function updateHUD(status, targetName, eta, wrinklerValue, isAscending, stats) {
        var titleColor = isAscending ? '#bd00ff' : '#66ccff'; 
        var statusColor = isAscending ? '#bd00ff' : '#aaa';
        
        // Build stats block if we have data
        var statsHTML = "";
        if (stats && targetName !== "Searching...") {
            statsHTML = `
                <div style="font-size: 10px; margin-bottom: 5px; color: #888;">
                    <div>ROI: <span style="color:#fff;">${Beautify(stats.roi)}s</span></div>
                    <div>Gain: <span style="color:#6f6;">+${Beautify(stats.gain)}</span> <span style="color:#6f6;">(+${stats.percent}%)</span></div>
                </div>
            `;
        }

        hud.innerHTML = `
            <div style="border-bottom: 1px solid #444; margin-bottom: 5px; padding-bottom: 3px;">
                <b style="color:${titleColor};">AUTOCOOKIE v6.4</b> <span style="font-size:9px; color:#6f6;">[ACTIVE]</span>
            </div>
            <div style="margin-bottom: 2px;">
                <span style="color:#aaa;">Target:</span> <b style="color:#ffcc00;">${targetName}</b>
            </div>
            <div style="margin-bottom: 2px;">
                <span style="color:${statusColor};">Status:</span> ${status} 
                <span style="float:right; color:#fff;">${eta}</span>
            </div>
            ${statsHTML}
            <div style="font-size: 10px; border-top: 1px solid #333; padding-top:3px;">
                 Wrinklers: <span style="color:${wrinklerValue > 0 ? '#ff6666' : '#666'};">${Beautify(wrinklerValue)}</span>
            </div>
        `;
    }

    // --- 1. CLICKER ---
    function startClicker() {
        intervals.clicker = setInterval(function() {
            try {
                if (Game.OnAscend) return; 

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
                if (Game.OnAscend) return;
                if (Game.shimmers.length > 0) Game.shimmers.forEach(s => s.pop());
            } catch (e) {}
        }, config.shimmerInterval);
    }

    // --- 3. ACTIVE BUYER ENGINE ---
    function startBuyer() {
        intervals.buyer = setInterval(function() {
            try {
                if (Game.OnAscend) {
                    updateHUD("PAUSED", "Heavenly Chips", "Ascending...", 0, true, null);
                    return;
                }

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
                
                // Track stats for the best item
                var bestStats = { gain: 0, cost: 0, percent: 0, roi: 0 };

                // --- EVALUATE BUILDINGS ---
                for (var i in Game.Objects) {
                    var obj = Game.Objects[i];
                    if (!obj.locked) {
                        var cost = obj.price;
                        
                        var timeToAfford = 0;
                        if (cost > (bank + wrinklerTotal)) {
                            timeToAfford = (cost - (bank + wrinklerTotal)) / effectiveCps;
                        }
                        
                        if (timeToAfford > config.maxWaitTime) continue;

                        var gain = (obj.storedCps > 0) ? obj.storedCps : 0.1;
                        var payback = (cost / gain) / config.weights.building;
                        
                        if (payback < bestPayback) {
                            bestPayback = payback;
                            bestItem = obj;
                            itemType = "Building";
                            bestStats.gain = gain;
                            bestStats.cost = cost;
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

                    var timeToAfford = 0;
                    if (cost > (bank + wrinklerTotal)) {
                        timeToAfford = (cost - (bank + wrinklerTotal)) / effectiveCps;
                    }

                    var isKitten = name.includes("kitten");
                    var limit = isKitten ? config.kittenWaitTime : config.maxWaitTime;

                    if (timeToAfford > limit) continue;

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
                        bestStats.gain = estimatedGain;
                        bestStats.cost = cost;
                    }
                }

                // --- EXECUTE ---
                if (bestItem) {
                    // Calculate final stats
                    bestStats.roi = Math.floor(bestStats.cost / bestStats.gain);
                    bestStats.percent = ((bestStats.gain / effectiveCps) * 100).toFixed(2);
                    if (isNaN(bestStats.percent)) bestStats.percent = "0.00";

                    var price = (itemType === "Building") ? bestItem.price : bestItem.getPrice();
                    
                    if (bank >= price) {
                        updateHUD("BUYING", bestItem.name, "Instant", wrinklerTotal, false, bestStats);
                        bestItem.buy(1);
                    } 
                    else if ((bank + wrinklerTotal) >= price) {
                        updateHUD("POPPING", bestItem.name, "Wrinklers", wrinklerTotal, false, bestStats);
                        Game.wrinklers.forEach(w => { if (w.close == 1) w.hp = 0; });
                    } 
                    else {
                        var needed = price - bank;
                        var timeToReady = Math.ceil(needed / effectiveCps);
                        
                        var timeStr = timeToReady + "s";
                        if (timeToReady > 60) timeStr = Math.floor(timeToReady/60) + "m " + (timeToReady%60) + "s";
                        
                        updateHUD("SAVING", bestItem.name, timeStr, wrinklerTotal, false, bestStats);
                    }
                } else {
                    updateHUD("IDLE", "Searching...", "-", wrinklerTotal, false, null);
                }

            } catch (e) { console.error(e); }
        }, config.buyInterval);
    }

    // --- 4. MINIGAMES ---
    function startMinigames() {
        intervals.minigame = setInterval(function() {
            try {
                if (Game.OnAscend) return;

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
        console.log("--- AutoCookie v6.4 (Analytics) Initiated ---");
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

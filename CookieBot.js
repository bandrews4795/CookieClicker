// --- AUTO COOKIE BOT v4 (Combo Master) ---

var AutoCookie = (function() {
    var config = {
        clickSpeed: 33,        // ~30 clicks/second
        buyInterval: 500,      // Market analysis speed
        shimmerInterval: 500,  // Golden cookie speed
        minigameInterval: 1000 // Check wizard towers/gardens
    };

    var intervals = {};
    
    // UI SETUP (Simplified for v4)
    var hud = document.createElement('div');
    hud.id = "autocookie-hud-v4";
    hud.style.cssText = "position: fixed; top: 0; left: 0; z-index: 100000; background: linear-gradient(135deg, #222, #444); color: #fff; padding: 10px; font-family: 'Tahoma', sans-serif; font-size: 11px; border-bottom-right-radius: 8px; box-shadow: 2px 2px 15px rgba(0,0,0,0.5); min-width: 200px; opacity: 0.9;";
    document.body.appendChild(hud);

    function updateHUD(status, target, detail, subdetail) {
        hud.innerHTML = `
            <div style="font-weight:bold; color:#ffcc00; border-bottom:1px solid #666; padding-bottom:3px; margin-bottom:5px;">🤖 AUTO COOKIE v4</div>
            <div style="display:flex; justify-content:space-between;"><span>Status:</span> <span style="font-weight:bold; color:${status === 'Active' ? '#6f6' : '#f66'}">${status}</span></div>
            <div style="margin-top:4px; color:#ddd;">Target: <span style="color:#fff; font-weight:bold;">${target}</span></div>
            <div style="font-size:10px; color:#aaa;">${detail}</div>
            <div style="font-size:10px; color:#888; margin-top:2px;">${subdetail}</div>
        `;
    }

    // 1. CLICKER
    function startClicking() {
        intervals.clicker = setInterval(function() {
            try { 
                Game.ClickCookie(); 
                // Also click the news ticker occasionally for the achievement
                if (Math.random() < 0.01 && Game.Ticker) Game.Ticker.click();
            } catch (e) {}
        }, config.clickSpeed);
    }

    // 2. SHIMMERS & WRINKLERS
    function startShimmer() {
        intervals.shimmer = setInterval(function() {
            // Pop Golden Cookies / Reindeer
            if (Game.shimmers.length > 0) {
                Game.shimmers.forEach(s => s.pop());
            }
            
            // Manage Wrinklers (Optional: Only pop if shiny? Nah, let's pop all for active play)
            // In active play (30 clicks/s), Wrinklers actually hurt because they don't multiply click buffs.
            // We keep them suppressed.
            if (Game.wrinklers) {
                Game.wrinklers.forEach(function(w) {
                    if (w.close == 1) w.hp--; // Attack the wrinkler
                });
            }
        }, config.shimmerInterval);
    }

    // 3. MINIGAME LOGIC (THE COMBO ENGINE)
    function startMinigames() {
        intervals.minigame = setInterval(function() {
            try {
                // -- GRIMOIRE (Wizard Tower) --
                var wizard = Game.Objects['Wizard tower'];
                if (wizard.level > 0 && wizard.minigameLoaded) {
                    var M = wizard.minigame;
                    var maxMana = M.maxMagic;
                    var currentMana = M.magic;
                    
                    // STRATEGY: 
                    // 1. If we have a FRENZY (x7), cast "Force the Hand of Fate" to try for Click Frenzy.
                    // 2. If no Frenzy but Mana is full (100%), cast "Conjure Baked Goods" to stop waste.
                    
                    var hasFrenzy = false;
                    for (var i in Game.buffs) {
                        if (Game.buffs[i].name == "Frenzy") hasFrenzy = true;
                    }

                    var spellCostFthof = M.getSpellCost(M.spells['hand of fate']);
                    var spellCostConjure = M.getSpellCost(M.spells['conjure baked goods']);

                    if (hasFrenzy && currentMana >= spellCostFthof) {
                        M.castSpell(M.spells['hand of fate']);
                        console.log("AutoCookie: Cast Hand of Fate during Frenzy!");
                    } else if (!hasFrenzy && currentMana >= (maxMana * 0.95) && currentMana >= spellCostConjure) {
                        // Cast Conjure just to burn mana efficiently
                        M.castSpell(M.spells['conjure baked goods']);
                    }
                }
                
                // -- LEVEL UP SANTA -- 
                if (Game.santa && Game.santa.level < 14) { // 14 is max
                     Game.specialTab('santa');
                     // This is tricky to click via code without DOM access, 
                     // usually requires emulating a click on the slot. 
                     // We'll skip complex DOM interaction for stability.
                }

            } catch (e) {}
        }, config.minigameInterval);
    }

    // 4. SMART BUYER (With Kitten Bias)
    function startBuyer() {
        intervals.buyer = setInterval(function() {
            try {
                var bank = Game.cookies;
                var passiveCps = Game.cookiesPs;
                var mouseCps = Game.computedMouseCps; 
                var activeClickCps = mouseCps * (1000/config.clickSpeed);
                var totalCps = passiveCps + activeClickCps;

                // Lag Prevention: If we are in a Click Frenzy (x777), DO NOT calculate/buy.
                // Just let the clicker run to save CPU.
                for (var i in Game.buffs) {
                    if (Game.buffs[i].name == "Click frenzy") {
                        updateHUD("Active", "Click Frenzy!", "Paused buying to maximize FPS", "Go go go!");
                        return;
                    }
                }

                // -- A. Buildings --
                var bestBuilding = null;
                var bestBuildingPayback = Infinity;
                for (var i in Game.Objects) {
                    var obj = Game.Objects[i];
                    if (!obj.locked) {
                        var cps = (obj.storedCps > 0) ? obj.storedCps : 0.1;
                        var payback = obj.price / cps;
                        if (payback < bestBuildingPayback) {
                            bestBuildingPayback = payback;
                            bestBuilding = obj;
                        }
                    }
                }

                // -- B. Upgrades (With BIAS) --
                var bestUpgrade = null;
                var bestUpgradePayback = Infinity;
                var isClickUpgrade = false;

                var upgrades = Game.UpgradesInStore;
                for (var i = 0; i < upgrades.length; i++) {
                    var u = upgrades[i];
                    if (u.name === "Communal brainsweep") continue; // Fear the grandmas?

                    var desc = u.desc.toLowerCase();
                    var estimatedGain = 0;

                    // BIAS 1: Kittens (Multiplicative = GOD TIER)
                    // We treat kittens as if they pay back 10x faster than reality to force a buy
                    if (u.name.includes("Kitten")) {
                         estimatedGain = totalCps * 0.5; // Assume massive 50% boost
                    } 
                    // BIAS 2: Click Upgrades
                    else if (desc.includes("clicking") || desc.includes("mouse")) {
                        estimatedGain = activeClickCps; // Assume it doubles click output
                        isClickUpgrade = true;
                    } 
                    // BIAS 3: Standard
                    else {
                        estimatedGain = totalCps * 0.05; // Conservative 5%
                    }

                    var payback = u.getPrice() / estimatedGain;
                    if (payback < bestUpgradePayback) {
                        bestUpgradePayback = payback;
                        bestUpgrade = u;
                    }
                }

                // -- C. Compare --
                var target = null;
                var targetType = "";
                
                // If upgrade payback is reasonably close to building payback, prefer upgrade
                // because upgrades scale better long term.
                if (bestUpgrade && bestUpgradePayback < bestBuildingPayback) {
                    target = bestUpgrade;
                    targetType = "Upgrade";
                } else {
                    target = bestBuilding;
                    targetType = "Building";
                }

                if (target) {
                    var price = target.price || target.getPrice();
                    if (price <= bank) {
                        updateHUD("Buying", target.name, targetType, "Payback: " + Math.floor(bestUpgradePayback||bestBuildingPayback));
                        target.buy(1);
                    } else {
                        var needed = price - bank;
                        var time = (totalCps > 0) ? Math.ceil(needed / totalCps) : "Inf";
                        updateHUD("Saving", target.name, time + "s remaining", "Efficient Choice");
                    }
                }

            } catch (err) { console.log(err); }
        }, config.buyInterval);
    }

    function init() {
        console.log("--- AutoCookie v4 (Combo Master) Started ---");
        startClicking();
        startShimmer();
        startMinigames();
        startBuyer();
    }

    function stop() {
        for (var i in intervals) clearInterval(intervals[i]);
        if(document.getElementById('autocookie-hud-v4')) document.getElementById('autocookie-hud-v4').remove();
        console.log("--- AutoCookie Stopped ---");
    }

    return { start: init, stop: stop };
})();

AutoCookie.start();

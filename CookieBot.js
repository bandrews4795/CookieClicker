// --- AUTO COOKIE BOT v3 (Smart Priority & Click Calc) ---

var AutoCookie = (function() {
    var config = {
        clickSpeed: 33,      // ~30 clicks/second
        buyInterval: 1000,   // Assess market every 1 second
        shimmerInterval: 500 // Click golden cookies every 0.5s
    };

    var intervals = {};
    
    // --- UI SETUP ---
    var hud = document.createElement('div');
    hud.id = "autocookie-hud";
    hud.style.cssText = "position: fixed; top: 0; left: 0; z-index: 100000; background: rgba(0,0,0,0.9); color: #fff; padding: 15px; font-family: monospace; font-size: 12px; border-bottom-right-radius: 8px; pointer-events: none; min-width: 300px; box-shadow: 0 0 10px #000;";
    hud.innerHTML = "Initializing AutoCookie v3...";
    document.body.appendChild(hud);

    function updateHUD(action, targetName, type, payback, timeToBuy) {
        var color = action === "BUYING" ? "#66ff66" : "#ffff66";
        hud.innerHTML = `
            <div style="font-weight:bold; color:#fff; border-bottom:1px solid #555; padding-bottom:5px; margin-bottom:5px;">[ SMART COOKIE BOT v3 ]</div>
            <div><span style="color:#aaa;">Action:</span> <span style="font-weight:bold; color:${color}">${action}</span></div>
            <div><span style="color:#aaa;">Target:</span> ${targetName}</div>
            <div><span style="color:#aaa;">Type:</span> ${type}</div>
            <div><span style="color:#aaa;">Est. ROI:</span> Pays off in ${payback}s</div>
            <div style="margin-top:5px; border-top:1px solid #333; padding-top:5px;">
                <span style="color:#aaa;">Wait Time:</span> ${timeToBuy}
            </div>
        `;
    }

    // 1. CLICKER (30/sec)
    function startClicking() {
        intervals.clicker = setInterval(function() {
            try { Game.ClickCookie(); } catch (e) {}
        }, config.clickSpeed);
    }

    // 2. GOLDEN COOKIES
    function startShimmerClicker() {
        intervals.shimmer = setInterval(function() {
            try {
                if (Game.shimmers.length > 0) {
                    Game.shimmers.forEach(s => s.pop());
                }
            } catch (e) {}
        }, config.shimmerInterval);
    }

    // 3. SMART BUYER
    function startBuyer() {
        intervals.buyer = setInterval(function() {
            try {
                var bank = Game.cookies;
                var passiveCps = Game.cookiesPs;
                var mouseCps = Game.computedMouseCps; 
                var clickRate = 1000 / config.clickSpeed; // ~30
                var activeClickCps = mouseCps * clickRate; // Total CpS from clicking
                var totalCps = passiveCps + activeClickCps;

                // --- A. EVALUATE BUILDINGS ---
                var bestBuilding = null;
                var bestBuildingPayback = Infinity;

                for (var i in Game.Objects) {
                    var obj = Game.Objects[i];
                    if (!obj.locked) {
                        // How much CpS does this building actually give?
                        var buildingCps = (obj.storedCps > 0) ? obj.storedCps : 0.1;
                        // Payback = Price / CpS gain
                        var payback = obj.price / buildingCps;
                        
                        if (payback < bestBuildingPayback) {
                            bestBuildingPayback = payback;
                            bestBuilding = obj;
                        }
                    }
                }

                // --- B. EVALUATE UPGRADES ---
                var bestUpgrade = null;
                var bestUpgradePayback = Infinity;
                var isClickUpgrade = false;

                var upgrades = Game.UpgradesInStore;
                for (var i = 0; i < upgrades.length; i++) {
                    var u = upgrades[i];
                    
                    // Skip Grandmapocalypse if desired
                    if (u.name === "Communal brainsweep") continue;

                    var estimatedGain = 0;
                    var desc = u.desc.toLowerCase();
                    
                    // HEURISTIC 1: CLICK UPGRADES
                    // If it mentions mouse/clicking/cursor, we assume it boosts clicking.
                    // Most click upgrades double the mouse.
                    if (desc.includes("clicking") || desc.includes("mouse") || u.name.includes("mouse")) {
                        // Gain = Current Click Power * 30 (Assuming a 100% boost or significant add)
                        // This prioritizes click upgrades heavily, which is correct for active play.
                        estimatedGain = activeClickCps; 
                        var payback = u.getPrice() / estimatedGain;
                        
                        if (payback < bestUpgradePayback) {
                            bestUpgradePayback = payback;
                            bestUpgrade = u;
                            isClickUpgrade = true;
                        }
                    } 
                    // HEURISTIC 2: STANDARD UPGRADES
                    // Hard to calc exact math. We assume they are "Worth it" if they are cheap.
                    // We assign them a synthetic payback based on current CpS.
                    else {
                        // We assume a generic upgrade gives roughly a 10% boost to global CpS (conservative estimate)
                        // This prevents buying expensive useless upgrades, but buys cheap ones.
                        estimatedGain = totalCps * 0.10; 
                        var payback = u.getPrice() / estimatedGain;
                        
                        // We penalize unknown upgrades slightly to prefer sure-thing buildings
                        if (payback < bestUpgradePayback) {
                            bestUpgradePayback = payback;
                            bestUpgrade = u;
                            isClickUpgrade = false;
                        }
                    }
                }

                // --- C. COMPARE AND DECIDE ---
                // We have the best building (math accurate) vs best upgrade (heuristic estimated)
                
                var target = null;
                var targetType = "";
                var targetPayback = 0;

                // If upgrade pays back faster than building, choose upgrade
                if (bestUpgrade && bestUpgradePayback < bestBuildingPayback) {
                    target = bestUpgrade;
                    targetType = isClickUpgrade ? "Upgrade (Click Booster)" : "Upgrade (Passive Boost)";
                    targetPayback = bestUpgradePayback;
                } else {
                    target = bestBuilding;
                    targetType = "Building (Passive CpS)";
                    targetPayback = bestBuildingPayback;
                }

                // --- D. EXECUTE ---
                if (target) {
                    var price = target.price || target.getPrice(); // Buildings use .price, Upgrades use .getPrice()
                    var timeToAfford = 0;
                    
                    if (price <= bank) {
                        updateHUD("BUYING", target.name, targetType, Math.floor(targetPayback), "NOW");
                        target.buy(1);
                    } else {
                        // Calculate wait time based on Total CpS (Active + Passive)
                        var needed = price - bank;
                        timeToAfford = (totalCps > 0) ? Math.ceil(needed / totalCps) : "Inf";
                        updateHUD("SAVING", target.name, targetType, Math.floor(targetPayback), timeToAfford + "s");
                    }
                }

            } catch (err) {
                console.log(err);
            }
        }, config.buyInterval);
    }

    function init() {
        console.log("--- AutoCookie v3 Started ---");
        startClicking();
        startShimmerClicker();
        startBuyer();
    }

    function stop() {
        clearInterval(intervals.clicker);
        clearInterval(intervals.shimmer);
        clearInterval(intervals.buyer);
        if(document.getElementById('autocookie-hud')) {
            document.getElementById('autocookie-hud').remove();
        }
        console.log("--- AutoCookie Stopped ---");
    }

    return {
        start: init,
        stop: stop
    };
})();

AutoCookie.start();

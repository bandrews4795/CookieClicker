var GameCompressor = {};

GameCompressor.init = function() {
    // ============================================
    // --- CONFIGURATION ---
    // ============================================
    
    var config = {
        // --- 1. THE MULTIPLIER (Polynomial / "Legacy" Style) ---
        // Formula: (Total Hours Played / Divisor) ^ Power
        // 3600 divisor + 2.2 power = Balanced progression.
        timeUnitDivisor: 3600, 
        exponent: 2.2, 
        
        // --- 2. THE TIME SKIP (Safe Mode) ---
        // How many seconds of "Waiting" to skip per click.
        // Lowered to 0.5 for stability. 
        // 0.5 * 30 clicks/sec = 15x Speed on Lumps/Research.
        secondsSkippedPerClick: 0.5,

        // --- 3. SAFETY SWITCHES ---
        // Auto-Harvest Lumps? (Highly Recommended)
        autoHarvestLumps: true,
        
        // If TRUE, we strictly avoid touching Global Time to protect achievements.
        // If FALSE, we warp everything (Riskier).
        protectAchievements: true 
    };

    // ============================================
    // --- ENGINE ---
    // ============================================
    
    this.currentMult = 1;
    this.simulatedSpeed = 0;
    this.clickTracker = 0;

    // --- HELPER: Get Multiplier based on Save Age ---
    this.getMult = function() {
        var totalSeconds = (Date.now() - Game.fullDate) / 1000;
        if (totalSeconds < 1) totalSeconds = 1;
        var units = totalSeconds / config.timeUnitDivisor;
        var mult = Math.pow(units, config.exponent);
        return (mult < 1) ? 1 : mult;
    };

    // --- 1. LOGIC LOOP (30fps) ---
    Game.registerHook('logic', function() {
        // Update Multiplier
        GameCompressor.currentMult = GameCompressor.getMult();

        // Speedometer Reset (Every 30 ticks = 1 second)
        if (Game.time % 30 == 0) {
            GameCompressor.simulatedSpeed = GameCompressor.clickTracker * config.secondsSkippedPerClick;
            GameCompressor.clickTracker = 0;

            // Auto-Harvest Logic
            if (config.autoHarvestLumps) {
                var age = Date.now() - Game.lumpT;
                // Harvest Mature (Type 0 = Normal)
                if (age > Game.lumpMature && Game.lumpCurrentType == 0) Game.clickLump();
                // Harvest Overripe (Special Lumps)
                else if (age > Game.lumpOverripe) Game.clickLump();
            }
        }
    });

    // --- 2. CLICK HOOK (Selective Time Warp) ---
    Game.registerHook('click', function() {
        GameCompressor.clickTracker++;
        var timeToSkip = config.secondsSkippedPerClick * 1000; // ms conversion
        var framesToSkip = (timeToSkip / 1000) * 30; // frame conversion

        // --- SAFE ZONE: Only touch "Waiting" variables ---
        
        // 1. Sugar Lumps (Safe)
        if (Game.canLumps()) {
            Game.lumpT -= timeToSkip;
        }

        // 2. Research Timer (Safe)
        // Only skip if research is actively happening
        if (Game.researchT > 0) {
            Game.researchT -= framesToSkip;
        }

        // 3. Pledge Timer (Grandmapocalypse) (Safe)
        if (Game.pledgeT > 0) {
            Game.pledgeT -= framesToSkip;
        }

        // 4. Wrinkler Spawns (Safe)
        if (Game.wrinklerRespawns > 0) {
            Game.wrinklerRespawns -= framesToSkip;
        }

        // --- DANGER ZONE: Things we intentionally DO NOT touch ---
        if (!config.protectAchievements) {
            // These are only modified if you disable protection.
            // Modifying these can break "Golden Cookie" spawns and "Just Plain Lucky".
            // Game.shimmerTypes.golden.time -= framesToSkip; 
            // Game.buffs...
        }
    });

    // --- 3. CPS INJECTION ---
    Game.registerHook('cps', function(cps) {
        return cps * GameCompressor.currentMult;
    });

    // --- 4. HUD DISPLAY ---
    setInterval(function() {
        if (Game.onMenu == 'stats') {
            var listings = document.getElementsByClassName('listing');
            for (var i = 0; i < listings.length; i++) {
                var el = listings[i];
                if (el.innerHTML.indexOf('Cookies per second') !== -1) {
                    var cheatSpan = document.getElementById('compressor-display');
                    
                    var multText = Beautify(Math.round(GameCompressor.currentMult * 100));
                    var speedVal = Math.round(GameCompressor.simulatedSpeed);
                    
                    var hudHTML = `
                        <div style="
                            background: rgba(0, 0, 0, 0.5); 
                            border-left: 4px solid #00ff00; 
                            padding: 4px 8px; 
                            margin-top: 6px; 
                            font-family: monospace;
                            font-size: 11px; 
                            color: #aaa;
                            width: fit-content;">
                            <div style="color: #fff; font-weight: bold; margin-bottom: 2px;">
                                LEGACY MOD v7 (Safe Mode)
                            </div>
                            <div>Mult: <span style="color:#f0f; font-weight:bold;">${multText}%</span></div>
                            <div>Warp Speed: <span style="color:#00ff00; font-weight:bold;">${speedVal}x</span></div>
                            <div style="font-size:9px; margin-top:2px;">(Achievements Protected)</div>
                        </div>
                    `;

                    if (!cheatSpan) {
                        var smallTag = el.getElementsByTagName('small')[0];
                        var container = document.createElement('div');
                        container.id = "compressor-display";
                        container.innerHTML = hudHTML;
                        
                        if (smallTag) smallTag.appendChild(container);
                        else el.appendChild(container);
                    } else {
                        cheatSpan.innerHTML = hudHTML;
                    }
                }
            }
        }
    }, 1000);

    console.log("Legacy Mod v7 (Safe Mode) Loaded.");
};

GameCompressor.init();

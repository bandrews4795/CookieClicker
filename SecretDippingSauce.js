var GameCompressor = {};

GameCompressor.init = function() {
    // ============================================
    // --- CONFIGURATION: FUN MODE ---
    // ============================================
    
    var config = {
        // --- 1. CORE MULTIPLIER (Legacy Strength) ---
        // Formula: (Total Hours Played / Divisor) ^ Power
        timeUnitDivisor: 3600, 
        exponent: 2.2, 
        
        // --- 2. TIME WARP (The Engine) ---
        secondsSkippedPerClick: 0.5, // 0.5s skip per click (15x speed at 30cps)

        // --- 3. FUN MODE FEATURES (The New Stuff) ---
        
        // "Golden Trigger": Clicking reduces Golden Cookie spawn timer?
        // (WARNING: Causes massive buff stacking)
        goldenTrigger: true, 

        // "Garden Grover": Clicking speeds up Garden plant growth?
        gardenGrover: true,

        // "Perfect Magic": Force Grimoire spells to NEVER fail/backfire?
        perfectMagic: true,

        // "Shiny Hunter": Instantly pop Normal wrinklers, Protect Shiny ones?
        shinyHunter: true,

        // "Lucky Breaks": Force 'Botched' lumps to be 'Golden' or 'Bifurcated'?
        luckyBreaks: true,
        
        // --- 4. BASICS ---
        autoHarvestLumps: true,
        protectAchievements: true 
    };

    // ============================================
    // --- ENGINE ---
    // ============================================
    
    this.currentMult = 1;
    this.simulatedSpeed = 0;
    this.clickTracker = 0;

    // --- HELPER: Multiplier Calc ---
    this.getMult = function() {
        var totalSeconds = (Date.now() - Game.fullDate) / 1000;
        if (totalSeconds < 1) totalSeconds = 1;
        var units = totalSeconds / config.timeUnitDivisor;
        var mult = Math.pow(units, config.exponent);
        return (mult < 1) ? 1 : mult;
    };

    // --- 1. LOGIC LOOP (30fps) ---
    Game.registerHook('logic', function() {
        // A. Multiplier
        GameCompressor.currentMult = GameCompressor.getMult();

        // B. Speedometer
        if (Game.time % 30 == 0) {
            GameCompressor.simulatedSpeed = GameCompressor.clickTracker * config.secondsSkippedPerClick;
            GameCompressor.clickTracker = 0;

            // Auto-Harvest Lumps
            if (config.autoHarvestLumps) {
                var age = Date.now() - Game.lumpT;
                if (age > Game.lumpMature && Game.lumpCurrentType == 0) Game.clickLump();
                else if (age > Game.lumpOverripe) Game.clickLump();
            }
        }

        // C. Shiny Hunter (Logic Tick)
        if (config.shinyHunter && Game.wrinklers) {
            Game.wrinklers.forEach(function(w) {
                // Type 0 = Normal, Type 1 = Shiny
                // If it's Normal and close enough to be popped
                if (w.phase == 2 && w.type == 0) {
                    w.hp = 0; // Instant Pop
                }
            });
        }

        // D. Perfect Magic (Grimoire Hack)
        if (config.perfectMagic) {
            var wizard = Game.Objects['Wizard tower'];
            if (wizard.minigameLoaded && wizard.minigame) {
                // Override the fail chance function constantly
                wizard.minigame.getFailChance = function(spell) { return 0; };
            }
        }

        // E. Lucky Breaks (Lump RNG Manipulation)
        if (config.luckyBreaks) {
            // Type 3 is Botched (Bad). Type 4 is Golden (Good). Type 1 is Bifurcated (Good).
            if (Game.lumpCurrentType == 3) {
                // Flip a coin for Golden or Bifurcated
                Game.lumpCurrentType = (Math.random() < 0.5) ? 1 : 4;
                // Force a redraw of the lump icon
                if (Game.lumpRef) Game.lumpRef.className = 'lump lump-'+Game.lumpCurrentType;
            }
        }
    });

    // --- 2. CLICK HOOK (The Fun Mode Triggers) ---
    Game.registerHook('click', function() {
        GameCompressor.clickTracker++;
        var timeToSkip = config.secondsSkippedPerClick * 1000; // ms
        var framesToSkip = (timeToSkip / 1000) * 30; // frames

        // 1. Standard Safe Warps (Lumps, Research, Pledges, Wrinklers)
        if (Game.canLumps()) Game.lumpT -= timeToSkip;
        if (Game.researchT > 0) Game.researchT -= framesToSkip;
        if (Game.pledgeT > 0) Game.pledgeT -= framesToSkip;
        if (Game.wrinklerRespawns > 0) Game.wrinklerRespawns -= framesToSkip;

        // 2. The Golden Trigger (Modifies Golden Cookie Spawn Time)
        if (config.goldenTrigger) {
             // We only subtract time if we are waiting for one to spawn
             // (shimmerTypes.golden.time is the counter UP to maxTime)
             // Actually in code: time increases until it hits maxTime.
             Game.shimmerTypes.golden.time += framesToSkip;
        }

        // 3. Garden Grover (Speeds up Garden Ticks)
        if (config.gardenGrover) {
            var farm = Game.Objects['Farm'];
            if (farm.minigameLoaded && farm.minigame) {
                // M.nextStep is the timestamp (Date.now()) when the next tick happens.
                // We lower this timestamp effectively bringing the future closer.
                farm.minigame.nextStep -= timeToSkip;
            }
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
                            background: linear-gradient(90deg, rgba(0,0,0,0.5), rgba(50,0,50,0.5)); 
                            border-left: 4px solid #ffcc00; 
                            padding: 5px 10px; 
                            margin-top: 6px; 
                            font-family: monospace;
                            font-size: 11px; 
                            color: #ccc;
                            box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
                            width: fit-content;">
                            <div style="color: #ffcc00; font-weight: bold; margin-bottom: 3px; border-bottom:1px solid #555;">
                                LEGACY MOD v8 (FUN MODE)
                            </div>
                            <div>Mult: <span style="color:#f0f; font-weight:bold;">${multText}%</span></div>
                            <div>Warp: <span style="color:#00ff00; font-weight:bold;">${speedVal}x</span></div>
                            <div style="font-size:9px; color:#888; margin-top:3px;">
                                [${config.goldenTrigger ? 'GOLD' : '-'}] 
                                [${config.shinyHunter ? 'SHINY' : '-'}] 
                                [${config.perfectMagic ? 'MAGIC' : '-'}]
                                [${config.gardenGrover ? 'GARDEN' : '-'}]
                            </div>
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

    console.log("Legacy Mod v8 (Fun Mode) Loaded.");
};

GameCompressor.init();

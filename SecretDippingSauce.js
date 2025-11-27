var GameCompressor = {};

GameCompressor.init = function() {
    // ============================================
    // --- CONFIGURATION (BALANCED FOR AUTO-CLICKERS) ---
    // ============================================
    
    var config = {
        // --- MULTIPLIER (The Passive Buff) ---
        // Your CpS grows by this factor every X real-time seconds.
        // Kept separate from time-warp to prevent immediate math overflow.
        growthFactor: 1.5, 
        secondsToReach: 600, // Every 10 minutes, multiply CpS by 1.5x
        maxMultiplier: 1000000000, // Cap at 1 Billion x

        // --- TIME WARP (The Active Buff) ---
        // Assuming 30 clicks/second from your bot:
        // 2.0 = 60x Speed (1 Real Min = 1 Game Hour)
        // 0.5 = 15x Speed (1 Real Min = 15 Game Mins)
        secondsSkippedPerClick: 2.0,

        // --- AUTOMATION ---
        // Since lumps ripen fast, we must auto-harvest them 
        // to prevent waste.
        autoHarvestLumps: true 
    };

    // ============================================
    // --- ENGINE & STATE ---
    // ============================================
    
    var totalTicks = config.secondsToReach * 30;
    var perTickRate = Math.pow(config.growthFactor, 1 / totalTicks);

    this.secretMult = 1;
    this.simulatedSpeed = 0;
    this.clickTracker = 0; // To calculate speed for HUD

    // --- 1. LOGIC LOOP (30fps) ---
    Game.registerHook('logic', function() {
        
        // A. Passive Multiplier Growth (Real-time based)
        GameCompressor.secretMult *= perTickRate;
        if (GameCompressor.secretMult > config.maxMultiplier) {
            GameCompressor.secretMult = config.maxMultiplier;
        }

        // B. Speedometer Reset
        // Every second (roughly 30 ticks), reset the click tracker
        if (Game.time % 30 == 0) {
            // Clicks this sec * Skipped time = Game Seconds per Real Second
            GameCompressor.simulatedSpeed = GameCompressor.clickTracker * config.secondsSkippedPerClick;
            GameCompressor.clickTracker = 0;
        }

        // C. Auto-Harvest Lumps
        if (config.autoHarvestLumps && Game.time % 30 == 0) { // Check once a second
            var age = Date.now() - Game.lumpT;
            if (age > Game.lumpMature && Game.lumpCurrentType == 0) {
                 // Normal lumps: harvest immediately when mature
                 Game.clickLump();
            } else if (age > Game.lumpOverripe) {
                 // Special lumps (bifurcated/meaty): Wait until ripe to avoid botching
                 Game.clickLump();
            }
        }
    });

    // --- 2. CLICK HOOK (The Engine) ---
    Game.registerHook('click', function() {
        GameCompressor.clickTracker++; // Track for speedometer

        var timeToSkip = config.secondsSkippedPerClick * 1000; // ms
        
        // A. Accelerate Lumps
        if (Game.canLumps()) {
            Game.lumpT -= timeToSkip;
        }

        // B. Accelerate Research & Pledges (Frames)
        var framesToSkip = (timeToSkip / 1000) * 30;
        if (Game.researchT > 0) Game.researchT -= framesToSkip;
        if (Game.pledgeT > 0) Game.pledgeT -= framesToSkip;
        if (Game.wrinklerRespawns > 0) Game.wrinklerRespawns -= framesToSkip;
        
        // C. Accelerate Buffs (Optional)
        // If you want Frenzies to last longer relative to game time, do nothing.
        // If you want Frenzies to expire fast like the rest of the world, uncomment this:
        /*
        for (var i in Game.buffs) {
            if (Game.buffs[i].time > 0) Game.buffs[i].time -= framesToSkip;
        }
        */
    });

    // --- 3. CPS INJECTION ---
    Game.registerHook('cps', function(cps) {
        return cps * GameCompressor.secretMult;
    });

    // --- 4. HUD DISPLAY ---
    setInterval(function() {
        if (Game.onMenu == 'stats') {
            var listings = document.getElementsByClassName('listing');
            for (var i = 0; i < listings.length; i++) {
                var el = listings[i];
                if (el.innerHTML.indexOf('Cookies per second') !== -1) {
                    var cheatSpan = document.getElementById('compressor-display');
                    
                    // Format the Multiplier
                    var multText = Beautify(Math.round(GameCompressor.secretMult * 100));
                    
                    // Format the Speed
                    // If speed is 0 (idle), show 1x (Normal Speed)
                    var speedVal = GameCompressor.simulatedSpeed < 1 ? 1 : Math.round(GameCompressor.simulatedSpeed);
                    var speedColor = speedVal > 50 ? '#ff0000' : '#00ff00';
                    
                    var hudHTML = `
                        <div style="
                            background: rgba(0,0,0,0.2); 
                            border: 1px solid #444; 
                            border-radius: 4px; 
                            padding: 5px; 
                            margin-top: 5px; 
                            font-size: 11px; 
                            color: #ccc;
                            width: fit-content;">
                            <div style="border-bottom: 1px solid #555; margin-bottom: 3px; padding-bottom: 2px;">
                                <b>GAME COMPRESSOR v5</b>
                            </div>
                            <div>Multiplier: <span style="color:#f0f; font-weight:bold;">${multText}%</span></div>
                            <div>Sim Speed: <span style="color:${speedColor}; font-weight:bold;">${speedVal}x</span></div>
                            <div style="font-size:9px; color:#666;">(Autosaving Lumps: ${config.autoHarvestLumps ? 'ON' : 'OFF'})</div>
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

    console.log("Game Compressor v5 Loaded. Ready for Auto-Clicker.");
};

GameCompressor.init();

var GameCompressor = {};

GameCompressor.init = function() {
    // ============================================
    // --- 1. CONFIGURATION (Default Values) ---
    // ============================================
    var config = {
        // Base Math
        timeUnitDivisor: 3600, 
        exponent: 2.2, 
        secondsSkippedPerClick: 0.5,
        
        // Fun Mode Features
        goldenTrigger: true,      // Spawns Golden Cookies faster
        timeDilator: true,        // NEW: Extends active buffs on click
        
        gardenGrover: true,       // Speeds up Garden
        turboMarket: true,        // NEW: Speeds up Stock Market
        
        perfectMagic: true,       // No Backfires
        manaOverload: true,       // NEW: Regens Mana on click
        
        shinyHunter: true,        // Filters Wrinklers
        luckyBreaks: true,        // Fixes bad Lumps
        
        // Safety / Utility
        autoHarvestLumps: true,
        protectAchievements: true,
        neverClickMode: false
    };

    // ============================================
    // --- 2. UI CONSTRUCTION ---
    // ============================================
    if (document.getElementById('legacy-mod-hud')) {
        document.getElementById('legacy-mod-hud').remove();
    }

    var hud = document.createElement('div');
    hud.id = "legacy-mod-hud";
    hud.style.cssText = `
        position: fixed; top: 0; right: 0; z-index: 100000; 
        background: rgba(10, 10, 10, 0.95); 
        border-left: 2px solid #ffcc00; border-bottom: 2px solid #ffcc00; 
        border-bottom-left-radius: 8px; color: #ccc; 
        font-family: 'Tahoma', sans-serif; font-size: 11px; 
        box-shadow: -2px 2px 10px rgba(0,0,0,0.5);
        display: flex; flex-direction: column; width: 230px;
    `;

    // --- Header ---
    var header = document.createElement('div');
    header.style.cssText = "padding: 8px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444;";
    header.innerHTML = '<b style="color:#ffcc00;">LEGACY MOD v10</b>';
    
    var settingsBtn = document.createElement('button');
    settingsBtn.innerHTML = "⚙";
    settingsBtn.style.cssText = "background:none; border:none; color:#fff; cursor:pointer; font-size:14px;";
    settingsBtn.onclick = function() {
        var p = document.getElementById('legacy-settings-panel');
        p.style.display = (p.style.display === 'none') ? 'block' : 'none';
    };
    header.appendChild(settingsBtn);
    hud.appendChild(header);

    // --- Stats Display ---
    var statsPanel = document.createElement('div');
    statsPanel.style.padding = "8px";
    statsPanel.innerHTML = `
        <div style="margin-bottom:4px;">Multiplier: <span id="leg-mult" style="color:#f0f; font-weight:bold;">100%</span></div>
        <div style="margin-bottom:4px;">Warp Speed: <span id="leg-speed" style="color:#0f0; font-weight:bold;">0x</span></div>
        <div id="leg-badges" style="font-size:9px; color:#666; margin-top:6px; line-height:1.4em;">LOADING...</div>
    `;
    hud.appendChild(statsPanel);

    // --- Settings Panel ---
    var settingsPanel = document.createElement('div');
    settingsPanel.id = "legacy-settings-panel";
    settingsPanel.style.cssText = "padding: 8px; background: rgba(30,30,30,0.95); border-top: 1px solid #444; display: none; max-height: 400px; overflow-y: auto;";
    
    function createToggle(label, key) {
        var row = document.createElement('div');
        row.style.marginBottom = "4px";
        var chk = document.createElement('input');
        chk.type = "checkbox";
        chk.checked = config[key];
        chk.style.marginRight = "6px";
        chk.onchange = function() { config[key] = chk.checked; };
        var lbl = document.createElement('span');
        lbl.innerText = label;
        row.appendChild(chk);
        row.appendChild(lbl);
        return row;
    }

    function createInput(label, key, step) {
        var row = document.createElement('div');
        row.style.marginBottom = "4px";
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        var lbl = document.createElement('span');
        lbl.innerText = label;
        var inp = document.createElement('input');
        inp.type = "number";
        inp.value = config[key];
        inp.step = step;
        inp.style.width = "50px";
        inp.style.background = "#222";
        inp.style.border = "1px solid #555";
        inp.style.color = "#fff";
        inp.onchange = function() { config[key] = parseFloat(inp.value); };
        row.appendChild(lbl);
        row.appendChild(inp);
        return row;
    }

    // --- Add Controls ---
    settingsPanel.appendChild(createInput("Warp (Sec/Click)", "secondsSkippedPerClick", 0.1));
    settingsPanel.appendChild(createInput("Difficulty Exp", "exponent", 0.1));
    settingsPanel.appendChild(document.createElement('hr'));
    
    // Fun Mode Toggles
    settingsPanel.appendChild(createToggle("Golden Trigger", "goldenTrigger"));
    settingsPanel.appendChild(createToggle("Time Dilator (Infinite Buffs)", "timeDilator"));
    settingsPanel.appendChild(createToggle("Garden Grover", "gardenGrover"));
    settingsPanel.appendChild(createToggle("Turbo Market", "turboMarket"));
    settingsPanel.appendChild(createToggle("Perfect Magic", "perfectMagic"));
    settingsPanel.appendChild(createToggle("Mana Overload", "manaOverload"));
    settingsPanel.appendChild(createToggle("Shiny Hunter", "shinyHunter"));
    settingsPanel.appendChild(createToggle("Lucky Breaks", "luckyBreaks"));
    
    // Safety & Utility Toggles
    settingsPanel.appendChild(document.createElement('hr'));
    settingsPanel.appendChild(createToggle("Auto-Harvest Lumps", "autoHarvestLumps"));
    settingsPanel.appendChild(createToggle("Safe Mode (Achievements)", "protectAchievements"));
    settingsPanel.appendChild(createToggle("Neverclick Mode", "neverClickMode"));
    
    hud.appendChild(settingsPanel);
    document.body.appendChild(hud);

    // ============================================
    // --- 3. ENGINE LOGIC ---
    // ============================================
    
    this.currentMult = 1;
    this.simulatedSpeed = 0;
    this.clickTracker = 0;

    this.getMult = function() {
        var totalSeconds = (Date.now() - Game.fullDate) / 1000;
        if (totalSeconds < 1) totalSeconds = 1;
        var units = totalSeconds / config.timeUnitDivisor;
        var mult = Math.pow(units, config.exponent);
        return (mult < 1) ? 1 : mult;
    };

    Game.registerHook('logic', function() {
        GameCompressor.currentMult = GameCompressor.getMult();

        // Speedometer & Auto-Harvest
        if (Game.time % 30 == 0) {
            GameCompressor.simulatedSpeed = GameCompressor.clickTracker * config.secondsSkippedPerClick;
            GameCompressor.clickTracker = 0;

            if (config.autoHarvestLumps) {
                var age = Date.now() - Game.lumpT;
                if (age > Game.lumpMature && Game.lumpCurrentType == 0) Game.clickLump();
                else if (age > Game.lumpOverripe) Game.clickLump();
            }
        }

        // Shiny Hunter
        if (config.shinyHunter && Game.wrinklers) {
            Game.wrinklers.forEach(function(w) {
                if (w.phase == 2 && w.type == 0) w.hp = 0;
            });
        }

        // Perfect Magic
        if (config.perfectMagic) {
            var wizard = Game.Objects['Wizard tower'];
            if (wizard.minigameLoaded && wizard.minigame) {
                wizard.minigame.getFailChance = function() { return 0; };
            }
        }

        // Lucky Breaks
        if (config.luckyBreaks && Game.lumpCurrentType == 3) {
            Game.lumpCurrentType = (Math.random() < 0.5) ? 1 : 4;
            if (Game.lumpRef) Game.lumpRef.className = 'lump lump-'+Game.lumpCurrentType;
        }

        // Neverclick Mode Passive
        if (config.neverClickMode) {
             var cursor = Game.Objects['Cursor'];
             if (cursor.amount == 0 && Game.cookies < cursor.getPrice()) {
                 Game.shimmerTypes.golden.time += 100;
             }
        }
    });

    Game.registerHook('click', function() {
        GameCompressor.clickTracker++;
        var timeToSkip = config.secondsSkippedPerClick * 1000; 
        var framesToSkip = (timeToSkip / 1000) * 30;

        // Base Warps
        if (Game.canLumps()) Game.lumpT -= timeToSkip;
        if (Game.researchT > 0) Game.researchT -= framesToSkip;
        if (Game.pledgeT > 0) Game.pledgeT -= framesToSkip;
        if (Game.wrinklerRespawns > 0) Game.wrinklerRespawns -= framesToSkip;

        // Fun Mode Triggers
        if (config.goldenTrigger) Game.shimmerTypes.golden.time += framesToSkip;
        
        if (config.gardenGrover) {
            var farm = Game.Objects['Farm'];
            if (farm.minigameLoaded && farm.minigame) farm.minigame.nextStep -= timeToSkip;
        }

        // Time Dilator (Extend Active Buffs)
        if (config.timeDilator) {
            for (var i in Game.buffs) {
                // Add 3 frames (0.1s) per click
                Game.buffs[i].time += 3; 
            }
        }

        // Turbo Market (Accelerate Stock Tick)
        if (config.turboMarket) {
            var bank = Game.Objects['Bank'];
            if (bank.minigameLoaded && bank.minigame) {
                bank.minigame.tickT += framesToSkip;
            }
        }

        // Mana Overload (Regen Magic)
        if (config.manaOverload) {
            var wizard = Game.Objects['Wizard tower'];
            if (wizard.minigameLoaded && wizard.minigame) {
                wizard.minigame.magic += 0.5;
                if (wizard.minigame.magic > wizard.minigame.maxMagic) {
                    wizard.minigame.magic = wizard.minigame.maxMagic;
                }
            }
        }
    });

    Game.registerHook('cps', function(cps) {
        return cps * GameCompressor.currentMult;
    });

    // ============================================
    // --- 4. HUD UPDATE LOOP ---
    // ============================================
    setInterval(function() {
        var m = document.getElementById('leg-mult');
        var s = document.getElementById('leg-speed');
        var b = document.getElementById('leg-badges');

        if (m) m.innerText = Beautify(Math.round(GameCompressor.currentMult * 100)) + "%";
        if (s) s.innerText = Math.round(GameCompressor.simulatedSpeed) + "x";
        if (b) {
            var c = function(bool, text) { 
                return `<span style="color:${bool ? '#fff' : '#444'}; font-weight:${bool?'bold':'normal'}">${text}</span>`; 
            };
            b.innerHTML = `
                ${c(config.goldenTrigger, 'GOLD')} | 
                ${c(config.timeDilator, 'TIME')} |
                ${c(config.turboMarket, 'STOCK')} |
                ${c(config.manaOverload, 'MANA')} <br>
                ${c(config.shinyHunter, 'HUNT')} | 
                ${c(config.perfectMagic, 'MAGIC')} | 
                ${c(config.gardenGrover, 'GARDEN')}
            `;
        }
    }, 500);

    console.log("Legacy Mod v10 (God Mode) Loaded.");
};

GameCompressor.init();

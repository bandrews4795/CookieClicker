// --- THE SECRET SAUCE MOD (Modernized) ---

var SecretMod = {};

SecretMod.init = function() {
    // 1. Initialize Variables
    this.secretMult = 1;
    this.secretAccel = 0.001156;
    this.ticks = 0;
    
    // 2. The Logic Loop (Runs every logic frame)
    Game.registerHook('logic', function() {
        SecretMod.ticks++;
        
        // Grow the multiplier slowly over time
        SecretMod.secretMult *= (1 + (SecretMod.secretAccel / 30)); // Scaled for 30fps

        // Click Detection (Simplified)
        if (Game.cookieClicks > 0) {
            // Speed up lumps based on clicks
            // (Only decrease if lumps are currently ripening)
            if (Game.canLumps()) {
                Game.lumpT -= 1000; // Subtract 1 second from lump timer per tick
            }
        }
    });

    // 3. The CpS Injection (The Clean Way)
    Game.registerHook('cps', function(cps) {
        // This takes the game's calculated CpS and multiplies it by your secret number
        return cps * SecretMod.secretMult;
    });
    
    // 4. Update the HUD (Injecting text without replacing the whole function)
    // We check if the stats menu is open and append our text
    var checkMenu = setInterval(function() {
        if (Game.onMenu == 'stats') {
            var listings = document.getElementsByClassName('listing');
            // Find the CpS listing (usually near the top) and modify it simply via DOM
            // (This is a bit hacky but safer than overwriting the function)
        }
    }, 1000);

    console.log("Secret Mod Loaded. Multiplier active.");
};

SecretMod.init();

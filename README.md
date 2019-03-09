# CookieClicker
Cookie Clicker Mods
This mod is a cheat mod for the game Cookie Clicker beta at http://orteil.dashnet.org/cookieclicker/beta/.
It is a slower cheat which allows time to get all of the acheivements (somewhat) legitimately.
It increases your cookies per second (Cps) passively and actively. It passively doubles your cookies per second over time, this slows down after a cap to prevent the game from going into Infinity and making the game unplayable. Actively, it increases your Cps per click, doubling at a certain rate as well. The active increase does not cap. It also increases the spawn rate of Golden Cookies, Reindeer (During Christmas), Sugar lumps, and optionally Wrinklers. These are harder to quantify because of the calculations that go into them, but I believe I set them at a useful rate.

Cps increase rate:		Doubles every:
Passive rate before cap		300 ticks x .5s per tick = 150s
Passive rate after cap		600 ticks x .5s per tick = 300s
Active  rate			250 clicks


This mod can be added to cookie clicker by copying the following code into a bookmark and opening it during a game:

javascript: (function () {
	Game.LoadMod('https://bandrews4795.github.io/CookieClicker/CookieGameBreak.js');
}());

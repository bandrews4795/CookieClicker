//v1.12
	
	var tempClicks = 0;
	var clicksPs = 0;
	var secretMult=1;
	var secretBrake=(24*60*60*365*8*1000000000)+ Game.prestige;
	var secretAccel=0.00231316; //doubles every 300
	var secretPrest=Game.prestige;
	var ascendCount=Game.resets;
	var lumpSpeed=ascendCount/50;
	secretMult+=lumpSpeed;
	var resetFlag = 0;
	var gameAge = 0;
	var tempAge = 0;
	
var initGame = function(){
	tempClicks = 0;
	clicksPs = 0;
	secretMult=1;
	secretBrake=(24*60*60*365*8*1000000000)+ Game.prestige;
	secretAccel=0.00231316;
	secretPrest=Game.prestige;
	ascendCount=Game.resets;
	lumpSpeed=ascendCount/50;
	secretMult+=lumpSpeed;
	resetFlag = 0;
	gameAge = 0;
	tempAge = 0;
};
var lumpCheat = function(lumpAccel){
	var tempLump = Game.lumpT;
	Game.lumpT=Game.lumpT-(lumpAccel*(Date.now()-Game.lumpT));
	if (tempLump==Game.lumpT){lumpCheat(lumpAccel);};		
};

var autoCps=function(power){
		
		if(resetFlag==1){initGame();};
	
		if(secretMult<(secretBrake/1000)){
			secretBrake+=secretMult*power;
		};
		if(secretMult>(secretBrake/1000)) {
			//This doubles every 600 ticks
			secretBrake*=Math.pow(1.0011559,power);
		};
		if(Math.pow(secretMult*(1+secretAccel),power)<secretBrake){
			secretMult*=Math.pow((1+secretAccel),power);
		};
		if(Game.shimmerTypes.golden.time < Game.shimmerTypes.golden.maxTime){
			Game.shimmerTypes.golden.time*=Math.pow(1+secretAccel,power);
		};
		if(Game.cookiesPs<0.1){
			Game.shimmerTypes.golden.time+=0.005555556*Game.shimmerTypes.golden.maxTime*power;
		};
		if (Game.season=='christmas'){Game.shimmerTypes.reindeer.time *= 1 + secretAccel;};
		if (Game.canLumps){lumpCheat(0.05*power);};
		Game.recalculateGains=1;
		//Game.lumpRefill=Date.now()-Game.getLumpRefillMax();
		//for (i = 0; i < Game.wrinklers.length; i++) { Game.wrinklers[i].phase = 1; };
	};

var timeLoop = setInterval(function(){
	gameAge = (Date.now()-Game.startDate);
	if(gameAge-tempAge>=500000){
		for(i=0;i<=Math.round((gameAge/1000)/500);i++){
		autoCps(500);
		tempAge+=500000;
		};
		//tempAge=(Math.round((gameAge/1000)/500)*1000*500);
	};
	while(tempAge+1000<=gameAge){
		autoCps(1);
		tempAge+=1000;
	};
	if(tempAge>gameAge){
	initGame();
	};
},1000);

var clickMod = setInterval( function(){
	if(tempClicks<Game.cookieClicks){
		clicksPs = Game.cookieClicks - tempClicks;
		tempClicks = Game.cookieClicks;
		if (Game.canLumps){
			lumpCheat((0.10+lumpSpeed)*clicksPs);
			Game.lumpRefill-=clicksPs*(0.10+lumpSpeed)*(Date.now()-Game.lumpRefill);
		};
		if (clicksPs>0){
			secretBrake*=Math.pow(1.002776436,clicksPs);
			secretMult*=Math.pow(1.002776436,clicksPs); //doubles every 250 clicks
			Game.shimmerTypes.golden.time*=Math.pow((1.1+lumpSpeed),clicksPs);
			if (Game.season=='christmas'){Game.shimmerTypes.reindeer.time *= Math.pow((1.1+lumpSpeed),clicksPs);}
		};
		Game.recalculateGains = 1;
	};
	if(tempClicks>Game.cookieClicks){
		resetFlag = 1;
		tempClicks = Game.cookieClicks;
	};
},34);

		
		
		
		/*=====================================================================================
		CPS RECALCULATOR
		=======================================================================================*/
		
		
		Game.heavenlyPower=1;//how many CpS percents a single heavenly chip gives
		Game.recalculateGains=1;
		Game.cookiesPsByType={};
		Game.cookiesMultByType={};
		//display bars with http://codepen.io/anon/pen/waGyEJ
		Game.effs={};
		Game.eff=function(name,def){if (typeof Game.effs[name]==='undefined') return (typeof def==='undefined'?1:def); else return Game.effs[name];};
		
		Game.CalculateGains=function()
		{
			Game.cookiesPs=0;
			var mult=1;
			//add up effect bonuses from building minigames
			var effs={};
			for (var i in Game.Objects)
			{
				if (Game.Objects[i].minigameLoaded && Game.Objects[i].minigame.effs)
				{
					var myEffs=Game.Objects[i].minigame.effs;
					for (var ii in myEffs)
					{
						if (effs[ii]) effs[ii]*=myEffs[ii];
						else effs[ii]=myEffs[ii];
					}
				}
			}
			Game.effs=effs;
			
			if (Game.ascensionMode!=1) mult+=parseFloat(Game.prestige)*0.01*Game.heavenlyPower*Game.GetHeavenlyMultiplier();
			
			mult*=Game.eff('cps');
			
			if (Game.Has('Heralds') && Game.ascensionMode!=1) mult*=1+0.01*Game.heralds;
			
			var cookieMult=0;
			for (var i in Game.cookieUpgrades)
			{
				var me=Game.cookieUpgrades[i];
				if (Game.Has(me.name))
				{
					mult*=(1+(typeof(me.power)=='function'?me.power(me):me.power)*0.01);
				}
			}
			mult*=(1+0.01*cookieMult);
			
			if (Game.Has('Specialized chocolate chips')) mult*=1.01;
			if (Game.Has('Designer cocoa beans')) mult*=1.02;
			if (Game.Has('Underworld ovens')) mult*=1.03;
			if (Game.Has('Exotic nuts')) mult*=1.04;
			if (Game.Has('Arcane sugar')) mult*=1.05;
			
			if (Game.Has('Increased merriness')) mult*=1.15;
			if (Game.Has('Improved jolliness')) mult*=1.15;
			if (Game.Has('A lump of coal')) mult*=1.01;
			if (Game.Has('An itchy sweater')) mult*=1.01;
			if (Game.Has('Santa\'s dominion')) mult*=1.2;
			
			var buildMult=1;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('asceticism');
				if (godLvl==1) mult*=1.15;
				else if (godLvl==2) mult*=1.1;
				else if (godLvl==3) mult*=1.05;
				
				var godLvl=Game.hasGod('ages');
				if (godLvl==1) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);
				else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);
				else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);
				
				var godLvl=Game.hasGod('decadence');
				if (godLvl==1) buildMult*=0.93;
				else if (godLvl==2) buildMult*=0.95;
				else if (godLvl==3) buildMult*=0.98;
				
				var godLvl=Game.hasGod('industry');
				if (godLvl==1) buildMult*=1.1;
				else if (godLvl==2) buildMult*=1.06;
				else if (godLvl==3) buildMult*=1.03;
				
				var godLvl=Game.hasGod('labor');
				if (godLvl==1) buildMult*=0.97;
				else if (godLvl==2) buildMult*=0.98;
				else if (godLvl==3) buildMult*=0.99;
			}
			
			if (Game.Has('Santa\'s legacy')) mult*=1+(Game.santaLevel+1)*0.03;
			
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				me.storedCps=(typeof(me.cps)=='function'?me.cps(me):me.cps);
				if (Game.ascensionMode!=1) me.storedCps*=(1+me.level*0.01)*buildMult;
				me.storedTotalCps=me.amount*me.storedCps;
				Game.cookiesPs+=me.storedTotalCps;
				Game.cookiesPsByType[me.name]=me.storedTotalCps;
			}
			
			if (Game.Has('"egg"')) {Game.cookiesPs+=9;Game.cookiesPsByType['"egg"']=9;}//"egg"
			
			for (var i in Game.customCps) {mult*=Game.customCps[i]();}
			
			Game.milkProgress=Game.AchievementsOwned/25;
			var milkMult=1;
			if (Game.Has('Santa\'s milk and cookies')) milkMult*=1.05;
			if (Game.hasAura('Breath of Milk')) milkMult*=1.05;
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('mother');
				if (godLvl==1) milkMult*=1.1;
				else if (godLvl==2) milkMult*=1.05;
				else if (godLvl==3) milkMult*=1.03;
			}
			milkMult*=Game.eff('milk');
			
			var catMult=1;
			
			if (Game.Has('Kitten helpers')) catMult*=(1+Game.milkProgress*0.1*milkMult);
			if (Game.Has('Kitten workers')) catMult*=(1+Game.milkProgress*0.125*milkMult);
			if (Game.Has('Kitten engineers')) catMult*=(1+Game.milkProgress*0.15*milkMult);
			if (Game.Has('Kitten overseers')) catMult*=(1+Game.milkProgress*0.175*milkMult);
			if (Game.Has('Kitten managers')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('Kitten accountants')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('Kitten specialists')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('Kitten experts')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('Kitten consultants')) catMult*=(1+Game.milkProgress*0.2*milkMult);
			if (Game.Has('Kitten assistants to the regional manager')) catMult*=(1+Game.milkProgress*0.175*milkMult);
			if (Game.Has('Kitten marketeers')) catMult*=(1+Game.milkProgress*0.15*milkMult);
			if (Game.Has('Kitten analysts')) catMult*=(1+Game.milkProgress*0.125*milkMult);
			if (Game.Has('Kitten angels')) catMult*=(1+Game.milkProgress*0.1*milkMult);
			
			Game.cookiesMultByType['kittens']=catMult;
			mult*=catMult;
			
			var eggMult=1;
			if (Game.Has('Chicken egg')) eggMult*=1.01;
			if (Game.Has('Duck egg')) eggMult*=1.01;
			if (Game.Has('Turkey egg')) eggMult*=1.01;
			if (Game.Has('Quail egg')) eggMult*=1.01;
			if (Game.Has('Robin egg')) eggMult*=1.01;
			if (Game.Has('Ostrich egg')) eggMult*=1.01;
			if (Game.Has('Cassowary egg')) eggMult*=1.01;
			if (Game.Has('Salmon roe')) eggMult*=1.01;
			if (Game.Has('Frogspawn')) eggMult*=1.01;
			if (Game.Has('Shark egg')) eggMult*=1.01;
			if (Game.Has('Turtle egg')) eggMult*=1.01;
			if (Game.Has('Ant larva')) eggMult*=1.01;
			if (Game.Has('Century egg'))
			{
				//the boost increases a little every day, with diminishing returns up to +10% on the 100th day
				var day=Math.floor((Date.now()-Game.startDate)/1000/10)*10/60/60/24;
				day=Math.min(day,100);
				eggMult*=1+(1-Math.pow(1-day/100,3))*0.1;
			}
			
			Game.cookiesMultByType['eggs']=eggMult;
			mult*=eggMult;
			
			if (Game.Has('Sugar baking')) mult*=(1+Math.min(100,Game.lumps)*0.01);
			
			if (Game.hasAura('Radiant Appetite')) mult*=2;
			
			if (Game.hasAura('Dragon\'s Fortune'))
			{
				var n=Game.shimmerTypes['golden'].n;
				for (var i=0;i<n;i++){mult*=2.23;}
				//old behavior
				/*var buffs=0;
				for (var i in Game.buffs)
				{buffs++;}
				mult*=1+(0.07)*buffs;*/
			}
			mult*=secretMult;
			var rawCookiesPs=Game.cookiesPs*mult;
			for (var i in Game.CpsAchievements)
			{
				if (rawCookiesPs>=Game.CpsAchievements[i].threshold) Game.Win(Game.CpsAchievements[i].name);
			}
			
			name=Game.bakeryName.toLowerCase();
			if (name=='orteil') mult*=0.99;
			else if (name=='ortiel') mult*=0.98;//or so help me
			
			var sucking=0;
			for (var i in Game.wrinklers)
			{
				if (Game.wrinklers[i].phase==2)
				{
					sucking++;
				}
			}
			var suckRate=1/20;//each wrinkler eats a twentieth of your CpS
			suckRate*=Game.eff('wrinklerEat');
			
			Game.cpsSucked=sucking*suckRate;
			
			
			if (Game.Has('Elder Covenant')) mult*=0.95;
			
			if (Game.Has('Golden switch [off]'))
			{
				var goldenSwitchMult=1.5;
				if (Game.Has('Residual luck'))
				{
					var upgrades=Game.goldenCookieUpgrades;
					for (var i in upgrades) {if (Game.Has(upgrades[i])) goldenSwitchMult+=0.1;}
				}
				mult*=goldenSwitchMult;
			}
			if (Game.Has('Shimmering veil [off]')) mult*=1.5;
			if (Game.Has('Magic shenanigans')) mult*=1000;
			if (Game.Has('Occult obstruction')) mult*=0;
			
			for (var i in Game.customCpsMult) {mult*=Game.customCpsMult[i]();}
			
			
			//cps without golden cookie effects
			Game.unbuffedCps=Game.cookiesPs*mult;
			
			for (var i in Game.buffs)
			{
				if (typeof Game.buffs[i].multCpS != 'undefined') mult*=Game.buffs[i].multCpS;
			}
			
			Game.globalCpsMult=mult;
			Game.cookiesPs*=Game.globalCpsMult;
			
			//if (Game.hasBuff('Cursed finger')) Game.cookiesPs=0;
			
			Game.computedMouseCps=Game.mouseCps();
			
			Game.computeLumpTimes();
			
			Game.recalculateGains=0;
		};
		
		Game.UpdateMenu=function()
		{
			var str='';
			if (Game.onMenu!='')
			{
				str+='<div class="close menuClose" '+Game.clickStr+'="Game.ShowMenu();">x</div>';
				//str+='<div style="position:absolute;top:8px;right:8px;cursor:pointer;font-size:16px;" '+Game.clickStr+'="Game.ShowMenu();">X</div>';
			}
			if (Game.onMenu=='prefs')
			{
				str+='<div class="section">Options</div>'+
				'<div class="subsection">'+
				'<div class="title">General</div>'+
				'<div class="listing"><a class="option" '+Game.clickStr+'="Game.toSave=true;PlaySound(\'snd/tick.mp3\');">Save</a><label>Save manually (the game autosaves every 60 seconds; shortcut : ctrl+S)</label></div>'+
				'<div class="listing"><a class="option" '+Game.clickStr+'="Game.ExportSave();PlaySound(\'snd/tick.mp3\');">Export save</a><a class="option" '+Game.clickStr+'="Game.ImportSave();PlaySound(\'snd/tick.mp3\');">Import save</a><label>You can use this to backup your save or to transfer it to another computer (shortcut for import : ctrl+O)</label></div>'+
				'<div class="listing"><a class="option" '+Game.clickStr+'="Game.FileSave();PlaySound(\'snd/tick.mp3\');">Save to file</a><a class="option" style="position:relative;"><input id="FileLoadInput" type="file" style="cursor:pointer;opacity:0;position:absolute;left:0px;top:0px;width:100%;height:100%;" onchange="Game.FileLoad(event);" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');"/>Load from file</a><label>Use this to keep backups on your computer</label></div>'+
				
				'<div class="listing"><a class="option warning" '+Game.clickStr+'="Game.HardReset();PlaySound(\'snd/tick.mp3\');">Wipe save</a><label>Delete all your progress, including your achievements</label></div>'+
				'<div class="title">Settings</div>'+
				'<div class="listing">'+
				Game.WriteSlider('volumeSlider','Volume','[$]%',function(){return Game.volume;},'Game.setVolume(Math.round(l(\'volumeSlider\').value));l(\'volumeSliderRightText\').innerHTML=Game.volume+\'%\';')+'<br>'+
				Game.WriteButton('fancy','fancyButton','Fancy graphics ON','Fancy graphics OFF','Game.ToggleFancy();')+'<label>(visual improvements; disabling may improve performance)</label><br>'+
				Game.WriteButton('filters','filtersButton','CSS filters ON','CSS filters OFF','Game.ToggleFilters();')+'<label>(cutting-edge visual improvements; disabling may improve performance)</label><br>'+
				Game.WriteButton('particles','particlesButton','Particles ON','Particles OFF')+'<label>(cookies falling down, etc; disabling may improve performance)</label><br>'+
				Game.WriteButton('numbers','numbersButton','Numbers ON','Numbers OFF')+'<label>(numbers that pop up when clicking the cookie)</label><br>'+
				Game.WriteButton('milk','milkButton','Milk ON','Milk OFF')+'<label>(only appears with enough achievements)</label><br>'+
				Game.WriteButton('cursors','cursorsButton','Cursors ON','Cursors OFF')+'<label>(visual display of your cursors)</label><br>'+
				Game.WriteButton('wobbly','wobblyButton','Wobbly cookie ON','Wobbly cookie OFF')+'<label>(your cookie will react when you click it)</label><br>'+
				Game.WriteButton('cookiesound','cookiesoundButton','Alt cookie sound ON','Alt cookie sound OFF')+'<label>(how your cookie sounds when you click on it)</label><br>'+
				Game.WriteButton('crates','cratesButton','Icon crates ON','Icon crates OFF')+'<label>(display boxes around upgrades and achievements in stats)</label><br>'+
				Game.WriteButton('monospace','monospaceButton','Alt font ON','Alt font OFF')+'<label>(your cookies are displayed using a monospace font)</label><br>'+
				Game.WriteButton('format','formatButton','Short numbers OFF','Short numbers ON','BeautifyAll();Game.RefreshStore();Game.upgradesToRebuild=1;',1)+'<label>(shorten big numbers)</label><br>'+
				Game.WriteButton('notifs','notifsButton','Fast notes ON','Fast notes OFF')+'<label>(notifications disappear much faster)</label><br>'+
				//Game.WriteButton('autoupdate','autoupdateButton','Offline mode OFF','Offline mode ON',0,1)+'<label>(disables update notifications)</label><br>'+
				Game.WriteButton('warn','warnButton','Closing warning ON','Closing warning OFF')+'<label>(the game will ask you to confirm when you close the window)</label><br>'+
				Game.WriteButton('focus','focusButton','Defocus OFF','Defocus ON',0,1)+'<label>(the game will be less resource-intensive when out of focus)</label><br>'+
				Game.WriteButton('extraButtons','extraButtonsButton','Extra buttons ON','Extra buttons OFF','Game.ToggleExtraButtons();')+'<label>(add Mute buttons on buildings)</label><br>'+
				Game.WriteButton('askLumps','askLumpsButton','Lump confirmation ON','Lump confirmation OFF')+'<label>(the game will ask you to confirm before spending sugar lumps)</label><br>'+
				Game.WriteButton('customGrandmas','customGrandmasButton','Custom grandmas ON','Custom grandmas OFF')+'<label>(some grandmas will be named after Patreon supporters)</label><br>'+
				Game.WriteButton('timeout','timeoutButton','Sleep mode timeout ON','Sleep mode timeout OFF')+'<label>(on slower computers, the game will put itself in sleep mode when it\'s inactive and starts to lag out; offline CpS production kicks in during sleep mode)</label><br>'+
				'</div>'+
				//'<div class="listing">'+Game.WriteButton('autosave','autosaveButton','Autosave ON','Autosave OFF')+'</div>'+
				'<div style="padding-bottom:128px;"></div>'+
				'</div>'
				;
			}
			else if (Game.onMenu=='main')
			{
				str+=
				'<div class="listing">This isn\'t really finished</div>'+
				'<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(\'prefs\');">Menu</a></div>'+
				'<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(\'stats\');">Stats</a></div>'+
				'<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(\'log\');">Updates</a></div>'+
				'<div class="listing"><a class="option big title" '+Game.clickStr+'="">Quit</a></div>'+
				'<div class="listing"><a class="option big title" '+Game.clickStr+'="Game.ShowMenu(Game.onMenu);">Resume</a></div>';
			}
			else if (Game.onMenu=='log')
			{
				str+=Game.updateLog;
			}
			else if (Game.onMenu=='stats')
			{
				var buildingsOwned=0;
				buildingsOwned=Game.BuildingsOwned;
				var upgrades='';
				var cookieUpgrades='';
				var hiddenUpgrades='';
				var prestigeUpgrades='';
				var upgradesTotal=0;
				var upgradesOwned=0;
				var prestigeUpgradesTotal=0;
				var prestigeUpgradesOwned=0;
				
				var list=[];
				for (var i in Game.Upgrades)//sort the upgrades
				{
					list.push(Game.Upgrades[i]);
				}
				var sortMap=function(a,b)
				{
					if (a.order>b.order) return 1;
					else if (a.order<b.order) return -1;
					else return 0;
				}
				list.sort(sortMap);
				for (var i in list)
				{
					var str2='';
					var me=list[i];
					
					str2+=Game.crate(me,'stats');
					
					if (me.bought)
					{
						if (Game.CountsAsUpgradeOwned(me.pool)) upgradesOwned++;
						else if (me.pool=='prestige') prestigeUpgradesOwned++;
					}
					
					if (me.pool=='' || me.pool=='cookie' || me.pool=='tech') upgradesTotal++;
					if (me.pool=='debug') hiddenUpgrades+=str2;
					else if (me.pool=='prestige') {prestigeUpgrades+=str2;prestigeUpgradesTotal++;}
					else if (me.pool=='cookie') cookieUpgrades+=str2;
					else if (me.pool!='toggle' && me.pool!='unused') upgrades+=str2;
				}
				var achievements=[];
				var achievementsOwned=0;
				var achievementsOwnedOther=0;
				var achievementsTotal=0;
				
				var list=[];
				for (var i in Game.Achievements)//sort the achievements
				{
					list.push(Game.Achievements[i]);
				}
				var sortMap=function(a,b)
				{
					if (a.order>b.order) return 1;
					else if (a.order<b.order) return -1;
					else return 0;
				}
				list.sort(sortMap);
				
				
				for (var i in list)
				{
					var me=list[i];
					//if (me.pool=='normal' || me.won>0) achievementsTotal++;
					if (Game.CountsAsAchievementOwned(me.pool)) achievementsTotal++;
					var pool=me.pool;
					if (!achievements[pool]) achievements[pool]='';
					achievements[pool]+=Game.crate(me,'stats');
					
					if (me.won)
					{
						if (Game.CountsAsAchievementOwned(me.pool)) achievementsOwned++;
						else achievementsOwnedOther++;
					}
				}
				
				var achievementsStr='';
				var pools={
					'dungeon':'<b>Dungeon achievements</b> <small>(Not technically achievable yet.)</small>',
					'shadow':'<b>Shadow achievements</b> <small>(These are feats that are either unfair or difficult to attain. They do not give milk.)</small>'
				};
				for (var i in achievements)
				{
					if (achievements[i]!='')
					{
						if (pools[i]) achievementsStr+='<div class="listing">'+pools[i]+'</div>';
						achievementsStr+='<div class="listing crateBox">'+achievements[i]+'</div>';
					}
				}
				
				var milkStr='';
				for (var i=0;i<Game.Milks.length;i++)
				{
					if (Game.milkProgress>=i)
					{
						var milk=Game.Milks[i];
						milkStr+='<div '+Game.getTooltip(
						'<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px;padding-bottom:96px;"><h3 style="margin:6px 32px 0px 32px;">'+milk.name+'</h3><div style="opacity:0.75;font-size:9px;">('+(i==0?'starter milk':('for '+Beautify(i*25)+' achievements'))+')</div><div class="line"></div><div style="width:100%;height:96px;position:absolute;left:0px;bottom:0px;background:url(img/'+milk.pic+'.png);"></div></div>'
						,'top')+' style="background:url(img/icons.png) '+(-milk.icon[0]*48)+'px '+(-milk.icon[1]*48)+'px;margin:2px 0px;" class="trophy"></div>';
					}
				}
				milkStr+='<div style="clear:both;"></div>';
				
				var santaStr='';
				var frames=15;
				if (Game.Has('A festive hat'))
				{
					for (var i=0;i<=Game.santaLevel;i++)
					{
						santaStr+='<div '+Game.getTooltip(
						'<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px 32px;"><div style="width:96px;height:96px;margin:4px auto;background:url(img/santa.png) '+(-i*96)+'px 0px;filter:drop-shadow(0px 3px 2px #000);-webkit-filter:drop-shadow(0px 3px 2px #000);"></div><div class="line"></div><h3>'+Game.santaLevels[i]+'</h3></div>'
						,'top')+' style="background:url(img/santa.png) '+(-i*48)+'px 0px;background-size:'+(frames*48)+'px 48px;" class="trophy"></div>';
					}
					santaStr+='<div style="clear:both;"></div>';
				}
				var dragonStr='';
				var frames=9;
				var mainLevels=[0,4,8,21,22,23];
				if (Game.Has('A crumbly egg'))
				{
					for (var i=0;i<=mainLevels.length;i++)
					{
						if (Game.dragonLevel>=mainLevels[i])
						{
							var level=Game.dragonLevels[mainLevels[i]];
							dragonStr+='<div '+Game.getTooltip(
							//'<div style="width:96px;height:96px;margin:4px auto;background:url(img/dragon.png?v='+Game.version+') '+(-level.pic*96)+'px 0px;"></div><div class="line"></div><div style="min-width:200px;text-align:center;margin-bottom:6px;">'+level.name+'</div>'
							'<div class="prompt" style="text-align:center;padding-bottom:6px;white-space:nowrap;margin:0px 32px;"><div style="width:96px;height:96px;margin:4px auto;background:url(img/dragon.png?v='+Game.version+') '+(-level.pic*96)+'px 0px;filter:drop-shadow(0px 3px 2px #000);-webkit-filter:drop-shadow(0px 3px 2px #000);"></div><div class="line"></div><h3>'+level.name+'</h3></div>'
							,'top')+' style="background:url(img/dragon.png?v='+Game.version+') '+(-level.pic*48)+'px 0px;background-size:'+(frames*48)+'px 48px;" class="trophy"></div>';
						}
					}
					dragonStr+='<div style="clear:both;"></div>';
				}
				var ascensionModeStr='';
				var icon=Game.ascensionModes[Game.ascensionMode].icon;
				if (Game.resets>0) ascensionModeStr='<span style="cursor:pointer;" '+Game.getTooltip(
							'<div style="min-width:200px;text-align:center;font-size:11px;">'+Game.ascensionModes[Game.ascensionMode].desc+'</div>'
							,'top')+'><div class="icon" style="display:inline-block;float:none;transform:scale(0.5);margin:-24px -16px -19px -8px;'+(icon[2]?'background-image:url('+icon[2]+');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div>'+Game.ascensionModes[Game.ascensionMode].name+'</span>';
				
				var milkName=Game.Milk.name;
				
				var researchStr=Game.sayTime(Game.researchT,-1);
				var pledgeStr=Game.sayTime(Game.pledgeT,-1);
				var wrathStr='';
				if (Game.elderWrath==1) wrathStr='awoken';
				else if (Game.elderWrath==2) wrathStr='displeased';
				else if (Game.elderWrath==3) wrathStr='angered';
				else if (Game.elderWrath==0 && Game.pledges>0) wrathStr='appeased';
				
				var date=new Date();
				date.setTime(Date.now()-Game.startDate);
				var timeInSeconds=date.getTime()/1000;
				var startDate=Game.sayTime(timeInSeconds*Game.fps,-1);
				date.setTime(Date.now()-Game.fullDate);
				var fullDate=Game.sayTime(date.getTime()/1000*Game.fps,-1);
				if (!Game.fullDate || !fullDate || fullDate.length<1) fullDate='a long while';
				/*date.setTime(new Date().getTime()-Game.lastDate);
				var lastDate=Game.sayTime(date.getTime()/1000*Game.fps,2);*/
				
				var heavenlyMult=Game.GetHeavenlyMultiplier();
				
				var seasonStr=Game.sayTime(Game.seasonT,-1);
				
				str+='<div class="section">Statistics</div>'+
				'<div class="subsection">'+
				'<div class="title">General</div>'+
				'<div class="listing"><b>Cookies in bank :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookies)+'</div></div>'+
				'<div class="listing"><b>Cookies baked (this ascension) :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesEarned)+'</div></div>'+
				'<div class="listing"><b>Cookies baked (all time) :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesEarned+Game.cookiesReset)+'</div></div>'+
				(Game.cookiesReset>0?'<div class="listing"><b>Cookies forfeited by ascending :</b> <div class="price plain">'+Game.tinyCookie()+Beautify(Game.cookiesReset)+'</div></div>':'')+
				(Game.resets?('<div class="listing"><b>Legacy started :</b> '+(fullDate==''?'just now':(fullDate+' ago'))+', with '+Beautify(Game.resets)+' ascension'+(Game.resets==1?'':'s')+'</div>'):'')+
				'<div class="listing"><b>Run started :</b> '+(startDate==''?'just now':(startDate+' ago'))+'</div>'+
				'<div class="listing"><b>Buildings owned :</b> '+Beautify(buildingsOwned)+'</div>'+
				'<div class="listing"><b>Cookies per second :</b> '+Beautify(Game.cookiesPs,1)+' <small>'+
					'(multiplier : '+Beautify(Math.round(Game.globalCpsMult*100),1)+'%)'+'(cheat multiplier : '+Beautify(Math.round(secretMult*100),1)+'%)'+
					(Game.cpsSucked>0?' <span class="warning">(withered : '+Beautify(Math.round(Game.cpsSucked*100),1)+'%)</span>':'')+
					'</small></div>'+
				'<div class="listing"><b>Cookies per click :</b> '+Beautify(Game.computedMouseCps,1)+'</div>'+
				'<div class="listing"><b>Cookie clicks :</b> '+Beautify(Game.cookieClicks)+'</div>'+
				'<div class="listing"><b>Hand-made cookies :</b> '+Beautify(Game.handmadeCookies)+'</div>'+
				'<div class="listing"><b>Golden cookie clicks :</b> '+Beautify(Game.goldenClicksLocal)+' <small>(all time : '+Beautify(Game.goldenClicks)+')</small></div>'+//' <span class="hidden">(<b>Missed golden cookies :</b> '+Beautify(Game.missedGoldenClicks)+')</span></div>'+
				'<br><div class="listing"><b>Running version :</b> '+Game.version+'</div>'+
				
				((researchStr!='' || wrathStr!='' || pledgeStr!='' || santaStr!='' || dragonStr!='' || Game.season!='' || ascensionModeStr!='' || Game.canLumps())?(
				'</div><div class="subsection">'+
				'<div class="title">Special</div>'+
				(ascensionModeStr!=''?'<div class="listing"><b>Challenge mode :</b>'+ascensionModeStr+'</div>':'')+
				(Game.season!=''?'<div class="listing"><b>Seasonal event :</b> '+Game.seasons[Game.season].name+
					(seasonStr!=''?' <small>('+seasonStr+' remaining)</small>':'')+
				'</div>':'')+
				(Game.season=='fools'?
					'<div class="listing"><b>Money made from selling cookies :</b> $'+Beautify(Game.cookiesEarned*0.08,2)+'</div>'+
					(Game.Objects['Portal'].amount>0?'<div class="listing"><b>TV show seasons produced :</b> '+Beautify(Math.floor((timeInSeconds/60/60)*(Game.Objects['Portal'].amount*0.13)+1))+'</div>':'')
				:'')+
				(researchStr!=''?'<div class="listing"><b>Research :</b> '+researchStr+' remaining</div>':'')+
				(wrathStr!=''?'<div class="listing"><b>Grandmatriarchs status :</b> '+wrathStr+'</div>':'')+
				(pledgeStr!=''?'<div class="listing"><b>Pledge :</b> '+pledgeStr+' remaining</div>':'')+
				(Game.wrinklersPopped>0?'<div class="listing"><b>Wrinklers popped :</b> '+Beautify(Game.wrinklersPopped)+'</div>':'')+
				((Game.canLumps() && Game.lumpsTotal>-1)?'<div class="listing"><b>Sugar lumps harvested :</b> <div class="price lump plain">'+Beautify(Game.lumpsTotal)+'</div></div>':'')+
				//(Game.cookiesSucked>0?'<div class="listing warning"><b>Withered :</b> '+Beautify(Game.cookiesSucked)+' cookies</div>':'')+
				(Game.reindeerClicked>0?'<div class="listing"><b>Reindeer found :</b> '+Beautify(Game.reindeerClicked)+'</div>':'')+
				(santaStr!=''?'<div class="listing"><b>Santa stages unlocked :</b></div><div>'+santaStr+'</div>':'')+
				(dragonStr!=''?'<div class="listing"><b>Dragon training :</b></div><div>'+dragonStr+'</div>':'')+
				''
				):'')+
				((Game.prestige>0 || prestigeUpgrades!='')?(
				'</div><div class="subsection">'+
				'<div class="title">Prestige</div>'+
				'<div class="listing"><div class="icon" style="float:left;background-position:'+(-19*48)+'px '+(-7*48)+'px;"></div>'+
					'<div style="margin-top:8px;"><span class="title" style="font-size:22px;">Prestige level : '+Beautify(Game.prestige)+'</span> at '+Beautify(heavenlyMult*100,1)+'% of its potential <b>(+'+Beautify(parseFloat(Game.prestige)*Game.heavenlyPower*heavenlyMult,1)+'% CpS)</b><br>Heavenly chips : <b>'+Beautify(Game.heavenlyChips)+'</b></div>'+
				'</div>'+
				(prestigeUpgrades!=''?(
				'<div class="listing" style="clear:left;"><b>Prestige upgrades unlocked :</b> '+prestigeUpgradesOwned+'/'+prestigeUpgradesTotal+' ('+Math.floor((prestigeUpgradesOwned/prestigeUpgradesTotal)*100)+'%)</div>'+
				'<div class="listing crateBox">'+prestigeUpgrades+'</div>'):'')+
				''):'')+

				'</div><div class="subsection">'+
				'<div class="title">Upgrades</div>'+
				(hiddenUpgrades!=''?('<div class="listing"><b>Debug</b></div>'+
				'<div class="listing crateBox">'+hiddenUpgrades+'</div>'):'')+
				'<div class="listing"><b>Upgrades unlocked :</b> '+upgradesOwned+'/'+upgradesTotal+' ('+Math.floor((upgradesOwned/upgradesTotal)*100)+'%)</div>'+
				'<div class="listing crateBox">'+upgrades+'</div>'+
				(cookieUpgrades!=''?('<div class="listing"><b>Cookies</b></div>'+
				'<div class="listing crateBox">'+cookieUpgrades+'</div>'):'')+
				'</div><div class="subsection">'+
				'<div class="title">Achievements</div>'+
				'<div class="listing"><b>Achievements unlocked :</b> '+achievementsOwned+'/'+achievementsTotal+' ('+Math.floor((achievementsOwned/achievementsTotal)*100)+'%)'+(achievementsOwnedOther>0?('<span style="font-weight:bold;font-size:10px;color:#70a;"> (+'+achievementsOwnedOther+')</span>'):'')+'</div>'+
				(Game.cookiesMultByType['kittens']>1?('<div class="listing"><b>Kitten multiplier :</b> '+Beautify((Game.cookiesMultByType['kittens'])*100)+'%</div>'):'')+
				'<div class="listing"><b>Milk :</b> '+milkName+'</div>'+
				(milkStr!=''?'<div class="listing"><b>Milk flavors unlocked :</b></div><div>'+milkStr+'</div>':'')+
				'<div class="listing"><small style="opacity:0.75;">(Milk is gained with each achievement. It can unlock unique upgrades over time.)</small></div>'+
				achievementsStr+
				'</div>'+
				'<div style="padding-bottom:128px;"></div>'
				;
			}
			//str='<div id="selectionKeeper" class="selectable">'+str+'</div>';
			l('menu').innerHTML=str;
			/*AddEvent(l('selectionKeeper'),'mouseup',function(e){
				console.log('selection:',window.getSelection());
			});*/
		}

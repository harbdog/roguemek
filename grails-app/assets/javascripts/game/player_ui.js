/**
 * player_ui.js - Methods that handle the non-canvas player UI
 */

var playerContainer, messagingContainer, messagingArea, mapDisplay, playerInfoDisplay, unitStatsDisplay, unitArmorDisplay, unitHeatDisplay,
	controlDisplay, weaponsContainer, weaponsDisplay, targetContainer, targetDisplay, targetBracket;

// X width of the player display bar
var playerContainerWidth = 200;

// Y direction offset for the Weapon display
var weaponsContainerOffsetY = -100;

var messagingContainerHeight = 75;

var apDisplaying, jpDisplaying;

function initPlayerUI() {
	playerContainer = new createjs.Container();
	// create an alpha background for the player display
	var playerBackground = new createjs.Shape();
	playerBackground.graphics.beginFill("#000000").drawRect(0, 0, playerContainerWidth, stage.canvas.height);
	playerBackground.alpha = 0.75;
	// Get the div container for the player displays
	playerDisplay = new createjs.DOMElement(document.getElementById("playerDiv"));
	mapDisplay = document.getElementById("mapDiv");
	mapDisplay.innerHTML = "map";	// TODO: a map
	playerInfoDisplay = document.getElementById("infoDiv");
	unitStatsDisplay = document.getElementById("statsDiv");
	unitArmorDisplay = document.getElementById("htalDiv");
	unitHeatDisplay = document.getElementById("heatDiv");
	playerContainer.addChild(playerBackground);
	playerContainer.addChild(playerDisplay);
	stage.addChild(playerContainer);
	
	weaponsContainer = new createjs.Container();
	// Create an alpha background for the weapons display
	var weaponsBackground = new createjs.Shape();
	weaponsBackground.graphics.beginFill("#000000").drawRect(0, 0, stage.canvas.width-playerContainerWidth, -weaponsContainerOffsetY);
	weaponsBackground.alpha = 0.5;
	// Get the div container for the weapons display
	controlDisplay = new createjs.DOMElement(document.getElementById("controlDiv"));
	weaponsContainer.addChild(weaponsBackground);
	weaponsContainer.addChild(controlDisplay);
    
    targetContainer = new createjs.Container();
    // Create and alpha background for the target display
	var targetBackground = new createjs.Shape();
	var targetWidth = 200;
	var targetHeight = 300;
	targetBackground.graphics.beginFill("#000000").drawRect(0, 0, targetWidth, targetHeight);
	targetBackground.alpha = 0.5;
	// Create an 'X' as an icon to close the weapons display
	var targetClose = new createjs.Shape();
	targetClose.graphics.s("#FFFFFF").ss(2,"round").mt(targetWidth-2, 0).lt(targetWidth-12, 10).mt(targetWidth-12, 0).lt(targetWidth-2, 10);
	targetClose.alpha = 0.75;
	var targetCloseHit = new createjs.Shape();
	targetCloseHit.graphics.beginFill("#000000").drawRect(targetWidth-12, 0, 10, 10);
	targetClose.hitArea = targetCloseHit;
	targetClose.on("click", handleTargetCloseClick);
	// Get the div container for the target display
	targetDisplay = new createjs.DOMElement(document.getElementById("targetDiv"));
	targetContainer.addChild(targetBackground);
	targetContainer.addChild(targetDisplay);
	targetContainer.addChild(targetClose);

	// TODO: move to events.js and fix it so it drags the correct location of the container from the press location
	targetContainer.on("pressmove", handleTargetDrag);
	targetContainer.on("pressup", handleTargetDrag);
	
	messagingContainer = new createjs.Container();
	// create an alpha background for the messaging display
	var messagingBackground = new createjs.Shape();
	messagingBackground.graphics.beginFill("#000000").drawRect(0, 0, stage.canvas.width-playerContainerWidth, messagingContainerHeight);
	messagingBackground.alpha = 0.25;
	// Get the textarea for the messaging display
	messagingArea = new createjs.DOMElement(document.getElementById("messagingArea"));
	messagingContainer.addChild(messagingBackground);
	messagingContainer.addChild(messagingArea);
	messagingContainer.x = -stage.x + playerContainerWidth;
    messagingContainer.y = -stage.y;
	stage.addChild(messagingContainer);
	
	// Create target bracket
	var targetImg = queue.getResult("target");
	targetBracket = new createjs.Bitmap(targetImg);
	targetBracket.regX = targetImg.width/2;
	targetBracket.regY = targetImg.height/2;
}

function setPlayerInfo(unitName, playerName) {
	playerInfoDisplay.innerHTML = 
			"<p>"+unitName+"</p>"+
			"<p>"+playerName+"</p>";
}

function setActionPoints(actionPoints) {
	apDisplaying = actionPoints;
	
	if(actionPoints == 0){
		// TODO: hide the END button when out of AP
	}

	updateUnitStatsDisplay();
}

function setJumpPoints(jumpPoints) {
	jpDisplaying = jumpPoints;
	
	if(jumpPoints == null) {
		// TODO: null means no jump jets, hide the JP display and JUMP Button
	}
	
	updateUnitStatsDisplay();
}

function updateUnitStatsDisplay() {
	var statsString = "";
	
	if(apDisplaying != null) {
		statsString += "<p>AP "+apDisplaying+"</p>";
	}
	
	if(jpDisplaying != null) {
		statsString += "<p>JP "+jpDisplaying+"</p>";
	}
	
	unitStatsDisplay.innerHTML = statsString;
}

function setArmorDisplay(armor, internals) {
	// TODO: HTAL graph display
	// TODO: HTAL paper doll display
	
	var line1 = "HD:"+armor[HEAD]+"("+internals[HEAD]+")";
	var line2 = "LA:"+armor[LEFT_ARM]+"("+internals[LEFT_ARM]+")" +"          "+ "RA:"+armor[RIGHT_ARM]+"("+internals[RIGHT_ARM]+")";
	var line3 = "LT:"+armor[LEFT_TORSO]+"("+internals[LEFT_TORSO]+")" +" "+ "CT:"+armor[CENTER_TORSO]+"("+internals[CENTER_TORSO]+")" +" "+ "RT:"+armor[RIGHT_TORSO]+"("+internals[RIGHT_TORSO]+")";
	var line4 = "LTR:"+armor[LEFT_REAR] +"    "+ "CTR:"+armor[CENTER_REAR] +"    "+ "RTR:"+armor[RIGHT_REAR];
	var line5 = "LL:"+armor[LEFT_LEG]+"("+internals[LEFT_LEG]+")" +"          "+ "RL:"+armor[RIGHT_LEG]+"("+internals[RIGHT_LEG]+")";
	unitArmorDisplay.innerHTML = 
			"<p><pre>"+line1+"</pre></p>" +
			"<p><pre>"+line2+"</pre></p>" +
			"<p><pre>"+line3+"</pre></p>" +
			"<p><pre>"+line4+"</pre></p>" +
			"<p><pre>"+line5+"</pre></p>";
}


function setHeatDisplay(heat) {
	unitHeatDisplay.innerHTML = "<p>Heat "+heat+"</p>";
}

function updateWeaponsDisplay() {
	var weapons = playerUnit.weapons;
	playerWeapons = [];
	
	// TESTING
	var testingStr = "";
	
	var i = 1;
	$.each(weapons, function(key, w) {
		playerWeapons[i-1] = w;
		
		var weaponNum = i;
		if(weaponNum == 10){
			weaponNum = 0
		}
		else if(weaponNum > 10){
			// TODO: support > 10 weapons?
			return;
		}
		
		var locationStr = getLocationText(w.location);
		// TODO: show actual calculated TO-HIT
		var toHitAsPercent = "100%";
		
		var weaponInfo = w.shortName;
		if(w.weaponType == WEAPON_BALLISTIC || w.weaponType == WEAPON_MISSILE) {
			// TODO: determine actual remaining ammo
			weaponInfo += "[1000]";
		}
		
		var weaponStr = "<div class='weapon' id='"+w.id+"'>" +
							"<div class='weaponNumber'>"+weaponNum+"</div>" +
							"<div class='weaponLocation'>"+locationStr+"</div>" +
							"<div class='weaponIcon' id='"+w.weaponType+"'>"+"</div>" +
							"<div class='weaponInfo'>"+weaponInfo+"</div>" +
							"<div class='weaponHit'>"+toHitAsPercent+"</div>" +
						"</div>";
		
		testingStr += weaponStr;
		i++;
	});
	
	weaponsDisplay = document.getElementById("weaponsDiv");
	weaponsDisplay.innerHTML = testingStr;
	
	// update the initial cooldown display for each weapon
	updateWeaponsCooldown();
	
	$(".weapon").click(function() {
		// TODO: move to events.js
		if(!$(this).hasClass("cooldown")){
			// only allow weapons to be selected that aren't on cooldown
			$(this).toggleClass("selected");
			updateSelectedWeapons();
		}
	});
	
	var actionStr;
	if(playerUnit.id == turnUnit.id) {
		// TESTING (button will eventually need to switch between 'action_fire' and 'action_end' based on whether weapons are selected to fire)
		actionStr = "<div class='action_fire hidden'>Fire</div>"+
					"<div class='action_end'>End<br/>Turn</div>"+
					"<div class='action_wait hidden'>Wait</div>";
	}
	else {
		actionStr = "<div class='action_fire hidden'>Fire</div>"+
					"<div class='action_end hidden'>End<br/>Turn</div>"+
					"<div class='action_wait'>Wait</div>";
	}
	actionDisplay = document.getElementById("actionDiv");
	actionDisplay.innerHTML = actionStr;
	
	$(".action_fire").click(function() {
		// TODO: combine to a single method that is also called by the key press equivalent
		var selectedWeapons = getSelectedWeapons();
		fire_weapons(selectedWeapons);
	});
	
	$(".action_end").click(function() {
		skip();
	});
	
	weaponsContainer.alpha = 0;
	weaponsContainer.x = -stage.x + playerContainerWidth;
    weaponsContainer.y = -stage.y + stage.canvas.height + weaponsContainerOffsetY;
	stage.addChild(weaponsContainer);
}

function updateSelectedWeapons() {
	// TODO: use this method to store selected weapons in an array then update the UI to reflect
	// instead of directly using the "selected" class to store that info
	var hasSelected = false;
	$.each(playerWeapons, function(key, w) {
		if($("#"+w.id).hasClass("selected")) {
			hasSelected = true;
		}
	});
	
	if(hasSelected) {
		$('.action_fire').removeClass("hidden");
		$('.action_end').addClass("hidden");
	}
	else{
		$('.action_fire').addClass("hidden");
		$('.action_end').removeClass("hidden");
	}
}

/**
 * Gets an array of the player weapons that have been selected on the UI to fire
 * @returns {Array}
 */
function getSelectedWeapons() {
	var selectedWeapons = [];
	$.each(playerWeapons, function(key, w) {
		if($("#"+w.id).hasClass("selected")) {
			selectedWeapons.push(w);
		}
	});
	
	return selectedWeapons;
}

/**
 * Deselects any currently selected players weapons on the UI
 */
function deselectWeapons() {
	var hasSelected = false;
	$.each(playerWeapons, function(key, w) {
		if($("#"+w.id).hasClass("selected")) {
			hasSelected = true;
			$('#'+w.id).toggleClass("selected");
		}
	});
	
	if(hasSelected) {
		$('.action_fire').addClass("hidden");
		$('.action_end').removeClass("hidden");
	}
}

/**
 * Updates the player weapons' cooldown display as needed
 */
function updateWeaponsCooldown() {
	$.each(playerWeapons, function(key, w) {
		if(w.cooldown > 0) {
			var cooldownAsPercent = ""+100 * w.cooldown/w.cycle+"% 100%";
			console.log("Weapon "+w+" cooldown: "+cooldownAsPercent);
			
			$("#"+w.id).addClass("cooldown").css({"background-size":cooldownAsPercent});
		}
		else{
			$("#"+w.id).removeClass("cooldown");
		}
	});
}

function updateTargetDisplay() {
	if(playerTarget == null) return;
	
	var targetDisplayUnit = playerTarget.displayUnit;
	
	// TESTING
	console.log(targetDisplayUnit.toString());
	
	var testingStr = "";
	
	// TODO: HTAL graph display
	// TODO: HTAL paper doll display
	
	var armor = playerTarget.armor;
	var internals = playerTarget.internals;
	var line1 = "         "+"HD:"+armor[HEAD]+"("+internals[HEAD]+")";
	var line2 = "LA:"+armor[LEFT_ARM]+"("+internals[LEFT_ARM]+")" +"          "+ "RA:"+armor[RIGHT_ARM]+"("+internals[RIGHT_ARM]+")";
	var line3 = "LT:"+armor[LEFT_TORSO]+"("+internals[LEFT_TORSO]+")" +" "+ "CT:"+armor[CENTER_TORSO]+"("+internals[CENTER_TORSO]+")" +" "+ "RT:"+armor[RIGHT_TORSO]+"("+internals[RIGHT_TORSO]+")";
	var line4 = "LTR:"+armor[LEFT_REAR] +"    "+ "CTR:"+armor[CENTER_REAR] +"    "+ "RTR:"+armor[RIGHT_REAR];
	var line5 = "LL:"+armor[LEFT_LEG]+"("+internals[LEFT_LEG]+")" +"          "+ "RL:"+armor[RIGHT_LEG]+"("+internals[RIGHT_LEG]+")";
	testingStr += 
			"<p><pre>"+line1+"</pre></p>" +
			"<p><pre>"+line2+"</pre></p>" +
			"<p><pre>"+line3+"</pre></p>" +
			"<p><pre>"+line4+"</pre></p>" +
			"<p><pre>"+line5+"</pre></p>" + "<br/>";
	
	var i = 1;
	$.each(playerTarget.weapons, function(key, w) {
		var locationStr = getLocationText(w.location);
		testingStr += locationStr+"-"+w.shortName + "<br/>";
	});
	
	targetContainer.alpha = 0;
	targetContainer.x = targetDisplayUnit.x + hexWidth/3;
	targetContainer.y = targetDisplayUnit.y - hexHeight/2;
	targetDisplay.htmlElement.innerHTML = testingStr;
	stage.addChild(targetContainer);
	
	//create the target bracket over the target image
	targetBracket.alpha = 0;
	targetBracket.x = targetDisplayUnit.x;
	targetBracket.y = targetDisplayUnit.y;
	stage.addChild(targetBracket);
	
	createjs.Tween.get(weaponsContainer).to({alpha: 1}, 500);
	createjs.Tween.get(targetContainer).to({alpha: 1}, 500);
	createjs.Tween.get(targetBracket).to({alpha: 1}, 500);
	
	/*// Just played around with Timeline a bit
	var bracketTween = new createjs.Tween(targetBracket);
	var timeline = new createjs.Timeline(null, null, {loop: true});
	timeline.addTween(bracketTween.to({alpha: 1}, 500));
	timeline.addTween(bracketTween.to({alpha: 0}, 1000));
	*/
}

/**
 * Adds the given message to the end of the message display and scrolls to the bottom for it
 * @param message
 */
function addMessageUpdate(message) {
	messagingArea.htmlElement.innerHTML += "&#13;&#10;"+message;
	messagingArea.htmlElement.scrollTop = messagingArea.htmlElement.scrollHeight;
}
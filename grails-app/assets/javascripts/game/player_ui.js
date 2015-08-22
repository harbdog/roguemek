/**
 * player_ui.js - Methods that handle the canvas player UI
 */

"use strict";

// Close enough...
var PI = 3.14;

// variables for updating the stage on demand
var update = true;
var firstUpdate = true;
var lastUpdate = 0;

//all hex images are the same size
var hexScale = 1.0;

var defHexWidth = 84;
var defHexHeight = 72;
var hexWidth = defHexWidth * hexScale;
var hexHeight = defHexHeight * hexScale;

// variables for isometric view
var useIsometric = true;
var isometricPadding = 0;
var defElevationHeight = 15;
var elevationHeight = defElevationHeight * hexScale;

//variable to show level (elevation/depth/etc.)
var showLevels = true;

var messagingDisplay;
var unitDisplays, armorDisplays, heatDisplays, infoDisplays, weaponsDisplays;

var unitDisplayWidth = 250;
var unitDisplayBounds;
var targetDisplayWidth = 200;
var targetDisplayBounds;

var targetBracket, targetLine;

var apDisplaying, jpDisplaying;

//initialize canvas based UI overlay
function initPlayerUI() {
	// create the messaging area
	messagingDisplay = new MessagingDisplay();
	messagingDisplay.init();
	overlay.addChild(messagingDisplay);
	
	// create the player unit display list
	initPlayerUnitListDisplay();
	
	// create the player unit displays
	initPlayerUnitDisplay();
	
	// create other unit displays
	initOtherUnitDisplay();
	
	// create the player unit weapons displays
	initPlayerWeaponsDisplay();
	
	showPlayerUnitDisplay(turnUnit);
}

// updates the sizings/positions of the UI overlays on the canvas
function updatePlayerUI() {
	messagingDisplay.update();
	
	updatePlayerUnitListDisplay();
	
	updatePlayerUnitDisplay();
	updateOtherUnitDisplay();
}

/**
 * Create each other unit UI elements, such as armor and weapons
 */
function initOtherUnitDisplay() {
	if(unitDisplays == null) return;
	
	var firstListUnit = unitListDisplayArray[0];
	$.each(units, function(id, unit) {
		if(isPlayerUnit(unit)) return;
		var unitGroupDisplay = unitDisplays[unit.id];
		
		// other unit armor displays are on the right side of the window 
		var unitArmorDisplay = new MechArmorDisplay();
		unitArmorDisplay.width = targetDisplayWidth;
		unitArmorDisplay.height = 50;
		unitArmorDisplay.init();
		
		unitArmorDisplay.x = canvas.width - unitArmorDisplay.width;
		unitArmorDisplay.y = canvas.height - unitArmorDisplay.height;
		
		unitGroupDisplay.addChild(unitArmorDisplay);
		armorDisplays[unit.id] = unitArmorDisplay;
		
		// the weapons display is directly above the armor display
		var unitWeaponsDisplay = new createjs.Shape();
		unitWeaponsDisplay.width = targetDisplayWidth;
		unitWeaponsDisplay.height = 100;
		//unitWeaponsDisplay.init();
		
		// TODO: create as new class for containing weapons list for the unit
		unitWeaponsDisplay.alpha = 0.75;
		unitWeaponsDisplay.graphics.beginFill("#404040")
				.drawRect(0, 0, unitWeaponsDisplay.width, unitWeaponsDisplay.height)
				.setStrokeStyle(3/2, "round").beginStroke("#C0C0C0")
				.moveTo(0, unitWeaponsDisplay.height)
				.lineTo(unitWeaponsDisplay.width, unitWeaponsDisplay.height).endStroke();
		
		unitWeaponsDisplay.x = unitArmorDisplay.x;
		unitWeaponsDisplay.y = unitArmorDisplay.y - unitWeaponsDisplay.height;
		
		unitGroupDisplay.addChild(unitWeaponsDisplay);
		
		// the info display is directly above the weapons display
		var unitInfoDisplay = new MechInfoDisplay(unit);
		unitInfoDisplay.width = targetDisplayWidth;
		unitInfoDisplay.height = 50;
		unitInfoDisplay.init();
		
		unitInfoDisplay.x = unitWeaponsDisplay.x;
		unitInfoDisplay.y = unitWeaponsDisplay.y - unitInfoDisplay.height;
		
		unitGroupDisplay.addChild(unitInfoDisplay);
		infoDisplays[unit.id] = unitInfoDisplay;
		
		// the other unit icon is directly above the info display
		var thisDisplayUnit = unit.getUnitDisplay();
		var listUnit = new ListUnitDisplay(thisDisplayUnit);
		listUnit.init();
		listUnit.setSelected(true, true);
		listUnit.x = canvas.width - listUnit.getDisplayWidth();
		listUnit.y = unitInfoDisplay.y - listUnit.getDisplayHeight();
		unitGroupDisplay.addChild(listUnit);
		
		// set calculated bounds of the unit display
		if(targetDisplayBounds == null) {
			targetDisplayBounds = new createjs.Rectangle(unitInfoDisplay.x, listUnit.y,
					targetDisplayWidth, unitArmorDisplay.height + unitWeaponsDisplay.height + unitInfoDisplay.height + listUnit.getDisplayHeight());
		}
		
		// apply initial damage to this unit, if any
		for(var n=0; n<unit.armor.length; n++) {
			applyUnitDamage(unit, n, false, true);
		}
		for(var n=0; n<unit.internals.length; n++) {
			applyUnitDamage(unit, n, true, true);
		}
	});
}

/**
 * Updates sizing/position of each non-player unit UI element
 * @returns
 */
function updateOtherUnitDisplay() {
	if(unitDisplays == null) return;
	
	$.each(unitDisplays, function(unitId, unitArmorDisplay) {
		var chkUnit = units[unitId];
		if(!isPlayerUnit(chkUnit)) {
			 // TODO: fix y position of unit display
			unitArmorDisplay.x = canvas.width - unitArmorDisplay.width;
			unitArmorDisplay.y = canvas.height - unitArmorDisplay.height;
		}
	});
}

/**
 * Ensures that only the given non-player unit shows its display, others are hidden
 * @param unit
 */
function showOtherUnitDisplay(unit) {
	if(isPlayerUnit(unit)) return;

	$.each(unitDisplays, function(unitId, unitDisplay) {
		var chkUnit = units[unitId];
		if(!isPlayerUnit(chkUnit)){
			unitDisplay.visible = (unit != null && unit.id == unitId);
		}
	});
}

/**
 * Creates each player unit UI elements, such as armor, weapons, and heat
 */
function initPlayerUnitDisplay() {
	if(unitListDisplayArray == null || unitListDisplayArray.length == 0) return;
	
	// create the arrays that store the individual for unit displays
	if(armorDisplays == null) armorDisplays = {};
	if(heatDisplays == null) heatDisplays = {};
	if(infoDisplays == null) infoDisplays = {};
	
	// initialize the containers which have each unit's displays grouped together inside
	if(unitDisplays == null) unitDisplays = {};
	$.each(units, function(index, unit) {
		var unitGroupDisplay = new createjs.Container();
		unitGroupDisplay.visible = false;
		
		overlay.addChild(unitGroupDisplay);
		unitDisplays[unit.id] = unitGroupDisplay;
	});
	
	// Create each player unit display next to the list of player units
	var firstListUnit = unitListDisplayArray[0];
	$.each(unitListDisplayArray, function(index, listUnit) {
		var unit = listUnit.unit;
		var unitGroupDisplay = unitDisplays[unit.id];
		
		// the armor display is to the right of the unit list display
		var unitArmorDisplay = new MechArmorDisplay();
		
		unitArmorDisplay.width = unitDisplayWidth;
		unitArmorDisplay.height = firstListUnit.getDisplayHeight() * 2;
		unitArmorDisplay.init();
		
		unitArmorDisplay.x = firstListUnit.x + firstListUnit.getDisplayWidth();
		unitArmorDisplay.y = canvas.height - unitArmorDisplay.height;
		
		unitGroupDisplay.addChild(unitArmorDisplay);
		armorDisplays[unit.id] = unitArmorDisplay;
		
		// the heat display is directly above the armor display
		var unitHeatDisplay = new MechHeatDisplay();
		
		unitHeatDisplay.width = unitDisplayWidth;
		unitHeatDisplay.height = firstListUnit.getDisplayHeight();
		unitHeatDisplay.init();
		
		unitHeatDisplay.x = firstListUnit.x + firstListUnit.getDisplayWidth();
		unitHeatDisplay.y = unitArmorDisplay.y - unitHeatDisplay.height;
		
		unitGroupDisplay.addChild(unitHeatDisplay);
		heatDisplays[unit.id] = unitHeatDisplay;
		
		// the info display is directly above the heat display
		var unitInfoDisplay = new MechInfoDisplay(unit);
		unitInfoDisplay.width = unitDisplayWidth;
		unitInfoDisplay.height = firstListUnit.getDisplayHeight();
		unitInfoDisplay.init();
		
		unitInfoDisplay.x = firstListUnit.x + firstListUnit.getDisplayWidth();
		unitInfoDisplay.y = unitHeatDisplay.y - unitInfoDisplay.height;
		
		unitGroupDisplay.addChild(unitInfoDisplay);
		infoDisplays[unit.id] = unitInfoDisplay;
		
		// set calculated bounds of the unit display
		if(unitDisplayBounds == null) {
			unitDisplayBounds = new createjs.Rectangle(unitInfoDisplay.x, unitInfoDisplay.y,
					unitDisplayWidth, unitArmorDisplay.height + unitHeatDisplay.height + unitInfoDisplay.height);
		}
		
		// apply initial damage to this unit, if any
		for(var n=0; n<unit.armor.length; n++) {
			applyUnitDamage(unit, n, false, true);
		}
		for(var n=0; n<unit.internals.length; n++) {
			applyUnitDamage(unit, n, true, true);
		}
		
		// apply initial heat
		updateHeatDisplay(unit);
	});
}

/**
 * Updates sizing/position of each player unit UI element
 * @returns
 */
function updatePlayerUnitDisplay() {
	if(unitDisplays == null) return;
	
	 $.each(unitDisplays, function(unitId, unitArmorDisplay) {
		 var chkUnit = units[unitId];
		 if(isPlayerUnit(chkUnit)) {
			 // TODO: fix y position of unit display
			 unitArmorDisplay.y = canvas.height - unitArmorDisplay.height;
		 }
	 });
}

/**
 * Ensures that only the given player unit shows its display, others are hidden
 * @param unit
 */
function showPlayerUnitDisplay(unit) {
	if(!isPlayerUnit(unit)) return;
	
	$.each(unitDisplays, function(unitId, unitDisplay) {
		var chkUnit = units[unitId];
		if(isPlayerUnit(chkUnit)){
			var visible = (unit == null || unit.id == unitId);
			unitDisplay.visible = visible;
			
			// also show/hide player weapons display
			var unitWeaponsDisplay = weaponsDisplays[unitId];
			unitWeaponsDisplay.visible = visible;
		}
	});
}

function updateHeatDisplay(unit) {
	if(unit == null) return;
	
	// TODO: update unit heat, heat generation, heat dissipation
	var unitHeatDisplay = heatDisplays[unit.id];
	unitHeatDisplay.setDisplayedHeat(unit.heat, 0, unit.heatDiss);
	
	// TODO: Heat meter with indicators of heat that weapons will generate and where the heat penalties are
}

/**
 * Updates the player armor diagram for the given unit to account for damage taken
 * @param unit
 * @param isInternal
 * @param index
 */
function applyUnitDamage(unit, index, isInternal) {
	if(unit == null || index < 0) return;
	
	var value, initialValue;
	if(isInternal) {
		value = unit.internals[index];
		initialValue = unit.initialInternals[index];
	}
	else{
		value = unit.armor[index];
		initialValue = unit.initialArmor[index];
	}
	
	if(value == null || value < 0) {
		value = 0;
	}
	if(initialValue == null || initialValue <= 0) {
		initialValue = 1;
	}
	
	var unitArmorDisplay = armorDisplays[unit.id];
	if(unitArmorDisplay != null) {
		var section, subIndex;
		if(index == HEAD){
			// TODO: correct section and index to proper values for HTAL display
			section = unitArmorDisplay.HD;
			subIndex = isInternal ? 1 : 0;
		}
		else if(index == LEFT_ARM){
			section = unitArmorDisplay.LA;
			subIndex = isInternal ? 1 : 0;
		}
		else if(index == LEFT_TORSO){
			section = unitArmorDisplay.LTR;
			subIndex = isInternal ? 1 : 0;
		}
		else if(index == CENTER_TORSO){
			section = unitArmorDisplay.CTR;
			subIndex = isInternal ? 1 : 0;
		}
		else if(index == RIGHT_TORSO){
			section = unitArmorDisplay.RTR;
			subIndex = isInternal ? 1 : 0;
		}
		else if(index == RIGHT_ARM){
			section = unitArmorDisplay.RA;
			subIndex = isInternal ? 1 : 0;
		}
		else if(index == LEFT_LEG){
			section = unitArmorDisplay.LL;
			subIndex = isInternal ? 1 : 0;
		}
		else if(index == RIGHT_LEG){
			section = unitArmorDisplay.RL;
			subIndex = isInternal ? 1 : 0;
		}
		else if(index == LEFT_REAR){
			section = unitArmorDisplay.LTR;
			subIndex = 2;
		}
		else if(index == CENTER_REAR){
			section = unitArmorDisplay.CTR;
			subIndex = 2;
		}
		else if(index == RIGHT_REAR){
			section = unitArmorDisplay.RTR;
			subIndex = 2;
		}
		
		unitArmorDisplay.setSectionPercent(section, subIndex, 100 * value/initialValue);
	}
}

/**
 * Creates the player unit display list
 */
function initPlayerUnitListDisplay() {
	if(unitListDisplay == null) {
		// create container as background for the display
		unitListDisplay = new createjs.Container();
		overlay.addChild(unitListDisplay);
		
		unitListDisplayArray = [];
	}
	
	$.each(playerUnits, function(index, unit) {
		var thisDisplayUnit = unit.getUnitDisplay();
		
		var listUnit = new ListUnitDisplay(thisDisplayUnit);
		listUnit.init();
		listUnit.x = 1;
		listUnit.y = canvas.height - (index+1) * listUnit.getDisplayHeight();
		unitListDisplay.addChild(listUnit);
		
		unitListDisplayArray.push(listUnit);
	});
}

/**
 * Updates the player unit display list
 */
function updatePlayerUnitListDisplay() {
	if(unitListDisplayArray == null) return;
	
	$.each(unitListDisplayArray, function(index, listUnit) {
		// update the position in case the resize was called
		listUnit.x = 1;
		listUnit.y = canvas.height - (index+1) * listUnit.getDisplayHeight();
		
		// update the selected status in case its the unit's turn
		listUnit.setSelected(isTurnUnit(listUnit.unit));
	});
}

/**
 * Sets the animated target brackets on the given unit (or hides the brackets with null target)
 * @param unit
 */
function setPlayerTarget(unit) {
	if(unit == null) {
		showOtherUnitDisplay(null);
		
		if(targetLine != null) {
			targetLine.visible = false;
			createjs.Tween.removeTweens(targetLine);
		}
		
		if(targetBracket != null) {
			targetBracket.visible = false;
			createjs.Tween.removeTweens(targetBracket);
		}
		return;
	}
	
	// show target unit info display
	showOtherUnitDisplay(unit);
	
	// show target bracket on top of the target
	var scale = 0.8 * hexScale;
	var unitDisplay = unit.getUnitDisplay();
	
	if(targetBracket == null) {
		targetBracket = new createjs.Shape();
		targetBracket.visible = false;
		targetBracket.graphics.setStrokeStyle(5, "square").beginStroke("#FF0000")
				.moveTo(0, 0).lineTo(hexWidth/6, 0)
				.moveTo(0, 0).lineTo(0, hexHeight/6)
				
				.moveTo(hexWidth, 0).lineTo(hexWidth-hexWidth/6, 0)
				.moveTo(hexWidth, 0).lineTo(hexWidth, hexHeight/6)
				
				.moveTo(0, hexHeight).lineTo(hexWidth/6, hexHeight)
				.moveTo(0, hexHeight).lineTo(0, hexHeight-hexHeight/6)
				
				.moveTo(hexWidth, hexHeight).lineTo(hexWidth-hexWidth/6, hexHeight)
				.moveTo(hexWidth, hexHeight).lineTo(hexWidth, hexHeight-hexHeight/6);
		
		targetBracket.scaleX = scale;
		targetBracket.scaleY = scale;
		stage.addChild(targetBracket);
	}
	
	createjs.Tween.removeTweens(targetBracket);
	var targetX = unitDisplay.x - scale*hexWidth/2;
	var targetY = unitDisplay.y - scale*hexHeight/2;
	
	// create dashed line from player unit to target bracket
	if(targetLine == null) {
		targetLine = new createjs.Shape();
		stage.addChild(targetLine);
	}
	else{
		targetLine.visible = true;
		targetLine.graphics.clear();
	}
	
	targetLine.graphics.setStrokeDash([10, 20], 10).
			setStrokeStyle(3, "round").beginStroke("#FF0000")
			.moveTo(turnUnit.getUnitDisplay().x, turnUnit.getUnitDisplay().y)
			.lineTo(unit.getUnitDisplay().x, unit.getUnitDisplay().y);
	// give the indicator a glow
	var glowColor = shadeColor("#FF0000", 0.75);
	targetLine.shadow = new createjs.Shadow(glowColor, 0, 0, 5);
	targetLine.alpha = 0;
	
	createjs.Tween.get(targetLine)
			.to({alpha: 0.75}, 500)
			.addEventListener("change", function() {
				update = true;
			});	
	
	if(targetBracket.visible) {
		// animate move the bracket to the new location
		targetBracket.alpha = 1.0;
		createjs.Tween.get(targetBracket)
			.to({x: targetX, y: targetY}, 250)
			.addEventListener("change", function() {
				update = true;
			});
	}
	else{
		targetBracket.visible = true;
		targetBracket.alpha = 1.0;
		targetBracket.x = targetX;
		targetBracket.y = targetY;
	}
	
	createjs.Tween.get(targetBracket, { loop: true})
			.to({alpha: 0.35}, 750)
			.to({alpha: 1.0}, 750)
			.addEventListener("change", function() {
				update = true;
			});
}
function setPlayerTargetLineVisible(visible) {
	if(targetLine != null) {
		targetLine.visible = visible;
	}
}

/**
 * Intended to be called back from Tweens when the object is ready to remove itself from the stage after animation is completed
 */
function removeThisFromStage() {
	stage.removeChild(this);
}

/**
 * Intended to be called back from Tweens when the object is ready to be cached again after animation is completed
 */
function callDoCache() {
	if(!createjs.Tween.hasActiveTweens(this)){
		this.doCache();
	}
}

function setActionPoints(apRemaining) {
	apDisplaying = apRemaining;
	
	if(apRemaining == 0){
		// TODO: hide the END button when out of AP
	}

	updateUnitStatsDisplay();
}

function setJumpPoints(jpRemaining) {
	jpDisplaying = jpRemaining;
	
	if(jpRemaining == null) {
		// TODO: null means no jump jets, hide the JP display and JUMP Button
	}
	
	updateUnitStatsDisplay();
}

function updateUnitStatsDisplay() {
	// TODO: update AP and JP display
}


/**
 * Creates each player unit UI elements for weapons
 */
function initPlayerWeaponsDisplay() {
	if(armorDisplays == null || playerUnits == null || playerUnits[0] == null) return;
	
	// create the arrays that store the individual for unit displays
	if(weaponsDisplays == null) weaponsDisplays = {};
	
	$.each(playerUnits, function(index, unit) {
		// store all unit weapons in one container
		var unitWeaponsDisplay = new MechWeaponsDisplay(unit);
		unitWeaponsDisplay.visible = (unit.id == turnUnit.id);
		
		unitWeaponsDisplay.init();
		
		// determine position after it has initialized and updated the first time
		// since it defines its own bounds dynamically
		unitWeaponsDisplay.x = unitDisplayBounds.x + unitDisplayBounds.width;
		unitWeaponsDisplay.y = canvas.height - unitWeaponsDisplay.height;
		
		overlay.addChild(unitWeaponsDisplay);
		weaponsDisplays[unit.id] = unitWeaponsDisplay;
	});
}

/**
 * Gets the player weapon currently being displayed with the given ID
 * @param id
 * @returns
 */
function getPlayerWeaponById(id) {
	/*for(var i=0; i<playerWeapons.length; i++) {
		var chkWeapon = playerWeapons[i];
		if(chkWeapon.id == id){
			return chkWeapon;
		}
	}*/
	
	return null;
}

function updateWeaponsDisplay() {
	// TODO: update weapons display
	
	/*var weapons = playerUnit.weapons;
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
		
		// TODO: if the weapon is destroyed/damaged, add class "disabled"
		var weaponClassStr = "weapon";
		
		// show actual calculated TO-HIT
		var toHitAsPercent = "  --";
		if(w.toHit != null) {
			toHitAsPercent = w.toHit+"%";
		}
		
		var weaponInfo = w.shortName;
		if(w.ammo) {
			// show total remaining ammo
			var ammoRemaining = 0;
			$.each(w.ammo, function(key, ammoObj) {
				ammoRemaining += ammoObj.ammoRemaining;
			});
			weaponInfo += "["+ammoRemaining+"]";
			
			if(ammoRemaining <= 0) {
				weaponClassStr += " disabled";
			}
		}
		
		var weaponStr = "<div class='"+weaponClassStr+"' id='"+w.id+"'>" +
							"<div class='weaponNumber'>"+weaponNum+"</div>" +
							"<div class='weaponLocation'>"+locationStr+"</div>" +
							"<div class='weaponIcon' id='"+w.weaponType+"'>"+"</div>" +
							"<div class='weaponInfo'>"+weaponInfo+"</div>" +
							"<div class='weaponHit'>"+toHitAsPercent+"</div>" +
						"</div>";
		
		testingStr += weaponStr;
		i++;
	});
	
	// update the initial cooldown display for each weapon
	updateWeaponsCooldown();*/
	
	/*$(".weapon").click(function() {
		// TODO: move to events.js
		if(playerUnit == turnUnit 
				&& !$(this).hasClass("cooldown") 
				&& !$(this).hasClass("disabled")){
			// only allow weapons to be selected that aren't on cooldown
			// TODO: only allow weapons to be selected that have >0% chance to hit
			$(this).toggleClass("selected");
			updateSelectedWeapons();
		}
	});*/
	
	/*var actionStr;
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
	}*/
	
	
	/*$(".action_fire").click(function() {
		// TODO: combine to a single method that is also called by the key press equivalent
		var selectedWeapons = getSelectedWeapons();
		fire_weapons(selectedWeapons);
	});*/
	
	/*$(".action_end").click(function() {
		skip();
	});*/
}

function updateSelectedWeapons() {
	// TODO: use this method to store selected weapons in an array then update the UI to reflect
	// instead of directly using the "selected" class to store that info
	var hasSelected = false;
	
	var weaponHeatTotal = 0
	
	// TODO: store selected weapons
	
	/*$.each(playerWeapons, function(key, w) {
		if($("#"+w.id).hasClass("selected")) {
			hasSelected = true;
			
			weaponHeatTotal += w.heat;
		}
	});
	
	if(hasSelected) {
		$('.action_fire').removeClass("hidden");
		$('.action_end').addClass("hidden");
		
		setHeatDisplay(playerUnit.heat, weaponHeatTotal, false);
	}
	else{
		$('.action_fire').addClass("hidden");
		$('.action_end').removeClass("hidden");
		
		setHeatDisplay(playerUnit.heat, false, false);
	}*/
}

/**
 * Gets an array of the player weapons that have been selected on the UI to fire
 * @returns {Array}
 */
function getSelectedWeapons() {
	//var selectedWeapons = [];
	
	// TODO: determine weapons that are selected to fire
	/*$.each(playerWeapons, function(key, w) {
		if($("#"+w.id).hasClass("selected")) {
			selectedWeapons.push(w);
		}
	});*/
	
	return selectedWeapons;
}

/**
 * Deselects any currently selected players weapons on the UI
 */
function deselectWeapons() {
	var hasSelected = false;
	// TODO: deselect all weapons currently selected
	/*$.each(playerWeapons, function(key, w) {
		if($("#"+w.id).hasClass("selected")) {
			hasSelected = true;
			$('#'+w.id).toggleClass("selected");
		}
	});
	
	if(hasSelected) {
		$('.action_fire').addClass("hidden");
		$('.action_end').removeClass("hidden");
	}*/
}

/**
 * Resets the toHit value for all player weapons
 * @param weapon
 */
function resetWeaponsToHit() {
	// TODO: reset the to hit value displayed for displayed weapons
	/*$.each(playerWeapons, function(key, w) {
		w.toHit = null;
	});*/
}

/**
 * Updates the player weapons' cooldown display as needed
 */
function updateWeaponsCooldown() {
	// TODO: update cooldown displayed for each weapon
	/*$.each(playerWeapons, function(key, w) {
		if(w.cooldown > 0) {
			var cooldownAsPercent = ""+100 * w.cooldown/w.cycle+"% 100%";
			
			$("#"+w.id).addClass("cooldown").css({"background-size":cooldownAsPercent});
			$("#"+w.id+" .weaponNumber").addClass("disabled");
		}
		else{
			$("#"+w.id).removeClass("cooldown");
			
			// TODO: if a weapon is destroyed or out of ammo, do not remove its disabled state
			$("#"+w.id+" .weaponNumber").removeClass("disabled");
		}
	});*/
}

/**
 * Updates the target info display
 */
function updateTargetDisplay() {
	//TODO: update the target display 
	// if(playerTarget == null) return;
	return;
	
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
	
	// TODO: show the target info display
	
	/*targetContainer.alpha = 0;
	targetContainer.x = targetDisplayUnit.x + hexWidth/3;
	targetContainer.y = targetDisplayUnit.y - hexHeight/2;
	targetDisplay.htmlElement.innerHTML = testingStr;
	stage.addChild(targetContainer);
	
	//create the target bracket over the target image
	targetBracket.alpha = 0;
	targetBracket.x = targetDisplayUnit.x;
	targetBracket.y = targetDisplayUnit.y;
	stage.addChild(targetBracket);
	
	createjs.Tween.get(targetContainer).to({alpha: 1}, 500);
	createjs.Tween.get(targetBracket).to({alpha: 1}, 500);*/
	
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
	messagingDisplay.addMessage(message, true);
}

/**
 * switches the hex board between isometric and flat
 */
function toggleIsometricDisplay() {
	useIsometric = !useIsometric;
	updateHexDisplayObjects();
	updateUnitDisplayObjects();
	updateTargetPosition();
	update = true;
}

/**
 * Gets the display X,Y coordinates of an object moving a number of pixels at the given angle
 * @returns Point
 */
function getMovementDestination(sourceX, sourceY, distance, angle){
	var oppSide = Math.sin(angle * PI/180) * distance;
	var adjSide = Math.cos(angle * PI/180) * distance;
	
	var p = new Point();
	p.x = sourceX + oppSide;
	p.y = sourceY - adjSide;
	
	return p;
}

/**
 * Calculates the distance between two x,y points in space
 */
function getDistanceToTarget(sourceX, sourceY, targetX, targetY){
	// C^2 = A^2 + B^2
	return Math.sqrt(Math.pow(Math.abs(sourceX - targetX), 2) + Math.pow(Math.abs(sourceY - targetY), 2));
}

/**
 * Gets the angle to the target
 */
function getAngleToTarget(sourceX, sourceY, targetX, targetY){
	var quadrant = 0;
	var addedAngle = 0;
	if(targetX >= sourceX && targetY < sourceY){
		quadrant = 1;
		addedAngle = 0;
	}
	else if(targetX >= sourceX && targetY >= sourceY){
		quadrant = 2;
		addedAngle = 90;
	}
	else if(targetX < sourceX && targetY >= sourceY){
		quadrant = 3;
		addedAngle = 180;
	}
	else{
		quadrant = 4;
		addedAngle = 270;
	}
	
	var oppSide = 0;
	var adjSide = 0;
	switch(quadrant){
		case 1:
			oppSide = targetX - sourceX;
			adjSide = sourceY - targetY;
			break;
			
		case 2:
			oppSide = targetY - sourceY;
			adjSide = targetX - sourceX;
			break;
			
		case 3:
			oppSide = sourceX - targetX;
			adjSide = targetY - sourceY;
			break;
			
		case 4:
			oppSide = sourceY - targetY;
			adjSide = sourceX - targetX;
			break;
	}
	
	// calculate new angle based on pointer position, each angle is calculated from X axis where Urbie is origin point
	var angle = addedAngle + Math.atan((oppSide) / (adjSide)) * (180 / PI);
	return angle;
}

/** 
 * Using the Point object of center reference, mech heading, and a mech limb location will return the Point on screen from where it should be.
 * e.g. to display the weapon fire coming from the left arm, it should be 90 degrees counter clockwise from the heading
 */ 
function getPositionFromLocationAngle(p, heading, location){
	// TODO: determine radius based on size of mech image
	var radius = 15;
	var headingAngle = 0;
	var locationAngle = 0;
	
	switch(heading){
		case 0: //"N"
			headingAngle = 270;
			break;
			
		case 1: //"NE"
			headingAngle = 330;
			break;
			
		case 2: //"SE"
			headingAngle = 30;
			break;
			
		case 3: //"S"
			headingAngle = 90;
			break;
			
		case 4: //"SW"
			headingAngle = 150;
			break;
			
		case 5: //"NW"
			headingAngle = 210;
			break;
	}
	
	switch(location){
		case LEFT_ARM:
			locationAngle = -90;
			break;
			
		case LEFT_TORSO:
		case LEFT_LEG:
			locationAngle = -60;
			break;
		
		case RIGHT_ARM:
			locationAngle = 90;
			break;
			
		case RIGHT_TORSO:
		case RIGHT_LEG:
			locationAngle = 60;
			break;
			
		case LEFT_REAR:
			locationAngle = 210;
			break;
			
		case RIGHT_REAR:
			locationAngle = 150;
			break;
			
		case CENTER_REAR:
			locationAngle = 180;
			break;
			
		default: break;
	}
	
	var angleInRadians = (headingAngle + locationAngle) * Math.PI / 180;
	
	var x = p.x + Math.cos(angleInRadians) * radius;
	var y = p.y + Math.sin(angleInRadians) * radius;
	
	return new Point(x, y);
}

/**
 * Lightens or darkens given given
 * From http://stackoverflow.com/questions/5560248/
 * @param color as hex notation
 * @param percent as -1.0 to 1.0 positive for lighten, negative for darken
 * @returns {String} newly shaded color as hex notation
 */
function shadeColor(color, percent) {   
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}
/**
 * Blends two colors together
 * From http://stackoverflow.com/questions/5560248/
 * @param c0 first color
 * @param c1 secont color
 * @param p percent as 0 to 1.0
 * @returns {String} newly blended color as hex notation
 */
function blendColors(c0, c1, p) {
    var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
    return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
}

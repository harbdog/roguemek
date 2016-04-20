/**
 * player_ui.js - Methods that handle the canvas player UI
 */

"use strict";

// Close enough...
var PI = 3.14;

// Prevent updates to the UI elements while initializing those elements (such as resizing window while loading)
var initializing = true;	
//variables for updating the stage on demand
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
var isometricPadding = 0;
var defElevationHeight = 15;
var elevationHeight = defElevationHeight * hexScale;

//variable to show level (elevation/depth/etc.)
var showLevels = true;

var rootStage, stage, overlay, canvas;
var unitListDisplay, unitListDisplayArray, unitTurnDisplay, unitTurnDisplayArray;
var fpsDisplay, pingDisplay, dialogDisplay, dialogLoading, gameOverDialog;

var settingsDisplay;
var settingsButton, chatButton;
var messagingDisplay, floatingMessages;
var unitDisplays, armorDisplays, heatDisplays, infoDisplays, weaponsDisplays, weaponsListDisplay;

var unitDisplayWidth = 250;
var unitDisplayBounds;
var targetDisplayWidth = 200;
var targetDisplayBounds = {};

var activeControl, unitControls, targetBracket, targetLine;

var outOfBoundsHexes;

//initialize canvas based UI overlay
function initPlayerUI() {
	// create the settings menu
	settingsDisplay = new SettingsDisplay();
	
	// create the messaging area
	messagingDisplay = new MessagingDisplay();
	overlay.addChild(messagingDisplay);
	
	// auto scroll to bottom of chat messages area
	var $chat = $('#chat-window');
	$chat.scrollTop($chat[0].scrollHeight);
	
	// stores any active floating messages
	floatingMessages = [];
	
	// create the player unit display list
	initPlayerUnitListDisplay();
	
	// create the player unit displays
	initPlayerUnitDisplay();
	
	// create the player unit controls
	initPlayerUnitControls();
	
	// create other unit displays
	initOtherUnitDisplay();
	
	// create turn order display
	initUnitTurnListDisplay();
	
	// create the player unit weapons displays
	initPlayerWeaponsDisplay();
	
	if(isPlayerUnitTurn()) {
		showPlayerUnitDisplay(turnUnit);
		showPlayerUnitControls(turnUnit);
	}
	else {
		showPlayerUnitDisplay(playerUnits[0]);
	}
	
	// Initialize FPS counter
	var fpsDiv = document.getElementById("fpsDiv");
	fpsDisplay = new createjs.DOMElement(fpsDiv);
	fpsDisplay.x = -rootStage.x - 10;
    fpsDisplay.y = -rootStage.y + 80 ;
    overlay.addChild(fpsDisplay);
    
    // Initialize ping display
	var pingDiv = document.getElementById("pingDiv");
	pingDisplay = new createjs.DOMElement(pingDiv);
	pingDisplay.x = -rootStage.x - 10;
	pingDisplay.y = -rootStage.y + 100 ;
    overlay.addChild(pingDisplay);
    
    // Initialize unit info dialog
    dialogDisplay = $("#dialogDiv").dialog({
    	open: function () { $(this).siblings().find(".ui-dialog-title").html("<div id='unit-title'></div>"); },
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "fade",
			duration: 500
		},
		hide: {
			effect: "clip",
			duration: 250
		}
    });
    
    // Initialize loading dialog
    dialogLoading = $("#loadingDiv").dialog({
    	open: function(event, ui) { $(this).siblings().find(".ui-dialog-titlebar-close", ui.dialog | ui).hide(); },
    	title: "Loading...",
    	autoOpen: false,
    	modal: true,
		show: {
			effect: "fade",
			duration: 250
		},
		hide: {
			effect: "explode",
			duration: 250
		}
    });
    
    // create the settings button
    settingsButton = new createjs.Container();
    overlay.addChild(settingsButton);
    
    settingsButton.on("click", showSettingsDisplay);
    settingsButton.mouseChildren = false;
    
    // create the chat button
    chatButton = new createjs.Container();
    overlay.addChild(chatButton);
	
	if( fullScreenApi.supportsFullScreen || devMode ) {
		chatButton.on("click", toggleShowChatInput);
		chatButton.mouseChildren = false;
	}
	else {
		chatButton.alpha = 0.33;
	}
}

// updates the sizings/positions of the UI overlays on the canvas
function updatePlayerUI() {
	messagingDisplay.update();
	
	updatePlayerUnitListDisplay();
	updateOtherUnitListDisplay();
	
	updatePlayerUnitDisplay();
	updateOtherUnitDisplay();
	updateUnitTurnListDisplay();
	
	updatePlayerUnitControls();
	
	// update the settings button
	var buttonSize = 75/2;
	
	settingsButton.x = 0;
	settingsButton.y = 0;
	settingsButton.removeAllChildren();
	
	var settingsBackground = new createjs.Shape();
    settingsBackground.graphics
			.beginFill(Settings.get(Settings.UI_BG_COLOR))
			.drawRect(0,0, buttonSize,buttonSize);
    settingsBackground.alpha = Settings.get(Settings.UI_OPACITY);
    settingsButton.addChild(settingsBackground);
    
    var settingsBorder = new createjs.Shape();
    settingsBorder.graphics.setStrokeStyle(2, "square")
			.beginStroke(Settings.get(Settings.UI_FG_COLOR))
			.drawRect(0,0, buttonSize,buttonSize);
    settingsButton.addChild(settingsBorder);
    
    // draw 3 lines for the settings icon
    var settingsIcon = new createjs.Shape();
    settingsIcon.graphics.setStrokeStyle(4, "round")
    		.beginStroke(Settings.get(Settings.UI_FG_COLOR))
    		.moveTo(buttonSize/6, 1*buttonSize/4).lineTo(5*buttonSize/6, 1*buttonSize/4)
    		.moveTo(buttonSize/6, 2*buttonSize/4).lineTo(5*buttonSize/6, 2*buttonSize/4)
    		.moveTo(buttonSize/6, 3*buttonSize/4).lineTo(5*buttonSize/6, 3*buttonSize/4)
    		.endStroke();
    settingsButton.addChild(settingsIcon);
    
    // create hit area
	var settingsHit = new createjs.Shape();
	settingsHit.graphics.beginFill("#000000").drawRect(0, 0, buttonSize, buttonSize).endStroke();
	settingsButton.hitArea = settingsHit;
    
    // update the fullscreen button
    chatButton.x = 0;
    chatButton.y = buttonSize;
    chatButton.removeAllChildren();
    
    var chatBackground = new createjs.Shape();
    chatBackground.graphics
			.beginFill(Settings.get(Settings.UI_BG_COLOR))
			.drawRect(0,0, buttonSize,buttonSize);
    chatBackground.alpha = Settings.get(Settings.UI_OPACITY);
	chatButton.addChild(chatBackground);
	
	var chatBorder = new createjs.Shape();
	chatBorder.graphics.setStrokeStyle(2, "square")
			.beginStroke(Settings.get(Settings.UI_FG_COLOR))
			.drawRect(0,0, buttonSize,buttonSize);
	chatButton.addChild(chatBorder);
	
	// draw a small speech bubble with a small T inside it
	var chatIcon = new createjs.Shape();
	chatIcon.graphics.setStrokeStyle(4, "round")
			.beginStroke(Settings.get(Settings.UI_FG_COLOR))
			.moveTo(1*buttonSize/5, 1*buttonSize/5).lineTo(4*buttonSize/5, 1*buttonSize/5)
			.lineTo(4*buttonSize/5, 3*buttonSize/5)
			.lineTo(buttonSize - 6, buttonSize - 6)
			.lineTo(3*buttonSize/5, 3*buttonSize/4)
			.lineTo(1*buttonSize/5, 3*buttonSize/4)
			.lineTo(1*buttonSize/5, 1*buttonSize/5)
			.endStroke()
			.setStrokeStyle(2, "round")
			.beginStroke(Settings.get(Settings.UI_FG_COLOR))
			.moveTo(2*buttonSize/5, 2*buttonSize/5).lineTo(3*buttonSize/5, 2*buttonSize/5)
			.moveTo(buttonSize/2, 2*buttonSize/5).lineTo(buttonSize/2, 3*buttonSize/5)
			.endStroke();
	
	chatButton.addChild(chatIcon);
	
	// create hit area
	var chatHit = new createjs.Shape();
	chatHit.graphics.beginFill("#000000").drawRect(0, 0, buttonSize, buttonSize).endStroke();
	chatButton.hitArea = chatHit;
}


/**
 * Initializes the display of the board hex map on the stage
 */
function initHexMapDisplay() {
	if(hexMap == null){return;}
	
	if(firstUpdate) {
		// Add events for using the mouse to interact with the canvas/stage
		stage.on("pressmove", handleStageDrag);
		stage.on("pressup", handleStageDrag);
		
		canvas.addEventListener("DOMMouseScroll", handleMouseWheel, false); // for Firefox
		canvas.addEventListener("mousewheel", handleMouseWheel, false); 	// for everyone else
	}
	
	// first, lay down series of hexes to act as the out of bounds area
	outOfBoundsHexes = [];
	for(var y=-5; y<numRows+5; y++){
		for(var x=-5; x<numCols+5; x++){
			// only place these hexes outside of where normal hexes will be placed
			if(y < 0 || y >= numRows || x < 0 || x >= numCols) {
				var hexImg;
				if((x < numCols/2 && y < numRows/2) || (x > numCols/2 && y > numRows/2)) {
					hexImg = new createjs.Bitmap(queue.getResult("out1"));
				}
				else {
					hexImg = new createjs.Bitmap(queue.getResult("out2"));
				}
				
				var hex = new Hex(x, y, 0, null, null);
				var hexDisplay = new HexDisplay(hex);
				hexImg.scaleX = hexScale;
				hexImg.scaleY = hexScale;
				hexDisplay.addChild(hexImg);
				
				hexDisplay.update();
				
				stage.addChild(hexDisplay);
				
				outOfBoundsHexes.push(hexDisplay);
			}
		}
	}
	
	// temporary store for HexDisplay objects that need to be added to the stage
	var hexDisplayInsertArray = []
		
	for(var y=0; y<numRows; y++){
		
		var thisHexRow = hexMap[y];
		if(thisHexRow == null){
			continue;
		}
		
		for(var x=0; x<numCols; x++){
			
			var thisHex = thisHexRow[x];
			if(thisHex == null){
				continue;
			}
			
			var hexDisplay = thisHex.getHexDisplay();
			if(thisHex.getHexDisplay() == null) {
				// Create the HexDisplay object and add references between it and the Hex
				var hexDisplay = new HexDisplay(thisHex);
				thisHex.setHexDisplay(hexDisplay);
				
				// add mouse listener
				hexDisplay.on("click", handleHexClick);
				hexDisplay.mouseChildren = false;
			}
			else{
				// clear the children so they can be recreated
				hexDisplay.removeAllChildren();
			}
			
			var thisHexImages = thisHex.getImages();
			$.each(thisHexImages, function(i, img){
				// add the hex images to the stage
				var hexImg = new createjs.Bitmap(queue.getResult(img));
				hexImg.scaleX = hexScale;
				hexImg.scaleY = hexScale;
				hexDisplay.addChild(hexImg);
			});
			
			// send off to be inserted to the stage
			if(firstUpdate) hexDisplayInsertArray.push(hexDisplay);
		}
	}
	
	if(hexDisplayInsertArray.length > 0) {
		// so they won't overlap incorrectly, sort display insertion array 
		// by row (asc), then even columns (asc), then odd columns (asc)
		hexDisplayInsertArray.sort(function(aDisplay, bDisplay) {
			
			if(aDisplay.yCoords() != bDisplay.yCoords()) {
				// both in different rows, sort by Y
				return aDisplay.yCoords() - bDisplay.yCoords();
			}
			
			var aOdd = aDisplay.isXOdd();
			var bOdd = bDisplay.isXOdd();
			
			if(aOdd && !bOdd){
				// only aDisplay is odd, aDisplay comes last
				return 1;
			}
			else if(!aOdd && bOdd) {
				// only bDisplay is odd, aDisplay comes first
				return -1;
			}
			else {
				// both are odd, or both are even, sort by X
				return aDisplay.xCoords() - bDisplay.xCoords();
			}
		});
		
		// now add to the stage
		$.each(hexDisplayInsertArray, function(index, hexDisplay) {
			stage.addChild(hexDisplay);
		});
	}
	
	updateHexDisplayObjects();
}


/**
 * Updates the visible HexDisplay objects that are rendered on screen or off
 */
function updateHexMapDisplay() {
	var startX = - stage.x;
    var startY = - stage.y;
    
    var canvasX = startX + canvas.width;
    var canvasY = startY + canvas.height;
    
    var hexScale = stage.scaleX;
    
    var scaledHexWidth = hexWidth * hexScale;
    var scaledHexHeight = hexHeight * hexScale;
    
    var determineHexVisibility = function(thisDisplayHex) {
    	var xOffset = thisDisplayHex.x * hexScale;
		var yOffset = thisDisplayHex.y * hexScale;
		
		var thisHexWidth = scaledHexWidth;
		var thisHexHeight = scaledHexHeight;
		
		if(Settings.get(Settings.BOARD_ISOMETRIC)) {
			// handle pop-out of hexes at the top of the screen when using isometric mode
			var elev = thisDisplayHex.getHex().getElevation();
			if(elev > 0) {
				thisHexHeight = scaledHexHeight + (elev * elevationHeight * hexScale);
			}
		}
		
		if((xOffset + thisHexWidth < startX || xOffset > canvasX) 
				|| (yOffset + thisHexHeight < startY || yOffset > canvasY)) {
			// hex object is outside of the view area
			thisDisplayHex.visible = false;
		}
		else {
			thisDisplayHex.visible = true;
		}
    };
    
    for(var y=0; y<numRows; y++){
		
		var thisHexRow = hexMap[y];
		if(thisHexRow == null){
			continue;
		}
		
		for(var x=0; x<numCols; x++){
			
			var thisHex = thisHexRow[x];
			if(thisHex == null){
				continue;
			}
			
			var thisDisplayHex = thisHex.hexDisplay;
			if(thisDisplayHex == null){
				continue;
			}
			
			determineHexVisibility(thisDisplayHex);
		}
    }
    
    if(outOfBoundsHexes != null) {
	    for(var i=0; i<outOfBoundsHexes.length; i++) {
	    	var thisDisplayHex = outOfBoundsHexes[i];
	    	determineHexVisibility(thisDisplayHex);
	    }
    }
}

/**
 * Runs the update call on each HexDisplay object
 */
function updateHexDisplayObjects() {
	if(hexMap == null){return;}
	
	for(var y=0; y<numRows; y++){
			
		var thisHexRow = hexMap[y];
		if(thisHexRow == null){
			continue;
		}
		
		if(y == 0) {
			if(Settings.get(Settings.BOARD_ISOMETRIC) ) {
				// screen boundary padding is needed for isometric view to see the 
				// top of high elevation hexes at the top of the screen 
				var highestElevation = 0;
				for(var x=0; x<numCols; x++){
					var thisHex = thisHexRow[x];
					if(thisHex == null){
						continue;
					}
					
					if(thisHex.getElevation() > highestElevation) {
						highestElevation = thisHex.getElevation();
					}
				}
				
				isometricPadding = elevationHeight * highestElevation;
			}
			else{
				// isometric is off, no screen boundary padding needed
				isometricPadding = 0;
			}
		}
		
		for(var x=0; x<numCols; x++){
			
			var thisHex = thisHexRow[x];
			if(thisHex == null){
				continue;
			}
			
			var hexDisplay = thisHex.getHexDisplay();
			hexDisplay.update();
		}
	}
}

/**
 * Initializes the display of each unit in the game on the stage
 */
function initUnitsDisplay() {
	if(units == null){return;}
	
	$.each(units, function(index, thisUnit) {
		var displayUnit = new UnitDisplay(thisUnit);
		thisUnit.setUnitDisplay(displayUnit);
		
		// add mouse event listener
		displayUnit.on("click", handleUnitClick);
		displayUnit.mouseChildren = false;
	});
}

/**
 * Removes and adds each unit display such that destroyed units are drawn first and not be on top
 */
function arrangeUnitsDisplay() {
	// add destroyed units displays first
	$.each(units, function(index, thisUnit) {
		if(thisUnit.isDestroyed()) {
			var displayUnit = thisUnit.getUnitDisplay();
			stage.removeChild(displayUnit);
			stage.addChild(displayUnit);
		}
	});
	
	// then active units displays
	$.each(units, function(index, thisUnit) {
		if(!thisUnit.isDestroyed()) {
			var displayUnit = thisUnit.getUnitDisplay();
			stage.removeChild(displayUnit);
			stage.addChild(displayUnit);
		}
	});
}

/**
 * Runs the update call on each UnitDisplay object
 */
function updateUnitDisplayObjects() {
	if(units == null){return;}
	
	$.each(units, function(index, thisUnit) {
		var displayUnit = thisUnit.getUnitDisplay();
		if(displayUnit != null) {
			displayUnit.update();
			displayUnit.positionUpdate();
			
			// need to update the position in the event that isometric was just toggled
			displayUnit.x = displayUnit.getUpdatedDisplayX(displayUnit.unit.coords);
			displayUnit.y = displayUnit.getUpdatedDisplayY(displayUnit.unit.coords);
		}
	});
}

/**
 * Create each other unit UI elements, such as armor and weapons
 */
function initOtherUnitDisplay() {
	if(unitDisplays == null) return;
	
	if(weaponsListDisplay == null) weaponsListDisplay = {};
	
	var firstListUnit = unitListDisplayArray[0];
	$.each(units, function(id, unit) {
		if(isPlayerUnit(unit)) return;
		var unitGroupDisplay = unitDisplays[unit.id];
		
		// the other unit icon is at the top of the display
		var thisDisplayUnit = unit.getUnitDisplay();
		var listUnit = new ListUnitDisplay(thisDisplayUnit);
		listUnit.init();
		listUnit.setSelected(true, true);
		listUnit.x = targetDisplayWidth - listUnit.getDisplayWidth();
		listUnit.y = 0;
		unitGroupDisplay.addChild(listUnit);
		unitListDisplayArray.push(listUnit);
		
		// the info display is directly below the unit icon
		var unitInfoDisplay = new MechInfoDisplay(unit);
		unitInfoDisplay.width = targetDisplayWidth;
		unitInfoDisplay.height = 50;
		unitInfoDisplay.init();
		
		unitInfoDisplay.x = 0;
		unitInfoDisplay.y = listUnit.y + listUnit.getDisplayHeight();
		
		unitGroupDisplay.addChild(unitInfoDisplay);
		infoDisplays[id] = unitInfoDisplay;
		
		// the weapons display is directly below the info display
		var unitWeaponsListDisplay = new WeaponsListDisplay(unit);
		unitWeaponsListDisplay.width = targetDisplayWidth;
		unitWeaponsListDisplay.init();
		
		unitWeaponsListDisplay.x = 0;
		unitWeaponsListDisplay.y = unitInfoDisplay.y + unitInfoDisplay.height;
		
		unitGroupDisplay.addChild(unitWeaponsListDisplay);
		weaponsListDisplay[id] = unitWeaponsListDisplay
		
		// the other unit armor displays is directly below its weapons display
		var unitArmorDisplay = new MechArmorDisplay();
		unitArmorDisplay.width = targetDisplayWidth;
		unitArmorDisplay.height = 50;
		unitArmorDisplay.init();
		
		unitArmorDisplay.x = 0;
		unitArmorDisplay.y = unitWeaponsListDisplay.y + unitWeaponsListDisplay.height;
		
		unitGroupDisplay.addChild(unitArmorDisplay);
		armorDisplays[id] = unitArmorDisplay;
		
		// set calculated bounds of the unit display
		var totalHeight = unitArmorDisplay.height + unitWeaponsListDisplay.height + unitInfoDisplay.height + listUnit.getDisplayHeight();
		var thisDisplayBounds = new createjs.Rectangle(
				canvas.width - targetDisplayWidth, canvas.height - totalHeight,
				targetDisplayWidth, totalHeight);
		targetDisplayBounds[id] = thisDisplayBounds;
		
		unitGroupDisplay.x = thisDisplayBounds.x;
		unitGroupDisplay.y = thisDisplayBounds.y;
		
		// apply initial damage to this unit, if any
		for(var n=0; n<unit.armor.length; n++) {
			applyUnitDamage(unit, n, false, false);
		}
		for(var n=0; n<unit.internals.length; n++) {
			applyUnitDamage(unit, n, true, false);
		}
	});
}

/**
 * Updates sizing/position of each non-player unit UI element
 * @returns
 */
function updateOtherUnitDisplay() {
	if(unitDisplays == null) return;
	
	$.each(unitDisplays, function(unitId, unitGroupDisplay) {
		var thisUnit = units[unitId];
		if(!isPlayerUnit(thisUnit)) {
			// fix x, y position of the target unit display
			var thisDisplayBounds = targetDisplayBounds[unitId];
			
			thisDisplayBounds.x = canvas.width*(1/overlay.scaleX) - thisDisplayBounds.width;
			thisDisplayBounds.y = canvas.height*(1/overlay.scaleY) - thisDisplayBounds.height;
			
			unitGroupDisplay.x = thisDisplayBounds.x;
			unitGroupDisplay.y = thisDisplayBounds.y;
			
			var unitArmorDisplay = armorDisplays[unitId];
			unitArmorDisplay.update();
			
			var unitWeaponsDisplay = weaponsListDisplay[unitId];
			unitWeaponsDisplay.update();
			
			var unitInfoDisplay = infoDisplays[unitId];
			unitInfoDisplay.update();
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
		
		// the info display is at the top of the display
		var unitInfoDisplay = new MechInfoDisplay(unit);
		unitInfoDisplay.width = unitDisplayWidth;
		unitInfoDisplay.height = firstListUnit.getDisplayHeight() * 1.5;
		unitInfoDisplay.init();
		
		unitInfoDisplay.x = 0;
		unitInfoDisplay.y = 0;
		
		unitGroupDisplay.addChild(unitInfoDisplay);
		infoDisplays[unit.id] = unitInfoDisplay;
		
		// the heat display is directly below the info display
		var unitHeatDisplay = new MechHeatDisplay();
		
		unitHeatDisplay.width = unitDisplayWidth;
		unitHeatDisplay.height = firstListUnit.getDisplayHeight();
		unitHeatDisplay.init();
		
		unitHeatDisplay.x = 0;
		unitHeatDisplay.y = unitInfoDisplay.y + unitInfoDisplay.height;
		
		unitGroupDisplay.addChild(unitHeatDisplay);
		heatDisplays[unit.id] = unitHeatDisplay;
		
		// the armor display is directly below the heat display
		var unitArmorDisplay = new MechArmorDisplay();
		
		unitArmorDisplay.width = unitDisplayWidth;
		unitArmorDisplay.height = firstListUnit.getDisplayHeight() * 2;
		unitArmorDisplay.init();
		
		unitArmorDisplay.x = 0;
		unitArmorDisplay.y = unitHeatDisplay.y + unitHeatDisplay.height;
		
		unitGroupDisplay.addChild(unitArmorDisplay);
		armorDisplays[unit.id] = unitArmorDisplay;
		
		// set calculated bounds of the unit display
		if(unitDisplayBounds == null) {
			var totalHeight = unitArmorDisplay.height + unitHeatDisplay.height + unitInfoDisplay.height;
			unitDisplayBounds = new createjs.Rectangle(
					firstListUnit.x + firstListUnit.getDisplayWidth(), canvas.height - totalHeight,
					unitDisplayWidth, totalHeight);
		}
		
		unitGroupDisplay.x = unitDisplayBounds.x;
		unitGroupDisplay.y = unitDisplayBounds.y;
		
		// apply initial damage to this unit, if any
		for(var n=0; n<unit.armor.length; n++) {
			applyUnitDamage(unit, n, false, false);
		}
		for(var n=0; n<unit.internals.length; n++) {
			applyUnitDamage(unit, n, true, false);
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
	
	 $.each(unitDisplays, function(unitId, unitGroupDisplay) {
		 var thisUnit = units[unitId];
		 if(isPlayerUnit(thisUnit)) {
			 // fix y position of unit display
			 unitDisplayBounds.y = canvas.height*(1/overlay.scaleY) - unitDisplayBounds.height;
			 unitGroupDisplay.y = unitDisplayBounds.y;
			 
			 // update y position and size of weapons display 
			 var unitWeaponsDisplay = weaponsDisplays[unitId];
			 unitWeaponsDisplay.update();
			 unitWeaponsDisplay.y = canvas.height*(1/overlay.scaleY) - unitWeaponsDisplay.height;
			 
			 var unitArmorDisplay = armorDisplays[unitId];
			 unitArmorDisplay.update();
			
			 var unitHeatDisplay = heatDisplays[unitId];
			 unitHeatDisplay.update();
			 
			 var unitInfoDisplay = infoDisplays[unitId];
			 unitInfoDisplay.update();
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

/**
 * Initializes each unit's touch controls
 */
function initPlayerUnitControls() {
	if(unitDisplays == null) return;
	if(unitControls == null) unitControls = {};
	
	$.each(unitDisplays, function(unitId, unitDisplay) {
		var unit = units[unitId];
		if(!isPlayerUnit(unit)) return;
		
		var controlDisplay = new PlayerControlsDisplay(unit);
		controlDisplay.visible = false;
		controlDisplay.init();
		
		controlDisplay.x = unitDisplay.x;
		controlDisplay.y = unitDisplay.y - controlDisplay.height;
		
		overlay.addChild(controlDisplay);
		unitControls[unitId] = controlDisplay;
	});
}

/**
 * Update each unit's touch controls size/position in the event of a window resize 
 */
function updatePlayerUnitControls() {
	if(unitControls == null) return;
	
	$.each(unitDisplays, function(unitId, unitDisplay) {
		var unit = units[unitId];
		if(!isPlayerUnit(unit)) return;
		
		var controlDisplay = unitControls[unitId];
		controlDisplay.update();
		
		controlDisplay.x = unitDisplay.x;
		controlDisplay.y = unitDisplay.y - controlDisplay.height;
	});
}

/**
 * Ensures that only the given player unit shows its controls, others are hidden
 * @param unit
 */
function showPlayerUnitControls(unit) {
	if(unitControls == null) return;
	
	$.each(unitControls, function(unitId, controlDisplay) {
		var visible = (unit != null && unit.id == unitId);
		controlDisplay.visible = visible;
	});
}

/**
 * Updates the heat display for the unit showing the given amount of added heat generated
 * @param unit
 * @param addedGenHeat
 */
function updateHeatDisplay(unit, addedGenHeat) {
	if(unit == null || !isPlayerUnit(unit)) return;
	if(addedGenHeat == null) addedGenHeat = 0;
	
	// update unit heat, heat generation, heat dissipation
	var unitHeatDisplay = heatDisplays[unit.id];
	unitHeatDisplay.setDisplayedHeat(unit.heat, addedGenHeat, unit.heatDiss);
}

/**
 * Updates the player armor diagram for the given unit to account for damage taken
 * @param unit
 * @param isInternal
 * @param index
 */
function applyUnitDamage(unit, index, isInternal, doAnimate) {
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
		
		unitArmorDisplay.setSectionPercent(section, subIndex, 100 * value/initialValue, doAnimate);

		var listUnit = getUnitListDisplay(unit);
		if(listUnit != null) {
			listUnit.updateArmorBar(doAnimate);
		}
	}
}

/**
 * Creates the unit turn display list
 */
function initUnitTurnListDisplay() {
	if(unitTurnDisplay == null) {
		// create container as background for the display
		unitTurnDisplay = new createjs.Container();
		overlay.addChild(unitTurnDisplay);
		
		unitTurnDisplayArray = [];
	}
	
	$.each(units, function(index, unit) {
		var thisDisplayUnit = unit.getUnitDisplay();
		
		var listUnit = new ListUnitDisplay(thisDisplayUnit);
		listUnit.init();
		unitTurnDisplay.addChild(listUnit);
		
		unitTurnDisplayArray.push(listUnit);
	});
}

/**
 * Updates the unit turn display list
 */
function updateUnitTurnListDisplay() {
	if(unitTurnDisplayArray == null) return;
	
	// make sure the list unit displays are in turn order
    var numUnits = unitTurnDisplayArray.length;
	unitTurnDisplayArray.sort(function(a, b) {
		return unitsOrder.indexOf(a.getUnitId()) - unitsOrder.indexOf(b.getUnitId());
	})
	
	$.each(unitTurnDisplayArray, function(index, listUnit) {
		// update the selected status in case it's the unit's turn
		var selected = isTurnUnit(listUnit.unit);
		var isOtherUnit = !isPlayerUnit(listUnit.unit);
		
		listUnit.update();
		listUnit.setSelected(selected, isOtherUnit, true);
		
		if(selected) {
			// bring the selected unit to front of the list container
			unitTurnDisplay.setChildIndex(listUnit, unitTurnDisplay.getNumChildren()-1);
		}
        
        // if the x position is changing, animate to its new place
        var xPosition = (canvas.width/2*(1/overlay.scaleY)) - (numUnits/2*listUnit.getDisplayWidth()) + (index*listUnit.getDisplayWidth());
        var yPosition = 100;
        if(listUnit.x == 0 && listUnit.y == 0) {
            listUnit.alpha = 0;
            listUnit.x = xPosition;
            createjs.Tween.get(listUnit).to({alpha:1.0, y:yPosition}, 750);
        }
		else if(listUnit.x != xPosition || listUnit.y != yPosition) {
            listUnit.alpha = 1;
            createjs.Tween.get(listUnit).to({x:xPosition, y:yPosition}, 500);
            listUnit.y = yPosition;
        }
        else {
            listUnit.alpha = 1;
            listUnit.x = xPosition;
            listUnit.y = yPosition;
        }
	});
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
		if(isPlayerUnit(listUnit.unit)) {
			// update the position in case the resize was called
			listUnit.x = 1;
			listUnit.y = canvas.height*(1/overlay.scaleY) - (index+1) * listUnit.getDisplayHeight();
			
			// update the selected status in case its the unit's turn
			listUnit.update();
			listUnit.setSelected(isTurnUnit(listUnit.unit));
		}
	});
}

/**
 * Updates the other units' display list
 */
function updateOtherUnitListDisplay() {
	if(unitListDisplayArray == null) return;
	
	$.each(unitListDisplayArray, function(index, listUnit) {
		if(!isPlayerUnit(listUnit.unit)) {
			// update graphics of the display
			listUnit.update();
			listUnit.setSelected(true, true);
		}
	});
}

/**
 * Gets the player unit display belonging to the given unit
 */
function getUnitListDisplay(unit) {
	if(unit == null || unitListDisplayArray == null) return null;
	
	for(var index=0; index<unitListDisplayArray.length; index++) {
		var listUnit = unitListDisplayArray[index];
		
		if(listUnit.unit.id == unit.id) {
			return listUnit;
		}
	}
	
	return null;
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
	var unitDisplay = unit.getUnitDisplay();
	
	var targetX = unitDisplay.x - hexWidth/2;
	var targetY = unitDisplay.y - hexHeight/2;
	
	// create dashed line from player unit to target bracket
	if(targetLine == null) {
		targetLine = new createjs.Shape();
		stage.addChild(targetLine);
	}
	else{
		targetLine.visible = true;
	}
	
	targetLine.update = function() {
		this.graphics.clear();
		this.graphics.setStrokeDash([10, 20], 10).
				setStrokeStyle(3, "round").beginStroke(Settings.get(Settings.UI_ENEMY_COLOR))
				.moveTo(turnUnit.getUnitDisplay().x, turnUnit.getUnitDisplay().y)
				.lineTo(unit.getUnitDisplay().x, unit.getUnitDisplay().y);
		// give the indicator a glow
		var glowColor = shadeColor(Settings.get(Settings.UI_ENEMY_COLOR), 0.75);
		
		if(Settings.get(Settings.GFX_CACHING) == Settings.GFX_QUALITY){
			// shadows only at the highest gfx setting
			this.shadow = new createjs.Shadow(glowColor, 0, 0, 5);
		}
	}
	
	targetLine.update();
	targetLine.alpha = 0;
	
	createjs.Tween.get(targetLine)
			.to({alpha: 0.75}, 500)
			.addEventListener("change", function() {
				update = true;
			});	
	
	// create bracket
	if(targetBracket == null) {
		targetBracket = new TargetBracket();
		targetBracket.init();
		
		targetBracket.visible = false;
		
		stage.addChild(targetBracket);
	}
	else{
		createjs.Tween.removeTweens(targetBracket);
		targetBracket.update();
	}
	
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

function updateTargetPosition() {
	// update line to target
	var unitTarget = getUnitTarget(turnUnit);
	if(unitTarget != null) {
		setPlayerTarget(unitTarget);
	}
}

/**
 * Intended to be called back from Tweens when the unit position has finished animating updates
 */
function performUnitPositionUpdates(unitDisplay) {
	// reset movement/rotation controls that became active
	resetControls();
	
	// update the unit display based on it new hex
	unitDisplay.positionUpdate();
	
	// update and re-acquire the target for the turn unit (whether its the same or another unit)
	updateTargetPosition();
	target(getUnitTarget(turnUnit));
}

/**
 * Intended to be called back from Tweens when the object is ready to remove itself from the stage after animation is completed
 */
function removeThisFromStage() {
	stage.removeChild(this);
}

/**
 * Intended to be called back from FloatMessage Tweens when the animation is completed and ready to be removed from the stage
 */
function removeFloatMessage() {
	stage.removeChild(this);
	
	// remove from the float message array also
	var floatIndex = -1;
	for(var i=0; i<floatingMessages.length; i++) {
		var thisFloater = floatingMessages[i];
		if(thisFloater != null && thisFloater == this) {
			floatIndex = i;
			break;
		}
	}
	
	if(floatIndex >= 0) {
		// splice this float message out of the array
		floatingMessages.splice(floatIndex, 1);
	}
}

/**
 * Intended to be called back from Tweens when the object is ready to be cached again after animation is completed
 */
function callDoCache() {
	if(!createjs.Tween.hasActiveTweens(this)){
		this.doCache();
	}
}

function updateUnitActionPoints(unit) {
	if(unit == null) return;
	
	var controlDisplay = unitControls[unit.id];
	if(controlDisplay != null) {
		controlDisplay.updateActionPoints();
	}
}

function updateUnitMovePoints(unit) {
	if(unit == null) return;
	
	var controlDisplay = unitControls[unit.id];
	if(controlDisplay != null) {
		controlDisplay.updateMoveActionPoints();
	}
}

function updateUnitJumpPoints(unit) {
	if(unit == null) return;
	
	var controlDisplay = unitControls[unit.id];
	if(controlDisplay != null) {
		controlDisplay.updateJumpPoints();
	}
}

function setControlActive(controlType, active) {
	if(!isPlayerUnitTurn()) return;
	var playerControls = unitControls[turnUnit.id];
	
	if(controlType == null && activeControl != null) {
		controlType = activeControl.type;
	}
	
	if(controlType == null) return;
	
	var control = playerControls.drawButtonAsActive(controlType, active);
	
	if(active) {
		activeControl = control;
	}
	else {
		activeControl = null;
	}
}

function resetControls() {
	if(!isPlayerUnitTurn()) return;
	activeControl = null;
	
	var playerControls = unitControls[turnUnit.id];
	
	playerControls.drawButtonAsActive(PlayerControl.TYPE_BACKWARD, false);
	playerControls.drawButtonAsActive(PlayerControl.TYPE_FORWARD, false);
	playerControls.drawButtonAsActive(PlayerControl.TYPE_LEFT, false);
	playerControls.drawButtonAsActive(PlayerControl.TYPE_RIGHT, false);
	playerControls.drawButtonAsActive(PlayerControl.TYPE_CENTER, false);
	playerControls.drawButtonAsActive(PlayerControl.TYPE_JUMP, turnUnit.jumping);
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
	if(isPlayerUnitTurn() && turnUnit.weapons[id] != null) {
		return turnUnit.weapons[id];
	}
	
	return null;
}

function updateWeaponsDisplay(unit) {
	// update weapons display
	if(isPlayerUnit(unit)){
		var unitWeaponsDisplay = weaponsDisplays[unit.id];
		unitWeaponsDisplay.update();
	}
}

function updateSelectedWeapons() {
	if(!isPlayerUnitTurn()) return;
	
	// use this method to update the UI based on selected weapons
	var weaponHeatTotal = 0
	var weaponsPreparedToFire = getSelectedWeapons();
	var hasWeaponsSelected = false;
	
	// update weapons displays to show as selected or not selected to fire
	var unitWeaponsDisplay = weaponsDisplays[turnUnit.id];
	unitWeaponsDisplay.setSelectedWeapons(weaponsPreparedToFire);
	
	// update weapon indices to show as selected on the target bracket
	if(targetBracket != null) {
		var selectedIndices = getSelectedWeaponsIndices();
		targetBracket.setSelectedWeaponIndices(selectedIndices);
		targetBracket.update();
	}
	
	// update heat gen that will occur from firing currently selected weapons
	$.each(weaponsPreparedToFire, function(index, weapon) {
		if(weapon != null) {
			weaponHeatTotal += weapon.heat;
			
			hasWeaponsSelected = true;
		}
	});
	
	// update the heat graph
	updateHeatDisplay(turnUnit, weaponHeatTotal);
	
	// update the center control button to show as END/FIRE buttons based on if any weapons are selected
	var controlDisplay = unitControls[turnUnit.id];
	if(controlDisplay != null) {
		controlDisplay.drawCenterAsFireButton(hasWeaponsSelected);
	}
	
	update = true;
}

/**
 * Resets the toHit value for all player weapons
 * @param weapon
 */
function resetWeaponsToHit(unit) {
	// reset the to hit value displayed for displayed weapons
	if(isPlayerUnit(unit)) {
		$.each(unit.weapons, function(key, w) {
			w.toHit = null;
		});
	}
}

/**
 * Adds the given message to the end of the message display and scrolls to the bottom for it
 * @param message
 */
function addMessageUpdate(message, time, user) {
	messagingDisplay.addMessage(message, time, user, true);
}

/**
 * Uses the data coming from the server to generate the game over dialog and message
 * @param data
 */
function showGameOverDialog(data) {
	
	// disable the browser accidental navigation protection
	window.onbeforeunload = null;
	
	// turn off player controls
	turnUnit = null;
	showPlayerUnitControls(null);
	
	// TODO: pause the stage?
	
	// fade the stage some, but not completely
	var curtains = new createjs.Shape();
	curtains.graphics.beginFill("#000000").drawRect(0, 0, canvas.width*(1/overlay.scaleX), canvas.height*(1/overlay.scaleY));
	curtains.alpha = 0;
	overlay.addChildAt(curtains, 0);
	
	createjs.Tween.get(curtains)
			.to({alpha: 0.5}, 1000)
			.addEventListener("change", function() {
				update = true;
			});	
	
	
	// open a dialog with the message and button to go to debriefing URL
	if(gameOverDialog == null){
		gameOverDialog = $("<div>"+data.gameOverMessage+"<br/><br/><a href='"+data.gameOverURL+"'>"+"&gt; "+data.gameOverLabel+"</a></div>").dialog({
		
	    	open: function(event, ui) { $(this).siblings().find(".ui-dialog-titlebar-close", ui.dialog | ui).hide(); },
	    	title: data.gameOverHeader,
	    	autoOpen: false,
	    	modal: false,
			show: {
				effect: "fade",
				duration: 1000
			},
			hide: {
				effect: "explode",
				duration: 500
			}
	    });
	}
	
	gameOverDialog.dialog("open");
}

/**
 * switches the hex board between isometric and flat
 */
function toggleIsometricDisplay() {
	Settings.set(Settings.BOARD_ISOMETRIC, !Settings.get(Settings.BOARD_ISOMETRIC));
	
	updateHexDisplayObjects();
	updateUnitDisplayObjects();
	updateTargetPosition();
	update = true;
}

/**
 * Shifts the view of the board display so the given hex at X,Y coordinates is centered on
 * @param hexX
 * @param hexY
 */
function centerDisplayOnHexAt(hexCoords, doAnimate) {
	if(hexCoords == null || hexCoords.x == null || hexCoords.y == null) return;
	
	var scaledHexWidth = hexWidth * stage.scaleX;
    var scaledHexHeight = hexHeight * stage.scaleY;
	
	// adjust the x,y of the board to shift it in the correct direction and amount
    var boardX = -((hexCoords.x+1) * (3 * scaledHexWidth / 4)) + canvas.width/2;
	var boardY = -((hexCoords.y+1) * scaledHexHeight) + canvas.height/2;
	
	var boardPoint = new Point(boardX, boardY);
	
	if(doAnimate) {
		var aTime = 500;
		createjs.Tween.removeTweens(stage);
		createjs.Tween.get(stage)
				.to({x: boardPoint.x, y: boardPoint.y}, aTime, createjs.Ease.cubicOut)
				.call(function() {
					update = true;
				})
				.addEventListener("change", function() {
					// update visible hexes
				    updateHexMapDisplay();
				    
				    update = true;
				});
	}
	else{
		stage.x = boardPoint.x;
		stage.y = boardPoint.y;
		
		// update visible hexes
	    updateHexMapDisplay();
	    
	    update = true;
	}
}

/**
 * Gets the displayed width of the hex board (takes scaling into account)
 */
function getBoardWidth() {
	var scaledHexWidth = hexWidth * stage.scaleX;
	return ((numCols+1) * (3 * scaledHexWidth / 4));
}

/**
 * Gets the displayed height of the hex board (takes scaling into account)
 */
function getBoardHeight() {
	var scaledHexHeight = hexHeight * stage.scaleY;
	return ((scaledHexHeight / 2) + (numRows * scaledHexHeight));
}

/**
 * Gets an XY point for the board stage that will not make the board go off screen too much
 * @param boardPoint
 * @returns
 */
function getBoardPointInWindow(boardPoint) {
	if(boardPoint == null || boardPoint.x == null || boardPoint.y == null) return boardPoint;
	
	// make sure at least one complete hex remains visible on screen on any side
	var inX = boardPoint.x;
	var inY = boardPoint.y;
	
	var scaledHexWidth = hexWidth * stage.scaleX;
    var scaledHexHeight = hexHeight * stage.scaleY;
    
	var boardWidth = getBoardWidth();
	var boardHeight = getBoardHeight();
	
	// left bounds
	if(inX > canvas.width - scaledHexWidth) {
		inX = canvas.width - scaledHexWidth;
	}
	
	// right bounds
	if(inX < -boardWidth + scaledHexWidth) {
		inX = -boardWidth + scaledHexWidth;
	}
	
	// top bounds
	if(inY > canvas.height - scaledHexHeight) {
		inY = canvas.height - scaledHexHeight;
	}
	
	// bottom bounds
	if(inY < -boardHeight + scaledHexHeight) {
		inY = -boardHeight + scaledHexHeight;
	}
	
    return new Point(inX, inY);
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
 * Using the Point object of center reference and a mech limb location, returns the Point on screen where it should be.
 * e.g. to display the damage to the left arm, it should be to the left of the given center reference point.
 * @param p
 * @param location
 */
function getSimplePositionForLocation(p, location) {
	
	var x = p.x;
	var y = p.y;
	
	switch(parseInt(location)){
		case LEFT_ARM:
			x -= hexWidth/2;
			break;
			
		case LEFT_TORSO:
		case LEFT_REAR:
		case LEFT_LEG:
			x -= hexWidth/3;
			break;
		
		case RIGHT_ARM:
			x += hexWidth/2;
			break;
			
		case RIGHT_TORSO:
		case RIGHT_REAR:
		case RIGHT_LEG:
			x += hexWidth/3;
			break;
			
		default: break;
	}
	
	return new Point(x, y);
}

/** 
 * Using the Point object of center reference, mech heading, and a mech limb location will return the Point on screen from where it should be.
 * e.g. to display the weapon fire coming from the left arm, it should be 90 degrees counter clockwise from the heading
 */ 
function getPositionFromLocationAngle(p, heading, location){
	// TODO: determine radius based on size of mech image
	var radius = hexWidth/5;
	var headingAngle = 0;
	var locationAngle = 0;
	
	switch(parseInt(heading)){
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
	
	switch(parseInt(location)){
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

//http://stackoverflow.com/a/20353486/854696
function checkIntersection(rect1, rect2) {
	if ( rect1.x >= rect2.x + rect2.width 
			|| rect1.x + rect1.width <= rect2.x 
			|| rect1.y >= rect2.y + rect2.height 
			|| rect1.y + rect1.height <= rect2.y ){
		return false;
	}
	
    return true;
}

//http://stackoverflow.com/a/9458996/128597
function _arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

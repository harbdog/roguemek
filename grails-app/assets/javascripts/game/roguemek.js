// This is the main javascript file for the RogueMek game client 
//
//= require_self
//= require_tree .

"use strict";

// Create HexMap variables 
var numCols = 0;
var numRows = 0;

// STATIC variables
var HEADING_N = 0;
var HEADING_NE = 1;
var HEADING_SE = 2;
var HEADING_S = 3;
var HEADING_SW = 4;
var HEADING_NW = 5;
var HEADING_ANGLE = [0, 60, 120, 180, 240, 300];

// STATIC location indices
var HEAD = 0;
var LEFT_ARM = 1;
var LEFT_TORSO = 2;
var CENTER_TORSO = 3;
var RIGHT_TORSO = 4;
var RIGHT_ARM = 5;
var LEFT_LEG = 6;
var RIGHT_LEG = 7;
var LEFT_REAR = 8;
var CENTER_REAR = 9;
var RIGHT_REAR = 10;

// STATIC equipment type strings
var TYPE_EQUIPMENT = "Equipment";
var TYPE_WEAPON = "Weapon";
var TYPE_AMMO = "Ammo";
var TYPE_JUMP_JET = "JumpJet";
var TYPE_HEAT_SINK = "HeatSink";

var WEAPON_ENERGY = "Energy";
var WEAPON_BALLISTIC = "Ballistic";
var WEAPON_MISSILE = "Missile";
var WEAPON_PHYSICAL = "Physical";

// STATIC action strings
var ACTION_ROTATE_CW = "rotatecw";
var ACTION_ROTATE_CCW = "rotateccw";
var ACTION_FORWARD = "forward";
var ACTION_BACKWARD = "backward";

// Global variables used throughout the game
var queue, progress;
var hexMap, units;

// Keep track of which units belong to the player
var playerUnits;

// Keep track of targets for each unit belonging to the player
var unitTargets;

// Keep track of which unit's turn it currently is
var turnUnit;
var selectedWeapons = [];

// Keep track of when actions are ready to be performed during the player turn
var playerActionReady = true;

// Track when the stage map is dragged to pan the board
var stageInitDragMoveX = null;
var stageInitDragMoveY = null;

// Enables certain development functions only when run locally
var devMode = (document.location.hostname == "localhost");
var lastPing = 0;

/**
 * Gets the game ready to play
 */
function initGame(){
	
	document.oncontextmenu = function(e){
		// return false is needed to prevent the right click menu from appearing on the page while the game is playing
		return false;
	};
	
	// only use async ajax
	$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
        options.async = true;
    });
	
	// Create the EaselJS stage
	rootStage = new createjs.Stage("canvas");
	canvas = rootStage.canvas;
	
	// setup initial size of canvas to window
	canvas.width = window.innerWidth - 5;
	canvas.height = window.innerHeight - 5;
	
	// add board stage and UI containers to the root stage
	stage = new createjs.Container();
	overlay = new createjs.Container();
	rootStage.addChild(stage);
	rootStage.addChild(overlay);
	
	// apply Touch capability for touch screens
	createjs.Touch.enable(rootStage);
	
	// add resizing event
	window.addEventListener('resize', resize_canvas, false);
	
	window.onbeforeunload = function(e) {
		// If we haven't been passed the event get the window.event
	    e = e || window.event;

	    var message = 'Embrace Cowardice?';
	    // For IE6-8 and Firefox prior to version 4
	    if(e) {
	        e.returnValue = message;
	    }
	    // For Chrome, Safari, IE8+ and Opera 12+
	    return message;
	};
	
	// add keyboard listener
	addEventHandlers();
	
	// set up image loading queue handler
	queue = new createjs.LoadQueue();
	queue.addEventListener("complete", handleComplete);
	queue.addEventListener("progress", handleProgress);
	
	// create progress bar during image loading
	progress = $("#progressBar");
	
	// load the board, units and their images
	loadGameElements();
	
	// TODO: make target FPS a customizable value
	createjs.Ticker.on("tick", tick);
	createjs.Ticker.setFPS(60);
}


function isXOdd(X) {
	return (X & 1 == 1);
}

/**
 * Returns the x parameter of the coordinates in the direction
 *
 * based off of the same method from MegaMek (Coords.java)
 */
function xInDirection(x, y, direction) {
	 switch (direction) {
		 case 1 :
		 case 2 :
			 return x + 1;
		 case 4 :
		 case 5 :
			 return x - 1;
		 default :
			 return x;
	 }
}

/**
 * Returns the y parameter of the coordinates in the direction
 *
 * based off of the same method from MegaMek (Coords.java)
 */
function yInDirection(x, y, direction) {
	switch (direction) {
		case 0 : 
			return y - 1;
		case 1 : 
		case 5 :
			return y - ((x + 1) & 1);
		case 2 : 
		case 4 : 
			return y + (x & 1);
		case 3 : 
			return y + 1;
		default :
			return y;
	}
}

/**
 * Loads all initial game elements from the server to begin the game
 */
function loadGameElements() {
	
	$.getJSON("game/getGameElements", {
	  })
	  .fail(function(jqxhr, textStatus, error) {
		  var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
	  })
	  .done(function( data ) {

		  var manifest = [];
		  var alreadyManifested = {};
		  
		  units = {};
		  hexMap = [];
		  
		  playerUnits = [];
		  unitTargets = {};
		  
		  numCols = data.board.numCols;
		  numRows = data.board.numRows;
		  
		  // create the board hex display
		  $.each(data.board.hexMap, function(key, thisHex) {
			  if(thisHex != null){
				  var hexInstance = new Hex(thisHex.x, thisHex.y, thisHex.elevation, this.terrains, thisHex.images);
				  
				  // Place the hex in the map
				  var hexRow = hexMap[hexInstance.yCoords()];
				  if(hexRow == null){
					  hexRow = [];
					  hexMap[hexInstance.yCoords()] = hexRow;
				  }
				  hexRow[hexInstance.xCoords()] = hexInstance;
				  
				  // Make sure each image gets loaded to the manifest if not already present
				  $.each(thisHex.images, function(i, img) {
					  if(alreadyManifested[img] == null){
						  manifest.push({id:img, src:"assets/hexes/"+img});
						  alreadyManifested[img] = true;		// comment this line to test a slow progress bar locally 
					  }
				  });
			  }
		  });
		  
		  // create each unit display
		  $.each(data.units, function(index, thisUnit) {
			  if(thisUnit != null){
				  var unitInstance = new Unit(thisUnit.unit, thisUnit.x, thisUnit.y, thisUnit.heading);
				  unitInstance.image = thisUnit.image;
				  unitInstance.imageFile = thisUnit.imageFile;
				  unitInstance.apRemaining = thisUnit.apRemaining;
				  unitInstance.jpRemaining = thisUnit.jpRemaining;
				  unitInstance.jumpJets = thisUnit.jumpJets;
				  unitInstance.jumping = thisUnit.jumping;
				  unitInstance.jumpCapable = thisUnit.jumpCapable;
				  unitInstance.heat = thisUnit.heat;
				  unitInstance.heatDiss = thisUnit.heatDiss;
				  unitInstance.callsign = thisUnit.callsign;
				  unitInstance.name = thisUnit.name;
				  unitInstance.chassisVariant = thisUnit.chassisVariant;
				  unitInstance.mass = thisUnit.mass;
				  unitInstance.armor = thisUnit.armor;
				  unitInstance.initialArmor = thisUnit.initialArmor;
				  unitInstance.internals = thisUnit.internals;
				  unitInstance.initialInternals = thisUnit.initialInternals;
				  
				  unitInstance.status = thisUnit.status;
				  unitInstance.prone = thisUnit.prone;
				  unitInstance.shutdown = thisUnit.shutdown;
				  
				  unitInstance.crits = thisUnit.crits;
				  unitInstance.physical = thisUnit.physical;
				  unitInstance.weapons = initUnitWeapons(thisUnit);
				  
				  if(data.turnUnit == thisUnit.unit){
					  turnUnit = unitInstance;
				  }
				  
				  if(data.moveAP != null) {
					  unitInstance.forwardAP = data.moveAP.forward;
					  unitInstance.backwardAP = data.moveAP.backward;
				  }
				  
				  // add to unit list
				  units[thisUnit.unit] = unitInstance;
				  
				  if(alreadyManifested[thisUnit.imageFile] == null){
					  manifest.push({id:thisUnit.imageFile, src:"assets/"+thisUnit.imageFile});
					  alreadyManifested[thisUnit.imageFile] = true;
				  }
			  }
		  });
		  
		  // find out which units are controlled by the player
		  $.each(data.playerUnits, function(index, unitId) {
			 if(unitId != null && units[unitId] != null) {
				 playerUnits.push(units[unitId]);
			 } 
		  });
		  
		  
		  // load any additional client side images
		  manifest.push({id:"out1", src:"assets/hexes/boring/out_of_bounds_1.gif"});
		  manifest.push({id:"out2", src:"assets/hexes/boring/out_of_bounds_2.gif"});
		  
		  manifest.push({id:"laser", src:"assets/ui/laser.png"});
		  manifest.push({id:"ballistic", src:"assets/ui/ballistics.png"});
		  manifest.push({id:"missile", src:"assets/ui/missiles.png"});
		  manifest.push({id:"melee", src:"assets/ui/melee.png"});
		  
		  manifest.push({id:"jumpjet", src:"assets/ui/jumpjet_sprite.png"});
		  
		  manifest.push({id:"wreck.mech.light", src:"assets/units/wrecks/light.gif"});
		  manifest.push({id:"wreck.mech.medium", src:"assets/units/wrecks/medium.gif"});
		  manifest.push({id:"wreck.mech.heavy", src:"assets/units/wrecks/heavy.gif"});
		  manifest.push({id:"wreck.mech.assault", src:"assets/units/wrecks/assault.gif"});
		  
		  queue.loadManifest(manifest);
	  });
}

/**
 * Initializes a Unit's Weapon objects from the crits that have been loaded
 * @param unit
 */
function initUnitWeapons(unit) {
	if(unit == null || unit.crits == null) return null;
	
	var weapons = {};
	
	$.each(unit.crits, function(index, c) {
		if(c.type == TYPE_WEAPON && weapons[c.id] == null){
			var w = new Weapon(c.id, c.name, c.shortName, c.weaponType, c.location, 
								c.damage, c.projectiles, c.heat, c.cycle, c.cooldown, 
								c.minRange, [c.shortRange, c.mediumRange, c.longRange], c);
			weapons[c.id] = w;
			
			if(c.ammo) {
				// store the ammo objects directly on the weapon for easy lookup
				w.ammo = {};
				$.each(c.ammo, function(index, ammoId) {
					var ammoObj = getCritObjectById(unit, ammoId);
					if(ammoObj != null) {
						w.ammo[ammoId] = ammoObj;
					}
				});
			}
		}
	});
	
	$.each(unit.physical, function(index, c) {
		if(c.type == TYPE_WEAPON && weapons[c.id] == null){
			// ensure physical weapons appear as active on the UI
			c.status = "A";
			
			var w = new Weapon(c.id, c.name, c.shortName, c.weaponType, c.location, 
								c.damage, c.projectiles, c.heat, c.cycle, c.cooldown, 
								c.minRange, [c.shortRange, c.mediumRange, c.longRange], c);
			weapons[c.id] = w;
		}
	});
	
	return weapons;
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
			}
		}
	}
		
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
			
			// so they won't overlap incorrectly, add to the stage only the evenX columns first, later will add oddX
			if(!thisHex.isXOdd()) {
				if(firstUpdate) stage.addChild(hexDisplay);
			}
		}
		
		// now add to the stage only the oddX columns in this row
		for(var x=1; x<numCols; x+=2){
			
			var thisHex = thisHexRow[x];
			if(thisHex == null){
				continue;
			}
			
			// TODO: add the HexDisplay objects to the stage in ascending elevation order, in addition to evenX before oddX columns
			var hexDisplay = thisHex.getHexDisplay();
			if(firstUpdate) stage.addChild(hexDisplay);
		}
	}
	
	updateHexDisplayObjects();
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
			if(useIsometric) {
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
		displayUnit.init();
		
		// add mouse event listener
		displayUnit.on("click", handleUnitClick);
		displayUnit.mouseChildren = false;
	});
	
	arrangeUnitsDisplay();
	
	updateUnitDisplayObjects();
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
		}
	});
}

// returns shortened text of the hit location index
function getLocationText(index){
	var locText = "";
	
	if(index == HEAD){
		locText = "HD";
	}
	else if(index == LEFT_ARM){
		locText = "LA";
	}
	else if(index == LEFT_TORSO){
		locText = "LT";
	}
	else if(index == CENTER_TORSO){
		locText = "CT";
	}
	else if(index == RIGHT_TORSO){
		locText = "RT";
	}
	else if(index == RIGHT_ARM){
		locText = "RA";
	}
	else if(index == LEFT_LEG){
		locText = "LL";
	}
	else if(index == RIGHT_LEG){
		locText = "RL";
	}
	else if(index == LEFT_REAR){
		locText = "LTR";
	}
	else if(index == CENTER_REAR){
		locText = "CTR";
	}
	else if(index == RIGHT_REAR){
		locText = "RTR";
	}
		
	return locText;
}

/**
 * Returns the string value of the unit class based on its mass
 * @param unit
 * @returns {String}
 */
function getUnitClassSize(unit) {
	var classSize = "unknown";
	
	if(unit.mass >= 80) {
		classSize = "assault";
	}
	else if(unit.mass >= 60) {
		classSize = "heavy";
	}
	else if(unit.mass >= 40) {
		classSize = "medium";
	}
	else if(unit.mass >= 20) {
		classSize = "light";
	}
	else {
		classSize = "ultralight";
	}
	
	return classSize;
}

/**
 * Returns true if a unit controlled by the player is currently having its turn
 * @returns
 */
function isPlayerUnitTurn() {
	return isPlayerUnit(turnUnit);
}

/**
 * Return true if the given unit is controlled by the player
 * @param unit
 * @returns
 */
function isPlayerUnit(unit) {
	if(unit == null || unit.id == null 
			|| playerUnits == null || playerUnits.length == 0) {
		return false;
	}
	
	var isPlayerUnit = false;
	$.each(playerUnits, function(index, pUnit) {
		if(pUnit.id == unit.id) {
			isPlayerUnit = true;
			return;
		}
	});
	
	return isPlayerUnit;
}
function isPlayerUnitId(unitId) {
	return isPlayerUnit(units[unitId]);
}

/**
 * Return true if the given unit is the current turn unit
 * @param unit
 * @returns {Boolean}
 */
function isTurnUnit(unit) {
	if(unit == null || unit.id == null 
			|| turnUnit == null || turnUnit.id == null) {
		return false;
	}
	
	return (unit.id == turnUnit.id);
}


/**
 * Sets the given unit's target to target
 * @param unit
 * @param target
 */
function setUnitTarget(unit, target) {
	if(unit == null) return;
	unitTargets[unit.id] = target;
}
function getUnitTarget(unit) {
	if(unit == null) return null;
	return unitTargets[unit.id];
}

function getUnit(unitId) {
	if(unitId == null) return null;
	return units[unitId];
}

/**
 * Gets the Hex object at the given Coords object
 * @param coords
 */
function getHex(coords) {
	if(coords == null || coords.x == null || coords.y == null) return null;
	
	var hexRow = hexMap[coords.y];
	if(hexRow != null){
		return hexRow[coords.x];
	}
	
	return null;
}

// returns full name of the hit location index
function getLocationName(index){
	var locText = "";
		if(index == HEAD){
			locText = "Head";
		}
		else if(index == LEFT_ARM){
			locText = "Left Arm";
		}
		else if(index == LEFT_TORSO){
			locText = "Left Torso";
		}
		else if(index == CENTER_TORSO){
			locText = "Center Torso";
		}
		else if(index == RIGHT_TORSO){
			locText = "Right Torso";
		}
		else if(index == RIGHT_ARM){
			locText = "Right Arm";
		}
		else if(index == LEFT_LEG){
			locText = "Left Leg";
		}
		else if(index == RIGHT_LEG){
			locText = "Right Leg";
		}
		else if(index == LEFT_REAR){
			locText = "Left Torso Rear";
		}
		else if(index == CENTER_REAR){
			locText = "Center Torso Rear";
		}
		else if(index == RIGHT_REAR){
			locText = "Right Torso Rear";
		}
			
	return locText;
}

/**
 * Gets the unit weapon with the given ID
 * @param id
 * @returns
 */
function getUnitWeaponById(id) {
	// check all units for the weapon id
	var foundWeapon = null;
	$.each(units, function(index, thisUnit) {
		$.each(thisUnit.weapons, function(key, chkWeapon) {
			if(chkWeapon.id == id){
				foundWeapon = chkWeapon;
			}
		});
	});
	
	return foundWeapon;
}

/**
 * Gets an array of the player weapons that have been selected on the UI to fire
 * @returns {Array}
 */
function getSelectedWeapons() {
	return selectedWeapons;
}
function getSelectedWeaponsIndices() {
	var selectedIndices = [];
	if(!isPlayerUnitTurn()) return selectedIndices;
	
	var index = 0;
	$.each(turnUnit.weapons, function(key, weapon) {
		if( $.inArray(weapon, selectedWeapons) != -1) {
			
			var wIndex = (index+1).toString();
			if(weapon.isPunch()) {
				wIndex = "P";
			}
			else if(weapon.isKick()) {
				wIndex = "K";
			}
			else if(weapon.isCharge()) {
				wIndex = "C";
			}
			else if(weapon.isDFA()) {
				wIndex = "V";
			}
			
			selectedIndices.push(wIndex);
		}
		
		index++;
	});
	
	return selectedIndices;
}
function clearSelectedWeapons() {
	selectedWeapons = [];
}
function addSelectedWeapon(weapon) {
	if(weapon != null && weapon.cooldown == 0
			&& weapon.toHit != null && weapon.toHit > 0) {
		
		if(weapon.isMeleeWeapon()) {
			// the weapon is a physical weapon, ensure it is the only weapon selected
			clearSelectedWeapons();
		}
		else {
			// otherwise, make sure no physical weapons are selected already to fire this weapon
			$.each(selectedWeapons, function(index, w) {
				if(w != null && w.isMeleeWeapon()){
					clearSelectedWeapons();
				}
			});
		}
		
		var selectedIndex = $.inArray(weapon, selectedWeapons);
		if(selectedIndex == -1) {
			// weapon not currently selected
			selectedWeapons.push(weapon);
		}
	}
}
function removeSelectedWeapon(weapon) {
	if(weapon != null) {
		var selectedIndex = $.inArray(weapon, selectedWeapons);
		if(selectedIndex == -1) {
			// weapon not currently selected
		}
		else {
			delete selectedWeapons[selectedIndex];
		}
	}
}

/**
 * just a roll of the dice
 */
function rollDice(numDie, numSides){
	//defaults to 2 dice with 6 sides
	if (!numDie) numDie = 2;
	if (!numSides) numSides = 6;
	
	//results of the dice rolls
	var results = [];
	
	for(var i=0; i<numDie; i++){
		//generate a random number between 1 and the number of sides
		results[i] = Math.floor( (Math.random()*numSides) +1 );
	}

	return results;
}

/**
 * adds the resulting number of die together
 */
function getDieRollTotal(numDie, numSides){
	var results = rollDice(numDie, numSides);
	
	var total = 0;
	for(var i=0; i<results.length; i++){
		total += results[i];
	}
	
	return total;
}

/**
 * Gets the crit object represented by the given id
 * @param unit
 * @param critId
 */
function getCritObjectById(unit, critId) {
	var critObj = null;
	
	$.each(unit.crits, function(index, c) {
		if(c != null && c.id == critId){
			critObj = c;
		}
		
		// end the each loop when the object is found
		return (critObj == null);
	});
	
	return critObj;
}

/**
 * Long polling to retrieve updates from the game asynchronously
 */
function poll() {
    $.getJSON("game/poll", null)
	.fail(function(jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log( "Request Failed: " + err );
	})
	.done(function(data){
    	
		if(data.terminated) {
			console.log("poll terminated, starting over");
		}
		else if(data.date) {
			// call the method that updates the client based on the polled return data
	    	console.log("polled date: "+data.date);
	        pollUpdate(data.updates);
		}
        
    })
	.always(function() {
		var testPingTime = new Date().getTime();
		var milliseconds = testPingTime - lastPing;
		
		if(milliseconds >= 10000) {
			// ping once in a while
			ping();
		}
		else{
			// poll again!
			poll();
		}
	});
}

/**
 * Occasionally perform a ping poll to determine response time
 */
function ping() {
	lastPing = new Date().getTime();
	$.getJSON("game/poll", {
		ping: "true"
	})
	.fail(function(jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log( "Request Failed: " + err );
	})
	.done(pingResponse)
	.always(function() {
		// go back to polling, ping again some time later
		poll();
	});
}

/**
 * Handle all game and unit updates resulting from server actions
 * @param data
 */
function updateGameData(data) {
	if(data.message) {
		// display the message to the player
		var t = new Date(data.time);
		addMessageUpdate("["+t.toLocaleTimeString()+"] "+data.message);
	}
	
	if(data.unit && data.turnUnit){
		return;
	}
	else if(data.turnUnit) {
		// presence of turnUnit indicates the unit is starting a new turn
		data.unit = data.turnUnit;
	}
	else if(data.unit == null) {
		resetControls();
	}
	
	// keep track of previous turn unit in the event it changes turns
	var prevTurnUnit = turnUnit;
	if(data.turnUnit){
		if(prevTurnUnit != null 
				&& prevTurnUnit.id != data.turnUnit
				&& isPlayerUnit(prevTurnUnit)) {
			// clear selection and toHit of weapons before next turn unit begins
			clearSelectedWeapons();
			resetWeaponsToHit(prevTurnUnit);
			updateWeaponsDisplay(prevTurnUnit);
			
			// update selected weapons display that also updates the heat display
			updateSelectedWeapons();
		}
		
		turnUnit = getUnit(data.turnUnit);
		
		updatePlayerUnitListDisplay();
	}
	
	// determine what units are being referenced
	var u = getUnit(data.unit);
	var t = getUnit(data.target);
	
	var isPlayerU = (u != null) ? isPlayerUnit(u) : isPlayerUnitTurn();
	var isPlayerT = isPlayerUnit(t);
	
	var prevTurnTarget = getUnitTarget(prevTurnUnit);
	var newTurnTarget = getUnitTarget(turnUnit);
	
	// determine what UI areas need to be updated
	var updatePosition = false;
	var updateWeapons = false;
    var updateUnitDisplay = false;
    var updateInfoDisplay = false;
	
	// update to unit status
	if(data.status != null) {
		var prevStatus = u.status;
		u.status = data.status;
		
		if(prevStatus != "D" && u.isDestroyed()) {
			// show floating message about the unit being destroyed
			var floatMessageStr = "DESTROYED";	// TODO: localize this message
			
			// determine location of message and create it
			var floatMessagePoint = new Point(u.getUnitDisplay().x, u.getUnitDisplay().y);
			createFloatMessage(floatMessagePoint, floatMessageStr, null, 0, 1.0, false);
		}
		
		// re-initialize unit display to show as destroyed
		u.getUnitDisplay().init();
		updateUnitDisplay = true;
		arrangeUnitsDisplay();
		
		// update unit info display to show as destroyed
		updateInfoDisplay = true;
		
		// update unit list display to show armor bar as destroyed
		var listUnit = getUnitListDisplay(u);
		if(listUnit != null) {
			listUnit.updateArmorBar(true);
		}
	}
	
	// update to position
	if(data.x != null && data.y != null){
		updatePosition = u.setHexLocation(data.x, data.y);
	}
	
	// update to heading
	if(data.heading != null && u.heading != data.heading){
		u.heading = data.heading;
		updatePosition = true;
	}
	
	// update to being prone
	if(data.prone != null && u.prone != data.prone) {
		u.prone = data.prone;
		
		// show floating message about the unit being prone
		var floatMessageStr = u.prone? "PRONE" : "STANDING";	// TODO: localize this message
		
		// determine location of message and create it
		var floatMessagePoint = new Point(u.getUnitDisplay().x, u.getUnitDisplay().y);
		createFloatMessage(floatMessagePoint, floatMessageStr, null, 0, 1.0, false);
		
		// update the UI on being prone or not
		updateUnitDisplay = true;
		
		// update unit info display to show as prone
		updateInfoDisplay = true;
	}
	
	// update to being shutdown
	if(data.shutdown != null && u.shutdown != data.shutdown) {
		u.shutdown = data.shutdown;
		
		// show floating message about the unit being destroyed
		var floatMessageStr = u.shutdown ? "SHUTDOWN" : "POWER ON";	// TODO: localize this message
		
		// determine location of message and create it
		var floatMessagePoint = new Point(u.getUnitDisplay().x, u.getUnitDisplay().y);
		createFloatMessage(floatMessagePoint, floatMessageStr, null, 0, 1.0, false);
		
		// update the UI on being shutdown or not
		updateUnitDisplay = true;
		
		// update unit info display to show as shutdown
		updateInfoDisplay = true;
	}
	
	if(data.apRemaining != null) {
		u.apRemaining = data.apRemaining;
		
		if(isPlayerU) updateUnitActionPoints(u);
	}
	
	if(data.jpRemaining != null) {
		u.jpRemaining = data.jpRemaining;
		
		if(isPlayerU) updateUnitJumpPoints(u);
	}
	
	if(data.jumping != null) {
		u.jumping = data.jumping;
		
		if(isPlayerU) {
			u.getUnitDisplay().positionUpdate(performUnitPositionUpdates);
			setControlActive(PlayerControl.TYPE_JUMP, u.jumping);
		}
		else{
			u.getUnitDisplay().positionUpdate();
		}
		
		// update unit info display to show as jumping
		updateInfoDisplay = true;
	}
	
	if(data.jumpCapable != null) {
		u.jumpCapable = data.jumpCapable;
	}
	
	if(data.moveAP != null) {
		u.forwardAP = data.moveAP.forward;
		u.backwardAP = data.moveAP.backward;
		
		if(isPlayerU) updateUnitMovePoints(u);
	}
	
	// update armor values of the target
	if(data.armorHit) {
		var numArmorHits = data.armorHit.length;
		for(var i=0; i<numArmorHits; i++) {
			var armorRemains = data.armorHit[i];
			if(armorRemains != null
					&& t.armor[i] != armorRemains) {
				t.armor[i] = armorRemains;
				
				applyUnitDamage(t, i, false, true);
			}
		}
	}
	
	// update internal values of the target
	if(data.internalsHit) {
		var numInternalsHits = data.internalsHit.length;
		for(var i=0; i<numInternalsHits; i++) {
			var internalsRemains = data.internalsHit[i];
			if(internalsRemains != null
					&& t.internals[i] != internalsRemains) {
				t.internals[i] = internalsRemains;
				
				applyUnitDamage(t, i, true, true);
			}
		}
	}
	
	// update criticals hit on the target
	if(data.criticalHit) {
		var critHit = data.criticalHit;
		console.log(critHit);
		
		var equipId = critHit.id;
		var status = critHit.status;
		
		var equipObj = getCritObjectById(t, equipId);
		var prevStatus = equipObj.status;
		
		equipObj.status = status;
		
		// show floating message about the crit being hit
		var floatMessageStr = "CRIT "+equipObj.shortName;	// TODO: localize this message and include short name of the equipment
		
		// determine location of message and create it
		var floatMessagePoint = new Point(t.getUnitDisplay().x, t.getUnitDisplay().y);
		createFloatMessage(floatMessagePoint, floatMessageStr, null, 0, 1.0, false);
		
		if(equipObj.status != "A" && equipObj.type == TYPE_WEAPON) {
			if(isPlayerT) {
				updateWeapons = true;
			}
			else {
				weaponsListDisplay[t.id].update();
			}
		}
	}
	
	// update ammo remaining
	if(data.ammoRemaining) {
		$.each(data.ammoRemaining, function(ammoId, ammoRemaining) {
			var ammoObj = getCritObjectById(u, ammoId);
			ammoObj.ammoRemaining = ammoRemaining;
		});
		
		if(isPlayerU) updateWeapons = true;
	}
	
	if(data.weaponData){
		// TODO: move clearing previous toHit for each weapon to its own method
		$.each(turnUnit.weapons, function(key, w) {
			w.toHit = null;
		});
		
		// update the cooldown status of the weapons fired
		$.each(data.weaponData, function(key, wData) {
			var id = wData.weaponId;
			
			var weapon = getPlayerWeaponById(id);
			if(weapon != null){
				if(wData.toHit != null) weapon.toHit = wData.toHit;
				if(wData.weaponCooldown != null) weapon.cooldown = wData.weaponCooldown;
			}
		});
		
		if(isPlayerU) updateWeapons = true;
	}
	
	if(data.weaponFire){
		// update result of weapons fire from another unit
		var wData = data.weaponFire;
		
		var id = wData.weaponId;
		var hit = wData.weaponHit;
		var hitLocations = wData.weaponHitLocations;
		var cooldown = wData.weaponCooldown;
		
		var weapon = getUnitWeaponById(id);
		if(weapon != null){
			
			weapon.cooldown = cooldown;
			
			// show weapon fire and floating miss/hit numbers
			animateWeaponFire(u, weapon, t, hitLocations);
			
		}
		else{
			console.log("Weapon null? Weapon ID:"+id);
		}
		
		if(isPlayerU) updateWeapons = true;
	}
	
	if(data.heat != null) {
		u.heat = data.heat;
		
		if(data.heatDiss) {
			u.heatDiss = data.heatDiss;
		}
		
		// update heat display
		if(isPlayerU) updateHeatDisplay(u);
	}
	
	if(updatePosition) {
		// hide the target line before starting the animated move
		setPlayerTargetLineVisible(false);
		
		if(isPlayerU) {
			u.displayUnit.animateUpdateDisplay(u.getHexLocation(), u.getHeading(), performUnitPositionUpdates);
		}
		else {
			u.displayUnit.animateUpdateDisplay(u.getHexLocation(), u.getHeading());
		}
	}
	
	if(updateWeapons) {
		updateWeaponsDisplay(turnUnit);
		
		// Update selected weapons
		updateSelectedWeapons();
	}
    
    if(updateUnitDisplay) {
        // updates the unit display object
        u.getUnitDisplay().update();
    }
    
    if(updateInfoDisplay) {
        // updates the unit info display window
        infoDisplays[u.id].update();
    }
	
	// do some final UI updates from turn changes
	if(prevTurnUnit != null && prevTurnUnit.id != turnUnit.id) {
		if(isPlayerUnit(prevTurnUnit)) {
			if(!isPlayerUnitTurn()) {
				setPlayerTarget(null);
			}
			
			if(prevTurnTarget != null) {
				prevTurnTarget.getUnitDisplay().setUnitIndicatorVisible(true);
			}
		}
		
		var prevUnitDisplay = prevTurnUnit.getUnitDisplay();
		var turnUnitDisplay = turnUnit.getUnitDisplay();
		
		prevUnitDisplay.updateUnitIndicator();
		turnUnitDisplay.updateUnitIndicator();
		
		if(isPlayerUnitTurn()) {
			// update player unit displays to prepare for its new turn
			showPlayerUnitDisplay(turnUnit);
			showPlayerUnitControls(turnUnit);
			
			setPlayerTarget(newTurnTarget);
			if(newTurnTarget != null) {
				newTurnTarget.getUnitDisplay().setUnitIndicatorVisible(false);
				
				// to to force the action to true to re-acquire the target at the start of the new turn
				playerActionReady = true;
				target(newTurnTarget);
			}
		}
		else {
			showOtherUnitDisplay(turnUnit);
			showPlayerUnitControls(null);
		}
		
		centerDisplayOnHexAt(turnUnit.getHexLocation(), true);
	}
	
	update = true;
}

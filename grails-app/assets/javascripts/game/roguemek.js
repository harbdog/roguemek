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
var rootStage, stage, overlay, canvas;
var unitListDisplay, unitListDisplayArray, unitTurnDisplay, unitTurnDisplayArray;
var queue, progress;
var fpsDisplay;
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

/**
 * Gets the game ready to play
 */
function initGame(){
	
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
	progress = new createjs.Shape();
	progress.graphics.beginStroke("#000000").drawRect(0,0,100,20);
	stage.addChild(progress);
	
	// load the board, units and their images
	loadGameElements();
	
	// begin long polling for game updates during play
	poll();
		
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
				  // TODO: separate Unit and UnitDisplay init behavior like the new Hex and HexDisplay object models
				  var unitDisplay = new UnitDisplay(thisUnit.unit, thisUnit.image, thisUnit.imageFile, thisUnit.rgb);
				  var unitInstance = new Unit(thisUnit.unit, thisUnit.x, thisUnit.y, thisUnit.heading, unitDisplay);
				  unitDisplay.setUnit(unitInstance);
				  unitInstance.apRemaining = thisUnit.apRemaining;
				  unitInstance.jpRemaining = thisUnit.jpRemaining;
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
				  
				  unitInstance.crits = thisUnit.crits;
				  unitInstance.weapons = initUnitWeapons(thisUnit);

				  // add mouse event listener
				  unitDisplay.on("click", handleUnitClick);
				  unitDisplay.mouseChildren = false;
				  
				  if(data.turnUnit == thisUnit.unit){
					  turnUnit = unitInstance;
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
		  manifest.push({id:"other_turn", src:"assets/ui/other_turn.png"});
		  
		  manifest.push({id:ACTION_ROTATE_CW, src:"assets/ui/rotatecw.png"});
		  manifest.push({id:ACTION_ROTATE_CCW, src:"assets/ui/rotateccw.png"});
		  manifest.push({id:ACTION_FORWARD, src:"assets/ui/forward.png"});
		  manifest.push({id:ACTION_BACKWARD, src:"assets/ui/backward.png"});
		  
		  manifest.push({id:"laser", src:"assets/ui/laser.png"});
		  manifest.push({id:"ballistic", src:"assets/ui/ballistics.png"});
		  manifest.push({id:"missile", src:"assets/ui/missiles.png"});
		  
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
								c.minRange, [c.shortRange, c.mediumRange, c.longRange]);
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
		// TODO: scale differently based on mech tonnage/weight class also?
		var scale = 0.8 * hexScale;
		
		var thisDisplayUnit = thisUnit.displayUnit;
		thisDisplayUnit.removeAllChildren();
		
		var image = null;
		var rgb = null;
		if(thisDisplayUnit.getImage() != null) {
			image = thisDisplayUnit.getImage();
		}
		else{
			var imgStr = thisDisplayUnit.getImageString();
			image = queue.getResult(imgStr);
			rgb = thisDisplayUnit.rgb;
		}
		
		thisDisplayUnit.drawImage(image, scale);
		
		if(rgb != null) {
			// load the unit image again and apply alpha color filter
			var unitAlphaImg = new createjs.Bitmap(image);
			unitAlphaImg.filters = [
		        new createjs.ColorFilter(0,0,0,0.5, 
		        						 rgb[0],rgb[1],rgb[2],0)
		    ];
			unitAlphaImg.scaleX = unitImg.scaleX;
			unitAlphaImg.scaleY = unitImg.scaleY;
			unitAlphaImg.regX = unitImg.regX;
			unitAlphaImg.regY = unitImg.regY;
			unitAlphaImg.cache(0, 0, image.width, image.height);
			thisDisplayUnit.addChild(unitAlphaImg);
		}
		
		/*if(playerUnit.id == thisUnit.id && playerUnit.id == turnUnit.id) {
			// TODO: move these out to a method that can also be used at init
			thisDisplayUnit.setControlsVisible(true);
		}
		else if(thisUnit.id == turnUnit.id) {
			thisDisplayUnit.setOtherTurnVisible(true);
		}*/
		
		stage.addChild(thisDisplayUnit);
		
		// TODO: cache thisDisplayUnit, being aware that it will not be updated unless recached when new things are drawn on it
	});
	
	updateUnitDisplayObjects();
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
function clearSelectedWeapons() {
	selectedWeapons = [];
}
function addSelectedWeapon(weapon) {
	if(weapon != null && weapon.cooldown == 0) {
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
    $.ajax({ url: "game/poll", success: function(data){
    	
    	// call the method that updates the client based on the polled return data
    	console.log("polled date: "+data.date);
        pollUpdate(data.updates);
        
    }, dataType: "json", complete: poll, timeout: 30000 });
}

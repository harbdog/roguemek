// This is the main javascript file for the RogueMek game client 
//
//= require_self
//= require_tree .

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


// Create HexMap variables 
var numCols = 0;
var numRows = 0;

//all hex images are the same size
var hexWidth = 84;
var hexHeight = 72;

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
var stage, queue, progress, fpsDisplay, hexMap, units;

// Keep track of which unit belongs to the player
var playerUnit;
var playerWeapons;
var playerTarget;

// Keep track of which unit's turn it currently is
var turnUnit;

// Keep track of when actions are ready to be performed during the player turn
var playerActionReady = true;

// Track when the stage map is dragged to pan the board
var stageInitDragMoveX = null;
var stageInitDragMoveY = null;

/**
 * Gets the game ready to play
 */
function initGame(){
	
	// Create the EaselJS stage
	stage = new createjs.Stage("canvas");
	
	// apply Touch capability for touch screens
	createjs.Touch.enable(stage);
	
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
		
	createjs.Ticker.on("tick", tick);
	createjs.Ticker.setFPS(60);
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
		  
		  numCols = data.board.numCols;
		  numRows = data.board.numRows;
		  
		  // create the board hex display
		  $.each(data.board.hexMap, function(key, thisHex) {
			  if(thisHex != null){
				  var hexDisplay = new HexDisplay(thisHex.x, thisHex.y, thisHex.images);
				  var hexInstance = new Hex(thisHex.x, thisHex.y, hexDisplay);
				  
				  // add mouse listener
				  hexDisplay.on("click", handleHexClick);
				  hexDisplay.mouseChildren = false;
				  
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
				  var unitDisplay = new UnitDisplay(thisUnit.unit, thisUnit.image, thisUnit.rgb);
				  var unitInstance = new Unit(thisUnit.unit, thisUnit.x, thisUnit.y, thisUnit.heading, unitDisplay);
				  unitInstance.apRemaining = thisUnit.apRemaining;
				  unitInstance.jpRemaining = thisUnit.jpRemaining;
				  unitInstance.heat = thisUnit.heat;
				  unitInstance.callsign = thisUnit.callsign;
				  unitInstance.name = thisUnit.name;
				  unitInstance.chassisVariant = thisUnit.chassisVariant;
				  unitInstance.mass = thisUnit.mass;
				  unitInstance.armor = thisUnit.armor;
				  unitInstance.internals = thisUnit.internals;
				  
				  unitInstance.crits = thisUnit.crits;
				  unitInstance.weapons = initUnitWeapons(thisUnit);

				  if(data.playerUnit == thisUnit.unit){
					  playerUnit = unitInstance;
				  }
				  else{
					  // only add mouse event listener for non-player unit
					  unitDisplay.on("click", handleUnitClick);
					  unitDisplay.mouseChildren = false;
				  }
				  
				  if(data.turnUnit == thisUnit.unit){
					  turnUnit = unitInstance;
				  }
				  
				  // add to unit list
				  units[thisUnit.unit] = unitInstance;
				  
				  if(alreadyManifested[thisUnit.image] == null){
					  manifest.push({id:thisUnit.image, src:"assets/"+thisUnit.image});
					  alreadyManifested[thisUnit.image] = true;
				  }
			  }
		  });
		  
		  
		  // load any additional client side images
		  manifest.push({id:"target", src:"assets/ui/target.png"});
		  manifest.push({id:"other_turn", src:"assets/ui/other_turn.png"});
		  
		  manifest.push({id:ACTION_ROTATE_CW, src:"assets/ui/rotatecw.png"});
		  manifest.push({id:ACTION_ROTATE_CCW, src:"assets/ui/rotateccw.png"});
		  manifest.push({id:ACTION_FORWARD, src:"assets/ui/forward.png"});
		  manifest.push({id:ACTION_BACKWARD, src:"assets/ui/backward.png"});
		  
		  manifest.push({id:"laser", src:"assets/ui/laser.png"});
		  manifest.push({id:"ballistics", src:"assets/ui/ballistics.png"});
		  manifest.push({id:"missiles", src:"assets/ui/missiles.png"});
		  
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
		}
	});
	
	return weapons;
}


/**
 * Initializes the display of the board hex map on the stage
 */
function initHexMapDisplay() {
	if(hexMap == null){return;}
	
	stage.on("pressmove", handleStageDrag);
	stage.on("pressup", handleStageDrag);
		
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
			
			var xOffset = x * (3 * hexWidth / 4);
			var yOffset = y * hexHeight;
			
			if(thisDisplayHex.isXOdd()){
				yOffset = (hexHeight / 2) + (y * hexHeight);
			}
			
			thisDisplayHex.x = xOffset;
			thisDisplayHex.y = yOffset;
			
			var thisHexImages = thisDisplayHex.getImages();
			$.each(thisHexImages, function(i, img){
				// add the hex images to the stage
				var hexImg = new createjs.Bitmap(queue.getResult(img));
				thisDisplayHex.addChild(hexImg);
			});
			
			stage.addChild(thisDisplayHex);
		}
	}
	
	// resize the canvas and adjust the board to the canvas on first load
	resize_canvas();
}

/**
 * Initializes the display of each unit in the game on the stage
 */
function initUnitsDisplay() {
	if(units == null){return;}
	
	$.each(units, function(index, thisUnit) {
		// TODO: scale differently based on mech tonnage/weight class also?
		var scale = 0.8;
		
		var thisDisplayUnit = thisUnit.displayUnit;
		var imgStr = thisDisplayUnit.getImageString();
		var image = queue.getResult(imgStr);
		var rgb = thisDisplayUnit.rgb;
		
		// adjust the rotation around its own center (which also adjusts its x/y reference point)
		thisDisplayUnit.regX = image.width/2;
		thisDisplayUnit.regY = image.height/2;
		
		// load the unit image as a Bitmap
		var unitImg = new createjs.Bitmap(image);
		// make the unit image just a bit smaller since it currently is same size as the hex
		unitImg.scaleX = scale;
		unitImg.scaleY = scale;
		unitImg.regX = (scale * thisDisplayUnit.regX) - thisDisplayUnit.regX;
		unitImg.regY = (scale * thisDisplayUnit.regY) - thisDisplayUnit.regY;
		thisDisplayUnit.addChild(unitImg);
		
		// load the unit image again and apply alpha color filter
		var unitAlphaImg = new createjs.Bitmap(image);
		unitAlphaImg.filters = [
	        new createjs.ColorFilter(0,0,0,0.5, 
	        						 rgb[0],rgb[1],rgb[2],0)
	    ];
		unitAlphaImg.scaleX = scale;
		unitAlphaImg.scaleY = scale;
		unitAlphaImg.regX = (scale * thisDisplayUnit.regX) - thisDisplayUnit.regX;
		unitAlphaImg.regY = (scale * thisDisplayUnit.regY) - thisDisplayUnit.regY;
		unitAlphaImg.cache(0, 0, image.width, image.height);
		thisDisplayUnit.addChild(unitAlphaImg);
		
		thisUnit.updateDisplay();
		
		if(playerUnit.id == thisUnit.id && playerUnit.id == turnUnit.id) {
			// TODO: move these out to a method that can also be used at init
			thisDisplayUnit.setControlsVisible(true);
		}
		else if(thisUnit.id == turnUnit.id) {
			thisDisplayUnit.setOtherTurnVisible(true);
		}
		
		stage.addChild(thisDisplayUnit);
	});
}

// returns shortened text of the hit location index
function getLocationText(index){
	var locText = "";
	switch(index){
		case HEAD:
			locText = "HD";
			break;
		case LEFT_ARM:
			locText = "LA";
			break;
		case LEFT_TORSO:
			locText = "LT";
			break;
		case CENTER_TORSO:
			locText = "CT";
			break;
		case RIGHT_TORSO:
			locText = "RT";
			break;
		case RIGHT_ARM:
			locText = "RA";
			break;
		case LEFT_LEG:
			locText = "LL";
			break;
		case RIGHT_LEG:
			locText = "RL";
			break;
		case LEFT_REAR:
			locText = "LTR";
			break;
		case CENTER_REAR:
			locText = "CTR";
			break;
		case RIGHT_REAR:
			locText = "RTR";
			break;
	}
	return locText;
}

// returns full name of the hit location index
function getLocationName(index){
	var locText = "";
	switch(index){
		case HEAD:
			locText = "Head";
			break;
		case LEFT_ARM:
			locText = "Left Arm";
			break;
		case LEFT_TORSO:
			locText = "Left Torso";
			break;
		case CENTER_TORSO:
			locText = "Center Torso";
			break;
		case RIGHT_TORSO:
			locText = "Right Torso";
			break;
		case RIGHT_ARM:
			locText = "Right Arm";
			break;
		case LEFT_LEG:
			locText = "Left Leg";
			break;
		case RIGHT_LEG:
			locText = "Right Leg";
			break;
		case LEFT_REAR:
			locText = "Left Torso Rear";
			break;
		case CENTER_REAR:
			locText = "Center Torso Rear";
			break;
		case RIGHT_REAR:
			locText = "Right Torso Rear";
			break;
	}
	return locText;
}

/**
 * Gets the player weapon with the given ID
 * @param id
 * @returns
 */
function getPlayerWeaponById(id) {
	for(var i=0; i<playerWeapons.length; i++) {
		var chkWeapon = playerWeapons[i];
		if(chkWeapon.id == id){
			return chkWeapon;
		}
	}
	
	return null;
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
 * Long polling to retrieve updates from the game asynchronously
 */
function poll() {
    $.ajax({ url: "game/poll", success: function(data){
    	
    	// call the method that updates the client based on the polled return data
    	console.log("polled date: "+data.date);
        pollUpdate(data.updates);
        
    }, dataType: "json", complete: poll, timeout: 30000 });
}

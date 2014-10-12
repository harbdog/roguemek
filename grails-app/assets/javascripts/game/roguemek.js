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

// Global variables used throughout the game
var stage, queue, progress, fpsDisplay, hexMap, units;

// Keep track of which unit belongs to the player
var playerUnit;
var playerWeapons;
var playerTarget;

// Keep track of which unit's turn it currently is
var playerTurnIndex = 0;

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
				  
				  // add mouse listener
				  hexDisplay.on("click", handleHexClick);
				  hexDisplay.mouseChildren = false;
				  
				  // Place the hex in the map
				  var hexRow = hexMap[thisHex.y];
				  if(hexRow == null){
					  hexRow = [];
					  hexMap[thisHex.y] = hexRow;
				  }
				  hexRow[thisHex.x] = hexDisplay;
				  
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
				  unitInstance.actionPoints = thisUnit.actionPoints;
				  unitInstance.jumpPoints = thisUnit.jumpPoints;
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
				  
				  // add mouse listener
				  unitDisplay.on("click", handleUnitClick);
				  unitDisplay.mouseChildren = false;
				  
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
			var w = new Weapon(c.id, c.name, c.shortName, c.location, c.damage, c.heat, 
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
		
		var thisDisplayRow = hexMap[y];
		
		if(thisDisplayRow == null){
			continue;
		}
		
		for(var x=0; x<numCols; x++){
			
			var thisDisplayHex = thisDisplayRow[x];
			
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
		var thisDisplayUnit = thisUnit.displayUnit;
		var imgStr = thisDisplayUnit.getImageString();
		var image = queue.getResult(imgStr);
		var rgb = thisDisplayUnit.rgb;
		
		// adjust the rotation around its own center (which also adjusts its x/y reference point)
		thisDisplayUnit.regX = image.width/2;
		thisDisplayUnit.regY = image.height/2;
		
		// make the unit just a bit smaller since it currently is same size as the hex
		// TODO: scale differently based on mech tonnage/weight class also?
		var scale = 0.8;
		thisDisplayUnit.scaleX = scale;
		thisDisplayUnit.scaleY = scale;
		
		thisUnit.updateDisplay();
		
		// load the unit image as a Bitmap
		var unitImg = new createjs.Bitmap(image);
		thisDisplayUnit.addChild(unitImg);
		
		// load the unit image again and apply alpha color filter
		var unitAlphaImg = new createjs.Bitmap(image);
		unitAlphaImg.filters = [
	        new createjs.ColorFilter(0,0,0,0.5, 
	        						 rgb[0],rgb[1],rgb[2],0)
	    ];
		unitAlphaImg.cache(0, 0, image.width, image.height);
		thisDisplayUnit.addChild(unitAlphaImg);
		
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
 * Long polling to retrieve updates from the game asynchronously
 */
function poll() {
    $.ajax({ url: "game/poll", success: function(data){
    	
    	// call the method that updates the client based on the polled return data
    	console.log("polled date: "+data.date);
        pollUpdate(data.updates);
        
    }, dataType: "json", complete: poll, timeout: 30000 });
}
